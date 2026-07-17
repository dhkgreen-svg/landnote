'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useRevenueSummary,
  useRevenueHistory,
  useRevenueTrend,
  useFailedPayments,
  usePlanDistribution,
} from '@/lib/hooks/use-admin-revenue';
import { DollarSign, TrendingUp, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#2563eb', '#f59e0b', '#ef4444', '#6b7280'];

export default function AdminRevenuePage() {
  const [historyPage, setHistoryPage] = useState(1);
  const [historyFilter, setHistoryFilter] = useState('');

  const { data: summary } = useRevenueSummary();
  const { data: history } = useRevenueHistory({ status: historyFilter || undefined, page: historyPage });
  const { data: trend } = useRevenueTrend(12);
  const { data: failed } = useFailedPayments();
  const { data: planDist } = usePlanDistribution();

  const pieData = planDist
    ? Object.entries(planDist).map(([plan, statuses]) => ({
        name: plan === 'pro' ? 'Pro' : plan === 'standard' ? 'Standard' : 'Minimal',
        value: Object.values(statuses).reduce((a, b) => a + b, 0),
      }))
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">수익 관리</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summary?.mrr ?? 0).toLocaleString()}원</div>
            {summary?.mrr_diff !== undefined && (
              <p className={`text-xs ${summary.mrr_diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.mrr_diff >= 0 ? '+' : ''}{summary.mrr_diff.toLocaleString()}원 전월 대비
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">총 매출</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summary?.total_revenue ?? 0).toLocaleString()}원</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ARPU</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(summary?.arpu ?? 0).toLocaleString()}원</div>
            <p className="text-xs text-muted-foreground">활성 구독자 {summary?.active_subscribers ?? 0}명</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">월별 매출 추이</CardTitle></CardHeader>
          <CardContent>
            {trend && trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString()}원`} />
                  <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">데이터 없음</p>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader><CardTitle className="text-base">플랜별 가입자 분포</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">데이터 없음</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Failed Payments */}
      {(failed?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base text-red-600">실패 결제</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left">중개사</th>
                <th className="px-4 py-3 text-left">사유</th>
                <th className="px-4 py-3 text-right">금액</th>
                <th className="px-4 py-3 text-left">일시</th>
              </tr></thead>
              <tbody>
                {(failed ?? []).slice(0, 10).map((f: any) => (
                  <tr key={f.id} className="border-b">
                    <td className="px-4 py-3">{f.agents?.agent_name ?? '-'}</td>
                    <td className="px-4 py-3 text-red-600">{f.failure_reason ?? '-'}</td>
                    <td className="px-4 py-3 text-right">{(f.amount ?? 0).toLocaleString()}원</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(f.billed_at).toLocaleDateString('ko-KR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">결제 이력</CardTitle>
          <select
            value={historyFilter}
            onChange={(e) => { setHistoryFilter(e.target.value); setHistoryPage(1); }}
            className="rounded-md border px-2 py-1 text-sm"
          >
            <option value="">전체</option>
            <option value="success">성공</option>
            <option value="failed">실패</option>
          </select>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left">중개사</th>
              <th className="px-4 py-3 text-left">플랜</th>
              <th className="px-4 py-3 text-right">금액</th>
              <th className="px-4 py-3 text-left">상태</th>
              <th className="px-4 py-3 text-left">일시</th>
            </tr></thead>
            <tbody>
              {(history?.histories ?? []).map((h: any) => (
                <tr key={h.id} className="border-b">
                  <td className="px-4 py-3">{h.agents?.agent_name ?? '-'}</td>
                  <td className="px-4 py-3">{h.plan}</td>
                  <td className="px-4 py-3 text-right">{(h.amount ?? 0).toLocaleString()}원</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      h.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {h.status === 'success' ? '성공' : '실패'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(h.billed_at).toLocaleDateString('ko-KR')}</td>
                </tr>
              ))}
              {(history?.histories ?? []).length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">결제이력 없음</td></tr>
              )}
            </tbody>
          </table>
          {history && history.total_pages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-sm text-muted-foreground">총 {history.total}건</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={historyPage <= 1} onClick={() => setHistoryPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center text-sm">{historyPage} / {history.total_pages}</span>
                <Button variant="outline" size="sm" disabled={historyPage >= history.total_pages} onClick={() => setHistoryPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
