import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Logo & Description */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/25">
                <span className="text-xs font-bold text-white">LN</span>
              </div>
              <span className="text-base font-bold text-foreground">랜드노트</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              공인중개사 매물·고객 스마트 매칭 앱
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              이용약관
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              개인정보처리방침
            </Link>
            <a
              href="mailto:help@landnote.app"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              help@landnote.app
            </a>
          </nav>
        </div>

        <div className="mt-8 border-t pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} 랜드노트. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
