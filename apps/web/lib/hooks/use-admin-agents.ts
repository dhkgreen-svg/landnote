'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

interface AgentListResponse {
  agents: any[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface AgentDetailResponse {
  agent: any;
  billing_histories: any[];
  recent_activity: any[];
}

export function useAdminAgents(params: {
  search?: string;
  status?: string;
  plan?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.plan) query.set('plan', params.plan);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  return useQuery<AgentListResponse>({
    queryKey: ['admin-agents', params],
    queryFn: () => apiFetch(`/admin/agents?${query.toString()}`),
  });
}

export function useAdminAgentDetail(id: string) {
  return useQuery<AgentDetailResponse>({
    queryKey: ['admin-agent-detail', id],
    queryFn: () => apiFetch(`/admin/agents/${id}`),
    enabled: !!id,
  });
}

export function useAdminAgentInquiries(id: string) {
  return useQuery({
    queryKey: ['admin-agent-inquiries', id],
    queryFn: () => apiFetch<any[]>(`/admin/agents/${id}/inquiries`),
    enabled: !!id,
  });
}

export function useAdminAgentListings(id: string) {
  return useQuery({
    queryKey: ['admin-agent-listings', id],
    queryFn: () => apiFetch<any[]>(`/admin/agents/${id}/listings`),
    enabled: !!id,
  });
}

export function useChangeAgentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/admin/agents/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-agents'] });
      qc.invalidateQueries({ queryKey: ['admin-agent-detail'] });
    },
  });
}

export function useChangeAgentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: string }) =>
      apiFetch(`/admin/agents/${id}/plan`, {
        method: 'PATCH',
        body: JSON.stringify({ plan }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-agents'] });
      qc.invalidateQueries({ queryKey: ['admin-agent-detail'] });
    },
  });
}
