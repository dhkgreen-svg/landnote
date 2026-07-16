'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Agent {
  id: string;
  user_id: string;
  agent_code: string;
  agent_name: string;
  office_name: string;
  license_number: string;
  phone: string;
  email: string;
  selected_categories: string[];
  subscription_plan: string;
  subscription_status: string;
  trial_ends_at: string | null;
  billing_key: string | null;
  billing_card_info: { company: string; number: string; card_type: string } | null;
  pending_plan: string | null;
  next_billing_date: string | null;
  cancelled_at: string | null;
  category_changed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useAgent() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<Agent>('/auth/me');
        setAgent(data);
      } catch {
        // 미인증 상태
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const reload = async () => {
    try {
      const data = await apiFetch<Agent>('/auth/me');
      setAgent(data);
    } catch {}
  };

  return { agent, loading, reload };
}
