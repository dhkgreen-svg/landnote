'use client';

import React, { useEffect, useState } from 'react';
import { X, Play, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Lock, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { ParkOnStorage, KakaoAuthUser } from '@/lib/storage';

interface WelcomeModalProps {
  onOpenKakaoLogin?: () => void;
  onOpenInstallGuide?: () => void;
}

export function WelcomeModal({ onOpenKakaoLogin, onOpenInstallGuide }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [realNameInput, setRealNameInput] = useState('');
  const [aliasNameInput, setAliasNameInput] = useState('');
  const [showCustomNameInput, setShowCustomNameInput] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const forceWelcome = urlParams.get('welcome') === 'true' || urlParams.get('first') === 'true';
    const shouldReset = urlParams.get('reset') === 'true';

    if (shouldReset) {
      localStorage.removeItem('parkon_welcomed');
      localStorage.removeItem('parkon_welcome_dismissed');
      localStorage.removeItem('parkon_kakao_user');
      localStorage.removeItem('parkon_user_profile');
      localStorage.removeItem('parkon_current_round');
    }

    const isDismissed = localStorage.getItem('parkon_welcome_dismissed') === 'true';
    const isWelcomed = localStorage.getItem('parkon_welcomed') === 'true';
    const hasKakao = Boolean(ParkOnStorage.getKakaoUser());

    let timer: NodeJS.Timeout | null = null;
    if (forceWelcome || shouldReset || (!isDismissed && !isWelcomed && !hasKakao)) {
      timer = setTimeout(() => {
        setIsOpen(true);
      }, 300);
    }

    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('parkon_open_welcome_modal', handleOpenEvent);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('parkon_open_welcome_modal', handleOpenEvent);
    };
  }, []);

  const saveEffectiveName = (): { realName: string; aliasName: string } => {
    const rawReal = realNameInput.trim();
    const effectiveReal = rawReal && rawReal !== '홍길동' ? rawReal : '';
    const effectiveAlias = aliasNameInput.trim() || '파크골퍼';
    const profile = ParkOnStorage.getUserProfile();
    ParkOnStorage.saveUserProfile({
      ...profile,
      userName: effectiveReal || '플레이어',
    });
    if (effectiveReal) {
      const guestUser: KakaoAuthUser = {
        id: 'guest_' + Date.now(),
        nickname: effectiveAlias,
        realName: effectiveReal,
        aliasName: effectiveAlias,
        preferredDisplay: 'REAL',
        connectedAt: new Date().toISOString(),
      };
      ParkOnStorage.setKakaoUser(guestUser);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('parkon_welcomed', 'true');
      if (dontShowAgain) {
        localStorage.setItem('parkon_welcome_dismissed', 'true');
      }
    }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('parkon_profile_updated', { detail: { newName: effectiveReal || '플레이어' } }));
    return { realName: effectiveReal || '플레이어', aliasName: effectiveAlias };
  };

  // 1. 1초 만에 바로 시작하기 (가상 세션 생성 후 1번 홀 티박스 직행)
  const handleStartPractice = () => {
    const { realName } = saveEffectiveName();
    const virtualSession = ParkOnStorage.createVirtualRoundSession();
    if (virtualSession && virtualSession.players && virtualSession.players[0]) {
      virtualSession.players[0].name = realName;
      ParkOnStorage.saveCurrentRound(virtualSession);
    }
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('parkon_show_header_login_tip', { detail: { name: realName } }));
    window.location.href = `/round/${virtualSession.id}`;
  };

  // 2. 오늘 바로 구장 선택하고 실전 라운딩하기 (홈 화면 이동)
  const handleStartReal = () => {
    const { realName } = saveEffectiveName();
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('parkon_show_header_login_tip', { detail: { name: realName } }));
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scaleUp overflow-hidden border-2 border-emerald-300 flex flex-col max-h-[94vh]">
        {/* 상단 헤더 바 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-600 shrink-0 bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shadow-xs">
              ⛳
            </span>
            <span className="text-xs font-black tracking-tight">
              종이 없는 파크골프, 파크골프 올인원
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
          {/* 파키 마스코트 사진 */}
          <div className="relative rounded-2xl overflow-hidden shadow-md border-2 border-emerald-400/80 bg-stone-100 aspect-square max-w-[155px] mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/사진저장고_사진_20260913_28.jpg"
              alt="파크골프 올인원 공식 마스코트 파키 환영인사"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/40 to-transparent p-1.5 text-white">
              <span className="text-[10px] font-black bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full shadow-xs inline-flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 fill-emerald-950" />
                <span>공식 마스코트 파키(Paki)</span>
              </span>
            </div>
          </div>

          {/* 환영 인사 문구 */}
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
              반갑습니다! <span className="text-emerald-700">파크골프 올인원</span>에 오신 것을 환영합니다!
            </h2>
            <p className="text-xs text-stone-600 font-bold">
              전국 400개 구장 날씨·길안내부터 1초 스코어보드까지 올인원
            </p>
          </div>

          {/* 3대 안심 보증 배지 (초보자 심리적 거부감 완벽 해소) */}
          <div className="grid grid-cols-3 gap-1.5 py-1">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex flex-col items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-[10px] font-black text-emerald-950 leading-tight">100% 평생무료</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex flex-col items-center justify-center gap-1">
              <Lock className="w-4 h-4 text-emerald-700" />
              <span className="text-[10px] font-black text-emerald-950 leading-tight">가입·비번 없음</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex flex-col items-center justify-center gap-1">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span className="text-[10px] font-black text-emerald-950 leading-tight">1초 즉시 실행</span>
            </div>
          </div>

          {/* 가상 활동명 안내 카드 (본명: 홍길동, 별명: 손오공 기본 세팅) */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-left space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-stone-800">👤 기본 활동명</span>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  자동 준비 완료
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomNameInput(!showCustomNameInput)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer underline"
              >
                <Edit3 className="w-3 h-3" />
                <span>{showCustomNameInput ? '접기' : '내 이름 직접 적기'}</span>
                {showCustomNameInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* 기본 활동명 뱃지 표시 */}
            {/* 기본 활동명 뱃지 표시 */}
            {!showCustomNameInput ? (
              <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs">
                <span className="text-stone-500 font-bold">성명:</span>
                <span className="font-black text-stone-900">{realNameInput.trim() || '성명 미입력'}</span>
                <span className="text-stone-300">|</span>
                <span className="text-stone-500 font-bold">별명:</span>
                <span className="font-black text-stone-900">{aliasNameInput.trim() || '파크골퍼'}</span>
                <span className="ml-auto text-[10px] text-emerald-700 font-bold">(터치하여 직접 입력)</span>
              </div>
            ) : (
              /* 이름 직접 변경 폼 (키보드는 유저가 클릭했을 때만 펼쳐짐) */
              <div className="space-y-2 pt-1 animate-fadeIn">
                <div>
                  <label className="text-[10px] font-bold text-stone-600 block mb-0.5">실제 성함 (실명)</label>
                  <input
                    type="text"
                    value={realNameInput}
                    onChange={(e) => setRealNameInput(e.target.value)}
                    placeholder="성함을 입력하세요 (예: 김대희)"
                    maxLength={10}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-600 block mb-0.5">별명 (닉네임)</label>
                  <input
                    type="text"
                    value={aliasNameInput}
                    onChange={(e) => setAliasNameInput(e.target.value)}
                    placeholder="예: 나이스샷, 홀인원"
                    maxLength={10}
                    className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>
            )}
            <p className="text-[10px] text-stone-500 leading-tight">
              💡 상단 [성명 입력] 버튼을 통해 언제든 내 이름과 별명을 자유롭게 변경하실 수 있습니다.
            </p>
          </div>

          {/* 초대형 원터치 메인 CTA 버튼 (초보자 허들 제로: 1번 홀 직행) */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleStartPractice}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border border-emerald-800"
            >
              <Play className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
              <span>🏌️ 1초 만에 바로 시작하기 (1번 홀 직행) ▶</span>
            </button>

            {/* 보조 버튼: 오늘 실전 구장 둘러보기 */}
            <button
              type="button"
              onClick={handleStartReal}
              className="w-full py-2.5 px-3 bg-white hover:bg-stone-50 active:scale-95 text-stone-800 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer border-2 border-stone-300"
            >
              <span>⛳ 전국 구장 목록 둘러보기</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
            </button>
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
