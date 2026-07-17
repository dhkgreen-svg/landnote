import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EmailService } from '../email/email.service';
import { clampBillingDay, PLAN_LIMITS, PLAN_PRICE } from '@landnote/shared';

@Injectable()
export class BillingService {
  private readonly TOSS_BASE = 'https://api.tosspayments.com/v1';
  private supabase: SupabaseClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  constructor(private readonly emailService: EmailService) {}

  private tossHeader() {
    return {
      Authorization: `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    };
  }

  async registerBillingKey(agent: any, authKey: string): Promise<void> {
    const res = await fetch(`${this.TOSS_BASE}/billing/authorizations/issue`, {
      method: 'POST',
      headers: this.tossHeader(),
      body: JSON.stringify({ authKey, customerKey: agent.id }),
      signal: AbortSignal.timeout(65_000),
    });
    if (!res.ok) {
      const err = await res.json() as any;
      throw new BadRequestException(`빌링키 발급 실패: ${err.message}`);
    }
    const { billingKey, card } = await res.json() as any;
    const billingDay = clampBillingDay(new Date().getDate());

    await this.supabase.from('agents').update({
      billing_key: billingKey,
      billing_card_info: { company: card.company, number: card.number, card_type: card.cardType },
      billing_day: billingDay,
      next_billing_date: this.nextBillingDate(billingDay).toISOString(),
    }).eq('id', agent.id);
  }

  async changePlan(agent: any, newPlan: 'minimal' | 'standard' | 'pro'): Promise<void> {
    if (agent.subscription_plan === newPlan && !agent.pending_plan) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: '이미 해당 플랜입니다' });
    }
    if (!['trial', 'active'].includes(agent.subscription_status)) {
      throw new ForbiddenException({ code: 'SUBSCRIPTION_EXPIRED', message: '구독 활성화 후 변경 가능합니다' });
    }

    // 다운그레이드 예약 취소: newPlan이 현재 플랜과 같고 pending_plan이 있으면
    if (agent.subscription_plan === newPlan && agent.pending_plan) {
      await this.supabase.from('agents').update({ pending_plan: null }).eq('id', agent.id);
      return;
    }

    // trial 중: 즉시 반영
    if (agent.subscription_status === 'trial') {
      await this.supabase.from('agents').update({
        subscription_plan: newPlan, pending_plan: null,
      }).eq('id', agent.id);
      return;
    }

    // active: 업그레이드 즉시, 다운그레이드 예약
    const currentPrice = PLAN_PRICE[agent.subscription_plan] ?? 0;
    const newPrice = PLAN_PRICE[newPlan] ?? 0;

    if (newPrice > currentPrice) {
      await this.supabase.from('agents').update({
        subscription_plan: newPlan, pending_plan: null,
      }).eq('id', agent.id);
    } else {
      await this.supabase.from('agents').update({
        pending_plan: newPlan,
      }).eq('id', agent.id);
    }
  }

  async chargeAgent(agent: any): Promise<void> {
    if (!agent.billing_key) {
      await this.supabase.from('agents')
        .update({ subscription_status: 'expired' }).eq('id', agent.id);
      await this.emailService.sendSubscriptionExpired(agent);
      return;
    }
    const amount = PLAN_PRICE[agent.subscription_plan] ?? 10000;
    const orderId = `landnote-${agent.id}-${Date.now()}`;
    const planName = { minimal: '미니멀', standard: '스탠다드', pro: '프로' }[agent.subscription_plan as string] ?? agent.subscription_plan;

    const res = await fetch(`${this.TOSS_BASE}/billing/${agent.billing_key}`, {
      method: 'POST',
      headers: this.tossHeader(),
      body: JSON.stringify({
        customerKey: agent.id, amount, orderId,
        orderName: `랜드노트 ${planName} 플랜`,
      }),
      signal: AbortSignal.timeout(65_000),
    });

    let result: Record<string, unknown>;
    try {
      result = await res.json() as Record<string, unknown>;
    } catch {
      await this.handleFailure(agent, orderId, `HTTP ${res.status} — 응답 파싱 실패`);
      return;
    }
    if (!res.ok) {
      const errMsg = (result.message as string) ?? `HTTP ${res.status}`;
      await this.handleFailure(agent, orderId, errMsg);
      return;
    }

    if (result['status'] === 'DONE') {
      await this.supabase.from('billing_histories').insert({
        agent_id: agent.id, order_id: orderId,
        payment_key: result['paymentKey'], plan: agent.subscription_plan,
        amount, status: 'success',
      });

      const planUpdate: Record<string, unknown> = {
        subscription_status: 'active',
        subscription_start: agent.subscription_status === 'trial'
          ? new Date().toISOString() : agent.subscription_start,
        next_billing_date: this.nextBillingDate(agent.billing_day).toISOString(),
      };
      if (agent.pending_plan) {
        planUpdate.subscription_plan = agent.pending_plan;
        planUpdate.pending_plan = null;

        if (agent.pending_plan) {
          const maxCat = PLAN_LIMITS[agent.pending_plan as keyof typeof PLAN_LIMITS]?.max_categories ?? 2;
          const currentCats: string[] = agent.selected_categories ?? [];
          if (currentCats.length > maxCat) {
            planUpdate.selected_categories = currentCats.slice(0, maxCat);
          }
        }
      }

      await this.supabase.from('agents').update(planUpdate).eq('id', agent.id);
      await this.emailService.sendBillingSuccess(agent, amount);
    } else {
      await this.handleFailure(agent, orderId,
        (result['failure'] as Record<string, unknown>)?.['message'] as string ?? '알 수 없는 오류');
    }
  }

  async cancelSubscription(agent: any): Promise<void> {
    await this.supabase.from('agents').update({
      subscription_status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    }).eq('id', agent.id);
  }

  async sendTrialReminder(agent: any): Promise<void> {
    await this.emailService.sendTrialReminder(agent);
  }

  async getHistories(agentId: string) {
    const { data, error } = await this.supabase
      .from('billing_histories')
      .select('*')
      .eq('agent_id', agentId)
      .order('billed_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  private async handleFailure(agent: any, orderId: string, reason: string): Promise<void> {
    await this.supabase.from('billing_histories').insert({
      agent_id: agent.id, order_id: orderId,
      plan: agent.subscription_plan,
      amount: PLAN_PRICE[agent.subscription_plan] ?? 10000,
      status: 'failed', failure_reason: reason,
    });

    const failCount = await this.recentFailCount(agent.id);

    if (failCount >= 3) {
      await this.supabase.from('agents')
        .update({ subscription_status: 'expired' }).eq('id', agent.id);
      await this.emailService.sendSubscriptionExpired(agent);
    } else {
      const retry = new Date();
      retry.setDate(retry.getDate() + 3);
      await this.supabase.from('agents')
        .update({ next_billing_date: retry.toISOString() }).eq('id', agent.id);
      await this.emailService.sendBillingFailure(agent, failCount);
    }
  }

  private nextBillingDate(billingDay: number): Date {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, billingDay);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(billingDay, lastDay));
    return next;
  }

  private async recentFailCount(agentId: string): Promise<number> {
    const { data } = await this.supabase
      .from('billing_histories')
      .select('status')
      .eq('agent_id', agentId)
      .order('billed_at', { ascending: false })
      .limit(5);
    let count = 0;
    for (const row of data ?? []) {
      if (row.status === 'failed') count++;
      else break;
    }
    return count;
  }
}
