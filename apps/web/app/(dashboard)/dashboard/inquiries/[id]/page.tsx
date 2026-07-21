'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useInquiry, useUpdateInquiry, useDeleteInquiry } from '@/lib/hooks/queries';
import { SUBCATEGORY_LABELS, SUBCATEGORIES } from '@landnote/shared';
import { QuickTemplateButtons } from '@/components/shared/quick-template-buttons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Shuffle, Trash2, Share2, MessageCircle, MessageSquare, Pencil, ChevronDown, ChevronRight } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  new: '신규', contacted: '연락완료', viewing: '방문예정',
  negotiating: '협상중', contracted: '계약완료', closed: '종료',
};

const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거', commercial: '상업', industrial: '산업', land: '토지',
};

const TX_LABELS: Record<string, string> = {
  sale: '매매', jeonse: '전세', monthly_rent: '월세', premium_transfer: '권리금양도',
};

const PRICE_LABELS: Record<string, string> = {
  price_sale: '매매가', deposit: '보증금', monthly_rent: '월세',
  maintenance_fee: '관리비', premium_price: '권리금', contract_remaining_months: '잔여 계약 개월',
};

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: inquiry, isLoading: loading } = useInquiry(id);
  const updateMutation = useUpdateInquiry(id);
  const deleteMutation = useDeleteInquiry();
  
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  
  const [memo, setMemo] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (inquiry) {
      setMemo(inquiry.agent_memo ?? '');
      setStatus(inquiry.status);
      setEditForm({
        customer_name: inquiry.customer_name || '',
        customer_phone: inquiry.customer_phone || '',
        customer_email: inquiry.customer_email || '',
        inquiry_type: inquiry.inquiry_type || 'looking_for',
        category_codes: [...inquiry.category_codes],
        subcategory_codes: [...inquiry.subcategory_codes],
        transaction_types: [...inquiry.transaction_types],
        tags: [...inquiry.tags],
        detailed_conditions: { ...inquiry.detailed_conditions }
      });
    }
  }, [inquiry]);

  const handleChange = (key: string, value: any) => {
    setEditForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleExpandedGroup = (subCode: string) => {
    setExpandedGroups(prev => ({ ...prev, [subCode]: !prev[subCode] }));
  };

  const toggleCategorySelection = (mainCode: string, subCode: string, item: string) => {
    setEditForm((prev: any) => {
      const currentTags = prev.tags || [];
      const isSelected = currentTags.includes(item);
      let newTags;
      
      if (isSelected) {
        newTags = currentTags.filter((t: string) => t !== item);
      } else {
        newTags = [...currentTags, item];
      }
      
      const currentCats = prev.category_codes || [];
      const currentSubCats = prev.subcategory_codes || [];
      
      const newCats = currentCats.includes(mainCode) ? currentCats : [...currentCats, mainCode];
      const newSubCats = currentSubCats.includes(subCode) ? currentSubCats : [...currentSubCats, subCode];
      
      return {
        ...prev,
        tags: newTags,
        category_codes: newCats,
        subcategory_codes: newSubCats,
      };
    });
  };

  const handleConditionChange = (key: string, value: any) => {
    setEditForm((prev: any) => ({
      ...prev,
      detailed_conditions: { ...prev.detailed_conditions, [key]: value },
    }));
  };

  const handleSave = () => {
    if (editing) {
      updateMutation.mutate({
        ...editForm,
        status,
        agent_memo: memo,
      }, {
        onSuccess: () => setEditing(false)
      });
    } else {
      updateMutation.mutate({ status, agent_memo: memo });
    }
  };
  const saving = updateMutation.isPending;

  const handleDelete = () => {
    if (!confirm('이 매수 고객을 삭제하시겠습니까?')) return;
    if (!confirm('정말로 삭제하시겠습니까? 삭제된 데이터는 절대 복구할 수 없습니다.')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => router.push('/dashboard/inquiries'),
    });
  };

  const generateShareText = () => {
    if (!inquiry) return '';
    const parts = [];
    parts.push(`[매수/임차 희망 고객] `);
    
    let cats = inquiry.category_codes.map(c => CATEGORY_LABELS[c] ?? c).join(', ');
    let subs = inquiry.subcategory_codes.map(c => SUBCATEGORY_LABELS[c as keyof typeof SUBCATEGORY_LABELS] ?? c).join(', ');
    parts.push(`🏠 희망 종류: ${cats}${subs ? ` (${subs})` : ''}`);
    
    let tx = inquiry.transaction_types.map(t => TX_LABELS[t] ?? t).join(', ');
    parts.push(`💰 희망 거래: ${tx}`);
    
    if (inquiry.detailed_conditions.address_full || inquiry.detailed_conditions.dong_name) {
      parts.push(`📍 희망 위치: ${(inquiry.detailed_conditions.address_full || inquiry.detailed_conditions.dong_name)}`);
    }
    
    if (inquiry.detailed_conditions.area_supply || inquiry.detailed_conditions.area_exclusive) {
      parts.push(`📏 희망 면적: ${inquiry.detailed_conditions.area_supply ? `공급 ${inquiry.detailed_conditions.area_supply}㎡ ` : ''}${inquiry.detailed_conditions.area_exclusive ? `전용 ${inquiry.detailed_conditions.area_exclusive}㎡` : ''}`);
    }

    if (inquiry.agent_memo) parts.push(`\n📝 기타사항:\n${inquiry.agent_memo}`);
    parts.push(`\n*공동중개 문의 바랍니다.*`);
    
    return parts.join('\n');
  };

  const handleShareKakao = async () => {
    const text = generateShareText();
    if (!text) return;
    
    if (!(window as any).Kakao) {
      alert('카카오톡 공유 기능을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
      return;
    }
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!kakaoKey) return alert('카카오 앱 키가 없습니다.');
    if (!(window as any).Kakao.isInitialized()) (window as any).Kakao.init(kakaoKey);

    (window as any).Kakao.Share.sendDefault({
      objectType: 'text',
      text: text,
      link: { mobileWebUrl: window.location.origin, webUrl: window.location.origin },
      buttonTitle: '앱에서 보기',
    });
  };

  const handleShareSMS = () => {
    const text = generateShareText();
    if (!text) return;
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!inquiry) return <div className="py-12 text-center text-muted-foreground">문의를 찾을 수 없습니다</div>;

  const priceKeys = Object.keys(inquiry.detailed_conditions || {}).filter(k => PRICE_LABELS[k] !== undefined);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/inquiries')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">매수 고객 상세</h1>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>취소</Button>
              <Button variant="default" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </Button>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white border-none">
                    <Share2 className="mr-1 h-3 w-3" />공유
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleShareKakao} className="cursor-pointer">
                    <MessageCircle className="mr-2 h-4 w-4 text-yellow-500" />카카오톡
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareSMS} className="cursor-pointer">
                    <MessageSquare className="mr-2 h-4 w-4 text-blue-500" />문자 전송
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="default" size="sm" onClick={() => router.push(`/dashboard/matching?inquiryId=${inquiry.id}`)} className="bg-green-600 hover:bg-green-700 text-white border-none">
                <Shuffle className="mr-1 h-3 w-3" />매칭
              </Button>
              <Button variant="default" size="sm" onClick={() => setEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white border-none">
                <Pencil className="mr-1 h-3 w-3" />수정
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">고객 정보</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>이름</Label>
                  <Input value={editForm.customer_name} onChange={e => handleChange('customer_name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>전화번호</Label>
                  <Input value={editForm.customer_phone} onChange={e => handleChange('customer_phone', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>이메일</Label>
                  <Input value={editForm.customer_email} onChange={e => handleChange('customer_email', e.target.value)} />
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">이름</span>
                  <span className="text-sm font-medium">{inquiry.customer_name ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">전화번호</span>
                  {inquiry.customer_phone ? (
                    <a href={`tel:${inquiry.customer_phone}`} className="text-sm font-medium text-blue-600 underline">{inquiry.customer_phone}</a>
                  ) : <span className="text-sm font-medium">-</span>}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">이메일</span>
                  <span className="text-sm font-medium">{inquiry.customer_email ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">접수일</span>
                  <span className="text-sm">{new Date(inquiry.created_at).toLocaleString('ko-KR')}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">희망 접수 조건</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">유형</Label>
                  <Select value={editForm.inquiry_type} onValueChange={v => handleChange('inquiry_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="looking_for">매물 찾기 (매수/임차)</SelectItem>
                      <SelectItem value="offering">매물 내놓기 (매도/임대)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">희망 거래유형</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(TX_LABELS).map(([code, label]) => (
                      <Badge
                        key={code}
                        variant={editForm.transaction_types?.includes(code) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const current = editForm.transaction_types || [];
                          const next = current.includes(code) ? current.filter((c: string) => c !== code) : [...current, code];
                          handleChange('transaction_types', next);
                        }}
                      >{label}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">희망 카테고리 및 세부 분류</Label>
                  <Tabs defaultValue={editForm.category_codes?.[0] || 'residential'} className="w-full">
                    <TabsList className="w-full flex">
                      {Object.entries(CATEGORY_LABELS).map(([mainCode, mainLabel]) => (
                        <TabsTrigger key={mainCode} value={mainCode} className="flex-1">
                          {mainLabel}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {Object.entries(CATEGORY_LABELS).map(([mainCode]) => {
                      const groups = (SUBCATEGORIES as any)[mainCode] || {};

                      return (
                        <TabsContent key={mainCode} value={mainCode} className="mt-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(groups).map(([subCode, subItems]) => {
                              const typedSubItems = subItems as string[];
                              const isExpanded = !!expandedGroups[subCode];
                              const tags = editForm.tags || [];
                              const hasSelectedItems = typedSubItems.some(item => tags.includes(item));
                              
                              return (
                                <div key={subCode} className="bg-white rounded-lg border shadow-sm overflow-hidden transition-all duration-200">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandedGroup(subCode)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-foreground/90 text-sm">
                                        {SUBCATEGORY_LABELS[subCode as keyof typeof SUBCATEGORY_LABELS] || subCode}
                                      </span>
                                      {hasSelectedItems && (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                          ✓
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-muted-foreground transition-transform duration-200">
                                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </div>
                                  </button>

                                  {isExpanded && (
                                    <div className="p-4 pt-0 border-t bg-muted/10">
                                      <div className="flex flex-wrap gap-2 mt-4">
                                        {typedSubItems.map((item) => {
                                          const isSelected = tags.includes(item);
                                          return (
                                            <Button
                                              key={item}
                                              variant={isSelected ? 'default' : 'outline'}
                                              size="sm"
                                              type="button"
                                              className={`rounded-lg transition-all duration-150 ${
                                                isSelected 
                                                  ? 'shadow-sm ring-2 ring-primary ring-offset-1' 
                                                  : 'bg-white hover:bg-muted/50 hover:shadow-sm'
                                              }`}
                                              onClick={() => toggleCategorySelection(mainCode, subCode, item)}
                                            >
                                              {item}
                                            </Button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </div>
                <div>
                  <Label className="mb-2 block">희망 가격조건</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="매매가 (만 원)" value={editForm.detailed_conditions?.price_sale || ''} onChange={e => handleConditionChange('price_sale', Number(e.target.value) || undefined)} />
                    <Input type="number" placeholder="보증금 (만 원)" value={editForm.detailed_conditions?.deposit || ''} onChange={e => handleConditionChange('deposit', Number(e.target.value) || undefined)} />
                    <Input type="number" placeholder="월세 (만 원)" value={editForm.detailed_conditions?.monthly_rent || ''} onChange={e => handleConditionChange('monthly_rent', Number(e.target.value) || undefined)} />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">희망 면적/상세 (텍스트)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="선호 동/읍/면" value={editForm.detailed_conditions?.dong_name || ''} onChange={e => handleConditionChange('dong_name', e.target.value)} />
                    <Input type="number" placeholder="공급 면적 (㎡)" value={editForm.detailed_conditions?.area_supply || ''} onChange={e => handleConditionChange('area_supply', Number(e.target.value) || undefined)} />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">유형</span>
                  <span className="text-sm font-medium">{inquiry.inquiry_type === 'looking_for' ? '매물 찾기' : '매물 내놓기'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">거래유형</span>
                  <span className="text-sm">{inquiry.transaction_types.map(t => TX_LABELS[t] ?? t).join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">카테고리</span>
                  <span className="text-sm">{inquiry.category_codes.map(c => CATEGORY_LABELS[c] ?? c).join(', ')}</span>
                </div>
                {inquiry.subcategory_codes.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">세부 분류</span>
                    <span className="text-sm">{inquiry.subcategory_codes.map(c => SUBCATEGORY_LABELS[c as keyof typeof SUBCATEGORY_LABELS] ?? c).join(', ')}</span>
                  </div>
                )}
                {inquiry.tags?.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">상세 항목</span>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[250px]">
                      {inquiry.tags.map(t => (
                        <Badge key={t} variant="secondary" className="font-normal">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {priceKeys.length > 0 && priceKeys.map(key => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{PRICE_LABELS[key]}</span>
                    <span className="text-sm font-medium">
                      {typeof inquiry.detailed_conditions[key] === 'number' ? Number(inquiry.detailed_conditions[key]).toLocaleString('ko-KR') + '만 원' : String(inquiry.detailed_conditions[key])}
                    </span>
                  </div>
                ))}
                {(inquiry.detailed_conditions.address_full || inquiry.detailed_conditions.dong_name) && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">희망 위치</span>
                    <span className="text-sm">{String(inquiry.detailed_conditions.address_full || inquiry.detailed_conditions.dong_name || '')}</span>
                  </div>
                )}
                {(inquiry.detailed_conditions.area_supply || inquiry.detailed_conditions.area_exclusive) && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">희망 면적</span>
                    <span className="text-sm">
                      {inquiry.detailed_conditions.area_supply ? `공급 ${inquiry.detailed_conditions.area_supply}㎡ ` : ''}
                      {inquiry.detailed_conditions.area_exclusive ? `전용 ${inquiry.detailed_conditions.area_exclusive}㎡` : ''}
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {inquiry.images.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">첨부 이미지</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {inquiry.images.map((img: any, i: number) => (
                <div key={i} className="overflow-hidden rounded-lg border">
                  {img.signed_url ? (
                    <img src={img.signed_url} alt={`첨부 이미지 ${i + 1}`} className="aspect-square w-full object-cover" />
                  ) : <div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground">로드 실패</div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">상태 관리</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">상태</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">메모</label>
            {editing && (
              <div className="mb-2">
                <QuickTemplateButtons 
                  onSelect={(text) => setMemo(prev => prev ? prev + '\n' + text : text)}
                />
              </div>
            )}
            <Textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="이 문의에 대한 메모를 작성하세요"
              rows={4}
              disabled={!editing}
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)}>취소</Button>
                <Button variant="default" onClick={handleSave} disabled={saving}>
                  {saving ? '저장 중...' : '저장'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="default" onClick={handleSave} disabled={saving}>
                  {saving ? '저장 중...' : '상태/메모 저장'}
                </Button>
                <Button variant="outline" onClick={() => setEditing(true)} className="ml-auto text-blue-600 border-blue-200 hover:bg-blue-50">
                  <Pencil className="mr-2 h-4 w-4" /> 전체 항목 수정하기
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
          <Trash2 className="mr-2 h-4 w-4" />
          {deleteMutation.isPending ? '삭제 중...' : '고객 삭제'}
        </Button>
      </div>
    </div>
  );
}
