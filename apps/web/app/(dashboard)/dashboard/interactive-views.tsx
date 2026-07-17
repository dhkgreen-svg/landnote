'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useListings, useInquiries, useUpdateInquiry } from '@/lib/hooks/queries';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

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

export function DashboardListingsView({ activeView }: { activeView: 'new_listings' | 'total_listings' | null }) {
  const [activeCategory, setActiveCategory] = useState<string>('residential');
  
  const statusParam = activeView === 'new_listings' ? 'new' : undefined;
  const categoryParam = activeView === 'total_listings' ? activeCategory : undefined;

  const { data, isLoading } = useListings({
    page: 1,
    limit: 10,
    status: statusParam,
    category_code: categoryParam,
  });

  if (activeView !== 'new_listings' && activeView !== 'total_listings') return null;

  return (
    <Card className="mt-4 border-primary/20 shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">
            {activeView === 'new_listings' ? '최신 신규 매물' : '카테고리별 매물 조회'}
          </h3>
          <Link href={activeView === 'new_listings' ? "/dashboard/listings?status=new" : "/dashboard/listings"}>
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              더보기 <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {activeView === 'total_listings' && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Object.entries(CATEGORY_LABELS).map(([code, label]) => (
              <Button
                key={code}
                variant={activeCategory === code ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(code)}
                className="whitespace-nowrap"
              >
                {label}
              </Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (data?.items?.length ?? 0) === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/10">
            해당하는 매물이 없습니다.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">상태</TableHead>
                  <TableHead>매물 구분</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>금액/보증금</TableHead>
                  <TableHead>면적</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[item.status] || ''}>
                        {STATUS_LABELS[item.status] || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {item.category_codes?.map(c => (
                          <Badge key={c} variant="secondary" className="text-xs">{CATEGORY_LABELS[c]}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.transaction_types?.join(', ') || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.price_sale ? `${item.price_sale}만` : (item.deposit ? `${item.deposit}만` : '-')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.area_exclusive ? `${item.area_exclusive}㎡` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InquiryStatusSelect({ inquiry }: { inquiry: any }) {
  const mutation = useUpdateInquiry(inquiry.id);
  
  return (
    <Select
      value={inquiry.status}
      onValueChange={(val) => {
        if (val !== inquiry.status) {
          mutation.mutate({ status: val });
        }
      }}
      disabled={mutation.isPending}
    >
      <SelectTrigger className={`h-8 w-[110px] text-xs font-medium border-0 ${STATUS_COLORS[inquiry.status] || ''}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(STATUS_LABELS).map(([val, label]) => (
          <SelectItem key={val} value={val} className="text-xs">
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DashboardInquiriesView({ activeView }: { activeView: 'new_buyers' | 'total_buyers' | null }) {
  const [activeCategory, setActiveCategory] = useState<string>('residential');
  
  const statusParam = activeView === 'new_buyers' ? 'new' : undefined;
  // If 'new_buyers', we might want to filter by category or just show all new. Let's filter by category for 'new_buyers' too, or maybe not. 
  // User: "신규 매수 문의 누르면은 어떤 4개 카테고리에서 문의가 있다 아니면은 그 매물을 보여줘야지 되고" -> We'll show category tabs for both views to allow filtering.
  const categoryParam = activeCategory;

  const { data, isLoading } = useInquiries({
    page: 1,
    limit: 10,
    status: statusParam,
    inquiry_type: 'looking_for',
    category_code: categoryParam,
  });

  if (activeView !== 'new_buyers' && activeView !== 'total_buyers') return null;

  return (
    <Card className="mt-4 border-primary/20 shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">
            {activeView === 'new_buyers' ? '신규 매수 문의' : '매수 고객 관리'}
          </h3>
          <Link href={activeView === 'new_buyers' ? "/dashboard/inquiries?status=new&inquiry_type=looking_for" : "/dashboard/inquiries?inquiry_type=looking_for"}>
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              전체보기 <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {Object.entries(CATEGORY_LABELS).map(([code, label]) => (
            <Button
              key={code}
              variant={activeCategory === code ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(code)}
              className="whitespace-nowrap"
            >
              {label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (data?.items?.length ?? 0) === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/10">
            해당하는 고객 문의가 없습니다.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">상태변경</TableHead>
                  <TableHead>고객명</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>등록일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <InquiryStatusSelect inquiry={item} />
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {item.customer_name || '미상'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.customer_phone || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {item.category_codes?.map(c => (
                          <Badge key={c} variant="secondary" className="text-[10px]">{CATEGORY_LABELS[c]}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
