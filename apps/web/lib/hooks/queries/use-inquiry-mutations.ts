import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { queryKeys } from './keys';

interface UpdateInquiryPayload {
  status?: string;
  agent_memo?: string;
}

export function useUpdateInquiry(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateInquiryPayload) =>
      apiFetch(`/inquiries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inquiries.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inquiries.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.summary() });
    },
  });
}

export function useDeleteInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/inquiries/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inquiries.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.summary() });
    },
  });
}
