import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { queryKeys } from './keys';

interface SummaryStats {
  new_inquiries: { count: number; diff_from_last_period: number };
  active_listings: { count: number; diff_from_last_month: number };
  contracts_this_month: { count: number };
  pending_matches: { count: number };
  categories?: { code: string; listing_count: number; inquiry_count: number }[];
}

export function useSummary() {
  return useQuery({
    queryKey: queryKeys.stats.summary(),
    queryFn: () => apiFetch<SummaryStats>('/stats/summary'),
    staleTime: 5 * 60 * 1000,
  });
}
