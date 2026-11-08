import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  // Domain standardization: redirect legacy/apex domains to https://www.parkgolfallinone.com
  const legacyHosts = ['parkongolf.com', 'www.parkongolf.com', 'parkgolfallinone.com'];

  const normalizedHost = host.split(':')[0].toLowerCase();

  if (legacyHosts.includes(normalizedHost)) {
    const canonicalUrl = new URL(`https://www.parkgolfallinone.com${pathname}${search}`);
    return NextResponse.redirect(canonicalUrl, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - icon.png, apple-touch-icon.png
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon.png|apple-touch-icon.png).*)',
  ],
};
