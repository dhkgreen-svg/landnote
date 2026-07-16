'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useListings } from '@/lib/hooks/queries';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface ListingItem {
  id: string;
  category_codes: string[];
  transaction_types: string[];
  address_full: string | null;
  dong_name: string | null;
  price_sale: number | null;
  deposit: number | null;
  monthly_rent: number | null;
  area_exclusive: number | null;
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

export default function ListingsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    category_code: '',
    transaction_type: '',
  });
  const limit = 20;

  const { data, isLoading: loading } = useListings({
    page,
    limit,
    status: filters.status || undefined,
    category_code: filters.category_code || undefined,
    transaction_type: filters.transaction_type || undefined,
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상태</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>거래유형</TableHead>
                  <TableHead>주소</TableHead>
                  <TableHead>가격</TableHead>
                  <TableHead>면적</TableHead>
                  <TableHead>등록일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/listings/${item.id}`)}
                  >
                    <TableCell>
                      <Badge variant="secondary" className={STATUS_COLORS[item.status] ?? ''}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.category_codes.map(c => CATEGORY_LABELS[c] ?? c).join(', ')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.transaction_types.map(t => TX_LABELS[t] ?? t).join(', ')}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {item.address_full || item.dong_name || '-'}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{formatPrice(item)}</TableCell>
                    <TableCell className="text-sm">
                      {item.area_exclusive ? `${item.area_exclusive}m²` : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
