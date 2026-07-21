import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useUpdateAgentTemplates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (custom_templates: Record<string, string[]>) =>
      apiFetch('/agents/me/templates', {
        method: 'PATCH',
        body: JSON.stringify({ custom_templates }),
      }),
  });
}
