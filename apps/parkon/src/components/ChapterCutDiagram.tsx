'use client';

import React from 'react';

interface ChapterCutDiagramProps {
  chapterId: string;
  cutNumber: number;
}

export function ChapterCutDiagram({ chapterId, cutNumber }: ChapterCutDiagramProps) {
  const key = `${chapterId}-${cutNumber}`;

  // ==========================================
  // 제1장 코스 탐험과 기본 규정
  // ==========================================

  // [ch-1-1] 9홀 Par 33 공인 규격 (660m)
  if (key === 'ch-1-1') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>⛳</span>
            <span>공인 규정 제2조 코스 규격 도해</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            9홀 기준 Par 33 (총 660m 내외)
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <defs>
              <linearGradient id="courseGrass" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14532d" />
                <stop offset="100%" stopColor="#052e16" />
              </linearGradient>
              <linearGradient id="fairwayGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width="420" height="220" fill="url(#courseGrass)" />

            <path
              d="M 30 150 Q 120 70 210 130 T 380 90"
              fill="none"
              stroke="#15803d"
              strokeWidth="48"
              strokeLinecap="round"
            />
            <path
              d="M 30 150 Q 120 70 210 130 T 380 90"
              fill="none"
              stroke="url(#fairwayGrad)"
              strokeWidth="40"
              strokeLinecap="round"
            />

            <rect x="18" y="136" width="30" height="26" rx="4" fill="#047857" stroke="#34d399" strokeWidth="2" />
            <text x="33" y="152" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
              TEE
            </text>

            <ellipse cx="195" cy="85" rx="26" ry="14" fill="#d97706" opacity="0.85" stroke="#fcd34d" strokeWidth="1.5" />
            <text x="195" y="88" textAnchor="middle" fill="#78350f" fontSize="8" fontWeight="900">
              벙커
            </text>

            <ellipse cx="230" cy="165" rx="32" ry="16" fill="#0284c7" opacity="0.8" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="230" y="168" textAnchor="middle" fill="#e0f2fe" fontSize="8" fontWeight="900">
              워터 해저드
            </text>

            <ellipse cx="375" cy="90" rx="30" ry="20" fill="#4ade80" stroke="#86efac" strokeWidth="2" />
            <circle cx="375" cy="90" r="5" fill="#0f172a" />
            <line x1="375" y1="90" x2="375" y2="45" stroke="#ffffff" strokeWidth="2" />
            <polygon points="375,45 350,53 375,61" fill="#ef4444" />
            <text x="360" y="55" fill="#ffffff" fontSize="7" fontWeight="900">
              9H
            </text>

            <rect x="25" y="15" width="370" height="42" rx="8" fill="#0f172a" fillOpacity="0.88" stroke="#334155" strokeWidth="1.5" />
            
            <g transform="translate(35, 23)">
              <rect x="0" y="0" width="105" height="26" rx="4" fill="#1e293b" />
              <text x="52" y="12" textAnchor="middle" fill="#60a5fa" fontSize="8" fontWeight="800">
                Par 3 (4개홀)
              </text>
              <text x="52" y="22" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                거리: 40~60m
              </text>
            </g>

            <g transform="translate(150, 23)">
              <rect x="0" y="0" width="115" height="26" rx="4" fill="#1e293b" />
              <text x="57" y="12" textAnchor="middle" fill="#4ade80" fontSize="8" fontWeight="800">
                Par 4 (4개홀)
              </text>
              <text x="57" y="22" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                거리: 60~100m
              </text>
            </g>

            <g transform="translate(275, 23)">
              <rect x="0" y="0" width="110" height="26" rx="4" fill="#1e293b" />
              <text x="55" y="12" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="800">
                Par 5 (1개홀)
              </text>
              <text x="55" y="22" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                거리: 100~150m
              </text>
            </g>

            <rect x="60" y="192" width="300" height="20" rx="10" fill="#065f46" stroke="#10b981" strokeWidth="1" />
            <text x="210" y="206" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontWeight="900">
              ★ 9홀 공인 총 거리: 약 660m / 총 기준 타수: Par 33
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // [ch-1-2] 티잉그라운드(티박스) 매트 구역의 비밀
  if (key === 'ch-1-2') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🟩</span>
            <span>제3조 티박스 직사각형 구역 규정</span>
          </div>
          <span className="text-[10px] font-black bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full">
            양 발 모두 이탈 시 2벌타
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <rect x="0" y="0" width="420" height="220" fill="#1e293b" />
            <rect x="30" y="20" width="360" height="180" rx="8" fill="#334155" />

            <rect
              x="90"
              y="40"
              width="240"
              height="140"
              rx="6"
              fill="#14532d"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
            <text x="210" y="58" textAnchor="middle" fill="#86efac" fontSize="10" fontWeight="900">
              티잉그라운드 정규 구역 (후방 2클럽 이내)
            </text>

            <rect x="130" y="70" width="160" height="85" rx="4" fill="#16a34a" stroke="#4ade80" strokeWidth="2" />
            <text x="210" y="112" textAnchor="middle" fill="#f0fdf4" fontSize="12" fontWeight="900">
              인조잔디 티매트
            </text>

            <circle cx="110" cy="70" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
            <circle cx="310" cy="70" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
            <line x1="110" y1="70" x2="310" y2="70" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" />
            <text x="70" y="74" fill="#fca5a5" fontSize="8" fontWeight="800">
              좌측 마커
            </text>
            <text x="325" y="74" fill="#fca5a5" fontSize="8" fontWeight="800">
              우측 마커
            </text>

            <ellipse cx="210" cy="125" rx="6" ry="3" fill="#0f172a" />
            <circle cx="210" cy="121" r="5" fill="#f97316" stroke="#ffffff" strokeWidth="1" />

            {/* Safe Stance: 1 foot inside mat */}
            <g transform="translate(145, 140)">
              <rect x="0" y="0" width="14" height="24" rx="4" fill="#3b82f6" />
              <rect x="18" y="5" width="14" height="24" rx="4" fill="#3b82f6" />
              <text x="16" y="38" textAnchor="middle" fill="#60a5fa" fontSize="8" fontWeight="900">
                한발 접촉: OK
              </text>
            </g>

            {/* Violation Stance: Both feet outside on bare ground */}
            <g transform="translate(340, 120)">
              <rect x="0" y="0" width="14" height="24" rx="4" fill="#dc2626" />
              <rect x="18" y="0" width="14" height="24" rx="4" fill="#dc2626" />
              <text x="16" y="38" textAnchor="middle" fill="#f87171" fontSize="8" fontWeight="900">
                양발 이탈: 2벌타!
              </text>
            </g>

            <text x="210" y="32" textAnchor="middle" fill="#fca5a5" fontSize="9" fontWeight="900">
              ▲ 티마커 전면선 (이 선을 넘어서 티를 꽂으면 2벌타)
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // [ch-1-3] 5대 코스 구역과 OB 라인
  if (key === 'ch-1-3') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🗺️</span>
            <span>코스 5대 인플레이 구역 및 OB 경계</span>
          </div>
          <span className="text-[10px] font-black bg-sky-600 text-white px-2 py-0.5 rounded-full">
            인플레이 5구역 + 외곽 OB
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <defs>
              <pattern id="obStripes" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#991b1b" strokeWidth="2" />
              </pattern>
            </defs>

            <rect x="340" y="0" width="80" height="220" fill="url(#obStripes)" opacity="0.4" />
            <text x="380" y="115" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="900" transform="rotate(90 380 115)">
              OB 구역 (코스 밖)
            </text>

            <rect x="0" y="0" width="340" height="220" fill="#15803d" />

            <line x1="340" y1="0" x2="340" y2="220" stroke="#ffffff" strokeWidth="4" />
            {[20, 70, 120, 170].map((y) => (
              <g key={y} transform={`translate(337, ${y})`}>
                <rect x="0" y="0" width="6" height="22" rx="1" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.5" />
                <rect x="0" y="0" width="6" height="7" fill="#dc2626" />
              </g>
            ))}

            <rect x="15" y="80" width="45" height="60" rx="4" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
            <text x="37" y="114" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
              ① 티박스
            </text>

            <path d="M 65 75 Q 150 60 210 80 Q 150 160 65 145 Z" fill="#22c55e" opacity="0.9" />
            <text x="135" y="112" textAnchor="middle" fill="#052e16" fontSize="10" fontWeight="900">
              ② 페어웨이
            </text>

            <text x="135" y="45" textAnchor="middle" fill="#86efac" fontSize="9" fontWeight="800">
              ③ 러프 (긴 잔디)
            </text>

            <ellipse cx="190" cy="165" rx="28" ry="16" fill="#d97706" stroke="#fde68a" strokeWidth="1.5" />
            <text x="190" y="168" textAnchor="middle" fill="#451a03" fontSize="8" fontWeight="900">
              ④ 벙커
            </text>

            <ellipse cx="235" cy="50" rx="30" ry="16" fill="#0284c7" stroke="#7dd3fc" strokeWidth="1.5" />
            <text x="235" y="53" textAnchor="middle" fill="#f0f9ff" fontSize="8" fontWeight="900">
              ④ 워터해저드
            </text>

            <ellipse cx="290" cy="115" rx="36" ry="26" fill="#86efac" stroke="#ffffff" strokeWidth="2" />
            <circle cx="290" cy="115" r="4" fill="#0f172a" />
            <line x1="290" y1="115" x2="290" y2="85" stroke="#ffffff" strokeWidth="2" />
            <polygon points="290,85 272,92 290,99" fill="#ef4444" />
            <text x="290" y="132" textAnchor="middle" fill="#14532d" fontSize="9" fontWeight="900">
              ⑤ 그린
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // ==========================================
  // 제2장 용구와 복장 수칙
  // ==========================================

  // [ch-2-1] 협회 공인 스티커 미부착 시 실격!
  if (key === 'ch-2-1') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🏷️</span>
            <span>공인 용구 규격 및 인증 스티커 필수</span>
          </div>
          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
            미인증 용구 = 즉시 실격(DQ)
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <defs>
              <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#78350f" />
                <stop offset="50%" stopColor="#92400e" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
              <linearGradient id="goldHolo" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width="420" height="220" fill="#1c1917" />

            <line x1="50" y1="30" x2="150" y2="160" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
            <line x1="50" y1="30" x2="80" y2="70" stroke="#0f172a" strokeWidth="12" strokeLinecap="round" />
            <text x="50" y="24" fill="#94a3b8" fontSize="8" fontWeight="800">
              그립부
            </text>

            <path
              d="M 140 150 L 195 130 Q 210 150 195 180 L 145 185 Z"
              fill="url(#woodGrad)"
              stroke="#b45309"
              strokeWidth="2"
            />
            <line x1="195" y1="130" x2="195" y2="180" stroke="#f59e0b" strokeWidth="4" />
            <text x="202" y="158" fill="#fbbf24" fontSize="8" fontWeight="900">
              로프트 0° (직각)
            </text>

            <g transform="translate(115, 120)">
              <circle cx="10" cy="10" r="12" fill="url(#goldHolo)" stroke="#ffffff" strokeWidth="1.5" />
              <text x="10" y="9" textAnchor="middle" fill="#713f12" fontSize="6" fontWeight="900">
                KPGA
              </text>
              <text x="10" y="15" textAnchor="middle" fill="#713f12" fontSize="5" fontWeight="900">
                공인합격
              </text>
            </g>
            <text x="125" y="148" textAnchor="middle" fill="#fde047" fontSize="8" fontWeight="900">
              ▲ 공인 검정 스티커
            </text>

            <rect x="235" y="20" width="170" height="180" rx="10" fill="#292524" stroke="#44403c" strokeWidth="1.5" />
            
            <text x="320" y="42" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="900">
              협회 공인 규격 기준
            </text>

            <g transform="translate(245, 55)">
              <rect x="0" y="0" width="150" height="26" rx="4" fill="#1c1917" />
              <text x="8" y="17" fill="#ffffff" fontSize="9" fontWeight="800">
                • 클럽 길이: <tspan fill="#4ade80">86cm 이하</tspan>
              </text>
            </g>

            <g transform="translate(245, 87)">
              <rect x="0" y="0" width="150" height="26" rx="4" fill="#1c1917" />
              <text x="8" y="17" fill="#ffffff" fontSize="9" fontWeight="800">
                • 클럽 무게: <tspan fill="#4ade80">600g 이하</tspan>
              </text>
            </g>

            <g transform="translate(245, 119)">
              <rect x="0" y="0" width="150" height="26" rx="4" fill="#1c1917" />
              <text x="8" y="17" fill="#ffffff" fontSize="9" fontWeight="800">
                • 공 규격: <tspan fill="#4ade80">직경 6cm (80~95g)</tspan>
              </text>
            </g>

            <rect x="245" y="155" width="150" height="32" rx="6" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
            <text x="320" y="170" textAnchor="middle" fill="#fecaca" fontSize="9" fontWeight="900">
              미인증 용구 사용 시
            </text>
            <text x="320" y="182" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
              대회 즉시 【실격 (DQ)】
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // [ch-2-2] 티 높이는 지면에서 딱 2.3cm 이하!
  if (key === 'ch-2-2') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>📏</span>
            <span>제13조 공인 고무티 높이 기준</span>
          </div>
          <span className="text-[10px] font-black bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full">
            티 높이 2.3cm (23mm) 이하
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <rect x="0" y="150" width="420" height="70" fill="#15803d" />
            <line x1="0" y1="150" x2="420" y2="150" stroke="#86efac" strokeWidth="3" />
            <text x="30" y="170" fill="#dcfce7" fontSize="9" fontWeight="800">
              지면 (티매트 표면 레벨)
            </text>

            <g transform="translate(100, 70)">
              <ellipse cx="40" cy="80" rx="22" ry="6" fill="#334155" />
              <path d="M 33 80 L 37 40 L 43 40 L 47 80 Z" fill="#475569" stroke="#64748b" strokeWidth="1" />
              <ellipse cx="40" cy="40" rx="9" ry="3" fill="#cbd5e1" />
              <circle cx="40" cy="20" r="20" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
              <circle cx="45" cy="14" r="3" fill="#fdba74" opacity="0.8" />

              <line x1="72" y1="80" x2="72" y2="40" stroke="#22c55e" strokeWidth="2" />
              <polygon points="72,40 68,46 76,46" fill="#22c55e" />
              <polygon points="72,80 68,74 76,74" fill="#22c55e" />
              <text x="80" y="63" fill="#4ade80" fontSize="11" fontWeight="900">
                ≤ 2.3cm
              </text>

              <rect x="15" y="95" width="50" height="18" rx="4" fill="#065f46" stroke="#34d399" strokeWidth="1" />
              <text x="40" y="108" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                ✓ 합격 (OK)
              </text>
            </g>

            <g transform="translate(260, 40)">
              <ellipse cx="40" cy="110" rx="22" ry="6" fill="#334155" />
              <path d="M 33 110 L 37 40 L 43 40 L 47 110 Z" fill="#78350f" stroke="#b45309" strokeWidth="1" />
              <ellipse cx="40" cy="40" rx="9" ry="3" fill="#fde68a" />
              <circle cx="40" cy="20" r="20" fill="#f97316" stroke="#ffffff" strokeWidth="2" />

              <line x1="72" y1="110" x2="72" y2="40" stroke="#ef4444" strokeWidth="2" />
              <polygon points="72,40 68,46 76,46" fill="#ef4444" />
              <polygon points="72,110 68,104 76,104" fill="#ef4444" />
              <text x="80" y="78" fill="#f87171" fontSize="11" fontWeight="900">
                초과 (롱티)
              </text>

              <rect x="10" y="125" width="60" height="18" rx="4" fill="#7f1d1d" stroke="#f87171" strokeWidth="1" />
              <text x="40" y="138" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                ✕ 2벌타 위반!
              </text>
            </g>

            <rect x="40" y="12" width="340" height="22" rx="6" fill="#0f172a" fillOpacity="0.9" stroke="#334155" strokeWidth="1" />
            <text x="210" y="27" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="900">
              규격 23mm 초과 개인 롱티 사용 시 제13조 위반으로 2벌타 부과
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // ==========================================
  // 제3장 티샷과 스트로크 일반
  // ==========================================

  // [ch-3-1] 헛스윙했는데 공을 안 맞췄어요. 타수인가요?
  if (key === 'ch-3-1') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>💨</span>
            <span>제30조 스트로크 정의 (헛스윙 타수 판정)</span>
          </div>
          <span className="text-[10px] font-black bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full">
            다운스윙 개시 = 1타 가산
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <rect x="0" y="160" width="420" height="60" fill="#14532d" />

            <path
              d="M 100 40 Q 200 10 240 145"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="4"
              strokeDasharray="8 4"
            />
            <path d="M 230 110 Q 255 135 245 155" fill="none" stroke="#e0f2fe" strokeWidth="2.5" opacity="0.8" />
            <path d="M 220 120 Q 245 145 235 160" fill="none" stroke="#e0f2fe" strokeWidth="1.5" opacity="0.5" />

            <ellipse cx="270" cy="160" rx="10" ry="4" fill="#334155" />
            <line x1="270" y1="160" x2="270" y2="140" stroke="#64748b" strokeWidth="4" />
            <circle cx="270" cy="125" r="16" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            <text x="270" y="100" textAnchor="middle" fill="#fdba74" fontSize="9" fontWeight="900">
              공 미접촉 (그대로 정지)
            </text>

            <g transform="translate(225, 130) rotate(25)">
              <rect x="0" y="0" width="26" height="14" rx="2" fill="#78350f" stroke="#f59e0b" strokeWidth="1" />
              <line x1="5" y1="0" x2="-40" y2="-60" stroke="#94a3b8" strokeWidth="5" />
            </g>

            <rect x="20" y="30" width="160" height="110" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="100" y="50" textAnchor="middle" fill="#60a5fa" fontSize="10" fontWeight="900">
              타격 의사 판정 기준
            </text>
            <text x="30" y="70" fill="#e2e8f0" fontSize="8" fontWeight="800">
              • 다운스윙 개시: <tspan fill="#f59e0b">스트로크 1타 인정</tspan>
            </text>
            <text x="30" y="88" fill="#e2e8f0" fontSize="8" fontWeight="800">
              • 벌타 여부: <tspan fill="#4ade80">벌타 없음 (무벌)</tspan>
            </text>
            <text x="30" y="106" fill="#e2e8f0" fontSize="8" fontWeight="800">
              • 다음 샷: <tspan fill="#fbbf24">제2타째가 됨</tspan>
            </text>
            <text x="30" y="124" fill="#94a3b8" fontSize="7" fontWeight="700">
              ※ 연습스윙/어드레스 취소는 0타
            </text>

            <rect x="60" y="180" width="300" height="24" rx="12" fill="#854d0e" stroke="#facc15" strokeWidth="1" />
            <text x="210" y="196" textAnchor="middle" fill="#fef08a" fontSize="10" fontWeight="900">
              공을 못 맞혀도 타격 의사가 있었다면 정상 1타로 계산!
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // [ch-3-2] 티샷할 때 두 발이 매트 밖 맨땅으로 나가면?
  if (key === 'ch-3-2') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>👟</span>
            <span>제31조 티매트 스탠스 수칙 (발 위치 규정)</span>
          </div>
          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
            양 발 모두 이탈 = 2벌타
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <rect x="0" y="0" width="420" height="220" fill="#334155" />
            <text x="210" y="24" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="800">
              매트 외곽 맨땅 (일반 지면 구역)
            </text>

            <g transform="translate(30, 40)">
              <rect x="0" y="0" width="165" height="150" rx="8" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
              <rect x="0" y="0" width="165" height="26" rx="8" fill="#065f46" />
              <text x="82" y="17" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="900">
                [적법] 한 발 매트 접촉: OK
              </text>

              <rect x="15" y="40" width="85" height="95" rx="4" fill="#15803d" stroke="#4ade80" strokeWidth="1.5" />
              <text x="57" y="55" textAnchor="middle" fill="#dcfce7" fontSize="7" fontWeight="900">
                티매트
              </text>

              <rect x="40" y="70" width="14" height="28" rx="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
              <rect x="115" y="70" width="14" height="28" rx="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />

              <text x="82" y="125" textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="900">
                한 발의 일부라도 닿으면 무벌!
              </text>
            </g>

            <g transform="translate(225, 40)">
              <rect x="0" y="0" width="165" height="150" rx="8" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
              <rect x="0" y="0" width="165" height="26" rx="8" fill="#991b1b" />
              <text x="82" y="17" textAnchor="middle" fill="#fecaca" fontSize="10" fontWeight="900">
                [위반] 양 발 매트 완전 이탈
              </text>

              <rect x="15" y="40" width="60" height="95" rx="4" fill="#15803d" stroke="#4ade80" strokeWidth="1.5" />
              <text x="45" y="55" textAnchor="middle" fill="#dcfce7" fontSize="7" fontWeight="900">
                티매트
              </text>

              <rect x="95" y="70" width="14" height="28" rx="4" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />
              <rect x="125" y="70" width="14" height="28" rx="4" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />

              <text x="82" y="125" textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="900">
                두 발 모두 나가면 2벌타!
              </text>
            </g>
          </svg>
        </div>
      </div>
    );
  }

  // ==========================================
  // 제4장 OB (아웃오브바운즈) 완전정복
  // ==========================================

  // [ch-4-1] 1mm의 기적! 하얀 선에 살짝 걸친 공
  if (key === 'ch-4-1') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>📐</span>
            <span>제33조 1항 1mm 접촉 세이프 판정 정밀도</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            1mm라도 닿으면 무벌 세이프!
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <defs>
              <pattern id="obHatchCh4" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#7f1d1d" strokeWidth="2.5" />
                <rect width="12" height="12" fill="#450a0a" fillOpacity="0.4" />
              </pattern>
            </defs>

            <rect x="0" y="0" width="180" height="220" fill="#15803d" />
            <text x="90" y="24" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">
              코스 안쪽 (인플레이)
            </text>

            <rect x="180" y="0" width="30" height="220" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <text x="195" y="115" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="900" transform="rotate(-90 195 115)">
              OB 백색 실선
            </text>

            <rect x="210" y="0" width="210" height="220" fill="url(#obHatchCh4)" />
            <text x="315" y="24" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="900">
              OB 구역 (코스 밖)
            </text>

            <circle cx="205" cy="115" r="26" fill="#f97316" stroke="#ffffff" strokeWidth="2.5" />
            <ellipse cx="187" cy="115" rx="3" ry="8" fill="#fbbf24" />

            <path d="M 188 115 L 120 70" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
            <rect x="35" y="45" width="120" height="38" rx="6" fill="#0f172a" fillOpacity="0.95" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="95" y="60" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="900">
              1mm 접촉 확인!
            </text>
            <text x="95" y="74" textAnchor="middle" fill="#4ade80" fontSize="10" fontWeight="900">
              ✓ 무벌 세이프 (IN)
            </text>

            <circle cx="280" cy="115" r="26" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
            <text x="280" y="160" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="900">
              ✕ 완전 이탈 = 2벌타 OB
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // [ch-4-2] 외곽망/나무 맞고 코스 안으로 쏙
  if (key === 'ch-4-2') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🔄</span>
            <span>제33조 2항 최종 정지 위치 기준 원칙</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            최종 멈춘 곳이 안쪽이면 세이프!
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <rect x="0" y="0" width="280" height="220" fill="#15803d" />
            <rect x="280" y="0" width="140" height="220" fill="#1c1917" />

            <line x1="280" y1="0" x2="280" y2="220" stroke="#ffffff" strokeWidth="3" strokeDasharray="4 3" />
            <text x="290" y="25" fill="#fde047" fontSize="8" fontWeight="800">
              외곽 안전망
            </text>

            <g transform="translate(340, 60)">
              <rect x="16" y="40" width="12" height="30" fill="#78350f" />
              <circle cx="22" cy="30" r="28" fill="#166534" />
              <circle cx="15" cy="20" r="18" fill="#15803d" />
            </g>

            <path
              d="M 60 180 Q 230 40 330 80"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2.5"
              strokeDasharray="5 3"
            />
            <path
              d="M 330 80 Q 300 130 180 150"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
            />

            <polygon points="330,70 334,78 342,80 335,85 336,93 329,88 322,92 324,84 318,79 326,78" fill="#ef4444" />
            <text x="350" y="105" textAnchor="middle" fill="#fca5a5" fontSize="8" fontWeight="900">
              망/나무 맞고 리바운드!
            </text>

            <circle cx="180" cy="150" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            <text x="180" y="180" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
              최종 정지: 코스 안!
            </text>

            <rect x="30" y="25" width="200" height="42" rx="6" fill="#0f172a" fillOpacity="0.9" stroke="#10b981" strokeWidth="1.5" />
            <text x="130" y="42" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="900">
              공이 잠시 밖으로 나갔더라도
            </text>
            <text x="130" y="56" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">
              최종 안쪽에 멈추면 【무벌 세이프】
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // [ch-4-3] OB 처치 (무조건 2벌타, 2클럽 안쪽)
  if (key === 'ch-4-3') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>⛳</span>
            <span>제33조 3항 2벌타 가산 및 2클럽 처치</span>
          </div>
          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
            무조건 2벌타 (1벌타 없음)
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <rect x="0" y="0" width="250" height="220" fill="#15803d" />
            <rect x="250" y="0" width="170" height="220" fill="#450a0a" />

            <line x1="250" y1="0" x2="250" y2="220" stroke="#ffffff" strokeWidth="4" />
            <text x="320" y="30" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="900">
              OB 구역
            </text>
            <text x="120" y="30" textAnchor="middle" fill="#dcfce7" fontSize="11" fontWeight="900">
              코스 인플레이 구역
            </text>

            <circle cx="250" cy="110" r="7" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
            <text x="280" y="114" fill="#fca5a5" fontSize="9" fontWeight="900">
              OB 통과 지점 (기준점)
            </text>

            <path
              d="M 250 50 A 60 60 0 0 0 250 170 Z"
              fill="#22c55e"
              fillOpacity="0.3"
              stroke="#86efac"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <text x="210" y="115" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
              2클럽 이내
            </text>

            <circle cx="205" cy="110" r="12" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            <text x="205" y="140" textAnchor="middle" fill="#fde047" fontSize="9" fontWeight="900">
              새 볼 안착
            </text>

            <line x1="120" y1="185" x2="50" y2="185" stroke="#fcd34d" strokeWidth="2.5" />
            <polygon points="45,185 55,180 55,190" fill="#fcd34d" />
            <text x="85" y="175" textAnchor="middle" fill="#fcd34d" fontSize="8" fontWeight="800">
              홀컵 방향 (가깝지 않게)
            </text>

            <rect x="20" y="60" width="130" height="55" rx="6" fill="#0f172a" fillOpacity="0.9" stroke="#ef4444" strokeWidth="1.5" />
            <text x="85" y="80" textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="900">
              티샷 OB 발생 시
            </text>
            <text x="85" y="98" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">
              다음 샷 = 【제4타】
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // ==========================================
  // 제5장 워터 해저드와 무벌 구제
  // ==========================================

  // [ch-5-1] 워터 해저드 2벌타
  if (key === 'ch-5-1') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>💧</span>
            <span>제34조 워터 해저드 침수 시 2벌타 처치</span>
          </div>
          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
            2벌타 후 2클럽 이내 처치
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <rect x="0" y="0" width="420" height="220" fill="#15803d" />

            <ellipse cx="290" cy="110" rx="90" ry="65" fill="#0284c7" stroke="#38bdf8" strokeWidth="3" />
            <ellipse cx="290" cy="110" rx="75" ry="50" fill="#0369a1" />

            <circle cx="290" cy="110" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
            <text x="290" y="140" textAnchor="middle" fill="#e0f2fe" fontSize="10" fontWeight="900">
              수중 침수 (플레이 불가)
            </text>

            <circle cx="200" cy="110" r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
            <text x="185" y="90" textAnchor="middle" fill="#fecaca" fontSize="9" fontWeight="900">
              최종 진입점
            </text>

            <ellipse cx="140" cy="110" rx="45" ry="35" fill="#22c55e" fillOpacity="0.4" stroke="#4ade80" strokeWidth="2" strokeDasharray="4 3" />
            <circle cx="140" cy="110" r="12" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            <text x="140" y="138" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
              2클럽 이내 재개
            </text>

            <rect x="20" y="25" width="130" height="60" rx="6" fill="#0f172a" fillOpacity="0.95" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="85" y="44" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="900">
              워터 해저드 규칙
            </text>
            <text x="85" y="60" textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="900">
              • 2벌타 가산 부과
            </text>
            <text x="85" y="74" textAnchor="middle" fill="#e2e8f0" fontSize="8" fontWeight="800">
              • 진입점 기준 2클럽 안착
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // [ch-5-2] 배수구 쇠창살, 카트 도로는 1클럽 무벌 구제!
  if (key === 'ch-5-2') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🛡️</span>
            <span>제35조 인공 장해물 접촉 시 1클럽 무벌 구제</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            무벌 1클럽 완전 구제
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <rect x="0" y="0" width="420" height="220" fill="#15803d" />

            <rect x="180" y="50" width="180" height="120" rx="4" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
            {[70, 90, 110, 130, 150].map((x) => (
              <line key={x} x1={x + 120} y1="50" x2={x + 120} y2="170" stroke="#1e293b" strokeWidth="4" />
            ))}
            <text x="270" y="75" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="900">
              배수구 철망 / 카트 도로
            </text>

            <circle cx="240" cy="110" r="14" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
            <text x="240" y="140" textAnchor="middle" fill="#fecaca" fontSize="8" fontWeight="800">
              장해물 위 정지 (타격 위험)
            </text>

            <path
              d="M 180 110 L 100 110"
              stroke="#22c55e"
              strokeWidth="3"
              strokeDasharray="4 3"
            />
            <circle cx="95" cy="110" r="14" fill="#22c55e" stroke="#ffffff" strokeWidth="2" />
            <text x="95" y="140" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
              무벌 1클럽 구제 지점
            </text>

            <rect x="30" y="25" width="130" height="46" rx="6" fill="#0f172a" fillOpacity="0.95" stroke="#10b981" strokeWidth="1.5" />
            <text x="95" y="44" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="900">
              움직일 수 없는 장해물
            </text>
            <text x="95" y="60" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
              【벌타 없음 (무벌)】
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // ==========================================
  // 제6장 그린과 퍼팅 규정
  // ==========================================

  // [ch-6-1] 깃대를 뽑고 퍼팅하면 2벌타?!
  if (key === 'ch-6-1') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🚩</span>
            <span>제37조 1항 깃대 발거 금지 절대 수칙</span>
          </div>
          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
            깃대 뽑고 치면 2벌타!
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <rect x="0" y="0" width="420" height="220" fill="#15803d" />
            <ellipse cx="210" cy="150" rx="180" ry="60" fill="#16a34a" />

            {/* Left: Correct Play (Flagstick IN cup) */}
            <g transform="translate(60, 40)">
              <ellipse cx="60" cy="110" rx="20" ry="8" fill="#0f172a" />
              <line x1="60" y1="110" x2="60" y2="20" stroke="#ffffff" strokeWidth="4" />
              <polygon points="60,20 25,30 60,40" fill="#ef4444" />

              <rect x="15" y="130" width="90" height="24" rx="6" fill="#065f46" stroke="#34d399" strokeWidth="1.5" />
              <text x="60" y="146" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                ✓ 깃대 꽂고 퍼팅 (정상)
              </text>
            </g>

            {/* Right: Violation (Flagstick PULLED out on ground) */}
            <g transform="translate(250, 40)">
              <ellipse cx="60" cy="110" rx="20" ry="8" fill="#0f172a" stroke="#f87171" strokeWidth="2" />

              <line x1="20" y1="130" x2="110" y2="115" stroke="#ffffff" strokeWidth="3" />
              <polygon points="110,115 95,100 120,105" fill="#ef4444" />

              <line x1="45" y1="50" x2="75" y2="80" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
              <line x1="75" y1="50" x2="45" y2="80" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />

              <rect x="15" y="140" width="90" height="24" rx="6" fill="#7f1d1d" stroke="#f87171" strokeWidth="1.5" />
              <text x="60" y="156" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                ✕ 깃대 뽑음: 2벌타!
              </text>
            </g>

            <rect x="50" y="12" width="320" height="22" rx="6" fill="#0f172a" fillOpacity="0.9" stroke="#334155" strokeWidth="1" />
            <text x="210" y="27" textAnchor="middle" fill="#facc15" fontSize="9" fontWeight="900">
              일반 골프와 다름! 파크골프는 깃대를 절대 뽑을 수 없습니다.
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // [ch-6-2] 공이 깃대와 컵 테두리 사이에 끼었을 때
  if (key === 'ch-6-2') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🕳️</span>
            <span>제37조 3항 컵 림(Rim) 걸침 및 깃대 흔들기 규정</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            바닥에 떨어지면 홀인 인정!
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <rect x="0" y="90" width="160" height="130" fill="#15803d" />
            <rect x="260" y="90" width="160" height="130" fill="#15803d" />

            <rect x="160" y="90" width="100" height="100" fill="#0f172a" />
            <line x1="160" y1="190" x2="260" y2="190" stroke="#334155" strokeWidth="3" />
            <text x="210" y="180" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="800">
              홀컵 바닥
            </text>

            <line x1="210" y1="190" x2="210" y2="20" stroke="#ffffff" strokeWidth="6" />

            <circle cx="186" cy="100" r="16" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            <text x="135" y="70" textAnchor="middle" fill="#fde047" fontSize="9" fontWeight="900">
              테두리와 깃대 사이에 낌!
            </text>

            <path d="M 220 50 Q 230 45 220 40" fill="none" stroke="#38bdf8" strokeWidth="2" />
            <text x="245" y="48" fill="#38bdf8" fontSize="8" fontWeight="900">
              깃대 살짝 흔들기
            </text>

            <line x1="186" y1="120" x2="195" y2="165" stroke="#4ade80" strokeWidth="3" strokeDasharray="3 3" />
            <polygon points="195,168 190,160 200,160" fill="#4ade80" />

            <rect x="275" y="30" width="130" height="70" rx="6" fill="#0f172a" fillOpacity="0.95" stroke="#10b981" strokeWidth="1.5" />
            <text x="340" y="50" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="900">
              동반자 입회 하에
            </text>
            <text x="340" y="66" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">
              깃대를 가볍게 움직여
            </text>
            <text x="340" y="82" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="900">
              바닥 안착 시 【홀인 인정】
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // ==========================================
  // 제7장 공 충돌과 벌타 총람
  // ==========================================

  // [ch-7-1] 내 공이 동반자의 정지된 공 충돌
  if (key === 'ch-7-1') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>💥</span>
            <span>제36조 1항 동반자 정지 공 충돌 판정</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            친 사람 무벌 / 맞은 공 원위치
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <rect x="0" y="0" width="420" height="220" fill="#15803d" />

            <line x1="40" y1="110" x2="190" y2="110" stroke="#fbbf24" strokeWidth="3" strokeDasharray="5 3" />
            
            <g transform="translate(195, 110)">
              <circle cx="0" cy="0" r="16" fill="#ef4444" opacity="0.4" />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
                쿵!
              </text>
            </g>

            <circle cx="205" cy="110" r="14" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
            <text x="205" y="85" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="800">
              맞기 전 원래 자리
            </text>

            <path d="M 310 95 Q 260 70 215 95" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
            <text x="260" y="65" textAnchor="middle" fill="#67e8f9" fontSize="8" fontWeight="900">
              원위치로 리플레이스!
            </text>

            <circle cx="320" cy="110" r="14" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
            <text x="320" y="135" textAnchor="middle" fill="#bfdbfe" fontSize="8" fontWeight="800">
              동반자 공
            </text>

            <circle cx="180" cy="155" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            <text x="180" y="185" textAnchor="middle" fill="#fed7aa" fontSize="9" fontWeight="900">
              친 사람 공 (멈춘 곳에서 무벌 플레이)
            </text>

            <rect x="50" y="15" width="320" height="28" rx="6" fill="#0f172a" fillOpacity="0.95" stroke="#10b981" strokeWidth="1.5" />
            <text x="210" y="33" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900">
              친 사람은 【벌타 없음(무벌)】 · 튕겨나간 동반자 공은 【원위치 복원】
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // [ch-7-2] 남의 공 친 오구 플레이 (2벌타)
  if (key === 'ch-7-2') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>❌</span>
            <span>제36조 2항 오구(남의 공) 타격 시 2벌타 부과</span>
          </div>
          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
            오구 플레이 = 2벌타
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <rect x="0" y="0" width="420" height="220" fill="#1e293b" />

            <rect x="30" y="30" width="160" height="150" rx="8" fill="#292524" stroke="#ef4444" strokeWidth="2" />
            <rect x="30" y="30" width="160" height="26" rx="8" fill="#7f1d1d" />
            <text x="110" y="47" textAnchor="middle" fill="#fecaca" fontSize="10" fontWeight="900">
              잘못 친 동반자 공
            </text>

            <circle cx="110" cy="100" r="18" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
            <text x="110" y="104" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
              남의 공
            </text>
            <text x="110" y="140" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="900">
              2벌타 가산!
            </text>
            <text x="110" y="160" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="800">
              (친 공은 즉시 원위치 복원)
            </text>

            <rect x="230" y="30" width="160" height="150" rx="8" fill="#14532d" stroke="#10b981" strokeWidth="2" />
            <rect x="230" y="30" width="160" height="26" rx="8" fill="#065f46" />
            <text x="310" y="47" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="900">
              플레이어 본인의 진짜 공
            </text>

            <circle cx="310" cy="100" r="18" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            <text x="310" y="104" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
              본인 공
            </text>
            <text x="310" y="140" textAnchor="middle" fill="#4ade80" fontSize="11" fontWeight="900">
              원래 자리에서 재개!
            </text>
            <text x="310" y="160" textAnchor="middle" fill="#dcfce7" fontSize="8" fontWeight="800">
              (2벌타 포함 타수 계산)
            </text>

            <line x1="190" y1="105" x2="230" y2="105" stroke="#f59e0b" strokeWidth="3" strokeDasharray="3 3" />
          </svg>
        </div>
      </div>
    );
  }

  // ==========================================
  // 제8장 스코어 기록과 경기 매너
  // ==========================================

  // [ch-8-1] 파크골프 컨시드(OK) 절대 불가
  if (key === 'ch-8-1') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🚫</span>
            <span>제45조 컨시드(OK) 불인정 및 미홀아웃 시 실격</span>
          </div>
          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
            컨시드 절대 금지 (위반 시 실격)
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <rect x="0" y="0" width="420" height="220" fill="#15803d" />

            <ellipse cx="210" cy="120" rx="35" ry="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <line x1="210" y1="120" x2="210" y2="30" stroke="#ffffff" strokeWidth="4" />
            <polygon points="210,30 180,40 210,50" fill="#ef4444" />

            <circle cx="150" cy="120" r="15" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            <line x1="165" y1="120" x2="175" y2="120" stroke="#fbbf24" strokeWidth="2" strokeDasharray="2 2" />
            <text x="170" y="110" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="800">
              10cm 거리
            </text>

            <rect x="30" y="30" width="105" height="45" rx="6" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
            <text x="82" y="48" textAnchor="middle" fill="#fecaca" fontSize="9" fontWeight="900">
              "OK 줄게 집어!"
            </text>
            <text x="82" y="64" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">
              ✕ 절대 불가!
            </text>

            <g transform="translate(290, 100) rotate(12)">
              <rect x="-60" y="-20" width="120" height="40" rx="6" fill="#991b1b" stroke="#fecaca" strokeWidth="2" />
              <text x="0" y="-3" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">
                다음 홀 티샷 시
              </text>
              <text x="0" y="13" textAnchor="middle" fill="#fef08a" fontSize="13" fontWeight="900">
                【실격 (DQ)】
              </text>
            </g>

            <rect x="50" y="175" width="320" height="26" rx="13" fill="#065f46" stroke="#10b981" strokeWidth="1.5" />
            <text x="210" y="192" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="900">
              아무리 짧아도 컵 바닥에 땡그랑 떨어질 때까지 퍼팅해야 정규 인정!
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // [ch-8-2] 앞 조 이동 전 타격 금지 (안전 에티켓)
  if (key === 'ch-8-2') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>⚠️</span>
            <span>제50조 경기 안전 수칙 및 전방 거리 확보 의무</span>
          </div>
          <span className="text-[10px] font-black bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full">
            안전거리 미확보 시 2벌타
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 420 220" className="w-full h-full">
            <rect x="0" y="0" width="420" height="220" fill="#14532d" />
            <path d="M 0 110 Q 210 80 420 110" stroke="#16a34a" strokeWidth="80" fill="none" />

            <g transform="translate(30, 80)">
              <rect x="0" y="0" width="40" height="40" rx="6" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
              <text x="20" y="24" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                뒷 조
              </text>
            </g>

            <line x1="75" y1="100" x2="270" y2="100" stroke="#ef4444" strokeWidth="3" strokeDasharray="6 4" />

            <ellipse cx="300" cy="100" rx="55" ry="30" fill="#ef4444" fillOpacity="0.25" stroke="#f87171" strokeWidth="2" strokeDasharray="4 3" />
            
            <g transform="translate(290, 80)">
              <circle cx="10" cy="10" r="8" fill="#3b82f6" />
              <line x1="10" y1="18" x2="10" y2="35" stroke="#3b82f6" strokeWidth="3" />
              <circle cx="25" cy="12" r="8" fill="#3b82f6" />
              <line x1="25" y1="20" x2="25" y2="35" stroke="#3b82f6" strokeWidth="3" />
            </g>
            <text x="300" y="145" textAnchor="middle" fill="#fca5a5" fontSize="9" fontWeight="900">
              앞 조 경기 진행 중 (위험!)
            </text>

            <rect x="110" y="30" width="130" height="35" rx="6" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
            <text x="175" y="47" textAnchor="middle" fill="#fecaca" fontSize="9" fontWeight="900">
              앞 조 이동 전 티샷 금지!
            </text>
            <text x="175" y="59" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">
              위반 시 【2벌타 또는 실격】
            </text>

            <rect x="40" y="175" width="340" height="24" rx="6" fill="#0f172a" fillOpacity="0.9" stroke="#334155" strokeWidth="1" />
            <text x="210" y="191" textAnchor="middle" fill="#fcd34d" fontSize="9" fontWeight="900">
              앞 조가 완전히 홀아웃하여 다음 홀 안전지대로 이동한 후 타격해야 합니다.
            </text>
          </svg>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-4 text-white text-center">
      <p className="text-xs text-amber-300 font-bold">공식 룰 규정 정밀 도해 준비 중</p>
    </div>
  );
}
