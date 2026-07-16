import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAgentsController } from './admin-agents.controller';
import { AdminRevenueController } from './admin-revenue.controller';
import { AdminStatsController } from './admin-stats.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [
    AdminAuthController,
    AdminAgentsController,
    AdminRevenueController,
    AdminStatsController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
