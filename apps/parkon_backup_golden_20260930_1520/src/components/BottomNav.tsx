'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Newspaper, Trophy, HelpCircle } from 'lucide-react';

import { useTranslation } from '@/lib/i18n/LanguageContext';

export function BottomNav() {
  const pathname = usePathname();
  const { isJapanese, isEnglish } = useTranslation();

  // 활성 라운드 스코어 입력 중일 때는 터치 오작동 방지를 위해 하단 내비게이션 숨김
  const isPlayingRound = Boolean(
    pathname?.startsWith('/round/') &&
    pathname !== '/round/new' &&
    pathname !== '/round/result'
  );

  if (isPlayingRound) return null;

  const navItems = [
    {
      href: '/',
      label: isJapanese ? 'ホーム' : isEnglish ? 'Home' : '홈',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      href: '/club',
      label: isJapanese ? 'クラブ・大会' : isEnglish ? 'Club' : '클럽·대회',
      icon: Users,
      isActive: pathname?.startsWith('/club'),
    },
    {
      href: '/board',
      label: isJapanese ? '掲示板・情報' : isEnglish ? 'Board' : '게시판·뉴스',
      icon: Newspaper,
      isActive: pathname?.startsWith('/board'),
      badge: isJapanese ? '大会' : isEnglish ? 'Tour' : '대회',
    },
    {
      href: '/chronicle',
      label: isJapanese ? 'マイ年代記' : isEnglish ? 'Chronicle' : '나의 연대기',
      icon: Trophy,
      isActive: pathname?.startsWith('/chronicle'),
    },
    {
      href: '/rules',
      label: isJapanese ? 'ルール' : isEnglish ? 'Rules' : '룰 솔로몬',
      icon: HelpCircle,
      isActive: pathname?.startsWith('/rules'),
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg">
      <div className="max-w-md mx-auto h-16 px-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all select-none active:scale-95 ${
                active ? 'text-emerald-700 font-black' : 'text-stone-500 hover:text-stone-800 font-bold'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    active ? 'stroke-[2.6] scale-110 text-emerald-700' : 'stroke-[2] text-stone-500'
                  }`}
                />
                {item.badge && !active && (
                  <span className="absolute -top-1.5 -right-3 bg-rose-500 text-white text-[8px] font-black px-1 rounded-full animate-pulse shadow-xs">
                    {item.badge}
                  </span>
                )}
                {active && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
                )}
              </div>
              <span
                className={`text-[10px] mt-1 tracking-tight leading-none ${
                  active ? 'font-black text-emerald-800' : 'font-semibold text-stone-600'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
