import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // --- [TESTING MODE] ---
  // DB 연동 없이 UI 테스트를 위해 미들웨어 보안 체크를 임시로 무력화합니다.
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register/:path*', '/admin/:path*'],
};
