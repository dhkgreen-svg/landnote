import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminService } from './admin.service';

@Public()
@UseGuards(AdminAuthGuard)
@Controller('admin/revenue')
export class AdminRevenueController {
  constructor(private readonly adminService: AdminService) {}

  @Get('summary')
  async summary() {
    return this.adminService.getRevenueSummary();
  }

  @Get('history')
  async history(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getRevenueHistory({
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('trend')
  async trend(@Query('months') months?: string) {
    return this.adminService.getRevenueTrend(months ? parseInt(months) : undefined);
  }

  @Get('failed')
  async failed() {
    return this.adminService.getFailedPayments();
  }

  @Get('plan-distribution')
  async planDistribution() {
    return this.adminService.getPlanDistribution();
  }
}
