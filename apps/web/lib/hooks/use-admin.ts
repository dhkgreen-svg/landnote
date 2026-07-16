'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useAdmin() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<AdminUser>('/admin/auth/me');
        setAdmin(data);
      } catch {
        // 미인증 상태
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { admin, loading };
}
