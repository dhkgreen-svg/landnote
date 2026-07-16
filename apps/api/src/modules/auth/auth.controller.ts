import { Controller, Post, Get, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentAgent } from '../../common/decorators/current-agent.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Body() body: {
      email: string;
      password: string;
      agent_name: string;
      phone: string;
      license_number: string;
      office_name?: string;
    },
  ) {
    return this.authService.register(body);
  }

  @Public()
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('logout')
  async logout() {
    return { message: '로그아웃 완료' };
  }

  @Get('me')
  async me(@CurrentAgent() agent: any) {
    return agent;
  }
}
