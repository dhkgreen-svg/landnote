'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Copy, Check, X, Compass, Share } from 'lucide-react';
import { isIOS, isInAppBrowser, isKakaoTalkWebView, isLineWebView, copyCurrentUrl, getKakaoExternalUrl } from '@/lib/kakaoEscape';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export function InAppBrowserGuideModal() {
  const { isJapanese } = useTranslation();
  const [show, setShow] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [appName, setAppName] = useState<string>('인앱 브라우저');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 이미 이번 세션에서 닫았는지 확인
    try {
      if (sessionStorage.getItem('parkon_inapp_guide_dismissed') === '1') {
        return;
      }
    } catch {}

    // PWA Standalone 모드 체크
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const ua = navigator.userAgent.toLowerCase();
    const inApp = isInAppBrowser();
    const ios = isIOS();

    // iOS 환경에서 인앱 브라우저로 접속한 경우 팝업 활성화
    if (ios && inApp) {
      if (ua.includes('kakaotalk')) setAppName('카카오톡');
      else if (ua.includes('naver')) setAppName('네이버');
      else if (ua.includes('line')) setAppName('라인(LINE)');
      else if (ua.includes('instagram')) setAppName('인스타그램');
      else if (ua.includes('fb') || ua.includes('facebook')) setAppName('페이스북');
      else setAppName(isJapanese ? 'アプリ内ブラウザ' : '인앱 브라우저');

      setShow(true);
    }
  }, [isJapanese]);

  if (!show) return null;

  const handleCopy = async () => {
    const ok = await copyCurrentUrl();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenSafari = () => {
    const currentUrl = window.location.href;
    const ua = navigator.userAgent.toLowerCase();

    if (ua.includes('kakaotalk')) {
      window.location.href = getKakaoExternalUrl(currentUrl);
    } else if (ua.includes('line')) {
      const sep = currentUrl.includes('?') ? '&' : '?';
      window.location.href = `${currentUrl}${sep}openExternalBrowser=1`;
    } else {
      // 일반 사파리 스킴 시도 및 클립보드 복사
      handleCopy();
      const clean = currentUrl.replace(/^https?:\/\//i, '');
      try {
        window.location.href = `x-safari-https://${clean}`;
      } catch {}
    }
  };

  const handleDismiss = () => {
    setShow(false);
    try {
      sessionStorage.setItem('parkon_inapp_guide_dismissed', '1');
    } catch {}
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[9999] p-4 sm:p-6 bg-stone-900/80 backdrop-blur-md flex justify-center animate-in slide-in-from-bottom duration-300">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 p-5 relative overflow-hidden">
        {/* 상단 닫기 버튼 */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-base font-black text-stone-900 tracking-tight">
              {isJapanese ? 'Safari(ブラウザ)で開く' : 'Safari(사파리)로 열기 권장'}
            </h3>
            <p className="text-xs text-stone-500">
              {isJapanese
                ? `${appName}では一部機能が制限される場合があります`
                : `${appName} 상단 헤더 없이 전체 화면으로 쾌적하게 이용하세요`}
            </p>
          </div>
        </div>

        {/* 단계 안내 박스 */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 mb-4 text-xs text-stone-700 space-y-1.5 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
              1
            </span>
            <span>
              {isJapanese
                ? '画面右下または右上の [⋯] または [共有] をタップ'
                : '화면 우측 하단(또는 상단)의 [⋯] 또는 [공유] 터치'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
              2
            </span>
            <span className="font-bold text-emerald-800">
              {isJapanese
                ? 'メニューから [Safariで開く] を選択'
                : "메뉴에서 [Safari로 열기] 선택 시 전체 화면 실행!"}
            </span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleOpenSafari}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{isJapanese ? 'Safariで開く' : '사파리로 열기'}</span>
          </button>

          <button
            onClick={handleCopy}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 border ${
              copied
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-700'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isJapanese ? 'URLコピー完了!' : '주소 복사 완료!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{isJapanese ? 'URLをコピー' : '링크 복사'}</span>
              </>
            )}
          </button>
        </div>

        {/* 닫고 계속하기 */}
        <div className="mt-3 text-center">
          <button
            onClick={handleDismiss}
            className="text-[11px] text-stone-600 hover:text-stone-800 underline transition"
          >
            {isJapanese ? 'このままアプリ内で閲覧を続ける' : '인앱 브라우저로 계속 이용하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
