'use client'; // trigger fast refresh

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
import { QuickTemplateButtons } from '@/components/shared/quick-template-buttons';
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
  price_sale: '매매가 (만 원)', deposit: '보증금 (만 원)', monthly_rent: '월세 (만 원)',
  maintenance_fee: '관리비 (만 원)', premium_price: '권리금 (만 원)',
  contract_remaining_months: '잔여 계약기간 (개월)',
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
  const [createdInquiryId, setCreatedInquiryId] = useState<string | null>(null);

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
    // Single selection
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

  const handleSubmit = async () => {
    setError('');
    if (categoryCodes.length === 0) { setError('카테고리를 선택하세요'); return; }
    if (transactionTypes.length === 0) { setError('거래유형을 선택하세요'); return; }
    if (!customerPhone.trim()) { setError('고객 연락처를 입력하세요'); return; }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        inquiry_type: 'looking_for',
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        category_codes: categoryCodes,
        subcategory_codes: subcategoryCodes,
        tags,
        transaction_types: transactionTypes,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        complex_name: complexName || undefined,
        building_num: buildingNum || undefined,
        room_num: roomNum || undefined,
        area_land: areaLand === '' ? undefined : parseFloat(areaLand),
        area_building: areaBuilding === '' ? undefined : parseFloat(areaBuilding),
        area_contract: areaSupply === '' ? undefined : parseFloat(areaSupply),
        detailed_conditions: {
          address_full: addressFull || undefined,
          address_road: addressRoad || undefined,
          address_jibun: addressJibun || undefined,
          dong_name: dongName || undefined,
          area_supply: areaSupply === '' ? undefined : parseFloat(areaSupply),
          area_exclusive: areaExclusive === '' ? undefined : parseFloat(areaExclusive),
          floor_current: floorCurrent === '' ? undefined : parseInt(floorCurrent),
          floor_total: floorTotal === '' ? undefined : parseInt(floorTotal),
          built_year: builtYear === '' ? undefined : parseInt(builtYear),
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
        if (prices[field] !== undefined && prices[field] !== '') {
          body[field] = parseFloat(prices[field]);
        }
      }

      let targetId = createdInquiryId;
      if (!targetId) {
        const inquiry = await apiFetch<{ inquiryId: string }>('/inquiries', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        targetId = inquiry.inquiryId;
        setCreatedInquiryId(targetId);
      } else {
        await apiFetch(`/inquiries/${targetId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      }

      for (const img of images) {
        const blob = dataUrlToBlob(img.dataUrl);
        const formData = new FormData();
        formData.append('file', blob, img.name || 'image.jpg');
        await apiUpload(`/inquiries/${targetId}/images`, formData);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || '매수 고객 등록에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    const draft = {
      customer_name: customerName, customer_phone: customerPhone,
      category_codes: categoryCodes, subcategory_codes: subcategoryCodes, tags, transaction_types: transactionTypes,
      prices, address_full: addressFull, address_road: addressRoad, address_jibun: addressJibun,
      dong_name: dongName, complex_name: complexName, building_num: buildingNum, room_num: roomNum,
      latitude, longitude, area_supply: areaSupply, area_exclusive: areaExclusive, area_land: areaLand,
      area_building: areaBuilding, zoning, jimok, current_usage: currentUsage, factory_usage: factoryUsage,
      business_type: businessType, recommended_usage: recommendedUsage, floor_current: floorCurrent,
      floor_total: floorTotal, built_year: builtYear, direction, agent_memo: memo,
    };
    localStorage.setItem('landnote_inquiry_draft', JSON.stringify(draft));
    alert('임시 저장되었습니다.');
  };

  const handleLoadDraft = () => {
    const str = localStorage.getItem('landnote_inquiry_draft');
    if (!str) { alert('저장된 임시 데이터가 없습니다.'); return; }
    try {
      if (!confirm('임시 저장된 데이터를 불러오시겠습니까? 현재 입력된 내용은 덮어씌워집니다.')) return;
      const draft = JSON.parse(str);
      if (draft.customer_name) setCustomerName(draft.customer_name);
      if (draft.customer_phone) setCustomerPhone(draft.customer_phone);
      if (draft.category_codes) setCategoryCodes(draft.category_codes);
      if (draft.subcategory_codes) setSubcategoryCodes(draft.subcategory_codes);
      if (draft.tags) setTags(draft.tags);
      if (draft.transaction_types) setTransactionTypes(draft.transaction_types);
      if (draft.prices) setPrices(draft.prices);
      if (draft.address_full) setAddressFull(draft.address_full);
      if (draft.address_road) setAddressRoad(draft.address_road);
      if (draft.address_jibun) setAddressJibun(draft.address_jibun);
      if (draft.dong_name) setDongName(draft.dong_name);
      if (draft.complex_name) setComplexName(draft.complex_name);
      if (draft.building_num) setBuildingNum(draft.building_num);
      if (draft.room_num) setRoomNum(draft.room_num);
      if (draft.latitude) setLatitude(draft.latitude);
      if (draft.longitude) setLongitude(draft.longitude);
      if (draft.area_supply) setAreaSupply(draft.area_supply);
      if (draft.area_exclusive) setAreaExclusive(draft.area_exclusive);
      if (draft.area_land) setAreaLand(draft.area_land);
      if (draft.area_building) setAreaBuilding(draft.area_building);
      if (draft.zoning) setZoning(draft.zoning);
      if (draft.jimok) setJimok(draft.jimok);
      if (draft.current_usage) setCurrentUsage(draft.current_usage);
      if (draft.factory_usage) setFactoryUsage(draft.factory_usage);
      if (draft.business_type) setBusinessType(draft.business_type);
      if (draft.recommended_usage) setRecommendedUsage(draft.recommended_usage);
      if (draft.floor_current) setFloorCurrent(draft.floor_current);
      if (draft.floor_total) setFloorTotal(draft.floor_total);
      if (draft.built_year) setBuiltYear(draft.built_year);
      if (draft.direction) setDirection(draft.direction);
      if (draft.agent_memo) setMemo(draft.agent_memo);
      alert('임시 저장된 데이터를 불러왔습니다.');
    } catch (e) {
      alert('데이터를 불러오는데 실패했습니다.');
    }
  };


  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">매수 고객 등록</h1>

      {/* Category Selection */}
      <Card>
        <CardHeader><CardTitle className="text-lg">기본 정보</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>고객 이름 (선택)</Label>
              <Input 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="예: 홍길동"
              />
            </div>
            <div className="space-y-2">
              <Label>고객 연락처 <span className="text-red-500">*</span></Label>
              <Input 
                value={customerPhone}
                onChange={e => setCustomerPhone(formatPhoneNumber(e.target.value))}
                placeholder="예: 010-1234-5678"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">희망 카테고리 및 거래유형</CardTitle></CardHeader>
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
        <CardHeader><CardTitle className="text-lg">희망 가격 조건</CardTitle></CardHeader>
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
                placeholder="0"
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
            <Label>주소</Label>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>단지명 / 건물명</Label>
                  <Input value={complexName} onChange={e => setComplexName(e.target.value)} placeholder="예: 푸르지오 아파트" />
                </div>
                <div>
                  <Label>동/읍/면</Label>
                  <Input value={dongName} onChange={e => setDongName(e.target.value)} placeholder="동 이름" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>동</Label>
                  <Input value={buildingNum} onChange={e => setBuildingNum(e.target.value)} placeholder="예: 101" />
                </div>
                <div>
                  <Label>호수</Label>
                  <Input value={roomNum} onChange={e => setRoomNum(e.target.value)} placeholder="예: 1502" />
                </div>
              </div>
            </>
          )}
          {(categoryCodes.includes('land') || (categoryCodes.includes('industrial') && !subcategoryCodes.includes('knowledge'))) && (
            <div>
              <Label>동/읍/면</Label>
              <Input value={dongName} onChange={e => setDongName(e.target.value)} placeholder="동 이름" />
            </div>
          )}

        </CardContent>
      </Card>

      {/* Property Details */}
      <Card>
        <CardHeader><CardTitle className="text-lg">희망 상세 조건</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {/* 1. 면적 정보 */}
          {(categoryCodes.includes('land') || (categoryCodes.includes('industrial') && !subcategoryCodes.includes('knowledge')) || subcategoryCodes.some(c => ['building', 'lodging', 'other_commercial', 'house'].includes(c))) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AreaInput label="대지면적" value={areaLand} onChange={setAreaLand} />
              <AreaInput label="연면적/건평" value={areaBuilding} onChange={setAreaBuilding} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AreaInput label="공급면적" value={areaSupply} onChange={setAreaSupply} />
              <AreaInput label="전용면적" value={areaExclusive} onChange={setAreaExclusive} />
            </div>
          )}

          {/* 2. 토지/용도 정보 */}
          {(categoryCodes.includes('land') || (categoryCodes.includes('industrial') && !subcategoryCodes.includes('knowledge')) || subcategoryCodes.some(c => ['building', 'lodging', 'other_commercial', 'house'].includes(c))) && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>용도지역</Label>
                <Select value={zoning || 'none'} onValueChange={v => setZoning(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">선택 안함</SelectItem>
                    {ZONING_OPTIONS.map((z: string) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>지목</Label>
                <Select value={jimok || 'none'} onValueChange={v => setJimok(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">선택 안함</SelectItem>
                    {JIMOK_OPTIONS.map((j: string) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>현재용도 (선택)</Label>
                <Input value={currentUsage} onChange={e => setCurrentUsage(e.target.value)} placeholder="예: 잡종지, 나대지" />
              </div>
            </div>
          )}

          {/* 3. 산업용 특화 필드 */}
          {categoryCodes.includes('industrial') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <Label>지목</Label>
                <Select value={jimok || 'none'} onValueChange={v => setJimok(v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">선택 안함</SelectItem>
                    {JIMOK_OPTIONS.map((j: string) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{subcategoryCodes.includes('warehouse') ? '창고 용도' : subcategoryCodes.some(c => ['workshop', 'yard', 'other_industrial'].includes(c)) ? '건물 용도' : '공장 용도'}</Label>
                <Input value={factoryUsage} onChange={e => setFactoryUsage(e.target.value)} placeholder={subcategoryCodes.includes('warehouse') ? '예: 일반창고, 물류센터' : subcategoryCodes.some(c => ['workshop', 'yard', 'other_industrial'].includes(c)) ? '예: 자동차정비, 야적장, 고물상' : '예: 일반공장, 식품공장'} />
              </div>
              <div>
                <Label>업종</Label>
                <Input value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="예: 반도체, 제조업" />
              </div>
              <div>
                <Label>추천 용도</Label>
                <Input value={recommendedUsage} onChange={e => setRecommendedUsage(e.target.value)} placeholder="예: 창고용, 단순조립" />
              </div>
            </div>
          )}

          {/* 4. 건물/층/방향 정보 */}
          {!categoryCodes.includes('land') && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>현재 층</Label>
                  <Input type="text" inputMode="numeric" value={floorCurrent} onChange={e => setFloorCurrent(e.target.value.replace(/[^0-9.-]/g, ''))} />
                </div>
                <div>
                  <Label>총 층</Label>
                  <Input type="text" inputMode="numeric" value={floorTotal} onChange={e => setFloorTotal(e.target.value.replace(/[^0-9.-]/g, ''))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>준공년도</Label>
                  <Input type="text" inputMode="numeric" value={builtYear} onChange={e => setBuiltYear(e.target.value.replace(/[^0-9]/g, ''))} placeholder="2020" />
                </div>
                <div>
                  <Label>방향</Label>
                  <Select value={direction || 'none'} onValueChange={v => setDirection(v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택 안함</SelectItem>
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
        <CardHeader><CardTitle className="text-lg">이미지</CardTitle></CardHeader>
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
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] text-white">
                    대표
                  </span>
                )}
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
            JPEG, PNG, WebP 파일. 최대 10MB. 첫 번째 이미지가 대표 이미지가 됩니다.
          </p>
        </CardContent>
      </Card>

      {/* 연락처 및 메모 */}
      <Card>
        <CardHeader><CardTitle className="text-lg">메모</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <QuickTemplateButtons 
              syncCategory={categoryCodes[0]}
              onSelect={(text) => setMemo(prev => prev ? prev + '\n' + text : text)}
            />
            <Textarea
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="중개사님만 볼 수 있는 메모를 입력하세요 (방문 가능 시간, 특이사항 등)"
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <div className="flex gap-4 pt-4 pb-12">
        <Button variant="outline" onClick={() => router.back()}>취소</Button>
        <Button variant="secondary" onClick={handleSaveDraft}>임시저장</Button>
        <Button variant="secondary" onClick={handleLoadDraft}>불러오기</Button>
        <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              등록 중...
            </>
          ) : '매수 고객 등록'}
        </Button>
      </div>
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
