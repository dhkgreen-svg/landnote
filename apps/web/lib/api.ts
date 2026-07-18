import { createClient } from '@/lib/supabase/client';

let API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
if (typeof window !== 'undefined' && API_URL.includes('localhost') && window.location.hostname !== 'localhost') {
  API_URL = `${window.location.protocol}//${window.location.hostname}:3001`;
}

// --- IN-MEMORY DB ---
let mockListings: any[] = [];
let mockInquiries: any[] = [];
let mockMatchingInquiries: any[] = [];
let mockMatchingResults: any[] = [];
let nextId = 1;
let mockAgent: any = {
  id: 'mock-agent',
  agent_code: 'test-agent',
  agent_name: '테스트 중개사',
  office_name: '테스트 부동산',
  license_number: '123-45-67890',
  phone: '010-1234-5678',
  selected_categories: [
    'residential',
    'commercial',
    'industrial',
  ],
  subscription_plan: 'pro'
};

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET';
  
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    if (path === '/auth/me') {
      return mockAgent as any;
    }

  if (path.startsWith('/stats/summary')) {
    return {
      new_inquiries: { count: mockInquiries.filter(i => i.status === 'new').length, diff_from_last_period: 0 },
      active_listings: { count: mockListings.filter(l => l.status === 'active').length, diff_from_last_month: 0 },
      contracts_this_month: { count: mockListings.filter(l => l.status === 'contracted').length, diff_from_last_month: 0 },
      contracts_this_year: { count: mockListings.filter(l => l.status === 'contracted').length },
      pending_matches: { count: mockMatchingResults.filter(m => m.shown_count === 0).length },
      categories: [
        { code: 'residential', listing_count: mockListings.filter(l => l.category_codes.includes('residential')).length, inquiry_count: 0 },
        { code: 'commercial', listing_count: mockListings.filter(l => l.category_codes.includes('commercial')).length, inquiry_count: 0 },
      ]
    } as any;
  }

  // --- LISTINGS ---
  if (path.startsWith('/listings')) {
    const isDetail = path.match(/^\/listings\/([^?]+)$/);
    
    if (method === 'GET') {
      if (isDetail) {
        const id = isDetail[1];
        const listing = mockListings.find(l => l.id === id);
        if (!listing) throw new Error('Listing not found');
        return listing as any;
      }
      
      const url = new URL(path, 'http://localhost');
      const statusFilter = url.searchParams.get('status');
      let items = [...mockListings];
      if (statusFilter) items = items.filter(i => i.status === statusFilter);
      // Sort by latest
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return { items, total: items.length } as any;
    }
    
    if (method === 'POST') {
      const body = JSON.parse(options?.body as string);
      const newListing = {
        ...body,
        id: `mock-listing-${nextId++}`,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      mockListings.push(newListing);
      return { id: newListing.id } as any;
    }

    if (method === 'PATCH' && isDetail) {
      const id = isDetail[1];
      const body = JSON.parse(options?.body as string);
      mockListings = mockListings.map(l => l.id === id ? { ...l, ...body } : l);
      return { success: true } as any;
    }
  }

  // --- INQUIRIES ---
  if (path.startsWith('/inquiries')) {
    const isDetail = path.match(/^\/inquiries\/([^?]+)$/);
    
    if (method === 'GET') {
      if (isDetail) {
        const id = isDetail[1];
        const inquiry = mockInquiries.find(i => i.id === id);
        if (!inquiry) throw new Error('Inquiry not found');
        return inquiry as any;
      }
      
      let items = [...mockInquiries];
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { items, total: items.length } as any;
    }

    if (method === 'POST') {
      const body = JSON.parse(options?.body as string);
      const newInquiry = {
        ...body,
        id: `mock-inquiry-${nextId++}`,
        status: 'new',
        created_at: new Date().toISOString(),
      };
      mockInquiries.push(newInquiry);
      return { id: newInquiry.id } as any;
    }

    if (method === 'PATCH' && isDetail) {
      const id = isDetail[1];
      const body = JSON.parse(options?.body as string);
      mockInquiries = mockInquiries.map(i => i.id === id ? { ...i, ...body } : i);
      return { success: true } as any;
    }
  }

  // --- MATCHING ---
  if (path === '/matching' && method === 'GET') {
    return mockMatchingInquiries as any;
  }

  if (path.startsWith('/matching/') && method === 'GET') {
    const inquiryId = path.split('/').pop();
    return mockMatchingResults.filter(m => m.inquiry_id === inquiryId) as any;
  }

    if (path.startsWith('/matching/') && method === 'PATCH') {
      const matchId = path.split('/').pop();
      const body = JSON.parse(options?.body as string);
      mockMatchingResults = mockMatchingResults.map(m => m.id === matchId ? { ...m, ...body } : m);
      return { success: true } as any;
    }

    // --- ADMIN MOCK ---
    if (path.startsWith('/admin/stats/kpis')) {
      return {
        total_agents: 120,
        active_agents: 95,
        trial_agents: 15,
        expired_agents: 10,
        new_agents_this_month: 8,
        new_agents_diff: 3,
        mrr: 1250000,
        total_revenue: 14500000
      } as any;
    }

    if (path.startsWith('/admin/stats/agents/growth')) {
      return [
        { month: '2월', new_agents: 5, total: 50 },
        { month: '3월', new_agents: 12, total: 62 },
        { month: '4월', new_agents: 15, total: 77 },
        { month: '5월', new_agents: 20, total: 97 },
        { month: '6월', new_agents: 15, total: 112 },
        { month: '7월', new_agents: 8, total: 120 },
      ] as any;
    }

    if (path.startsWith('/admin/revenue/failed')) {
      return [
        { id: '1', agent_name: '홍길동', amount: 15000, date: '2026-07-15' },
        { id: '2', agent_name: '김철수', amount: 10000, date: '2026-07-16' },
      ] as any;
    }

    if (path.startsWith('/admin/agents')) {
      return {
        agents: [
          { id: 'a1', agent_name: '테스트중개사1', office_name: '믿음부동산', created_at: new Date().toISOString() },
          { id: 'a2', agent_name: '테스트중개사2', office_name: '소망부동산', created_at: new Date(Date.now() - 86400000).toISOString() },
        ],
        total: 2
      } as any;
    }

    if (path.startsWith('/agents/me/qr')) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const agentCode = 'test-agent';
      return [
        { url: `${baseUrl}/form/${agentCode}`, label: '전체', category: null },
        { url: `${baseUrl}/form/${agentCode}?cat=residential`, label: '주거용', category: 'residential' },
        { url: `${baseUrl}/form/${agentCode}?cat=commercial`, label: '상업용', category: 'commercial' },
        { url: `${baseUrl}/form/${agentCode}?cat=industrial`, label: '산업용', category: 'industrial' },
        { url: `${baseUrl}/form/${agentCode}?cat=land`, label: '토지', category: 'land' }
      ] as any;
    }

    if (path === '/agents/me' && method === 'PATCH') {
      const body = JSON.parse(options?.body as string);
      mockAgent = { ...mockAgent, ...body };
      return { success: true } as any;
    }

    if (path === '/agents/me/categories' && method === 'PATCH') {
      const body = JSON.parse(options?.body as string);
      mockAgent.selected_categories = body.categories;
      return { success: true } as any;
    }

    if (path === '/billing/plan' && method === 'PATCH') {
      const body = JSON.parse(options?.body as string);
      mockAgent.subscription_plan = body.plan;
      return { success: true } as any;
    }

    if (path === '/billing/cancel' && method === 'POST') {
      mockAgent.subscription_status = 'cancelled';
      return { success: true } as any;
    }

  }

  // If not mock, pass to real API
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
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    // Mock image upload
    return { 
      id: `mock-img-${nextId++}`, 
      path: `uploads/mock-img.png`,
      signed_url: 'https://placehold.co/400' 
    } as any;
  }

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
