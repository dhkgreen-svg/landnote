'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallAppButton({ className, variant = 'default' }: { className?: string; variant?: "default" | "outline" | "ghost" | "secondary" }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
      return;
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if In-App Browser (Kakao, Naver, Instagram, etc)
    const inAppBrowser = /kakaotalk|naver|instagram|fbav|line|daum/.test(userAgent);
    setIsInAppBrowser(inAppBrowser);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isMounted || isStandalone) {
    return null; // Do not show install button if SSR or already installed
  }

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowGuide(false);
      }
    }
  };

  return (
    <>
      <Button onClick={() => setShowGuide(true)} className={className} variant={variant}>
        <Download className="w-4 h-4 mr-2" />
        앱 설치하기
      </Button>

      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle>랜드노트 앱 설치 방법</DialogTitle>
            <DialogDescription>
              {isIOS 
                ? '아이폰은 아래 방법으로 바탕화면에 앱을 설치할 수 있습니다.' 
                : isInAppBrowser 
                ? '현재 카카오톡 등 앱 내 브라우저를 사용 중이어서 바로 설치가 불가능합니다.' 
                : deferredPrompt
                ? '버튼 한 번으로 간편하게 랜드노트 앱을 설치하세요!'
                : '현재 브라우저에서는 아래 방법으로 설치하실 수 있습니다.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {isIOS ? (
              <>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg text-sm text-left">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold shrink-0">1</span>
                  <span>화면 맨 아래 사파리 메뉴 바에서 <Share className="inline w-5 h-5 mx-1" /> <strong>공유</strong> 버튼을 누르세요.</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg text-sm text-left">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold shrink-0">2</span>
                  <span>목록을 아래로 조금 내려서 <strong>[홈 화면에 추가]</strong>를 찾아 선택하세요.</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg text-sm text-left">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold shrink-0">3</span>
                  <span>우측 상단의 <strong>[추가]</strong>를 누르면 바탕화면에 랜드노트가 설치됩니다!</span>
                </div>
              </>
            ) : isInAppBrowser ? (
              <>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg text-sm text-left">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold shrink-0">1</span>
                  <span>화면 우측 하단(또는 상단)의 <strong>더보기(⋮ 또는 ...)</strong> 버튼을 누르세요.</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg text-sm text-left">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold shrink-0">2</span>
                  <span><strong>[다른 브라우저로 열기]</strong>를 선택하여 인터넷 창(크롬, 삼성인터넷 등)으로 이동하세요.</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg text-sm text-left">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold shrink-0">3</span>
                  <span>새로 열린 브라우저 화면에서 다시 <strong>[앱 설치하기]</strong>를 누르시면 됩니다!</span>
                </div>
              </>
            ) : deferredPrompt ? (
              <div className="py-4">
                <Button onClick={handleNativeInstall} size="lg" className="w-full text-base py-6 shadow-md hover:shadow-lg transition-shadow">
                  <Download className="mr-2 h-6 w-6" />
                  지금 바로 앱 설치하기
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-muted rounded-lg text-sm text-left leading-relaxed">
                현재 사용 중인 브라우저 우측 상단의 <strong>메뉴(⋮)</strong>를 누르신 후, <strong>[홈 화면에 추가]</strong> 또는 <strong>[앱 설치]</strong> 버튼을 직접 눌러주세요.
              </div>
            )}
          </div>
          <Button variant="outline" onClick={() => setShowGuide(false)} className="w-full">
            닫기
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
