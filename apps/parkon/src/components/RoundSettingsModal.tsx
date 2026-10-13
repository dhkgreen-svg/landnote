'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings, Check, Sparkles, HelpCircle } from 'lucide-react';
import { HoleDisplayMode, HoleTransitionPopup, RoundSettings } from '@/types/parkon';

interface RoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: RoundSettings) => void;
}

export const STORAGE_KEY_HOLE_DISPLAY = 'parkon_hole_display_mode';
export const STORAGE_KEY_TRANSITION_POPUP = 'parkon_hole_transition_popup';

export function getStoredRoundSettings(): RoundSettings {
  if (typeof window === 'undefined') {
    return { holeDisplayMode: 'PAR', holeTransitionPopup: 'OFF' };
  }
  const mode = (localStorage.getItem(STORAGE_KEY_HOLE_DISPLAY) as HoleDisplayMode) || 'PAR';
  const popup = (localStorage.getItem(STORAGE_KEY_TRANSITION_POPUP) as HoleTransitionPopup) || 'OFF';
  return { holeDisplayMode: mode, holeTransitionPopup: popup };
}

export function RoundSettingsModal({
  isOpen,
  onClose,
  onSettingsChange,
}: RoundSettingsModalProps) {
  const [holeDisplayMode, setHoleDisplayMode] = useState<HoleDisplayMode>('PAR');
  const [holeTransitionPopup, setHoleTransitionPopup] = useState<HoleTransitionPopup>('OFF');

  // 모달 열릴 때 최신 저장값 로드
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const current = getStoredRoundSettings();
      setHoleDisplayMode(current.holeDisplayMode);
      setHoleTransitionPopup(current.holeTransitionPopup);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectDisplayMode = (mode: HoleDisplayMode) => {
    setHoleDisplayMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_HOLE_DISPLAY, mode);
      const updated: RoundSettings = { holeDisplayMode: mode, holeTransitionPopup };
      window.dispatchEvent(
        new CustomEvent('parkon_round_settings_changed', { detail: updated })
      );
      if (onSettingsChange) onSettingsChange(updated);
    }
  };

  const handleSelectTransitionPopup = (popup: HoleTransitionPopup) => {
    setHoleTransitionPopup(popup);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TRANSITION_POPUP, popup);
      const updated: RoundSettings = { holeDisplayMode, holeTransitionPopup: popup };
      window.dispatchEvent(
        new CustomEvent('parkon_round_settings_changed', { detail: updated })
      );
      if (onSettingsChange) onSettingsChange(updated);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-stone-900 border-t sm:border border-stone-700/80 rounded-t-3xl sm:rounded-3xl p-5 text-white shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-400/20 text-yellow-300 border border-yellow-400/30">
              <Settings className="w-5 h-5 stroke-[2.5]" />
            </span>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-1.5">
                <span>라운드 환경 설정</span>
                <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-1.5 py-0.5 rounded-full">
                  실시간 연동
                </span>
              </h2>
              <p className="text-[11px] text-stone-400 font-medium">
                홀 표기 범위 및 홀 전환 동작을 내 스타일에 맞게 설정합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. 홀 정보 표시 범위 (3단 택1 / localStorage 영구 저장) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <span>1. 홀 정보 표시 범위</span>
              <span className="text-[10px] text-stone-400 font-normal">(3단 택1)</span>
            </label>
            <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-md font-bold">
              자동 영구 보존
            </span>
          </div>

          <div className="space-y-2">
            {/* 옵션 1: 홀명만 */}
            <button
              type="button"
              onClick={() => handleSelectDisplayMode('HOLE_ONLY')}
              className={`w-full p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                holeDisplayMode === 'HOLE_ONLY'
                  ? 'bg-amber-400/15 border-amber-400 text-white shadow-md'
                  : 'bg-stone-800/60 border-stone-700/60 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="pt-0.5">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    holeDisplayMode === 'HOLE_ONLY'
                      ? 'border-yellow-400 bg-yellow-400 text-stone-950'
                      : 'border-stone-500 bg-stone-900'
                  }`}
                >
                  {holeDisplayMode === 'HOLE_ONLY' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-black text-white">홀명만</span>
                  <span className="text-[11px] font-mono font-bold text-yellow-300 bg-stone-900 px-2 py-0.5 rounded border border-white/10">
                    A-1 홀
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  헤더에 <strong className="text-stone-200">'A-1 홀'</strong>만 간결 표기합니다.
                  <br />
                  <span className="text-[10.5px] text-amber-300/80">
                    ※ 연필(✏️) 숨김 처리되며, 내부 타수 및 공식 Par 연산은 100% 정상 작동합니다.
                  </span>
                </p>
              </div>
            </button>

            {/* 옵션 2: 파까지 (기본) */}
            <button
              type="button"
              onClick={() => handleSelectDisplayMode('PAR')}
              className={`w-full p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                holeDisplayMode === 'PAR'
                  ? 'bg-amber-400/15 border-amber-400 text-white shadow-md'
                  : 'bg-stone-800/60 border-stone-700/60 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="pt-0.5">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    holeDisplayMode === 'PAR'
                      ? 'border-yellow-400 bg-yellow-400 text-stone-950'
                      : 'border-stone-500 bg-stone-900'
                  }`}
                >
                  {holeDisplayMode === 'PAR' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">파까지</span>
                    <span className="text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded-full">
                      기본 추천
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-yellow-300 bg-stone-900 px-2 py-0.5 rounded border border-white/10">
                    A-1 홀 · Par 3 ✏️
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  헤더에 <strong className="text-stone-200">'A-1 홀 · Par 3 ✏️'</strong>로 기준 타수와 함께 표기합니다.
                </p>
              </div>
            </button>

            {/* 옵션 3: 거리까지 */}
            <button
              type="button"
              onClick={() => handleSelectDisplayMode('DISTANCE')}
              className={`w-full p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                holeDisplayMode === 'DISTANCE'
                  ? 'bg-amber-400/15 border-amber-400 text-white shadow-md'
                  : 'bg-stone-800/60 border-stone-700/60 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="pt-0.5">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    holeDisplayMode === 'DISTANCE'
                      ? 'border-yellow-400 bg-yellow-400 text-stone-950'
                      : 'border-stone-500 bg-stone-900'
                  }`}
                >
                  {holeDisplayMode === 'DISTANCE' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-black text-white">거리까지</span>
                  <span className="text-[11px] font-mono font-bold text-yellow-300 bg-stone-900 px-2 py-0.5 rounded border border-white/10">
                    A-1 홀 · Par 3 60m ✏️
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  헤더에 <strong className="text-stone-200">'A-1 홀 · Par 3 60m ✏️'</strong>로 공식 거리까지 한눈에 표기합니다.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 2. 홀 전환 안내 팝업 토글 (localStorage 저장) */}
        <div className="space-y-2 pt-1 border-t border-stone-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-amber-300">
              2. 홀 전환 안내 팝업 토글
            </label>
            <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-xl border border-stone-700">
              <button
                type="button"
                onClick={() => handleSelectTransitionPopup('OFF')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  holeTransitionPopup === 'OFF'
                    ? 'bg-amber-400 text-stone-950 shadow-md font-black'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                OFF (기본값)
              </button>
              <button
                type="button"
                onClick={() => handleSelectTransitionPopup('ON')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  holeTransitionPopup === 'ON'
                    ? 'bg-amber-400 text-stone-950 shadow-md font-black'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                ON
              </button>
            </div>
          </div>

          <div className="bg-stone-800/50 p-2.5 rounded-xl border border-stone-700/60 text-[11px] text-stone-300 leading-relaxed">
            {holeTransitionPopup === 'OFF' ? (
              <p>
                <span className="text-yellow-300 font-bold">⚡ OFF (초고속 진행):</span> 홀 전환 시 전광판 없이 즉시 다음 홀 스코어보드로 직행하여 빠르게 다음 타수를 기입합니다.
              </p>
            ) : (
              <p>
                <span className="text-emerald-400 font-bold">🏌️ ON (안내 표출):</span> 다음 홀 전환 시 1.5초간 가벼운 코스 안내 카드가 표출된 후 자동으로 부드럽게 페이드아웃됩니다.
              </p>
            )}
          </div>
        </div>

        {/* 3. 조별 라운드 규칙 안내 */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-stone-900 border border-emerald-500/30 text-[11px] text-emerald-200/90 space-y-1">
          <div className="flex items-center gap-1 font-black text-emerald-300 text-xs">
            <span>💡 4인 조별 경기 규칙</span>
          </div>
          <p className="leading-snug">
            • <strong>조장</strong>이 톱니바퀴에서 설정을 변경하면 조원 스마트폰 화면에 <strong>100% 자동 추종(미러링)</strong>됩니다.
            <br />
            • 라운드 종료 후 <strong>개인 기록실(연대기)</strong>에서는 조원 본인의 로컬 설정에 맞춰 스코어카드가 정상 복원되어 표출됩니다.
          </p>
        </div>

        {/* 닫기 버튼 */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black rounded-2xl text-sm shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>설정 완료</span>
          </button>
        </div>
      </div>
    </div>
  );
}
