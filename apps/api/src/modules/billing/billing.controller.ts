import { Controller, Post, Patch, Get, Body } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CurrentAgent } from '../../common/decorators/current-agent.decorator';
import { ChangePlanDto } from './dto/change-plan.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('register')
  async registerBillingKey(
    @CurrentAgent() agent: any,
    @Body() body: { authKey: string },
  ) {
    await this.billingService.registerBillingKey(agent, body.authKey);
    return { message: '빌링키 등록 완료' };
  }

  @Patch('plan')
  async changePlan(
    @CurrentAgent() agent: any,
    @Body() body: ChangePlanDto,
  ) {
    await this.billingService.changePlan(agent, body.plan);
    return { message: '플랜 변경 완료' };
  }

  @Post('cancel')
  async cancelSubscription(@CurrentAgent() agent: any) {
    await this.billingService.cancelSubscription(agent);
    return { message: '구독 해지 완료' };
  }

  @Get('subscription')
  async getSubscription(@CurrentAgent() agent: any) {
    return {
      plan: agent.subscription_plan,
      status: agent.subscription_status,
      trial_ends_at: agent.trial_ends_at,
      next_billing_date: agent.next_billing_date,
      billing_card_info: agent.billing_card_info,
      pending_plan: agent.pending_plan,
    };
  }

  @Get('histories')
  async getHistories(@CurrentAgent() agent: any) {
    return this.billingService.getHistories(agent.id);
  }
}
