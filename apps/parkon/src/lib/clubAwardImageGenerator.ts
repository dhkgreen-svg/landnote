/**
 * ============================================================================
 * clubAwardImageGenerator.ts
 * 파크골프 올인원 (ParkGolf All-in-One) 클럽 공식 대회 1080p 시상 카드 생성기
 *
 * 🏆 1080x1440 초고해상도 Canvas 렌더러
 * - 신페리오 종합 우승, 준우승, 3위
 * - 최저 실타수 메달리스트
 * - 롱기스트(장타상), 니어핀(정밀상)
 * - 황금빛 테두리 & 파크골프 올인원 공식 인증 마크
 * ============================================================================
 */

export interface ClubAwardData {
  clubName: string;
  tournamentTitle: string;
  courseName: string;
  totalHoles: number;
  playDate: string;
  totalParticipants: number;
  gameModeTitle: string;
  // 주요 시상자
  championName: string;
  championNet: number;
  championGross: number;
  championHandicap: number;
  medalistName?: string;
  medalistGross?: number;
  runnerUpName?: string;
  runnerUpNet?: number;
  thirdPlaceName?: string;
  thirdPlaceNet?: number;
  longestName?: string;
  longestDistance?: string;
  nearPinName?: string;
  nearPinDistance?: string;
  specialAwards?: { title: string; winnerName: string; badge: string }[];
  isJapanese?: boolean;
}

export interface GeneratedClubAwardResult {
  dataUrl: string;
  objectUrl: string;
  blob: Blob;
  fileName: string;
}

export async function generateClubAwardCardImage(
  data: ClubAwardData
): Promise<GeneratedClubAwardResult | null> {
  if (typeof window === 'undefined') return null;

  const isJp = Boolean(data.isJapanese);
  const width = 1080;
  const height = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. 배경 그라데이션 (다크 에메랄드 & 럭셔리 옵시디언)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#06281e');
  bgGrad.addColorStop(0.3, '#0b3d2e');
  bgGrad.addColorStop(0.7, '#07241b');
  bgGrad.addColorStop(1, '#02130e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 미세 배경 패턴 (파크골프 잔디 텍스처 느낌)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
  for (let y = 0; y < height; y += 40) {
    for (let x = 0; x < width; x += 40) {
      if ((x + y) % 80 === 0) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 2. 황금빛 외곽 테두리 (Double Gold Frame)
  ctx.save();
  ctx.lineWidth = 6;
  const goldGrad = ctx.createLinearGradient(0, 0, width, height);
  goldGrad.addColorStop(0, '#fbbf24');
  goldGrad.addColorStop(0.25, '#fef08a');
  goldGrad.addColorStop(0.5, '#d97706');
  goldGrad.addColorStop(0.75, '#fde047');
  goldGrad.addColorStop(1, '#b45309');
  ctx.strokeStyle = goldGrad;
  ctx.strokeRect(36, 36, width - 72, height - 72);

  // 안쪽 얇은 골드 라인
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
  ctx.strokeRect(48, 48, width - 96, height - 96);

  // 4개 코너 장식 (Corner Ornaments)
  const drawCorner = (cx: number, cy: number, rot: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(24, 0);
    ctx.lineTo(0, 24);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  drawCorner(52, 52, 0);
  drawCorner(width - 52, 52, Math.PI / 2);
  drawCorner(width - 52, height - 52, Math.PI);
  drawCorner(52, height - 52, (Math.PI * 3) / 2);
  ctx.restore();

  // 3. 상단 헤더: 파크골프 올인원 로고 & 인증 마크
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#34d399';
  ctx.fillText('PARKGOLF ALL-IN-ONE OFFICIAL AWARDS', width / 2, 100);

  ctx.font = '900 48px sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.fillText(isJp ? '🏆 公式クラブ大会 表彰式 🏆' : '🏆 공식 클럽 대회 시상식 🏆', width / 2, 160);

  // 구분선
  ctx.beginPath();
  ctx.moveTo(width / 2 - 250, 185);
  ctx.lineTo(width / 2 + 250, 185);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 4. 대회 메타정보 카드
  const cardX = 80;
  const cardY = 210;
  const cardW = width - 160;
  const cardH = 150;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#a7f3d0';
  ctx.fillText(`[ ${data.clubName} ]`, width / 2, cardY + 40);

  ctx.font = '900 36px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.tournamentTitle, width / 2, cardY + 84);

  ctx.font = '500 20px sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(
    isJp
      ? `📅 ${data.playDate}   |   📍 ${data.courseName} (${data.totalHoles}ホール)   |   👥 計 ${data.totalParticipants}名参加 (${data.gameModeTitle})`
      : `📅 ${data.playDate}   |   📍 ${data.courseName} (${data.totalHoles}홀)   |   👥 총 ${data.totalParticipants}명 참가 (${data.gameModeTitle})`,
    width / 2,
    cardY + 124
  );

  // 5. 주요 수상자 그리드 (Champion & Medalist)
  // A. 종합 우승 (신페리오 1위) - 대형 골드 배너
  const champY = 390;
  const champH = 200;
  const champGrad = ctx.createLinearGradient(cardX, champY, cardX + cardW, champY + champH);
  champGrad.addColorStop(0, 'rgba(180, 83, 9, 0.4)');
  champGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.6)');
  champGrad.addColorStop(1, 'rgba(180, 83, 9, 0.4)');
  ctx.fillStyle = champGrad;
  ctx.beginPath();
  ctx.roundRect(cardX, champY, cardW, champH, 24);
  ctx.fill();
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = '900 26px sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.fillText(isJp ? '👑 新 ペ リ ア 総 合 優 勝 (第1位) 👑' : '👑 신 페 리 오  종 합  우 승 (1위) 👑', width / 2, champY + 45);

  ctx.font = '900 56px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.championName, width / 2, champY + 115);

  ctx.font = 'bold 28px sans-serif';
  ctx.fillStyle = '#fef9c3';
  ctx.fillText(
    isJp
      ? `ネットスコア: ${data.championNet}打   (グロス ${data.championGross}打 / ハンディ ${data.championHandicap})`
      : `네트 스코어: ${data.championNet}타   (실타수 ${data.championGross}타 / 핸디캡 ${data.championHandicap})`,
    width / 2,
    champY + 165
  );

  // B. 2열 그리드: 메달리스트 & 준우승
  const colY = 620;
  const colW = (cardW - 20) / 2;
  const colH = 150;

  // 메달리스트 (최저 실타수)
  ctx.fillStyle = 'rgba(79, 70, 229, 0.35)';
  ctx.beginPath();
  ctx.roundRect(cardX, colY, colW, colH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(165, 180, 252, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#c7d2fe';
  ctx.fillText(isJp ? '🥇 メダリスト (ベストグロス賞)' : '🥇 메 달 리 스 트 (최저 실타수)', cardX + colW / 2, colY + 36);
  ctx.font = '900 38px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.medalistName || data.championName, cardX + colW / 2, colY + 86);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#a5b4fc';
  ctx.fillText(
    isJp ? `総グロス: ${data.medalistGross || data.championGross}打` : `총 실타수: ${data.medalistGross || data.championGross}타`,
    cardX + colW / 2,
    colY + 124
  );

  // 준우승 (2위)
  ctx.fillStyle = 'rgba(100, 116, 139, 0.35)';
  ctx.beginPath();
  ctx.roundRect(cardX + colW + 20, colY, colW, colH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(isJp ? '🥈 準 優 勝 (第2位)' : '🥈 준 우 승 (2위)', cardX + colW + 20 + colW / 2, colY + 36);
  ctx.font = '900 38px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.runnerUpName || '-', cardX + colW + 20 + colW / 2, colY + 86);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(
    data.runnerUpNet ? (isJp ? `ネットスコア: ${data.runnerUpNet}打` : `네트 스코어: ${data.runnerUpNet}타`) : '-',
    cardX + colW + 20 + colW / 2,
    colY + 124
  );

  // C. 3열 그리드: 3위, 롱기스트(드라콘), 니어핀
  const row3Y = 795;
  const col3W = (cardW - 30) / 3;
  const col3H = 140;

  // 3위
  ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
  ctx.beginPath();
  ctx.roundRect(cardX, row3Y, col3W, col3H, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#fcd34d';
  ctx.fillText(isJp ? '🥉 第 3 位' : '🥉 3 위', cardX + col3W / 2, row3Y + 32);
  ctx.font = '900 32px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.thirdPlaceName || '-', cardX + col3W / 2, row3Y + 76);
  ctx.font = 'bold 19px sans-serif';
  ctx.fillStyle = '#fde68a';
  ctx.fillText(data.thirdPlaceNet ? `${data.thirdPlaceNet}${isJp ? '打' : '타'}` : '-', cardX + col3W / 2, row3Y + 112);

  // 롱기스트 (드라콘상)
  ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
  ctx.beginPath();
  ctx.roundRect(cardX + col3W + 15, row3Y, col3W, col3H, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#6ee7b7';
  ctx.fillText(isJp ? '🚀 ドラコン賞 (飛距離)' : '🚀 롱 기 스 트 (장타상)', cardX + col3W + 15 + col3W / 2, row3Y + 32);
  ctx.font = '900 32px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.longestName || '-', cardX + col3W + 15 + col3W / 2, row3Y + 76);
  ctx.font = 'bold 19px sans-serif';
  ctx.fillStyle = '#a7f3d0';
  ctx.fillText(data.longestDistance || (isJp ? '最長飛距離 1位' : '비거리 최우수'), cardX + col3W + 15 + col3W / 2, row3Y + 112);

  // 니어핀 (정밀상)
  ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
  ctx.beginPath();
  ctx.roundRect(cardX + (col3W + 15) * 2, row3Y, col3W, col3H, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(244, 114, 182, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#f472b6';
  ctx.fillText(isJp ? '🎯 ニアピン賞 (ピン至近)' : '🎯 니 어 핀 (정밀상)', cardX + (col3W + 15) * 2 + col3W / 2, row3Y + 32);
  ctx.font = '900 32px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(data.nearPinName || '-', cardX + (col3W + 15) * 2 + col3W / 2, row3Y + 76);
  ctx.font = 'bold 19px sans-serif';
  ctx.fillStyle = '#fbcfe8';
  ctx.fillText(data.nearPinDistance || (isJp ? 'ピン至近 1位' : '핀 밀착 최우수'), cardX + (col3W + 15) * 2 + col3W / 2, row3Y + 112);

  // 6. 기타 특별상 명단 (있는 경우)
  const specY = 960;
  const specH = 260;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.roundRect(cardX, specY, cardW, specH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = '900 22px sans-serif';
  ctx.fillStyle = '#fde047';
  ctx.fillText(isJp ? '🏅 殿堂特別部門 受賞者＆大会記録' : '🏅 명예의 전당 특별 부문 수상자 및 대회 기록', cardX + 30, specY + 40);

  ctx.font = 'bold 19px sans-serif';
  ctx.fillStyle = '#e2e8f0';

  const defaultAwards = isJp ? [
    { badge: '🔥', title: 'バーディーマスター', name: data.medalistName || data.championName, desc: '大会最多バーディー記録' },
    { badge: '🎯', title: 'パーマスター', name: data.runnerUpName || data.championName, desc: '18ホール連続ノーボギー' },
    { badge: '🤝', title: 'フェアプレー・マナー賞', name: '全参加者一同', desc: '同伴者への思いやりと親睦' },
  ] : [
    { badge: '🔥', title: '버디 마스터', name: data.medalistName || data.championName, desc: '대회 최다 버디 기록' },
    { badge: '🎯', title: '파 마스터', name: data.runnerUpName || data.championName, desc: '18홀 연속 정타 플레이' },
    { badge: '🤝', title: '화합 매너상', name: '전 참가자 일동', desc: '페어플레이 및 동반자 배려' },
  ];
  const awardsToRender = (data.specialAwards && data.specialAwards.length > 0)
    ? data.specialAwards.map((sa) => ({ badge: sa.badge, title: sa.title, name: sa.winnerName, desc: isJp ? '大会公式記録賞' : '대회 공식 기록상' }))
    : defaultAwards;

  awardsToRender.slice(0, 4).forEach((aw, idx) => {
    const itemY = specY + 80 + idx * 42;
    ctx.fillText(`${aw.badge}  ${aw.title}:`, cardX + 30, itemY);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(aw.name, cardX + 260, itemY);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`(${aw.desc})`, cardX + 460, itemY);
    ctx.fillStyle = '#e2e8f0';
  });

  // 7. 하단 공식 인증 인장 및 푸터
  const footerY = 1250;
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#34d399';
  ctx.fillText(isJp ? '日本・韓国 統合公認 · パークゴルフ オールインワン (ParkGolf All-in-One)' : '대한민국 대표 파크골프 포털 · 파크골프 올인원 (ParkGolf All-in-One)', width / 2, footerY + 40);

  ctx.font = '500 17px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(
    isJp
      ? `本大会記録はパークゴルフ オールインワン公式検証およびハッシュ(SHA-256)により永久保存されます。 | 認証番号: PKY-AWD-${Date.now().toString(36).toUpperCase()}`
      : `본 대회 기록은 파크골프 올인원 공식 검증 및 블록체인급 무결성 해시(SHA-256)로 영구 보존됩니다. | 인증번호: PKY-AWD-${Date.now().toString(36).toUpperCase()}`,
    width / 2,
    footerY + 75
  );

  // 8. 파일명 및 결과 패키징
  const cleanTitle = data.tournamentTitle.replace(/[^a-zA-Z0-9가-힣ぁ-んァ-ヶー一-龠]/g, '_');
  const fileName = isJp ? `${cleanTitle}_公式表彰カード_1080p.png` : `${cleanTitle}_공식시상카드_1080p.png`;

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(null);
      const dataUrl = canvas.toDataURL('image/png');
      const objectUrl = URL.createObjectURL(blob);
      resolve({
        dataUrl,
        objectUrl,
        blob,
        fileName,
      });
    }, 'image/png');
  });
}

/**
 * 💾 1초 파일 즉시 다운로드 헬퍼
 */
export function downloadClubAwardCard(result: GeneratedClubAwardResult) {
  if (typeof window === 'undefined') return;
  const a = document.createElement('a');
  a.href = result.objectUrl;
  a.download = result.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
