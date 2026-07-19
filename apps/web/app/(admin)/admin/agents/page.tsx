'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAdminAgents } from '@/lib/hooks/use-admin-agents';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  trial: '체험판',
  active: '활성',
  expired: '만료',
  cancelled: '해지',
};

const PLAN_LABELS: Record<string, string> = {
  minimal: 'Minimal',
  standard: 'Standard',
  pro: 'Pro',
};

import { Suspense } from 'react';

export default function AdminAgentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-muted-foreground">로딩 중...</div>}>
      <AdminAgentsContent />
    </Suspense>
  );
}

function AdminAgentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams?.get('status') || '');
  const [plan, setPlan] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const s = searchParams?.get('status');
    if (s && s !== status) {
      setStatus(s);
      setPage(1);
    }
  }, [searchParams]);

  const { data, isLoading } = useAdminAgents({
    search: search || undefined,
    status: status || undefined,
    plan: plan || undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">중개사 관리</h1>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="이름, 이메일, 사무소 검색"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">전체 상태</option>
            <option value="trial">체험판</option>
            <option value="active">활성</option>
            <option value="expired">만료</option>
            <option value="cancelled">해지</option>
          </select>
          <select
            value={plan}
            onChange={(e) => { setPlan(e.target.value); setPage(1); }}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">전체 플랜</option>
            <option value="minimal">Minimal</option>
            <option value="standard">Standard</option>
            <option value="pro">Pro</option>
          </select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground">로딩 중...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">사무소</th>
                      <th className="px-4 py-3 text-left font-medium">이름</th>
                      <th className="px-4 py-3 text-left font-medium">전화번호(이메일)</th>
                      <th className="px-4 py-3 text-left font-medium">플랜</th>
                      <th className="px-4 py-3 text-left font-medium">상태</th>
                      <th className="px-4 py-3 text-left font-medium">가입일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.agents ?? []).map((agent: any) => (
                      <tr 
                        key={agent.id} 
                        className="border-b hover:bg-muted/30 cursor-pointer"
                        onClick={() => router.push(`/admin/agents/${agent.id}`)}
                      >
                        <td className="px-4 py-3 font-medium">
                          {agent.office_name || '-'}
                        </td>
                        <td className="px-4 py-3">{agent.agent_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {agent.phone ? `${agent.phone} (${agent.email})` : agent.email}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            agent.subscription_plan === 'pro'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {PLAN_LABELS[agent.subscription_plan] ?? agent.subscription_plan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            agent.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                            agent.subscription_status === 'trial' ? 'bg-yellow-100 text-yellow-700' :
                            agent.subscription_status === 'expired' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {STATUS_LABELS[agent.subscription_status] ?? agent.subscription_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(agent.created_at).toLocaleDateString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                    {(data?.agents ?? []).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                          조건에 맞는 중개사가 없습니다
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.total_pages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    총 {data.total}명 / {data.total_pages}페이지
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="flex items-center text-sm">{page} / {data.total_pages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.total_pages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
