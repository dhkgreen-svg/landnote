'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Trash2,
  Trophy,
  Camera,
  Download,
  Sparkles,
  Scissors,
  Check,
  CheckSquare,
  Square,
  ShieldCheck,
  MapPin,
  Clock,
  Lock,
  Plus,
} from 'lucide-react';
import { Course, RoundSession, RoundPlayer } from '@/types/parkon';
import { HoleScoreBadge, ScoreBadgeLegend } from '@/components/HoleScoreBadge';
import { formatPlayerDisplayName } from '@/lib/playerUtils';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { ParkOnStorage } from '@/lib/storage';
import { generateScorecardImage, GeneratedScorecardResult } from '@/lib/scorecardImageGenerator';

export interface RoundScoreboardModalProps {
  round: RoundSession | null;
  courses?: Course[];
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (roundId: string) => void;
  onUpdate?: (updatedRound: RoundSession) => void;
}

const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function RoundScoreboardModal({
  round,
  courses,
  isOpen,
  onClose,
  onDelete,
  onUpdate,
}: RoundScoreboardModalProps) {
  const { isJapanese, isEnglish } = useTranslation();
  const [currentRound, setCurrentRound] = useState<RoundSession | null>(round);
  const [modalActiveTab, setModalActiveTab] = useState<'COURSES' | 'INTEGRATED' | 'PHOTOS' | 'CERTIFICATE'>('COURSES');
  const [courseFilterLetter, setCourseFilterLetter] = useState<string>('ALL');
  const [selectedCourseKeys, setSelectedCourseKeys] = useState<string[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [previewImageResult, setPreviewImageResult] = useState<GeneratedScorecardResult | null>(null);
  const [selectedPhotoForZoom, setSelectedPhotoForZoom] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [pruneToast, setPruneToast] = useState<string | null>(null);

  useEffect(() => {
    setCurrentRound(round);
    setSelectedCourseKeys([]);
  }, [round]);

  // Clean up Object URL on unmount to free memory
  useEffect(() => {
    return () => {
      if (previewImageResult?.objectUrl) {
        try {
          URL.revokeObjectURL(previewImageResult.objectUrl);
        } catch {}
      }
    };
  }, [previewImageResult]);

  // Resolve Course data
  const activeCourse: Course = useMemo(() => {
    if (!currentRound) {
      return {
        id: 'default',
        name: '파크골프장',
        region: '전국',
        isVerified: true,
        totalHoles: 18,
        totalCourses: 2,
        address: '',
        holesMetadata: Array.from({ length: 72 }, (_, i) => ({
          hole: i + 1,
          par: (i + 1) % 3 === 0 ? 5 : (i + 1) % 2 === 0 ? 4 : 3,
          distanceMeter: 50,
        })),
      };
    }
    const allCourses = courses || ParkOnStorage.getAllCourses();
    const found = allCourses.find((c) => c.id === currentRound.courseId || c.name === currentRound.courseName);
    if (found && found.holesMetadata && found.holesMetadata.length > 0) {
      return found;
    }
    return {
      id: currentRound.courseId || 'default',
      name: currentRound.courseName || '파크골프장',
      region: '전국',
      isVerified: true,
      totalHoles: currentRound.totalHoles || 18,
      totalCourses: Math.max(1, Math.ceil((currentRound.totalHoles || 18) / 9)),
      address: '',
      holesMetadata: Array.from({ length: 72 }, (_, i) => ({
        hole: i + 1,
        par: (i + 1) % 3 === 0 ? 5 : (i + 1) % 2 === 0 ? 4 : 3,
        distanceMeter: 50,
      })),
    };
  }, [currentRound, courses]);

  // Helper to extract base hole (1..72), round number (1, 2, ...), course letter, and hole-in-course (1..9)
  const getHoleInfo = (hNum: number) => {
    const num = Number(hNum);
    const base = ((num - 1) % 1000) + 1;
    const roundNum = Math.floor((num - 1) / 1000) + 1;
    const cIdx = Math.floor((base - 1) / 9);
    const cLetter = COURSE_LETTERS[cIdx] || 'A';
    const hInCourse = ((base - 1) % 9) + 1;
    return { num, base, round: roundNum, cLetter, hInCourse, cIdx };
  };

  // Derive all confirmed/scored holes
  const confirmedHoles: number[] = useMemo(() => {
    if (!currentRound) return [];
    if (currentRound.confirmedHoles && currentRound.confirmedHoles.length > 0) {
      return currentRound.confirmedHoles;
    }
    const holeSet = new Set<number>();
    (currentRound.players || []).forEach((p) => {
      Object.keys(p.scores || {}).forEach((k) => {
        const hNum = Number(k);
        if (hNum > 0 && p.scores[hNum] !== undefined && p.scores[hNum] > 0) {
          holeSet.add(hNum);
        }
      });
    });
    if (holeSet.size > 0) {
      return Array.from(holeSet).sort((a, b) => a - b);
    }
    if (currentRound.selectedHoleNumbers && currentRound.selectedHoleNumbers.length > 0) {
      return currentRound.selectedHoleNumbers;
    }
    return Array.from({ length: currentRound.totalHoles || 18 }, (_, i) => i + 1);
  }, [currentRound]);

  // Course segments calculation (A코스, B코스...)
  const courseSegments = useMemo(() => {
    if (!currentRound || confirmedHoles.length === 0) return [];
    const allHoleInfos = confirmedHoles.map(getHoleInfo);

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

    return distinctSegments.map((seg) => {
      const key = `${seg.cLetter}_${seg.round}`;
      const roundOffset = (seg.round - 1) * 1000;
      const courseStartHole = seg.cIdx * 9 + 1;
      const fullHoles = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => roundOffset + courseStartHole + i);
      const confirmedInSeg = fullHoles.filter((h) => confirmedHoles.includes(h));
      const playedCount = confirmedInSeg.length;
      const isCompleted = playedCount >= 9;

      const segmentPar = confirmedInSeg.reduce((sum, h) => {
        const base = ((h - 1) % 1000) + 1;
        const meta = activeCourse.holesMetadata?.find((m) => Number(m.hole) === base);
        return sum + Number(meta?.par || (base % 3 === 0 ? 5 : base % 2 === 0 ? 4 : 3));
      }, 0);

      const title = roundsPerLetter[seg.cLetter] > 1 || seg.round > 1
        ? `${seg.cLetter}코스 (${seg.round}회차)`
        : `${seg.cLetter}코스`;

      const playerSummaries = (currentRound.players || []).map((p) => {
        const strokes = confirmedInSeg.reduce((sum, h) => sum + (p.scores?.[h] || 0), 0);
        const diff = strokes - segmentPar;
        const avgHole = playedCount > 0 ? (strokes / playedCount).toFixed(2) : '0.00';

        const holeDetails = fullHoles.map((hNum, i) => {
          const base = ((hNum - 1) % 1000) + 1;
          const meta = activeCourse.holesMetadata?.find((m) => Number(m.hole) === base);
          const par = Number(meta?.par || (base % 3 === 0 ? 5 : base % 2 === 0 ? 4 : 3));
          const isConfirmed = confirmedHoles.includes(hNum);
          const s = isConfirmed ? p.scores?.[hNum] : undefined;
          const d = s !== undefined ? s - par : undefined;
          const ob = p.obCount?.[hNum] || 0;
          return {
            hNum,
            baseHole: base,
            holeInCourse: i + 1,
            par,
            isConfirmed,
            strokes: s,
            diff: d,
            ob,
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
      }).sort((a, b) => a.strokes - b.strokes);

      return {
        key,
        cLetter: seg.cLetter,
        round: seg.round,
        title,
        fullHoles,
        confirmedInSeg,
        playedCount,
        isCompleted,
        segmentPar,
        playerSummaries,
      };
    });
  }, [currentRound, confirmedHoles, activeCourse]);

  const allSegmentKeys = useMemo(() => courseSegments.map((s) => s.key), [courseSegments]);

  // Active filtered segments based on user course selection
  const activeSegments = useMemo(() => {
    if (selectedCourseKeys.length === 0) return courseSegments;
    return courseSegments.filter((s) => selectedCourseKeys.includes(s.key));
  }, [courseSegments, selectedCourseKeys]);

  const toggleCourseSelection = (key: string) => {
    setSelectedCourseKeys((prev) => {
      const current = prev.length > 0 ? prev : allSegmentKeys;
      if (current.includes(key)) {
        if (current.length === 1) return current; // Keep at least one course
        return current.filter((k) => k !== key);
      } else {
        return [...current, key];
      }
    });
  };

  const activeConfirmedHoles = useMemo(() => {
    return activeSegments.flatMap((s) => s.confirmedInSeg);
  }, [activeSegments]);

  const activeTotalPar = useMemo(() => {
    return activeSegments.reduce((sum, s) => sum + s.segmentPar, 0);
  }, [activeSegments]);

  const isFiltered = activeSegments.length < courseSegments.length;

  // Integrated 4-Player Leaderboard recalculated dynamically for active segments
  const integratedSummary = useMemo(() => {
    if (!currentRound) return [];

    return (currentRound.players || []).map((p, originalIdx) => {
      const scoredHoles = activeConfirmedHoles.filter((h) => (p.scores?.[h] || 0) > 0);
      const strokes = scoredHoles.reduce((sum, h) => sum + (p.scores?.[h] || 0), 0);
      const diff = strokes - activeTotalPar;
      const scoredCount = scoredHoles.length;
      const avgPerHole = scoredCount > 0 ? (strokes / scoredCount).toFixed(2) : '0.00';
      const converted9Hole = scoredCount > 0 ? ((strokes / scoredCount) * 9).toFixed(1) : '0.0';
      const converted18Hole = scoredCount > 0 ? ((strokes / scoredCount) * 18).toFixed(1) : '0.0';
      const totalOB = activeConfirmedHoles.reduce<number>((acc, h) => acc + (p.obCount?.[h] || 0), 0);

      return {
        player: p,
        originalIdx,
        strokes,
        diff,
        scoredCount,
        avgPerHole,
        converted9Hole,
        converted18Hole,
        totalOB,
      };
    }).sort((a, b) => a.strokes - b.strokes);
  }, [currentRound, activeConfirmedHoles, activeTotalPar]);

  // Pruning function: Permanently exclude unselected courses and keep only chosen ones
  const handlePruneUnselected = () => {
    if (!currentRound) return;
    const selectedNames = activeSegments.map((s) => s.title).join(', ');
    const confirmMsg = isJapanese
      ? `選択した【${selectedNames}】のみを残し、除外されたコースのスコア記録を永久削除しますか？`
      : `선택하신 [${selectedNames}] 기록(${activeConfirmedHoles.length}홀)만 남기고, 나머지 제외된 코스 기록을 영구 삭제하시겠습니까?\n(삭제 후 다시 복구할 수 없습니다.)`;

    if (!window.confirm(confirmMsg)) return;

    const updatedPlayers = currentRound.players.map((p) => {
      const newScores: Record<number, number> = {};
      const newOb: Record<number, number> = {};
      let totalStrokes = 0;

      activeConfirmedHoles.forEach((h) => {
        const s = p.scores?.[h];
        if (s !== undefined && s > 0) {
          newScores[h] = s;
          totalStrokes += s;
        }
        const o = p.obCount?.[h];
        if (o !== undefined && o > 0) {
          newOb[h] = o;
        }
      });

      return {
        ...p,
        scores: newScores,
        obCount: newOb,
        totalStrokes,
        totalParDiff: totalStrokes - activeTotalPar,
      };
    });

    const activeLetters = Array.from(new Set(activeSegments.map((s) => s.cLetter)));
    const updatedRound: RoundSession = {
      ...currentRound,
      players: updatedPlayers,
      totalHoles: activeConfirmedHoles.length,
      confirmedHoles: activeConfirmedHoles,
      selectedCourseLetters: activeLetters,
    };

    setCurrentRound(updatedRound);
    ParkOnStorage.saveCompletedRound(updatedRound);
    onUpdate?.(updatedRound);
    setSelectedCourseKeys([]);
    setPruneToast(
      isJapanese
        ? `【${selectedNames}】のみを反映して保存しました！`
        : `선택하신 [${selectedNames}] ${activeConfirmedHoles.length}홀만 깔끔하게 저장되었습니다!`
    );
    setTimeout(() => setPruneToast(null), 3500);
  };

  // ⛳ [대표님 지시] 특정 코스 1개만 단독 1클릭 영구 삭제 (완주한 나머지 코스 기록은 안전 보존)
  const handleDeleteSingleCourse = (targetSegKey: string) => {
    if (!currentRound) return;
    if (courseSegments.length <= 1) {
      alert(
        isJapanese
          ? '最後の1コースは個別削除できません。下部の「全試合削除」をご利用ください。'
          : '남은 1개 코스는 개별 삭제할 수 없습니다. 이 경기 전체를 지우시려면 하단의 [전체 경기 삭제] 버튼을 이용해 주세요.'
      );
      return;
    }

    const targetSeg = courseSegments.find((s) => s.key === targetSegKey);
    if (!targetSeg) return;

    const remainingSegs = courseSegments.filter((s) => s.key !== targetSegKey);
    const remainingNames = remainingSegs.map((s) => s.title).join(', ');
    const confirmMsg = isJapanese
      ? `【${targetSeg.title}】(${targetSeg.confirmedInSeg.length}ホール) の記録をこの試合から完全に削除しますか？\n\n※ 完走した【${remainingNames}】の記録は安全に保存されます。`
      : `[${targetSeg.title}] (${targetSeg.confirmedInSeg.length}홀) 기록을 이 경기에서 완전히 삭제하시겠습니까?\n\n※ 완주하신 [${remainingNames}] 기록은 안전하게 보존됩니다.`;

    if (!window.confirm(confirmMsg)) return;

    const remainingConfirmedHoles = remainingSegs.flatMap((s) => s.confirmedInSeg);
    const remainingTotalPar = remainingSegs.reduce((sum, s) => sum + s.segmentPar, 0);

    const updatedPlayers = currentRound.players.map((p) => {
      const newScores: Record<number, number> = {};
      const newOb: Record<number, number> = {};
      let totalStrokes = 0;

      remainingConfirmedHoles.forEach((h) => {
        const s = p.scores?.[h];
        if (s !== undefined && s > 0) {
          newScores[h] = s;
          totalStrokes += s;
        }
        const o = p.obCount?.[h];
        if (o !== undefined && o > 0) {
          newOb[h] = o;
        }
      });

      return {
        ...p,
        scores: newScores,
        obCount: newOb,
        totalStrokes,
        totalParDiff: totalStrokes - remainingTotalPar,
      };
    });

    const remainingLetters = Array.from(new Set(remainingSegs.map((s) => s.cLetter)));
    const updatedRound: RoundSession = {
      ...currentRound,
      players: updatedPlayers,
      totalHoles: remainingConfirmedHoles.length,
      confirmedHoles: remainingConfirmedHoles,
      selectedCourseLetters: remainingLetters,
    };

    setCurrentRound(updatedRound);
    ParkOnStorage.saveCompletedRound(updatedRound);
    onUpdate?.(updatedRound);
    setSelectedCourseKeys((prev) => prev.filter((k) => k !== targetSegKey));
    setPruneToast(
      isJapanese
        ? `【${targetSeg.title}】を削除しました。残りの【${remainingNames}】(${remainingConfirmedHoles.length}ホール)で保存されました！`
        : `[${targetSeg.title}]가 삭제되었습니다. 남은 [${remainingNames}] (${remainingConfirmedHoles.length}홀)로 안전하게 저장되었습니다!`
    );
    setTimeout(() => setPruneToast(null), 3500);
  };

  // 📸 현장 사진 추가 핸들러 (스마트 1200px 캔버스 압축으로 브라우저 메모리 폭주 및 용량 초과 원천 방지)
  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentRound) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const srcUrl = event.target?.result as string;
      if (!srcUrl) return;

      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let w = img.width;
        let h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          const updatedPhotos = [...(currentRound.photos || []), compressedDataUrl];
          const updatedRound: RoundSession = {
            ...currentRound,
            photos: updatedPhotos,
          };
          setCurrentRound(updatedRound);
          ParkOnStorage.saveCompletedRound(updatedRound);
          setShareToast(isJapanese ? '📸 現地写真を追加しました！' : '📸 현장 기념사진이 추가되었습니다!');
          setTimeout(() => setShareToast(null), 3000);
        }
      };
      img.src = srcUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 📥 [대표님 1순위 핵심 지시]: 스코어카드 이미지 파일 초고속 다운로드 (폰 갤러리에 즉시 저장)
  const handleDownloadScorecardImage = async () => {
    if (!currentRound) return;
    setIsGeneratingImage(true);
    try {
      const activeLetters = activeSegments.map((s) => s.cLetter);
      const res = await generateScorecardImage({
        round: currentRound,
        course: activeCourse,
        selectedCourseLetters: activeLetters,
        isJapanese,
      });

      if (!res) throw new Error('Failed to generate image');

      // 이전 생성된 메모리 Blob URL 안전 해제
      if (previewImageResult?.objectUrl) {
        try {
          URL.revokeObjectURL(previewImageResult.objectUrl);
        } catch {}
      }

      // 0.05초 만에 직접 파일 다운로드 트리거
      const link = document.createElement('a');
      link.download = res.fileName;
      link.href = res.objectUrl || res.dataUrl;
      link.click();

      setPreviewImageResult(res);
      setShareToast(
        isJapanese
          ? '✅ スコアカード画像が端末に保存されました！'
          : '✅ 스코어카드가 갤러리에 저장되었습니다! 카톡이나 라인 대화방에서 사진으로 보내보세요.'
      );
    } catch (e) {
      console.error('Download error:', e);
      alert(isJapanese ? '画像生成に失敗しました。' : '스코어카드 이미지 생성에 실패했습니다.');
    } finally {
      setIsGeneratingImage(false);
      setTimeout(() => setShareToast(null), 4000);
    }
  };

  if (!isOpen || !currentRound) return null;

  // Date and exact immutable timestamps
  const endDObj = currentRound.completedAt ? new Date(currentRound.completedAt) : currentRound.startedAt ? new Date(currentRound.startedAt) : new Date();
  const startDObj = currentRound.startedAt ? new Date(currentRound.startedAt) : endDObj;
  const dateFormatted = `${startDObj.getFullYear()}.${String(startDObj.getMonth() + 1).padStart(2, '0')}.${String(startDObj.getDate()).padStart(2, '0')} (${['일', '월', '화', '수', '목', '금', '토'][startDObj.getDay()]})`;

  const startTimeStr = startDObj.toLocaleTimeString(isJapanese ? 'ja-JP' : 'ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const endTimeStr = endDObj.toLocaleTimeString(isJapanese ? 'ja-JP' : 'ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const durationMin = currentRound.durationMinutes || Math.max(1, Math.round((endDObj.getTime() - startDObj.getTime()) / 60000));
  const durationText = durationMin >= 60 ? `${Math.floor(durationMin / 60)}시간 ${durationMin % 60}분` : `${durationMin}분`;

  const isOfficial = currentRound.isOfficial !== false && !currentRound.isVirtual;
  const is18Holes = activeConfirmedHoles.length >= 18;
  const holesCount = activeConfirmedHoles.length || currentRound.totalHoles || 9;
  const isRealisticTime = durationMin >= (holesCount <= 9 ? 25 : 50);
  const isFieldVerified = currentRound.isFieldVerified ?? (isOfficial && isRealisticTime && !currentRound.isVirtual);
  const isFastTest = !isRealisticTime && durationMin < 15;

  const handleDelete = () => {
    if (!onDelete) return;
    const msg = isJapanese
      ? `本当にこの試合全体（${currentRound.courseName} · ${dateFormatted} · ${activeConfirmedHoles.length}ホール）の記録を削除しますか？\n\n※ すべてのコース記録が完全に削除され、復元できません。`
      : `정말 이 경기 전체(${currentRound.courseName} · ${dateFormatted} · ${activeConfirmedHoles.length}홀) 기록을 완전히 삭제하시겠습니까?\n\n※ 모든 코스 기록이 영구 삭제되며 복구할 수 없습니다. (특정 코스만 지우시려면 상단 코스 목록의 [🗑️] 버튼을 이용해 주세요)`;
    if (window.confirm(msg)) {
      onDelete(currentRound.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-3xl p-4 space-y-3 shadow-2xl border border-stone-200 max-h-[92vh] flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notifier */}
        {(shareToast || pruneToast) && (
          <div className="p-3 bg-emerald-800 text-white rounded-2xl shadow-lg text-center text-xs font-black flex items-center justify-center gap-1.5 animate-in fade-in shrink-0">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{shareToast || pruneToast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-xl font-black shadow-xs shrink-0">
              ⛳
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-stone-900 text-base leading-tight truncate">
                  {currentRound.courseName}
                </h3>
                {isFieldVerified ? (
                  <span className="text-[9.5px] bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 border border-amber-300 shadow-xs">
                    <span>🏅</span>
                    <span>{isJapanese ? 'コース公式完走 認証' : '정규 필드 완주 인증'}</span>
                  </span>
                ) : isFastTest ? (
                  <span className="text-[9px] bg-stone-200 text-stone-700 font-bold px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5">
                    <span>🧪</span>
                    <span>{isJapanese ? '模擬 / 入力テスト' : '모의 / 빠른 입력'}</span>
                  </span>
                ) : (
                  <span className="text-[9px] bg-stone-100 text-stone-600 font-medium px-1.5 py-0.5 rounded-full shrink-0">
                    {isJapanese ? '一般記録' : '일반 기록'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 font-medium truncate flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-stone-400" />
                <span>{dateFormatted} · {startTimeStr} ~ {endTimeStr} ({durationText} 소요)</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center font-bold text-base transition shrink-0 cursor-pointer ml-2 active:scale-95"
            title={isJapanese ? '閉じる' : '닫기'}
          >
            ✕
          </button>
        </div>

        {/* ⛳ [대표님 지시] 코스 선택 & 개별 삭제 필터 바 (예: A, B는 치고 C는 미플레이 시 C 제외 또는 C 단독 영구 삭제) */}
        {courseSegments.length > 1 && (
          <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl p-3 space-y-2.5 shrink-0 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <span>⛳ 코스 선택 및 개별 삭제:</span>
                </span>
                <p className="text-[10px] text-emerald-800/80 font-medium mt-0.5">
                  터치하여 스코어카드에서 <b>[제외]</b>하거나, <b>[🗑️]</b>를 눌러 해당 코스만 완전히 삭제할 수 있습니다.
                </p>
              </div>
              <span className="text-[10.5px] text-emerald-900 font-black bg-white px-2 py-0.5 rounded-lg border border-emerald-300 shrink-0">
                {activeSegments.length}개 코스 ({activeConfirmedHoles.length}홀 · Par {activeTotalPar})
              </span>
            </div>

            {/* 개별 코스 토글 체크 & 단독 1클릭 삭제 버튼들 */}
            <div className="flex flex-wrap items-center gap-1.5">
              {courseSegments.map((seg) => {
                const isChecked = activeSegments.some((s) => s.key === seg.key);
                return (
                  <div
                    key={seg.key}
                    className={`inline-flex items-center rounded-xl text-xs font-black transition border shadow-2xs overflow-hidden ${
                      isChecked
                        ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-500/30'
                        : 'bg-stone-100 text-stone-400 border-stone-300 opacity-75'
                    }`}
                  >
                    {/* 포함/제외 토글 영역 */}
                    <button
                      type="button"
                      onClick={() => toggleCourseSelection(seg.key)}
                      className="py-1.5 pl-2.5 pr-2 flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title={isChecked ? '클릭 시 이번 스코어카드에서 임시 제외' : '클릭 시 스코어카드에 다시 포함'}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-yellow-300 stroke-[2.5]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-stone-400" />
                      )}
                      <span className={isChecked ? '' : 'line-through'}>
                        {seg.title} ({seg.confirmedInSeg.length}H)
                      </span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-black ${
                          isChecked ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-500'
                        }`}
                      >
                        {isChecked ? '포함' : '제외됨'}
                      </span>
                    </button>

                    {/* 개별 코스 단독 영구 삭제 버튼 (1클릭 삭제) */}
                    {courseSegments.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSingleCourse(seg.key);
                        }}
                        className={`py-1.5 px-2 border-l transition cursor-pointer flex items-center justify-center active:scale-90 ${
                          isChecked
                            ? 'border-emerald-600/70 hover:bg-rose-600 text-emerald-200 hover:text-white'
                            : 'border-stone-200 hover:bg-rose-100 text-stone-400 hover:text-rose-600'
                        }`}
                        title={`${seg.title} 기록만 이 경기에서 영구 삭제`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* 전체 선택 빠른 복귀 버튼 */}
              {isFiltered && (
                <button
                  type="button"
                  onClick={() => setSelectedCourseKeys([])}
                  className="py-1 px-2.5 bg-white hover:bg-stone-100 text-emerald-800 border border-emerald-300 rounded-xl text-[10.5px] font-black cursor-pointer transition active:scale-95 ml-auto"
                >
                  🔄 전체 다시 선택
                </button>
              )}
            </div>

            {/* 제외된 코스 일괄 영구 삭제 버튼 */}
            {isFiltered && (
              <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
                <span className="text-[10px] text-stone-600 font-medium">
                  * 제외된 코스는 스코어카드 및 완주증에서 자동 제외됩니다.
                </span>
                <button
                  type="button"
                  onClick={handlePruneUnselected}
                  className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-[10.5px] font-black flex items-center gap-1 cursor-pointer transition active:scale-95"
                  title="체크 해제된 모든 코스를 한 번에 영구 삭제"
                >
                  <Scissors className="w-3 h-3" />
                  <span>제외 코스 일괄 영구 삭제</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ⛳ [대표님 핵심 지시 - 방안 A]: 4-Mode Tabs (코스별, 통합, 현장 사진(N장), 공인 완주증) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setModalActiveTab('COURSES')}
            className={`py-2 px-0.5 rounded-xl font-black text-[11px] sm:text-xs transition flex items-center justify-center gap-0.5 shadow-xs cursor-pointer ${
              modalActiveTab === 'COURSES'
                ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-500'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>{isJapanese ? '📋 コース' : '📋 코스별'}</span>
            <span className="text-[9px] px-1 py-0.2 rounded-full bg-white/20">
              {activeSegments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setModalActiveTab('INTEGRATED')}
            className={`py-2 px-0.5 rounded-xl font-black text-[11px] sm:text-xs transition flex items-center justify-center gap-0.5 shadow-xs cursor-pointer ${
              modalActiveTab === 'INTEGRATED'
                ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>{isJapanese ? '📊 統合' : '📊 통합'}</span>
          </button>

          <button
            type="button"
            onClick={() => setModalActiveTab('PHOTOS')}
            className={`py-2 px-0.5 rounded-xl font-black text-[11px] sm:text-xs transition flex items-center justify-center gap-0.5 shadow-xs cursor-pointer ${
              modalActiveTab === 'PHOTOS'
                ? 'bg-stone-900 text-amber-300 shadow-sm ring-1 ring-amber-400/50'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>{isJapanese ? '📸 写真' : '📸 현장 사진'}</span>
            {currentRound.photos && currentRound.photos.length > 0 && (
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-amber-400 text-stone-950 font-black">
                {currentRound.photos.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setModalActiveTab('CERTIFICATE')}
            className={`py-2 px-0.5 rounded-xl font-black text-[11px] sm:text-xs transition flex items-center justify-center gap-0.5 shadow-xs cursor-pointer ${
              modalActiveTab === 'CERTIFICATE'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-stone-950 shadow-sm ring-1 ring-amber-400'
                : 'text-amber-900 hover:text-amber-950 hover:bg-amber-100/60 font-black'
            }`}
          >
            <span>{isJapanese ? '📜 認定書' : '📜 완주증'}</span>
            <span className="text-[8.5px] px-1 py-0.2 rounded bg-amber-400/40 text-amber-950 font-black">
              공인
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 pr-0.5 space-y-3">
          {/* TAB 1: COURSES */}
          {modalActiveTab === 'COURSES' && (
            <div className="space-y-3">
              {/* 📸 [방안 A 핵심]: 1번 탭 상단에 현장 사진 미니 프리뷰 칩 배치 (터치 시 3번 탭 직행) */}
              {currentRound.photos && currentRound.photos.length > 0 ? (
                <div
                  onClick={() => setModalActiveTab('PHOTOS')}
                  className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300/80 rounded-2xl p-2.5 flex items-center justify-between shadow-2xs hover:border-amber-400 cursor-pointer transition active:scale-98"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex -space-x-2 shrink-0">
                      {currentRound.photos.slice(0, 3).map((imgUrl, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-xs bg-stone-900">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt="사진" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black text-amber-950 flex items-center gap-1 truncate">
                        <span>📸 현장 기념사진 {currentRound.photos.length}장 등록됨</span>
                      </span>
                      <span className="text-[10px] text-amber-700 block truncate">
                        터치 시 전체 갤러리 및 확대 보기 ➔
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-amber-500 text-stone-950 px-2 py-1 rounded-xl shrink-0 shadow-2xs">
                    사진 보기
                  </span>
                </div>
              ) : (
                <div className="bg-stone-50 border border-dashed border-stone-300 rounded-2xl p-2 px-3 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-stone-500 font-medium">
                    📸 함께 찍은 현장 사진을 등록해보세요
                  </span>
                  <label className="text-[10px] font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded-lg border border-emerald-300 cursor-pointer transition">
                    <span>+ 사진 추가</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAddPhoto} />
                  </label>
                </div>
              )}
              {activeSegments.map((seg) => (
                <div key={seg.key} className="bg-stone-50 rounded-2xl p-3 border border-stone-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
                    <span className="text-xs font-black text-emerald-900">
                      ⛳ {seg.title} (기준 Par {seg.segmentPar})
                    </span>
                    <span className="text-[10px] font-bold text-stone-500">
                      {seg.playedCount}{isJapanese ? 'ホール完走' : '홀 완주'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {seg.playerSummaries.map((ps, pIdx) => {
                      const medal = pIdx === 0 ? '🥇' : pIdx === 1 ? '🥈' : pIdx === 2 ? '🥉' : ' ';
                      const isLeader = ps.player.isLeader || pIdx === 0;
                      return (
                        <div key={ps.player.id} className="p-2 bg-white rounded-xl border border-stone-200/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-stone-900 flex items-center gap-1">
                              <span>{medal}</span>
                              <span>{ps.player.name}</span>
                              {isLeader && (
                                <span className="text-[9px] bg-amber-100 text-amber-900 px-1 rounded font-bold">
                                  {isJapanese ? '組長' : '조장'}
                                </span>
                              )}
                              {ps.player.isSelf && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">
                                  {isJapanese ? '本人' : '본인'}
                                </span>
                              )}
                            </span>
                            <div className="text-right">
                              <span className="text-xs font-black text-stone-900">{ps.strokes}타</span>
                              <span className="text-[10px] text-stone-500 ml-1">
                                ({ps.diff === 0 ? 'E' : ps.diff > 0 ? `+${ps.diff}` : `${ps.diff}`})
                              </span>
                            </div>
                          </div>

                          {/* 9-Hole Mini Tile Grid */}
                          <div className="grid grid-cols-9 gap-1 text-center">
                            {seg.fullHoles.map((hNum) => {
                              const base = ((hNum - 1) % 1000) + 1;
                              const meta = activeCourse.holesMetadata?.find((m) => Number(m.hole) === base);
                              const par = Number(meta?.par || (base % 3 === 0 ? 5 : base % 2 === 0 ? 4 : 3));
                              const s = ps.player.scores?.[hNum] || 0;
                              const ob = ps.player.obCount?.[hNum] || 0;
                              return (
                                <div key={hNum} className="flex flex-col items-center">
                                  <span className="text-[8px] text-stone-400 font-bold">{((base - 1) % 9) + 1}H</span>
                                  <div className="my-0.5">
                                    <HoleScoreBadge
                                      score={s}
                                      par={par}
                                      isConfirmed={s > 0}
                                      size="sm"
                                    />
                                  </div>
                                  <span className="text-[7px] text-rose-600 font-bold h-2.5">
                                    {ob > 0 ? `OB${ob}` : ''}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: INTEGRATED */}
          {modalActiveTab === 'INTEGRATED' && (
            <div className="space-y-3">
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-2.5 text-xs text-amber-950 font-bold flex items-center justify-between">
                <span>🏆 {activeSegments.length}개 코스 통합 성적 (총 {activeConfirmedHoles.length}홀 · 기준 Par {activeTotalPar})</span>
                <span className="text-[10px] text-amber-700">1홀 평균 타수 기준 정렬</span>
              </div>

              <div className="space-y-2">
                {integratedSummary.map((item, idx) => {
                  const medal = idx === 0 ? '🥇 1위' : idx === 1 ? '🥈 2위' : idx === 2 ? '🥉 3위' : `  ${idx + 1}위`;
                  return (
                    <div
                      key={item.player.id}
                      className={`p-3 rounded-2xl border space-y-1.5 ${
                        idx === 0
                          ? 'bg-amber-50/50 border-amber-300'
                          : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                          <span className="text-amber-800 font-black">{medal}</span>
                          <span>{item.player.name}</span>
                          {item.player.isSelf && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">
                              본인
                            </span>
                          )}
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-black text-stone-900">{item.strokes}타</span>
                          <span className="text-[11px] text-stone-500 ml-1">
                            ({item.diff === 0 ? 'E' : item.diff > 0 ? `+${item.diff}` : `${item.diff}`})
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-stone-200/60 text-center text-[10px]">
                        <div className="p-1 bg-white rounded-lg border border-stone-200/50">
                          <span className="text-stone-400 block">1홀 평균</span>
                          <span className="font-black text-stone-800">{item.avgPerHole}타</span>
                        </div>
                        <div className="p-1 bg-white rounded-lg border border-stone-200/50">
                          <span className="text-stone-400 block">9홀 환산</span>
                          <span className="font-black text-stone-800">{item.converted9Hole}타</span>
                        </div>
                        <div className="p-1 bg-white rounded-lg border border-stone-200/50">
                          <span className="text-stone-400 block">18홀 환산</span>
                          <span className="font-black text-emerald-800">{item.converted18Hole}타</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: DEDICATED PHOTO GALLERY (방안 A: 전용 현장 사진 탭) */}
          {modalActiveTab === 'PHOTOS' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-600" />
                    <span>
                      {isJapanese ? '📸 ラウンド記念写真 ギャラリー' : '📸 함께 찍은 현장 기념사진 갤러리'}
                      {currentRound.photos && currentRound.photos.length > 0 ? ` (${currentRound.photos.length}장)` : ''}
                    </span>
                  </span>
                  <label className="text-xs font-black text-amber-950 bg-amber-300 hover:bg-amber-400 px-2.5 py-1 rounded-xl cursor-pointer transition flex items-center gap-1 shadow-xs active:scale-95">
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isJapanese ? '写真追加' : '사진 추가'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAddPhoto} />
                  </label>
                </div>

                <p className="text-[10.5px] text-amber-800/90 font-medium leading-relaxed">
                  💡 썸네일을 터치하시면 크게 확대하여 볼 수 있습니다.<br />
                  <span className="text-emerald-700 font-black">★ 스코어카드 저장 시 1번 사진(#1)이 공식 카드 상단에 황금 액자로 자동 합성됩니다! (사진 미등록 시 공식 마스코트 파키(PARKY) 액자 자동 합성)</span>
                </p>
              </div>

              {currentRound.photos && currentRound.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {currentRound.photos.map((imgUrl, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedPhotoForZoom(imgUrl)}
                      className="aspect-square rounded-2xl overflow-hidden border-2 border-amber-300 relative cursor-pointer shadow-xs hover:border-amber-500 hover:scale-[1.02] transition group bg-stone-900"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl} alt={`기념사진 ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-black px-1.5 py-0.5 rounded-md">
                        #{i + 1} {i === 0 ? '대표' : ''}
                      </div>
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                        🔍 확대 보기
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-stone-50 border-2 border-dashed border-stone-300 rounded-3xl space-y-3">
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-2xl mx-auto shadow-2xs">
                    📷
                  </div>
                  <div>
                    <h4 className="font-black text-stone-800 text-sm">
                      {isJapanese ? 'まだ登録された写真がありません' : '등록된 현장 기념사진이 없습니다'}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-1">
                      {isJapanese
                        ? '同伴者と一緒に撮った記念写真を登録すると、公式スコアカードに自動合成されます！ (未登録時は公式マスコットのパキが自動合成されます)'
                        : '동반자와 함께 찍은 현장 사진을 올리시면 공식 스코어카드에 멋진 액자로 자동 합성됩니다. (사진이 없을 시 공식 마스코트 파키(PARKY)가 대신 예쁘게 합성됩니다)'}
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-md active:scale-95 transition">
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isJapanese ? '今すぐ写真を追加する' : '지금 첫 번째 현장 사진 등록하기'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAddPhoto} />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DIGITAL COMPLETION CERTIFICATE (공인 완주 인증서) */}
          {modalActiveTab === 'CERTIFICATE' && (
            <div className="relative rounded-3xl p-5 bg-gradient-to-b from-amber-50/90 via-white to-amber-50/80 border-4 border-double border-amber-400 shadow-md text-stone-800 space-y-4 animate-in fade-in">
              {/* Certificate Header Emblem */}
              <div className="text-center space-y-1 pb-3 border-b-2 border-amber-300/80">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/90 text-amber-950 rounded-full text-[10.5px] font-black tracking-wider border border-amber-300 shadow-2xs">
                  <span>🏆</span>
                  <span>{isJapanese ? '大韓パークゴルフ協会 規定準拠 · 公式公認' : '(사)대한파크골프협회 경기 규정 준수 · 정규 필드'}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight pt-1">
                  {isJapanese ? '公式フィールド完走認定書' : '공식 필드 완주 인증서'}
                </h3>
                <p className="text-[10px] text-amber-800/80 font-bold tracking-widest font-mono">
                  CERTIFICATE OF COMPLETION · NO. PKG-{startDObj.getFullYear()}-{(currentRound.id || 'OFFICIAL').slice(-6).toUpperCase()}
                </p>
              </div>

              {/* Golfer & Course Info Box */}
              <div className="bg-white/95 rounded-2xl p-4 border border-amber-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-amber-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                      🏅
                    </div>
                    <div>
                      <div className="text-[10.5px] text-stone-400 font-bold">{isJapanese ? '授与対象 (ゴルファー)' : '수여 대상 (골퍼)'}</div>
                      <div className="text-base font-black text-stone-900 flex items-center gap-1.5">
                        <span>{(currentRound.players?.find((p) => p.isSelf) || currentRound.players?.[0])?.name || '김대희'}</span>
                        <span className="text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md font-black border border-amber-200">
                          {isJapanese ? '公認マスター' : '공인 마스터'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10.5px] text-stone-400 font-bold block">{isJapanese ? '最終完走記録' : '최종 완주 타수'}</span>
                    <span className="text-xl font-black text-emerald-700">
                      {(currentRound.players?.find((p) => p.isSelf) || currentRound.players?.[0])?.totalStrokes || 0}타
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/60">
                    <span className="text-[10px] text-stone-400 block font-bold">{isJapanese ? '公認球場' : '공인 구장'}</span>
                    <span className="font-black text-stone-900 text-xs sm:text-sm truncate block">{currentRound.courseName}</span>
                  </div>
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/60">
                    <span className="text-[10px] text-stone-400 block font-bold">{isJapanese ? '完走規模' : '완주 규모'}</span>
                    <span className="font-black text-stone-900 text-xs sm:text-sm">
                      {activeSegments.map((s) => s.title).join(', ')} ({activeConfirmedHoles.length}홀 · 기준 Par {activeTotalPar})
                    </span>
                  </div>
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/60">
                    <span className="text-[10px] text-stone-400 block font-bold">{isJapanese ? '完走日時' : '완주 일시'}</span>
                    <span className="font-bold text-stone-800 text-[11px] block">{dateFormatted}</span>
                  </div>
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/60">
                    <span className="text-[10px] text-stone-400 block font-bold">{isJapanese ? '所要時間' : '경기 소요 시간'}</span>
                    <span className="font-bold text-stone-800 text-[11px] block">⏱️ {durationText} 소요</span>
                  </div>
                </div>

                {currentRound.players && currentRound.players.length > 1 && (
                  <div className="pt-2 text-[11px] text-stone-600 border-t border-stone-100 flex items-center justify-between">
                    <span className="font-bold text-stone-400 shrink-0">{isJapanese ? '同行同伴者:' : '함께 완주한 동반자:'}</span>
                    <span className="font-black text-stone-800 truncate ml-2 text-right">
                      {currentRound.players.map((p) => p.name).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Official Affirmation Text */}
              <div className="text-center px-2 py-1">
                <p className="text-xs font-bold text-stone-700 leading-relaxed">
                  {isJapanese
                    ? '上記のゴルファーは、正規競技規則を厳格に遵守し、全ホールを誠実に完走したことを証明し、本デジタル公認認定書を授与します。'
                    : '위 골퍼는 정규 파크골프 경기 규칙을 엄격히 준수하고, 공인 필드 라운드를 성공적으로 완주하였으므로 본 공식 디지털 인증서를 수여합니다.'}
                </p>
              </div>

              {/* Official Seal and Signature */}
              <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] text-emerald-800 font-bold flex items-center gap-1">
                    <span>🛡️</span>
                    <span>{isJapanese ? 'GPS現場認証·改ざん防止' : 'GPS 현장 위치 인증 완료 · 위변조 방지 블록체인'}</span>
                  </div>
                  <div className="text-xs font-black text-stone-900 tracking-wider">
                    {isJapanese ? 'パークゴルフ オールインワン 運営委員会' : '파크골프 올인원 (ParkGolf All-in-One)'}
                  </div>
                </div>

                {/* Circular Red Stamp Seal */}
                <div className="w-14 h-14 rounded-full border-2 border-rose-600 flex flex-col items-center justify-center text-rose-600 rotate-[-6deg] shadow-xs select-none bg-rose-50/60 shrink-0">
                  <span className="text-[7.5px] font-black leading-none">파크골프</span>
                  <span className="text-[10.5px] font-black leading-none my-0.5">公認 직인</span>
                  <span className="text-[7.5px] font-bold leading-none">ALL-IN-ONE</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🔥 [대표님 핵심 지시]: 스코어카드/완주증 이미지 파일 다운로드 단일 메인 버튼 */}
        <div className="pt-2 border-t shrink-0 space-y-1.5">
          {courseSegments.length > 1 && (
            <div className="text-[11px] font-bold text-center text-emerald-950 bg-emerald-100/90 py-1.5 px-3 rounded-xl border border-emerald-300 flex items-center justify-center gap-1 shadow-2xs">
              <span>👉</span>
              <span>
                위에서 선택된 <strong className="text-emerald-900 font-black underline">[{activeSegments.map((s) => s.title).join(', ')}] ({activeConfirmedHoles.length}홀)</strong> 제원으로 저장됩니다.
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleDownloadScorecardImage}
            disabled={isGeneratingImage}
            className={`w-full min-h-[48px] font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition cursor-pointer border ${
              modalActiveTab === 'CERTIFICATE'
                ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 border-amber-400 text-stone-950'
                : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 border-emerald-500 text-white'
            }`}
          >
            <Download className={`w-4 h-4 ${modalActiveTab === 'CERTIFICATE' ? 'text-stone-950' : 'text-amber-300'}`} />
            <span>
              {isGeneratingImage
                ? (isJapanese ? '高画質画像生成中...' : '고화질 공식 이미지 생성 중...')
                : modalActiveTab === 'CERTIFICATE'
                ? (isJapanese ? `📥 [${activeSegments.map((s) => s.title).join(', ')}] 公式認定書＆スコア画像を保存` : `📥 [${activeSegments.map((s) => s.title).join(', ')}] 공식 완주 인증서 & 스코어카드 저장`)
                : (isJapanese ? `📥 [${activeSegments.map((s) => s.title).join(', ')}] スコアカード画像を保存 (ダウンロード)` : `📥 [${activeSegments.map((s) => s.title).join(', ')}] 스코어카드 이미지 저장 (다운로드)`)}
            </span>
          </button>
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-2 border-t flex items-center gap-2 shrink-0">
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="py-3 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition active:scale-95 border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              title={isJapanese ? 'この試合全体の記録を完全に削除' : '이 경기 전체(모든 코스) 기록을 완전히 삭제'}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isJapanese ? '全試合削除' : '전체 경기 삭제'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-sm transition active:scale-[0.98] shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>{isJapanese ? '確認 (閉じる)' : '확인 (닫기)'}</span>
          </button>
        </div>

        {/* 🎨 생성된 고화질 스코어카드 이미지 미리보기 팝업 */}
        {previewImageResult && (
          <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-3 animate-in fade-in">
            <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-sm w-full p-4 space-y-3 shadow-2xl relative max-h-[92vh] flex flex-col">
              <div className="flex items-center justify-between text-white pb-2 border-b border-stone-800">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{isJapanese ? '高画質スコアカードプレビュー' : '고화질 스코어카드 미리보기'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewImageResult(null)}
                  className="w-7 h-7 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-auto rounded-xl bg-black border border-stone-800 flex items-center justify-center p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImageResult.objectUrl || previewImageResult.dataUrl}
                  alt="스코어카드 미리보기"
                  className="w-full h-auto max-h-[58vh] object-contain rounded-lg"
                />
              </div>

              <p className="text-[10.5px] text-amber-300/90 text-center font-bold">
                {isJapanese
                  ? '✅ 端末に保存されました！画像を長押しして直接保存も可能です。'
                  : '✅ 갤러리에 저장되었습니다! 위 이미지를 길게 꾹 눌러 추가 저장도 가능합니다.'}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={previewImageResult.objectUrl || previewImageResult.dataUrl}
                  download={previewImageResult.fileName}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 text-center shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isJapanese ? '再保存' : '다시 다운로드'}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImageResult(null)}
                  className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-black text-xs rounded-xl transition active:scale-95 text-center cursor-pointer"
                >
                  <span>{isJapanese ? '閉じる' : '확인 (닫기)'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🔍 사진 썸네일 터치 시 원본 확대 모달 */}
        {selectedPhotoForZoom && (
          <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-3 animate-in fade-in">
            <div className="max-w-md w-full bg-stone-900 rounded-3xl p-4 space-y-3 relative border border-stone-800 shadow-2xl flex flex-col max-h-[92vh]">
              <div className="flex items-center justify-between text-white pb-2 border-b border-stone-800">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>{isJapanese ? '現地写真の拡大表示' : '현장 기념사진 원본 확대'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPhotoForZoom(null)}
                  className="w-7 h-7 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-auto rounded-2xl bg-black flex items-center justify-center p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPhotoForZoom}
                  alt="현장 사진 원본"
                  className="w-full h-auto max-h-[62vh] object-contain rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={selectedPhotoForZoom}
                  download={`파크골프_기념사진_${Date.now()}.jpg`}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 text-center shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isJapanese ? '写真を保存' : '사진 다운로드'}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedPhotoForZoom(null)}
                  className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-black text-xs rounded-xl transition active:scale-95 text-center cursor-pointer"
                >
                  <span>{isJapanese ? '閉じる' : '확인 (닫기)'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
