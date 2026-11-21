'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  getBackStackSize,
  popAndRunBackHandler,
  subscribeBackStack,
} from '@/lib/backNavigation';

const EXIT_TOAST_DURATION_MS = 2200;

function getVisibleFixedOverlays(): HTMLElement[] {
  if (typeof document === 'undefined') return [];
  const candidates = Array.from(document.querySelectorAll<HTMLElement>('div.fixed.inset-0'));
  return candidates.filter((el) => {
    if (el.getAttribute('data-testid') === 'back-exit-toast') return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width >= window.innerWidth * 0.6 && rect.height >= window.innerHeight * 0.5;
  });
}

function tryCloseTopDomModal(): boolean {
  const overlays = getVisibleFixedOverlays();
  if (overlays.length === 0) return false;

  // Pick topmost overlay by highest z-index, then DOM order
  const sorted = [...overlays].sort((a, b) => {
    const za = parseInt(window.getComputedStyle(a).zIndex || '0', 10) || 0;
    const zb = parseInt(window.getComputedStyle(b).zIndex || '0', 10) || 0;
    return za - zb;
  });
  const topOverlay = sorted[sorted.length - 1];
  const buttons = Array.from(topOverlay.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));

  // Priority 1: Explicit close button (✕ / aria-label / title / lucide-x icon)
  const explicitClose = buttons.find((btn) => {
    const txt = (btn.innerText || btn.textContent || '').trim();
    const aria = (btn.getAttribute('aria-label') || '').trim();
    const title = (btn.getAttribute('title') || '').trim();
    const hasXIcon = Boolean(btn.querySelector('svg.lucide-x'));
    return (
      txt === '✕' ||
      txt === '×' ||
      txt === 'X' ||
      aria.includes('닫기') ||
      title.includes('닫기') ||
      (hasXIcon && txt.length <= 2)
    );
  });
  if (explicitClose) {
    explicitClose.click();
    return true;
  }

  // Priority 2: Bottom footer "닫기" / "창 닫기" / "취소" button
  const textClose = buttons.find((btn) => {
    const txt = (btn.innerText || btn.textContent || '').trim();
    return txt === '닫기' || txt === '창 닫기' || txt === '취소' || txt === '확인 및 닫기';
  });
  if (textClose) {
    textClose.click();
    return true;
  }

  return false;
}

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
  const prevStackSizeRef = useRef<number>(0);
  const lastOverlayCountRef = useRef<number>(0);

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
          __appBackGuardSeq: Date.now() + Math.random(),
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
      gestureArmedPathRef.current = '';
      lastOverlayCountRef.current = getVisibleFixedOverlays().length;
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

  // Whenever a NEW modal/popup pushes onto backStack (during user tap), force-push a
  // dedicated user-activated history sentinel so Android Chrome NEVER skips consecutive back presses!
  useEffect(() => {
    const unsubscribe = subscribeBackStack(() => {
      const nextSize = getBackStackSize();
      const grew = nextSize > prevStackSizeRef.current;
      prevStackSizeRef.current = nextSize;
      if (nextSize > 0) {
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current);
          exitTimerRef.current = null;
        }
        isExitWindowOpenRef.current = false;
        setShowExitToast(false);
        armGuard(grew);
        if (grew) {
          setTimeout(() => {
            lastOverlayCountRef.current = getVisibleFixedOverlays().length;
          }, 30);
        }
      }
    });
    return unsubscribe;
  }, []);

  // Android Chrome History Manipulation Intervention protection + DOM overlay detection:
  // 1) Re-arm once on first gesture per route (pointerdown / keydown)
  // 2) Whenever a click opens an unhooked inline fixed-inset-0 modal, push a user-activated guard
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const armFirstGesture = () => {
      const currentPath = window.location.pathname || '/';
      if (gestureArmedPathRef.current !== currentPath) {
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
      }
    };
    const onClickCheckOverlay = () => {
      armFirstGesture();
      // After React renders any unhooked inline modal triggered by this click, arm a fresh guard if overlay count grew
      setTimeout(() => {
        const count = getVisibleFixedOverlays().length;
        if (count > lastOverlayCountRef.current) {
          armGuard(true);
        }
        lastOverlayCountRef.current = count;
      }, 80);
    };
    window.addEventListener('pointerdown', armFirstGesture, { passive: true });
    window.addEventListener('keydown', armFirstGesture, { passive: true });
    window.addEventListener('click', onClickCheckOverlay, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', armFirstGesture);
      window.removeEventListener('keydown', armFirstGesture);
      window.removeEventListener('click', onClickCheckOverlay);
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
        lastOverlayCountRef.current = 0;
        if (nowPath === '/') {
          setTimeout(() => {
            if (window.location.pathname === '/' && !isExitWindowOpenRef.current) {
              armGuard();
            }
          }, 0);
        }
        return;
      }

      // Case 2: Same path (our __appBackGuard sentinel was just popped)
      // 2-A: Close topmost registered modal/popup first (LIFO)
      if (getBackStackSize() > 0) {
        popAndRunBackHandler();
        lastOverlayCountRef.current = Math.max(0, getVisibleFixedOverlays().length - 1);
        if (
          getBackStackSize() > 0 ||
          window.location.pathname === '/' ||
          inAppDepthRef.current === 0
        ) {
          armGuard();
        }
        return;
      }

      // 2-A-Fallback: Universal safety net for any inline fixed-inset-0 modal anywhere in the app
      if (tryCloseTopDomModal()) {
        lastOverlayCountRef.current = Math.max(0, getVisibleFixedOverlays().length - 1);
        if (window.location.pathname === '/' || inAppDepthRef.current === 0) {
          armGuard();
        }
        return;
      }

      // 2-B: No modal open on Home screen -> 2-second double-back exit confirmation
      if (nowPath === '/') {
        if (isExitWindowOpenRef.current) {
          // Second back press within window -> step past any leftover guard entries and allow exit
          if (window.history.state && window.history.state.__appBackGuard) {
            setTimeout(() => window.history.back(), 0);
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
        steppingPastStaleGuardRef.current = true;
        setTimeout(() => {
          router.replace('/');
        }, 0);
        return;
      }

      // Came from another in-app page and had leftover modal guard(s) -> step back cleanly
      steppingPastStaleGuardRef.current = true;
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
