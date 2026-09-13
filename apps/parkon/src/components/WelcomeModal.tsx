'use client';

import React, { useEffect, useState } from 'react';
import { X, Smartphone, Play, Sparkles, CheckCircle2 } from 'lucide-react';
import { ParkOnStorage } from '@/lib/storage';

interface WelcomeModalProps {
  onOpenInstallGuide?: () => void;
}

export function WelcomeModal({ onOpenInstallGuide }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 웰컴 팝업 노출 조건 판정:
    // 1. 이미 '그냥 시작하기'를 눌렀거나 웰컴을 확인한 적이 있으면(parkon_welcomed) 자동 팝업 안 뜸
    // 2. 이미 카카오 로그인이 되어 있거나 PWA 홈 화면 바로가기(standalone)로 실행 중이면 안 뜸
    if (typeof window === 'undefined') return;

    const isWelcomed = localStorage.getItem('parkon_welcomed') === 'true';
    const hasKakao = Boolean(ParkOnStorage.getKakaoUser());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (!isWelcomed && !hasKakao && !isStandalone) {
      // 첫 방문자에게 매끄럽게 팝업 오픈
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleJustStart = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parkon_welcomed', 'true');
    }
    setIsOpen(false);
  };

  const handleInstallAndUse = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parkon_welcomed', 'true');
    }
    setIsOpen(false);
    if (onOpenInstallGuide) {
      onOpenInstallGuide();
    } else {
      // 커스텀 이벤트 발생으로 InstallPrompt 또는 가이드 모달 호출
      window.dispatchEvent(new CustomEvent('parkon_open_install_guide'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scaleUp overflow-hidden border border-emerald-100 flex flex-col max-h-[92vh]">
        {/* 고정 상단 헤더: 언제든 바로 닫을 수 있는 X 버튼 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 shrink-0 bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shadow-xs">
              ⛳
            </span>
            <span className="text-xs font-black tracking-tight">
              파크온(PARKON) 첫 방문 환영
            </span>
          </div>
          <button
            type="button"
            onClick={handleJustStart}
            className="w-7 h-7 rounded-full bg-emerald-800/80 hover:bg-emerald-900 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition active:scale-95"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 스크롤 가능한 본문 */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 overscroll-contain text-center">
          {/* 공식 마스코트 파키 웰컴 사진 (28번: 파크골프장 한글 팻말 + Welcome 깃발) */}
          <div className="relative rounded-2xl overflow-hidden shadow-md border-2 border-emerald-300/80 bg-stone-100 aspect-square max-w-[270px] mx-auto group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/사진저장고_사진_20260913_28.jpg"
              alt="파크온 공식 마스코트 파키 환영인사"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-emerald-950/80 via-emerald-950/40 to-transparent p-2.5 text-white">
              <span className="text-[11px] font-black bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full shadow-xs inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 fill-emerald-950" />
                <span>공식 마스코트 파키(Parky)</span>
              </span>
            </div>
          </div>

          {/* 환영 메시지 */}
          <div className="space-y-1">
            <h2 className="text-lg font-black text-stone-900 leading-tight">
              대한민국 No.1 파크골프 길라잡이<br />
              <span className="text-emerald-700">파크온(PARKON)</span>에 오신 것을 환영합니다!
            </h2>
            <p className="text-[11.5px] text-stone-600 font-medium leading-relaxed">
              복잡한 회원가입 없이 <strong>0초 만에 스코어 기록</strong>하고,<br />
              전국 구장 실시간 잔디 상태와 내 공인 등급을 확인하세요.
            </p>
          </div>

          {/* 3대 핵심 특징 요약 */}
          <div className="bg-stone-50 rounded-2xl p-2.5 border border-stone-200/80 text-left space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-stone-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>터치 한 번으로 끝나는 <strong>0초 바로 스코어카드</strong></span>
            </div>
            <div className="flex items-center gap-2 text-stone-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>골퍼들이 직접 제보하는 <strong>3시간 실시간 잔디 상태</strong></span>
            </div>
            <div className="flex items-center gap-2 text-stone-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>전국 상위 % 백분위와 <strong>별 5개 공인 실력 등급</strong></span>
            </div>
          </div>

          {/* 대표님께서 지정하신 2개 핵심 버튼 */}
          <div className="space-y-2 pt-1">
            {/* 1번 버튼: PC나 모바일에 앱 깔아서 사용하기 */}
            <button
              type="button"
              onClick={handleInstallAndUse}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm rounded-2xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer border border-emerald-500"
            >
              <Smartphone className="w-5 h-5 text-amber-300 animate-bounce" />
              <span className="tracking-tight">
                PC · 스마트폰에 1초 앱 깔아서 사용하기
              </span>
            </button>

            {/* 2번 버튼: 그냥 시작하기 (둘러보기) */}
            <button
              type="button"
              onClick={handleJustStart}
              className="w-full py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-sm rounded-2xl transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-stone-200"
            >
              <Play className="w-4 h-4 text-emerald-700 fill-emerald-700" />
              <span>그냥 바로 시작하기 (둘러보기)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
