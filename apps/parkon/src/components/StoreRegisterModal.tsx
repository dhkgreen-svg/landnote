'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Store, Sparkles, MapPin, Phone, Gift, Image, Plus, Minus, Search, AlertCircle } from 'lucide-react';
import { Course } from '@/types/parkon';
import { AffiliatedStore, StoreCategory, RestaurantSubCategory, AUCTION_RULES, AuctionStorage } from '@/lib/auctionStorage';

interface StoreRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  initialCourseId?: string | null;
  onSuccess: (newStore: AffiliatedStore) => void;
  isJapanese?: boolean;
}

const SAMPLE_IMAGES = [
  { label: '한식/국밥/찌개', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80' },
  { label: '고기/구이/불고기', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80' },
  { label: '국수/냉면/칼국수', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80' },
  { label: '카페/디저트/베이커리', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80' },
  { label: '백숙/오리/단체회식', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=80' },
  { label: '스크린골프 매장', url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=500&auto=format&fit=crop&q=80' },
];

export function StoreRegisterModal({
  isOpen,
  onClose,
  courses,
  initialCourseId,
  onSuccess,
  isJapanese = false,
}: StoreRegisterModalProps) {
  const currency = isJapanese ? 'JPY' : 'KRW';
  const minBid = isJapanese ? AUCTION_RULES.JPY.MIN_BID : AUCTION_RULES.KRW.MIN_BID;
  const bidStep = isJapanese ? AUCTION_RULES.JPY.BID_STEP : AUCTION_RULES.KRW.BID_STEP;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Form States
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [subCategory, setSubCategory] = useState<RestaurantSubCategory>('한식·탕');
  const [signatureMenu, setSignatureMenu] = useState('');
  const [couponBenefit, setCouponBenefit] = useState('');
  const [imageUrl, setImageUrl] = useState(SAMPLE_IMAGES[0].url);
  const [customImageInput, setCustomImageInput] = useState('');
  const [description, setDescription] = useState('');
  const [distanceMinutesText, setDistanceMinutesText] = useState('차량 5분 생활권');

  // Plan State: 'FREE' | 'AUCTION' (기본 무료 우선)
  const [planType, setPlanType] = useState<'FREE' | 'AUCTION'>('FREE');
  const [bidAmount, setBidAmount] = useState<number>(minBid);

  // Target Courses State (다중 체크박스)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(() => {
    if (initialCourseId && initialCourseId !== 'ALL') {
      return [initialCourseId];
    }
    // 기본으로 첫 번째 구장 또는 구미 동락 선택
    const dongrak = courses.find((c) => c.id.includes('dongrak') || c.name.includes('동락'));
    return dongrak ? [dongrak.id] : courses.length > 0 ? [courses[0].id] : [];
  });
  const [courseSearchTerm, setCourseSearchTerm] = useState('');

  // 필터된 구장 목록
  const filteredCourseList = useMemo(() => {
    if (!courseSearchTerm.trim()) {
      return courses.slice(0, 30);
    }
    const q = courseSearchTerm.trim().toLowerCase();
    return courses.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.region && c.region.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [courses, courseSearchTerm]);

  // 구장 토글
  const toggleCourse = (cId: string) => {
    setSelectedCourseIds((prev) => {
      if (prev.includes(cId)) {
        if (prev.length === 1) {
          alert('최소 1개 이상의 입점 희망 구장을 선택해야 합니다.');
          return prev;
        }
        return prev.filter((id) => id !== cId);
      }
      return [...prev, cId];
    });
  };

  // 입찰가 증감
  const handleBidIncrement = (delta: number) => {
    setBidAmount((prev) => Math.max(minBid, prev + delta));
  };

  // 실시간 합산 금액 계산
  const currentTotal = useMemo(() => {
    if (planType === 'FREE') return 0;
    return AuctionStorage.calculateTotal(selectedCourseIds.length, bidAmount);
  }, [planType, selectedCourseIds.length, bidAmount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      alert('상호명을 입력해 주세요.');
      return;
    }
    if (!phone.trim()) {
      alert('매장 전화번호를 입력해 주세요.');
      return;
    }
    if (!address.trim()) {
      alert('매장 주소를 입력해 주세요.');
      return;
    }
    if (!couponBenefit.trim()) {
      alert('골퍼 방문객에게 제공할 [쿠폰 혜택]을 입력해 주세요. (예: 음료수 1캔 무료)');
      return;
    }
    if (selectedCourseIds.length === 0) {
      alert('최소 1개 이상의 입점 구장을 선택해 주세요.');
      return;
    }

    const targetCourseNames = selectedCourseIds
      .map((id) => courses.find((c) => c.id === id)?.name || id)
      .filter(Boolean);

    const newStoreData: Omit<AffiliatedStore, 'id' | 'createdAt'> = {
      name: storeName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      category: 'RESTAURANT',
      subCategory: subCategory,
      couponBenefit: couponBenefit.trim(),
      signatureMenu: signatureMenu.trim() || undefined,
      imageUrl: customImageInput.trim() || imageUrl,
      targetCourseIds: selectedCourseIds,
      targetCourseNames: targetCourseNames,
      bidAmount: planType === 'FREE' ? 0 : bidAmount,
      currency: currency,
      description: description.trim() || undefined,
      distanceMinutesText: distanceMinutesText.trim() || '인근 생활권',
      distanceKm: 2.5,
    };

    const created = AuctionStorage.addStore(newStoreData);
    alert(
      planType === 'AUCTION'
        ? `🎉 [파키 추천 상단 옥션 입점 신청 완료!]\n선택 구장: ${selectedCourseIds.length}개\n월 입찰가: ${bidAmount.toLocaleString()}${isJapanese ? '円' : '원'}\n총 합산: 월 ${currentTotal.toLocaleString()}${isJapanese ? '円' : '원'}\n\n구장 목록 상단에 '파키 추천' 뱃지와 함께 우선 노출됩니다!`
        : `🎉 [기본 무료 입점 등록 완료!]\n선택 구장: ${selectedCourseIds.length}개\n쿠폰 혜택: ${couponBenefit.trim()}\n\n0원에 정상 등록되었으며 매장 목록에 롤링 노출됩니다.`
    );
    onSuccess(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-emerald-600 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
              🏪
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black tracking-tight">
                  {isJapanese ? '提携店舗 無料出店申請' : '제휴 매장 무료 입점 신청'}
                </h2>
                <span className="text-[10px] bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full font-black">
                  {isJapanese ? '100% 無料' : '100% 무료'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                {isJapanese
                  ? '初期費用0円で無料出店！全国のゴルファー集客＆クーポン宣伝（後から必要時にオークション参加可能）'
                  : '초기 비용 0원 무료 입점! 전국 파크골퍼 손님 유치 & 쿠폰 홍보 (운영 중 필요 시 상단 옥션 신청 가능)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 본문 (스크롤) */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-bold text-stone-800 flex-1">
          {/* 1. 상호명 & 전화번호 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-emerald-700" />
                <span>상호명 (매장명) *</span>
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="상호명 입력 (예: 맛있는 손두부·국밥)"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>매장 전화번호 *</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="전화번호 입력 (예: 054-000-0000)"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* 2. 매장 주소 & 이동시간 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-black text-stone-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>매장 주소 *</span>
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="도로명 또는 지번 주소 입력"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1">
                구장 기준 이동권역
              </label>
              <select
                value={distanceMinutesText}
                onChange={(e) => setDistanceMinutesText(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              >
                <option value="도보 3분 초밀접">도보 3분 초밀접</option>
                <option value="차량 3분 생활권">차량 3분 생활권</option>
                <option value="차량 5분 생활권">차량 5분 생활권</option>
                <option value="차량 8분 생활권">차량 8분 생활권</option>
                <option value="차량 10~15분 생활권">차량 10~15분 권역</option>
              </select>
            </div>
          </div>

          {/* 3. 음식 분류 & 대표 메뉴 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1">
                음식 / 업종 분류 *
              </label>
              <select
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value as RestaurantSubCategory)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              >
                <option value="한식·탕">🍲 한식·탕 (국밥, 백반, 찌개)</option>
                <option value="고기·구이">🥩 고기·구이 (삼겹살, 불고기)</option>
                <option value="국수·면류">🍜 국수·면류 (칼국수, 막국수)</option>
                <option value="카페·간식">☕ 카페·간식 (커피, 베이커리)</option>
                <option value="단체·회식">🍻 단체·회식 (오리백숙, 단체룸)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1">
                대표 메뉴 및 가격
              </label>
              <input
                type="text"
                value={signatureMenu}
                onChange={(e) => setSignatureMenu(e.target.value)}
                placeholder="예: 해물 순두부 (10,000원)"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* 4. [핵심] 골퍼 전용 쿠폰 혜택 (필수!) */}
          <div className="bg-amber-50 border-2 border-amber-400/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                <span>골퍼 제공 [쿠폰 혜택] 입력 (필수) *</span>
              </label>
              <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-2 py-0.5 rounded-full">
                고객 유치 핵심!
              </span>
            </div>
            <input
              type="text"
              required
              value={couponBenefit}
              onChange={(e) => setCouponBenefit(e.target.value)}
              placeholder="예: 테이블당 음료수 1캔 무료 / 메인메뉴 10% 할인 / 맛보기 만두 서비스"
              className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-950 outline-none focus:border-amber-600"
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                '테이블당 음료수 1캔 무료',
                '파크골퍼 식사 시 맛보기 만두 서비스',
                '4인 방문 시 계란찜 서비스',
                '전 메뉴 10% 즉시 할인',
                '식후 아메리카노 1잔 무료',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCouponBenefit(preset)}
                  className="text-[10px] bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 px-2 py-1 rounded-lg font-bold transition cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 5. 대표 이미지 선택 */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-stone-700 flex items-center gap-1">
              <Image className="w-3.5 h-3.5 text-emerald-700" />
              <span>대표 이미지 (음식 / 매장 사진)</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {SAMPLE_IMAGES.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    setImageUrl(sample.url);
                    setCustomImageInput('');
                  }}
                  className={`p-1 rounded-xl border text-center transition cursor-pointer relative group ${
                    imageUrl === sample.url && !customImageInput
                      ? 'border-emerald-600 ring-2 ring-emerald-500 bg-emerald-50'
                      : 'border-stone-200 hover:border-stone-400 bg-stone-50'
                  }`}
                >
                  <img
                    src={sample.url}
                    alt={sample.label}
                    className="w-full h-12 object-cover rounded-lg mb-1"
                  />
                  <span className="text-[9px] font-extrabold text-stone-700 truncate block">
                    {sample.label}
                  </span>
                  {imageUrl === sample.url && !customImageInput && (
                    <span className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customImageInput}
              onChange={(e) => setCustomImageInput(e.target.value)}
              placeholder="또는 인터넷 이미지 URL 직접 입력 (선택)"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-[11px] font-medium text-stone-800 outline-none focus:border-emerald-600"
            />
          </div>

          {/* 6. [핵심] 입점 플랜 선택: 기본 무료 (0원) vs 상단 파키 추천 옥션 */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-stone-900">
                입점 노출 플랜 선택 *
              </label>
              <span className="text-[10px] text-stone-500 font-bold">
                슬롯 개수 제한 없음 (무제한)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: 기본 무료 등록 */}
              <button
                type="button"
                onClick={() => setPlanType('FREE')}
                className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  planType === 'FREE'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/30'
                    : 'border-stone-200 bg-stone-50 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-stone-900">
                      {isJapanese ? '基本無料出店 (推奨)' : '100% 무료 입점 (기본)'}
                    </span>
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                      0원
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-600 mt-1 leading-tight font-medium">
                    {isJapanese
                      ? '初期費用0円で店舗情報とクーポンを常時無料掲載。後からいつでも上位オークション参加可能。'
                      : '초기 비용 0원 무료 입점! 매장 정보 및 쿠폰 상시 홍보. 필요할 때 언제든 상단 옥션 신청 가능'}
                  </p>
                </div>
                <div className="mt-2 text-[10px] font-black text-emerald-800">
                  {planType === 'FREE' ? '✓ 기본 선택됨' : '선택하기'}
                </div>
              </button>

              {/* Option 2: 상단 파키 추천 옥션 */}
              <button
                type="button"
                onClick={() => setPlanType('AUCTION')}
                className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  planType === 'AUCTION'
                    ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/40'
                    : 'border-stone-200 bg-stone-50 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-amber-950 flex items-center gap-1">
                      <span>👑</span>
                      <span>{isJapanese ? '上位推薦オークション' : '상단 파키 추천 옥션'}</span>
                    </span>
                    <span className="text-[10px] font-black bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded">
                      {isJapanese ? '月300円〜' : '월 3,000원~'}
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-900 mt-1 leading-tight font-medium">
                    {isJapanese
                      ? '最初から最上位固定露出をご希望の店舗様のみ選択'
                      : '처음부터 최상단 고정 노출을 원하시는 매장만 선택 (선택 사항)'}
                  </p>
                </div>
                <div className="mt-2 text-[10px] font-black text-amber-900">
                  {planType === 'AUCTION' ? '✓ 선택됨' : '선택하기'}
                </div>
              </button>
            </div>

            {/* 옥션 입찰가 세팅 (옥션 선택 시 표시) */}
            {planType === 'AUCTION' && (
              <div className="bg-amber-100/70 border border-amber-300 rounded-2xl p-3 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-amber-950">
                    구장당 월 입찰 희망가 (최저 {minBid.toLocaleString()}{isJapanese ? '円' : '원'}부터)
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">
                    호가단위: +{bidStep.toLocaleString()}{isJapanese ? '円' : '원'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBidIncrement(-bidStep)}
                    disabled={bidAmount <= minBid}
                    className="w-10 h-10 rounded-xl bg-white border border-amber-300 text-amber-950 font-black text-base flex items-center justify-center disabled:opacity-40 hover:bg-amber-50 cursor-pointer shadow-2xs"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-1 bg-white border-2 border-amber-400 rounded-xl py-2 px-3 text-center">
                    <span className="text-base font-black text-amber-950">
                      월 {bidAmount.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-amber-900 ml-1">
                      {isJapanese ? '円' : '원'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBidIncrement(bidStep)}
                    className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 font-black text-base flex items-center justify-center hover:bg-amber-400 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-1.5 justify-center">
                  {[3000, 5000, 10000, 20000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBidAmount(isJapanese ? Math.round(preset / 10) : preset)}
                      className="text-[10px] bg-white border border-amber-300 px-2 py-1 rounded-lg font-black text-amber-950 hover:bg-amber-200 transition cursor-pointer"
                    >
                      월 {(isJapanese ? Math.round(preset / 10) : preset).toLocaleString()}{isJapanese ? '円' : '원'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 7. [핵심] 입점 대상 구장 선택 (다중 체크박스 & 실시간 1:1 독립 과금 합산) */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-black text-stone-900">
                  입점 희망 구장 선택 (다중 체크) *
                </label>
                <p className="text-[10px] text-stone-500 font-medium">
                  묶음 할인 없는 1:1 독립 과금 (선택 구장 수 × 입찰가)
                </p>
              </div>
              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                {selectedCourseIds.length}개 구장 선택됨
              </span>
            </div>

            {/* 구장 검색창 */}
            <div className="relative">
              <input
                type="text"
                value={courseSearchTerm}
                onChange={(e) => setCourseSearchTerm(e.target.value)}
                placeholder="구장명 또는 지역 검색 (예: 동락, 지산, 아리랑, 대구)"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* 구장 목록 다중 체크박스 (스크롤) */}
            <div className="max-h-36 overflow-y-auto border border-stone-200 rounded-2xl p-2 bg-stone-50 space-y-1">
              {filteredCourseList.map((course) => {
                const isChecked = selectedCourseIds.includes(course.id);
                return (
                  <label
                    key={course.id}
                    onClick={() => toggleCourse(course.id)}
                    className={`flex items-center justify-between p-2 rounded-xl border transition cursor-pointer select-none ${
                      isChecked
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-2xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-emerald-700 border-emerald-700 text-white' : 'border-stone-300 bg-white'
                      }`}>
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                      <span className="text-xs truncate">{course.name}</span>
                    </div>
                    <span className="text-[10px] text-stone-500 shrink-0 font-medium ml-2">
                      {course.region || '전국'}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* 8. [핵심] 실시간 합산 금액 알림판 */}
            <div className="bg-stone-900 text-white p-3.5 rounded-2xl space-y-1 shadow-md">
              <div className="flex items-center justify-between text-xs font-medium text-stone-300">
                <span>과금 합산 내역:</span>
                <span>
                  {planType === 'FREE'
                    ? `선택 ${selectedCourseIds.length}개 구장 × 0원`
                    : `선택 ${selectedCourseIds.length}개 구장 × 월 ${bidAmount.toLocaleString()}${isJapanese ? '円' : '원'}`}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-stone-700">
                <span className="text-xs font-black text-amber-400">
                  최종 결제 예상 합산:
                </span>
                <span className="text-base font-black text-amber-400">
                  {planType === 'FREE' ? '0원 (전액 무료)' : `월 ${currentTotal.toLocaleString()}${isJapanese ? '円' : '원'}`}
                </span>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3.5 px-4 font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 ${
                planType === 'FREE'
                  ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 border border-amber-400'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${planType === 'FREE' ? 'text-amber-300' : 'text-stone-950'}`} />
              <span>
                {planType === 'FREE'
                  ? (isJapanese ? '提携店舗 無料出店申請を完了する (0円)' : '제휴매장 무료 입점 신청하기 (0원)')
                  : (isJapanese ? `月 ${currentTotal.toLocaleString()}円 オークション出店申請` : `월 ${currentTotal.toLocaleString()}원 옥션 입점 신청하기`)}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
