'use client';

import React from 'react';
import { X, Play } from 'lucide-react';

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
  if (!isOpen) return null;

  const handleStart = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parkon_hide_round_notice_permanent', 'true');
      localStorage.setItem('parkon_hide_round_notice_date', new Date().toISOString().slice(0, 10));
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
              라운드 시작 안내
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

        {/* 본문: 큰 글씨 3줄만 심플 표출 */}
        <div className="p-4 space-y-4 flex-1 overflow-y-auto overscroll-contain text-center">
          {/* 파키 마스코트 이미지 카드 */}
          <div className="relative rounded-2xl overflow-hidden shadow-md border-2 border-emerald-300 bg-stone-100 aspect-square max-w-[200px] mx-auto group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/사진저장고_사진_20260913_28.jpg"
              alt="즐거운 라운드 되세요"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/40 to-transparent p-2 text-white">
              <span className="text-xs font-black bg-amber-400 text-emerald-950 px-2.5 py-0.5 rounded-full shadow-xs inline-flex items-center gap-1">
                <span>🎉</span>
                <span>즐거운 라운드 되세요!</span>
              </span>
            </div>
          </div>

          {/* 구장명 표출 (선택된 경우) */}
          {courseName && (
            <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full inline-block border border-emerald-200">
              📍 {courseName}
            </div>
          )}

          {/* 큰 글자 1, 2, 3 핵심 수칙 */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left space-y-3.5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                1
              </div>
              <span className="text-sm sm:text-base font-black text-stone-900 leading-snug">
                현장 구장 상황이 다를 수 있습니다
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                2
              </div>
              <span className="text-sm sm:text-base font-black text-stone-900 leading-snug">
                다를 땐 터치해서 즉시 수정하세요
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                3
              </div>
              <span className="text-sm sm:text-base font-black text-stone-900 leading-snug">
                팻말에 적힌 정규 규격대로 기록
              </span>
            </div>
          </div>
        </div>

        {/* 하단 확인 및 라운딩 시작하기 버튼 */}
        <div className="p-3.5 border-t border-stone-100 bg-stone-50 shrink-0">
          <button
            type="button"
            onClick={handleStart}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] text-base cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>확인했습니다 (라운딩 시작하기) ⛳</span>
          </button>
        </div>
      </div>
    </div>
  );
}
