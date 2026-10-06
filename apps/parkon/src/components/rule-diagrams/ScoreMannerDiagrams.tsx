'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface DiagramProps {
  ruleId: string;
  isJp?: boolean;
}

export function ScoreMannerDiagrams({ ruleId, isJp }: DiagramProps) {
  const { isJapanese } = useTranslation();
  const activeJp = isJp ?? isJapanese;

  // [1] sm-1: 스코어카드에 실제 타수보다 적게 적어 제출한 경우 (실제 4타 vs 적힌 3타 -> 실격 DISQUALIFIED!)
  if (ruleId === 'sm-1') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>📋</span>
            <span>{activeJp ? 'NPGA公認規則 第16条 スコアカード過少申告判定図' : '공인 규정 제45조 2항 스코어카드 오기 판정도'}</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
            {activeJp ? '過少申告提出時は即座に失格！' : '타수 축소 제출 시 즉시 실격!'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center p-2">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <defs>
              <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>
            </defs>

            {/* Background Desk */}
            <rect x="0" y="0" width="400" height="220" fill="#1c1917" />
            <rect x="15" y="15" width="370" height="190" rx="12" fill="#292524" stroke="#44403c" strokeWidth="1.5" />

            {/* Official Scorecard Layout */}
            <g transform="translate(30, 25)">
              <rect x="0" y="0" width="220" height="170" rx="6" fill="url(#cardGrad)" stroke="#cbd5e1" strokeWidth="2" />
              
              {/* Card Header */}
              <rect x="0" y="0" width="220" height="26" rx="6" fill="#0f172a" />
              <text x="110" y="17" fill="#ffffff" fontSize={activeJp ? "10" : "11"} fontWeight="900" textAnchor="middle">
                {activeJp ? '(公社)日本パークゴルフ協会 公認スコアカード' : '(사)대한파크골프협회 공인 스코어카드'}
              </text>
              <text x="12" y="38" fill="#334155" fontSize="9" fontWeight="800">
                {activeJp ? '選手名: パーキー (A組 1番)' : '선수명: 박파키 (A조 1번)'}
              </text>

              {/* Table Header */}
              <rect x="8" y="44" width="204" height="20" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
              <text x="35" y="58" fill="#0f172a" fontSize="9" fontWeight="900" textAnchor="middle">
                {activeJp ? 'ホール番号' : '홀 번호'}
              </text>
              <text x="80" y="58" fill="#0f172a" fontSize="9" fontWeight="900" textAnchor="middle">
                {activeJp ? '基準(Par)' : '기준(Par)'}
              </text>
              <text x="140" y="58" fill="#0f172a" fontSize="9" fontWeight="900" textAnchor="middle">
                {activeJp ? '実際の打数' : '실제 친 타수'}
              </text>
              <text x="188" y="58" fill="#b91c1c" fontSize="9" fontWeight="900" textAnchor="middle">
                {activeJp ? '記載打数' : '기재 타수'}
              </text>

              {/* Row 1: 1번홀 Par 4 */}
              <rect x="8" y="64" width="204" height="42" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
              <text x="35" y="88" fill="#0f172a" fontSize="11" fontWeight="800" textAnchor="middle">
                {activeJp ? '1番ホール' : '1번 홀'}
              </text>
              <text x="80" y="88" fill="#475569" fontSize="11" fontWeight="800" textAnchor="middle">Par 4</text>
              
              {/* Actual strokes: 4 */}
              <text x="140" y="83" fill="#047857" fontSize="13" fontWeight="900" textAnchor="middle">
                {activeJp ? '4打' : '4타'}
              </text>
              <text x="140" y="97" fill="#15803d" fontSize="8" fontWeight="700" textAnchor="middle">
                {activeJp ? '(実際の打数)' : '(실제 친 타수)'}
              </text>

              {/* Wrongly written strokes: 3 */}
              <circle cx="188" cy="85" r="14" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" />
              <text x="188" y="90" fill="#dc2626" fontSize="15" fontWeight="900" textAnchor="middle">3</text>
              
              {/* Red ink correction / alert note */}
              <line x1="174" y1="99" x2="202" y2="71" stroke="#dc2626" strokeWidth="2.5" />
              <text x="188" y="104" fill="#b91c1c" fontSize="7" fontWeight="900" textAnchor="middle">
                {activeJp ? '過少記載発覚' : '축소 기재 적발'}
              </text>

              {/* Total & Signature box */}
              <rect x="8" y="112" width="204" height="48" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
              <text x="16" y="127" fill="#64748b" fontSize="8" fontWeight="700">
                {activeJp ? 'マーカー署名: 山田同伴 (印)' : '마커 서명: 김동반 (인)'}
              </text>
              <text x="16" y="142" fill="#64748b" fontSize="8" fontWeight="700">
                {activeJp ? '本人確認署名完了後、本部へ提出' : '본인 확인 서명 완료 후 본부 제출됨'}
              </text>
            </g>

            {/* Right side: Giant Red "실격 (DISQUALIFIED)" Stamp */}
            <g transform="translate(265, 35)">
              <rect x="0" y="0" width="115" height="150" rx="8" fill="#450a0a" stroke="#b91c1c" strokeWidth="2" opacity="0.8" />
              
              <g transform="rotate(-15 55 75)">
                <rect x="2" y="32" width="106" height="52" rx="8" fill="#dc2626" stroke="#ffffff" strokeWidth="3" />
                <text x="55" y="58" fill="#ffffff" fontSize="17" fontWeight="900" textAnchor="middle">
                  {activeJp ? '失 格' : '실 격'}
                </text>
                <text x="55" y="74" fill="#fef08a" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="1">
                  DISQUALIFIED
                </text>
              </g>

              <text x="58" y="115" fill="#fca5a5" fontSize="10" fontWeight="900" textAnchor="middle">
                {activeJp ? '第16条第2項違反' : '제45조 제2항 위반'}
              </text>
              <text x="58" y="132" fill="#fecaca" fontSize="9" fontWeight="700" textAnchor="middle">
                {activeJp ? '直ちに競技退場' : '즉시 경기 퇴장'}
              </text>
            </g>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>🚨 {activeJp ? 'スコア過少記載の絶対禁止:' : '스코어 축소 기재 절대 금지:'}</span>
            <span>{activeJp ? '実際4打打ったのに3打と書いて提出したら即座に失格です！' : '실제 4타를 쳤는데 3타로 적어 제출하면 즉시 실격!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? '実際より少なく書かれたスコアカードに署名して本部へ提出すると、故意・過失を問わず即座に失格(DQ)となります。逆に多く書いた場合はその多い打数で認められます。'
              : '실제보다 적게 적힌 스코어카드에 서명하여 본부에 제출하면 고의 여부와 무관하게 즉시 실격(DQ) 처리됩니다. 반대로 실제보다 많게 적어 낸 경우에는 적힌 높은 타수 그대로 인정됩니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [2] sm-2: 타수 카운트 시 부과된 벌타를 누락하고 적었을 때
  if (ruleId === 'sm-2') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>⚠️</span>
            <span>{activeJp ? '罰打脱漏・隠蔽時の加重処罰判定図' : '벌타 누락/은폐 시 가중 처벌 판정도'}</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '2打付加追加または故意時失格' : '2벌타 추가 또는 고의 실격'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#1c1917" />
            
            {/* Calculation Box */}
            <rect x="25" y="25" width="210" height="170" rx="10" fill="#292524" stroke="#57534e" strokeWidth="1.5" />
            <text x="130" y="50" fill="#38bdf8" fontSize="12" fontWeight="900" textAnchor="middle">
              {activeJp ? '実際の打数 精密合算' : '실제 타수 정밀 합산'}
            </text>

            <rect x="40" y="65" width="180" height="26" rx="6" fill="#1e293b" />
            <text x="50" y="82" fill="#cbd5e1" fontSize="11" fontWeight="800">
              {activeJp ? 'ストローク: 3回打撃' : '스트로크: 3회 타격'}
            </text>
            <text x="205" y="82" fill="#38bdf8" fontSize="12" fontWeight="900" textAnchor="end">
              {activeJp ? '3打' : '3타'}
            </text>

            <rect x="40" y="98" width="180" height="26" rx="6" fill="#450a0a" stroke="#b91c1c" strokeWidth="1" />
            <text x="50" y="115" fill="#fca5a5" fontSize="11" fontWeight="800">
              {activeJp ? 'OB発生の罰打: +2打付加' : 'OB 발생 벌타: +2벌타'}
            </text>
            <text x="205" y="115" fill="#ef4444" fontSize="12" fontWeight="900" textAnchor="end">
              {activeJp ? '+2打' : '+2타'}
            </text>

            <line x1="40" y1="133" x2="220" y2="133" stroke="#78716c" strokeWidth="1.5" strokeDasharray="3,3" />
            <text x="50" y="152" fill="#ffffff" fontSize="12" fontWeight="900">
              {activeJp ? '正規トータルスコア' : '정상 총 스코어'}
            </text>
            <text x="205" y="155" fill="#facc15" fontSize="16" fontWeight="900" textAnchor="end">
              {activeJp ? '5打' : '5타'}
            </text>

            {/* False Speech Bubble */}
            <g transform="translate(250, 25)">
              <rect x="0" y="0" width="125" height="75" rx="10" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
              <text x="62" y="26" fill="#0f172a" fontSize="11" fontWeight="900" textAnchor="middle">
                {activeJp ? 'プレーヤー発言' : '플레이어 발언'}
              </text>
              <text x="62" y="48" fill="#dc2626" fontSize="13" fontWeight="900" textAnchor="middle">
                {activeJp ? '「私3打でした！」' : '"저 3타 쳤어요!"'}
              </text>
              <text x="62" y="64" fill="#64748b" fontSize="8" fontWeight="700" textAnchor="middle">
                {activeJp ? '(2打付加を故意に脱漏)' : '(2벌타 고의 누락)'}
              </text>
              
              <rect x="0" y="90" width="125" height="75" rx="10" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2" />
              <text x="62" y="115" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">
                {activeJp ? 'ペナルティ判定' : '징계 판정'}
              </text>
              <text x="62" y="135" fill="#fef08a" fontSize="12" fontWeight="900" textAnchor="middle">
                {activeJp ? '+2打付加' : '+2벌타 가산'}
              </text>
              <text x="62" y="153" fill="#fca5a5" fontSize="9" fontWeight="800" textAnchor="middle">
                {activeJp ? '隠蔽発覚時は失格' : '은폐 적발 시 실격'}
              </text>
            </g>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-amber-400 font-extrabold flex items-center gap-1">
            <span>📢 {activeJp ? '罰打申告の義務:' : '벌타 알림 의무:'}</span>
            <span>{activeJp ? 'ホールアウト後に打数をコールする際は必ず罰打を含めなければなりません！' : '홀아웃 후 타수를 부를 때는 반드시 벌타를 포함해야 합니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? 'OBやハザードの罰打を意図的に除外して申告すると2打付加が追加され、悪質なスコア隠蔽と判断された場合は競技委員会の権限で即時失格となります。'
              : 'OB나 해저드 벌타를 고의로 빼놓고 타수를 말하면 2벌타가 추가 부과되며, 고의적인 스코어 은폐 행위로 확인되면 경기위원회 권한으로 즉시 실격됩니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [3] sm-3: 동반자가 샷을 할 때 큰 소리로 잡담하거나 시야 방해
  if (ruleId === 'sm-3') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🤫</span>
            <span>{activeJp ? 'アドレス中の妨害エチケット違反判定図' : '어드레스 중 방해 에티켓 위반 판정도'}</span>
          </div>
          <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '1回目警告 / 繰り返せば2打付加' : '1차 경고 / 반복 시 2벌타'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#14532d" />
            
            {/* Putting Green Area */}
            <ellipse cx="200" cy="150" rx="180" ry="60" fill="#16a34a" stroke="#22c55e" strokeWidth="2" />
            
            {/* Golfer Concentrating on Putt */}
            <circle cx="100" cy="100" r="16" fill="#fde047" />
            <rect x="94" y="116" width="12" height="35" fill="#3b82f6" rx="4" />
            <line x1="100" y1="130" x2="80" y2="155" stroke="#94a3b8" strokeWidth="3" />
            <circle cx="75" cy="155" r="7" fill="#f97316" />
            <text x="100" y="75" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? '集中アドレス中' : '집중 어드레스 중'}
            </text>

            {/* Disturber Standing in Front / Making Noise */}
            <circle cx="280" cy="100" r="16" fill="#ef4444" />
            <rect x="274" y="116" width="12" height="35" fill="#dc2626" rx="4" />
            
            {/* Phone Noise Sound Waves */}
            <path d="M 305 95 Q 320 90 325 75" stroke="#facc15" strokeWidth="3" fill="none" />
            <path d="M 315 105 Q 335 100 345 85" stroke="#facc15" strokeWidth="3" fill="none" />
            <rect x="250" y="35" width="135" height="32" rx="8" fill="#7f1d1d" stroke="#fca5a5" strokeWidth="1.5" />
            <text x="317" y="55" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
              {activeJp ? '📢 通話音 / 視界正面の妨害！' : '📢 통화음 / 시야 정면 방해!'}
            </text>

            <rect x="130" y="175" width="140" height="32" rx="8" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <text x="200" y="195" fill="#fde047" fontSize="11" fontWeight="900" textAnchor="middle">
              {activeJp ? '🚫 1回目警告 ➔ 2打付加' : '🚫 1차 경고 ➔ 2벌타 부과'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-amber-400 font-extrabold flex items-center gap-1">
            <span>🤫 {activeJp ? '競技マナー規則:' : '경기 매너 수칙:'}</span>
            <span>{activeJp ? '同伴者がアドレスに入ったら動いたり物音を立ててはいけません！' : '동반자가 어드레스에 들어가면 움직이거나 소리를 내선 안 됩니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? '同伴者のパットまたはスイングの視界正面に立ったり大声で通話するなど集中を妨げると1回目の警告、継続時は2打付加が科されます。'
              : '동반자의 퍼팅 또는 스윙 시야 정면에 서 있거나 큰 소리로 통화하는 등 집중을 방해하면 1차 경고가 주어지며, 지속될 시 2벌타가 부과됩니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [4] sm-4: 경기 중 허가되지 않은 전자기기(거리측정기) 사용
  if (ruleId === 'sm-4') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🔭</span>
            <span>{activeJp ? '電子機器距離測定器の使用禁止規則' : '전자기기 거리측정기 사용 금지 규정'}</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '公式競技 2打付加 (再違反時は失格)' : '공식 경기 2벌타 (재차 적발 시 실격)'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#1e293b" />

            {/* Laser Rangefinder Device Graphic */}
            <rect x="60" y="55" width="130" height="90" rx="16" fill="#334155" stroke="#64748b" strokeWidth="3" />
            <rect x="170" y="75" width="30" height="40" rx="6" fill="#0f172a" />
            <circle cx="185" cy="95" r="12" fill="#38bdf8" opacity="0.8" />
            <rect x="80" y="70" width="40" height="30" rx="4" fill="#0284c7" />
            <text x="100" y="90" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">58m</text>

            {/* Laser Beam with Prohibited Cross */}
            <line x1="200" y1="95" x2="330" y2="95" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5,3" />
            <circle cx="330" cy="95" r="18" fill="#15803d" />
            <line x1="330" y1="65" x2="330" y2="105" stroke="#ffffff" strokeWidth="3" />
            <polygon points="330,65 315,75 330,85" fill="#dc2626" />

            {/* Giant Prohibition Symbol */}
            <circle cx="130" cy="100" r="52" fill="none" stroke="#dc2626" strokeWidth="8" opacity="0.9" />
            <line x1="93" y1="63" x2="167" y2="137" stroke="#dc2626" strokeWidth="8" opacity="0.9" />

            <rect x="230" y="145" width="150" height="42" rx="10" fill="#991b1b" stroke="#fca5a5" strokeWidth="2" />
            <text x="305" y="166" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              {activeJp ? '🚫 2打付加' : '🚫 2벌타 부과'}
            </text>
            <text x="305" y="180" fill="#fef08a" fontSize={activeJp ? "8" : "9"} fontWeight="800" textAnchor="middle">
              {activeJp ? '(日本パークゴルフ協会 公認禁止)' : '(대한파크골프협회 공인 금지)'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>🚫 {activeJp ? '電子機器補助の禁止:' : '전자기기 보조 금지:'}</span>
            <span>{activeJp ? '公認大会ではレーザーおよびGPS距離測定器の使用が禁止されています！' : '공인 대회에서는 레이저 및 GPS 거리측정기 사용이 금지됩니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? '距離の測定はコースの案内標識や目測のみで行わなければなりません。公式大会で電子機器を使用すると2打付加、再度の違反で失格となります。'
              : '거리 판별은 코스 푯말이나 육안으로만 판단해야 합니다. 공식 대회에서 전자기기를 사용할 경우 2벌타가 부과되며 재차 위반 시 실격 처리됩니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [5] sm-5: 협회 공인 스티커가 없는 미인증 클럽/볼 사용
  if (ruleId === 'sm-5') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🏷️</span>
            <span>{activeJp ? 'NPGA公認認証シールの有無判定図' : 'KPGA 공인 인증 스티커 유무 판정도'}</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '未認証用具使用時は即座に失格！' : '미인증 용구 사용 즉시 실격!'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#1c1917" />

            {/* Certified Club Head (Left) */}
            <g transform="translate(30, 30)">
              <rect x="0" y="0" width="155" height="155" rx="12" fill="#1e293b" stroke="#059669" strokeWidth="2" />
              <text x="77" y="24" fill="#34d399" fontSize="11" fontWeight="900" textAnchor="middle">
                {activeJp ? '✔ 公認合格クラブ' : '✔ 공인 합격 클럽'}
              </text>
              
              {/* Club Drawing */}
              <rect x="35" y="45" width="85" height="40" rx="8" fill="#78350f" stroke="#b45309" strokeWidth="2" />
              
              {/* Green Official Hologram Sticker */}
              <rect x="55" y="52" width="45" height="24" rx="4" fill="#047857" stroke="#34d399" strokeWidth="1.5" />
              <text x="77" y="65" fill="#fef08a" fontSize="8" fontWeight="900" textAnchor="middle">
                {activeJp ? 'NPGA公認' : 'KPGA 공인'}
              </text>
              <text x="77" y="73" fill="#ffffff" fontSize="6" fontWeight="800" textAnchor="middle">
                {activeJp ? '認証合格証' : '인증 합격필증'}
              </text>

              <rect x="25" y="110" width="105" height="28" rx="6" fill="#065f46" />
              <text x="77" y="128" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">
                {activeJp ? '正規出場許可' : '정상 출전 허용'}
              </text>
            </g>

            {/* Uncertified Club Head (Right) */}
            <g transform="translate(215, 30)">
              <rect x="0" y="0" width="155" height="155" rx="12" fill="#1e293b" stroke="#dc2626" strokeWidth="2" />
              <text x="77" y="24" fill="#f87171" fontSize="11" fontWeight="900" textAnchor="middle">
                {activeJp ? '❌ 未認証不法クラブ' : '❌ 미인증 불법 클럽'}
              </text>
              
              <rect x="35" y="45" width="85" height="40" rx="8" fill="#52525b" stroke="#71717a" strokeWidth="2" />
              <text x="77" y="68" fill="#ef4444" fontSize="9" fontWeight="900" textAnchor="middle">
                {activeJp ? 'シールなし (NO)' : '스티커 없음(NO)'}
              </text>

              <rect x="25" y="110" width="105" height="28" rx="6" fill="#991b1b" stroke="#ef4444" strokeWidth="1.5" />
              <text x="77" y="128" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle">
                {activeJp ? '🚨 即座に失格 (DQ)' : '🚨 즉시 실격 (DQ)'}
              </text>
            </g>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>🏷️ {activeJp ? '公認シール貼付の義務:' : '공인 스티커 부착 필수:'}</span>
            <span>{activeJp ? '(公社)日本パークゴルフ協会の合格シールがない用具は失格対象です！' : '(사)대한파크골프협회 합격 스티커가 없는 용구는 실격 대상입니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? 'すべての公式大会では事前用具検査を実施しており、公認シールが破損・未貼付のクラブや規格外ボールを使用した場合、即座に失格となります。'
              : '모든 공식 대회에서는 사전 용구 검사를 실시하며, 공인 스티커가 훼손되거나 부착되지 않은 클럽 및 규격 외 공을 사용할 경우 즉시 실격 처리됩니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [6] sm-6: 지정된 출발 티타임 시간을 넘겨 지각 도착한 경우
  if (ruleId === 'sm-6') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>⏰</span>
            <span>{activeJp ? 'スタートティータイム遅刻基準時間表' : '출발 티타임 지각 기준 시간표'}</span>
          </div>
          <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '5分以内 2打付加 / 5分超過で失格' : '5분 이내 2벌타 / 5분 초과 실격'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#0f172a" />

            {/* Timeline Bar */}
            <rect x="40" y="60" width="320" height="20" rx="10" fill="#334155" />
            <rect x="40" y="60" width="160" height="20" rx="10" fill="#f59e0b" />
            <rect x="200" y="60" width="160" height="20" rx="10" fill="#dc2626" />

            {/* Points on Timeline */}
            <circle cx="40" cy="70" r="12" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
            <text x="40" y="105" fill="#34d399" fontSize="11" fontWeight="900" textAnchor="middle">
              {activeJp ? '定刻スタート' : '정시 출발'}
            </text>
            <text x="40" y="118" fill="#94a3b8" fontSize="9" fontWeight="700" textAnchor="middle">09:00:00</text>

            <circle cx="200" cy="70" r="12" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
            <text x="200" y="105" fill="#fcd34d" fontSize="11" fontWeight="900" textAnchor="middle">
              {activeJp ? '5分遅刻ライン' : '5분 지각선'}
            </text>
            <text x="200" y="118" fill="#94a3b8" fontSize="9" fontWeight="700" textAnchor="middle">09:05:00</text>

            {/* Zone A: Under 5 mins */}
            <rect x="45" y="135" width="145" height="55" rx="8" fill="#78350f" stroke="#d97706" strokeWidth="1.5" />
            <text x="117" y="157" fill="#fef08a" fontSize="11" fontWeight="900" textAnchor="middle">
              {activeJp ? '5分以内に到着' : '5분 이내 도착'}
            </text>
            <text x="117" y="176" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">
              {activeJp ? '1番ホール2打付加で参加' : '1번 홀 2벌타 참가'}
            </text>

            {/* Zone B: Over 5 mins */}
            <rect x="210" y="135" width="145" height="55" rx="8" fill="#450a0a" stroke="#ef4444" strokeWidth="1.5" />
            <text x="282" y="157" fill="#fca5a5" fontSize="11" fontWeight="900" textAnchor="middle">
              {activeJp ? '5分超過で到着' : '5분 초과 도착'}
            </text>
            <text x="282" y="176" fill="#fef2f2" fontSize="14" fontWeight="900" textAnchor="middle">
              {activeJp ? '即座に失格 (DQ)' : '즉시 실격 (DQ)'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-amber-400 font-extrabold flex items-center gap-1">
            <span>⏰ {activeJp ? '定刻ティーオフの原則:' : '정시 티오프 원칙:'}</span>
            <span>{activeJp ? '指定ティータイムの10分前にはティーボックスに待機しなければなりません！' : '지정된 티타임 10분 전까지는 티박스에 대기해야 합니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? '5分以内の遅刻時は1番ホールに2打付加を受けて競技に合流できますが、5分を1秒でも過ぎると理由を問わず失格となります。'
              : '5분 이내 지각 시에는 1번 홀에 2벌타를 부여받고 경기에 합류할 수 있으나, 5분을 1초라도 넘기면 이유 불문 실격 처리됩니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [7] sm-7: 홀아웃 완료하지 않고 다음 홀로 넘어가 티샷한 경우 (OK / 컨시드 없음)
  if (ruleId === 'sm-7') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🕳️</span>
            <span>{activeJp ? 'コンシード(OK)不可・未ホールアウト判定図' : '컨시드(OK) 불가 및 홀아웃 미완료 판정도'}</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? 'パークゴルフにOKなし ➔ 失格！' : '파크골프 컨시드 없음 ➔ 실격!'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#14532d" />

            {/* Hole Cup */}
            <ellipse cx="140" cy="140" rx="40" ry="18" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
            <line x1="140" y1="50" x2="140" y2="140" stroke="#f8fafc" strokeWidth="3" />
            <polygon points="140,50 100,65 140,80" fill="#ef4444" />

            {/* Ball 5cm away from cup */}
            <circle cx="215" cy="140" r="16" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
            
            {/* OK Bubble with Red Cross */}
            <rect x="180" y="45" width="130" height="50" rx="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
            <text x="245" y="68" fill="#dc2626" fontSize="13" fontWeight="900" textAnchor="middle">
              {activeJp ? '「OK！コンシード！」' : '"OK! 컨시드!"'}
            </text>
            <text x="245" y="85" fill="#64748b" fontSize="9" fontWeight="700" textAnchor="middle">
              {activeJp ? '(勝手に拾って次ホールへ)' : '(임의로 집고 다음 홀 이동)'}
            </text>

            <line x1="175" y1="40" x2="315" y2="100" stroke="#dc2626" strokeWidth="4" />

            <rect x="100" y="175" width="200" height="34" rx="8" fill="#991b1b" stroke="#fca5a5" strokeWidth="2" />
            <text x="200" y="196" fill="#ffffff" fontSize="13" fontWeight="900" textAnchor="middle">
              {activeJp ? '❌ 未ホールアウトで失格 (DQ)' : '❌ 홀아웃 미완료로 실격 (DQ)'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>🚫 {activeJp ? 'パークゴルフにはコンシードがありません:' : '파크골프는 컨시드가 없습니다:'}</span>
            <span>{activeJp ? 'ボールがカップの底に完全に落ちて初めてホールアウト認定！' : '공이 홀컵 바닥으로 완전히 떨어져야만 홀아웃 인정!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? 'カップのすぐ横5cmにあっても必ずパットしてカップインしなければなりません。同伴者のOKを受けて次ホールのティーショットを打つと即時失格となります。'
              : '홀컵 바로 옆 5cm에 공이 있더라도 반드시 쳐서 홀에 넣어야 합니다. 동반자의 임의 컨시드를 받고 다음 홀 티샷을 하면 홀아웃 미완료로 즉시 실격됩니다.'}
          </p>
        </div>
      </div>
    );
  }

  // [8] sm-8: 공식 경기위원의 룰 판정에 불복하여 경기 진행 거부
  if (ruleId === 'sm-8') {
    return (
      <div className="w-full bg-stone-900 rounded-2xl overflow-hidden border-2 border-red-500/80 shadow-md p-3 text-white space-y-2">
        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
            <span>🛑</span>
            <span>{activeJp ? '競技委員判定服従義務および処分図' : '경기위원 판정 승복 의무 및 처분도'}</span>
          </div>
          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
            {activeJp ? '判定不服時は即座に失格・退場' : '판정 불복 시 즉시 실격 및 퇴장'}
          </span>
        </div>

        <div className="relative w-full aspect-[16/9] bg-stone-950 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center">
          <svg viewBox="0 0 400 220" className="w-full h-full">
            <rect x="0" y="0" width="400" height="220" fill="#1e293b" />

            {/* Referee Graphic */}
            <circle cx="120" cy="85" r="24" fill="#facc15" />
            <rect x="105" y="112" width="30" height="50" rx="6" fill="#0f172a" stroke="#f8fafc" strokeWidth="2" />
            <text x="120" y="50" fill="#ffffff" fontSize="12" fontWeight="900" textAnchor="middle">
              {activeJp ? '公認競技委員' : '공인 경기위원'}
            </text>

            {/* Whistle / Red Card */}
            <rect x="155" y="80" width="25" height="38" rx="4" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
            <text x="167" y="105" fill="#ffffff" fontSize="10" fontWeight="900" textAnchor="middle">DQ</text>

            {/* Result Box */}
            <rect x="215" y="55" width="165" height="110" rx="10" fill="#450a0a" stroke="#dc2626" strokeWidth="2" />
            <text x="297" y="85" fill="#fca5a5" fontSize="11" fontWeight="800" textAnchor="middle">
              {activeJp ? '第18条 判定不服' : '제55조 판정 불복'}
            </text>
            <text x="297" y="115" fill="#ffffff" fontSize="16" fontWeight="900" textAnchor="middle">
              {activeJp ? '即時失格および退場' : '즉각 실격 및 퇴장'}
            </text>
            <text x="297" y="140" fill="#fef08a" fontSize="9" fontWeight="800" textAnchor="middle">
              {activeJp ? '競技妨害行為の厳罰' : '경기 방해 행위 엄벌'}
            </text>
          </svg>
        </div>

        <div className="bg-stone-800/90 rounded-xl p-2.5 text-xs text-stone-200 font-bold space-y-1">
          <div className="text-red-400 font-extrabold flex items-center gap-1">
            <span>⚖️ {activeJp ? '審判判定の最終性:' : '심판 판정의 최종성:'}</span>
            <span>{activeJp ? '競技委員の現地ルール判定は最終的であり絶対的です！' : '경기위원의 현장 룰 판정은 최종적이며 절대적입니다!'}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed break-keep">
            {activeJp
              ? '判定に不満を抱きプレーを中断したりコースを占拠して他組の進行を妨げた場合、即座に失格および競技場退場処分となります。'
              : '판정에 불만을 품고 경기를 중단하거나 고의로 코스를 점거하여 다른 조의 진행을 방해할 경우 즉시 실격 및 경기장 퇴장 조치가 내려집니다.'}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
