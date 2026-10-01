'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Smartphone,
  Share2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function InstallPageContent() {
  const searchParams = useSearchParams();
  const { isJapanese, isEnglish } = useTranslation();
  const byParam = searchParams.get('by') || '';

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);
  const [installSuccessToast, setInstallSuccessToast] = useState<boolean>(false);

  useEffect(() => {
    // 1. 이미 PWA 홈 화면(standalone)으로 실행 중인지 감지
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    // 2. iOS 기기 감지
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !userAgent.includes('crios');
    setIsIos(isIosDevice);

    // 3. 안드로이드 / 크롬 PWA 설치 이벤트 가로채기
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
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // 1) 이미 설치된 경우 바로 홈으로 이동
    if (isStandalone) {
      window.location.href = '/';
      return;
    }

    // 2) 안드로이드/크롬 설치 프롬프트
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstallSuccessToast(true);
        }
        setDeferredPrompt(null);
      } catch {
        // fallback
      }
      return;
    }

    // 3) iOS 사파리 가이드 팝업
    if (isIos) {
      setShowIosModal(true);
      return;
    }

    // 4) 일반 브라우저 안내
    alert(
      isJapanese
        ? 'ブラウザ右上のメニュー [⋮] または共有ボタンから「ホーム画面に追加」または「アプリをインストール」をタップしてください。'
        : '브라우저 오른쪽 상단 메뉴 [⋮] 또는 공유 버튼을 눌러 [홈 화면에 추가] 또는 [앱 설치]를 누르시면 바탕화면에 바로 설치됩니다.'
    );
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-3 sm:p-4">
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

        {/* 2. 본문: 3대 핵심 가치 & 초대형 원터치 설치 버튼 */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* 설치 완료 토스트 */}
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

          {/* 2대 핵심 가치 카드 (대표님 특명: 불필요한 날씨 제외, 모바일 스코어보드 & 나의 연대기 집중) */}
          <div className="space-y-3">
            {/* 혜택 1: 파크골프 실시간 모바일 스코어보드 (대표님 지침: 4인 제한 문구 삭제) */}
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

          {/* 3. 초대형 메인 액션 버튼 (대표님 특명: 모바일 스코어보드 파키 바로 설치하기 & 무료 삭제) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full py-4.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl transition active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer border-2 border-emerald-400"
            >
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <span>
                {isStandalone
                  ? (isJapanese ? '⛳ アプリをすぐに開く' : '⛳ 앱 바로 실행하기')
                  : (isJapanese ? '📱 モバイルスコアボード パキを今すぐ登録' : '📱 모바일 스코어보드 파키 바로 설치하기')}
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

        {/* 4. 🍎 아이폰(iOS Safari) 전용 홈 화면 추가 안내 모달 */}
        {showIosModal && (
          <div className="fixed inset-0 z-[95] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-stone-900 border-2 border-emerald-400 text-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="absolute top-3.5 right-3.5 text-stone-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-stone-950 font-black text-2xl flex items-center justify-center mx-auto shadow-md">
                  ⛳
                </div>
                <h4 className="text-base font-black text-emerald-300">
                  {isJapanese ? 'iPhone ホーム画面追加方法' : '아이폰 바탕화면 추가 방법'}
                </h4>
                <p className="text-xs text-stone-300">
                  {isJapanese
                    ? 'Safariブラウザの下部メニューから簡単に登録できます。'
                    : '사파리(Safari) 화면에서 딱 3초 만에 완료됩니다.'}
                </p>
              </div>

              <div className="space-y-2 text-xs bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700 font-medium">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-stone-950 font-black flex items-center justify-center text-xs shrink-0">
                    1
                  </span>
                  <span>
                    {isJapanese ? (
                      <>画面下の <Share2 className="w-3.5 h-3.5 inline text-sky-400 mx-0.5" /> <strong>[共有]</strong> ボタンをタップ</>
                    ) : (
                      <>화면 맨 아래 가운데 <Share2 className="w-3.5 h-3.5 inline text-sky-400 mx-0.5" /> <strong>[공유]</strong> 버튼 누르기</>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-stone-950 font-black flex items-center justify-center text-xs shrink-0">
                    2
                  </span>
                  <span>
                    {isJapanese ? (
                      <>メニューから <strong>[ホーム画面に追加]</strong> を選択</>
                    ) : (
                      <>메뉴를 위로 살짝 올려 <strong>[홈 화면에 추가]</strong> 선택</>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-stone-950 font-black flex items-center justify-center text-xs shrink-0">
                    3
                  </span>
                  <span>
                    {isJapanese ? (
                      <>右上の <strong>[追加]</strong> をタップで完了！</>
                    ) : (
                      <>오른쪽 위 <strong>[추가]</strong> 누르면 끝!</>
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                {isJapanese ? '確認しました' : '확인했습니다'}
              </button>
            </div>
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
