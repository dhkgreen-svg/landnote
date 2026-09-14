'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, ExternalLink, CheckCircle } from 'lucide-react';
import { ParkOnStorage } from '@/lib/storage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isKakao, setIsKakao] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false); // 클라이언트 검사 전 깜빡임 방지
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [guideTab, setGuideTab] = useState<'KAKAO' | 'CHROME' | 'IOS'>('KAKAO');

  useEffect(() => {
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

    // 2. 로그인 이력이 있는 경우 -> 대문 앱 추가 배너 영구 숨김
    const kakaoUser = ParkOnStorage.getKakaoUser();
    if (kakaoUser) {
      setShowBanner(false);
      return;
    }

    // 3. 라운딩을 1회라도 진행했거나 완료한 이력이 있는 경우 -> 영구 숨김
    const completedRounds = ParkOnStorage.getCompletedRounds();
    const currentRound = ParkOnStorage.getCurrentRound();
    if (completedRounds.length > 0 || currentRound) {
      setShowBanner(false);
      return;
    }

    // 4. 이전에 'X' 닫기를 눌렀거나 설치를 마친 경우 -> 숨김
    try {
      const dismissedUntil = localStorage.getItem('parkon_install_dismissed_until');
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        setShowBanner(false);
        return;
      }
      const everInstalled = localStorage.getItem('parkon_app_installed');
      if (everInstalled === 'true') {
        setShowBanner(false);
        return;
      }
    } catch {
      // storage disabled fallback
    }

    // 위 조건(로그인, 라운딩, 기설치, 닫기)에 해당하지 않는 신규 첫 방문자에게만 1회 노출
    setShowBanner(true);

    // 5. 기기 및 브라우저 환경 감지
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isKakaoTalk = userAgent.includes('kakaotalk');

    setIsIos(isIosDevice);
    setIsKakao(isKakaoTalk);
    setGuideTab(isIosDevice ? 'IOS' : 'KAKAO');

    // 6. Android / Chrome / Edge PWA 설치 이벤트
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

  // 설치 버튼 클릭 처리
  const handleInstallClick = async () => {
    if (isKakao) {
      // 카카오톡 인앱 브라우저 내부에서는 외부 브라우저 실행 안내
      setShowGuideModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      } catch {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  // 배너 닫기 (30일 동안 숨김)
  const handleDismiss = () => {
    setShowBanner(false);
    const dismissUntil = Date.now() + 30 * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem('parkon_install_dismissed_until', String(dismissUntil));
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* 파크온 공식 스마트 대문 (Brand Hero Gate) */}
      {showBanner && (
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
                alt="파크온 마스코트 파키"
                className="w-18 h-18 rounded-2xl shadow-xl border-2 border-amber-300 bg-emerald-950 object-cover"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-emerald-950 rounded-full px-1.5 py-0.2 text-[9px] font-black shadow-xs">
                파키
              </span>
            </div>

            {/* 2. 엠블럼 바로 밑: 파크온 대문 타이틀 (확실하고 스마트하게) */}
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
                파크온
              </h2>
              <span className="bg-gradient-to-r from-amber-400 to-yellow-300 text-emerald-950 text-xs font-black px-2 py-0.5 rounded-md shadow-xs">
                ParkOn
              </span>
            </div>

            {/* 스마트 부제 */}
            <p className="text-xs text-emerald-200/90 font-medium mt-1">
              스마트 1초 스코어링 · 전국 5스타 랭킹 · 룰 솔로몬 AI
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
                <span>스마트폰 홈 화면에 앱 추가</span>
              </button>
            ) : (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-amber-300 font-bold bg-emerald-950/70 px-3 py-1 rounded-full border border-amber-400/30">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>파크온 공식 앱 모드 실행 중</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. 환경별 3초 앱 설치 상세 가이드 팝업 */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-yellow-300" />
                <h3 className="font-extrabold text-base">스마트폰 바탕화면 앱 설치</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-stone-800">
              {/* 기존 구버전 삭제 안내 */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 leading-relaxed">
                <div className="font-extrabold flex items-center gap-1.5 text-red-800 mb-1">
                  <span className="text-sm">⚠️</span>
                  <span className="font-black">[필수] 기존 구버전 바로가기는 먼저 삭제해 주세요</span>
                </div>
                <p className="text-[11px] text-red-700 font-medium">
                  이전 임시 주소 시절 만들어진 바탕화면 아이콘은 <strong>1~2초간 꾹 눌러 [삭제]</strong>해 주셔야 새 공식 주소(parkongolf.com)와 충돌하지 않습니다.
                </p>
              </div>

              {/* 앱 아이콘 미리보기 */}
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icon.png"
                  alt="파크온 앱 아이콘"
                  className="w-13 h-13 rounded-2xl shadow-md border-2 border-amber-300 shrink-0 object-cover"
                />
                <div className="min-w-0">
                  <div className="text-xs font-black text-emerald-950 flex items-center gap-1">
                    <span>새로운 파키 심볼 바로가기</span>
                    <span className="bg-amber-400 text-emerald-950 px-1 py-0.2 rounded text-[9px] font-black">
                      공식
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                    설치 후 누르면 주소창 없는 전체화면 전용 앱으로 바로 열립니다.
                  </div>
                </div>
              </div>

              {/* 브라우저가 원클릭 설치를 지원할 때 표시되는 1초 자동 추가 버튼 */}
              {deferredPrompt && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      deferredPrompt.prompt();
                      const { outcome } = await deferredPrompt.userChoice;
                      if (outcome === 'accepted') {
                        setIsInstalled(true);
                        setShowGuideModal(false);
                        setShowBanner(false);
                      }
                      setDeferredPrompt(null);
                    } catch {}
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:brightness-105 active:scale-98 text-emerald-950 font-black text-xs rounded-xl shadow-md border border-amber-300 flex items-center justify-center gap-2 cursor-pointer transition animate-bounce"
                >
                  <Smartphone className="w-4 h-4 text-emerald-950" />
                  <span>스마트폰에 바로가기 1초 자동 추가</span>
                </button>
              )}

              {/* 스마트폰 (모바일) 설치 안내 - 시니어 맞춤 3단 분기 */}
              <div className="space-y-3">
                {/* 모바일 브라우저 유형 선택 탭 */}
                <div className="p-1 bg-stone-100 rounded-xl border border-stone-200 grid grid-cols-3 gap-1 text-xs font-black">
                  <button
                    type="button"
                    onClick={() => setGuideTab('KAKAO')}
                    className={`py-2 px-1.5 rounded-lg transition cursor-pointer flex flex-col items-center justify-center gap-0.5 text-center ${
                      guideTab === 'KAKAO'
                        ? 'bg-amber-400 text-emerald-950 shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span className="text-sm">💬</span>
                    <span className="text-[11px] leading-tight font-black">카톡 링크 (필독)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuideTab('CHROME')}
                    className={`py-2 px-1.5 rounded-lg transition cursor-pointer flex flex-col items-center justify-center gap-0.5 text-center ${
                      guideTab === 'CHROME'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span className="text-sm">🌐</span>
                    <span className="text-[11px] leading-tight font-black">크롬 · 삼성인터넷</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuideTab('IOS')}
                    className={`py-2 px-1.5 rounded-lg transition cursor-pointer flex flex-col items-center justify-center gap-0.5 text-center ${
                      guideTab === 'IOS'
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <span className="text-sm">🍎</span>
                    <span className="text-[11px] leading-tight font-black">아이폰 (사파리)</span>
                  </button>
                </div>

                {/* 1) 카카오톡 링크로 접속한 경우 (가장 많은 시니어 사례) */}
                {guideTab === 'KAKAO' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs text-amber-950 leading-relaxed font-bold">
                      <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs mb-1">
                        <span>⚠️</span>
                        <span>카카오톡 화면 안에서는 앱 설치가 제한됩니다!</span>
                      </div>
                      카톡 내부에서는 보안상 바로 깔리지 않으므로, <strong className="underline text-emerald-900 font-black">아래 5단계 순서대로 딱 1번만</strong> 진행하시면 스마트폰 바탕화면에 정상적으로 깔립니다:
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {/* 1단계 */}
                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border-2 border-amber-200 shadow-xs">
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-xs">
                          1
                        </span>
                        <div className="leading-relaxed">
                          카카오톡 화면 <strong className="text-emerald-900 font-black">우측 하단 (또는 우측 상단)</strong>의{' '}
                          <span className="font-black text-emerald-950 bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300">
                            점 세 개 [···] 또는 [⋮]
                          </span>{' '}
                          더보기 메뉴를 터치합니다.
                        </div>
                      </div>

                      {/* 2단계 */}
                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border-2 border-emerald-300 shadow-xs">
                        <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-xs">
                          2
                        </span>
                        <div className="leading-relaxed">
                          나오는 메뉴 목록에서 <strong className="text-rose-600 underline font-black">위에서 3번째</strong>에 있는{' '}
                          <span className="font-black text-white bg-emerald-700 px-2 py-0.5 rounded shadow-xs inline-block my-0.5">
                            [다른 브라우저로 보기]
                          </span>{' '}
                          (또는 다른 브라우저로 열기)를 터치합니다.
                          <div className="mt-1.5 p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 font-bold leading-normal">
                            💡 <strong>왜 3번째를 눌러야 하나요?</strong><br />
                            카톡 화면 안에서는 앱 설치 기능이 없기 때문에, 이 3번째 버튼을 눌러야 <strong>크롬(Chrome)이나 삼성인터넷 새 창</strong>으로 전환되어 앱 설치가 가능해집니다!
                          </div>
                        </div>
                      </div>

                      {/* 3단계 */}
                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border-2 border-amber-200 shadow-xs">
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-xs">
                          3
                        </span>
                        <div className="leading-relaxed">
                          크롬(Chrome)이나 인터넷 새 창이 뜨면, 화면 <strong className="text-emerald-900 font-black">우측 상단 (또는 우측 하단)</strong>의{' '}
                          <span className="font-black text-emerald-950 bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300">
                            점 세 개 [⋮] (더보기 메뉴)
                          </span>{' '}
                          를 다시 한번 터치합니다.
                        </div>
                      </div>

                      {/* 4단계 */}
                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border-2 border-emerald-300 shadow-xs">
                        <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-xs">
                          4
                        </span>
                        <div className="leading-relaxed">
                          메뉴 목록에서{' '}
                          <span className="font-black text-white bg-emerald-700 px-2 py-0.5 rounded shadow-xs inline-block my-0.5">
                            [앱 설치]
                          </span>{' '}
                          또는{' '}
                          <span className="font-black text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 inline-block my-0.5">
                            [홈 화면에 추가]
                          </span>{' '}
                          (또는 다운로드 및 설치하기)를 터치합니다.
                        </div>
                      </div>

                      {/* 5단계 */}
                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-400 shadow-xs">
                        <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-xs">
                          5
                        </span>
                        <div className="leading-relaxed">
                          화면에 뜨는 팝업창에서{' '}
                          <span className="font-black text-emerald-950 bg-amber-300 px-1.5 py-0.5 rounded border border-amber-400">
                            [설치]
                          </span>{' '}
                          또는 [추가]를 누르면 완료!
                          <p className="text-[11px] text-emerald-900 font-extrabold mt-1.5">
                            🎉 스마트폰 바탕화면에 귀여운 <strong>파키 골프공 아이콘 앱</strong>이 쏙 깔렸습니다! 앞으로는 이 아이콘만 누르면 주소창 없이 1초 만에 바로 열립니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2) 크롬 / 삼성인터넷으로 직접 접속한 경우 */}
                {guideTab === 'CHROME' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed font-bold">
                      🌐 크롬(Chrome) 또는 삼성인터넷 브라우저로 직접 접속하신 경우 아래 순서대로 1초 만에 설치하실 수 있습니다:
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-stone-200 shadow-xs">
                        <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                          1
                        </span>
                        <div className="leading-relaxed">
                          화면 <strong className="text-emerald-900">우측 상단 (또는 우측 하단)</strong>의{' '}
                          <span className="font-black text-emerald-950 bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300">
                            점 세 개 [⋮] (더보기 메뉴)
                          </span>{' '}
                          를 터치합니다.
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-stone-200 shadow-xs">
                        <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                          2
                        </span>
                        <div className="leading-relaxed">
                          메뉴 목록에서{' '}
                          <span className="font-black text-white bg-emerald-700 px-2 py-0.5 rounded shadow-xs">
                            [앱 설치]
                          </span>{' '}
                          또는{' '}
                          <span className="font-black text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                            [홈 화면에 추가]
                          </span>{' '}
                          를 누릅니다.
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-xs">
                        <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                          3
                        </span>
                        <div className="leading-relaxed">
                          확인 팝업에서{' '}
                          <span className="font-black text-emerald-950 bg-amber-300 px-1.5 py-0.5 rounded">
                            [설치]
                          </span>{' '}
                          또는 [추가]를 누르면 스마트폰 바탕화면에 즉시 설치 완료됩니다!
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3) 아이폰 사파리 사용자인 경우 */}
                {guideTab === 'IOS' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-stone-100 border border-stone-300 rounded-2xl text-xs text-stone-800 leading-relaxed font-bold">
                      🍎 아이폰(Safari 사파리)에서는 아래 순서대로 홈 화면에 추가하시면 됩니다:
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-stone-200 shadow-xs">
                        <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                          1
                        </span>
                        <div className="leading-relaxed">
                          사파리 화면 <strong className="text-emerald-900">맨 아래 중앙</strong>의{' '}
                          <span className="font-black text-emerald-950 bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300">
                            공유 버튼 [⎋] (네모 위 화살표)
                          </span>{' '}
                          를 터치합니다.
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-stone-200 shadow-xs">
                        <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                          2
                        </span>
                        <div className="leading-relaxed">
                          메뉴를 위로 살짝 올려서{' '}
                          <span className="font-black text-white bg-emerald-700 px-2 py-0.5 rounded shadow-xs">
                            [홈 화면에 추가 (+)]
                          </span>{' '}
                          를 터치합니다.
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-xs">
                        <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                          3
                        </span>
                        <div className="leading-relaxed">
                          화면 오른쪽 상단의{' '}
                          <span className="font-black text-emerald-950 bg-amber-300 px-1.5 py-0.5 rounded">
                            [추가]
                          </span>{' '}
                          를 누르면 아이폰 바탕화면에 파키 아이콘이 생성됩니다!
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl transition mt-2 cursor-pointer shadow-md"
              >
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
