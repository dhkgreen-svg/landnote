'use client';

import React from 'react';
import { AlertTriangle, Coffee, Flag, LogOut, ArrowRight, UserCheck, X, Check, ShieldAlert, CheckCircle2, RotateCcw } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export interface ExceptionCompanion {
  id: string;
  name: string;
  memberCode?: string;
  isLeader?: boolean;
}

interface RoundExceptionModalsProps {
  currentHoleLabel: string; // e.g. "A-3번 홀"

  // 1. 경기 종료 확인 모달
  isExitModalOpen: boolean;
  onCloseExitModal: () => void;
  onExitWithCurrentHole: () => void;
  onExitWithoutCurrentHole: () => void;

  // 2. 잠시 빠지기(휴식) 분기 모달
  isRestModalOpen: boolean;
  targetRestPlayerName?: string;
  onCloseRestModal: () => void;
  onRestAfterCurrentHole: () => void;
  onRestFromCurrentHole: () => void;

  // 3. 기록자(조장) 위임 모달
  isLeaderDelegateModalOpen: boolean;
  companions: ExceptionCompanion[];
  onCloseLeaderDelegateModal: () => void;
  onSelectNewLeader: (playerId: string) => void;

  // 4. 다른 코스 이동 분기 모달
  isSwitchCourseModalOpen: boolean;
  onCloseSwitchCourseModal: () => void;
  onSwitchWithCurrentHole: () => void;
  onSwitchWithoutCurrentHole: () => void;
  isLeader?: boolean;
  onDelegateAndSwitchCourse?: () => void;

  // 5. 점수 저장 시 미입력/휴식 확인 경고 모달
  isSaveWarningModalOpen: boolean;
  saveWarningNames: string;
  onCloseSaveWarningModal: () => void;
  onConfirmSaveAnyway: () => void;

  // 6. [확인] 클릭 시 3단 액션 모달 (다음 홀 이동 / 현재 홀 유지 / 경기 종료)
  isHoleConfirmModalOpen?: boolean;
  onCloseHoleConfirmModal?: () => void;
  onConfirmNextHole?: () => void;
  onConfirmStayHole?: () => void;
  onConfirmFinishRound?: () => void;

  // 7. 경기 종료 시 '기록 저장 여부' 분기 모달 (정식 저장 종료 / 연습 경기 폐기 / 돌아가기)
  isRoundSaveOptionModalOpen?: boolean;
  onCloseRoundSaveOptionModal?: () => void;
  onSaveAndFinishRound?: () => void;
  onDiscardAndExitHome?: () => void;
}

export function RoundExceptionModals({
  currentHoleLabel,
  isExitModalOpen,
  onCloseExitModal,
  onExitWithCurrentHole,
  onExitWithoutCurrentHole,
  isRestModalOpen,
  targetRestPlayerName,
  onCloseRestModal,
  onRestAfterCurrentHole,
  onRestFromCurrentHole,
  isLeaderDelegateModalOpen,
  companions,
  onCloseLeaderDelegateModal,
  onSelectNewLeader,
  isSwitchCourseModalOpen,
  onCloseSwitchCourseModal,
  onSwitchWithCurrentHole,
  onSwitchWithoutCurrentHole,
  isLeader,
  onDelegateAndSwitchCourse,
  isSaveWarningModalOpen,
  saveWarningNames,
  onCloseSaveWarningModal,
  onConfirmSaveAnyway,
  isHoleConfirmModalOpen,
  onCloseHoleConfirmModal,
  onConfirmNextHole,
  onConfirmStayHole,
  onConfirmFinishRound,
  isRoundSaveOptionModalOpen,
  onCloseRoundSaveOptionModal,
  onSaveAndFinishRound,
  onDiscardAndExitHome,
}: RoundExceptionModalsProps) {
  const { isJapanese } = useTranslation();

  return (
    <>
      {/* ========================================================= */}
      {/* A. [경기 종료] 클릭 시 모달 처리                           */}
      {/* ========================================================= */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-stone-900 rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95">
            {/* 헤더 */}
            <div className="px-5 py-4 bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {isJapanese ? 'ラウンド終了の確認' : '경기 종료 확인'}
                  </h3>
                  <span className="text-[11px] text-rose-100 font-bold">
                    {currentHoleLabel} {isJapanese ? '進行中' : '진행 중'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseExitModal}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 본문 안내 */}
            <div className="p-5 space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-center">
                <p className="text-xs sm:text-sm font-black text-rose-950 leading-relaxed">
                  현재 <span className="text-rose-600 underline decoration-2">{currentHoleLabel}</span> 진행 중입니다.
                  <br />
                  이번 홀 플레이를 마치셨습니까?
                </p>
                <p className="text-[11px] text-rose-700 font-bold mt-1">
                  {isJapanese
                    ? 'このホールの打数をスコアに含めるか選択してください。'
                    : '이번 홀 타수를 최종 스코어에 포함할지 선택해 주세요.'}
                </p>
              </div>

              {/* 선택지 2가지 + 취소 */}
              <div className="space-y-2.5">
                {/* 선택지 1: 이 홀 타수 포함하고 종료 */}
                <button
                  type="button"
                  onClick={onExitWithCurrentHole}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-between cursor-pointer border border-emerald-500"
                >
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-base">⛳</span>
                    <div>
                      <div className="font-black">
                        {isJapanese ? 'このホールを含めて終了' : '이 홀 타수 포함하고 종료'}
                      </div>
                      <div className="text-[10px] text-emerald-100 font-normal">
                        현재 화면에 입력된 타수를 확정 저장 후 종료
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-200" />
                </button>

                {/* 선택지 2: 이 홀은 치지 않고(제외) 종료 */}
                <button
                  type="button"
                  onClick={onExitWithoutCurrentHole}
                  className="w-full py-3.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 active:scale-[0.98] text-stone-800 font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer border border-stone-300"
                >
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-base">⏩</span>
                    <div>
                      <div className="font-black text-stone-900">
                        {isJapanese ? 'このホールを除外して終了' : '이 홀은 치지 않고(제외) 종료'}
                      </div>
                      <div className="text-[10px] text-stone-500 font-normal">
                        직전 홀까지의 공식 타수만 합산 확정 후 종료
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400" />
                </button>

                {/* 선택지 3: 취소 */}
                <button
                  type="button"
                  onClick={onCloseExitModal}
                  className="w-full py-2.5 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 font-bold text-xs transition cursor-pointer"
                >
                  {isJapanese ? 'キャンセル (ゲームに戻る)' : '취소 (현재 화면 유지)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* B-1. 기록자(조장) 위임 선행 모달                          */}
      {/* ========================================================= */}
      {isLeaderDelegateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-stone-900 rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95">
            {/* 헤더 */}
            <div className="px-5 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {isJapanese ? '記録代表の委任' : '기록자(조장) 위임'}
                  </h3>
                  <span className="text-[11px] text-amber-100 font-bold">
                    {isJapanese ? '同伴者への権限変更' : '동반자에게 기록 권한 전달'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseLeaderDelegateModal}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                <p className="text-xs sm:text-sm font-black text-amber-950">
                  조장님이 잠시 빠지시므로,
                  <br />
                  <span className="text-amber-700">다음 홀부터 점수 기록을 담당할 동반자</span>를 선택해주세요.
                </p>
              </div>

              {/* 동반자 목록 선택 리스트 */}
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {companions.map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => onSelectNewLeader(comp.id)}
                    className="w-full p-3 rounded-2xl border-2 border-stone-200 hover:border-amber-500 bg-white hover:bg-amber-50/50 flex items-center justify-between active:scale-[0.98] transition cursor-pointer text-left shadow-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center">
                        {comp.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-black text-xs sm:text-sm text-stone-900">{comp.name}</div>
                        {comp.memberCode && (
                          <div className="text-[10px] text-stone-500 font-semibold">{comp.memberCode}</div>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                      {isJapanese ? '選択' : '조장 위임'}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onCloseLeaderDelegateModal}
                className="w-full py-2.5 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 font-bold text-xs transition cursor-pointer"
              >
                {isJapanese ? 'キャンセル' : '취소'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* B-2. 이번 홀 적용 여부 선택 모달 (잠시 빠지기)             */}
      {/* ========================================================= */}
      {isRestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-stone-900 rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95">
            {/* 헤더 */}
            <div className="px-5 py-4 bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Coffee className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {isJapanese ? '一時休憩の設定' : '잠시 빠지기 (휴식 설정)'}
                  </h3>
                  <span className="text-[11px] text-amber-100 font-bold">
                    {targetRestPlayerName ? `${targetRestPlayerName}님` : '선수'} · {currentHoleLabel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseRestModal}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-center">
                <p className="text-xs sm:text-sm font-black text-amber-950 leading-relaxed">
                  <span className="text-amber-800 underline decoration-2">{targetRestPlayerName || '해당 선수'}</span>님의
                  <br />
                  휴식(잠시 빠지기) 시점을 선택해주세요.
                </p>
                <p className="text-[11px] text-amber-700 font-bold mt-1">
                  이번 홀 타수를 기록하고 빠질지, 지금 바로 쉴지 결정합니다.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* 선택지 1: 이번 홀 치고 다음 홀부터 휴식 */}
                <button
                  type="button"
                  onClick={onRestAfterCurrentHole}
                  className="w-full py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-between cursor-pointer border border-amber-500"
                >
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-base">⛳</span>
                    <div>
                      <div className="font-black">
                        {isJapanese ? 'このホール終了後、次から休憩' : '이번 홀 치고 다음 홀부터 휴식'}
                      </div>
                      <div className="text-[10px] text-amber-100 font-normal">
                        현재 홀 타수 정상 저장 후 다음 홀부터 휴식(결번)
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-200" />
                </button>

                {/* 선택지 2: 이번 홀부터 바로 휴식 */}
                <button
                  type="button"
                  onClick={onRestFromCurrentHole}
                  className="w-full py-3.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 active:scale-[0.98] text-stone-800 font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer border border-stone-300"
                >
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-base">☕</span>
                    <div>
                      <div className="font-black text-stone-900">
                        {isJapanese ? 'このホールから即時休憩' : '이번 홀부터 바로 휴식'}
                      </div>
                      <div className="text-[10px] text-stone-500 font-normal">
                        현재 홀은 미플레이(0점) 처리하고 즉시 휴식
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  type="button"
                  onClick={onCloseRestModal}
                  className="w-full py-2.5 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 font-bold text-xs transition cursor-pointer"
                >
                  {isJapanese ? 'キャンセル' : '취소 (돌아가기)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* C. [다른 코스 이동] 분기 모달                             */}
      {/* ========================================================= */}
      {isSwitchCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-stone-900 rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95">
            {/* 헤더 */}
            <div className="px-5 py-4 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Flag className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {isJapanese ? 'コース移動の確認' : '다른 코스로 이동'}
                  </h3>
                  <span className="text-[11px] text-teal-100 font-bold">
                    {currentHoleLabel} {isJapanese ? '進行中' : '진행 중'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseSwitchCourseModal}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3.5 text-center">
                <p className="text-xs sm:text-sm font-black text-teal-950 leading-relaxed">
                  현재 <span className="text-teal-700 underline decoration-2">{currentHoleLabel}</span> 진행 중입니다.
                  <br />
                  이번 홀 타수를 반영하고 이동하시겠습니까?
                </p>
                <p className="text-[11px] text-teal-700 font-bold mt-1">
                  선택 후 이동할 새로운 코스/홀 선택 창이 나타납니다.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* 선택지 1: 이번 홀 타수 포함하고 코스 이동 */}
                <button
                  type="button"
                  onClick={onSwitchWithCurrentHole}
                  className="w-full py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-between cursor-pointer border border-teal-500"
                >
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-base">⛳</span>
                    <div>
                      <div className="font-black">
                        {isJapanese ? 'このホールを反映して移動' : '이번 홀 타수 포함하고 코스 이동'}
                      </div>
                      <div className="text-[10px] text-teal-100 font-normal">
                        현재 홀 점수를 확정 저장한 후 새 코스로 이동
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-teal-200" />
                </button>

                {/* 선택지 2: 이번 홀 제외하고 바로 코스 이동 */}
                <button
                  type="button"
                  onClick={onSwitchWithoutCurrentHole}
                  className="w-full py-3.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 active:scale-[0.98] text-stone-800 font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer border border-stone-300"
                >
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-base">⏩</span>
                    <div>
                      <div className="font-black text-stone-900">
                        {isJapanese ? 'このホールは除外して移動' : '이번 홀 제외하고 바로 코스 이동'}
                      </div>
                      <div className="text-[10px] text-stone-500 font-normal">
                        현재 홀 점수는 치지 않은 것으로 처리하고 이동
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400" />
                </button>

                {/* 선택지 3 (기록자 위임): 조장이고 동반자가 있는 경우 */}
                {isLeader && companions && companions.length > 0 && onDelegateAndSwitchCourse && (
                  <button
                    type="button"
                    onClick={onDelegateAndSwitchCourse}
                    className="w-full py-3.5 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 active:scale-[0.98] text-amber-900 font-black text-xs sm:text-sm transition flex items-center justify-between cursor-pointer border border-amber-300"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-base">👑</span>
                      <div>
                        <div className="font-black text-amber-950">
                          {isJapanese ? '記録代表を委任してコース移動' : '기록 권한(조장) 위임 후 코스 이동'}
                        </div>
                        <div className="text-[10px] text-amber-700 font-normal">
                          {isJapanese ? '残る同伴者に記録を引き継いでから移動' : '남은 동반자에게 기록을 인계한 후 새 코스로 이동'}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-500" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onCloseSwitchCourseModal}
                  className="w-full py-2.5 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 font-bold text-xs transition cursor-pointer"
                >
                  {isJapanese ? 'キャンセル' : '취소 (현재 홀 유지)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* D. 점수 저장 시 미입력 / 휴식 확인 경고 모달               */}
      {/* ========================================================= */}
      {isSaveWarningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-stone-900 rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95">
            {/* 헤더 */}
            <div className="px-5 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {isJapanese ? 'スコア確認のご案内' : '타수 확인 안내'}
                  </h3>
                  <span className="text-[11px] text-amber-100 font-bold">
                    {currentHoleLabel} {isJapanese ? '打数保存' : '타수 저장'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseSaveWarningModal}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-2">
                <p className="text-xs sm:text-sm font-black text-amber-950 leading-relaxed">
                  동반자 <span className="text-amber-800 underline decoration-2">{saveWarningNames}</span> 님이
                  <br />
                  <span className="text-rose-600">미입력 또는 휴식 상태</span>입니다.
                </p>
                <p className="text-xs text-stone-600 font-bold">
                  이대로 {currentHoleLabel} 타수를 확정하시겠습니까?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={onCloseSaveWarningModal}
                  className="py-3 px-3 rounded-xl border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
                >
                  {isJapanese ? '再入力' : '다시 입력하기'}
                </button>
                <button
                  type="button"
                  onClick={onConfirmSaveAnyway}
                  className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isJapanese ? 'このまま確定' : '이대로 확정 저장'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* 6. [확인] 클릭 시 3단 액션 모달                            */}
      {/* ========================================================= */}
      {isHoleConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-stone-900 rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95">
            {/* 헤더 */}
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {isJapanese ? 'ホール記録の確認' : '홀 기록 확인'}
                  </h3>
                  <span className="text-[11px] text-emerald-100 font-bold">
                    {currentHoleLabel} {isJapanese ? '保存完了' : '타수 저장 완료'}
                  </span>
                </div>
              </div>
              {onCloseHoleConfirmModal && (
                <button
                  type="button"
                  onClick={onCloseHoleConfirmModal}
                  className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* 본문 안내 */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <p className="text-base sm:text-lg font-black text-emerald-950 leading-relaxed">
                  <span className="text-emerald-700 underline decoration-2">{currentHoleLabel}</span> 타수가 저장되었습니다.
                </p>
                <p className="text-xs sm:text-sm text-emerald-800 font-bold mt-1">
                  {isJapanese ? '次の操作を選択してください。' : '다음 작업을 선택해주세요.'}
                </p>
              </div>

              {/* 버튼 3개: 노년층 오터치 방지를 위한 gap-4(16px) 이상 확보 & 18px 이상 큰 글씨 */}
              <div className="space-y-4 pt-1">
                {/* 버튼 1 (최상단 메인, 강조): [ ⛳ 다음 홀로 이동 ] */}
                <button
                  type="button"
                  onClick={onConfirmNextHole}
                  className="w-full min-h-[56px] py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-black text-lg sm:text-xl shadow-lg border-2 border-emerald-400 flex items-center justify-between cursor-pointer transition ring-2 ring-emerald-500/20"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">⛳</span>
                    <span className="tracking-tight">
                      {isJapanese ? '次のホールへ移動' : '다음 홀로 이동'}
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-emerald-200" />
                </button>

                {/* 버튼 2 (중간 보조): [ ⏸️ 현재 홀 유지 (머물기) ] */}
                <button
                  type="button"
                  onClick={onConfirmStayHole}
                  className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-stone-100 hover:bg-stone-200 active:scale-[0.98] text-stone-800 font-bold text-lg border-2 border-stone-300 flex items-center justify-between cursor-pointer transition shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">⏸️</span>
                    <span className="tracking-tight">
                      {isJapanese ? '現在のホールを維持 (留まる)' : '현재 홀 유지 (머물기)'}
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 font-normal">
                    {isJapanese ? '修正・待機' : '추가 수정 / 대기'}
                  </span>
                </button>

                {/* 버튼 3 (하단 종료): [ ⏹️ 여기서 경기 종료 ] */}
                <button
                  type="button"
                  onClick={onConfirmFinishRound}
                  className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-rose-50 hover:bg-rose-100 active:scale-[0.98] text-rose-800 font-black text-lg border-2 border-rose-300 flex items-center justify-between cursor-pointer transition shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">⏹️</span>
                    <span className="tracking-tight">
                      {isJapanese ? 'ここでラウンド終了' : '여기서 경기 종료'}
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-rose-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. 경기 종료 시 '기록 저장 여부' 분기 모달                 */}
      {/* ========================================================= */}
      {isRoundSaveOptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-stone-900 rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95">
            {/* 헤더 */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-800 via-stone-800 to-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {isJapanese ? 'ラウンド終了と記録処理' : '경기 종료 및 기록 처리'}
                  </h3>
                  <span className="text-[11px] text-stone-300 font-bold">
                    {isJapanese ? '記録保存の選択' : '기록 보관 여부 확인'}
                  </span>
                </div>
              </div>
              {onCloseRoundSaveOptionModal && (
                <button
                  type="button"
                  onClick={onCloseRoundSaveOptionModal}
                  className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* 본문 안내 */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <p className="text-base sm:text-lg font-black text-stone-900 leading-relaxed">
                  {isJapanese ? '今までの記録を保存しますか？' : '지금까지 친 기록을 보관하시겠습니까?'}
                </p>
                <p className="text-xs sm:text-sm text-stone-600 font-semibold mt-1">
                  {isJapanese
                    ? '練習試合の場合は記録を残さず終了できます。'
                    : '연습 경기인 경우 기록을 남기지 않고 즉시 정리할 수 있습니다.'}
                </p>
              </div>

              {/* 버튼 3개: 16px 이상(space-y-4) 간격 유지 & 18px 이상 큰 글씨 */}
              <div className="space-y-4 pt-1">
                {/* 선택지 1: [ 💾 지금까지 친 기록 저장하고 종료 ] */}
                <button
                  type="button"
                  onClick={onSaveAndFinishRound}
                  className="w-full min-h-[56px] py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-black text-lg sm:text-xl shadow-lg border-2 border-emerald-400 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <span className="text-2xl">💾</span>
                    <div>
                      <div className="font-black text-base sm:text-lg leading-snug break-keep">
                        {isJapanese ? '記録を保存して終了' : '지금까지 친 기록 저장하고 종료'}
                      </div>
                      <div className="text-[11px] text-emerald-100 font-normal">
                        회원 기록 및 DB에 정식 집계 저장 후 결과 화면 이동
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-emerald-200 shrink-0 ml-1" />
                </button>

                {/* 선택지 2: [ 🗑️ 연습 경기 (기록 남기지 않고 종료) ] */}
                <button
                  type="button"
                  onClick={onDiscardAndExitHome}
                  className="w-full min-h-[52px] py-3.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 active:scale-[0.98] text-stone-800 font-black text-lg border-2 border-stone-300 flex items-center justify-between cursor-pointer transition shadow-xs"
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <span className="text-2xl">🗑️</span>
                    <div>
                      <div className="font-black text-base sm:text-lg leading-snug text-stone-900 break-keep">
                        {isJapanese ? '練習ラウンド (記録を残さず終了)' : '연습 경기 (기록 남기지 않고 종료)'}
                      </div>
                      <div className="text-[11px] text-stone-500 font-normal">
                        기록을 저장하지 않고 폐기(초기화) 후 홈 화면 이동
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-stone-400 shrink-0 ml-1" />
                </button>

                {/* 선택지 3: [ ↩️ 돌아가기 (계속 경기) ] */}
                <button
                  type="button"
                  onClick={onCloseRoundSaveOptionModal}
                  className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-stone-50 hover:bg-stone-100 active:scale-[0.98] text-stone-600 hover:text-stone-900 font-bold text-base sm:text-lg border border-stone-300 flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <RotateCcw className="w-4 h-4 text-stone-500" />
                  <span>{isJapanese ? '戻る (ラウンドを続ける)' : '돌아가기 (계속 경기)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
