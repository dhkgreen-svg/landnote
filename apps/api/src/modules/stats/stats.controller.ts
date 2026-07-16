import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { CurrentAgent } from '../../common/decorators/current-agent.decorator';
import { SubscriptionGuard } from '../../common/guards/subscription.guard';

@UseGuards(SubscriptionGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('summary')
  async summary(@CurrentAgent() agent: any) {
    return this.statsService.summary(agent.id);
  }

  @Get('inquiries')
  async inquiries(@CurrentAgent() agent: any, @Query('start') start: string, @Query('end') end: string) {
    return this.statsService.inquiries(agent.id, start, end);
  }

  @Get('funnel')
  async funnel(@CurrentAgent() agent: any, @Query('start') start: string, @Query('end') end: string) {
    return this.statsService.funnel(agent.id, start, end);
  }

  @Get('listings/status')
  async listingsStatus(@CurrentAgent() agent: any) {
    return this.statsService.listingsStatus(agent.id);
  }

  @Get('listings/categories')
  async listingsCategories(@CurrentAgent() agent: any, @Query('start') start: string, @Query('end') end: string) {
    return this.statsService.listingsCategories(agent.id, start, end);
  }

  @Get('contracts/duration')
  async contractsDuration(@CurrentAgent() agent: any) {
    return this.statsService.contractsDuration(agent.id);
  }
}
