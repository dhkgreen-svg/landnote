import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { queryKeys } from './keys';

interface InquiryDetail {
  id: string;
  inquiry_type: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  category_codes: string[];
  subcategory_codes: string[];
  tags: string[];
  transaction_types: string[];
  detailed_conditions: Record<string, unknown>;
  images: { path: string; signed_url: string | null; uploaded_at: string }[];
  status: string;
  priority: number;
  agent_memo: string | null;
  created_at: string;
  updated_at: string;
}

export function useInquiry(id: string) {
  return useQuery({
    queryKey: queryKeys.inquiries.detail(id),
    queryFn: () => apiFetch<InquiryDetail>(`/inquiries/${id}`),
    enabled: !!id,
  });
}
