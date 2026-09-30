'use client';

import React, { useState } from 'react';
import { Lightbulb, ThumbsUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface TipCardProps {
  hole: number;
  tip?: string;
}

// 과거에 자동 생성되었던 더미/가짜 공략 팁 필터 목록 (실제 코스 마스터 등록 팁만 표시)
const DUMMY_TIPS = [
  '티샷 시 좌측 경사를 태우면',
  '맞바람이 불 때는 낮게 깔아치는',
  '그린 앞 벙커 우측으로 부드럽게',
  '홀컵 뒤쪽 내리막이 심하므로',
  '중앙 롱홀입니다. 1타는 페어웨이',
  '헤드업에 주의하고 부드럽게',
];

function localizeTip(tip: string, isJapanese: boolean): string {
  if (!isJapanese) return tip;

  const exactMap: Record<string, string> = {
    '티샷 시 좌측 경사를 태우면 안전': 'ティーショット時は左側傾斜を利用すると安全',
    '맞바람이 불 때는 낮게 깔아치는 샷 추천': '向かい風の時は低めのショットがおすすめ',
    '그린 앞 벙커 우측으로 부드럽게 공략': 'グリーン手前バンカーの右側へソフトに攻略',
    '홀컵 뒤쪽 내리막이 심하므로 짧게 공략': 'カップ奥は下り傾斜がきついので手前から短めに攻略',
    '페어웨이 중앙을 향해 똑바로 티샷': 'フェアウェイ中央に向かって真っ直ぐティーショット',
    '무리한 1온보다는 2온 안전 공략 추천': '無理な1オンより安全な2オン狙いがおすすめ',
  };

  if (exactMap[tip.trim()]) {
    return exactMap[tip.trim()];
  }

  let res = tip;
  res = res.replace(/티샷/g, 'ティーショット');
  res = res.replace(/페어웨이/g, 'フェアウェイ');
  res = res.replace(/그린/g, 'グリーン');
  res = res.replace(/벙커/g, 'バンカー');
  res = res.replace(/러프/g, 'ラフ');
  res = res.replace(/좌측/g, '左側');
  res = res.replace(/우측/g, '右側');
  res = res.replace(/중앙/g, '中央');
  res = res.replace(/경사/g, '傾斜');
  res = res.replace(/오르막/g, '上り');
  res = res.replace(/내리막/g, '下り');
  res = res.replace(/안전/g, '安全');
  res = res.replace(/공략/g, '攻略');
  res = res.replace(/추천/g, 'おすすめ');
  return res;
}

export function TipCard({ hole, tip }: TipCardProps) {
  const { isJapanese } = useTranslation();
  const [upvotes, setUpvotes] = useState(0);
  const [voted, setVoted] = useState(false);

  if (!tip || typeof tip !== 'string' || !tip.trim()) return null;

  const clean = tip.trim();

  // 더미 공략 팁은 노출 차단
  if (DUMMY_TIPS.some((dummy) => clean.includes(dummy))) {
    return null;
  }

  const handleVote = () => {
    if (voted) return;
    setUpvotes((prev) => prev + 1);
    setVoted(true);
  };

  const localizedTip = localizeTip(clean, isJapanese);

  return (
    <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-3 py-2 rounded-xl shadow-xs flex items-center justify-between gap-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/parky.jpg"
          alt={isJapanese ? 'スマートAIコーチ パキ' : '스마트 AI 코치 파키'}
          className="w-8 h-8 rounded-full object-cover shrink-0 border border-amber-400 shadow-2xs"
        />
        <div className="min-w-0">
          <div className="text-[10px] font-black text-emerald-800 flex items-center gap-1">
            <span>{isJapanese ? '🏌️ スマートAIコーチ パキのコース攻略' : '🏌️ 스마트 AI 코치 파키의 코스 공략'}</span>
          </div>
          <p className="text-xs font-bold text-emerald-950 truncate break-keep">
            {localizedTip}
          </p>
        </div>
      </div>

      <button
        onClick={handleVote}
        disabled={voted}
        aria-label={isJapanese ? (voted ? '共感済' : '役に立つ') : (voted ? '공감완료' : '도움돼요')}
        title={isJapanese ? (voted ? '共感済' : '役に立つ') : (voted ? '공감완료' : '도움돼요')}
        className={`shrink-0 flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border font-bold transition ${
          voted
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-100'
        }`}
      >
        <ThumbsUp className="w-3 h-3" />
        <span>{upvotes}</span>
      </button>
    </div>
  );
}
