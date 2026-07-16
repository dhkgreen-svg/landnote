import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import { AdminService } from './admin.service';

@Public()
@UseGuards(AdminAuthGuard)
@Controller('admin/agents')
export class AdminAgentsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async list(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
  ) {
    return this.adminService.getAgents({
      search,
      status,
      plan,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sort,
      order,
    });
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.adminService.getAgentDetail(id);
  }

  @Get(':id/inquiries')
  async inquiries(@Param('id') id: string) {
    return this.adminService.getAgentInquiries(id);
  }

  @Get(':id/listings')
  async listings(@Param('id') id: string) {
    return this.adminService.getAgentListings(id);
  }

  @Get(':id/activity')
  async activity(@Param('id') id: string) {
    return this.adminService.getAgentActivity(id);
  }

  @Patch(':id/status')
  async changeStatus(
    @CurrentAdmin() admin: any,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    await this.adminService.changeAgentStatus(admin.id, id, body.status);
    return { message: '상태가 변경되었습니다' };
  }

  @Patch(':id/plan')
  async changePlan(
    @CurrentAdmin() admin: any,
    @Param('id') id: string,
    @Body() body: { plan: string },
  ) {
    await this.adminService.changeAgentPlan(admin.id, id, body.plan);
    return { message: '플랜이 변경되었습니다' };
  }
}
