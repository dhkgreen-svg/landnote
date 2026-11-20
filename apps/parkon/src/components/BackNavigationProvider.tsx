'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  getBackStackSize,
  popAndRunBackHandler,
  subscribeBackStack,
} from '@/lib/backNavigation';

const EXIT_TOAST_DURATION_MS = 2200;

export function BackNavigationProvider() {
  const pathname = usePathname();
  const router = useRouter();
  const [showExitToast, setShowExitToast] = useState(false);

  const lastPathRef = useRef<string>(pathname || '/');
  const inAppDepthRef = useRef<number>(0);
  const initialMountRef = useRef<boolean>(true);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isExitWindowOpenRef = useRef<boolean>(false);
  const steppingPastStaleGuardRef = useRef<boolean>(false);
  const gestureArmedPathRef = useRef<string>('');
  const mountSessionIdRef = useRef<string>(`m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  const armGuard = (forcePush = false) => {
    if (typeof window === 'undefined') return;
    try {
      const currentState =
        window.history.state && typeof window.history.state === 'object'
          ? window.history.state
          : {};
      if (
        !forcePush &&
        currentState.__parkyGuard &&
        currentState.__parkyMountId === mountSessionIdRef.current &&
        currentState.__parkyPath === window.location.pathname
      ) {
        return;
      }
      window.history.pushState(
        {
          ...currentState,
          __parkyGuard: true,
          __parkyMountId: mountSessionIdRef.current,
          __parkyPath: window.location.pathname,
          __parkyGuardSeq: Date.now(),
        },
        '',
        window.location.href
      );
    } catch {
      // ignore restricted history environments
    }
  };

  // Track route changes and arm guard when needed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentPath = pathname || window.location.pathname || '/';

    if (initialMountRef.current) {
      initialMountRef.current = false;
      lastPathRef.current = currentPath;
      // Arm guard on initial landing (home exit guard OR direct sub-page fallback to home)
      armGuard();
      return;
    }

    if (currentPath !== lastPathRef.current) {
      if (steppingPastStaleGuardRef.current) {
        steppingPastStaleGuardRef.current = false;
      } else {
        inAppDepthRef.current += 1;
      }
      lastPathRef.current = currentPath;
    }

    // Clear any lingering exit toast when moving routes
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    isExitWindowOpenRef.current = false;
    setShowExitToast(false);

    // Ensure guard is armed on home screen or if any modal is open
    if (currentPath === '/' || getBackStackSize() > 0) {
      armGuard();
    }
  }, [pathname]);

  // Whenever any modal/popup pushes onto backStack, immediately arm the guard
  useEffect(() => {
    const unsubscribe = subscribeBackStack(() => {
      if (getBackStackSize() > 0) {
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current);
          exitTimerRef.current = null;
        }
        isExitWindowOpenRef.current = false;
        setShowExitToast(false);
        armGuard();
      }
    });
    return unsubscribe;
  }, []);

  // Android Chrome History Manipulation Intervention protection:
  // Re-arm once on the first user gesture per guarded route so Chrome never skips the sentinel.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onFirstGesture = () => {
      const currentPath = window.location.pathname || '/';
      if (gestureArmedPathRef.current === currentPath) return;
      if (
        currentPath === '/' ||
        inAppDepthRef.current === 0 ||
        getBackStackSize() > 0
      ) {
        gestureArmedPathRef.current = currentPath;
        if (!isExitWindowOpenRef.current) {
          armGuard(true);
        }
      }
    };
    window.addEventListener('pointerdown', onFirstGesture, { passive: true });
    window.addEventListener('keydown', onFirstGesture, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
  }, []);

  // Global popstate listener for Android/browser back button
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const nowPath = window.location.pathname || '/';
      const prevPath = lastPathRef.current;

      // Case 1: Real route navigation (e.g. /courses -> /)
      if (nowPath !== prevPath) {
        lastPathRef.current = nowPath;
        inAppDepthRef.current = Math.max(0, inAppDepthRef.current - 1);
        steppingPastStaleGuardRef.current = false;
        if (nowPath === '/') {
          setTimeout(() => {
            if (window.location.pathname === '/' && !isExitWindowOpenRef.current) {
              armGuard();
            }
          }, 0);
        }
        return;
      }

      // Case 2: Same path (our __parkyGuard sentinel was just popped)
      // 2-A: Close topmost open modal/popup first (LIFO)
      if (getBackStackSize() > 0) {
        popAndRunBackHandler();
        // Immediately re-arm synchronously if more modals remain, or on home, or direct-entry subpage
        if (
          getBackStackSize() > 0 ||
          window.location.pathname === '/' ||
          inAppDepthRef.current === 0
        ) {
          armGuard();
        }
        return;
      }

      // 2-B: No modal open on Home screen -> 2-second double-back exit confirmation
      if (nowPath === '/') {
        if (isExitWindowOpenRef.current) {
          // Second back press within window -> step past any leftover guard and allow exit
          if (window.history.state && window.history.state.__parkyGuard) {
            window.history.back();
          }
          return;
        }
        isExitWindowOpenRef.current = true;
        setShowExitToast(true);
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        exitTimerRef.current = setTimeout(() => {
          isExitWindowOpenRef.current = false;
          setShowExitToast(false);
          if (window.location.pathname === '/') {
            armGuard();
          }
        }, EXIT_TOAST_DURATION_MS);
        return;
      }

      // 2-C: No modal open on a sub-page
      if (inAppDepthRef.current === 0) {
        // Direct entry (share link / bookmark) -> safely go to Home instead of closing app
        setTimeout(() => {
          router.replace('/');
        }, 0);
        return;
      }

      // Came from another in-app page and had a leftover modal guard -> step back 1 real entry
      steppingPastStaleGuardRef.current = true;
      inAppDepthRef.current = Math.max(0, inAppDepthRef.current - 1);
      setTimeout(() => {
        window.history.back();
      }, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, [router]);

  if (!showExitToast) return null;

  return (
    <div
      data-testid="back-exit-toast"
      style={{ backgroundColor: 'rgba(24, 24, 27, 0.94)' }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-full text-white text-sm font-black shadow-2xl border border-white/20 whitespace-nowrap pointer-events-none"
    >
      뒤로가기를 한 번 더 누르면 앱이 종료됩니다
    </div>
  );
}
