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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  useListing,
  useUpdateListing,
  useUploadListingImage,
  useDeleteListingImage,
  useDeleteListing,
} from '@/lib/hooks/queries';
import { SUBCATEGORY_LABELS, SUBCATEGORIES } from '@landnote/shared';
import { ArrowLeft, Pencil, X, Upload, Camera, Trash2, Share2, MessageCircle, MessageSquare, Phone, Shuffle } from 'lucide-react';
import { QuickTemplateButtons } from '@/components/shared/quick-template-buttons';
import { Input } from '@/components/ui/input';
import { AddressSearch } from '@/components/address-search';
import { AreaInput } from '@/components/ui/AreaInput';
import { formatKoreanCurrency, formatPhoneNumber } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  active: '활성', premium: '우수', in_progress: '진행 중', hold: '보류', contracted: '계약완료', closed: '종료',
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

  const toPyung = (m2: number | null | undefined) => m2 ? Number((m2 * 0.3025).toFixed(1)) : '';
  const toM2 = (pyung: string | number) => pyung ? Number((Number(pyung) / 0.3025).toFixed(2)) : null;

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
        category_codes: listing.category_codes ?? [],
        subcategory_codes: listing.subcategory_codes ?? [],
        transaction_types: listing.transaction_types ?? [],
        tags: listing.tags ?? [],
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
        category_codes: editForm.category_codes,
        subcategory_codes: editForm.subcategory_codes,
        transaction_types: editForm.transaction_types,
        tags: editForm.tags,
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
    if (!confirm('정말로 삭제하시겠습니까? 삭제된 데이터는 절대 복구할 수 없습니다.')) return;
    deleteListingMutation.mutate(id, {
      onSuccess: () => router.push('/dashboard/listings'),
    });
  };

  const generateShareText = () => {
    if (!listing) return '';

    const title = `[매물 추천] ${listing.address_full || ''} ${listing.complex_name || ''}`.trim();
    
    const prices = [];
    if (listing.transaction_types.includes('sale') && listing.price_sale) prices.push(`매매: ${formatKoreanCurrency(listing.price_sale)}`);
    if (listing.transaction_types.includes('jeonse') && listing.price_jeonse) prices.push(`전세: ${formatKoreanCurrency(listing.price_jeonse)}`);
    if (listing.transaction_types.includes('monthly_rent') && listing.deposit) prices.push(`월세: ${formatKoreanCurrency(listing.deposit)}/${formatKoreanCurrency(listing.monthly_rent || 0)}`);
    if (listing.transaction_types.includes('premium_transfer') && listing.premium_price) prices.push(`권리금: ${formatKoreanCurrency(listing.premium_price)}`);

    const areaParts = [];
    if (listing.category_codes.includes('land') || (listing.category_codes.includes('industrial') && !listing.subcategory_codes.includes('knowledge')) || listing.subcategory_codes.some(c => ['building', 'lodging', 'other_commercial', 'house'].includes(c))) {
      if (listing.area_land) areaParts.push(`대지 ${toPyung(listing.area_land)}평`);
      if (listing.area_building) areaParts.push(`연면적 ${toPyung(listing.area_building)}평`);
    } else {
      if (listing.area_exclusive) areaParts.push(`전용 ${toPyung(listing.area_exclusive)}평`);
      if (listing.area_supply) areaParts.push(`공급 ${toPyung(listing.area_supply)}평`);
    }

    const textParts = [title];
    const locParts = [listing.address_full || ''];
    if (listing.dong_name) locParts.push(listing.dong_name);
    if (listing.building_num) locParts.push(`${listing.building_num}동`);
    if (listing.room_num) locParts.push(`${listing.room_num}호`);
    textParts.push(`📍 위치: ${locParts.join(' ')}`);

    if (prices.length > 0) textParts.push(`💰 가격: ${prices.join(', ')}`);
    if (areaParts.length > 0) textParts.push(`📏 면적: ${areaParts.join(' / ')}`);
    if (listing.floor_current) textParts.push(`🏢 층수: ${listing.floor_current}/${listing.floor_total || '?'}층`);
    if (listing.agent_memo) textParts.push(`\n📝 특징:\n${listing.agent_memo}`);

    textParts.push(`\n*자세한 사항은 문의 바랍니다.*`);
    
    return textParts.join('\n');
  };

  const handleShareKakao = async () => {
    const text = generateShareText();
    if (!text) return;
    
    if (!(window as any).Kakao) {
      alert('카카오톡 공유 기능을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
      return;
    }

    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!kakaoKey) {
      alert('카카오 앱 키가 설정되지 않았습니다. 관리자에게 문의하세요.');
      return;
    }

    if (!(window as any).Kakao.isInitialized()) {
      (window as any).Kakao.init(kakaoKey);
    }

    (window as any).Kakao.Share.sendDefault({
      objectType: 'text',
      text: text,
      link: {
        mobileWebUrl: window.location.origin,
        webUrl: window.location.origin,
      },
      buttonTitle: '앱에서 보기',
    });
  };

  const handleShareSMS = (phone?: string) => {
    const text = generateShareText();
    if (!text) return;
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white border-none">
                    <Share2 className="mr-1 h-3 w-3" />
                    공유
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleShareKakao} className="cursor-pointer">
                    <MessageCircle className="mr-2 h-4 w-4 text-yellow-500" />
                    카카오톡
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShareSMS()} className="cursor-pointer">
                    <MessageSquare className="mr-2 h-4 w-4 text-blue-500" />
                    문자 전송
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="default" size="sm" onClick={() => router.push(`/dashboard/matching?listingId=${listing.id}`)} className="bg-green-600 hover:bg-green-700 text-white border-none">
                <Shuffle className="mr-1 h-3 w-3" />
                매칭
              </Button>
              <Button variant="default" size="sm" onClick={() => setEditing(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Pencil className="mr-1 h-3 w-3" />
                수정
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle className="text-lg">기본 정보</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <div className="space-y-5">
                <div>
                  <Label className="mb-2 block">카테고리</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(CATEGORY_LABELS).map(([code, label]) => (
                      <Badge
                        key={code}
                        variant={editForm.category_codes?.includes(code) ? 'default' : 'outline'}
                        className="cursor-pointer px-3 py-1.5 text-sm transition-colors"
                        onClick={() => {
                          handleChange('category_codes', [code]);
                          // Clear subcategories since category changed
                          handleChange('subcategory_codes', []);
                        }}
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {editForm.category_codes && editForm.category_codes.length > 0 && (
                  <div>
                    <Label className="mb-2 block">세부 분류</Label>
                    <div className="flex flex-wrap gap-2">
                      {editForm.category_codes.map(cat => {
                        const groups = SUBCATEGORIES[cat as keyof typeof SUBCATEGORIES] || {};
                        return Object.keys(groups).map(subCode => (
                          <Badge
                            key={subCode}
                            variant={editForm.subcategory_codes?.includes(subCode) ? 'secondary' : 'outline'}
                            className="cursor-pointer px-3 py-1.5 text-sm transition-colors"
                            onClick={() => {
                              const current = editForm.subcategory_codes || [];
                              const next = current.includes(subCode) 
                                ? current.filter(c => c !== subCode)
                                : [...current, subCode];
                              handleChange('subcategory_codes', next);
                            }}
                          >
                            {SUBCATEGORY_LABELS[subCode] || subCode}
                          </Badge>
                        ));
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="mb-2 block">거래 유형 (다중 선택 가능)</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(TX_LABELS).map(([code, label]) => {
                      const isSelected = editForm.transaction_types?.includes(code);
                      return (
                        <Badge
                          key={code}
                          variant="outline"
                          className={`cursor-pointer px-3 py-1.5 text-sm transition-colors border-none ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'}`}
                          onClick={() => {
                            const current = editForm.transaction_types || [];
                            let next;
                            if (code === 'premium_transfer') {
                              // 권리금 양도는 단독 선택
                              next = current.includes(code) ? [] : [code];
                            } else {
                              // 다른 것들을 선택할 땐 권리금 양도를 해제
                              const withoutPremium = current.filter(c => c !== 'premium_transfer');
                              next = withoutPremium.includes(code) 
                                ? withoutPremium.filter(c => c !== code)
                                : [...withoutPremium, code];
                            }
                            handleChange('transaction_types', next);
                          }}
                        >
                          {label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
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
              </div>
            )}
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
                      : formatKoreanCurrency(Number((listing as any)[key]))}
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
                        <AreaInput label="대지면적" value={String(editForm.area_land || '')} onChange={val => handleChange('area_land', val ? Number(val) : null)} />
                        <AreaInput label="연면적/건평" value={String(editForm.area_building || '')} onChange={val => handleChange('area_building', val ? Number(val) : null)} />
                      </>
                    ) : (
                      <>
                        <AreaInput label="공급면적" value={String(editForm.area_supply || '')} onChange={val => handleChange('area_supply', val ? Number(val) : null)} />
                        <AreaInput label="전용면적" value={String(editForm.area_exclusive || '')} onChange={val => handleChange('area_exclusive', val ? Number(val) : null)} />
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
                        <span className="text-sm">{toPyung(listing.area_land)}평 ({listing.area_land}m²)</span>
                      </div>
                    )}
                    {listing.area_building != null && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">연면적/건평</span>
                        <span className="text-sm">{toPyung(listing.area_building)}평 ({listing.area_building}m²)</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {listing.area_supply != null && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">공급면적</span>
                        <span className="text-sm">{toPyung(listing.area_supply)}평 ({listing.area_supply}m²)</span>
                      </div>
                    )}
                    {listing.area_exclusive != null && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">전용면적</span>
                        <span className="text-sm">{toPyung(listing.area_exclusive)}평 ({listing.area_exclusive}m²)</span>
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
            <Select 
              value={editing ? (editForm.status || '') : (listing.status || '')} 
              onValueChange={v => {
                if (editing) {
                  handleChange('status', v);
                } else {
                  updateMutation.mutate({ status: v });
                }
              }} 
              disabled={!editing && saving}
            >
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
                onChange={e => handleChange('owner_phone', formatPhoneNumber(e.target.value))}
                placeholder="예: 010-1234-5678"
                className="max-w-[300px] mt-1"
              />
            ) : (
              <div className="mt-2 space-y-2">
                <div className="text-sm font-medium">{listing.owner_phone || '등록된 번호가 없습니다'}</div>
                {listing.owner_phone && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${listing.owner_phone.replace(/[^0-9]/g, '')}`}>
                        <Phone className="mr-1 h-3 w-3" /> 전화걸기
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShareSMS(listing.owner_phone!)}>
                      <MessageSquare className="mr-1 h-3 w-3 text-blue-500" /> 문자전송
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShareKakao}>
                      <MessageCircle className="mr-1 h-3 w-3 text-yellow-500" /> 카톡공유
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          {editForm.status === 'contracted' && (
            <div className="p-4 border rounded-md bg-blue-50/50">
              <Label className="text-blue-900 font-semibold">계약 당사자 연락처 (임차인/매수인)</Label>
              {editing ? (
                <Input
                  value={editForm.contract_party_phone || ''}
                  onChange={e => handleChange('contract_party_phone', formatPhoneNumber(e.target.value))}
                  placeholder="예: 010-9876-5432"
                  className="max-w-[300px] mt-2 border-blue-200"
                />
              ) : (
                <div className="mt-2 space-y-2">
                  <div className="text-sm font-medium text-blue-800">{listing.contract_party_phone || '등록된 번호가 없습니다'}</div>
                  {listing.contract_party_phone && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${listing.contract_party_phone.replace(/[^0-9]/g, '')}`}>
                          <Phone className="mr-1 h-3 w-3" /> 전화걸기
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleShareSMS(listing.contract_party_phone!)}>
                        <MessageSquare className="mr-1 h-3 w-3 text-blue-500" /> 문자전송
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleShareKakao}>
                        <MessageCircle className="mr-1 h-3 w-3 text-yellow-500" /> 카톡공유
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="space-y-2 mt-4">
            <Label>메모</Label>
            {editing && (
              <QuickTemplateButtons 
                syncCategory={editForm.category_codes?.[0]}
                onSelect={(text) => handleChange('agent_memo', (editForm.agent_memo || '') ? editForm.agent_memo + '\n' + text : text)}
              />
            )}
            <Textarea
              value={editing ? editForm.agent_memo || '' : listing.agent_memo || ''}
              onChange={e => handleChange('agent_memo', e.target.value)}
              placeholder="이 매물에 대한 메모"
              rows={4}
              disabled={!editing}
            />
          </div>
        </CardContent>
      </Card>

      {!editing && (
        <div className="flex justify-end pt-4">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            매물 삭제
          </Button>
        </div>
      )}
    </div>
  );
}
