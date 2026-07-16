import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { queryKeys } from './keys';

interface InquiryWithMatches {
  id: string;
  customer_name: string | null;
  inquiry_type: string;
  category_codes: string[];
  transaction_types: string[];
  detailed_conditions: Record<string, unknown>;
  status: string;
  created_at: string;
  match_count: number;
  pending_count: number;
}

interface MatchItem {
  id: string;
  inquiry_id: string;
  property_id: string;
  score: number;
  score_breakdown: { category: number; price: number; area: number; location: number };
  shown_count: number;
  is_liked: boolean;
  is_contracted: boolean;
  created_at: string;
  property: {
    id: string;
    address_full: string | null;
    dong_name: string | null;
    category_codes: string[];
    transaction_types: string[];
    price_sale: number | null;
    deposit: number | null;
    monthly_rent: number | null;
    area_exclusive: number | null;
    floor_current: number | null;
    direction: string | null;
    status: string;
  } | null;
}

export type { InquiryWithMatches, MatchItem };

export function useMatchingInquiries() {
  return useQuery({
    queryKey: queryKeys.matching.inquiries(),
    queryFn: () => apiFetch<InquiryWithMatches[]>('/matching'),
    staleTime: 2 * 60 * 1000,
  });
}

export function useMatchResults(inquiryId: string | null) {
  return useQuery({
    queryKey: queryKeys.matching.results(inquiryId!),
    queryFn: () => apiFetch<MatchItem[]>(`/matching/${inquiryId}`),
    staleTime: 2 * 60 * 1000,
    enabled: !!inquiryId,
  });
}
