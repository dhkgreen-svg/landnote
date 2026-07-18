'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useListing,
  useUpdateListing,
  useUploadListingImage,
  useDeleteListingImage,
  useDeleteListing,
} from '@/lib/hooks/queries';
import { SUBCATEGORY_LABELS } from '@landnote/shared';
import { ArrowLeft, Pencil, X, Upload, Camera, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AddressSearch } from '@/components/address-search';

const STATUS_LABELS: Record<string, string> = {
  active: '활성', pending: '대기', contracted: '계약완료', closed: '종료',
};

const CATEGORY_LABELS: Record<string, string> = {
  residential: '주거', commercial: '상업', industrial: '산업', land: '토지',
};

const TX_LABELS: Record<string, string> = {
  sale: '매매', jeonse: '전세', monthly_rent: '월세', premium_transfer: '권리금양도',
};

const PRICE_LABELS: Record<string, string> = {
  price_sale: '매매가', deposit: '보증금', monthly_rent: '월세',
  maintenance_fee: '관리비', premium_price: '권리금', contract_remaining_months: '잔여 계약기간',
};

interface ListingImage {
  path: string;
  signed_url: string | null;
  is_representative: boolean;
  label: string | null;
  uploaded_at: string;
}

interface ListingDetail {
  id: string;
  category_codes: string[];
  subcategory_codes: string[];
  tags: string[];
  transaction_types: string[];
  address_full: string | null;
  address_road: string | null;
  dong_name: string | null;
  complex_name: string | null;
  building_num?: string | null;
  room_num?: string | null;
  latitude: number | null;
  longitude: number | null;
  price_sale: number | null;
  price_jeonse?: number | null;
  deposit: number | null;
  monthly_rent: number | null;
  maintenance_fee: number | null;
  premium_price: number | null;
  contract_remaining_months: number | null;
  area_supply: number | null;
  area_exclusive: number | null;
  area_land: number | null;
  area_building: number | null;
  floor_current: number | null;
  floor_total: number | null;
  built_year: number | null;
  direction: string | null;
  images: ListingImage[];
  status: string;
  agent_memo: string | null;
  owner_phone: string | null;
  contract_party_phone: string | null;
  detail_info: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = (height / width) * maxSize; width = maxSize; }
          else { width = (width / height) * maxSize; height = maxSize; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
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

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: listing, isLoading: loading } = useListing(id);
  const updateMutation = useUpdateListing(id);
  const uploadImageMutation = useUploadListingImage(id);
  const deleteImageMutation = useDeleteListingImage(id);
  const deleteListingMutation = useDeleteListing();

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ListingDetail>>({});

  useEffect(() => {
    if (listing) {
      setEditForm({
        status: listing.status,
        agent_memo: listing.agent_memo ?? '',
        address_full: listing.address_full ?? '',
        address_road: listing.address_road ?? '',
        dong_name: listing.dong_name ?? '',
        complex_name: listing.complex_name ?? '',
        building_num: listing.building_num ?? '',
        room_num: listing.room_num ?? '',
        owner_phone: listing.owner_phone ?? '',
        contract_party_phone: listing.contract_party_phone ?? '',
        price_sale: listing.price_sale,
        price_jeonse: listing.price_jeonse,
        deposit: listing.deposit,
        monthly_rent: listing.monthly_rent,
        premium_price: listing.premium_price,
        maintenance_fee: listing.maintenance_fee,
        contract_remaining_months: listing.contract_remaining_months,
        area_supply: listing.area_supply,
        area_exclusive: listing.area_exclusive,
        area_land: listing.area_land,
        area_building: listing.area_building,
        floor_current: listing.floor_current,
        floor_total: listing.floor_total,
        built_year: listing.built_year,
        direction: listing.direction ?? '',
        detail_info: listing.detail_info ?? {},
      });
    }
  }, [listing, editing]); // Reset form when editing is toggled or listing changes

  const handleChange = (field: keyof ListingDetail, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailInfoChange = (field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      detail_info: { ...(prev.detail_info as Record<string, unknown>), [field]: value }
    }));
  };

  const handleSave = () => {
    updateMutation.mutate(
      {
        status: editForm.status,
        agent_memo: editForm.agent_memo || undefined,
        address_full: editForm.address_full || null,
        address_road: editForm.address_road || null,
        dong_name: editForm.dong_name || null,
        complex_name: editForm.complex_name || null,
        building_num: editForm.building_num || null,
        room_num: editForm.room_num || null,
        owner_phone: editForm.owner_phone || null,
        contract_party_phone: editForm.status === 'contracted' ? (editForm.contract_party_phone || null) : null,
        price_sale: editForm.price_sale ? Number(editForm.price_sale) : null,
        price_jeonse: editForm.price_jeonse ? Number(editForm.price_jeonse) : null,
        deposit: editForm.deposit ? Number(editForm.deposit) : null,
        monthly_rent: editForm.monthly_rent ? Number(editForm.monthly_rent) : null,
        premium_price: editForm.premium_price ? Number(editForm.premium_price) : null,
        maintenance_fee: editForm.maintenance_fee ? Number(editForm.maintenance_fee) : null,
        contract_remaining_months: editForm.contract_remaining_months ? Number(editForm.contract_remaining_months) : null,
        area_supply: editForm.area_supply ? Number(editForm.area_supply) : null,
        area_exclusive: editForm.area_exclusive ? Number(editForm.area_exclusive) : null,
        area_land: editForm.area_land ? Number(editForm.area_land) : null,
        area_building: editForm.area_building ? Number(editForm.area_building) : null,
        floor_current: editForm.floor_current ? Number(editForm.floor_current) : null,
        floor_total: editForm.floor_total ? Number(editForm.floor_total) : null,
        built_year: editForm.built_year ? Number(editForm.built_year) : null,
        direction: editForm.direction || null,
        detail_info: editForm.detail_info || null,
      },
      { onSuccess: () => setEditing(false) },
    );
  };
  const saving = updateMutation.isPending;

  const handleDeleteImage = (path: string) => {
    deleteImageMutation.mutate(path);
  };

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const dataUrl = await resizeImage(file, 1920);
      const blob = dataUrlToBlob(dataUrl);
      const formData = new FormData();
      formData.append('file', blob, file.name || 'image.jpg');
      await uploadImageMutation.mutateAsync(formData);
    }
    e.target.value = '';
  };

  const handleDelete = () => {
    if (!confirm('이 매물을 삭제하시겠습니까?')) return;
    deleteListingMutation.mutate(id, {
      onSuccess: () => router.push('/dashboard/listings'),
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        매물을 찾을 수 없습니다
      </div>
    );
  }

  const priceEntries = Object.entries(PRICE_LABELS).filter(
    ([key]) => (listing as any)[key] != null,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/listings')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">매물 상세</h1>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                취소
              </Button>
              <Button variant="default" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-1 h-3 w-3" />
                수정
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="mr-1 h-3 w-3" />
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle className="text-lg">기본 정보</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">카테고리</span>
              <span className="text-sm">{listing.category_codes.map(c => CATEGORY_LABELS[c] ?? c).join(', ')}</span>
            </div>
            {listing.subcategory_codes.length > 0 && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">세부 분류</span>
                <span className="text-sm">{listing.subcategory_codes.map(c => SUBCATEGORY_LABELS[c] ?? c).join(', ')}</span>
              </div>
            )}
            {listing.tags.length > 0 && (
              <div>
                <span className="mb-1 block text-sm text-muted-foreground">태그</span>
                <div className="flex flex-wrap gap-1">
                  {listing.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">거래유형</span>
              <span className="text-sm">{listing.transaction_types.map(t => TX_LABELS[t] ?? t).join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">등록일</span>
              <span className="text-sm">{new Date(listing.created_at).toLocaleString('ko-KR')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Price */}
        <Card>
          <CardHeader><CardTitle className="text-lg">가격 정보</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {editing ? (
              <div className="grid grid-cols-2 gap-4">
                {listing.transaction_types.includes('sale') && (
                  <div>
                    <Label>매매가 (원)</Label>
                    <Input type="number" value={editForm.price_sale || ''} onChange={e => handleChange('price_sale', e.target.value)} />
                  </div>
                )}
                {listing.transaction_types.includes('jeonse') && (
                  <div>
                    <Label>전세보증금 (원)</Label>
                    <Input type="number" value={editForm.price_jeonse || ''} onChange={e => handleChange('price_jeonse', e.target.value)} />
                  </div>
                )}
                {['monthly_rent', 'premium_transfer'].some(t => listing.transaction_types.includes(t)) && (
                  <div>
                    <Label>보증금 (원)</Label>
                    <Input type="number" value={editForm.deposit || ''} onChange={e => handleChange('deposit', e.target.value)} />
                  </div>
                )}
                {['monthly_rent', 'premium_transfer'].some(t => listing.transaction_types.includes(t)) && (
                  <div>
                    <Label>월세 (원)</Label>
                    <Input type="number" value={editForm.monthly_rent || ''} onChange={e => handleChange('monthly_rent', e.target.value)} />
                  </div>
                )}
                {['jeonse', 'monthly_rent', 'premium_transfer'].some(t => listing.transaction_types.includes(t)) && (
                  <div>
                    <Label>관리비 (원)</Label>
                    <Input type="number" value={editForm.maintenance_fee || ''} onChange={e => handleChange('maintenance_fee', e.target.value)} />
                  </div>
                )}
                {listing.transaction_types.includes('premium_transfer') && (
                  <>
                    <div>
                      <Label>권리금 (원)</Label>
                      <Input type="number" value={editForm.premium_price || ''} onChange={e => handleChange('premium_price', e.target.value)} />
                    </div>
                    <div>
                      <Label>잔여 계약기간 (개월)</Label>
                      <Input type="number" value={editForm.contract_remaining_months || ''} onChange={e => handleChange('contract_remaining_months', e.target.value)} />
                    </div>
                  </>
                )}
              </div>
            ) : (
              priceEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">가격 정보 없음</p>
              ) : priceEntries.map(([key, label]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium">
                    {key === 'contract_remaining_months'
                      ? `${(listing as any)[key]}개월`
                      : `${Number((listing as any)[key]).toLocaleString('ko-KR')}원`}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader><CardTitle className="text-lg">위치</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {editing ? (
              <>
                <div>
                  <Label>주소</Label>
                  <AddressSearch
                    value={editForm.complex_name ? `${editForm.address_full} (${editForm.complex_name})` : editForm.address_full || ''}
                    onComplete={(result) => {
                      setEditForm(prev => ({
                        ...prev,
                        address_full: result.address_full,
                        address_road: result.address_road,
                        address_jibun: result.address_jibun,
                        dong_name: result.dong_name,
                        ...(result.building_name ? { complex_name: result.building_name } : {})
                      }));
                    }}
                  />
                </div>
                {!(listing.category_codes.includes('land') || (listing.category_codes.includes('industrial') && !listing.subcategory_codes.includes('knowledge'))) && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>단지명 / 건물명</Label>
                        <Input value={editForm.complex_name || ''} onChange={e => handleChange('complex_name', e.target.value)} />
                      </div>
                      <div>
                        <Label>동/읍/면</Label>
                        <Input value={editForm.dong_name || ''} onChange={e => handleChange('dong_name', e.target.value)} placeholder="동 이름" />
                      </div>
                    </div>
                    {!listing.subcategory_codes.some(c => ['building', 'lodging', 'house', 'other_commercial'].includes(c)) && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>동</Label>
                          <Input value={editForm.building_num || ''} onChange={e => handleChange('building_num', e.target.value)} placeholder="예: 101" />
                        </div>
                        <div>
                          <Label>호수</Label>
                          <Input value={editForm.room_num || ''} onChange={e => handleChange('room_num', e.target.value)} placeholder="예: 1502" />
                        </div>
                      </div>
                    )}
                  </>
                )}
                {(listing.category_codes.includes('land') || (listing.category_codes.includes('industrial') && !listing.subcategory_codes.includes('knowledge'))) && (
                  <div>
                    <Label>동/읍/면</Label>
                    <Input value={editForm.dong_name || ''} onChange={e => handleChange('dong_name', e.target.value)} placeholder="동 이름" />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">주소</span>
                  <span className="text-sm">{listing.address_full || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">동</span>
                  <span className="text-sm">{listing.dong_name || '-'}</span>
                </div>
                {listing.complex_name && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">단지/건물명</span>
                    <span className="text-sm">{listing.complex_name}</span>
                  </div>
                )}
                {!listing.subcategory_codes.some(c => ['building', 'lodging', 'house', 'other_commercial'].includes(c)) && (
                  <>
                    {listing.building_num && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">동</span>
                        <span className="text-sm">{listing.building_num}</span>
                      </div>
                    )}
                    {listing.room_num && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">호수</span>
                        <span className="text-sm">{listing.room_num}</span>
                      </div>
                    )}
                  </>
                )}
                {listing.latitude && listing.longitude && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">좌표</span>
                    <span className="text-sm">{listing.latitude}, {listing.longitude}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader><CardTitle className="text-lg">매물 정보</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {editing ? (
              <div className="space-y-6">
                {/* 1. Area Edit */}
                <div>
                  <h4 className="font-semibold text-sm mb-3">면적 정보</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {(listing.category_codes.includes('land') || (listing.category_codes.includes('industrial') && !listing.subcategory_codes.includes('knowledge')) || listing.subcategory_codes.some(c => ['building', 'lodging', 'other_commercial', 'house'].includes(c))) ? (
                      <>
                        <div>
                          <Label>대지면적 (m²)</Label>
                          <Input type="number" value={editForm.area_land || ''} onChange={e => handleChange('area_land', e.target.value)} />
                        </div>
                        <div>
                          <Label>연면적/건평 (m²)</Label>
                          <Input type="number" value={editForm.area_building || ''} onChange={e => handleChange('area_building', e.target.value)} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label>공급면적 (m²)</Label>
                          <Input type="number" value={editForm.area_supply || ''} onChange={e => handleChange('area_supply', e.target.value)} />
                        </div>
                        <div>
                          <Label>전용면적 (m²)</Label>
                          <Input type="number" value={editForm.area_exclusive || ''} onChange={e => handleChange('area_exclusive', e.target.value)} />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Land/Usage Edit */}
                {(listing.category_codes.includes('land') || (listing.category_codes.includes('industrial') && !listing.subcategory_codes.includes('knowledge')) || listing.subcategory_codes.some(c => ['building', 'lodging', 'other_commercial', 'house'].includes(c))) && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3">토지/용도 정보</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>용도지역</Label>
                        <Input value={editForm.detail_info?.zoning as string || ''} onChange={e => handleDetailInfoChange('zoning', e.target.value)} />
                      </div>
                      <div>
                        <Label>지목</Label>
                        <Input value={editForm.detail_info?.jimok as string || ''} onChange={e => handleDetailInfoChange('jimok', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Label>현재용도</Label>
                        <Input value={editForm.detail_info?.current_usage as string || ''} onChange={e => handleDetailInfoChange('current_usage', e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Industrial Edit */}
                {listing.category_codes.includes('industrial') && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3">산업용 특화</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{listing.subcategory_codes.includes('warehouse') ? '창고 용도' : listing.subcategory_codes.some(c => ['workshop', 'yard', 'other_industrial'].includes(c)) ? '건물 용도' : '공장 용도'}</Label>
                        <Input value={editForm.detail_info?.factory_usage as string || ''} onChange={e => handleDetailInfoChange('factory_usage', e.target.value)} />
                      </div>
                      <div>
                        <Label>업종</Label>
                        <Input value={editForm.detail_info?.business_type as string || ''} onChange={e => handleDetailInfoChange('business_type', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Label>추천 용도</Label>
                        <Input value={editForm.detail_info?.recommended_usage as string || ''} onChange={e => handleDetailInfoChange('recommended_usage', e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Building Edit */}
                {!listing.category_codes.includes('land') && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3">건물/층/방향 정보</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>해당 층</Label>
                        <Input type="number" value={editForm.floor_current || ''} onChange={e => handleChange('floor_current', e.target.value)} />
                      </div>
                      <div>
                        <Label>전체 층</Label>
                        <Input type="number" value={editForm.floor_total || ''} onChange={e => handleChange('floor_total', e.target.value)} />
                      </div>
                      <div>
                        <Label>준공년도</Label>
                        <Input type="number" value={editForm.built_year || ''} onChange={e => handleChange('built_year', e.target.value)} />
                      </div>
                      <div>
                        <Label>방향</Label>
                        <Select value={editForm.direction || ''} onValueChange={v => handleChange('direction', v)}>
                          <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                          <SelectContent>
                            {['남향','남동향','남서향','동향','서향','북향','북동향','북서향'].map(d => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 1. 면적 정보 */}
                {(listing.category_codes.includes('land') || (listing.category_codes.includes('industrial') && !listing.subcategory_codes.includes('knowledge')) || listing.subcategory_codes.some(c => ['building', 'lodging', 'other_commercial', 'house'].includes(c))) ? (
                  <>
                    {listing.area_land != null && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">대지면적</span>
                        <span className="text-sm">{listing.area_land}m2</span>
                      </div>
                    )}
                    {listing.area_building != null && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">연면적/건평</span>
                        <span className="text-sm">{listing.area_building}m2</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {listing.area_supply != null && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">공급면적</span>
                        <span className="text-sm">{listing.area_supply}m2</span>
                      </div>
                    )}
                    {listing.area_exclusive != null && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">전용면적</span>
                        <span className="text-sm">{listing.area_exclusive}m2</span>
                      </div>
                    )}
                  </>
                )}

                {/* 2. 토지/용도 정보 */}
                {(listing.category_codes.includes('land') || (listing.category_codes.includes('industrial') && !listing.subcategory_codes.includes('knowledge')) || listing.subcategory_codes.some(c => ['building', 'lodging', 'other_commercial', 'house'].includes(c))) && (
                  <>
                    {listing.detail_info?.zoning && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">용도지역</span>
                        <span className="text-sm">{listing.detail_info.zoning as string}</span>
                      </div>
                    )}
                    {listing.detail_info?.jimok && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">지목</span>
                        <span className="text-sm">{listing.detail_info.jimok as string}</span>
                      </div>
                    )}
                    {listing.detail_info?.current_usage && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">현재용도 (선택)</span>
                        <span className="text-sm">{listing.detail_info.current_usage as string}</span>
                      </div>
                    )}
                  </>
                )}

                {/* 3. 산업용 특화 필드 */}
                {listing.category_codes.includes('industrial') && (
                  <>
                    {listing.detail_info?.factory_usage && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{listing.subcategory_codes.includes('warehouse') ? '창고 용도' : listing.subcategory_codes.some(c => ['workshop', 'yard', 'other_industrial'].includes(c)) ? '건물 용도' : '공장 용도'}</span>
                        <span className="text-sm">{listing.detail_info.factory_usage as string}</span>
                      </div>
                    )}
                    {listing.detail_info?.business_type && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">업종</span>
                        <span className="text-sm">{listing.detail_info.business_type as string}</span>
                      </div>
                    )}
                    {listing.detail_info?.recommended_usage && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">추천 용도</span>
                        <span className="text-sm">{listing.detail_info.recommended_usage as string}</span>
                      </div>
                    )}
                  </>
                )}

                {/* 4. 건물/층/방향 정보 */}
                {!listing.category_codes.includes('land') && (
                  <>
                    {listing.floor_current != null && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">층</span>
                        <span className="text-sm">{listing.floor_current}/{listing.floor_total ?? '-'}층</span>
                      </div>
                    )}
                    {listing.built_year != null && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">준공년도</span>
                        <span className="text-sm">{listing.built_year}년</span>
                      </div>
                    )}
                    {listing.direction && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">방향</span>
                        <span className="text-sm">{listing.direction}</span>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Images */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">이미지</CardTitle>
          {editing && (
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="mr-1 h-3 w-3" />
                    앨범
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  multiple
                  className="hidden"
                  onChange={handleAddImage}
                />
              </label>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Camera className="mr-1 h-3 w-3" />
                    카메라
                  </span>
                </Button>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  capture="environment"
                  className="hidden"
                  onChange={handleAddImage}
                />
              </label>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {listing.images.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              등록된 이미지가 없습니다
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {listing.images.map((img, i) => (
                <div key={i} className="relative overflow-hidden rounded-lg border">
                  {img.signed_url ? (
                    <img src={img.signed_url} alt={`매물 이미지 ${i + 1}`} className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground">
                      이미지 로드 실패
                    </div>
                  )}
                  {editing && (
                    <button
                      onClick={() => handleDeleteImage(img.path)}
                      className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {img.is_representative && (
                    <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] text-white">
                      대표
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status & Memo (Edit mode) */}
      <Card>
        <CardHeader><CardTitle className="text-lg">상태 관리</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>상태</Label>
            <Select value={editForm.status || ''} onValueChange={v => handleChange('status', v)} disabled={!editing}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>임대인/매도인 연락처</Label>
            {editing ? (
              <Input
                value={editForm.owner_phone || ''}
                onChange={e => handleChange('owner_phone', e.target.value)}
                placeholder="예: 010-1234-5678"
                className="max-w-[300px] mt-1"
              />
            ) : (
              <div className="text-sm mt-1">{listing.owner_phone || '-'}</div>
            )}
          </div>
          {editForm.status === 'contracted' && (
            <div className="p-4 border rounded-md bg-blue-50/50">
              <Label className="text-blue-900 font-semibold">계약 당사자 연락처 (임차인/매수인)</Label>
              {editing ? (
                <Input
                  value={editForm.contract_party_phone || ''}
                  onChange={e => handleChange('contract_party_phone', e.target.value)}
                  placeholder="예: 010-9876-5432"
                  className="max-w-[300px] mt-2 border-blue-200"
                />
              ) : (
                <div className="text-sm mt-2 text-blue-800">{listing.contract_party_phone || '-'}</div>
              )}
            </div>
          )}
          <div>
            <Label>메모</Label>
            <Textarea
              value={editForm.agent_memo || ''}
              onChange={e => handleChange('agent_memo', e.target.value)}
              placeholder="이 매물에 대한 메모"
              rows={4}
              disabled={!editing}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
