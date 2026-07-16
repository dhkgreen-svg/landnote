'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminKpis, useAgentGrowth } from '@/lib/hooks/use-admin-stats';
import { useFailedPayments } from '@/lib/hooks/use-admin-revenue';
import { useAdminAgents } from '@/lib/hooks/use-admin-agents';
import { Users, UserCheck, UserPlus, DollarSign, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function KpiCard({ title, value, diff, icon: Icon, prefix }: {
  title: string;
  value: number;
  diff?: number;
  icon: any;
  prefix?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{value.toLocaleString()}
        </div>
        {diff !== undefined && (
          <p className={`text-xs ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {diff >= 0 ? '+' : ''}{diff} 전월 대비
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data: kpis, isLoading: kpisLoading } = useAdminKpis();
  const { data: growth } = useAgentGrowth();
  const { data: failed } = useFailedPayments();
  const { data: recentAgents } = useAdminAgents({ page: 1, limit: 5 });

  if (kpisLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="총 중개사"
          value={kpis?.total_agents ?? 0}
          icon={Users}
        />
        <KpiCard
          title="활성 중개사"
          value={kpis?.active_agents ?? 0}
          icon={UserCheck}
        />
        <KpiCard
          title="이번달 신규"
          value={kpis?.new_agents_this_month ?? 0}
          diff={kpis?.new_agents_diff}
          icon={UserPlus}
        />
        <KpiCard
          title="MRR"
          value={kpis?.mrr ?? 0}
          prefix="₩"
          icon={DollarSign}
        />
      </div>

      {/* Failed Payments Alert */}
      {(failed?.length ?? 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-red-700">
              실패 결제 {failed!.length}건이 있습니다
            </span>
            <Link href="/admin/revenue" className="ml-auto text-sm text-red-600 underline">
              확인하기
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">가입자 증가 추이</CardTitle>
          </CardHeader>
          <CardContent>
            {growth && growth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={growth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">데이터 없음</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Agents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">최근 가입 중개사</CardTitle>
            <Link href="/admin/agents" className="text-sm text-blue-600 underline">
              전체보기
            </Link>
          </CardHeader>
          <CardContent>
            {recentAgents?.agents && recentAgents.agents.length > 0 ? (
              <div className="space-y-3">
                {recentAgents.agents.map((agent: any) => (
                  <div key={agent.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{agent.agent_name}</span>
                      <span className="ml-2 text-muted-foreground">{agent.office_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(agent.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">가입한 중개사가 없습니다</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
