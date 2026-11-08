'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface DiagramProps {
  ruleId: string;
  isJp?: boolean;
}

export function PuttingGreenDiagrams({ ruleId, isJp }: DiagramProps) {
  const { isJapanese } = useTranslation();
  const activeJp = isJp ?? isJapanese;

  // [1] pg-1: 깃대를 맞고 홀컵 밖으로 튕겨 나온 공
  if (ruleId === 'pg-1') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>⛳</span>
            <span>{activeJp ? 'ピン衝突・跳ね返り判定図' : '깃대 충돌 튕김 판정도'}</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? 'ホールイン不承認 (無罰) ➔ 停止位置からパット' : '홀인 불인정 (무벌) ➔ 멈춘 곳에서 퍼팅'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#15803d" />

            {/* Hole Cup */}
            <ellipse cx="180" cy="140" rx="35" ry="16" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
            <line x1="180" y1="40" x2="180" y2="140" stroke="#f8fafc" strokeWidth="3" />
            <polygon points="180,40 140,55 180,70" fill="#ef4444" />

            {/* Inbound Putt Line */}
            <path d="M 60 160 Q 130 150 178 135" stroke="#facc15" strokeWidth="3" strokeDasharray="3,3" fill="none" />

            {/* Impact Flash on Pole */}
            <circle cx="180" cy="130" r="10" fill="#fef08a" opacity="0.8" />
            <text x="195" y="115" fill="#facc15" fontSize="11" fontWeight="900">
              {activeJp ? 'ピン直撃！バウンド' : '쾅! 튕김'}
            </text>

            {/* Rebound Trajectory */}
            <path d="M 182 135 Q 240 120 280 150" stroke="#f87171" strokeWidth="3" strokeDasharray="3,3" fill="none" />
            <polygon points="280,150 270,142 278,138" fill="#f87171" />

            {/* Resting Ball Outside Cup */}
            <circle cx="285" cy="155" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="285" y="185" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">
              {activeJp ? 'カップ外に最終停止' : '홀 밖에 최종 정지'}
            </text>

            <rect x="70" y="25" width="160" height="42" rx="8" fill="#065f46" stroke="#34d399" strokeWidth="1.5" />
            <text x="150" y="44" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">
              {activeJp ? 'ホールイン不承認 (無罰)' : '홀인 불인정 (무벌)'}
            </text>
            <text x="150" y="58" fill="#a7f3d0" fontSize="9" fontWeight="800" textAnchor="middle">
              {activeJp ? '停止位置から次のパッティング' : '멈춘 자리에서 다음 퍼팅'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>✔ {activeJp ? '最終停止原則:' : '최종 정지 원칙:'}</span>
            <span>{activeJp ? 'ピンに当たって外に飛び出した球は、止まった位置から次打を打ちます！' : '깃대를 맞고 밖으로 튕겨 나간 공은 멈춘 곳에서 다음 타를 칩니다!' }</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? 'ボール全体がカップ底に落ちて完全に静止して初めてホールインとなります。ピンに当たってグリーン上に跳ね返った場合はホールインではなく、止まった位置からパッティングを続けます。'
              : '공 전체가 홀컵 바닥에 떨어져 완전히 멈춰야만 홀인입니다. 깃대를 맞고 튕겨 나와 그린 위에 멈췄다면 홀인이 아니며 멈춘 자리에서 퍼팅을 이어갑니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [2] pg-2: 공이 홀컵 깃대와 컵 가장자리 틈새에 끼어 걸쳐 있는 경우
  if (ruleId === 'pg-2') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>⛳</span>
            <span>{activeJp ? 'ピン/カップ縁挟まりホールイン認定断面図' : '깃대/림 끼임 홀인 인정 단면도'}</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? 'ピンを揺らして底に落下時ホールイン認定！' : '깃대 흔들어 바닥 낙하 시 홀인 인정!'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            {/* Ground Turf Section */}
            <rect x="0" y="80" width="130" height="140" fill="#15803d" />
            <rect x="270" y="80" width="130" height="140" fill="#15803d" />

            {/* Cup Cylinder (Cross-section) */}
            <rect x="130" y="80" width="140" height="110" fill="#334155" stroke="#64748b" strokeWidth="2" />
            <rect x="135" y="185" width="130" height="10" fill="#1e293b" />
            <text x="200" y="180" fill="#94a3b8" fontSize="10" fontWeight="800" textAnchor="middle">
              {activeJp ? 'カップ底面' : '홀컵 바닥면'}
            </text>

            {/* Flagstick Pole */}
            <rect x="196" y="20" width="8" height="165" fill="#f8fafc" />
            <polygon points="196,20 160,35 196,50" fill="#ef4444" />

            {/* Ball wedged between Rim and Flagstick */}
            <circle cx="160" cy="98" r="22" fill="#f97316" stroke="#ea580c" strokeWidth="2" />
            <text x="160" y="103" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? '挟まった球' : '끼인 공'}
            </text>

            {/* Arrow indicating slight shake of flagstick */}
            <path d="M 215 45 Q 230 40 225 55" stroke="#facc15" strokeWidth="2.5" fill="none" />
            <text x="235" y="52" fill="#fef08a" fontSize="10" fontWeight="900">
              {activeJp ? '軽く揺らす' : '살짝 흔들기'}
            </text>

            {/* Fall Arrow */}
            <line x1="160" y1="125" x2="160" y2="170" stroke="#34d399" strokeWidth="3" strokeDasharray="3,2" />
            <polygon points="160,175 155,168 165,168" fill="#34d399" />

            <rect x="245" y="110" width="145" height="50" rx="8" fill="#047857" stroke="#34d399" strokeWidth="2" />
            <text x="317" y="132" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              {activeJp ? '✔ 直前の打数でホールイン！' : '✔ 직전 타수 홀인!'}
            </text>
            <text x="317" y="148" fill="#a7f3d0" fontSize="9" fontWeight="800" textAnchor="middle">
              {activeJp ? '底に接地で完全認定' : '바닥 착지 시 완벽 인정'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>✔ {activeJp ? '縁挟まりの処置手順:' : '림 끼임 처치 절차:'}</span>
            <span>{activeJp ? 'ピンを慎重に動かしボールがカップ底に落ちればホールイン認定！' : '깃대를 조심스럽게 움직여 공이 컵 바닥에 떨어지면 홀인 인정!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? '同伴者が見守る中でピンをまっすぐ立てるか軽く揺らしてボールをカップ底に落とします。底に落ちれば直前に打ったパットの打数で正規ホールアウトとなります。'
              : '동반자가 지켜보는 가운데 깃대를 똑바로 세우거나 가볍게 흔들어 공을 홀컵 바닥으로 떨어뜨립니다. 바닥에 떨어지면 방금 친 퍼팅 타수로 정상 홀아웃 처리됩니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [3] pg-3: 퍼팅선 잔디를 발로 밟아 누르거나 손으로 쓰는 행위
  if (ruleId === 'pg-3') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>👞</span>
            <span>{activeJp ? 'パットライン損傷・ライ改善禁止判定図' : '퍼팅 라인 훼손/개선 금지 판정도'}</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? 'プレーの線改善 2打付加' : '플레이 선 개선 2벌타'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#166534" />

            {/* Putting Ball */}
            <circle cx="70" cy="110" r="15" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />

            {/* Cup */}
            <ellipse cx="330" cy="110" rx="25" ry="12" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
            <line x1="330" y1="50" x2="330" y2="110" stroke="#f8fafc" strokeWidth="2.5" />
            <polygon points="330,50 305,60 330,70" fill="#ef4444" />

            {/* Putting Line */}
            <line x1="90" y1="110" x2="305" y2="110" stroke="#facc15" strokeWidth="2" strokeDasharray="5,3" />

            {/* Shoe stomping on putting line */}
            <g transform="translate(180, 85)">
              <rect x="0" y="0" width="50" height="25" rx="6" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
              <text x="25" y="40" fill="#fca5a5" fontSize="10" fontWeight="900" textAnchor="middle">
                {activeJp ? '足で踏んで平らにする' : '발로 꾹꾹 밟음'}
              </text>
            </g>

            {/* Giant Prohibition Symbol */}
            <circle cx="205" cy="100" r="42" fill="none" stroke="#dc2626" strokeWidth="6" opacity="0.85" />
            <line x1="175" y1="70" x2="235" y2="130" stroke="#dc2626" strokeWidth="6" opacity="0.85" />

            <rect x="120" y="165" width="160" height="42" rx="8" fill="#991b1b" stroke="#fca5a5" strokeWidth="1.5" />
            <text x="200" y="186" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              {activeJp ? '🚨 2打付加' : '🚨 2벌타 부과'}
            </text>
            <text x="200" y="198" fill="#fef08a" fontSize="8" fontWeight="800" textAnchor="middle">
              {activeJp ? '(ライおよびプレー線の平坦化禁止)' : '(라이 및 플레이 선 평탄화 금지)'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>🚫 {activeJp ? 'パット線改善禁止:' : '퍼팅선 개선 금지:'}</span>
            <span>{activeJp ? 'ボールとカップの間の芝を踏んで平らにすると2打付加です！' : '공과 홀컵 사이 잔디를 밟아 평평하게 만들면 2벌타입니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? 'パッティンググリーン上のボールの転がるラインを手で均したり靴で踏み固める行為はライ改善違反で2打付加となります。自然のありのままの状態でパットしなければなりません。'
              : '퍼팅 그린 위의 굴림 길을 손으로 문지르거나 신발로 밟아 다지는 행위는 라이 개선 규정 위반으로 2벌타가 부과됩니다. 자연 상태 그대로 퍼팅해야 합니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [4] pg-4: 그린 위에서 홀컵까지 거리를 발걸음으로 재는 행위 (보측 무벌)
  if (ruleId === 'pg-4') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>👣</span>
            <span>{activeJp ? '歩測(距離測定)判定図' : '발걸음 보측(거리 측정) 판정도'}</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '罰打なし (無罰)' : '벌타 없음 (무벌)'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#15803d" />

            {/* Footsteps pacing towards hole */}
            <circle cx="60" cy="110" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="60" y="140" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">
              {activeJp ? '自分の球' : '내 공'}
            </text>

            <ellipse cx="120" cy="110" rx="8" ry="14" fill="#334155" opacity="0.7" />
            <text x="120" y="135" fill="#fef08a" fontSize="9" fontWeight="800" textAnchor="middle">
              {activeJp ? '1歩' : '1보'}
            </text>

            <ellipse cx="180" cy="110" rx="8" ry="14" fill="#334155" opacity="0.7" />
            <text x="180" y="135" fill="#fef08a" fontSize="9" fontWeight="800" textAnchor="middle">
              {activeJp ? '2歩' : '2보'}
            </text>

            <ellipse cx="240" cy="110" rx="8" ry="14" fill="#334155" opacity="0.7" />
            <text x="240" y="135" fill="#fef08a" fontSize="9" fontWeight="800" textAnchor="middle">
              {activeJp ? '3歩' : '3보'}
            </text>

            <ellipse cx="320" cy="110" rx="25" ry="12" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
            <line x1="320" y1="50" x2="320" y2="110" stroke="#f8fafc" strokeWidth="2.5" />
            <polygon points="320,50 295,60 320,70" fill="#ef4444" />

            <rect x="110" y="30" width="180" height="45" rx="8" fill="#047857" stroke="#34d399" strokeWidth="2" />
            <text x="200" y="50" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              {activeJp ? '✔ 罰打なし (無罰)' : '✔ 벌타 없음 (무벌)'}
            </text>
            <text x="200" y="66" fill="#a7f3d0" fontSize="9" fontWeight="800" textAnchor="middle">
              {activeJp ? '迅速なプレー進行エチケット遵守' : '단, 신속 진행 에티켓 준수'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>👣 {activeJp ? '歩測による距離測定:' : '발걸음 거리 측정:'}</span>
            <span>{activeJp ? 'パット前に歩幅で距離を測る行為は規則上無罰です！' : '퍼팅 전 보폭으로 거리를 가늠하는 것은 규정상 무벌입니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? '歩数で距離を測ることは認められていますが、同伴者のプレー線を踏まないよう注意し、進行遅延を防ぐため素早く測らなければなりません。'
              : '발걸음으로 거리를 재는 것은 허용되나, 동반자의 플레이선을 밟지 않도록 주의해야 하며 경기 지연이 발생하지 않도록 빠르게 측정해야 합니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [5] pg-5: 깃대를 잡거나 뽑아놓고 퍼팅해도 되나요? (깃대 발거 금지 2벌타)
  if (ruleId === 'pg-5') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🚩</span>
            <span>{activeJp ? 'ピン抜脱禁止規則判定図' : '깃대 발거 금지 규정 판정도'}</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? 'ピンを抜いて打つと 2打付加' : '깃대 뽑고 치면 2벌타'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#15803d" />

            {/* Empty Hole Cup without Flag */}
            <ellipse cx="120" cy="110" rx="30" ry="14" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
            <text x="120" y="140" fill="#f87171" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? 'ピンの抜かれた空のカップ' : '깃대 뽑힌 빈 홀컵'}
            </text>

            {/* Removed Flagstick lying on grass */}
            <line x1="180" y1="90" x2="320" y2="130" stroke="#f8fafc" strokeWidth="4" />
            <polygon points="180,90 200,65 190,95" fill="#ef4444" />
            <text x="260" y="150" fill="#fca5a5" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? '芝の上に抜いて横倒し' : '바닥에 뽑아 눕혀둠'}
            </text>

            {/* Huge Red Prohibition */}
            <circle cx="200" cy="110" r="50" fill="none" stroke="#dc2626" strokeWidth="7" opacity="0.9" />
            <line x1="165" y1="75" x2="235" y2="145" stroke="#dc2626" strokeWidth="7" opacity="0.9" />

            <rect x="110" y="165" width="180" height="42" rx="8" fill="#991b1b" stroke="#fca5a5" strokeWidth="1.5" />
            <text x="200" y="186" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              {activeJp ? '🚨 2打付加' : '🚨 2벌타 부과'}
            </text>
            <text x="200" y="198" fill="#fef08a" fontSize="8" fontWeight="800" textAnchor="middle">
              {activeJp ? '(パークゴルフはピン維持義務)' : '(파크골프는 깃대 유지 의무)'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>🚫 {activeJp ? 'ピン抜脱禁止の絶対規則:' : '깃대 발거 금지 절대 수칙:'}</span>
            <span>{activeJp ? '一般ゴルフと異なり、パークゴルフはいかなる場合もピンを抜けません！' : '일반 골프와 달리 파크골프는 어떤 경우에도 깃대를 뽑을 수 없습니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? 'パークゴルフ規則上、ピンは常に立てた状態でプレーしなければなりません。ピンを持ったり抜いて打つと2打付加となります。'
              : '파크골프 규정상 깃대는 항상 꽂힌 상태로 플레이해야 합니다. 깃대를 잡고 퍼팅하거나 뽑아놓고 치면 2벌타가 부과됩니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [6] pg-6: 퍼팅 시 동반자 공에 맞을 것 같을 때 마크 요청 규정
  if (ruleId === 'pg-6') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🪙</span>
            <span>{activeJp ? 'マーク要求権および処置図' : '마크 요청 권리 및 처치도'}</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? 'マーク要求は正当な権利 (拒否不可)' : '마크 요청은 정당한 권리 (거부 불가)'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#15803d" />

            {/* Striker Ball */}
            <circle cx="60" cy="110" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="60" y="140" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">
              {activeJp ? '自分の球 (パット打者)' : '내 공 (퍼팅 타자)'}
            </text>

            {/* Companion's Ball blocking line */}
            <circle cx="190" cy="110" r="14" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="170" cy="110" r="8" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
            <text x="170" y="135" fill="#fef08a" fontSize="8" fontWeight="900" textAnchor="middle">
              {activeJp ? 'ボールマーカー密着' : '볼마커 밀착'}
            </text>

            {/* Speech Bubble */}
            <rect x="130" y="35" width="140" height="40" rx="8" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="200" y="55" fill="#0f172a" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? '「マークお願いします！」' : '"마크 부탁드립니다!"'}
            </text>
            <text x="200" y="68" fill="#059669" fontSize="8" fontWeight="800" textAnchor="middle">
              {activeJp ? '✔ 直ちに応じる義務' : '✔ 즉시 응해야 함'}
            </text>

            {/* Cup */}
            <ellipse cx="330" cy="110" rx="25" ry="12" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
            <line x1="330" y1="50" x2="330" y2="110" stroke="#f8fafc" strokeWidth="2" />
            <polygon points="330,50 305,60 330,70" fill="#ef4444" />

            <rect x="100" y="165" width="200" height="42" rx="8" fill="#065f46" stroke="#34d399" strokeWidth="1.5" />
            <text x="200" y="185" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              {activeJp ? '✔ プレーヤーの当然の権利' : '✔ 플레이어의 당연한 권리'}
            </text>
            <text x="200" y="198" fill="#a7f3d0" fontSize="8" fontWeight="800" textAnchor="middle">
              {activeJp ? '拒否時競技妨害 2打付加' : '거부 시 경기 방해 2벌타 부과 가능'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>🪙 {activeJp ? 'マーク要求の権利:' : '마크 요청 권리:'}</span>
            <span>{activeJp ? 'パットライン上に同伴者の球があればいつでもマークを要求できます！' : '퍼팅 경로에 동반자의 공이 있으면 언제든 마크를 요청할 수 있습니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? '要求を受けた同伴者は必ずボール直後にマーカーを密着して置いてから球を拾わなければなりません。正当なマーク要求は拒否できません。'
              : '요청을 받은 동반자는 반드시 공 바로 뒤에 볼마커를 밀착하여 놓은 뒤 공을 집어야 합니다. 정당한 마크 요구를 거부할 수 없습니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [7] pg-7: 홀컵 30cm 이내 짧은 탭인 퍼팅을 한 손으로 쳤을 때
  if (ruleId === 'pg-7') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>✋</span>
            <span>{activeJp ? '片手パッティング判定図' : '한 손 퍼팅 판정도'}</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '罰打なし (無罰認定)' : '벌타 없음 (무벌 허용)'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#15803d" />

            {/* Cup */}
            <ellipse cx="260" cy="130" rx="30" ry="14" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
            <line x1="260" y1="50" x2="260" y2="130" stroke="#f8fafc" strokeWidth="2.5" />
            <polygon points="260,50 230,62 260,75" fill="#ef4444" />

            {/* Ball 20cm away */}
            <circle cx="160" cy="130" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="210" y="115" fill="#facc15" fontSize="11" fontWeight="900" textAnchor="middle">
              {activeJp ? '20cmタップイン距離' : '20cm 탭인 거리'}
            </text>

            {/* One-handed Putter Grip Graphic */}
            <line x1="100" y1="40" x2="140" y2="130" stroke="#94a3b8" strokeWidth="5" />
            <rect x="135" y="120" width="18" height="22" rx="3" fill="#64748b" />
            <circle cx="100" cy="40" r="10" fill="#fde047" />
            <text x="100" y="25" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? '片手グリップ' : '한 손 그립'}
            </text>

            <rect x="110" y="165" width="180" height="42" rx="8" fill="#065f46" stroke="#34d399" strokeWidth="1.5" />
            <text x="200" y="185" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              {activeJp ? '✔ 罰打なし (無罰)' : '✔ 벌타 없음 (무벌)'}
            </text>
            <text x="200" y="198" fill="#a7f3d0" fontSize="8" fontWeight="800" textAnchor="middle">
              {activeJp ? '瞬間打撃なら片手でも有効' : '순간 정타 시 한 손 타격도 유효'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>✔ {activeJp ? 'グリップ方式は自由:' : '그립 방식 자유:'}</span>
            <span>{activeJp ? '押し出さず正規に打撃したなら片手パットも無罰です！' : '헤드로 밀어치지 않고 정상 타격했다면 한 손 퍼팅도 무벌입니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? '規則上、両手・片手のグリップ制限はありません。ただし片手で打つ場合でもヘッドでボールを押し出したりすくい上げる動作は禁止です。'
              : '규정상 양손이나 한 손 그립에 대한 제한은 없습니다. 단, 한 손으로 치더라도 헤드로 공을 밀어내거나 퍼올리는 동작 없이 순간 타격해야 합니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [8] pg-8: 공이 홀컵 바닥으로 들어갔다가 다시 밖으로 튀어나온 경우
  if (ruleId === 'pg-8') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🕳️</span>
            <span>{activeJp ? 'カップイン後跳ね出し判定図' : '홀컵 진입 후 리바운드 튀어나옴 판정도'}</span>
          </div>
          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? 'ホールイン不承認 ➔ 停止位置から次打' : '홀인 불인정 ➔ 멈춘 곳에서 다음 타'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#15803d" />

            {/* Cup */}
            <ellipse cx="180" cy="130" rx="35" ry="16" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
            <line x1="180" y1="40" x2="180" y2="130" stroke="#f8fafc" strokeWidth="2.5" />
            <polygon points="180,40 150,55 180,70" fill="#ef4444" />

            {/* Trajectory In and Out */}
            <path d="M 60 140 Q 140 100 178 135" stroke="#facc15" strokeWidth="3" fill="none" />
            <path d="M 180 135 Q 230 90 290 140" stroke="#ef4444" strokeWidth="3" strokeDasharray="3,3" fill="none" />

            {/* Rebound Ball Resting */}
            <circle cx="295" cy="142" r="14" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" />
            <text x="295" y="172" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? '外に飛び出して停止' : '밖으로 튀어나와 멈춤'}
            </text>

            <rect x="110" y="25" width="180" height="45" rx="8" fill="#065f46" stroke="#34d399" strokeWidth="2" />
            <text x="200" y="45" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              {activeJp ? 'ホールイン不承認 (無罰)' : '홀인 불인정 (무벌)'}
            </text>
            <text x="200" y="60" fill="#a7f3d0" fontSize="9" fontWeight="800" textAnchor="middle">
              {activeJp ? '底に完全に静止して認定' : '바닥에 완전히 멈춰야 인정'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-emerald-400 font-extrabold flex items-center gap-1">
            <span>🕳️ {activeJp ? '底面静止の原則:' : '바닥 정지 원칙:'}</span>
            <span>{activeJp ? 'カップに入った後に飛び出した球はホールインではありません！' : '홀컵에 들어갔다 다시 튀어나온 공은 홀인이 아닙니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? 'ホールアウトの公認基準はボール全体がカップ底に完全に静止した状態です。勢いよく入って底に当たって芝に飛び出した場合は、止まった位置から次打を打ちます。'
              : '홀아웃의 공인 기준은 공 전체가 홀컵 바닥에 완전히 정지한 상태입니다. 세게 들어가서 바닥을 치고 다시 잔디 위로 튀어나왔다면 멈춘 곳에서 다음 퍼팅을 해야 합니다.'}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
