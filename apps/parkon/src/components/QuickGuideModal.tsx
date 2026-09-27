'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, CheckCircle2, AlertTriangle, Coffee, ArrowRight, Sparkles, Smartphone, Users, ChevronRight, RotateCcw, ShieldCheck } from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeCourseId?: string;
}

export function QuickGuideModal({ isOpen, onClose, homeCourseId }: QuickGuideModalProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<number>(1);

  if (!isOpen) return null;

  const handleStartTrialRound = () => {
    onClose();
    router.push(`/round/new?courseId=${homeCourseId || ''}&mode=trial`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-stone-900 text-stone-100 rounded-3xl w-full max-w-md shadow-2xl border-2 border-emerald-500/50 overflow-hidden flex flex-col max-h-[92vh]">
        {/* 상단 헤더 */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-4 flex items-center justify-between shrink-0 border-b border-emerald-600/40">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-black text-sm shadow-md">
              💡
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-base text-white tracking-tight">파크온 1초 초간단 설명서</h3>
                <span className="bg-amber-400/90 text-stone-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                  필독 가이드
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                종이 카드 없이 스마트폰으로 1초 타수 & 실시간 동기화
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1 rounded-xl cursor-pointer hover:bg-emerald-600/50 transition active:scale-95"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4단계 스텝 탭 버튼 */}
        <div className="grid grid-cols-4 bg-stone-950 p-1.5 gap-1 shrink-0 border-b border-stone-800 text-[11px] font-black">
          {[
            { id: 1, icon: '🏌️', label: '1. 제원 확인' },
            { id: 2, icon: '⛳', label: '2. 게임 진행' },
            { id: 3, icon: '📱', label: '3. 실시간 공유' },
            { id: 4, icon: '⭐', label: '4. 꿀팁/체험' },
          ].map((tab) => {
            const isActive = activeStep === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStep(tab.id)}
                className={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-stone-950 shadow-md font-black scale-[1.02]'
                    : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <span className="text-xs">{tab.icon}</span>
                <span className="leading-tight truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 바디 콘텐츠 (스크롤 가능) */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-stone-200">
          {/* STEP 1: 티박스 스타트 전 제원 확인 */}
          {activeStep === 1 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 flex items-start gap-2.5">
                <span className="text-xl">🏌️‍♂️</span>
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-300">
                    1단계: 티박스 스타트 전 홀과 제원을 확인하세요
                  </h4>
                  <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                    홀과 제원을 확인하신 후 라운드를 시작(확인)하시면, 점수를 매기는 <strong className="text-amber-300">스코어보드판(타수 입력창)으로 바로 이동</strong>합니다.
                  </p>
                </div>
              </div>

              {/* 전광판 목업 (예시 박스) */}
              <div className="bg-stone-950 rounded-2xl p-4 border border-stone-800 shadow-inner space-y-2">
                <div className="flex items-center justify-between text-[11px] text-stone-400 font-bold px-1">
                  <span>💡 [화면 예시] 코스 전광판</span>
                  <span className="text-amber-400 font-bold">티박스 팻말과 일치 확인</span>
                </div>

                <div className="flex items-center justify-between bg-stone-900 rounded-xl p-3.5 border border-stone-800">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-400">A-3 홀</span>
                    <span className="text-xs font-bold text-stone-300 bg-stone-800 px-2 py-0.5 rounded border border-stone-700">
                      Par 4
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-300">65</span>
                    <span className="text-sm font-bold text-stone-400 ml-0.5">m</span>
                  </div>
                </div>
              </div>

              {/* 핵심 요약 체크리스트 (팻말 거리 확인) */}
              <div className="space-y-2 bg-stone-950/70 p-3 rounded-2xl border border-stone-800/80 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>팻말 거리 확인:</strong> 티박스 공식 팻말의 거리(m)와 Par를 확인합니다.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>현장 제원 수정:</strong> 팻말과 거리가 다르면 <strong>[✏️ 제원 수정]</strong>을 눌러 즉시 고칠 수 있습니다.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: 게임 진행 & 타수·OB 입력 */}
          {activeStep === 2 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 flex items-start gap-2.5">
                <span className="text-xl">⛳</span>
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-300">
                    2단계: 게임 중 타수 입력 (OB 등)
                  </h4>
                  <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                    선수별 타수와 OB를 확인하고, 스마트폰으로 간편하게 <strong className="text-amber-300">타수를 톡톡 터치</strong>하세요.
                  </p>
                </div>
              </div>

              {/* 스코어 입력창 목업 (예시 박스) */}
              <div className="bg-stone-950 rounded-2xl p-3.5 border border-stone-800 shadow-inner space-y-2">
                <div className="flex items-center justify-between text-[11px] text-stone-400 font-bold px-1">
                  <span>💡 [화면 예시] 스코어 입력창</span>
                  <span className="text-amber-400 font-bold">1초 원터치 기입</span>
                </div>

                <div className="flex items-center justify-between bg-stone-900 p-2.5 rounded-xl border border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-stone-950 font-black text-xs flex items-center justify-center">1</span>
                    <span className="font-black text-sm text-white">김대표 (나)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="w-8 h-8 rounded-lg bg-stone-800 text-white font-black text-base">-</button>
                    <span className="w-8 text-center text-lg font-black text-emerald-400">4</span>
                    <button type="button" className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-base">+</button>
                    <button type="button" className="px-2 py-1 rounded-lg bg-rose-600/80 text-white text-[11px] font-black border border-rose-400">
                      OB +2
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-stone-900/60 p-2.5 rounded-xl border border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-stone-700 text-stone-300 font-bold text-xs flex items-center justify-center">2</span>
                    <span className="font-bold text-sm text-stone-300">이동반</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400 bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1">
                      <Coffee className="w-3 h-3" /> 잠시 빠짐 (휴식)
                    </span>
                  </div>
                </div>
              </div>

              {/* 핵심 요약 체크리스트 */}
              <div className="space-y-2 bg-stone-950/70 p-3 rounded-2xl border border-stone-800/80 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>원터치 타수 기입:</strong> `+`와 `-` 버튼으로 선수별 최종 타수를 맞춥니다.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>[OB +2] 독립 버튼:</strong> 백색선을 벗어나 OB가 난 선수는 빨간 버튼만 누르면 2벌타 자동 합산!</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>[☕ 잠시 빠짐]:</strong> 화장실 가거나 1홀 쉴 땐 버튼 터치! 나머지 동반자만 정상 진행됩니다.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: 실시간 공유 & 전광판 */}
          {activeStep === 3 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 flex items-start gap-2.5">
                <span className="text-xl">📱</span>
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-300">3단계: 조장 1명 입력 ➔ 전원 실시간 동기화</h4>
                  <p className="text-xs text-stone-300 mt-0.5">
                    동반자 4명이 번거롭게 다 적을 필요 없이, <strong className="text-amber-300">조장 한 명만 입력</strong>하면 끝납니다!
                  </p>
                </div>
              </div>

              {/* 동기화 전광판 목업 */}
              <div className="bg-stone-950 rounded-2xl p-4 border border-stone-800 shadow-inner space-y-3">
                <div className="flex items-center justify-around text-center py-2">
                  <div className="flex flex-col items-center">
                    <Smartphone className="w-8 h-8 text-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-black text-emerald-300 mt-1">조장 스마트폰</span>
                    <span className="text-[10px] text-stone-400">타수 입력</span>
                  </div>
                  <div className="flex flex-col items-center text-amber-400">
                    <span className="text-xs font-black">실시간 자동 반영</span>
                    <span className="text-lg">➔ ⚡ ➔</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Users className="w-8 h-8 text-sky-400" />
                    <span className="text-[11px] font-black text-sky-300 mt-1">동반자 3명 폰</span>
                    <span className="text-[10px] text-stone-400">전광판 동기화</span>
                  </div>
                </div>

                <div className="bg-stone-900 rounded-xl p-3 border border-stone-800 text-center">
                  <div className="text-xs text-stone-400 font-bold">화면 하단 버튼 상시 배치</div>
                  <div className="mt-1 text-sm font-black text-emerald-300 bg-stone-800/80 py-1.5 px-3 rounded-lg border border-emerald-500/30">
                    📋 [ 현재 스코어보드판 보기 ]
                  </div>
                </div>
              </div>

              {/* 핵심 요약 체크리스트 */}
              <div className="space-y-2 bg-stone-950/70 p-3 rounded-2xl border border-stone-800/80 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>조장 입력 자동 전송:</strong> 조장이 홀아웃 점수를 확정하면 동반자들 폰에 0.1초 만에 뜹니다.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>실시간 스코어보드:</strong> 경기 도중 언제든 [현재 스코어보드판 보기]를 눌러 전체 타수를 확인하세요.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>평생 연대기 보관:</strong> 경기가 끝나면 전국 450개 구장 내 모든 기록이 평생 연대기로 자동 누적됩니다.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: 꿀팁 & 연습 모드 */}
          {activeStep === 4 && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 flex items-start gap-2.5">
                <span className="text-xl">⭐</span>
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-300">알아두면 100배 편한 파크온 꿀팁</h4>
                  <p className="text-xs text-stone-300 mt-0.5">
                    필드 현장에서 돌발 상황이 생겨도 당황하지 마세요!
                  </p>
                </div>
              </div>

              {/* 꿀팁 카드들 */}
              <div className="space-y-2 text-xs">
                <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 flex items-start gap-2.5">
                  <span className="text-base shrink-0">🔄</span>
                  <div>
                    <strong className="text-amber-300 text-xs">앞 조가 밀려 있을 때 (홀 점프):</strong>
                    <p className="text-stone-300 mt-0.5">
                      하단 <strong>[다른 홀로 이동]</strong>을 누르면 기다릴 필요 없이 비어있는 B-1, C-1 홀로 바로 건너뛰어 플레이할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 flex items-start gap-2.5">
                  <span className="text-base shrink-0">☕</span>
                  <div>
                    <strong className="text-amber-300 text-xs">비가 오거나 중간 휴식할 때:</strong>
                    <p className="text-stone-300 mt-0.5">
                      <strong>[잠시 빠지기(저장)]</strong>를 누르면 홈으로 빠져나가며, 나중에 <strong>[⛳ 이어서 경기하기]</strong>로 원터치 복귀됩니다.
                    </p>
                  </div>
                </div>

                <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 flex items-start gap-2.5">
                  <span className="text-base shrink-0">⚖️</span>
                  <div className="space-y-1 text-xs">
                    <strong className="text-emerald-300 font-extrabold">0베이스 vs Par기준 (선택 가능):</strong>
                    <p className="text-stone-300 text-[11px] leading-relaxed">
                      타수를 치는 대로 체크하며 셀지, Par 기준으로 (+/-) 맞출지 화면에서 1초 만에 언제든 전환할 수 있습니다.
                    </p>
                    <div className="pt-1.5 space-y-1 text-[11px] text-stone-200 bg-stone-900/90 p-2.5 rounded-xl border border-stone-800">
                      <div>
                        <span className="text-amber-300 font-black">✓ Par 기준 (기본 추천):</span> 해당 홀의 Par(3·4·5타)가 미리 박혀 있어, 홀아웃 후 오버/언더파(+/-)만 톡톡 맞춰 1초 만에 끝내는 가장 빠른 방식
                      </div>
                      <div className="pt-0.5">
                        <span className="text-emerald-300 font-black">✓ 0베이스:</span> 0부터 시작하여 공을 한 타 칠 때마다 직접 터치해서 차례대로 올려 세는 직관적인 방식
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 가상 체험 연습 모드 브릿지 */}
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-2xl p-3.5 space-y-2 text-center">
                <div className="text-xs font-black text-amber-300">
                  🎯 실제 화면을 직접 만져보고 싶으신가요?
                </div>
                <p className="text-[11px] text-stone-300 leading-tight">
                  기록에 남지 않는 가상 연습 모드에서 화면을 자유롭게 눌러보실 수 있습니다.
                </p>
                <button
                  type="button"
                  onClick={handleStartTrialRound}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-stone-950 font-black rounded-xl text-xs shadow-md transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>🎯 프로그램 가상 체험 연습해 보기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 하단 고정 액션 버튼 */}
        <div className="p-3.5 bg-stone-950 border-t border-stone-800/80 flex items-center gap-2.5 shrink-0">
          {/* 나가기 버튼 (홈 초기화면으로 원터치 복귀) */}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-black rounded-2xl text-xs sm:text-sm transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 border border-stone-700 shadow-xs"
          >
            <X className="w-4 h-4 text-stone-400" />
            <span>나가기</span>
          </button>

          {/* 다음 설명 보기 버튼 */}
          {activeStep < 4 ? (
            <button
              type="button"
              onClick={() => setActiveStep(activeStep + 1)}
              className="flex-2 py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black rounded-2xl text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>다음 설명 보기 ({activeStep + 1}/4)</span>
              <ChevronRight className="w-4 h-4 text-stone-950" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="flex-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>처음부터 다시 보기 (1/4)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
