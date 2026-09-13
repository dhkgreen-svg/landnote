'use client';

import React from 'react';
import { TeeSwingDiagrams } from './rule-diagrams/TeeSwingDiagrams';
import { PuttingGreenDiagrams } from './rule-diagrams/PuttingGreenDiagrams';
import { HazardReliefDiagrams } from './rule-diagrams/HazardReliefDiagrams';
import { TouchPenaltyDiagrams } from './rule-diagrams/TouchPenaltyDiagrams';
import { ScoreMannerDiagrams } from './rule-diagrams/ScoreMannerDiagrams';

interface RuleSituationDiagramProps {
  ruleId: string;
  category: string;
}

export function RuleSituationDiagram({ ruleId, category }: RuleSituationDiagramProps) {
  // [1] ob-1: 공이 OB 흰 선에 살짝 걸쳤을 때 (1mm 선상 접촉 시 무벌 세이프)
  if (ruleId === 'ob-1') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>📐</span>
            <span>공인 규정 제33조 1항 정밀 단면도</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            1mm라도 선에 닿으면 세이프!
          </span>
        </div>

        {/* SVG Diagram: Top-Down / Cross-Section */}
        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <defs>
              <linearGradient id="grassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
              <pattern id="obHatch" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#7f1d1d" strokeWidth="2.5" />
                <rect width="12" height="12" fill="#450a0a" fillOpacity="0.4" />
              </pattern>
              <radialGradient id="parkBallGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fed7aa" />
                <stop offset="40%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#c2410c" />
              </radialGradient>
              <radialGradient id="outBallGrad" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fca5a5" />
                <stop offset="40%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#991b1b" />
              </radialGradient>
            </defs>

            {/* Left Zone: Course Fairway / Rough (In-Play) */}
            <rect x="0" y="0" width="170" height="220" fill="url(#grassGrad)" />
            <text x="85" y="24" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" opacity="0.95">
              코스 안쪽 (인플레이 구역)
            </text>

            {/* Middle: OB White Boundary Line */}
            <rect x="170" y="0" width="30" height="220" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
            <text x="185" y="115" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="900" transform="rotate(-90 185 115)">
              OB 백색 실선
            </text>

            {/* Right Zone: Out of Bounds (OB) */}
            <rect x="200" y="0" width="200" height="220" fill="url(#obHatch)" />
            <text x="300" y="24" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="900">
              OB 구역 (코스 밖)
            </text>

            {/* Case A: Safe Ball touching the line by 1mm */}
            <g transform="translate(155, 95)">
              <ellipse cx="22" cy="24" rx="20" ry="10" fill="#000000" opacity="0.4" />
              <circle cx="20" cy="18" r="22" fill="url(#parkBallGrad)" stroke="#ea580c" strokeWidth="1.5" />
              <circle cx="15" cy="12" r="1.5" fill="#ffffff" opacity="0.6" />
              <circle cx="22" cy="10" r="1.5" fill="#ffffff" opacity="0.6" />
              <circle cx="26" cy="16" r="1.5" fill="#ffffff" opacity="0.6" />
              <circle cx="18" cy="20" r="1.5" fill="#ffffff" opacity="0.6" />
            </g>

            {/* Magnifier / Contact indicator on Case A */}
            <circle cx="173" cy="113" r="14" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="3,2" />
            <path d="M 173 99 L 173 70 L 140 70" fill="none" stroke="#fbbf24" strokeWidth="2" />
            <rect x="40" y="56" width="105" height="26" rx="6" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
            <text x="92" y="73" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">
              1mm 접촉 = 세이프!
            </text>

            {/* Result Badge A: SAFE */}
            <rect x="70" y="170" width="120" height="34" rx="10" fill="#059669" stroke="#6ee7b7" strokeWidth="2" />
            <text x="130" y="192" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">
              ✔ 무벌 세이프 (IN)
            </text>

            {/* Case B: Ball completely out */}
            <g transform="translate(260, 105)">
              <ellipse cx="16" cy="20" rx="16" ry="8" fill="#000000" opacity="0.4" />
              <circle cx="15" cy="15" r="17" fill="url(#outBallGrad)" stroke="#b91c1c" strokeWidth="1.5" />
            </g>
            <path d="M 235 120 L 255 120" stroke="#f87171" strokeWidth="1.5" strokeDasharray="2,2" />
            <rect x="250" y="170" width="110" height="34" rx="10" fill="#b91c1c" stroke="#fca5a5" strokeWidth="2" />
            <text x="305" y="192" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900">
              ✖ OB (2벌타)
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>💡 판정 요약:</span>
            <span>공 전체가 흰 선을 완전히 넘어가야만 OB입니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            공의 단 1mm라도 백색 실선(또는 말뚝 내측 가상선)에 닿아 있거나 선 위에 걸쳐 있다면 무벌타 세이프(인플레이)이므로 그대로 플레이합니다.
          </p>
        </div>
      </div>
    );
  }

  // [2] ob-2: OB 발생 시 2벌타 및 2클럽 헤드 처치 절차
  if (ruleId === 'ob-2') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>⛳</span>
            <span>OB 처치 2클럽 헤드 설치 다이어그램</span>
          </div>
          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
            무조건 2벌타 가산
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="280" height="220" fill="#15803d" />
            <g transform="translate(60, 40)">
              <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
              <line x1="0" y1="0" x2="0" y2="-28" stroke="#ffffff" strokeWidth="3" />
              <polygon points="0,-28 20,-20 0,-12" fill="#ef4444" />
              <text x="25" y="-18" fill="#ffffff" fontSize="10" fontWeight="900">홀컵 방향</text>
            </g>

            <line x1="280" y1="0" x2="280" y2="220" stroke="#ffffff" strokeWidth="6" />
            <rect x="283" y="0" width="117" height="220" fill="#3f0e0e" opacity="0.6" />
            <text x="340" y="110" fill="#f87171" fontSize="11" fontWeight="900" textAnchor="middle">OB 구역</text>

            <rect x="277" y="30" width="6" height="20" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
            <rect x="277" y="110" width="6" height="20" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
            <rect x="277" y="190" width="6" height="20" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />

            <circle cx="280" cy="120" r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
            <text x="270" y="145" fill="#fef08a" fontSize="10" fontWeight="900" textAnchor="end">
              나간 지점 (기준점)
            </text>

            <path d="M 280 60 A 60 60 0 0 0 280 180 Z" fill="#22c55e" fillOpacity="0.3" stroke="#4ade80" strokeWidth="2" strokeDasharray="4,2" />

            <line x1="280" y1="120" x2="220" y2="120" stroke="#fbbf24" strokeWidth="4" />
            <rect x="215" y="114" width="10" height="12" rx="2" fill="#d97706" />
            <text x="245" y="112" fill="#fef08a" fontSize="10" fontWeight="900" textAnchor="middle">
              2클럽 이내
            </text>

            <circle cx="230" cy="140" r="12" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            <text x="230" y="168" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
              새 공 안착 지점
            </text>

            <path d="M 230 110 L 120 60" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3,3" />
            <text x="180" y="75" fill="#fca5a5" fontSize="9" fontWeight="800">
              ※ 홀컵에 가깝지 않게!
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-amber-300 font-extrabold flex items-center gap-1">
            <span>📌 처치 핵심:</span>
            <span>티박스로 돌아가지 않습니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            공이 OB 라인을 통과한 기준점에서 홀컵에 가깝지 않게 코스 안쪽으로 2클럽 이내에 공을 놓고 다음 타를 진행합니다.
          </p>
        </div>
      </div>
    );
  }

  // [3] ob-3: 그물망 / 수목 맞고 다시 코스 안으로 들어온 공
  if (ruleId === 'ob-3') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🛡️</span>
            <span>그물망 리바운드 판정 다이어그램</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            최종 정지 위치 기준
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="230" height="220" fill="#15803d" />
            <text x="115" y="30" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">
              코스 안 (인플레이 구역)
            </text>

            <line x1="230" y1="0" x2="230" y2="220" stroke="#ffffff" strokeWidth="5" />
            <rect x="233" y="0" width="167" height="220" fill="#450a0a" opacity="0.5" />

            <line x1="320" y1="0" x2="320" y2="220" stroke="#38bdf8" strokeWidth="4" />
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={i} x1="310" y1={i * 20} x2="330" y2={i * 20} stroke="#38bdf8" strokeWidth="1.5" />
            ))}
            <text x="355" y="110" fill="#38bdf8" fontSize="10" fontWeight="900">외곽 안전망</text>

            <path d="M 120 160 Q 230 110 320 100 Q 280 80 180 90" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="5,3" />

            <circle cx="320" cy="100" r="14" fill="#ef4444" opacity="0.8" />
            <text x="320" y="104" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">탕!</text>

            <circle cx="180" cy="90" r="12" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            <text x="180" y="125" fill="#fef08a" fontSize="11" fontWeight="900" textAnchor="middle">
              ★ 최종 정지 (코스 안)
            </text>

            <rect x="70" y="170" width="160" height="34" rx="10" fill="#059669" stroke="#6ee7b7" strokeWidth="2" />
            <text x="150" y="192" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900">
              ✔ 벌타 없이 세이프!
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>💡 황금 법칙:</span>
            <span>중간 궤적이 아니라 "최종 멈춘 위치"가 기준!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            공이 OB 말뚝 밖으로 나갔더라도 바깥의 안전망, 나무, 바위 등을 맞고 다시 코스 안으로 튕겨 들어와 멈췄다면 벌타 없이 세이프입니다.
          </p>
        </div>
      </div>
    );
  }

  // [4] ob-4: 깃대를 강하게 맞고 튕겨 나가 OB 된 공
  if (ruleId === 'ob-4') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🚩</span>
            <span>깃대 충돌 후 OB 최종 위치 판정</span>
          </div>
          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
            2벌타 가산
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <circle cx="140" cy="110" r="100" fill="#16a34a" />
            <text x="100" y="50" fill="#ffffff" fontSize="10" fontWeight="900">그린 (퍼팅 구역)</text>

            <circle cx="150" cy="110" r="12" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
            <line x1="150" y1="110" x2="150" y2="70" stroke="#ffffff" strokeWidth="3" />
            <polygon points="150,70 170,76 150,84" fill="#ef4444" />

            <line x1="270" y1="0" x2="270" y2="220" stroke="#ffffff" strokeWidth="5" />
            <rect x="273" y="0" width="127" height="220" fill="#450a0a" opacity="0.6" />
            <text x="330" y="40" fill="#f87171" fontSize="11" fontWeight="900">OB 구역</text>

            <path d="M 60 140 Q 110 120 150 110" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
            <circle cx="150" cy="110" r="10" fill="#ef4444" opacity="0.8" />
            <path d="M 150 110 Q 210 110 320 130" fill="none" stroke="#f87171" strokeWidth="2.5" strokeDasharray="4,2" />

            <circle cx="320" cy="130" r="12" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
            <text x="320" y="160" fill="#fca5a5" fontSize="10" fontWeight="900" textAnchor="middle">
              최종 위치 (OB 구역)
            </text>

            <rect x="230" y="170" width="150" height="34" rx="10" fill="#b91c1c" stroke="#fca5a5" strokeWidth="2" />
            <text x="305" y="192" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900">
              ✖ 2벌타 OB 처치
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-rose-400 font-extrabold flex items-center gap-1">
            <span>⚖️ 판정 이유:</span>
            <span>깃대를 맞은 것도 정상 스트로크의 일부입니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            아쉽게 깃대를 맞고 튕겨 나갔더라도 공이 최종적으로 멈춘 위치가 OB선 밖이므로 2벌타를 받고 나간 지점 2클럽 이내에서 처치합니다.
          </p>
        </div>
      </div>
    );
  }

  // [5] ob-5: 티샷한 공이 바로 OB 구역으로 날아갔을 때
  if (ruleId === 'ob-5') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🏌️</span>
            <span>티샷 OB 후 타수 계산 및 4타째 위치</span>
          </div>
          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
            티박스 복귀 금지
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="20" y="80" width="60" height="90" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="50" cy="125" r="5" fill="#f59e0b" />
            <text x="50" y="70" fill="#38bdf8" fontSize="10" fontWeight="900" textAnchor="middle">티잉그라운드</text>
            <text x="50" y="150" fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle">제1타(티샷)</text>

            <line x1="30" y1="90" x2="70" y2="160" stroke="#ef4444" strokeWidth="3" />
            <line x1="70" y1="90" x2="30" y2="160" stroke="#ef4444" strokeWidth="3" />
            <text x="50" y="195" fill="#f87171" fontSize="9" fontWeight="900" textAnchor="middle">
              ※ 티 복귀 절대 불가!
            </text>

            <rect x="100" y="0" width="160" height="220" fill="#15803d" />
            <line x1="260" y1="0" x2="260" y2="220" stroke="#ffffff" strokeWidth="5" />
            <rect x="263" y="0" width="137" height="220" fill="#450a0a" opacity="0.6" />

            <path d="M 50 125 Q 160 80 260 60" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="5,3" />

            <rect x="130" y="30" width="100" height="26" rx="6" fill="#b91c1c" />
            <text x="180" y="47" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
              + 2벌타 가산
            </text>

            <circle cx="230" cy="80" r="13" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            <rect x="170" y="140" width="140" height="36" rx="10" fill="#047857" stroke="#34d399" strokeWidth="2" />
            <text x="240" y="156" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">
              나간 지점 2클럽 안착
            </text>
            <text x="240" y="170" fill="#fef08a" fontSize="10" fontWeight="900" textAnchor="middle">
              다음 샷이 【제4타째】!
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-amber-300 font-extrabold flex items-center gap-1">
            <span>🔢 타수 계산 공식:</span>
            <span>티샷(1타) + OB(2벌타) = 2클럽 안착 후 치는 공이 4타째!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            일반 골프처럼 티박스로 돌아가서 치지 않습니다. OB 선을 통과한 지점에서 2클럽 이내에 놓고 치셔야 합니다.
          </p>
        </div>
      </div>
    );
  }

  // [6] ob-6: OB 말뚝 뽑거나 기울이기 금지
  if (ruleId === 'ob-6') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🚫</span>
            <span>OB 말뚝 훼손 및 라이 개선 금지</span>
          </div>
          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
            위반 시 2벌타
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="150" width="400" height="70" fill="#15803d" />

            <rect x="185" y="60" width="30" height="110" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
            <text x="200" y="120" fill="#0f172a" fontSize="10" fontWeight="900" transform="rotate(-90 200 120)">
              OB 말뚝
            </text>

            <circle cx="150" cy="160" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            <text x="150" y="190" fill="#ffffff" fontSize="10" fontWeight="800" textAnchor="middle">내 공</text>

            <circle cx="200" cy="115" r="45" fill="none" stroke="#ef4444" strokeWidth="8" opacity="0.9" />
            <line x1="168" y1="83" x2="232" y2="147" stroke="#ef4444" strokeWidth="8" opacity="0.9" />

            <text x="310" y="105" fill="#fca5a5" fontSize="12" fontWeight="900" textAnchor="middle">
              뽑기 / 발로 차기
            </text>
            <text x="310" y="125" fill="#ef4444" fontSize="14" fontWeight="900" textAnchor="middle">
              절대 금지! 🚫
            </text>

            <rect x="110" y="10" width="180" height="34" rx="10" fill="#b91c1c" stroke="#fca5a5" strokeWidth="2" />
            <text x="200" y="32" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900">
              라이 개선 위반 【2벌타】
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-rose-400 font-extrabold flex items-center gap-1">
            <span>⚠️ 고정 장애물 규정:</span>
            <span>OB 말뚝은 코스 고정물로 어떤 경우에도 손대선 안 됩니다.</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            스윙이나 발 위치에 방해되더라도 있는 그대로 치셔야 합니다. 임의로 뽑거나 기울이면 2벌타를 받고 원래대로 꽂아놓아야 합니다.
          </p>
        </div>
      </div>
    );
  }

  // [7] ob-7: 동반자 공 충돌로 OB 된 경우
  if (ruleId === 'ob-7') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>💥</span>
            <span>공 충돌 시 동반자 공 무벌 원위치 규정</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            동반자 무벌타
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="260" height="220" fill="#15803d" />
            <line x1="260" y1="0" x2="260" y2="220" stroke="#ffffff" strokeWidth="5" />
            <rect x="263" y="0" width="137" height="220" fill="#450a0a" opacity="0.6" />

            <circle cx="60" cy="110" r="12" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
            <path d="M 75 110 L 160 110" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4,2" />

            <circle cx="170" cy="110" r="14" fill="#fbbf24" opacity="0.8" />
            <text x="170" y="114" fill="#0f172a" fontSize="9" fontWeight="900" textAnchor="middle">쾅!</text>

            <path d="M 180 110 Q 230 110 320 80" stroke="#f97316" strokeWidth="2" strokeDasharray="3,3" />
            <circle cx="320" cy="80" r="12" fill="#f97316" stroke="#ffffff" strokeWidth="2" />

            <path d="M 310 70 Q 240 30 180 90" fill="none" stroke="#22c55e" strokeWidth="3" />
            <polygon points="175,95 185,85 190,95" fill="#22c55e" />

            <rect x="110" y="145" width="140" height="34" rx="8" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
            <text x="180" y="166" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">
              동반자 공: 【무벌 원위치】
            </text>

            <text x="320" y="125" fill="#fca5a5" fontSize="10" fontWeight="900" textAnchor="middle">
              친 사람 공만
            </text>
            <text x="320" y="140" fill="#ef4444" fontSize="10" fontWeight="900" textAnchor="middle">
              최종 위치로 판정!
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>💡 피해자 보호 원칙:</span>
            <span>맞아서 튕겨 나간 동반자 공은 벌타 없이 원래 자리로 복귀!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            내 공에 맞아 OB로 나간 동반자의 공은 원래 충돌 지점으로 돌아옵니다. 친 본인의 공이 OB가 된 경우에만 본인에게 2벌타가 부과됩니다.
          </p>
        </div>
      </div>
    );
  }

  // [8] ob-8: 수풀 속 분실구 (2분 수색 제한)
  if (ruleId === 'ob-8') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>⏱️</span>
            <span>분실구 2분 수색 규정 및 2벌타 처치</span>
          </div>
          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
            2분 초과 시 분실구
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#14532d" />
            <text x="200" y="30" fill="#86efac" fontSize="12" fontWeight="900" textAnchor="middle">
              깊은 러프 / 수풀 구역
            </text>

            <circle cx="100" cy="115" r="35" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />
            <text x="100" y="112" fill="#fbbf24" fontSize="20" textAnchor="middle">⏳</text>
            <text x="100" y="132" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">2분 수색</text>

            <circle cx="220" cy="115" r="22" fill="#334155" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3,3" />
            <text x="220" y="123" fill="#94a3b8" fontSize="20" fontWeight="900" textAnchor="middle">?</text>
            <text x="220" y="155" fill="#f87171" fontSize="10" fontWeight="800" textAnchor="middle">미발견 시</text>

            <rect x="270" y="90" width="115" height="60" rx="10" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
            <text x="327" y="112" fill="#fef08a" fontSize="11" fontWeight="900" textAnchor="middle">
              2벌타 가산 후
            </text>
            <text x="327" y="130" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
              분실 지점 2클럽 안착
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-amber-300 font-extrabold flex items-center gap-1">
            <span>⏳ 수색 시간 안내:</span>
            <span>일반 골프(3분)와 달리 파크골프 공인 수색 시간은 2분입니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            동반자와 함께 2분간 찾아도 공이 안 보이면 분실구로 2벌타를 받고 분실 추정 지점 2클럽 이내에서 새 공으로 플레이합니다.
          </p>
        </div>
      </div>
    );
  }

  // [9] ob-9: 오소 플레이 (홀에 가깝게 놓았을 때)
  if (ruleId === 'ob-9') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>⚠️</span>
            <span>홀에 가깝게 놓는 오소(오치) 플레이 금지도</span>
          </div>
          <span className="text-[10px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full">
            2벌타 추가 부과
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="300" height="220" fill="#15803d" />
            <line x1="300" y1="0" x2="300" y2="220" stroke="#ffffff" strokeWidth="5" />
            <rect x="303" y="0" width="97" height="220" fill="#450a0a" opacity="0.6" />

            <g transform="translate(150, 30)">
              <circle cx="0" cy="0" r="10" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
              <line x1="0" y1="0" x2="0" y2="-20" stroke="#ffffff" strokeWidth="2.5" />
              <polygon points="0,-20 15,-15 0,-10" fill="#ef4444" />
              <text x="20" y="-12" fill="#ffffff" fontSize="10" fontWeight="900">홀컵 방향 (전방)</text>
            </g>

            <circle cx="300" cy="140" r="6" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
            <text x="290" y="165" fill="#fef08a" fontSize="10" fontWeight="800" textAnchor="end">나간 지점</text>

            <path d="M 285 130 L 220 70" stroke="#ef4444" strokeWidth="4" />
            <polygon points="215,65 228,68 220,78" fill="#ef4444" />
            <circle cx="230" cy="85" r="14" fill="#ef4444" opacity="0.8" />
            <text x="230" y="89" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">🚫</text>
            <text x="200" y="105" fill="#fca5a5" fontSize="10" fontWeight="900">홀컵 쪽 전진 금지!</text>

            <path d="M 300 140 L 240 140 A 60 60 0 0 0 270 195 Z" fill="#22c55e" fillOpacity="0.4" stroke="#4ade80" strokeWidth="2" />
            <text x="230" y="180" fill="#a7f3d0" fontSize="10" fontWeight="900">
              측면/후방 허용 구역
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-rose-400 font-extrabold flex items-center gap-1">
            <span>🚨 절대 주의:</span>
            <span>2클럽을 잴 때 홀컵 방향으로 앞쪽에 놓으면 2벌타 추가!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            구제는 반드시 나간 지점 기준 측면이나 뒤쪽(홀에 가깝지 않은 방향)으로만 놓아야 합니다. 홀 쪽으로 전진하여 치면 오소 플레이로 2벌타가 추가 가산됩니다.
          </p>
        </div>
      </div>
    );
  }

  // [10] ob-10: 공이 나뭇가지 위에 얹혀 OB 선 수직 상공에 떠 있는 경우
  if (ruleId === 'ob-10') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🌲</span>
            <span>공중 수직 투영선 기준 세이프 판정도</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            수직 투영선 접촉 시 세이프
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="160" width="200" height="60" fill="#15803d" />
            <rect x="200" y="160" width="20" height="60" fill="#ffffff" />
            <rect x="220" y="160" width="180" height="60" fill="#450a0a" opacity="0.6" />

            <rect x="40" y="30" width="25" height="150" fill="#78350f" rx="3" />
            <path d="M 55 70 Q 140 60 220 80" stroke="#78350f" strokeWidth="16" fill="none" strokeLinecap="round" />

            <circle cx="210" cy="70" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="2" />

            <line x1="210" y1="84" x2="210" y2="160" stroke="#facc15" strokeWidth="2.5" strokeDasharray="4,3" />
            <circle cx="210" cy="160" r="5" fill="#facc15" />

            <text x="210" y="125" fill="#fef08a" fontSize="10" fontWeight="900" textAnchor="end">
              지면 수직 투영선 ➔
            </text>

            <rect x="70" y="175" width="125" height="34" rx="8" fill="#047857" stroke="#34d399" strokeWidth="2" />
            <text x="132" y="196" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              ✔ 무벌 세이프(IN)
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>💡 수직 투영 기준:</span>
            <span>공중에 떠 있는 공은 지면으로 내린 수직선이 기준입니다!</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            나뭇가지에 걸린 공의 수직 투영선이 지면의 백색 실선에 걸쳐 있다면 코스 안쪽의 공(세이프)으로 인정됩니다.
          </p>
        </div>
      </div>
    );
  }

  // [2] Tee & Swing Category (ts-1 ~ ts-8)
  if (ruleId.startsWith('ts-')) {
    return <TeeSwingDiagrams ruleId={ruleId} />;
  }

  // [3] Putting Green & Flagstick Category (pg-1 ~ pg-8)
  if (ruleId.startsWith('pg-')) {
    return <PuttingGreenDiagrams ruleId={ruleId} />;
  }

  // [4] Hazard & Relief Category (hr-1 ~ hr-8)
  if (ruleId.startsWith('hr-')) {
    return <HazardReliefDiagrams ruleId={ruleId} />;
  }

  // [5] Touch & Penalty Category (tp-1 ~ tp-8)
  if (ruleId.startsWith('tp-')) {
    return <TouchPenaltyDiagrams ruleId={ruleId} />;
  }

  // [6] Scorecard & Manner Category (sm-1 ~ sm-8)
  if (ruleId.startsWith('sm-')) {
    return <ScoreMannerDiagrams ruleId={ruleId} />;
  }

  // Default Mascot / Category Fallback Visual Card
  return (
    <div className="w-full bg-gradient-to-br from-stone-900 to-emerald-950 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3.5 text-white space-y-2.5">
      <div className="flex items-center justify-between border-b border-emerald-800/60 pb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
          <span>⛳</span>
          <span>파키의 공인 규정 현장 가이드</span>
        </div>
        <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
          공식 규칙 해설
        </span>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-emerald-400/40 aspect-[16/9] bg-stone-950 flex items-center justify-center">
        <img
          src="/mascot/사진저장고_사진_20260913_28.jpg"
          alt="파키 룰 판정 가이드"
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 flex items-end p-3">
          <div className="text-xs font-black text-amber-300 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-amber-400/40">
            📢 경기위원 파키의 정밀 판정 극장
          </div>
        </div>
      </div>
    </div>
  );
}
