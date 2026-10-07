import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VisitorTracker } from '@/components/VisitorTracker';
import { MainWrapper } from '@/components/MainWrapper';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import Script from 'next/script';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.parkgolfallinone.com'),
  title: {
    default: '파크골프 올인원 (ParkGolf All-in-One) - 한·일 파크골프 공식 포털',
    template: '%s | 파크골프 올인원 (ParkGolf All-in-One)',
  },
  description: '한·일 파크골프 공식 포털: 한국 400+ 구장 및 일본 코스 안내, 실시간 날씨, 1초 스코어보드, 공인 룰북 AI, 연대기 훈장 (100% 무료)',
  alternates: {
    canonical: 'https://www.parkgolfallinone.com',
    languages: {
      'ko-KR': 'https://www.parkgolfallinone.com/?lang=ko',
      'ja-JP': 'https://www.parkgolfallinone.com/?lang=ja',
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
    title: '파크골프 올인원 (ParkGolf All-in-One) | 日韓パークゴルフ',
    description: '한국 전국 400개 구장 & 일본 파크골프 코스 안내, 1초 스코어링, 실시간 날씨, 룰북 AI 무료 포털',
    url: 'https://www.parkgolfallinone.com',
    siteName: 'ParkGolf All-in-One',
    locale: 'ko_KR',
    alternateLocale: ['ja_JP'],
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
    description: '한국 전국 400개 구장 & 일본 파크골프 코스 안내, 1초 스코어링, 실시간 날씨, 룰북 AI 무료 포털',
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
        <meta property="og:description" content="한국 전국 400개 구장 & 일본 파크골프 코스 안내, 1초 스코어링, 실시간 날씨, 룰북 AI 무료 포털" />
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
                  'description': '한·일 파크골프 공식 포털: 한국 400+ 구장 및 일본 코스 안내, 실시간 날씨, 1초 스코어보드, 공인 룰북 AI, 연대기 훈장 (100% 무료)',
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
                  'description': '한일 양국 파크골프 동호인을 위한 코스 안내, 날씨, 스코어보드, 공인 룰 AI 포털',
                  'url': 'https://www.parkgolfallinone.com'
                }
              ]
            })
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
              var TARGET_BUILD_VER = '20261007_07';
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
                navigator.serviceWorker.register('/sw.js?v=20261007_07')
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
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
