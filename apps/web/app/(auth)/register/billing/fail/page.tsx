'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function BillingFailContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('code') ?? '';
  const errorMessage = searchParams.get('message') ?? '카드 등록에 실패했습니다';

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-xl text-destructive">!</span>
          </div>
          <CardTitle className="text-lg">카드 등록 실패</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          {errorCode && (
            <p className="text-xs text-muted-foreground">
              오류 코드: {errorCode}
            </p>
          )}
          <Button asChild className="w-full">
            <Link href="/register/billing">다시 시도</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingFailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">로딩 중...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <BillingFailContent />
    </Suspense>
  );
}
