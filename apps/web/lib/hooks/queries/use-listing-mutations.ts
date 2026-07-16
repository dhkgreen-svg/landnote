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
      owner_phone?: string | null;
      contract_party_phone?: string | null;
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
