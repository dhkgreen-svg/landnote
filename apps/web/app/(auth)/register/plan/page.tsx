'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRegisterStore } from '@/lib/stores/register-store';
import { createClient } from '@/lib/supabase/client';
import { PLAN_LIMITS, PLAN_PRICE } from '@landnote/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StepIndicator } from '../step-indicator';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface PlanFeature {
  label: string;
  starter: string;
  pro: string;
}

const features: PlanFeature[] = [
  {
    label: '카테고리',
    starter: `${PLAN_LIMITS.starter.max_categories}개`,
    pro: `${PLAN_LIMITS.pro.max_categories}개 전체`,
  },
  {
    label: '매물 등록',
    starter: '무제한',
    pro: '무제한',
  },
  {
    label: 'QR코드',
    starter: `${PLAN_LIMITS.starter.max_qr_codes}개`,
    pro: `${PLAN_LIMITS.pro.max_qr_codes}개`,
  },
  {
    label: '매물당 이미지',
    starter: `${PLAN_LIMITS.starter.max_images_per_listing}장`,
    pro: `${PLAN_LIMITS.pro.max_images_per_listing}장`,
  },
  {
    label: '카테고리 변경',
    starter: '월 1회',
    pro: '무제한',
  },
];

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR');
}

export default function PlanSelectionPage() {
  const router = useRouter();
  const { selected_plan, setField } = useRegisterStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!selected_plan) return;
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('세션이 만료되었습니다. 다시 로그인해주세요.');
        return;
      }

      const res = await fetch(`${API_URL}/agents/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ subscription_plan: selected_plan }),
      });

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        setError(json.error?.message ?? '플랜 변경에 실패했습니다');
        return;
      }

      router.push('/register/billing');
    } catch {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <StepIndicator current={2} />

      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold">플랜을 선택하세요</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          7일 무료 체험 후 자동 결제됩니다. 언제든 해지 가능합니다.
        </p>
        <p className="mt-2 text-sm font-medium text-primary">
          월 {(PLAN_PRICE.pro - PLAN_PRICE.starter).toLocaleString()}원 차이로 카테고리·QR·등록 한도가 크게 달라집니다
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Starter Plan */}
        <Card
          className={`cursor-pointer transition-all ${
            selected_plan === 'starter'
              ? 'border-primary ring-2 ring-primary'
              : 'hover:border-primary/50'
          }`}
          onClick={() => setField('selected_plan', 'starter')}
        >
          <CardHeader className="text-center">
            <CardTitle className="text-lg">스타터</CardTitle>
            <p className="text-2xl font-bold">
              {formatPrice(PLAN_PRICE.starter)}
              <span className="text-sm font-normal text-muted-foreground">원/월</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">한두 분야만 다루는 경우</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {features.map((f) => (
                <li key={f.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium">{f.starter}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card
          className={`relative cursor-pointer transition-all ${
            selected_plan === 'pro'
              ? 'border-primary ring-2 ring-primary'
              : 'hover:border-primary/50'
          }`}
          onClick={() => setField('selected_plan', 'pro')}
        >
          <Badge className="absolute -top-2.5 right-4">추천</Badge>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">프로</CardTitle>
            <p className="text-2xl font-bold">
              {formatPrice(PLAN_PRICE.pro)}
              <span className="text-sm font-normal text-muted-foreground">원/월</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">주거·상업·산업·토지를 함께 다루는 경우</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {features.map((f) => (
                <li key={f.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{f.label}</span>
                  <span className="font-medium">{f.pro}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-destructive">{error}</p>
      )}

      <div className="mt-6 flex justify-center">
        <Button
          size="lg"
          className="w-full max-w-xs"
          disabled={!selected_plan || loading}
          onClick={handleNext}
        >
          {loading ? '처리 중...' : selected_plan === 'starter' ? 'Starter로 계속' : selected_plan === 'pro' ? 'PRO로 계속' : '플랜을 선택하세요'}
        </Button>
      </div>
    </div>
  );
}
