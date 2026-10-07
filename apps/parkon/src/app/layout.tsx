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
  title: '파크골프 올인원 (ParkGolf All-in-One) - 전국 400개 구장 포털',
  description: '50~70대 시니어 파크골프 동호인을 위한 전국 400개 구장 실시간 날씨, 1초 스코어보드, 공인 룰북, 연대기 무료 서비스',
  alternates: {
    canonical: 'https://www.parkgolfallinone.com',
  },
  keywords: [
    '파크골프',
    '파크골프 올인원',
    'ParkGolf All-in-One',
    '파크골프장',
    '파크골프 스코어보드',
    '파크골프 룰',
    '파크골프 클럽',
    '파크골프 가이드',
    '파크골프 날씨',
    'パークゴルフ',
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
    title: '파크골프 올인원 (ParkGolf All-in-One) - 전국 400개 구장 포털',
    description: '50~70대 시니어 파크골프 동호인을 위한 전국 400개 구장 실시간 날씨, 1초 스코어보드, 공인 룰북, 연대기 무료 서비스',
    url: 'https://www.parkgolfallinone.com',
    siteName: '파크골프 올인원',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '파크골프 올인원 (ParkGolf All-in-One)',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '파크골프 올인원 (ParkGolf All-in-One) - 전국 400개 구장 포털',
    description: '50~70대 시니어 파크골프 동호인을 위한 전국 400개 구장 실시간 날씨, 1초 스코어보드, 공인 룰북, 연대기 무료 서비스',
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="파크골프 올인원" />
        <meta name="application-name" content="파크골프 올인원" />
        <meta property="og:title" content="파크골프 올인원 (ParkGolf All-in-One) - 모바일 스코어보드" />
        <meta property="og:description" content="1초 스코어링 · 전국 5스타 랭킹 · 룰 솔로몬 AI · 전문 가이드" />
        <meta property="og:url" content="https://www.parkgolfallinone.com" />
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
                  'alternateName': ['ParkGolf All-in-One', '파크골프올인원', 'パークゴルフ オールインワン'],
                  'description': '50~70대 시니어 파크골프 동호인을 위한 전국 400개 구장 실시간 날씨, 1초 스코어보드, 공인 룰북, 연대기 무료 서비스',
                  'inLanguage': ['ko-KR', 'ja-JP'],
                  'publisher': {
                    '@type': 'Organization',
                    'name': '파크골프 올인원',
                    'url': 'https://www.parkgolfallinone.com'
                  }
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': 'https://www.parkgolfallinone.com/#app',
                  'name': '파크골프 올인원 (ParkGolf All-in-One)',
                  'operatingSystem': 'All',
                  'applicationCategory': 'SportsApplication',
                  'offers': {
                    '@type': 'Offer',
                    'price': '0',
                    'priceCurrency': 'KRW'
                  },
                  'description': '전국 400개 파크골프장 실시간 날씨, 1초 스코어보드, 공인 룰북 및 개인 라운드 연대기 관리 웹 서비스',
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
              var TARGET_BUILD_VER = '20261007_06';
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
                navigator.serviceWorker.register('/sw.js?v=20261007_06')
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
