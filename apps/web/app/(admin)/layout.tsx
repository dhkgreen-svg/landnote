'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Users, DollarSign, BarChart3,
  LogOut, Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { QueryProvider } from '@/components/providers/query-provider';
import { useAdmin } from '@/lib/hooks/use-admin';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { label: '대시보드', href: '/admin', icon: LayoutDashboard },
  { label: '중개사 관리', href: '/admin/agents', icon: Users },
  { label: '수익 관리', href: '/admin/revenue', icon: DollarSign },
  { label: '접속 통계', href: '/admin/stats', icon: BarChart3 },
];

function NavLink({ item, pathname, onClick }: {
  item: typeof NAV_ITEMS[0];
  pathname: string;
  onClick?: () => void;
}) {
  const isActive = pathname === item.href ||
    (item.href !== '/admin' && pathname.startsWith(item.href));
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-white/10 text-white'
          : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
      }`}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 로그인 페이지는 레이아웃 미적용
  if (pathname === '/admin/login') {
    return <QueryProvider>{children}</QueryProvider>;
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  return (
    <QueryProvider>
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 bg-gray-900 lg:block">
        <div className="flex h-14 items-center border-b border-gray-800 px-4">
          <Link href="/admin" className="text-lg font-bold tracking-tight text-white">
            랜드노트 Admin
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-400 hover:bg-white/5 hover:text-gray-200"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-60">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-white px-4 lg:px-6">
          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 bg-gray-900 p-0 border-gray-800">
              <SheetTitle className="sr-only">관리자 메뉴</SheetTitle>
              <div className="flex h-14 items-center border-b border-gray-800 px-4">
                <span className="text-lg font-bold tracking-tight text-white">
                  랜드노트 Admin
                </span>
              </div>
              <nav className="flex flex-col gap-1 p-3">
                {NAV_ITEMS.map(item => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
              </nav>
              <Separator className="bg-gray-800" />
              <div className="p-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1" />
          {admin && (
            <span className="text-sm text-muted-foreground">
              {admin.name} ({admin.role})
            </span>
          )}
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
    </QueryProvider>
  );
}
