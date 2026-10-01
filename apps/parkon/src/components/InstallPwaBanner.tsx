'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { X, Smartphone, Share2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPwaBanner() {
  const pathname = usePathname();
  const { isJapanese } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. 이미 홈 화면 PWA(standalone)로 실행 중이면 배너 영구 숨김
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) {
      setShowBanner(false);
      return;
    }

    // 2. 당일 닫기(X) 이력 확인 (24시간 동안 숨김)
    try {
      const dismissedUntil = localStorage.getItem('parkon_pwa_dismissed_until');
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        setShowBanner(false);
        return;
      }
    } catch {
      // fallback
    }

    // 3. iOS 기기 감지
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !userAgent.includes('crios');
    setIsIos(isIosDevice);

    // 4. 안드로이드 / 크롬 / 삼성인터넷 PWA 설치 이벤트 가로채기
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true); // 시니어 맞춤형 설치 배너 표출
    };

    const handleAppInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      try {
        localStorage.setItem('parkon_app_installed', 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // iOS 기기이면서 브라우저로 접속한 경우 (사파리)
    if (isIosDevice && !isStandaloneMode) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // 1) 안드로이드/크롬 설치 프롬프트가 준비된 경우
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      } catch {
        // fallback
      }
      return;
    }

    // 2) iOS 사파리인 경우 친절한 안내 팝업 출현
    if (isIos) {
      setShowIosModal(true);
      return;
    }

    // 3) 브라우저 기본 설치 지원이 안 되는 환경 안내
    alert(
      isJapanese
        ? 'ブラウザ右上のメニュー [⋮] または共有ボタンから「ホーム画面に追加」をタップしてください。'
        : '브라우저 오른쪽 상단 메뉴 [⋮] 또는 공유 버튼을 눌러 [홈 화면에 추가] 또는 [앱 설치]를 선택하시면 바탕화면에 설치됩니다.'
    );
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      // 24시간 동안 숨김 처리
      localStorage.setItem('parkon_pwa_dismissed_until', String(Date.now() + 24 * 60 * 60 * 1000));
    } catch {}
  };

  if (pathname === '/install' || pathname?.startsWith('/round/') || isStandalone || !showBanner) return null;

  return (
    <>
      {/* 🚀 시니어 맞춤형 원터치 바탕화면 설치 고대비 배너 */}
      <aside
        aria-label="바탕화면 바로가기 설치"
        className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-[75] bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 border-2 border-emerald-400 text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-md border-2 border-emerald-300 shrink-0">
            ⛳
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-white tracking-tight">
                {isJapanese ? 'スマホのホーム画面に登録' : '휴대폰 바탕화면에 등록'}
              </span>
              <span className="text-[9px] bg-amber-400 text-stone-950 font-black px-1.5 py-0.2 rounded-full">
                {isJapanese ? '無料' : '무료'}
              </span>
            </div>
            <div className="text-[11px] text-emerald-200 font-medium mt-0.5">
              {isJapanese ? '検索なしでアプリのようにすぐ起動' : '매번 검색 없이 앱처럼 바로 실행'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-stone-950 font-black px-4 py-2.5 rounded-2xl text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer touch-manipulation border border-emerald-300"
          >
            {isJapanese ? 'インストール' : '설치하기'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="닫기"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 🍎 아이폰(iOS Safari) 전용 홈 화면 추가 안내 모달 */}
      {showIosModal && (
        <div className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-stone-200 text-stone-900">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍎</span>
                <h3 className="text-base font-black text-stone-900">
                  {isJapanese ? 'iPhone ホーム画面追加案内' : '아이폰 홈 화면 앱 설치 안내'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-stone-700">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  {isJapanese
                    ? 'Safariブラウザ画面下部中央の [共有ボタン (四角と矢印)] をタップします。'
                    : '사파리(Safari) 화면 맨 아래 중앙의 [공유 버튼 (네모 위 화살표 ⎋)] 를 누릅니다.'}
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  {isJapanese
                    ? 'メニューを少し上にスクロールし、[ホーム画面に追加 (+)] をタップします。'
                    : '메뉴를 위로 살짝 올려서 [홈 화면에 추가 (+)] 를 터치합니다.'}
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-300">
                <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  {isJapanese
                    ? '画面右上の [追加] を押すと、iPhoneのホーム画面にアプリアイコンが生成されます！'
                    : '오른쪽 상단 [추가] 를 누르면 아이폰 바탕화면에 파크골프 올인원 앱 아이콘이 바로 생성됩니다!'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow transition cursor-pointer"
            >
              {isJapanese ? '確認しました' : '확인했습니다'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
