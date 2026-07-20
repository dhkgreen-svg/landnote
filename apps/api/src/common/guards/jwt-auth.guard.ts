import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createClient } from '@supabase/supabase-js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { decryptPhone } from '../utils/crypto.util';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('인증 토큰이 없습니다');

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.error('JwtAuthGuard Error:', error, 'Token:', token?.substring(0, 10) + '...');
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }

    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!agent) throw new UnauthorizedException('등록된 중개사 정보가 없습니다');

    // phone 복호화 (DB에 암호문 저장, 응답은 항상 평문)
    if (agent.phone) {
      try { agent.phone = decryptPhone(agent.phone); } catch { /* 이미 평문인 경우 무시 */ }
    }

    if (!agent.selected_categories || agent.selected_categories.length === 0) {
      agent.selected_categories = ['residential', 'commercial', 'industrial', 'land'];
    }

    req.agent = agent;
    return true;
  }
}
