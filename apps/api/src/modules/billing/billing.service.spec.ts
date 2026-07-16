import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BillingService } from './billing.service';

// ── Supabase 모킹 ──────────────────────────────────────────────
const mockAgentsUpdate = jest.fn();
const mockBillingInsert = jest.fn();
const mockBillingSelect = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: jest.fn((table: string) => {
      if (table === 'agents') {
        return {
          update: mockAgentsUpdate,
        };
      }
      if (table === 'billing_histories') {
        return {
          insert: mockBillingInsert,
          select: mockBillingSelect,
        };
      }
      return {};
    }),
  }),
}));

// ── EmailService 모킹 ──────────────────────────────────────────
const mockEmailService = {
  sendBillingSuccess: jest.fn(),
  sendBillingFailure: jest.fn(),
  sendSubscriptionExpired: jest.fn(),
  sendTrialReminder: jest.fn(),
  sendCancellationConfirm: jest.fn(),
};

// ── global.fetch 모킹 ──────────────────────────────────────────
const originalFetch = global.fetch;

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(() => {
    service = new BillingService(mockEmailService as any);
    jest.clearAllMocks();

    // 기본 agents update 체이닝
    mockAgentsUpdate.mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    // 기본 billing_histories insert
    mockBillingInsert.mockResolvedValue({ error: null });

    // 기본 billing_histories select (recentFailCount용)
    mockBillingSelect.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        order: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [] }),
        }),
      }),
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  // ── changePlan ──────────────────────────────────────────────

  describe('changePlan', () => {
    it('동일 플랜 요청 시 BadRequestException', async () => {
      const agent = { id: 'a1', subscription_plan: 'starter', subscription_status: 'active', pending_plan: null };
      await expect(service.changePlan(agent, 'starter')).rejects.toThrow(BadRequestException);
    });

    it('expired 상태 시 ForbiddenException', async () => {
      const agent = { id: 'a1', subscription_plan: 'starter', subscription_status: 'expired', pending_plan: null };
      await expect(service.changePlan(agent, 'pro')).rejects.toThrow(ForbiddenException);
    });

    it('cancelled 상태 시 ForbiddenException', async () => {
      const agent = { id: 'a1', subscription_plan: 'starter', subscription_status: 'cancelled', pending_plan: null };
      await expect(service.changePlan(agent, 'pro')).rejects.toThrow(ForbiddenException);
    });

    it('trial 상태에서 즉시 반영', async () => {
      const agent = { id: 'a1', subscription_plan: 'starter', subscription_status: 'trial', pending_plan: null };
      await service.changePlan(agent, 'pro');

      expect(mockAgentsUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ subscription_plan: 'pro', pending_plan: null }),
      );
    });

    it('active starter→pro: 즉시 업그레이드', async () => {
      const agent = { id: 'a1', subscription_plan: 'starter', subscription_status: 'active', pending_plan: null };
      await service.changePlan(agent, 'pro');

      expect(mockAgentsUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ subscription_plan: 'pro', pending_plan: null }),
      );
    });

    it('active pro→starter: pending_plan 예약', async () => {
      const agent = { id: 'a1', subscription_plan: 'pro', subscription_status: 'active', pending_plan: null };
      await service.changePlan(agent, 'starter');

      expect(mockAgentsUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ pending_plan: 'starter' }),
      );
    });

    it('pending_plan 취소 (현재 플랜으로 재요청)', async () => {
      const agent = { id: 'a1', subscription_plan: 'pro', subscription_status: 'active', pending_plan: 'starter' };
      await service.changePlan(agent, 'pro');

      expect(mockAgentsUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ pending_plan: null }),
      );
    });
  });

  // ── chargeAgent ─────────────────────────────────────────────

  describe('chargeAgent', () => {
    it('billing_key 없으면 expired 전환', async () => {
      const agent = { id: 'a1', billing_key: null, subscription_plan: 'starter' };
      await service.chargeAgent(agent);

      expect(mockAgentsUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ subscription_status: 'expired' }),
      );
      expect(mockEmailService.sendSubscriptionExpired).toHaveBeenCalledWith(agent);
    });

    it('Toss 결제 성공(DONE) → success 기록 + next_billing_date 갱신', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'DONE', paymentKey: 'pk_123' }),
      }) as any;

      const agent = {
        id: 'a1', billing_key: 'bk_123', subscription_plan: 'pro',
        subscription_status: 'active', billing_day: 15,
        pending_plan: null, selected_categories: ['residential'],
      };
      await service.chargeAgent(agent);

      expect(mockBillingInsert).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'success', payment_key: 'pk_123' }),
      );
      expect(mockAgentsUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ subscription_status: 'active' }),
      );
    });

    it('Toss 결제 실패 → failed 기록 + 3일 후 재시도', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: '잔액 부족' }),
      }) as any;

      // recentFailCount = 0 (첫 실패)
      mockBillingSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: [{ status: 'failed' }] }),
          }),
        }),
      });

      const agent = {
        id: 'a1', billing_key: 'bk_123', subscription_plan: 'starter',
        subscription_status: 'active', billing_day: 15,
      };
      await service.chargeAgent(agent);

      expect(mockBillingInsert).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed', failure_reason: '잔액 부족' }),
      );
      expect(mockEmailService.sendBillingFailure).toHaveBeenCalled();
    });

    it('3회 연속 실패 → expired 전환', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: '카드 만료' }),
      }) as any;

      // recentFailCount = 3
      mockBillingSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ status: 'failed' }, { status: 'failed' }, { status: 'failed' }],
            }),
          }),
        }),
      });

      const agent = {
        id: 'a1', billing_key: 'bk_123', subscription_plan: 'starter',
        subscription_status: 'active', billing_day: 15,
      };
      await service.chargeAgent(agent);

      expect(mockAgentsUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ subscription_status: 'expired' }),
      );
      expect(mockEmailService.sendSubscriptionExpired).toHaveBeenCalled();
    });
  });

  // ── cancelSubscription ──────────────────────────────────────

  describe('cancelSubscription', () => {
    it('cancelled 상태 + cancelled_at 설정', async () => {
      const agent = { id: 'a1' };
      await service.cancelSubscription(agent);

      expect(mockAgentsUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_status: 'cancelled',
          cancelled_at: expect.any(String),
        }),
      );
    });
  });
});
