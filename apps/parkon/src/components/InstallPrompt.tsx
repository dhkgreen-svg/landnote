'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, ExternalLink, CheckCircle, Laptop, Rocket, Copy, Check, Sparkles } from 'lucide-react';
import { ParkOnStorage } from '@/lib/storage';
import { isKakaoTalkWebView, isLineWebView, isIOS, isAndroid, escapeKakaoTalk, autoEscapeIfKakao, copyCurrentUrl } from '@/lib/kakaoEscape';
import { InstallGuideModal } from '@/components/InstallGuideModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const { isJapanese } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIosDevice, setIsIosDevice] = useState<boolean>(false);
  const [isKakao, setIsKakao] = useState<boolean>(false);
  const [isLine, setIsLine] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [guideTab, setGuideTab] = useState<'KAKAO' | 'CHROME' | 'IOS'>('KAKAO');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. 이미 홈 화면 앱으로 실행 중인지 검사 (PWA Standalone)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      setShowBanner(false);
      return;
    }

    // 2. 기기 및 브라우저 환경 감지
    const kakaoMode = isKakaoTalkWebView();
    const lineMode = isLineWebView();
    const iosMode = isIOS();
    const inAppMode = kakaoMode || lineMode;
    setIsKakao(kakaoMode);
    setIsLine(lineMode);
    setIsIosDevice(iosMode);

    // 3. 카카오톡 또는 LINE 웹뷰인 경우: 최초 1회 자동 탈출 시도 (Phase 1 엔진)
    if (inAppMode) {
      setGuideTab('KAKAO');
      autoEscapeIfKakao();
      setShowBanner(true);
    } else {
      // 일반 브라우저인 경우: 기설치 여부 및 닫기 이력 확인
      if (iosMode) {
        setGuideTab('IOS');
      } else {
        setGuideTab('CHROME');
      }

      try {
        const everInstalled = localStorage.getItem('parkon_app_installed');
        if (everInstalled === 'true') {
          setIsInstalled(true);
          setShowBanner(false);
          return;
        }

        const dismissedUntil = localStorage.getItem('parkon_install_dismissed_until');
        if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
          setShowBanner(false);
          return;
        }
      } catch {
        // storage disabled fallback
      }

      setShowBanner(true);
    }

    // 4. Android / Chrome / Edge PWA 설치 이벤트 감청
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem('parkon_app_installed', 'true');
      } catch {}
    };

    const handleOpenInstallGuide = () => {
      setShowGuideModal(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('open-install-guide', handleOpenInstallGuide);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('open-install-guide', handleOpenInstallGuide);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 카카오톡 1초 원터치 탈출 버튼 클릭
  const handleKakaoEscapeClick = () => {
    escapeKakaoTalk();
  };

  // 설치 버튼 클릭 처리
  const handleInstallClick = async () => {
    if (isKakao) {
      // 카카오톡 내부에서는 바깥 브라우저 탈출 우선 실행
      escapeKakaoTalk();
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setShowBanner(false);
          try {
            localStorage.setItem('parkon_app_installed', 'true');
          } catch {}
        }
        setDeferredPrompt(null);
      } catch {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  // 배너 닫기 (7일 동안 숨김)
  const handleDismiss = () => {
    setShowBanner(false);
    const dismissUntil = Date.now() + 7 * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem('parkon_install_dismissed_until', String(dismissUntil));
    } catch {
      // ignore
    }
  };

  const handleCopy = async () => {
    const success = await copyCurrentUrl();
    if (success) {
      showToast('주소가 복사되었습니다! 크롬이나 사파리 주소창에 붙여넣어 주세요.');
    } else {
      showToast('주소 복사에 실패했습니다.');
    }
  };

  return (
    <>
      {/* 1. 카카오톡 또는 LINE 웹뷰 접속 시: 3D 파키 1초 원터치 탈출 배너 (Phase 1) */}
      {showBanner && (isKakao || isLine) && (
        <div className="bg-gradient-to-b from-amber-950 via-stone-900 to-emerald-950 text-white p-5 rounded-3xl shadow-2xl border-2 border-amber-400 mb-4 animate-fadeIn relative overflow-hidden text-center">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-amber-300/80 hover:text-white p-1.5 rounded-lg cursor-pointer transition z-20"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>

          {/* 골드 앰비언트 백라이트 */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            {/* 마스코트 파키 엠블럼 */}
            <div className="relative mb-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/parky.jpg"
                alt="파크골프 올인원 마스코트 파키"
                className="w-16 h-16 rounded-2xl shadow-xl border-2 border-amber-300 bg-emerald-950 object-cover"
              />
              <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-400 to-yellow-300 text-emerald-950 rounded-full px-2 py-0.5 text-[9px] font-black shadow-xs flex items-center gap-0.5">
                <Rocket className="w-2.5 h-2.5 text-emerald-950" /> {isJapanese ? '脱出ヘルパー' : '탈출 도우미'}
              </span>
            </div>

            {/* 타이틀 */}
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-yellow-300 drop-shadow-sm">
                {isLine || isJapanese
                  ? (isJapanese ? 'LINEから接続中！' : '라인(LINE)으로 접속하셨네요!')
                  : '카카오톡으로 접속하셨네요!'}
              </h2>
            </div>

            <p className="text-xs text-amber-100/90 font-medium mt-1 leading-snug px-2">
              {isLine || isJapanese
                ? (isJapanese
                  ? 'LINEアプリ内ではホーム画面へのアプリ追加が制限されます。下のボタンを押すと1秒でSafari・Chromeで開きます！'
                  : '라인 화면 안에서는 앱 설치가 제한됩니다. 아래 버튼을 누르면 1초 만에 바깥 브라우저로 탈출합니다!')
                : '카톡 안에서는 앱 설치가 차단됩니다. 아래 버튼을 누르면 크롬 · 사파리 정규 브라우저로 1초 만에 탈출합니다!'}
            </p>

            {/* 메인 1초 탈출 골드 액션 버튼 */}
            <button
              type="button"
              onClick={handleKakaoEscapeClick}
              className="mt-3.5 w-full max-w-xs py-3 px-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:brightness-105 active:scale-98 text-emerald-950 font-black text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border-2 border-amber-200 animate-pulse"
            >
              <Rocket className="w-4 h-4 text-emerald-950" />
              <span>
                {isLine || isJapanese
                  ? (isJapanese ? '🚀 外部ブラウザで開く (1秒脱出)' : '🚀 외부 브라우저에서 열기 (1초 탈출)')
                  : '🚀 크롬/사파리에서 열기 (1초 탈출)'}
              </span>
            </button>

            {/* 보조 링크: 주소 복사 & 수동 방법 */}
            <div className="mt-3 flex items-center justify-center gap-3 text-xs">
              <button
                type="button"
                onClick={handleCopy}
                className="text-amber-200 hover:text-white underline font-bold flex items-center gap-1 cursor-pointer transition text-[11px]"
              >
                <Copy className="w-3 h-3" />
                <span>{isJapanese ? 'URLをコピー' : '주소 복사하기'}</span>
              </button>
              <span className="text-stone-500">•</span>
              <button
                type="button"
                onClick={() => {
                  setGuideTab('KAKAO');
                  setShowGuideModal(true);
                }}
                className="text-amber-200 hover:text-white underline font-bold flex items-center gap-1 cursor-pointer transition text-[11px]"
              >
                <span>{isJapanese ? '手動脱出方法' : '직접 나가는 법 보기'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 일반 모바일 브라우저 접속 시: 공식 스마트 대문 & 1초 설치 배너 (Phase 2) */}
      {showBanner && !isKakao && (
        <div className="bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-950 text-white p-5 rounded-3xl shadow-xl border-2 border-amber-400/80 mb-4 animate-fadeIn relative overflow-hidden text-center">
          {/* 우측 상단 닫기 버튼 */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-emerald-300/70 hover:text-white p-1.5 rounded-lg cursor-pointer transition z-20"
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>

          {/* 배경 골드 앰비언트 조명 */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            {/* 1. 마스코트 파키(Parky) 엠블럼 */}
            <div className="relative mb-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/parky.jpg"
                alt="파크골프 올인원 마스코트 파키"
                className="w-16 h-16 rounded-2xl shadow-xl border-2 border-amber-300 bg-emerald-950 object-cover"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-emerald-950 rounded-full px-1.5 py-0.2 text-[9px] font-black shadow-xs">
                파키
              </span>
            </div>

            {/* 2. 대문 타이틀 */}
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
                파크골프 올인원
              </h2>
              <span className="bg-gradient-to-r from-amber-400 to-yellow-300 text-emerald-950 text-xs font-black px-2 py-0.5 rounded-md shadow-xs">
                ParkGolf All-in-One
              </span>
            </div>

            {/* 스마트 부제 */}
            <p className="text-xs text-emerald-200/90 font-medium mt-1">
              스마트 1초 스코어링 · 전국 400개 구장 실시간 날씨 · 룰 솔로몬 AI
            </p>

            {/* 3대 스마트 특징 뱃지 */}
            <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
              <span className="bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 text-[11px] font-bold px-2.5 py-1 rounded-full">
                ⚡ 1초 스코어
              </span>
              <span className="bg-emerald-950/80 border border-amber-400/60 text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-full">
                ⭐ 전국 5스타
              </span>
              <span className="bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 text-[11px] font-bold px-2.5 py-1 rounded-full">
                🧠 AI 솔로몬
              </span>
            </div>

            {/* 3. 스마트폰 홈 화면 앱 설치/실행 상태 안내 버튼 */}
            {!isStandalone && !isInstalled ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="mt-3.5 w-full max-w-xs py-2.5 px-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:brightness-105 active:scale-98 text-stone-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer border border-amber-300"
              >
                <Smartphone className="w-4 h-4 text-emerald-950" />
                <span>
                  {deferredPrompt
                    ? '📲 스마트폰 바탕화면에 1초 만에 깔기'
                    : isIosDevice
                    ? '📲 아이폰 바탕화면에 앱 추가하기'
                    : '스마트폰 홈 화면에 앱 추가'}
                </span>
              </button>
            ) : (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-amber-300 font-bold bg-emerald-950/70 px-3 py-1 rounded-full border border-amber-400/30">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>파크골프 올인원 공식 앱 모드 실행 중</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. 모바일 스크롤 중 언제든 접근 가능한 플로팅 FAB (Floating Action Button) */}
      {!isStandalone && (
        <div className="fixed bottom-24 right-3 z-40 animate-fadeIn">
          {isKakao || isLine ? (
            <button
              type="button"
              onClick={handleKakaoEscapeClick}
              className="py-2 px-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-emerald-950 font-black text-[11px] rounded-full shadow-xl border-2 border-amber-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition cursor-pointer"
              title={isJapanese ? '外部ブラウザで開く' : '크롬/사파리로 탈출'}
            >
              <Rocket className="w-3.5 h-3.5 text-emerald-950" />
              <span>{isJapanese ? '1秒脱出' : '1초 탈출'}</span>
            </button>
          ) : !isInstalled ? (
            <button
              type="button"
              onClick={handleInstallClick}
              className="py-2 px-3 bg-gradient-to-r from-emerald-800 to-emerald-900 text-yellow-300 font-black text-[11px] rounded-full shadow-xl border border-amber-400/70 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition cursor-pointer"
              title={isJapanese ? 'スマホ画面にアプリ追加' : '바탕화면 앱 설치'}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/parky.jpg" alt="파키" className="w-3.5 h-3.5 rounded-full object-cover border border-yellow-300" />
              <span>{isJapanese ? 'アプリ追加' : '앱 깔기'}</span>
            </button>
          ) : null}
        </div>
      )}

      {/* 4. 시니어 맞춤 가이드 모달 */}
      <InstallGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        initialTab={guideTab}
        deferredPrompt={deferredPrompt}
      />

      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl border border-amber-400/50 flex items-center gap-2 animate-fadeIn whitespace-nowrap pointer-events-none">
          <Check className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
