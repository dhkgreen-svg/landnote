'use client';

import React from 'react';

interface DiagramProps {
  ruleId: string;
}

export function TeeSwingDiagrams({ ruleId }: DiagramProps) {
  // [1] ts-1: 헛스윙 시 타수 계산 여부 (다운스윙 헛스윙 = 1타 vs 연습스윙 = 0타)
  if (ruleId === 'ts-1') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🏌️</span>
            <span>공인 규정 제30조 2항 헛스윙 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full">
            타격 의사 다운스윙 = 1타 가산
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#14532d" />
            <rect x="0" y="165" width="400" height="55" fill="#15803d" />

            {/* Mat & Tee */}
            <rect x="70" y="155" width="260" height="20" rx="4" fill="#047857" stroke="#10b981" strokeWidth="1.5" />
            <rect x="195" y="140" width="10" height="20" fill="#0284c7" />
            
            {/* Park Golf Ball on Tee */}
            <circle cx="200" cy="130" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />

            {/* Swing Arc missing ball */}
            <path d="M 120 70 C 150 140, 200 170, 280 100" stroke="#facc15" strokeWidth="4" strokeDasharray="5,4" fill="none" />
            <path d="M 275 95 L 285 100 L 280 110" fill="#facc15" />

            {/* Whistling Wind Lines above ball */}
            <path d="M 180 110 Q 200 105 220 110" stroke="#bae6fd" strokeWidth="2" fill="none" />
            <path d="M 175 100 Q 200 95 225 100" stroke="#bae6fd" strokeWidth="2" fill="none" />
            <text x="200" y="90" fill="#38bdf8" fontSize="11" fontWeight="900" textAnchor="middle">공 위를 헛스윙! (공 미접촉)</text>

            {/* Decision Callouts */}
            <rect x="25" y="25" width="165" height="50" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="107" y="44" fill="#38bdf8" fontSize="10" fontWeight="900" textAnchor="middle">공 치려던 다운스윙</text>
            <text x="107" y="62" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">정규 1타 인정 (벌타 아님)</text>

            <rect x="210" y="25" width="165" height="50" rx="8" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="292" y="44" fill="#94a3b8" fontSize="10" fontWeight="800" textAnchor="middle">단순 연습 빈스윙</text>
            <text x="292" y="62" fill="#cbd5e1" fontSize="11" fontWeight="800" textAnchor="middle">스트로크 제외 (0타)</text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-amber-400 font-extrabold flex items-center gap-1">
            <span>💡 헛스윙 타수 기준:</span>
            <span>공을 맞추려는 의도로 다운스윙을 시작했다면 1타로 계산합니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            공을 치려고 스윙했다면 닿지 않았더라도 정규 1타로 인정됩니다(벌타는 없음). 반면 공을 칠 의도가 없었던 가벼운 연습 빈스윙은 타수에 포함되지 않습니다.
          </p>
        </div>
      </div>
    );
  }

  // [2] ts-2: 티샷 전 티에서 공이 저절로 굴러떨어졌을 때 (스윙 전 무벌 재티업)
  if (ruleId === 'ts-2') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>⛳</span>
            <span>티업 공 낙하 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            무벌 ➔ 다시 티업 후 샷
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#14532d" />
            <rect x="60" y="145" width="280" height="25" rx="4" fill="#047857" stroke="#10b981" strokeWidth="1.5" />

            {/* Empty Rubber Tee */}
            <rect x="150" y="130" width="12" height="20" fill="#0284c7" />

            {/* Dotted Falling Trajectory */}
            <path d="M 156 120 Q 185 110 230 145" stroke="#facc15" strokeWidth="3" strokeDasharray="4,3" fill="none" />

            {/* Fallen Ball resting on mat */}
            <circle cx="235" cy="142" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="235" y="175" fill="#fef08a" fontSize="11" fontWeight="900" textAnchor="middle">바람/터치로 툭 낙하</text>

            <rect x="110" y="30" width="180" height="46" rx="10" fill="#047857" stroke="#34d399" strokeWidth="2" />
            <text x="200" y="50" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">✔ 벌타 없음 (무벌)</text>
            <text x="200" y="66" fill="#a7f3d0" fontSize="10" fontWeight="800" textAnchor="middle">손으로 다시 티에 올려놓기</text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>✔ 타격 전 낙하 무벌:</span>
            <span>다운스윙을 시작하기 전 떨어진 공은 벌타 없이 다시 티업합니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            어드레스 도중 손이나 클럽 끝에 스쳐 떨어졌거나 바람에 굴러떨어진 경우, 타격 의사 다운스윙 전이므로 벌타 없이 편안하게 다시 티에 올려놓고 치시면 됩니다.
          </p>
        </div>
      </div>
    );
  }

  // [3] ts-3: 티샷할 때 두 발이 티박스(매트) 밖으로 나간 경우
  if (ruleId === 'ts-3') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>👟</span>
            <span>티매트 스탠스 위반 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            양 발 모두 이탈 시 2벌타
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#78350f" />
            <text x="350" y="30" fill="#a8a29e" fontSize="10" fontWeight="900">맨땅/잔디</text>

            {/* Artificial Mat (Green) */}
            <rect x="40" y="35" width="220" height="150" rx="6" fill="#15803d" stroke="#ffffff" strokeWidth="2" />
            <text x="150" y="60" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              공인 티매트 (티잉그라운드)
            </text>

            {/* Ball on Tee */}
            <circle cx="150" cy="110" r="12" fill="#f97316" stroke="#ffffff" strokeWidth="1" />

            {/* Two Feet Completely Outside (Right Side) */}
            <g transform="translate(280, 90)">
              <ellipse cx="12" cy="18" rx="8" ry="16" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
              <ellipse cx="34" cy="18" rx="8" ry="16" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
              <text x="23" y="48" fill="#fca5a5" fontSize="9" fontWeight="900" textAnchor="middle">양 발 완전 이탈</text>
            </g>

            {/* Big Red X */}
            <line x1="280" y1="80" x2="330" y2="130" stroke="#dc2626" strokeWidth="4" />
            <line x1="330" y1="80" x2="280" y2="130" stroke="#dc2626" strokeWidth="4" />

            {/* Warning Badge */}
            <rect x="235" y="150" width="145" height="42" rx="8" fill="#991b1b" stroke="#fca5a5" strokeWidth="1.5" />
            <text x="307" y="172" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">
              🚨 2벌타 부과
            </text>
            <text x="307" y="185" fill="#fef08a" fontSize="8" fontWeight="800" textAnchor="middle">
              (최소 한 발은 매트에 접촉 필수)
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>🚨 스탠스 접촉 수칙:</span>
            <span>티샷 시 적어도 한 발은 반드시 매트에 닿아 있어야 합니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            양 발이 모두 매트 바깥 맨땅에 딛고 티샷을 하면 티잉그라운드 구역 위반으로 2벌타가 부과됩니다. 한 발만 매트에 걸쳐 있어도 정상 인정됩니다.
          </p>
        </div>
      </div>
    );
  }

  // [4] ts-4: 개인 티 사용 시 티 높이 제한 규정 (2.3cm)
  if (ruleId === 'ts-4') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>📏</span>
            <span>공인 티 높이 2.3cm 규격도</span>
          </div>
          <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full">
            최대 2.3cm (23mm) 이하
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#1c1917" />
            <rect x="0" y="150" width="400" height="70" fill="#15803d" />
            <line x1="0" y1="150" x2="400" y2="150" stroke="#facc15" strokeWidth="2" strokeDasharray="4,2" />
            <text x="380" y="145" fill="#facc15" fontSize="9" fontWeight="900" textAnchor="end">지면(잔디 기준선)</text>

            {/* Allowed Tee (Left) */}
            <g transform="translate(100, 75)">
              <rect x="25" y="55" width="20" height="20" fill="#0284c7" rx="2" />
              <circle cx="35" cy="40" r="16" fill="#f97316" />
              
              {/* Dimension Line */}
              <line x1="60" y1="55" x2="60" y2="75" stroke="#38bdf8" strokeWidth="2" />
              <path d="M 57 55 L 63 55 M 57 75 L 63 75" stroke="#38bdf8" strokeWidth="2" />
              <text x="70" y="68" fill="#38bdf8" fontSize="12" fontWeight="900">2.3cm 이하</text>

              <rect x="0" y="85" width="90" height="26" rx="6" fill="#047857" />
              <text x="45" y="102" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">✔ 공인 규격</text>
            </g>

            {/* Illegal Long Tee (Right) */}
            <g transform="translate(260, 45)">
              <rect x="25" y="35" width="20" height="70" fill="#ef4444" rx="2" />
              <circle cx="35" cy="20" r="16" fill="#f97316" />
              
              {/* Dimension Line */}
              <line x1="60" y1="35" x2="60" y2="105" stroke="#f87171" strokeWidth="2" />
              <text x="70" y="75" fill="#f87171" fontSize="12" fontWeight="900">&gt; 2.3cm 초과</text>

              <rect x="-10" y="115" width="110" height="26" rx="6" fill="#991b1b" stroke="#fca5a5" strokeWidth="1" />
              <text x="45" y="132" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">❌ 위반 (2벌타)</text>
            </g>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-amber-400 font-extrabold flex items-center gap-1">
            <span>📏 고무티 규격 준수:</span>
            <span>지면으로부터 높이 2.3cm를 초과하는 티는 사용할 수 없습니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            일반 골프용 롱티나 2.3cm를 넘는 높은 티, 딱딱한 플라스틱 티를 꽂고 치면 2벌타가 부과됩니다. 반드시 공인 2.3cm 이하 고무티를 사용해야 합니다.
          </p>
        </div>
      </div>
    );
  }

  // [5] ts-5: 직전 홀 스코어 순서(오너)를 어기고 먼저 티샷한 경우
  if (ruleId === 'ts-5') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>👥</span>
            <span>타격 순서(오너) 위반 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            벌타 없음 (무벌)
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#14532d" />
            
            {/* Player 1 (Original Honor / Birdie) */}
            <g transform="translate(60, 50)">
              <circle cx="30" cy="30" r="18" fill="#38bdf8" />
              <rect x="18" y="52" width="24" height="45" rx="4" fill="#0284c7" />
              <text x="30" y="115" fill="#bae6fd" fontSize="10" fontWeight="900" textAnchor="middle">직전 홀 버디</text>
              <rect x="-10" y="-15" width="80" height="24" rx="6" fill="#0369a1" />
              <text x="30" y="1" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">진짜 오너(1번)</text>
            </g>

            {/* Player 2 Mistakenly Shot First */}
            <g transform="translate(250, 50)">
              <circle cx="30" cy="30" r="18" fill="#f59e0b" />
              <rect x="18" y="52" width="24" height="45" rx="4" fill="#d97706" />
              <text x="30" y="115" fill="#fef08a" fontSize="10" fontWeight="900" textAnchor="middle">순서 착각 먼저 샷!</text>
              <rect x="-10" y="-15" width="80" height="24" rx="6" fill="#b45309" />
              <text x="30" y="1" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">2순위 타자</text>
            </g>

            <rect x="120" y="150" width="160" height="48" rx="10" fill="#065f46" stroke="#34d399" strokeWidth="2" />
            <text x="200" y="172" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">✔ 벌타 없음 (무벌)</text>
            <text x="200" y="188" fill="#a7f3d0" fontSize="9" fontWeight="800" textAnchor="middle">상대 요구 시 취소 후 재타격 가능</text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>✔ 순서 위반은 무벌:</span>
            <span>오너 순서를 착각하여 먼저 쳤더라도 벌타는 부과되지 않습니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            순서를 어긴 티샷은 그대로 유효하며 벌타가 없습니다. 단, 매치플레이 시 상대방이 순서 위반에 대해 샷 취소를 요구하면 벌타 없이 취소하고 올바른 순서로 다시 칠 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  // [6] ts-6: 백스윙 중 뒤쪽 잔디나 나뭇가지 건드렸을 때
  if (ruleId === 'ts-6') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🌿</span>
            <span>백스윙 중 주변물 접촉 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            공 정지 시 무벌
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#14532d" />

            {/* Tree Branch / Tall Grass */}
            <path d="M 60 40 Q 90 90 80 160" stroke="#78350f" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M 70 80 Q 110 90 120 75" stroke="#16a34a" strokeWidth="6" fill="none" strokeLinecap="round" />

            {/* Club touching branch in backswing */}
            <line x1="120" y1="75" x2="200" y2="135" stroke="#94a3b8" strokeWidth="5" />
            <rect x="105" y="65" width="22" height="15" rx="3" fill="#64748b" transform="rotate(30 115 72)" />
            <text x="130" y="55" fill="#facc15" fontSize="10" fontWeight="900">백스윙 중 나뭇가지 스침</text>

            {/* Ball stationary on ground */}
            <circle cx="250" cy="155" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="250" y="185" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">공은 전혀 안 움직임 (정지)</text>

            <rect x="230" y="45" width="145" height="45" rx="8" fill="#047857" stroke="#34d399" strokeWidth="2" />
            <text x="302" y="66" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">✔ 벌타 없음 (무벌)</text>
            <text x="302" y="80" fill="#a7f3d0" fontSize="9" fontWeight="800" textAnchor="middle">공 움직이면 1벌타</text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>🌿 백스윙 접촉 기준:</span>
            <span>공이 움직이지 않았다면 백스윙 중 잔디나 가지를 스쳐도 무벌!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            스윙 준비 도중 뒤쪽 수목을 가볍게 건드린 것은 벌타가 아닙니다. 단, 그 반동이나 충격으로 공이 본래 위치를 벗어나 움직였다면 1벌타가 부과되고 원위치해야 합니다.
          </p>
        </div>
      </div>
    );
  }

  // [7] ts-7: 공을 연속 2번 치는 투터치(더블히트)가 발생한 경우
  if (ruleId === 'ts-7') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>⚡</span>
            <span>투터치(더블히트) 2벌타 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            2벌타 (스트로크 1타 + 2벌타 = 총 3타)
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#14532d" />

            {/* Impact 1 */}
            <circle cx="120" cy="140" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <rect x="75" y="125" width="25" height="30" rx="4" fill="#64748b" />
            <text x="100" y="115" fill="#fef08a" fontSize="10" fontWeight="900">1차 임팩트</text>

            {/* Dotted Flight Arc */}
            <path d="M 134 140 Q 180 100 240 120" stroke="#facc15" strokeWidth="2.5" strokeDasharray="3,3" fill="none" />

            {/* Impact 2 in follow-through */}
            <circle cx="240" cy="120" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <rect x="210" y="100" width="25" height="30" rx="4" fill="#64748b" transform="rotate(20 222 115)" />
            <text x="240" y="90" fill="#ef4444" fontSize="11" fontWeight="900" textAnchor="middle">2차 연속 타격!</text>

            <rect x="220" y="150" width="160" height="50" rx="10" fill="#991b1b" stroke="#fca5a5" strokeWidth="2" />
            <text x="300" y="172" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">
              🚨 2벌타 부과
            </text>
            <text x="300" y="188" fill="#fef08a" fontSize="9" fontWeight="800" textAnchor="middle">
              멈춘 위치에서 다음 타 진행
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>⚡ 투터치(더블히트) 2벌타:</span>
            <span>한 번의 스윙 중 공을 두 번 치면 2벌타가 부과됩니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            풀이나 러프에서 헤드를 휘두르다 튀어 오른 공을 팔로우스루에서 또 맞히는 경우 2벌타가 주어지며, 공이 최종 멈춘 자리에서 다음 타를 진행합니다.
          </p>
        </div>
      </div>
    );
  }

  // [8] ts-8: 공을 퍼터나 클럽 헤드로 밀어치거나 걷어 올리는 행위
  if (ruleId === 'ts-8') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🥄</span>
            <span>밀어치기(푸시) 및 걷어올리기 금지 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            푸시/스코핑 2벌타
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#14532d" />

            {/* Pushing Club Motion with continuous contact */}
            <g transform="translate(60, 60)">
              <rect x="40" y="60" width="20" height="40" rx="4" fill="#64748b" />
              <circle cx="70" cy="80" r="14" fill="#f97316" />
              
              {/* Push Arrow sticking to ball */}
              <line x1="85" y1="80" x2="160" y2="80" stroke="#ef4444" strokeWidth="4" />
              <polygon points="160,74 175,80 160,86" fill="#ef4444" />
              <text x="120" y="65" fill="#fca5a5" fontSize="10" fontWeight="900" textAnchor="middle">
                헤드로 쭉 밀어냄 (푸시)
              </text>
            </g>

            {/* Prohibition Symbol */}
            <circle cx="170" cy="110" r="45" fill="none" stroke="#dc2626" strokeWidth="6" opacity="0.85" />
            <line x1="138" y1="78" x2="202" y2="142" stroke="#dc2626" strokeWidth="6" opacity="0.85" />

            <rect x="235" y="80" width="145" height="60" rx="10" fill="#991b1b" stroke="#fca5a5" strokeWidth="2" />
            <text x="307" y="105" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">
              🚨 2벌타 부과
            </text>
            <text x="307" y="122" fill="#fef08a" fontSize="9" fontWeight="800" textAnchor="middle">
              순간 타격만 인정 (순수 타격)
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>🚫 밀어치기(푸시) 금지:</span>
            <span>공은 클럽 헤드로 순간적으로 정확히 타격해야 합니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            내리막 등에서 공을 딱 때리지 않고 헤드로 부드럽게 밀어내거나 숟가락처럼 떠올리는(스코핑) 동작은 부정한 타격으로 2벌타가 부과됩니다.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
