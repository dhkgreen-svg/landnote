import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class StatsService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  async summary(agentId: string) {
    const [newInquiries, activeListings, contractsThisMonth, pendingMatches, categories] =
      await Promise.all([
        this.getNewInquiriesStats(agentId),
        this.getActiveListingsStats(agentId),
        this.getContractsThisMonthStats(agentId),
        this.getPendingMatchesCount(agentId),
        this.getCategorySummary(agentId),
      ]);

    return {
      new_inquiries: newInquiries,
      active_listings: activeListings,
      contracts_this_month: contractsThisMonth,
      pending_matches: pendingMatches,
      categories,
    };
  }

  private async getNewInquiriesStats(agentId: string) {
    const { count: currentCount } = await this.supabase
      .from('customer_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('status', 'new');

    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const { count: thisWeekCount } = await this.supabase
      .from('customer_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .gte('created_at', startOfThisWeek.toISOString());

    const { count: lastWeekCount } = await this.supabase
      .from('customer_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .gte('created_at', startOfLastWeek.toISOString())
      .lt('created_at', startOfThisWeek.toISOString());

    return {
      count: currentCount ?? 0,
      diff_from_last_period: (thisWeekCount ?? 0) - (lastWeekCount ?? 0),
    };
  }

  private async getActiveListingsStats(agentId: string) {
    const { count: currentCount } = await this.supabase
      .from('property_listings')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('status', 'active');

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const { count: thisMonthCount } = await this.supabase
      .from('property_listings')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .gte('created_at', startOfThisMonth.toISOString());

    const { count: lastMonthCount } = await this.supabase
      .from('property_listings')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .gte('created_at', startOfLastMonth.toISOString())
      .lt('created_at', startOfThisMonth.toISOString());

    return {
      count: currentCount ?? 0,
      diff_from_last_month: (thisMonthCount ?? 0) - (lastMonthCount ?? 0),
    };
  }

  private async getContractsThisMonthStats(agentId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { count } = await this.supabase
      .from('customer_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('status', 'contracted')
      .gte('updated_at', startOfMonth.toISOString());

    return { count: count ?? 0 };
  }

  private async getPendingMatchesCount(agentId: string) {
    const { count } = await this.supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .gte('score', 0.6)
      .eq('is_shown', false);

    return { count: count ?? 0 };
  }

  private async getCategorySummary(agentId: string) {
    const [{ data: listings }, { data: inquiries }] = await Promise.all([
      this.supabase.from('property_listings').select('category_codes')
        .eq('agent_id', agentId).eq('status', 'active'),
      this.supabase.from('customer_inquiries').select('category_codes')
        .eq('agent_id', agentId).neq('status', 'closed'),
    ]);
    const cats = ['residential', 'commercial', 'industrial', 'land'];
    return cats.map(code => ({
      code,
      listing_count: (listings ?? []).filter((l: any) => l.category_codes?.includes(code)).length,
      inquiry_count: (inquiries ?? []).filter((i: any) => i.category_codes?.includes(code)).length,
    }));
  }

  async inquiries(agentId: string, start: string, end: string) {
    const { data } = await this.supabase.rpc('get_inquiry_stats', {
      p_agent_id: agentId, p_start: start, p_end: end,
    });
    return data ?? [];
  }

  async funnel(agentId: string, start: string, end: string) {
    const { data } = await this.supabase.rpc('get_funnel_stats', {
      p_agent_id: agentId, p_start: start, p_end: end,
    });
    return data ?? [];
  }

  async listingsStatus(agentId: string) {
    const { data } = await this.supabase.rpc('get_listing_status_stats', {
      p_agent_id: agentId,
    });
    return data ?? [];
  }

  async listingsCategories(agentId: string, start: string, end: string) {
    const { data } = await this.supabase.rpc('get_listing_category_stats', {
      p_agent_id: agentId, p_start: start, p_end: end,
    });
    return data ?? [];
  }

  async contractsDuration(agentId: string) {
    const { data } = await this.supabase.rpc('get_contract_duration_stats', {
      p_agent_id: agentId,
    });
    return data ?? [];
  }
}
