'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <main className={`flex-1 w-full mx-auto pb-6 transition-all ${isAdmin ? 'max-w-6xl px-4 sm:px-6' : 'max-w-md px-0'}`}>
      {children}
    </main>
  );
}
