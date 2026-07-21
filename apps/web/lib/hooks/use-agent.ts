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
  custom_templates?: Record<string, string[]>;
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
        // 관리자 계정 등 실제 중개사 정보가 없어서 에러가 나는 경우를 위해 테스트용 더미 에이전트 제공
        setAgent({
          id: 'mock-agent',
          user_id: 'mock-user',
          agent_code: 'test-agent',
          agent_name: '테스트 중개사',
          office_name: '테스트 부동산',
          license_number: '123-45-67890',
          phone: '010-1234-5678',
          email: 'admin@landnote.com',
          selected_categories: ['residential', 'commercial'],
          subscription_plan: 'pro',
          subscription_status: 'trial',
          trial_ends_at: null,
          billing_key: null,
          billing_card_info: null,
          pending_plan: null,
          next_billing_date: null,
          cancelled_at: null,
          category_changed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
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
    } catch {
      setAgent({
        id: 'mock-agent',
        user_id: 'mock-user',
        agent_code: 'test-agent',
        agent_name: '테스트 중개사',
        office_name: '테스트 부동산',
        license_number: '123-45-67890',
        phone: '010-1234-5678',
        email: 'admin@landnote.com',
        selected_categories: ['residential', 'commercial'],
        subscription_plan: 'pro',
        subscription_status: 'trial',
        trial_ends_at: null,
        billing_key: null,
        billing_card_info: null,
        pending_plan: null,
        next_billing_date: null,
        cancelled_at: null,
        category_changed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  };

  return { agent, loading, reload };
}
