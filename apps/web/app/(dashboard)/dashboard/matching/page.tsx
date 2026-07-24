'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useMatchingInquiries,
  useMatchResults,
  useMatchingListings,
  useMatchResultsForListing
} from '@/lib/hooks/queries/use-matching';
import { useMarkShown, useToggleLiked, useToggleContract } from '@/lib/hooks/queries/use-matching-mutations';
import { Star, ExternalLink, Eye, StarOff, CheckCircle2 } from 'lucide-react';

// ── 상수 ──────────────────────────────────────────────

const WEIGHT_MAX = { category: 0.60, price: 0.20, area: 0.10, location: 0.10 };

const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거', commercial: '상업', industrial: '산업', land: '토지',
};

const TYPE_LABELS: Record<string, string> = {
  looking_for: '매수/임차 찾기', listing: '매물 내놓기',
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
  const [activeTab, setActiveTab] = useState('inquiries');
  
  // Tab 1: 고객 중심
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const { data: inquiries = [], isLoading: loadingInquiries } = useMatchingInquiries();
  const { data: inquiryMatches = [], isLoading: loadingInquiryMatches } = useMatchResults(selectedInquiryId);
  const selectedInquiry = inquiries.find(inq => inq.id === selectedInquiryId);
  const totalInquiryPending = inquiries.reduce((sum, inq) => sum + inq.pending_count, 0);

  // Tab 2: 매물 중심
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const { data: listings = [], isLoading: loadingListings } = useMatchingListings();
  const { data: listingMatches = [], isLoading: loadingListingMatches } = useMatchResultsForListing(selectedListingId);
  const selectedListing = listings.find(l => l.id === selectedListingId);
  const totalListingPending = listings.reduce((sum, l) => sum + l.pending_count, 0);

  // Mutations
  const markShown = useMarkShown(activeTab === 'inquiries' ? (selectedInquiryId ?? '') : (selectedListingId ?? ''));
  const toggleLiked = useToggleLiked(activeTab === 'inquiries' ? (selectedInquiryId ?? '') : (selectedListingId ?? ''));
  const toggleContract = useToggleContract(activeTab === 'inquiries' ? (selectedInquiryId ?? '') : (selectedListingId ?? ''));

  const handleMarkShown = (matchId: string) => markShown.mutate(matchId);
  const handleToggleLiked = (matchId: string, currentLiked: boolean) => toggleLiked.mutate({ matchId, currentLiked });
  const handleToggleContract = (matchId: string, currentContracted: boolean) => toggleContract.mutate({ matchId, currentContracted });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">매칭 센터</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="inquiries" className="flex items-center gap-2">
            고객 중심 매칭
            {totalInquiryPending > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 h-4">
                {totalInquiryPending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="listings" className="flex items-center gap-2">
            매물 중심 매칭
            {totalListingPending > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 h-4">
                {totalListingPending}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inquiries" className="mt-0 outline-none">
          <div className="lg:grid lg:grid-cols-[360px_1fr] gap-4">
            {/* 왼쪽: 문의 목록 */}
            <div className="space-y-2 mb-4 lg:mb-0">
              {loadingInquiries ? (
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
                      selectedInquiryId === inq.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedInquiryId(inq.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {inq.customer_name ?? '이름 없음'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {inq.pending_count > 0 && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              미검토 {inq.pending_count}건
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
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

            {/* 오른쪽: 추천 매물 목록 */}
            <div className="space-y-3">
              {!selectedInquiryId ? (
                <Card>
                  <CardContent className="py-16">
                    <p className="text-center text-sm text-muted-foreground">
                      왼쪽에서 고객을 선택하면 추천 매물을 확인할 수 있습니다
                    </p>
                  </CardContent>
                </Card>
              ) : loadingInquiryMatches ? (
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
                              예산: {formatPrice(selectedInquiry.detailed_conditions.price_max as number)} 이하
                            </Badge>
                          )}
                          {!!selectedInquiry.detailed_conditions?.area_min && (
                            <Badge variant="outline">
                              {String(selectedInquiry.detailed_conditions.area_min)}㎡ 이상
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 매칭된 매물 리스트 */}
                  {inquiryMatches.length === 0 ? (
                    <Card>
                      <CardContent className="py-12">
                        <p className="text-center text-sm text-muted-foreground">매칭 결과가 없습니다</p>
                      </CardContent>
                    </Card>
                  ) : (
                    inquiryMatches.map((match, idx) => {
                      const p = match.property;
                      return (
                        <Card key={match.id} className={!match.is_shown ? 'border-l-4 border-l-blue-500' : ''}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-primary">{idx + 1}위</span>
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

                            {p ? (
                              <div className="mb-3">
                                <p className="text-sm font-medium">{p.address_full ?? '-'}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {p.transaction_types?.map(t => TRANSACTION_LABELS[t] ?? t).join('/') ?? '-'}
                                  {p.price_sale ? ` ${formatPrice(p.price_sale)}` : ''}
                                  {p.deposit ? ` 보증금 ${formatPrice(p.deposit)}` : ''}
                                  {p.monthly_rent ? ` / 월세 ${formatPrice(p.monthly_rent)}` : ''}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mb-3">매물 정보 없음</p>
                            )}

                            <div className="flex gap-3 mb-3">
                              {(Object.keys(WEIGHT_MAX) as Array<keyof typeof WEIGHT_MAX>).map(key => {
                                const { symbol, color } = scoreIcon(match.score_breakdown[key], WEIGHT_MAX[key]);
                                return (
                                  <span key={key} className={`text-xs ${color}`}>
                                    {BREAKDOWN_LABELS[key]} {symbol}
                                  </span>
                                );
                              })}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant={match.is_shown ? 'secondary' : 'default'}
                                onClick={() => handleMarkShown(match.id)}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                {match.is_shown ? '안내됨' : '안내 체크'}
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
                                <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/listings/${p.id}`)}>
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
        </TabsContent>

        <TabsContent value="listings" className="mt-0 outline-none">
          <div className="lg:grid lg:grid-cols-[360px_1fr] gap-4">
            {/* 왼쪽: 내 매물 목록 */}
            <div className="space-y-2 mb-4 lg:mb-0">
              {loadingListings ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
              ) : listings.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <p className="text-center text-sm text-muted-foreground">
                      매칭 결과가 있는 매물이 없습니다
                    </p>
                  </CardContent>
                </Card>
              ) : (
                listings.map(listing => (
                  <Card
                    key={listing.id}
                    className={`cursor-pointer transition-colors ${
                      selectedListingId === listing.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedListingId(listing.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium line-clamp-1 break-all">
                          {listing.address_full ?? '주소 없음'}
                        </span>
                        <div className="flex items-center gap-1.5 whitespace-nowrap ml-2">
                          {listing.pending_count > 0 && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              미검토 {listing.pending_count}건
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            매칭 {listing.match_count}건
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {listing.category_codes.map(c => CATEGORY_LABELS[c] ?? c).join(', ')}
                        {' · '}
                        {listing.transaction_types.map(t => TRANSACTION_LABELS[t] ?? t).join('/')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {listing.price_sale ? `매매 ${formatPrice(listing.price_sale)}` : ''}
                        {listing.deposit ? ` 보증금 ${formatPrice(listing.deposit)}` : ''}
                        {listing.monthly_rent ? ` / 월세 ${formatPrice(listing.monthly_rent)}` : ''}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* 오른쪽: 추천 고객 목록 */}
            <div className="space-y-3">
              {!selectedListingId ? (
                <Card>
                  <CardContent className="py-16">
                    <p className="text-center text-sm text-muted-foreground">
                      왼쪽에서 매물을 선택하면 추천 고객을 확인할 수 있습니다
                    </p>
                  </CardContent>
                </Card>
              ) : loadingListingMatches ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
              ) : (
                <>
                  {/* 매물 요약 */}
                  {selectedListing && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          선택한 매물 정보
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <div className="flex flex-wrap gap-1.5">
                          {selectedListing.category_codes.map(c => (
                            <Badge key={c} variant="outline">{CATEGORY_LABELS[c] ?? c}</Badge>
                          ))}
                          {selectedListing.transaction_types.map(t => (
                            <Badge key={t} variant="outline">{TRANSACTION_LABELS[t] ?? t}</Badge>
                          ))}
                          {selectedListing.area_exclusive && (
                            <Badge variant="outline">전용 {selectedListing.area_exclusive}㎡</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 매칭된 고객 리스트 */}
                  {listingMatches.length === 0 ? (
                    <Card>
                      <CardContent className="py-12">
                        <p className="text-center text-sm text-muted-foreground">매칭 결과가 없습니다</p>
                      </CardContent>
                    </Card>
                  ) : (
                    listingMatches.map((match, idx) => {
                      const inq = match.inquiry;
                      return (
                        <Card key={match.id} className={!match.is_shown ? 'border-l-4 border-l-blue-500' : ''}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-primary">{idx + 1}위</span>
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

                            {inq ? (
                              <div className="mb-3">
                                <p className="text-sm font-medium">{inq.customer_name ?? '이름 없음'} 고객</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  희망 예산: {inq.detailed_conditions?.price_max ? `${formatPrice(inq.detailed_conditions.price_max as number)} 이하` : '무관'}
                                  {inq.detailed_conditions?.area_min ? ` / 희망 평수: ${inq.detailed_conditions.area_min}㎡ 이상` : ''}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mb-3">고객 정보 없음</p>
                            )}

                            <div className="flex gap-3 mb-3">
                              {(Object.keys(WEIGHT_MAX) as Array<keyof typeof WEIGHT_MAX>).map(key => {
                                const { symbol, color } = scoreIcon(match.score_breakdown[key], WEIGHT_MAX[key]);
                                return (
                                  <span key={key} className={`text-xs ${color}`}>
                                    {BREAKDOWN_LABELS[key]} {symbol}
                                  </span>
                                );
                              })}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant={match.is_shown ? 'secondary' : 'default'}
                                onClick={() => handleMarkShown(match.id)}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                {match.is_shown ? '안내됨' : '안내 체크'}
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
                              {inq && (
                                <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/inquiries/${inq.id}`)}>
                                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                  고객 상세
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
