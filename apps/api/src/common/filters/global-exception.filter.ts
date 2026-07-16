import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = '서버 내부 오류가 발생했습니다';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'object' && body !== null) {
        const obj = body as Record<string, unknown>;
        code = (obj['code'] as string) ?? this.statusToCode(status);
        message = (obj['message'] as string) ?? exception.message;
        details = obj['details'] ?? undefined;

        if (Array.isArray(obj['message'])) {
          message = (obj['message'] as string[]).join(', ');
          details = obj['message'];
        }
      } else {
        code = this.statusToCode(status);
        message = typeof body === 'string' ? body : exception.message;
      }
    } else {
      this.logger.error('Unhandled exception', exception);
    }

    res.status(status).json({
      ok: false,
      error: { code, message, ...(details ? { details } : {}) },
    });
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      429: 'RATE_LIMITED',
    };
    return map[status] ?? 'INTERNAL_ERROR';
  }
}
