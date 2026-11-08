'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Award,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  Trophy,
  Wifi,
  Sparkles,
  Lock,
} from 'lucide-react';
import { RoundSession, RoundPlayer, Course, HoleMetadata } from '@/types/parkon';
import { ParkOnStorage, requestWakeLock, releaseWakeLock } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { formatPlayerDisplayName } from '@/lib/playerUtils';

interface RoundWatchViewProps {
  roundId: string;
  initialSession?: RoundSession | null;
  onExit?: () => void;
}

const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const DEFAULT_WATCH_SESSION: RoundSession = {
  id: 'watch_demo',
  courseId: 'c1',
  courseName: '구미 파크골프장',
  currentHole: 2,
  totalHoles: 9,
  holeStep: 'SCORING',
  selectedCourseLetters: ['A'],
  selectedHoleNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  players: [
    { id: 'p1', name: '나', isLeader: true, isSelf: true, scores: { 1: 3, 2: 3 }, obCount: {}, totalStrokes: 6, totalParDiff: 0 },
    { id: 'p2', name: '철수', isLeader: false, isSelf: false, scores: { 1: 4, 2: 4 }, obCount: {}, totalStrokes: 8, totalParDiff: 2 },
    { id: 'p3', name: '영희', isLeader: false, isSelf: false, scores: { 1: 3, 2: 3 }, obCount: {}, totalStrokes: 6, totalParDiff: 0 },
    { id: 'p4', name: '민수', isLeader: false, isSelf: false, scores: { 1: 3, 2: 3 }, obCount: {}, totalStrokes: 6, totalParDiff: 0 },
  ],
  status: 'IN_PROGRESS',
  startedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function RoundWatchView({ roundId, initialSession, onExit }: RoundWatchViewProps) {
  const router = useRouter();

  const [session, setSession] = useState<RoundSession>(() => {
    if (initialSession) return initialSession;
    if (typeof window !== 'undefined') {
      const active = ParkOnStorage.getCurrentRound();
      if (active && (active.id === roundId || !roundId)) {
        return active;
      }
    }
    return DEFAULT_WATCH_SESSION;
  });

  const [course, setCourse] = useState<Course>(() => {
    if (typeof window !== 'undefined') {
      const active = ParkOnStorage.getCurrentRound();
      if (active && active.courseId) {
        const all = ParkOnStorage.getAllCourses();
        const found = all.find((c) => c.id === active.courseId) || all[0];
        if (found) return found;
      }
      const all = ParkOnStorage.getAllCourses();
      if (all && all.length > 0) return all[0];
    }
    return {
      id: 'default_course',
      name: '구미 파크골프장',
      region: '경북 구미시',
      totalHoles: 9,
      isVerified: true,
      holesMetadata: [
        { hole: 1, par: 3, distanceMeter: 50 },
        { hole: 2, par: 3, distanceMeter: 60 },
        { hole: 3, par: 4, distanceMeter: 85 },
        { hole: 4, par: 3, distanceMeter: 45 },
        { hole: 5, par: 5, distanceMeter: 120 },
        { hole: 6, par: 3, distanceMeter: 55 },
        { hole: 7, par: 4, distanceMeter: 75 },
        { hole: 8, par: 3, distanceMeter: 40 },
        { hole: 9, par: 4, distanceMeter: 90 },
      ],
    };
  });

  const [currentHole, setCurrentHole] = useState<number>(() => {
    return session.currentHole || 2;
  });

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastActionTimeRef = useRef<number>(0);

  // 1. Keep Screen Awake on Watch (Wake Lock API with auto-reacquire on wrist lift)
  useEffect(() => {
    const acquireWakeLock = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        requestWakeLock().catch(() => {});
      }
    };

    acquireWakeLock();
    document.addEventListener('visibilitychange', acquireWakeLock);
    window.addEventListener('focus', acquireWakeLock);

    return () => {
      document.removeEventListener('visibilitychange', acquireWakeLock);
      window.removeEventListener('focus', acquireWakeLock);
      releaseWakeLock();
    };
  }, []);

  // 2. Load Session from remote room if not found locally
  useEffect(() => {
    if (!session && roundId) {
      fetch(`/api/round/room?roomId=${encodeURIComponent(roundId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.room?.roundSession) {
            setSession(data.room.roundSession);
            setCurrentHole(data.room.roundSession.currentHole || 1);
            ParkOnStorage.saveCurrentRound(data.room.roundSession);
            const all = ParkOnStorage.getAllCourses();
            const found = all.find((c) => c.id === data.room.roundSession.courseId) || all[0];
            if (found) setCourse(found);
          }
        })
        .catch(() => {});
    }
  }, [roundId, session]);

  // 3. Multi-channel real-time sync (BroadcastChannel + Storage Event + Supabase Realtime + Polling fallback)
  useEffect(() => {
    const effectiveRoomId = session?.roomId || roundId || '';
    let isSubscribed = true;

    const applyIncoming = (incoming: RoundSession) => {
      if (!incoming || incoming.id !== roundId) return;
      if (Date.now() - lastActionTimeRef.current < 400) return; // Prevent local jitter

      setSession((prev) => {
        if (!prev) return incoming;
        if (incoming.updatedAt && prev.updatedAt && incoming.updatedAt < prev.updatedAt) {
          return prev;
        }
        return incoming;
      });
      if (incoming.currentHole && incoming.currentHole !== currentHole) {
        setCurrentHole(incoming.currentHole);
      }
    };

    // BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('parkon_round_channel');
      bc.onmessage = (e) => {
        if (e.data?.type === 'SCORE_UPDATED' && e.data?.session) {
          applyIncoming(e.data.session);
        }
      };
    } catch {}

    // Storage Event (Multi-tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'parkon_current_round' && e.newValue) {
        try {
          applyIncoming(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // Supabase Realtime
    let channel: any = null;
    if (effectiveRoomId) {
      channel = supabase.channel(`room_${effectiveRoomId}`, {
        config: { broadcast: { ack: true } },
      });
      channel
        .on('broadcast', { event: 'score_updated' }, ({ payload }: any) => {
          if (payload?.session && isSubscribed) {
            applyIncoming(payload.session);
          }
        })
        .subscribe((status: string) => {
          setIsOnline(status === 'SUBSCRIBED');
        });

      // Periodic Polling Fallback (every 1.8s)
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/round/room?roomId=${encodeURIComponent(effectiveRoomId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.room?.roundSession && isSubscribed) {
              applyIncoming(data.room.roundSession);
            }
          }
        } catch {}
      }, 1800);

      return () => {
        isSubscribed = false;
        if (bc) bc.close();
        window.removeEventListener('storage', handleStorage);
        clearInterval(interval);
        if (channel) supabase.removeChannel(channel);
      };
    }

    return () => {
      isSubscribed = false;
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [session?.roomId, roundId, currentHole]);

  // Haptic Feedback helper
  const triggerHaptic = (pattern: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2200);
  };

  // Current Hole Metadata
  const allHolesList = session?.selectedHoleNumbers && session.selectedHoleNumbers.length > 0
    ? session.selectedHoleNumbers
    : Array.from({ length: session?.totalHoles || 9 }, (_, i) => i + 1);

  const currentHoleIndexInList = Math.max(0, allHolesList.indexOf(currentHole));
  const isFirstHole = currentHoleIndexInList === 0;
  const isLastHole = currentHoleIndexInList === allHolesList.length - 1;

  // Course Letter & Hole Number within course
  const courseIdx = Math.floor((currentHole - 1) / 9);
  const courseLetter = session?.selectedCourseLetters?.[courseIdx] || COURSE_LETTERS[courseIdx] || 'A';
  const holeInCourse = ((currentHole - 1) % 9) + 1;

  // Par & Distance
  const holeMeta = course?.holesMetadata?.find((m) => m.hole === currentHole);
  const currentPar = holeMeta?.par || 3;
  const distanceText = holeMeta?.distanceMeter ? `${holeMeta.distanceMeter}m` : '';

  // Host/Leader Detection
  const currentLeader = session?.players?.find((p) => p.isLeader) || session?.players?.[0];
  const isLeader = Boolean(currentLeader?.isSelf !== false);

  // Synchronize and Broadcast Updated Session
  const saveAndBroadcast = useCallback((updated: RoundSession) => {
    lastActionTimeRef.current = Date.now();
    const enriched: RoundSession = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    setSession(enriched);
    ParkOnStorage.saveCurrentRound(enriched);

    const effectiveRoomId = enriched.roomId || roundId || '';

    // 1. Remote API POST
    fetch('/api/round/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        roomId: effectiveRoomId,
        roundSession: enriched,
      }),
    }).catch(() => {});

    // 2. Supabase Broadcast
    if (effectiveRoomId) {
      const channel = supabase.channel(`room_${effectiveRoomId}`);
      channel.send({
        type: 'broadcast',
        event: 'score_updated',
        payload: { session: enriched },
      });
    }

    // 3. Local BroadcastChannel
    try {
      const bc = new BroadcastChannel('parkon_round_channel');
      bc.postMessage({
        type: 'SCORE_UPDATED',
        roomId: effectiveRoomId,
        roundId: enriched.id,
        session: enriched,
      });
      bc.close();
    } catch {}
  }, [roundId]);

  // Adjust Player Score
  const handleScoreChange = (playerId: string, delta: number) => {
    if (!session) return;
    triggerHaptic(15);

    const updatedPlayers = session.players.map((p) => {
      if (p.id !== playerId) return p;
      const currentVal = p.scores?.[currentHole] ?? currentPar;
      const nextVal = Math.max(1, Math.min(15, currentVal + delta));
      const nextScores = { ...p.scores, [currentHole]: nextVal };

      const totalStrokes = Object.values(nextScores).reduce((a, b) => a + b, 0);
      return {
        ...p,
        scores: nextScores,
        totalStrokes,
      };
    });

    const updatedSession: RoundSession = {
      ...session,
      players: updatedPlayers,
    };
    saveAndBroadcast(updatedSession);
  };

  // Set Score Directly (e.g. Par Reset or OB)
  const handleSetExactScore = (playerId: string, exactScore: number) => {
    if (!session) return;
    triggerHaptic(20);

    const updatedPlayers = session.players.map((p) => {
      if (p.id !== playerId) return p;
      const nextScores = { ...p.scores, [currentHole]: exactScore };
      const totalStrokes = Object.values(nextScores).reduce((a, b) => a + b, 0);
      return {
        ...p,
        scores: nextScores,
        totalStrokes,
      };
    });

    const updatedSession: RoundSession = {
      ...session,
      players: updatedPlayers,
    };
    saveAndBroadcast(updatedSession);
  };

  // Add OB Penalty (+2)
  const handleAddOB = (playerId: string) => {
    if (!session) return;
    triggerHaptic([20, 40, 20]);

    const updatedPlayers = session.players.map((p) => {
      if (p.id !== playerId) return p;
      const currentVal = p.scores?.[currentHole] ?? currentPar;
      const nextVal = Math.min(15, currentVal + 2);
      const currentOB = p.obCount?.[currentHole] || 0;
      const nextScores = { ...p.scores, [currentHole]: nextVal };
      const nextOB = { ...p.obCount, [currentHole]: currentOB + 1 };
      const totalStrokes = Object.values(nextScores).reduce((a, b) => a + b, 0);

      return {
        ...p,
        scores: nextScores,
        obCount: nextOB,
        totalStrokes,
      };
    });

    const updatedSession: RoundSession = {
      ...session,
      players: updatedPlayers,
    };
    saveAndBroadcast(updatedSession);
    showToast('⚠️ OB 2벌타 적용 (+2타)');
  };

  // Reset to Par
  const handleResetPar = (playerId: string) => {
    handleSetExactScore(playerId, currentPar);
    showToast(`🔄 Par ${currentPar} 기본 세팅`);
  };

  // Advance to Next Hole
  const handleNextHole = useCallback(() => {
    if (!session) return;
    triggerHaptic([30, 60, 30]);

    // Ensure all players have a score on current hole (default to currentPar if missing)
    const confirmedPlayers = session.players.map((p) => {
      if (p.scores?.[currentHole] === undefined || p.scores[currentHole] === 0) {
        return {
          ...p,
          scores: { ...p.scores, [currentHole]: currentPar },
          totalStrokes: (p.totalStrokes || 0) + currentPar,
        };
      }
      return p;
    });

    const confirmedSet = new Set(session.confirmedHoles || []);
    confirmedSet.add(currentHole);

    if (isLastHole) {
      // Round Complete
      const completedSession: RoundSession = {
        ...session,
        players: confirmedPlayers,
        confirmedHoles: Array.from(confirmedSet),
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      };
      saveAndBroadcast(completedSession);
      setIsCompletedModalOpen(true);
      return;
    }

    const nextHoleNum = allHolesList[currentHoleIndexInList + 1];
    const updatedSession: RoundSession = {
      ...session,
      players: confirmedPlayers,
      confirmedHoles: Array.from(confirmedSet),
      currentHole: nextHoleNum,
    };

    saveAndBroadcast(updatedSession);
    setCurrentHole(nextHoleNum);

    // Reset vertical scroll to first card
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const nextCourseIdx = Math.floor((nextHoleNum - 1) / 9);
    const nextCourseLetter = session?.selectedCourseLetters?.[nextCourseIdx] || COURSE_LETTERS[nextCourseIdx] || 'A';
    const nextHoleInCourse = ((nextHoleNum - 1) % 9) + 1;
    showToast(`⛳ ${nextCourseLetter}-${nextHoleInCourse}홀로 이동!`);
  }, [session, currentHole, currentPar, isLastHole, allHolesList, currentHoleIndexInList, saveAndBroadcast]);

  // Go to Previous Hole
  const handlePrevHole = useCallback(() => {
    if (isFirstHole || !session) return;
    triggerHaptic(20);

    const prevHoleNum = allHolesList[currentHoleIndexInList - 1];
    const updatedSession: RoundSession = {
      ...session,
      currentHole: prevHoleNum,
    };
    saveAndBroadcast(updatedSession);
    setCurrentHole(prevHoleNum);

    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const prevCourseIdx = Math.floor((prevHoleNum - 1) / 9);
    const prevCourseLetter = session?.selectedCourseLetters?.[prevCourseIdx] || COURSE_LETTERS[prevCourseIdx] || 'A';
    const prevHoleInCourse = ((prevHoleNum - 1) % 9) + 1;
    showToast(`◀ ${prevCourseLetter}-${prevHoleInCourse}홀로 이동`);
  }, [session, isFirstHole, allHolesList, currentHoleIndexInList, saveAndBroadcast]);

  // Dual-Pass Horizontal Gesture Interaction (좌/우 스와이프)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartRef.current.x;
    const deltaY = endY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Detect horizontal swipe if deltaX is significant and predominantly horizontal
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3 && deltaTime < 600) {
      if (deltaX < 0) {
        // Swipe Left: Next Hole
        handleNextHole();
      } else if (deltaX > 0) {
        // Swipe Right: Prev Hole
        handlePrevHole();
      }
    }
  };

  // Scroll spy to update activeCardIndex
  const handleScroll = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const cardHeight = container.clientHeight;
    if (cardHeight > 0) {
      const idx = Math.round(container.scrollTop / cardHeight);
      setActiveCardIndex(idx);
    }
  };

  // Scroll to card index directly
  const scrollToCard = (index: number) => {
    if (!containerRef.current) return;
    triggerHaptic(10);
    const cardHeight = containerRef.current.clientHeight;
    containerRef.current.scrollTo({
      top: index * cardHeight,
      behavior: 'smooth',
    });
  };

  // Score terminology badge helper
  const getScoreDiffBadge = (strokes: number, par: number) => {
    if (strokes === 1) {
      return { text: '홀인원 👑', color: 'text-amber-300 bg-amber-950/80 border-amber-400' };
    }
    const diff = strokes - par;
    if (diff <= -3) return { text: `알바트로스 (${diff})`, color: 'text-rose-400 bg-rose-950/80 border-rose-500' };
    if (diff === -2) return { text: '이글 (-2)', color: 'text-rose-400 bg-rose-950/80 border-rose-500' };
    if (diff === -1) return { text: '버디 (-1)', color: 'text-red-400 bg-red-950/80 border-red-500' };
    if (diff === 0) return { text: '파 (Par)', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500' };
    if (diff === 1) return { text: '보기 (+1)', color: 'text-stone-300 bg-stone-900 border-stone-600' };
    if (diff === 2) return { text: '더블 (+2)', color: 'text-stone-300 bg-stone-900 border-stone-600' };
    if (diff === 3) return { text: '트리플 (+3)', color: 'text-amber-400 bg-amber-950/80 border-amber-600' };
    return { text: `+${diff}`, color: 'text-rose-400 bg-rose-950/80 border-rose-600' };
  };

  const players = session?.players || [];
  const totalCards = players.length + 1; // N players + 1 review card

  return (
    <div
      className="relative w-full h-screen bg-black text-white font-sans select-none overflow-hidden touch-pan-y"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ========================================================
          1. 상단 15% 항상 고정 미니 헤더: [ A-2홀 · Par 3 ]
         ======================================================== */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-stone-950/95 backdrop-blur-md border-b border-stone-800/80 flex items-center justify-between px-2.5 z-50 shadow-md">
        {/* Previous Hole Button */}
        <button
          type="button"
          onClick={handlePrevHole}
          disabled={isFirstHole}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-90 ${
            isFirstHole
              ? 'text-stone-700 opacity-30 cursor-not-allowed'
              : 'text-stone-300 hover:text-white bg-stone-900/80 border border-stone-700'
          }`}
          title="이전 홀"
          aria-label="이전 홀"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Center Pill: [ A-2홀 · Par 3 ] */}
        <div className="flex flex-col items-center leading-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 border border-amber-500/40 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="실시간 동기화 중" />
            <span className="text-amber-300 font-black text-xs sm:text-sm tracking-tight">
              {courseLetter}-{holeInCourse}홀 · Par {currentPar}
            </span>
            {distanceText && (
              <span className="text-[10px] text-stone-400 font-bold ml-0.5">
                {distanceText}
              </span>
            )}
          </div>
          <span className="text-[9px] text-stone-500 font-semibold mt-0.5">
            {course?.name ? course.name.replace(/파크골프장|골프장/g, '').trim() : '파크골프'}
          </span>
        </div>

        {/* Right Button: Smartphone View Toggle or Next Hole */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (onExit) onExit();
              else router.push(`/round/${roundId}`);
            }}
            className="w-9 h-9 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-amber-300 flex items-center justify-center transition active:scale-90"
            title="스마트폰 기본 화면으로 전환"
            aria-label="스마트폰 화면 전환"
          >
            <Smartphone className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-stone-950 text-xs font-black px-3.5 py-1.5 rounded-full shadow-xl border border-amber-300 animate-in fade-in duration-150 pointer-events-none whitespace-nowrap">
          {toastMessage}
        </div>
      )}

      {/* ========================================================
          2. 세로 스크롤 스택 (1인 1카드 입력 & 5단계 최종 검수판)
         ======================================================== */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-[calc(100vh-56px)] mt-14 overflow-y-auto snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Player Input Cards (1 ~ N) */}
        {players.map((player, idx) => {
          const currentScore = player.scores?.[currentHole] ?? currentPar;
          const badge = getScoreDiffBadge(currentScore, currentPar);
          const isSelf = player.isSelf;
          const isPlayerLeader = player.isLeader || idx === 0;

          return (
            <section
              key={player.id}
              className="w-full h-[calc(100vh-56px)] snap-start flex flex-col justify-between items-center px-4 py-3 text-center border-b border-stone-900/60"
            >
              {/* Card Header: Player Info */}
              <div className="w-full flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-stone-800 text-amber-300 font-black text-xs flex items-center justify-center border border-stone-700">
                    {idx + 1}
                  </span>
                  <span className="font-black text-base text-stone-100 tracking-tight flex items-center gap-1">
                    {isPlayerLeader && <span title="조장">👑</span>}
                    {formatPlayerDisplayName(player.name, isSelf, false)}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-stone-400 bg-stone-900/90 px-2 py-0.5 rounded-full border border-stone-800">
                  누적 {player.totalStrokes || 0}타
                </span>
              </div>

              {/* Center: Giant Hitbox Controller [-] [Score] [+] */}
              <div className="w-full flex flex-col items-center justify-center my-auto">
                <div className="flex items-center justify-center gap-3 sm:gap-4 w-full max-w-[290px]">
                  {/* Super-large Minus Button */}
                  <button
                    type="button"
                    onClick={() => handleScoreChange(player.id, -1)}
                    className="w-[64px] h-[64px] min-w-[64px] min-h-[64px] sm:w-[72px] sm:h-[72px] rounded-2xl bg-stone-900 hover:bg-stone-800 border-2 border-stone-700 active:border-rose-500 active:bg-rose-950 text-rose-400 font-black text-3xl sm:text-4xl flex items-center justify-center shadow-lg active:scale-95 transition-transform touch-manipulation cursor-pointer shrink-0"
                    aria-label="1타 감소"
                  >
                    -
                  </button>

                  {/* Giant Score Display */}
                  <div className="flex flex-col items-center justify-center min-w-[76px] shrink-0">
                    <span className="text-5xl sm:text-6xl font-black text-white tracking-tighter leading-none drop-shadow-md">
                      {currentScore}
                    </span>
                    <span
                      className={`text-[11px] font-black px-2 py-0.5 mt-1 rounded-full border shadow-xs ${badge.color}`}
                    >
                      {badge.text}
                    </span>
                  </div>

                  {/* Super-large Plus Button */}
                  <button
                    type="button"
                    onClick={() => handleScoreChange(player.id, 1)}
                    className="w-[64px] h-[64px] min-w-[64px] min-h-[64px] sm:w-[72px] sm:h-[72px] rounded-2xl bg-stone-900 hover:bg-stone-800 border-2 border-stone-700 active:border-emerald-500 active:bg-emerald-950 text-emerald-400 font-black text-3xl sm:text-4xl flex items-center justify-center shadow-lg active:scale-95 transition-transform touch-manipulation cursor-pointer shrink-0"
                    aria-label="1타 증가"
                  >
                    +
                  </button>
                </div>

                {/* Quick Action Strip (Par Reset & OB +2) */}
                <div className="flex items-center justify-center gap-2 mt-3 w-full max-w-[280px]">
                  <button
                    type="button"
                    onClick={() => handleResetPar(player.id)}
                    className="flex-1 py-1.5 px-2 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                  >
                    🔄 Par {currentPar}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddOB(player.id)}
                    className="flex-1 py-1.5 px-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer"
                  >
                    ⚠️ OB (+2)
                  </button>
                </div>
              </div>

              {/* Card Footer: Scroll Hint */}
              <div className="w-full flex items-center justify-center pb-2">
                <button
                  type="button"
                  onClick={() => scrollToCard(idx + 1)}
                  className="flex items-center gap-1 text-[11px] font-bold text-stone-400 hover:text-stone-200 transition py-1"
                >
                  <span>
                    {idx < players.length - 1
                      ? `↓ ${players[idx + 1].name} 입력하기`
                      : '↓ 전체 점수 검수판 확인'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
                </button>
              </div>
            </section>
          );
        })}

        {/* ========================================================
            3. 5단계: 종합 점수 검수판 (오기록 원천 차단)
           ======================================================== */}
        <section className="w-full h-[calc(100vh-56px)] snap-start flex flex-col justify-between p-3.5 bg-stone-950 text-left">
          {/* Header */}
          <div className="border-b border-stone-800 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  ✓
                </span>
                <h3 className="text-sm sm:text-base font-black text-stone-100">
                  {courseLetter}-{holeInCourse}홀 스코어 검수
                </h3>
              </div>
              <span className="text-[11px] font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-700">
                Par {currentPar}
              </span>
            </div>
            <p className="text-[10px] text-stone-400 mt-0.5">
              전체 동반자의 타수를 확인 후 마감하세요.
            </p>
          </div>

          {/* Scores Review List */}
          <div className="space-y-1.5 my-auto py-1">
            {players.map((p, idx) => {
              const sc = p.scores?.[currentHole] ?? currentPar;
              const badge = getScoreDiffBadge(sc, currentPar);
              const isPLeader = p.isLeader || idx === 0;

              return (
                <div
                  key={p.id}
                  onClick={() => scrollToCard(idx)}
                  className="flex items-center justify-between p-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-700 active:scale-98 transition cursor-pointer"
                  title="터치하여 타수 재수정"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4.5 h-4.5 rounded-full bg-stone-800 text-stone-400 text-[10px] font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-stone-200 truncate max-w-[120px]">
                      {p.name}
                      {isPLeader && <span className="text-[10px] ml-1">👑</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white">{sc}타</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badge.color}`}
                    >
                      {badge.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Confirm Action */}
          <div className="space-y-2 pt-1 border-t border-stone-900">
            <button
              type="button"
              onClick={handleNextHole}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-sm sm:text-base shadow-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>{isLastHole ? '🏆 18홀 라운드 완주 & 성적표' : '✅ 스코어 확인 & 다음 홀'}</span>
            </button>

            {/* Gesture Guide */}
            <div className="flex items-center justify-between text-[10px] text-stone-400 font-semibold px-1">
              <span>◀ 좌로 밀기: 즉시 다음 홀</span>
              <span>우로 밀기: 이전 홀 ▶</span>
            </div>
          </div>
        </section>
      </div>

      {/* Mini Pagination Dots (Indicator on right edge) */}
      <div className="fixed right-1.5 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1.5 pointer-events-none">
        {Array.from({ length: totalCards }).map((_, i) => (
          <span
            key={`dot-${i}`}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              activeCardIndex === i ? 'bg-amber-400 scale-125' : 'bg-stone-700/80'
            }`}
          />
        ))}
      </div>

      {/* Completion Modal */}
      {isCompletedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-[280px] bg-stone-900 border-2 border-amber-400 rounded-3xl p-5 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center text-3xl shadow-lg">
              🏆
            </div>
            <div>
              <h3 className="text-lg font-black text-white">라운드 완주!</h3>
              <p className="text-xs text-stone-400 mt-1">
                전체 홀 스코어가 안전하게 저장되었습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/round/result?id=${roundId}`)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black text-sm shadow-md active:scale-95 transition cursor-pointer"
            >
              📊 최종 성적표 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
