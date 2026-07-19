'use client';

import { useState, useEffect } from 'react';
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
  pro: string;
}

const features: PlanFeature[] = [
  {
    label: '카테고리',
    pro: `${PLAN_LIMITS.pro.max_categories}개 전체`,
  },
  {
    label: '매물 등록',
    pro: '무제한',
  },
  {
    label: 'QR코드',
    pro: `${PLAN_LIMITS.pro.max_qr_codes}개`,
  },
  {
    label: '매물당 이미지',
    pro: `${PLAN_LIMITS.pro.max_images_per_listing}장`,
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

  useEffect(() => {
    setField('selected_plan', 'pro');
  }, [setField]);

  const handleNext = async () => {
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
    <div className="w-full max-w-4xl">
      <StepIndicator current={2} />

      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold">플랜을 선택하세요</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          7일 무료 체험 후 자동 결제됩니다. 언제든 해지 가능합니다.
        </p>
      </div>

      <div className="flex justify-center mt-8">

        {/* Pro Plan */}
        <Card
          className="relative max-w-sm w-full cursor-pointer transition-all border-primary ring-2 ring-primary"
          onClick={() => setField('selected_plan', 'pro')}
        >
          <Badge className="absolute -top-2.5 right-4">기본 요금제</Badge>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">프로</CardTitle>
            <p className="text-2xl font-bold">
              {formatPrice(PLAN_PRICE.pro)}
              <span className="text-sm font-normal text-muted-foreground">원/월</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">모든 분야를 다루는 경우</p>
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
          {loading ? '처리 중...' : '선택한 플랜으로 계속'}
        </Button>
      </div>
    </div>
  );
}
