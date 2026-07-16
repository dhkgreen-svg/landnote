'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useMatchingInquiries,
  useMatchResults,
  useMarkShown,
  useToggleLiked,
} from '@/lib/hooks/queries';
import { Star, ExternalLink, Eye, StarOff } from 'lucide-react';

// ── 상수 ──────────────────────────────────────────────

const WEIGHT_MAX = { category: 0.30, price: 0.35, area: 0.20, location: 0.15 };

const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거', commercial: '상업', industrial: '산업', land: '토지',
};

const TYPE_LABELS: Record<string, string> = {
  looking_for: '매물 찾기', listing: '매물 내놓기',
};

const TRANSACTION_LABELS: Record<string, string> = {
  sale: '매매', jeonse: '전세', monthly_rent: '월세', premium_transfer: '권리금양도',
};

const BREAKDOWN_LABELS: Record<string, string> = {
  category: '카테고리', price: '가격', area: '면적', location: '위치',
};

// ── 유틸 ──────────────────────────────────────────────

function formatPrice(value: number | null | undefined): string {
  if (!value) return '-';
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`;
  return `${(value / 10000).toLocaleString()}만`;
}

function scoreIcon(actual: number, max: number) {
  if (actual >= max - 0.001) return { symbol: '✓', color: 'text-green-600' };
  if (actual > 0) return { symbol: '△', color: 'text-yellow-600' };
  return { symbol: '✕', color: 'text-gray-400' };
}

// ── 컴포넌트 ──────────────────────────────────────────

export default function MatchingPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: inquiries = [], isLoading: loadingList } = useMatchingInquiries();
  const { data: matches = [], isLoading: loadingMatches } = useMatchResults(selectedId);
  const markShown = useMarkShown(selectedId ?? '');
  const toggleLiked = useToggleLiked(selectedId ?? '');

  const totalPending = inquiries.reduce((sum, inq) => sum + inq.pending_count, 0);

  const handleSelectInquiry = (id: string) => {
    setSelectedId(id);
  };

  const handleMarkShown = (matchId: string) => {
    markShown.mutate(matchId);
  };

  const handleToggleLiked = (matchId: string, currentLiked: boolean) => {
    toggleLiked.mutate({ matchId, currentLiked });
  };

  const selectedInquiry = inquiries.find(inq => inq.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">매칭 센터</h1>
        {totalPending > 0 && (
          <Badge variant="destructive">미검토 {totalPending}건</Badge>
        )}
      </div>

      <div className="lg:grid lg:grid-cols-[360px_1fr] gap-4">
        {/* 왼쪽: 문의 목록 */}
        <div className="space-y-2 mb-4 lg:mb-0">
          {loadingList ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : inquiries.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-sm text-muted-foreground">
                  매칭 결과가 있는 문의가 없습니다
                </p>
              </CardContent>
            </Card>
          ) : (
            inquiries.map(inq => (
              <Card
                key={inq.id}
                className={`cursor-pointer transition-colors ${
                  selectedId === inq.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
                onClick={() => handleSelectInquiry(inq.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {inq.customer_name ?? '이름 없음'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {inq.pending_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          미검토 {inq.pending_count}건
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        매칭 {inq.match_count}건
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABELS[inq.inquiry_type] ?? inq.inquiry_type}
                    {' · '}
                    {inq.category_codes.map(c => CATEGORY_LABELS[c] ?? c).join(', ')}
                    {' · '}
                    {inq.transaction_types.map(t => TRANSACTION_LABELS[t] ?? t).join('/')}
                  </p>
                  {!!inq.detailed_conditions?.price_max && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      예산: {formatPrice(inq.detailed_conditions.price_max as number)} 이하
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 오른쪽: 매칭 결과 */}
        <div className="space-y-3">
          {!selectedId ? (
            <Card>
              <CardContent className="py-16">
                <p className="text-center text-sm text-muted-foreground">
                  왼쪽에서 문의를 선택하면 매칭 결과를 확인할 수 있습니다
                </p>
              </CardContent>
            </Card>
          ) : loadingMatches ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
          ) : (
            <>
              {/* 고객 조건 요약 */}
              {selectedInquiry && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      고객 조건
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedInquiry.category_codes.map(c => (
                        <Badge key={c} variant="outline">{CATEGORY_LABELS[c] ?? c}</Badge>
                      ))}
                      {selectedInquiry.transaction_types.map(t => (
                        <Badge key={t} variant="outline">{TRANSACTION_LABELS[t] ?? t}</Badge>
                      ))}
                      {!!selectedInquiry.detailed_conditions?.price_max && (
                        <Badge variant="outline">
                          {formatPrice(selectedInquiry.detailed_conditions.price_max as number)} 이하
                        </Badge>
                      )}
                      {!!selectedInquiry.detailed_conditions?.area_min && (
                        <Badge variant="outline">
                          {String(selectedInquiry.detailed_conditions.area_min)}㎡ 이상
                        </Badge>
                      )}
                      {!!selectedInquiry.detailed_conditions?.preferred_dong && (
                        <Badge variant="outline">
                          {Array.isArray(selectedInquiry.detailed_conditions.preferred_dong)
                            ? (selectedInquiry.detailed_conditions.preferred_dong as string[]).join('·')
                            : String(selectedInquiry.detailed_conditions.preferred_dong)
                          }
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 매칭 결과 리스트 */}
              {matches.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <p className="text-center text-sm text-muted-foreground">
                      매칭 결과가 없습니다
                    </p>
                  </CardContent>
                </Card>
              ) : (
                matches.map((match, idx) => {
                  const p = match.property;
                  return (
                    <Card key={match.id} className={!match.is_shown ? 'border-l-4 border-l-blue-500' : ''}>
                      <CardContent className="p-4">
                        {/* 상단: 순위 + 점수 */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-primary">
                              {idx + 1}위
                            </span>
                            <Badge variant="secondary" className="text-sm font-semibold">
                              {Math.round(match.score * 100)}점
                            </Badge>
                            {!match.is_shown && (
                              <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                                미검토
                              </Badge>
                            )}
                          </div>
                          {match.is_liked && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>

                        {/* 매물 정보 */}
                        {p ? (
                          <div className="mb-3">
                            <p className="text-sm font-medium">{p.address_full ?? '-'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {p.transaction_types?.map(t => TRANSACTION_LABELS[t] ?? t).join('/') ?? '-'}
                              {p.price_sale ? ` ${formatPrice(p.price_sale)}` : ''}
                              {p.deposit ? ` 보증금 ${formatPrice(p.deposit)}` : ''}
                              {p.monthly_rent ? ` / 월세 ${formatPrice(p.monthly_rent)}` : ''}
                              {p.area_exclusive ? ` / 전용 ${p.area_exclusive}㎡` : ''}
                              {p.direction ? ` / ${p.direction}` : ''}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mb-3">매물 정보 없음</p>
                        )}

                        {/* Score breakdown */}
                        <div className="flex gap-3 mb-3">
                          {(Object.keys(WEIGHT_MAX) as Array<keyof typeof WEIGHT_MAX>).map(key => {
                            const { symbol, color } = scoreIcon(
                              match.score_breakdown[key],
                              WEIGHT_MAX[key],
                            );
                            return (
                              <span key={key} className={`text-xs ${color}`}>
                                {BREAKDOWN_LABELS[key]} {symbol}
                              </span>
                            );
                          })}
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={match.is_shown ? 'secondary' : 'default'}
                            disabled={match.is_shown}
                            onClick={() => handleMarkShown(match.id)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            {match.is_shown ? '안내 완료' : '안내 완료'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleLiked(match.id, match.is_liked)}
                          >
                            {match.is_liked ? (
                              <Star className="h-3.5 w-3.5 mr-1 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <StarOff className="h-3.5 w-3.5 mr-1" />
                            )}
                            관심
                          </Button>
                          {p && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/dashboard/listings/${p.id}`)}
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              매물 상세
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
