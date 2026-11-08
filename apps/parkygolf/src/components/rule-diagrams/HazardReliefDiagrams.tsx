'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface DiagramProps {
  ruleId: string;
  isJp?: boolean;
}

export function HazardReliefDiagrams({ ruleId, isJp }: DiagramProps) {
  const { isJapanese } = useTranslation();
  const activeJp = isJp ?? isJapanese;

  // [1] hr-1: 워터 해저드에 공이 빠졌을 때 (2벌타 2클럽)
  if (ruleId === 'hr-1') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🌊</span>
            <span>{activeJp ? 'ウォーターハザード 2打付加および2クラブ処置図' : '워터 해저드 2벌타 및 2클럽 처치도'}</span>
          </div>
          <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '2打付加 ➔ 進入点から2クラブ以内処置' : '2벌타 ➔ 진입점 2클럽 이내 처치'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            {/* Left Fairway Turf */}
            <rect x="0" y="0" width="220" height="220" fill="#15803d" />

            {/* Right Water Hazard */}
            <path d="M 220 0 Q 200 110 230 220 L 400 220 L 400 0 Z" fill="#0284c7" />
            <text x="310" y="115" fill="#e0f2fe" fontSize="13" fontWeight="900" textAnchor="middle">
              {activeJp ? 'ウォーターハザード (池/水路)' : '워터 해저드 (연못/수로)'}
            </text>

            {/* Boundary Stakes (Yellow) */}
            <circle cx="212" cy="40" r="5" fill="#facc15" stroke="#000000" strokeWidth="1" />
            <circle cx="205" cy="110" r="5" fill="#facc15" stroke="#000000" strokeWidth="1" />
            <circle cx="220" cy="180" r="5" fill="#facc15" stroke="#000000" strokeWidth="1" />

            {/* Ball Entering Water */}
            <path d="M 120 110 L 205 110" stroke="#facc15" strokeWidth="2.5" strokeDasharray="3,3" />
            <circle cx="205" cy="110" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
            <text x="180" y="95" fill="#fef08a" fontSize="9" fontWeight="900">
              {activeJp ? '最終進入点' : '최종 진입점'}
            </text>

            {/* Splash in water */}
            <circle cx="260" cy="110" r="14" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" opacity="0.8" />
            <text x="260" y="140" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">
              {activeJp ? 'ポチャリ！水没' : '풍덩! 수몰'}
            </text>

            {/* 2 Club Relief Arc in Course Turf */}
            <path d="M 205 50 A 60 60 0 0 0 205 170" stroke="#34d399" strokeWidth="2.5" strokeDasharray="4,2" fill="#059669" fillOpacity="0.25" />
            <text x="150" y="125" fill="#6ee7b7" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? '2クラブレングス救済' : '2클럽 헤드 구제'}
            </text>

            <rect x="25" y="25" width="140" height="42" rx="8" fill="#991b1b" stroke="#fca5a5" strokeWidth="1.5" />
            <text x="95" y="44" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              {activeJp ? '🚨 2打付加' : '🚨 2벌타 가산'}
            </text>
            <text x="95" y="58" fill="#fef08a" fontSize="8" fontWeight="800" textAnchor="middle">
              {activeJp ? '進入点2クラブ内にプレース' : '진입점 2클럽 안쪽에 드롭'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-amber-400 font-extrabold flex items-center gap-1">
            <span>🌊 {activeJp ? 'ハザード処置規則:' : '해저드 처치 수칙:'}</span>
            <span>{activeJp ? 'ウォーターハザードに入ったら2打付加を受け、境界通過点から2クラブ以内にプレースします！' : '워터 해저드에 빠지면 2벌타를 받고 경계 통과 지점 2클럽 이내에 놓습니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? 'ティーボックスには戻りません。ボールがハザード境界線を最後に横切った地点を確認し、ホールに近づかないコース内へ2クラブ以内に手で置いて次打を打ちます。'
              : '티박스로 돌아가지 않습니다. 공이 해저드 경계선을 최종 통과한 지점을 확인하고, 홀에 가깝지 않게 코스 안쪽으로 2클럽 이내에 놓고 다음 타를 칩니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [2] hr-2: 비 온 뒤 잔디 물웅덩이(캐주얼 워터)나 수리지 구제
  if (ruleId === 'hr-2') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🌧️</span>
            <span>{activeJp ? 'カジュアルウォーター/修理地 無罰救済図' : '캐주얼 워터/수리지 무벌 구제도'}</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '無罰救済 ➔ 1クラブ以内芝生' : '무벌 구제 ➔ 1클럽 이내 잔디'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#15803d" />

            {/* Puddle / Casual Water */}
            <ellipse cx="140" cy="120" rx="65" ry="35" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" opacity="0.8" />
            <text x="140" y="115" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? '水たまり' : '물웅덩이'}
            </text>
            <text x="140" y="128" fill="#e0f2fe" fontSize="8" fontWeight="700" textAnchor="middle">
              {activeJp ? '(カジュアルウォーター)' : '(캐주얼 워터)'}
            </text>

            {/* Ball submerged in water */}
            <circle cx="155" cy="130" r="12" fill="#f97316" stroke="#ffffff" strokeWidth="1" />

            {/* Relief Arrow to Dry Turf */}
            <path d="M 170 120 Q 220 90 270 120" stroke="#facc15" strokeWidth="3" strokeDasharray="3,3" fill="none" />
            <polygon points="270,120 258,114 262,125" fill="#facc15" />

            {/* 1 Club Length Zone on Dry Grass */}
            <circle cx="280" cy="120" r="35" fill="#059669" fillOpacity="0.3" stroke="#34d399" strokeWidth="2" strokeDasharray="4,2" />
            <circle cx="280" cy="120" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="280" y="145" fill="#fef08a" fontSize="9" fontWeight="900" textAnchor="middle">
              {activeJp ? '1クラブ以内芝生' : '1클럽 이내 잔디'}
            </text>

            <rect x="230" y="30" width="150" height="42" rx="8" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
            <text x="305" y="50" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              {activeJp ? '✔ 無罰救済' : '✔ 무벌 구제'}
            </text>
            <text x="305" y="64" fill="#a7f3d0" fontSize="8" fontWeight="800" textAnchor="middle">
              {activeJp ? 'ホールに近づかない芝生' : '홀에 가깝지 않은 잔디'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>🌧️ {activeJp ? '異常コース状態の無罰救済:' : '비정상 코스 무벌 구제:'}</span>
            <span>{activeJp ? '一時的な水たまりの中のボールは罰打なしで拾い上げ1クラブにプレースできます！' : '일시적으로 고인 물웅덩이 속 공은 벌타 없이 건져서 1클럽에 놓습니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? '水没球やスタンスに水が触れる場合、水を避けてホールに近づかない最も近い完全救済地点から1クラブ以内の芝に無罰で置いてプレーできます。'
              : '물에 잠긴 공이나 스탠스가 물에 밟히는 경우, 물을 피하여 홀에 가깝지 않은 가장 가까운 완전 구제 지점으로부터 1클럽 이내 잔디에 무벌로 공을 놓고 칠 수 있습니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [3] hr-3: 배수구 쇠창살, 안전망, 스프링클러 위 공의 구제
  if (ruleId === 'hr-3') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🏗️</span>
            <span>{activeJp ? '人工障害物(排水口) 無罰救済図' : '인공 장해물(배수구) 무벌 구제도'}</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '無罰救済 ➔ 1クラブ以内芝生' : '무벌 구제 ➔ 1클럽 이내 잔디'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#15803d" />

            {/* Iron Drain Grate Graphic */}
            <rect x="70" y="60" width="130" height="100" rx="4" fill="#334155" stroke="#475569" strokeWidth="3" />
            <line x1="90" y1="60" x2="90" y2="160" stroke="#0f172a" strokeWidth="4" />
            <line x1="110" y1="60" x2="110" y2="160" stroke="#0f172a" strokeWidth="4" />
            <line x1="130" y1="60" x2="130" y2="160" stroke="#0f172a" strokeWidth="4" />
            <line x1="150" y1="60" x2="150" y2="160" stroke="#0f172a" strokeWidth="4" />
            <line x1="170" y1="60" x2="170" y2="160" stroke="#0f172a" strokeWidth="4" />

            {/* Ball trapped on metal slots */}
            <circle cx="130" cy="110" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="135" y="180" fill="#fef08a" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? '排水口グレーチング上の球' : '배수구 쇠창살 위 공'}
            </text>

            {/* Relief Movement Arrow */}
            <path d="M 150 110 Q 210 80 270 110" stroke="#facc15" strokeWidth="3" strokeDasharray="3,3" fill="none" />

            {/* Relief Target on Grass */}
            <circle cx="280" cy="110" r="30" fill="#059669" fillOpacity="0.3" stroke="#34d399" strokeWidth="2" strokeDasharray="3,2" />
            <circle cx="280" cy="110" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="280" y="155" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? '1クラブ芝生プレース' : '1클럽 잔디 안착'}
            </text>

            <rect x="230" y="25" width="150" height="42" rx="8" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
            <text x="305" y="44" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              {activeJp ? '✔ 無罰救済' : '✔ 무벌 구제'}
            </text>
            <text x="305" y="58" fill="#a7f3d0" fontSize="8" fontWeight="800" textAnchor="middle">
              {activeJp ? '動かせない人工障害物' : '움직일 수 없는 인공장해물'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>🏗️ {activeJp ? '人工障害物の無罰救済:' : '인공 장해물 무벌 구제:'}</span>
            <span>{activeJp ? '排水溝・スプリンクラー・安全ネット支柱の上の球は1クラブ無罰救済！' : '배수구, 스프링클러, 안전망 기둥 위의 공은 1클럽 무벌 구제!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? 'コース内の動かせない人工障害物にボールが乗ったりスタンスの妨げになる場合、ホールに近づかない方向へ1クラブ以内の芝に無罰で置いて競技を続けます。'
              : '코스 내 고정된 인공 구조물에 공이 올라타거나 스탠스에 방해가 될 때는 홀에 가깝지 않은 방향 1클럽 이내 잔디에 무벌로 공을 놓고 경기합니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [4] hr-4: 포장된 카트 도로, 아스팔트, 보도블록 위에 공이 멈췄을 때
  if (ruleId === 'hr-4') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🛣️</span>
            <span>{activeJp ? 'カート道路/アスファルト 無罰救済図' : '카트 도로/아스팔트 무벌 구제도'}</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '無罰救済 ➔ 道路外芝生1クラブ' : '무벌 구제 ➔ 도로 밖 잔디 1클럽'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            {/* Left Grass */}
            <rect x="0" y="0" width="180" height="220" fill="#15803d" />

            {/* Right Paved Asphalt Road */}
            <rect x="180" y="0" width="220" height="220" fill="#475569" stroke="#64748b" strokeWidth="2" />
            <line x1="290" y1="0" x2="290" y2="220" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="10,10" />
            <text x="290" y="30" fill="#f8fafc" fontSize="11" fontWeight="900" textAnchor="middle">
              {activeJp ? '舗装カート道路 (アスファルト)' : '포장 카트 도로 (아스팔트)'}
            </text>

            {/* Ball on Asphalt */}
            <circle cx="250" cy="110" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="250" y="140" fill="#fef08a" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? '道路上に停止' : '도로 위 정지'}
            </text>

            {/* Relief Arrow to Turf */}
            <path d="M 230 110 L 120 110" stroke="#facc15" strokeWidth="3" strokeDasharray="3,3" />
            <polygon points="115,110 125,105 125,115" fill="#facc15" />

            {/* Relief Ball on Grass */}
            <circle cx="100" cy="110" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="100" y="140" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? '道路外の芝生1クラブ' : '도로 밖 잔디 1클럽'}
            </text>

            <rect x="20" y="25" width="140" height="42" rx="8" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
            <text x="90" y="44" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              {activeJp ? '✔ 無罰救済' : '✔ 무벌 구제'}
            </text>
            <text x="90" y="58" fill="#a7f3d0" fontSize="8" fontWeight="800" textAnchor="middle">
              {activeJp ? 'クラブ/道路損傷防止' : '클럽/아스팔트 손상 방지'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>🛣️ {activeJp ? 'カート道路の無罰救済:' : '카트 도로 무벌 구제:'}</span>
            <span>{activeJp ? 'アスファルトやセメント道路上の球は罰打なしで芝生1クラブに移動！' : '아스팔트나 시멘트 도로 위 공은 벌타 없이 잔디 1클럽으로 이동!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? 'カート道路等の人工舗装道路では用具保護および安全のため、道路を完全に外れた芝生区域へ1クラブ以内に無罰で置いてプレーします。'
              : '카트 도로 등 인공 포장 도로에서는 클럽 손상 방지 및 안전을 위해 도로를 완전히 벗어난 잔디 구역 1클럽 이내에 무벌로 공을 놓고 플레이합니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [5] hr-5: 공 주변 마른 나뭇가지, 낙엽, 돌멩이(루스 임페디먼트) 치우기
  if (ruleId === 'hr-5') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🍂</span>
            <span>{activeJp ? 'ルースインペディメント(自然物)除去判定図' : '루스 임페디먼트(자연물) 제거 판정도'}</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '無罰除去可能 (球が動けば1打付加)' : '무벌 제거 가능 (공 움직이면 1벌타)'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#14532d" />

            {/* Stationary Ball */}
            <circle cx="150" cy="110" r="16" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="150" y="145" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? '停止中の自分の球' : '정지된 내 공'}
            </text>

            {/* Loose Twig & Leaves */}
            <line x1="175" y1="90" x2="220" y2="135" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="200" cy="85" rx="10" ry="6" fill="#b45309" transform="rotate(30 200 85)" />
            <ellipse cx="230" cy="110" rx="8" ry="5" fill="#713f12" />

            {/* Hand Picking Twig Away */}
            <path d="M 210 110 Q 250 80 290 60" stroke="#38bdf8" strokeWidth="3" strokeDasharray="3,3" fill="none" />
            <polygon points="295,58 285,60 290,70" fill="#38bdf8" />
            <text x="270" y="45" fill="#38bdf8" fontSize="11" fontWeight="900">
              {activeJp ? '手で取り除く' : '손으로 치우기'}
            </text>

            <rect x="20" y="25" width="160" height="44" rx="8" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
            <text x="100" y="44" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">
              {activeJp ? '✔ 罰打なしで除去許可' : '✔ 벌타 없이 제거 허용'}
            </text>
            <text x="100" y="58" fill="#fef08a" fontSize="8" fontWeight="800" textAnchor="middle">
              {activeJp ? '球が動けば1打付加' : '단, 공이 움직이면 1벌타'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>🍂 {activeJp ? 'ルースインペディメントの規則:' : '루스 임페디먼트 수칙:'}</span>
            <span>{activeJp ? '落ちている枯れ枝・落ち葉・小石は無罰で取り除くことができます！' : '떨어진 나뭇가지나 마른 낙엽, 돌멩이는 무벌로 치울 수 있습니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? '固定されていない自然物は手で取り除けますが、その過程でボールに触れて元の位置から動いた場合は1打付加となり、球を元の位置に戻さなければなりません。'
              : '고정되지 않은 자연물은 손으로 치울 수 있으나, 치우는 과정에서 공이 건드려져 본래 위치를 벗어나 움직이면 1벌타가 가산되고 공을 원래 자리에 되돌려놓아야 합니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [6] hr-6: 살아있는 나무나 풀을 꺾거나 밟아서 치우는 행위
  if (ruleId === 'hr-6') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🌳</span>
            <span>{activeJp ? '生木/樹木損傷・ライ改善禁止判定図' : '생목/수목 훼손 라이 개선 금지 판정도'}</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '自然ライの改変 2打付加' : '자연 라이 훼손 2벌타'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#14532d" />

            {/* Living Tree trunk & bent branch */}
            <rect x="40" y="30" width="30" height="170" fill="#78350f" rx="4" />
            <path d="M 65 90 Q 150 70 200 130" stroke="#78350f" strokeWidth="14" fill="none" strokeLinecap="round" />
            <circle cx="180" cy="115" r="18" fill="#16a34a" />

            {/* Snapping branch sound */}
            <text x="180" y="80" fill="#f87171" fontSize="13" fontWeight="900">
              {activeJp ? 'バキッ！折ってしまう' : '뚝! 꺾어버림'}
            </text>

            {/* Ball under branch */}
            <circle cx="210" cy="165" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />

            {/* Prohibition Symbol */}
            <circle cx="180" cy="105" r="45" fill="none" stroke="#dc2626" strokeWidth="6" opacity="0.9" />
            <line x1="148" y1="73" x2="212" y2="137" stroke="#dc2626" strokeWidth="6" opacity="0.9" />

            <rect x="235" y="55" width="145" height="52" rx="8" fill="#991b1b" stroke="#fca5a5" strokeWidth="2" />
            <text x="307" y="78" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">
              {activeJp ? '🚨 2打付加' : '🚨 2벌타 부과'}
            </text>
            <text x="307" y="94" fill="#fef08a" fontSize="9" fontWeight="800" textAnchor="middle">
              {activeJp ? '(生きている植物の変形禁止)' : '(살아있는 식물 변형 금지)'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>🚫 {activeJp ? '自然ライの損傷絶対禁止:' : '자연 라이 훼손 절대 금지:'}</span>
            <span>{activeJp ? '生きている枝を折ったり踏んでスイング区域を広げると2打付加です！' : '살아있는 나뭇가지를 꺾거나 밟아 스윙 구역을 트면 2벌타입니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? '生えている木や草はコース固有の要素です。スイング軌道を確保するために枝を折ったり草を踏み固めると2打付加となります。'
              : '자라나는 나무나 잔디는 코스의 고유한 일부입니다. 스윙 궤도를 편하게 만들기 위해 나뭇가지를 꺾거나 풀을 밟아 누르면 2벌타가 부과됩니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [7] hr-7: 벙커 안에서 어드레스 시 모래에 클럽 헤드를 대는 행위
  if (ruleId === 'hr-7') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🏖️</span>
            <span>{activeJp ? 'バンカー砂接触の許容範囲判定図' : '벙커 모래 접촉 허용 범위 판정도'}</span>
          </div>
          <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '軽い接触は無罰 / 押し込むと2打付加' : '가벼운 접촉 무벌 / 누르면 2벌타'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#d97706" />

            {/* Case A: Gentle touch (Allowed) */}
            <g transform="translate(40, 40)">
              <rect x="0" y="0" width="145" height="145" rx="10" fill="#1e293b" stroke="#059669" strokeWidth="2" />
              <text x="72" y="25" fill="#34d399" fontSize="11" fontWeight="900" textAnchor="middle">
                {activeJp ? '✔ 軽いアドレス' : '✔ 가벼운 어드레스'}
              </text>
              
              <ellipse cx="72" cy="110" rx="55" ry="12" fill="#b45309" />
              <circle cx="85" cy="95" r="12" fill="#f97316" />
              <rect x="45" y="80" width="15" height="22" rx="3" fill="#94a3b8" />
              <text x="72" y="65" fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle">
                {activeJp ? 'そっと置くだけ' : '살포시 대기만 함'}
              </text>
              
              <rect x="25" y="115" width="95" height="22" rx="4" fill="#047857" />
              <text x="72" y="130" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">
                {activeJp ? '罰打なし (無罰)' : '벌타 없음 (무벌)'}
              </text>
            </g>

            {/* Case B: Pressing / Sand testing (Forbidden) */}
            <g transform="translate(215, 40)">
              <rect x="0" y="0" width="145" height="145" rx="10" fill="#1e293b" stroke="#dc2626" strokeWidth="2" />
              <text x="72" y="25" fill="#f87171" fontSize="11" fontWeight="900" textAnchor="middle">
                {activeJp ? '❌ 砂固め/テスト' : '❌ 모래 다지기/테스트'}
              </text>

              <ellipse cx="72" cy="110" rx="55" ry="12" fill="#b45309" />
              <circle cx="85" cy="95" r="12" fill="#f97316" />
              {/* Deep depression in sand */}
              <ellipse cx="50" cy="105" rx="15" ry="6" fill="#78350f" />
              <rect x="42" y="82" width="16" height="26" rx="3" fill="#ef4444" />
              <text x="72" y="65" fill="#fca5a5" fontSize="9" fontWeight="800" textAnchor="middle">
                {activeJp ? '砂を強く押す/掘る' : '모래 꾹 누르거나 긁음'}
              </text>

              <rect x="20" y="115" width="105" height="22" rx="4" fill="#991b1b" />
              <text x="72" y="130" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">
                {activeJp ? '🚨 2打付加' : '🚨 2벌타 부과'}
              </text>
            </g>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-amber-400 font-extrabold flex items-center gap-1">
            <span>🏖️ {activeJp ? 'バンカー砂接触基準:' : '벙커 모래 접촉 기준:'}</span>
            <span>{activeJp ? 'アドレスで軽く置くのは可能ですが、押し付けたり掘ると2打付加！' : '어드레스 시 가볍게 대는 것은 괜찮으나 누르거나 파면 2벌타!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? 'パークゴルフ規則上、バンカーでヘッドを砂に軽く置くアドレスは認められています。ただし砂の硬さを試したり足やクラブで砂を押し固めると2打付加となります。'
              : '파크골프 규정상 벙커에서 헤드를 모래에 가볍게 대는 어드레스는 허용됩니다. 단 모래의 단단함을 시험하거나 발이나 클럽으로 모래를 꾹꾹 눌러 평탄화하면 2벌타입니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [8] hr-8: 벙커 내 앞사람 발자국 깊은 흠에 공이 박힌 경우
  if (ruleId === 'hr-8') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>👣</span>
            <span>{activeJp ? 'バンカー足跡ライ処置図' : '벙커 발자국 라이 처치도'}</span>
          </div>
          <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '無罰救済不可 ➔ あるがままプレー' : '무벌 구제 불가 ➔ 있는 그대로 플레이'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#d97706" />

            {/* Footprint Depression in Sand */}
            <ellipse cx="180" cy="120" rx="55" ry="30" fill="#92400e" stroke="#78350f" strokeWidth="3" />
            <text x="180" y="75" fill="#fef08a" fontSize="11" fontWeight="900" textAnchor="middle">
              {activeJp ? '前の人の深い足跡の窪み' : '앞사람 깊은 발자국 흠'}
            </text>

            {/* Ball embedded in footprint */}
            <circle cx="180" cy="122" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="180" y="165" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? '足跡の中に埋まる' : '발자국 속에 박힘'}
            </text>

            <rect x="250" y="35" width="135" height="50" rx="8" fill="#991b1b" stroke="#fca5a5" strokeWidth="1.5" />
            <text x="317" y="56" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">
              {activeJp ? '❌ 手で拾い上げ禁止' : '❌ 손으로 꺼냄 금지'}
            </text>
            <text x="317" y="70" fill="#fef08a" fontSize="8" fontWeight="800" textAnchor="middle">
              {activeJp ? '違反時 2打付加' : '위반 시 2벌타 부과'}
            </text>

            <rect x="100" y="175" width="200" height="34" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
            <text x="200" y="196" fill="#fde047" fontSize="12" fontWeight="900" textAnchor="middle">
              {activeJp ? '✔ あるがままのプレー原則' : '✔ 있는 그대로 플레이 원칙'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-amber-400 font-extrabold flex items-center gap-1">
            <span>👣 {activeJp ? 'バンカー不良ライ原則:' : '벙커 불량 라이 원칙:'}</span>
            <span>{activeJp ? 'バンカー内の足跡は無罰救済の対象外ですので、あるがまま打たなければなりません！' : '벙커 내 발자국은 무벌 구제 대상이 아니므로 있는 그대로 쳐야 합니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? '足跡に入ったからといって手で球を取り出したり砂を平らに均すと2打付加となります。どうしても打てない場合はアンプレヤブル(2打付加)を宣言します。'
              : '발자국에 빠졌다고 손으로 공을 꺼내거나 모래를 평평하게 다듬고 치면 2벌타가 부과됩니다. 도저히 칠 수 없다면 언플레이어블(2벌타)을 선언해야 합니다.'}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
