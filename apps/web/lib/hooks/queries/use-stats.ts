import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { queryKeys } from './keys';

interface InquiryTrend {
  month: string;
  total: number;
  looking_for: number;
  listing: number;
}

interface FunnelItem {
  status: string;
  count: number;
  ratio: number;
}

interface ListingStatus {
  status: string;
  count: number;
}

interface CategoryStat {
  month: string;
  category: string;
  count: number;
}

interface DurationStat {
  duration_range: string;
  count: number;
}

const STATS_STALE_TIME = 5 * 60 * 1000;

export function useInquiryTrend(params: string) {
  return useQuery({
    queryKey: queryKeys.stats.inquiries(params),
    queryFn: () => apiFetch<InquiryTrend[]>(`/stats/inquiries?${params}`),
    staleTime: STATS_STALE_TIME,
  });
}

export function useFunnel(params: string) {
  return useQuery({
    queryKey: queryKeys.stats.funnel(params),
    queryFn: () => apiFetch<FunnelItem[]>(`/stats/funnel?${params}`),
    staleTime: STATS_STALE_TIME,
  });
}

export function useListingStatus() {
  return useQuery({
    queryKey: queryKeys.stats.listingsStatus(),
    queryFn: () => apiFetch<ListingStatus[]>('/stats/listings/status'),
    staleTime: STATS_STALE_TIME,
  });
}

export function useListingCategories(params: string) {
  return useQuery({
    queryKey: queryKeys.stats.listingsCategories(params),
    queryFn: () => apiFetch<CategoryStat[]>(`/stats/listings/categories?${params}`),
    staleTime: STATS_STALE_TIME,
  });
}

export function useContractsDuration() {
  return useQuery({
    queryKey: queryKeys.stats.contractsDuration(),
    queryFn: () => apiFetch<DurationStat[]>('/stats/contracts/duration'),
    staleTime: STATS_STALE_TIME,
  });
}
