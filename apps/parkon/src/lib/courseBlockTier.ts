import { Course, CourseBlock, CourseBlockHoleScore, HoleMetadata, RoundSession } from '../types/parkon';

export type DiamondTierCode =
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'WHITE_DIA'
  | 'BLUE_DIA'
  | 'PINK_DIA'
  | 'BLACK_DIA'
  | 'GOLDEN_HALL';

export interface UserDiamondTier {
  code: DiamondTierCode;
  nameKo: string;
  nameJa: string;
  badgeLabel: string;
  icon: string;
  minCompleted: number;
  nextMilestone: number | null;
  bgGradient: string;
  borderClass: string;
  glowClass: string;
  textColor: string;
  accentColor: string;
}

/**
 * 👑 파크골프 올인원 공식 9홀 누적 완주 기반 컬러 다이아몬드 티어 계산 순수 함수
 * @param completedCount 누적 9홀 완주 횟수 (18홀 완주 시 2회)
 */
export function calculateTier(completedCount: number): UserDiamondTier {
  const count = Math.max(0, Math.floor(completedCount || 0));

  if (count >= 1000) {
    return {
      code: 'GOLDEN_HALL',
      nameKo: '골든 임페리얼 (명예의 전당)',
      nameJa: 'ゴールデン・インペリアル (殿堂)',
      badgeLabel: '1000+ 완주',
      icon: '👑',
      minCompleted: 1000,
      nextMilestone: null,
      bgGradient: 'from-amber-400 via-yellow-200 to-amber-500',
      borderClass: 'border-amber-300 ring-2 ring-yellow-400 shadow-[0_0_18px_rgba(245,158,11,0.6)]',
      glowClass: 'animate-pulse text-amber-500',
      textColor: 'text-amber-950 font-black',
      accentColor: '#D97706',
    };
  }

  if (count >= 750) {
    return {
      code: 'PINK_DIA',
      nameKo: '팬시 핑크 다이아몬드',
      nameJa: 'ファンシーピンク・ダイヤモンド',
      badgeLabel: '750+ 완주',
      icon: '💖',
      minCompleted: 750,
      nextMilestone: 1000,
      bgGradient: 'from-pink-400 via-rose-300 to-pink-500',
      borderClass: 'border-pink-300 ring-2 ring-pink-400 shadow-[0_0_15px_rgba(244,63,94,0.5)]',
      glowClass: 'animate-pulse text-pink-500',
      textColor: 'text-pink-950 font-black',
      accentColor: '#E11D48',
    };
  }

  if (count >= 500) {
    return {
      code: 'BLUE_DIA',
      nameKo: '팬시 블루 다이아몬드',
      nameJa: 'ファンシーブルー・ダイヤモンド',
      badgeLabel: '500+ 완주',
      icon: '💎',
      minCompleted: 500,
      nextMilestone: 750,
      bgGradient: 'from-sky-400 via-cyan-300 to-blue-500',
      borderClass: 'border-sky-300 ring-2 ring-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.5)]',
      glowClass: 'animate-pulse text-sky-500',
      textColor: 'text-sky-950 font-black',
      accentColor: '#0284C7',
    };
  }

  if (count >= 100) {
    return {
      code: 'WHITE_DIA',
      nameKo: '화이트 다이아몬드',
      nameJa: 'ホワイト・ダイヤモンド',
      badgeLabel: '100+ 완주',
      icon: '💎',
      minCompleted: 100,
      nextMilestone: 500,
      bgGradient: 'from-slate-100 via-white to-slate-200',
      borderClass: 'border-slate-300 ring-1 ring-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.4)]',
      glowClass: 'text-slate-700',
      textColor: 'text-slate-900 font-extrabold',
      accentColor: '#475569',
    };
  }

  if (count >= 60) {
    return {
      code: 'GOLD',
      nameKo: '골드 티어',
      nameJa: 'ゴールド・ティア',
      badgeLabel: '골드',
      icon: '🥇',
      minCompleted: 60,
      nextMilestone: 100,
      bgGradient: 'from-amber-200 to-yellow-400',
      borderClass: 'border-amber-400 shadow-sm',
      glowClass: 'text-amber-600',
      textColor: 'text-amber-950 font-bold',
      accentColor: '#D97706',
    };
  }

  if (count >= 30) {
    return {
      code: 'SILVER',
      nameKo: '실버 티어',
      nameJa: 'シルバー・ティア',
      badgeLabel: '실버',
      icon: '🥈',
      minCompleted: 30,
      nextMilestone: 60,
      bgGradient: 'from-slate-200 to-slate-300',
      borderClass: 'border-slate-400 shadow-xs',
      glowClass: 'text-slate-600',
      textColor: 'text-slate-800 font-bold',
      accentColor: '#64748B',
    };
  }

  return {
    code: 'BRONZE',
    nameKo: '브론즈 티어',
    nameJa: 'ブロンズ・ティア',
    badgeLabel: '브론즈',
    icon: '🥉',
    minCompleted: 0,
    nextMilestone: 30,
    bgGradient: 'from-amber-100 to-orange-200',
    borderClass: 'border-amber-700/30',
    glowClass: 'text-amber-800',
    textColor: 'text-amber-900 font-bold',
    accentColor: '#B45309',
  };
}

/**
 * 🧱 9홀 단위 모듈형 코스 블록 빌더 (하위 호환 100% 보장)
 * 세션의 홀 데이터와 플레이어 타수를 9홀 단위 CourseBlock 배열로 매핑
 */
export function buildCourseBlocksFromSession(
  session: RoundSession,
  course?: Course
): CourseBlock[] {
  if (!session || !session.players) return [];

  const selectedHoles = session.selectedHoleNumbers && session.selectedHoleNumbers.length > 0
    ? session.selectedHoleNumbers
    : Array.from({ length: session.totalHoles || 18 }, (_, i) => i + 1);

  const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const blocks: CourseBlock[] = [];
  const blockSize = 9;
  const numBlocks = Math.ceil(selectedHoles.length / blockSize);

  for (let bIdx = 0; bIdx < numBlocks; bIdx++) {
    const chunkHoles = selectedHoles.slice(bIdx * blockSize, (bIdx + 1) * blockSize);
    if (chunkHoles.length === 0) continue;

    const firstHole = chunkHoles[0];
    const baseHole = ((firstHole - 1) % 1000) + 1;
    const courseIndex = Math.floor((baseHole - 1) / 9);
    const roundNumber = Math.floor((firstHole - 1) / 1000) + 1;
    const courseLetter = COURSE_LETTERS[courseIndex % COURSE_LETTERS.length] || 'A';
    const courseName = `${courseLetter}코스`;

    let totalPar = 0;
    const holeScores: CourseBlockHoleScore[] = chunkHoles.map((actualHole, idx) => {
      const relHole = idx + 1;
      const baseH = ((actualHole - 1) % 1000) + 1;
      const meta = (session.customHolesMetadata || course?.holesMetadata || []).find(
        (m) => Number(m.hole) === baseH
      );
      const par = Number(meta?.par || 3);
      totalPar += par;

      const strokes: Record<string, number> = {};
      const obCount: Record<string, number> = {};

      session.players.forEach((p) => {
        strokes[p.id] = p.scores[actualHole] ?? 0;
        obCount[p.id] = p.obCount?.[actualHole] ?? 0;
      });

      return {
        holeNumber: relHole,
        actualHole,
        par,
        distanceMeter: meta?.distanceMeter,
        strokes,
        obCount,
      };
    });

    const playerTotals: CourseBlock['playerTotals'] = {};
    session.players.forEach((p) => {
      let pStrokes = 0;
      let pOb = 0;
      chunkHoles.forEach((h) => {
        pStrokes += p.scores[h] || 0;
        pOb += p.obCount?.[h] || 0;
      });
      playerTotals[p.id] = {
        strokes: pStrokes,
        diff: pStrokes > 0 ? pStrokes - totalPar : 0,
        ob: pOb,
      };
    });

    blocks.push({
      blockIndex: bIdx,
      roundNumber,
      courseLetter,
      courseName,
      holeScores,
      totalPar,
      playerTotals,
      completedAt: session.completedAt || (chunkHoles.every((h) => session.confirmedHoles?.includes(h)) ? new Date().toISOString() : undefined),
    });
  }

  return blocks;
}

/**
 * 💾 로컬 스토리지에 유저 누적 9홀 완주 횟수 저장 및 조회
 */
const TIER_STORAGE_KEY = 'parkon_user_completed_9holes';

export function getUserCompleted9Holes(userNameOrCode?: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const key = userNameOrCode ? `${TIER_STORAGE_KEY}_${userNameOrCode.trim()}` : TIER_STORAGE_KEY;
    const val = localStorage.getItem(key);
    if (val) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) return parsed;
    }
    // Fallback: calculate from chronicle/record history
    const chronicleStr = localStorage.getItem('parkon_round_chronicle');
    if (chronicleStr) {
      const records = JSON.parse(chronicleStr);
      if (Array.isArray(records)) {
        let total9Holes = 0;
        records.forEach((r: any) => {
          const holes = r.totalHoles || (r.confirmedHoles?.length) || 18;
          total9Holes += Math.max(1, Math.round(holes / 9));
        });
        return total9Holes;
      }
    }
  } catch {}
  return 0;
}

export function incrementUserCompleted9Holes(userNameOrCode?: string, count: number = 1): number {
  if (typeof window === 'undefined') return 0;
  try {
    const current = getUserCompleted9Holes(userNameOrCode);
    const updated = current + count;
    const key = userNameOrCode ? `${TIER_STORAGE_KEY}_${userNameOrCode.trim()}` : TIER_STORAGE_KEY;
    localStorage.setItem(key, updated.toString());
    localStorage.setItem(TIER_STORAGE_KEY, updated.toString()); // default user key also sync
    return updated;
  } catch {}
  return 0;
}
