'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InstallAppButton } from '@/components/install-app-button';


export function Header() {


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/25">
            <span className="text-sm font-bold text-white">LN</span>
          </div>
          <span className="text-lg font-bold text-foreground">랜드노트</span>
        </Link>



        {/* CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          <InstallAppButton variant="outline" className="rounded-lg h-9 px-4 text-sm font-medium border-primary/20 text-primary hover:bg-primary/5" />
          <Button asChild variant="ghost" size="sm" className="text-sm font-medium">
            <Link href="/login">로그인</Link>
          </Button>

        </div>

      </div>
    </header>
  );
}
