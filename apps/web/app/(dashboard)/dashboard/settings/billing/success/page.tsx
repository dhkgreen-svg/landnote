'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function SettingsBillingSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    async function registerBillingKey() {
      const authKey = searchParams.get('authKey');

      if (!authKey) {
        setError('인증 키가 없습니다. 다시 시도해주세요.');
        setProcessing(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setError('세션이 만료되었습니다. 다시 로그인해주세요.');
          setProcessing(false);
          return;
        }

        const res = await fetch(`${API_URL}/billing/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ authKey }),
        });

        const json = await res.json();

        if (!res.ok || json.ok === false) {
          setError(json.error?.message ?? '빌링키 등록에 실패했습니다');
          setProcessing(false);
          return;
        }

        router.push('/dashboard/settings');
      } catch {
        setError('네트워크 오류가 발생했습니다');
        setProcessing(false);
      }
    }

    registerBillingKey();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">{error}</p>
            <button
              className="mt-4 text-sm text-primary underline-offset-4 hover:underline"
              onClick={() => router.push('/dashboard/settings')}
            >
              다시 시도
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          {processing && (
            <div className="space-y-3">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <p className="text-sm text-muted-foreground">
                카드 등록을 처리하고 있습니다...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsBillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="space-y-3">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <p className="text-sm text-muted-foreground">처리 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <SettingsBillingSuccessContent />
    </Suspense>
  );
}
