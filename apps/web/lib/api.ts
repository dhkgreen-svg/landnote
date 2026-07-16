import { createClient } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // --- [TESTING MODE] MOCK DATA ---
  if (path === '/auth/me') {
    return {
      id: 'mock-agent',
      agent_code: 'test-agent',
      agent_name: '테스트 중개사',
      office_name: '테스트 부동산',
      phone: '010-1234-5678',
      selected_categories: [
        '아파트 (주상복합 포함)',
        '오피스텔 (보안과 편리한 주차를 선호하는 수요층 분리)',
        '빌라·투룸 (다세대, 연립주택 등 2~3인 가구 타겟)',
        '요식업',
        '병의원/약국',
        '일반사무실',
        '일반제조(기계/조립)'
      ],
      subscription_plan: 'pro'
    } as any;
  }

  if (path.startsWith('/stats/summary')) {
    return {
      new_inquiries: { count: 4, diff_from_last_period: 2 },
      active_listings: { count: 10, diff_from_last_month: 3 },
      contracts_this_month: { count: 1 },
      pending_matches: { count: 5 },
      categories: [
        { code: 'residential', listing_count: 5, inquiry_count: 2 },
        { code: 'commercial', listing_count: 3, inquiry_count: 2 },
        { code: 'industrial', listing_count: 1, inquiry_count: 0 },
        { code: 'land', listing_count: 1, inquiry_count: 0 },
      ]
    } as any;
  }

  if (path.startsWith('/listings') && (!options?.method || options.method === 'GET')) {
    const items = Array.from({ length: 10 }).map((_, i) => ({
      id: `mock-listing-${i}`,
      agent_id: 'mock-agent',
      status: 'active',
      category_codes: ['residential'],
      subcategory_codes: ['apartment'],
      tags: ['일반 아파트'],
      transaction_types: i % 2 === 0 ? ['sale'] : ['monthly'],
      address_full: `서울시 강남구 테헤란로 ${i * 10 + 1}길`,
      dong_name: '역삼동',
      price_sale: i % 2 === 0 ? 100000 + i * 5000 : null,
      price_deposit: i % 2 !== 0 ? 5000 : null,
      price_monthly: i % 2 !== 0 ? 100 + i * 10 : null,
      area_exclusive: 84 + i,
      floor_current: i + 1,
      floor_total: 15,
      created_at: new Date().toISOString(),
    }));
    return { items, total: 10 } as any;
  }

  if (path.startsWith('/inquiries') && (!options?.method || options.method === 'GET')) {
    const items = Array.from({ length: 4 }).map((_, i) => ({
      id: `mock-inquiry-${i}`,
      agent_id: 'mock-agent',
      status: 'new',
      category_codes: ['commercial'],
      subcategory_codes: ['store'],
      inquiry_type: i % 2 === 0 ? 'looking_for' : 'listing',
      tags: ['요식업'],
      transaction_types: ['monthly'],
      desired_areas: ['강남구 역삼동', '서초구 서초동'],
      max_budget: 10000 + i * 2000,
      customer_name: `김고객${i + 1}`,
      customer_phone: `010-1111-222${i}`,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
    }));
    return { items, total: 4 } as any;
  }
  // --- END MOCK DATA ---

  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
      ...options?.headers,
    },
  });

  const json: any = await res.json();
  if (!json.ok) throw new Error(json.error?.message || 'API 오류');
  return json.data as T;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: formData,
  });

  const json: any = await res.json();
  if (!json.ok) throw new Error(json.error?.message || '업로드 실패');
  return json.data as T;
}
