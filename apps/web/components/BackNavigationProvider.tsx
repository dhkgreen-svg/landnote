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
        currentState.__appBackGuard &&
        currentState.__appBackMountId === mountSessionIdRef.current &&
        currentState.__appBackPath === window.location.pathname
      ) {
        return;
      }
      window.history.pushState(
        {
          ...currentState,
          __appBackGuard: true,
          __appBackMountId: mountSessionIdRef.current,
          __appBackPath: window.location.pathname,
          __appBackSeq: Date.now(),
        },
        '',
        window.location.href
      );
    } catch {
      // ignore restricted history environments
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentPath = pathname || window.location.pathname || '/';

    if (initialMountRef.current) {
      initialMountRef.current = false;
      lastPathRef.current = currentPath;
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

    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    isExitWindowOpenRef.current = false;
    setShowExitToast(false);

    if (currentPath === '/' || getBackStackSize() > 0) {
      armGuard();
    }
  }, [pathname]);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const nowPath = window.location.pathname || '/';
      const prevPath = lastPathRef.current;

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

      if (getBackStackSize() > 0) {
        popAndRunBackHandler();
        if (
          getBackStackSize() > 0 ||
          window.location.pathname === '/' ||
          inAppDepthRef.current === 0
        ) {
          armGuard();
        }
        return;
      }

      if (nowPath === '/') {
        if (isExitWindowOpenRef.current) {
          if (window.history.state && window.history.state.__appBackGuard) {
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

      if (inAppDepthRef.current === 0) {
        setTimeout(() => {
          router.replace('/');
        }, 0);
        return;
      }

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
