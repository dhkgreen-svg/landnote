'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useListings } from '@/lib/hooks/queries';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { SUBCATEGORY_LABELS } from '@landnote/shared';

interface ListingItem {
  id: string;
  category_codes: string[];
  subcategory_codes?: string[];
  transaction_types: string[];
  address_full: string | null;
  address_road?: string | null;
  dong_name: string | null;
  complex_name?: string | null;
  room_num?: string | null;
  price_sale: number | null;
  price_jeonse?: number | null;
  deposit: number | null;
  monthly_rent: number | null;
  premium_price?: number | null;
  area_exclusive: number | null;
  area_land?: number | null;
  status: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: '활성', pending: '대기', contracted: '계약완료', closed: '종료',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  contracted: 'bg-blue-100 text-blue-700',
  closed: 'bg-gray-100 text-gray-500',
};

const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거', commercial: '상업', industrial: '산업', land: '토지',
};

const TX_LABELS: Record<string, string> = {
  sale: '매매', jeonse: '전세', monthly_rent: '월세', premium_transfer: '권리금양도',
};

function formatPrice(listing: ListingItem): string {
  if (listing.price_sale) return `매매 ${(listing.price_sale / 10000).toLocaleString()}만`;
  if (listing.deposit != null && listing.monthly_rent != null) {
    return `${(listing.deposit / 10000).toLocaleString()}/${(listing.monthly_rent / 10000).toLocaleString()}만`;
  }
  if (listing.deposit != null) return `보증금 ${(listing.deposit / 10000).toLocaleString()}만`;
  return '-';
}

const PERIOD_LABELS: Record<string, string> = {
  month: '이번 달 계약', year: '올해 계약',
};

function ListingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const initialPeriod = searchParams.get('period') || '';

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: initialStatus,
    category_code: '',
    transaction_type: '',
    period: initialPeriod,
  });
  const limit = 20;

  const { data, isLoading: loading } = useListings({
    page,
    limit,
    status: filters.status || undefined,
    category_code: filters.category_code || undefined,
    transaction_type: filters.transaction_type || undefined,
    period: filters.period || undefined,
  });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">매물 관리</h1>
        <Link href="/dashboard/listings/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            새 매물 등록
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filters.status || 'all'} onValueChange={v => handleFilterChange('status', v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="상태" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filters.status === 'contracted' && (
          <Select value={filters.period || 'all'} onValueChange={v => handleFilterChange('period', v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="계약 시기" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 시기</SelectItem>
              {Object.entries(PERIOD_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={filters.category_code || 'all'} onValueChange={v => handleFilterChange('category_code', v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="카테고리" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.transaction_type || 'all'} onValueChange={v => handleFilterChange('transaction_type', v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="거래유형" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 거래유형</SelectItem>
            {Object.entries(TX_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">등록된 매물이 없습니다</p>
              <Link href="/dashboard/listings/new">
                <Button variant="outline" className="mt-3">첫 매물 등록하기</Button>
              </Link>
            </div>
          ) : <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">매물 구분</TableHead>
                    <TableHead>주소</TableHead>
                    <TableHead>금액내역</TableHead>
                    <TableHead className="w-[80px]">면적</TableHead>
                    <TableHead>등록일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => {
                    const txTypeStr = item.transaction_types?.map(t => TX_LABELS[t] || t).join(', ') || '';
                    const catStr = item.category_codes?.map(c => CATEGORY_LABELS[c]).join(', ') || '';
                    const subcatStr = item.subcategory_codes?.map(c => SUBCATEGORY_LABELS[c] || c).join(', ') || '';

                    let priceStr = [];
                    if (item.price_sale) priceStr.push(`매매 ${item.price_sale}만`);
                    if (item.price_jeonse) priceStr.push(`전세 ${item.price_jeonse}만`);
                    if (item.deposit || item.monthly_rent) priceStr.push(`월세 ${item.deposit || 0}만/${item.monthly_rent || 0}만`);
                    if (item.premium_price) priceStr.push(`권리금 ${item.premium_price}만`);
                    const finalPriceStr = priceStr.join(' | ') || '-';

                    let addressParts = [];
                    if (item.dong_name) addressParts.push(item.dong_name);
                    else if (item.address_full) {
                      const parts = item.address_full.split(' ');
                      addressParts.push(parts.length >= 3 ? parts[2] : parts.join(' '));
                    }
                    if (item.complex_name) addressParts.push(item.complex_name);
                    if (item.room_num) addressParts.push(`${item.room_num}호`);
                    const addressDisplay = addressParts.join(' ') || '주소 미상';

                    const formatPyung = (sqm: number | null | undefined) => sqm ? Math.round(sqm * 0.3025) : 0;
                    const landPyung = formatPyung(item.area_land);
                    const exclPyung = formatPyung(item.area_exclusive);

                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/dashboard/listings/${item.id}`)}
                      >
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-primary">[{txTypeStr}]</span>
                            <span className="text-xs text-muted-foreground font-medium">
                              {catStr} {subcatStr ? `> ${subcatStr}` : ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {addressDisplay}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {finalPriceStr}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex flex-col gap-0.5 text-xs">
                            {landPyung > 0 && <span className="text-muted-foreground">대지 {landPyung}평</span>}
                            {exclPyung > 0 && <span>건평 {exclPyung}평</span>}
                            {landPyung === 0 && exclPyung === 0 && <span>-</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
          }
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">불러오는 중...</div>}>
      <ListingsContent />
    </Suspense>
  );
}
