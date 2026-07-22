import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { queryKeys } from './keys';

interface InquiryItem {
  id: string;
  inquiry_type: string;
  customer_name: string | null;
  customer_phone: string | null;
  category_codes: string[];
  subcategory_codes: string[];
  transaction_types: string[];
  status: string;
  created_at: string;
}

interface InquiryListResponse {
  items: InquiryItem[];
  total: number;
}

interface InquiryListParams {
  page: number;
  limit: number;
  status?: string;
  inquiry_type?: string;
  category_code?: string;
}

export function useInquiries(params: InquiryListParams) {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params.page));
  searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);
  if (params.inquiry_type) searchParams.set('inquiry_type', params.inquiry_type);
  if (params.category_code) searchParams.set('category_code', params.category_code);

  return useQuery({
    queryKey: queryKeys.inquiries.list(params),
    queryFn: () => apiFetch<InquiryListResponse>(`/inquiries?${searchParams.toString()}`),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useRecentInquiries() {
  return useQuery({
    queryKey: queryKeys.inquiries.list({ page: 1, limit: 5 }),
    queryFn: () => apiFetch<InquiryListResponse>('/inquiries?limit=5'),
    staleTime: 2 * 60 * 1000,
  });
}
