'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useInquiry, useUpdateInquiry } from '@/lib/hooks/queries';
import { SUBCATEGORY_LABELS } from '@landnote/shared';
import { ArrowLeft } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  new: '신규', contacted: '연락완료', viewing: '방문예정',
  negotiating: '협상중', contracted: '계약완료', closed: '종료',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  viewing: 'bg-purple-100 text-purple-700',
  negotiating: 'bg-orange-100 text-orange-700',
  contracted: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거', commercial: '상업', industrial: '산업', land: '토지',
};

const TX_LABELS: Record<string, string> = {
  sale: '매매', jeonse: '전세', monthly_rent: '월세', premium_transfer: '권리금양도',
};

const PRICE_LABELS: Record<string, string> = {
  price_sale: '매매가', deposit: '보증금', monthly_rent: '월세',
  maintenance_fee: '관리비', premium_price: '권리금', contract_remaining_months: '잔여 계약 개월',
};

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: inquiry, isLoading: loading } = useInquiry(id);
  const updateMutation = useUpdateInquiry(id);
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (inquiry) {
      setMemo(inquiry.agent_memo ?? '');
      setStatus(inquiry.status);
    }
  }, [inquiry]);

  const handleSave = () => {
    updateMutation.mutate({ status, agent_memo: memo });
  };
  const saving = updateMutation.isPending;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        문의를 찾을 수 없습니다
      </div>
    );
  }

  const priceKeys = Object.keys(inquiry.detailed_conditions).filter(
    k => PRICE_LABELS[k] !== undefined,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/inquiries')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">문의 상세</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">고객 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">이름</span>
              <span className="text-sm font-medium">{inquiry.customer_name ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">전화번호</span>
              {inquiry.customer_phone ? (
                <a href={`tel:${inquiry.customer_phone}`} className="text-sm font-medium text-blue-600 underline">
                  {inquiry.customer_phone}
                </a>
              ) : (
                <span className="text-sm font-medium">-</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">이메일</span>
              <span className="text-sm font-medium">{inquiry.customer_email ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">접수일</span>
              <span className="text-sm">{new Date(inquiry.created_at).toLocaleString('ko-KR')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">접수 조건</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">유형</span>
              <span className="text-sm font-medium">
                {inquiry.inquiry_type === 'looking_for' ? '매물 찾기' : '매물 내놓기'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">카테고리</span>
              <span className="text-sm">
                {inquiry.category_codes.map(c => CATEGORY_LABELS[c] ?? c).join(', ')}
              </span>
            </div>
            {inquiry.subcategory_codes.length > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">세부 분류</span>
                <span className="text-sm">{inquiry.subcategory_codes.map(c => SUBCATEGORY_LABELS[c] ?? c).join(', ')}</span>
              </div>
            )}
            {inquiry.tags.length > 0 && (
              <div>
                <span className="mb-1 block text-sm text-muted-foreground">태그</span>
                <div className="flex flex-wrap gap-1">
                  {inquiry.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">거래유형</span>
              <span className="text-sm">
                {inquiry.transaction_types.map(t => TX_LABELS[t] ?? t).join(', ')}
              </span>
            </div>
            {priceKeys.length > 0 && priceKeys.map(key => (
              <div key={key} className="flex justify-between">
                <span className="text-sm text-muted-foreground">{PRICE_LABELS[key]}</span>
                <span className="text-sm font-medium">
                  {typeof inquiry.detailed_conditions[key] === 'number'
                    ? Number(inquiry.detailed_conditions[key]).toLocaleString('ko-KR') + '원'
                    : String(inquiry.detailed_conditions[key])}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Images */}
      {inquiry.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">첨부 이미지</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {inquiry.images.map((img, i) => (
                <div key={i} className="overflow-hidden rounded-lg border">
                  {img.signed_url ? (
                    <img
                      src={img.signed_url}
                      alt={`첨부 이미지 ${i + 1}`}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground">
                      이미지 로드 실패
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status & Memo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">상태 관리</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">상태</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">메모</label>
            <Textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="이 문의에 대한 메모를 작성하세요"
              rows={4}
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
