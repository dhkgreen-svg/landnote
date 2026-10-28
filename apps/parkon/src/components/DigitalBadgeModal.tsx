'use client';

import React, { useRef, useState, useEffect } from 'react';
import { X, Trophy, Share2, Award, Flame, Zap, Sparkles, Check, Crown, ArrowRight, MapPin } from 'lucide-react';
import { CourseBadgeRecord, getBadgeTierInfo, BadgeStorage } from '@/lib/badgeStorage';
import { playCelebrationFanfare, triggerCelebrationHaptic } from '@/lib/soundUtils';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getCourseDualName } from '@/lib/courseLocalization';

interface DigitalBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: CourseBadgeRecord;
  isNewTier?: boolean;
  completedHolesCount?: number;
  completedBlocksCount?: number;
  coursesPlayedStr?: string;
  onOpenHallOfFame?: () => void;
  onOpenNationalTourMap?: () => void;
  onViewScorecard?: () => void;
}

export function DigitalBadgeModal({
  isOpen,
  onClose,
  badge,
  isNewTier,
  completedHolesCount,
  completedBlocksCount,
  coursesPlayedStr,
  onOpenHallOfFame,
  onOpenNationalTourMap,
  onViewScorecard,
}: DigitalBadgeModalProps) {
  const { isJapanese, isEnglish } = useTranslation();
  const [copiedToast, setCopiedToast] = useState(false);
  const tierInfo = getBadgeTierInfo(badge.visitCount);
  const tourSummary = BadgeStorage.getNationalTourSummary();

  const dual = getCourseDualName(badge.courseName, isJapanese);
  const displayCourseName = isJapanese ? dual.primary : badge.courseName;
  const badgeShortName = isJapanese
    ? (dual.cleanJa || dual.primary).replace(/パークゴルフ場|パークゴルフ|コース/g, '').trim()
    : badge.courseName.replace('파크골프장', '').trim();

  const effectiveHoles = completedHolesCount || badge.lastCompletedHoles || (badge.visitCount ? 9 : 0);
  const effectiveBlocks = completedBlocksCount || badge.lastCompletedBlocks || Math.max(1, Math.round(effectiveHoles / 9));
  
  const rawCoursesStr = coursesPlayedStr || badge.lastCoursesPlayedStr || '';
  const effectiveCoursesStr = isJapanese
    ? rawCoursesStr.replace(/코스/g, 'コース').replace(/홀/g, 'ホール')
    : isEnglish
    ? rawCoursesStr.replace(/코스/g, ' Course').replace(/홀/g, ' Holes')
    : rawCoursesStr;

  const badgeRoundDesc = effectiveBlocks > 1
    ? (isJapanese
        ? `${effectiveHoles}ホール (${effectiveCoursesStr || `9ホール ${effectiveBlocks}コース`})`
        : isEnglish
        ? `${effectiveHoles} Holes (${effectiveCoursesStr || `9H ${effectiveBlocks} Courses`})`
        : `${effectiveHoles}홀 (${effectiveCoursesStr || `9홀 ${effectiveBlocks}개 코스`})`)
    : (isJapanese
        ? `${effectiveCoursesStr ? `${effectiveCoursesStr} ` : ''}9ホールコース`
        : isEnglish
        ? `${effectiveCoursesStr ? `${effectiveCoursesStr} ` : ''}9-Hole Course`
        : `${effectiveCoursesStr ? `${effectiveCoursesStr} ` : ''}9홀 코스`);

  const localizedTierTitle = isJapanese
    ? (tierInfo.tier === 'GUARDIAN' ? 'コース守護神 🏆' :
       tierInfo.tier === 'HONORARY_MASTER' ? '名誉マスター 👑' :
       tierInfo.tier === 'MASTER' ? 'フィールドの達人 🎖️' :
       tierInfo.tier === 'REGULAR' ? '常連ゴルファー 🥈' : 'ルーキーゴルファー 🌱')
    : isEnglish
    ? (tierInfo.tier === 'GUARDIAN' ? 'Course Guardian 🏆' :
       tierInfo.tier === 'HONORARY_MASTER' ? 'Honorary Master 👑' :
       tierInfo.tier === 'MASTER' ? 'Field Master 🎖️' :
       tierInfo.tier === 'REGULAR' ? 'Regular Player 🥈' : 'Rookie Golfer 🌱')
    : tierInfo.title;

  useEffect(() => {
    if (isOpen) {
      playCelebrationFanfare();
      triggerCelebrationHaptic();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShare = async () => {
    const shareText = isJapanese
      ? `[PARKY APP 公式認定 🎖️]\n⛳ '${displayCourseName}' ${badgeRoundDesc} 完走達成！\n• 9ホール累計完走: ${badge.visitCount}回 (${localizedTierTitle})\n${
          badge.todayRoundCount > 1 ? `• 🔥 本日 ${badge.todayRoundCount}連続ラウンド達成！\n` : ''
        }• 完走日時: ${badge.lastCompletedAt}\n\n👉 PARKY APPで全国パークゴルフ制覇に挑戦！\nhttps://www.parkgolfallinone.com`
      : `[파크골프 올인원 공식 인증 🎖️]\n⛳ '${badge.courseName}' ${badgeRoundDesc} 완주 달성!\n• 나의 9홀 누적 완주: ${badge.visitCount}회 (${tierInfo.title})
${
          badge.todayRoundCount > 1 ? `• 🔥 오늘 ${badge.todayRoundCount}차전 연속 라운드 달성!\n` : ''
        }• 완주 일자: ${badge.lastCompletedAt}\n\n👉 지금 파크골프 올인원에서 함께 도장 깨기 도전하세요!\nhttps://www.parkgolfallinone.com`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: isJapanese
            ? `[PARKY APP] ${displayCourseName} ${badgeRoundDesc} 完走バッジ獲得！`
            : `[파크골프 올인원] ${badge.courseName} ${badgeRoundDesc} 완주 뱃지 획득!`,
          text: shareText,
          url: 'https://www.parkgolfallinone.com',
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
            <span>
              {effectiveBlocks > 1
                ? (isJapanese
                    ? `${effectiveHoles}ホール (${effectiveCoursesStr || `9ホール ${effectiveBlocks}コース`}) 完走 公式デジタルバッジ`
                    : isEnglish
                    ? `${effectiveHoles} Holes Official Digital Badge`
                    : `${effectiveHoles}홀 (${effectiveCoursesStr || `9홀 ${effectiveBlocks}개 코스`}) 완주 공식 디지털 뱃지`)
                : (isJapanese
                    ? `${effectiveCoursesStr ? `${effectiveCoursesStr} ` : ''}9ホール完走 公式デジタルバッジ`
                    : isEnglish
                    ? `9-Hole Official Digital Badge`
                    : `${effectiveCoursesStr ? `${effectiveCoursesStr} ` : ''}9홀 완주 공식 디지털 뱃지`)}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
            {displayCourseName}
          </h2>
          {dual.showSecondary && dual.secondary && (
            <p className="text-[11px] text-amber-300 font-bold -mt-0.5">
              {dual.secondary}
            </p>
          )}
          <p className="text-xs text-stone-300">
            {isJapanese
              ? `正常完走おめでとうございます！${effectiveBlocks > 1 ? `9ホール ${effectiveBlocks}コース` : '9ホールコース'}完走スタンプが発行されました。`
              : isEnglish
              ? `Congratulations! A completion stamp has been issued.`
              : `정상 완주를 축하합니다! ${effectiveBlocks > 1 ? `9홀 ${effectiveBlocks}개 코스` : '9홀 코스'} 완주 스탬프가 발급되었습니다.`}
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
              {badgeShortName}
            </span>

            {/* 방문 횟수 리본 배지 (하단 겹침) */}
            <div className="absolute -bottom-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-black text-xs px-4 py-1 rounded-full shadow-xl border border-white tracking-wider whitespace-nowrap">
              {isJapanese
                ? `累計 ${badge.visitCount}回完走 (9H基準)`
                : isEnglish
                ? `Total ${badge.visitCount} Rounds (9H)`
                : `누적 ${badge.visitCount}회 완주 (9홀 기준)`}
            </div>
          </div>

          {/* 당일 N차전 연타석 불꽃 배지 */}
          {badge.todayRoundCount > 1 && (
            <div className="mt-5 inline-flex items-center gap-1 bg-gradient-to-r from-orange-600 to-rose-600 text-white font-black text-xs px-3.5 py-1 rounded-full shadow-lg border border-orange-300 animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-current text-yellow-300" />
              <span>
                {badge.todayRoundCount >= 3
                  ? (isJapanese ? `⚡ 本日 ${badge.todayRoundCount}連続ラウンド達成！` : `⚡ 오늘 ${badge.todayRoundCount}연타 철인 라운드 달성!`)
                  : (isJapanese ? `🔥 本日 2連続ラウンド達成！` : `🔥 오늘 2차전 연속 라운드 달성!`)}
              </span>
            </div>
          )}
        </div>

        {/* 등급 및 특권 안내 카드 */}
        <div className="bg-stone-900/90 rounded-2xl p-3 border border-stone-800 text-left space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400">{isJapanese ? '現在の名誉ランク:' : isEnglish ? 'Honor Rank:' : '현재 명예 등급:'}</span>
            <span className={`font-black ${tierInfo.textColor}`}>{localizedTierTitle}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400">{isJapanese ? '今回のラウンド完走:' : isEnglish ? 'This Round:' : '이번 라운드 완주:'}</span>
            <span className="font-extrabold text-amber-300">
              +{effectiveBlocks}{isJapanese ? '回 獲得' : isEnglish ? ' count' : '회 적립'} ({effectiveHoles}{isJapanese ? 'ホール' : isEnglish ? 'H' : '홀'} · {effectiveCoursesStr || `${effectiveBlocks}${isJapanese ? 'コース' : '개 코스'}`})
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-400">{isJapanese ? '完走認証日時:' : isEnglish ? 'Certified At:' : '완주 인증 일시:'}</span>
            <span className="font-bold text-stone-200">{badge.lastCompletedAt}</span>
          </div>

          {/* 100회 이상 터줏대감 특권 강조 */}
          {badge.hasInstantSpecAccess ? (
            <div className="pt-1 border-t border-stone-800 text-[11px] text-cyan-300 font-extrabold flex items-center gap-1">
              <span>👑</span>
              <span>
                {isJapanese
                  ? '名誉マスター特典: 2-Strike検証なしで諸元の即時修正が可能！'
                  : isEnglish
                  ? 'Honorary Master: Can edit course specs instantly!'
                  : '명예 터줏대감 특권: 2-Strike 검증 없이 제원 즉시 수정 가능!'}
              </span>
            </div>
          ) : (
            <div className="pt-1 border-t border-stone-800 text-[10.5px] text-stone-400">
              {isJapanese ? (
                <>
                  💡 9ホールコースを1回完走するごとに1回累積され、100回完走すると諸元を即座に編集できる <strong className="text-amber-300">名誉マスター</strong> に昇格します。
                </>
              ) : isEnglish ? (
                <>
                  💡 Earn 1 count per 9-hole round. Reach 100 to become an <strong className="text-amber-300">Honorary Master</strong> with instant edit privileges.
                </>
              ) : (
                <>
                  💡 9홀 코스 1회 완주마다 1회씩 누적되며, 100회 완주 시 제원을 혼자 즉시 바꿀 수 있는 <strong className="text-amber-300">명예 터줏대감</strong>으로 승급합니다.
                </>
              )}
            </div>
          )}
        </div>

        {/* 복사 완료 토스트 */}
        {copiedToast && (
          <div className="bg-emerald-600 text-white text-xs font-black py-2 rounded-xl shadow-lg animate-bounce">
            {isJapanese ? '✓ シェア用テキストがコピーされました！' : '✓ 자랑하기 문구가 복사되었습니다! 카톡에 붙여넣기 하세요.'}
          </div>
        )}

        {/* 하단 액션 버튼 목록 */}
        <div className="space-y-2 pt-1">
          {/* [과업 3]: 완주증 모달 하단에 [ 📋 최종 스코어카드 보기 ] 버튼 배치 */}
          {onViewScorecard && (
            <button
              type="button"
              onClick={onViewScorecard}
              className="w-full py-3 bg-[#0f1d31] hover:bg-[#182d4b] text-emerald-300 font-black text-sm rounded-2xl flex items-center justify-center gap-2 border-2 border-slate-600 transition active:scale-98 cursor-pointer shadow-md mb-1"
            >
              <span>📋</span>
              <span>{isJapanese ? '最終スコアカードを確認' : '📋 최종 스코어카드 보기'}</span>
            </button>
          )}

          {/* 버튼 1: 카카오톡 / LINE으로 자랑하기 */}
          <button
            type="button"
            onClick={handleShare}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
          >
            <Share2 className="w-4 h-4 fill-current" />
            <span>
              {isJapanese
                ? '📢 LINE・SNSでシェアする'
                : isEnglish
                ? '📢 Share to SNS / Friends'
                : '📢 카카오톡 단톡방 / 밴드에 자랑하기'}
            </span>
          </button>

          {/* 버튼 2: 구장 명예의 전당 (최다 완주 랭킹) 보기 */}
          {onOpenHallOfFame && (
            <button
              type="button"
              onClick={onOpenHallOfFame}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-stone-700 transition active:scale-98 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isJapanese
                  ? '🏆 このコースの名誉の殿堂 (最多完走 TOP 10)'
                  : isEnglish
                  ? '🏆 Course Hall of Fame (Top 10)'
                  : '🏆 이 구장 명예의 전당 (최다 완주 TOP 10)'}
              </span>
            </button>
          )}

          {/* 버튼 3: 전국 투어 퍼즐 지도 보기 */}
          {onOpenNationalTourMap && (
            <button
              type="button"
              onClick={onOpenNationalTourMap}
              className="w-full py-2.5 bg-stone-900/90 hover:bg-stone-800 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-amber-500/40 transition active:scale-98 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isJapanese
                  ? `🗺️ 全国パークゴルフ制覇マップ (${tourSummary.unlockedCount}エリア達成)`
                  : isEnglish
                  ? `🗺️ National Tour Map (${tourSummary.unlockedCount} Areas)`
                  : `🗺️ 전국 17개 시·도 투어 퍼즐 (${tourSummary.unlockedCount}/17 정복)`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
