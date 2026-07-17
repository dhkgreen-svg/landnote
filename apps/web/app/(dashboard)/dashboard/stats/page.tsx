'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useInquiryTrend,
  useFunnel,
  useListingStatus,
  useListingCategories,
  useContractsDuration,
} from '@/lib/hooks/queries';
import { Building2, Users } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface CategoryStat {
  month: string;
  category: string;
  count: number;
}

type Period = 'week' | 'month' | 'year';

// ── 상수 ──────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  new: '신규', contacted: '연락완료', viewing: '방문예정',
  negotiating: '협상중', contracted: '계약완료', closed: '종료',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e', pending: '#eab308', contracted: '#3b82f6', closed: '#6b7280',
};

const STATUS_LABELS_LISTING: Record<string, string> = {
  active: '활성', pending: '대기', contracted: '계약', closed: '종료',
};

const CATEGORY_COLORS: Record<string, string> = {
  residential: '#6366f1', commercial: '#f59e0b', industrial: '#14b8a6', land: '#f97316',
};

const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거', commercial: '상업', industrial: '산업', land: '토지',
};

const PERIOD_LABELS: Record<Period, string> = {
  week: '주간', month: '월간', year: '연간',
};

// ── 유틸 ──────────────────────────────────────────────

function getDateRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();
  let start: Date;
  switch (period) {
    case 'week':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7 * 12);
      break;
    case 'month':
      start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      break;
    case 'year':
      start = new Date(now.getFullYear() - 3, 0, 1);
      break;
  }
  return { start: start.toISOString(), end };
}

function pivotCategoryData(raw: CategoryStat[]): Record<string, unknown>[] {
  const map = new Map<string, Record<string, unknown>>();
  for (const { month, category, count } of raw) {
    if (!map.has(month)) map.set(month, { month });
    map.get(month)![category] = count;
  }
  return [...map.values()];
}

// ── 차트 래퍼 ──────────────────────────────────────────

function ChartCard({
  title,
  loading,
  empty,
  children,
}: {
  title: string;
  loading: boolean;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[220px] w-full" />
        ) : empty ? (
          <div className="flex h-[220px] items-center justify-center">
            <p className="text-sm text-muted-foreground">데이터가 없습니다</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

// ── 메인 ──────────────────────────────────────────────

export default function StatsPage() {
  const [period, setPeriod] = useState<Period>('month');

  const { start, end } = useMemo(() => getDateRange(period), [period]);
  const params = `start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;

  // 기간 의존 데이터
  const { data: inquiryData = [], isLoading: inquiryLoading } = useInquiryTrend(params);
  const { data: funnelData = [], isLoading: funnelLoading } = useFunnel(params);
  const { data: categoryData = [], isLoading: categoryLoading } = useListingCategories(params);
  const periodLoading = inquiryLoading || funnelLoading || categoryLoading;

  // 기간 무관 데이터
  const { data: statusData = [], isLoading: statusLoading } = useListingStatus();
  const { data: durationData = [], isLoading: durationLoading } = useContractsDuration();
  const staticLoading = statusLoading || durationLoading;

  const pivotedCategories = pivotCategoryData(categoryData);
  const categoryKeys = [...new Set(categoryData.map(d => d.category))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">통계</h1>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <TabsTrigger key={p} value={p}>{PERIOD_LABELS[p]}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-8 mt-6">
        {/* 매물 통계 Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> 매물 통계
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* 매물 상태 분포 */}
            <ChartCard title="매물 상태 분포" loading={staticLoading} empty={statusData.length === 0}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    label={({ status, count }: { status: string; count: number }) =>
                      `${STATUS_LABELS_LISTING[status] ?? status} ${count}`
                    }
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#9ca3af'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [value, STATUS_LABELS_LISTING[name] ?? name]} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 카테고리별 등록 */}
            <ChartCard title="카테고리별 매물 등록" loading={periodLoading} empty={categoryData.length === 0}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={pivotedCategories}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip formatter={(value: number, name: string) => [value, CATEGORY_LABELS[name] ?? name]} />
                  <Legend formatter={(value: string) => CATEGORY_LABELS[value] ?? value} />
                  {categoryKeys.map(key => (
                    <Bar key={key} dataKey={key} fill={CATEGORY_COLORS[key] ?? '#9ca3af'} radius={[2, 2, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>

        {/* 매수 통계 Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> 매수 통계
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* 신규 매수 고객 유입 추이 */}
            <ChartCard title="신규 매수 고객 유입 추이" loading={periodLoading} empty={inquiryData.length === 0}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={inquiryData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip formatter={(value: number) => [`${value}명`, '신규 매수']} />
                  <Line type="monotone" dataKey="looking_for" name="신규 매수 고객"
                    stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 매수 전환 퍼널 */}
            <ChartCard title="매수 전환 퍼널" loading={periodLoading} empty={funnelData.length === 0}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={funnelData.map(d => ({ ...d, label: STATUS_LABELS[d.status] ?? d.status }))}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [`${value}명`, '고객 수']}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]}
                    label={{ position: 'top', fontSize: 10, formatter: (v: number) => v > 0 ? v : '' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* 계약 소요 기간 */}
            <ChartCard title="계약 소요 기간 분포" loading={staticLoading} empty={durationData.length === 0}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={durationData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="duration_range" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(value: number) => [`${value}건`, '계약 수']} />
                  <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </section>
      </div>
    </div>
  );
}
