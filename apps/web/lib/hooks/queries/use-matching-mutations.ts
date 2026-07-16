import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { queryKeys } from './keys';
import type { InquiryWithMatches, MatchItem } from './use-matching';

export function useMarkShown(inquiryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) =>
      apiFetch(`/matching/${matchId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_shown: true }),
      }),
    onMutate: async (matchId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.matching.results(inquiryId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.matching.inquiries() });

      const prevResults = queryClient.getQueryData<MatchItem[]>(
        queryKeys.matching.results(inquiryId),
      );
      const prevInquiries = queryClient.getQueryData<InquiryWithMatches[]>(
        queryKeys.matching.inquiries(),
      );

      queryClient.setQueryData<MatchItem[]>(
        queryKeys.matching.results(inquiryId),
        (old) => old?.map((m) => (m.id === matchId ? { ...m, is_shown: true } : m)),
      );
      queryClient.setQueryData<InquiryWithMatches[]>(
        queryKeys.matching.inquiries(),
        (old) =>
          old?.map((inq) =>
            inq.id === inquiryId
              ? { ...inq, pending_count: Math.max(0, inq.pending_count - 1) }
              : inq,
          ),
      );

      return { prevResults, prevInquiries };
    },
    onError: (_err, _matchId, context) => {
      if (context?.prevResults) {
        queryClient.setQueryData(queryKeys.matching.results(inquiryId), context.prevResults);
      }
      if (context?.prevInquiries) {
        queryClient.setQueryData(queryKeys.matching.inquiries(), context.prevInquiries);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matching.results(inquiryId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matching.inquiries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.summary() });
    },
  });
}

export function useToggleLiked(inquiryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { matchId: string; currentLiked: boolean }) =>
      apiFetch(`/matching/${params.matchId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_liked: !params.currentLiked }),
      }),
    onMutate: async ({ matchId, currentLiked }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.matching.results(inquiryId) });

      const prevResults = queryClient.getQueryData<MatchItem[]>(
        queryKeys.matching.results(inquiryId),
      );

      queryClient.setQueryData<MatchItem[]>(
        queryKeys.matching.results(inquiryId),
        (old) => old?.map((m) => (m.id === matchId ? { ...m, is_liked: !currentLiked } : m)),
      );

      return { prevResults };
    },
    onError: (_err, _vars, context) => {
      if (context?.prevResults) {
        queryClient.setQueryData(queryKeys.matching.results(inquiryId), context.prevResults);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matching.results(inquiryId) });
    },
  });
}
