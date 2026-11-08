'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Sparkles, Clock } from 'lucide-react';
import { CourseConditionState, RollSpeed, MoistureLevel, GrassLength } from '@/types/parkon';
import { ParkOnStorage, CourseConditionEvaluation } from '@/lib/storage';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface ConditionVoteModalProps {
  courseId: string;
  courseName: string;
  isOpen: boolean;
  isVirtual?: boolean;
  onClose: () => void;
  onVoteUpdated?: (state: CourseConditionState) => void;
}

export function ConditionVoteModal({
  courseId,
  courseName,
  isOpen,
  isVirtual = false,
  onClose,
  onVoteUpdated,
}: ConditionVoteModalProps) {
  const { isJapanese } = useTranslation();
  const [evaluation, setEvaluation] = useState<CourseConditionEvaluation | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayCourseName = isJapanese
    ? courseName.replace(/파크골프장$/, 'パークゴルフ場').replace(/구장$/, '球場')
    : courseName;

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
    if (isVirtual) {
      alert(isJapanese ? 'バーチャルモードでは動作しません。' : '가상 상태에서는 작동이 안 됩니다.');
      return;
    }
    const updated = ParkOnStorage.voteFieldCondition(courseId, category, value);
    refreshState();
    setToastMessage(
      isJapanese
        ? `'${label}' 反映完了！(3時間リアルタイムレポートに更新)`
        : `'${label}' 반영 완료! (3시간 실시간 리포트에 갱신)`
    );
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
      label: isJapanese ? '超高速' : '아주 잘 구름',
      icon: '🚀',
      sub: isJapanese ? '非常に速い' : '매우 빠른 그린',
      votes: state.speedVotes.very_fast || 0,
      activeClass: 'bg-emerald-800 text-white border-emerald-900 ring-2 ring-emerald-400 shadow-sm',
    },
    {
      key: 'FAST',
      label: isJapanese ? 'やや速い' : '잘 구름',
      icon: '✨',
      sub: isJapanese ? '速い方' : '빠른 편',
      votes: state.speedVotes.fast || 0,
      activeClass: 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-400 shadow-sm',
    },
    {
      key: 'NORMAL',
      label: isJapanese ? '普通' : '보통 구름',
      icon: '⛳',
      sub: isJapanese ? '適正速度' : '적정 속도',
      votes: state.speedVotes.normal || 0,
      activeClass: 'bg-teal-700 text-white border-teal-800 ring-2 ring-teal-400 shadow-sm',
    },
    {
      key: 'SLOW',
      label: isJapanese ? 'やや重い' : '잘 안 구름',
      icon: '🐢',
      sub: isJapanese ? 'やや重い' : '다소 무거움',
      votes: state.speedVotes.slow || 0,
      activeClass: 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400 shadow-sm',
    },
    {
      key: 'VERY_SLOW',
      label: isJapanese ? '超重い' : '거의 안 구름',
      icon: '🛑',
      sub: isJapanese ? '非常に重い' : '매우 무거움',
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
      label: isJapanese ? '乾燥' : '바짝 마름',
      icon: '☀️',
      sub: isJapanese ? '非常に乾燥' : '단단한 건조',
      votes: state.moistureVotes.very_dry || 0,
      activeClass: 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400 shadow-sm',
    },
    {
      key: 'DRY',
      label: isJapanese ? 'やや乾燥' : '약간 마름',
      icon: '🌤️',
      sub: isJapanese ? '適度に乾燥' : '적당히 건조',
      votes: state.moistureVotes.dry || 0,
      activeClass: 'bg-amber-500 text-stone-950 border-amber-600 ring-2 ring-amber-300 shadow-sm',
    },
    {
      key: 'NORMAL',
      label: isJapanese ? '普通' : '보통 습도',
      icon: '🌱',
      sub: isJapanese ? '標準水分' : '표준 수분',
      votes: state.moistureVotes.normal || 0,
      activeClass: 'bg-teal-700 text-white border-teal-800 ring-2 ring-teal-400 shadow-sm',
    },
    {
      key: 'WET',
      label: isJapanese ? 'しっとり' : '축축함',
      icon: '💧',
      sub: isJapanese ? '湿気あり' : '물기 촉촉',
      votes: state.moistureVotes.wet || 0,
      activeClass: 'bg-sky-600 text-white border-sky-700 ring-2 ring-sky-400 shadow-sm',
    },
    {
      key: 'VERY_WET',
      label: isJapanese ? 'ぬかるみ' : '아주 질척임',
      icon: '🌊',
      sub: isJapanese ? '泥・水たまり' : '물고임·진흙',
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
      label: isJapanese ? 'ほぼ芝なし' : '잔디 거의 없음',
      icon: '🌱',
      sub: isJapanese ? '地面露出' : '맨땅 수준',
      votes: state.lengthVotes.very_short || 0,
      activeClass: 'bg-stone-800 text-white border-stone-900 ring-2 ring-stone-500 shadow-sm',
    },
    {
      key: 'SHORT',
      label: isJapanese ? '短め' : '조금 있음',
      icon: '✂️',
      sub: isJapanese ? '短く刈り込み' : '짧게 깎임',
      votes: state.lengthVotes.short || 0,
      activeClass: 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-400 shadow-sm',
    },
    {
      key: 'MEDIUM',
      label: isJapanese ? '普通' : '중간',
      icon: '⛳',
      sub: isJapanese ? '適正長' : '적정 길이',
      votes: state.lengthVotes.medium || 0,
      activeClass: 'bg-teal-700 text-white border-teal-800 ring-2 ring-teal-400 shadow-sm',
    },
    {
      key: 'LONG',
      label: isJapanese ? 'やや長め' : '조금 김',
      icon: '🌿',
      sub: isJapanese ? 'やや抵抗あり' : '저항 다소 있음',
      votes: state.lengthVotes.long || 0,
      activeClass: 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400 shadow-sm',
    },
    {
      key: 'VERY_LONG',
      label: isJapanese ? 'かなり長め' : '아주 김',
      icon: '🌾',
      sub: isJapanese ? '強い芝抵抗' : '풀 저항 매우 큼',
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
                {displayCourseName} {isJapanese ? '芝生状態の確認・入力' : '잔디 상태 확인·입력'}
              </h3>
              <p className="text-[11px] text-emerald-200 font-bold mt-0.5">
                {isJapanese ? '現場1秒タップ リアルタイム共有システム' : '현장 1초 터치 실시간 공유 시스템'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
            aria-label={isJapanese ? '閉じる' : '닫기'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 안내 배너 및 실시간 상태 배지 */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 overscroll-contain">
          {/* 가상 라운딩(체험 모드) 제보 불가 안내 배너 */}
          {isVirtual && (
            <div className="bg-amber-100 border-2 border-amber-300 text-amber-950 p-3 rounded-2xl text-xs font-black flex items-center gap-2.5 shadow-xs">
              <span className="text-xl shrink-0">⚠️</span>
              <div className="min-w-0">
                <div className="text-xs font-black text-amber-950">
                  {isJapanese ? 'バーチャルモードでは動作しません' : '가상 상태에서는 작동이 안 됩니다'}
                </div>
                <div className="text-[10.5px] text-amber-800 font-medium leading-tight mt-0.5">
                  {isJapanese
                    ? 'バーチャルラウンド(体験モード)中は、実際のコースの芝生情報が変更されないよう入力が制限されます。'
                    : '가상 라운딩(체험 모드) 중에는 실제 구장의 잔디 상태가 오염되지 않도록 제보 입력이 제한됩니다.'}
                </div>
              </div>
            </div>
          )}

          {/* 시간대 최신성 뱃지 */}
          <div className="flex items-center justify-between bg-stone-50 px-3 py-2 rounded-xl border border-stone-200">
            <div className="flex items-center gap-1.5 text-xs font-black">
              {isRealtime1Hour ? (
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-stone-500" />
              )}
              <span className={isRealtime1Hour ? 'text-emerald-800 font-black' : 'text-stone-700'}>
                {isJapanese
                  ? (evaluation.hasActiveReport
                      ? `🟢 ${evaluation.minutesAgo !== undefined && evaluation.minutesAgo < 1 ? 'たった今' : `${evaluation.minutesAgo || 0}分前`}レポート (${evaluation.active1HourVotesCount || 0}件)`
                      : '⏱️ 直近3時間以内の芝生レポートなし')
                  : statusBadgeText}
              </span>
            </div>
            <span className="text-[10px] text-stone-500 font-bold bg-white px-2 py-0.5 rounded-md border">
              {isJapanese
                ? `${evaluation.formattedCurrentDate.replace('월', '月').replace('일', '日')} ${evaluation.formattedCurrentTime} 基準`
                : `${evaluation.formattedCurrentDate} ${evaluation.formattedCurrentTime} 기준`}
            </span>
          </div>

          {/* 파키의 실시간 잔디 관측 안내 배너 */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-2.5 border border-emerald-200/90 flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-xs border border-emerald-300 shrink-0 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mascot/사진저장고_사진_20260913_29.jpg"
                alt={isJapanese ? '芝生状態を観測するパキ' : '잔디 상태 관측하는 파키'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-emerald-950 flex items-center gap-1">
                <span>{isJapanese ? 'パキの3時間リアルタイム芝生観測' : '파키의 3시간 실시간 잔디 관측'}</span>
                <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">LIVE</span>
              </div>
              <p className="text-[10.5px] text-emerald-800 leading-snug font-medium mt-0.5">
                {isJapanese
                  ? '芝生は朝露と日差しによって変化します。現場ゴルファーの1回のタップが全国の仲間の最高の道標になります！'
                  : '잔디는 아침 이슬과 햇빛에 따라 변합니다. 현장 골퍼분들의 터치 한 번이 전국 동반자들에게 최고의 나침반이 됩니다!'}
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
                <span>{isJapanese ? '① ボールの転がりやすさ (グリーンスピード)' : '① 공이 구르는 정도 (스피드)'}</span>
              </span>
              <span className="text-[10px] text-stone-500 font-bold">
                {speedTotalVotes}{isJapanese ? '人参加' : '명 참여'}
              </span>
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
                <span>{isJapanese ? '② 地面の湿度 (水分・ぬかるみ状態)' : '② 지면 습도 (물기·질척임 상태)'}</span>
              </span>
              <span className="text-[10px] text-stone-500 font-bold">
                {moistureTotalVotes}{isJapanese ? '人参加' : '명 참여'}
              </span>
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
                <span>{isJapanese ? '③ 芝生の長さ (刈り込み状態)' : '③ 잔디 길이 (예초 상태)'}</span>
              </span>
              <span className="text-[10px] text-stone-500 font-bold">
                {lengthTotalVotes}{isJapanese ? '人参加' : '명 참여'}
              </span>
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
            <span>{isJapanese ? '確認・完了 ✓' : '확인 및 완료 ✓'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
