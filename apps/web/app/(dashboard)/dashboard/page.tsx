'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Users, FileCheck, Lock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSummary } from '@/lib/hooks/queries';
import { useAgent } from '@/lib/hooks/use-agent';
import { UpgradeModal } from '@/components/dashboard/UpgradeModal';

const STATUS_LABELS: Record<string, string> = {
  new: '신규',
  contacted: '연락완료',
  viewing: '방문예정',
  negotiating: '협상중',
  contracted: '계약완료',
  closed: '종료',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  viewing: 'bg-purple-100 text-purple-700',
  negotiating: 'bg-orange-100 text-orange-700',
  contracted: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거',
  commercial: '상업',
  industrial: '산업',
  land: '토지',
};

const CATEGORY_ICONS: Record<string, string> = {
  residential: '🏠',
  commercial: '🏬',
  industrial: '🏭',
  land: '🌳',
};

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useSummary();
  const { agent } = useAgent();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const loading = summaryLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* 1. 매물 현황 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> 매물 현황
          </h2>
          <Link href="/dashboard/listings/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> 매물 입력하기
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="hover:border-primary transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">신규 매물</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{summary?.listings?.new_count ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="hover:border-primary transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">총 매물</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary?.listings?.total_count ?? 0}</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 2. 매수 현황 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> 매수 현황
          </h2>
          <Link href="/dashboard/inquiries/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> 매수 입력하기
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="hover:border-primary transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">신규 매수 문의</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{summary?.buyers?.new_count ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="hover:border-primary transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">매수 고객 전체</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary?.buyers?.total_count ?? 0}</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Category Summary */}
      {agent && summary?.categories && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">나의 전문 분야</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['residential', 'commercial', 'industrial', 'land'] as const).map(code => {
                const isSelected = agent.selected_categories?.includes(code);
                const catStats = summary.categories?.find(c => c.code === code);
                const isMinimal = agent.subscription_plan === 'minimal';
                const wouldExceedLimit = (agent.selected_categories?.length ?? 0) >= (agent.subscription_plan === 'standard' ? 3 : 4); 
                if (!isSelected && wouldExceedLimit) return null;

                const content = (
                  <div
                    key={code}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                      isSelected ? 'hover:border-primary hover:bg-muted/30 cursor-pointer' : 'opacity-60'
                    }`}
                  >
                    <span className="text-2xl">{CATEGORY_ICONS[code]}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium">{CATEGORY_LABELS[code]}</p>
                        {isSelected && <Badge variant="secondary" className="text-[10px]">전문 분야로 운영 중</Badge>}
                      </div>
                      {isSelected ? (
                        <p className="text-xs text-muted-foreground">
                          매물 {catStats?.listing_count ?? 0}건 | 고객 {catStats?.inquiry_count ?? 0}명
                        </p>
                      ) : (
                        <button
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary relative z-10"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowUpgrade(true); }}
                        >
                          <Lock className="h-3 w-3" />
                          프로로 해제 가능
                        </button>
                      )}
                    </div>
                  </div>
                );

                return isSelected ? (
                  <Link key={code} href={`/dashboard/listings?category=${code}`}>
                    {content}
                  </Link>
                ) : (
                  content
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="추가 카테고리"
      />

      {/* 참고란 (Reference) */}
      <section className="pt-6 border-t space-y-4">
        <h3 className="text-base font-bold text-muted-foreground flex items-center gap-2">
          <FileCheck className="h-4 w-4" /> 참고 (계약 완료 통계)
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">이번 달 계약 완료</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{summary?.contracts_this_month?.count ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">올해 계약 완료</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{summary?.contracts_this_year?.count ?? 0}</div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
