'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAgent } from '@/lib/hooks/use-agent';
import { apiFetch } from '@/lib/api';
import { CATEGORY_CODE, PLAN_LIMITS, PLAN_PRICE, SUBCATEGORIES, SUBCATEGORY_LABELS } from '@landnote/shared';
import { BillingRegisterButton } from '@/components/dashboard/BillingRegisterButton';
import { UpgradeModal } from '@/components/dashboard/UpgradeModal';
import { Lock } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거', commercial: '상업', industrial: '산업', land: '토지',
};

const PLAN_LABELS: Record<string, string> = {
  starter: '스타터', pro: '프로',
};

const STATUS_LABELS: Record<string, string> = {
  trial: '체험 기간', active: '활성', expired: '만료', cancelled: '해지',
};

export default function SettingsPage() {
  const { agent, reload } = useAgent();

  const [name, setName] = useState('');
  const [office, setOffice] = useState('');
  const [license, setLicense] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [catSaving, setCatSaving] = useState(false);
  const [catMsg, setCatMsg] = useState('');

  const [planChanging, setPlanChanging] = useState(false);
  const [planMsg, setPlanMsg] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (agent) {
      setName(agent.agent_name);
      setOffice(agent.office_name);
      setLicense(agent.license_number);
      setSelectedCats(agent.selected_categories);
    }
  }, [agent]);

  if (!agent) {
    return (
      <div className="py-12 text-center text-muted-foreground">로딩 중...</div>
    );
  }

  const plan = agent.subscription_plan as 'starter' | 'pro';
  const limits = PLAN_LIMITS[plan];

  const handleProfileSave = async () => {
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await apiFetch('/agents/me', {
        method: 'PATCH',
        body: JSON.stringify({
          agent_name: name,
          office_name: office,
        }),
      });
      await reload();
      setProfileMsg('저장되었습니다');
    } catch (err: any) {
      setProfileMsg(err.message || '저장 실패');
    } finally {
      setProfileSaving(false);
    }
  };

  const toggleCategory = (code: string) => {
    setSelectedCats(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code],
    );
  };

  const handleCategorySave = async () => {
    if (selectedCats.length === 0) {
      setCatMsg('최소 1개 세부 업종을 선택하세요');
      return;
    }

    const currentTopLevelCats = new Set<string>();
    selectedCats.forEach(cat => {
      for (const [top, subs] of Object.entries(SUBCATEGORIES)) {
        if (Object.values(subs).some(arr => arr.includes(cat))) {
          currentTopLevelCats.add(top);
          break;
        }
      }
    });

    if (currentTopLevelCats.size > limits.max_categories) {
      setCatMsg(`큰 분류 기준 최대 ${limits.max_categories}개까지만 취급 가능합니다`);
      return;
    }

    setCatSaving(true);
    setCatMsg('');
    try {
      await apiFetch('/agents/me/categories', {
        method: 'PATCH',
        body: JSON.stringify({ categories: selectedCats }),
      });
      await reload();
      setCatMsg('저장되었습니다');
    } catch (err: any) {
      setCatMsg(err.message || '저장 실패');
    } finally {
      setCatSaving(false);
    }
  };

  const handlePlanChange = async (newPlan: 'starter' | 'pro') => {
    setPlanChanging(true);
    setPlanMsg('');
    try {
      await apiFetch('/billing/plan', {
        method: 'PATCH',
        body: JSON.stringify({ plan: newPlan }),
      });
      await reload();
      setPlanMsg('플랜 변경 완료');
    } catch (err: any) {
      setPlanMsg(err.message || '플랜 변경 실패');
    } finally {
      setPlanChanging(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('정말 구독을 해지하시겠습니까?\n30일 후 데이터가 삭제됩니다.')) return;
    setCancelling(true);
    setCancelMsg('');
    try {
      await apiFetch('/billing/cancel', { method: 'POST' });
      await reload();
      setCancelMsg('구독 해지 완료');
    } catch (err: any) {
      setCancelMsg(err.message || '해지 실패');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">설정</h1>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="text-lg">프로필</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>중개사명</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <Label>사무소명</Label>
            <Input value={office} onChange={e => setOffice(e.target.value)} />
          </div>
          <div>
            <Label>자격증번호</Label>
            <Input value={license} readOnly className="bg-muted" />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleProfileSave} disabled={profileSaving}>
              {profileSaving ? '저장 중...' : '저장'}
            </Button>
            {profileMsg && (
              <span className={`text-sm ${profileMsg === '저장되었습니다' ? 'text-green-600' : 'text-red-500'}`}>
                {profileMsg}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader><CardTitle className="text-lg">취급 카테고리 (세부 업종)</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            {Object.entries(CATEGORY_LABELS).map(([mainCode, mainLabel]) => {
              const groups = SUBCATEGORIES[mainCode as keyof typeof SUBCATEGORIES] || {};
              return (
                <div key={mainCode} className="space-y-2">
                  <h3 className="font-semibold text-sm text-foreground/80">{mainLabel}</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(groups).map(([subCode, subItems]) => (
                      <div key={subCode} className="mb-4">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                          {SUBCATEGORY_LABELS[subCode] || subCode}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {subItems.map((item) => {
                            const isSelected = selectedCats.includes(item);
                            
                            // Calculate if selecting this new subcategory would exceed the top-level category limit
                            const currentTopLevelCats = new Set<string>();
                            selectedCats.forEach(cat => {
                              for (const [top, subs] of Object.entries(SUBCATEGORIES)) {
                                if (Object.values(subs).some(arr => arr.includes(cat))) {
                                  currentTopLevelCats.add(top);
                                  break;
                                }
                              }
                            });
                            
                            const wouldExceedLimit = !currentTopLevelCats.has(mainCode) && currentTopLevelCats.size >= limits.max_categories;
                            const isLocked = !isSelected && wouldExceedLimit && plan === 'starter';

                            return (
                              <Button
                                key={item}
                                variant={isSelected ? 'default' : isLocked ? 'ghost' : 'outline'}
                                size="sm"
                                className={isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                                onClick={() => {
                                  if (isLocked) {
                                    setShowUpgrade(true);
                                  } else {
                                    toggleCategory(item);
                                  }
                                }}
                              >
                                {item}
                                {isLocked && <Lock className="ml-1 h-3 w-3" />}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          <Separator />
          
          <div className="space-y-1 text-xs text-muted-foreground mt-4">
            <p>※ 요금제 제한은 '큰 분류(주거/상업 등)' 개수를 기준으로 적용됩니다.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleCategorySave} disabled={catSaving}>
              {catSaving ? '저장 중...' : '카테고리 변경'}
            </Button>
            {catMsg && (
              <span className={`text-sm ${catMsg === '저장되었습니다' ? 'text-green-600' : 'text-red-500'}`}>
                {catMsg}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Info */}
      <Card>
        <CardHeader><CardTitle className="text-lg">구독 정보</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">현재 플랜</span>
            <Badge variant="secondary">{PLAN_LABELS[plan] ?? plan}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">구독 상태</span>
            <span className="text-sm font-medium">
              {STATUS_LABELS[agent.subscription_status] ?? agent.subscription_status}
            </span>
          </div>
          {agent.trial_ends_at && agent.subscription_status === 'trial' && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">체험 만료일</span>
              <span className="text-sm">
                {new Date(agent.trial_ends_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
          )}
          {agent.next_billing_date && agent.subscription_status === 'active' && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">다음 결제일</span>
              <span className="text-sm">
                {new Date(agent.next_billing_date).toLocaleDateString('ko-KR')}
              </span>
            </div>
          )}
          {agent.pending_plan && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
              다음 결제일에 <strong>{PLAN_LABELS[agent.pending_plan] ?? agent.pending_plan}</strong> 플랜으로 변경 예정
            </div>
          )}

          <Separator />

          {plan === 'starter' ? (
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>현재 Starter: 카테고리 {limits.max_categories}개, QR {limits.max_qr_codes}개</p>
              <p className="text-xs">PRO로 바꾸면 4개 전체와 카테고리별 QR이 즉시 열립니다</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              현재 PRO: 카테고리 4개, QR 4개, 등록 무제한
            </p>
          )}

          {['trial', 'active'].includes(agent.subscription_status) && (
            <>
              <Separator />
              <div className="space-y-2">
                {agent.pending_plan ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={planChanging}
                    onClick={() => handlePlanChange(plan)}
                  >
                    {planChanging ? '처리 중...' : '플랜 변경 예약 취소'}
                  </Button>
                ) : plan === 'starter' ? (
                  <Button
                    className="w-full"
                    disabled={planChanging}
                    onClick={() => handlePlanChange('pro')}
                  >
                    {planChanging ? '처리 중...' : 'PRO로 업그레이드'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={planChanging}
                    onClick={() => handlePlanChange('starter')}
                  >
                    {planChanging ? '처리 중...' : 'Starter로 변경 예약'}
                  </Button>
                )}
                {planMsg && (
                  <p className={`text-sm ${planMsg.includes('완료') ? 'text-green-600' : 'text-red-500'}`}>
                    {planMsg}
                  </p>
                )}
              </div>
            </>
          )}

          <Separator />

          {agent.billing_card_info && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">등록 카드</span>
              <span className="text-sm">
                {agent.billing_card_info.company} {agent.billing_card_info.number}
              </span>
            </div>
          )}
          <BillingRegisterButton agentId={agent.id} returnPath="settings" />

          {['trial', 'active'].includes(agent.subscription_status) && (
            <>
              <Separator />
              <div className="space-y-2">
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={cancelling}
                  onClick={handleCancel}
                >
                  {cancelling ? '처리 중...' : '구독 해지'}
                </Button>
                {cancelMsg && (
                  <p className={`text-sm ${cancelMsg.includes('완료') ? 'text-green-600' : 'text-red-500'}`}>
                    {cancelMsg}
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="추가 카테고리 선택"
      />
    </div>
  );
}
