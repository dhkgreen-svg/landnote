'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';

export default function VipLeadsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vip_leads')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setItems(data);
      }
      setLoading(false);
    }
    fetchLeads();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">🌟 VIP 폼 리드 (페이스북)</h1>
      <p className="text-sm text-muted-foreground mb-4">
        페이스북 광고 및 랜딩페이지를 통해 접수된 VIP 리드 명단입니다.
      </p>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              등록된 VIP 리드가 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] px-4">고객명</TableHead>
                  <TableHead className="w-[120px] px-4">전화번호</TableHead>
                  <TableHead className="min-w-[120px] px-4">매입 목적</TableHead>
                  <TableHead className="min-w-[120px] px-4">브리핑 희망</TableHead>
                  <TableHead className="w-[100px] px-4">유입 경로</TableHead>
                  <TableHead className="w-[140px] px-4 text-right">접수일시</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="px-4 font-bold">{item.name}</TableCell>
                    <TableCell className="px-4">
                      {item.phone ? (
                        <a href={`tel:${item.phone}`} className="text-blue-600 underline font-medium">
                          {item.phone}
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="px-4">
                      <span className="text-sm">{item.purchase_purpose || '미선택'}</span>
                    </TableCell>
                    <TableCell className="px-4">
                      <span className="text-sm">{item.briefing_preference || '미선택'}</span>
                    </TableCell>
                    <TableCell className="px-4">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {item.source || 'beomeo-160'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground px-4 text-right">
                      {new Date(item.created_at).toLocaleString('ko-KR', { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
