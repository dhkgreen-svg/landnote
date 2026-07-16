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
import { ArrowLeft, Pencil, X, Upload, Trash2 } from 'lucide-react';
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
  latitude: number | null;
  longitude: number | null;
  price_sale: number | null;
  deposit: number | null;
  monthly_rent: number | null;
  maintenance_fee: number | null;
  premium_price: number | null;
  contract_remaining_months: number | null;
  area_supply: number | null;
  area_exclusive: number | null;
  floor_current: number | null;
  floor_total: number | null;
  built_year: number | null;
  direction: string | null;
  images: ListingImage[];
  status: string;
  agent_memo: string | null;
  owner_phone: string | null;
  contract_party_phone: string | null;
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
  const [status, setStatus] = useState('');
  const [memo, setMemo] = useState('');
  const [editAddressFull, setEditAddressFull] = useState('');
  const [editAddressRoad, setEditAddressRoad] = useState('');
  const [editAddressJibun, setEditAddressJibun] = useState('');
  const [editDongName, setEditDongName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [contractPartyPhone, setContractPartyPhone] = useState('');

  useEffect(() => {
    if (listing) {
      setStatus(listing.status);
      setMemo(listing.agent_memo ?? '');
      setEditAddressFull(listing.address_full ?? '');
      setEditAddressRoad(listing.address_road ?? '');
      setEditDongName(listing.dong_name ?? '');
      setOwnerPhone(listing.owner_phone ?? '');
      setContractPartyPhone(listing.contract_party_phone ?? '');
    }
  }, [listing]);

  const handleSave = () => {
    updateMutation.mutate(
      {
        status,
        agent_memo: memo,
        address_full: editAddressFull || null,
        address_road: editAddressRoad || null,
        address_jibun: editAddressJibun || null,
        dong_name: editDongName || null,
        owner_phone: ownerPhone || null,
        contract_party_phone: status === 'contracted' ? (contractPartyPhone || null) : null,
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
          <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
            <Pencil className="mr-1 h-3 w-3" />
            {editing ? '취소' : '수정'}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-1 h-3 w-3" />
            삭제
          </Button>
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
            {priceEntries.length === 0 ? (
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
            ))}
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
                    value={editAddressFull}
                    onComplete={(result) => {
                      setEditAddressFull(result.address_full);
                      setEditAddressRoad(result.address_road);
                      setEditAddressJibun(result.address_jibun);
                      setEditDongName(result.dong_name);
                    }}
                  />
                </div>
                <div>
                  <Label>동/읍/면</Label>
                  <Input value={editDongName} onChange={e => setEditDongName(e.target.value)} placeholder="동 이름" />
                </div>
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
            {listing.area_supply && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">공급면적</span>
                <span className="text-sm">{listing.area_supply}m2</span>
              </div>
            )}
            {listing.area_exclusive && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">전용면적</span>
                <span className="text-sm">{listing.area_exclusive}m2</span>
              </div>
            )}
            {listing.floor_current != null && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">층</span>
                <span className="text-sm">{listing.floor_current}/{listing.floor_total ?? '-'}층</span>
              </div>
            )}
            {listing.built_year && (
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
          </CardContent>
        </Card>
      </div>

      {/* Images */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">이미지</CardTitle>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="mr-1 h-3 w-3" />
                추가
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
                  <button
                    onClick={() => handleDeleteImage(img.path)}
                    className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  >
                    <X className="h-3 w-3" />
                  </button>
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
            <Select value={status} onValueChange={setStatus} disabled={!editing}>
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
                value={ownerPhone}
                onChange={e => setOwnerPhone(e.target.value)}
                placeholder="예: 010-1234-5678"
                className="max-w-[300px] mt-1"
              />
            ) : (
              <div className="text-sm mt-1">{listing.owner_phone || '-'}</div>
            )}
          </div>
          {status === 'contracted' && (
            <div className="p-4 border rounded-md bg-blue-50/50">
              <Label className="text-blue-900 font-semibold">계약 당사자 연락처 (임차인/매수인)</Label>
              {editing ? (
                <Input
                  value={contractPartyPhone}
                  onChange={e => setContractPartyPhone(e.target.value)}
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
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="이 매물에 대한 메모"
              rows={4}
              disabled={!editing}
            />
          </div>
          {editing && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
