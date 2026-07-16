import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AccessLogInterceptor implements NestInterceptor {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const req = context.switchToHttp().getRequest();
        if (req.agent?.id) {
          this.supabase.from('access_logs').insert({
            agent_id: req.agent.id,
            action: req.method,
            path: req.route?.path || req.path,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']?.substring(0, 500),
          }).then();
        }
      }),
    );
  }
}
