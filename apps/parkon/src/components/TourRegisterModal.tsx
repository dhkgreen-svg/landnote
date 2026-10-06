'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, MapPin, Phone, Gift, Image, Plus, Minus, Calendar, DollarSign, Bus } from 'lucide-react';
import { TourPackage, TourStorage } from '@/lib/tourStorage';

interface TourRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTour: TourPackage) => void;
  isJapanese?: boolean;
}

const SAMPLE_TOUR_IMAGES = [
  { label: '국내 버스투어', url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=80' },
  { label: '일본 홋카이도', url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=500&auto=format&fit=crop&q=80' },
  { label: '제주도 골프투어', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=80' },
  { label: '리조트 & 온천', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop&q=80' },
  { label: '명품 골프장', url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=500&auto=format&fit=crop&q=80' },
];

export function TourRegisterModal({
  isOpen,
  onClose,
  onSuccess,
  isJapanese = false,
}: TourRegisterModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Form States
  const [tourType, setTourType] = useState<'DOMESTIC' | 'OVERSEAS'>('DOMESTIC');
  const [agencyName, setAgencyName] = useState('');
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('1박 2일');
  const [price, setPrice] = useState('');
  const [giftsAndBenefits, setGiftsAndBenefits] = useState('');
  const [phone, setPhone] = useState('');
  const [departureInfo, setDepartureInfo] = useState('');
  const [imageUrl, setImageUrl] = useState(SAMPLE_TOUR_IMAGES[0].url);
  const [customImageInput, setCustomImageInput] = useState('');
  const [description, setDescription] = useState('');

  // Plan State: 'FREE' | 'AUCTION' (기본 무료 우선)
  const [planType, setPlanType] = useState<'FREE' | 'AUCTION'>('FREE');
  const [bidAmount, setBidAmount] = useState<number>(3000);

  const resetForm = () => {
    setTourType('DOMESTIC');
    setAgencyName('');
    setTitle('');
    setDestination('');
    setDuration('1박 2일');
    setPrice('');
    setGiftsAndBenefits('');
    setPhone('');
    setDepartureInfo('');
    setImageUrl(SAMPLE_TOUR_IMAGES[0].url);
    setCustomImageInput('');
    setDescription('');
    setPlanType('FREE');
    setBidAmount(3000);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agencyName.trim()) {
      alert('여행사 또는 주최사 상호명을 입력해 주세요.');
      return;
    }
    if (!title.trim()) {
      alert('투어 패키지 상품명을 입력해 주세요.');
      return;
    }
    if (!destination.trim()) {
      alert('목적지 또는 방문 구장을 입력해 주세요.');
      return;
    }
    if (!price.trim()) {
      alert('상품 가격을 입력해 주세요.');
      return;
    }
    if (!giftsAndBenefits.trim()) {
      alert('참가자 사은품 및 포함 혜택을 입력해 주세요.');
      return;
    }
    if (!phone.trim()) {
      alert('예약 및 상담 전화번호를 입력해 주세요.');
      return;
    }

    const newTourData: Omit<TourPackage, 'id' | 'createdAt'> = {
      agencyName: agencyName.trim(),
      title: title.trim(),
      tourType,
      destination: destination.trim(),
      duration: duration.trim(),
      price: price.trim(),
      giftsAndBenefits: giftsAndBenefits.trim(),
      phone: phone.trim(),
      departureInfo: departureInfo.trim() || undefined,
      imageUrl: customImageInput.trim() || imageUrl,
      description: description.trim() || undefined,
      bidAmount: planType === 'FREE' ? 0 : bidAmount,
    };

    const created = TourStorage.addTour(newTourData);
    alert(
      planType === 'AUCTION'
        ? `🎉 [파키 추천 상단 옥션 투어 등록 완료!]\n상품명: ${created.title}\n월 옥션가: ${bidAmount.toLocaleString()}원\n\n최상단 '파키 추천 명품 투어' 영역에 우선 노출됩니다!`
        : `🎉 [100% 무료 투어 등록 완료!]\n상품명: ${created.title}\n\n등록된 일반 투어 패키지 목록에 즉시 노출됩니다. 필요 시 언제든 상단 옥션을 신청하실 수 있습니다.`
    );
    onSuccess(created);
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[65] bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-emerald-600 flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
              🚌
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black tracking-tight">
                  {isJapanese ? 'パークゴルフ ツアー・旅行社 無料登録' : '파크골프 투어 & 여행사 무료 등록'}
                </h2>
                <span className="text-[10px] bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full font-black">
                  100% 무료
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                국내·해외 파크골프 패키지 상품 및 사은품 특전을 무료로 등록하세요.
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

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-bold text-stone-800 flex-1">
          {/* 1. 투어 구분 (국내 vs 해외) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-stone-700">
              투어 구분 *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="tour-modal-domestic-btn"
                onClick={() => setTourType('DOMESTIC')}
                className={`py-2.5 px-3 rounded-xl border-2 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  tourType === 'DOMESTIC'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-white'
                }`}
              >
                <span>🇰🇷</span>
                <span>국내 명품 투어</span>
                {tourType === 'DOMESTIC' && <Check className="w-3.5 h-3.5 ml-1 text-emerald-700" />}
              </button>
              <button
                type="button"
                id="tour-modal-overseas-btn"
                onClick={() => setTourType('OVERSEAS')}
                className={`py-2.5 px-3 rounded-xl border-2 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  tourType === 'OVERSEAS'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-white'
                }`}
              >
                <span>🇯🇵</span>
                <span>일본·해외 원정 투어</span>
                {tourType === 'OVERSEAS' && <Check className="w-3.5 h-3.5 ml-1 text-emerald-700" />}
              </button>
            </div>
          </div>

          {/* 2. 여행사명 & 예약 전화번호 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1 flex items-center gap-1">
                <Bus className="w-3.5 h-3.5 text-emerald-700" />
                <span>여행사 / 주최사 상호명 *</span>
              </label>
              <input
                type="text"
                required
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="예: 파크투어, 하나골프투어"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span>예약 및 상담 전화번호 *</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="예: 02-1234-5678 / 010-0000-0000"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* 3. 투어 패키지 상품명 */}
          <div>
            <label className="block text-[11px] font-black text-stone-700 mb-1">
              투어 패키지 상품명 *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: [일본 홋카이도] 3박 4일 도카치 공인 72홀 명품 원정 라운드"
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          {/* 4. 목적지 & 일정 & 상품 가격 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>목적지 / 구장 *</span>
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="예: 일본 홋카이도, 강원 화천"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>일정 / 기간 *</span>
              </label>
              <input
                type="text"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="예: 3박 4일, 매주 화/금"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black text-stone-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                <span>상품 가격 *</span>
              </label>
              <input
                type="text"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="예: 1인 450,000원"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* 5. [핵심] 참가자 사은품 및 포함 혜택 (대표님 강조!) */}
          <div className="bg-amber-50 border-2 border-amber-400/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                <span>참가자 사은품 & 포함 특전 입력 (필수) *</span>
              </label>
              <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-2 py-0.5 rounded-full">
                예약 유치 핵심!
              </span>
            </div>
            <input
              type="text"
              required
              value={giftsAndBenefits}
              onChange={(e) => setGiftsAndBenefits(e.target.value)}
              placeholder="예: 최고급 파크골프 볼 2구 증정 + 전 일정 온천 호텔 & 식사 포함 + 왕복 리무진 버스"
              className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-950 outline-none focus:border-amber-600"
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                '최고급 파크골프 볼 2구 증정',
                '전 일정 특급 온천 호텔 숙박',
                '왕복 최고급 우등 리무진 버스',
                '전일정 그린피 및 조/석식 포함',
                '현지 전문 인솔 가이드 동행',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setGiftsAndBenefits((prev) => (prev ? `${prev}, ${preset}` : preset))}
                  className="text-[10px] bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 px-2 py-1 rounded-lg font-bold transition cursor-pointer"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 6. 대표 이미지 선택 */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-stone-700 flex items-center gap-1">
              <Image className="w-3.5 h-3.5 text-emerald-700" />
              <span>대표 이미지</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {SAMPLE_TOUR_IMAGES.map((sample) => (
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

          {/* 7. 입점 플랜 선택: 기본 무료 (0원) vs 상단 옥션 */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-stone-900">
                투어 상품 노출 플랜 선택 *
              </label>
              <span className="text-[10px] text-stone-500 font-bold">
                100% 무료 등록 가능
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: 기본 무료 등록 */}
              <button
                type="button"
                id="tour-modal-plan-free"
                onClick={() => setPlanType('FREE')}
                className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                  planType === 'FREE'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/30'
                    : 'border-stone-200 bg-stone-50 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-stone-900">100% 무료 등록 (기본)</span>
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                      0원
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-600 mt-1 leading-tight font-medium">
                    초기 비용 0원 무료 등록! 상품 정보와 사은품 상시 노출. 필요 시 언제든 상단 옥션 신청 가능
                  </p>
                </div>
                <div className="mt-2 text-[10px] font-black text-emerald-800">
                  {planType === 'FREE' ? '✓ 기본 선택됨' : '선택하기'}
                </div>
              </button>

              {/* Option 2: 상단 파키 추천 옥션 */}
              <button
                type="button"
                id="tour-modal-plan-auction"
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
                      <span>상단 추천 옥션</span>
                    </span>
                    <span className="text-[10px] font-black bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded">
                      월 3,000원~
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-900 mt-1 leading-tight font-medium">
                    최상단 &apos;파키 추천 명품 투어&apos; 영역에 고액순 선점 고정 노출 (선택 사항)
                  </p>
                </div>
                <div className="mt-2 text-[10px] font-black text-amber-900">
                  {planType === 'AUCTION' ? '✓ 선택됨' : '선택하기'}
                </div>
              </button>
            </div>

            {/* 옥션 선택 시 입찰가 세팅 */}
            {planType === 'AUCTION' && (
              <div className="bg-amber-100/70 border border-amber-300 rounded-2xl p-3 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-amber-950">
                    월 입찰 희망가 (최저 3,000원부터)
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">
                    호가단위: +1,000원
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBidAmount((prev) => Math.max(3000, prev - 1000))}
                    disabled={bidAmount <= 3000}
                    className="w-10 h-10 rounded-xl bg-white border border-amber-300 text-amber-950 font-black text-base flex items-center justify-center disabled:opacity-40 hover:bg-amber-50 cursor-pointer shadow-2xs"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-1 bg-white border-2 border-amber-400 rounded-xl py-2 px-3 text-center">
                    <span className="text-base font-black text-amber-950">
                      월 {bidAmount.toLocaleString()}원
                    </span>
                  </div>

                  <button
                    type="button"
                    id="tour-modal-bid-plus"
                    onClick={() => setBidAmount((prev) => prev + 1000)}
                    className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 font-black text-base flex items-center justify-center hover:bg-amber-400 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 제출 버튼 */}
          <div className="pt-2">
            <button
              type="submit"
              id="tour-modal-submit-btn"
              className={`w-full py-3.5 px-4 font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition active:scale-98 ${
                planType === 'FREE'
                  ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 border border-amber-400'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${planType === 'FREE' ? 'text-amber-300' : 'text-stone-950'}`} />
              <span>
                {planType === 'FREE'
                  ? '투어 패키지 무료 등록 완료하기 (0원)'
                  : `월 ${bidAmount.toLocaleString()}원 상단 옥션 투어 등록하기`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
