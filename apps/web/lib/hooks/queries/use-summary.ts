import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { queryKeys } from './keys';

interface SummaryStats {
  listings: { new_count: number; total_count: number };
  buyers: { new_count: number; total_count: number };
  contracts_this_month: { count: number };
  contracts_this_year: { count: number };
  categories?: { code: string; listing_count: number; inquiry_count: number }[];
}

export function useSummary() {
  return useQuery({
    queryKey: queryKeys.stats.summary(),
    queryFn: () => apiFetch<SummaryStats>('/stats/summary'),
    staleTime: 5 * 60 * 1000,
  });
}
