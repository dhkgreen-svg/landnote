import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { VisitorTracker } from '@/components/VisitorTracker';
import { MainWrapper } from '@/components/MainWrapper';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.parkgolfallinone.com'),
  title: '파크골프 올인원 (ParkGolf All-in-One) - 전국 400개 구장 포털 & 1초 스코어보드',
  description: '50~70대 시니어를 위한 전국 400개 구장 날씨·1초 스코어보드·길안내 올인원',
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
    title: '파크골프 올인원 (ParkGolf All-in-One)',
    description: '전국 400개 구장 실시간 날씨 · 1초 스코어링 · 길안내 · 전국 랭킹 올인원',
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
    title: '파크골프 올인원 (ParkGolf All-in-One)',
    description: '전국 400개 구장 실시간 날씨 · 1초 스코어링 · 길안내 · 전국 랭킹 올인원',
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
    <html lang="ko">
      <head>
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="파크골프 올인원" />
        <meta name="application-name" content="파크골프 올인원" />
        <meta property="og:title" content="파크골프 올인원 (ParkGolf All-in-One) - 모바일 스코어보드" />
        <meta property="og:description" content="1초 스코어링 · 전국 5스타 랭킹 · 룰 솔로몬 AI" />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        {/* Google AdSense Verification & Official Script */}
        <meta name="google-adsense-account" content="ca-pub-8564518885257853" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8564518885257853"
          crossOrigin="anonymous"
        />
        {/* PWA Service Worker Registration for Android 1-Click Install */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-stone-100 text-stone-900">
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
