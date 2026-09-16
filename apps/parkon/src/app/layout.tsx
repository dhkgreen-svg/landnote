import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BottomNav } from '@/components/BottomNav';
import { VisitorTracker } from '@/components/VisitorTracker';

export const metadata: Metadata = {
  metadataBase: new URL('https://parkongolf.com'),
  title: '파크온 (ParkOn) - 1인 오토파일럿 파크골프',
  description: '50~70대 시니어를 위한 초간편 1초 스코어보드 & 로컬룰 가이드',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '파크온',
  },
  openGraph: {
    title: '파크온 (ParkOn) - 1인 오토파일럿 파크골프',
    description: '1초 스코어링 · 전국 5스타 랭킹 · 룰 솔로몬 AI',
    siteName: '파크온',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '파크온 (ParkOn) 파크골프 스코어보드',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '파크온 (ParkOn) - 1인 오토파일럿 파크골프',
    description: '1초 스코어링 · 전국 5스타 랭킹 · 룰 솔로몬 AI',
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
        <meta name="apple-mobile-web-app-title" content="파크온" />
        <meta name="application-name" content="파크온" />
        <meta property="og:title" content="파크온 (ParkOn) - 1인 오토파일럿 파크골프" />
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
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-stone-100 text-stone-900">
        <VisitorTracker />
        <Header />
        <main className="flex-1 max-w-md w-full mx-auto pb-20">
          {children}
        </main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
