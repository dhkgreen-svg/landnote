import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiUpload } from '@/lib/api';
import { queryKeys } from './keys';

export function useUpdateListing(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      status?: string;
      agent_memo?: string;
      address_full?: string | null;
      address_road?: string | null;
      address_jibun?: string | null;
      dong_name?: string | null;
      complex_name?: string | null;
      building_num?: string | null;
      room_num?: string | null;
      owner_name?: string | null;
      owner_phone?: string | null;
      contract_party_phone?: string | null;
      price_sale?: number | null;
      price_jeonse?: number | null;
      deposit?: number | null;
      monthly_rent?: number | null;
      maintenance_fee?: number | null;
      premium_price?: number | null;
      contract_remaining_months?: number | null;
      area_supply?: number | null;
      area_exclusive?: number | null;
      area_land?: number | null;
      area_building?: number | null;
      floor_current?: number | null;
      floor_total?: number | null;
      built_year?: number | null;
      direction?: string | null;
      detail_info?: Record<string, unknown> | null;
      category_codes?: string[];
      subcategory_codes?: string[];
      transaction_types?: string[];
      tags?: string[];
    }) =>
      apiFetch(`/listings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}

export function useUploadListingImage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiUpload(`/listings/${id}/images`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.detail(id) });
    },
  });
}

export function useDeleteListingImage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imagePath: string) =>
      apiFetch(`/listings/${id}/images`, {
        method: 'DELETE',
        body: JSON.stringify({ imagePath }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.detail(id) });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/listings/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}
