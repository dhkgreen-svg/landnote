import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { queryKeys } from './keys';

interface ListingImage {
  path: string;
  signed_url: string | null;
  is_representative: boolean;
  label: string | null;
  uploaded_at: string;
}

interface ListingDetail {
  id: string;
  category_codes: string[];
  subcategory_codes: string[];
  tags: string[];
  transaction_types: string[];
  address_full: string | null;
  address_road: string | null;
  dong_name: string | null;
  complex_name: string | null;
  building_num: string | null;
  room_num: string | null;
  latitude: number | null;
  longitude: number | null;
  price_sale: number | null;
  deposit: number | null;
  monthly_rent: number | null;
  maintenance_fee: number | null;
  premium_price: number | null;
  contract_remaining_months: number | null;
  area_supply: number | null;
  area_exclusive: number | null;
  area_land: number | null;
  area_building: number | null;
  floor_current: number | null;
  floor_total: number | null;
  built_year: number | null;
  direction: string | null;
  images: ListingImage[];
  status: string;
  agent_memo: string | null;
  owner_phone: string | null;
  contract_party_phone: string | null;
  detail_info: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function useListing(id: string) {
  return useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: () => apiFetch<ListingDetail>(`/listings/${id}`),
    enabled: !!id,
  });
}
