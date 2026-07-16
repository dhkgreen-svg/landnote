import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { decryptPhone } from '../../common/utils/crypto.util';

@Injectable()
export class AdminService {
  private supabase: SupabaseClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // ── 인증 ──────────────────────────────────────────────

  async login(email: string, password: string) {
    // signInWithPassword()는 클라이언트의 인증 컨텍스트를 변경하므로
    // 별도 클라이언트를 사용하여 this.supabase(SERVICE_ROLE_KEY)를 오염시키지 않는다
    const authClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '이메일 또는 비밀번호가 올바르지 않습니다',
      });
    }

    // this.supabase는 SERVICE_ROLE_KEY 컨텍스트 유지 → RLS 우회하여 admin_users 조회
    const { data: admin } = await this.supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (!admin) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: '관리자 권한이 필요합니다',
      });
    }

    if (!admin.is_active) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: '비활성화된 관리자 계정입니다',
      });
    }

    return { admin, session: data.session };
  }

  // ── 중개사 관리 ──────────────────────────────────────────

  async getAgents(query: {
    search?: string;
    status?: string;
    plan?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const sort = query.sort ?? 'created_at';
    const order = query.order ?? 'desc';

    let qb = this.supabase
      .from('agents')
      .select('id, user_id, email, agent_name, license_number, office_name, phone, agent_code, profile_image_url, subscription_plan, subscription_status, selected_categories, pending_plan, trial_ends_at, cancelled_at, billing_card_info, subscription_start, next_billing_date, billing_day, created_at, updated_at', { count: 'exact' });

    if (query.search) {
      qb = qb.or(`agent_name.ilike.%${query.search}%,email.ilike.%${query.search}%,office_name.ilike.%${query.search}%`);
    }
    if (query.status) {
      qb = qb.eq('subscription_status', query.status);
    }
    if (query.plan) {
      qb = qb.eq('subscription_plan', query.plan);
    }

    const { data, count, error } = await qb
      .order(sort, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    const agents = (data ?? []).map(a => this.sanitizeAgent(a));

    return {
      agents,
      total: count ?? 0,
      page,
      limit,
      total_pages: Math.ceil((count ?? 0) / limit),
    };
  }

  async getAgentDetail(agentId: string) {
    const { data: agent, error } = await this.supabase
      .from('agents')
      .select('id, user_id, email, agent_name, license_number, office_name, phone, agent_code, profile_image_url, subscription_plan, subscription_status, selected_categories, pending_plan, category_changed_at, trial_ends_at, cancelled_at, billing_card_info, subscription_start, subscription_end, next_billing_date, billing_day, created_at, updated_at')
      .eq('id', agentId)
      .single();

    if (error || !agent) throw new BadRequestException('중개사를 찾을 수 없습니다');

    const [billingHistories, recentActivity] = await Promise.all([
      this.supabase
        .from('billing_histories')
        .select('*')
        .eq('agent_id', agentId)
        .order('billed_at', { ascending: false })
        .limit(20),
      this.supabase
        .from('access_logs')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    return {
      agent: this.sanitizeAgent(agent),
      billing_histories: billingHistories.data ?? [],
      recent_activity: recentActivity.data ?? [],
    };
  }

  async getAgentInquiries(agentId: string) {
    const { data } = await this.supabase
      .from('customer_inquiries')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(20);
    return data ?? [];
  }

  async getAgentListings(agentId: string) {
    const { data } = await this.supabase
      .from('property_listings')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(20);
    return data ?? [];
  }

  async getAgentActivity(agentId: string) {
    const { data } = await this.supabase
      .from('access_logs')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(50);
    return data ?? [];
  }

  async changeAgentStatus(adminId: string, agentId: string, newStatus: string) {
    const validStatuses = ['trial', 'active', 'expired', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new BadRequestException(`유효하지 않은 상태입니다: ${newStatus}`);
    }

    const { data: agent } = await this.supabase
      .from('agents')
      .select('id, subscription_status')
      .eq('id', agentId)
      .single();

    if (!agent) throw new BadRequestException('중개사를 찾을 수 없습니다');

    const beforeValue = { subscription_status: agent.subscription_status };
    const afterValue = { subscription_status: newStatus };

    await this.supabase
      .from('agents')
      .update({ subscription_status: newStatus })
      .eq('id', agentId);

    await this.supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action: 'change_agent_status',
      target_type: 'agent',
      target_id: agentId,
      before_value: beforeValue,
      after_value: afterValue,
    });
  }

  async changeAgentPlan(adminId: string, agentId: string, newPlan: string) {
    const validPlans = ['starter', 'pro'];
    if (!validPlans.includes(newPlan)) {
      throw new BadRequestException(`유효하지 않은 플랜입니다: ${newPlan}`);
    }

    const { data: agent } = await this.supabase
      .from('agents')
      .select('id, subscription_plan')
      .eq('id', agentId)
      .single();

    if (!agent) throw new BadRequestException('중개사를 찾을 수 없습니다');

    const beforeValue = { subscription_plan: agent.subscription_plan };
    const afterValue = { subscription_plan: newPlan };

    await this.supabase
      .from('agents')
      .update({ subscription_plan: newPlan, pending_plan: null })
      .eq('id', agentId);

    await this.supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action: 'change_agent_plan',
      target_type: 'agent',
      target_id: agentId,
      before_value: beforeValue,
      after_value: afterValue,
    });
  }

  // ── 수익 관리 ──────────────────────────────────────────

  async getRevenueSummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    const [totalResult, thisMonthResult, lastMonthResult, activeAgentCount] = await Promise.all([
      this.supabase
        .from('billing_histories')
        .select('amount')
        .eq('status', 'success'),
      this.supabase
        .from('billing_histories')
        .select('amount')
        .eq('status', 'success')
        .gte('billed_at', startOfMonth),
      this.supabase
        .from('billing_histories')
        .select('amount')
        .eq('status', 'success')
        .gte('billed_at', startOfLastMonth)
        .lt('billed_at', startOfMonth),
      this.supabase
        .from('agents')
        .select('id', { count: 'exact', head: true })
        .eq('subscription_status', 'active'),
    ]);

    const totalRevenue = (totalResult.data ?? []).reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0);
    const mrr = (thisMonthResult.data ?? []).reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0);
    const lastMonthRevenue = (lastMonthResult.data ?? []).reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0);
    const activeCount = activeAgentCount.count ?? 0;
    const arpu = activeCount > 0 ? Math.round(mrr / activeCount) : 0;

    return {
      total_revenue: totalRevenue,
      mrr,
      mrr_diff: mrr - lastMonthRevenue,
      arpu,
      active_subscribers: activeCount,
    };
  }

  async getRevenueHistory(query: { status?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    let qb = this.supabase
      .from('billing_histories')
      .select('*, agents!inner(agent_name, email, office_name)', { count: 'exact' });

    if (query.status) {
      qb = qb.eq('status', query.status);
    }

    const { data, count, error } = await qb
      .order('billed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    return {
      histories: data ?? [],
      total: count ?? 0,
      page,
      limit,
      total_pages: Math.ceil((count ?? 0) / limit),
    };
  }

  async getRevenueTrend(months: number = 12) {
    const result: { month: string; revenue: number; count: number }[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

      const { data } = await this.supabase
        .from('billing_histories')
        .select('amount')
        .eq('status', 'success')
        .gte('billed_at', start.toISOString())
        .lt('billed_at', end.toISOString());

      const revenue = (data ?? []).reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0);
      result.push({ month: monthKey, revenue, count: data?.length ?? 0 });
    }

    return result;
  }

  async getFailedPayments() {
    const { data } = await this.supabase
      .from('billing_histories')
      .select('*, agents!inner(agent_name, email, office_name)')
      .eq('status', 'failed')
      .order('billed_at', { ascending: false })
      .limit(50);

    return data ?? [];
  }

  async getPlanDistribution() {
    const { data: agents } = await this.supabase
      .from('agents')
      .select('subscription_plan, subscription_status');

    const dist: Record<string, Record<string, number>> = {};
    for (const a of agents ?? []) {
      const plan = a.subscription_plan;
      const status = a.subscription_status;
      if (!dist[plan]) dist[plan] = {};
      dist[plan][status] = (dist[plan][status] ?? 0) + 1;
    }

    return dist;
  }

  // ── 플랫폼 통계 ──────────────────────────────────────────

  async getKpis() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    const [total, active, trial, expired, newThisMonth, newLastMonth, revenueThisMonth] =
      await Promise.all([
        this.supabase.from('agents').select('id', { count: 'exact', head: true }),
        this.supabase.from('agents').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
        this.supabase.from('agents').select('id', { count: 'exact', head: true }).eq('subscription_status', 'trial'),
        this.supabase.from('agents').select('id', { count: 'exact', head: true }).eq('subscription_status', 'expired'),
        this.supabase.from('agents').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
        this.supabase.from('agents').select('id', { count: 'exact', head: true })
          .gte('created_at', startOfLastMonth).lt('created_at', startOfMonth),
        this.supabase.from('billing_histories').select('amount').eq('status', 'success').gte('billed_at', startOfMonth),
      ]);

    const mrr = (revenueThisMonth.data ?? []).reduce((sum: number, r: any) => sum + (r.amount ?? 0), 0);

    return {
      total_agents: total.count ?? 0,
      active_agents: active.count ?? 0,
      trial_agents: trial.count ?? 0,
      expired_agents: expired.count ?? 0,
      new_agents_this_month: newThisMonth.count ?? 0,
      new_agents_diff: (newThisMonth.count ?? 0) - (newLastMonth.count ?? 0),
      mrr,
      total_revenue: mrr,
    };
  }

  async getAccessStats() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [dauResult, wauResult, mauResult] = await Promise.all([
      this.supabase.rpc('count_distinct_agents_in_access_logs', { since: oneDayAgo }),
      this.supabase.rpc('count_distinct_agents_in_access_logs', { since: sevenDaysAgo }),
      this.supabase.rpc('count_distinct_agents_in_access_logs', { since: thirtyDaysAgo }),
    ]).catch(() => [{ data: null }, { data: null }, { data: null }]);

    // 폴백: rpc가 없을 경우 직접 쿼리
    let dau = dauResult?.data;
    let wau = wauResult?.data;
    let mau = mauResult?.data;

    if (dau === null || dau === undefined) {
      const [d, w, m] = await Promise.all([
        this.supabase.from('access_logs').select('agent_id').gte('created_at', oneDayAgo),
        this.supabase.from('access_logs').select('agent_id').gte('created_at', sevenDaysAgo),
        this.supabase.from('access_logs').select('agent_id').gte('created_at', thirtyDaysAgo),
      ]);
      dau = new Set((d.data ?? []).map((r: any) => r.agent_id)).size;
      wau = new Set((w.data ?? []).map((r: any) => r.agent_id)).size;
      mau = new Set((m.data ?? []).map((r: any) => r.agent_id)).size;
    }

    return { dau, wau, mau };
  }

  async getAccessTrend(days: number = 30) {
    const result: { date: string; unique_agents: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const dateKey = dayStart.toISOString().slice(0, 10);

      const { data } = await this.supabase
        .from('access_logs')
        .select('agent_id')
        .gte('created_at', dayStart.toISOString())
        .lt('created_at', dayEnd.toISOString());

      const uniqueAgents = new Set((data ?? []).map((r: any) => r.agent_id)).size;
      result.push({ date: dateKey, unique_agents: uniqueAgents });
    }

    return result;
  }

  async getAgentGrowth() {
    const result: { month: string; new_agents: number; total: number }[] = [];
    const now = new Date();
    let runningTotal = 0;

    // 이전 전체 수 계산
    const startMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const { count: beforeCount } = await this.supabase
      .from('agents')
      .select('id', { count: 'exact', head: true })
      .lt('created_at', startMonth.toISOString());
    runningTotal = beforeCount ?? 0;

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;

      const { count } = await this.supabase
        .from('agents')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString());

      const newAgents = count ?? 0;
      runningTotal += newAgents;
      result.push({ month: monthKey, new_agents: newAgents, total: runningTotal });
    }

    return result;
  }

  async getTotalInquiryStats() {
    const statuses = ['new', 'contacted', 'viewing', 'negotiating', 'contracted', 'closed'];
    const results: Record<string, number> = {};

    const { count: total } = await this.supabase
      .from('customer_inquiries')
      .select('id', { count: 'exact', head: true });

    results.total = total ?? 0;

    for (const status of statuses) {
      const { count } = await this.supabase
        .from('customer_inquiries')
        .select('id', { count: 'exact', head: true })
        .eq('status', status);
      results[status] = count ?? 0;
    }

    return results;
  }

  async getTotalListingStats() {
    const statuses = ['active', 'pending', 'contracted', 'closed'];
    const results: Record<string, number> = {};

    const { count: total } = await this.supabase
      .from('property_listings')
      .select('id', { count: 'exact', head: true });

    results.total = total ?? 0;

    for (const status of statuses) {
      const { count } = await this.supabase
        .from('property_listings')
        .select('id', { count: 'exact', head: true })
        .eq('status', status);
      results[status] = count ?? 0;
    }

    return results;
  }

  // ── 유틸 ──────────────────────────────────────────────

  private sanitizeAgent(agent: any) {
    if (!agent) return agent;
    // billing_key 제외
    const { billing_key, ...rest } = agent;
    // phone 복호화
    if (rest.phone) {
      try { rest.phone = decryptPhone(rest.phone); } catch { /* 이미 평문 */ }
    }
    return rest;
  }
}
