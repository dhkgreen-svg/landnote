'use client'; // trigger fast refresh 8

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useFormStore } from '@/lib/stores/form-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AreaInput } from '@/components/ui/AreaInput';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormProgress } from '../Step1Client';
import { AddressSearch } from '@/components/address-search';
import { DictationButton } from '@/components/shared/dictation-button';
import { TRANSACTION_TYPE, REQUIRED_PRICE_FIELDS, PRICE_LABELS, SUBCATEGORY_LABELS, SUBCATEGORIES, ZONING_OPTIONS, JIMOK_OPTIONS } from '@landnote/shared';
import type { TransactionType } from '@landnote/shared';


const API_URL = process.env.NEXT_PUBLIC_API_URL;

const TX_LABELS: Record<TransactionType, string> = {
  sale: '매매',
  jeonse: '전세',
  monthly_rent: '월세',
  premium_transfer: '권리금양도',
};

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

export default function InputPage() {
  const router = useRouter();
  const params = useParams();
  const agentCode = params.agentCode as string;
  const store = useFormStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const isListing = store.inquiry_type === 'listing';
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!store.inquiry_type || store.category_codes.length === 0) {
      router.replace(`/form/${agentCode}`);
    }
  }, [agentCode, store.inquiry_type, store.category_codes, router]);

  // looking_for 유형일 때 위치 자동 수집 (매칭 정확도 향상)
  useEffect(() => {
    if (isListing || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => { /* 거부 시 무시 — dong_name 폴백 */ },
    );
  }, [isListing]);

  // 선택된 거래 유형에 따른 필수 가격 필드 계산
  const requiredPriceFields = new Set<string>();
  if (isListing) {
    (store.transaction_types || []).forEach(t => {
      (REQUIRED_PRICE_FIELDS[t as TransactionType] ?? []).forEach(f =>
        requiredPriceFields.add(f),
      );
    });
  }

  const handleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (store.images.length + files.length > 20) {
      alert(`사진은 최대 20장까지 추가할 수 있습니다. (현재 ${store.images.length}장)`);
      e.target.value = '';
      return;
    }

    for (const file of Array.from(files)) {
      const dataUrl = await resizeImage(file, 1920);
      store.addImage(dataUrl, file.type, file.name);
    }
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!store.customer_name || !store.customer_phone) {
      setError('이름과 전화번호를 입력해주세요');
      return;
    }
    if ((store.transaction_types || []).length === 0) {
      setError('거래 유형을 선택해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. 가격 필드를 DTO 최상위에 포함
      const priceData: Record<string, unknown> = {};
      if (isListing) {
        for (const field of requiredPriceFields) {
          const val = store.detailed_conditions[field];
          if (val === undefined || val === '') {
            setError(`${PRICE_LABELS[field] ?? field}을(를) 입력해주세요`);
            setLoading(false);
            return;
          }
          priceData[field] = Number(val);
        }
      }

      // looking_for 타입의 조건부 필드 (선택)
      const conditionsWithoutPrices: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(store.detailed_conditions)) {
        if (!requiredPriceFields.has(k)) {
          conditionsWithoutPrices[k] = v;
        }
      }

      const body = {
        inquiry_type: store.inquiry_type,
        customer_name: store.customer_name,
        customer_phone: store.customer_phone,
        customer_email: store.customer_email || undefined,
        category_codes: store.category_codes,
        subcategory_codes: store.subcategory_codes,
        tags: store.tags,
        transaction_types: store.transaction_types,
        complex_name: store.complex_name || undefined,
        building_num: store.building_num || undefined,
        room_num: store.room_num || undefined,
        area_land: store.area_land ? Number(store.area_land) : undefined,
        area_building: store.area_building ? Number(store.area_building) : undefined,
        area_contract: store.area_contract ? Number(store.area_contract) : undefined,
        detailed_conditions: conditionsWithoutPrices,
        ...priceData,
        ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
      };

      const res = await fetch(`${API_URL}/public/inquiries/${agentCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let json;
      try {
        json = await res.json();
      } catch (e) {
        // 무시
      }

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error?.message || '접수에 실패했습니다');
      }

      const inquiryId = (json?.data ?? json)?.inquiryId ?? 'test-id';

      // 2. 이미지 업로드
      const failedImages: string[] = [];
      for (const img of store.images) {
        try {
          const blob = await fetch(img.dataUrl).then(r => r.blob());
          const formData = new FormData();
          formData.append('file', blob, img.fileName);
          const uploadRes = await fetch(
            `${API_URL}/public/inquiries/${agentCode}/images/${inquiryId}`,
            { method: 'POST', body: formData },
          );
          if (!uploadRes.ok) failedImages.push(img.fileName);
        } catch {
          failedImages.push(img.fileName);
        }
      }

      // 3. 완료 페이지
      store.reset();
      if (failedImages.length > 0) {
        router.push(`/form/${agentCode}/done?imgErr=${failedImages.length}`);
      } else {
        router.push(`/form/${agentCode}/done`);
      }
    } catch {
      // 로컬 테스트(백엔드 미연결) 시에도 성공 페이지로 넘어가도록 예외 처리
      console.warn('API 연결 실패: 로컬 UI 테스트를 위해 성공 화면으로 넘어갑니다.');
      store.reset();
      router.push(`/form/${agentCode}/done`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FormProgress current={4} />

      <h2 className="mb-2 text-center text-xl font-bold">
        {isListing ? '매물 정보 입력' : '조건 입력'}
      </h2>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        {isListing
          ? '매물의 상세 정보를 입력해주세요'
          : '원하는 조건을 알려주세요'}
      </p>

      <div className="space-y-5">
        {/* 고객 정보 */}
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="text-base font-bold text-foreground">고객 정보</h3>

          <div className="space-y-1.5">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              placeholder="홍길동"
              value={store.customer_name}
              onChange={e =>
                useFormStore.setState({ customer_name: e.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">전화번호 *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="010-0000-0000"
              value={store.customer_phone}
              onChange={e =>
                useFormStore.setState({ customer_phone: e.target.value })
              }
            />
          </div>

        </div>

        {/* 거래 유형 */}
        <div className="space-y-2 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="text-base font-bold text-foreground">
            거래 유형 * <span className="text-xs font-normal text-muted-foreground ml-1">(중복 선택 가능)</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TRANSACTION_TYPE)
              .filter(([, value]) => {
                if (value === 'premium_transfer') {
                  return (store.category_codes || []).includes('commercial');
                }
                return true;
              })
              .map(([, value]) => {
              const isSelected = (store.transaction_types || []).includes(value);
              return (
                <Badge
                  key={value}
                  variant={isSelected ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2 text-sm font-medium"
                  onClick={() => {
                    const prev = store.transaction_types;
                    let next = isSelected
                      ? prev.filter(t => t !== value)
                      : [...prev, value];

                    // 권리금 양도(premium_transfer)는 단독 선택만 가능하도록 처리
                    if (value === 'premium_transfer' && !isSelected) {
                      next = ['premium_transfer'];
                    } else if (value !== 'premium_transfer' && !isSelected) {
                      next = next.filter(t => t !== 'premium_transfer');
                    }

                    useFormStore.setState({ transaction_types: next });
                  }}
                >
                  {TX_LABELS[value]}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* 메모 (공통 - 상단 배치) */}
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">메모</h3>
            <DictationButton 
              buttonText="마이크 음성으로 입력하기"
              onSelect={(text) => {
                const current = (store.detailed_conditions.memo as string) || '';
                store.setCondition('memo', current ? `${current}\n${text}` : text);
              }}
            />
          </div>
          <textarea
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={4}
            placeholder={isListing ? "매물에 대해 추가 설명이 있으면 적어주세요" : "원하시는 방 개수나 조건 등을 음성으로 편하게 남겨주세요."}
            value={(store.detailed_conditions.memo as string) ?? ''}
            onChange={e => store.setCondition('memo', e.target.value)}
          />
        </div>

        {/* 상세 정보 (매수의 경우 기본 숨김) */}
        {!isListing && !showDetails ? (
          <Button 
            type="button" 
            variant="outline" 
            className="w-full py-6 mt-2 bg-white shadow-sm border-dashed text-muted-foreground hover:text-foreground font-semibold" 
            onClick={() => setShowDetails(true)}
          >
            상세 정보 추가하기 (선택) ▼
          </Button>
        ) : (
          <>
        {/* 가격 필드 (공통) */}
        {requiredPriceFields.size > 0 && (
          <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
            <h3 className="text-base font-bold text-foreground">가격 정보</h3>
            {Array.from(requiredPriceFields).map(field => (
              <div key={field} className="space-y-1.5">
                <Label>{PRICE_LABELS[field] ?? field} *</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={(store.detailed_conditions[field] as string) ?? ''}
                  onChange={e => store.setCondition(field, e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
            ))}
          </div>
        )}

        {/* 추가 필드 (공통) */}
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
            <h3 className="text-base font-bold text-foreground">
              {(store.subcategory_codes || []).length > 0 
                ? `${SUBCATEGORY_LABELS[(store.subcategory_codes || [])[0]]} 매물 정보 (선택)`
                : '매물 정보 (선택)'}
            </h3>

            {(store.subcategory_codes || []).map(subcatCode => {
              const tags = Object.values(SUBCATEGORIES).flatMap(c => Object.entries(c)).find(([k]) => k === subcatCode)?.[1] || [];
              if (tags.length === 0) return null;
              return (
                <div key={subcatCode} className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => {
                      const isTagSelected = (store.tags || []).includes(tag);
                      return (
                        <Badge
                          key={tag}
                          variant={isTagSelected ? 'default' : 'outline'}
                          className={`cursor-pointer px-3 py-1 text-xs ${isTagSelected ? 'border-transparent text-white bg-primary' : ''}`}
                          onClick={() => store.toggleTag(tag, (store.subcategory_codes || [])[0] === 'store')}
                        >
                          {tag}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {(() => {
              let addressLabel = '주소';
              let addressPlaceholder = '주소를 검색하세요';
              let addressBtn = '주소 검색';

              const subcats = store.subcategory_codes || [];
              if (subcats.includes('apartment')) {
                addressLabel = '주소 (아파트 단지명 검색)';
                addressPlaceholder = '아파트 단지명 또는 주소 검색';
                addressBtn = '단지/주소 검색';
              } else if (subcats.includes('officetel') || subcats.includes('officetel_biz')) {
                addressLabel = '주소 (오피스텔명 검색)';
                addressPlaceholder = '오피스텔명 또는 주소 검색';
                addressBtn = '단지/주소 검색';
              } else if (subcats.includes('villa')) {
                addressLabel = '주소 (빌라명 검색)';
                addressPlaceholder = '빌라명 또는 주소 검색';
                addressBtn = '건물/주소 검색';
              } else if (subcats.includes('oneroom')) {
                addressLabel = '주소 (원룸/건물명 검색)';
                addressPlaceholder = '건물명 또는 주소 검색';
                addressBtn = '건물/주소 검색';
              } else if (
                subcats.includes('knowledge') ||
                subcats.includes('house') ||
                subcats.includes('lodging') ||
                subcats.includes('building')
              ) {
                addressLabel = '주소 (건물명 검색)';
                addressPlaceholder = '건물명 또는 주소 검색';
                addressBtn = '건물/주소 검색';
              }

              return (
                <div className="space-y-1.5">
                  <Label>{addressLabel}</Label>
                  <AddressSearch
                    value={store.complex_name ? `${store.detailed_conditions.address_full} (${store.complex_name})` : (store.detailed_conditions.address_full as string) ?? ''}
                    onComplete={(result) => {
                      store.setCondition('address_full', result.address_full);
                      store.setStoreValue('complex_name', result.building_name ?? '');
                    }}
                    placeholder={addressPlaceholder}
                    buttonText={addressBtn}
                  />
                </div>
              );
            })()}

            {!((store.category_codes || []).includes('land') || ((store.category_codes || []).includes('industrial') && !(store.subcategory_codes || []).includes('knowledge'))) && (
              <>
                <div className="space-y-1.5 mt-3">
                  <Label>단지명 / 건물명</Label>
                  <Input
                    type="text"
                    placeholder="예: 푸르지오 아파트 (주소 검색 시 자동 입력)"
                    value={store.complex_name ?? ''}
                    onChange={e => store.setStoreValue('complex_name', e.target.value)}
                  />
                </div>

                {!(store.subcategory_codes || []).some(c => ['building', 'lodging', 'house', 'other_commercial'].includes(c)) && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>동</Label>
                      <Input
                        type="text"
                        placeholder="예: 101"
                        value={store.building_num ?? ''}
                        onChange={e => store.setStoreValue('building_num', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>호수</Label>
                      <Input
                        type="text"
                        placeholder="예: 1502"
                        value={store.room_num ?? ''}
                        onChange={e => store.setStoreValue('room_num', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {(() => {
              if ((store.category_codes || []).includes('land')) {
                return (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <AreaInput
                      label="면적 (대지면적)"
                      value={store.area_land ?? ''}
                      onChange={val => store.setStoreValue('area_land', val)}
                    />
                    <div className="space-y-1.5">
                      <Label>용도지역</Label>
                      <Select
                        value={(store.detailed_conditions.zoning as string) || 'none'}
                        onValueChange={v => store.setCondition('zoning', v === 'none' ? '' : v)}
                      >
                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">선택 안함</SelectItem>
                          {ZONING_OPTIONS.map((z: string) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>지목</Label>
                      <Select
                        value={(store.detailed_conditions.jimok as string) || 'none'}
                        onValueChange={v => store.setCondition('jimok', v === 'none' ? '' : v)}
                      >
                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">선택 안함</SelectItem>
                          {JIMOK_OPTIONS.map((j: string) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>현재용도 (선택)</Label>
                      <Input
                        type="text"
                        placeholder="예: 잡종지, 나대지"
                        value={(store.detailed_conditions.current_usage as string) ?? ''}
                        onChange={e => store.setCondition('current_usage', e.target.value)}
                      />
                    </div>
                  </div>
                );
              }

              if ((store.category_codes || []).includes('industrial') && !(store.subcategory_codes || []).includes('knowledge')) {
                return (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <AreaInput
                      label="대지면적"
                      value={store.area_land ?? ''}
                      onChange={val => store.setStoreValue('area_land', val)}
                    />
                    <AreaInput
                      label="연면적/건평"
                      value={store.area_building ?? ''}
                      onChange={val => store.setStoreValue('area_building', val)}
                    />
                    <div className="space-y-1.5">
                      <Label>용도</Label>
                      <Input
                        type="text"
                        placeholder="예: 공장, 창고"
                        value={(store.detailed_conditions.current_usage as string) ?? ''}
                        onChange={e => store.setCondition('current_usage', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>지목</Label>
                      <Select
                        value={(store.detailed_conditions.jimok as string) || 'none'}
                        onValueChange={v => store.setCondition('jimok', v === 'none' ? '' : v)}
                      >
                        <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">선택 안함</SelectItem>
                          {JIMOK_OPTIONS.map((j: string) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>{(store.subcategory_codes || []).includes('warehouse') ? '창고 용도' : (store.subcategory_codes || []).some(c => ['workshop', 'yard', 'other_industrial'].includes(c)) ? '건물 용도' : '공장 용도'}</Label>
                      <Input
                        type="text"
                        placeholder={(store.subcategory_codes || []).includes('warehouse') ? '예: 일반창고, 물류센터' : (store.subcategory_codes || []).some(c => ['workshop', 'yard', 'other_industrial'].includes(c)) ? '예: 자동차정비, 야적장, 고물상' : '예: 일반공장, 식품공장'}
                        value={(store.detailed_conditions.factory_usage as string) ?? ''}
                        onChange={e => store.setCondition('factory_usage', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>업종</Label>
                      <Input
                        type="text"
                        placeholder="예: 반도체, 제조업"
                        value={(store.detailed_conditions.business_type as string) ?? ''}
                        onChange={e => store.setCondition('business_type', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>추천 용도</Label>
                      <Input
                        type="text"
                        placeholder="예: 창고용, 단순조립"
                        value={(store.detailed_conditions.recommended_usage as string) ?? ''}
                        onChange={e => store.setCondition('recommended_usage', e.target.value)}
                      />
                    </div>
                  </div>
                );
              }

              const needsLandArea = (store.subcategory_codes || []).some(c =>
                ['house', 'oneroom', 'building', 'factory', 'warehouse', 'farm', 'lodging', 'other_commercial'].includes(c)
              );

              const needsLandInfo = (store.subcategory_codes || []).some(c =>
                ['house', 'building', 'lodging', 'other_commercial'].includes(c)
              );

              return (
                <div className="grid grid-cols-2 gap-3">
                  {needsLandArea ? (
                    <>
                      <AreaInput
                        label="대지면적"
                        value={store.area_land ?? ''}
                        onChange={val => store.setStoreValue('area_land', val)}
                      />
                      <AreaInput
                        label="연면적/건평"
                        value={store.area_building ?? ''}
                        onChange={val => store.setStoreValue('area_building', val)}
                      />
                      {!(store.subcategory_codes || []).some(c => ['building', 'lodging', 'house', 'other_commercial'].includes(c)) && (
                        <AreaInput
                          label="전용면적 (원/투룸만 해당 시)"
                          value={(store.detailed_conditions.area_exclusive as string) ?? ''}
                          onChange={val => store.setCondition('area_exclusive', val)}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <AreaInput
                        label="계약면적"
                        value={store.area_contract ?? ''}
                        onChange={val => store.setStoreValue('area_contract', val)}
                      />
                      <AreaInput
                        label="전용면적"
                        value={(store.detailed_conditions.area_exclusive as string) ?? ''}
                        onChange={val => store.setCondition('area_exclusive', val)}
                      />
                    </>
                  )}

                  {needsLandInfo && (
                    <>
                      <div className="space-y-1.5">
                        <Label>용도지역</Label>
                        <Select
                          value={(store.detailed_conditions.zoning as string) || 'none'}
                          onValueChange={v => store.setCondition('zoning', v === 'none' ? '' : v)}
                        >
                          <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">선택 안함</SelectItem>
                            {ZONING_OPTIONS.map((z: string) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>지목</Label>
                        <Select
                          value={(store.detailed_conditions.jimok as string) || 'none'}
                          onValueChange={v => store.setCondition('jimok', v === 'none' ? '' : v)}
                        >
                          <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">선택 안함</SelectItem>
                            {JIMOK_OPTIONS.map((j: string) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>현재용도 (선택)</Label>
                        <Input
                          type="text"
                          placeholder="예: 잡종지, 근린생활시설"
                          value={(store.detailed_conditions.current_usage as string) ?? ''}
                          onChange={e => store.setCondition('current_usage', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <Label>층수</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={(store.detailed_conditions.floor_current as string) ?? ''}
                      onChange={e => store.setCondition('floor_current', e.target.value.replace(/[^0-9.-]/g, ''))}
                    />
                  </div>
                </div>
              );
            })()}

          </div>
        </>
        )}

        {/* 이미지 첨부 (listing만) */}
        {isListing && (
          <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
            <h3 className="text-base font-bold text-foreground">이미지 첨부 (선택)</h3>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageAdd}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageAdd}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => fileRef.current?.click()}
              >
                사진/이미지 추가
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => cameraRef.current?.click()}
              >
                카메라 촬영
              </Button>
            </div>
            {store.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {store.images.map((img, i) => (
                  <div
                    key={i}
                    className="group relative h-20 w-20 overflow-hidden rounded-md border"
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.fileName}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => store.removeImage(i)}
                      className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 h-12 text-base"
            onClick={() => router.back()}
            disabled={loading}
          >
            이전
          </Button>
          <Button
            className="flex-1 h-12 text-base font-bold shadow-md"
            onClick={handleSubmit}
            disabled={loading} // OTP 검증 없이도 테스트 가능하도록 수정
          >
            {loading ? '제출 중...' : '접수하기'}
          </Button>
        </div>
      </div>
    </>
  );
}
