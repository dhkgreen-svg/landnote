'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

function DoneContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const agentCode = params.agentCode as string;
  const imgErr = searchParams.get('imgErr');
  const [agentInfo, setAgentInfo] = useState<{
    agentName: string;
    officeName: string | null;
  } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`landnote_agent_${agentCode}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setAgentInfo({
        agentName: parsed.agentName,
        officeName: parsed.officeName,
      });
    }
  }, [agentCode]);

  return (
    <div className="flex flex-col items-center pt-8">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl font-bold text-green-600 shadow-lg shadow-green-100">
        ✓
      </div>

      <h2 className="mb-3 text-2xl font-bold text-foreground">접수가 완료되었습니다</h2>
      <p className="mb-8 text-center text-base text-muted-foreground">
        중개사가 확인 후 연락드리겠습니다
      </p>

      {imgErr && (
        <div className="mb-6 w-full rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
          접수는 완료되었으나 이미지 {imgErr}건 업로드에 실패했습니다.
        </div>
      )}

      {agentInfo && (
        <Card className="w-full border-primary/10 bg-white shadow-sm">
          <CardContent className="p-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">담당 중개사</h3>
            <p className="text-base font-bold">
              {agentInfo.officeName || `${agentInfo.agentName} 중개사`}
            </p>
            {agentInfo.officeName && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {agentInfo.agentName} 중개사
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function DonePage() {
  return (
    <Suspense>
      <DoneContent />
    </Suspense>
  );
}
