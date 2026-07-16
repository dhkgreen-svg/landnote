'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface RevenueSummary {
  total_revenue: number;
  mrr: number;
  mrr_diff: number;
  arpu: number;
  active_subscribers: number;
}

interface RevenueHistoryResponse {
  histories: any[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface RevenueTrendItem {
  month: string;
  revenue: number;
  count: number;
}

export function useRevenueSummary() {
  return useQuery<RevenueSummary>({
    queryKey: ['admin-revenue-summary'],
    queryFn: () => apiFetch('/admin/revenue/summary'),
  });
}

export function useRevenueHistory(params: { status?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));

  return useQuery<RevenueHistoryResponse>({
    queryKey: ['admin-revenue-history', params],
    queryFn: () => apiFetch(`/admin/revenue/history?${query.toString()}`),
  });
}

export function useRevenueTrend(months: number = 12) {
  return useQuery<RevenueTrendItem[]>({
    queryKey: ['admin-revenue-trend', months],
    queryFn: () => apiFetch(`/admin/revenue/trend?months=${months}`),
  });
}

export function useFailedPayments() {
  return useQuery<any[]>({
    queryKey: ['admin-failed-payments'],
    queryFn: () => apiFetch('/admin/revenue/failed'),
  });
}

export function usePlanDistribution() {
  return useQuery<Record<string, Record<string, number>>>({
    queryKey: ['admin-plan-distribution'],
    queryFn: () => apiFetch('/admin/revenue/plan-distribution'),
  });
}
