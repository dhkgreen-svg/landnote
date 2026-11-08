/**
 * 정규 18홀 골프 전용 스코어 & 용어 계산 유틸리티
 * - 홀인원, 알바트로스, 이글, 버디, 파, 보기, 더블보기, 트리플보기, 쿼드러플보기, 양파(Double Par)
 * - Out(전반 1~9), In(후반 10~18), Total(18홀) 타수 및 오버파 실시간 계산
 * - 미터(m) / 야드(yd) 단위 변환
 */

export interface GolfScoreTerm {
  term: string;           // '버디', '파', '보기', '양파' 등
  englishTerm: string;    // 'Birdie', 'Par', 'Bogey', 'Double Par' 등
  symbol: string;         // '⭕', '◎', '□', '⧈' 등
  diffText: string;       // '-1', '0', '+1', '+4' 등
  colorClass: string;     // Tailwind 색상 클래스
  bgClass: string;        // 배경 클래스
  borderClass: string;    // 테두리 클래스
  isHoleInOne: boolean;
  isDoublePar: boolean;   // 양파 여부
}

/**
 * 기준타수 2배 상한 (아마추어 양파 / 더블 파 타수 반환)
 * Par 3 -> 6타
 * Par 4 -> 8타
 * Par 5 -> 10타
 */
export function getDoubleParScore(par: number): number {
  return Math.max(2, par * 2);
}

/**
 * 특정 타수와 기준타수(Par)에 따른 정규 골프 공식 용어 판별
 */
export function getGolfScoreTerm(strokes: number, par: number = 4): GolfScoreTerm {
  if (!strokes || strokes <= 0) {
    return {
      term: '-',
      englishTerm: '-',
      symbol: '',
      diffText: '-',
      colorClass: 'text-stone-400',
      bgClass: 'bg-stone-50',
      borderClass: 'border-stone-200',
      isHoleInOne: false,
      isDoublePar: false,
    };
  }

  const diff = strokes - par;
  const isHoleInOne = strokes === 1;
  const doubleParStrokes = getDoubleParScore(par);
  const isDoublePar = strokes >= doubleParStrokes;

  // 1. 홀인원 (1타)
  if (isHoleInOne) {
    return {
      term: '홀인원 👑',
      englishTerm: 'Hole-in-One',
      symbol: '👑',
      diffText: '1타',
      colorClass: 'text-rose-700 font-black',
      bgClass: 'bg-amber-100',
      borderClass: 'border-rose-600',
      isHoleInOne: true,
      isDoublePar: false,
    };
  }

  // 2. 알바트로스 (-3타 이하)
  if (diff <= -3) {
    return {
      term: '알바트로스 🦅🦅',
      englishTerm: 'Albatross',
      symbol: '🦅🦅',
      diffText: `${diff}`,
      colorClass: 'text-rose-950 font-black',
      bgClass: 'bg-gradient-to-b from-amber-200 to-rose-100',
      borderClass: 'border-rose-600',
      isHoleInOne: false,
      isDoublePar: false,
    };
  }

  // 3. 이글 (-2타)
  if (diff === -2) {
    return {
      term: '이글 🦅',
      englishTerm: 'Eagle',
      symbol: '◎',
      diffText: '-2',
      colorClass: 'text-red-600 font-bold',
      bgClass: 'bg-rose-50',
      borderClass: 'border-red-500',
      isHoleInOne: false,
      isDoublePar: false,
    };
  }

  // 4. 버디 (-1타)
  if (diff === -1) {
    return {
      term: '버디 🐦',
      englishTerm: 'Birdie',
      symbol: '⭕',
      diffText: '-1',
      colorClass: 'text-red-600 font-bold',
      bgClass: 'bg-white',
      borderClass: 'border-red-500',
      isHoleInOne: false,
      isDoublePar: false,
    };
  }

  // 5. 파 (Par, 0)
  if (diff === 0) {
    return {
      term: '파 (Par)',
      englishTerm: 'Par',
      symbol: 'Par',
      diffText: '0',
      colorClass: 'text-emerald-800 font-bold',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-500',
      isHoleInOne: false,
      isDoublePar: false,
    };
  }

  // 6. 양파 (더블파) - Par의 2배 타수 이상
  if (isDoublePar) {
    return {
      term: '양파 (더블파)',
      englishTerm: 'Double Par',
      symbol: '⧈⧈',
      diffText: `+${diff}`,
      colorClass: 'text-purple-900 font-black',
      bgClass: 'bg-purple-100',
      borderClass: 'border-purple-600',
      isHoleInOne: false,
      isDoublePar: true,
    };
  }

  // 7. 보기 (+1타)
  if (diff === 1) {
    return {
      term: '보기 (Bogey)',
      englishTerm: 'Bogey',
      symbol: '□',
      diffText: '+1',
      colorClass: 'text-stone-800 font-semibold',
      bgClass: 'bg-stone-50',
      borderClass: 'border-stone-400',
      isHoleInOne: false,
      isDoublePar: false,
    };
  }

  // 8. 더블 보기 (+2타)
  if (diff === 2) {
    return {
      term: '더블보기 (+2)',
      englishTerm: 'Double Bogey',
      symbol: '⧈',
      diffText: '+2',
      colorClass: 'text-stone-900 font-bold',
      bgClass: 'bg-stone-100',
      borderClass: 'border-stone-500',
      isHoleInOne: false,
      isDoublePar: false,
    };
  }

  // 9. 트리플 보기 (+3타)
  if (diff === 3) {
    return {
      term: '트리플 보기 (+3)',
      englishTerm: 'Triple Bogey',
      symbol: '⧈',
      diffText: '+3',
      colorClass: 'text-amber-900 font-bold',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-500',
      isHoleInOne: false,
      isDoublePar: false,
    };
  }

  // 10. 쿼드러플 보기 (+4타)
  if (diff === 4) {
    return {
      term: '쿼드러플 보기 (+4)',
      englishTerm: 'Quadruple Bogey',
      symbol: '⧈',
      diffText: '+4',
      colorClass: 'text-rose-900 font-bold',
      bgClass: 'bg-rose-50',
      borderClass: 'border-rose-400',
      isHoleInOne: false,
      isDoublePar: false,
    };
  }

  // 그 외 (+5타 이상)
  return {
    term: `+${diff}타`,
    englishTerm: `+${diff}`,
    symbol: '⧈',
    diffText: `+${diff}`,
    colorClass: 'text-stone-900 font-bold',
    bgClass: 'bg-stone-100',
    borderClass: 'border-stone-400',
    isHoleInOne: false,
    isDoublePar: false,
  };
}

/**
 * 18홀 정규 라운드 Out(1~9), In(10~18), Total 분할 요약 계산
 */
export interface CourseSegmentSummary {
  courseType: 'OUT' | 'IN' | 'TOTAL';
  title: string;          // '전반 Out (1~9홀)', '후반 In (10~18홀)', 'Total (18홀)'
  startHole: number;
  endHole: number;
  holesCount: number;
  totalPar: number;
  strokes: number;
  diff: number;           // over/under par (+2, -1, 0)
  diffText: string;       // '+2', 'E', '-1'
  playedHolesCount: number;
  isComplete: boolean;
}

export function calculate18HolesSummary(
  scores: Record<number, number> = {},
  parMap: Record<number, number> | Array<{ hole: number; par: number }> = {}
): {
  outSummary: CourseSegmentSummary;
  inSummary: CourseSegmentSummary;
  totalSummary: CourseSegmentSummary;
} {
  // Normalize parMap if array is provided
  const resolvedParMap: Record<number, number> = {};
  if (Array.isArray(parMap)) {
    parMap.forEach((m: any) => {
      if (m && typeof m.hole === 'number') {
        resolvedParMap[m.hole] = Number(m.par) || 4;
      }
    });
  } else if (parMap && typeof parMap === 'object') {
    Object.entries(parMap).forEach(([h, p]) => {
      resolvedParMap[Number(h)] = Number(p) || 4;
    });
  }

  // Out 코스: 1 ~ 9홀
  let outPar = 0;
  let outStrokes = 0;
  let outPlayed = 0;
  for (let h = 1; h <= 9; h++) {
    const p = resolvedParMap[h] ?? (h === 3 || h === 7 ? 3 : h === 5 || h === 9 ? 5 : 4);
    outPar += p;
    const s = scores[h] || 0;
    if (s > 0) {
      outStrokes += s;
      outPlayed++;
    }
  }
  const outDiff = outStrokes > 0 ? outStrokes - (outPlayed > 0 ? (outPar / 9) * outPlayed : 0) : 0;
  const outExactDiff = outPlayed === 9 ? outStrokes - outPar : outDiff;

  // In 코스: 10 ~ 18홀
  let inPar = 0;
  let inStrokes = 0;
  let inPlayed = 0;
  for (let h = 10; h <= 18; h++) {
    const p = resolvedParMap[h] ?? (h === 12 || h === 15 ? 3 : h === 11 || h === 17 ? 5 : 4);
    inPar += p;
    const s = scores[h] || 0;
    if (s > 0) {
      inStrokes += s;
      inPlayed++;
    }
  }
  const inDiff = inStrokes > 0 ? inStrokes - (inPlayed > 0 ? (inPar / 9) * inPlayed : 0) : 0;
  const inExactDiff = inPlayed === 9 ? inStrokes - inPar : inDiff;

  // Total
  const totalPar = outPar + inPar;
  const totalStrokes = outStrokes + inStrokes;
  const totalPlayed = outPlayed + inPlayed;
  const totalExactDiff = totalStrokes - (totalPlayed > 0 ? totalPar * (totalPlayed / 18) : 0);

  const formatDiffText = (diffVal: number, played: number) => {
    if (played === 0) return '-';
    const rounded = Math.round(diffVal);
    if (rounded === 0) return 'E (Even)';
    return rounded > 0 ? `+${rounded}` : `${rounded}`;
  };

  return {
    outSummary: {
      courseType: 'OUT',
      title: '전반 Out (1~9홀)',
      startHole: 1,
      endHole: 9,
      holesCount: 9,
      totalPar: outPar || 36,
      strokes: outStrokes,
      diff: Math.round(outExactDiff),
      diffText: formatDiffText(outExactDiff, outPlayed),
      playedHolesCount: outPlayed,
      isComplete: outPlayed === 9,
    },
    inSummary: {
      courseType: 'IN',
      title: '후반 In (10~18홀)',
      startHole: 10,
      endHole: 18,
      holesCount: 9,
      totalPar: inPar || 36,
      strokes: inStrokes,
      diff: Math.round(inExactDiff),
      diffText: formatDiffText(inExactDiff, inPlayed),
      playedHolesCount: inPlayed,
      isComplete: inPlayed === 9,
    },
    totalSummary: {
      courseType: 'TOTAL',
      title: 'Total (18홀 합산)',
      startHole: 1,
      endHole: 18,
      holesCount: 18,
      totalPar: totalPar || 72,
      strokes: totalStrokes,
      diff: Math.round(totalExactDiff),
      diffText: formatDiffText(totalExactDiff, totalPlayed),
      playedHolesCount: totalPlayed,
      isComplete: totalPlayed === 18,
    },
  };
}

/**
 * 거리 단위 변환
 * meterToYard, yardToMeter
 */
export function meterToYard(meters: number): number {
  return Math.round(meters * 1.09361);
}

export function yardToMeter(yards: number): number {
  return Math.round(yards * 0.9144);
}

/**
 * 티박스 및 단위에 맞는 홀 거리 반환
 */
export function getFormattedHoleDistance(
  hole: {
    distanceMeter?: number;
    distanceYard?: number;
    distanceRedMeter?: number;
    distanceRedYard?: number;
  },
  teeBox: 'WHITE' | 'RED' | 'BLUE' | 'BLACK' = 'WHITE',
  unit: 'METER' | 'YARD' = 'METER'
): string {
  const isRed = teeBox === 'RED';
  let dist = 0;

  if (unit === 'YARD') {
    if (isRed) {
      dist = hole.distanceRedYard ?? (hole.distanceRedMeter ? meterToYard(hole.distanceRedMeter) : 0);
    }
    if (!dist) {
      dist = hole.distanceYard ?? (hole.distanceMeter ? meterToYard(hole.distanceMeter) : 0);
    }
    return `${dist}yd`;
  }

  // METER
  if (isRed) {
    dist = hole.distanceRedMeter ?? (hole.distanceRedYard ? yardToMeter(hole.distanceRedYard) : 0);
  }
  if (!dist) {
    dist = hole.distanceMeter ?? (hole.distanceYard ? yardToMeter(hole.distanceYard) : 0);
  }
  return `${dist}m`;
}
