'use client';

import React, { useEffect, useState } from 'react';
import { X, Smartphone, Play, Sparkles, CheckCircle2, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { ParkOnStorage, KakaoAuthUser } from '@/lib/storage';

interface WelcomeModalProps {
  onOpenKakaoLogin?: () => void;
  onOpenInstallGuide?: () => void;
}

export function WelcomeModal({ onOpenKakaoLogin, onOpenInstallGuide }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isDismissed = localStorage.getItem('parkon_welcome_dismissed') === 'true';
    const isWelcomed = localStorage.getItem('parkon_welcomed') === 'true';
    const hasKakao = Boolean(ParkOnStorage.getKakaoUser());

    if (!isDismissed && !isWelcomed && !hasKakao) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveEffectiveName = (): string => {
    const effectiveName = guestName.trim() || '나이스버디';
    const profile = ParkOnStorage.getUserProfile();
    ParkOnStorage.saveUserProfile({
      ...profile,
      userName: effectiveName,
    });
    const guestUser: KakaoAuthUser = {
      id: 'guest_' + Date.now(),
      nickname: effectiveName,
      realName: effectiveName,
      aliasName: effectiveName,
      preferredDisplay: 'REAL',
      connectedAt: new Date().toISOString(),
    };
    ParkOnStorage.setKakaoUser(guestUser);

    if (typeof window !== 'undefined') {
      localStorage.setItem('parkon_welcomed', 'true');
      if (dontShowAgain) {
        localStorage.setItem('parkon_welcome_dismissed', 'true');
      }
    }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('parkon_profile_updated', { detail: { newName: effectiveName } }));
    return effectiveName;
  };

  // 1. 30초 프로그램 체험해보기 (손에 익을 때까지 가상 라운딩 연습)
  const handleStartPractice = () => {
    const effectiveName = saveEffectiveName();
    const virtualSession = ParkOnStorage.createVirtualRoundSession();
    if (virtualSession && virtualSession.players && virtualSession.players[0]) {
      virtualSession.players[0].name = effectiveName;
      ParkOnStorage.saveCurrentRound(virtualSession);
    }
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('parkon_show_header_login_tip', { detail: { name: effectiveName } }));
    window.location.href = `/round/${virtualSession.id}`;
  };

  // 2. 오늘 바로 구장 선택하고 실전 라운딩하기
  const handleStartReal = () => {
    const effectiveName = saveEffectiveName();
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('parkon_show_header_login_tip', { detail: { name: effectiveName } }));
  };

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parkon_welcomed', 'true');
      if (dontShowAgain) {
        localStorage.setItem('parkon_welcome_dismissed', 'true');
      }
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scaleUp overflow-hidden border border-emerald-200 flex flex-col max-h-[94vh]">
        {/* 상단 헤더 바 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-600 shrink-0 bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shadow-xs">
              ⛳
            </span>
            <span className="text-xs font-black tracking-tight">
              종이 없는 파크골프, 파크온(PARKON)
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-emerald-800/80 hover:bg-emerald-900 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition active:scale-95"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 스크롤 가능한 본문 */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 overscroll-contain text-center">
          {/* 핑키 마스코트 사진 */}
          <div className="relative rounded-2xl overflow-hidden shadow-md border-2 border-emerald-400/80 bg-stone-100 aspect-square max-w-[170px] mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/사진저장고_사진_20260913_28.jpg"
              alt="파크온 공식 마스코트 핑키 환영인사"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/40 to-transparent p-1.5 text-white">
              <span className="text-[10px] font-black bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full shadow-xs inline-flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 fill-emerald-950" />
                <span>공식 마스코트 핑키(Pinky)</span>
              </span>
            </div>
          </div>

          {/* 환영 인사 & 거부감 제로 안심 문구 */}
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
              반갑습니다! <span className="text-emerald-700">파크온</span>에 오신 것을 환영합니다!
            </h2>
            <p className="text-xs text-emerald-800 font-bold bg-emerald-50 py-1 px-2.5 rounded-xl border border-emerald-200 inline-block">
              ✓ 회원가입 안 하셔도 100% 무료로 바로 사용하실 수 있습니다.
            </p>
          </div>

          {/* 1초 이름/별명 입력창 */}
          <div className="p-3 bg-stone-50 border-2 border-emerald-200 rounded-2xl text-left space-y-1.5">
            <label className="font-black text-xs text-stone-900 flex items-center justify-between">
              <span>✍️ 스코어보드에 표시될 이름(별명) 입력</span>
              <span className="text-[10px] text-emerald-700 font-bold">1초 완료</span>
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="이름 또는 별명 입력 (예: 김대희, 나이스버디)"
              maxLength={12}
              className="w-full px-3 py-2 bg-white border-2 border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 rounded-xl font-black text-xs text-stone-900 placeholder:text-stone-400 outline-hidden transition"
            />
            <p className="text-[10px] text-stone-500 font-medium">
              * 입력하신 이름이 스코어카드 1번 선수(본인)로 자동 등록됩니다.
            </p>
          </div>

          {/* 2대 실행 버튼 */}
          <div className="space-y-2 pt-0.5">
            {/* 버튼 1: 30초 손맛 체험 */}
            <button
              type="button"
              onClick={handleStartPractice}
              className="w-full py-3 px-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-800"
            >
              <Play className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span>🏌️ 30초 프로그램 체험해보기 (손에 익을 때까지 연습)</span>
            </button>

            {/* 버튼 2: 바로 실전 구장 선택 */}
            <button
              type="button"
              onClick={handleStartReal}
              className="w-full py-2.5 px-3 bg-white hover:bg-stone-100 active:scale-95 text-stone-800 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer border-2 border-stone-300"
            >
              <span>⛳ 오늘 바로 구장 선택하고 실전 라운딩하기</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
            </button>
          </div>

          {/* 카카오 가입 팁 (비밀번호 없는 1초 확인 안내) */}
          <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 text-left space-y-1 text-[11px] text-stone-700 font-medium">
            <div className="flex items-center gap-1 font-black text-amber-900 text-xs">
              <span>💬</span>
              <span>마음에 드시면 나중에 카카오로 1초 등록!</span>
            </div>
            <p className="leading-snug text-stone-600">
              상단의 내 이름을 누르시면 카카오톡 창이 뜹니다. <strong>[확인]만 누르면 비밀번호 없이 1초 만에 자동 가입</strong>되어 평생 무료로 기록이 보관됩니다.
            </p>
          </div>

          {/* 하단 다시 보지 않기 & 닫기 */}
          <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 px-1">
            <label className="flex items-center gap-1.5 cursor-pointer select-none font-bold text-[11px] text-stone-600 hover:text-stone-900">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded-sm accent-emerald-700 cursor-pointer"
              />
              <span>이 안내를 다시 보지 않기</span>
            </label>
            <button
              type="button"
              onClick={handleClose}
              className="text-stone-500 hover:text-stone-800 font-black text-[11px] underline cursor-pointer p-1"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
