'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { RollSpeed, MoistureLevel, GrassLength } from '@/types/parkon';
import { ParkOnStorage, CourseConditionEvaluation } from '@/lib/storage';
import { ConditionVoteModal } from '@/components/ConditionVoteModal';

interface ConditionStatusProps {
  courseId: string;
  courseName: string;
}

export function ConditionStatus({ courseId, courseName }: ConditionStatusProps) {
  const [evaluation, setEvaluation] = useState<CourseConditionEvaluation | null>(null);
  const [showVoteModal, setShowVoteModal] = useState<boolean>(false);

  const refreshState = () => {
    setEvaluation(ParkOnStorage.getConditionEvaluation(courseId));
  };

  useEffect(() => {
    refreshState();
  }, [courseId]);

  if (!evaluation) return null;

  const {
    state,
    statusBadgeText,
    isRealtime1Hour,
    hasActiveReport,
    formattedCurrentDate,
    formattedCurrentTime,
    latestVoteTimeStr,
    active1HourVotesCount,
    minutesAgo,
  } = evaluation;

  // 1. 공 구름성 5단계 옵션 정의
  const speedOptions: {
    key: RollSpeed;
    label: string;
    icon: string;
    sub: string;
    votes: number;
    cardColor: string;
  }[] = [
    {
      key: 'VERY_FAST',
      label: '아주 잘 구름',
      icon: '🚀',
      sub: '매우 빠른 그린',
      votes: state.speedVotes.very_fast || 0,
      cardColor: 'text-emerald-900 bg-emerald-100 border-emerald-400',
    },
    {
      key: 'FAST',
      label: '잘 구름',
      icon: '✨',
      sub: '빠른 편',
      votes: state.speedVotes.fast || 0,
      cardColor: 'text-emerald-800 bg-emerald-50 border-emerald-300',
    },
    {
      key: 'NORMAL',
      label: '보통 구름',
      icon: '⛳',
      sub: '적정 속도',
      votes: state.speedVotes.normal || 0,
      cardColor: 'text-teal-800 bg-teal-50 border-teal-300',
    },
    {
      key: 'SLOW',
      label: '잘 안 구름',
      icon: '🐢',
      sub: '다소 무거움',
      votes: state.speedVotes.slow || 0,
      cardColor: 'text-amber-800 bg-amber-50 border-amber-300',
    },
    {
      key: 'VERY_SLOW',
      label: '거의 안 구름',
      icon: '🛑',
      sub: '매우 무거움',
      votes: state.speedVotes.very_slow || 0,
      cardColor: 'text-rose-800 bg-rose-50 border-rose-300',
    },
  ];

  // 2. 지면 습도 5단계 옵션 정의
  const moistureOptions: {
    key: MoistureLevel;
    label: string;
    icon: string;
    sub: string;
    votes: number;
    cardColor: string;
  }[] = [
    {
      key: 'VERY_DRY',
      label: '바짝 마름',
      icon: '☀️',
      sub: '단단한 건조',
      votes: state.moistureVotes.very_dry || 0,
      cardColor: 'text-amber-900 bg-amber-100 border-amber-400',
    },
    {
      key: 'DRY',
      label: '약간 마름',
      icon: '🌤️',
      sub: '적당히 건조',
      votes: state.moistureVotes.dry || 0,
      cardColor: 'text-amber-800 bg-amber-50 border-amber-300',
    },
    {
      key: 'NORMAL',
      label: '보통 습도',
      icon: '🌱',
      sub: '표준 수분',
      votes: state.moistureVotes.normal || 0,
      cardColor: 'text-teal-800 bg-teal-50 border-teal-300',
    },
    {
      key: 'WET',
      label: '축축함',
      icon: '💧',
      sub: '물기 촉촉',
      votes: state.moistureVotes.wet || 0,
      cardColor: 'text-sky-800 bg-sky-50 border-sky-300',
    },
    {
      key: 'VERY_WET',
      label: '아주 질척임',
      icon: '🌊',
      sub: '물고임·진흙',
      votes: state.moistureVotes.very_wet || 0,
      cardColor: 'text-blue-900 bg-blue-100 border-blue-400',
    },
  ];

  // 3. 잔디 길이 5단계 옵션 정의
  const lengthOptions: {
    key: GrassLength;
    label: string;
    icon: string;
    sub: string;
    votes: number;
    cardColor: string;
  }[] = [
    {
      key: 'VERY_SHORT',
      label: '잔디 거의 없음',
      icon: '🌱',
      sub: '맨땅 수준',
      votes: state.lengthVotes.very_short || 0,
      cardColor: 'text-stone-800 bg-stone-100 border-stone-300',
    },
    {
      key: 'SHORT',
      label: '조금 있음',
      icon: '✂️',
      sub: '짧게 깎임',
      votes: state.lengthVotes.short || 0,
      cardColor: 'text-emerald-800 bg-emerald-50 border-emerald-300',
    },
    {
      key: 'MEDIUM',
      label: '중간',
      icon: '⛳',
      sub: '적정 길이',
      votes: state.lengthVotes.medium || 0,
      cardColor: 'text-teal-800 bg-teal-50 border-teal-300',
    },
    {
      key: 'LONG',
      label: '조금 김',
      icon: '🌿',
      sub: '저항 다소 있음',
      votes: state.lengthVotes.long || 0,
      cardColor: 'text-amber-800 bg-amber-50 border-amber-300',
    },
    {
      key: 'VERY_LONG',
      label: '아주 김',
      icon: '🌾',
      sub: '풀 저항 매우 큼',
      votes: state.lengthVotes.very_long || 0,
      cardColor: 'text-rose-800 bg-rose-50 border-rose-300',
    },
  ];

  const speedInfo = speedOptions.find((o) => o.key === state.speed) || {
    icon: '✨',
    label: '잘 구름',
    votes: 0,
    cardColor: 'text-emerald-800 bg-emerald-50 border-emerald-300',
  };

  const moistureInfo = moistureOptions.find((o) => o.key === state.moisture) || {
    icon: '🌤️',
    label: '약간 마름',
    votes: 0,
    cardColor: 'text-amber-800 bg-amber-50 border-amber-300',
  };

  const lengthInfo = lengthOptions.find((o) => o.key === state.length) || {
    icon: '✂️',
    label: '조금 있음',
    votes: 0,
    cardColor: 'text-emerald-800 bg-emerald-50 border-emerald-300',
  };

  const getStrategyTip = () => {
    if ((state.speed === 'VERY_FAST' || state.speed === 'FAST') && (state.moisture === 'VERY_DRY' || state.moisture === 'DRY')) {
      return '지면이 마르고 잔디가 짧아 공이 잘 구릅니다. 어프로치와 퍼팅 시 1~2m 짧게 겨냥하세요.';
    }
    if (state.moisture === 'VERY_WET' || state.speed === 'VERY_SLOW' || state.length === 'VERY_LONG') {
      return '지면이 질척이거나 풀이 무성하여 저항이 큽니다. 평소보다 2~3m 이상 과감하게 치세요!';
    }
    if (state.moisture === 'WET' || state.length === 'LONG' || state.speed === 'SLOW') {
      return '잔디가 다소 길거나 촉촉하여 저항이 있습니다. 1~2m 더 자신 있게 힘차게 밀어치세요!';
    }
    if (state.length === 'VERY_SHORT') {
      return '잔디가 거의 없는 맨땅 상태입니다. 부드러운 헤드 터치로 방향성에 집중하세요!';
    }
    return '적당한 구름성과 표준 잔디 상태입니다. 평소 루틴대로 자신 있게 공략하세요!';
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-200 space-y-2.5">
      {/* 상단 타이틀 & 실시간 상태 배지 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            {isRealtime1Hour ? (
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            )}
            <h3 className="font-black text-xs sm:text-sm text-stone-900 leading-snug">
              오늘 {courseName} 잔디 실전 리포트
            </h3>
          </div>

          <span className="text-[10px] text-stone-400 font-bold shrink-0">
            {formattedCurrentDate} {formattedCurrentTime}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <span
            className={`text-[11px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${
              isRealtime1Hour
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}
          >
            <span>{hasActiveReport ? statusBadgeText : '⏱️ 최근 3시간 내 잔디 리포트 없음'}</span>
          </span>

          {/* 잔디 상태 제보 태그 버튼 */}
          <button
            type="button"
            onClick={() => setShowVoteModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 text-white font-black text-[11px] rounded-full shadow-2xs transition cursor-pointer"
          >
            <span>🌱</span>
            <span>{hasActiveReport ? '잔디 상태 추가 제보' : '잔디 상태 제보하기'}</span>
            <span className="text-[10px] opacity-90">✍️</span>
          </button>
        </div>
      </div>

      {/* 리포트가 없을 때: 친절한 1초 제보 안내 배너 */}
      {!hasActiveReport && (
        <div
          onClick={() => setShowVoteModal(true)}
          className="bg-amber-50/95 hover:bg-amber-100/90 border border-amber-300/80 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition active:scale-[0.99] shadow-2xs group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base group-hover:scale-110 transition shrink-0">📢</span>
            <div className="min-w-0">
              <p className="text-xs font-black text-amber-950 truncate">
                지금 구장에 계신가요? 1초 잔디 상태를 제보해 주세요!
              </p>
              <p className="text-[10px] text-amber-800 font-medium mt-0.5 truncate">
                터치 한 번으로 공 구름성·습도를 등록하면 동호인들에게 즉시 공유됩니다.
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-black text-emerald-900 bg-white border border-amber-300 px-2 py-0.5 rounded-lg shadow-2xs whitespace-nowrap ml-1.5 group-hover:bg-emerald-50">
            제보하기 &gt;
          </span>
        </div>
      )}

      {/* 리포트 칸 세 개 (공 구름성, 지면 습도, 잔디 길이 - 터치 시 입력 팝업 오픈) */}
      <div className="grid grid-cols-3 gap-2">
        {/* 1. 공 구름성 */}
        <div
          onClick={() => setShowVoteModal(true)}
          className={`p-2 rounded-xl border flex flex-col items-center text-center transition cursor-pointer hover:border-emerald-400 hover:shadow-2xs active:scale-98 ${
            hasActiveReport
              ? speedInfo.cardColor
              : 'bg-stone-50 border-stone-200 text-stone-500'
          }`}
          title="클릭하여 공 구름성 제보/수정"
        >
          <span className="text-[10px] font-bold opacity-75">공 구름성</span>
          <span className="font-black text-xs mt-0.5 flex items-center gap-1 whitespace-nowrap">
            <span>{hasActiveReport ? speedInfo.icon : '⛳'}</span>
            <span>{hasActiveReport ? speedInfo.label : '미등록'}</span>
          </span>
          <span className="text-[9px] font-semibold mt-0.5 opacity-75">
            {hasActiveReport ? `${speedInfo.votes}표 우세` : '터치하여 제보'}
          </span>
        </div>

        {/* 2. 지면 습도 */}
        <div
          onClick={() => setShowVoteModal(true)}
          className={`p-2 rounded-xl border flex flex-col items-center text-center transition cursor-pointer hover:border-emerald-400 hover:shadow-2xs active:scale-98 ${
            hasActiveReport
              ? moistureInfo.cardColor
              : 'bg-stone-50 border-stone-200 text-stone-500'
          }`}
          title="클릭하여 지면 습도 제보/수정"
        >
          <span className="text-[10px] font-bold opacity-75">지면 습도</span>
          <span className="font-black text-xs mt-0.5 flex items-center gap-1 whitespace-nowrap">
            <span>{hasActiveReport ? moistureInfo.icon : '💧'}</span>
            <span>{hasActiveReport ? moistureInfo.label : '미등록'}</span>
          </span>
          <span className="text-[9px] font-semibold mt-0.5 opacity-75">
            {hasActiveReport ? `${moistureInfo.votes}표 우세` : '터치하여 제보'}
          </span>
        </div>

        {/* 3. 잔디 길이 */}
        <div
          onClick={() => setShowVoteModal(true)}
          className={`p-2 rounded-xl border flex flex-col items-center text-center transition cursor-pointer hover:border-emerald-400 hover:shadow-2xs active:scale-98 ${
            hasActiveReport
              ? lengthInfo.cardColor
              : 'bg-stone-50 border-stone-200 text-stone-500'
          }`}
          title="클릭하여 잔디 길이 제보/수정"
        >
          <span className="text-[10px] font-bold opacity-75">잔디 길이</span>
          <span className="font-black text-xs mt-0.5 flex items-center gap-1 whitespace-nowrap">
            <span>{hasActiveReport ? lengthInfo.icon : '🌱'}</span>
            <span>{hasActiveReport ? lengthInfo.label : '미등록'}</span>
          </span>
          <span className="text-[9px] font-semibold mt-0.5 opacity-75">
            {hasActiveReport ? `${lengthInfo.votes}표 우세` : '터치하여 제보'}
          </span>
        </div>
      </div>

      {/* 실시간 리포트가 있을 때만 실전 팁 컴팩트 표시 */}
      {hasActiveReport && (
        <div className="bg-emerald-50/80 rounded-xl p-2 border border-emerald-200/80 flex items-start gap-1.5 shadow-xs text-xs">
          <span className="text-sm shrink-0">💡</span>
          <p className="text-[11px] text-emerald-950 font-medium leading-snug">
            <strong className="text-emerald-900 font-black mr-1">[오늘의 공략 팁]</strong>
            {getStrategyTip()}
          </p>
        </div>
      )}

      {/* 잔디 상태 확인 및 실시간 1초 제보 팝업 모달 */}
      <ConditionVoteModal
        courseId={courseId}
        courseName={courseName}
        isOpen={showVoteModal}
        onClose={() => {
          setShowVoteModal(false);
          refreshState();
        }}
        onVoteUpdated={() => {
          refreshState();
        }}
      />
    </div>
  );
}
