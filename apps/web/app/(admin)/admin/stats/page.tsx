'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useAccessStats,
  useAccessTrend,
  useAgentGrowth,
  useTotalInquiryStats,
  useTotalListingStats,
} from '@/lib/hooks/use-admin-stats';
import { Activity, Users, MessageSquare, Building2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const INQUIRY_STATUS_LABEL: Record<string, string> = {
  new: '신규',
  contacted: '연락완료',
  viewing: '방문예정',
  negotiating: '협의중',
  contracted: '계약완료',
  closed: '종료',
};

const LISTING_STATUS_LABEL: Record<string, string> = {
  active: '활성',
  premium: '우수',
  in_progress: '진행 중',
  hold: '보류',
  contracted: '계약완료',
  closed: '종료',
};

export default function AdminStatsPage() {
  const { data: access } = useAccessStats();
  const { data: accessTrend } = useAccessTrend(30);
  const { data: growth } = useAgentGrowth();
  const { data: inquiryStats } = useTotalInquiryStats();
  const { data: listingStats } = useTotalListingStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">접속 통계</h1>

      {/* Access Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">DAU (일간)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{access?.dau ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">WAU (주간)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{access?.wau ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MAU (월간)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{access?.mau ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily Access Trend */}
        <Card>
          <CardHeader><CardTitle className="text-base">일별 접속자 추이 (30일)</CardTitle></CardHeader>
          <CardContent>
            {accessTrend && accessTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={accessTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="unique_agents" stroke="#2563eb" strokeWidth={2} name="접속자" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">데이터 없음</p>
            )}
          </CardContent>
        </Card>

        {/* Agent Growth */}
        <Card>
          <CardHeader><CardTitle className="text-base">월별 가입자 증가 (12개월)</CardTitle></CardHeader>
          <CardContent>
            {growth && growth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={growth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="new_agents" fill="#2563eb" name="신규 가입" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">데이터 없음</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">전체 문의 현황</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inquiryStats?.total ?? 0}건</div>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              {inquiryStats && Object.entries(inquiryStats)
                .filter(([k]) => k !== 'total')
                .map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span>{INQUIRY_STATUS_LABEL[status] ?? status}</span>
                    <span>{count}건</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">전체 매물 현황</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listingStats?.total ?? 0}건</div>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              {listingStats && Object.entries(listingStats)
                .filter(([k]) => k !== 'total')
                .map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span>{LISTING_STATUS_LABEL[status] ?? status}</span>
                    <span>{count}건</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
