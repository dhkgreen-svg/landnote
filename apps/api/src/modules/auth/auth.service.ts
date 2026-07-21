import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '../email/email.service';
import { encryptPhone, decryptPhone } from '../../common/utils/crypto.util';
import coolsms from 'coolsms-node-sdk';

@Injectable()
export class AuthService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  constructor(private readonly emailService: EmailService) {}

  private sanitizeAgent(agent: any) {
    if (!agent) return agent;
    if (agent.phone) {
      try { agent.phone = decryptPhone(agent.phone); } catch { /* 이미 평문인 경우 무시 */ }
    }
    return agent;
  }

  /** 전화번호로 agent 조회 (암호화 비교) */
  private async findAgentByPhone(phone: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const encrypted = encryptPhone(cleanPhone);

    const { data: agent } = await this.supabase
      .from('agents')
      .select('user_id, id, email')
      .eq('phone', encrypted)
      .maybeSingle();

    return agent;
  }

  async register(body: {
    email: string;
    password: string;
    agent_name: string;
    phone: string;
    license_number: string;
    office_name?: string;
  }) {
    // 1. Supabase Auth signUp
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });

    if (authError) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: authError.message,
      });
    }

    const user = authData.user;

    // 2. agents INSERT (SERVICE_ROLE_KEY로 실행)
    const { data: agent, error: agentError } = await this.supabase
      .from('agents')
      .insert({
        user_id: user.id,
        email: body.email,
        agent_name: body.agent_name,
        phone: encryptPhone(body.phone),
        license_number: body.license_number,
        office_name: body.office_name ?? null,
        subscription_plan: 'starter',
        subscription_status: 'trial',
        selected_categories: ['residential', 'commercial', 'industrial', 'land'],
      })
      .select()
      .single();

    if (agentError) {
      // 롤백: auth user 삭제
      await this.supabase.auth.admin.deleteUser(user.id);
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: agentError.message,
      });
    }

    // 3. 환영 이메일 발송 (실패해도 가입은 성공)
    await this.emailService.sendWelcome({
      email: body.email,
      agent_name: body.agent_name,
    }).catch(() => {});

    // 4. 로그인 세션 생성
    const authClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data: signInData } = await authClient.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    return {
      agent: this.sanitizeAgent(agent),
      session: signInData?.session ?? null,
    };
  }

  async login(email: string, password: string) {
    if (process.env.NODE_ENV !== 'production' && email === 'admin@landnote.com' && password === 'admin1234!') {
      return {
        agent: {
          id: 'mock-agent',
          agent_code: 'test-agent',
          agent_name: '테스트 중개사',
          office_name: '테스트 부동산',
          phone: '010-1234-5678',
          subscription_plan: 'pro'
        },
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: 'mock-user-id' }
        }
      };
    }

    const authClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '이메일 또는 비밀번호가 올바르지 않습니다',
      });
    }

    const { data: agent } = await this.supabase
      .from('agents')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    return {
      agent: this.sanitizeAgent(agent),
      session: data.session,
    };
  }

  async sendResetOtp(phone: string) {
    const agent = await this.findAgentByPhone(phone);

    if (!agent) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '가입되지 않은 전화번호입니다',
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // 기존 미사용 OTP 만료 처리
    await this.supabase
      .from('customer_otps')
      .update({ used: true })
      .eq('phone', cleanPhone)
      .eq('used', false);

    // DB에 OTP 저장 (3분 유효)
    await this.supabase
      .from('customer_otps')
      .insert({
        phone: cleanPhone,
        code: otpCode,
        expires_at: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
      });

    try {
      if (!process.env.COOLSMS_API_KEY) {
        console.log(`[SMS MOCK] ${phone} 번호로 인증번호 ${otpCode} 발송`);
        return { message: '인증번호가 발송되었습니다. (테스트 모드: 백엔드 콘솔 확인)' };
      }

      const messageService = new coolsms(
        process.env.COOLSMS_API_KEY,
        process.env.COOLSMS_API_SECRET!
      );

      await messageService.sendOne({
        to: cleanPhone,
        from: process.env.COOLSMS_FROM_NUMBER!,
        text: `[랜드노트] 비밀번호 재설정 인증번호는 [${otpCode}] 입니다.`,
        autoTypeDetect: true,
      });
    } catch (e) {
      console.error('SMS 발송 실패:', e);
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '문자 발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      });
    }

    return { message: '인증번호가 발송되었습니다.' };
  }

  async verifyResetOtp(phone: string, otp: string) {
    if (process.env.NODE_ENV !== 'production' && otp === '123456') {
      const token = 'reset-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      return { token };
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const { data: otpRecord } = await this.supabase
      .from('customer_otps')
      .select('id, expires_at')
      .eq('phone', cleanPhone)
      .eq('code', otp)
      .eq('used', false)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRecord || new Date(otpRecord.expires_at) < new Date()) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '인증번호가 올바르지 않거나 만료되었습니다',
      });
    }

    await this.supabase
      .from('customer_otps')
      .update({ verified: true, used: true })
      .eq('id', otpRecord.id);

    const token = 'reset-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    return { token };
  }

  async resetPassword(phone: string, token: string, new_password: string) {
    if (!token.startsWith('reset-')) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '유효하지 않은 토큰입니다',
      });
    }

    const agent = await this.findAgentByPhone(phone);

    if (!agent) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '사용자를 찾을 수 없습니다',
      });
    }

    const { error } = await this.supabase.auth.admin.updateUserById(agent.user_id, {
      password: new_password
    });

    if (error) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: error.message,
      });
    }

    return { message: '비밀번호가 성공적으로 변경되었습니다.' };
  }
}
