import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { queryKeys } from './keys';

interface ListingItem {
  id: string;
  category_codes: string[];
  subcategory_codes?: string[];
  transaction_types: string[];
  address_full: string | null;
  address_road?: string | null;
  dong_name: string | null;
  complex_name?: string | null;
  room_num?: string | null;
  price_sale: number | null;
  price_jeonse?: number | null;
  deposit: number | null;
  monthly_rent: number | null;
  premium_price?: number | null;
  area_exclusive: number | null;
  area_land?: number | null;
  status: string;
  created_at: string;
}

interface ListingListResponse {
  items: ListingItem[];
  total: number;
}

interface ListingListParams {
  page: number;
  limit: number;
  status?: string;
  category_code?: string;
  transaction_type?: string;
  period?: string;
}

export function useListings(params: ListingListParams) {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page));
  searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);
  if (params.category_code) searchParams.set('category_code', params.category_code);
  if (params.transaction_type) searchParams.set('transaction_type', params.transaction_type);
  if (params.period) searchParams.set('period', params.period);

  return useQuery({
    queryKey: queryKeys.listings.list(params),
    queryFn: () => apiFetch<ListingListResponse>(`/listings?${searchParams.toString()}`),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
