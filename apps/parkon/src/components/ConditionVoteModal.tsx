'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Sparkles, Clock } from 'lucide-react';
import { CourseConditionState, RollSpeed, MoistureLevel, GrassLength } from '@/types/parkon';
import { ParkOnStorage, CourseConditionEvaluation } from '@/lib/storage';

interface ConditionVoteModalProps {
  courseId: string;
  courseName: string;
  isOpen: boolean;
  onClose: () => void;
  onVoteUpdated?: (state: CourseConditionState) => void;
}

export function ConditionVoteModal({
  courseId,
  courseName,
  isOpen,
  onClose,
  onVoteUpdated,
}: ConditionVoteModalProps) {
  const [evaluation, setEvaluation] = useState<CourseConditionEvaluation | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshState = () => {
    const evalData = ParkOnStorage.getConditionEvaluation(courseId);
    setEvaluation(evalData);
    if (onVoteUpdated) {
      onVoteUpdated(evalData.state);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshState();
    }
  }, [courseId, isOpen]);

  if (!isOpen || !evaluation) return null;

  const { state, statusBadgeText, isRealtime1Hour } = evaluation;
  const myVotes = state.myVotes || {};

  const handleVote = (
    category: 'speed' | 'moisture' | 'length',
    value: string,
    label: string
  ) => {
    const updated = ParkOnStorage.voteFieldCondition(courseId, category, value);
    refreshState();
    setToastMessage(`'${label}' 반영 완료! (3시간 실시간 리포트에 갱신)`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // 1. 공 구름성 5단계
  const speedOptions: {
    key: RollSpeed;
    label: string;
    icon: string;
    sub: string;
    votes: number;
    activeClass: string;
  }[] = [
    {
      key: 'VERY_FAST',
      label: '아주 잘 구름',
      icon: '🚀',
      sub: '매우 빠른 그린',
      votes: state.speedVotes.very_fast || 0,
      activeClass: 'bg-emerald-800 text-white border-emerald-900 ring-2 ring-emerald-400 shadow-sm',
    },
    {
      key: 'FAST',
      label: '잘 구름',
      icon: '✨',
      sub: '빠른 편',
      votes: state.speedVotes.fast || 0,
      activeClass: 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-400 shadow-sm',
    },
    {
      key: 'NORMAL',
      label: '보통 구름',
      icon: '⛳',
      sub: '적정 속도',
      votes: state.speedVotes.normal || 0,
      activeClass: 'bg-teal-700 text-white border-teal-800 ring-2 ring-teal-400 shadow-sm',
    },
    {
      key: 'SLOW',
      label: '잘 안 구름',
      icon: '🐢',
      sub: '다소 무거움',
      votes: state.speedVotes.slow || 0,
      activeClass: 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400 shadow-sm',
    },
    {
      key: 'VERY_SLOW',
      label: '거의 안 구름',
      icon: '🛑',
      sub: '매우 무거움',
      votes: state.speedVotes.very_slow || 0,
      activeClass: 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400 shadow-sm',
    },
  ];

  // 2. 지면 습도 5단계
  const moistureOptions: {
    key: MoistureLevel;
    label: string;
    icon: string;
    sub: string;
    votes: number;
    activeClass: string;
  }[] = [
    {
      key: 'VERY_DRY',
      label: '바짝 마름',
      icon: '☀️',
      sub: '단단한 건조',
      votes: state.moistureVotes.very_dry || 0,
      activeClass: 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400 shadow-sm',
    },
    {
      key: 'DRY',
      label: '약간 마름',
      icon: '🌤️',
      sub: '적당히 건조',
      votes: state.moistureVotes.dry || 0,
      activeClass: 'bg-amber-500 text-stone-950 border-amber-600 ring-2 ring-amber-300 shadow-sm',
    },
    {
      key: 'NORMAL',
      label: '보통 습도',
      icon: '🌱',
      sub: '표준 수분',
      votes: state.moistureVotes.normal || 0,
      activeClass: 'bg-teal-700 text-white border-teal-800 ring-2 ring-teal-400 shadow-sm',
    },
    {
      key: 'WET',
      label: '축축함',
      icon: '💧',
      sub: '물기 촉촉',
      votes: state.moistureVotes.wet || 0,
      activeClass: 'bg-sky-600 text-white border-sky-700 ring-2 ring-sky-400 shadow-sm',
    },
    {
      key: 'VERY_WET',
      label: '아주 질척임',
      icon: '🌊',
      sub: '물고임·진흙',
      votes: state.moistureVotes.very_wet || 0,
      activeClass: 'bg-blue-800 text-white border-blue-900 ring-2 ring-blue-400 shadow-sm',
    },
  ];

  // 3. 잔디 길이 5단계
  const lengthOptions: {
    key: GrassLength;
    label: string;
    icon: string;
    sub: string;
    votes: number;
    activeClass: string;
  }[] = [
    {
      key: 'VERY_SHORT',
      label: '잔디 거의 없음',
      icon: '🌱',
      sub: '맨땅 수준',
      votes: state.lengthVotes.very_short || 0,
      activeClass: 'bg-stone-800 text-white border-stone-900 ring-2 ring-stone-500 shadow-sm',
    },
    {
      key: 'SHORT',
      label: '조금 있음',
      icon: '✂️',
      sub: '짧게 깎임',
      votes: state.lengthVotes.short || 0,
      activeClass: 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-400 shadow-sm',
    },
    {
      key: 'MEDIUM',
      label: '중간',
      icon: '⛳',
      sub: '적정 길이',
      votes: state.lengthVotes.medium || 0,
      activeClass: 'bg-teal-700 text-white border-teal-800 ring-2 ring-teal-400 shadow-sm',
    },
    {
      key: 'LONG',
      label: '조금 김',
      icon: '🌿',
      sub: '저항 다소 있음',
      votes: state.lengthVotes.long || 0,
      activeClass: 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400 shadow-sm',
    },
    {
      key: 'VERY_LONG',
      label: '아주 김',
      icon: '🌾',
      sub: '풀 저항 매우 큼',
      votes: state.lengthVotes.very_long || 0,
      activeClass: 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400 shadow-sm',
    },
  ];

  const speedTotalVotes = speedOptions.reduce((sum, opt) => sum + opt.votes, 0);
  const moistureTotalVotes = moistureOptions.reduce((sum, opt) => sum + opt.votes, 0);
  const lengthTotalVotes = lengthOptions.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* 모달 상단 헤더 */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 flex items-center justify-between shadow-md shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">
                {courseName} 잔디 상태 확인·입력
              </h3>
              <p className="text-[11px] text-emerald-200 font-bold mt-0.5">
                현장 1초 터치 실시간 공유 시스템
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 안내 배너 및 실시간 상태 배지 */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 overscroll-contain">
          {/* 시간대 최신성 뱃지 */}
          <div className="flex items-center justify-between bg-stone-50 px-3 py-2 rounded-xl border border-stone-200">
            <div className="flex items-center gap-1.5 text-xs font-black">
              {isRealtime1Hour ? (
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-stone-500" />
              )}
              <span className={isRealtime1Hour ? 'text-emerald-800 font-black' : 'text-stone-700'}>
                {statusBadgeText}
              </span>
            </div>
            <span className="text-[10px] text-stone-500 font-bold bg-white px-2 py-0.5 rounded-md border">
              {evaluation.formattedCurrentDate} {evaluation.formattedCurrentTime} 기준
            </span>
          </div>

          {/* 파키의 실시간 잔디 관측 안내 배너 */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-2.5 border border-emerald-200/90 flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-xs border border-emerald-300 shrink-0 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mascot/사진저장고_사진_20260913_29.jpg"
                alt="잔디 상태 관측하는 파키"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-emerald-950 flex items-center gap-1">
                <span>파키의 3시간 실시간 잔디 관측</span>
                <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">LIVE</span>
              </div>
              <p className="text-[10.5px] text-emerald-800 leading-snug font-medium mt-0.5">
                잔디는 아침 이슬과 햇빛에 따라 변합니다. 현장 골퍼분들의 터치 한 번이 전국 동반자들에게 최고의 나침반이 됩니다!
              </p>
            </div>
          </div>

          {/* 피드백 토스트 */}
          {toastMessage && (
            <div className="bg-emerald-700 text-white text-xs font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* 1. 공 구름성 (5단계) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-stone-800">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>① 공이 구르는 정도 (스피드)</span>
              </span>
              <span className="text-[10px] text-stone-500 font-bold">{speedTotalVotes}명 참여</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {speedOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleVote('speed', opt.key, opt.label)}
                  className={`py-2 px-1 rounded-xl text-center border transition active:scale-95 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    myVotes.speed === opt.key
                      ? opt.activeClass
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <span className="text-sm leading-none">{opt.icon}</span>
                  <span className="text-[10px] font-black leading-tight text-center break-keep">
                    {opt.label}
                  </span>
                  <span className="text-[9px] opacity-75 font-semibold">({opt.votes})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. 지면 습도 (5단계) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-stone-800">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>② 지면 습도 (물기·질척임 상태)</span>
              </span>
              <span className="text-[10px] text-stone-500 font-bold">{moistureTotalVotes}명 참여</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {moistureOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleVote('moisture', opt.key, opt.label)}
                  className={`py-2 px-1 rounded-xl text-center border transition active:scale-95 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    myVotes.moisture === opt.key
                      ? opt.activeClass
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <span className="text-sm leading-none">{opt.icon}</span>
                  <span className="text-[10px] font-black leading-tight text-center break-keep">
                    {opt.label}
                  </span>
                  <span className="text-[9px] opacity-75 font-semibold">({opt.votes})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. 잔디 길이 (5단계) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-stone-800">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>③ 잔디 길이 (예초 상태)</span>
              </span>
              <span className="text-[10px] text-stone-500 font-bold">{lengthTotalVotes}명 참여</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {lengthOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleVote('length', opt.key, opt.label)}
                  className={`py-2 px-1 rounded-xl text-center border transition active:scale-95 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    myVotes.length === opt.key
                      ? opt.activeClass
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  <span className="text-sm leading-none">{opt.icon}</span>
                  <span className="text-[10px] font-black leading-tight text-center break-keep">
                    {opt.label}
                  </span>
                  <span className="text-[9px] opacity-75 font-semibold">({opt.votes})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 모달 하단 닫기/확인 버튼 */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>확인 및 완료 ✓</span>
          </button>
        </div>
      </div>
    </div>
  );
}
