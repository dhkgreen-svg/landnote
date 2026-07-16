import { createClient } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// --- IN-MEMORY DB ---
let mockListings: any[] = [];
let mockInquiries: any[] = [];
let mockMatchingInquiries: any[] = [];
let mockMatchingResults: any[] = [];
let nextId = 1;

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET';
  
  if (path === '/auth/me') {
    return {
      id: 'mock-agent',
      agent_code: 'test-agent',
      agent_name: '테스트 중개사',
      office_name: '테스트 부동산',
      phone: '010-1234-5678',
      selected_categories: [
        '아파트 (주상복합 포함)',
        '요식업',
        '일반사무실',
      ],
      subscription_plan: 'pro'
    } as any;
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

  // If not mock, pass to real API (won't happen in our testing right now)
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
  // Mock image upload
  return { 
    id: `mock-img-${nextId++}`, 
    path: `uploads/mock-img.png`,
    signed_url: 'https://placehold.co/400' 
  } as any;
}
