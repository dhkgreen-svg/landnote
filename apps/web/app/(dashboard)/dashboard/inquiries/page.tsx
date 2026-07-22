'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useInquiries } from '@/lib/hooks/queries';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { SUBCATEGORY_LABELS } from '@landnote/shared';

const STATUS_LABELS: Record<string, string> = {
  new: '신규', contacted: '연락완료', viewing: '방문예정',
  negotiating: '협상중', contracted: '계약완료', closed: '종료',
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
  residential: '주거', commercial: '상업', industrial: '산업', land: '토지',
};

const TRANSACTION_LABELS: Record<string, string> = {
  sale: '매매',
  jeonse: '전세',
  monthly_rent: '월세',
  premium_transfer: '권리양도',
};

const TYPE_LABELS: Record<string, string> = {
  looking_for: '매물 찾기', listing: '매물 내놓기',
};

export default function InquiriesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    inquiry_type: '',
    category_code: '',
  });
  const limit = 20;

  const { data, isLoading: loading } = useInquiries({
    page,
    limit,
    status: filters.status || undefined,
    inquiry_type: filters.inquiry_type || undefined,
    category_code: filters.category_code || undefined,
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
      <h1 className="text-2xl font-bold">문의 관리</h1>

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

        <Select value={filters.inquiry_type || 'all'} onValueChange={v => handleFilterChange('inquiry_type', v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="유형" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 유형</SelectItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
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
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              문의가 없습니다
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] px-2 text-center">상태</TableHead>
                  <TableHead className="w-[80px] px-2">유형</TableHead>
                  <TableHead className="min-w-[120px] px-2">카테고리</TableHead>
                  <TableHead className="w-[80px] px-2">고객명</TableHead>
                  <TableHead className="w-[110px] px-2">전화번호</TableHead>
                  <TableHead className="w-[90px] px-2 text-right">접수일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => router.push(`/dashboard/inquiries/${item.id}`)}
                  >
                    <TableCell className="px-2 text-center">
                      <Badge variant="secondary" className={`${STATUS_COLORS[item.status] ?? ''} px-2 py-0.5 text-[11px]`}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs px-2 font-medium">
                      {TYPE_LABELS[item.inquiry_type] ?? item.inquiry_type}
                    </TableCell>
                    <TableCell className="px-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] font-bold text-foreground">
                          {item.subcategory_codes?.length > 0 
                            ? item.subcategory_codes.map((c: string) => SUBCATEGORY_LABELS[c] || c).join(', ')
                            : item.category_codes?.map((c: string) => CATEGORY_LABELS[c] || c).join(', ')}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {item.transaction_types?.map((t: string) => TRANSACTION_LABELS[t] || t).join(', ') || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium px-2 truncate max-w-[80px]" title={item.customer_name ?? '미상'}>
                      {item.customer_name ?? '미상'}
                    </TableCell>
                    <TableCell className="text-xs px-2">
                      {item.customer_phone ? (
                        <a href={`tel:${item.customer_phone}`} className="text-blue-600 underline">
                          {item.customer_phone}
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground px-2 text-right">
                      {new Date(item.created_at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
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
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
