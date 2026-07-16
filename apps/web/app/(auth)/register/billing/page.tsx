'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              7일 무료 체험 후 자동 결제됩니다
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              체험 기간 중에는 결제가 발생하지 않으며, 언제든 해지할 수 있습니다.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <p className="text-sm text-muted-foreground">로딩 중...</p>
            </div>
          ) : agentId ? (
            <BillingRegisterButton agentId={agentId} returnPath="register" />
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
