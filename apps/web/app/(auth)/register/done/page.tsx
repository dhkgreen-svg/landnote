'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRegisterStore } from '@/lib/stores/register-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StepIndicator } from '../step-indicator';

export default function RegisterDonePage() {
  const registerStore = useRegisterStore();
  const [agentName, setAgentName] = useState(registerStore.agent_name);

  useEffect(() => {
    async function fetchAgentName() {
      if (agentName) return;

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data: agent } = await supabase
          .from('agents')
          .select('agent_name')
          .eq('user_id', session.user.id)
          .single();

        if (agent) {
          setAgentName(agent.agent_name);
        }
      }
    }

    fetchAgentName();
  }, [agentName]);

  useEffect(() => {
    return () => {
      registerStore.reset();
    };
  }, [registerStore]);

  return (
    <div className="w-full max-w-md">
      <StepIndicator current={4} />

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <span className="text-3xl">&#10003;</span>
          </div>
          <CardTitle className="text-xl">
            환영합니다{agentName ? `, ${agentName}` : ''} 중개사님!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">
              7일 무료 체험이 시작되었습니다
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              체험 기간 동안 모든 기능을 자유롭게 사용해보세요.
            </p>
          </div>

          <Button asChild size="lg" className="w-full">
            <Link href="/dashboard">대시보드로 이동</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
