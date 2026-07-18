'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useListings, useInquiries, useUpdateInquiry } from '@/lib/hooks/queries';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SUBCATEGORY_LABELS } from '@landnote/shared';
import { formatKoreanCurrency } from '@/lib/utils';

const TRANSACTION_LABELS: Record<string, string> = {
  sale: '매매',
  jeonse: '전세',
  monthly_rent: '월세',
  premium_transfer: '권리양도',
};

const STATUS_LABELS: Record<string, string> = {
  new: '신규',
  active: '진행중',
  contacted: '연락완료',
  viewing: '방문예정',
  negotiating: '협상중',
  contracted: '계약완료',
  closed: '종료',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  active: 'bg-blue-100 text-blue-700',
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

export function DashboardListingsView({ activeView, summary }: { activeView: 'new_listings' | 'total_listings' | null; summary?: any }) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const statusParam = activeView === 'new_listings' ? 'active' : undefined;
  const categoryParam = activeCategory === 'all' ? undefined : activeCategory;

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

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={activeCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory('all')}
            className="whitespace-nowrap flex items-center gap-1.5"
          >
            <span>전체</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeCategory === 'all' ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'}`}>
              {summary?.listings?.total_count ?? 0}
            </span>
          </Button>
          {Object.entries(CATEGORY_LABELS).map(([code, label]) => {
            const count = summary?.categories?.find((c: any) => c.code === code)?.listing_count ?? 0;
            return (
              <Button
                key={code}
                variant={activeCategory === code ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(code)}
                className="whitespace-nowrap flex items-center gap-1.5"
              >
                <span>{CATEGORY_ICONS[code]} {label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeCategory === code ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'}`}>
                  {count}
                </span>
              </Button>
            );
          })}
        </div>

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
                  <TableHead className="w-[120px]">매물 구분</TableHead>
                  <TableHead className="min-w-[200px] w-auto">주소</TableHead>
                  <TableHead className="w-[220px]">금액내역</TableHead>
                  <TableHead className="w-[140px]">면적</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((item: any) => {
                  const txTypeStr = item.transaction_types?.map((t: string) => TRANSACTION_LABELS[t] || t).join(', ') || '';
                  const catStr = item.category_codes?.map((c: string) => CATEGORY_LABELS[c]).join(', ') || '';
                  const subcatStr = item.subcategory_codes?.map((c: string) => SUBCATEGORY_LABELS[c] || c).join(', ') || '';
                  
                  let priceStr = [];
                  if (item.price_sale) priceStr.push(`매매 ${formatKoreanCurrency(item.price_sale)}`);
                  if (item.price_jeonse) priceStr.push(`전세 ${formatKoreanCurrency(item.price_jeonse)}`);
                  if (item.deposit || item.monthly_rent) priceStr.push(`월세 ${item.deposit ? formatKoreanCurrency(item.deposit) : '0만'}/${item.monthly_rent ? formatKoreanCurrency(item.monthly_rent) : '0만'}`);
                  if (item.premium_price) priceStr.push(`권리금 ${formatKoreanCurrency(item.premium_price)}`);
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
                  const buildPyung = formatPyung(item.area_building || item.area_exclusive || item.area_supply);

                  return (
                    <TableRow 
                      key={item.id} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
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
                          {buildPyung > 0 && <span>건평 {buildPyung}평</span>}
                          {landPyung === 0 && buildPyung === 0 && <span>-</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

export function DashboardInquiriesView({ activeView, summary }: { activeView: 'new_buyers' | 'total_buyers' | null; summary?: any }) {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const statusParam = activeView === 'new_buyers' ? 'new' : undefined;
  const categoryParam = activeCategory === 'all' ? undefined : activeCategory;

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
          <Button
            variant={activeCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory('all')}
            className="whitespace-nowrap flex items-center gap-1.5"
          >
            <span>전체</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeCategory === 'all' ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'}`}>
              {summary?.buyers?.total_count ?? 0}
            </span>
          </Button>
          {Object.entries(CATEGORY_LABELS).map(([code, label]) => {
            const count = summary?.categories?.find((c: any) => c.code === code)?.inquiry_count ?? 0;
            return (
              <Button
                key={code}
                variant={activeCategory === code ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(code)}
                className="whitespace-nowrap flex items-center gap-1.5"
              >
                <span>{CATEGORY_ICONS[code]} {label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeCategory === code ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'}`}>
                  {count}
                </span>
              </Button>
            );
          })}
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
                  <TableRow 
                    key={item.id} 
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/inquiries/${item.id}`)}
                  >
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
