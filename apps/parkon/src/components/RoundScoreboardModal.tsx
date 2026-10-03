'use client';

import React, { useState, useMemo } from 'react';
import { X, Trash2, Trophy, Share2 } from 'lucide-react';
import { Course, RoundSession, RoundPlayer } from '@/types/parkon';
import { HoleScoreBadge, ScoreBadgeLegend } from '@/components/HoleScoreBadge';
import { formatPlayerDisplayName } from '@/lib/playerUtils';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { ParkOnStorage } from '@/lib/storage';

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
  const [modalActiveTab, setModalActiveTab] = useState<'COURSES' | 'INTEGRATED' | 'MATRIX'>('COURSES');
  const [courseFilterLetter, setCourseFilterLetter] = useState<string>('ALL');

  // Resolve Course data
  const activeCourse: Course = useMemo(() => {
    if (!round) {
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
    const found = allCourses.find((c) => c.id === round.courseId || c.name === round.courseName);
    if (found && found.holesMetadata && found.holesMetadata.length > 0) {
      return found;
    }
    return {
      id: round.courseId || 'default',
      name: round.courseName || '파크골프장',
      region: '전국',
      isVerified: true,
      totalHoles: round.totalHoles || 18,
      totalCourses: Math.max(1, Math.ceil((round.totalHoles || 18) / 9)),
      address: '',
      holesMetadata: Array.from({ length: 72 }, (_, i) => ({
        hole: i + 1,
        par: (i + 1) % 3 === 0 ? 5 : (i + 1) % 2 === 0 ? 4 : 3,
        distanceMeter: 50,
      })),
    };
  }, [round, courses]);

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
    if (!round) return [];
    if (round.confirmedHoles && round.confirmedHoles.length > 0) {
      return round.confirmedHoles;
    }
    const holeSet = new Set<number>();
    (round.players || []).forEach((p) => {
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
    if (round.selectedHoleNumbers && round.selectedHoleNumbers.length > 0) {
      return round.selectedHoleNumbers;
    }
    return Array.from({ length: round.totalHoles || 18 }, (_, i) => i + 1);
  }, [round]);

  // Helper to determine which holes have officially been scored for a player
  const getPlayerConfirmedHoles = (player: RoundPlayer) => {
    return confirmedHoles.filter((hNum) => (player.scores?.[hNum] || 0) > 0);
  };

  // Course segments calculation (A코스, B코스...)
  const courseSegments = useMemo(() => {
    if (!round || confirmedHoles.length === 0) return [];
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

      const playerSummaries = (round.players || []).map((p) => {
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
    });
  }, [round, confirmedHoles, activeCourse]);

  const uniqueLettersInSegments = useMemo(() => {
    return Array.from(new Set(courseSegments.map((s) => s.courseLetter)));
  }, [courseSegments]);

  // Integrated course groups (e.g. C코스 1차 + 2차 combined averages)
  const integratedCourseGroups = useMemo(() => {
    if (!round) return [];
    return uniqueLettersInSegments.map((cLetter) => {
      const segs = courseSegments.filter((s) => s.courseLetter === cLetter);
      const totalPlayedHoles = segs.reduce((sum, s) => sum + s.playedCount, 0);
      const totalPar = segs.reduce((sum, s) => sum + s.segmentPar, 0);

      const playerStats = (round.players || []).map((p) => {
        const totalStrokes = segs.reduce((sum, s) => {
          const pSummary = s.playerSummaries.find((ps) => ps.player.id === p.id);
          return sum + (pSummary?.strokes || 0);
        }, 0);
        const diff = totalStrokes - totalPar;
        const avgPerHole = totalPlayedHoles > 0 ? (totalStrokes / totalPlayedHoles).toFixed(2) : '0.00';
        const converted9Hole = totalPlayedHoles > 0 ? ((totalStrokes / totalPlayedHoles) * 9).toFixed(1) : '0.0';

        return {
          player: p,
          totalStrokes,
          diff,
          avgPerHole,
          converted9Hole,
        };
      }).sort((a, b) => a.totalStrokes - b.totalStrokes);

      return {
        courseLetter: cLetter,
        totalRounds: segs.length,
        totalPlayedHoles,
        totalPar,
        segments: segs,
        playerStats,
      };
    });
  }, [uniqueLettersInSegments, courseSegments, round]);

  // Overall player rankings & averages
  const overallPlayerRankings = useMemo(() => {
    if (!round) return [];
    const totalPar = confirmedHoles.reduce((sum, h) => {
      const base = ((h - 1) % 1000) + 1;
      const meta = activeCourse.holesMetadata?.find((m) => Number(m.hole) === base);
      return sum + Number(meta?.par || (base % 3 === 0 ? 5 : base % 2 === 0 ? 4 : 3));
    }, 0);

    return (round.players || []).map((p, originalIdx) => {
      const scoredHoles = confirmedHoles.filter((h) => (p.scores?.[h] || 0) > 0);
      const strokes = scoredHoles.reduce((sum, h) => sum + (p.scores?.[h] || 0), 0);
      const diff = strokes - totalPar;
      const scoredCount = scoredHoles.length;
      const avgPerHole = scoredCount > 0 ? (strokes / scoredCount).toFixed(2) : '0.00';
      const converted9Hole = scoredCount > 0 ? ((strokes / scoredCount) * 9).toFixed(1) : '0.0';
      const converted18Hole = scoredCount > 0 ? ((strokes / scoredCount) * 18).toFixed(1) : '0.0';
      const totalOB = Object.values(p.obCount || {}).reduce<number>((acc, cur) => acc + (Number(cur) || 0), 0);

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
  }, [round, confirmedHoles, activeCourse]);

  if (!isOpen || !round) return null;

  const dObj = round.completedAt ? new Date(round.completedAt) : round.startedAt ? new Date(round.startedAt) : new Date();
  const dateFormatted = `${dObj.getFullYear()}.${String(dObj.getMonth() + 1).padStart(2, '0')}.${String(dObj.getDate()).padStart(2, '0')} (${['일', '월', '화', '수', '목', '금', '토'][dObj.getDay()]})`;
  const is18Holes = confirmedHoles.length >= 18;

  const handleDelete = () => {
    if (!onDelete) return;
    const msg = isJapanese
      ? `本当にこのラウンド記録（${round.courseName} · ${dateFormatted}）を削除しますか？\n削除された記録は復元できません。`
      : `정말 이 경기 기록(${round.courseName} · ${dateFormatted})을 삭제하시겠습니까?\n삭제된 기록은 영구 복구할 수 없습니다.`;
    if (window.confirm(msg)) {
      onDelete(round.id);
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
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-2.5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-lg font-black shadow-xs shrink-0">
              ⛳
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-stone-900 text-base leading-tight truncate">
                {isJapanese ? 'コース別スコア検索＆累積状況' : '코스별 스코어 검색 & 누적 현황'}
              </h3>
              <p className="text-[11px] text-stone-500 font-medium truncate">
                {round.courseName} · {dateFormatted} · {is18Holes ? (isJapanese ? '18ホール完走' : '18홀 완주') : `${confirmedHoles.length}${isJapanese ? 'ホール' : '홀'}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center font-bold text-base transition shrink-0 cursor-pointer ml-2"
            title={isJapanese ? '閉じる' : '닫기'}
          >
            ✕
          </button>
        </div>

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
              {courseSegments.length}{isJapanese ? '枚' : '장'}
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
            <span>{isJapanese ? '📋 ホール別詳細表' : '📋 홀별 상세표'}</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5 overscroll-contain">
          {/* TAB 1: 📋 코스별 카드 */}
          {modalActiveTab === 'COURSES' && (
            <div className="space-y-3">
              {/* Quick Course Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <span className="font-extrabold text-stone-600 text-[11px] shrink-0">
                  {isJapanese ? '検索フィルター:' : '검색 필터:'}
                </span>
                <button
                  type="button"
                  onClick={() => setCourseFilterLetter('ALL')}
                  className={`px-2.5 py-1 rounded-full font-black text-xs shrink-0 transition cursor-pointer ${
                    courseFilterLetter === 'ALL'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {isJapanese ? `すべて (${courseSegments.length}枚すべて表示)` : `전체 (${courseSegments.length}장 모두 보기)`}
                </button>
                {uniqueLettersInSegments.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setCourseFilterLetter(l)}
                    className={`px-2.5 py-1 rounded-full font-black text-xs shrink-0 transition cursor-pointer ${
                      courseFilterLetter === l
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {l}{isJapanese ? 'コース' : '코스'}
                  </button>
                ))}
              </div>

              {/* 🎯 골프 공인 언더파 기호 안내 범례 */}
              <ScoreBadgeLegend />

              {courseSegments.length === 0 ? (
                <div className="bg-stone-50 rounded-2xl p-6 text-center border border-stone-200 space-y-1">
                  <p className="text-sm font-black text-stone-700">
                    {isJapanese ? 'まだプレーしたコースがありません。' : '아직 진행된 코스가 없습니다.'}
                  </p>
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
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                                seg.isCompleted
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {seg.isCompleted
                                ? isJapanese ? '9ホール完走 🏆' : '9홀 완주 🏆'
                                : isJapanese ? `${seg.playedCount}ホール進行確認` : `${seg.playedCount}홀 진행 확인`}
                            </span>
                          </div>
                          <span className="text-xs font-extrabold text-stone-600">
                            {isJapanese ? '基準 Par ' : '기준 Par '}
                            <strong className="text-emerald-900">{seg.segmentPar}</strong>
                            {isJapanese ? '打' : '타'}
                          </span>
                        </div>

                        {/* Players in this course card */}
                        <div className="space-y-2">
                          {seg.playerSummaries.map((ps, pIdx) => (
                            <div
                              key={ps.player.id || pIdx}
                              className="bg-stone-50/90 rounded-xl p-2.5 border border-stone-200/80 space-y-1.5"
                            >
                              {/* Player Summary Row */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center font-black text-[11px] shrink-0">
                                    {pIdx + 1}
                                  </span>
                                  <span className="font-extrabold text-stone-900 text-sm truncate">
                                    {formatPlayerDisplayName(ps.player.name, ps.player.isSelf, isJapanese)}
                                  </span>
                                  {ps.player.isSelf && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-emerald-300 shrink-0">
                                      본인
                                    </span>
                                  )}
                                  <span className="text-[10px] text-stone-500 font-bold shrink-0">
                                    ({isJapanese ? '平均 ' : '평균 '}{ps.avgHole}{isJapanese ? '打/ホール' : '타/홀'})
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span
                                    className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                      ps.diff > 0
                                        ? 'bg-rose-100 text-rose-700'
                                        : ps.diff < 0
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-stone-200 text-stone-700'
                                    }`}
                                  >
                                    {ps.playedCount === 0
                                      ? isJapanese ? '待機' : '대기'
                                      : ps.diff === 0
                                      ? 'Even'
                                      : ps.diff > 0
                                      ? `+${ps.diff}`
                                      : `${ps.diff}`}
                                  </span>
                                  <span className="font-black text-sm text-emerald-950">
                                    {isJapanese ? '計 ' : '총 '}{ps.strokes}{isJapanese ? '打' : '타'}
                                  </span>
                                </div>
                              </div>

                              {/* 1~9 Hole Mini Matrix Pill Strip (홀 번호 + Par 표시 + 동그라미/색상 스코어) */}
                              <div className="grid grid-cols-9 gap-1 text-center text-[10px]">
                                {ps.holeDetails.map((hd) => (
                                  <div
                                    key={hd.hNum}
                                    className="rounded-lg py-1 px-0.5 border border-stone-200/90 bg-white flex flex-col items-center justify-between min-h-[50px] shadow-2xs"
                                    title={`${hd.baseHole ?? hd.hNum}번 홀 (Par ${hd.par}): ${hd.strokes ?? '미진행'}타`}
                                  >
                                    <div className="flex flex-col items-center justify-center leading-tight mb-1 select-none">
                                      <span className="text-[10px] text-stone-700 font-extrabold leading-none">
                                        {hd.baseHole ?? hd.hNum}{isJapanese ? '番' : '번'}
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
                                    {hd.ob > 0 && (
                                      <span className="text-[7.5px] font-black text-rose-600 leading-none mt-0.5">
                                        OB{hd.ob}
                                      </span>
                                    )}
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

          {/* TAB 2: 📊 통합 (평균) */}
          {modalActiveTab === 'INTEGRATED' && (
            <div className="space-y-4">
              {/* 1. Course-by-Course Integrated Averages */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-stone-800">
                  <span className="flex items-center gap-1 text-amber-900">
                    <span>{isJapanese ? '📊 コース別統合合算＆平均打数' : '📊 코스별 통합 합산 & 평균 타수'}</span>
                  </span>
                  <span className="text-[10px] text-stone-500 font-normal">
                    {isJapanese ? '複数周回プレー時に自動統合算出' : '다회차 진행 시 자동 통합 산출'}
                  </span>
                </div>

                {integratedCourseGroups.length === 0 ? (
                  <div className="bg-stone-50 rounded-2xl p-4 text-center border border-stone-200">
                    <p className="text-xs font-bold text-stone-600">
                      {isJapanese ? '入力された確定スコアがありません。' : '입력된 확인 스코어가 없습니다.'}
                    </p>
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
                              {group.courseLetter}{isJapanese ? 'コース統合分析' : '코스 통합 분석'}
                            </span>
                            <span className="text-xs font-black text-amber-950">
                              {isJapanese
                                ? `計 ${group.totalRounds}回進行 (${group.totalPlayedHoles}ホール)`
                                : `총 ${group.totalRounds}회 진행 (${group.totalPlayedHoles}홀)`}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-stone-500">
                            {isJapanese ? `総基準 Par ${group.totalPar}打` : `총 기준 Par ${group.totalPar}타`}
                          </span>
                        </div>

                        {/* Player stats in this course group */}
                        <div className="space-y-2">
                          {group.playerStats.map((pStat) => (
                            <div
                              key={pStat.player.id}
                              className="bg-stone-50 rounded-xl p-2.5 border border-stone-200 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-sm text-stone-900">
                                  {formatPlayerDisplayName(pStat.player.name, pStat.player.isSelf, isJapanese)}
                                  {pStat.player.isSelf && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-emerald-300 ml-1">
                                      본인
                                    </span>
                                  )}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                      pStat.diff > 0
                                        ? 'bg-rose-100 text-rose-700'
                                        : pStat.diff < 0
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-stone-200 text-stone-700'
                                    }`}
                                  >
                                    {pStat.diff === 0 ? 'Even' : pStat.diff > 0 ? `+${pStat.diff}` : `${pStat.diff}`}
                                  </span>
                                  <span className="font-black text-sm text-stone-900">
                                    {isJapanese ? '計 ' : '총 '}{pStat.totalStrokes}{isJapanese ? '打' : '타'}
                                  </span>
                                </div>
                              </div>

                              {/* 2 Key Metrics: 1홀당 평균 & 9홀 환산 */}
                              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                <div className="bg-white p-2 rounded-lg border border-stone-200 text-center">
                                  <span className="text-[10px] text-stone-500 font-bold block">
                                    {isJapanese ? '1ホール当たり平均打数' : '1홀당 평균 타수'}
                                  </span>
                                  <span className="text-sm font-black text-emerald-950">
                                    {pStat.avgPerHole}{isJapanese ? '打' : '타'}
                                  </span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-stone-200 text-center">
                                  <span className="text-[10px] text-stone-500 font-bold block">
                                    {isJapanese ? '9ホール換算平均' : '9홀 환산 평균'}
                                  </span>
                                  <span className="text-sm font-black text-amber-800">
                                    {pStat.converted9Hole}{isJapanese ? '打' : '타'}
                                  </span>
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
                    <span>{isJapanese ? '🏆 全コース統合 総合順位＆平均指標' : '🏆 전 코스 통합 종합 순위 및 평균 지표'}</span>
                  </span>
                  <span className="text-[10px] text-stone-500 font-normal">
                    {isJapanese ? `計 ${confirmedHoles.length}ホール基準` : `총 ${confirmedHoles.length}홀 기준`}
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-2 border border-stone-200 space-y-1.5 shadow-sm">
                  {overallPlayerRankings.map((item, rank) => (
                    <div
                      key={item.player.id || rank}
                      className={`p-2.5 rounded-xl border space-y-1.5 ${
                        item.player.isSelf ? 'border-emerald-400 bg-emerald-50/50' : 'border-stone-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[11px] ${
                              rank === 0
                                ? 'bg-amber-400 text-amber-950 shadow-xs'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {rank + 1}
                          </span>
                          <span className="font-extrabold text-stone-900 text-sm">
                            {formatPlayerDisplayName(item.player.name, item.player.isSelf, isJapanese)}
                          </span>
                          {item.player.isSelf && (
                            <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded shadow-xs">
                              본인
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs font-black px-2 py-0.5 rounded-md ${
                              item.diff > 0
                                ? 'bg-rose-100 text-rose-700'
                                : item.diff < 0
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {item.scoredCount === 0
                              ? isJapanese ? '待機' : '대기'
                              : item.diff === 0
                              ? 'Even'
                              : item.diff > 0
                              ? `+${item.diff}`
                              : `${item.diff}`}
                          </span>
                          <span className="font-black text-base text-emerald-950">
                            {isJapanese ? '計 ' : '총 '}{item.strokes}{isJapanese ? '打' : '타'}{' '}
                            <span className="text-xs text-stone-400 font-bold">
                              ({item.scoredCount}{isJapanese ? 'ホール' : '홀'})
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Averages */}
                      <div className="grid grid-cols-3 gap-1 pt-1 text-center">
                        <div className="bg-white py-1.5 px-1 rounded-lg border border-stone-200">
                          <div className="text-[9px] text-stone-500 font-bold">
                            {isJapanese ? '1ホール平均' : '1홀당 평균'}
                          </div>
                          <div className="text-xs font-black text-stone-900">
                            {item.avgPerHole}{isJapanese ? '打' : '타'}
                          </div>
                        </div>
                        <div className="bg-white py-1.5 px-1 rounded-lg border border-stone-200">
                          <div className="text-[9px] text-stone-500 font-bold">
                            {isJapanese ? '9ホール換算' : '9홀 환산'}
                          </div>
                          <div className="text-xs font-black text-amber-800">
                            {item.converted9Hole}{isJapanese ? '打' : '타'}
                          </div>
                        </div>
                        <div className="bg-white py-1.5 px-1 rounded-lg border border-stone-200">
                          <div className="text-[9px] text-stone-500 font-bold">
                            {isJapanese ? '18ホール換算' : '18홀 환산'}
                          </div>
                          <div className="text-xs font-black text-emerald-800">
                            {item.converted18Hole}{isJapanese ? '打' : '타'}
                          </div>
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
                  {isJapanese ? '📋 全ホールスコア詳細記録' : '📋 전 홀 스코어 상세 기록'}
                </h4>
              </div>
              <ScoreBadgeLegend />
              {confirmedHoles.length === 0 ? (
                <div className="bg-stone-50 rounded-xl p-4 text-center border border-stone-200">
                  <p className="text-xs font-bold text-stone-600">
                    {isJapanese ? 'まだ入力されたホールスコアがありません。' : '아직 입력된 홀 스코어가 없습니다.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-stone-200">
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr className="bg-stone-100 text-stone-600 font-bold border-b border-stone-200 text-[11px]">
                        <th className="py-1.5 px-2 text-left">{isJapanese ? '選手' : '선수'}</th>
                        {confirmedHoles.map((hNum) => {
                          const hInfo = getHoleInfo(hNum);
                          const meta = activeCourse.holesMetadata?.find((m) => Number(m.hole) === hInfo.base);
                          return (
                            <th key={hNum} className="py-1.5 px-1.5 font-extrabold text-stone-800 min-w-[34px]">
                              <div>{hInfo.cLetter}{hInfo.hInCourse}</div>
                              <div className="text-[9px] font-normal text-stone-400">P{meta?.par || 3}</div>
                            </th>
                          );
                        })}
                        <th className="py-1.5 px-2 bg-emerald-100 text-emerald-950 font-black min-w-[42px]">
                          {isJapanese ? '合計' : '합계'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium">
                      {(round.players || []).map((p) => {
                        const pScored = getPlayerConfirmedHoles(p);
                        const pTotal = pScored.reduce((sum, hNum) => sum + (p.scores?.[hNum] || 0), 0);
                        return (
                          <tr key={p.id} className="hover:bg-stone-50">
                            <td className="py-2 px-2 text-left font-black text-stone-800 text-[11px] truncate max-w-[70px]">
                              {p.name}
                            </td>
                            {confirmedHoles.map((hNum) => {
                              const s = p.scores?.[hNum];
                              const isScored = s !== undefined && s > 0 && pScored.includes(hNum);
                              const hInfo = getHoleInfo(hNum);
                              const meta = activeCourse.holesMetadata?.find((m) => Number(m.hole) === hInfo.base);
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

        {/* Certificate link */}
        <div className="pt-1.5 border-t shrink-0">
          <a
            href={`/round/result?id=${round.id}`}
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
