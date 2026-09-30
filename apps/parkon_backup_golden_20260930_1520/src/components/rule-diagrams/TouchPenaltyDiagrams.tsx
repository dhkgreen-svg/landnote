'use client';

import React from 'react';

interface DiagramProps {
  ruleId: string;
}

export function TouchPenaltyDiagrams({ ruleId }: DiagramProps) {
  // [1] tp-1: 내 공을 쳤는데 정지해 있던 동반자의 공을 맞춘 경우
  if (ruleId === 'tp-1') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>💥</span>
            <span>정지구 충돌 시 공 분리 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            친 사람 무벌 / 동반자 공 원위치
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#15803d" />

            {/* Striking Ball Trajectory */}
            <path d="M 50 110 L 170 110" stroke="#facc15" strokeWidth="3" strokeDasharray="3,3" />
            
            {/* Collision Point */}
            <circle cx="170" cy="110" r="16" fill="#fef08a" opacity="0.8" />
            <text x="170" y="85" fill="#facc15" fontSize="12" fontWeight="900" textAnchor="middle">💥 딱! 충돌</text>

            {/* Companion's displaced ball */}
            <path d="M 170 110 Q 220 70 280 60" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="3,2" fill="none" />
            <circle cx="285" cy="60" r="13" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
            
            {/* Return Arrow for Companion's Ball */}
            <path d="M 275 68 Q 230 100 185 110" stroke="#38bdf8" strokeWidth="2" strokeDasharray="2,2" fill="none" />
            <text x="285" y="90" fill="#bae6fd" fontSize="9" fontWeight="900" textAnchor="middle">원래 자리로 복귀</text>

            {/* Striker's Ball resting */}
            <path d="M 170 110 Q 220 130 270 150" stroke="#f97316" strokeWidth="2.5" strokeDasharray="3,2" fill="none" />
            <circle cx="270" cy="150" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="270" y="180" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">친 공 멈춘 곳에서 플레이</text>

            <rect x="30" y="25" width="125" height="42" rx="8" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
            <text x="92" y="44" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">친 사람: 무벌</text>
            <text x="92" y="58" fill="#a7f3d0" fontSize="8" fontWeight="800" textAnchor="middle">멈춘 자리 그대로</text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>💥 공 충돌 처치 원칙:</span>
            <span>친 사람에게는 벌타가 없으며, 맞아서 굴러간 동반자 공만 원위치합니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            친 사람의 공은 굴러가 멈춘 자리에서 그대로 다음 타를 진행하며, 맞아서 튕겨 나간 동반자의 공은 충돌 전 원래 있던 위치로 벌타 없이 다시 되돌려놓습니다.
          </p>
        </div>
      </div>
    );
  }

  // [2] tp-2: 볼마커를 놓지 않고 임의로 공을 집어 올린 경우
  if (ruleId === 'tp-2') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🚫</span>
            <span>무단 픽업(마크 누락) 2벌타 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            마크 없이 집으면 2벌타
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#15803d" />

            {/* Grass indent where ball was */}
            <ellipse cx="150" cy="140" rx="20" ry="10" fill="#14532d" />
            <text x="150" y="168" fill="#fef08a" fontSize="10" fontWeight="900" textAnchor="middle">
              마커 없음 (NO MARKER)
            </text>

            {/* Hand Picking up ball directly */}
            <g transform="translate(130, 50)">
              <circle cx="20" cy="40" r="16" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M 5 20 Q 20 0 35 20" stroke="#fde047" strokeWidth="8" fill="none" strokeLinecap="round" />
              <text x="20" y="10" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">손으로 덥석 픽업</text>
            </g>

            {/* Giant Prohibition Symbol */}
            <circle cx="150" cy="110" r="48" fill="none" stroke="#dc2626" strokeWidth="6" opacity="0.9" />
            <line x1="116" y1="76" x2="184" y2="144" stroke="#dc2626" strokeWidth="6" opacity="0.9" />

            <rect x="235" y="70" width="145" height="60" rx="10" fill="#991b1b" stroke="#fca5a5" strokeWidth="2" />
            <text x="307" y="95" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">
              🚨 2벌타 부과
            </text>
            <text x="307" y="112" fill="#fef08a" fontSize="9" fontWeight="800" textAnchor="middle">
              원래 자리에 리플레이스
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>🚫 무단 픽업 금지:</span>
            <span>공을 집어 올리기 전에는 반드시 공 바로 뒤에 볼마커를 놓아야 합니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            마크를 하지 않고 인플레이 볼을 집어 올리면 2벌타가 부과됩니다. 공은 반드시 원래 위치로 되돌려놓고 다음 플레이를 진행해야 합니다.
          </p>
        </div>
      </div>
    );
  }

  // [3] tp-3: 마커를 좌우로 이동한 뒤 원래 위치로 복귀하지 않고 친 경우 (오소 2벌타)
  if (ruleId === 'tp-3') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>↩️</span>
            <span>마커 미복귀 오소(오치) 2벌타 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            원위치 미복귀 2벌타
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#15803d" />

            {/* Original Marker Spot (Left) */}
            <circle cx="120" cy="110" r="10" fill="#facc15" stroke="#ca8a04" strokeWidth="2" strokeDasharray="2,2" />
            <text x="120" y="145" fill="#fef08a" fontSize="10" fontWeight="900" textAnchor="middle">
              원래 마크 위치
            </text>

            {/* Shift arrow to side */}
            <path d="M 135 110 L 220 110" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="3,2" />
            <text x="175" y="100" fill="#38bdf8" fontSize="9" fontWeight="800" textAnchor="middle">
              1헤드 옆으로 이동
            </text>

            {/* Moved Spot (Right) where player wrongly shot */}
            <circle cx="230" cy="110" r="14" fill="#f97316" stroke="#ef4444" strokeWidth="2" />
            <text x="230" y="145" fill="#fca5a5" fontSize="10" fontWeight="900" textAnchor="middle">
              옆으로 옮긴 자리에서 타격!
            </text>

            {/* Red alert cross */}
            <line x1="215" y1="95" x2="245" y2="125" stroke="#dc2626" strokeWidth="4" />
            <line x1="245" y1="95" x2="215" y2="125" stroke="#dc2626" strokeWidth="4" />

            <rect x="230" y="25" width="150" height="50" rx="8" fill="#991b1b" stroke="#fca5a5" strokeWidth="1.5" />
            <text x="305" y="47" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              🚨 오소 플레이 2벌타
            </text>
            <text x="305" y="62" fill="#fef08a" fontSize="8" fontWeight="800" textAnchor="middle">
              반드시 원래 자리 복귀 후 타격
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>↩️ 마커 원위치 복귀 필수:</span>
            <span>동반자 요청으로 옮겼던 마크는 본인 샷 전에 꼭 원래 자리로 되돌려놓아야 합니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            퍼팅 라인을 피해 옆으로 1~2헤드 이동했던 마커를 원래 자리로 복귀시키지 않고 이동한 자리에서 그대로 치면 오소(잘못된 장소) 플레이로 2벌타가 부과됩니다.
          </p>
        </div>
      </div>
    );
  }

  // [4] tp-4: 아직 굴러가며 움직이고 있는 공을 건드리거나 친 경우
  if (ruleId === 'tp-4') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🛑</span>
            <span>움직이는 공 간섭/타격 금지 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            고의 간섭 2벌타
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#14532d" />

            {/* Slope */}
            <path d="M 0 60 L 400 180 L 400 220 L 0 220 Z" fill="#15803d" />

            {/* Rolling Ball with motion lines */}
            <circle cx="160" cy="115" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M 80 85 L 145 110" stroke="#facc15" strokeWidth="3" strokeDasharray="4,2" />
            <text x="120" y="80" fill="#fef08a" fontSize="10" fontWeight="900">데굴데굴 굴러가는 중</text>

            {/* Shoe / Club blocking moving ball */}
            <rect x="180" y="110" width="35" height="15" rx="3" fill="#64748b" transform="rotate(-15 195 115)" />
            <text x="240" y="110" fill="#f87171" fontSize="10" fontWeight="900">클럽/발로 막아섬</text>

            {/* Prohibition Symbol */}
            <circle cx="180" cy="115" r="45" fill="none" stroke="#dc2626" strokeWidth="6" opacity="0.9" />
            <line x1="148" y1="83" x2="212" y2="147" stroke="#dc2626" strokeWidth="6" opacity="0.9" />

            <rect x="235" y="145" width="145" height="50" rx="8" fill="#991b1b" stroke="#fca5a5" strokeWidth="1.5" />
            <text x="307" y="167" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              🚨 2벌타 부과
            </text>
            <text x="307" y="182" fill="#fef08a" fontSize="8" fontWeight="800" textAnchor="middle">
              완전히 멈출 때까지 대기
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>🛑 완전 정지 대기 원칙:</span>
            <span>굴러가는 공을 건드리거나 치면 2벌타가 부과됩니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            경사면을 타고 내려오거나 굴러가는 공을 발로 막거나 클럽으로 건드리는 행위는 고의 간섭으로 2벌타입니다. 공이 완전히 멈출 때까지 기다려야 합니다.
          </p>
        </div>
      </div>
    );
  }

  // [5] tp-5: 다른 사람의 공을 내 공으로 착각하고 친 경우 (오구 플레이 2벌타)
  if (ruleId === 'tp-5') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🎨</span>
            <span>오구(남의 공) 타격 2벌타 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            오구 플레이 2벌타
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#15803d" />

            {/* Companion's Orange Ball (Wrongly struck) */}
            <g transform="translate(80, 70)">
              <circle cx="30" cy="30" r="16" fill="#f97316" stroke="#ef4444" strokeWidth="2.5" />
              <text x="30" y="65" fill="#fca5a5" fontSize="10" fontWeight="900" textAnchor="middle">동반자의 오렌지 볼</text>
              <rect x="-10" y="-15" width="80" height="22" rx="4" fill="#991b1b" />
              <text x="30" y="0" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">착각하고 타격!</text>
            </g>

            {/* My Real Yellow Ball resting in rough */}
            <g transform="translate(240, 70)">
              <circle cx="30" cy="30" r="16" fill="#facc15" stroke="#ffffff" strokeWidth="2" />
              <text x="30" y="65" fill="#fef08a" fontSize="10" fontWeight="900" textAnchor="middle">진짜 내 옐로우 볼</text>
              <rect x="-10" y="-15" width="80" height="22" rx="4" fill="#065f46" />
              <text x="30" y="0" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">러프에 숨어있음</text>
            </g>

            <rect x="100" y="150" width="200" height="50" rx="10" fill="#991b1b" stroke="#fca5a5" strokeWidth="2" />
            <text x="200" y="172" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">
              🚨 오구 플레이 2벌타
            </text>
            <text x="200" y="188" fill="#fef08a" fontSize="8" fontWeight="800" textAnchor="middle">
              남의 공은 즉시 원위치, 내 공 찾아 플레이
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>🎨 본인 공 식별 의무:</span>
            <span>동반자의 공을 내 공으로 착각하여 치면 2벌타입니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            잘못 친 동반자의 공은 원래 위치로 즉시 되돌려놓아야 합니다. 친 사람에게는 2벌타가 가산되며 본인의 진짜 공을 찾아 플레이를 이어가야 합니다.
          </p>
        </div>
      </div>
    );
  }

  // [6] tp-6: 인플레이 중인 내 공을 실수로 발로 차거나 클럽으로 건드렸을 때
  if (ruleId === 'tp-6') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>👟</span>
            <span>정지구 우발적 이동(발로 툭 침) 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full">
            1벌타 ➔ 원래 자리 리플레이스
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#15803d" />

            {/* Original Spot */}
            <circle cx="120" cy="120" r="14" fill="#047857" stroke="#34d399" strokeWidth="2" strokeDasharray="3,2" />
            <text x="120" y="155" fill="#a7f3d0" fontSize="10" fontWeight="900" textAnchor="middle">충돌 전 원위치</text>

            {/* Walking Shoe kicking ball */}
            <rect x="80" y="90" width="35" height="22" rx="4" fill="#1e293b" stroke="#facc15" strokeWidth="1.5" />
            <text x="90" y="80" fill="#facc15" fontSize="9" fontWeight="800">발끝 툭!</text>

            {/* Displaced Arrow */}
            <path d="M 135 120 Q 180 90 230 120" stroke="#f87171" strokeWidth="2.5" strokeDasharray="3,2" fill="none" />
            <polygon points="230,120 220,114 222,125" fill="#f87171" />

            {/* Moved Ball */}
            <circle cx="240" cy="120" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="240" y="155" fill="#fca5a5" fontSize="10" fontWeight="900" textAnchor="middle">1m 앞으로 굴러감</text>

            {/* Return Arc */}
            <path d="M 230 135 Q 180 160 135 130" stroke="#34d399" strokeWidth="2.5" strokeDasharray="3,3" fill="none" />
            <text x="180" y="180" fill="#34d399" fontSize="10" fontWeight="900" textAnchor="middle">반드시 원래 자리 복귀</text>

            <rect x="230" y="25" width="145" height="45" rx="8" fill="#78350f" stroke="#d97706" strokeWidth="1.5" />
            <text x="302" y="45" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">⚠️ 1벌타 부과</text>
            <text x="302" y="60" fill="#fef08a" fontSize="8" fontWeight="800" textAnchor="middle">실수로 움직인 경우</text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-amber-400 font-extrabold flex items-center gap-1">
            <span>👟 우발적 이동 1벌타:</span>
            <span>공을 실수로 차거나 건드려 움직이면 1벌타를 받고 원래 위치에 놓습니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            공을 찾거나 걸어가다 실수로 발로 차서 굴러간 경우 1벌타가 가산되며, 공은 움직이기 전 원래 자리에 리플레이스한 후 다음 타를 칩니다.
          </p>
        </div>
      </div>
    );
  }

  // [7] tp-7: 공을 닦거나 확인하려고 동반자 동의 없이 집어 올린 경우 (그린 밖 2벌타)
  if (ruleId === 'tp-7') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🧼</span>
            <span>그린 밖 페어웨이 공 닦기 금지 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            페어웨이 임의 닦기 2벌타
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#14532d" />
            <text x="200" y="30" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">페어웨이 / 러프 구역</text>

            {/* Golfer with towel wiping ball */}
            <circle cx="150" cy="100" r="14" fill="#f97316" />
            <rect x="160" y="88" width="25" height="20" rx="3" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
            <text x="172" y="102" fill="#0f172a" fontSize="8" fontWeight="800" textAnchor="middle">수건</text>
            <text x="150" y="130" fill="#fca5a5" fontSize="10" fontWeight="900" textAnchor="middle">흙 묻었다고 닦음</text>

            {/* Prohibition Symbol */}
            <circle cx="160" cy="100" r="45" fill="none" stroke="#dc2626" strokeWidth="6" opacity="0.9" />
            <line x1="128" y1="68" x2="192" y2="132" stroke="#dc2626" strokeWidth="6" opacity="0.9" />

            <rect x="235" y="70" width="145" height="60" rx="10" fill="#991b1b" stroke="#fca5a5" strokeWidth="2" />
            <text x="307" y="95" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">
              🚨 2벌타 부과
            </text>
            <text x="307" y="112" fill="#fef08a" fontSize="8" fontWeight="800" textAnchor="middle">
              그린 위에서만 닦기 허용
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>🧼 공 닦기 제한 수칙:</span>
            <span>그린 밖 페어웨이나 러프에서는 식별 목적 외에 공을 닦을 수 없습니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            공에 묻은 진흙을 닦는 것은 오직 그린 위에서 마크한 후에만 허용됩니다. 페어웨이에서 임의로 공을 집어 닦으면 2벌타가 부과됩니다.
          </p>
        </div>
      </div>
    );
  }

  // [8] tp-8: 위험한 상황에서 안전거리 미확보 및 전방 플레이 중 타격
  if (ruleId === 'tp-8') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>⚠️</span>
            <span>전방 안전거리 미확보 타격 엄벌 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            안전 위반 2벌타 / 고의 시 실격
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#14532d" />

            {/* Rear Striker */}
            <circle cx="60" cy="110" r="14" fill="#ef4444" />
            <rect x="55" y="125" width="10" height="30" fill="#dc2626" rx="3" />
            <text x="60" y="80" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">후속 조 타자</text>
            <text x="60" y="93" fill="#fca5a5" fontSize="8" fontWeight="800" textAnchor="middle">(무단 티샷)</text>

            {/* Danger Flight Ball Trajectory */}
            <path d="M 80 110 L 250 110" stroke="#ef4444" strokeWidth="3" strokeDasharray="4,2" />
            <polygon points="255,110 245,105 245,115" fill="#ef4444" />
            <circle cx="260" cy="110" r="12" fill="#f97316" />

            {/* Front Group still playing on fairway */}
            <g transform="translate(290, 80)">
              <circle cx="20" cy="20" r="12" fill="#38bdf8" />
              <rect x="16" y="33" width="8" height="25" fill="#0284c7" rx="2" />
              <circle cx="50" cy="25" r="12" fill="#38bdf8" />
              <rect x="46" y="38" width="8" height="25" fill="#0284c7" rx="2" />
              <text x="35" y="75" fill="#bae6fd" fontSize="10" fontWeight="900" textAnchor="middle">앞 조 아직 플레이 중!</text>
            </g>

            <rect x="100" y="160" width="200" height="45" rx="10" fill="#991b1b" stroke="#fca5a5" strokeWidth="2" />
            <text x="200" y="180" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">
              🚨 2벌타 또는 즉시 실격
            </text>
            <text x="200" y="195" fill="#fef08a" fontSize="8" fontWeight="800" textAnchor="middle">
              앞 조 홀아웃 및 이동 완료 후 타격 철칙
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>⚠️ 전방 안전 절대 철칙:</span>
            <span>앞 조가 완전히 다음 홀로 이동하기 전에는 절대 치면 안 됩니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            파크골프 볼은 무겁고 단단하여 큰 인명 사고를 유발할 수 있습니다. 전방 시야에 경기자가 있을 때 타격하면 2벌타가 부과되며, 고의 위험 행위 시 즉시 퇴장 및 실격 조치됩니다.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
