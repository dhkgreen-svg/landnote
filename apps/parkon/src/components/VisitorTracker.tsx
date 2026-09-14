'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function VisitorTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Avoid duplicate tracking in development or rapid re-renders
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    // Don't track admin page itself
    if (pathname?.startsWith('/admin')) return;

    const track = async () => {
      try {
        await fetch('/api/admin/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: pathname || '/',
            referrer: typeof document !== 'undefined' ? document.referrer : '',
          }),
        });
      } catch (e) {
        // Silently fail without interrupting user experience
      }
    };

    // Small delay to ensure non-blocking page load
    const timer = setTimeout(track, 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
