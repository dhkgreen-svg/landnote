'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useAdminAgentDetail,
  useAdminAgentInquiries,
  useAdminAgentListings,
  useChangeAgentStatus,
  useChangeAgentPlan,
} from '@/lib/hooks/use-admin-agents';
import { ArrowLeft } from 'lucide-react';

const TABS = ['기본정보', '문의', '매물', '결제이력', '활동로그'] as const;
type Tab = typeof TABS[number];

const STATUS_LABELS: Record<string, string> = {
  trial: '체험판', active: '활성', expired: '만료', cancelled: '해지',
};

export default function AdminAgentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tab, setTab] = useState<Tab>('기본정보');
  const [confirmAction, setConfirmAction] = useState<{ type: string; value: string } | null>(null);

  const { data, isLoading } = useAdminAgentDetail(id);
  const { data: inquiries } = useAdminAgentInquiries(id);
  const { data: listings } = useAdminAgentListings(id);
  const changeStatus = useChangeAgentStatus();
  const changePlan = useChangeAgentPlan();

  if (isLoading) {
    return <div className="py-20 text-center text-muted-foreground">로딩 중...</div>;
  }

  if (!data?.agent) {
    return <div className="py-20 text-center text-muted-foreground">중개사를 찾을 수 없습니다</div>;
  }

  const agent = data.agent;

  const handleConfirm = async () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'status') {
      await changeStatus.mutateAsync({ id, status: confirmAction.value });
    } else {
      await changePlan.mutateAsync({ id, plan: confirmAction.value });
    }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/agents">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">{agent.agent_name}</h1>
        <span className="text-sm text-muted-foreground">{agent.office_name}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmAction && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 py-3">
            <span className="text-sm">
              {confirmAction.type === 'status'
                ? `구독 상태를 "${STATUS_LABELS[confirmAction.value] ?? confirmAction.value}"(으)로 변경하시겠습니까?`
                : `플랜을 "${confirmAction.value}"(으)로 변경하시겠습니까?`}
            </span>
            <Button size="sm" onClick={handleConfirm}>확인</Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmAction(null)}>취소</Button>
          </CardContent>
        </Card>
      )}

      {/* Tab Content */}
      {tab === '기본정보' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">프로필</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="이름" value={agent.agent_name} />
              <Row label="이메일" value={agent.email} />
              <div className="flex justify-between">
                <span className="text-muted-foreground">전화번호</span>
                {agent.phone ? (
                  <a href={`tel:${agent.phone}`} className="font-medium text-blue-600 underline">
                    {agent.phone}
                  </a>
                ) : (
                  <span className="font-medium">-</span>
                )}
              </div>
              <Row label="사무소" value={agent.office_name || '-'} />
              <Row label="자격번호" value={agent.license_number} />
              <Row label="에이전트 코드" value={agent.agent_code} />
              <Row label="가입일" value={new Date(agent.created_at).toLocaleDateString('ko-KR')} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">구독 정보</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="플랜" value={agent.subscription_plan} />
              <Row label="상태" value={STATUS_LABELS[agent.subscription_status] ?? agent.subscription_status} />
              <Row label="카테고리" value={(agent.selected_categories ?? []).join(', ') || '-'} />
              <Row label="예약 플랜" value={agent.pending_plan || '-'} />
              <Row label="체험 만료" value={agent.trial_ends_at ? new Date(agent.trial_ends_at).toLocaleDateString('ko-KR') : '-'} />
              <Row label="다음 결제일" value={agent.next_billing_date ? new Date(agent.next_billing_date).toLocaleDateString('ko-KR') : '-'} />
              <Row label="카드 정보" value={agent.billing_card_info ? `${agent.billing_card_info.company} ${agent.billing_card_info.number}` : '미등록'} />

              <div className="flex gap-2 pt-4">
                <select
                  className="rounded-md border px-2 py-1 text-xs"
                  onChange={(e) => e.target.value && setConfirmAction({ type: 'status', value: e.target.value })}
                  defaultValue=""
                >
                  <option value="" disabled>상태 변경</option>
                  <option value="trial">체험판</option>
                  <option value="active">활성</option>
                  <option value="expired">만료</option>
                  <option value="cancelled">해지</option>
                </select>
                <select
                  className="rounded-md border px-2 py-1 text-xs"
                  onChange={(e) => e.target.value && setConfirmAction({ type: 'plan', value: e.target.value })}
                  defaultValue=""
                >
                  <option value="" disabled>플랜 변경</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === '문의' && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left">고객명</th>
                <th className="px-4 py-3 text-left">유형</th>
                <th className="px-4 py-3 text-left">카테고리</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="px-4 py-3 text-left">접수일</th>
              </tr></thead>
              <tbody>
                {(inquiries ?? []).map((inq: any) => (
                  <tr key={inq.id} className="border-b">
                    <td className="px-4 py-3">{inq.customer_name || '-'}</td>
                    <td className="px-4 py-3">{inq.inquiry_type}</td>
                    <td className="px-4 py-3">{(inq.category_codes ?? []).join(', ')}</td>
                    <td className="px-4 py-3">{inq.status}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(inq.created_at).toLocaleDateString('ko-KR')}</td>
                  </tr>
                ))}
                {(inquiries ?? []).length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">문의 없음</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === '매물' && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left">주소</th>
                <th className="px-4 py-3 text-left">카테고리</th>
                <th className="px-4 py-3 text-left">거래유형</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="px-4 py-3 text-left">등록일</th>
              </tr></thead>
              <tbody>
                {(listings ?? []).map((l: any) => (
                  <tr key={l.id} className="border-b">
                    <td className="px-4 py-3">{l.address_full || l.dong_name || '-'}</td>
                    <td className="px-4 py-3">{(l.category_codes ?? []).join(', ')}</td>
                    <td className="px-4 py-3">{(l.transaction_types ?? []).join(', ')}</td>
                    <td className="px-4 py-3">{l.status}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(l.created_at).toLocaleDateString('ko-KR')}</td>
                  </tr>
                ))}
                {(listings ?? []).length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">매물 없음</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === '결제이력' && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left">주문번호</th>
                <th className="px-4 py-3 text-left">플랜</th>
                <th className="px-4 py-3 text-right">금액</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="px-4 py-3 text-left">일시</th>
              </tr></thead>
              <tbody>
                {(data.billing_histories ?? []).map((h: any) => (
                  <tr key={h.id} className="border-b">
                    <td className="px-4 py-3 font-mono text-xs">{h.order_id}</td>
                    <td className="px-4 py-3">{h.plan}</td>
                    <td className="px-4 py-3 text-right">{(h.amount ?? 0).toLocaleString()}원</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        h.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {h.status === 'success' ? '성공' : '실패'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(h.billed_at).toLocaleDateString('ko-KR')}</td>
                  </tr>
                ))}
                {(data.billing_histories ?? []).length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">결제이력 없음</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === '활동로그' && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left">메서드</th>
                <th className="px-4 py-3 text-left">경로</th>
                <th className="px-4 py-3 text-left">IP</th>
                <th className="px-4 py-3 text-left">시간</th>
              </tr></thead>
              <tbody>
                {(data.recent_activity ?? []).map((log: any) => (
                  <tr key={log.id} className="border-b">
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-mono font-medium ${
                        log.action === 'GET' ? 'bg-blue-100 text-blue-700' :
                        log.action === 'POST' ? 'bg-green-100 text-green-700' :
                        log.action === 'PATCH' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{log.path}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.ip_address || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('ko-KR')}
                    </td>
                  </tr>
                ))}
                {(data.recent_activity ?? []).length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">활동로그 없음</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
