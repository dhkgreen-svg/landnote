'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface KpiData {
  total_agents: number;
  active_agents: number;
  trial_agents: number;
  expired_agents: number;
  new_agents_this_month: number;
  new_agents_diff: number;
  mrr: number;
  total_revenue: number;
}

interface AccessStats {
  dau: number;
  wau: number;
  mau: number;
}

interface AccessTrendItem {
  date: string;
  unique_agents: number;
}

interface AgentGrowthItem {
  month: string;
  new_agents: number;
  total: number;
}

export function useAdminKpis() {
  return useQuery<KpiData>({
    queryKey: ['admin-kpis'],
    queryFn: () => apiFetch('/admin/stats/kpis'),
  });
}

export function useAccessStats() {
  return useQuery<AccessStats>({
    queryKey: ['admin-access-stats'],
    queryFn: () => apiFetch('/admin/stats/access'),
  });
}

export function useAccessTrend(days: number = 30) {
  return useQuery<AccessTrendItem[]>({
    queryKey: ['admin-access-trend', days],
    queryFn: () => apiFetch(`/admin/stats/access/trend?days=${days}`),
  });
}

export function useAgentGrowth() {
  return useQuery<AgentGrowthItem[]>({
    queryKey: ['admin-agent-growth'],
    queryFn: () => apiFetch('/admin/stats/agents/growth'),
  });
}

export function useTotalInquiryStats() {
  return useQuery<Record<string, number>>({
    queryKey: ['admin-total-inquiries'],
    queryFn: () => apiFetch('/admin/stats/inquiries/total'),
  });
}

export function useTotalListingStats() {
  return useQuery<Record<string, number>>({
    queryKey: ['admin-total-listings'],
    queryFn: () => apiFetch('/admin/stats/listings/total'),
  });
}
