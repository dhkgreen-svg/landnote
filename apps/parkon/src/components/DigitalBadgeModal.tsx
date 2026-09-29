'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Trophy, Share2, Award, Flame, Zap, Sparkles, Check, Crown, ArrowRight, MapPin } from 'lucide-react';
import { CourseBadgeRecord, getBadgeTierInfo, BadgeStorage } from '@/lib/badgeStorage';
import { playCelebrationFanfare, triggerCelebrationHaptic } from '@/lib/soundUtils';

interface DigitalBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: CourseBadgeRecord;
  isNewTier?: boolean;
  onOpenHallOfFame?: () => void;
  onOpenNationalTourMap?: () => void;
}

export function DigitalBadgeModal({
  isOpen,
  onClose,
  badge,
  isNewTier,
  onOpenHallOfFame,
  onOpenNationalTourMap,
}: DigitalBadgeModalProps) {
  const [copiedToast, setCopiedToast] = useState(false);
  const tierInfo = getBadgeTierInfo(badge.visitCount);
  const tourSummary = BadgeStorage.getNationalTourSummary();

  useEffect(() => {
    if (isOpen) {
      playCelebrationFanfare();
      triggerCelebrationHaptic();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShare = async () => {
    const shareText = `[파크골프 올인원 공식 인증 🎖️]\n⛳ '${badge.courseName}' 18홀 완주 달성!\n• 나의 누적 완주: ${badge.visitCount}회 (${tierInfo.title})\n${
      badge.todayRoundCount > 1 ? `• 🔥 오늘 ${badge.todayRoundCount}차전 연속 라운드 달성!\n` : ''
    }• 완주 일자: ${badge.lastCompletedAt}\n\n👉 지금 파크골프 올인원에서 함께 도장 깨기 도전하세요!\nhttps://www.parkongolf.com`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `[파크골프 올인원] ${badge.courseName} 완주 뱃지 획득!`,
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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-stone-950 text-white rounded-3xl w-full max-w-sm overflow-hidden border-2 border-amber-400 shadow-2xl relative flex flex-col p-5 sm:p-6 text-center space-y-4">
        {/* 우측 상단 닫기 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer"
        >
          ✕
        </button>

        {/* 상단 축하 타이틀 */}
        <div className="space-y-1 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-stone-950 text-xs font-black shadow-lg">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>18홀 완주 기념 공식 디지털 뱃지</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
            {badge.courseName}
          </h2>
          <p className="text-xs text-stone-300">
            정상 완주를 축하합니다! 구장 스탬프가 발급되었습니다.
          </p>
        </div>

        {/* 뱃지 중앙 비주얼 (티어별 링 광원 & 메달) */}
        <div className="py-2 flex flex-col items-center justify-center relative">
          <div
            className={`w-36 h-36 sm:w-40 sm:h-40 rounded-full border-4 ${tierInfo.borderColor} ${tierInfo.bgColor} flex flex-col items-center justify-center shadow-2xl p-4 relative group transition-transform animate-pulse`}
          >
            {/* 상징 아이콘 */}
            <div className="text-4xl sm:text-5xl drop-shadow-lg select-none">
              {badge.visitCount >= 300 ? '🏆' : badge.visitCount >= 100 ? '👑' : badge.visitCount >= 50 ? '🎖️' : badge.visitCount >= 10 ? '🥈' : '⛳'}
            </div>

            {/* 구장명 약칭 */}
            <span className="text-[11px] sm:text-xs font-black text-white drop-shadow-md truncate max-w-[100px] mt-1">
              {badge.courseName.replace('파크골프장', '')}
            </span>

            {/* 방문 횟수 리본 배지 (하단 겹침) */}
            <div className="absolute -bottom-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-black text-xs px-4 py-1 rounded-full shadow-xl border border-white tracking-wider">
              {badge.visitCount}회 완주
            </div>
          </div>

          {/* 당일 N차전 연타석 불꽃 배지 */}
          {badge.todayRoundCount > 1 && (
            <div className="mt-5 inline-flex items-center gap-1 bg-gradient-to-r from-orange-600 to-rose-600 text-white font-black text-xs px-3.5 py-1 rounded-full shadow-lg border border-orange-300 animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-current text-yellow-300" />
              <span>
                {badge.todayRoundCount >= 3
                  ? `⚡ 오늘 ${badge.todayRoundCount}연타 철인 라운드 달성!`
                  : `🔥 오늘 2차전 연속 라운드 달성!`}
              </span>
            </div>
          )}
        </div>

        {/* 등급 및 특권 안내 카드 */}
        <div className="bg-stone-900/90 rounded-2xl p-3 border border-stone-800 text-left space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400">현재 명예 등급:</span>
            <span className={`font-black ${tierInfo.textColor}`}>{tierInfo.title}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400">완주 인증 일시:</span>
            <span className="font-bold text-stone-200">{badge.lastCompletedAt}</span>
          </div>

          {/* 100회 이상 터줏대감 특권 강조 */}
          {badge.hasInstantSpecAccess ? (
            <div className="pt-1 border-t border-stone-800 text-[11px] text-cyan-300 font-extrabold flex items-center gap-1">
              <span>👑</span>
              <span>명예 터줏대감 특권: 2-Strike 검증 없이 제원 즉시 수정 가능!</span>
            </div>
          ) : (
            <div className="pt-1 border-t border-stone-800 text-[10.5px] text-stone-400">
              💡 100회 완주 시 제원을 혼자 즉시 바꿀 수 있는 <strong className="text-amber-300">명예 터줏대감</strong>으로 승급합니다.
            </div>
          )}
        </div>

        {/* 복사 완료 토스트 */}
        {copiedToast && (
          <div className="bg-emerald-600 text-white text-xs font-black py-2 rounded-xl shadow-lg animate-bounce">
            ✓ 자랑하기 문구가 복사되었습니다! 카톡에 붙여넣기 하세요.
          </div>
        )}

        {/* 하단 액션 2버튼 */}
        <div className="space-y-2 pt-1">
          {/* 버튼 1: 카카오톡/밴드로 자랑하기 */}
          <button
            type="button"
            onClick={handleShare}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
          >
            <Share2 className="w-4 h-4 fill-current" />
            <span>📢 카카오톡 단톡방 / 밴드에 자랑하기</span>
          </button>

          {/* 버튼 2: 구장 명예의 전당 (최다 완주 랭킹) 보기 */}
          {onOpenHallOfFame && (
            <button
              type="button"
              onClick={onOpenHallOfFame}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-stone-700 transition active:scale-98 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>🏆 이 구장 명예의 전당 (최다 완주 TOP 10)</span>
            </button>
          )}

          {/* 버튼 3: 3단계 전국 17개 시·도 투어 퍼즐 지도 보기 */}
          {onOpenNationalTourMap && (
            <button
              type="button"
              onClick={onOpenNationalTourMap}
              className="w-full py-2.5 bg-stone-900/90 hover:bg-stone-800 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-amber-500/40 transition active:scale-98 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>🗺️ 전국 17개 시·도 투어 퍼즐 ({tourSummary.unlockedCount}/17 정복)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
