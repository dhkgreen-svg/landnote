'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, ShieldAlert, Award, Volume2, Play, Pencil, Database, BarChart2, Search, Filter, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { Course, RoundPlayer, RoundSession } from '@/types/parkon';
import { ParkOnStorage, requestWakeLock, releaseWakeLock } from '@/lib/storage';
import { ClubStorage } from '@/lib/clubStorage';
import { LocalRuleBanner } from '@/components/LocalRuleBanner';
import { TipCard } from '@/components/TipCard';
import { ConditionVoteModal } from '@/components/ConditionVoteModal';
import { cleanPlayerName, sortPlayersByLeaderAndAlphabetical, getDefaultSelfName, syncRoundSelfNameToUserProfile } from '@/lib/playerUtils';
import { HoleScoreBadge, ScoreBadgeLegend } from '@/components/HoleScoreBadge';

export default function RoundPlayPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = params?.id as string;

  const [session, setSession] = useState<RoundSession | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [currentHole, setCurrentHole] = useState<number>(1);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const [sunlightMode, setSunlightModeState] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [showCoursePicker, setShowCoursePicker] = useState<boolean>(false);
  const [pickerCourseLetter, setPickerCourseLetter] = useState<string>('A');
  const [pickerHoleNumber, setPickerHoleNumber] = useState<number>(1);
  const [pickerRoundNumber, setPickerRoundNumber] = useState<number>(1);
  const [confirmedFeedback, setConfirmedFeedback] = useState<boolean>(false);

  // Field Condition Modal State
  const [showConditionModal, setShowConditionModal] = useState<boolean>(false);

  // Hole Par & Distance Crowdsourcing Modal State
  const [showHoleSpecModal, setShowHoleSpecModal] = useState<boolean>(false);
  const [showSpecConfirmStep, setShowSpecConfirmStep] = useState<boolean>(false);
  const [editingPar, setEditingPar] = useState<number>(3);
  const [editingDistance, setEditingDistance] = useState<number>(50);
  const [specSavedToast, setSpecSavedToast] = useState<string | null>(null);

  // Total Cumulative Score & Course Breakdown Modal State
  const [showTotalScoreModal, setShowTotalScoreModal] = useState<boolean>(false);
  const [modalActiveTab, setModalActiveTab] = useState<'COURSES' | 'INTEGRATED' | 'MATRIX'>('COURSES');
  const [courseFilterLetter, setCourseFilterLetter] = useState<string>('ALL');

  // Official vs Practice/Test Completion Modal State ("오늘 스코어를 반영할까요?")
  const [showFinishOfficialModal, setShowFinishOfficialModal] = useState<boolean>(false);
  const [showVirtualFinishModal, setShowVirtualFinishModal] = useState<boolean>(false);

  // 📶 오프라인 강변 음영 지역 안심 자동 저장 상태
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineToast, setOfflineToast] = useState<string | null>(null);

  // 👑 조장 및 동반자 관리 모달 상태
  const [showPlayerEditModal, setShowPlayerEditModal] = useState<boolean>(false);
  const [editPlayersDraft, setEditPlayersDraft] = useState<RoundPlayer[]>([]);
  const [shareFeedbackToast, setShareFeedbackToast] = useState<string | null>(null);

  // 🏌️ [5대 마스터 아키텍처 1] 2단계 경기 동선: 'TEE_SHOT' (1단계 코스안내 전광판) | 'SCORING' (2단계 스코어 기입창)
  const [holeStep, setHoleStep] = useState<'TEE_SHOT' | 'SCORING'>('TEE_SHOT');

  // 🏌️ [5대 마스터 아키텍처 2] 카운트 방식 토글: 'ZERO_BASE' (0베이스) | 'PAR_BASE' (Par기준) - localStorage 영구 연동
  const [countingMode, setCountingMode] = useState<'ZERO_BASE' | 'PAR_BASE'>('ZERO_BASE');

  // 🏌️ [5대 마스터 아키텍처 3] 선수별 현재 홀 휴식 상태 (결번 처리)
  const [restingPlayerIds, setRestingPlayerIds] = useState<string[]>([]);

  // 🏌️ [5대 마스터 아키텍처 4] 목표 홀 도달 시 심플 선택 팝업 ([더 치기] vs [종료하기])
  const [showTargetHoleReachedModal, setShowTargetHoleReachedModal] = useState<boolean>(false);

  // 🏌️ [5대 마스터 아키텍처 5] 제원 수정 현장 팻말 필수 확인 체크박스 (2-Strike 시스템)
  const [signboardChecked, setSignboardChecked] = useState<boolean>(false);

  // 🏌️ [5대 마스터 아키텍처 6] 공식 시합용 '홀 전담 심판 모드' & 선수 교차 검증
  const [isRefereeMode, setIsRefereeMode] = useState<boolean>(false);
  const [showPlayerCrossCheckModal, setShowPlayerCrossCheckModal] = useState<boolean>(false);
  const [crossCheckToast, setCrossCheckToast] = useState<string | null>(null);
  const [showRefereeAssignModal, setShowRefereeAssignModal] = useState<boolean>(false);

  // 조장 및 동반자 관리 모달 열기 (본인 이름 및 동반자 이름 유실 방지 자동 보정)
  const openPlayerEditModal = () => {
    if (!session || !session.players) return;
    const selfName = getDefaultSelfName();
    const syncedDraft = session.players.map((p, idx) => {
      const isSelf = p.isSelf ?? (idx === 0);
      let name = (p.name || '').trim();
      if (isSelf) {
        if (!name || name === '본인' || name.startsWith('본인(')) {
          name = selfName;
        }
      } else {
        if (!name) {
          name = `동반자 ${idx + 1}`;
        }
      }
      return {
        ...p,
        isSelf,
        name,
      };
    });
    setEditPlayersDraft(syncedDraft);
    setShowPlayerEditModal(true);
  };

  // Load round and course
  useEffect(() => {
    // 📱 새 조장 스마트폰으로 카톡 링크 열었을 때 경기 세션 즉시 복원 (Handoff)
    if (typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const handoffParam = searchParams.get('handoff');
        if (handoffParam) {
          const parsed = JSON.parse(decodeURIComponent(handoffParam));
          if (parsed && (parsed.id === roundId || !roundId)) {
            ParkOnStorage.saveCurrentRound(parsed);
            window.history.replaceState({}, '', `/round/${parsed.id || roundId}`);
          }
        }
      } catch (e) {
        console.error('Failed to import handoff round session:', e);
      }
    }

    const active = ParkOnStorage.getCurrentRound();
    if (!active || active.id !== roundId) {
      // Fallback: check completed rounds
      const completed = ParkOnStorage.getCompletedRounds().find((r) => r.id === roundId);
      if (completed) {
        router.replace(`/round/result?id=${roundId}`);
        return;
      }
      router.replace('/');
      return;
    }

    // Sanitize session: ensure confirmedHoles and clean unconfirmed future scores
    let sanitizedSession = active;
    let confirmedHoles: number[] = active.confirmedHoles || [];

    if (!active.confirmedHoles) {
      const allHoles = (active.selectedHoleNumbers && active.selectedHoleNumbers.length > 0)
        ? active.selectedHoleNumbers
        : Array.from({ length: active.totalHoles || 9 }, (_, i) => i + 1);

      const currentIdx = Math.max(0, (active.currentHole || 1) - 1);
      const pastHoles = allHoles.slice(0, currentIdx);

      // Only past holes strictly before currentHole with scores are confirmed
      confirmedHoles = pastHoles.filter((hNum) =>
        active.players.some((p) => (p.scores?.[hNum] || 0) > 0)
      );

      // Clean unconfirmed future holes from scores so they don't corrupt totals
      const sanitizedPlayers = active.players.map((p) => {
        const cleanedScores: Record<number, number> = {};
        const cleanedOb: Record<number, number> = {};
        confirmedHoles.forEach((h) => {
          if (p.scores?.[h] !== undefined) cleanedScores[h] = p.scores[h];
          if (p.obCount?.[h] !== undefined) cleanedOb[h] = p.obCount[h];
        });
        const totalStrokes = confirmedHoles.reduce((acc, h) => acc + (cleanedScores[h] || 0), 0);
        return {
          ...p,
          scores: cleanedScores,
          obCount: cleanedOb,
          totalStrokes,
        };
      });

      sanitizedSession = {
        ...active,
        confirmedHoles,
        players: sanitizedPlayers,
      };
    }

    // 1번 조장 우선 배치 + 동반자 가나다순 정렬 및 본인 활동명 실시간 동기화
    const basePlayers = sanitizedSession.players || active.players || [];
    const currentSelfName = getDefaultSelfName();
    const syncedSelfPlayers = basePlayers.map((p, idx) => {
      const isSelf = p.isSelf ?? (idx === 0);
      if (isSelf && p.name !== currentSelfName) {
        return { ...p, name: currentSelfName, isSelf: true };
      }
      return { ...p, isSelf };
    });
    const sortedPlayers = sortPlayersByLeaderAndAlphabetical(syncedSelfPlayers);
    sanitizedSession = {
      ...sanitizedSession,
      players: sortedPlayers,
    };
    ParkOnStorage.saveCurrentRound(sanitizedSession);

    setSession(sanitizedSession);
    setCurrentHole(sanitizedSession.currentHole || 1);

    const allCourses = ParkOnStorage.getAllCourses();
    const foundCourse = allCourses.find((c) => c.id === sanitizedSession.courseId) || allCourses[0];
    setCourse(foundCourse);

    // Request WakeLock to prevent screen dimming during active field play
    requestWakeLock().then((active) => setWakeLockActive(active));

    // 햇빛 모드 상태 복원
    setSunlightModeState(ParkOnStorage.getSunlightMode());

    // 스마트폰 물리 뒤로가기 & 제스처 실수 방어막 (History Lock)
    if (typeof window !== 'undefined') {
      window.history.pushState({ parkonRoundLock: true }, '');
    }

    const handlePopState = () => {
      // Re-push history state to prevent accidentally leaving the page
      if (typeof window !== 'undefined') {
        window.history.pushState({ parkonRoundLock: true }, '');
      }
      setShowExitConfirm(true);
    };
    window.addEventListener('popstate', handlePopState);

    // 탭 닫기 전 자동 저장 및 확인
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const current = ParkOnStorage.getCurrentRound();
      if (current) {
        ParkOnStorage.saveCurrentRound(current);
      }
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 📶 강변 음영 지역 네트워크 감지 및 자동 동기화
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        setOfflineToast('📶 네트워크가 복구되었습니다. 스코어가 정상 동기화되었습니다.');
        setTimeout(() => setOfflineToast(null), 3500);
        const cur = ParkOnStorage.getCurrentRound();
        if (cur) ParkOnStorage.saveCurrentRound(cur);
      };
      const handleOffline = () => {
        setIsOnline(false);
        setOfflineToast('📶 [오프라인 모드] 음영 지역입니다. 스마트폰에 100% 안전하게 저장 중입니다.');
        setTimeout(() => setOfflineToast(null), 4000);
      };
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        releaseWakeLock();
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => {
      releaseWakeLock();
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roundId, router]);

  // 프로필 활동명 변경 또는 외부 플레이어 정보 변경 시 실시간 반영
  useEffect(() => {
    const handleProfileOrPlayerSync = () => {
      const active = ParkOnStorage.getCurrentRound();
      if (active && active.id === roundId && active.players) {
        setSession((prev) => {
          if (!prev) return active;
          return {
            ...prev,
            players: active.players,
          };
        });
      }
    };

    window.addEventListener('storage', handleProfileOrPlayerSync);
    window.addEventListener('parkon_profile_updated', handleProfileOrPlayerSync);
    window.addEventListener('parkon_round_player_sync', handleProfileOrPlayerSync);

    return () => {
      window.removeEventListener('storage', handleProfileOrPlayerSync);
      window.removeEventListener('parkon_profile_updated', handleProfileOrPlayerSync);
      window.removeEventListener('parkon_round_player_sync', handleProfileOrPlayerSync);
    };
  }, [roundId]);

  // Sync state to LocalStorage & Club Storage & Offline Backup
  const updateSession = useCallback((updated: RoundSession) => {
    setSession(updated);
    ParkOnStorage.saveCurrentRound(updated);

    // 강변 음영 지역 대비 전용 2중 오프라인 스냅샷 보관
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'parkon_offline_score_backup',
          JSON.stringify({
            roundId: updated.id,
            timestamp: new Date().toISOString(),
            data: updated,
          })
        );
      } catch (e) {}
    }

    // Sync to ClubStorage if linked to club room
    if (updated.clubRoomId && updated.clubGroupNumber) {
      const playerUpdates = updated.players.map((p) => {
        const scores = p.scores || {};
        const holeKeys = Object.keys(scores).map(Number);
        const validHoles = holeKeys.filter((h) => scores[h] !== undefined && scores[h] > 0);
        return {
          playerId: p.id,
          playerName: p.name,
          scores,
          totalStrokes: p.totalStrokes || 0,
          parDiff: p.totalParDiff || 0,
          holesCompleted: validHoles.length,
        };
      });
      ClubStorage.updateGroupScores(updated.clubRoomId, updated.clubGroupNumber, playerUpdates);
    }
  }, []);

  if (!session || !course) {
    return (
      <div className="p-8 text-center font-bold text-stone-500">
        스코어보드 불러오는 중...
      </div>
    );
  }

  const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  // Helper to extract base hole (1..72), round number (1, 2, ...), course letter, and hole-in-course (1..9)
  const getHoleInfo = (hNum: number) => {
    const num = Number(hNum);
    const base = ((num - 1) % 1000) + 1;
    const round = Math.floor((num - 1) / 1000) + 1;
    const cIdx = Math.floor((base - 1) / 9);
    const cLetter = COURSE_LETTERS[cIdx] || 'A';
    const hInCourse = ((base - 1) % 9) + 1;
    return { num, base, round, cLetter, hInCourse, cIdx };
  };

  // Map sequential currentHole index (1-based) to actual hole number in course
  const actualHoleNumber = Number(
    session.selectedHoleNumbers && session.selectedHoleNumbers[currentHole - 1]
      ? session.selectedHoleNumbers[currentHole - 1]
      : currentHole
  );

  const currentHoleInfo = getHoleInfo(actualHoleNumber);
  const baseHoleNumber = currentHoleInfo.base;
  const currentRoundNumber = currentHoleInfo.round;
  const courseLetter = currentHoleInfo.cLetter;
  const holeInCourse = currentHoleInfo.hInCourse;

  const holeMetadata = (course.holesMetadata || []).find((m) => Number(m.hole) === baseHoleNumber) || {
    hole: baseHoleNumber,
    par: 3,
    distanceMeter: 50,
    localRule: undefined,
    tip: undefined,
  };

  const currentPar = Number(holeMetadata.par);

  // Helper to determine which course letter a hole belongs to
  const getCourseLetterForHole = (hNum: number) => {
    return getHoleInfo(hNum).cLetter;
  };

  // Holes progression and cumulative calculations
  const allHolesInSession = (session.selectedHoleNumbers && session.selectedHoleNumbers.length > 0)
    ? session.selectedHoleNumbers
    : Array.from({ length: session.totalHoles || 9 }, (_, i) => i + 1);

  // Confirmed holes list: only holes where user tapped [확인] or [다음 홀 이동]
  const confirmedHoles: number[] = session.confirmedHoles || [];

  // Helper to determine which holes have officially been confirmed and scored for a player
  const getPlayerConfirmedHoles = (player: RoundPlayer) => {
    return confirmedHoles.filter((hNum) => (player.scores?.[hNum] || 0) > 0);
  };

  // Segment calculation for course-by-course cards and integrated averages
  const allHoleInfos = allHolesInSession.map(getHoleInfo);

  const distinctSegments: Array<{ cLetter: string; round: number; cIdx: number }> = [];
  allHoleInfos.forEach((info) => {
    if (!distinctSegments.some((s) => s.cLetter === info.cLetter && s.round === info.round)) {
      distinctSegments.push({ cLetter: info.cLetter, round: info.round, cIdx: info.cIdx });
    }
  });

  const roundsPerLetter: Record<string, number> = {};
  distinctSegments.forEach((s) => {
    roundsPerLetter[s.cLetter] = (roundsPerLetter[s.cLetter] || 0) + 1;
  });

  const courseSegments = distinctSegments.map((seg) => {
    const roundOffset = (seg.round - 1) * 1000;
    const courseStartHole = seg.cIdx * 9 + 1;
    const fullHoles = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => roundOffset + courseStartHole + i);
    const confirmedInSeg = fullHoles.filter((h) => confirmedHoles.includes(h));
    const playedCount = confirmedInSeg.length;
    const isCompleted = playedCount >= 9;

    const segmentPar = confirmedInSeg.reduce((sum, h) => {
      const base = ((h - 1) % 1000) + 1;
      const meta = course.holesMetadata?.find((m) => Number(m.hole) === base);
      return sum + Number(meta?.par || 3);
    }, 0);

    const title = roundsPerLetter[seg.cLetter] > 1 || seg.round > 1
      ? `${seg.cLetter}코스 (${seg.round}회차)`
      : `${seg.cLetter}코스`;

    const playerSummaries = session.players.map((p) => {
      const strokes = confirmedInSeg.reduce((sum, h) => sum + (p.scores[h] || 0), 0);
      const diff = strokes - segmentPar;
      const avgHole = playedCount > 0 ? (strokes / playedCount).toFixed(2) : '0.00';

      const holeDetails = fullHoles.map((hNum, i) => {
        const base = ((hNum - 1) % 1000) + 1;
        const meta = course.holesMetadata?.find((m) => Number(m.hole) === base);
        const par = Number(meta?.par || 3);
        const isConfirmed = confirmedHoles.includes(hNum);
        const s = isConfirmed ? p.scores[hNum] : undefined;
        const d = s !== undefined ? s - par : undefined;
        return {
          hNum,
          baseHole: base,
          holeInCourse: i + 1,
          par,
          isConfirmed,
          strokes: s,
          diff: d,
        };
      });

      return {
        player: p,
        strokes,
        diff,
        avgHole,
        playedCount,
        holeDetails,
      };
    });

    return {
      segmentKey: `${seg.cLetter}_${seg.round}`,
      courseLetter: seg.cLetter,
      roundNumber: seg.round,
      title,
      fullHoles,
      confirmedInSeg,
      playedCount,
      isCompleted,
      segmentPar,
      playerSummaries,
    };
  }).filter((seg) => seg.playedCount > 0 || seg.fullHoles.includes(actualHoleNumber));

  // Integrated course groups (e.g. C코스 1차 + 2차 combined averages)
  const uniqueLettersInSegments = Array.from(new Set(courseSegments.map((s) => s.courseLetter)));

  const integratedCourseGroups = uniqueLettersInSegments.map((cLetter) => {
    const segs = courseSegments.filter((s) => s.courseLetter === cLetter);
    const totalPlayedHoles = segs.reduce((sum, s) => sum + s.playedCount, 0);
    const totalPar = segs.reduce((sum, s) => sum + s.segmentPar, 0);

    const playerStats = session.players.map((p) => {
      const totalStrokes = segs.reduce((sum, s) => {
        const pSummary = s.playerSummaries.find((ps) => ps.player.id === p.id);
        return sum + (pSummary?.strokes || 0);
      }, 0);
      const diff = totalStrokes - totalPar;
      const avgPerHole = totalPlayedHoles > 0 ? (totalStrokes / totalPlayedHoles).toFixed(2) : '0.00';
      const converted9Hole = totalPlayedHoles > 0 ? ((totalStrokes / totalPlayedHoles) * 9).toFixed(1) : '0.0';

      const roundBreakdowns = segs.map((s) => {
        const pSummary = s.playerSummaries.find((ps) => ps.player.id === p.id);
        return {
          title: s.title,
          strokes: pSummary?.strokes || 0,
          playedCount: s.playedCount,
          diff: pSummary?.diff || 0,
          avgPerHole: pSummary?.avgHole || '0.00',
        };
      });

      return {
        player: p,
        totalStrokes,
        diff,
        avgPerHole,
        converted9Hole,
        roundBreakdowns,
      };
    });

    return {
      courseLetter: cLetter,
      totalRounds: segs.length,
      totalPlayedHoles,
      totalPar,
      segments: segs,
      playerStats,
    };
  });

  // Overall player rankings & averages
  const overallPlayerRankings = session.players
    .map((p, idx) => {
      const pConfirmed = getPlayerConfirmedHoles(p);
      const pStrokes = pConfirmed.reduce((sum, h) => sum + (p.scores[h] || 0), 0);
      const pPar = pConfirmed.reduce((sum, h) => {
        const base = ((h - 1) % 1000) + 1;
        const meta = course.holesMetadata?.find((m) => Number(m.hole) === base);
        return sum + Number(meta?.par || 3);
      }, 0);
      const diff = pStrokes - pPar;
      const avgPerHole = pConfirmed.length > 0 ? (pStrokes / pConfirmed.length).toFixed(2) : '0.00';
      const converted9Hole = pConfirmed.length > 0 ? ((pStrokes / pConfirmed.length) * 9).toFixed(1) : '0.0';
      const converted18Hole = pConfirmed.length > 0 ? ((pStrokes / pConfirmed.length) * 18).toFixed(1) : '0.0';

      return {
        player: p,
        originalIdx: idx,
        strokes: pStrokes,
        diff,
        scoredCount: pConfirmed.length,
        avgPerHole,
        converted9Hole,
        converted18Hole,
      };
    })
    .sort((a, b) => a.strokes - b.strokes);

  // Change strokes for a player
  const changeStroke = (playerId: string, delta: number) => {
    const target = session.players.find((p) => p.id === playerId);
    if (target?.isOut) return;

    const curConfirmed = session.confirmedHoles || [];
    const updatedPlayers = session.players.map((p) => {
      if (p.id !== playerId || p.isOut) return p;
      const currentStrokes = p.scores[actualHoleNumber] ?? currentPar;
      const newStrokes = Math.max(1, currentStrokes + delta);

      const newScores = { ...p.scores, [actualHoleNumber]: newStrokes };
      const totalStrokes = curConfirmed.reduce(
        (acc, hNum) => acc + (newScores[hNum] || 0),
        0
      );

      return {
        ...p,
        scores: newScores,
        totalStrokes,
      };
    });

    const updatedSession: RoundSession = {
      ...session,
      players: updatedPlayers,
    };
    updateSession(updatedSession);
  };

  // One-touch OB +2 Button
  const handleOB = (playerId: string) => {
    const target = session.players.find((p) => p.id === playerId);
    if (target?.isOut) return;

    const curConfirmed = session.confirmedHoles || [];
    const updatedPlayers = session.players.map((p) => {
      if (p.id !== playerId || p.isOut) return p;
      const currentStrokes = p.scores[actualHoleNumber] ?? currentPar;
      const currentOb = p.obCount[actualHoleNumber] ?? 0;

      const newScores = { ...p.scores, [actualHoleNumber]: currentStrokes + 2 };
      const newOb = { ...p.obCount, [actualHoleNumber]: currentOb + 1 };
      const totalStrokes = curConfirmed.reduce(
        (acc, hNum) => acc + (newScores[hNum] || 0),
        0
      );

      return {
        ...p,
        scores: newScores,
        obCount: newOb,
        totalStrokes,
      };
    });

    updateSession({ ...session, players: updatedPlayers });
  };

  // Reset to Par for player (tapping center button sets par score explicitly)
  const resetToPar = (playerId: string) => {
    const target = session.players.find((p) => p.id === playerId);
    if (target?.isOut) return;

    const curConfirmed = session.confirmedHoles || [];
    const updatedPlayers = session.players.map((p) => {
      if (p.id !== playerId || p.isOut) return p;
      const newScores = { ...p.scores, [actualHoleNumber]: currentPar };
      const totalStrokes = curConfirmed.reduce(
        (acc, hNum) => acc + (newScores[hNum] || 0),
        0
      );
      return {
        ...p,
        scores: newScores,
        totalStrokes,
      };
    });
    updateSession({ ...session, players: updatedPlayers });
  };

  // Available courses for this facility
  const totalNumCourses = course.totalCourses || Math.max(1, Math.round(course.totalHoles / 9));
  const allAvailableLetters = COURSE_LETTERS.slice(0, totalNumCourses);

  // Open course and hole picker modal
  const openCoursePicker = () => {
    setPickerCourseLetter(courseLetter);
    setPickerHoleNumber(holeInCourse);
    setPickerRoundNumber(currentRoundNumber || 1);
    setShowCoursePicker(true);
  };

  // Confirm scores and save to storage
  const handleConfirmHole = () => {
    // 1. Add current hole to confirmedHoles if not already present
    const currentConfirmed = session.confirmedHoles ? [...session.confirmedHoles] : [];
    if (!currentConfirmed.includes(actualHoleNumber)) {
      currentConfirmed.push(actualHoleNumber);
    }

    // 2. Lock in score for current hole for active players (preserve departed isOut players)
    const updatedPlayers = session.players.map((p) => {
      if (p.isOut) return p;
      const currentVal = p.scores[actualHoleNumber] ?? currentPar;
      const newScores = { ...p.scores, [actualHoleNumber]: currentVal };
      const newOb = { ...p.obCount, [actualHoleNumber]: p.obCount[actualHoleNumber] ?? 0 };
      const totalStrokes = currentConfirmed.reduce(
        (sum, hNum) => sum + (newScores[hNum] || 0),
        0
      );
      return {
        ...p,
        scores: newScores,
        obCount: newOb,
        totalStrokes,
      };
    });

    const updatedSession = {
      ...session,
      confirmedHoles: currentConfirmed,
      players: updatedPlayers,
    };
    updateSession(updatedSession);

    setConfirmedFeedback(true);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(40);
      } catch (e) {
        // Ignore vibration errors
      }
    }
    setTimeout(() => {
      setConfirmedFeedback(false);
    }, 1200);
  };

  // Switch to another course and hole (e.g. B코스 5번 홀 or C코스 2회차)
  const handleSwitchCourse = (targetLetter: string, targetHoleNum: number = 1, targetRoundNum: number = 1) => {
    const targetIdx = COURSE_LETTERS.indexOf(targetLetter);
    if (targetIdx < 0) return;

    const courseStartHole = targetIdx * 9 + 1;
    const roundOffset = (targetRoundNum - 1) * 1000;
    const targetSpecificHoleNumber = roundOffset + courseStartHole + (targetHoleNum - 1);

    const currentHoles = session.selectedHoleNumbers ? [...session.selectedHoleNumbers] : [];
    
    // Check if target specific hole already exists in session
    const existingHoleIdx = currentHoles.indexOf(targetSpecificHoleNumber);
    if (existingHoleIdx >= 0) {
      // If target hole already in session, just navigate to it
      const targetCurrentHole = existingHoleIdx + 1;
      setCurrentHole(targetCurrentHole);
      setHoleStep('TEE_SHOT');
      setRestingPlayerIds([]);
      updateSession({ ...session, currentHole: targetCurrentHole });
      setShowCoursePicker(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Switching to a NEW course or NEW round!
    // Keep played holes up to currentHole and remove unplayed previous holes
    const playedSoFarHoles = currentHoles.slice(0, currentHole);
    const unplayedPrevHoles = currentHoles.slice(currentHole);

    // Generate 9 holes for the new course starting from targetHoleNum
    const newCourseHoles = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(
      (i) => roundOffset + courseStartHole + ((targetHoleNum - 1 + i) % 9)
    );

    const updatedHolesList = [...playedSoFarHoles, ...newCourseHoles];
    const targetCurrentHole = playedSoFarHoles.length + 1; // 1st hole of the new course!

    const updatedCourses = session.selectedCourseLetters ? [...session.selectedCourseLetters] : [];
    if (!updatedCourses.includes(targetLetter)) {
      updatedCourses.push(targetLetter);
    }

    // Retain only confirmed holes from previous courses
    const updatedConfirmedHoles = (session.confirmedHoles || []).filter(
      (hNum) => !unplayedPrevHoles.includes(hNum)
    );

    // Clean players' scores: remove unplayed previous holes and ensure new holes are unplayed/empty
    const updatedPlayers = session.players.map((p) => {
      const newScores = { ...p.scores };
      const newOb = { ...p.obCount };

      unplayedPrevHoles.forEach((unplayedHNum) => {
        delete newScores[unplayedHNum];
        delete newOb[unplayedHNum];
      });

      // Crucial: ensure newCourseHoles have no phantom scores until confirmed or entered!
      newCourseHoles.forEach((hNum) => {
        delete newScores[hNum];
        delete newOb[hNum];
      });

      const totalStrokes = updatedConfirmedHoles.reduce(
        (acc, hNum) => acc + (newScores[hNum] || 0),
        0
      );

      return {
        ...p,
        scores: newScores,
        obCount: newOb,
        totalStrokes,
      };
    });

    const updatedSession: RoundSession = {
      ...session,
      currentHole: targetCurrentHole,
      totalHoles: updatedHolesList.length,
      selectedCourseLetters: updatedCourses,
      selectedHoleNumbers: updatedHolesList,
      confirmedHoles: updatedConfirmedHoles,
      players: updatedPlayers,
    };

    setCurrentHole(targetCurrentHole);
    setHoleStep('TEE_SHOT');
    setRestingPlayerIds([]);
    updateSession(updatedSession);
    setShowCoursePicker(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 9홀 순환 추가 (무제한 자유 라운드 순환 및 목표 홀 연장 시)
  const handleExtendNext9Holes = () => {
    if (!session) return;
    const numCourses = course
      ? course.totalCourses || Math.max(1, Math.round(course.totalHoles / 9))
      : 2;
    const availableLetters = COURSE_LETTERS.slice(0, numCourses);
    const currentHoles = session.selectedHoleNumbers ? [...session.selectedHoleNumbers] : [];
    const lastHole = currentHoles[currentHoles.length - 1] || 9;
    const lastInfo = getHoleInfo(lastHole);
    const currCourseIdx = Math.max(0, COURSE_LETTERS.indexOf(lastInfo.cLetter));
    const nextCourseIdx = (currCourseIdx + 1) % (availableLetters.length || 1);
    const nextCourseLetter = availableLetters[nextCourseIdx] || 'A';
    const nextRound = lastInfo.cLetter === nextCourseLetter ? lastInfo.round + 1 : lastInfo.round;
    const roundOffset = (nextRound - 1) * 1000;
    const nextStartHole = nextCourseIdx * 9 + 1;
    const additionalHoles = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(
      (i) => roundOffset + nextStartHole + i
    );
    const updatedHolesList = [...currentHoles, ...additionalHoles];
    const targetCurrentHole = currentHoles.length + 1;

    const currentConfirmed = session.confirmedHoles ? [...session.confirmedHoles] : [];
    if (!currentConfirmed.includes(actualHoleNumber)) {
      currentConfirmed.push(actualHoleNumber);
    }

    const updatedPlayers = session.players.map((p) => {
      const currentVal = p.scores[actualHoleNumber] ?? currentPar;
      const newScores = { ...p.scores, [actualHoleNumber]: currentVal };
      const newOb = { ...p.obCount, [actualHoleNumber]: p.obCount[actualHoleNumber] ?? 0 };
      const totalStrokes = currentConfirmed.reduce((sum, hNum) => sum + (newScores[hNum] || 0), 0);
      return {
        ...p,
        scores: newScores,
        obCount: newOb,
        totalStrokes,
      };
    });

    const updatedCourses = session.selectedCourseLetters ? [...session.selectedCourseLetters] : [];
    if (!updatedCourses.includes(nextCourseLetter)) {
      updatedCourses.push(nextCourseLetter);
    }

    const updatedSession: RoundSession = {
      ...session,
      currentHole: targetCurrentHole,
      totalHoles: updatedHolesList.length,
      selectedCourseLetters: updatedCourses,
      selectedHoleNumbers: updatedHolesList,
      confirmedHoles: currentConfirmed,
      players: updatedPlayers,
    };

    setCurrentHole(targetCurrentHole);
    setHoleStep('TEE_SHOT');
    setRestingPlayerIds([]);
    updateSession(updatedSession);
    setShowTargetHoleReachedModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 다음 홀 직접 이동 처리 (목표 도달 검사 포함)
  const handleProceedNextHoleDirectly = () => {
    if (!session) return;
    const currentConfirmed = session.confirmedHoles ? [...session.confirmedHoles] : [];
    if (!currentConfirmed.includes(actualHoleNumber)) {
      currentConfirmed.push(actualHoleNumber);
    }

    const updatedPlayers = session.players.map((p) => {
      const currentVal = p.scores[actualHoleNumber] ?? currentPar;
      const newScores = { ...p.scores, [actualHoleNumber]: currentVal };
      const newOb = { ...p.obCount, [actualHoleNumber]: p.obCount[actualHoleNumber] ?? 0 };
      const totalStrokes = currentConfirmed.reduce(
        (sum, hNum) => sum + (newScores[hNum] || 0),
        0
      );
      return {
        ...p,
        scores: newScores,
        obCount: newOb,
        totalStrokes,
      };
    });

    // 목표 홀 설정 라운드 도달 검사
    const targetCount = session.targetHolesCount || (session.isUnlimitedRound ? 999 : session.totalHoles);
    const hasReachedTarget = currentHole >= targetCount;

    if (hasReachedTarget) {
      setShowTargetHoleReachedModal(true);
      return;
    }

    if (currentHole < session.totalHoles) {
      const nextH = currentHole + 1;
      setCurrentHole(nextH);
      setHoleStep('TEE_SHOT'); // 2단계에서 다음 홀 1단계 대형 전광판으로 자동 전환!
      setRestingPlayerIds([]);
      updateSession({
        ...session,
        currentHole: nextH,
        confirmedHoles: currentConfirmed,
        players: updatedPlayers,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleExtendNext9Holes();
    }
  };

  const handleNextHole = () => {
    if (isRefereeMode) {
      // 심판 모드: 공식 기록 확정 ➔ 선수 교차 확인 팝업 출현
      setShowPlayerCrossCheckModal(true);
      return;
    }
    handleProceedNextHoleDirectly();
  };

  const handleConfirmCrossCheck = () => {
    setShowPlayerCrossCheckModal(false);
    setCrossCheckToast('✓ 동반 선수가 심판 기록을 승인하였습니다. 다음 홀로 이동합니다.');
    setTimeout(() => setCrossCheckToast(null), 3000);
    handleProceedNextHoleDirectly();
  };

  const handleRejectCrossCheck = () => {
    setShowPlayerCrossCheckModal(false);
    setCrossCheckToast('⚠️ 선수가 재확인을 요청했습니다. 타수를 다시 확인해 주십시오.');
    setTimeout(() => setCrossCheckToast(null), 3500);
  };

  const handlePauseAndGoHome = () => {
    if (session) {
      ParkOnStorage.saveCurrentRound(session);
    }
    router.push('/');
  };

  const toggleCountingMode = () => {
    setCountingMode((prev) => {
      const next = prev === 'ZERO_BASE' ? 'PAR_BASE' : 'ZERO_BASE';
      if (typeof window !== 'undefined') {
        localStorage.setItem('parkon_counting_mode', next);
      }
      return next;
    });
  };

  const togglePlayerRest = (playerId: string) => {
    setRestingPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const handlePrevHole = () => {
    if (currentHole > 1) {
      const prevH = currentHole - 1;
      setCurrentHole(prevH);
      setHoleStep('SCORING');
      updateSession({ ...session, currentHole: prevH });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinishRound = () => {
    if (session?.isVirtual) {
      setShowVirtualFinishModal(true);
      return;
    }
    setShowFinishOfficialModal(true);
  };

  const handleEarlyFinishConfirm = () => {
    if (session?.isVirtual) {
      setShowVirtualFinishModal(true);
      return;
    }
    setShowFinishOfficialModal(true);
  };

  const executeFinishRound = (isOfficial: boolean) => {
    setShowFinishOfficialModal(false);

    // Current hole is confirmed on finish
    const currentConfirmed = session.confirmedHoles ? [...session.confirmedHoles] : [];
    if (!currentConfirmed.includes(actualHoleNumber)) {
      currentConfirmed.push(actualHoleNumber);
    }

    const unplayedHoles = (session.selectedHoleNumbers || []).filter(
      (hNum) => !currentConfirmed.includes(hNum)
    );

    const updatedPlayers = session.players.map((p) => {
      if (p.isOut) {
        const newScores = { ...p.scores };
        const newOb = { ...p.obCount };
        unplayedHoles.forEach((hNum) => {
          delete newScores[hNum];
          delete newOb[hNum];
        });
        const totalStrokes = Object.values(newScores).reduce((sum, s) => sum + (s || 0), 0);
        return {
          ...p,
          scores: newScores,
          obCount: newOb,
          totalStrokes,
        };
      }

      const currentVal = p.scores[actualHoleNumber] ?? currentPar;
      const newScores = { ...p.scores, [actualHoleNumber]: currentVal };
      const newOb = { ...p.obCount, [actualHoleNumber]: p.obCount[actualHoleNumber] ?? 0 };

      // Remove future unconfirmed holes
      unplayedHoles.forEach((hNum) => {
        delete newScores[hNum];
        delete newOb[hNum];
      });

      const totalStrokes = currentConfirmed.reduce(
        (sum, hNum) => sum + (newScores[hNum] || 0),
        0
      );
      return {
        ...p,
        scores: newScores,
        obCount: newOb,
        totalStrokes,
      };
    });

    const finished: RoundSession = {
      ...session,
      status: 'COMPLETED',
      isOfficial,
      totalHoles: currentConfirmed.length,
      selectedHoleNumbers: currentConfirmed,
      confirmedHoles: currentConfirmed,
      players: updatedPlayers,
      completedAt: new Date().toISOString(),
    };
    ParkOnStorage.saveCompletedRound(finished);

    // Sync final completion to ClubStorage if linked to club room
    if (finished.clubRoomId && finished.clubGroupNumber) {
      const playerUpdates = finished.players.map((p) => {
        const scores = p.scores || {};
        const holeKeys = Object.keys(scores).map(Number);
        const validHoles = holeKeys.filter((h) => scores[h] !== undefined && scores[h] > 0);
        return {
          playerId: p.id,
          playerName: p.name,
          scores,
          totalStrokes: p.totalStrokes || 0,
          parDiff: p.totalParDiff || 0,
          holesCompleted: validHoles.length,
        };
      });
      ClubStorage.updateGroupScores(finished.clubRoomId, finished.clubGroupNumber, playerUpdates);
      ClubStorage.setGroupStatus(finished.clubRoomId, finished.clubGroupNumber, 'FINISHED');
    }

    router.push(`/round/result?id=${finished.id}`);
  };

  const handleConfirmExitHome = () => {
    if (session) {
      const sessionToSave: RoundSession = {
        ...session,
        currentHole,
        updatedAt: new Date().toISOString(),
      };
      ParkOnStorage.saveCurrentRound(sessionToSave);
    }
    setShowExitConfirm(false);
    router.push('/');
  };

  const toggleSunlightMode = () => {
    const next = !sunlightMode;
    setSunlightModeState(next);
    ParkOnStorage.setSunlightMode(next);
  };

  const openHoleSpecModal = () => {
    setEditingPar(Number(holeMetadata.par) || 3);
    setEditingDistance(Number(holeMetadata.distanceMeter) || 50);
    setShowSpecConfirmStep(false);
    setShowHoleSpecModal(true);
  };

  const handleSaveHoleSpec = (parVal: number, distVal: number, forceConsensus: boolean = false) => {
    if (!course || !session) return;
    const validatedDist = Math.max(10, Math.min(300, Number(distVal) || 50));
    const validatedPar = Math.max(3, Math.min(5, Number(parVal) || 3));
    const targetHoleNum = Number(baseHoleNumber);

    // 1. Persist in Big Data crowdsourced storage with 10-person consensus & initial registrant logic
    const crowdResult = ParkOnStorage.saveCrowdsourcedHoleSpec(
      course.id,
      course.name,
      targetHoleNum,
      validatedPar,
      validatedDist,
      forceConsensus
    );

    // 2. Update hole metadata in current course (replace or add)
    let found = false;
    const updatedMetadata = (course.holesMetadata || []).map((m) => {
      if (Number(m.hole) === targetHoleNum) {
        found = true;
        return {
          ...m,
          par: validatedPar,
          distanceMeter: validatedDist,
        };
      }
      return m;
    });

    if (!found) {
      updatedMetadata.push({
        hole: targetHoleNum,
        par: validatedPar,
        distanceMeter: validatedDist,
      });
    }

    const updatedCourse: Course = {
      ...course,
      holesMetadata: updatedMetadata,
    };
    setCourse(updatedCourse);

    // 3. Recalculate total par for selected holes
    let totalParSoFar = 0;
    if (session.selectedHoleNumbers && session.selectedHoleNumbers.length > 0) {
      session.selectedHoleNumbers.forEach((hNum) => {
        const baseH = ((Number(hNum) - 1) % 1000) + 1;
        const hMeta = updatedMetadata.find((m) => Number(m.hole) === baseH);
        totalParSoFar += Number(hMeta?.par || 3);
      });
    } else {
      for (let h = 1; h <= session.totalHoles; h++) {
        const hMeta = updatedMetadata.find((m) => Number(m.hole) === h);
        totalParSoFar += Number(hMeta?.par || 3);
      }
    }

    // 4. Update player scores on this hole to match new par UNCONDITIONALLY (위가 파3이면 밑에도 숫자 3, 파5면 5로 100% 일치)
    const updatedPlayers = session.players.map((p) => {
      const newScores = { ...p.scores, [targetHoleNum]: validatedPar };
      const totalStrokes = Object.values(newScores).reduce((a, b) => a + b, 0);

      return {
        ...p,
        scores: newScores,
        totalStrokes,
        totalParDiff: totalStrokes - totalParSoFar,
      };
    });

    updateSession({
      ...session,
      players: updatedPlayers,
    });

    setShowHoleSpecModal(false);
    setShowSpecConfirmStep(false);
    setSpecSavedToast(crowdResult.message);
    setTimeout(() => {
      setSpecSavedToast(null);
    }, 4500);
  };

  return (
    <div className={`p-3 space-y-2.5 transition-colors ${sunlightMode ? 'bg-stone-950 text-white min-h-screen' : ''}`}>
      {/* 0. 상단 네비게이션 바: [ 🏠 홈으로 ] + [ ⚖️ 심판 모드 ] + [ ☀️ 햇빛모드 토글 ] */}
      <div className={`flex items-center justify-between p-2.5 rounded-2xl border transition ${
        sunlightMode
          ? 'bg-black text-white border-stone-800 shadow-md'
          : 'bg-white text-stone-900 border-stone-200 shadow-xs'
      }`}>
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          className={`flex items-center gap-1 text-xs font-black px-2.5 py-1.5 rounded-xl border transition active:scale-95 cursor-pointer ${
            sunlightMode
              ? 'bg-stone-900 text-amber-300 border-stone-700 hover:bg-stone-800'
              : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
          }`}
          title="안전하게 저장하고 홈 화면으로 나가기"
        >
          <span>🏠 홈으로</span>
        </button>

        <div className="text-center font-black text-xs truncate max-w-[140px]">
          <span className={sunlightMode ? 'text-stone-200' : 'text-stone-800'}>{course.name}</span>
          {isRefereeMode && (
            <div className="text-[10px] text-purple-400 font-extrabold flex items-center justify-center gap-0.5">
              <span>⚖️ 심판 전담 모드</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* 심판 모드 토글 */}
          <button
            type="button"
            onClick={() => setIsRefereeMode(!isRefereeMode)}
            className={`flex items-center gap-1 text-[11px] font-black px-2 py-1.5 rounded-xl border transition active:scale-95 cursor-pointer ${
              isRefereeMode
                ? 'bg-purple-600 text-white border-purple-400 shadow-sm ring-1 ring-purple-300'
                : sunlightMode
                ? 'bg-stone-900 text-stone-300 border-stone-700'
                : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
            }`}
            title="공식 시합용 홀 전담 심판 모드 활성화"
          >
            <span>⚖️</span>
            <span>{isRefereeMode ? '심판ON' : '심판'}</span>
          </button>

          {/* 햇빛모드 토글 */}
          <button
            type="button"
            onClick={toggleSunlightMode}
            className={`flex items-center gap-1 text-xs font-black px-2.5 py-1.5 rounded-xl border transition active:scale-95 cursor-pointer ${
              sunlightMode
                ? 'bg-yellow-400 text-stone-950 border-yellow-300 shadow-md'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
            title="대낮 직사광선 아래 선글라스를 껴도 선명한 야외 고대비 화면"
          >
            <span>{sunlightMode ? '☀️ 햇빛 ON' : '☀️ 햇빛'}</span>
          </button>
        </div>
      </div>

      {/* ⚖️ 공식 시합용 홀 전담 심판 모드 알림 배너 */}
      {isRefereeMode && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-white rounded-2xl p-2.5 shadow-md border-2 border-purple-400 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-base">⚖️</span>
            <div>
              <div className="text-xs font-black flex items-center gap-1.5">
                <span>공식 시합: 홀 전담 심판 모드</span>
                <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-1.5 py-0.2 rounded">
                  {courseLetter}-{holeInCourse}번 홀 담당
                </span>
              </div>
              <p className="text-[10.5px] text-purple-200 font-semibold">
                기록 확정 시 선수 스마트폰에 4인 타수 교차 확인 팝업이 전송됩니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowRefereeAssignModal(true)}
            className="bg-white/20 hover:bg-white/30 text-white text-[11px] font-black px-2.5 py-1.5 rounded-xl transition active:scale-95 shrink-0 border border-purple-300 cursor-pointer"
          >
            🔄 홀 위치 변경
          </button>
        </div>
      )}

      {/* 심판 교차 검증 알림 토스트 */}
      {crossCheckToast && (
        <div className="bg-purple-800 text-white text-xs font-black p-2.5 rounded-xl shadow-lg border border-purple-400 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span>⚖️</span>
            <span>{crossCheckToast}</span>
          </div>
          <button
            onClick={() => setCrossCheckToast(null)}
            className="text-purple-200 hover:text-white ml-2 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* [NEW] 가상 라운딩(체험/연습 모드) 전용 배너 - 시간 무제한 · 종료 시 기록 제로 */}
      {session.isVirtual && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-stone-950 p-3 rounded-2xl border-2 border-amber-300 shadow-md animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-stone-950 text-amber-300 flex items-center justify-center font-black text-xs shadow-xs">
                🎯
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs">프로그램 체험 연습 (가상 기록)</span>
                  <span className="text-[9px] bg-stone-950 text-amber-300 font-black px-1.5 py-0.2 rounded-full">
                    시간 무제한
                  </span>
                </div>
                <p className="text-[10px] text-stone-900 font-bold">
                  종료 시 기록이 전혀 남지 않는 연습용입니다. 마음껏 눌러보세요!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFinishRound}
              className="bg-stone-950 hover:bg-stone-900 text-amber-300 font-black text-[11px] px-2.5 py-1.5 rounded-xl transition active:scale-95 shrink-0 shadow-xs cursor-pointer"
            >
              연습 종료 ✕
            </button>
          </div>

          {/* Senior Tutorial Guide */}
          <div className="mt-2 pt-2 border-t border-amber-600/30 grid grid-cols-3 gap-1.5 text-[9.5px] font-bold text-stone-950">
            <div className="bg-white/80 rounded-lg p-1.5 text-center shadow-2xs">
              1. <span className="font-black text-emerald-900">[+/-] 타수</span> 조절
            </div>
            <div className="bg-white/80 rounded-lg p-1.5 text-center shadow-2xs">
              2. <span className="font-black text-rose-900">[+1 OB] 2벌타</span> 확인
            </div>
            <div className="bg-white/80 rounded-lg p-1.5 text-center shadow-2xs">
              3. <span className="font-black text-purple-900">[다음 홀▶]</span> 이동
            </div>
          </div>
        </div>
      )}

      {/* 클럽 모임/대회 연동 알림 배너 */}
      {session.clubRoomId && (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl p-2.5 shadow-sm border border-purple-400/50 flex items-center justify-between text-xs font-black">
          <div className="flex items-center gap-1.5">
            <span className="bg-amber-400 text-amber-950 px-2 py-0.5 rounded-lg text-[11px] font-black">
              🏆 {session.clubGroupNumber}조
            </span>
            <span className="text-purple-100">클럽 대회 동시 집계 중</span>
          </div>
          <Link
            href={`/club/${session.clubRoomId}`}
            className="bg-white/20 hover:bg-white/30 text-white text-[11px] px-2.5 py-1 rounded-xl transition active:scale-95 flex items-center gap-1"
          >
            <span>전체 랭킹 보기 ▶</span>
          </Link>
        </div>
      )}

      {/* Crowdsourced Spec Toast Banner */}
      {specSavedToast && (
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white text-xs font-black p-2.5 rounded-xl shadow-lg border border-emerald-400 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-yellow-300 shrink-0" />
            <span>{specSavedToast}</span>
          </div>
          <button
            onClick={() => setSpecSavedToast(null)}
            className="text-emerald-200 hover:text-white ml-2 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Offline Toast Banner */}
      {offlineToast && (
        <div className="bg-amber-600 text-white text-xs font-black p-2.5 rounded-xl shadow-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-yellow-200 shrink-0" />
            <span>{offlineToast}</span>
          </div>
          <button
            onClick={() => setOfflineToast(null)}
            className="text-amber-200 hover:text-white ml-2 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Share / Handoff Feedback Toast */}
      {shareFeedbackToast && (
        <div className="bg-[#FEE500] text-[#191919] border border-[#E6CF00] text-xs font-black p-2.5 rounded-xl shadow-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-base">💬</span>
            <span>{shareFeedbackToast}</span>
          </div>
          <button
            onClick={() => setShareFeedbackToast(null)}
            className="text-stone-600 hover:text-black ml-2 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⛳ [5대 마스터 아키텍처 1단계]: 티샷 전 [코스 안내 대형 전광판 & 제원 확인] */}
      {/* ========================================================================= */}
      {holeStep === 'TEE_SHOT' && (
        <div className="space-y-3 animate-fadeIn">
          {/* 1. 초대형 전광판 (홀 번호 A-3, Par, 거리m 고대비 표출) */}
          <div className={`rounded-3xl p-5 shadow-xl text-center border-2 transition ${
            sunlightMode
              ? 'bg-black text-white border-yellow-400'
              : 'bg-gradient-to-b from-emerald-950 via-emerald-900 to-teal-950 text-white border-emerald-500/60'
          }`}>
            <div className="flex items-center justify-between text-xs font-black pb-2.5 border-b border-white/20">
              <span className={sunlightMode ? 'text-yellow-300' : 'text-emerald-300'}>
                {course.name} ({currentHole}/{session.isUnlimitedRound ? '자유' : `${session.totalHoles}홀`})
              </span>
              <span className="bg-yellow-400 text-stone-950 px-2.5 py-0.5 rounded-full text-[11px] font-black shadow-xs">
                ⛳ 1단계: 티샷 전 안내판
              </span>
            </div>

            {/* 초대형 홀 번호 표출 */}
            <div className="py-4">
              <div className="text-xs font-extrabold tracking-wider text-emerald-200/90 mb-1">
                {currentRoundNumber > 1 ? `[${currentRoundNumber}회차 순환 플레이]` : '현재 공략 홀'}
              </div>
              <div className={`text-6xl font-black tracking-tight ${
                sunlightMode ? 'text-yellow-300' : 'text-yellow-300 drop-shadow-md'
              }`}>
                {courseLetter}-{holeInCourse}
                <span className="text-2xl font-bold ml-1.5 text-white">번 홀</span>
              </div>
            </div>

            {/* 초대형 Par & 거리m 제원 카드 */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/20">
              <div className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center ${
                sunlightMode ? 'bg-zinc-900 border-yellow-400' : 'bg-black/35 border-emerald-400/40 shadow-inner'
              }`}>
                <span className="text-[11px] font-bold text-stone-300 mb-0.5">기준 타수</span>
                <span className={`text-4xl font-black ${
                  sunlightMode ? 'text-yellow-300' : 'text-yellow-400'
                }`}>
                  Par {holeMetadata.par}
                </span>
              </div>

              <div className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center ${
                sunlightMode ? 'bg-zinc-900 border-yellow-400' : 'bg-black/35 border-emerald-400/40 shadow-inner'
              }`}>
                <span className="text-[11px] font-bold text-stone-300 mb-0.5">공식 거리</span>
                <span className="text-4xl font-black text-white">
                  {holeMetadata.distanceMeter}<span className="text-2xl font-bold ml-0.5">m</span>
                </span>
              </div>
            </div>

            {/* 제원 수정 버튼 & 카운트 모드 미니 토글 */}
            <div className="flex items-center justify-between pt-3.5 mt-1 text-xs">
              <button
                type="button"
                onClick={openHoleSpecModal}
                className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 hover:text-white px-3 py-1.5 rounded-xl border border-emerald-500 font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                title="현장 팻말과 다를 경우 수정"
              >
                <Pencil className="w-3.5 h-3.5 text-yellow-300" />
                <span>✏️ 현장 제원 수정</span>
              </button>

              {/* 카운트 방식 미니 토글 (localStorage 영구 연동) */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/20">
                <span className="text-[10px] text-stone-300 font-bold px-1">카운트:</span>
                <button
                  type="button"
                  onClick={toggleCountingMode}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition cursor-pointer ${
                    countingMode === 'ZERO_BASE'
                      ? 'bg-yellow-400 text-stone-950 font-black shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  0베이스
                </button>
                <button
                  type="button"
                  onClick={toggleCountingMode}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition cursor-pointer ${
                    countingMode === 'PAR_BASE'
                      ? 'bg-yellow-400 text-stone-950 font-black shadow-xs'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Par기준
                </button>
              </div>
            </div>
          </div>

          {/* 2. 상단 로컬룰 주의 띠 & 1위 베스트 공략 */}
          <LocalRuleBanner hole={actualHoleNumber} localRule={holeMetadata.localRule} />
          <TipCard hole={actualHoleNumber} tip={holeMetadata.tip} />

          {/* 3. [점수판 없이] 단일 대형 버튼: [ 🏌️ 확인 완료 (티샷 시작) ] */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                setHoleStep('SCORING');
                if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                  try { navigator.vibrate?.(50); } catch (e) {}
                }
              }}
              className={`w-full h-16 rounded-2xl font-black text-lg sm:text-xl shadow-xl border-2 transition flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer ${
                sunlightMode
                  ? 'bg-yellow-400 text-black border-white ring-4 ring-yellow-400/40 hover:bg-yellow-300'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white border-emerald-400 ring-4 ring-emerald-500/20 hover:from-emerald-500 hover:to-teal-500'
              }`}
            >
              <span className="text-2xl">🏌️</span>
              <span>확인 완료 (티샷 시작)</span>
              <ChevronRight className="w-6 h-6 ml-1" />
            </button>

            {/* 4. 하단 보조 버튼: [ 🔄 다른 홀로 이동 ] [ ☕ 잠시 빠지기 (저장) ] */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={openCoursePicker}
                className={`py-3 px-2 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition border active:scale-95 cursor-pointer ${
                  sunlightMode
                    ? 'bg-zinc-900 text-yellow-300 border-zinc-700 hover:bg-zinc-800'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50 shadow-2xs'
                }`}
              >
                <span>🔄</span>
                <span>다른 홀로 이동 (밀림 시)</span>
              </button>

              <button
                type="button"
                onClick={handlePauseAndGoHome}
                className={`py-3 px-2 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition border active:scale-95 cursor-pointer ${
                  sunlightMode
                    ? 'bg-zinc-900 text-amber-300 border-zinc-700 hover:bg-zinc-800'
                    : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50 shadow-2xs'
                }`}
              >
                <span>☕</span>
                <span>잠시 빠지기 (안전 저장)</span>
              </button>
            </div>

            {/* 상시 스코어보드 보기 버튼 (1단계에서도 조회 가능) */}
            <button
              type="button"
              onClick={() => setShowTotalScoreModal(true)}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition border active:scale-95 cursor-pointer ${
                sunlightMode
                  ? 'bg-black text-stone-300 border-stone-800 hover:text-white'
                  : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              <span>현재 스코어보드판 보기 ({confirmedHoles.length}홀 누적 현황)</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏌️ [5대 마스터 아키텍처 2단계]: 경기 진행 및 홀아웃 후 [4인 스코어 기입창] */}
      {/* ========================================================================= */}
      {holeStep === 'SCORING' && (
        <div className="space-y-2.5 animate-fadeIn">
          {/* 상단 미니 바: [ ◀ 코스 제원 다시보기 ] + 홀 정보 + 카운트 방식 표시 */}
          <div className={`flex items-center justify-between p-2.5 rounded-2xl border transition ${
            sunlightMode
              ? 'bg-black text-white border-yellow-400 shadow-md'
              : 'bg-gradient-to-r from-emerald-900 to-teal-900 text-white border-emerald-600 shadow-xs'
          }`}>
            <button
              type="button"
              onClick={() => setHoleStep('TEE_SHOT')}
              className="bg-white/20 hover:bg-white/30 text-white text-[11px] font-black px-2.5 py-1 rounded-lg transition active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>코스 제원</span>
            </button>

            <div className="text-center">
              <span className="font-black text-sm text-yellow-300">
                {courseLetter}-{holeInCourse}번 홀
              </span>
              <span className="text-[11px] text-stone-200 font-bold ml-1.5">
                Par {holeMetadata.par} · {holeMetadata.distanceMeter}m
              </span>
            </div>

            <button
              type="button"
              onClick={toggleCountingMode}
              className="text-[10px] font-black px-2 py-0.5 rounded-md bg-yellow-400 text-stone-950 shadow-xs shrink-0 cursor-pointer"
              title="0베이스 vs Par기준 카운트 방식 전환"
            >
              {countingMode === 'ZERO_BASE' ? '0베이스' : 'Par기준'}
            </button>
          </div>

          {/* 실시간 안심 저장 & 스코어보드 조회 버튼 */}
          <div className="flex items-center justify-between text-[11px] font-bold px-1 text-stone-700">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>실시간 안심 저장</span>
                {wakeLockActive && <span className="text-yellow-600 text-[10px] ml-0.5" title="화면 켜짐 유지중">🔆</span>}
              </span>
            ) : (
              <span
                className="flex items-center gap-1 text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 font-black animate-pulse"
                title="강변 음영 지역입니다. 로컬 저장소에 100% 안전 보관 중입니다."
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                <span>오프라인 보관 중</span>
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setModalActiveTab('INTEGRATED');
                  setShowTotalScoreModal(true);
                }}
                className="bg-stone-900 hover:bg-stone-800 text-amber-300 px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer border border-stone-700"
              >
                <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                <span>총 {confirmedHoles.length}홀 누적 현황</span>
              </button>
            </div>
          </div>

          {/* 4인 스코어 기입 그리드 */}
          <div className="space-y-2 pt-0.5">
            {/* 플레이어 목록 안내 및 조장/동반자 설정 버튼 */}
            <div className="flex items-center justify-between px-1 py-0.5 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`font-black ${sunlightMode ? 'text-yellow-300' : 'text-stone-800'}`}>
                  플레이어 ({session.players.filter((p) => !p.isOut).length}명 참여
                  {restingPlayerIds.length > 0 && (
                    <span className="text-amber-600 font-bold"> · {restingPlayerIds.length}명 휴식</span>
                  )})
                </span>
                <span className={`text-[11px] ${sunlightMode ? 'text-stone-400' : 'text-stone-500'} font-medium`}>
                  · 1번 👑조장 / 2~{session.players.filter((p) => !p.isOut).length}번 가나다순
                </span>
              </div>
              <button
                type="button"
                onClick={openPlayerEditModal}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold active:scale-95 transition shadow-2xs ${
                  sunlightMode
                    ? 'bg-stone-900 border-yellow-400/60 text-yellow-300 hover:bg-stone-800'
                    : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50 hover:border-stone-400'
                }`}
              >
                <span>👑</span>
                <span>조장·동반자 관리</span>
              </button>
            </div>

            {session.players.map((player, idx) => {
              const strokes = player.scores[actualHoleNumber] ?? currentPar;
              const obCount = player.obCount[actualHoleNumber] ?? 0;
              const isResting = restingPlayerIds.includes(player.id);

              // Cumulative strokes for this player based only on confirmed holes
              const pConfirmedHoles = getPlayerConfirmedHoles(player);
              const pTotalStrokes = pConfirmedHoles.reduce((sum, hNum) => sum + (player.scores[hNum] || 0), 0);
              const pTotalPar = pConfirmedHoles.reduce((sum, hNum) => {
                const meta = course.holesMetadata?.find((m) => Number(m.hole) === Number(hNum));
                return sum + Number(meta?.par || 3);
              }, 0);
              const pTotalDiff = pTotalStrokes - pTotalPar;

              // 🚪 중도 퇴장(기권) 선수 카드
              if (player.isOut) {
                const displayName = player.name || (player.isSelf ? getDefaultSelfName() : '선수');
                return (
                  <div
                    key={player.id}
                    className={`rounded-xl p-3 border transition ${
                      sunlightMode
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        : 'bg-stone-50/90 border-stone-200 text-stone-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 font-black">
                          🚪 중도퇴장
                        </span>
                        <span className="font-extrabold text-stone-800 line-through text-sm">
                          {displayName}
                        </span>
                        {player.isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-blue-100 text-blue-700">
                            본인
                          </span>
                        )}
                        <span className="text-[11px] text-stone-600 font-medium">
                          ({player.departedHole || pConfirmedHoles.length}홀까지 참여)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-stone-700 bg-stone-200/80 px-2 py-1 rounded-lg">
                          기록 보존: {pConfirmedHoles.length}홀 {pTotalStrokes}타
                        </span>
                        <button
                          type="button"
                          onClick={openPlayerEditModal}
                          className="text-xs text-stone-500 hover:text-emerald-700 underline font-bold px-1 py-0.5 cursor-pointer"
                        >
                          변경
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // ☕ 잠시 빠짐 (휴식 중) 선수 카드
              if (isResting) {
                return (
                  <div
                    key={player.id}
                    className={`rounded-xl p-3 border-2 transition ${
                      sunlightMode
                        ? 'bg-zinc-900 border-amber-400 text-white'
                        : 'bg-amber-50/90 border-amber-300 text-amber-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-amber-400 text-stone-950 font-black">
                          ☕ 잠시 빠짐 (휴식 중)
                        </span>
                        <span className="font-black text-base">{player.name}</span>
                        {player.isSelf && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-100 text-blue-800">
                            본인
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePlayerRest(player.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        🏌️ 다시 참여하기
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-800 font-bold mt-1.5">
                      * 이번 홀은 잠시 휴식(결번) 처리되며, 기존 홀 타수는 스코어카드에 안전 보존됩니다.
                    </p>
                  </div>
                );
              }

              // 정상 참여 선수 카드
              return (
                <div
                  key={player.id}
                  className={
                    sunlightMode
                      ? 'bg-black rounded-xl p-3 border-2 border-yellow-400 shadow-lg relative overflow-hidden text-white'
                      : 'bg-white rounded-xl p-3 border border-stone-200 shadow-sm relative overflow-hidden'
                  }
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`rounded-full flex items-center justify-center font-black ${
                          sunlightMode
                            ? 'w-6 h-6 bg-yellow-400 text-black text-xs'
                            : 'w-5 h-5 bg-stone-200 text-stone-800 text-[11px]'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      {player.isLeader && (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-black shadow-2xs ${
                            sunlightMode
                              ? 'bg-yellow-400 text-black border border-white'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white'
                          }`}
                        >
                          <span>👑</span>
                          <span>조장</span>
                        </span>
                      )}

                      <span
                        className={`font-black ${
                          sunlightMode ? 'text-lg text-yellow-300' : 'text-base text-stone-900'
                        }`}
                      >
                        {player.name}
                      </span>

                      {player.isSelf && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            sunlightMode
                              ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          본인
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* ☕ 휴식 토글 버튼 */}
                      <button
                        type="button"
                        onClick={() => togglePlayerRest(player.id)}
                        className={`text-[10.5px] font-extrabold px-2 py-1 rounded-lg border transition active:scale-95 cursor-pointer ${
                          sunlightMode
                            ? 'bg-zinc-900 text-stone-300 border-zinc-700 hover:text-white'
                            : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                        }`}
                        title="이번 홀 잠시 빠지기 (휴식 결번 처리)"
                      >
                        ☕ 휴식
                      </button>

                      {/* 단독 누적 타수 배지 버튼 */}
                      <button
                        type="button"
                        onClick={() => setShowTotalScoreModal(true)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-black text-xs active:scale-95 transition shadow-sm cursor-pointer border ${
                          sunlightMode
                            ? 'bg-yellow-400 text-black border-2 border-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                        }`}
                        title="터치하여 홀별/코스별 총 누적 스코어 상세 보기"
                      >
                        {pConfirmedHoles.length === 0 ? (
                          <span className={sunlightMode ? 'text-xs font-black text-black' : 'text-xs font-black text-emerald-100'}>
                            총 0타
                          </span>
                        ) : (
                          <>
                            <span className={sunlightMode ? 'text-base font-black text-black' : 'text-sm font-black'}>
                              {pTotalStrokes}타
                            </span>
                            <span
                              className={
                                sunlightMode
                                  ? 'text-[10px] bg-black text-yellow-300 px-1 py-0.5 rounded font-black border border-yellow-400'
                                  : 'text-[9px] bg-emerald-800 text-yellow-300 px-1 py-0.5 rounded font-black'
                              }
                            >
                              {pTotalDiff === 0 ? 'E' : pTotalDiff > 0 ? `+${pTotalDiff}` : `${pTotalDiff}`}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Stroke Control Buttons (0베이스 vs Par기준 연동) */}
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => changeStroke(player.id, -1)}
                      className={`h-13 rounded-xl text-3xl font-black flex items-center justify-center active:scale-95 transition border-2 cursor-pointer ${
                        sunlightMode
                          ? 'bg-zinc-900 text-yellow-300 border-yellow-400 active:bg-zinc-800 shadow-md'
                          : 'bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 border-stone-200'
                      }`}
                    >
                      -
                    </button>

                    {/* Main Stroke Display */}
                    <button
                      type="button"
                      onClick={() => resetToPar(player.id)}
                      className={`h-13 rounded-xl flex flex-col items-center justify-center active:scale-95 transition border-2 cursor-pointer ${
                        sunlightMode
                          ? 'bg-yellow-400 border-white text-black shadow-md'
                          : 'bg-emerald-50 border-emerald-500'
                      }`}
                      title="누르면 기준타수(Par)로 초기화"
                    >
                      {countingMode === 'PAR_BASE' ? (
                        <>
                          <span className={`text-2xl font-black leading-none ${
                            sunlightMode ? 'text-black' : 'text-emerald-950'
                          }`}>
                            {strokes === currentPar ? 'E' : strokes > currentPar ? `+${strokes - currentPar}` : `${strokes - currentPar}`}
                          </span>
                          <span className={`text-[10px] font-extrabold mt-0.5 ${
                            sunlightMode ? 'text-black' : 'text-emerald-700'
                          }`}>
                            ({strokes}타 · Par {currentPar})
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={`text-3xl font-black leading-none ${
                            sunlightMode ? 'text-black' : 'text-emerald-900'
                          }`}>
                            {strokes}
                          </span>
                          <span className={`text-[10px] font-black mt-0.5 ${
                            sunlightMode ? 'text-black' : 'text-emerald-700'
                          }`}>
                            {strokes === currentPar ? '파(Par)' : '타수 (리셋)'}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => changeStroke(player.id, 1)}
                      className={`h-13 rounded-xl text-3xl font-black flex items-center justify-center shadow-md active:scale-95 transition border-2 cursor-pointer ${
                        sunlightMode
                          ? 'bg-yellow-400 text-black border-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border-transparent'
                      }`}
                    >
                      +
                    </button>

                    {/* One-touch OB +2 Button */}
                    <button
                      type="button"
                      onClick={() => handleOB(player.id)}
                      className={`h-13 rounded-xl flex flex-col items-center justify-center border-2 active:scale-95 transition shadow-md cursor-pointer ${
                        sunlightMode
                          ? obCount > 0
                            ? 'bg-red-600 border-yellow-400 text-white'
                            : 'bg-black border-red-500 text-red-400'
                          : obCount > 0
                          ? 'bg-rose-100 border-rose-500 text-rose-900'
                          : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-800'
                      }`}
                    >
                      <span className="text-xs font-black leading-tight">OB</span>
                      <span className="text-xs font-black leading-tight">
                        +2타{obCount > 0 && <span className={`text-[10px] ml-0.5 font-black ${sunlightMode ? 'text-yellow-300' : 'text-rose-600'}`}>({obCount})</span>}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 잔디 체감 상태 입력 바 */}
          <div
            className={`rounded-2xl p-2.5 flex items-center justify-between shadow-xs border ${
              sunlightMode
                ? 'bg-zinc-900 border-yellow-400 text-white'
                : 'bg-emerald-50/90 border-emerald-300/80'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="text-base shrink-0">🌱</span>
              <div className="min-w-0">
                <div className={`text-xs font-black truncate ${sunlightMode ? 'text-yellow-300' : 'text-emerald-950'}`}>
                  {session?.isVirtual ? '홀 잔디 상태 제보 (가상 모드)' : '홀 잔디 체감 상태는 어떠신가요?'}
                </div>
                <div className={`text-[10px] font-semibold truncate ${session?.isVirtual ? 'text-amber-700 font-bold' : sunlightMode ? 'text-zinc-300' : 'text-emerald-700'}`}>
                  {session?.isVirtual ? '가상 상태에서는 실제 제보가 제한됩니다' : '구름성·습도 1초 터치 시 실시간 리포트에 즉시 반영'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (session?.isVirtual) {
                  alert('가상 상태에서는 작동이 안 됩니다.');
                  return;
                }
                setShowConditionModal(true);
              }}
              className={`shrink-0 px-3 py-1.5 font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1 border ${
                session?.isVirtual
                  ? 'bg-stone-200 text-stone-600 border-stone-300 hover:bg-stone-300'
                  : sunlightMode
                  ? 'bg-yellow-400 text-black border-white'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-600'
              }`}
              title={session?.isVirtual ? '가상 상태에서는 작동이 안 됩니다' : '잔디 1초 입력'}
            >
              <span>{session?.isVirtual ? '가상 모드 (제보 불가)' : '잔디 1초 입력 ✍️'}</span>
            </button>
          </div>

          {/* [5대 마스터 아키텍처 3]: 실시간 스코어보드판 보기 상시 고정 버튼 */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowTotalScoreModal(true)}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md border-2 transition active:scale-[0.99] cursor-pointer ${
                sunlightMode
                  ? 'bg-black text-yellow-300 border-yellow-400 hover:bg-zinc-900'
                  : 'bg-stone-900 hover:bg-stone-800 text-amber-300 border-stone-700'
              }`}
            >
              <BarChart2 className="w-5 h-5 text-amber-400" />
              <span>📋 현재 실시간 스코어보드판 보기 ({confirmedHoles.length}홀 누적 현황)</span>
            </button>
          </div>

          {/* [5대 마스터 아키텍처 2]: 하단 메인 액션 버튼 (홀아웃 완료 ➔ 다음 홀 1단계 전광판 자동 전환) */}
          <div className="space-y-2 pt-0.5">
            {isRefereeMode ? (
              <button
                type="button"
                onClick={handleNextHole}
                className={`w-full h-15 rounded-2xl font-black text-base sm:text-lg shadow-xl border-2 transition flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer ${
                  sunlightMode
                    ? 'bg-purple-600 text-white border-white ring-4 ring-purple-400/40 hover:bg-purple-500'
                    : 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-700 text-white border-purple-400 shadow-purple-900/30'
                }`}
              >
                <span>✍️</span>
                <span>공식 기록 확정 (선수 확인 요청)</span>
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextHole}
                className={`w-full h-15 rounded-2xl font-black text-base sm:text-lg shadow-xl border-2 transition flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer ${
                  sunlightMode
                    ? 'bg-yellow-400 text-black border-white ring-4 ring-yellow-400/40 hover:bg-yellow-300'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/30'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>홀아웃 완료 (다음 홀 이동)</span>
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            )}

            {/* 하단 보조 액션 링크들 */}
            <div className="flex items-center justify-between px-1 text-xs pt-1">
              <button
                type="button"
                onClick={handlePrevHole}
                disabled={currentHole === 1}
                className={`font-bold flex items-center gap-0.5 cursor-pointer ${
                  currentHole === 1
                    ? 'text-stone-400 cursor-not-allowed'
                    : sunlightMode
                    ? 'text-yellow-300 hover:underline'
                    : 'text-stone-700 hover:text-stone-950'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>이전 홀 보기</span>
              </button>

              <button
                type="button"
                onClick={openCoursePicker}
                className={`font-extrabold flex items-center gap-1 cursor-pointer ${
                  sunlightMode ? 'text-yellow-400 hover:underline' : 'text-emerald-800 hover:underline'
                }`}
              >
                <span>🔄 다른 코스/홀 이동</span>
              </button>

              <button
                type="button"
                onClick={handlePauseAndGoHome}
                className={`font-bold cursor-pointer hover:underline ${
                  sunlightMode ? 'text-zinc-300 hover:text-white' : 'text-amber-900 hover:text-amber-950'
                }`}
              >
                ☕ 잠시 빠지기
              </button>

              <button
                type="button"
                onClick={handleEarlyFinishConfirm}
                className={`font-bold underline cursor-pointer ${
                  sunlightMode ? 'text-zinc-300 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                경기 종료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Course & Hole Picker Modal ("어느 코스로 이동하시겠습니까?") */}
      {showCoursePicker && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3.5 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-2xl space-y-3.5 animate-scaleUp max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 shrink-0">
              <div>
                <h3 className="text-lg font-black text-stone-900">
                  어느 코스를 선택하시겠습니까?
                </h3>
                <p className="text-[11px] text-stone-600 font-semibold mt-0.5">
                  이동할 코스와 홀 번호를 선택하세요
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCoursePicker(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-0.5">
              {/* Step 1: 코스 선택 (A, B, C, D, E, F, G...) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black text-stone-800">
                  <span>1. 이동할 코스 선택</span>
                  <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                    {pickerCourseLetter}코스 선택됨
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {allAvailableLetters.map((letter) => {
                    const isSelected = pickerCourseLetter === letter;
                    const isCurrent = courseLetter === letter;

                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => setPickerCourseLetter(letter)}
                        className={`py-2 px-1 rounded-xl border-2 font-black text-sm transition flex items-center justify-center gap-0.5 active:scale-95 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-1 ring-emerald-400'
                            : isCurrent
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <span className="whitespace-nowrap">{letter}코스</span>
                        {isSelected && <span className="text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 1-1: 회차 선택 (해당 코스를 이미 진행한 이력이 있는 경우) */}
              {(() => {
                const existingRoundsForPicker = Array.from(
                  new Set(
                    confirmedHoles
                      .filter((h) => getHoleInfo(h).cLetter === pickerCourseLetter)
                      .map((h) => getHoleInfo(h).round)
                  )
                );
                const nextRoundForPicker = existingRoundsForPicker.length > 0 ? Math.max(...existingRoundsForPicker) + 1 : 1;

                if (existingRoundsForPicker.length === 0) return null;

                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-black text-amber-900">
                      <span>🔄 {pickerCourseLetter}코스 진행 회차 선택</span>
                      <span className="text-[10px] text-amber-700 font-bold">이전 기록 보존 지원</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPickerRoundNumber(1)}
                        className={`py-2 px-2 rounded-lg font-black text-xs transition border-2 ${
                          pickerRoundNumber === 1
                            ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        1회차 (기존 기록)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickerRoundNumber(nextRoundForPicker)}
                        className={`py-2 px-2 rounded-lg font-black text-xs transition border-2 ${
                          pickerRoundNumber === nextRoundForPicker
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-1 ring-emerald-400'
                            : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        {nextRoundForPicker}회차 (새로 시작 ✨)
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Step 2: 홀 번호 선택 (1~9번 홀 3x3 칩) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black text-stone-800">
                  <span>2. 몇 번 홀로 이동하시겠습니까?</span>
                  <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                    {pickerHoleNumber}번 홀 선택됨
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hNum) => {
                    const isSelected = pickerHoleNumber === hNum;
                    return (
                      <button
                        key={hNum}
                        type="button"
                        onClick={() => setPickerHoleNumber(hNum)}
                        className={`h-9 rounded-xl font-black text-sm transition flex items-center justify-center border-2 active:scale-95 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-1 ring-emerald-400'
                            : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <span>{hNum}번 홀</span>
                        {isSelected && <span className="text-xs ml-0.5">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Buttons: 이동 실행 탭 + 종료 + 취소 */}
            <div className="pt-2 border-t border-stone-100 space-y-1.5 shrink-0">
              {/* 상단 이동 실행 탭 */}
              <button
                type="button"
                onClick={() => handleSwitchCourse(pickerCourseLetter, pickerHoleNumber, pickerRoundNumber)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-base shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] border-2 border-emerald-400"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  ⛳ {pickerCourseLetter}코스 {pickerHoleNumber}번 홀 {pickerRoundNumber > 1 ? `(${pickerRoundNumber}회차) ` : ''}이동하기
                </span>
              </button>

              <button
                type="button"
                onClick={handleFinishRound}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-black py-2.5 rounded-xl text-xs shadow flex items-center justify-center gap-1.5 transition"
              >
                <Award className="w-4 h-4" />
                <span>🏆 여기서 라운드 완전 종료 (성적표 보기)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCoursePicker(false)}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs"
              >
                취소하고 현재 홀 계속 치기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Hole Par & Distance Crowdsourcing Modal (2-Strike 시스템 & 팻말 확인 필수) */}
      {showHoleSpecModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-4 space-y-3.5 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col animate-slideUp">
            {!showSpecConfirmStep ? (
              <>
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-black">
                      ⛳
                    </div>
                    <div>
                      <h3 className="font-black text-stone-900 text-base flex items-center gap-1.5">
                        <span>{courseLetter}-{holeInCourse}번 홀 현장 제원 수정</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">
                          2-Strike 검증
                        </span>
                      </h3>
                      <p className="text-[11px] text-stone-500 font-medium">
                        {course.name} ({actualHoleNumber}번째 홀)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHoleSpecModal(false)}
                    className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center font-bold"
                  >
                    ✕
                  </button>
                </div>

                {/* [5대 마스터 아키텍처 4]: 상단 고대비 팻말 일치 경고 배너 */}
                <div className="bg-rose-600 text-white p-3 rounded-2xl font-black text-xs space-y-1 shadow-md border-2 border-yellow-300">
                  <div className="flex items-center gap-1.5 text-sm text-yellow-300">
                    <span>⚠️</span>
                    <span>[필수 원칙] 현장 팻말 일치 확인</span>
                  </div>
                  <p className="text-white text-[11px] leading-snug">
                    반드시 티박스 공식 안내판(팻말)에 적힌 숫자와 완벽히 일치하게 입력해 주십시오. (미검증 허위 수정은 48시간 후 자동 폐기됩니다)
                  </p>
                </div>

                {/* Par Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-stone-700 flex items-center justify-between">
                    <span>1. 기준 타수 (Par) 선택</span>
                    <span className="text-emerald-700 font-bold text-[11px]">현재 선택: Par {editingPar}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[3, 4, 5].map((p) => {
                      const isSelected = Number(editingPar) === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setEditingPar(p)}
                          className={`h-12 rounded-xl font-black text-base transition flex items-center justify-center gap-1 border-2 active:scale-95 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          <span>Par {p}</span>
                          {isSelected && <span className="text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Distance Adjustment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-stone-700 flex items-center justify-between">
                    <span>2. 홀 거리 (m) 설정</span>
                    <span className="text-emerald-700 font-bold text-[11px]">현재 설정: {editingDistance}m</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={10}
                      max={300}
                      step={1}
                      value={editingDistance}
                      onChange={(e) => setEditingDistance(Number(e.target.value) || 0)}
                      className="flex-1 h-12 text-center text-xl font-black rounded-xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none bg-stone-50 text-stone-800"
                    />
                    <span className="text-stone-600 font-black text-base pr-1">m</span>
                  </div>

                  {/* Quick Stepper Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[-10, -5, +5, +10].map((delta) => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => setEditingDistance((prev) => Math.max(10, Math.min(300, prev + delta)))}
                        className="h-9 rounded-lg bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-black text-xs border border-stone-300 flex items-center justify-center"
                      >
                        {delta > 0 ? `+${delta}m` : `${delta}m`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* [5대 마스터 아키텍처 4]: 현장 안내판(팻말) 확인 필수 체크박스 */}
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border-2 border-amber-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={signboardChecked}
                    onChange={(e) => setSignboardChecked(e.target.checked)}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer shrink-0"
                  />
                  <span className="text-xs font-black text-stone-900">
                    ☑️ 현장 안내판(팻말)을 확인했습니다 (필수)
                  </span>
                </label>

                {/* Modal Actions: 확인 단계로 이동 */}
                <div className="pt-1 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (!signboardChecked) {
                        alert('현장 안내판(팻말) 확인 체크박스에 체크해 주셔야 저장 단계로 진행하실 수 있습니다.');
                        return;
                      }
                      setShowSpecConfirmStep(true);
                    }}
                    disabled={!signboardChecked}
                    className={`w-full font-black py-3.5 rounded-xl text-base shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] border ${
                      signboardChecked
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 cursor-pointer'
                        : 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>입력 내용 확인 단계로 이동 (Par {editingPar}, {editingDistance}m)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHoleSpecModal(false)}
                    className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold rounded-xl text-xs"
                  >
                    취소
                  </button>
                </div>
              </>
            ) : (
              /* Step 2: 2단계 안전 확인 팝업 (2-Strike 시스템) */
              <div className="space-y-3.5 py-1 animate-fadeIn">
                <div className="text-center space-y-1 border-b pb-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-2xl mx-auto shadow-xs">
                    ⚠️
                  </div>
                  <h3 className="text-lg font-black text-stone-900">
                    다시 한번 확인하십시오
                  </h3>
                  <p className="text-xs text-stone-600 font-medium">
                    혹시 잘못 입력하거나 장난에 의한 수정을 방지하기 위해 최종 확인합니다.
                  </p>
                </div>

                {/* 비교 확인 박스 */}
                <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                    <span className="font-bold text-stone-600">대상 구장 및 홀</span>
                    <span className="font-black text-stone-900">{course.name} {courseLetter}-{holeInCourse}번 홀</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                    <span className="font-bold text-stone-600">기준 타수 (Par)</span>
                    <div className="flex items-center gap-2 font-black">
                      <span className="text-stone-400 line-through">Par {holeMetadata.par}</span>
                      <span className="text-emerald-700 text-sm">➔ Par {editingPar}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                    <span className="font-bold text-stone-600">홀 거리 (m)</span>
                    <div className="flex items-center gap-2 font-black">
                      <span className="text-stone-400 line-through">{holeMetadata.distanceMeter}m</span>
                      <span className="text-emerald-700 text-sm">➔ {editingDistance}m</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-2.5 text-[11px] text-emerald-900 leading-snug border border-emerald-200">
                    <p className="font-extrabold text-emerald-950">
                      💡 2-Strike 집단지성 승격 안내
                    </p>
                    <p className="text-emerald-800 mt-0.5">
                      • <strong>본인 팀</strong>: 수정 즉시 바뀐 제원으로 적용됩니다.<br />
                      • <strong>2개 팀 이상 동일 수정</strong> 시 전국 공식 구장 제원으로 자동 영구 승격됩니다. (미검증 수정은 48시간 후 자동 폐기)
                    </p>
                  </div>
                </div>

                {/* 최종 확인 버튼 그룹 */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveHoleSpec(editingPar, editingDistance, false)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-xl text-base shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] border border-emerald-400 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>맞습니다! 본인 팀 제원 즉시 적용</span>
                  </button>

                  {/* 2-Strike 공식 승격 버튼 */}
                  <button
                    type="button"
                    onClick={() => handleSaveHoleSpec(editingPar, editingDistance, true)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                    title="2개 팀 일치 확인으로 전국 공식 DB에 즉시 영구 승격"
                  >
                    <span>👍 앞 팀 수정 내용 맞음 (2-Strike 즉시 공식 승격)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSpecConfirmStep(false)}
                    className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold rounded-xl text-xs"
                  >
                    ← 내용 다시 수정하기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* [5대 마스터 아키텍처 1]: 목표 홀 도달 시 심플 2가지 선택 모달 */}
      {showTargetHoleReachedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border-2 border-amber-400 overflow-hidden flex flex-col p-5 space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-black text-2xl mx-auto shadow-lg">
              🎯
            </div>

            <div className="text-center space-y-1">
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full">
                목표 홀 도달
              </span>
              <h3 className="text-xl font-black text-stone-900">
                목표 {session.targetHolesCount || session.totalHoles}홀 완주!
              </h3>
              <p className="text-xs text-stone-600 font-semibold leading-relaxed pt-1">
                축하합니다! 설정하신 목표 홀을 모두 마쳤습니다.<br />
                계속해서 더 치시겠습니까, 아니면 오늘 경기를 종료하시겠습니까?
              </p>
            </div>

            {/* 심플 딱 2가지 선택 버튼 */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleExtendNext9Holes}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 px-4 rounded-2xl text-base flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98] border border-emerald-400 cursor-pointer"
              >
                <span>⛳ 계속 이어서 더 치기 (+9홀 순환 연장)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowTargetHoleReachedModal(false);
                  handleFinishRound();
                }}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-black py-3.5 px-4 rounded-2xl text-sm flex items-center justify-center gap-1.5 transition active:scale-[0.98] border border-stone-300 cursor-pointer"
              >
                <span>🏁 여기서 경기 종료하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* [5대 마스터 아키텍처 5]: 공식 시합용 '홀 전담 심판 모드' 2인 교차 확인 팝업 */}
      {showPlayerCrossCheckModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border-2 border-purple-500 overflow-hidden flex flex-col p-5 space-y-4 animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg">
              ⚖️
            </div>

            <div className="text-center space-y-1">
              <span className="text-[10px] bg-purple-100 text-purple-800 font-extrabold px-2.5 py-0.5 rounded-full">
                공식 시합 기록 교차 검증
              </span>
              <h3 className="text-lg font-black text-stone-900">
                {courseLetter}-{holeInCourse}번 홀 심판 타수 확인
              </h3>
              <p className="text-xs text-stone-600 font-medium pt-0.5">
                홀 전담 심판이 기록한 조원 타수가 맞는지 확인해 주십시오.<br />
                선수 1명 이상 승인 시 양쪽 모두 다음 홀로 이동합니다.
              </p>
            </div>

            {/* 선수별 타수 확인 표 */}
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 space-y-2 text-xs">
              <div className="grid grid-cols-4 font-black text-stone-500 text-[11px] pb-1 border-b border-stone-200 text-center">
                <span className="text-left pl-1">선수</span>
                <span>타수</span>
                <span>OB</span>
                <span>판정</span>
              </div>
              {session.players.filter((p) => !p.isOut).map((p) => {
                const s = p.scores[actualHoleNumber] ?? currentPar;
                const ob = p.obCount[actualHoleNumber] ?? 0;
                const isRest = restingPlayerIds.includes(p.id);
                return (
                  <div key={p.id} className="grid grid-cols-4 items-center text-center py-1 border-b border-stone-100 text-stone-900 font-extrabold">
                    <span className="text-left pl-1 truncate">{p.name}</span>
                    <span className="text-emerald-700 font-black text-sm">{isRest ? '휴식' : `${s}타`}</span>
                    <span className="text-rose-600 font-bold">{isRest ? '-' : `${ob}회`}</span>
                    <span className="text-xs font-black text-emerald-800">정상</span>
                  </div>
                );
              })}
            </div>

            {/* 승인 vs 재확인 버튼 */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmCrossCheck}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-2xl text-base shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] border border-emerald-400 cursor-pointer"
              >
                <span>👍 타수 일치 (다음 홀 이동)</span>
              </button>

              <button
                type="button"
                onClick={handleRejectCrossCheck}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
              >
                <span>✋ 타수 불일치 (심판에게 재확인 요청)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 심판 담당 홀 변경 모달 */}
      {showRefereeAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-4 space-y-3.5 shadow-2xl border border-stone-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-1.5 font-black text-stone-900 text-base">
                <span>⚖️</span>
                <span>심판 담당 홀 위치 변경</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRefereeAssignModal(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-stone-600 font-medium">
              심판 폰에서 1초 만에 배정 위치를 변경하여 해당 홀을 전담할 수 있습니다.
            </p>

            <div className="space-y-2">
              <span className="text-xs font-black text-stone-800">이동할 홀 선택 ({courseLetter}코스):</span>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hNum) => (
                  <button
                    key={hNum}
                    type="button"
                    onClick={() => {
                      handleSwitchCourse(courseLetter, hNum, currentRoundNumber);
                      setShowRefereeAssignModal(false);
                      setCrossCheckToast(`⚖️ 심판 담당 홀이 ${courseLetter}-${hNum}번 홀로 변경되었습니다.`);
                      setTimeout(() => setCrossCheckToast(null), 3000);
                    }}
                    className={`py-2.5 rounded-xl font-black text-xs transition border cursor-pointer ${
                      holeInCourse === hNum
                        ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                        : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {courseLetter}-{hNum}번 홀
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Total Cumulative Score & Course Score Breakdown Modal */}
      {showTotalScoreModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-4 space-y-3 shadow-2xl border border-stone-200 max-h-[92vh] flex flex-col animate-slideUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-lg font-black shadow-sm">
                  ⛳
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-base flex items-center gap-1.5">
                    <span>코스별 스코어 검색 & 누적 현황</span>
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium">
                    {course.name} · {confirmedHoles.length > 0 ? `총 ${confirmedHoles.length}홀 진행 확인` : '1번 홀 시작 대기 (0타 / 0홀)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTotalScoreModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center font-bold text-base transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Top 3-Mode Tabs: [ 📋 코스별 카드 ] [ 📊 통합 (평균 타수) ] [ 📋 홀별 상세표 ] */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => setModalActiveTab('COURSES')}
                className={`py-2 px-1 rounded-xl font-black text-xs transition flex items-center justify-center gap-1 shadow-xs ${
                  modalActiveTab === 'COURSES'
                    ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-500'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <span>📋 코스별 카드</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {courseSegments.length}장
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('INTEGRATED')}
                className={`py-2 px-1 rounded-xl font-black text-xs transition flex items-center justify-center gap-1 shadow-xs ${
                  modalActiveTab === 'INTEGRATED'
                    ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <span>📊 통합 (평균)</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-amber-400 text-amber-950 font-black">
                  평균
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModalActiveTab('MATRIX')}
                className={`py-2 px-1 rounded-xl font-black text-xs transition flex items-center justify-center gap-1 shadow-xs ${
                  modalActiveTab === 'MATRIX'
                    ? 'bg-stone-900 text-amber-300 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <span>📋 홀별 상세표</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5">
              {/* TAB 1: 📋 코스별 카드 (석 장이 뜨는 뷰) */}
              {modalActiveTab === 'COURSES' && (
                <div className="space-y-3">
                  {/* Quick Course Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                    <span className="font-extrabold text-stone-600 text-[11px] shrink-0">검색 필터:</span>
                    <button
                      type="button"
                      onClick={() => setCourseFilterLetter('ALL')}
                      className={`px-2.5 py-1 rounded-full font-black text-xs shrink-0 transition ${
                        courseFilterLetter === 'ALL'
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      전체 ({courseSegments.length}장 모두 보기)
                    </button>
                    {uniqueLettersInSegments.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setCourseFilterLetter(l)}
                        className={`px-2.5 py-1 rounded-full font-black text-xs shrink-0 transition ${
                          courseFilterLetter === l
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {l}코스
                      </button>
                    ))}
                  </div>

                  {/* 🎯 골프 공인 언더파 기호 안내 범례 */}
                  <ScoreBadgeLegend />

                  {courseSegments.length === 0 ? (
                    <div className="bg-stone-50 rounded-2xl p-6 text-center border border-stone-200 space-y-1">
                      <p className="text-sm font-black text-stone-700">아직 진행된 코스가 없습니다.</p>
                      <p className="text-xs text-stone-400">홀 플레이 후 [확인]을 누르면 코스별 카드가 자동 생성됩니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {courseSegments
                        .filter((seg) => courseFilterLetter === 'ALL' || seg.courseLetter === courseFilterLetter)
                        .map((seg) => (
                          <div
                            key={seg.segmentKey}
                            className="bg-white rounded-2xl p-3 border-2 border-emerald-200/90 shadow-sm space-y-2.5"
                          >
                            {/* Card Header */}
                            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="bg-emerald-800 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1">
                                  ⛳ {seg.title}
                                </span>
                                <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                                  seg.isCompleted
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-stone-100 text-stone-700'
                                }`}>
                                  {seg.isCompleted ? '9홀 완주 🏆' : `${seg.playedCount}홀 진행 확인`}
                                </span>
                              </div>
                              <span className="text-xs font-extrabold text-stone-600">
                                기준 Par <strong className="text-emerald-900">{seg.segmentPar}</strong>타
                              </span>
                            </div>

                            {/* Players in this course card */}
                            <div className="space-y-2">
                              {seg.playerSummaries.map((ps, pIdx) => (
                                <div
                                  key={ps.player.id}
                                  className="bg-stone-50/90 rounded-xl p-2.5 border border-stone-200/80 space-y-1.5"
                                >
                                  {/* Player Summary Row */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center font-black text-[11px]">
                                        {pIdx + 1}
                                      </span>
                                      <span className="font-extrabold text-stone-900 text-sm">
                                        {ps.player.name}
                                      </span>
                                      <span className="text-[10px] text-stone-500 font-bold">
                                        (평균 {ps.avgHole}타/홀)
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                        ps.diff > 0
                                          ? 'bg-rose-100 text-rose-700'
                                          : ps.diff < 0
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-stone-200 text-stone-700'
                                      }`}>
                                        {ps.playedCount === 0 ? '대기' : ps.diff === 0 ? 'Even' : ps.diff > 0 ? `+${ps.diff}` : `${ps.diff}`}
                                      </span>
                                      <span className="font-black text-sm text-emerald-950">
                                        총 {ps.strokes}타
                                      </span>
                                    </div>
                                  </div>

                                  {/* 1~9 Hole Mini Matrix Pill Strip (홀 번호 + Par 표시 + 동그라미/왕관/황금링 적용) */}
                                  <div className="grid grid-cols-9 gap-1 text-center text-[10px]">
                                    {ps.holeDetails.map((hd) => (
                                      <div
                                        key={hd.hNum}
                                        className="rounded-lg py-1 px-0.5 border border-stone-200/90 bg-white flex flex-col items-center justify-between min-h-[50px] shadow-2xs"
                                        title={`${hd.baseHole ?? hd.hNum}번 홀 (Par ${hd.par}): ${hd.strokes ?? '미진행'}타`}
                                      >
                                        <div className="flex flex-col items-center justify-center leading-tight mb-1 select-none">
                                          <span className="text-[10px] text-stone-700 font-extrabold leading-none">
                                            {hd.baseHole ?? hd.hNum}번
                                          </span>
                                          <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1 py-0.5 rounded mt-0.5 leading-none">
                                            P{hd.par}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-center flex-1 w-full pt-0.5">
                                          <HoleScoreBadge
                                            score={hd.strokes}
                                            par={hd.par}
                                            isConfirmed={hd.isConfirmed}
                                            size="sm"
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: 📊 통합 (평균 타수 종합 분석 뷰) */}
              {modalActiveTab === 'INTEGRATED' && (
                <div className="space-y-4">
                  {/* 1. Course-by-Course Integrated Averages */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-stone-800">
                      <span className="flex items-center gap-1 text-amber-900">
                        <span>📊 코스별 통합 합산 & 평균 타수</span>
                      </span>
                      <span className="text-[10px] text-stone-500 font-normal">
                        다회차(1차·2차) 진행 시 자동 통합 산출
                      </span>
                    </div>

                    {integratedCourseGroups.length === 0 ? (
                      <div className="bg-stone-50 rounded-2xl p-4 text-center border border-stone-200">
                        <p className="text-xs font-bold text-stone-600">입력된 확인 스코어가 없습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {integratedCourseGroups.map((group) => (
                          <div
                            key={group.courseLetter}
                            className="bg-white rounded-2xl p-3 border-2 border-amber-200 shadow-sm space-y-2.5"
                          >
                            {/* Group Header */}
                            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="bg-amber-600 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-xs">
                                  {group.courseLetter}코스 통합 분석
                                </span>
                                <span className="text-xs font-black text-amber-950">
                                  총 {group.totalRounds}회 진행 ({group.totalPlayedHoles}홀)
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-stone-500">
                                총 기준 Par {group.totalPar}타
                              </span>
                            </div>

                            {/* If multiple rounds exist (e.g. C코스 1회차 vs 2회차) */}
                            {group.totalRounds > 1 && (
                              <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-100 space-y-1 text-xs">
                                <div className="text-[11px] font-black text-amber-900 flex items-center gap-1">
                                  <span>🔄 회차별 세부 비교:</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {group.segments.map((seg) => (
                                    <div key={seg.segmentKey} className="bg-white p-2 rounded-lg border border-amber-200 text-center">
                                      <div className="font-extrabold text-stone-800 text-[11px]">{seg.title}</div>
                                      <div className="text-xs font-black text-emerald-950 mt-0.5">
                                        {seg.playedCount}홀 확인 ({seg.segmentPar}타 기준)
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Player stats in this course group */}
                            <div className="space-y-2">
                              {group.playerStats.map((pStat) => (
                                <div
                                  key={pStat.player.id}
                                  className="bg-stone-50 rounded-xl p-2.5 border border-stone-200 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-sm text-stone-900">
                                      {pStat.player.name}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                        pStat.diff > 0
                                          ? 'bg-rose-100 text-rose-700'
                                          : pStat.diff < 0
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-stone-200 text-stone-700'
                                      }`}>
                                        {pStat.diff === 0 ? 'Even' : pStat.diff > 0 ? `+${pStat.diff}` : `${pStat.diff}`}
                                      </span>
                                      <span className="font-black text-sm text-stone-900">
                                        총 {pStat.totalStrokes}타
                                      </span>
                                    </div>
                                  </div>

                                  {/* 2 Key Metrics: 1홀당 평균 & 9홀 환산 */}
                                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                    <div className="bg-white p-2 rounded-lg border border-stone-200 text-center">
                                      <span className="text-[10px] text-stone-500 font-bold block">1홀당 평균 타수</span>
                                      <span className="text-sm font-black text-emerald-950">{pStat.avgPerHole}타</span>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-stone-200 text-center">
                                      <span className="text-[10px] text-stone-500 font-bold block">9홀 환산 평균</span>
                                      <span className="text-sm font-black text-amber-800">{pStat.converted9Hole}타</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Overall Players Integrated Ranking & Averages */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-stone-800">
                      <span className="flex items-center gap-1 text-emerald-900">
                        <span>🏆 전 코스 통합 종합 순위 및 평균 지표</span>
                      </span>
                      <span className="text-[10px] text-stone-500 font-normal">
                        총 {confirmedHoles.length}홀 기준
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl p-2 border border-stone-200 space-y-1.5 shadow-sm">
                      {overallPlayerRankings.map((item, rank) => (
                        <div
                          key={item.player.id}
                          className="p-2.5 rounded-xl border border-stone-200 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[11px] ${
                                rank === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' : 'bg-stone-200 text-stone-700'
                              }`}>
                                {rank + 1}
                              </span>
                              <span className="font-extrabold text-stone-900 text-sm">
                                {item.player.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                                item.diff > 0
                                  ? 'bg-rose-100 text-rose-700'
                                  : item.diff < 0
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-stone-100 text-stone-700'
                              }`}>
                                {item.scoredCount === 0 ? '대기' : item.diff === 0 ? 'Even' : item.diff > 0 ? `+${item.diff}` : `${item.diff}`}
                              </span>
                              <span className="font-black text-base text-emerald-950">
                                총 {item.strokes}타 <span className="text-xs text-stone-400 font-bold">({item.scoredCount}홀)</span>
                              </span>
                            </div>
                          </div>

                          {/* Averages */}
                          <div className="grid grid-cols-3 gap-1 pt-1 text-center">
                            <div className="bg-stone-50 py-1.5 px-1 rounded-lg">
                              <div className="text-[9px] text-stone-500 font-bold">1홀당 평균</div>
                              <div className="text-xs font-black text-stone-900">{item.avgPerHole}타</div>
                            </div>
                            <div className="bg-stone-50 py-1.5 px-1 rounded-lg">
                              <div className="text-[9px] text-stone-500 font-bold">9홀 환산</div>
                              <div className="text-xs font-black text-amber-800">{item.converted9Hole}타</div>
                            </div>
                            <div className="bg-stone-50 py-1.5 px-1 rounded-lg">
                              <div className="text-[9px] text-stone-500 font-bold">18홀 환산</div>
                              <div className="text-xs font-black text-emerald-800">{item.converted18Hole}타</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: 📋 홀별 상세표 매트릭스 */}
              {modalActiveTab === 'MATRIX' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-stone-800">
                      📋 전 홀 스코어 상세 기록
                    </h4>
                  </div>
                  <ScoreBadgeLegend />
                  {confirmedHoles.length === 0 ? (
                    <div className="bg-stone-50 rounded-xl p-4 text-center border border-stone-200">
                      <p className="text-xs font-bold text-stone-600">아직 입력된 홀 스코어가 없습니다.</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">홀별 타수를 입력하시면 실시간 누적 현황이 이곳에 표시됩니다.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-stone-200">
                      <table className="w-full text-center text-xs">
                        <thead>
                          <tr className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200 text-[11px]">
                            <th className="py-1.5 px-2 text-left">선수</th>
                            {confirmedHoles.map((hNum) => {
                              const hInfo = getHoleInfo(hNum);
                              const meta = course.holesMetadata?.find((m) => Number(m.hole) === hInfo.base);
                              return (
                                <th key={hNum} className="py-1.5 px-1.5 font-extrabold text-stone-800 min-w-[34px]">
                                  <div>{hInfo.cLetter}{hInfo.hInCourse}</div>
                                  <div className="text-[9px] font-normal text-stone-400">P{meta?.par || 3}</div>
                                </th>
                              );
                            })}
                            <th className="py-1.5 px-2 bg-emerald-100 text-emerald-950 font-black min-w-[42px]">
                              합계
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-medium">
                          {session.players.map((p) => {
                            const pScored = getPlayerConfirmedHoles(p);
                            const pTotal = pScored.reduce((sum, hNum) => sum + (p.scores[hNum] || 0), 0);
                            return (
                              <tr key={p.id} className="hover:bg-stone-50">
                                <td className="py-2 px-2 text-left font-black text-stone-800 text-[11px] truncate max-w-[70px]">
                                  {p.name}
                                </td>
                                {confirmedHoles.map((hNum) => {
                                  const s = p.scores[hNum];
                                  const isScored = s !== undefined && s > 0 && pScored.includes(hNum);
                                  const hInfo = getHoleInfo(hNum);
                                  const meta = course.holesMetadata?.find((m) => Number(m.hole) === hInfo.base);
                                  const par = Number(meta?.par || 3);

                                  return (
                                    <td key={hNum} className="py-2 px-1 text-center">
                                      <div className="flex items-center justify-center">
                                        <HoleScoreBadge
                                          score={s}
                                          par={par}
                                          isConfirmed={isScored}
                                          size="sm"
                                        />
                                      </div>
                                    </td>
                                  );
                                })}
                                <td className="py-2 px-2 bg-emerald-50 text-emerald-950 font-black text-sm">
                                  {pTotal}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Button */}
            <div className="pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowTotalScoreModal(false)}
                className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-sm transition active:scale-[0.98] shadow-md"
              >
                확인 (현재 홀 계속 플레이)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Reflection Confirmation Modal ("오늘 스코어를 반영할까요?") */}
      {showFinishOfficialModal && session && course && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 animate-scaleUp border border-stone-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 text-xl shadow-xs shrink-0">
                  🏆
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 leading-tight">
                    오늘 스코어를 반영할까요?
                  </h3>
                  <p className="text-[11px] text-amber-800 font-bold">
                    공식 정규 라운드 vs 연습/테스트 선택
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFinishOfficialModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Session Summary */}
            <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-stone-900 truncate max-w-[170px]">
                  {course.name}
                </span>
                <span className="text-[11px] font-black bg-emerald-700 text-white px-2 py-0.5 rounded-full">
                  {(session.confirmedHoles?.length || 0) + (session.confirmedHoles?.includes(actualHoleNumber) ? 0 : 1)}개 홀 완료
                </span>
              </div>
              <div className="pt-1 grid grid-cols-2 gap-1.5 text-[11px]">
                {session.players.map((p) => {
                  const strokes = (session.confirmedHoles || []).reduce((sum, h) => sum + (p.scores[h] || 0), 0) + (session.confirmedHoles?.includes(actualHoleNumber) ? 0 : (p.scores[actualHoleNumber] || currentPar));
                  return (
                    <div key={p.id} className="bg-white px-2 py-1.5 rounded-xl border border-stone-200/60 flex items-center justify-between font-bold shadow-2xs">
                      <span className="text-stone-700 truncate max-w-[70px]">{p.name}</span>
                      <span className="text-emerald-800 font-black">{strokes}타</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation box */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 text-xs text-stone-700 space-y-1.5 leading-relaxed">
              <div className="font-black text-emerald-950 flex items-center gap-1">
                <span>💡</span>
                <span>공식 전적 관리 안심 안내</span>
              </div>
              <p className="text-[11px]">
                테스트나 단순 연습용으로 입력하신 기록은 <strong>[연습/테스트로 저장]</strong>을 누르시면 내 공식 평균 타수와 스타 등급에 <strong>100% 반영되지 않습니다.</strong>
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => executeFinishRound(true)}
                className="w-full bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-black py-3.5 px-4 rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>🏆 공식 전적에 반영 (정규 라운드)</span>
              </button>
              <button
                type="button"
                onClick={() => executeFinishRound(false)}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-black py-3 px-4 rounded-xl text-xs border border-stone-300 shadow-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer"
              >
                <span>🧪 연습·테스트로 저장 (전적 미반영)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowFinishOfficialModal(false)}
                className="w-full py-2 text-stone-500 font-bold text-xs hover:text-stone-800 cursor-pointer"
              >
                계속 라운딩하기 (취소)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Exit to Home Confirmation Modal */}
      {showExitConfirm && course && session && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 animate-scaleUp border border-stone-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 text-xl shadow-xs shrink-0">
                  💾
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 leading-tight">
                    홈으로 나가시겠습니까?
                  </h3>
                  <p className="text-[11px] text-emerald-800 font-bold">
                    지금까지 내용 저장 및 언제든 이어하기
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Round Info Card */}
            <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-stone-900 truncate max-w-[170px]">
                  {course.name}
                </span>
                <span className="text-[11px] font-black bg-emerald-700 text-white px-2 py-0.5 rounded-full">
                  {courseLetter}코스 {holeInCourse}번 홀
                </span>
              </div>

              <div className="text-xs text-stone-600 flex items-center justify-between pt-1.5 border-t border-stone-200/60 font-semibold">
                <span>기록 완료 현황</span>
                <span className="font-black text-stone-900">
                  총 {confirmedHoles.length}개 홀 스코어 저장됨
                </span>
              </div>

              {/* Player strokes summary */}
              <div className="pt-1 grid grid-cols-2 gap-1.5 text-[11px]">
                {session.players.map((p) => {
                  const pConfirmed = getPlayerConfirmedHoles(p);
                  const pStrokes = pConfirmed.reduce((sum, h) => sum + (p.scores[h] || 0), 0);
                  return (
                    <div key={p.id} className="bg-white px-2 py-1.5 rounded-xl border border-stone-200/60 flex items-center justify-between font-bold shadow-2xs">
                      <span className="text-stone-700 truncate max-w-[70px]">{p.name}</span>
                      <span className="text-emerald-800 font-black">{pStrokes}타</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reassurance text */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1.5">
              <div className="flex items-center gap-1.5 font-extrabold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>안심하세요! 기록은 절대 사라지지 않습니다.</span>
              </div>
              <p className="text-[11px] leading-relaxed text-stone-700 pl-5">
                홈 화면 상단의 <span className="font-black text-amber-900">[진행 중인 라운드 이어하기 ▶]</span> 배너를 터치하면 언제든 지금 이 자리({courseLetter}코스 {holeInCourse}번 홀)로 그대로 돌아와 플레이를 이어가실 수 있습니다.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmExitHome}
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black py-3.5 px-4 rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
              >
                <span>💾 지금까지 내용 저장하고 홈으로 나가기</span>
              </button>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-black py-2.5 px-4 rounded-xl text-xs transition active:scale-[0.98] cursor-pointer"
              >
                계속 라운딩하기 (취소)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Condition Realtime Vote Modal */}
      {showConditionModal && course && (
        <ConditionVoteModal
          courseId={course.id}
          courseName={course.name}
          isOpen={showConditionModal}
          isVirtual={Boolean(session?.isVirtual)}
          onClose={() => setShowConditionModal(false)}
        />
      )}

      {/* 👑 조장 및 동반자 관리 모달 */}
      {showPlayerEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-stone-900 rounded-2xl w-full max-w-md shadow-2xl border border-stone-200 max-h-[92vh] flex flex-col overflow-hidden">
            {/* 고정 헤더 */}
            <div className="flex items-center justify-between border-b border-stone-100 p-4 shrink-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">👑</span>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base">조장 및 동반자 관리</h3>
                  <p className="text-xs text-stone-500">조장 위임 · 중도 퇴장/대타 · 새 조장 폰 넘겨주기</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPlayerEditModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center font-bold text-sm cursor-pointer shrink-0 transition"
              >
                ✕
              </button>
            </div>

            {/* 스크롤 가능한 본문 */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {/* 친절한 안내 박스 */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1.5">
                <div className="font-extrabold flex items-center gap-1">
                  <span>💡 편리한 실전 라운딩 기능</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  • <strong>조장 변경</strong>: 원하는 분의 👑 버튼을 누르면 1번 조장으로 즉시 위임됩니다.<br />
                  • <strong>중도 퇴장</strong>: 도중에 먼저 가시는 분은 <strong>[🚪 중도퇴장]</strong>을 누르면 이전 타수는 보존되고 다음 홀부터 제외됩니다.<br />
                  • <strong>폰 넘겨주기</strong>: 조장이 바뀌거나 배터리가 부족할 때 아래 <strong>[카톡 전송]</strong>으로 새 조장 폰에 경기를 넘겨줄 수 있습니다.
                </p>
              </div>

              {/* 참여 인원 목록 */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-0.5">
                  <div className="text-xs font-bold text-stone-700">
                    참여 인원 ({editPlayersDraft.filter((p) => !p.isOut).length}명 참여중
                    {editPlayersDraft.some((p) => p.isOut) && (
                      <span className="text-stone-500 font-normal"> · {editPlayersDraft.filter((p) => p.isOut).length}명 퇴장</span>
                    )})
                  </div>
                </div>

                {editPlayersDraft.map((draftP) => {
                  const isSelectedLeader = draftP.isLeader && !draftP.isOut;
                  const selfName = getDefaultSelfName();
                  const currentDisplayName = draftP.name || (draftP.isSelf ? selfName : '선수');

                  // 🚪 중도 퇴장 선수 카드
                  if (draftP.isOut) {
                    return (
                      <div
                        key={draftP.id}
                        className="p-3 rounded-xl border border-stone-300 bg-stone-100/90 transition flex items-center gap-3"
                      >
                        <div className="px-2 py-1.5 rounded-lg text-xs font-black bg-stone-200 text-stone-700 flex items-center gap-1 shrink-0">
                          <span>🚪</span>
                          <span>중도퇴장</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-black text-stone-800 line-through">
                              {currentDisplayName}
                            </span>
                            {draftP.isSelf && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-black bg-blue-100 text-blue-700">
                                본인
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-stone-200 text-stone-600">
                              {draftP.departedHole || actualHoleNumber}홀까지 보존
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-600">
                            {draftP.isSelf ? '본인 기권 처리됨 (이전 타수 정상 유지)' : '기권 처리됨 (이전 타수 정상 유지)'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditPlayersDraft((prev) =>
                              prev.map((p) => (p.id === draftP.id ? { ...p, isOut: false, departedHole: undefined } : p))
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 shrink-0 cursor-pointer transition active:scale-95 shadow-2xs"
                        >
                          ↩ 다시 참여
                        </button>
                      </div>
                    );
                  }

                  // ⛳ 정상 활동 중인 선수 카드
                  return (
                    <div
                      key={draftP.id}
                      className={`p-3 rounded-xl border transition flex items-center gap-2.5 ${
                        isSelectedLeader
                          ? 'border-amber-400 bg-amber-50/50 shadow-xs'
                          : 'border-stone-200 bg-stone-50/40 hover:bg-stone-50'
                      }`}
                    >
                      {/* 👑 조장 선택/위임 버튼 */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditPlayersDraft((prev) =>
                            prev.map((p) => ({
                              ...p,
                              isLeader: p.id === draftP.id,
                            }))
                          );
                        }}
                        className={`px-2 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1 shrink-0 cursor-pointer ${
                          isSelectedLeader
                            ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
                            : 'bg-white border border-stone-300 text-stone-600 hover:bg-stone-100'
                        }`}
                        title="이 플레이어를 조장(1번)으로 지정"
                      >
                        <span>👑</span>
                        <span>{isSelectedLeader ? '조장 (1번)' : '조장 위임'}</span>
                      </button>

                      {/* 이름 입력 필드 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[11px] font-bold text-stone-600">이름</span>
                          {draftP.isSelf && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-100 text-blue-700">
                              본인
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={draftP.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditPlayersDraft((prev) =>
                              prev.map((p) => (p.id === draftP.id ? { ...p, name: val } : p))
                            );
                          }}
                          placeholder={draftP.isSelf ? selfName : "이름 입력"}
                          className="w-full px-2.5 py-1 text-sm bg-white text-stone-900 border border-stone-300 rounded-lg focus:outline-hidden focus:border-emerald-500 font-bold placeholder:text-stone-400"
                        />
                      </div>

                      {/* 🚪 중도 퇴장 버튼 */}
                      <button
                        type="button"
                        onClick={() => {
                          const confirmMsg = draftP.isSelf
                            ? `${currentDisplayName}(본인) 님이 지금 중도 퇴장(기권)하시나요?\n\n* 지금까지 기록한 타수는 안전하게 보존되며, 다른 동반자에게 조장을 넘겨주고 이후 홀 점수 입력에서 제외됩니다.`
                            : `${currentDisplayName} 님이 지금 중도 퇴장(기권)하시나요?\n\n* 지금까지 기록한 타수는 안전하게 보존되며, 다음 홀부터 점수 입력에서 제외됩니다.`;

                          if (confirm(confirmMsg)) {
                            setEditPlayersDraft((prev) => {
                              const updated = prev.map((p) => {
                                if (p.id === draftP.id) {
                                  return { ...p, isOut: true, isLeader: false, departedHole: actualHoleNumber };
                                }
                                return p;
                              });
                              // 만약 조장이 퇴장했다면 남아있는 첫 번째 활성 인원을 새 조장으로 자동 지정
                              const active = updated.filter((p) => !p.isOut);
                              if (!active.some((p) => p.isLeader) && active.length > 0) {
                                active[0].isLeader = true;
                              }
                              return updated;
                            });
                          }
                        }}
                        className="px-2 py-1.5 rounded-lg text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 shrink-0 cursor-pointer transition active:scale-95 flex items-center gap-0.5"
                        title="사정상 먼저 귀가/기권 시 터치"
                      >
                        <span>🚪</span>
                        <span>중도퇴장</span>
                      </button>
                    </div>
                  );
                })}

                {/* ➕ 동반자 추가 버튼 (최대 4인까지) */}
                {editPlayersDraft.filter((p) => !p.isOut).length < 4 && (
                  <button
                    type="button"
                    onClick={() => {
                      const activeCount = editPlayersDraft.filter((p) => !p.isOut).length;
                      if (activeCount >= 4) {
                        alert('한 조의 최대 동반자는 4명입니다.');
                        return;
                      }
                      const newNum = editPlayersDraft.length + 1;
                      const newPlayer: RoundPlayer = {
                        id: `player_add_${Date.now()}`,
                        name: `동반자 ${newNum}`,
                        scores: {},
                        obCount: {},
                        totalStrokes: 0,
                        totalParDiff: 0,
                      };
                      setEditPlayersDraft((prev) => [...prev, newPlayer]);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-800 text-xs font-black flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <span>➕</span>
                    <span>동반자 추가 (중간 합류 / 대타 선수)</span>
                  </button>
                )}
              </div>

              {/* 💬 새 조장 스마트폰으로 경기 넘겨주기 (카톡 전송) 섹션 */}
              <div className="pt-3 border-t border-stone-200/80 space-y-2">
                <div className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                  <span className="text-base">📱</span>
                  <span>스마트폰 경기 넘겨주기 (조장 교체 / 배터리 방전 시)</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const handoffUrl = `${window.location.origin}/round/${roundId}?handoff=${encodeURIComponent(JSON.stringify(session))}`;
                      if (typeof navigator !== 'undefined' && navigator.share) {
                        await navigator.share({
                          title: `[파크온] ${course.name} 파크골프 경기 이어받기`,
                          text: `[파크온] ${course.name} 경기 스코어카드 이어받기 링크입니다. 터치하시면 현재 ${actualHoleNumber}번 홀부터 그대로 이어서 기록하실 수 있습니다.`,
                          url: handoffUrl,
                        });
                        setShareFeedbackToast('✓ 새 조장에게 경기 넘겨주기 링크가 전송되었습니다!');
                        setTimeout(() => setShareFeedbackToast(null), 4000);
                      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        await navigator.clipboard.writeText(handoffUrl);
                        alert(
                          `✓ 새 조장용 경기 이어받기 링크가 복사되었습니다!\n\n카카오톡 대화방에 붙여넣어(Ctrl+V) 전송하시면, 새 조장님이 터치 한 번으로 현재 ${actualHoleNumber}번 홀부터 그대로 이어서 기록할 수 있습니다.`
                        );
                      } else {
                        prompt('아래 링크를 복사하여 새 조장에게 카카오톡으로 보내주세요:', handoffUrl);
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="w-full py-3 px-3 rounded-xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition active:scale-95 cursor-pointer border border-[#E6CF00]"
                >
                  <span className="text-base">💬</span>
                  <span>새 조장 스마트폰으로 경기 넘겨주기 (카톡 / 링크)</span>
                </button>
                <p className="text-[11px] text-stone-500 leading-tight">
                  * 새 조장이 카톡에서 링크를 누르면 현재 홀과 타수 그대로 즉시 이어받아 입력할 수 있습니다.
                </p>
              </div>
            </div>

            {/* 고정 하단 액션 버튼 */}
            <div className="p-4 border-t border-stone-100 shrink-0 bg-white flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPlayerEditModal(false)}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-sm transition active:scale-95 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  const selfName = getDefaultSelfName();
                  let updated = editPlayersDraft.map((p, idx) => {
                    const isSelf = p.isSelf ?? (idx === 0);
                    let name = (p.name || '').trim();
                    if (isSelf) {
                      if (!name || name === '본인' || name.startsWith('본인(')) {
                        name = selfName;
                      }
                    } else {
                      if (!name) {
                        name = `동반자 ${idx + 1}`;
                      }
                    }
                    return {
                      ...p,
                      isSelf,
                      name,
                    };
                  });

                  const active = updated.filter((p) => !p.isOut);
                  if (active.length > 0 && !active.some((p) => p.isLeader)) {
                    const firstActiveId = active[0].id;
                    updated = updated.map((p) => ({ ...p, isLeader: p.id === firstActiveId }));
                  }
                  // 본인(isSelf) 이름 수정 시 사용자 프로필 및 상단 헤더에 즉시 연동
                  const selfPlayer = updated.find((p) => p.isSelf);
                  if (selfPlayer && selfPlayer.name?.trim()) {
                    syncRoundSelfNameToUserProfile(selfPlayer.name.trim());
                  }

                  const sorted = sortPlayersByLeaderAndAlphabetical(updated);
                  const updatedSession: RoundSession = {
                    ...session,
                    players: sorted,
                  };
                  updateSession(updatedSession);
                  setShowPlayerEditModal(false);
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>✓</span>
                <span>정렬 적용 및 저장</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* [NEW] 가상 라운딩 종료 안내 모달 (기록 제로 보장) */}
      {showVirtualFinishModal && session && course && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-stone-900 rounded-3xl w-full max-w-sm shadow-2xl border-2 border-amber-400/80 overflow-hidden flex flex-col p-5 text-white space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-black text-2xl mx-auto shadow-lg">
              🎯
            </div>
            <div className="text-center space-y-1">
              <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-full">
                체험 모드 완료
              </span>
              <h3 className="text-lg font-black text-white">체험 연습이 종료되었습니다!</h3>
              <p className="text-xs text-stone-300 leading-relaxed pt-1">
                이 기록은 전적과 랭킹에 <span className="text-amber-300 font-black underline">아무것도 남지 않는</span> 1회성 연습용입니다.
              </p>
            </div>

            <div className="bg-stone-950 rounded-xl p-3 border border-stone-800 text-[11px] text-stone-400 space-y-1">
              <div className="flex justify-between">
                <span>체험 구장:</span>
                <span className="font-bold text-white">{course.name}</span>
              </div>
              <div className="flex justify-between">
                <span>연습 상태:</span>
                <span className="font-bold text-emerald-400">정상 종료 (기록 미저장)</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  ParkOnStorage.clearCurrentRound();
                  router.push(`/round/new?courseId=${session.courseId}`);
                }}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98 cursor-pointer"
              >
                <span>⛳ 실제 필드에서 [정식 라운딩] 시작하기</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  ParkOnStorage.clearCurrentRound();
                  router.push('/');
                }}
                className="w-full bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1 transition active:scale-98 cursor-pointer"
              >
                <span>🏠 홈으로 돌아가기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
