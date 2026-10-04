'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Smartphone,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import {
  isKakaoTalkWebView,
  isLineWebView,
  escapeKakaoTalk,
  autoEscapeIfKakao,
} from '@/lib/kakaoEscape';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function InstallPageContent() {
  const searchParams = useSearchParams();
  const { isJapanese } = useTranslation();
  const byParam = searchParams.get('by') || '';

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isKakao, setIsKakao] = useState<boolean>(false);
  const [isLine, setIsLine] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [installSuccessToast, setInstallSuccessToast] = useState<boolean>(false);

  useEffect(() => {
    // 1. 이미 PWA 홈 화면(standalone)으로 실행 중인지 감지
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://') ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('parkon_app_installed') === 'true');

    setIsStandalone(isStandaloneMode);

    const kakaoMode = isKakaoTalkWebView();
    const lineMode = isLineWebView();
    setIsKakao(kakaoMode);
    setIsLine(lineMode);

    // 카톡이나 라인이면 백그라운드에서 크롬 전환 준비
    if (kakaoMode || lineMode) {
      autoEscapeIfKakao();
    }

    // 2. 안드로이드 / 크롬 PWA 설치 이벤트 가로채기
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstallSuccessToast(true);
      try {
        localStorage.setItem('parkon_app_installed', 'true');
      } catch {}
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 대표님 절대 원칙: 구구절절 설명 모달 전면 삭제! 누르면 1초 만에 시스템 설치창 직격 발동
  const handleInstallClick = async () => {
    // 1) 이미 설치된 경우 또는 방금 설치 완료된 경우 -> 즉시 메인 홈으로 진입!
    if (isStandalone || installSuccessToast) {
      window.location.href = '/';
      return;
    }

    // 2) 안드로이드 크롬/삼성인터넷 등 PWA 설치 이벤트가 준비된 경우 -> 즉각 시스템 설치창 띄움!
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstallSuccessToast(true);
          try {
            localStorage.setItem('parkon_app_installed', 'true');
          } catch {}
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        }
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.warn('Install prompt error', err);
      }
    }

    // 3) 카카오톡/LINE 내부인 경우 -> 크롬으로 즉시 자동 전환 실행
    if (isKakao || isLine) {
      escapeKakaoTalk();
      showToast('스마트폰 기본 인터넷(크롬)으로 열어 바로 설치합니다...');
      return;
    }

    // 4) 그 외의 경우 (설치창 대기 상태) -> 심플 1줄 토스트만 노출 (구구절절 모달 절대 금지)
    showToast('스마트폰 화면의 [설치] 또는 [홈 화면에 추가]를 눌러주세요.');
  };

  return (
    <div className="min-h-screen bg-stone-900/90 sm:bg-stone-100 flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 pt-3 sm:pt-6">
      <main className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in duration-300">
        
        {/* 1. 상단 히어로 배너 (3D 파키 캐릭터 + 환영 헤더) */}
        <div className="bg-gradient-to-b from-emerald-800 via-emerald-900 to-stone-900 p-5 text-center text-white relative">
          <div
            className="relative w-24 h-24 mx-auto mb-2.5 rounded-2xl overflow-hidden shadow-xl border-2 border-emerald-400/40 bg-emerald-900/60"
            style={{ width: '96px', height: '96px' }}
          >
            <Image
              src="/mascot/사진저장고_사진_20260913_28.jpg"
              alt={isJapanese ? 'パキ公式マスコット' : '파키 공식 마스코트'}
              fill
              sizes="96px"
              className="object-cover"
              priority
            />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-yellow-400 text-stone-950 font-black text-xs shadow-xs mb-2">
            {isJapanese ? 'PARKY パキ公式アプリ推薦' : 'PARKY 파키 공식 앱 추천'}
          </span>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
            {byParam ? (
              isJapanese ? (
                <>
                  👑 <span className="text-yellow-300">{byParam}</span> 様の推薦です！
                </>
              ) : (
                <>
                  👑 <span className="text-yellow-300">{byParam}</span> 님의 추천입니다!
                </>
              )
            ) : isJapanese ? (
              'パークゴルフ必須アプリ'
            ) : (
              '대한민국 1등 파크골프 필수 앱'
            )}
          </h1>

          <p className="text-xs text-emerald-200 font-bold mt-1">
            {isJapanese
              ? 'パークゴルフ オールインワン (ParkGolf All-in-One)'
              : '파크골프 올인원 (ParkGolf All-in-One)'}
          </p>
          <p className="text-[11px] text-emerald-200 mt-0.5 font-medium">
            {isJapanese
              ? 'リアルタイム モバイルスコア · マイ年代記(生涯戦績)'
              : '실시간 모바일 스코어 · 나의 연대기 (평생 전적)'}
          </p>
        </div>

        {/* 2. 본문: 2대 핵심 가치 & 초대형 원터치 1초 설치 버튼 */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* 설치 완료 축하 알림 */}
          {installSuccessToast && (
            <div className="p-3 bg-emerald-700 text-white rounded-2xl text-center text-xs font-black shadow-md flex items-center justify-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>
                {isJapanese
                  ? '🎉 ホーム画面にアプリが登録されました！'
                  : '🎉 휴대폰 바탕화면에 앱이 성공적으로 설치되었습니다!'}
              </span>
            </div>
          )}

          {/* 2대 핵심 가치 카드 */}
          <div className="space-y-3">
            {/* 혜택 1: 파크골프 실시간 모바일 스코어보드 */}
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border-2 border-emerald-500/40 flex items-center gap-3.5 shadow-xs">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
                📱
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-black text-stone-950">
                  {isJapanese ? 'パークゴルフ リアルタイム モバイル スコアボード' : '파크골프 실시간 모바일 스코어보드'}
                </div>
                <div className="text-[11px] text-emerald-800 font-medium mt-0.5 leading-tight">
                  {isJapanese
                    ? '紙のカード不要、スマホ1台で打数をリアルタイム自動計算・共有'
                    : '종이 카드 없이 스마트폰 하나로 타수를 실시간 자동 계산·공유'}
                </div>
              </div>
            </div>

            {/* 혜택 2: 나의 연대기 (파크골프장 순례기 & 나의 기록) */}
            <div className="p-3.5 bg-amber-50/60 rounded-2xl border-2 border-amber-500/40 flex items-center gap-3.5 shadow-xs">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center text-xl shrink-0 shadow-sm">
                🏆
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-black text-stone-950">
                  {isJapanese ? 'マイ年代記 (コース巡礼記＆マイ記録)' : '나의 연대기 (파크골프장 순례기 & 나의 기록)'}
                </div>
                <div className="text-[11px] text-amber-900 font-medium mt-0.5 leading-tight">
                  {isJapanese
                    ? '巡った全国コース、ホールインワン勲章、生涯戦績を永久保存'
                    : '내가 다녀온 전국 구장, 홀인원 훈장, 평생의 전적과 메달을 영구 보존'}
                </div>
              </div>
            </div>
          </div>

          {/* 3. 대표님 특명: 초대형 원터치 1초 직격 설치 버튼 (설명 모달 전면 삭제) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl transition active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer border-2 border-emerald-400 animate-pulse"
            >
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <span>
                {isStandalone || installSuccessToast
                  ? (isJapanese ? '⛳ パークゴルフを始める (入場) ➔' : '⛳ 파크골프 올인원 바로 시작하기 (입장) ➔')
                  : (isJapanese ? '📲 1秒でホーム画面にアプリ追加' : '📲 1초 만에 바탕화면에 앱 깔기')}
              </span>
            </button>
          </div>

          {/* 하단 안심 안내문구 */}
          <p className="text-[11px] text-stone-400 text-center font-medium leading-tight">
            {isJapanese
              ? '※ ストアでの検索なしで、タップ1回で安全にホーム画面にアイコンが作成されます。'
              : '※ 구글 플레이스토어나 앱스토어 검색 없이, 터치 한 번으로 안전하게 바탕화면에 앱 아이콘이 깔립니다.'}
          </p>
        </div>

        {/* 심플 1줄 토스트 알림 (어르신 눈높이) */}
        {toastMessage && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl border border-amber-400 flex items-center gap-2 animate-fadeIn whitespace-nowrap">
            <Check className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </main>
    </div>
  );
}

export default function InstallPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-100 flex items-center justify-center">
          <div className="text-xs font-bold text-stone-500">로딩 중...</div>
        </div>
      }
    >
      <InstallPageContent />
    </Suspense>
  );
}
