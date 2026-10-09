import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VisitorTracker } from '@/components/VisitorTracker';
import { MainWrapper } from '@/components/MainWrapper';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { InAppBrowserGuideModal } from '@/components/InAppBrowserGuideModal';
import { LocationSimulatorSwitch } from '@/components/LocationSimulatorSwitch';
import Script from 'next/script';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.parkgolfallinone.com'),
  title: {
    default: '파크골프 올인원 (ParkGolf All-in-One) - 한·일 파크골프 공식 포털',
    template: '%s | 파크골프 올인원 (ParkGolf All-in-One)',
  },
  description: '한·일 파크골프 공식 포털: 전국 400+ 구장 및 일본 코스 안내, 실시간 날씨, 1초 스코어보드, 공인 룰북 AI (100% 무료)',
  alternates: {
    canonical: 'https://www.parkgolfallinone.com',
    languages: {
      'ko-KR': 'https://www.parkgolfallinone.com/?lang=ko',
      'ja-JP': 'https://www.parkgolfallinone.com/?lang=ja',
      'en-US': 'https://www.parkgolfallinone.com/?lang=en',
      'x-default': 'https://www.parkgolfallinone.com',
    },
  },
  keywords: [
    '파크골프',
    '파크골프 올인원',
    'ParkGolf All-in-One',
    'パークゴルフ',
    'パークゴルフ オールインワン',
    '파크골프장',
    '파크골프 스코어보드',
    '파크골프 룰',
    '파크골프 클럽',
    '파크골프 가이드',
    '파크골프 날씨',
    '일본 파크골프',
    'Park Golf Korea Japan',
    'Park Golf Scorecard',
  ],
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '파크골프 올인원',
  },
  openGraph: {
    title: '파크골프 올인원 (ParkGolf All-in-One) | Korea & Japan Official Portal',
    description: '한·일 파크골프 공식 포털: 전국 400+ 구장 및 일본 코스 안내, 실시간 날씨, 1초 스코어보드, 공인 룰북 AI (100% 무료)',
    url: 'https://www.parkgolfallinone.com',
    siteName: 'ParkGolf All-in-One',
    locale: 'ko_KR',
    alternateLocale: ['ja_JP', 'en_US'],
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '파크골프 올인원 (ParkGolf All-in-One)',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '파크골프 올인원 (ParkGolf All-in-One) | 日韓パークゴルフ',
    description: '한·일 파크골프 공식 포털: 전국 400+ 구장 및 일본 코스 안내, 실시간 날씨, 1초 스코어보드, 공인 룰북 AI (100% 무료)',
    images: ['/og-image.jpg'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#047857',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="canonical" href="https://www.parkgolfallinone.com" />
        <link rel="alternate" hrefLang="ko-KR" href="https://www.parkgolfallinone.com/?lang=ko" />
        <link rel="alternate" hrefLang="ja-JP" href="https://www.parkgolfallinone.com/?lang=ja" />
        <link rel="alternate" hrefLang="x-default" href="https://www.parkgolfallinone.com" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="파크골프 올인원" />
        <meta name="application-name" content="파크골프 올인원" />
        <meta property="og:title" content="파크골프 올인원 (ParkGolf All-in-One) | 日韓パークゴルフ" />
        <meta property="og:description" content="한·일 파크골프 공식 포털: 전국 400+ 구장 및 일본 코스 안내, 실시간 날씨, 1초 스코어보드, 공인 룰북 AI (100% 무료)" />
        <meta property="og:url" content="https://www.parkgolfallinone.com" />
        <meta property="og:site_name" content="ParkGolf All-in-One" />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        {/* Google AdSense Verification */}
        <meta name="google-adsense-account" content="ca-pub-8564518885257853" />
        {/* Google AI & Search Crawler JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': 'https://www.parkgolfallinone.com/#website',
                  'url': 'https://www.parkgolfallinone.com',
                  'name': '파크골프 올인원 (ParkGolf All-in-One)',
                  'alternateName': ['ParkGolf All-in-One', 'パークゴルフ オールインワン', '파크골프올인원'],
                  'description': '한·일 파크골프 공식 포털: 전국 400+ 구장 및 일본 코스 안내, 실시간 날씨, 1초 스코어보드, 공인 룰북 AI (100% 무료)',
                  'inLanguage': ['ko-KR', 'ja-JP'],
                  'publisher': {
                    '@type': 'Organization',
                    'name': '파크골프 올인원',
                    'url': 'https://www.parkgolfallinone.com'
                  }
                },
                {
                  '@type': 'SportsApplication',
                  '@id': 'https://www.parkgolfallinone.com/#app',
                  'name': '파크골프 올인원 (ParkGolf All-in-One)',
                  'operatingSystem': 'All (Web, PWA)',
                  'applicationCategory': 'SportsApplication',
                  'offers': {
                    '@type': 'Offer',
                    'price': '0',
                    'priceCurrency': 'KRW'
                  },
                  'description': '한·일 파크골프 공식 포털: 전국 400+ 구장 및 일본 코스 안내, 실시간 날씨, 1초 스코어보드, 공인 룰북 AI (100% 무료)',
                  'url': 'https://www.parkgolfallinone.com'
                }
              ]
            })
          }}
        />
        {/* 모바일 카카오톡, 라인, 네이버 등 인앱 브라우저 자동 탈출 (외부 브라우저 호출) */}
        <script
          id="inapp-browser-escape"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                var ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();

                // PWA Standalone 모드로 이미 실행 중인 경우 탈출 불필요
                if (window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)) {
                  return;
                }

                var isKakao = ua.indexOf('kakaotalk') !== -1;
                var isNaver = ua.indexOf('naver') !== -1;
                var isLine = ua.indexOf('line') !== -1;
                var isOtherInApp = /fb_iab|fb4a|fban|fbios|fbss|instagram|daum|everytimeapp/i.test(ua);
                var isInApp = isKakao || isNaver || isLine || isOtherInApp;

                if (!isInApp) return;

                var isAndroid = ua.indexOf('android') !== -1;
                var isIOS = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

                // 현재 주소 및 프로토콜 제거 주소 (실제 접속 URL 보존)
                var currentUrl = window.location.href;
                var cleanUrl = currentUrl.replace(/^https?:\\/\\//i, '');

                // 1. Android 환경: 크롬 강제 실행 또는 기본 브라우저 인텐트 호출
                if (isAndroid) {
                  try {
                    if (sessionStorage.getItem('parkon_inapp_escaped') !== '1') {
                      sessionStorage.setItem('parkon_inapp_escaped', '1');
                      var chromeIntent = 'intent://' + cleanUrl + '#Intent;scheme=https;package=com.android.chrome;end;';
                      window.location.href = chromeIntent;
                      return;
                    }
                  } catch (e) {}
                }

                // 2. iOS 환경: 카카오톡 openExternal 또는 라인 openExternalBrowser 공식 스킴 적용
                if (isIOS) {
                  if (isKakao) {
                    try {
                      if (sessionStorage.getItem('parkon_inapp_escaped') !== '1') {
                        sessionStorage.setItem('parkon_inapp_escaped', '1');
                        window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(currentUrl);
                        return;
                      }
                    } catch (e) {}
                  } else if (isLine) {
                    try {
                      if (currentUrl.indexOf('openExternalBrowser=1') === -1) {
                        var sep = currentUrl.indexOf('?') !== -1 ? '&' : '?';
                        window.location.href = currentUrl + sep + 'openExternalBrowser=1';
                        return;
                      }
                    } catch (e) {}
                  }
                }
              })();
            `,
          }}
        />
        {/* 일반 사용자 기기 '김대희' 오염 자동 정화 및 클린업 엔진 */}
        <script
          id="identity-auto-purge"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                try {
                  // 로컬 개발 환경(localhost)은 대표님 4인 테스트를 위해 초기화 제외
                  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    return;
                  }

                  if (localStorage.getItem('parkon_identity_purged_v3') !== 'true') {
                    localStorage.setItem('parkon_identity_purged_v3', 'true');

                    var profStr = localStorage.getItem('parkon_user_profile_v1');
                    var kakaoStr = localStorage.getItem('parkon_kakao_user_v1') || localStorage.getItem('parkon_kakao_auth_v1');
                    var memberCode = localStorage.getItem('parkon_member_code_v1');

                    // 더미 계정(プレイヤー, 플레이어 등) 자동 정화
                    if (kakaoStr) {
                      try {
                        var k = JSON.parse(kakaoStr);
                        if (k && (k.realName === 'プレイヤー' || k.nickname === 'プレイヤー' || k.realName === '플레이어' || k.nickname === '플레이어' || !k.id)) {
                          localStorage.removeItem('parkon_kakao_user_v1');
                          localStorage.removeItem('parkon_kakao_auth_v1');
                          localStorage.removeItem('parkon_user_profile_v1');
                          localStorage.removeItem('parkon_member_code_v1');
                        }
                      } catch(e) {}
                    }

                    // 깨진 자모가 포함된 최근 동반자 기록 자동 정화 (+ ㅅ순덕, + 죄순ㄷ덕 등)
                    var partnersRaw = localStorage.getItem('parkon_recent_partners');
                    if (partnersRaw) {
                      try {
                        var parsedP = JSON.parse(partnersRaw);
                        if (Array.isArray(parsedP)) {
                          var cleanP = parsedP.filter(function(n) {
                            return typeof n === 'string' && n.trim().length > 0 && !/[ㄱ-ㅎㅏ-ㅣ]/.test(n);
                          });
                          if (cleanP.length !== parsedP.length) {
                            localStorage.setItem('parkon_recent_partners', JSON.stringify(cleanP));
                          }
                        }
                      } catch(e) {}
                    }

                    var isKakaoLoggedIn = false;
                    if (kakaoStr) {
                      try {
                        var k = JSON.parse(kakaoStr);
                        if (k && k.id && !k.id.toString().startsWith('guest_') && k.realName !== 'プレイヤー' && k.nickname !== 'プレイヤー') {
                          isKakaoLoggedIn = true;
                        }
                      } catch(e) {}
                    }

                    var isProfileDaehee = false;
                    if (profStr) {
                      try {
                        var p = JSON.parse(profStr);
                        if (p && p.userName === '김대희') {
                          isProfileDaehee = true;
                        }
                      } catch(e) {}
                    }

                    // 카카오 정식 로그인 없이 기본값 버그로 '김대희'나 'PKYA-7788'이 박힌 일반 기기 정화
                    if (!isKakaoLoggedIn && (isProfileDaehee || memberCode === 'PKYA-7788')) {
                      localStorage.removeItem('parkon_user_profile_v1');
                      localStorage.removeItem('parkon_member_code_v1');
                      localStorage.removeItem('parkon_player_name');
                      localStorage.removeItem('parkon_welcomed');
                      localStorage.removeItem('parkon_welcome_dismissed');
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-stone-100 text-stone-900" suppressHydrationWarning>
        {/* Google AdSense Official Script */}
        <Script
          id="adsense-script"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8564518885257853"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        {/* PWA Service Worker Registration & Stale Cache Auto-Purge */}
        <Script id="cache-buster-auto-reload" strategy="beforeInteractive">
          {`
            (function() {
              if (typeof window === 'undefined') return;
              var TARGET_BUILD_VER = '20261008_18';
              var currentVer = localStorage.getItem('parkon_build_ver');
              if (currentVer !== TARGET_BUILD_VER) {
                localStorage.setItem('parkon_build_ver', TARGET_BUILD_VER);
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    names.forEach(function(name) { caches.delete(name); });
                  });
                }
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var reg of regs) { reg.update(); }
                  });
                }
                if (currentVer) {
                  // Returning user who has stale cached bundle -> hard reload once
                  window.location.reload();
                }
              }
            })();
          `}
        </Script>
        <Script id="pwa-sw" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js?v=20261007_08')
                  .then(function(reg) {
                    reg.update();
                  })
                  .catch(function() {});
              });
            }
          `}
        </Script>
        <LanguageProvider>
          <VisitorTracker />
          <Header />
          <MainWrapper>
            {children}
          </MainWrapper>
          <LocationSimulatorSwitch />
          <Footer />
          <InAppBrowserGuideModal />
        </LanguageProvider>
      </body>
    </html>
  );
}
