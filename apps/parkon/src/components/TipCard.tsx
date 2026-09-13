'use client';

import React, { useState } from 'react';
import { Lightbulb, ThumbsUp } from 'lucide-react';

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

export function TipCard({ hole, tip }: TipCardProps) {
  const [upvotes, setUpvotes] = useState(14);
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

  return (
    <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-3 py-2 rounded-xl shadow-xs flex items-center justify-between gap-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/parky.jpg"
          alt="스마트 캐디 파키"
          className="w-8 h-8 rounded-full object-cover shrink-0 border border-amber-400 shadow-2xs"
        />
        <div className="min-w-0">
          <div className="text-[10px] font-black text-emerald-800 flex items-center gap-1">
            <span>🏌️ 스마트 캐디 파키의 코스 공략</span>
          </div>
          <p className="text-xs font-bold text-emerald-950 truncate break-keep">
            {tip}
          </p>
        </div>
      </div>

      <button
        onClick={handleVote}
        disabled={voted}
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
