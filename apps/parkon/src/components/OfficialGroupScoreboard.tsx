'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Edit3 } from 'lucide-react';
import { Course, RoundSession } from '@/types/parkon';
import { generateScorecardImage, GeneratedScorecardResult } from '@/lib/scorecardImageGenerator';

export interface ScoreboardPlayerInput {
  id: string;
  name: string;
  gender: 'M' | 'F';
  isGuest: boolean;
  scores: Record<number, number>;
  courseTotals?: Record<string, number>;
  reportedTotal: number;
  useDirectTotal?: boolean;
}

export interface ScoreboardGroupInput {
  groupId: string;
  groupNumber: string;
  courseName: string;
  date: string;
  courses: string[];
  imageUrl?: string;
  players: ScoreboardPlayerInput[];
}

const STANDARD_9_PARS = [3, 4, 3, 4, 3, 4, 4, 3, 5]; // 합계 Par 33

export function getStandardHolePar(holeNum: number, course?: Course | null): number {
  const base = ((holeNum - 1) % 36) + 1;
  const meta = course?.holesMetadata?.find((m) => m.hole === base);
  if (meta?.par) return meta.par;
  return STANDARD_9_PARS[(holeNum - 1) % 9] || 3;
}

export function getScoreboardPlayerTotal(p: ScoreboardPlayerInput, courses: string[]): number {
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

/**
 * Convert a ScoreboardGroupInput into a standard RoundSession so we can reuse the
 * EXACT official 1080x1440 scorecardImageGenerator used in RoundScoreboardModal!
 */
export function buildRoundSessionFromGroup(
  group: ScoreboardGroupInput,
  options?: {
    id?: string;
    courseId?: string;
    course?: Course | null;
    titlePrefix?: string;
    isClubGroup?: boolean;
  }
): { session: RoundSession; course: Course } {
  const courses = group.courses && group.courses.length > 0 ? group.courses : ['A', 'B'];
  const totalHoles = courses.length * 9;
  const allHoles = Array.from({ length: totalHoles }, (_, i) => i + 1);

  const effectiveCourse: Course = options?.course || {
    id: options?.courseId || 'course_official_quick',
    name: options?.titlePrefix
      ? `${options.titlePrefix} (${group.groupNumber})`
      : options?.isClubGroup
      ? `${group.courseName} · ${group.groupNumber}`
      : group.courseName || '파크골프장',
    region: '',
    totalHoles,
    totalCourses: courses.length,
    isVerified: true,
    holesMetadata: allHoles.map((h) => ({
      hole: h,
      par: getStandardHolePar(h),
      distanceMeter: getStandardHolePar(h) === 5 ? 110 : getStandardHolePar(h) === 4 ? 75 : 50,
    })),
  };

  const courseDisplayName = options?.isClubGroup
    ? `${group.courseName || '파크골프장'} · ${group.groupNumber}`
    : group.courseName || '파크골프장';

  const totalPar = allHoles.reduce((s, h) => s + getStandardHolePar(h, options?.course), 0);

  const players = (group.players || [])
    .filter((p) => p.name.trim())
    .map((p, idx) => {
      // If user entered only total without hole scores, distribute cleanly so official grid still renders nicely
      let scoresMap: Record<number, number> = { ...(p.scores || {}) };
      const existingHoleCount = Object.values(scoresMap).filter((v) => v > 0).length;
      const tot = getScoreboardPlayerTotal(p, courses);

      if (existingHoleCount === 0 && tot > 0) {
        const avg = Math.max(1, Math.floor(tot / totalHoles));
        let rem = tot - avg * totalHoles;
        scoresMap = {};
        allHoles.forEach((h) => {
          const add = rem > 0 ? 1 : 0;
          if (rem > 0) rem -= 1;
          scoresMap[h] = avg + add;
        });
      }

      const finalTotal =
        existingHoleCount > 0
          ? Object.values(scoresMap).reduce((a, b) => a + (Number(b) || 0), 0)
          : tot;

      return {
        id: p.id || `p_${idx + 1}`,
        name: p.isGuest ? `${p.name.trim()} (게스트)` : p.name.trim(),
        isLeader: idx === 0,
        isSelf: idx === 0,
        isGuest: p.isGuest,
        scores: scoresMap,
        obCount: {},
        totalStrokes: finalTotal,
        totalParDiff: finalTotal - totalPar,
      };
    });

  const baseDate = group.date ? new Date(`${group.date}T09:00:00`) : new Date();
  const startedIso = Number.isNaN(baseDate.getTime()) ? new Date().toISOString() : baseDate.toISOString();
  const completedIso = new Date(new Date(startedIso).getTime() + 65 * 60 * 1000).toISOString();

  const session: RoundSession = {
    id: options?.id || `photo_round_${Date.now()}`,
    courseId: effectiveCourse.id,
    courseName: courseDisplayName,
    startedAt: startedIso,
    completedAt: completedIso,
    durationMinutes: 65,
    currentHole: totalHoles,
    totalHoles,
    selectedCourseLetters: courses,
    selectedHoleNumbers: allHoles,
    confirmedHoles: allHoles,
    players,
    status: 'COMPLETED',
    isOfficial: true,
    isGpsVerified: false,
    isFieldVerified: true,
    photos: group.imageUrl ? [group.imageUrl] : undefined,
  };

  return { session, course: { ...effectiveCourse, name: courseDisplayName } };
}

export async function generateOfficialGroupScoreboardImage(
  group: ScoreboardGroupInput,
  options?: { course?: Course | null; isClubGroup?: boolean }
): Promise<GeneratedScorecardResult | null> {
  const { session, course } = buildRoundSessionFromGroup(group, {
    course: options?.course,
    isClubGroup: options?.isClubGroup,
  });
  return generateScorecardImage({
    round: session,
    course,
    selectedCourseLetters: group.courses && group.courses.length > 0 ? group.courses : ['A', 'B'],
  });
}

function renderOfficialScoreBadge(stroke: number | undefined, par: number) {
  if (!stroke || stroke <= 0) {
    return <span className="text-stone-300 font-bold text-xs">-</span>;
  }
  const diff = stroke - par;
  if (stroke === 1) {
    // Hole-in-One: crown + double gold/red circle
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-amber-500 ring-1 ring-rose-500 bg-amber-50 text-rose-700 font-black text-xs">
        1
      </span>
    );
  }
  if (diff <= -2) {
    // Eagle / Albatross: double red circle
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-rose-500 ring-1 ring-rose-300 bg-rose-50 text-rose-700 font-black text-xs">
        {stroke}
      </span>
    );
  }
  if (diff === -1) {
    // Birdie: single red circle
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-[1.5px] border-rose-500 text-rose-600 font-black text-xs">
        {stroke}
      </span>
    );
  }
  if (diff === 0) {
    // Par: clean light rounded box
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-stone-100 text-stone-800 font-black text-xs">
        {stroke}
      </span>
    );
  }
  // Bogey+: bordered square
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-sm border-[1.5px] border-stone-500 text-stone-900 font-black text-xs">
      {stroke}
    </span>
  );
}

interface OfficialGroupScoreboardProps {
  group: ScoreboardGroupInput;
  course?: Course | null;
  showClubGroupHeader?: boolean;
  onTapPlayer: (groupId: string, playerId: string, holeNum?: number) => void;
  onFixMathMismatch?: (groupId: string, playerId: string, calcTotal: number) => void;
}

/**
 * 파키 앱 공식 스코어보드 표 (RoundScoreboardModal 100% 동일 양식)
 * - 코스별 9홀 카드 (A코스 1H~9H, B코스 10H~18H, ...)
 * - 인라인 입력 없이 깔끔한 공식 표로 보여주고, 선수/홀 칸을 탭하면 수정 팝업 오픈!
 */
export function OfficialGroupScoreboard({
  group,
  course,
  showClubGroupHeader = false,
  onTapPlayer,
  onFixMathMismatch,
}: OfficialGroupScoreboardProps) {
  const courses = group.courses && group.courses.length > 0 ? group.courses : ['A', 'B'];

  // Sort players by Traditional Stroke (lowest first) for clean rank medals inside group
  const sortedPlayers = [...(group.players || [])].sort(
    (a, b) => getScoreboardPlayerTotal(a, courses) - getScoreboardPlayerTotal(b, courses)
  );

  // Check math mismatches for this group
  const mismatches = (group.players || [])
    .map((p) => {
      const calc = getScoreboardPlayerTotal(p, courses);
      const isBad = !p.useDirectTotal && p.reportedTotal > 0 && calc > 0 && calc !== p.reportedTotal;
      return isBad ? { player: p, calc } : null;
    })
    .filter(Boolean) as { player: ScoreboardPlayerInput; calc: number }[];

  return (
    <div data-testid={`official-group-scoreboard-${group.groupNumber}`} className="space-y-3">
      {showClubGroupHeader && (
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-emerald-800 text-white rounded-lg">{group.groupNumber}</span>
            <span>{group.courseName} 공식 스코어보드</span>
          </div>
          <span className="text-[10px] font-bold text-stone-500">선수 · 홀 칸 터치 시 수정 팝업</span>
        </div>
      )}

      {/* Math Mismatch Alerts (1-tap fix OR tap player to edit holes) */}
      {mismatches.length > 0 && (
        <div className="space-y-1.5">
          {mismatches.map(({ player, calc }) => (
            <div
              key={player.id}
              data-testid={`math-mismatch-alert-${player.name}`}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-rose-50 border-2 border-rose-400 rounded-xl text-[11px] font-black text-rose-800"
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="truncate">
                  {player.name} 검산 오차: 종이 기재 {player.reportedTotal}타 ≠ 홀 합계 {calc}타
                </span>
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {onFixMathMismatch && (
                  <button
                    type="button"
                    onClick={() => onFixMathMismatch(group.groupId, player.id, calc)}
                    className="px-2 py-1 bg-rose-700 text-white rounded-lg text-[10px] font-black cursor-pointer"
                  >
                    합계({calc}타)로 확정
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onTapPlayer(group.groupId, player.id, 1)}
                  className="px-2 py-1 bg-white text-rose-700 border border-rose-300 rounded-lg text-[10px] font-black cursor-pointer"
                >
                  수정
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Official Course-by-Course 9-Hole Cards (Matching RoundScoreboardModal!) */}
      {courses.map((courseLetter, cIdx) => {
        const startHole = cIdx * 9 + 1;
        const holeNums = Array.from({ length: 9 }, (_, i) => startHole + i);
        const coursePar = holeNums.reduce((s, h) => s + getStandardHolePar(h, course), 0);

        return (
          <div
            key={`${group.groupId}_${courseLetter}`}
            className="bg-white border-2 border-stone-200 rounded-2xl overflow-hidden shadow-2xs"
          >
            {/* Course Card Header */}
            <div className="px-3 py-2 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <span className="text-xs font-black text-emerald-900 flex items-center gap-1">
                <span>⛳</span>
                <span>
                  {courseLetter}코스 (기준 Par {coursePar})
                </span>
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                9홀 · 탭하여 수정
              </span>
            </div>

            {/* Scrollable Official 9-Hole Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse min-w-[355px]">
                <thead>
                  <tr className="bg-stone-50/70 border-b border-stone-200 text-[10px] text-stone-500">
                    <th className="py-1.5 px-2 text-left font-black text-stone-700 sticky left-0 bg-stone-50 z-10 min-w-[92px]">
                      선수
                    </th>
                    {holeNums.map((h, i) => (
                      <th key={h} className="py-1 px-0.5 font-black text-stone-700">
                        <div>{i + 1}H</div>
                        <div className="text-[9px] font-bold text-stone-400">
                          P{getStandardHolePar(h, course)}
                        </div>
                      </th>
                    ))}
                    <th className="py-1.5 px-2 font-black text-emerald-900 bg-emerald-50/60 min-w-[44px]">
                      계
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sortedPlayers.map((p, pIdx) => {
                    const holeSum = holeNums.reduce((s, h) => s + (Number(p.scores?.[h]) || 0), 0);
                    const totalAll = getScoreboardPlayerTotal(p, courses);
                    const courseVal =
                      holeSum > 0
                        ? holeSum
                        : p.courseTotals?.[courseLetter] ||
                          (courses.length === 1 ? totalAll : Math.round(totalAll / courses.length));
                    const rankMedal = pIdx === 0 ? '🥇' : pIdx === 1 ? '🥈' : pIdx === 2 ? '🥉' : `${pIdx + 1}`;
                    const hasMismatch =
                      !p.useDirectTotal && p.reportedTotal > 0 && totalAll > 0 && totalAll !== p.reportedTotal;

                    return (
                      <tr
                        key={p.id}
                        data-testid={`scoreboard-player-row-${p.name}`}
                        className={`hover:bg-emerald-50/50 transition ${
                          hasMismatch ? 'bg-rose-50/60' : p.isGuest ? 'bg-amber-50/40' : 'bg-white'
                        }`}
                      >
                        {/* Tappable Player Name Cell -> Opens Popup Editor */}
                        <td
                          onClick={() => onTapPlayer(group.groupId, p.id, startHole)}
                          className={`py-2 px-2 text-left sticky left-0 z-10 cursor-pointer border-r border-stone-100 ${
                            hasMismatch ? 'bg-rose-50' : p.isGuest ? 'bg-amber-50/80' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] shrink-0">{rankMedal}</span>
                            <span className="font-black text-xs text-stone-900 truncate max-w-[54px]">
                              {p.name || '미입력'}
                            </span>
                            <Edit3 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {p.isGuest && (
                              <span className="text-[8.5px] font-black px-1 bg-amber-300 text-stone-950 rounded">
                                게스트
                              </span>
                            )}
                            <span className="text-[9px] font-bold text-emerald-700">총 {totalAll}타</span>
                          </div>
                        </td>

                        {/* Tappable 9 Hole Cells -> Opens Popup Editor Focused on That Hole */}
                        {holeNums.map((h) => {
                          const par = getStandardHolePar(h, course);
                          const st = p.scores?.[h];
                          return (
                            <td
                              key={h}
                              onClick={() => onTapPlayer(group.groupId, p.id, h)}
                              className="py-1.5 px-0.5 cursor-pointer active:bg-emerald-100"
                            >
                              {renderOfficialScoreBadge(st, par)}
                            </td>
                          );
                        })}

                        {/* Course Subtotal Cell */}
                        <td
                          onClick={() => onTapPlayer(group.groupId, p.id, startHole)}
                          className="py-2 px-1.5 font-black text-xs text-emerald-950 bg-emerald-50/40 cursor-pointer"
                        >
                          {courseVal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Official Symbol Legend (Matching RoundScoreboardModal!) */}
      <div className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-stone-600">
        <span>👑① 홀인원</span>
        <span className="text-rose-600">◎ 이글(-2)</span>
        <span className="text-rose-600">○ 버디(-1)</span>
        <span>▪ 파(0)</span>
        <span>□ 보기(+1)</span>
        {mismatches.length === 0 && (
          <span className="text-emerald-700 font-black flex items-center gap-0.5">
            <CheckCircle2 className="w-3 h-3" />
            검산 일치
          </span>
        )}
      </div>
    </div>
  );
}
