'use client';

import React from 'react';

export interface HoleScoreBadgeProps {
  score?: number | null;
  par?: number;
  isConfirmed?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showHoleInOneCrown?: boolean;
}

/**
 * 골프 공인 스코어 배지 (언더파 시각화)
 * 1. 홀인원 (1타): 1자 위에 👑 황금 왕관 + 붉은 황금빛 테두리 링
 * 2. 알바트로스 / -3타 이하: 붉은 기운이 도는 굵은 황금빛 링 (Rich Golden Ring)
 * 3. 이글 (-2타): 빨간 동그라미 2개 (이중 동그라미 ◎)
 * 4. 버디 (-1타): 빨간 동그라미 1개 (단일 동그라미 ⭕)
 * 5. 파 (Par, 0): 깔끔한 기준 타수
 * 6. 보기 (+1): 단일 사각 박스 (□)
 * 7. 더블보기 이상 (+2 이상): 이중 사각 박스 (⧈)
 */
export function HoleScoreBadge({
  score,
  par = 3,
  isConfirmed = true,
  size = 'md',
  showHoleInOneCrown = true,
}: HoleScoreBadgeProps) {
  if (!isConfirmed || score === undefined || score === null || score <= 0) {
    return <span className="text-stone-300 font-light text-xs">-</span>;
  }

  const diff = score - par;
  const isHoleInOne = score === 1;

  // 1. 홀인원 (1타): 1자 위에 👑 황금 왕관 + 붉은/황금 이중 동그라미 (Double Circle)
  if (isHoleInOne && showHoleInOneCrown) {
    return (
      <div
        className="relative inline-flex flex-col items-center justify-center shrink-0 my-0.5"
        title="🏆 홀인원! (1타)"
      >
        <span
          className="absolute -top-3 text-xs leading-none drop-shadow-xs select-none pointer-events-none"
          role="img"
          aria-label="crown"
        >
          👑
        </span>
        <div
          className={`rounded-full flex items-center justify-center font-black transition ${
            size === 'sm'
              ? 'w-5 h-5 text-[11px] border-[1.5px] border-rose-600 ring-2 ring-amber-400 ring-offset-[1.5px]'
              : size === 'lg'
              ? 'w-8 h-8 text-base border-2 border-rose-600 ring-2 ring-amber-500 ring-offset-2'
              : 'w-6 h-6 text-xs border-[1.5px] border-rose-600 ring-2 ring-amber-500 ring-offset-[1.5px]'
          } ring-offset-white bg-gradient-to-b from-amber-100 via-amber-50 to-rose-50 text-rose-700 shadow-sm`}
        >
          1
        </div>
      </div>
    );
  }

  // 2. 알바트로스 또는 -3타, -4타 이하: 아주 굵은 붉은 황금빛 테두리 (Ultra-Bold Border)
  if (diff <= -3) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full font-black shrink-0 transition ${
          size === 'sm'
            ? 'w-5 h-5 text-[11px] border-[2.5px] border-rose-600 ring-2 ring-amber-400 ring-offset-1'
            : size === 'lg'
            ? 'w-8 h-8 text-base border-[3.5px] border-rose-600 ring-2 ring-amber-400 ring-offset-1'
            : 'w-6 h-6 text-xs border-[3px] border-rose-600 ring-2 ring-amber-400 ring-offset-1'
        } ring-offset-white bg-gradient-to-b from-amber-200 via-rose-100 to-amber-50 text-red-950 shadow-sm`}
        title={`알바트로스 (-${Math.abs(diff)}타)`}
      >
        {score}
      </div>
    );
  }

  // 3. 이글 (-2타): 빨간 동그라미 2개 (선명한 이중 동그라미 ◎)
  if (diff === -2) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full font-black shrink-0 transition ${
          size === 'sm'
            ? 'w-5 h-5 text-[11px] border-[1.5px] border-red-500 ring-2 ring-red-500 ring-offset-[1.5px]'
            : size === 'lg'
            ? 'w-8 h-8 text-base border-2 border-red-500 ring-2 ring-red-500 ring-offset-2'
            : 'w-6 h-6 text-xs border-[1.5px] border-red-500 ring-2 ring-red-500 ring-offset-[1.5px]'
        } ring-offset-white bg-rose-50/70 text-red-600 shadow-2xs`}
        title="이글 🦅 (-2타)"
      >
        {score}
      </div>
    );
  }

  // 4. 버디 (-1타): 빨간 동그라미 1개 (단일 굵은 동그라미 ⭕)
  if (diff === -1) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full font-black shrink-0 transition ${
          size === 'sm'
            ? 'w-5 h-5 text-[11px] border-2'
            : size === 'lg'
            ? 'w-8 h-8 text-base border-2'
            : 'w-6 h-6 text-xs border-2'
        } border-red-500 bg-white text-red-600 shadow-2xs`}
        title="버디 🐦 (-1타)"
      >
        {score}
      </div>
    );
  }

  // 5. 파 (Par, 0): 깔끔한 기준 타수
  if (diff === 0) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-md font-bold shrink-0 transition ${
          size === 'sm'
            ? 'w-5 h-5 text-[11px]'
            : size === 'lg'
            ? 'w-8 h-8 text-sm'
            : 'w-6 h-6 text-xs'
        } bg-stone-100 text-stone-800`}
        title="파 (Par, 0)"
      >
        {score}
      </div>
    );
  }

  // 6. 보기 (+1타): 단일 사각 박스 (□)
  if (diff === 1) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-xs font-semibold shrink-0 transition ${
          size === 'sm'
            ? 'w-5 h-5 text-[11px] border'
            : size === 'lg'
            ? 'w-8 h-8 text-sm border-2'
            : 'w-6 h-6 text-xs border'
        } border-stone-400 bg-white text-stone-800`}
        title="보기 (+1타)"
      >
        {score}
      </div>
    );
  }

  // 7. 더블보기 이상 (+2타 이상): 이중 사각 박스 (⧈)
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xs font-bold shrink-0 transition ${
        size === 'sm'
          ? 'w-5 h-5 text-[11px] border border-stone-400 ring-1 ring-stone-300 ring-offset-1'
          : size === 'lg'
          ? 'w-8 h-8 text-sm border-2 border-stone-400 ring-2 ring-stone-300 ring-offset-1'
          : 'w-6 h-6 text-xs border border-stone-400 ring-2 ring-stone-300 ring-offset-1'
      } ring-offset-white bg-stone-50 text-stone-900`}
      title={`+${diff}타`}
    >
      {score}
    </div>
  );
}

/**
 * 스코어카드 상단/하단에 노출되는 기호 범례 (Legend)
 */
export function ScoreBadgeLegend({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center flex-wrap gap-x-3 gap-y-1 py-1.5 px-3 bg-stone-50/95 border border-stone-200 rounded-xl text-[10px] text-stone-600 font-bold ${className}`}
    >
      <div className="flex items-center gap-1">
        <span className="text-xs -mr-0.5">👑</span>
        <span className="w-3.5 h-3.5 rounded-full border border-rose-600 ring-1 ring-amber-400 ring-offset-1 flex items-center justify-center text-[8px] font-black text-rose-700 bg-amber-100 leading-none">
          1
        </span>
        <span className="font-extrabold text-amber-900">홀인원(왕관+이중원)</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3.5 h-3.5 rounded-full border border-red-500 ring-1 ring-red-500 ring-offset-1 flex items-center justify-center text-[7.5px] font-black text-red-600 bg-rose-50 leading-none">
          -2
        </span>
        <span>이글(-2, 이중원)</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3.5 h-3.5 rounded-full border-2 border-red-500 flex items-center justify-center text-[7.5px] font-black text-red-600 bg-white leading-none">
          -1
        </span>
        <span>버디(-1, 동그라미1개)</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3.5 h-3.5 rounded-full border-[2px] border-rose-600 ring-1 ring-amber-400 ring-offset-1 flex items-center justify-center text-[7.5px] font-black text-red-950 bg-amber-100 leading-none">
          -3
        </span>
        <span>알바트로스(굵은테두리)</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3.5 h-3.5 rounded-xs bg-stone-200 flex items-center justify-center text-[8px] font-bold text-stone-700 leading-none">
          0
        </span>
        <span>파(Par)</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-3.5 h-3.5 rounded-xs border border-stone-400 flex items-center justify-center text-[7.5px] font-bold text-stone-600 leading-none">
          +1
        </span>
        <span>보기(+1)</span>
      </div>
    </div>
  );
}
