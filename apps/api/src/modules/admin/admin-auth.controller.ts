import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AdminService } from './admin.service';

@Public()
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.adminService.login(body.email, body.password);
  }

  @UseGuards(AdminAuthGuard)
  @Get('me')
  async me(@CurrentAdmin() admin: any) {
    return admin;
  }

  @UseGuards(AdminAuthGuard)
  @Post('logout')
  async logout() {
    return { message: '로그아웃 되었습니다' };
  }
}
