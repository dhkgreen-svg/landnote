'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Trash2,
  Trophy,
  Share2,
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
} from 'lucide-react';
import { Course, RoundSession, RoundPlayer } from '@/types/parkon';
import { HoleScoreBadge, ScoreBadgeLegend } from '@/components/HoleScoreBadge';
import { formatPlayerDisplayName } from '@/lib/playerUtils';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { ParkOnStorage } from '@/lib/storage';
import { generateScorecardImage } from '@/lib/scorecardImageGenerator';

export interface RoundScoreboardModalProps {
  round: RoundSession | null;
  courses?: Course[];
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (roundId: string) => void;
}

const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function RoundScoreboardModal({
  round,
  courses,
  isOpen,
  onClose,
  onDelete,
}: RoundScoreboardModalProps) {
  const { isJapanese, isEnglish } = useTranslation();
  const [currentRound, setCurrentRound] = useState<RoundSession | null>(round);
  const [modalActiveTab, setModalActiveTab] = useState<'COURSES' | 'INTEGRATED' | 'MATRIX'>('COURSES');
  const [courseFilterLetter, setCourseFilterLetter] = useState<string>('ALL');
  const [selectedCourseKeys, setSelectedCourseKeys] = useState<string[]>([]);
  const [isSharingImage, setIsSharingImage] = useState<boolean>(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [pruneToast, setPruneToast] = useState<string | null>(null);

  useEffect(() => {
    setCurrentRound(round);
    setSelectedCourseKeys([]);
  }, [round]);

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
    setSelectedCourseKeys([]);
    setPruneToast(
      isJapanese
        ? `【${selectedNames}】のみを反映して保存しました！`
        : `선택하신 [${selectedNames}] ${activeConfirmedHoles.length}홀만 깔끔하게 저장되었습니다!`
    );
    setTimeout(() => setPruneToast(null), 3500);
  };

  // 💬 카카오톡 / SNS 고화질 캔버스 스코어보드 이미지 공유 핸들러
  const handleShareScorecardImage = async () => {
    if (!currentRound) return;
    setIsSharingImage(true);
    try {
      const activeLetters = activeSegments.map((s) => s.cLetter);
      const res = await generateScorecardImage({
        round: currentRound,
        course: activeCourse,
        selectedCourseLetters: activeLetters,
        isJapanese,
      });

      if (!res) throw new Error('Failed to generate image');

      const file = new File([res.blob], res.fileName, { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `[파크골프 올인원] ${currentRound.courseName} 공식 스코어카드`,
          text: `${currentRound.courseName} ${activeConfirmedHoles.length}홀 완주 스코어보드입니다.`,
          files: [file],
        });
        setShareToast(isJapanese ? 'LINE/SNSに共有しました！' : '카카오톡으로 고화질 스코어카드를 공유했습니다!');
      } else {
        // Fallback: download file directly & copy text
        const link = document.createElement('a');
        link.download = res.fileName;
        link.href = res.dataUrl;
        link.click();
        setShareToast(
          isJapanese
            ? '高画質スコアカード画像を保存しました！'
            : '고화질 스코어카드 이미지가 사진첩에 저장되었습니다! 카톡으로 바로 전송하실 수 있습니다.'
        );
      }
    } catch (e) {
      console.error(e);
      if (currentRound) {
        const link = document.createElement('a');
        link.href = `/round/result?id=${currentRound.id}`;
        link.click();
      }
    } finally {
      setIsSharingImage(false);
      setTimeout(() => setShareToast(null), 3500);
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
      ? `本当にこのラウンド記録（${currentRound.courseName} · ${dateFormatted}）を削除しますか？\n(削除された記録は二度と再表示されません)`
      : `정말 이 경기 기록(${currentRound.courseName} · ${dateFormatted})을 삭제하시겠습니까?\n(영구 삭제되어 다시는 나타나지 않습니다)`;
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

        {/* ⛳ [대표님 지시] 코스 선택 & 제외 필터 바 (예: A, B는 치고 C는 미플레이 시 C 제외 18홀 재계산) */}
        {courseSegments.length > 1 && (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-2.5 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-emerald-950 flex items-center gap-1">
                <span>⛳ 계산 및 카톡 전송 코스 선택:</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">
                {activeSegments.length}개 코스 ({activeConfirmedHoles.length}홀 · 기준 Par {activeTotalPar})
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {courseSegments.map((seg) => {
                const isChecked = activeSegments.some((s) => s.key === seg.key);
                return (
                  <button
                    key={seg.key}
                    type="button"
                    onClick={() => toggleCourseSelection(seg.key)}
                    className={`py-1 px-2.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer border ${
                      isChecked
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-400 border-stone-200 hover:text-stone-700'
                    }`}
                  >
                    {isChecked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-stone-300" />}
                    <span>{seg.title} ({seg.confirmedInSeg.length}H)</span>
                  </button>
                );
              })}
            </div>

            {/* 제외된 코스 영구 삭제 버튼 */}
            {isFiltered && (
              <div className="pt-1.5 border-t border-emerald-200/60 flex items-center justify-between">
                <span className="text-[10px] text-stone-500">
                  * 선택하지 않은 코스는 성적표 및 카톡 공유에서 제외됩니다.
                </span>
                <button
                  type="button"
                  onClick={handlePruneUnselected}
                  className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Scissors className="w-3 h-3" />
                  <span>선택 코스만 남기고 영구 삭제</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal Top 3-Mode Tabs: [ 📋 코스별 카드 ] [ 📊 통합 (평균) ] [ 📋 홀별 상세표 ] */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setModalActiveTab('COURSES')}
            className={`py-2 px-1 rounded-xl font-black text-xs transition flex items-center justify-center gap-1 shadow-xs cursor-pointer ${
              modalActiveTab === 'COURSES'
                ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-500'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>{isJapanese ? '📋 コース別カード' : '📋 코스별 카드'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {activeSegments.length}{isJapanese ? '枚' : '장'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setModalActiveTab('INTEGRATED')}
            className={`py-2 px-1 rounded-xl font-black text-xs transition flex items-center justify-center gap-1 shadow-xs cursor-pointer ${
              modalActiveTab === 'INTEGRATED'
                ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>{isJapanese ? '📊 統合 (平均)' : '📊 통합 (평균)'}</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-amber-400 text-amber-950 font-black">
              {isJapanese ? '平均' : '평균'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setModalActiveTab('MATRIX')}
            className={`py-2 px-1 rounded-xl font-black text-xs transition flex items-center justify-center gap-1 shadow-xs cursor-pointer ${
              modalActiveTab === 'MATRIX'
                ? 'bg-stone-900 text-amber-300 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
            }`}
          >
            <span>{isJapanese ? '📋 ホール別詳細' : '📋 홀별 상세표'}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 pr-0.5 space-y-3">
          {/* TAB 1: COURSES */}
          {modalActiveTab === 'COURSES' && (
            <div className="space-y-3">
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

          {/* TAB 3: MATRIX */}
          {modalActiveTab === 'MATRIX' && (
            <div className="overflow-x-auto border border-stone-200 rounded-2xl">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200">
                    <th className="py-2 px-2 text-left font-black text-stone-700 sticky left-0 bg-stone-100 z-10">
                      선수명
                    </th>
                    {activeConfirmedHoles.map((h) => {
                      const info = getHoleInfo(h);
                      const meta = activeCourse.holesMetadata?.find((m) => Number(m.hole) === info.base);
                      const par = meta?.par || (info.base % 3 === 0 ? 5 : info.base % 2 === 0 ? 4 : 3);
                      return (
                        <th key={h} className="py-1 px-1 font-bold text-stone-600 min-w-[28px]">
                          <div>{info.cLetter}{info.hInCourse}</div>
                          <div className="text-[9px] text-stone-400 font-normal">P{par}</div>
                        </th>
                      );
                    })}
                    <th className="py-2 px-2 font-black text-stone-900 bg-emerald-50">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {integratedSummary.map((item) => (
                    <tr key={item.player.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="py-2 px-2 text-left font-black text-stone-800 sticky left-0 bg-white z-10 whitespace-nowrap">
                        {item.player.name}
                      </td>
                      {activeConfirmedHoles.map((h) => {
                        const s = item.player.scores?.[h] || 0;
                        const info = getHoleInfo(h);
                        const meta = activeCourse.holesMetadata?.find((m) => Number(m.hole) === info.base);
                        const par = meta?.par || (info.base % 3 === 0 ? 5 : info.base % 2 === 0 ? 4 : 3);
                        return (
                          <td key={h} className="py-1 px-1">
                            <HoleScoreBadge
                              score={s}
                              par={par}
                              isConfirmed={s > 0}
                              size="sm"
                            />
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 font-black text-emerald-950 bg-emerald-50">
                        {item.strokes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 📸 라운드 기념 현장 사진 갤러리 */}
          {currentRound.photos && currentRound.photos.length > 0 && (
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-500" />
                  <span>{isJapanese ? 'ラウンド記念写真' : '현장 라운드 기념사진'} ({currentRound.photos.length}장)</span>
                </span>
                <span className="text-[10px] text-stone-400 font-bold">공식 인증 워터마크 보관</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {currentRound.photos.map((imgUrl, i) => (
                  <div key={i} className="aspect-[4/5] rounded-xl overflow-hidden border border-stone-300 relative group bg-stone-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`인증샷 ${i + 1}`} className="w-full h-full object-cover" />
                    <a
                      href={imgUrl}
                      download={`파크골프_기념사진_${i + 1}.jpg`}
                      className="absolute bottom-1 right-1 p-1 bg-black/70 rounded-md text-white opacity-0 group-hover:opacity-100 transition"
                      title="다운로드"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 🔥 대표님 지시: 4인 고화질 스코어보드 이미지 카카오톡 전송 버튼 */}
        <div className="pt-2 border-t space-y-1.5 shrink-0">
          <button
            type="button"
            onClick={handleShareScorecardImage}
            disabled={isSharingImage}
            className="w-full min-h-[46px] bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition cursor-pointer border border-[#E6CF00]"
          >
            <Share2 className="w-4 h-4 text-[#191919]" />
            <span>
              {isSharingImage
                ? (isJapanese ? '高画質スコアカード画像生成中...' : '고화질 스코어보드 이미지 생성 중...')
                : (isJapanese ? '💬 4人 高画質スコアカード LINE/SNS共有' : '💬 4인 고화질 스코어보드 카톡/SNS 이미지 공유')}
            </span>
          </button>
        </div>

        {/* Certificate link */}
        <div className="pt-1 border-t shrink-0">
          <a
            href={`/round/result?id=${currentRound.id}`}
            onClick={onClose}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <span>{isJapanese ? '📋 全体成績表＆デジタル認定書を見る' : '📋 전체 성적표 & 디지털 인증서 보기'}</span>
            <span className="text-[11px]">➔</span>
          </a>
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-2 border-t flex items-center gap-2 shrink-0">
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="py-3 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition active:scale-95 border border-rose-200 flex items-center justify-center gap-1 cursor-pointer shrink-0"
              title={isJapanese ? '記録削除' : '기록 삭제'}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isJapanese ? '削除' : '삭제'}</span>
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
      </div>
    </div>
  );
}
