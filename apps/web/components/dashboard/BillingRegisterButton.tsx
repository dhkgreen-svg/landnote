'use client';

import { useState } from 'react';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { Button } from '@/components/ui/button';

interface Props {
  agentId: string;
  returnPath: 'register' | 'settings';
}

export function BillingRegisterButton({ agentId, returnPath }: Props) {
  const [loading, setLoading] = useState(false);

  const successUrl =
    returnPath === 'register'
      ? `${process.env.NEXT_PUBLIC_APP_URL}/register/billing/success`
      : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing/success`;

  const failUrl =
    returnPath === 'register'
      ? `${process.env.NEXT_PUBLIC_APP_URL}/register/billing/fail`
      : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing/fail`;

  const handleRegister = async () => {
    setLoading(true);
    try {
      const toss = await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!,
      );
      await toss.requestBillingAuth('카드', {
        customerKey: agentId,
        successUrl,
        failUrl,
      });
    } catch {
      // Toss SDK가 팝업을 닫거나 사용자가 취소한 경우
      setLoading(false);
    }
  };

  return (
    <Button
      className="w-full"
      size="lg"
      onClick={handleRegister}
      disabled={loading}
    >
      {loading ? '카드 등록 중...' : '카드 등록하기'}
    </Button>
  );
}
