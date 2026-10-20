'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWatch = pathname?.includes('/watch');
  const isAdmin = pathname?.startsWith('/admin');

  if (isWatch) {
    return <main className="w-full h-screen p-0 m-0 overflow-hidden bg-black">{children}</main>;
  }

  return (
    <main className={`flex-1 w-full mx-auto pb-6 transition-all ${isAdmin ? 'max-w-6xl px-4 sm:px-6' : 'max-w-md px-0'}`}>
      {children}
    </main>
  );
}
