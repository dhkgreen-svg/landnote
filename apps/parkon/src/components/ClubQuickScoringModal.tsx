'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  Image as ImageIcon,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  UserPlus,
  Users,
  X,
  ZoomIn,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ParkGolfClub, ClubChronicleTournament } from '@/types/club';
import { RoundSession } from '@/types/parkon';
import { ClubStorage } from '@/lib/clubStorage';
import { ParkOnStorage } from '@/lib/storage';
import { useBackHandler } from '@/lib/backNavigation';
import {
  OfficialGroupScoreboard,
  buildRoundSessionFromGroup,
  generateOfficialGroupScoreboardImage,
} from '@/components/OfficialGroupScoreboard';

export interface QuickScorePlayer {
  id: string;
  name: string;
  gender: 'M' | 'F';
  isGuest: boolean;
  scores: Record<number, number>; // 1..36 hole scores (optional if manual total mode)
  courseTotals?: Record<string, number>; // e.g., { A: 29, B: 31 }
  reportedTotal: number;
  useDirectTotal?: boolean;
}

export interface QuickScoreGroup {
  groupId: string;
  groupNumber: string;
  courseName: string;
  date: string;
  courses: string[]; // ['A', 'B'] or ['A', 'B', 'C', 'D']
  imageUrl?: string;
  players: QuickScorePlayer[];
}

interface RankedStrokeRow {
  groupId: string;
  groupNumber: string;
  player: QuickScorePlayer;
  totalStrokes: number;
  parDiff: number;
  backCourseScore: number; // 후반 코스(마지막 9홀) 합계 — 백카운트 동타 판정용
  lastHoleScores: number[]; // 마지막 홀부터 역순 타수 — 정밀 백카운트용
  officialRank: number | null; // null이면 게스트 번외
  displayRankLabel: string;
  isGraceWinner?: boolean; // 독식 방지(직전 우승자 시상 유예)
  prizeLabel?: string;
  groupImageUrl?: string;
}

interface ClubQuickScoringModalProps {
  isOpen: boolean;
  mode?: 'CLUB' | 'INDIVIDUAL';
  club?: ParkGolfClub | null;
  defaultCourseName?: string;
  initialChronicle?: ClubChronicleTournament | null;
  onClose: () => void;
  onClubUpdated?: (updatedClub: ParkGolfClub) => void;
  onPersonalRoundSaved?: (round: RoundSession) => void;
  onShowToast?: (msg: string) => void;
}

const COURSE_LETTERS = ['A', 'B', 'C', 'D'];

function getPlayerCalcTotal(p: QuickScorePlayer, courses: string[]): number {
  if (p.useDirectTotal) {
    if (p.courseTotals && Object.keys(p.courseTotals).length > 0) {
      const sum = courses.reduce((acc, c) => acc + (Number(p.courseTotals?.[c]) || 0), 0);
      if (sum > 0) return sum;
    }
    return Number(p.reportedTotal) || 0;
  }
  const holeVals = Object.values(p.scores || {}).filter((v) => typeof v === 'number' && v > 0);
  if (holeVals.length > 0) {
    return holeVals.reduce((a, b) => a + b, 0);
  }
  return Number(p.reportedTotal) || 0;
}

function getBackNineScore(p: QuickScorePlayer, courses: string[]): { backSum: number; reverseHoles: number[] } {
  const numCourses = Math.max(1, courses.length);
  const lastCourseLetter = courses[numCourses - 1] || 'B';
  if (p.useDirectTotal && p.courseTotals && p.courseTotals[lastCourseLetter] > 0) {
    return { backSum: p.courseTotals[lastCourseLetter], reverseHoles: [p.courseTotals[lastCourseLetter]] };
  }
  const startHole = (numCourses - 1) * 9 + 1;
  const endHole = numCourses * 9;
  let backSum = 0;
  const rev: number[] = [];
  for (let h = endHole; h >= startHole; h--) {
    const v = Number(p.scores?.[h]) || 0;
    backSum += v;
    rev.push(v);
  }
  return { backSum: backSum || getPlayerCalcTotal(p, courses), reverseHoles: rev };
}

function findSimilarClubMember(name: string, memberNames: string[]): string | null {
  const clean = name.trim();
  if (!clean || clean.length < 2) return null;
  if (memberNames.includes(clean)) return null;
  let best: string | null = null;
  let bestScore = 0;
  for (const m of memberNames) {
    if (Math.abs(m.length - clean.length) > 1) continue;
    let common = 0;
    for (const ch of clean) {
      if (m.includes(ch)) common += 1;
    }
    const ratio = common / Math.max(m.length, clean.length);
    if (ratio >= 0.65 && ratio > bestScore) {
      bestScore = ratio;
      best = m;
    }
  }
  return best;
}

function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w >= h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createSampleSvgPhoto(groupLabel: string, courseName: string, names: string[]): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="440" viewBox="0 0 800 440">
    <rect width="800" height="440" fill="#fefdf8"/>
    <rect x="20" y="20" width="760" height="400" rx="16" fill="#ffffff" stroke="#065f46" stroke-width="4"/>
    <rect x="20" y="20" width="760" height="64" rx="14" fill="#065f46"/>
    <text x="48" y="61" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="bold">⛳ ${courseName} · ${groupLabel} 종이 스코어카드 (샘플)</text>
    <text x="48" y="130" fill="#1c1917" font-family="sans-serif" font-size="20" font-weight="bold">참가 선수: ${names.join(' / ')}</text>
    <line x1="48" y1="155" x2="752" y2="155" stroke="#d6d3d1" stroke-width="2"/>
    <text x="48" y="205" fill="#047857" font-family="sans-serif" font-size="18" font-weight="bold">A코스 (1~9홀) · B코스 (10~18홀) 전통 스트로크 기록지</text>
    <text x="48" y="260" fill="#57534e" font-family="sans-serif" font-size="16">실제 현장에서는 종이 스코어카드를 카메라로 촬영하면</text>
    <text x="48" y="290" fill="#57534e" font-family="sans-serif" font-size="16">AI가 조별 이름 · 홀별 타수 · 총합계를 자동 판독하고 검산합니다.</text>
    <text x="48" y="365" fill="#b45309" font-family="sans-serif" font-size="16" font-weight="bold">PARKY APP · 공식 스코어보드 원본 아카이빙</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function ClubQuickScoringModal({
  isOpen,
  mode = 'CLUB',
  club = null,
  defaultCourseName,
  initialChronicle,
  onClose,
  onClubUpdated,
  onPersonalRoundSaved,
  onShowToast,
}: ClubQuickScoringModalProps) {
  const isIndividual = mode === 'INDIVIDUAL' || !club;
  const [rankingSubView, setRankingSubView] = useState<'GROUPS' | 'OVERALL'>('GROUPS');
  const [cardPreviewTitle, setCardPreviewTitle] = useState<string>('🏆 공식 스코어보드 (1080×1440)');
  const [step, setStep] = useState<'INPUT' | 'REVIEW' | 'RANKING'>('INPUT');
  const [inputMode, setInputMode] = useState<'PHOTO' | 'MANUAL'>('PHOTO');
  const [eventTitle, setEventTitle] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [heldDate, setHeldDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>(['A', 'B']);
  const [activeChronicleId, setActiveChronicleId] = useState<string>('');
  const [autoSavedAt, setAutoSavedAt] = useState<string>('');
  const [confirmDeleteChronicle, setConfirmDeleteChronicle] = useState<boolean>(false);
  const lastAutoSavedHashRef = useRef<string>('');
  const isDeletedRef = useRef<boolean>(false);

  // Photo staging before OCR
  const [stagedPhotos, setStagedPhotos] = useState<string[]>([]);
  const [isParsingOcr, setIsParsingOcr] = useState<boolean>(false);
  const [ocrNotice, setOcrNotice] = useState<string>('');

  // Parsed or manually entered groups
  const [groups, setGroups] = useState<QuickScoreGroup[]>([]);
  const [activeGroupIdx, setActiveGroupIdx] = useState<number>(0);
  const [showOriginalPhotoPanel, setShowOriginalPhotoPanel] = useState<boolean>(true);

  // Manual quick entry draft
  const [manualName, setManualName] = useState<string>('');
  const [manualGender, setManualGender] = useState<'M' | 'F'>('M');
  const [manualIsGuest, setManualIsGuest] = useState<boolean>(false);
  const [manualTotal, setManualTotal] = useState<string>('60');

  // Ranking rules (100% Traditional Stroke Standard)
  const [divisionMode, setDivisionMode] = useState<'ALL' | 'GENDER'>('ALL');
  const [useBackcount, setUseBackcount] = useState<boolean>(true);
  const [excludeGuestsFromAwards, setExcludeGuestsFromAwards] = useState<boolean>(true);
  const [graceWinnerName, setGraceWinnerName] = useState<string>('');
  const [autoRegisterProvisional, setAutoRegisterProvisional] = useState<boolean>(true);

  // Popups (all wired with useBackHandler)
  const [editingPlayerCtx, setEditingPlayerCtx] = useState<{
    groupId: string;
    playerId: string;
    activeHole?: number;
  } | null>(null);
  const [zoomedPhotoUrl, setZoomedPhotoUrl] = useState<string | null>(null);
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [savedArchiveMsg, setSavedArchiveMsg] = useState<string>('');

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset cleanly when opened for a club or individual game (or hydrate from existing chronicle for edit/update!)
  useEffect(() => {
    if (isOpen && (isIndividual || club)) {
      isDeletedRef.current = false;
      setConfirmDeleteChronicle(false);
      setStagedPhotos([]);
      setOcrNotice('');
      setSavedArchiveMsg('');
      setEditingPlayerCtx(null);
      setZoomedPhotoUrl(null);
      setGeneratedCardUrl(null);
      lastAutoSavedHashRef.current = '';

      if (initialChronicle) {
        setActiveChronicleId(initialChronicle.id);
        setEventTitle(initialChronicle.title || `${(club?.name || '나의 라운드')} 스트로크 채점`);
        setCourseName(initialChronicle.courseName || club?.homeCourseName || '파크골프장');
        setHeldDate(initialChronicle.heldAt || new Date().toISOString().split('T')[0]);
        const restoredCourses =
          initialChronicle.quickScoreSettings?.selectedCourses &&
          initialChronicle.quickScoreSettings.selectedCourses.length > 0
            ? initialChronicle.quickScoreSettings.selectedCourses
            : COURSE_LETTERS.slice(0, Math.max(1, Math.min(4, Math.round((initialChronicle.totalHoles || 18) / 9))));
        setSelectedCourses(restoredCourses);
        setDivisionMode(initialChronicle.quickScoreSettings?.divisionMode || 'ALL');
        setUseBackcount(initialChronicle.quickScoreSettings?.useBackcount ?? true);
        setExcludeGuestsFromAwards(initialChronicle.quickScoreSettings?.excludeGuestsFromAwards ?? true);
        setGraceWinnerName(initialChronicle.quickScoreSettings?.graceWinnerName || '');

        if (Array.isArray(initialChronicle.quickScoreGroups) && initialChronicle.quickScoreGroups.length > 0) {
          setGroups(initialChronicle.quickScoreGroups as QuickScoreGroup[]);
        } else if (Array.isArray(initialChronicle.rankings) && initialChronicle.rankings.length > 0) {
          // Reconstruct editable groups from legacy chronicle rankings
          const byGroup = new Map<number, QuickScorePlayer[]>();
          initialChronicle.rankings.forEach((r, idx) => {
            const gNum = r.groupNumber || 1;
            const list = byGroup.get(gNum) || [];
            list.push({
              id: r.playerId || `rec_${idx}_${Date.now()}`,
              name: r.playerName,
              gender: r.gender || 'M',
              isGuest: Boolean(r.isGuest),
              scores: {},
              reportedTotal: r.totalStrokes || 60,
              useDirectTotal: true,
            });
            byGroup.set(gNum, list);
          });
          const rebuiltGroups: QuickScoreGroup[] = Array.from(byGroup.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([gNum, players]) => {
              const photoMatch = initialChronicle.scorecardPhotos?.find((sp) =>
                sp.groupNumber.includes(String(gNum))
              );
              return {
                groupId: `grp_rebuilt_${gNum}_${Date.now()}`,
                groupNumber: `${gNum}조`,
                courseName: initialChronicle.courseName || club?.homeCourseName || '파크골프장',
                date: initialChronicle.heldAt || new Date().toISOString().split('T')[0],
                courses: restoredCourses,
                imageUrl: photoMatch?.imageUrl,
                players,
              };
            });
          setGroups(rebuiltGroups);
        } else {
          setGroups([]);
        }
        setActiveGroupIdx(0);
        setAutoSavedAt('불러옴');
        setStep('RANKING');
      } else {
        const m = new Date().getMonth() + 1;
        setActiveChronicleId(isIndividual ? `photo_round_${Date.now()}` : `quick_stroke_${Date.now()}`);
        setEventTitle(isIndividual ? `${m}월 사후 사진 라운드 기록` : `${club?.name || '클럽'} ${m}월 스트로크 채점`);
        const defaultCourse = defaultCourseName || club?.homeCourseName || ParkOnStorage.getAllCourses()?.[0]?.name || '구미 동락파크골프장';
        setCourseName(defaultCourse);
        setRankingSubView('GROUPS');
        setHeldDate(new Date().toISOString().split('T')[0]);
        setSelectedCourses(['A', 'B']);
        setStep('INPUT');
        setInputMode('PHOTO');
        setGroups([]);
        setActiveGroupIdx(0);
        setAutoSavedAt('');
        setGraceWinnerName('');
        setExcludeGuestsFromAwards(true);
        setUseBackcount(true);
        setDivisionMode('ALL');
      }
    }
  }, [isOpen, isIndividual, club?.id, defaultCourseName, initialChronicle?.id]);

  // 3-Layer Mobile Back Navigation (LIFO: sub-popups close first, then main modal)
  useBackHandler(Boolean(isOpen && (isIndividual || club)), onClose);
  useBackHandler(Boolean(isOpen && editingPlayerCtx), () => setEditingPlayerCtx(null));
  useBackHandler(Boolean(isOpen && zoomedPhotoUrl), () => setZoomedPhotoUrl(null));
  useBackHandler(Boolean(isOpen && generatedCardUrl), () => setGeneratedCardUrl(null));

  const clubMemberNames = useMemo(
    () => (club?.members || []).map((m) => m.name.trim()).filter(Boolean),
    [club]
  );
  const clubMemberNameSet = useMemo(() => new Set(clubMemberNames), [clubMemberNames]);

  const totalHolesCount = selectedCourses.length * 9;
  const standardPar = selectedCourses.length * 33; // 9홀 표준 Par 33 (18홀 66타)

  // Compute Traditional Stroke Rankings
  const computeRankings = (filterGender?: 'M' | 'F'): RankedStrokeRow[] => {
    const flat: RankedStrokeRow[] = [];
    groups.forEach((g) => {
      const gCourses = g.courses && g.courses.length > 0 ? g.courses : selectedCourses;
      const gPar = gCourses.length * 33;
      g.players.forEach((p) => {
        if (!p.name.trim()) return;
        if (filterGender && p.gender !== filterGender) return;
        const tot = getPlayerCalcTotal(p, gCourses);
        const { backSum, reverseHoles } = getBackNineScore(p, gCourses);
        flat.push({
          groupId: g.groupId,
          groupNumber: g.groupNumber,
          player: p,
          totalStrokes: tot,
          parDiff: tot - gPar,
          backCourseScore: backSum,
          lastHoleScores: reverseHoles,
          officialRank: null,
          displayRankLabel: '',
          groupImageUrl: g.imageUrl,
        });
      });
    });

    // Traditional Stroke sort: lowest totalStrokes first -> backcount lowest backCourseScore -> reverse hole by hole
    flat.sort((a, b) => {
      if (a.totalStrokes !== b.totalStrokes) return a.totalStrokes - b.totalStrokes;
      if (useBackcount) {
        if (a.backCourseScore !== b.backCourseScore) return a.backCourseScore - b.backCourseScore;
        const maxLen = Math.max(a.lastHoleScores.length, b.lastHoleScores.length);
        for (let i = 0; i < maxLen; i++) {
          const ha = a.lastHoleScores[i] ?? 99;
          const hb = b.lastHoleScores[i] ?? 99;
          if (ha !== hb) return ha - hb;
        }
      }
      // Official members slightly ahead of guests on exact tie
      if (a.player.isGuest !== b.player.isGuest) return a.player.isGuest ? 1 : -1;
      return a.player.name.localeCompare(b.player.name, 'ko');
    });

    const graceNameTrim = graceWinnerName.trim();
    let rankCounter = 0;
    let awardSlot = 0;
    let prevComparableScore: number | null = null;
    let prevComparableBack: number | null = null;

    flat.forEach((row) => {
      const isExcludedGuest = excludeGuestsFromAwards && row.player.isGuest;
      if (isExcludedGuest) {
        row.officialRank = null;
        row.displayRankLabel = '번외(게스트)';
        return;
      }

      rankCounter += 1;
      if (!useBackcount && prevComparableScore === row.totalStrokes) {
        // Tied rank when backcount is OFF
        const prevRow = flat.find((r) => r.officialRank !== null && r.totalStrokes === row.totalStrokes);
        row.officialRank = prevRow?.officialRank || rankCounter;
      } else {
        row.officialRank = rankCounter;
      }
      prevComparableScore = row.totalStrokes;
      prevComparableBack = row.backCourseScore;

      row.displayRankLabel = `${row.officialRank}위`;

      // Winner grace rule (독식 방지)
      if (graceNameTrim && row.player.name.trim() === graceNameTrim && row.officialRank === 1) {
        row.isGraceWinner = true;
        row.prizeLabel = '명예 메달리스트 (상품 승계)';
      } else {
        awardSlot += 1;
        if (awardSlot === 1) row.prizeLabel = '🏆 우승';
        else if (awardSlot === 2) row.prizeLabel = '🥈 준우승';
        else if (awardSlot === 3) row.prizeLabel = '🥉 3위';
      }
    });

    // Place official ranked rows first, then excluded guests neatly at the bottom (still showing their actual score!)
    const officialRows = flat.filter((r) => r.officialRank !== null);
    const guestRows = flat.filter((r) => r.officialRank === null);
    return [...officialRows, ...guestRows];
  };

  const allRankings = useMemo(() => computeRankings(), [
    groups,
    selectedCourses,
    useBackcount,
    excludeGuestsFromAwards,
    graceWinnerName,
  ]);
  const maleRankings = useMemo(() => computeRankings('M'), [
    groups,
    selectedCourses,
    useBackcount,
    excludeGuestsFromAwards,
    graceWinnerName,
  ]);
  const femaleRankings = useMemo(() => computeRankings('F'), [
    groups,
    selectedCourses,
    useBackcount,
    excludeGuestsFromAwards,
    graceWinnerName,
  ]);

  const unregisteredRegularPlayers = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; gender: 'M' | 'F' }[] = [];
    groups.forEach((g) => {
      g.players.forEach((p) => {
        const clean = p.name.trim();
        if (!clean || p.isGuest) return;
        if (clubMemberNameSet.has(clean) || seen.has(clean)) return;
        seen.add(clean);
        list.push({ name: clean, gender: p.gender });
      });
    });
    return list;
  }, [groups, clubMemberNameSet]);

  const totalPlayersCount = useMemo(
    () => groups.reduce((acc, g) => acc + g.players.filter((p) => p.name.trim()).length, 0),
    [groups]
  );

  const mathErrorCount = useMemo(() => {
    let cnt = 0;
    groups.forEach((g) => {
      g.players.forEach((p) => {
        if (p.useDirectTotal) return;
        const calc = getPlayerCalcTotal(p, g.courses);
        if (p.reportedTotal > 0 && calc > 0 && calc !== p.reportedTotal) cnt += 1;
      });
    });
    return cnt;
  }, [groups]);

  const editingPlayerData = useMemo(() => {
    if (!editingPlayerCtx) return null;
    const g = groups.find((x) => x.groupId === editingPlayerCtx.groupId);
    const p = g?.players.find((x) => x.id === editingPlayerCtx.playerId);
    if (!g || !p) return null;
    return { group: g, player: p };
  }, [editingPlayerCtx, groups]);

  // 📜 [대표님 지시] 점수 계산 완료(등수표 진입) 시 연대기 자동 등록 (클럽 & 일반 개인 게임 동일 방식!) + 수정 시 실시간 반영
  useEffect(() => {
    if (!isOpen || step !== 'RANKING' || allRankings.length === 0 || isDeletedRef.current) return;

    if (isIndividual) {
      const targetGroup = groups[0];
      if (!targetGroup || targetGroup.players.filter((p) => p.name.trim()).length === 0) return;
      const rid = activeChronicleId || `photo_round_${Date.now()}`;
      if (!activeChronicleId) setActiveChronicleId(rid);

      const fp = JSON.stringify({
        rid,
        courseName,
        heldDate,
        selectedCourses,
        players: targetGroup.players.map((p) => [p.id, p.name, p.scores, p.reportedTotal, p.isGuest]),
      });
      if (fp === lastAutoSavedHashRef.current) return;
      lastAutoSavedHashRef.current = fp;

      const matchedCourse = ParkOnStorage.getAllCourses().find(
        (c) => c.name === courseName || c.name.includes(courseName) || courseName.includes(c.name)
      );
      const { session } = buildRoundSessionFromGroup(
        { ...targetGroup, courseName: courseName || targetGroup.courseName, date: heldDate, courses: selectedCourses },
        { id: rid, course: matchedCourse || null, courseId: matchedCourse?.id || 'course_photo_round', isClubGroup: false }
      );

      // Upsert into ParkOnStorage completed rounds cleanly
      try {
        const existingRounds = ParkOnStorage.getCompletedRounds();
        const withoutSame = existingRounds.filter((r) => r.id !== rid);
        localStorage.setItem('parkon_completed_rounds_v1', JSON.stringify([session, ...withoutSame].slice(0, 60)));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('parkon_profile_updated'));
      } catch {
        ParkOnStorage.saveCompletedRound(session);
      }

      const now = new Date();
      setAutoSavedAt(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
          now.getSeconds()
        ).padStart(2, '0')}`
      );
      onPersonalRoundSaved?.(session);
      return;
    }

    if (!club) return;
    const cid = activeChronicleId || `quick_stroke_${Date.now()}`;
    if (!activeChronicleId) setActiveChronicleId(cid);

    const officialTop = allRankings.filter((r) => r.officialRank !== null && !r.isGraceWinner);
    const winner = officialTop[0] || allRankings[0];
    if (!winner) return;

    const fingerprint = JSON.stringify({
      cid,
      eventTitle,
      courseName,
      heldDate,
      selectedCourses,
      divisionMode,
      useBackcount,
      excludeGuestsFromAwards,
      graceWinnerName,
      hasCard: Boolean(generatedCardUrl),
      rankings: allRankings.map((r) => [
        r.officialRank,
        r.player.id,
        r.player.name,
        r.totalStrokes,
        r.player.isGuest,
        r.player.gender,
        r.groupNumber,
      ]),
    });

    if (fingerprint === lastAutoSavedHashRef.current) return;
    lastAutoSavedHashRef.current = fingerprint;

    const scorecardPhotos = groups
      .filter((g) => Boolean(g.imageUrl))
      .map((g) => ({ groupNumber: g.groupNumber, imageUrl: g.imageUrl! }));

    const chronicle: ClubChronicleTournament = {
      id: cid,
      clubId: club.id,
      clubName: (club?.name || '나의 라운드'),
      title: eventTitle || `${club?.name || '파키'} 스트로크 시합`,
      heldAt: heldDate,
      courseId: club?.homeCourseId || 'course_custom',
      courseName: courseName || club?.homeCourseName || '파크골프장',
      totalHoles: totalHolesCount,
      gameMode: '전통 스트로크',
      totalParticipants: totalPlayersCount,
      winnerName: winner.player.name,
      winnerScore: winner.totalStrokes,
      runnerUpName: officialTop[1]?.player.name,
      runnerUpScore: officialTop[1]?.totalStrokes,
      thirdPlaceName: officialTop[2]?.player.name,
      thirdPlaceScore: officialTop[2]?.totalStrokes,
      medalistName: allRankings[0]?.player.name,
      medalistScore: allRankings[0]?.totalStrokes,
      awardCardUrl: generatedCardUrl || initialChronicle?.awardCardUrl || undefined,
      groupPhotoUrl: initialChronicle?.groupPhotoUrl || undefined,
      eventPhotos: initialChronicle?.eventPhotos || undefined,
      accountingItems: initialChronicle?.accountingItems || undefined,
      magazineStory: initialChronicle?.magazineStory || undefined,
      scorecardPhotos: scorecardPhotos.length > 0 ? scorecardPhotos : initialChronicle?.scorecardPhotos,
      quickScoreGroups: groups,
      quickScoreSettings: {
        divisionMode,
        useBackcount,
        excludeGuestsFromAwards,
        graceWinnerName,
        selectedCourses,
      },
      rankings: allRankings.map((r, i) => ({
        rank: r.officialRank ?? i + 1,
        playerId: r.player.id,
        playerName: r.player.name,
        groupNumber: parseInt(r.groupNumber.replace(/\D/g, ''), 10) || 1,
        totalStrokes: r.totalStrokes,
        parDiff: r.parDiff,
        isWinner: r.officialRank === 1,
        isGuest: r.player.isGuest,
        gender: r.player.gender,
        awards: r.prizeLabel ? [r.prizeLabel] : undefined,
      })),
      notes: `전통 스트로크 자동 집계 (${useBackcount ? '백카운트 적용' : '공동순위'} · ${
        excludeGuestsFromAwards ? '게스트 시상 제외' : '게스트 포함'
      })`,
      archivedAt: new Date().toISOString(),
    };

    const updatedClub = ClubStorage.saveQuickStrokeTournamentChronicle(club.id, chronicle);
    if (updatedClub) {
      const now = new Date();
      setAutoSavedAt(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
          now.getSeconds()
        ).padStart(2, '0')}`
      );
      if (onClubUpdated) onClubUpdated(updatedClub);
    }
  }, [
    isOpen,
    club,
    step,
    activeChronicleId,
    eventTitle,
    courseName,
    heldDate,
    selectedCourses,
    divisionMode,
    useBackcount,
    excludeGuestsFromAwards,
    graceWinnerName,
    generatedCardUrl,
    allRankings,
    groups,
    totalHolesCount,
    totalPlayersCount,
  ]);

  if (!isOpen || (!isIndividual && !club)) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setOcrNotice('');
    try {
      const compressed = await Promise.all(files.map((f) => compressImageToDataUrl(f)));
      setStagedPhotos((prev) => [...prev, ...compressed]);
    } catch (err) {
      console.error('Image compress error:', err);
      setOcrNotice('이미지 불러오기 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRunOcr = async () => {
    if (stagedPhotos.length === 0) return;
    setIsParsingOcr(true);
    setOcrNotice('');
    try {
      const res = await fetch('/api/scorecard/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: stagedPhotos,
          clubMemberNames,
          strictMode: true,
        }),
      });
      const data = await res.json();
      const parsedGroups: QuickScoreGroup[] = (data.groups || []).map((g: any, gi: number) => {
        const gCourses = Array.isArray(g.courses) && g.courses.length > 0 ? g.courses : selectedCourses;
        const gPlayers: QuickScorePlayer[] = (g.players || []).map((p: any, pi: number) => ({
          id: `qp_${Date.now()}_${gi}_${pi}`,
          name: (p.name || '').trim() || `선수 ${pi + 1}`,
          gender: 'M',
          isGuest: false, // 기본 전원 정회원! 외부 손님만 총무가 게스트 체크
          scores: p.scores || {},
          reportedTotal: Number(p.reportedTotal) || Number(p.calculatedTotal) || 0,
          useDirectTotal: Object.keys(p.scores || {}).length === 0,
        }));
        return {
          groupId: g.groupId || `grp_${Date.now()}_${gi}`,
          groupNumber: g.groupNumber || `${gi + 1}조`,
          courseName: g.courseName || courseName,
          date: g.date || heldDate,
          courses: gCourses,
          imageUrl: g.imageUrl || stagedPhotos[gi],
          players: gPlayers,
        };
      });

      if (data.ocrWarning) {
        setOcrNotice(data.ocrWarning);
      }

      if (parsedGroups.length > 0) {
        if (parsedGroups[0].courseName && parsedGroups[0].courseName !== '파크골프장') {
          setCourseName(parsedGroups[0].courseName);
        }
        setGroups((prev) => [...prev, ...parsedGroups]);
        setActiveGroupIdx(groups.length);
        setStagedPhotos([]);
        setStep('REVIEW');
      } else {
        setOcrNotice(data.error || '판독 결과가 없습니다. 사진을 다시 촬영하거나 직접 입력해 주세요.');
      }
    } catch (err) {
      console.error('OCR call failed:', err);
      setOcrNotice('통신 오류로 AI 판독에 실패했습니다. 잠시 후 다시 시도하거나 직접 입력해 주세요.');
    } finally {
      setIsParsingOcr(false);
    }
  };

  // Sample 2-group traditional stroke demo (includes 1 intentional math error + 1 external guest + 1 unregistered member)
  const handleLoadSampleGroups = () => {
    const cName = courseName || club?.homeCourseName || '구미 옥성파크골프장';
    const sample1: QuickScoreGroup = {
      groupId: `grp_sample_1_${Date.now()}`,
      groupNumber: '1조',
      courseName: cName,
      date: heldDate,
      courses: ['A', 'B'],
      imageUrl: createSampleSvgPhoto('1조', cName, ['김대희', '박영숙', '오송', '최외부']),
      players: [
        {
          id: 'sp_1',
          name: '김대희',
          gender: 'M',
          isGuest: false,
          scores: { 1: 3, 2: 3, 3: 4, 4: 3, 5: 3, 6: 4, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3, 13: 4, 14: 3, 15: 3, 16: 3, 17: 3, 18: 3 },
          reportedTotal: 57,
        },
        {
          id: 'sp_2',
          name: '박영숙',
          gender: 'F',
          isGuest: false,
          scores: { 1: 3, 2: 4, 3: 3, 4: 4, 5: 3, 6: 3, 7: 3, 8: 4, 9: 3, 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 4, 17: 3, 18: 3 },
          reportedTotal: 60, // 의도적 2타 검산 오차 (실제 합계 58타 -> 총무 1초 검수 체험!)
        },
        {
          id: 'sp_3',
          name: '오송',
          gender: 'M',
          isGuest: false,
          scores: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 4, 6: 3, 7: 3, 8: 3, 9: 4, 10: 3, 11: 4, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 3, 18: 3 },
          reportedTotal: 58,
        },
        {
          id: 'sp_4',
          name: '최외부',
          gender: 'M',
          isGuest: true, // 외부 손님(게스트) — 55타지만 공식 시상에서 자동 번외 구분!
          scores: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 3, 18: 4 },
          reportedTotal: 55,
        },
      ],
    };

    const sample2: QuickScoreGroup = {
      groupId: `grp_sample_2_${Date.now()}`,
      groupNumber: '2조',
      courseName: cName,
      date: heldDate,
      courses: ['A', 'B'],
      imageUrl: createSampleSvgPhoto('2조', cName, ['이순신', '김귀연', '윤종율']),
      players: [
        {
          id: 'sp_5',
          name: '이순신',
          gender: 'M',
          isGuest: false,
          scores: { 1: 3, 2: 3, 3: 3, 4: 4, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 3, 11: 3, 12: 4, 13: 3, 14: 3, 15: 4, 16: 3, 17: 3, 18: 3 },
          reportedTotal: 57, // 김대희(후반 28타)와 57타 동타 -> 후반 29타로 백카운트 2위!
        },
        {
          id: 'sp_6',
          name: '김귀연',
          gender: 'F',
          isGuest: false,
          scores: { 1: 4, 2: 3, 3: 4, 4: 3, 5: 3, 6: 4, 7: 3, 8: 3, 9: 3, 10: 3, 11: 4, 12: 3, 13: 3, 14: 4, 15: 3, 16: 3, 17: 3, 18: 3 },
          reportedTotal: 59,
        },
        {
          id: 'sp_7',
          name: '윤종율',
          gender: 'M',
          isGuest: false,
          scores: { 1: 4, 2: 4, 3: 3, 4: 4, 5: 3, 6: 4, 7: 3, 8: 4, 9: 3, 10: 3, 11: 4, 12: 3, 13: 4, 14: 3, 15: 3, 16: 4, 17: 3, 18: 3 },
          reportedTotal: 62,
        },
      ],
    };

    if (isIndividual) {
      const selfName = ParkOnStorage.getUserDisplayName();
      const myName = selfName && selfName !== '플레이어' && selfName !== '파크골퍼' ? selfName : '김대희';
      const indSample: QuickScoreGroup = {
        ...sample1,
        groupNumber: '우리 조',
        players: sample1.players.map((pl, idx) =>
          idx === 0 ? { ...pl, name: myName } : { ...pl, isGuest: false }
        ),
      };
      setGroups([indSample]);
      setSelectedCourses(['A', 'B']);
      setActiveGroupIdx(0);
      setOcrNotice('✨ 4인(18홀) 종이 스코어카드 샘플을 불러왔습니다. 선수 이름이나 홀 타수 칸을 탭하면 수정 팝업이 열립니다!');
      setStep('REVIEW');
      return;
    }
    setGroups([sample1, sample2]);
    setSelectedCourses(['A', 'B']);
    setActiveGroupIdx(0);
    setOcrNotice('✨ 2개 조(7명) 샘플 스코어카드를 불러왔습니다. 선수 이름·홀 칸을 탭하면 수정 팝업이 열립니다!');
    setStep('REVIEW');
  };

  const ensureManualGroupAndAddPlayer = (name: string, gender: 'M' | 'F', isGuest: boolean, totalVal: number) => {
    const clean = name.trim();
    if (!clean) return;
    const newPlayer: QuickScorePlayer = {
      id: `mp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: clean,
      gender,
      isGuest,
      scores: {},
      reportedTotal: Math.max(9, totalVal || 60),
      useDirectTotal: true,
    };

    setGroups((prev) => {
      if (prev.length === 0) {
        return [
          {
            groupId: `grp_manual_${Date.now()}`,
            groupNumber: '1조',
            courseName: courseName || club?.homeCourseName || '파크골프장',
            date: heldDate,
            courses: selectedCourses,
            players: [newPlayer],
          },
        ];
      }
      const next = [...prev];
      const targetIdx = Math.min(activeGroupIdx, next.length - 1);
      next[targetIdx] = {
        ...next[targetIdx],
        players: [...next[targetIdx].players, newPlayer],
      };
      return next;
    });
  };

  const updatePlayer = (groupId: string, playerId: string, updater: (p: QuickScorePlayer) => QuickScorePlayer) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.groupId !== groupId
          ? g
          : { ...g, players: g.players.map((p) => (p.id === playerId ? updater(p) : p)) }
      )
    );
  };

  const deletePlayer = (groupId: string, playerId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.groupId !== groupId ? g : { ...g, players: g.players.filter((p) => p.id !== playerId) }
      )
    );
    if (editingPlayerCtx?.playerId === playerId) setEditingPlayerCtx(null);
  };

  const addPlayerToGroup = (groupId: string) => {
    const newP: QuickScorePlayer = {
      id: `qp_add_${Date.now()}`,
      name: '',
      gender: 'M',
      isGuest: false,
      scores: {},
      reportedTotal: 60,
      useDirectTotal: true,
    };
    setGroups((prev) =>
      prev.map((g) => (g.groupId !== groupId ? g : { ...g, players: [...g.players, newP] }))
    );
    setEditingPlayerCtx({ groupId, playerId: newP.id });
  };

  const addEmptyGroup = () => {
    const nextNum = groups.length + 1;
    const newG: QuickScoreGroup = {
      groupId: `grp_new_${Date.now()}`,
      groupNumber: `${nextNum}조`,
      courseName: courseName || club?.homeCourseName || '파크골프장',
      date: heldDate,
      courses: selectedCourses,
      players: [],
    };
    setGroups((prev) => [...prev, newG]);
    setActiveGroupIdx(groups.length);
  };

  // 🖼️ [대표님 지시] 개인·클럽 각 조별 100% 공식 양식(1080×1440 풀 홀별 스코어보드) 이미지 생성!
  const handleGenerateOfficialGroupCard = async (targetGroup?: QuickScoreGroup) => {
    const grp = targetGroup || groups[activeGroupIdx] || groups[0];
    if (!grp) return;
    setIsGeneratingCard(true);
    try {
      const matchedCourse = ParkOnStorage.getAllCourses().find(
        (c) => c.name === courseName || c.name.includes(courseName) || courseName.includes(c.name)
      );
      const res = await generateOfficialGroupScoreboardImage(
        { ...grp, courseName: courseName || grp.courseName, date: heldDate, courses: grp.courses?.length ? grp.courses : selectedCourses },
        { course: matchedCourse || null, isClubGroup: !isIndividual }
      );
      if (res?.dataUrl) {
        setCardPreviewTitle(
          isIndividual
            ? `⛳ ${courseName || grp.courseName} 공식 스코어보드`
            : `⛳ ${grp.groupNumber} 공식 스코어보드 (${courseName || grp.courseName})`
        );
        setGeneratedCardUrl(res.dataUrl);
        onShowToast?.(
          isIndividual
            ? '🏆 공식 스코어보드 이미지(1080×1440)가 생성되었습니다!'
            : `🏆 ${grp.groupNumber} 공식 스코어보드 이미지(1080×1440)가 생성되었습니다!`
        );
      }
    } catch (e) {
      console.error('Official group scoreboard image failed:', e);
      onShowToast?.('공식 스코어보드 이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // Generate 1080p Overall Club Traditional Stroke Podium Summary PNG
  const handleGenerate1080pCard = async () => {
    setCardPreviewTitle('🏆 클럽 전체 전통 스트로크 종합 순위표');
    setIsGeneratingCard(true);
    try {
      const canvas = document.createElement('canvas');
      const W = 1080;
      const rowsToRender = divisionMode === 'ALL' ? allRankings : [...maleRankings, ...femaleRankings];
      const H = Math.max(1280, 560 + Math.min(rowsToRender.length, 28) * 58 + 140);
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Rich emerald-gold background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#064e3b');
      grad.addColorStop(0.28, '#047857');
      grad.addColorStop(1, '#f5f5f4');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Header Banner
      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PARKY APP · 파키 앱 공식 전통 스트로크 결과표', W / 2, 74);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px sans-serif';
      ctx.fillText(eventTitle || `${club?.name || '파키'} 스트로크 시합`, W / 2, 140);

      ctx.fillStyle = '#d1fae5';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(
        `📍 ${courseName}   |   📅 ${heldDate}   |   🏌️ ${totalPlayersCount}명 참가 (${totalHolesCount}홀)`,
        W / 2,
        192
      );

      // Top 3 Podium Cards
      const officialTop = allRankings.filter((r) => r.officialRank !== null && !r.isGraceWinner).slice(0, 3);
      const podiumColors = ['#f59e0b', '#94a3b8', '#d97706'];
      const podiumLabels = ['🏆 1위 우승', '🥈 2위 준우승', '🥉 3위'];
      officialTop.forEach((row, idx) => {
        const cardW = 300;
        const gap = 30;
        const startX = (W - (cardW * officialTop.length + gap * (officialTop.length - 1))) / 2;
        const x = startX + idx * (cardW + gap);
        const y = 230;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(x, y, cardW, 175, 22);
        ctx.fill();
        ctx.strokeStyle = podiumColors[idx];
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.fillStyle = podiumColors[idx];
        ctx.font = '900 26px sans-serif';
        ctx.fillText(podiumLabels[idx], x + cardW / 2, y + 48);

        ctx.fillStyle = '#1c1917';
        ctx.font = '900 36px sans-serif';
        ctx.fillText(row.player.name, x + cardW / 2, y + 104);

        ctx.fillStyle = '#047857';
        ctx.font = '900 30px sans-serif';
        const diffStr = row.parDiff === 0 ? 'E' : row.parDiff > 0 ? `+${row.parDiff}` : `${row.parDiff}`;
        ctx.fillText(`${row.totalStrokes}타 (${diffStr})`, x + cardW / 2, y + 150);
      });

      // Ranking Table Card
      const tableY = 435;
      const tableH = H - tableY - 95;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(48, tableY, W - 96, tableH, 26);
      ctx.fill();

      // Table Header
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.roundRect(48, tableY, W - 96, 62, [26, 26, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('순위', 88, tableY + 40);
      ctx.fillText('성명', 245, tableY + 40);
      ctx.fillText('조 / 구분', 500, tableY + 40);
      ctx.textAlign = 'right';
      ctx.fillText('최종 타수', 825, tableY + 40);
      ctx.fillText('후반(백카운트)', 995, tableY + 40);

      rowsToRender.slice(0, 28).forEach((row, i) => {
        const ry = tableY + 62 + i * 56;
        if (i % 2 === 1) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(52, ry, W - 104, 56);
        }
        ctx.textAlign = 'left';
        ctx.fillStyle = row.officialRank === 1 ? '#b45309' : row.player.isGuest ? '#78716c' : '#1c1917';
        ctx.font = row.officialRank && row.officialRank <= 3 ? '900 25px sans-serif' : 'bold 23px sans-serif';
        ctx.fillText(row.displayRankLabel, 88, ry + 37);

        const nameLabel = row.player.isGuest ? `${row.player.name} [게스트]` : row.player.name;
        ctx.fillText(nameLabel, 245, ry + 37);

        ctx.fillStyle = '#57534e';
        ctx.font = 'bold 21px sans-serif';
        ctx.fillText(`${row.groupNumber} · ${row.player.gender === 'F' ? '여자' : '남자'}`, 500, ry + 37);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#065f46';
        ctx.font = '900 26px sans-serif';
        ctx.fillText(`${row.totalStrokes}타`, 825, ry + 37);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`${row.backCourseScore}타`, 995, ry + 37);
      });

      // Footer watermark
      ctx.textAlign = 'center';
      ctx.fillStyle = '#44403c';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(
        `파키 앱 (PARKY APP) · 전통 스트로크 공식 집계 (${useBackcount ? '백카운트 적용' : '동타 공동순위'})`,
        W / 2,
        H - 36
      );

      const url = canvas.toDataURL('image/png');
      setGeneratedCardUrl(url);
      onShowToast?.('🏆 1080p 공식 스트로크 결과표 이미지가 생성되었습니다!');
    } catch (e) {
      console.error('Card generation failed:', e);
      onShowToast?.('결과표 이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingCard(false);
    }
  };

  const triggerDownload = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyKakaoText = async () => {
    const lines: string[] = [];
    lines.push(`⛳ [${eventTitle || (club?.name || '나의 라운드')}] 전통 스트로크 최종 순위`);
    lines.push(`📍 구장: ${courseName} (${totalHolesCount}홀)`);
    lines.push(`📅 일자: ${heldDate} · 참가 ${totalPlayersCount}명`);
    if (useBackcount) lines.push(`📏 동타 처리: 백카운트(후반 코스 저타수 우선)`);
    lines.push('');

    const formatList = (rows: RankedStrokeRow[], heading?: string) => {
      if (heading) lines.push(heading);
      rows.forEach((r) => {
        const diff = r.parDiff === 0 ? 'E' : r.parDiff > 0 ? `+${r.parDiff}` : `${r.parDiff}`;
        const badge = r.prizeLabel ? ` ${r.prizeLabel}` : '';
        const guestTag = r.player.isGuest ? ' [게스트]' : '';
        lines.push(`${r.displayRankLabel} ${r.player.name}${guestTag} — ${r.totalStrokes}타 (${diff})${badge}`);
      });
      lines.push('');
    };

    if (divisionMode === 'GENDER') {
      formatList(maleRankings, '👨 [남자부 순위]');
      formatList(femaleRankings, '👩 [여자부 순위]');
    } else {
      formatList(allRankings, '🏆 [전체 순위]');
    }
    lines.push('✨ 파키 앱 (PARKY APP)으로 1초 집계됨');

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedSummary(true);
      onShowToast?.('📋 카톡·밴드용 순위표 텍스트가 복사되었습니다!');
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      onShowToast?.('클립보드 복사에 실패했습니다.');
    }
  };

  const handleSaveToClubChronicle = () => {
    if (!club) return;
    const officialTop = allRankings.filter((r) => r.officialRank !== null && !r.isGraceWinner);
    const winner = officialTop[0] || allRankings[0];
    if (!winner) {
      onShowToast?.('저장할 선수 기록이 없습니다.');
      return;
    }

    const scorecardPhotos = groups
      .filter((g) => Boolean(g.imageUrl))
      .map((g) => ({ groupNumber: g.groupNumber, imageUrl: g.imageUrl! }));

    const cid = activeChronicleId || `quick_stroke_${Date.now()}`;
    if (!activeChronicleId) setActiveChronicleId(cid);

    const chronicle: ClubChronicleTournament = {
      id: cid,
      clubId: club.id,
      clubName: (club?.name || '나의 라운드'),
      title: eventTitle || `${club?.name || '파키'} 스트로크 시합`,
      heldAt: heldDate,
      courseId: club?.homeCourseId || 'course_custom',
      courseName: courseName || club?.homeCourseName || '파크골프장',
      totalHoles: totalHolesCount,
      gameMode: '전통 스트로크',
      totalParticipants: totalPlayersCount,
      winnerName: winner.player.name,
      winnerScore: winner.totalStrokes,
      runnerUpName: officialTop[1]?.player.name,
      runnerUpScore: officialTop[1]?.totalStrokes,
      thirdPlaceName: officialTop[2]?.player.name,
      thirdPlaceScore: officialTop[2]?.totalStrokes,
      medalistName: allRankings[0]?.player.name,
      medalistScore: allRankings[0]?.totalStrokes,
      awardCardUrl: generatedCardUrl || initialChronicle?.awardCardUrl || undefined,
      groupPhotoUrl: initialChronicle?.groupPhotoUrl || undefined,
      eventPhotos: initialChronicle?.eventPhotos || undefined,
      accountingItems: initialChronicle?.accountingItems || undefined,
      magazineStory: initialChronicle?.magazineStory || undefined,
      scorecardPhotos: scorecardPhotos.length > 0 ? scorecardPhotos : initialChronicle?.scorecardPhotos,
      quickScoreGroups: groups,
      quickScoreSettings: {
        divisionMode,
        useBackcount,
        excludeGuestsFromAwards,
        graceWinnerName,
        selectedCourses,
      },
      rankings: allRankings.map((r, i) => ({
        rank: r.officialRank ?? i + 1,
        playerId: r.player.id,
        playerName: r.player.name,
        groupNumber: parseInt(r.groupNumber.replace(/\D/g, ''), 10) || 1,
        totalStrokes: r.totalStrokes,
        parDiff: r.parDiff,
        isWinner: r.officialRank === 1,
        isGuest: r.player.isGuest,
        gender: r.player.gender,
        awards: r.prizeLabel ? [r.prizeLabel] : undefined,
      })),
      notes: `전통 스트로크 자동 집계 (${useBackcount ? '백카운트 적용' : '공동순위'} · ${
        excludeGuestsFromAwards ? '게스트 시상 제외' : '게스트 포함'
      })`,
      archivedAt: new Date().toISOString(),
    };

    let updatedClub = ClubStorage.saveQuickStrokeTournamentChronicle(club.id, chronicle);
    let addedProvisional = 0;

    if (autoRegisterProvisional && unregisteredRegularPlayers.length > 0) {
      const regRes = ClubStorage.registerProvisionalMembers(club.id, unregisteredRegularPlayers);
      if (regRes.club) {
        updatedClub = regRes.club;
        addedProvisional = regRes.addedCount;
      }
    }

    if (updatedClub && onClubUpdated) {
      onClubUpdated(updatedClub);
    }

    const msg =
      addedProvisional > 0
        ? `✅ 클럽 연대기 & 원본 사진 저장 완료! 신규 정회원 ${addedProvisional}명 가등록됨 (회원관리에서 전화번호 입력 시 최종 확정)`
        : `✅ 클럽 영구 연대기 및 조별 원본 스코어카드 저장 완료!`;
    setSavedArchiveMsg(msg);
    onShowToast?.(msg);
  };

  const activeGroup = groups[Math.min(activeGroupIdx, Math.max(0, groups.length - 1))] || null;

  return (
    <div
      data-testid="club-quick-scoring-modal"
      className="fixed inset-0 z-[95] bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
    >
      <div className="bg-white w-full max-w-2xl max-h-[94vh] rounded-3xl shadow-2xl border-2 border-emerald-500 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-amber-300 shrink-0" />
              <h3 className="font-black text-sm sm:text-base truncate">
                {isIndividual ? '종이 스코어카드 사진 판독 · 연대기 등록' : '사진 판독 · 전통 스트로크 빠른 등수 계산기'}
              </h3>
            </div>
            <p className="text-[11px] text-emerald-200 font-bold truncate">
              {isIndividual ? '사진 촬영으로 사후 연대기 자동 등록 · 공식 스코어보드 저장' : `${club?.name || '클럽'} · 공고 없이 바로 채점 · 조별 공식 스코어보드 저장`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer shrink-0 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3-Step Navigation Bar */}
        <div className="px-3 py-2 bg-stone-100 border-b border-stone-200 grid grid-cols-3 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setStep('INPUT')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer ${
              step === 'INPUT'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-emerald-50'
            }`}
          >
            ① 촬영 · 입력
          </button>
          <button
            type="button"
            disabled={groups.length === 0}
            onClick={() => setStep('REVIEW')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1 ${
              step === 'REVIEW'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-emerald-50'
            }`}
          >
            <span>② 1초 검수 ({totalPlayersCount}명)</span>
            {mathErrorCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px]">
                !{mathErrorCount}
              </span>
            )}
          </button>
          <button
            type="button"
            disabled={totalPlayersCount === 0}
            onClick={() => setStep('RANKING')}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-black transition cursor-pointer disabled:opacity-40 ${
              step === 'RANKING'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-amber-50'
            }`}
          >
            ③ 등수표 · 저장
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 overscroll-contain">
          {/* ================================================================= */}
          {/* STEP 1: 촬영 / 빠른 입력                                            */}
          {/* ================================================================= */}
          {step === 'INPUT' && (
            <div className="space-y-3.5">
              {/* 시합 제목 / 구장 / 코스 선택 */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-black text-stone-700 block mb-1">시합/모임 제목</label>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-stone-700 block mb-1">구장명 · 일자</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className="flex-1 px-2.5 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900"
                      />
                      <input
                        type="date"
                        value={heldDate}
                        onChange={(e) => setHeldDate(e.target.value)}
                        className="w-[126px] px-2 py-2 bg-white border border-stone-300 rounded-xl text-[11px] font-bold text-stone-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] font-black text-stone-700">
                    진행 코스 ({totalHolesCount}홀 · 전통 스트로크 기준)
                  </span>
                  <div className="flex gap-1.5">
                    {COURSE_LETTERS.map((letter) => {
                      const active = selectedCourses.includes(letter);
                      return (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => {
                            setSelectedCourses((prev) => {
                              if (prev.includes(letter)) {
                                return prev.length > 1 ? prev.filter((c) => c !== letter) : prev;
                              }
                              return [...prev, letter].sort();
                            });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black border cursor-pointer transition ${
                            active
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-white text-stone-600 border-stone-300'
                          }`}
                        >
                          {letter}코스
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 입력 방식 전환 탭 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode('PHOTO')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black border-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    inputMode === 'PHOTO'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                      : 'bg-white border-stone-200 text-stone-600'
                  }`}
                >
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span>📸 종이 스코어카드 사진 판독</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('MANUAL')}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-black border-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    inputMode === 'MANUAL'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                      : 'bg-white border-stone-200 text-stone-600'
                  }`}
                >
                  <Edit3 className="w-4 h-4 text-emerald-700" />
                  <span>⌨️ 사진 없이 빠른 타수 입력</span>
                </button>
              </div>

              {inputMode === 'PHOTO' ? (
                <div className="bg-emerald-50/70 border-2 border-dashed border-emerald-400 rounded-2xl p-4 space-y-3 text-center">
                  {/* 📷 카메라 직접 촬영 전용 (모바일 후면 카메라 즉시 실행) */}
                  <input
                    ref={cameraInputRef}
                    data-testid="input-quick-scoring-camera"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {/* 🖼️ 갤러리(앨범) 다중 선택 전용 (capture 없음 → 앨범 바로 열림) */}
                  <input
                    ref={fileInputRef}
                    data-testid="input-quick-scoring-gallery"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-black text-emerald-950">
                      {isIndividual
                        ? '스코어카드 사진을 카메라로 찍거나 갤러리에서 선택하세요'
                        : '조별 스코어카드 사진을 카메라로 찍거나 갤러리에서 선택하세요'}
                    </p>
                    <p className="text-[11px] text-emerald-800 font-bold">
                      AI가 이름 · 홀별 타수 · 총타수를 판독하고 자동 검산합니다 (원본 사진 자동 보관)
                    </p>
                  </div>

                  {/* 📸 2대 필수 버튼: [카메라로 촬영] vs [갤러리에서 선택] 항상 동시 제공 */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      data-testid="btn-quick-scoring-camera"
                      onClick={() => cameraInputRef.current?.click()}
                      className="py-3 px-2.5 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition whitespace-nowrap"
                    >
                      <Camera className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>카메라로 촬영</span>
                    </button>
                    <button
                      type="button"
                      data-testid="btn-quick-scoring-gallery"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-3 px-2.5 bg-gradient-to-r from-teal-700 to-cyan-800 hover:from-teal-600 hover:to-cyan-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition whitespace-nowrap"
                    >
                      <ImageIcon className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>갤러리에서 선택</span>
                    </button>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      data-testid="btn-quick-scoring-load-sample"
                      onClick={handleLoadSampleGroups}
                      className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-xs border border-amber-500 flex items-center gap-1 cursor-pointer active:scale-95 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isIndividual ? '✨ 4인 스코어카드 샘플 체험' : '✨ 2개 조 샘플 체험'}</span>
                    </button>
                  </div>

                  {stagedPhotos.length > 0 && (
                    <div className="space-y-2.5 pt-2 text-left">
                      <div className="text-xs font-black text-emerald-900">
                        선택된 스코어카드 사진 ({stagedPhotos.length}개 조)
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {stagedPhotos.map((src, idx) => (
                          <div key={idx} className="relative rounded-xl overflow-hidden border-2 border-emerald-400 bg-white aspect-[4/3]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={src} alt={`${idx + 1}조`} className="w-full h-full object-cover" />
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-900/85 text-white text-[10px] font-black rounded">
                              {idx + 1}조
                            </span>
                            <button
                              type="button"
                              onClick={() => setStagedPhotos((prev) => prev.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={isParsingOcr}
                        onClick={handleRunOcr}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg cursor-pointer transition flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>
                          {isParsingOcr
                            ? `AI가 ${stagedPhotos.length}개 조 스코어카드를 판독 · 검산 중...`
                            : `⚡ ${stagedPhotos.length}개 조 AI 자동 판독 & 검산 시작`}
                        </span>
                      </button>
                    </div>
                  )}

                  {ocrNotice && (
                    <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 text-left">
                      {ocrNotice}
                    </div>
                  )}
                </div>
              ) : (
                /* Manual Fast Total Entry */
                <div className="bg-white border-2 border-emerald-300 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-stone-900">
                      ⚡ 참가자 이름 &amp; 최종 타수 빠른 추가 (기본 정회원 · 손님만 게스트 체크)
                    </span>
                    <span className="text-[11px] font-black text-emerald-700">현재 {totalPlayersCount}명</span>
                  </div>

                  {/* Quick Club Member Chips */}
                  {(club?.members || []) && (club?.members || []).length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-stone-500">우리 클럽 회원 원터치 선택:</span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {(club?.members || []).slice(0, 24).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setManualName(m.name);
                              setManualGender(m.gender || 'M');
                              setManualIsGuest(false);
                            }}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-emerald-100 border border-stone-200 rounded-lg text-[11px] font-bold text-stone-800 cursor-pointer"
                          >
                            + {m.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-12 gap-1.5 items-center">
                    <input
                      type="text"
                      data-testid="input-quick-manual-name"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="성명 (예: 홍길동)"
                      className="col-span-5 px-2.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-black text-stone-900"
                    />
                    <input
                      type="number"
                      data-testid="input-quick-manual-total"
                      value={manualTotal}
                      onChange={(e) => setManualTotal(e.target.value)}
                      placeholder="타수"
                      className="col-span-3 px-2 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-black text-center text-emerald-900"
                    />
                    <button
                      type="button"
                      onClick={() => setManualGender((g) => (g === 'M' ? 'F' : 'M'))}
                      className={`col-span-2 py-2.5 rounded-xl text-xs font-black border cursor-pointer ${
                        manualGender === 'F'
                          ? 'bg-pink-50 border-pink-300 text-pink-700'
                          : 'bg-blue-50 border-blue-300 text-blue-700'
                      }`}
                    >
                      {manualGender === 'F' ? '여' : '남'}
                    </button>
                    <button
                      type="button"
                      data-testid="btn-quick-manual-guest-toggle"
                      onClick={() => setManualIsGuest((v) => !v)}
                      className={`col-span-2 py-2.5 rounded-xl text-[11px] font-black border cursor-pointer ${
                        manualIsGuest
                          ? 'bg-amber-400 border-amber-500 text-stone-950'
                          : 'bg-stone-100 border-stone-300 text-stone-500'
                      }`}
                    >
                      {manualIsGuest ? '게스트✓' : '정회원'}
                    </button>
                  </div>

                  <button
                    type="button"
                    data-testid="btn-quick-manual-add"
                    onClick={() => {
                      if (!manualName.trim()) return;
                      ensureManualGroupAndAddPlayer(
                        manualName,
                        manualGender,
                        manualIsGuest,
                        parseInt(manualTotal, 10) || 60
                      );
                      setManualName('');
                      setManualIsGuest(false);
                    }}
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>명단에 추가</span>
                  </button>

                  {totalPlayersCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setStep('REVIEW')}
                      className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm rounded-xl shadow-sm cursor-pointer"
                    >
                      ② 입력된 {totalPlayersCount}명 검수 &amp; 등수표 보기 ▶
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 2: 1초 검수 & 이름/타수/게스트 수정                            */}
          {/* ================================================================= */}
          {step === 'REVIEW' && (
            <div className="space-y-3">
              {ocrNotice && (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-950">
                  {ocrNotice}
                </div>
              )}

              {/* Group Tabs + Add Group */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {groups.map((g, idx) => {
                  const hasErr = g.players.some(
                    (p) => !p.useDirectTotal && p.reportedTotal > 0 && getPlayerCalcTotal(p, g.courses) !== p.reportedTotal
                  );
                  return (
                    <button
                      key={g.groupId}
                      type="button"
                      onClick={() => setActiveGroupIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 border cursor-pointer flex items-center gap-1 ${
                        activeGroupIdx === idx
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      <span>{g.groupNumber} ({g.players.length}명)</span>
                      {hasErr && <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={addEmptyGroup}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-black bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 shrink-0 cursor-pointer"
                >
                  + 조 추가
                </button>
              </div>

              {activeGroup && (
                <div className="space-y-3">
                  {/* Collapsible Original Scorecard Photo */}
                  {activeGroup.imageUrl && (
                    <div className="border-2 border-emerald-200 rounded-2xl overflow-hidden bg-stone-50">
                      <div className="px-3 py-2 bg-emerald-50 flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{activeGroup.groupNumber} 원본 스코어카드 사진 (비교 확인용)</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setZoomedPhotoUrl(activeGroup.imageUrl!)}
                            className="px-2 py-1 bg-white border border-emerald-300 rounded-lg text-[10px] font-black text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                          >
                            <ZoomIn className="w-3 h-3" />
                            <span>크게 보기</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowOriginalPhotoPanel((v) => !v)}
                            className="px-2 py-1 bg-white border border-stone-300 rounded-lg text-[10px] font-bold text-stone-700 flex items-center gap-0.5 cursor-pointer"
                          >
                            {showOriginalPhotoPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            <span>{showOriginalPhotoPanel ? '접기' : '펼치기'}</span>
                          </button>
                        </div>
                      </div>
                      {showOriginalPhotoPanel && (
                        <div
                          onClick={() => setZoomedPhotoUrl(activeGroup.imageUrl!)}
                          className="p-2 flex justify-center cursor-zoom-in bg-stone-100"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={activeGroup.imageUrl}
                            alt={`${activeGroup.groupNumber} 원본`}
                            className="max-h-44 rounded-xl object-contain shadow-xs border border-stone-300"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 📋 [대표님 지시] 공식 스코어보드 양식(A/B코스 1H~9H) 그대로 표시 · 탭하면 수정 팝업 오픈! */}
                  <div className="space-y-2.5">
                    <OfficialGroupScoreboard
                      group={{
                        ...activeGroup,
                        courseName: courseName || activeGroup.courseName,
                        courses: activeGroup.courses?.length ? activeGroup.courses : selectedCourses,
                      }}
                      course={
                        ParkOnStorage.getAllCourses().find(
                          (c) => c.name === courseName || c.name.includes(courseName)
                        ) || null
                      }
                      showClubGroupHeader={!isIndividual}
                      onTapPlayer={(gId, pId, hNum) =>
                        setEditingPlayerCtx({ groupId: gId, playerId: pId, activeHole: hNum || 1 })
                      }
                      onFixMathMismatch={(gId, pId, calcTot) =>
                        updatePlayer(gId, pId, (p) => ({ ...p, reportedTotal: calcTot }))
                      }
                    />

                    <button
                      type="button"
                      onClick={() => addPlayerToGroup(activeGroup.groupId)}
                      className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-black text-xs rounded-xl border border-dashed border-stone-400 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ {activeGroup.groupNumber}에 선수 추가</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Proceed CTA */}
              <button
                type="button"
                data-testid="btn-go-to-stroke-ranking"
                disabled={totalPlayersCount === 0}
                onClick={() => setStep('RANKING')}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 text-stone-950 font-black text-sm rounded-2xl shadow-md border border-amber-600/30 cursor-pointer transition"
              >
                {isIndividual ? `🏆 공식 스코어보드 확정 & 연대기 자동 등록 (${totalPlayersCount}명) ▶` : `🏆 조별 공식 스코어보드 & 전체 등수표 보기 (${totalPlayersCount}명) ▶`}
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 3: 🏆 전통 스트로크 등수표 + 자동 연대기 등록 + 수정/삭제     */}
          {/* ================================================================= */}
          {step === 'RANKING' && (
            <div className="space-y-3.5">
              {/* 📜 자동 연대기 등록 상태 바 & 즉시 삭제 */}
              <div
                data-testid="auto-chronicle-status-bar"
                className="px-3 py-2 bg-emerald-100/90 border-2 border-emerald-400 rounded-2xl flex items-center justify-between gap-2 flex-wrap"
              >
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    {isIndividual ? '나의 파크골프 연대기에 자동 등록됨' : '클럽 연대기에 자동 등록됨'}{autoSavedAt ? ` (${autoSavedAt})` : ''} · 탭하여 수정 시 실시간 반영
                  </span>
                </div>
                {!confirmDeleteChronicle ? (
                  <button
                    type="button"
                    data-testid="btn-delete-active-chronicle"
                    onClick={() => setConfirmDeleteChronicle(true)}
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>연대기 삭제</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      data-testid="btn-confirm-delete-active-chronicle"
                      onClick={() => {
                        if (!activeChronicleId) return;
                        isDeletedRef.current = true;
                        if (isIndividual) {
                          ParkOnStorage.deleteCompletedRound(activeChronicleId);
                          window.dispatchEvent(new Event('storage'));
                          onShowToast?.('🗑️ 해당 라운드가 나의 연대기에서 삭제되었습니다.');
                        } else if (club) {
                          const updated = ClubStorage.deleteClubChronicle(club.id, activeChronicleId);
                          if (updated && onClubUpdated) onClubUpdated(updated);
                          onShowToast?.('🗑️ 해당 시합 기록이 클럽 연대기에서 삭제되었습니다.');
                        }
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-black cursor-pointer"
                    >
                      삭제 확정
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteChronicle(false)}
                      className="px-2 py-1 bg-stone-200 text-stone-700 rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                )}
              </div>

              {/* 📋 [대표님 지시] 개인 = 공식 스코어보드 그대로 / 클럽 = 조별 공식 스코어보드 + 전체 순위표 듀얼 뷰 */}
              {!isIndividual && (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    data-testid="btn-step3-view-groups"
                    onClick={() => setRankingSubView('GROUPS')}
                    className={`py-2 px-2 rounded-xl text-xs font-black border-2 cursor-pointer transition ${
                      rankingSubView === 'GROUPS'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                        : 'bg-white text-stone-700 border-stone-200'
                    }`}
                  >
                    📋 각 조별 공식 스코어보드 ({groups.length}개 조)
                  </button>
                  <button
                    type="button"
                    data-testid="btn-step3-view-overall"
                    onClick={() => setRankingSubView('OVERALL')}
                    className={`py-2 px-2 rounded-xl text-xs font-black border-2 cursor-pointer transition ${
                      rankingSubView === 'OVERALL'
                        ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm'
                        : 'bg-white text-stone-700 border-stone-200'
                    }`}
                  >
                    🏆 전체 전통 스트로크 순위 ({allRankings.length}명)
                  </button>
                </div>
              )}

              {(isIndividual || rankingSubView === 'GROUPS') && (
                <div data-testid="step3-official-group-scoreboards" className="space-y-4">
                  {groups.map((grp) => (
                    <div key={grp.groupId} className="space-y-2">
                      <OfficialGroupScoreboard
                        group={{
                          ...grp,
                          courseName: courseName || grp.courseName,
                          courses: grp.courses?.length ? grp.courses : selectedCourses,
                        }}
                        course={
                          ParkOnStorage.getAllCourses().find(
                            (c) => c.name === courseName || c.name.includes(courseName)
                          ) || null
                        }
                        showClubGroupHeader={!isIndividual}
                        onTapPlayer={(gId, pId, hNum) =>
                          setEditingPlayerCtx({ groupId: gId, playerId: pId, activeHole: hNum || 1 })
                        }
                        onFixMathMismatch={(gId, pId, calcTot) =>
                          updatePlayer(gId, pId, (p) => ({ ...p, reportedTotal: calcTot }))
                        }
                      />
                      <button
                        type="button"
                        data-testid={`btn-save-official-group-img-${grp.groupNumber}`}
                        disabled={isGeneratingCard}
                        onClick={() => handleGenerateOfficialGroupCard(grp)}
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 text-white font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ImageIcon className="w-4 h-4 text-amber-300" />
                        <span>
                          {isGeneratingCard
                            ? '공식 스코어보드 이미지 생성 중...'
                            : isIndividual
                            ? '🖼️ 공식 스코어보드 이미지 저장 (1080×1440 풀 양식)'
                            : `🖼️ ${grp.groupNumber} 공식 스코어보드 이미지 저장 (1080×1440 풀 양식)`}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!isIndividual && rankingSubView === 'OVERALL' && (
                <>
              {/* Traditional Stroke Rule Controls */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <span className="text-xs font-black text-emerald-950">
                    ⛳ 전통 스트로크 채점 기준 (저타수 우선)
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setDivisionMode('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ${
                        divisionMode === 'ALL'
                          ? 'bg-emerald-800 text-white'
                          : 'bg-white text-stone-600 border border-stone-300'
                      }`}
                    >
                      통합 순위
                    </button>
                    <button
                      type="button"
                      onClick={() => setDivisionMode('GENDER')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ${
                        divisionMode === 'GENDER'
                          ? 'bg-emerald-800 text-white'
                          : 'bg-white text-stone-600 border border-stone-300'
                      }`}
                    >
                      남/여 분리
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setUseBackcount((v) => !v)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black border cursor-pointer ${
                      useBackcount
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-stone-600 border-stone-300'
                    }`}
                  >
                    {useBackcount ? '✓ 동타: 백카운트(후반 저타수)' : '동타: 공동 순위'}
                  </button>
                  <button
                    type="button"
                    data-testid="btn-toggle-exclude-guests"
                    onClick={() => setExcludeGuestsFromAwards((v) => !v)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black border cursor-pointer ${
                      excludeGuestsFromAwards
                        ? 'bg-amber-400 text-stone-950 border-amber-500'
                        : 'bg-white text-stone-600 border-stone-300'
                    }`}
                  >
                    {excludeGuestsFromAwards ? '✓ 게스트 시상 제외 (번외 표시)' : '게스트 포함 전체 등수'}
                  </button>
                </div>

                {/* Winner Grace Input (독식 방지) */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-stone-600 shrink-0">🛡️ 직전 우승자 독식방지:</span>
                  <input
                    type="text"
                    value={graceWinnerName}
                    onChange={(e) => setGraceWinnerName(e.target.value)}
                    placeholder="성명 입력 시 1위 상품 차순위 승계 (선택)"
                    className="flex-1 px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-[11px] font-bold"
                  />
                </div>
              </div>

              {/* Ranking Tables (with 1-tap post-ranking edit!) */}
              {(divisionMode === 'ALL'
                ? [{ title: `🏆 전체 전통 스트로크 순위 (${allRankings.length}명)`, rows: allRankings }]
                : [
                    { title: `👨 남자부 순위 (${maleRankings.length}명)`, rows: maleRankings },
                    { title: `👩 여자부 순위 (${femaleRankings.length}명)`, rows: femaleRankings },
                  ]
              ).map((section) => (
                <div key={section.title} className="border-2 border-stone-200 rounded-2xl overflow-hidden bg-white">
                  <div className="px-3.5 py-2 bg-stone-900 text-white text-xs font-black flex items-center justify-between">
                    <span>{section.title}</span>
                    <span className="text-[10px] text-amber-300 font-bold">선수 줄 [✏️ 수정] 시 즉시 재정렬</span>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {section.rows.map((row) => {
                      const diffStr =
                        row.parDiff === 0 ? 'E' : row.parDiff > 0 ? `+${row.parDiff}` : `${row.parDiff}`;
                      return (
                        <div
                          key={`${section.title}_${row.player.id}`}
                          data-testid={`ranking-row-${row.player.name}`}
                          className={`px-3 py-2.5 flex items-center justify-between gap-2 ${
                            row.officialRank === 1
                              ? 'bg-amber-50/80'
                              : row.player.isGuest
                              ? 'bg-stone-50'
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-black shrink-0 ${
                                row.officialRank === 1
                                  ? 'bg-amber-400 text-stone-950'
                                  : row.officialRank === 2
                                  ? 'bg-slate-200 text-slate-900'
                                  : row.officialRank === 3
                                  ? 'bg-orange-200 text-orange-950'
                                  : row.officialRank === null
                                  ? 'bg-stone-200 text-stone-600 text-[10px]'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {row.displayRankLabel}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="font-black text-sm text-stone-900 truncate">
                                  {row.player.name}
                                </span>
                                {row.player.isGuest && (
                                  <span className="text-[10px] font-black px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-300 rounded">
                                    게스트
                                  </span>
                                )}
                                {row.prizeLabel && (
                                  <span className="text-[10px] font-black px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded">
                                    {row.prizeLabel}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-stone-500 font-bold">
                                {row.groupNumber} · {row.player.gender === 'F' ? '여' : '남'} · 후반 {row.backCourseScore}타
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <div className="font-black text-base text-emerald-900 leading-tight">
                                {row.totalStrokes}타
                              </div>
                              <div className="text-[10px] font-bold text-stone-500">({diffStr})</div>
                            </div>
                            <button
                              type="button"
                              data-testid={`btn-post-edit-${row.player.name}`}
                              onClick={() =>
                                setEditingPlayerCtx({
                                  groupId: row.groupId,
                                  playerId: row.player.id,
                                  activeHole: 1,
                                })
                              }
                              className="px-2 py-1.5 bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 border border-stone-300 rounded-lg text-[11px] font-black cursor-pointer"
                            >
                              ✏️ 수정
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

                </>
              )}

              {/* Unregistered Regular Members Provisional Auto-Add Notice */}
              {!isIndividual && unregisteredRegularPlayers.length > 0 && (
                <div className="p-3 bg-indigo-50 border-2 border-indigo-200 rounded-2xl space-y-1.5">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRegisterProvisional}
                      onChange={(e) => setAutoRegisterProvisional(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-indigo-600"
                    />
                    <div className="text-xs">
                      <div className="font-black text-indigo-950">
                        ✨ 미등록 정회원 {unregisteredRegularPlayers.length}명을 우리 클럽 명단에 가등록 (게스트 제외)
                      </div>
                      <div className="text-[11px] text-indigo-700 font-bold mt-0.5">
                        대상: {unregisteredRegularPlayers.map((u) => u.name).join(', ')} · 추후 회원관리에서{' '}
                        <strong className="underline">전화번호 입력 시 최종 확정</strong>됩니다.
                      </div>
                    </div>
                  </label>
                </div>
              )}

              {savedArchiveMsg && (
                <div
                  data-testid="quick-scoring-saved-banner"
                  className="p-3 bg-emerald-100 border-2 border-emerald-500 rounded-2xl text-xs font-black text-emerald-950"
                >
                  {savedArchiveMsg}
                </div>
              )}

              {/* Export & Archive Action Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  data-testid="btn-generate-1080p-card"
                  disabled={isGeneratingCard}
                  onClick={() => (isIndividual ? handleGenerateOfficialGroupCard(groups[0]) : handleGenerate1080pCard())}
                  className="py-3 px-3 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <span>
                    {isGeneratingCard
                      ? '이미지 생성 중...'
                      : isIndividual
                      ? '🖼️ 공식 스코어보드 저장'
                      : '🏆 전체 종합 순위표 이미지'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyKakaoText}
                  className="py-3 px-3 bg-[#FEE500] hover:bg-[#FDD835] text-stone-950 font-black text-xs rounded-xl shadow-sm border border-[#E6CF00] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedSummary ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSummary ? '복사 완료!' : '📋 카톡 · 밴드 순위표 1초 복사'}</span>
                </button>

                {!isIndividual ? (
                  <button
                    type="button"
                    data-testid="btn-save-club-chronicle"
                    onClick={handleSaveToClubChronicle}
                    className="sm:col-span-2 py-3.5 px-4 bg-stone-900 hover:bg-black text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-amber-300" />
                    <span>
                      📜 클럽 연대기 + 조별 원본 사진 확정
                      {autoRegisterProvisional && unregisteredRegularPlayers.length > 0
                        ? ` (+ 신규 ${unregisteredRegularPlayers.length}명 가등록)`
                        : ''}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid="btn-finish-personal-chronicle"
                    onClick={onClose}
                    className="sm:col-span-2 py-3.5 px-4 bg-stone-900 hover:bg-black text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>✓ 나의 파크골프 연대기 등록 완료 (닫기)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUB-MODAL 1: 1-Tap Player Name / Hole Score / Total Editor            */}
      {/* ===================================================================== */}
      {editingPlayerData && (
        <div
          data-testid="quick-player-editor-modal"
          className="fixed inset-0 z-[105] bg-black/75 flex items-center justify-center p-3 animate-fadeIn"
        >
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-emerald-500 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-4 py-3 bg-emerald-900 text-white flex items-center justify-between">
              <div className="font-black text-sm">
                ✏️ 이름 · 타수 1초 수정 ({editingPlayerData.group.groupNumber})
              </div>
              <div className="flex items-center gap-1.5">
                {editingPlayerData.group.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setZoomedPhotoUrl(editingPlayerData.group.imageUrl!)}
                    className="px-2.5 py-1 bg-amber-400 text-stone-950 rounded-lg text-[11px] font-black cursor-pointer"
                  >
                    📸 원본 보기
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingPlayerCtx(null)}
                  className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto">
              {/* Name + Gender + Guest */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-700">선수 성명 &amp; 구분</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    data-testid="input-editor-player-name"
                    value={editingPlayerData.player.name}
                    onChange={(e) =>
                      updatePlayer(editingPlayerData.group.groupId, editingPlayerData.player.id, (p) => ({
                        ...p,
                        name: e.target.value,
                      }))
                    }
                    className="flex-1 px-3 py-2 bg-stone-50 border-2 border-stone-300 rounded-xl text-sm font-black text-stone-900 focus:border-emerald-600 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updatePlayer(editingPlayerData.group.groupId, editingPlayerData.player.id, (p) => ({
                        ...p,
                        gender: p.gender === 'M' ? 'F' : 'M',
                      }))
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-black border cursor-pointer ${
                      editingPlayerData.player.gender === 'F'
                        ? 'bg-pink-50 border-pink-300 text-pink-700'
                        : 'bg-blue-50 border-blue-300 text-blue-700'
                    }`}
                  >
                    {editingPlayerData.player.gender === 'F' ? '여자' : '남자'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updatePlayer(editingPlayerData.group.groupId, editingPlayerData.player.id, (p) => ({
                        ...p,
                        isGuest: !p.isGuest,
                      }))
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-black border cursor-pointer ${
                      editingPlayerData.player.isGuest
                        ? 'bg-amber-400 border-amber-500 text-stone-950'
                        : 'bg-stone-100 border-stone-300 text-stone-600'
                    }`}
                  >
                    {editingPlayerData.player.isGuest ? '게스트✓' : '정회원'}
                  </button>
                </div>
              </div>

              {/* Direct Total Stepper */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-emerald-950">최종 합계 타수</div>
                  <div className="text-[10px] text-emerald-700 font-bold">
                    {editingPlayerData.player.useDirectTotal ? '총점 직접 수정 모드' : '홀별 합계 자동 계산'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    data-testid="btn-editor-total-minus"
                    onClick={() => {
                      const cur = getPlayerCalcTotal(editingPlayerData.player, editingPlayerData.group.courses);
                      updatePlayer(editingPlayerData.group.groupId, editingPlayerData.player.id, (p) => ({
                        ...p,
                        useDirectTotal: true,
                        reportedTotal: Math.max(9, cur - 1),
                      }));
                    }}
                    className="w-10 h-10 rounded-xl bg-white border-2 border-emerald-400 font-black text-lg text-emerald-900 cursor-pointer"
                  >
                    −
                  </button>
                  <span
                    data-testid="editor-total-value"
                    className="min-w-[54px] text-center text-xl font-black text-emerald-900"
                  >
                    {getPlayerCalcTotal(editingPlayerData.player, editingPlayerData.group.courses)}타
                  </span>
                  <button
                    type="button"
                    data-testid="btn-editor-total-plus"
                    onClick={() => {
                      const cur = getPlayerCalcTotal(editingPlayerData.player, editingPlayerData.group.courses);
                      updatePlayer(editingPlayerData.group.groupId, editingPlayerData.player.id, (p) => ({
                        ...p,
                        useDirectTotal: true,
                        reportedTotal: cur + 1,
                      }));
                    }}
                    className="w-10 h-10 rounded-xl bg-white border-2 border-emerald-400 font-black text-lg text-emerald-900 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Hole-by-Hole 1-Tap Keypad */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-800">홀별 타수 1터치 수정</span>
                  <span className="text-[10px] font-bold text-stone-500">수정할 홀 선택 후 아래 숫자 터치</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {Array.from({ length: editingPlayerData.group.courses.length * 9 }, (_, i) => i + 1).map((h) => {
                    const isSelected = (editingPlayerCtx?.activeHole || 1) === h;
                    const val = editingPlayerData.player.scores?.[h];
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() =>
                          setEditingPlayerCtx((prev) => (prev ? { ...prev, activeHole: h } : prev))
                        }
                        className={`py-1.5 rounded-xl border-2 text-center cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-700 border-emerald-700 text-white shadow-sm'
                            : 'bg-stone-50 border-stone-200 text-stone-800'
                        }`}
                      >
                        <div className={`text-[9px] font-bold ${isSelected ? 'text-emerald-200' : 'text-stone-400'}`}>
                          {h}번홀
                        </div>
                        <div className="text-sm font-black">{val || '-'}</div>
                      </button>
                    );
                  })}
                </div>

                {/* 1~8 One-Tap Number Buttons */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((stroke) => (
                    <button
                      key={stroke}
                      type="button"
                      data-testid={`btn-hole-stroke-${stroke}`}
                      onClick={() => {
                        const targetHole = editingPlayerCtx?.activeHole || 1;
                        updatePlayer(editingPlayerData.group.groupId, editingPlayerData.player.id, (p) => {
                          const nextScores = { ...(p.scores || {}), [targetHole]: stroke };
                          const nextSum = Object.values(nextScores).reduce((a, b) => a + (Number(b) || 0), 0);
                          return {
                            ...p,
                            useDirectTotal: false,
                            scores: nextScores,
                            reportedTotal: nextSum,
                          };
                        });
                      }}
                      className="py-2.5 bg-white hover:bg-emerald-600 hover:text-white border-2 border-emerald-300 rounded-xl font-black text-base text-emerald-950 cursor-pointer active:scale-95 transition"
                    >
                      {stroke}타
                    </button>
                  ))}
                </div>
              </div>

              {!isIndividual && (() => {
                const sim = findSimilarClubMember(editingPlayerData.player.name, clubMemberNames);
                if (!sim) return null;
                return (
                  <div className="flex items-center gap-1.5 text-xs bg-emerald-50 border border-emerald-200 rounded-xl p-2">
                    <span className="font-bold text-stone-600">클럽 명단 추천:</span>
                    <button
                      type="button"
                      onClick={() =>
                        updatePlayer(editingPlayerData.group.groupId, editingPlayerData.player.id, (p) => ({
                          ...p,
                          name: sim,
                        }))
                      }
                      className="px-2.5 py-1 bg-emerald-700 text-white font-black rounded-lg text-xs cursor-pointer"
                    >
                      &lsquo;{sim}&rsquo; 님으로 교정
                    </button>
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => deletePlayer(editingPlayerData.group.groupId, editingPlayerData.player.id)}
                  className="px-3.5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-black text-xs rounded-xl cursor-pointer shrink-0"
                >
                  🗑️ 삭제
                </button>
                <button
                  type="button"
                  data-testid="btn-editor-confirm-done"
                  onClick={() => setEditingPlayerCtx(null)}
                  className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl cursor-pointer shadow-md"
                >
                  ✓ 수정 완료 (즉시 반영)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-MODAL 2: Fullscreen Original Scorecard Photo Zoom                 */}
      {/* ===================================================================== */}
      {zoomedPhotoUrl && (
        <div
          onClick={() => setZoomedPhotoUrl(null)}
          className="fixed inset-0 z-[115] bg-black/90 flex flex-col items-center justify-center p-3 gap-3"
        >
          <div className="w-full max-w-2xl flex items-center justify-between text-white">
            <span className="text-xs font-black">📸 원본 스코어카드 확대 보기</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerDownload(zoomedPhotoUrl, `scorecard_original_${heldDate}.jpg`);
                }}
                className="px-3 py-1.5 bg-emerald-600 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>원본 저장</span>
              </button>
              <button
                type="button"
                onClick={() => setZoomedPhotoUrl(null)}
                className="px-3 py-1.5 bg-white/20 rounded-lg text-xs font-black cursor-pointer"
              >
                닫기 ✕
              </button>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomedPhotoUrl}
            alt="원본 스코어카드"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[82vh] max-w-full rounded-2xl object-contain border border-white/20"
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-MODAL 3: 1080p Generated Award Card Preview & Download            */}
      {/* ===================================================================== */}
      {generatedCardUrl && (
        <div
          data-testid="generated-1080p-card-modal"
          className="fixed inset-0 z-[115] bg-black/85 flex items-center justify-center p-3"
        >
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-400 flex flex-col max-h-[92vh]">
            <div className="px-4 py-3 bg-emerald-900 text-white flex items-center justify-between">
              <span className="font-black text-sm truncate">{cardPreviewTitle}</span>
              <button
                type="button"
                onClick={() => setGeneratedCardUrl(null)}
                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            {!isIndividual && groups.length > 0 && (
              <div className="px-3 py-2 bg-stone-50 border-b border-stone-200 flex items-center gap-1.5 overflow-x-auto">
                {groups.map((grp) => (
                  <button
                    key={grp.groupId}
                    type="button"
                    onClick={() => handleGenerateOfficialGroupCard(grp)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-[11px] font-black shrink-0 cursor-pointer"
                  >
                    📋 {grp.groupNumber} 공식표
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleGenerate1080pCard}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-950 rounded-lg text-[11px] font-black shrink-0 cursor-pointer"
                >
                  🏆 전체 순위표
                </button>
              </div>
            )}
            <div className="p-3 overflow-y-auto bg-stone-100 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generatedCardUrl}
                alt="공식 결과표"
                className="w-full rounded-xl shadow-md border border-stone-300"
              />
            </div>
            <div className="p-3 bg-white border-t border-stone-200 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  triggerDownload(generatedCardUrl, `${(club?.name || '나의 라운드')}_스트로크결과표_${heldDate}.png`)
                }
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>이미지 저장 (PNG)</span>
              </button>
              <button
                type="button"
                onClick={() => setGeneratedCardUrl(null)}
                className="px-4 py-3 bg-stone-200 text-stone-800 font-black text-xs rounded-xl cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
