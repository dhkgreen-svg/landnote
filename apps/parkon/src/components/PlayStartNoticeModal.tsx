'use client';

import React, { useState } from 'react';
import { X, Play, AlertCircle, CheckCircle2, Flag, Edit3, HeartHandshake } from 'lucide-react';

interface PlayStartNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  courseName?: string;
  courseLetter?: string;
  startHole?: number;
}

export function PlayStartNoticeModal({
  isOpen,
  onClose,
  onConfirm,
  courseName,
  courseLetter = 'A',
  startHole = 1,
}: PlayStartNoticeModalProps) {
  const [dontShowToday, setDontShowToday] = useState(false);

  if (!isOpen) return null;

  const handleStart = () => {
    if (dontShowToday && typeof window !== 'undefined') {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('parkon_hide_round_notice_date', today);
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scaleUp overflow-hidden border border-emerald-200 flex flex-col max-h-[92vh]">
        {/* 고정 상단 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-800 shrink-0 bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shadow-xs">
              ⛳
            </span>
            <span className="text-xs font-black tracking-tight">
              라운드 시작 전 필독 안내
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-emerald-800/80 hover:bg-emerald-900 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition active:scale-95"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 스크롤 가능한 본문 */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 overscroll-contain text-center">
          {/* 파키 마스코트 이미지 카드 */}
          <div className="relative rounded-2xl overflow-hidden shadow-md border-2 border-emerald-300 bg-stone-100 aspect-square max-w-[240px] mx-auto group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/사진저장고_사진_20260913_28.jpg"
              alt="파크온 공식 마스코트 파키의 현장 필독 알림"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/40 to-transparent p-2 text-white">
              <span className="text-[10px] font-black bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full shadow-xs inline-flex items-center gap-1">
                <span>📢</span>
                <span>파키의 현장 라운드 수칙</span>
              </span>
            </div>
          </div>

          {/* 타이틀 및 헤드라인 */}
          <div className="space-y-1">
            <h2 className="text-base font-black text-stone-900 leading-snug">
              {courseName ? (
                <>
                  <span className="text-emerald-700 font-extrabold">{courseName}</span><br />
                </>
              ) : null}
              즐거운 라운드 되세요! ⛳
            </h2>
            <p className="text-[11.5px] text-stone-600 font-bold leading-relaxed">
              티샷 전, <strong className="text-amber-800 underline underline-offset-2">각 홀의 팻말(파수·거리)</strong>을 꼭 확인해 주세요!
            </p>
          </div>

          {/* 핵심 주의사항 3가지 카드 */}
          <div className="bg-amber-50/80 rounded-2xl p-3 border border-amber-200/90 text-left space-y-2.5 text-xs">
            {/* 1. 현장과 다를 수 있음 */}
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5 shadow-2xs">
                1
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-stone-900 text-[11.5px] flex items-center gap-1">
                  <span>현장 구장 상황이 다를 수 있습니다</span>
                </div>
                <p className="text-[10.5px] text-stone-600 font-medium leading-tight">
                  전국 구장 정보를 수시로 정비하고 있으나, 계절 잔디 보수나 로컬 변경으로 실제 티박스 팻말과 약간 다를 수 있습니다.
                </p>
              </div>
            </div>

            {/* 2. 실제와 다르면 스코어카드에서 터치하여 즉시 수정 */}
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5 shadow-2xs">
                2
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-stone-900 text-[11.5px] flex items-center gap-1">
                  <span>다를 땐 터치해서 즉시 수정하세요</span>
                </div>
                <p className="text-[10.5px] text-stone-600 font-medium leading-tight">
                  실제와 다를 경우, 스코어카드 상단에서 <strong>홀 번호나 파수를 가볍게 터치</strong>하여 실제 규격대로 즉시 수정하며 플레이하실 수 있습니다.
                </p>
              </div>
            </div>

            {/* 3. 다른 회원을 위한 정규 표기 당부 */}
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5 shadow-2xs">
                3
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-stone-900 text-[11.5px] flex items-center gap-1">
                  <span>팻말에 적힌 정규 규격대로 기록</span>
                </div>
                <p className="text-[10.5px] text-stone-600 font-medium leading-tight">
                  임의로 수시 변경하기보다, <strong>실제 팻말에 적힌 정규 파수와 거리대로</strong> 정확히 기록해 주시면 전국의 모든 동호인에게 큰 도움이 됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 응원 메시지 박스 */}
          <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-200 text-center">
            <p className="text-[11px] font-black text-emerald-900 flex items-center justify-center gap-1">
              <span>🎉</span>
              <span>오늘도 동반자분들과 기분 좋은 나이스 샷! 멋진 플레이 되세요!</span>
            </p>
          </div>

          {/* 오늘 하루 이 안내 다시 보지 않기 체크박스 */}
          <div className="flex items-center justify-center pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-stone-600 hover:text-stone-900 select-none text-[11px] font-bold">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300"
              />
              <span>오늘 하루 이 안내 다시 보지 않기</span>
            </label>
          </div>
        </div>

        {/* 하단 확인 및 티샷 시작 버튼 */}
        <div className="p-3.5 border-t border-stone-100 bg-stone-50 shrink-0">
          <button
            type="button"
            onClick={handleStart}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] text-base cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>확인했습니다 · {courseLetter}코스 {startHole}번 홀 티샷 시작 ⛳</span>
          </button>
        </div>
      </div>
    </div>
  );
}
