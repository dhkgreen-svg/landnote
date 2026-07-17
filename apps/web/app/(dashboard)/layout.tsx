'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, MessageSquare, Building2, Shuffle,
  BarChart3, QrCode, Settings, LogOut, Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { QueryProvider } from '@/components/providers/query-provider';
import { useAgent } from '@/lib/hooks/use-agent';
import { createClient } from '@/lib/supabase/client';
import { PushPrompt } from '@/components/dashboard/push-prompt';
import { usePush } from '@/lib/hooks/use-push';

const NAV_ITEMS = [
  { label: '현황', href: '/dashboard', icon: LayoutDashboard },
  { label: '매칭', href: '/dashboard/matching', icon: Shuffle },
  { label: '통계', href: '/dashboard/stats', icon: BarChart3 },
  { label: '링크/QR', href: '/dashboard/links', icon: QrCode },
  { label: '설정', href: '/dashboard/settings', icon: Settings },
];

function NavLink({ item, pathname, onClick }: {
  item: typeof NAV_ITEMS[0];
  pathname: string;
  onClick?: () => void;
}) {
  const isActive = pathname === item.href ||
    (item.href !== '/dashboard' && pathname.startsWith(item.href));
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { agent } = useAgent();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { permission, subscribe } = usePush();

  // 이미 허용된 경우 SW 갱신 대응 자동 재구독 (upsert이므로 멱등)
  useEffect(() => {
    if (permission === 'granted') {
      subscribe().catch(() => {});
    }
  }, [permission, subscribe]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <QueryProvider>
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-white lg:block">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight text-primary">
            랜드노트
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
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
            <SheetContent side="left" className="w-60 p-0">
              <SheetTitle className="sr-only">메뉴</SheetTitle>
              <div className="flex h-14 items-center border-b px-4">
                <span className="text-lg font-bold tracking-tight text-primary">
                  랜드노트
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
              <Separator />
              <div className="p-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-muted-foreground"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1" />
          {agent && (
            <span className="text-sm text-muted-foreground">
              {agent.agent_name} ({agent.office_name})
            </span>
          )}
        </header>

        <PushPrompt />

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
    </QueryProvider>
  );
}
