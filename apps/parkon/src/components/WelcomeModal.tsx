'use client';

import React, { useEffect, useState } from 'react';
import { X, Play, Sparkles, ShieldCheck, Lock } from 'lucide-react';
import { ParkOnStorage, KakaoAuthUser } from '@/lib/storage';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface WelcomeModalProps {
  onOpenKakaoLogin?: () => void;
  onOpenInstallGuide?: () => void;
}

export function WelcomeModal({ onOpenKakaoLogin, onOpenInstallGuide }: WelcomeModalProps) {
  const { isJapanese } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [realNameInput, setRealNameInput] = useState('');
  const [aliasNameInput, setAliasNameInput] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const urlParams = new URLSearchParams(window.location.search);
    const forceWelcome = urlParams.get('welcome') === 'true' || urlParams.get('first') === 'true';
    const shouldReset = urlParams.get('reset') === 'true';

    if (shouldReset) {
      localStorage.removeItem('parkon_welcomed');
      localStorage.removeItem('parkon_welcome_dismissed');
      localStorage.removeItem('parkon_kakao_user');
      localStorage.removeItem('parkon_user_profile');
      localStorage.removeItem('parkon_current_round');
      localStorage.removeItem('parkon_app_installed');
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
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
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
    }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('parkon_profile_updated', { detail: { newName: effectiveReal || '플레이어' } }));
    return { realName: effectiveReal || '플레이어', aliasName: effectiveAlias };
  };

  // 1. 1초 만에 바로 시작하기 (가상 세션 생성 후 최상단 스크롤과 함께 1번 홀 직행)
  const handleStartPractice = () => {
    const { realName } = saveEffectiveName();
    const virtualSession = ParkOnStorage.createVirtualRoundSession();
    if (virtualSession && virtualSession.players && virtualSession.players[0]) {
      virtualSession.players[0].name = realName;
      ParkOnStorage.saveCurrentRound(virtualSession);
    }
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
    }
    window.dispatchEvent(new CustomEvent('parkon_show_header_login_tip', { detail: { name: realName } }));
    window.location.href = `/round/${virtualSession.id}`;
  };

  // 2. 모달 내 앱 설치하기 버튼 핸들러
  const handleAppInstallClick = async () => {
    const ua = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
    const isIos = /iphone|ipad|ipod/.test(ua) && !ua.includes('crios');

    // 1) 애플 아이폰/아이패드 사파리인 경우: 우리가 제작한 3단계 설치 가이드 모달 즉시 실행
    if (isIos) {
      setIsOpen(false);
      if (onOpenInstallGuide) onOpenInstallGuide();
      return;
    }

    // 2) 안드로이드/크롬 환경: PWA 자동 설치창 직접 호출
    if (deferredPrompt && deferredPrompt.prompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          try {
            localStorage.setItem('parkon_app_installed', 'true');
          } catch {}
          setIsOpen(false);
        }
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.warn('Install prompt error', err);
      }
    }

    // 3) 폴백: 설치 안내 모달 표출
    setIsOpen(false);
    if (onOpenInstallGuide) {
      onOpenInstallGuide();
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parkon_welcomed', 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    /* 대표님 지침: 중간에 뜨지 않고 항상 제일 위(최상단)를 기준으로 팝업 창이 시작되도록 items-start 및 상단 마진 설정 */
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-start justify-center p-2.5 sm:p-4 pt-2 sm:pt-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scaleUp overflow-hidden border-2 border-emerald-300 flex flex-col mb-8 mt-1 sm:mt-2">
        {/* 상단 헤더 바 */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-600 shrink-0 bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-[11px] shadow-xs">
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

        {/* 본문 콘텐츠 (컴팩트 세로 높이) */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1 overscroll-contain text-center">
          {/* 파키 마스코트 사진 */}
          <div className="relative rounded-2xl overflow-hidden shadow-md border-2 border-emerald-400/80 bg-stone-100 aspect-square max-w-[85px] sm:max-w-[95px] mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/사진저장고_사진_20260913_28.jpg"
              alt="파크골프 올인원 공식 마스코트 파키 환영인사"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/40 to-transparent p-1 text-white">
              <span className="text-[9px] font-black bg-amber-400 text-emerald-950 px-1.5 py-0.2 rounded-full shadow-xs inline-flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 fill-emerald-950" />
                <span>{isJapanese ? '公式マスコット パキ' : '공식 마스코트 파키'}</span>
              </span>
            </div>
          </div>

          {/* 환영 인사 문구 */}
          <div>
            <h2 className="text-sm sm:text-base font-black text-stone-900 leading-snug">
              {isJapanese ? (
                <>
                  ようこそ！ <span className="text-emerald-700">パークゴルフ オールインワン</span>へ！
                </>
              ) : (
                <>
                  반갑습니다! <span className="text-emerald-700">파크골프 올인원</span>에 오신 것을 환영합니다!
                </>
              )}
            </h2>
          </div>

          {/* 3대 안심 보증 배지 */}
          <div className="grid grid-cols-3 gap-1.5 py-0.5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-1.5 flex flex-col items-center justify-center gap-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[10px] font-black text-emerald-950 leading-tight">
                {isJapanese ? '100% 永久無料' : '100% 평생무료'}
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-1.5 flex flex-col items-center justify-center gap-0.5">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[10px] font-black text-emerald-950 leading-tight">
                {isJapanese ? '登録・パス不要' : '가입·비번 없음'}
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-1.5 flex flex-col items-center justify-center gap-0.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[10px] font-black text-emerald-950 leading-tight">
                {isJapanese ? '1秒 即時スタート' : '1초 즉시 실행'}
              </span>
            </div>
          </div>

          {/* 성명 및 별명 (선택) 입력 카드 */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-2.5 text-left space-y-2">
            <div>
              <label className="text-xs font-black text-stone-800 block mb-0.5">
                {isJapanese ? 'お名前' : '성명'}
              </label>
              <input
                type="text"
                value={realNameInput}
                onChange={(e) => setRealNameInput(e.target.value)}
                placeholder={isJapanese ? 'お名前を入力してください' : '성명을 입력해 주세요'}
                maxLength={10}
                className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-bold text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
              />
            </div>
            <div>
              <label className="text-xs font-black text-stone-800 block mb-0.5">
                {isJapanese ? 'ニックネーム (選択)' : '별명 (선택)'}
              </label>
              <input
                type="text"
                value={aliasNameInput}
                onChange={(e) => setAliasNameInput(e.target.value)}
                placeholder={isJapanese ? 'ニックネームを入力してください' : '별명을 입력해 주세요'}
                maxLength={10}
                className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-bold text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
              />
            </div>
          </div>

          {/* 2대 원터치 실행 버튼 (1초 바로 해보기 vs 앱 설치하기) */}
          <div className="space-y-2 pt-0.5">
            {/* 1. 설치 안 하고 바로 1번 홀 체험해보기 */}
            <button
              type="button"
              onClick={handleStartPractice}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border border-emerald-800"
            >
              <Play className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
              <span>
                {isJapanese
                  ? '🏌️ 1秒ですぐ体験してみる ▶'
                  : '🏌️ 1초 만에 바로 해보기 ▶'}
              </span>
            </button>

            {/* 2. 휴대폰에 앱 설치하기 버튼 */}
            <button
              type="button"
              onClick={handleAppInstallClick}
              className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] border-2 border-emerald-600 text-yellow-300 font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.png"
                alt="파키 심볼"
                className="w-4 h-4 rounded-md border border-amber-300 object-cover shrink-0"
              />
              <span>
                {isJapanese
                  ? '📲 スマホにアプリインストール'
                  : '📲 휴대폰에 앱 설치하기'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
