import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const agent = context.switchToHttp().getRequest().agent;
    if (!agent) throw new ForbiddenException('인증이 필요합니다');

    if (!['trial', 'active'].includes(agent.subscription_status)) {
      throw new ForbiddenException({
        code: 'SUBSCRIPTION_EXPIRED',
        message: '구독이 만료되었습니다.',
      });
    }
    return true;
  }
}
