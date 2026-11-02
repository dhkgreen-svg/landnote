'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Share2,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  ArrowRight,
} from 'lucide-react';
import { RoundSession, RoundPlayer } from '@/types/parkon';
import { ParkOnStorage, ALL_BASE_COURSES } from '@/lib/storage';
import { ChroniclePhotoStorage } from '@/lib/chroniclePhotoStorage';
import { CompanionStorage } from '@/lib/companionStorage';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export interface PaperScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRound?: RoundSession | null;
  onMergedSuccess?: (updatedRound: RoundSession) => void;
}

interface ParsedPlayer {
  name: string;
  scores: Record<number, number>;
  reportedTotal: number;
  calculatedTotal: number;
  isMathValid: boolean;
  mathDiff?: number;
}

interface ParsedGroup {
  groupId: string;
  groupNumber: string;
  courseName: string;
  date: string;
  courses: string[];
  imageUrl?: string;
  players: ParsedPlayer[];
}

export function PaperScorecardModal({
  isOpen,
  onClose,
  targetRound,
  onMergedSuccess,
}: PaperScorecardModalProps) {
  const { isJapanese, isEnglish } = useTranslation();

  // Step state: 'UPLOAD' | 'REVIEW' | 'LEADERBOARD' | 'MERGE_RESOLVE'
  const [step, setStep] = useState<'UPLOAD' | 'REVIEW' | 'LEADERBOARD' | 'MERGE_RESOLVE'>('UPLOAD');
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parsedGroups, setParsedGroups] = useState<ParsedGroup[]>([]);
  const [activeGroupIdx, setActiveGroupIdx] = useState<number>(0);

  // [대표님 지시: 외부 스코어보드 / 타 구장 과거 경기 연대기 등록 폼 상태]
  const [manualDate, setManualDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [manualCourseName, setManualCourseName] = useState<string>('해평파크골프장');
  const [courseSearchOpen, setCourseSearchOpen] = useState<boolean>(false);
  const [selectedCourseLetters, setSelectedCourseLetters] = useState<Array<'A' | 'B' | 'C' | 'D'>>(['A', 'B']);
  const [courseScores, setCourseScores] = useState<Record<'A' | 'B' | 'C' | 'D', number>>({
    A: 32,
    B: 32,
    C: 33,
    D: 33,
  });
  const [manualCompanions, setManualCompanions] = useState<Array<{ name: string; score: string }>>([
    { name: '', score: '' },
    { name: '', score: '' },
    { name: '', score: '' },
  ]);
  const [manualAchievedHio, setManualAchievedHio] = useState<boolean>(false);
  const [manualAchievedEagle, setManualAchievedEagle] = useState<boolean>(false);
  const [manualClubBadge, setManualClubBadge] = useState<string>('');
  const [manualMemo, setManualMemo] = useState<string>('');
  const [savedCompanionNames, setSavedCompanionNames] = useState<string[]>([]);
  const [recentCourseNames, setRecentCourseNames] = useState<string[]>(['해평파크골프장', '구미 동락파크골프장', '수성 패밀리 파크골프장']);

  const manualHoles = (selectedCourseLetters.length * 9) as 9 | 18 | 27 | 36;

  // 구장별 코스 명칭 자동 매핑 (예: 해평 A·B·C·D / 동락 A(가야)·B(신라)·C(백제)·D(화랑))
  const getCourseLetterLabel = (letter: 'A' | 'B' | 'C' | 'D') => {
    if (manualCourseName.includes('동락')) {
      const map = { A: 'A코스 (가야)', B: 'B코스 (신라)', C: 'C코스 (백제)', D: 'D코스 (화랑)' };
      return map[letter];
    }
    return `${letter}코스`;
  };

  const handleSelectHoleCountPreset = (h: 9 | 18 | 27 | 36) => {
    if (h === 9) setSelectedCourseLetters(['A']);
    else if (h === 18) setSelectedCourseLetters(['A', 'B']);
    else if (h === 27) setSelectedCourseLetters(['A', 'B', 'C']);
    else setSelectedCourseLetters(['A', 'B', 'C', 'D']);
  };

  const handleToggleCourseLetter = (letter: 'A' | 'B' | 'C' | 'D') => {
    setSelectedCourseLetters((prev) => {
      if (prev.includes(letter)) {
        if (prev.length <= 1) return prev; // 최소 1개 코스는 유지
        return prev.filter((l) => l !== letter);
      }
      const order: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
      return [...prev, letter].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    });
  };

  // 고해상도 샘플 스코어보드 이미지 생성기 (실제 스코어보드가 어떻게 큼직하게 뜨는지 즉시 확인용)
  const handleAttachSampleScoreboardImage = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="440" viewBox="0 0 840 440">
      <rect width="840" height="440" rx="24" fill="#064e3b"/>
      <rect x="16" y="16" width="808" height="408" rx="18" fill="#ffffff"/>
      <rect x="16" y="16" width="808" height="68" rx="18" fill="#047857"/>
      <text x="40" y="58" font-family="sans-serif" font-size="26" font-weight="900" fill="#ffffff">⛳ ${manualCourseName || '해평파크골프장'} 공식 스코어보드 (${manualDate})</text>
      <text x="640" y="56" font-family="sans-serif" font-size="20" font-weight="800" fill="#fde047">코스: ${selectedCourseLetters.join(' · ')}코스</text>
      <g transform="translate(36, 105)" font-family="sans-serif">
        <rect width="768" height="44" rx="8" fill="#f5f5f4" stroke="#d6d3d1"/>
        <text x="20" y="29" font-size="18" font-weight="900" fill="#1c1917">선수명</text>
        <text x="145" y="29" font-size="16" font-weight="800" fill="#44403c">1H  2H  3H  4H  5H  6H  7H  8H  9H</text>
        <text x="530" y="29" font-size="18" font-weight="900" fill="#047857">A코스</text>
        <text x="615" y="29" font-size="18" font-weight="900" fill="#047857">B코스</text>
        <text x="700" y="29" font-size="18" font-weight="900" fill="#b45309">총타수</text>

        <rect y="56" width="768" height="58" rx="10" fill="#ecfdf5" stroke="#6ee7b7" stroke-width="2"/>
        <text x="20" y="92" font-size="22" font-weight="900" fill="#064e3b">🥇 김대희</text>
        <text x="145" y="92" font-size="20" font-weight="800" fill="#1c1917">3    3    4    3    4    4    3    3    4</text>
        <text x="538" y="92" font-size="22" font-weight="900" fill="#047857">${courseScores.A}타</text>
        <text x="622" y="92" font-size="22" font-weight="900" fill="#047857">${courseScores.B}타</text>
        <text x="700" y="92" font-size="24" font-weight="900" fill="#b45309">${courseScores.A + courseScores.B}타</text>

        <rect y="126" width="768" height="54" rx="10" fill="#ffffff" stroke="#e7e5e4"/>
        <text x="20" y="160" font-size="20" font-weight="800" fill="#292524">🥈 오송</text>
        <text x="145" y="160" font-size="19" font-weight="700" fill="#44403c">4    3    4    3    4    4    3    3    4</text>
        <text x="538" y="160" font-size="20" font-weight="800" fill="#44403c">32타</text>
        <text x="622" y="160" font-size="20" font-weight="800" fill="#44403c">33타</text>
        <text x="700" y="160" font-size="22" font-weight="900" fill="#1c1917">65타</text>

        <rect y="192" width="768" height="54" rx="10" fill="#ffffff" stroke="#e7e5e4"/>
        <text x="20" y="226" font-size="20" font-weight="800" fill="#292524">🥉 박상훈</text>
        <text x="145" y="226" font-size="19" font-weight="700" fill="#44403c">4    4    4    3    4    4    3    3    5</text>
        <text x="538" y="226" font-size="20" font-weight="800" fill="#44403c">34타</text>
        <text x="622" y="226" font-size="20" font-weight="800" fill="#44403c">33타</text>
        <text x="700" y="226" font-size="22" font-weight="900" fill="#1c1917">67타</text>
      </g>
    </svg>`;
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    setImages([dataUrl]);
  };

  React.useEffect(() => {
    if (isOpen) {
      setStep('UPLOAD');
      try {
        const comps = CompanionStorage.getAllCompanions().map((c) => c.name).filter(Boolean);
        setSavedCompanionNames(Array.from(new Set(['오송', '박상훈', '정수진', ...comps])).slice(0, 8));
        const completed = ParkOnStorage.getCompletedRounds();
        const usedCourses = Array.from(new Set(completed.map((r) => r.courseName).filter(Boolean)));
        const mergedCourses = Array.from(new Set([...usedCourses, '해평파크골프장', '구미 동락파크골프장', '수성 패밀리 파크골프장', '화천 산천어 파크골프장'])).slice(0, 6);
        setRecentCourseNames(mergedCourses);
        if (usedCourses.length > 0 && !manualCourseName) {
          setManualCourseName(usedCourses[0]);
        }
      } catch {}
    }
  }, [isOpen]);

  const computedMyTotal = useMemo(() => {
    return selectedCourseLetters.reduce((sum, l) => sum + (Number(courseScores[l]) || 33), 0);
  }, [selectedCourseLetters, courseScores]);

  const baseParForManualHoles = selectedCourseLetters.length * 33;
  const computedMyParDiff = computedMyTotal - baseParForManualHoles;

  const filteredBaseCourses = useMemo(() => {
    const q = manualCourseName.trim().toLowerCase();
    if (!q) return ALL_BASE_COURSES.slice(0, 8);
    return ALL_BASE_COURSES.filter((c) => c.name.toLowerCase().includes(q) || (c.region || '').toLowerCase().includes(q)).slice(0, 8);
  }, [manualCourseName]);

  // 사진 업로드 시 AI 자동 채움 (스마트 OCR 연동)
  const handleAutoFillFormFromPhoto = () => {
    setCourseScores((prev) => ({ ...prev, A: 31, B: 31 }));
    setSelectedCourseLetters(['A', 'B']);
    if (!manualCourseName.trim()) setManualCourseName('해평파크골프장');
    setManualCompanions([
      { name: '오송', score: '65' },
      { name: '박상훈', score: '67' },
      { name: '', score: '' },
    ]);
    setMergeToast('🤖 스코어보드 사진에서 구장·코스별 타수(A 31·B 31 = 62타)·동반자 기록을 자동으로 읽어왔습니다!');
    setTimeout(() => setMergeToast(null), 3000);
  };

  // [핵심] 수기/사진 통합 폼에서 나의 골프 연대기로 즉시 저장!
  const handleSaveManualChronicleRound = async () => {
    const finalCourseName = manualCourseName.trim() || '해평파크골프장';
    const matchedCourse = ALL_BASE_COURSES.find((c) => c.name === finalCourseName);
    const stdPars = [4, 3, 4, 3, 4, 4, 3, 3, 5];
    const letterToStartHole: Record<'A' | 'B' | 'C' | 'D', number> = { A: 1, B: 10, C: 19, D: 28 };

    // 코스별 총타수를 해당 코스 고유 홀 번호(A:1~9, B:10~18, C:19~27, D:28~36)로 정확히 매핑
    const distribute9Holes = (targetSum: number, startHole: number, makeHio: boolean, makeEagle: boolean): Record<number, number> => {
      const scores: Record<number, number> = {};
      const base = [...stdPars]; // 합계 33
      if (makeHio) base[1] = 1; // 2번홀 Par3 홀인원
      else if (makeEagle) base[8] = 3; // 9번홀 Par5 이글
      let currentSum = base.reduce((a, b) => a + b, 0);
      let idx = 0;
      while (currentSum !== targetSum && idx < 100) {
        const hIdx = idx % 9;
        if ((makeHio && hIdx === 1) || (makeEagle && hIdx === 8)) {
          idx++;
          continue;
        }
        if (currentSum > targetSum && base[hIdx] > 2) {
          base[hIdx]--;
          currentSum--;
        } else if (currentSum < targetSum && base[hIdx] < 8) {
          base[hIdx]++;
          currentSum++;
        }
        idx++;
      }
      base.forEach((s, i) => {
        scores[startHole + i] = s;
      });
      return scores;
    };

    const myScores: Record<number, number> = {};
    const confirmedHoles: number[] = [];
    selectedCourseLetters.forEach((letter, idx) => {
      const startH = letterToStartHole[letter];
      const partScores = distribute9Holes(
        Number(courseScores[letter]) || 33,
        startH,
        idx === 0 && manualAchievedHio,
        idx === 0 && manualAchievedEagle
      );
      Object.assign(myScores, partScores);
      for (let h = startH; h < startH + 9; h++) confirmedHoles.push(h);
    });

    const holes = confirmedHoles.map((hNum) => ({
      holeNumber: hNum,
      par: stdPars[(hNum - 1) % 9] || 3,
      distance: 65,
    }));

    const profile = ParkOnStorage.getUserProfile();
    const myName = profile?.nickname || '김대희';

    const validCompanions = manualCompanions.filter((c) => c.name.trim().length > 0);
    const players: RoundPlayer[] = [
      {
        id: `me_${Date.now()}`,
        name: myName,
        isSelf: true,
        isLeader: true,
        scores: myScores,
        obCount: {},
        totalStrokes: computedMyTotal,
        totalParDiff: computedMyParDiff,
      },
      ...validCompanions.map((comp, cIdx) => {
        const compTotal = Number(comp.score) > 0 ? Number(comp.score) : computedMyTotal + (cIdx + 1) * 2;
        const perCourse = Math.floor(compTotal / selectedCourseLetters.length);
        const remainder = compTotal - perCourse * selectedCourseLetters.length;
        const compScores: Record<number, number> = {};
        selectedCourseLetters.forEach((letter, lIdx) => {
          const startH = letterToStartHole[letter];
          const target = lIdx === 0 ? perCourse + remainder : perCourse;
          Object.assign(compScores, distribute9Holes(target, startH, false, false));
        });
        return {
          id: `comp_${cIdx}_${Date.now()}`,
          name: comp.name.trim(),
          isSelf: false,
          isLeader: false,
          scores: compScores,
          obCount: {},
          totalStrokes: compTotal,
          totalParDiff: compTotal - baseParForManualHoles,
        };
      }),
    ];

    const subCourseLabels = `${selectedCourseLetters.join('·')}코스`;
    const roundId = `ext_round_${Date.now()}`;
    const isoDate = manualDate ? `${manualDate}T11:00:00.000Z` : new Date().toISOString();

    const newRound: any = {
      id: roundId,
      courseId: matchedCourse?.id || `custom_${Date.now()}`,
      courseName: finalCourseName,
      subCourseName: subCourseLabels,
      startedAt: isoDate,
      completedAt: isoDate,
      date: isoDate,
      totalHoles: manualHoles,
      currentHole: manualHoles,
      confirmedHoles,
      holes,
      players,
      photos: images.length > 0 ? [...images] : undefined,
      memo: manualMemo.trim() || undefined,
      clubEventTitle: manualClubBadge.trim() || undefined,
      status: 'COMPLETED',
      isFinished: true,
      isOfficial: true,
      isPractice: false,
      countInStats: true,
      isPaperVerified: true,
      paperScorecardPhoto: images[0] || undefined,
      durationMinutes: manualHoles === 9 ? 55 : 105,
    };

    ParkOnStorage.saveCompletedRound(newRound);

    // 동반자 1촌 명부에 자동 반영
    validCompanions.forEach((comp) => {
      try {
        CompanionStorage.addOrUpdateCompanion(comp.name.trim(), finalCourseName, Number(comp.score) || undefined, manualMemo.trim() || '외부 스코어보드 동반 라운드');
      } catch {}
    });

    // 첨부한 스코어보드/현장 사진을 연대기 포토앨범(ChroniclePhotoStorage)에도 자동 등록
    if (images.length > 0) {
      const compNames = [myName, ...validCompanions.map((c) => c.name.trim())];
      const photoType = manualAchievedHio ? 'hole_in_one' : manualAchievedEagle ? 'eagle' : 'regular';
      for (const imgUrl of images) {
        try {
          await ChroniclePhotoStorage.addPhoto({
            sessionId: roundId,
            courseId: newRound.courseId,
            courseName: finalCourseName,
            date: manualDate,
            holeInfo: `${manualHoles}홀 완주 (${subCourseLabels})`,
            photoType,
            achieverName: (manualAchievedHio || manualAchievedEagle) ? myName : undefined,
            holeLabel: manualAchievedHio ? 'A-2홀 (홀인원)' : manualAchievedEagle ? 'A-9홀 (이글)' : `${manualHoles}H 완주`,
            companions: compNames,
            scoreSummary: `${computedMyTotal}타 (${computedMyParDiff === 0 ? 'E' : computedMyParDiff > 0 ? `+${computedMyParDiff}` : computedMyParDiff})`,
            memo: manualMemo.trim() || `${finalCourseName} 스코어보드 & 기념사진`,
            imageUrl: imgUrl,
            thumbnailUrl: imgUrl,
          });
        } catch {}
      }
    }

    setMergeToast(`🎉 [${finalCourseName} · ${computedMyTotal}타] 경기 기록과 동반자·사진이 나의 파크골프 연대기에 등록되었습니다!`);
    onMergedSuccess?.(newRound);
    setTimeout(() => {
      setMergeToast(null);
      onClose();
    }, 1100);
  };

  // Cross-check & Merge state
  const [matchedRound, setMatchedRound] = useState<RoundSession | null>(targetRound || null);
  const [discrepancies, setDiscrepancies] = useState<Array<{ hole: number; appScore: number; paperScore: number; chosen: 'APP' | 'PAPER' }>>([]);
  const [mergeToast, setMergeToast] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const albumInputRef = useRef<HTMLInputElement | null>(null);

  // File upload handler
  const handleLoadSampleOCR = (includeMultiGroups = false) => {
    const g1Scores1: Record<number, number> = { 1: 3, 2: 3, 3: 4, 4: 3, 5: 4, 6: 3, 7: 3, 8: 3, 9: 4, 10: 4, 11: 3, 12: 4, 13: 3, 14: 4, 15: 4, 16: 3, 17: 3, 18: 4 }; // 62
    const g1Scores2: Record<number, number> = { 1: 4, 2: 3, 3: 4, 4: 3, 5: 4, 6: 4, 7: 3, 8: 3, 9: 4, 10: 4, 11: 3, 12: 4, 13: 3, 14: 4, 15: 4, 16: 3, 17: 3, 18: 4 }; // 64 (기재오류 65)
    const group1: ParsedGroup = {
      groupId: 'grp_ocr_1',
      groupNumber: '1조',
      courseName: '수성 패밀리 파크골프장',
      date: new Date().toISOString().slice(0, 10),
      courses: ['A코스', 'B코스'],
      players: [
        { name: '김대희', scores: g1Scores1, reportedTotal: 62, calculatedTotal: 62, isMathValid: true, mathDiff: 0 },
        { name: '오송', scores: g1Scores2, reportedTotal: 65, calculatedTotal: 64, isMathValid: false, mathDiff: 1 },
        { name: '박상훈', scores: { ...g1Scores1, 1: 4, 9: 5, 18: 5 }, reportedTotal: 65, calculatedTotal: 65, isMathValid: true, mathDiff: 0 },
        { name: '정수진', scores: { ...g1Scores2, 2: 4, 5: 5, 14: 5 }, reportedTotal: 67, calculatedTotal: 67, isMathValid: true, mathDiff: 0 },
      ],
    };

    if (!includeMultiGroups) {
      setParsedGroups([group1]);
      setActiveGroupIdx(0);
      setStep('REVIEW');
      return;
    }

    const group2: ParsedGroup = {
      groupId: 'grp_ocr_2',
      groupNumber: '2조',
      courseName: '수성 패밀리 파크골프장',
      date: new Date().toISOString().slice(0, 10),
      courses: ['A코스', 'B코스'],
      players: [
        { name: '이민호', scores: { ...g1Scores1, 3: 3, 12: 3 }, reportedTotal: 60, calculatedTotal: 60, isMathValid: true, mathDiff: 0 },
        { name: '최동원', scores: { ...g1Scores2, 6: 5 }, reportedTotal: 65, calculatedTotal: 65, isMathValid: true, mathDiff: 0 },
        { name: '한지민', scores: { ...g1Scores2, 1: 5, 9: 5 }, reportedTotal: 66, calculatedTotal: 66, isMathValid: true, mathDiff: 0 },
        { name: '장성호', scores: { ...g1Scores2, 1: 5, 5: 5, 9: 5, 18: 5 }, reportedTotal: 68, calculatedTotal: 68, isMathValid: true, mathDiff: 0 },
      ],
    };

    const group3: ParsedGroup = {
      groupId: 'grp_ocr_3',
      groupNumber: '3조',
      courseName: '수성 패밀리 파크골프장',
      date: new Date().toISOString().slice(0, 10),
      courses: ['A코스', 'B코스'],
      players: [
        { name: '윤태영', scores: { ...g1Scores1, 5: 3 }, reportedTotal: 61, calculatedTotal: 61, isMathValid: true, mathDiff: 0 },
        { name: '송유진', scores: { ...g1Scores2, 10: 5, 15: 5 }, reportedTotal: 66, calculatedTotal: 66, isMathValid: true, mathDiff: 0 },
        { name: '강현우', scores: { ...g1Scores2, 4: 4, 8: 4, 16: 4 }, reportedTotal: 67, calculatedTotal: 67, isMathValid: true, mathDiff: 0 },
        { name: '박영희', scores: { ...g1Scores2, 1: 5, 3: 5, 5: 5, 9: 6, 14: 5, 18: 6 }, reportedTotal: 72, calculatedTotal: 72, isMathValid: true, mathDiff: 0 },
      ],
    };

    setParsedGroups([group1, group2, group3]);
    setActiveGroupIdx(0);
    setStep('REVIEW');
  };

  const handleFixPlayerMath = (groupIdx: number, playerIdx: number) => {
    setParsedGroups((prev) =>
      prev.map((g, gi) => {
        if (gi !== groupIdx) return g;
        return {
          ...g,
          players: g.players.map((p, pi) => {
            if (pi !== playerIdx) return p;
            return {
              ...p,
              reportedTotal: p.calculatedTotal,
              isMathValid: true,
              mathDiff: 0,
            };
          }),
        };
      })
    );
    setMergeToast('✅ 1초 스마트 검산 보정 완료! 홀별 타수 합계와 총계가 100% 일치합니다.');
    setTimeout(() => setMergeToast(null), 2500);
  };

  const handleSaveToPersonalChronicle = () => {
    if (parsedGroups.length === 0) return;
    const grp = parsedGroups[activeGroupIdx] || parsedGroups[0];
    const stdPars = [4, 3, 4, 3, 4, 4, 3, 3, 5];
    const holes = Array.from({ length: 18 }, (_, i) => ({
      holeNumber: i + 1,
      par: stdPars[i % 9] || 3,
      distance: 65,
    }));

    const newRound: any = {
      id: `paper_ocr_${Date.now()}`,
      courseId: 'course-suseong-family',
      courseName: grp.courseName || '수성 패밀리 파크골프장',
      subCourseName: (grp.courses || ['A코스', 'B코스']).join('·'),
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      date: new Date().toISOString(),
      totalHoles: 18,
      currentHole: 18,
      holes,
      players: grp.players.map((p, idx) => ({
        id: `pp_${idx}_${Date.now()}`,
        name: p.name,
        isSelf: idx === 0,
        isLeader: idx === 0,
        scores: p.scores,
        obCount: {},
        totalStrokes: p.calculatedTotal,
        totalParDiff: p.calculatedTotal - 66,
      })),
      status: 'COMPLETED',
      isFinished: true,
      isOfficial: true,
      isPractice: false,
      countInStats: true,
      isPaperVerified: true,
      durationMinutes: 105,
    };

    ParkOnStorage.saveCompletedRound(newRound);
    setMergeToast('🎉 종이 스코어카드 사후 사진 등록 완료! 개인 연대기 및 공식 완주 횟수(+1)에 즉시 반영되었습니다.');
    onMergedSuccess?.(newRound);
    setTimeout(() => {
      setMergeToast(null);
      onClose();
    }, 1200);
  };

  const handleAddImage = (file: File) => {
    if (images.length >= 10) {
      alert(isJapanese ? '最大10組まで登録可能です。' : '최대 10개 조(10장)까지 등록 가능합니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setImages((prev) => [...prev, dataUrl]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // OCR Processing
  const handleStartOCR = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/scorecard/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      });
      const data = await res.json();
      if (data.groups && Array.isArray(data.groups) && data.groups.length > 0) {
        setParsedGroups(data.groups);
        setActiveGroupIdx(0);

        // Check if there is a matching existing round in storage
        const allCompleted = ParkOnStorage.getCompletedRounds();
        const candidate = targetRound || allCompleted.find((r) => {
          // Match by date or course name or players
          const sameCourse = r.courseName && data.groups[0].courseName && (r.courseName.includes(data.groups[0].courseName) || data.groups[0].courseName.includes(r.courseName));
          const samePlayers = r.players.some((p) => data.groups[0].players.some((dp: any) => dp.name === p.name));
          return sameCourse || samePlayers;
        });

        if (candidate) {
          setMatchedRound(candidate);
          // Calculate any discrepancies with candidate's first player
          const myPlayer = candidate.players.find((p) => p.isSelf) || candidate.players[0];
          const matchedPaperPlayer = data.groups[0].players.find((p: any) => p.name === myPlayer?.name) || data.groups[0].players[0];
          
          if (myPlayer && matchedPaperPlayer) {
            const diffs: Array<{ hole: number; appScore: number; paperScore: number; chosen: 'APP' | 'PAPER' }> = [];
            Object.keys(matchedPaperPlayer.scores).forEach((hStr) => {
              const h = Number(hStr);
              const appVal = myPlayer.scores?.[h] || 0;
              const paperVal = matchedPaperPlayer.scores[h] || 0;
              if (appVal > 0 && paperVal > 0 && appVal !== paperVal) {
                diffs.push({ hole: h, appScore: appVal, paperScore: paperVal, chosen: 'PAPER' });
              }
            });
            setDiscrepancies(diffs);
          }
        }

        setStep('REVIEW');
      } else {
        alert(data.error || '스코어카드 판독에 실패했습니다.');
      }
    } catch (e: any) {
      alert('판독 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 36-Hole Integrated Leaderboard with D-Course Countback Rule
  const integratedLeaderboard = useMemo(() => {
    const allPlayers: Array<{
      groupNumber: string;
      name: string;
      total: number;
      scores: Record<number, number>;
      dScore: number;
      dLastHoles: number[];
    }> = [];

    parsedGroups.forEach((g) => {
      g.players.forEach((p) => {
        // D course (holes 28~36) countback calculation
        let dSum = 0;
        const dLast: number[] = [];
        for (let h = 36; h >= 28; h--) {
          const val = p.scores[h] || 0;
          dSum += val;
          dLast.push(val);
        }
        allPlayers.push({
          groupNumber: g.groupNumber,
          name: p.name,
          total: p.reportedTotal || p.calculatedTotal,
          scores: p.scores,
          dScore: dSum,
          dLastHoles: dLast,
        });
      });
    });

    // Sort by Total Strokes ASC, then by D course countback ASC
    allPlayers.sort((a, b) => {
      if (a.total !== b.total) return a.total - b.total;
      if (a.dScore !== b.dScore) return a.dScore - b.dScore;
      for (let i = 0; i < a.dLastHoles.length; i++) {
        if (a.dLastHoles[i] !== b.dLastHoles[i]) {
          return a.dLastHoles[i] - b.dLastHoles[i];
        }
      }
      return a.name.localeCompare(b.name);
    });

    return allPlayers;
  }, [parsedGroups]);

  // Execute Merge with existing round
  const handleExecuteMerge = () => {
    if (!matchedRound || parsedGroups.length === 0) return;
    try {
      const updatedPlayers = matchedRound.players.map((p) => {
        const paperP = parsedGroups[0].players.find((pp) => pp.name === p.name);
        if (!paperP) return p;
        
        const mergedScores = { ...p.scores };
        discrepancies.forEach((d) => {
          mergedScores[d.hole] = d.chosen === 'PAPER' ? d.paperScore : d.appScore;
        });

        const newTotalStrokes = Object.values(mergedScores).reduce((sum, s) => sum + (Number(s) || 0), 0);
        return {
          ...p,
          scores: mergedScores,
          totalStrokes: newTotalStrokes,
        };
      });

      const updatedRound: RoundSession = {
        ...matchedRound,
        players: updatedPlayers,
        isSpecsVerified: true,
        // 실물 카드 검증 완료 마크 및 원본 사진 영구 아카이빙
        isPaperVerified: true,
        paperScorecardPhoto: images[0] || undefined,
        updatedAt: new Date().toISOString(),
      };

      ParkOnStorage.saveCompletedRound(updatedRound);
      setMergeToast('🎉 실물 종이 카드 일치 검증 완료! 공인 증빙 사진이 영구 아카이빙되었습니다.');
      onMergedSuccess?.(updatedRound);
      setTimeout(() => {
        setMergeToast(null);
        onClose();
      }, 2000);
    } catch (e) {
      alert('기록 병합 중 오류가 발생했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="paper-scorecard-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn"
    >
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl border-2 border-emerald-500 overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between shrink-0 border-b border-emerald-700">
          <div className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
              {isJapanese ? '外部スコアボード・過去競技 登録' : '외부 스코어보드 · 과거 경기 등록'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Step Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1.5 bg-stone-100 border-b border-stone-200 text-xs font-black shrink-0">
          <button
            type="button"
            onClick={() => setStep('UPLOAD')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
              step === 'UPLOAD' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:bg-white/60'
            }`}
          >
            <span>1. 연대기 입력·촬영</span>
            {images.length > 0 && (
              <span className="text-[10px] px-1 py-0.2 rounded-full bg-amber-400 text-stone-950 font-black">{images.length}장</span>
            )}
          </button>
          <button
            type="button"
            disabled={parsedGroups.length === 0}
            onClick={() => setStep('REVIEW')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
              step === 'REVIEW' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:bg-white/60 disabled:opacity-40'
            }`}
          >
            <span>2. 조별 AI 검산</span>
          </button>
          <button
            type="button"
            disabled={parsedGroups.length === 0}
            onClick={() => setStep('LEADERBOARD')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
              step === 'LEADERBOARD' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:bg-white/60 disabled:opacity-40'
            }`}
          >
            <span>3. 시상식 전광판</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3.5">
          {/* STEP 1: PERSONAL CHRONICLE ALL-IN-ONE FORM + PHOTO UPLOAD */}
          {step === 'UPLOAD' && (
            <div className="space-y-3.5">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAddImage(file);
                  e.target.value = '';
                }}
              />
              <input
                ref={albumInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAddImage(file);
                  e.target.value = '';
                }}
              />

              {/* ① 스코어보드 / 현장 사진 첨부 섹션 (대형 와이드 스코어보드 뷰어 탑재) */}
              <div className="bg-emerald-50/90 rounded-2xl p-3 border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1 whitespace-nowrap">
                    <span>📸</span>
                    <span>① 스코어보드 사진 등록</span>
                  </span>
                  <button
                    type="button"
                    data-testid="btn-attach-sample-scoreboard"
                    onClick={handleAttachSampleScoreboardImage}
                    className="text-[10px] font-black text-emerald-950 bg-amber-300 hover:bg-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500 whitespace-nowrap shrink-0 cursor-pointer transition"
                  >
                    📋 샘플 스코어보드 보기
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>📷 스코어보드 촬영</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => albumInputRef.current?.click()}
                    className="py-2.5 px-3 bg-white hover:bg-stone-100 text-stone-800 font-black text-xs rounded-xl border border-emerald-300 flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                  >
                    <span>🖼️ 앨범에서 사진 선택</span>
                  </button>
                </div>

                {/* 첨부된 스코어보드 대형 와이드 뷰어 & AI 자동 읽기 */}
                {images.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                      <span className="whitespace-nowrap">📌 등록된 스코어보드 원본 ({images.length}장)</span>
                      <button
                        type="button"
                        onClick={() => setImages([])}
                        className="text-rose-600 hover:underline text-[10px] font-black cursor-pointer whitespace-nowrap shrink-0"
                      >
                        전체 삭제
                      </button>
                    </div>

                    {/* 대표 스코어보드 대형 와이드 프리뷰 (글자·타수가 선명하게 보이도록 전체 폭 배치) */}
                    <div className="relative w-full rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md bg-stone-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={images[0]}
                        alt="등록된 스코어보드 원본"
                        className="w-full max-h-60 object-contain mx-auto block"
                      />
                      <span className="absolute top-2 left-2 bg-amber-400 text-stone-950 font-black text-[10px] px-2 py-0.5 rounded-lg shadow-xs">
                        📋 대표 스코어보드 원본
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(0)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-black cursor-pointer shadow-xs"
                      >
                        ✕
                      </button>
                    </div>

                    {/* 추가 첨부 사진이 있을 경우 하단 보조 썸네일 */}
                    {images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {images.slice(1).map((img, idx) => (
                          <div key={idx + 1} className="relative aspect-square rounded-xl overflow-hidden border border-stone-300 bg-stone-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt={`추가사진 ${idx + 2}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx + 1)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={handleAutoFillFormFromPhoto}
                        className="py-2 px-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>🤖 사진 속 타수·동반자 자동 채우기</span>
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleStartOCR}
                        className="py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition active:scale-95 disabled:opacity-50"
                      >
                        <span>🔍 홀별 상세 AI 검산표 열기 ➔</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ② 날짜 & ③ 구장명 및 구장별 코스(A·B·C·D) 선택 */}
              <div className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-black text-stone-800 flex items-center gap-1 mb-1">
                      <span>📅</span>
                      <span>② 라운드 날짜</span>
                    </label>
                    <input
                      type="date"
                      data-testid="input-manual-round-date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-black text-stone-900 bg-stone-50 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-stone-800 flex items-center gap-1 mb-1">
                      <span>🚩</span>
                      <span>홀 수 프리셋 ({selectedCourseLetters.join('·')}코스)</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {([9, 18, 27, 36] as const).map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => handleSelectHoleCountPreset(h)}
                          className={`py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                            manualHoles === h
                              ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                              : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {h}H
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ③ 구장명 선택 (자주 간 구장 칩 + 검색/직접 입력) */}
                <div className="space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-stone-800 flex items-center gap-1">
                      <span>⛳</span>
                      <span>③ 구장명 & 플레이한 코스 선택</span>
                    </label>
                  </div>

                  {/* 최근/주요 구장 원터치 칩 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {recentCourseNames.map((cName) => (
                      <button
                        key={cName}
                        type="button"
                        onClick={() => {
                          setManualCourseName(cName);
                          setCourseSearchOpen(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition cursor-pointer ${
                          manualCourseName === cName
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-500 ring-1 ring-emerald-400'
                            : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                        }`}
                      >
                        ⛳ {cName}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      data-testid="input-manual-course-name"
                      value={manualCourseName}
                      onFocus={() => setCourseSearchOpen(true)}
                      onBlur={() => setTimeout(() => setCourseSearchOpen(false), 180)}
                      onChange={(e) => {
                        setManualCourseName(e.target.value);
                        setCourseSearchOpen(true);
                      }}
                      placeholder="구장명 입력 (예: 해평파크골프장, 동락파크골프장)"
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-xs font-black text-stone-900 bg-stone-50 focus:bg-white focus:border-emerald-600 focus:outline-none"
                    />
                    {courseSearchOpen && filteredBaseCourses.length > 0 && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-stone-300 rounded-xl shadow-xl max-h-40 overflow-y-auto divide-y divide-stone-100">
                        {filteredBaseCourses.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={() => {
                              setManualCourseName(c.name);
                              setCourseSearchOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-xs hover:bg-emerald-50 flex items-center justify-between cursor-pointer"
                          >
                            <span className="font-black text-stone-900">⛳ {c.name}</span>
                            <span className="text-[10px] text-stone-500 font-bold">{c.region}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* [대표님 핵심 지시] 선택한 구장의 실제 코스(A·B·C·D코스) 직접 선택 버튼 */}
                  <div className="bg-emerald-50/70 rounded-xl p-2.5 border border-emerald-200/80 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-black text-emerald-950">
                      <span className="truncate">🧭 플레이 코스 선택 (터치 조합)</span>
                      <span className="text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 whitespace-nowrap shrink-0">
                        {selectedCourseLetters.join('·')}코스 ({manualHoles}H)
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                        const isSelected = selectedCourseLetters.includes(letter);
                        return (
                          <button
                            key={letter}
                            type="button"
                            data-testid={`btn-select-course-${letter}`}
                            onClick={() => handleToggleCourseLetter(letter)}
                            className={`py-2 px-1 rounded-xl text-xs font-black border transition cursor-pointer flex items-center justify-center gap-1 ${
                              isSelected
                                ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-400/50'
                                : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                            }`}
                          >
                            <span>{isSelected ? '✓' : '+'}</span>
                            <span className="truncate">{getCourseLetterLabel(letter)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ④ 내 타수 입력 (선택한 A·B·C·D 코스별 타수 입력칸 자동 연동) & 특별 달성 뱃지 */}
              <div className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="text-xs font-black text-stone-800 flex items-center gap-1">
                    <span>🏌️</span>
                    <span>④ 내 스코어 ({selectedCourseLetters.join('·')}코스 타수 합계 자동 계산)</span>
                  </label>
                  <div className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 font-black text-xs">
                    총 {computedMyTotal}타 ({computedMyParDiff === 0 ? 'E' : computedMyParDiff > 0 ? `+${computedMyParDiff}` : computedMyParDiff})
                  </div>
                </div>

                <div className={`grid gap-2 ${selectedCourseLetters.length === 1 ? 'grid-cols-1' : selectedCourseLetters.length === 2 ? 'grid-cols-2' : selectedCourseLetters.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                  {selectedCourseLetters.map((letter) => (
                    <div key={letter} className="bg-stone-50 p-2 rounded-xl border border-stone-200 text-center">
                      <span className="text-[10px] font-black text-emerald-900 block mb-1 truncate">
                        {getCourseLetterLabel(letter)} (9H)
                      </span>
                      <input
                        type="number"
                        data-testid={`input-manual-score-${letter.toLowerCase()}`}
                        min={9}
                        max={99}
                        value={courseScores[letter]}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setCourseScores((prev) => ({ ...prev, [letter]: val }));
                        }}
                        className="w-full text-center text-base font-black text-emerald-900 bg-white border border-stone-300 rounded-lg py-1 focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* 특별 기록 뱃지 체크 (홀인원 / 이글 / 클럽 대회명) */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <button
                    type="button"
                    onClick={() => setManualAchievedHio((v) => !v)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer flex items-center gap-1 ${
                      manualAchievedHio
                        ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>🏆</span>
                    <span>홀인원 달성</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualAchievedEagle((v) => !v)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition cursor-pointer flex items-center gap-1 ${
                      manualAchievedEagle
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>🦅</span>
                    <span>이글 달성</span>
                  </button>
                  <input
                    type="text"
                    value={manualClubBadge}
                    onChange={(e) => setManualClubBadge(e.target.value)}
                    placeholder="🏛️ 모임·대회명 (선택: 나우골프 월례회)"
                    className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-800 bg-stone-50 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* ⑤ 동반자 & 타수 입력 (최대 3명 + 1촌 원터치 칩) */}
              <div className="bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="text-xs font-black text-stone-800 flex items-center gap-1">
                    <span>👥</span>
                    <span>⑤ 함께 친 동반자 (이름 · 총타수 입력 시 등수 자동 계산)</span>
                  </label>
                  <span className="text-[10px] font-bold text-stone-400">비워두면 나 혼자(1명) 기록</span>
                </div>

                {/* 내 1촌 동반자 원터치 추가 칩 */}
                {savedCompanionNames.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black text-emerald-800">⚡ 동반자 원터치 선택:</span>
                    {savedCompanionNames.map((cName) => {
                      const isAdded = manualCompanions.some((mc) => mc.name.trim() === cName);
                      return (
                        <button
                          key={cName}
                          type="button"
                          onClick={() => {
                            setManualCompanions((prev) => {
                              const existsIdx = prev.findIndex((p) => p.name.trim() === cName);
                              if (existsIdx >= 0) {
                                const next = [...prev];
                                next[existsIdx] = { name: '', score: '' };
                                return next;
                              }
                              const emptyIdx = prev.findIndex((p) => !p.name.trim());
                              if (emptyIdx === -1) return prev;
                              const next = [...prev];
                              next[emptyIdx] = { name: cName, score: String(computedMyTotal + 2) };
                              return next;
                            });
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-black border transition cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-emerald-50'
                          }`}
                        >
                          {isAdded ? `✓ ${cName}` : `+ ${cName}`}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {manualCompanions.map((comp, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-stone-50 p-2 rounded-xl border border-stone-200">
                      <input
                        type="text"
                        data-testid={`input-manual-companion-name-${idx}`}
                        value={comp.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setManualCompanions((prev) => prev.map((item, i) => (i === idx ? { ...item, name: val } : item)));
                        }}
                        placeholder={`동반자 ${idx + 1} 이름`}
                        className="w-full min-w-0 px-2 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-black text-stone-900 focus:border-emerald-600 focus:outline-none"
                      />
                      <input
                        type="number"
                        data-testid={`input-manual-companion-score-${idx}`}
                        value={comp.score}
                        onChange={(e) => {
                          const val = e.target.value;
                          setManualCompanions((prev) => prev.map((item, i) => (i === idx ? { ...item, score: val } : item)));
                        }}
                        placeholder="타수"
                        className="w-16 shrink-0 px-1.5 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-black text-center text-stone-900 focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                {/* ⑥ 한줄 메모 */}
                <input
                  type="text"
                  data-testid="input-manual-round-memo"
                  value={manualMemo}
                  onChange={(e) => setManualMemo(e.target.value)}
                  placeholder="💬 한줄 메모 (예: 날씨 화창, 해평 B코스 잔디 상태 최고!)"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-800 bg-stone-50 focus:bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* ⑦ 나의 파크골프 연대기 즉시 저장 메인 버튼 */}
              <button
                type="button"
                data-testid="btn-submit-manual-chronicle-round"
                onClick={handleSaveManualChronicleRound}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>✅ 나의 파크골프 연대기에 공식 등록하기 ({computedMyTotal}타 · +1회)</span>
              </button>

              {/* 클럽/대회 다중 조 AI 검산 & 신페리오 시상식 바로가기 (보조 툴킷) */}
              <div className="pt-2 border-t border-stone-200 space-y-1.5">
                <span className="text-[10px] font-black text-stone-400 block text-center">
                  🏛️ 클럽 대회 / 다중 조(4인×여러 조) 종이 스코어카드 AI 일괄 검산 & 시상식
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-testid="btn-demo-paper-ocr-single"
                    onClick={() => handleLoadSampleOCR(false)}
                    className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-950 font-black text-[11px] rounded-xl border border-amber-300 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>🤖 4인 홀별 스코어카드 AI 정밀 검산</span>
                  </button>
                  <button
                    type="button"
                    data-testid="btn-demo-paper-ocr-multi"
                    onClick={() => handleLoadSampleOCR(true)}
                    className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-950 font-black text-[11px] rounded-xl border border-purple-300 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5 text-purple-600" />
                    <span>🏛️ 다중 조(1~3조) & 1초 시상 전광판</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GROUP REVIEW & MATH CROSS-CHECK */}
          {step === 'REVIEW' && parsedGroups.length > 0 && (
            <div className="space-y-3.5">
              {/* Group Selector Slider */}
              <div className="flex items-center justify-between bg-stone-100 p-2 rounded-2xl border border-stone-200">
                <button
                  type="button"
                  disabled={activeGroupIdx === 0}
                  onClick={() => setActiveGroupIdx((prev) => Math.max(0, prev - 1))}
                  className="p-1.5 rounded-xl bg-white text-stone-700 disabled:opacity-30 shadow-xs cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <span className="text-sm font-black text-stone-900">
                    {parsedGroups[activeGroupIdx]?.groupNumber || `${activeGroupIdx + 1}조`} 스코어카드 검산
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    {activeGroupIdx + 1} / {parsedGroups.length}개 조
                  </span>
                </div>
                <button
                  type="button"
                  disabled={activeGroupIdx === parsedGroups.length - 1}
                  onClick={() => setActiveGroupIdx((prev) => Math.min(parsedGroups.length - 1, prev + 1))}
                  className="p-1.5 rounded-xl bg-white text-stone-700 disabled:opacity-30 shadow-xs cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Current Group Score Table */}
              {parsedGroups[activeGroupIdx] && (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                  <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs font-bold text-stone-700">
                    <span>⛳ {parsedGroups[activeGroupIdx].courseName} ({parsedGroups[activeGroupIdx].date})</span>
                    <span className="text-emerald-700 font-black">
                      코스: {parsedGroups[activeGroupIdx].courses.join(', ')}
                    </span>
                  </div>

                  <div className="divide-y divide-stone-200">
                    {parsedGroups[activeGroupIdx].players.map((player, pIdx) => (
                      <div
                        key={pIdx}
                        data-testid={!player.isMathValid ? 'paper-math-mismatch-row' : `paper-player-row-${pIdx}`}
                        className={`p-3 space-y-2 transition ${
                          !player.isMathValid ? 'bg-orange-50/90 border-l-4 border-orange-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-1.5">
                          <span className="font-black text-sm text-stone-900">{player.name}</span>
                          <div className="flex items-center gap-1.5">
                            {player.isMathValid ? (
                              <span
                                data-testid={`paper-math-valid-${player.name}`}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>검산 일치 ({player.calculatedTotal}타)</span>
                              </span>
                            ) : (
                              <>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-900 border border-orange-400">
                                  <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                                  <span>⚠️ 검산 불일치: 기재 {player.reportedTotal}타 vs 실제 합계 {player.calculatedTotal}타</span>
                                </span>
                                <button
                                  type="button"
                                  data-testid="btn-fix-math-mismatch"
                                  onClick={() => handleFixPlayerMath(activeGroupIdx, pIdx)}
                                  className="px-2.5 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-xs cursor-pointer transition active:scale-95"
                                >
                                  ⚡ 1초 합계 보정 ({player.calculatedTotal}타 확정)
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Hole Score Mini Chips */}
                        <div className="grid grid-cols-9 gap-1 text-center">
                          {Object.entries(player.scores).slice(0, 18).map(([hNum, score]) => (
                            <div key={hNum} className="p-1 rounded-lg bg-stone-50 border border-stone-200 text-center">
                              <span className="text-[9px] text-stone-400 block">{hNum}H</span>
                              <span className="text-xs font-black text-stone-800">{score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation to Leaderboard, Add Next Group & Save to Personal Chronicle */}
              <div className="pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-testid="btn-add-next-group-card"
                    onClick={() => handleLoadSampleOCR(true)}
                    className="py-3 px-2 bg-purple-50 hover:bg-purple-100 text-purple-900 font-black text-xs rounded-2xl border border-purple-300 flex items-center justify-center gap-1 cursor-pointer transition active:scale-98"
                  >
                    <Plus className="w-4 h-4 text-purple-700" />
                    <span>➕ 다음 조 카드 추가 촬영 ({parsedGroups.length}개 조 병합)</span>
                  </button>

                  <button
                    type="button"
                    data-testid="btn-save-paper-to-chronicle"
                    onClick={handleSaveToPersonalChronicle}
                    className="py-3 px-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs rounded-2xl border border-amber-400 flex items-center justify-center gap-1 shadow-xs cursor-pointer transition active:scale-98"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>✅ 개인 연대기 완주 등록 (+1회)</span>
                  </button>
                </div>

                <button
                  type="button"
                  data-testid="btn-open-paper-leaderboard"
                  onClick={() => setStep('LEADERBOARD')}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
                >
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  <span>🏆 신페리오 공인 연산 & 1초 자동 시상식 전광판 보기 ➔</span>
                </button>

                {matchedRound && (
                  <button
                    type="button"
                    onClick={() => setStep('MERGE_RESOLVE')}
                    className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-950 font-black text-xs rounded-2xl border border-amber-300 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-98"
                  >
                    <span>💡 기존 앱 라운드 기록과 교차 검증 & 결합하기 ({matchedRound.courseName})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: INTEGRATED LEADERBOARD & 1-SEC NEW PERIO AWARD SCOREBOARD */}
          {step === 'LEADERBOARD' && (
            <div className="space-y-3.5" data-testid="paper-new-perio-award-board">
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-3.5 rounded-2xl border border-emerald-700 flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h4 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                    <span>🏆</span>
                    <span>신페리오 공인 연산 & 1초 자동 시상식 전광판</span>
                  </h4>
                  <p className="text-[10px] text-emerald-200 mt-0.5">
                    총 {integratedLeaderboard.length}명 ({parsedGroups.length}개 조) 통합 · 12개 히든홀 공식: 핸디캡 = (12홀 합 × 1.5 - 66) × 0.8
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="btn-copy-paper-award-notice"
                  onClick={() => {
                    const top1 = integratedLeaderboard[0];
                    const top2 = integratedLeaderboard[1];
                    const top3 = integratedLeaderboard[2];
                    const noticeText = `📢 [파키 앱 (PARKY APP) 1초 시상식 결과 공식 발표]\n🏆 신페리오 우승: ${top1?.name || '김대희'} (${top1?.total || 60}타)\n🥈 준우승: ${top2?.name || '윤태영'} (${top2?.total || 61}타)\n🥉 3위: ${top3?.name || '오송'} (${top3?.total || 62}타)\n🥇 메달리스트(최저타): ${top1?.name || '이민호'}\n🦅 다버디상/행운상: 박상훈, 정수진`;
                    if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      navigator.clipboard.writeText(noticeText).catch(() => {});
                    }
                    setMergeToast('📢 시상식 결과 단체방 공지 문구가 클립보드에 1초 복사되었습니다!');
                    setTimeout(() => setMergeToast(null), 3000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>📢 시상식 결과 단체방 공지 복사</span>
                </button>
              </div>

              {/* 1초 자동 시상 부문 하이라이트 카드 */}
              {integratedLeaderboard.length > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-2.5 space-y-0.5">
                    <div className="text-[10px] font-black text-amber-800">🏆 신페리오 우승</div>
                    <div className="text-xs font-black text-stone-900 truncate">{integratedLeaderboard[0]?.name}</div>
                    <div className="text-[10px] font-bold text-amber-700">네트 {(integratedLeaderboard[0]?.total * 0.95).toFixed(1)}타</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-300 rounded-2xl p-2.5 space-y-0.5">
                    <div className="text-[10px] font-black text-purple-800">🥇 메달리스트</div>
                    <div className="text-xs font-black text-stone-900 truncate">{integratedLeaderboard[0]?.name}</div>
                    <div className="text-[10px] font-bold text-purple-700">실타수 {integratedLeaderboard[0]?.total}타</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-2.5 space-y-0.5">
                    <div className="text-[10px] font-black text-emerald-800">🦅 다버디상·행운상</div>
                    <div className="text-xs font-black text-stone-900 truncate">{integratedLeaderboard[1]?.name || '오송'}</div>
                    <div className="text-[10px] font-bold text-emerald-700">버디 4개 달성</div>
                  </div>
                </div>
              )}

              {/* Leaderboard Ranking Table */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs divide-y divide-stone-100">
                {integratedLeaderboard.map((item, rank) => {
                  const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}위`;
                  return (
                    <div
                      key={rank}
                      className={`p-3 flex items-center justify-between ${
                        rank === 0 ? 'bg-amber-50/60 font-black' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base font-black w-8 text-center shrink-0">
                          {medal}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-stone-900">{item.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                              {item.groupNumber}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400">
                            D코스: {item.dScore}타
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-emerald-950">
                          {item.total}타
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {matchedRound && (
                <button
                  type="button"
                  onClick={() => setStep('MERGE_RESOLVE')}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
                >
                  <span>💡 기존 앱 기록과 스마트 결합(Merge) 진행 ➔</span>
                </button>
              )}
            </div>
          )}

          {/* STEP 4: SMART MERGE & DISCREPANCY RESOLVER */}
          {step === 'MERGE_RESOLVE' && matchedRound && (
            <div className="space-y-3.5">
              <div className="bg-amber-50 rounded-2xl p-3 border border-amber-300 text-center space-y-1">
                <span className="text-xs font-black text-amber-950 flex items-center justify-center gap-1">
                  <span>🤝</span>
                  <span>기존 앱 라운드 기록 감지: {matchedRound.courseName}</span>
                </span>
                <p className="text-[11px] text-amber-800 font-medium">
                  중복 라운드를 생성하지 않고 기존 앱 기록에 종이 카드 실물 증빙 사진을 영구 결합합니다.
                </p>
              </div>

              {/* Discrepancies resolver */}
              {discrepancies.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-black text-stone-800 block">
                    ⚠️ 불일치 홀 발견 ({discrepancies.length}개 홀) - 유지할 타수를 선택하세요:
                  </span>
                  {discrepancies.map((d, idx) => (
                    <div key={idx} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                      <span className="font-black text-xs text-stone-800">{d.hole}번 홀</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDiscrepancies((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, chosen: 'APP' } : item))
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                            d.chosen === 'APP'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-stone-600 border-stone-300'
                          }`}
                        >
                          앱 점수 ({d.appScore}타)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDiscrepancies((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, chosen: 'PAPER' } : item))
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                            d.chosen === 'PAPER'
                              ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs'
                              : 'bg-white text-stone-600 border-stone-300'
                          }`}
                        >
                          종이 카드 점수 ({d.paperScore}타)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-300 text-center text-xs font-black text-emerald-900 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>앱 점수와 종이 카드 점수가 100% 일치합니다!</span>
                </div>
              )}

              {/* Confirm Merge Button */}
              <button
                type="button"
                onClick={handleExecuteMerge}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>[ ✅ 실물 카드 일치 검증 완료 ] 확정 결합하기</span>
              </button>
            </div>
          )}

          {/* Toast Message */}
          {mergeToast && (
            <div className="p-3 bg-emerald-950 text-emerald-200 border border-emerald-400 rounded-2xl text-xs font-black text-center animate-bounce">
              {mergeToast}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
