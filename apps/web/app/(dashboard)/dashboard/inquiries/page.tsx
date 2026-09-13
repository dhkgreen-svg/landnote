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
import { ChevronLeft, ChevronRight, Phone, User } from 'lucide-react';
import { SUBCATEGORY_LABELS } from '@landnote/shared';

const STATUS_LABELS: Record<string, string> = {
  new: '신규',
  contacted: '연락완료',
  viewing: '방문예정',
  negotiating: '협상중',
  contracted: '계약완료',
  closed: '종료',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 font-semibold',
  contacted: 'bg-yellow-100 text-yellow-800 font-semibold',
  viewing: 'bg-purple-100 text-purple-700 font-semibold',
  negotiating: 'bg-orange-100 text-orange-700 font-semibold',
  contracted: 'bg-green-100 text-green-700 font-semibold',
  closed: 'bg-gray-100 text-gray-500',
};

const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거',
  commercial: '상업',
  industrial: '산업',
  land: '토지',
};

const TRANSACTION_LABELS: Record<string, string> = {
  sale: '매매',
  jeonse: '전세',
  monthly_rent: '월세',
  premium_transfer: '권리양도',
};

export default function InquiriesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    category_code: '',
  });
  const limit = 20;

  const { data, isLoading: loading } = useInquiries({
    page,
    limit,
    status: filters.status || undefined,
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
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">매수 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">매수 희망 고객 및 접수된 문의 내역을 총괄 관리합니다.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">진행 상태:</span>
          <Select value={filters.status || 'all'} onValueChange={v => handleFilterChange('status', v)}>
            <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="전체 상태" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">카테고리:</span>
          <Select value={filters.category_code || 'all'} onValueChange={v => handleFilterChange('category_code', v)}>
            <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="전체 카테고리" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 카테고리</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto text-xs font-medium text-muted-foreground">
          총 <span className="font-bold text-primary">{total}</span>명의 매수 고객
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <User className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium">등록된 매수 고객이 없습니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[160px] font-bold text-foreground">성명 (고객명)</TableHead>
                  <TableHead className="w-[100px] text-center font-bold text-foreground">상태</TableHead>
                  <TableHead className="w-[120px] font-bold text-foreground">카테고리</TableHead>
                  <TableHead className="w-[140px] font-bold text-foreground">전화번호</TableHead>
                  <TableHead className="min-w-[280px] font-bold text-foreground">관심 매물 / 비고 (상담 메모)</TableHead>
                  <TableHead className="w-[90px] text-right font-bold text-foreground">접수일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => {
                  const targetProp = item.detailed_conditions?.target_property || item.detailed_conditions?.title || '';
                  const budget = item.detailed_conditions?.budget || '';
                  const rawMemo = item.detailed_conditions?.memo || item.agent_memo || '';
                  const memoClean = rawMemo.replace(/\[VIP 고객 관리 연동\]/g, '').replace(/•/g, '').trim();

                  return (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                      onClick={() => router.push(`/dashboard/inquiries/${item.id}`)}
                    >
                      {/* 1. 성명 (고객명) - 잘림 없이 100% 완전 표시 */}
                      <TableCell className="py-3 font-bold text-sm text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-primary font-bold">👤</span>
                          <span className="hover:underline">{item.customer_name ?? '고객명 미상'}</span>
                        </div>
                      </TableCell>

                      {/* 2. 상태 */}
                      <TableCell className="py-3 text-center">
                        <Badge variant="secondary" className={`${STATUS_COLORS[item.status] ?? ''} px-2.5 py-0.5 text-xs rounded-full`}>
                          {STATUS_LABELS[item.status] ?? item.status}
                        </Badge>
                      </TableCell>

                      {/* 3. 카테고리 */}
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-foreground">
                            {item.subcategory_codes?.length > 0
                              ? item.subcategory_codes.map((c: string) => SUBCATEGORY_LABELS[c] || c).join(', ')
                              : item.category_codes?.map((c: string) => CATEGORY_LABELS[c] || c).join(', ') || '전체'}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {item.transaction_types?.map((t: string) => TRANSACTION_LABELS[t] || t).join(', ') || '매매'}
                          </span>
                        </div>
                      </TableCell>

                      {/* 4. 전화번호 */}
                      <TableCell className="py-3 font-mono text-xs whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        {item.customer_phone ? (
                          <a
                            href={`tel:${item.customer_phone}`}
                            className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline bg-blue-50 px-2 py-1 rounded"
                          >
                            <Phone className="h-3 w-3" />
                            {item.customer_phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      {/* 5. 관심 매물 / 비고 (상담 메모) */}
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-1 max-w-xl">
                          {targetProp && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                              <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[10px]">관심</span>
                              <span>{targetProp}</span>
                              {budget && <span className="text-primary font-normal text-[11px]">({budget})</span>}
                            </div>
                          )}
                          {memoClean && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {memoClean}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* 6. 접수일 */}
                      <TableCell className="py-3 text-xs text-muted-foreground text-right whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString('ko-KR', {
                          month: 'numeric',
                          day: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-semibold text-muted-foreground">
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
