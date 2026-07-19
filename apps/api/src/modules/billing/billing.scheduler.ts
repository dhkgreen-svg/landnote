import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { createClient } from '@supabase/supabase-js';
import { BillingService } from './billing.service';

@Injectable()
export class BillingScheduler {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  constructor(private readonly billingService: BillingService) {}

  @Cron('0 0 * * *', { timeZone: 'Asia/Seoul' })
  async processMonthlyBilling() {
    const now = new Date().toISOString();

    const { data: agents } = await this.supabase
      .from('agents')
      .select('*')
      .eq('subscription_status', 'active')
      .lte('next_billing_date', now);

    for (const agent of agents ?? []) {
      await this.billingService.chargeAgent(agent).catch(err =>
        console.error(`결제 실패 [${agent.id}]`, err),
      );
    }
  }

  @Cron('5 0 * * *', { timeZone: 'Asia/Seoul' })
  async processTrialExpiry() {
    const now = new Date().toISOString();

    // 카드 미등록자: trial 만료 → expired
    await this.supabase
      .from('agents')
      .update({ subscription_status: 'expired' })
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', now)
      .is('billing_key', null);

    // 카드 등록자: trial 만료 → 첫 결제 시도
    const { data: trialAgents } = await this.supabase
      .from('agents')
      .select('*')
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', now)
      .not('billing_key', 'is', null);

    for (const agent of trialAgents ?? []) {
      await this.billingService.chargeAgent(agent).catch(err =>
        console.error(`trial 첫 결제 실패 [${agent.id}]`, err),
      );
    }
  }

  @Cron('0 10 * * *', { timeZone: 'Asia/Seoul' })
  async processTrialReminder() {
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const start = new Date(threeDaysLater.getFullYear(), threeDaysLater.getMonth(), threeDaysLater.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const { data: agents } = await this.supabase
      .from('agents')
      .select('*')
      .eq('subscription_status', 'trial')
      .gte('trial_ends_at', start.toISOString())
      .lt('trial_ends_at', end.toISOString());

    for (const agent of agents ?? []) {
      await this.billingService.sendTrialReminder(agent).catch(err =>
        console.error(`trial 리마인더 실패 [${agent.id}]`, err),
      );
    }
  }

  @Cron('30 1 * * *', { timeZone: 'Asia/Seoul' })
  async cleanupOldAccessLogs() {
    const { data } = await this.supabase.rpc('cleanup_old_access_logs', { retention_days: 90 });
    if (data > 0) console.log(`접속 로그 ${data}건 정리 완료`);
  }
}
