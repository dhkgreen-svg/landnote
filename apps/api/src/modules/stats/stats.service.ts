import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class StatsService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  async summary(agentId: string) {
    const [listings, buyers, contractsThisMonth, contractsThisYear, categories] =
      await Promise.all([
        this.getListingsStats(agentId),
        this.getBuyersStats(agentId),
        this.getContractsThisMonthStats(agentId),
        this.getContractsThisYearStats(agentId),
        this.getCategorySummary(agentId),
      ]);

    return {
      listings,
      buyers,
      contracts_this_month: contractsThisMonth,
      contracts_this_year: contractsThisYear,
      categories,
    };
  }

  private async getListingsStats(agentId: string) {
    const { data } = await this.supabase
      .from('property_listings')
      .select('status, created_at')
      .eq('agent_id', agentId);

    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);

    let totalCount = 0;
    let newCount = 0;
    const byStatus: Record<string, number> = {};

    if (data) {
      totalCount = data.length;
      for (const item of data) {
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        if (new Date(item.created_at) >= startOfThisWeek) {
          newCount++;
        }
      }
    }

    return {
      new_count: newCount,
      total_count: totalCount,
      by_status: byStatus,
    };
  }

  private async getBuyersStats(agentId: string) {
    const { data } = await this.supabase
      .from('customer_inquiries')
      .select('status')
      .eq('agent_id', agentId)
      .eq('inquiry_type', 'looking_for');

    let totalCount = 0;
    let newCount = 0;
    const byStatus: Record<string, number> = {};

    if (data) {
      totalCount = data.length;
      for (const item of data) {
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        if (item.status === 'new') {
          newCount++;
        }
      }
    }

    return {
      new_count: newCount,
      total_count: totalCount,
      by_status: byStatus,
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

  private async getContractsThisYearStats(agentId: string) {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const { count } = await this.supabase
      .from('customer_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('status', 'contracted')
      .gte('updated_at', startOfYear.toISOString());

    return { count: count ?? 0 };
  }

  private async getCategorySummary(agentId: string) {
    const [{ data: listings }, { data: inquiries }] = await Promise.all([
      this.supabase.from('property_listings').select('status, category_codes')
        .eq('agent_id', agentId),
      this.supabase.from('customer_inquiries').select('status, category_codes')
        .eq('agent_id', agentId),
    ]);
    const cats = ['residential', 'commercial', 'industrial', 'land'];
    return cats.map(code => {
      const catListings = (listings ?? []).filter((l: any) => l.category_codes?.includes(code));
      const catInquiries = (inquiries ?? []).filter((i: any) => i.category_codes?.includes(code));
      
      const listing_by_status: Record<string, number> = {};
      catListings.forEach((l: any) => {
        if (l.status) listing_by_status[l.status] = (listing_by_status[l.status] || 0) + 1;
      });

      const inquiry_by_status: Record<string, number> = {};
      catInquiries.forEach((i: any) => {
        if (i.status) inquiry_by_status[i.status] = (inquiry_by_status[i.status] || 0) + 1;
      });

      return {
        code,
        listing_count: catListings.length,
        inquiry_count: catInquiries.length,
        listing_by_status,
        inquiry_by_status
      };
    });
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
