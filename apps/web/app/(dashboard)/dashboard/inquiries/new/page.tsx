'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AreaInput } from '@/components/ui/AreaInput';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch, apiUpload } from '@/lib/api';
import { useAgent } from '@/lib/hooks/use-agent';
import {
  CATEGORY_CODE, SUBCATEGORIES, SUBCATEGORY_LABELS, TRANSACTION_TYPE,
  REQUIRED_PRICE_FIELDS, ZONING_OPTIONS, JIMOK_OPTIONS,
} from '@landnote/shared';
import type { CategoryCode, TransactionType } from '@landnote/shared';
import { X, Upload, Camera, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { AddressSearch } from '@/components/address-search';
import { formatPhoneNumber } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거', commercial: '상업', industrial: '산업', land: '토지',
};

const TX_LABELS: Record<string, string> = {
  sale: '매매', jeonse: '전세', monthly_rent: '월세', premium_transfer: '권리금양도',
};

const PRICE_LABELS: Record<string, string> = {
  price_sale: '희망 매매가 (만 원)', deposit: '희망 보증금 (만 원)', monthly_rent: '희망 월세 (만 원)',
  maintenance_fee: '관리비 (만 원)', premium_price: '희망 권리금 (만 원)',
  contract_remaining_months: '희망 잔여 계약기간 (개월)',
};

const DIRECTION_OPTIONS = ['남향','남동향','남서향','동향','서향','북향','북동향','북서향'];

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(',');
  const mime = meta.match(/:(.*?);/)![1];
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

interface ImagePreview {
  dataUrl: string;
  name: string;
}

function NewInquiryForm() {
  const router = useRouter();
  const { agent } = useAgent();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [categoryCodes, setCategoryCodes] = useState<string[]>([]);
  const [subcategoryCodes, setSubcategoryCodes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [addressFull, setAddressFull] = useState('');
  const [addressRoad, setAddressRoad] = useState('');
  const [addressJibun, setAddressJibun] = useState('');
  const [dongName, setDongName] = useState('');
  const [complexName, setComplexName] = useState('');
  const [buildingNum, setBuildingNum] = useState('');
  const [roomNum, setRoomNum] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [areaSupply, setAreaSupply] = useState('');
  const [areaExclusive, setAreaExclusive] = useState('');
  const [areaLand, setAreaLand] = useState('');
  const [areaBuilding, setAreaBuilding] = useState('');
  const [zoning, setZoning] = useState('');
  const [jimok, setJimok] = useState('');
  const [currentUsage, setCurrentUsage] = useState('');
  const [factoryUsage, setFactoryUsage] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [recommendedUsage, setRecommendedUsage] = useState('');
  const [floorCurrent, setFloorCurrent] = useState('');
  const [floorTotal, setFloorTotal] = useState('');
  const [builtYear, setBuiltYear] = useState('');
  const [direction, setDirection] = useState('');
  const [memo, setMemo] = useState('');
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const searchParams = useSearchParams();
  const aiDraftId = searchParams.get('aiDraft');

  useEffect(() => {
    if (aiDraftId) {
      const draftStr = sessionStorage.getItem(aiDraftId);
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          if (draft.customer_name) setCustomerName(draft.customer_name);
          if (draft.customer_phone) setCustomerPhone(draft.customer_phone);
          if (draft.category_codes) setCategoryCodes(draft.category_codes);
          if (draft.subcategory_codes) setSubcategoryCodes(draft.subcategory_codes);
          if (draft.transaction_types) setTransactionTypes(draft.transaction_types);
          if (draft.address_full) setAddressFull(draft.address_full);
          if (draft.agent_memo) setMemo(draft.agent_memo);
          if (draft.area_exclusive) setAreaExclusive(draft.area_exclusive.toString());

          const newPrices = { ...prices };
          if (draft.price_sale) newPrices.price_sale = draft.price_sale.toString();
          if (draft.deposit) newPrices.deposit = draft.deposit.toString();
          if (draft.monthly_rent) newPrices.monthly_rent = draft.monthly_rent.toString();
          setPrices(newPrices);
        } catch (e) {}
      }
    }
  }, [aiDraftId]);

  const agentCategories = agent?.selected_categories ?? [];

  const toggleCategorySelection = (mainCode: string, subCode: string, item: string) => {
    // Single selection to match unified layout
    setCategoryCodes([mainCode]);
    setSubcategoryCodes([subCode]);
    setTags([item]);
    // If not commercial, remove premium_transfer
    if (mainCode !== 'commercial') {
      setTransactionTypes(prev => prev.filter(t => t !== 'premium_transfer'));
    }
  };

  const toggleTransactionType = (key: string) => {
    setTransactionTypes(prev => {
      let next = prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key];
      if (key === 'premium_transfer' && !prev.includes(key)) {
        next = ['premium_transfer'];
      } else if (key !== 'premium_transfer' && !prev.includes(key)) {
        next = next.filter(t => t !== 'premium_transfer');
      }
      return next;
    });
  };
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleExpandedGroup = (subCode: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [subCode]: !prev[subCode]
    }));
  };

  const requiredPriceFields = transactionTypes.flatMap(
    t => REQUIRED_PRICE_FIELDS[t as TransactionType] ?? [],
  );
  const uniquePriceFields = [...new Set(requiredPriceFields)];

  const handleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const dataUrl = await resizeImage(file, 1920);
      setImages(prev => [...prev, { dataUrl, name: file.name }]);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!customerName || !customerPhone) { setError('고객 이름과 연락처를 입력하세요'); return; }
    if (categoryCodes.length === 0) { setError('카테고리를 선택하세요'); return; }
    if (transactionTypes.length === 0) { setError('거래유형을 선택하세요'); return; }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        inquiry_type: 'looking_for',
        customer_name: customerName,
        customer_phone: customerPhone,
        category_codes: categoryCodes,
        subcategory_codes: subcategoryCodes,
        tags,
        transaction_types: transactionTypes,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        complex_name: complexName || undefined,
        building_num: buildingNum || undefined,
        room_num: roomNum || undefined,
        area_land: areaLand ? parseFloat(areaLand) : undefined,
        area_building: areaBuilding ? parseFloat(areaBuilding) : undefined,
        area_contract: areaSupply ? parseFloat(areaSupply) : undefined,
        detailed_conditions: {
          address_full: addressFull || undefined,
          address_road: addressRoad || undefined,
          address_jibun: addressJibun || undefined,
          dong_name: dongName || undefined,
          area_supply: areaSupply ? parseFloat(areaSupply) : undefined,
          area_exclusive: areaExclusive ? parseFloat(areaExclusive) : undefined,
          floor_current: floorCurrent ? parseInt(floorCurrent) : undefined,
          floor_total: floorTotal ? parseInt(floorTotal) : undefined,
          built_year: builtYear ? parseInt(builtYear) : undefined,
          direction: direction || undefined,
          agent_memo: memo || undefined,
          zoning: zoning || undefined,
          jimok: jimok || undefined,
          current_usage: currentUsage || undefined,
          factory_usage: factoryUsage || undefined,
          business_type: businessType || undefined,
          recommended_usage: recommendedUsage || undefined,
        }
      };

      for (const field of uniquePriceFields) {
        if (prices[field]) {
          body[field] = parseFloat(prices[field]);
        }
      }

      const inquiry = await apiFetch<{ inquiryId: string }>('/inquiries', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      for (const img of images) {
        const blob = dataUrlToBlob(img.dataUrl);
        const formData = new FormData();
        formData.append('file', blob, img.name || 'image.jpg');
        await apiUpload(`/inquiries/${inquiry.inquiryId}/images`, formData);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || '매수 고객 등록에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">매수 고객 등록</h1>
        <p className="text-muted-foreground mt-1">사무소에 방문하거나 연락한 매수 고객을 상세 조건과 함께 등록합니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 고객 정보 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">고객 정보</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">이름 (또는 가명) <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="예: 홍길동"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">연락처 <span className="text-red-500">*</span></Label>
              <Input
                id="phone"
                value={customerPhone}
                onChange={e => setCustomerPhone(formatPhoneNumber(e.target.value))}
                placeholder="예: 010-1234-5678"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Selection */}
        <Card>
          <CardHeader><CardTitle className="text-lg">찾는 매물 종류</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Tabs defaultValue="residential" className="w-full">
              <TabsList className="w-full flex">
                {Object.entries(CATEGORY_LABELS).map(([mainCode, mainLabel]) => (
                  <TabsTrigger key={mainCode} value={mainCode} className="flex-1">
                    {mainLabel}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(CATEGORY_LABELS).map(([mainCode]) => {
                const groups = SUBCATEGORIES[mainCode as keyof typeof SUBCATEGORIES] || {};

                return (
                  <TabsContent key={mainCode} value={mainCode} className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(groups).map(([subCode, subItems]) => {
                        const isExpanded = !!expandedGroups[subCode];
                        const hasSelectedItems = subItems.some(item => tags.includes(item));
                        
                        return (
                          <div key={subCode} className="bg-white rounded-lg border shadow-sm overflow-hidden transition-all duration-200">
                            <button
                              type="button"
                              onClick={() => toggleExpandedGroup(subCode)}
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground/90 text-sm">
                                  {SUBCATEGORY_LABELS[subCode] || subCode}
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
                                  {subItems.map((item) => {
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

            {agentCategories.length === 0 && (
              <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg text-center">
                대시보드 환경설정에서 취급 카테고리를 먼저 설정해주세요.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Type & Price */}
        <Card>
          <CardHeader><CardTitle className="text-lg">희망 거래 조건</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>거래유형</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {Object.entries(TX_LABELS)
                  .filter(([key]) => {
                    if (key === 'premium_transfer') {
                      return categoryCodes.includes('commercial');
                    }
                    return true;
                  })
                  .map(([key, label]) => (
                    <Button
                      key={key}
                      variant={transactionTypes.includes(key) ? 'default' : 'outline'}
                      size="sm"
                      type="button"
                      onClick={() => toggleTransactionType(key)}
                    >
                      {label}
                    </Button>
                  ))}
              </div>
            </div>

            {uniquePriceFields.length > 0 && uniquePriceFields.map(field => (
              <div key={field}>
                <Label>{PRICE_LABELS[field] ?? field}</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={prices[field] ?? ''}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setPrices(prev => ({ ...prev, [field]: val }));
                  }}
                  placeholder="예산 입력 (최대 금액)"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Address & Location */}
        <Card>
          <CardHeader><CardTitle className="text-lg">희망 위치</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>주소 또는 구역</Label>
              <AddressSearch
                value={complexName ? `${addressFull} (${complexName})` : addressFull}
                onComplete={(result) => {
                  setAddressFull(result.address_full);
                  setAddressRoad(result.address_road);
                  setAddressJibun(result.address_jibun);
                  setDongName(result.dong_name);
                  if (result.building_name) {
                    setComplexName(result.building_name);
                  }
                }}
              />
            </div>
            {!(categoryCodes.includes('land') || (categoryCodes.includes('industrial') && !subcategoryCodes.includes('knowledge'))) && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>선호 단지명 / 건물명</Label>
                    <Input value={complexName} onChange={e => setComplexName(e.target.value)} placeholder="예: 푸르지오 아파트" />
                  </div>
                  <div>
                    <Label>선호 동/읍/면</Label>
                    <Input value={dongName} onChange={e => setDongName(e.target.value)} placeholder="동 이름" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>특정 동</Label>
                    <Input value={buildingNum} onChange={e => setBuildingNum(e.target.value)} placeholder="예: 101" />
                  </div>
                  <div>
                    <Label>특정 호수 (해당 시)</Label>
                    <Input value={roomNum} onChange={e => setRoomNum(e.target.value)} placeholder="예: 1502" />
                  </div>
                </div>
              </>
            )}
            {(categoryCodes.includes('land') || (categoryCodes.includes('industrial') && !subcategoryCodes.includes('knowledge'))) && (
              <div>
                <Label>선호 동/읍/면</Label>
                <Input value={dongName} onChange={e => setDongName(e.target.value)} placeholder="동 이름" />
              </div>
            )}

          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader><CardTitle className="text-lg">희망 매물 상세 조건</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {/* 1. 면적 정보 */}
            {(categoryCodes.includes('land') || (categoryCodes.includes('industrial') && !subcategoryCodes.includes('knowledge')) || subcategoryCodes.some(c => ['building', 'lodging', 'other_commercial', 'house'].includes(c))) ? (
              <div className="grid grid-cols-2 gap-3">
                <AreaInput label="희망 대지면적" value={areaLand} onChange={setAreaLand} />
                <AreaInput label="희망 연면적/건평" value={areaBuilding} onChange={setAreaBuilding} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <AreaInput label="희망 공급면적" value={areaSupply} onChange={setAreaSupply} />
                <AreaInput label="희망 전용면적" value={areaExclusive} onChange={setAreaExclusive} />
              </div>
            )}

            {/* 2. 토지/용도 정보 */}
            {(categoryCodes.includes('land') || (categoryCodes.includes('industrial') && !subcategoryCodes.includes('knowledge')) || subcategoryCodes.some(c => ['building', 'lodging', 'other_commercial', 'house'].includes(c))) && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>용도지역</Label>
                  <Select value={zoning || 'none'} onValueChange={v => setZoning(v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="상관없음" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">상관없음</SelectItem>
                      {ZONING_OPTIONS.map((z: string) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>지목</Label>
                  <Select value={jimok || 'none'} onValueChange={v => setJimok(v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="상관없음" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">상관없음</SelectItem>
                      {JIMOK_OPTIONS.map((j: string) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>현재용도 (선택)</Label>
                  <Input value={currentUsage} onChange={e => setCurrentUsage(e.target.value)} placeholder="예: 나대지" />
                </div>
              </div>
            )}

            {/* 3. 산업용 특화 필드 */}
            {categoryCodes.includes('industrial') && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <Label>지목</Label>
                  <Select value={jimok || 'none'} onValueChange={v => setJimok(v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="상관없음" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">상관없음</SelectItem>
                      {JIMOK_OPTIONS.map((j: string) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{subcategoryCodes.includes('warehouse') ? '희망 창고 용도' : subcategoryCodes.some(c => ['workshop', 'yard', 'other_industrial'].includes(c)) ? '희망 건물 용도' : '희망 공장 용도'}</Label>
                  <Input value={factoryUsage} onChange={e => setFactoryUsage(e.target.value)} placeholder="예: 일반창고, 물류센터" />
                </div>
                <div>
                  <Label>희망 업종</Label>
                  <Input value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="예: 제조업" />
                </div>
                <div>
                  <Label>추천 용도</Label>
                  <Input value={recommendedUsage} onChange={e => setRecommendedUsage(e.target.value)} placeholder="예: 창고용" />
                </div>
              </div>
            )}

            {/* 4. 건물/층/방향 정보 */}
            {!categoryCodes.includes('land') && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>희망 층</Label>
                    <Input type="text" inputMode="numeric" value={floorCurrent} onChange={e => setFloorCurrent(e.target.value.replace(/[^0-9.-]/g, ''))} />
                  </div>
                  <div>
                    <Label>총 층수 제한</Label>
                    <Input type="text" inputMode="numeric" value={floorTotal} onChange={e => setFloorTotal(e.target.value.replace(/[^0-9.-]/g, ''))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>희망 준공년도 (이후)</Label>
                    <Input type="text" inputMode="numeric" value={builtYear} onChange={e => setBuiltYear(e.target.value.replace(/[^0-9]/g, ''))} placeholder="2020" />
                  </div>
                  <div>
                    <Label>희망 방향</Label>
                    <Select value={direction || 'none'} onValueChange={v => setDirection(v === 'none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="상관없음" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">상관없음</SelectItem>
                        {DIRECTION_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader><CardTitle className="text-lg">참고 이미지</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((img, i) => (
                <div key={i} className="relative overflow-hidden rounded-lg border">
                  <img src={img.dataUrl} alt={`이미지 ${i + 1}`} className="aspect-square w-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Upload className="mb-1 h-5 w-5" />
                <span className="text-xs">앨범</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  multiple
                  className="hidden"
                  onChange={handleImageAdd}
                />
              </label>
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Camera className="mb-1 h-5 w-5" />
                <span className="text-xs">카메라</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageAdd}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              고객이 원하는 스타일 등 참고용 이미지를 등록할 수 있습니다.
            </p>
          </CardContent>
        </Card>

        {/* 메모 */}
        <Card>
          <CardHeader><CardTitle className="text-lg">기타 메모</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>메모</Label>
              <Textarea
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="중개사님만 볼 수 있는 메모를 입력하세요 (방문 가능 시간, 추가 요청사항 등)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        {error && (
          <p className="text-sm text-red-500 font-medium">{error}</p>
        )}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="w-full">취소</Button>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                등록 중...
              </>
            ) : '매수 고객 등록'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewInquiryPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <NewInquiryForm />
    </Suspense>
  );
}
