'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAgent } from '@/lib/hooks/use-agent';
import { TRANSACTION_TYPE, CATEGORY_CODE, SUBCATEGORY_LABELS, SUBCATEGORIES } from '@landnote/shared';
import type { TransactionType } from '@landnote/shared';
import { apiFetch } from '@/lib/api';

const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거용',
  commercial: '상업용',
  industrial: '공업용',
  land: '토지',
};

const TX_LABELS: Record<TransactionType, string> = {
  sale: '매매',
  jeonse: '전세',
  monthly_rent: '월세',
  premium_transfer: '권리금양도',
};

export default function NewInquiryPage() {
  const router = useRouter();
  const { agent } = useAgent();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [categoryCodes, setCategoryCodes] = useState<string[]>([]);
  const [subcategoryCodes, setSubcategoryCodes] = useState<string[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const toggleArray = (arr: string[], val: string, setter: (a: string[]) => void) => {
    if (arr.includes(val)) {
      setter(arr.filter(x => x !== val));
    } else {
      setter([...arr, val]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || categoryCodes.length === 0 || transactionTypes.length === 0) {
      setError('이름, 연락처, 찾는 매물 종류, 거래 방식을 모두 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      await apiFetch('/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          inquiry_type: 'looking_for',
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || undefined,
          category_codes: categoryCodes,
          subcategory_codes: subcategoryCodes,
          transaction_types: transactionTypes,
          detailed_conditions: { notes },
          otpCode: undefined, // Not needed for agent submission, handled by backend createByAgent
        }),
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">매수 고객 등록</h1>
        <p className="text-muted-foreground mt-1">사무소에 방문하거나 연락한 매수 고객을 직접 등록합니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">고객 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">이름 (또는 가명) *</Label>
              <Input
                id="name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="예: 홍길동"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">연락처 *</Label>
              <Input
                id="phone"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="010-0000-0000"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">찾는 매물 조건</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>어떤 종류의 매물을 찾으시나요? * (다중 선택 가능)</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <Badge
                    key={val}
                    variant={categoryCodes.includes(val) ? 'default' : 'outline'}
                    className="cursor-pointer text-sm py-1.5 px-3"
                    onClick={() => toggleArray(categoryCodes, val, setCategoryCodes)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {categoryCodes.length > 0 && (
              <div className="space-y-3">
                <Label>상세 유형 (선택)</Label>
                <div className="flex flex-wrap gap-2">
                  {categoryCodes.flatMap(cat => Object.keys(SUBCATEGORIES[cat as keyof typeof SUBCATEGORIES] || {})).map(sub => (
                    <Badge
                      key={sub}
                      variant={subcategoryCodes.includes(sub) ? 'default' : 'outline'}
                      className="cursor-pointer font-normal"
                      onClick={() => toggleArray(subcategoryCodes, sub, setSubcategoryCodes)}
                    >
                      {SUBCATEGORY_LABELS[sub] ?? sub}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label>거래 방식 * (다중 선택 가능)</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TX_LABELS).map(([val, label]) => (
                  <Badge
                    key={val}
                    variant={transactionTypes.includes(val) ? 'default' : 'outline'}
                    className="cursor-pointer text-sm py-1.5 px-3"
                    onClick={() => toggleArray(transactionTypes, val, setTransactionTypes)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">추가 조건 (예산 등)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="예: 보증금 5천 / 월세 50 이하, 주차 가능 필수"
              />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '등록 중...' : '매수 고객 등록'}
          </Button>
        </div>
      </form>
    </div>
  );
}
