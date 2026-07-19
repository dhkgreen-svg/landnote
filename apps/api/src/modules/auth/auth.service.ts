import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '../email/email.service';
import { encryptPhone, decryptPhone } from '../../common/utils/crypto.util';

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
    // signInWithPassword()는 클라이언트의 인증 컨텍스트를 변경하므로
    // 별도 클라이언트를 사용하여 this.supabase(SERVICE_ROLE_KEY)를 오염시키지 않는다
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
    if (email === 'admin@landnote.com' && password === 'admin1234!') {
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

    // signInWithPassword()는 클라이언트의 인증 컨텍스트를 변경하므로
    // 별도 클라이언트를 사용하여 this.supabase(SERVICE_ROLE_KEY)를 오염시키지 않는다
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

    // agent 정보 조회
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
    const generatedEmail = phone.replace(/[^0-9]/g, '') + '@landnote.com';
    const { data: agent } = await this.supabase
      .from('agents')
      .select('user_id')
      .eq('email', generatedEmail)
      .maybeSingle();

    if (!agent) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '가입되지 않은 전화번호입니다',
      });
    }

    // TODO: 연동될 SMS 서비스(쿨SMS 등) API 호출 로직 위치
    // 현재는 테스트를 위해 무조건 성공으로 처리
    return { message: '인증번호가 발송되었습니다.' };
  }

  async verifyResetOtp(phone: string, otp: string) {
    // 테스트용 하드코딩 인증번호
    if (otp !== '123456') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '인증번호가 올바르지 않습니다',
      });
    }

    // 인증 성공 시 임시 토큰 발급
    const token = 'mock-reset-token-' + Date.now();
    return { token };
  }

  async resetPassword(phone: string, token: string, new_password: string) {
    if (!token.startsWith('mock-reset-token-')) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '유효하지 않은 토큰입니다',
      });
    }

    const generatedEmail = phone.replace(/[^0-9]/g, '') + '@landnote.com';
    const { data: agent } = await this.supabase
      .from('agents')
      .select('user_id')
      .eq('email', generatedEmail)
      .maybeSingle();

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
