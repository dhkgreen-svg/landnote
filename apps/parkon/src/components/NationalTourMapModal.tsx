'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Trophy,
  Share2,
  MapPin,
  Sparkles,
  Lock,
  CheckCircle2,
  ChevronRight,
  Flame,
  Award,
  Crown,
  Camera,
  Gift,
  Copy,
  Check,
  Cloud,
} from 'lucide-react';
import {
  KOREA_PROVINCES,
  ProvinceInfo,
  ProvinceTourRecord,
  NationalTourSummary,
  BadgeStorage,
  VIP_COUPONS,
  VipCoupon,
} from '@/lib/badgeStorage';

interface NationalTourMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NationalTourMapModal({ isOpen, onClose }: NationalTourMapModalProps) {
  const [selectedProvince, setSelectedProvince] = useState<ProvinceInfo | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);
  const [currentProvPhoto, setCurrentProvPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (selectedProvince) {
      const p = BadgeStorage.getProvincePhoto(selectedProvince.id);
      setCurrentProvPhoto(p);
    } else {
      setCurrentProvPhoto(null);
    }
  }, [selectedProvince]);

  if (!isOpen) return null;

  const records = BadgeStorage.getNationalTourRecords();
  const summary = BadgeStorage.getNationalTourSummary();

  const handleShare = async () => {
    const unlockedNames = KOREA_PROVINCES
      .filter((p) => records[p.id]?.isUnlocked)
      .map((p) => p.shortName)
      .join(', ');

    const shareText = `[파크골프 올인원 대한민국 전국 17개 시·도 투어 제패기 🗺️]\n🏆 나의 정복 현황: ${summary.unlockedCount} / 17개 시·도 (${summary.progressPercent}%)\n• 현재 칭호: ${summary.currentTitle}\n• 정복한 지역: ${unlockedNames || '정복 도전 중!'}\n• 전국 누적 완주: ${summary.totalNationalRounds}회\n\n👉 지금 파크골프 올인원에서 전국 파크골프장 도장 깨기 함께해요!\nhttps://www.parkongolf.com`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `[파크골프 올인원] 전국 17개 시·도 투어 제패 현황 (${summary.unlockedCount}/17)`,
          text: shareText,
          url: 'https://www.parkongolf.com',
        });
        return;
      } catch {}
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProvince) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        BadgeStorage.setProvincePhoto(selectedProvince.id, base64);
        setCurrentProvPhoto(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopyCoupon = (coupon: VipCoupon) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(coupon.code);
      setCopiedCouponId(coupon.id);
      setTimeout(() => setCopiedCouponId(null), 2500);
    }
  };

  const selectedRecord: ProvinceTourRecord | undefined = selectedProvince
    ? records[selectedProvince.id]
    : undefined;

  const unlockedCouponsCount = VIP_COUPONS.filter((c) => summary.unlockedCount >= c.requiredProvinces).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-stone-950 text-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto border-2 border-amber-400 shadow-2xl relative flex flex-col p-4 sm:p-6 space-y-4">
        {/* 상단 닫기 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center text-sm font-black cursor-pointer z-10"
        >
          ✕
        </button>

        {/* 상단 타이틀 & 뱃지 */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-stone-950 text-xs font-black shadow-lg">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>대한민국 파크골프 도장 깨기</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>🗺️ 전국 17개 시·도 투어 퍼즐</span>
          </h2>
          <p className="text-xs text-stone-300">
            전국 17개 광역시·도 구장에서 9홀 이상 공식 완주 시 퍼즐 조각이 황금빛으로 점등됩니다!
          </p>
        </div>

        {/* 전국 정복 대형 프로그레스 카드 */}
        <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 rounded-2xl p-4 border border-amber-400/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl select-none">👑</span>
              <div>
                <div className="text-xs text-stone-400 font-bold">나의 원정 칭호</div>
                <div className="text-sm sm:text-base font-black text-amber-300">
                  {summary.currentTitle}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-stone-400 font-bold">정복 현황</div>
              <div className="text-base sm:text-lg font-black text-white">
                <span className="text-amber-400 text-xl sm:text-2xl">{summary.unlockedCount}</span>
                <span className="text-stone-400 text-sm"> / 17 시·도</span>
              </div>
            </div>
          </div>

          {/* 진행도 게이지 바 */}
          <div className="space-y-1">
            <div className="w-full bg-stone-800 h-3 rounded-full overflow-hidden p-0.5 border border-stone-700">
              <div
                className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-full rounded-full transition-all duration-700 shadow-md"
                style={{ width: `${Math.max(5, summary.progressPercent)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold text-stone-400 pt-0.5">
              <span>달성률 {summary.progressPercent}%</span>
              <span>전국 총 누적 {summary.totalNationalRounds}회 완주</span>
            </div>
          </div>

          {/* 공식 제휴 혜택 쿠폰북 바로가기 버튼 */}
          <button
            type="button"
            onClick={() => setShowCouponModal(true)}
            className="w-full py-2 bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-400/30 border border-amber-400/50 rounded-xl text-amber-300 text-xs font-black flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>🎁 전국 도장 깨기 완주 제휴 혜택 쿠폰북 ({unlockedCouponsCount}/4개 해금)</span>
          </button>
        </div>

        {/* 한반도 지리적 17개 시도 퍼즐 보드 (4열 5행) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-300 px-1">
            <span>📍 한반도 지리 퍼즐 맵 (터치하여 방문 내역/사진 확인)</span>
            <span className="text-[11px] text-amber-300">
              {summary.unlockedCount === 17 ? '🎉 전국 완전 정복!' : `${17 - summary.unlockedCount}개 남음`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 bg-stone-900/90 p-3 rounded-2xl border border-stone-800">
            {KOREA_PROVINCES.map((prov) => {
              const rec = records[prov.id];
              const isUnlocked = Boolean(rec && rec.isUnlocked);
              const isSelected = selectedProvince?.id === prov.id;
              const hasPhoto = Boolean(BadgeStorage.getProvincePhoto(prov.id));

              return (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => setSelectedProvince(prov)}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all cursor-pointer select-none active:scale-95 ${
                    isUnlocked
                      ? `bg-gradient-to-br ${prov.themeColor} border-amber-300 text-white shadow-lg shadow-amber-500/10`
                      : 'bg-stone-800/80 border-stone-700 text-stone-400 hover:border-stone-600'
                  } ${isSelected ? 'ring-4 ring-yellow-400 scale-105 z-10' : ''}`}
                >
                  {/* 상징 아이콘 or 자물쇠 */}
                  <div className="text-xl sm:text-2xl drop-shadow mb-0.5">
                    {isUnlocked ? prov.symbol : '🔒'}
                  </div>

                  {/* 지역명 */}
                  <span className={`text-xs sm:text-sm font-black tracking-tight ${isUnlocked ? 'text-white' : 'text-stone-300'}`}>
                    {prov.shortName}
                  </span>

                  {/* 완주 뱃지 */}
                  {isUnlocked ? (
                    <span className="mt-1 text-[10px] font-black bg-black/40 px-1.5 py-0.5 rounded-full text-yellow-300">
                      {rec.totalRounds}회
                    </span>
                  ) : (
                    <span className="mt-1 text-[9.5px] font-medium text-stone-300">
                      미정복
                    </span>
                  )}

                  {/* 사진 등록 표기 */}
                  {hasPhoto && (
                    <span className="absolute top-1 left-1 text-[10px]">📷</span>
                  )}

                  {/* 해금 완료 체크 마크 */}
                  {isUnlocked && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[10px] text-stone-950 font-black shadow">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 선택한 시·도 상세 정보 드로어/카드 (원정 인증샷 앨범 포함) */}
        {selectedProvince && (
          <div className="bg-stone-900 rounded-2xl p-4 border border-amber-400/50 space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedProvince.symbol}</span>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>{selectedProvince.name}</span>
                    {selectedRecord?.isUnlocked ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                        정복 완료 🏆
                      </span>
                    ) : (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-stone-700 text-stone-300">
                        도전 필요 🔒
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    명소: {selectedProvince.landmark}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProvince(null)}
                className="text-stone-400 hover:text-white text-xs px-2 py-1 rounded bg-stone-800 font-bold"
              >
                닫기
              </button>
            </div>

            {selectedRecord?.isUnlocked ? (
              <div className="space-y-3 pt-1 text-xs">
                <div className="flex justify-between text-stone-300">
                  <span>정복 일시:</span>
                  <span className="font-bold text-amber-300">{selectedRecord.unlockedAt}</span>
                </div>
                <div className="flex justify-between text-stone-300">
                  <span>해당 지역 누적 완주:</span>
                  <span className="font-bold text-white">{selectedRecord.totalRounds}회 라운드</span>
                </div>

                {/* 원정 인증샷 앨범 섹션 */}
                <div className="bg-stone-950/60 p-3 rounded-xl border border-stone-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-amber-300 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{selectedProvince.shortName} 원정 기념 인증샷</span>
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10.5px] bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold px-2 py-1 rounded-lg border border-stone-700 cursor-pointer"
                    >
                      {currentProvPhoto ? '사진 변경' : '+ 인증 사진 등록'}
                    </button>
                  </div>

                  {currentProvPhoto ? (
                    <div className="relative rounded-xl overflow-hidden border border-amber-400/40 shadow">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentProvPhoto}
                        alt={`${selectedProvince.name} 원정 인증샷`}
                        className="w-full h-36 object-cover"
                      />
                      <div className="absolute bottom-1.5 right-2 bg-black/60 px-2 py-0.5 rounded text-[9px] text-amber-300 font-bold">
                        {selectedProvince.shortName} 공식 원정 스탬프
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="h-20 rounded-xl border-2 border-dashed border-stone-700 hover:border-amber-400 flex flex-col items-center justify-center text-stone-400 cursor-pointer transition"
                    >
                      <Camera className="w-5 h-5 mb-1" />
                      <span className="text-[11px] font-bold">현장 사진을 등록하여 나만의 전국 지도를 완성하세요!</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-bold text-stone-400 mb-1">
                    방문한 파크골프장 ({selectedRecord.coursesVisited.length}개소):
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {selectedRecord.coursesVisited.map((c) => (
                      <div
                        key={c.courseId}
                        className="bg-stone-800/80 px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[11px]"
                      >
                        <span className="font-bold text-stone-200">{c.courseName}</span>
                        <span className="text-amber-400 font-black">{c.roundCount}회 완주</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-3 text-center space-y-1">
                <p className="text-xs text-amber-300 font-bold">
                  아직 {selectedProvince.shortName} 지역 구장 완주 기록이 없습니다.
                </p>
                <p className="text-[11px] text-stone-400">
                  {selectedProvince.name} 소재 파크골프장에서 공식 완주(9홀 이상)하시면 퍼즐이 즉시 해금됩니다!
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4대 전국 마일스톤 명예 트로피 진열대 */}
        <div className="bg-stone-900/80 rounded-2xl p-3.5 border border-stone-800 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <Trophy className="w-3.5 h-3.5" />
            <span>전국 정복 마일스톤 명예 트로피</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {summary.milestones.map((m) => (
              <div
                key={m.title}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  m.isAchieved
                    ? 'bg-amber-950/40 border-amber-400 text-white shadow-md'
                    : 'bg-stone-950/40 border-stone-800 text-stone-300 opacity-60'
                }`}
              >
                <div className="text-2xl select-none">{m.badge}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black truncate">{m.title}</div>
                  <div className="text-[10px] text-stone-300 truncate">{m.requiredProvinces}개 시도 정복</div>
                  <div className="text-[9.5px] font-black mt-0.5">
                    {m.isAchieved ? (
                      <span className="text-emerald-400">✓ 달성 완료</span>
                    ) : (
                      <span className="text-stone-300">진행 중</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 클라우드 안전 백업 알림 */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 bg-stone-900/60 py-2 rounded-xl border border-stone-800/80">
          <Cloud className="w-3.5 h-3.5 text-cyan-400" />
          <span>카카오 1초 로그인 시 전국 투어 뱃지가 클라우드에 영구 보존됩니다.</span>
        </div>

        {/* 복사 완료 토스트 */}
        {copiedToast && (
          <div className="bg-emerald-600 text-white text-xs font-black py-2 rounded-xl text-center shadow-lg animate-bounce">
            ✓ 전국 투어 자랑하기 문구가 복사되었습니다! 카톡이나 밴드에 붙여넣으세요.
          </div>
        )}

        {/* 하단 공유 & 닫기 버튼 */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleShare}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
          >
            <Share2 className="w-4 h-4 fill-current" />
            <span>📢 카카오톡 단톡방 / 밴드에 전국 투어 지도 자랑하기</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-400 font-bold text-xs rounded-xl flex items-center justify-center transition active:scale-98 cursor-pointer"
          >
            닫기
          </button>
        </div>

        {/* VIP 제휴 혜택 쿠폰북 팝업 모달 */}
        {showCouponModal && (
          <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3">
            <div className="bg-stone-950 border-2 border-amber-400 rounded-3xl w-full max-w-sm p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2 text-amber-300">
                  <Gift className="w-5 h-5" />
                  <h3 className="font-black text-base text-white">전국 도장 깨기 완주 제휴 혜택</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="w-7 h-7 rounded-full bg-stone-800 text-stone-400 flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                전국 시·도 파크골프장을 완주하고 해금된 트로피로 공식 제휴처에서 특별 할인 혜택을 받으세요!
              </p>

              <div className="space-y-2.5">
                {VIP_COUPONS.map((coupon) => {
                  const isUnlocked = summary.unlockedCount >= coupon.requiredProvinces;
                  const isCopied = copiedCouponId === coupon.id;

                  return (
                    <div
                      key={coupon.id}
                      className={`p-3 rounded-2xl border transition ${
                        isUnlocked
                          ? 'bg-stone-900 border-amber-400 shadow-md'
                          : 'bg-stone-900/40 border-stone-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{coupon.badge}</span>
                          <div>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-stone-950">
                              {coupon.milestoneTitle}
                            </span>
                            <h4 className="text-xs font-black text-white mt-0.5">{coupon.couponName}</h4>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px]">
                        <div>
                          <div className="text-stone-400">{coupon.sponsor}</div>
                          <div className="text-emerald-400 font-extrabold">{coupon.benefit}</div>
                        </div>

                        {isUnlocked ? (
                          <button
                            type="button"
                            onClick={() => handleCopyCoupon(coupon)}
                            className="bg-amber-400 hover:bg-amber-300 text-stone-950 px-2.5 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 shadow cursor-pointer"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? '복사됨!' : '코드 복사'}</span>
                          </button>
                        ) : (
                          <span className="text-stone-300 text-[10px] font-bold">
                            🔒 {coupon.requiredProvinces}개 시도 완주 필요
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowCouponModal(false)}
                className="w-full py-2.5 bg-stone-900 text-stone-300 font-bold text-xs rounded-xl"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
