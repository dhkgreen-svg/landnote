import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // getUser()는 만료된 토큰을 자동 갱신한다 (getSession은 갱신 안 함)
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;

  // 관리자 경로 보호
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    const isAdmin = user.app_metadata?.is_admin === true;
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // 관리자 로그인: 이미 관리자 세션이면 대시보드로
  if (pathname === '/admin/login' && user) {
    const isAdmin = user.app_metadata?.is_admin === true;
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  // 관리자가 에이전트 전용 페이지에 접근하면 관리자 대시보드로
  if (pathname.startsWith('/dashboard') && user) {
    const isAdmin = user.app_metadata?.is_admin === true;
    if (isAdmin) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if ((pathname === '/login' || pathname.startsWith('/register')) && user) {
    const isAdmin = user.app_metadata?.is_admin === true;
    return NextResponse.redirect(new URL(isAdmin ? '/admin' : '/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register/:path*', '/admin/:path*'],
};
