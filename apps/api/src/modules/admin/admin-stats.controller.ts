import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminService } from './admin.service';

@Public()
@UseGuards(AdminAuthGuard)
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly adminService: AdminService) {}

  @Get('kpis')
  async kpis() {
    return this.adminService.getKpis();
  }

  @Get('access')
  async access() {
    return this.adminService.getAccessStats();
  }

  @Get('access/trend')
  async accessTrend(@Query('days') days?: string) {
    return this.adminService.getAccessTrend(days ? parseInt(days) : undefined);
  }

  @Get('agents/growth')
  async agentGrowth() {
    return this.adminService.getAgentGrowth();
  }

  @Get('inquiries/total')
  async totalInquiries() {
    return this.adminService.getTotalInquiryStats();
  }

  @Get('listings/total')
  async totalListings() {
    return this.adminService.getTotalListingStats();
  }
}
