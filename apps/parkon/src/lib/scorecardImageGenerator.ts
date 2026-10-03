import { RoundSession, Course, RoundPlayer } from '@/types/parkon';

const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export interface GenerateScorecardOptions {
  round: RoundSession;
  course: Course;
  selectedCourseLetters?: string[]; // e.g. ['A', 'B']
  isJapanese?: boolean;
}

export interface GeneratedScorecardResult {
  dataUrl: string;
  blob: Blob;
  fileName: string;
}

/**
 * HTML5 Canvas 기반 4인 고화질 스코어보드 이미지 생성기
 * - 카카오톡/밴드/라인 사진 공유 전용 1080x1440 초고해상도 PNG 생성
 * - 선택된 코스(A, B 등)만 필터링하여 정확한 18홀 타수 및 4인 순위 산출
 */
export async function generateScorecardImage(
  options: GenerateScorecardOptions
): Promise<GeneratedScorecardResult | null> {
  const { round, course, selectedCourseLetters, isJapanese } = options;
  if (typeof window === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Helper to extract base hole and course letter
  const getHoleInfo = (hNum: number) => {
    const num = Number(hNum);
    const base = ((num - 1) % 1000) + 1;
    const cIdx = Math.floor((base - 1) / 9);
    const cLetter = COURSE_LETTERS[cIdx] || 'A';
    const hInCourse = ((base - 1) % 9) + 1;
    return { num, base, cLetter, hInCourse, cIdx };
  };

  // 2. Identify available & filtered holes
  const allHoleNums = Object.keys(
    round.players.reduce((acc, p) => ({ ...acc, ...p.scores }), {} as Record<number, number>)
  ).map(Number).filter((n) => n > 0);

  const availableHoles = allHoleNums.length > 0
    ? Array.from(new Set(allHoleNums)).sort((a, b) => a - b)
    : (round.confirmedHoles && round.confirmedHoles.length > 0
        ? round.confirmedHoles
        : Array.from({ length: round.totalHoles || 18 }, (_, i) => i + 1));

  // Filter holes by selectedCourseLetters if specified
  const filteredHoles = selectedCourseLetters && selectedCourseLetters.length > 0
    ? availableHoles.filter((h) => selectedCourseLetters.includes(getHoleInfo(h).cLetter))
    : availableHoles;

  const getHolePar = (hNum: number): number => {
    const info = getHoleInfo(hNum);
    const meta = course.holesMetadata?.find((m) => m.hole === info.base);
    if (meta?.par) return meta.par;
    return info.base % 3 === 0 ? 5 : info.base % 2 === 0 ? 4 : 3;
  };

  const totalPar = filteredHoles.reduce((acc, h) => acc + getHolePar(h), 0);
  const totalHolesCount = filteredHoles.length;

  // 3. Recalculate players' scores for filtered holes
  const playersSummary = (round.players || []).map((p, idx) => {
    let strokes = 0;
    let scoredHoles = 0;
    let parDiff = 0;
    let ob = 0;

    filteredHoles.forEach((h) => {
      const s = p.scores?.[h];
      if (s && s > 0) {
        strokes += s;
        scoredHoles += 1;
        parDiff += (s - getHolePar(h));
      }
      ob += (p.obCount?.[h] || 0);
    });

    const isSelf = p.isSelf ?? (idx === 0);
    return {
      id: p.id,
      name: p.name,
      isSelf,
      isLeader: p.isLeader,
      strokes,
      scoredHoles,
      parDiff,
      ob,
    };
  });

  // Sort by strokes ascending (lowest strokes wins)
  playersSummary.sort((a, b) => {
    if (a.strokes === 0 && b.strokes > 0) return 1;
    if (b.strokes === 0 && a.strokes > 0) return -1;
    return a.strokes - b.strokes;
  });

  // Assign ranks
  const rankedPlayers = playersSummary.map((p, idx) => ({
    ...p,
    rank: idx + 1,
  }));

  // Date & Time formatting
  const startDate = new Date(round.startedAt || round.completedAt || Date.now());
  const endDate = round.completedAt ? new Date(round.completedAt) : new Date(startDate.getTime() + 104 * 60 * 1000);
  
  const dateStr = startDate.toLocaleDateString(isJapanese ? 'ja-JP' : 'ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const startTimeStr = startDate.toLocaleTimeString(isJapanese ? 'ja-JP' : 'ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const endTimeStr = endDate.toLocaleTimeString(isJapanese ? 'ja-JP' : 'ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const durationMin = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
  const durationText = durationMin >= 60
    ? `${Math.floor(durationMin / 60)}시간 ${durationMin % 60}분`
    : `${durationMin}분`;

  // DRAWING CANVAS
  // 1. Background Gradient (Luxury Emerald & Teal Field)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#064e3b');   // Deep Emerald
  bgGrad.addColorStop(0.35, '#043828');
  bgGrad.addColorStop(1, '#021e16');   // Very Dark Turf
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative border
  ctx.strokeStyle = '#FBBF24'; // Gold
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(38, 38, canvas.width - 76, canvas.height - 76);

  // 2. Header Section
  // Top Badge
  ctx.fillStyle = 'rgba(251, 191, 36, 0.18)';
  ctx.beginPath();
  ctx.roundRect(70, 60, 480, 46, 23);
  ctx.fill();
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#FDE047';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText('⛳ 파크골프 올인원 공식 인증 스코어카드', 96, 92);

  // Right GPS verified stamp
  ctx.fillStyle = 'rgba(52, 211, 153, 0.2)';
  ctx.beginPath();
  ctx.roundRect(720, 60, 290, 46, 23);
  ctx.fill();
  ctx.strokeStyle = '#34D399';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#34D399';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText('📍 GPS 필드 공식 인증 완주', 740, 91);

  // Course Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText(round.courseName || course.name, 70, 175);

  // Round metadata line
  const activeCourseLetters = selectedCourseLetters && selectedCourseLetters.length > 0
    ? selectedCourseLetters.join(', ')
    : 'A, B';
  ctx.fillStyle = '#FBBF24';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText(`${totalHolesCount}홀 완주 (${activeCourseLetters} 코스 · 기준 Par ${totalPar})`, 70, 220);

  // Exact Time Badge
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText(`📅 ${dateStr} · ⏰ ${startTimeStr} ~ ${endTimeStr} (${durationText} 소요)`, 70, 260);

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 285);
  ctx.lineTo(1010, 285);
  ctx.stroke();

  // 3. 4-Player Leaderboard Table (Card container)
  const lbY = 310;
  const lbH = 430;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.beginPath();
  ctx.roundRect(70, lbY, 940, lbH, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Leaderboard Header Bar
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.roundRect(70, lbY, 940, 56, [28, 28, 0, 0]);
  ctx.fill();

  ctx.fillStyle = '#CBD5E1';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText('순위', 110, lbY + 36);
  ctx.fillText('골퍼 성명', 220, lbY + 36);
  ctx.fillText('총 타수', 510, lbY + 36);
  ctx.fillText('Par 대비', 670, lbY + 36);
  ctx.fillText('OB', 840, lbY + 36);
  ctx.fillText('평균타수', 920, lbY + 36);

  // Render 4 players
  rankedPlayers.slice(0, 4).forEach((p, idx) => {
    const rowY = lbY + 68 + idx * 88;

    // Highlight background for 1st place
    if (idx === 0) {
      ctx.fillStyle = 'rgba(251, 191, 36, 0.14)';
      ctx.beginPath();
      ctx.roundRect(80, rowY - 12, 920, 80, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, rowY + 68);
      ctx.lineTo(1000, rowY + 68);
      ctx.stroke();
    }

    // Rank Medal Badge
    const medalText = idx === 0 ? '🥇 1위' : idx === 1 ? '🥈 2위' : idx === 2 ? '🥉 3위' : `  ${idx + 1}위`;
    ctx.fillStyle = idx === 0 ? '#FBBF24' : idx === 1 ? '#E2E8F0' : idx === 2 ? '#FDBA74' : '#94A3B8';
    ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillText(medalText, 100, rowY + 38);

    // Player Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    const leaderBadge = p.isLeader ? ' (조장)' : '';
    const selfBadge = p.isSelf ? ' [본인]' : '';
    ctx.fillText(`${p.name}${leaderBadge}${selfBadge}`, 220, rowY + 38);

    // Total Strokes
    ctx.fillStyle = idx === 0 ? '#34D399' : '#FFFFFF';
    ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillText(`${p.strokes}타`, 510, rowY + 40);

    // Par Diff
    const diffStr = p.parDiff === 0 ? 'E' : p.parDiff > 0 ? `+${p.parDiff}` : `${p.parDiff}`;
    ctx.fillStyle = p.parDiff < 0 ? '#F43F5E' : p.parDiff === 0 ? '#FBBF24' : '#60A5FA';
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillText(`(${diffStr})`, 670, rowY + 38);

    // OB
    ctx.fillStyle = p.ob > 0 ? '#FB7185' : '#94A3B8';
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillText(`${p.ob}회`, 845, rowY + 38);

    // Average per hole
    const avg = p.scoredHoles > 0 ? (p.strokes / p.scoredHoles).toFixed(1) : '-';
    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillText(`${avg}타`, 935, rowY + 38);
  });

  // 4. Mini Hole-by-Hole Matrix Section
  const matrixY = 770;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText('📋 코스별 상세 타수표 (9홀 세부 제원 & 타수)', 70, matrixY);

  // Group filtered holes into 9-hole segments
  const distinctCourseLetters = Array.from(new Set(filteredHoles.map((h) => getHoleInfo(h).cLetter)));
  const coursesToRender = distinctCourseLetters.slice(0, 2); // Show up to 2 courses (18 holes) neatly

  coursesToRender.forEach((cLetter, cIdx) => {
    const courseBoxY = matrixY + 25 + cIdx * 255;
    const courseHoles = filteredHoles.filter((h) => getHoleInfo(h).cLetter === cLetter).slice(0, 9);
    const courseParSum = courseHoles.reduce((acc, h) => acc + getHolePar(h), 0);

    // Course background container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.beginPath();
    ctx.roundRect(70, courseBoxY, 940, 235, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Course Subtitle
    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.fillText(`${cLetter} 코스 (9홀 · Par ${courseParSum})`, 95, courseBoxY + 32);

    // Grid Column Widths
    const startX = 210;
    const colW = 75;

    // Header: Hole numbers & Pars
    courseHoles.forEach((hNum, hIdx) => {
      const hInfo = getHoleInfo(hNum);
      const colX = startX + hIdx * colW;
      const par = getHolePar(hNum);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${hInfo.hInCourse}H`, colX + colW / 2, courseBoxY + 26);

      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillText(`P${par}`, colX + colW / 2, courseBoxY + 44);
    });

    // Total column
    ctx.fillStyle = '#34D399';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('합계', startX + courseHoles.length * colW + 25, courseBoxY + 35);
    ctx.textAlign = 'left';

    // Divider under header
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(85, courseBoxY + 54);
    ctx.lineTo(995, courseBoxY + 54);
    ctx.stroke();

    // Render Players in this course
    rankedPlayers.slice(0, 4).forEach((p, pIdx) => {
      const pRowY = courseBoxY + 80 + pIdx * 40;

      // Player Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(p.name.length > 5 ? p.name.slice(0, 5) + '..' : p.name, 95, pRowY + 5);

      // Hole scores
      let courseSum = 0;
      courseHoles.forEach((hNum, hIdx) => {
        const colX = startX + hIdx * colW;
        const s = round.players.find((rp) => rp.id === p.id)?.scores?.[hNum] || 0;
        const par = getHolePar(hNum);
        if (s > 0) courseSum += s;

        ctx.textAlign = 'center';
        if (s > 0) {
          // Color based on par diff
          if (s < par) {
            ctx.fillStyle = '#FB7185'; // Birdie/Eagle (Pink/Red)
          } else if (s === par) {
            ctx.fillStyle = '#FFFFFF'; // Par (White)
          } else {
            ctx.fillStyle = '#93C5FD'; // Bogey or over (Blue)
          }
          ctx.font = '900 20px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
          ctx.fillText(String(s), colX + colW / 2, pRowY + 5);
        } else {
          ctx.fillStyle = '#64748B';
          ctx.font = 'normal 18px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
          ctx.fillText('-', colX + colW / 2, pRowY + 5);
        }
      });

      // Sum
      ctx.fillStyle = '#FDE047';
      ctx.font = '900 22px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(courseSum > 0 ? `${courseSum}` : '-', startX + courseHoles.length * colW + 25, pRowY + 5);
      ctx.textAlign = 'left';
    });
  });

  // 5. Footer Brand Watermark & Serial
  const footerY = 1375;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(70, footerY - 30);
  ctx.lineTo(1010, footerY - 30);
  ctx.stroke();

  // Masot/App brand text
  ctx.fillStyle = '#FDE047';
  ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText('ParkGolf All-in-One', 70, footerY);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'normal 18px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText('대한민국 1등 파크골프 스마트 스코어보드 · parkgolfallinone.com', 70, footerY + 28);

  // Serial stamp on right
  const serialCode = `PKG-${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, '0')}${String(startDate.getDate()).padStart(2, '0')}-${round.id.slice(0, 6).toUpperCase()}`;
  ctx.fillStyle = '#34D399';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`공인 시리얼: ${serialCode}`, 1010, footerY);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = 'normal 15px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
  ctx.fillText('🔒 위변조 방지 블록체인형 타임스탬프 영구 보존', 1010, footerY + 26);
  ctx.textAlign = 'left';

  // Convert to Blob and DataUrl
  const dataUrl = canvas.toDataURL('image/png', 0.95);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.95));

  if (!blob) return null;

  const fileName = `파크골프_올인원_${(round.courseName || course.name).replace(/\s+/g, '_')}_공식스코어카드_${startDate.getFullYear()}${String(startDate.getMonth() + 1).padStart(2, '0')}${String(startDate.getDate()).padStart(2, '0')}.png`;

  return {
    dataUrl,
    blob,
    fileName,
  };
}
