import { createClient } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let mockMatchingInquiries = [
  {
    id: 'mock-inquiry-1',
    customer_name: '홍길동',
    inquiry_type: 'looking_for',
    category_codes: ['residential'],
    transaction_types: ['jeonse'],
    detailed_conditions: { max_budget: 300000000 },
    status: 'new',
    created_at: new Date().toISOString(),
    match_count: 5,
    pending_count: 3,
  },
  {
    id: 'mock-inquiry-2',
    customer_name: '김고객',
    inquiry_type: 'looking_for',
    category_codes: ['commercial'],
    transaction_types: ['monthly'],
    detailed_conditions: { max_budget: 50000000 },
    status: 'in_progress',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    match_count: 2,
    pending_count: 1,
  }
];

let mockMatchingResults = [
  // 홍길동 매칭 (5개, 미검토 3개)
  {
    id: 'mock-match-1-1',
    inquiry_id: 'mock-inquiry-1',
    property_id: 'mock-listing-1',
    score: 0.95,
    score_breakdown: { category: 0.30, price: 0.35, area: 0.15, location: 0.15 },
    shown_count: 0,
    is_liked: false,
    is_contracted: false,
    created_at: new Date().toISOString(),
    property: {
      id: 'mock-listing-1',
      address_full: '서울시 강남구 역삼동 123-1',
      dong_name: '역삼동',
      category_codes: ['residential'],
      transaction_types: ['jeonse'],
      price_sale: null,
      deposit: 250000000,
      monthly_rent: null,
      area_exclusive: 84,
      floor_current: 5,
      direction: '남향',
      status: 'active',
    }
  },
  {
    id: 'mock-match-1-2',
    inquiry_id: 'mock-inquiry-1',
    property_id: 'mock-listing-2',
    score: 0.88,
    score_breakdown: { category: 0.30, price: 0.28, area: 0.20, location: 0.10 },
    shown_count: 0,
    is_liked: true,
    is_contracted: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    property: {
      id: 'mock-listing-2',
      address_full: '서울시 강남구 도곡동 45-2',
      dong_name: '도곡동',
      category_codes: ['residential'],
      transaction_types: ['jeonse'],
      price_sale: null,
      deposit: 280000000,
      monthly_rent: null,
      area_exclusive: 59,
      floor_current: 12,
      direction: '동향',
      status: 'active',
      owner_phone: '010-3333-4444',
      contract_party_phone: null,
    }
  },
  {
    id: 'mock-match-1-3',
    inquiry_id: 'mock-inquiry-1',
    property_id: 'mock-listing-3',
    score: 0.82,
    score_breakdown: { category: 0.30, price: 0.20, area: 0.15, location: 0.17 },
    shown_count: 0,
    is_liked: false,
    is_contracted: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    property: {
      id: 'mock-listing-3',
      address_full: '서울시 서초구 서초동 99',
      dong_name: '서초동',
      category_codes: ['residential'],
      transaction_types: ['jeonse'],
      price_sale: null,
      deposit: 300000000,
      monthly_rent: null,
      area_exclusive: 84,
      floor_current: 2,
      direction: '남서향',
      status: 'active',
      owner_phone: '010-5555-6666',
      contract_party_phone: null,
    }
  },
  {
    id: 'mock-match-1-4',
    inquiry_id: 'mock-inquiry-1',
    property_id: 'mock-listing-4',
    score: 0.75,
    score_breakdown: { category: 0.30, price: 0.15, area: 0.20, location: 0.10 },
    shown_count: 1,
    is_liked: false,
    is_contracted: false,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    property: {
      id: 'mock-listing-4',
      address_full: '서울시 강남구 대치동 11-1',
      dong_name: '대치동',
      category_codes: ['residential'],
      transaction_types: ['jeonse'],
      price_sale: null,
      deposit: 320000000,
      monthly_rent: null,
      area_exclusive: 105,
      floor_current: 8,
      direction: '남향',
      status: 'active',
    }
  },
  {
    id: 'mock-match-1-5',
    inquiry_id: 'mock-inquiry-1',
    property_id: 'mock-listing-5',
    score: 0.60,
    score_breakdown: { category: 0.30, price: 0.05, area: 0.15, location: 0.10 },
    shown_count: 2,
    is_liked: false,
    is_contracted: false,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    property: {
      id: 'mock-listing-5',
      address_full: '서울시 송파구 잠실동 22',
      dong_name: '잠실동',
      category_codes: ['residential'],
      transaction_types: ['jeonse'],
      price_sale: null,
      deposit: 350000000,
      monthly_rent: null,
      area_exclusive: 84,
      floor_current: 1,
      direction: '북향',
      status: 'active',
      owner_phone: '010-9999-0000',
      contract_party_phone: null,
    }
  },
  
  // 김고객 매칭 (2개, 미검토 1개)
  {
    id: 'mock-match-2-1',
    inquiry_id: 'mock-inquiry-2',
    property_id: 'mock-listing-6',
    score: 0.90,
    score_breakdown: { category: 0.30, price: 0.30, area: 0.15, location: 0.15 },
    shown_count: 0,
    is_liked: true,
    is_contracted: false,
    created_at: new Date().toISOString(),
    property: {
      id: 'mock-listing-6',
      address_full: '서울시 마포구 서교동 33',
      dong_name: '서교동',
      category_codes: ['commercial'],
      transaction_types: ['monthly'],
      price_sale: null,
      deposit: 30000000,
      monthly_rent: 2000000,
      area_exclusive: 60,
      floor_current: 1,
      direction: '남향',
      status: 'active',
    }
  },
  {
    id: 'mock-match-2-2',
    inquiry_id: 'mock-inquiry-2',
    property_id: 'mock-listing-7',
    score: 0.85,
    score_breakdown: { category: 0.30, price: 0.25, area: 0.20, location: 0.10 },
    shown_count: 1,
    is_liked: false,
    is_contracted: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    property: {
      id: 'mock-listing-7',
      address_full: '서울시 강남구 신사동 55',
      dong_name: '신사동',
      category_codes: ['commercial'],
      transaction_types: ['monthly'],
      price_sale: null,
      deposit: 50000000,
      monthly_rent: 2500000,
      area_exclusive: 80,
      floor_current: 2,
      direction: '남향',
      status: 'active',
    }
  }
];

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
        '빌라·투룸 (다세대, 연립주택 등 2 가구 타겟)',
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
      contracts_this_month: { count: 3, diff_from_last_month: 1 },
      contracts_this_year: { count: 15 },
      pending_matches: { count: mockMatchingResults.filter(m => m.shown_count === 0).length },
      categories: [
        { code: 'residential', listing_count: 5, inquiry_count: 2 },
        { code: 'commercial', listing_count: 3, inquiry_count: 2 },
        { code: 'industrial', listing_count: 1, inquiry_count: 0 },
        { code: 'land', listing_count: 1, inquiry_count: 0 },
      ]
    } as any;
  }

  if (path.startsWith('/listings') && (!options?.method || options.method === 'GET')) {
    const isDetail = path.match(/^\/listings\/[^?]+$/);
    const mockListing = {
      id: isDetail ? path.split('/').pop() : 'mock-listing-1',
      agent_id: 'mock-agent',
      status: 'active',
      category_codes: ['residential'],
      subcategory_codes: ['apartment'],
      tags: ['일반 아파트'],
      transaction_types: ['sale'],
      address_full: `서울시 강남구 테헤란로 1길`,
      dong_name: '역삼동',
      price_sale: 100000,
      price_deposit: null,
      price_monthly: null,
      area_exclusive: 84,
      floor_current: 5,
      floor_total: 15,
      created_at: new Date().toISOString(),
      images: [],
      agent_memo: '가상 매물입니다.',
      owner_phone: '010-9999-8888',
      contract_party_phone: null,
    };

    if (isDetail) {
      return mockListing as any;
    }

    // Filter by status if query param exists
    const url = new URL(path, 'http://localhost');
    const statusFilter = url.searchParams.get('status');

    let items = Array.from({ length: 10 }).map((_, i) => ({
      ...mockListing,
      id: `mock-listing-${i}`,
      status: i === 0 ? 'contracted' : 'active',
      owner_phone: `010-1234-000${i}`,
      contract_party_phone: i === 0 ? '010-5678-0000' : null,
      transaction_types: i % 2 === 0 ? ['sale'] : ['monthly_rent'],
      price_sale: i % 2 === 0 ? 100000 + i * 5000 : null,
      deposit: i % 2 !== 0 ? 5000 : null,
      monthly_rent: i % 2 !== 0 ? 100 + i * 10 : null,
    }));

    if (statusFilter) {
      items = items.filter(item => item.status === statusFilter);
    }

    return { items, total: items.length } as any;
  }

  if (path.startsWith('/inquiries') && (!options?.method || options.method === 'GET')) {
    const isDetail = path.match(/^\/inquiries\/[^?]+$/);
    const mockInquiry = {
      id: isDetail ? path.split('/').pop() : 'mock-inquiry-1',
      agent_id: 'mock-agent',
      status: 'new',
      category_codes: ['commercial'],
      subcategory_codes: ['store'],
      inquiry_type: 'looking_for',
      tags: ['요식업'],
      transaction_types: ['monthly'],
      desired_areas: ['강남구 역삼동', '서초구 서초동'],
      max_budget: 10000,
      customer_name: `김고객`,
      customer_phone: `010-1111-2222`,
      created_at: new Date().toISOString(),
    };

    if (isDetail) {
      return mockInquiry as any;
    }

    const items = Array.from({ length: 4 }).map((_, i) => ({
      ...mockInquiry,
      id: `mock-inquiry-${i}`,
      inquiry_type: i % 2 === 0 ? 'looking_for' : 'listing',
      max_budget: 10000 + i * 2000,
      customer_name: `김고객${i + 1}`,
      customer_phone: `010-1111-222${i}`,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
    }));
    return { items, total: 4 } as any;
  }

  if (path === '/matching' && (!options?.method || options.method === 'GET')) {
    return mockMatchingInquiries as any;
  }

  if (path.startsWith('/matching/') && (!options?.method || options.method === 'GET')) {
    const inquiryId = path.split('/').pop();
    return mockMatchingResults.filter(m => m.inquiry_id === inquiryId) as any;
  }

  if (path.startsWith('/matching/') && options?.method === 'PATCH') {
    const matchId = path.split('/').pop();
    const body = JSON.parse(options.body as string);
    
    mockMatchingResults = mockMatchingResults.map(m => {
      if (m.id === matchId) {
        if (body.increment_shown) {
          const newCount = m.shown_count + 1;
          if (m.shown_count === 0) {
            // Decrement pending count in mock inquiries
            mockMatchingInquiries = mockMatchingInquiries.map(inq => 
              inq.id === m.inquiry_id ? { ...inq, pending_count: Math.max(0, inq.pending_count - 1) } : inq
            );
          }
          return { ...m, shown_count: newCount };
        } else {
          return { ...m, ...body };
        }
      }
      return m;
    });
    
    return { success: true } as any;
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
