'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BillingRegisterButton } from '@/components/dashboard/BillingRegisterButton';
import { StepIndicator } from '../step-indicator';

export default function BillingPage() {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgent() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data: agent } = await supabase
          .from('agents')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (agent) {
          setAgentId(agent.id);
        }
      }
      setLoading(false);
    }

    fetchAgent();
  }, []);

  return (
    <div className="w-full max-w-md">
      <StepIndicator current={3} />

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">카드 등록</CardTitle>
          <CardDescription>
            결제 수단을 등록해주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <p className="text-sm text-muted-foreground">로딩 중...</p>
            </div>
          ) : agentId ? (
            <div className="flex flex-col gap-3 pt-2">
              <BillingRegisterButton agentId={agentId} returnPath="register" />
              <Button
                asChild
                className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm py-6 shadow-md transition-all border-none"
              >
                <Link href="/register/done">
                  결제 수단은 나중에 등록할게요 (30일 무료 체험 후 결제할게요)
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-center text-sm text-destructive">
              세션 정보를 불러올 수 없습니다. 다시 로그인해주세요.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
