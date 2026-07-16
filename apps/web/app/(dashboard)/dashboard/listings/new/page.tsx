'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch, apiUpload } from '@/lib/api';
import { useAgent } from '@/lib/hooks/use-agent';
import {
  CATEGORY_CODE, SUBCATEGORIES, SUBCATEGORY_LABELS, TRANSACTION_TYPE,
  REQUIRED_PRICE_FIELDS,
} from '@landnote/shared';
import type { CategoryCode, TransactionType } from '@landnote/shared';
import { X, Upload, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { AddressSearch } from '@/components/address-search';

const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거', commercial: '상업', industrial: '산업', land: '토지',
};

const TX_LABELS: Record<string, string> = {
  sale: '매매', jeonse: '전세', monthly_rent: '월세', premium_transfer: '권리금양도',
};

const PRICE_LABELS: Record<string, string> = {
  price_sale: '매매가 (원)', deposit: '보증금 (원)', monthly_rent: '월세 (원)',
  maintenance_fee: '관리비 (원)', premium_price: '권리금 (원)',
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

export default function NewListingPage() {
  const router = useRouter();
  const { agent } = useAgent();

  const [categoryCodes, setCategoryCodes] = useState<string[]>([]);
  const [subcategoryCodes, setSubcategoryCodes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [addressFull, setAddressFull] = useState('');
  const [addressRoad, setAddressRoad] = useState('');
  const [addressJibun, setAddressJibun] = useState('');
  const [dongName, setDongName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [areaSupply, setAreaSupply] = useState('');
  const [areaExclusive, setAreaExclusive] = useState('');
  const [floorCurrent, setFloorCurrent] = useState('');
  const [floorTotal, setFloorTotal] = useState('');
  const [builtYear, setBuiltYear] = useState('');
  const [direction, setDirection] = useState('');
  const [memo, setMemo] = useState('');
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const agentCategories = agent?.selected_categories ?? [];

  const toggleCategorySelection = (mainCode: string, subCode: string, item: string) => {
    // Single selection for listing registration
    setCategoryCodes([mainCode]);
    setSubcategoryCodes([subCode]);
    setTags([item]);
    // If not commercial, remove premium_transfer from selected tx types
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

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        category_codes: categoryCodes,
        subcategory_codes: subcategoryCodes,
        tags,
        transaction_types: transactionTypes,
        address_full: addressFull || undefined,
        address_road: addressRoad || undefined,
        address_jibun: addressJibun || undefined,
        dong_name: dongName || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        area_supply: areaSupply ? parseFloat(areaSupply) : undefined,
        area_exclusive: areaExclusive ? parseFloat(areaExclusive) : undefined,
        floor_current: floorCurrent ? parseInt(floorCurrent) : undefined,
        floor_total: floorTotal ? parseInt(floorTotal) : undefined,
        built_year: builtYear ? parseInt(builtYear) : undefined,
        direction: direction || undefined,
        agent_memo: memo || undefined,
      };

      for (const field of uniquePriceFields) {
        if (prices[field]) {
          body[field] = parseFloat(prices[field]);
        }
      }

      const listing = await apiFetch<{ id: string }>('/listings', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      for (const img of images) {
        const blob = dataUrlToBlob(img.dataUrl);
        const formData = new FormData();
        formData.append('file', blob, img.name || 'image.jpg');
        await apiUpload(`/listings/${listing.id}/images`, formData);
      }

      router.push(`/dashboard/listings/${listing.id}`);
    } catch (err: any) {
      setError(err.message || '매물 등록에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">새 매물 등록</h1>

      {/* Category Selection */}
      <Card>
        <CardHeader><CardTitle className="text-lg">카테고리</CardTitle></CardHeader>
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
        <CardHeader><CardTitle className="text-lg">거래 정보</CardTitle></CardHeader>
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
                type="number"
                value={prices[field] ?? ''}
                onChange={e => setPrices(prev => ({ ...prev, [field]: e.target.value }))}
                placeholder="0"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Address & Location */}
      <Card>
        <CardHeader><CardTitle className="text-lg">위치</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>주소</Label>
            <AddressSearch
              value={addressFull}
              onComplete={(result) => {
                setAddressFull(result.address_full);
                setAddressRoad(result.address_road);
                setAddressJibun(result.address_jibun);
                setDongName(result.dong_name);
              }}
            />
          </div>
          <div>
            <Label>동/읍/면</Label>
            <Input value={dongName} onChange={e => setDongName(e.target.value)} placeholder="동 이름" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>위도</Label>
              <Input type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="37.5" />
            </div>
            <div>
              <Label>경도</Label>
              <Input type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="127.0" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Details */}
      <Card>
        <CardHeader><CardTitle className="text-lg">매물 정보</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>공급면적 (m2)</Label>
              <Input type="number" step="0.01" value={areaSupply} onChange={e => setAreaSupply(e.target.value)} />
            </div>
            <div>
              <Label>전용면적 (m2)</Label>
              <Input type="number" step="0.01" value={areaExclusive} onChange={e => setAreaExclusive(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>현재 층</Label>
              <Input type="number" value={floorCurrent} onChange={e => setFloorCurrent(e.target.value)} />
            </div>
            <div>
              <Label>총 층</Label>
              <Input type="number" value={floorTotal} onChange={e => setFloorTotal(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>준공년도</Label>
              <Input type="number" value={builtYear} onChange={e => setBuiltYear(e.target.value)} placeholder="2020" />
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
              <span className="text-xs">추가</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                multiple
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

      {/* Memo */}
      <Card>
        <CardHeader><CardTitle className="text-lg">메모</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="이 매물에 대한 메모를 작성하세요"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>취소</Button>
        <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              등록 중...
            </>
          ) : '매물 등록'}
        </Button>
      </div>
    </div>
  );
}
