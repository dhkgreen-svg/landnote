'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, Building2, FileCheck, Shuffle, TrendingUp, TrendingDown, Plus, QrCode, Lock, Link2, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSummary, useRecentInquiries } from '@/lib/hooks/queries';
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
  const { data: inquiriesData, isLoading: inquiriesLoading } = useRecentInquiries();
  const { agent } = useAgent();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [formUrl, setFormUrl] = useState('');
  const recentInquiries = inquiriesData?.items ?? [];
  const loading = summaryLoading || inquiriesLoading;

  useEffect(() => {
    if (agent?.agent_code) {
      setFormUrl(`${window.location.origin}/form/${agent.agent_code}`);
    }
  }, [agent?.agent_code]);

  const copyLink = () => {
    if (formUrl) navigator.clipboard.writeText(formUrl);
  };

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

  const cards = [
    {
      title: '신규 문의',
      value: summary?.new_inquiries?.count ?? 0,
      diff: summary?.new_inquiries?.diff_from_last_period,
      diffLabel: '지난 주 대비',
      icon: MessageSquare,
      color: 'text-blue-600',
      href: '/dashboard/inquiries?status=new',
    },
    {
      title: '이번 달 계약 완료',
      value: summary?.contracts_this_month?.count ?? 0,
      diff: summary?.contracts_this_month?.diff_from_last_month,
      diffLabel: '지난 달 대비',
      icon: Building2,
      color: 'text-green-600',
      href: '/dashboard/listings?status=contracted&period=month',
    },
    {
      title: '올해 계약 완료',
      value: summary?.contracts_this_year?.count ?? 0,
      icon: FileCheck,
      color: 'text-orange-600',
      href: '/dashboard/listings?status=contracted&period=year',
    },
    {
      title: '미확인 매칭',
      value: summary?.pending_matches?.count ?? 0,
      icon: Shuffle,
      color: 'text-purple-600',
      href: '/dashboard/matching',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <Link key={card.title} href={card.href} className="block group">
              <Card className="transition-all hover:border-primary hover:shadow-md h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                    {card.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  {card.diff !== undefined && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      {card.diff > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : card.diff < 0 ? (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      ) : null}
                      <span className={card.diff > 0 ? 'text-green-600' : card.diff < 0 ? 'text-red-600' : ''}>
                        {card.diff > 0 ? '+' : ''}{card.diff}
                      </span>
                      {' '}{card.diffLabel}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/dashboard/listings/new">
          <Card className="cursor-pointer transition-colors hover:border-primary">
            <CardContent className="flex items-center gap-3 p-4">
              <Plus className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">매물 등록</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/matching">
          <Card className="cursor-pointer transition-colors hover:border-primary">
            <CardContent className="flex items-center gap-3 p-4">
              <Shuffle className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">매칭 확인</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/links">
          <Card className="cursor-pointer transition-colors hover:border-primary">
            <CardContent className="flex items-center gap-3 p-4">
              <QrCode className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">QR/링크 관리</span>
            </CardContent>
          </Card>
        </Link>
      </div>

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

      {/* Intake Link */}
      {agent && formUrl && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">나의 접수 링크</CardTitle>
              <p className="text-sm text-muted-foreground">고객에게 공유하는 내 전용 접수 링크</p>
            </div>
            <Link href="/dashboard/links" className="text-sm text-primary hover:underline">
              전체 QR 관리
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
                {formUrl}
              </code>
              <Button variant="ghost" size="icon" onClick={copyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="추가 카테고리"
      />

      {/* Recent Inquiries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">최근 문의</CardTitle>
          <Link
            href="/dashboard/inquiries"
            className="text-sm text-primary hover:underline"
          >
            전체 보기
          </Link>
        </CardHeader>
        <CardContent>
          {recentInquiries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              아직 접수된 문의가 없습니다
            </p>
          ) : (
            <div className="space-y-3">
              {recentInquiries.map(inq => (
                <Link
                  key={inq.id}
                  href={`/dashboard/inquiries/${inq.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[inq.status] ?? ''}
                    >
                      {STATUS_LABELS[inq.status] ?? inq.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {inq.customer_name ?? '이름 없음'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {inq.inquiry_type === 'looking_for' ? '매물 찾기' : '매물 내놓기'}
                        {' · '}
                        {inq.category_codes.map(c => CATEGORY_LABELS[c] ?? c).join(', ')}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(inq.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
