'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Camera,
  Undo2,
  Trash2,
  Mic,
  MicOff,
  Lock,
  Building2,
  Save,
  Sparkles,
  Check,
  Image as ImageIcon,
} from 'lucide-react';
import {
  YardageBookStorage,
  YardageHoleNote,
  YardageHoleShape,
  YardageStamp,
  YardageStroke,
  buildYardageNoteId,
} from '@/lib/yardageBookStorage';

export interface YardageBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  courseLetter: string;
  holeInCourse: number;
  holeNumber: number;
  par: 3 | 4 | 5;
  officialDistance: number;
  onSaved?: (note: YardageHoleNote) => void;
  availableCourses?: string[];
  savedHoleIds?: Set<string>;
  onSelectHole?: (courseLetter: string, holeInCourse: number) => void;
  onPrevHole?: () => void;
  onNextHole?: () => void;
}

const AIMING_PRESETS = [
  { id: '깃대', label: '🚩 깃대' },
  { id: '중앙', label: '🎯 중앙' },
  { id: '우측 공략', label: '↗️ 우측 공략' },
  { id: '좌측 공략', label: '↙️ 좌측 공략' },
];

const TARGET_SCORE_PRESETS: YardageHoleNote['targetScore'][] = [
  '버디 도전',
  '파 세이브(3~4타)',
  '안전 운영',
];

const STAMP_TOOLS: {
  type: YardageStamp['type'];
  label: string;
  short: string;
  badgeColor: string;
}[] = [
  { type: 'OB', label: '⚠️ OB구역', short: '⚠️ OB', badgeColor: '#DC2626' },
  { type: 'TEE_TARGET', label: '🎯 목표티샷위치', short: '🎯 목표티샷', badgeColor: '#0284C7' },
  { type: 'PUTT_SPOT', label: '⛳ 퍼팅최적위치', short: '⛳ 퍼팅최적', badgeColor: '#7C3AED' },
];

const LEGACY_STAMP_META: Record<string, { short: string; badgeColor: string }> = {
  BUNKER: { short: '🏜️ 벙커', badgeColor: '#D97706' },
  SLOPE_LEFT: { short: '↘️ 좌경사', badgeColor: '#2563EB' },
  SLOPE_RIGHT: { short: '↙️ 우경사', badgeColor: '#7C3AED' },
};

const HOLE_SHAPE_OPTIONS: { value: YardageHoleShape; label: string }[] = [
  { value: 'STRAIGHT', label: '⬆️ 직선' },
  { value: 'DOGLEG_LEFT', label: '↩️ 좌도그렉' },
  { value: 'DOGLEG_RIGHT', label: '↪️ 우도그렉' },
];

function drawBaseCourseDiagram(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  holeShape: YardageHoleShape = 'STRAIGHT',
  backSpace: YardageHoleNote['backSpace'] = '여유',
  sideSpace: YardageHoleNote['sideSpace'] = '여유',
  targetDistance: number = 60,
  targetScore: YardageHoleNote['targetScore'] = '파 세이브(3~4타)',
  greenAngle: number = 0
) {
  // Background grass
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#065f46');
  bg.addColorStop(0.5, '#047857');
  bg.addColorStop(1, '#064e3b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Fairway shape (straight or dogleg)
  const isLeftDogleg = holeShape === 'DOGLEG_LEFT';
  const isRightDogleg = holeShape === 'DOGLEG_RIGHT';
  const teeCenterX = isLeftDogleg ? w * 0.65 : isRightDogleg ? w * 0.35 : w / 2;
  const greenCx = isLeftDogleg ? w * 0.23 : isRightDogleg ? w * 0.77 : w / 2;
  const greenCy = isLeftDogleg || isRightDogleg ? h * 0.23 : h * 0.19;

  if (holeShape === 'STRAIGHT') {
    ctx.fillStyle = 'rgba(52, 211, 153, 0.22)';
    ctx.beginPath();
    ctx.roundRect(w * 0.2, h * 0.08, w * 0.6, h * 0.82, 36);
    ctx.fill();
  } else {
    ctx.save();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.24)';
    ctx.lineWidth = w * 0.3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(teeCenterX, h * 0.84);
    ctx.quadraticCurveTo(teeCenterX, h * 0.36, greenCx, greenCy);
    ctx.stroke();
    ctx.restore();
  }

  // Large '안전' indicator in the middle of the fairway when '안전 운영' is selected
  if (targetScore === '안전 운영') {
    const safeX = isLeftDogleg ? w * 0.545 : isRightDogleg ? w * 0.455 : w * 0.5;
    const safeY = isLeftDogleg || isRightDogleg ? h * 0.45 : h * 0.53;
    ctx.save();
    ctx.fillStyle = 'rgba(250, 204, 21, 0.24)';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.ellipse(safeX, safeY, 44, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '900 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.strokeText('욕심', safeX, safeY - 9);
    ctx.strokeText('금지', safeX, safeY + 10);
    ctx.fillStyle = '#DC2626';
    ctx.fillText('욕심', safeX, safeY - 9);
    ctx.fillText('금지', safeX, safeY + 10);
    ctx.restore();
  }

  // Grid lines across fairway (yardage reference lines)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  for (let gx = 1; gx <= 5; gx++) {
    const x = (w / 6) * gx;
    ctx.beginPath();
    ctx.moveTo(x, 10);
    ctx.lineTo(x, h - 10);
    ctx.stroke();
  }
  for (let gy = 1; gy <= 6; gy++) {
    const y = (h / 7) * gy;
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(w - 10, y);
    ctx.stroke();
  }

  // Top 2-ring Green (always a true circle, with optional approach rotation angle)
  const greenR = holeShape === 'STRAIGHT' ? h * 0.15 : h * 0.135;
  const greenRx = greenR;
  const greenRy = greenR;
  const greenRad = (greenAngle * Math.PI) / 180;
  ctx.fillStyle = 'rgba(110, 231, 183, 0.45)';
  ctx.beginPath();
  ctx.ellipse(greenCx, greenCy, greenRx, greenRy, greenRad, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner putting circle
  ctx.fillStyle = 'rgba(167, 243, 208, 0.5)';
  ctx.beginPath();
  ctx.ellipse(greenCx, greenCy, greenRx * 0.54, greenRy * 0.54, greenRad, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Red warning lines around green when backSpace/sideSpace is tight/none
  if (backSpace === '없음(위험)') {
    ctx.save();
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.75)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(greenCx, greenCy, greenRx + 7, greenRy + 7, greenRad, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.restore();
  }
  if (sideSpace === '좁음') {
    ctx.save();
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(239, 68, 68, 0.75)';
    ctx.shadowBlur = 6;
    // Left side warning line
    ctx.beginPath();
    ctx.ellipse(greenCx, greenCy, greenRx + 7, greenRy + 7, greenRad, Math.PI * 0.72, Math.PI * 1.28);
    ctx.stroke();
    // Right side warning line
    ctx.beginPath();
    ctx.ellipse(greenCx, greenCy, greenRx + 7, greenRy + 7, greenRad, -Math.PI * 0.28, Math.PI * 0.28);
    ctx.stroke();
    ctx.restore();
  }

  // Flag pin on green
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(greenCx, greenCy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(greenCx, greenCy);
  ctx.lineTo(greenCx, greenCy - 22);
  ctx.stroke();
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.moveTo(greenCx, greenCy - 22);
  ctx.lineTo(greenCx + 15, greenCy - 16);
  ctx.lineTo(greenCx, greenCy - 10);
  ctx.closePath();
  ctx.fill();

  // Bottom Tee Box
  const teeW = w * 0.26;
  const teeH = 26;
  const teeX = teeCenterX - teeW / 2;
  const teeY = h - 38;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(teeX, teeY, teeW, teeH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FEF08A';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TEE BOX', teeCenterX, teeY + 17);

  // Swing size & distance badge next to TEE BOX (white bg, large red text)
  const prefixText = '스윙크기 ';
  const numText = `${targetDistance}m`;
  ctx.font = 'bold 10.5px sans-serif';
  const prefixW = ctx.measureText(prefixText).width;
  ctx.font = '900 18px sans-serif';
  const numW = ctx.measureText(numText).width;
  const badgeW = prefixW + numW + 16;
  const badgeH = 30;
  const badgeY = teeY - 2;
  const badgeX = isLeftDogleg ? teeX - badgeW - 6 : teeX + teeW + 6;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#DC2626';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 10.5px sans-serif';
  ctx.fillText(prefixText, badgeX + 8, badgeY + badgeH / 2 + 1);
  ctx.font = '900 18px sans-serif';
  ctx.fillText(numText, badgeX + 8 + prefixW, badgeY + badgeH / 2 + 1);
  ctx.textBaseline = 'alphabetic';
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (Math.hypot(dx, dy) < 6) return;
  const angle = Math.atan2(dy, dx);
  const headLen = 12;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

export function YardageBookModal({
  isOpen,
  onClose,
  courseId,
  courseName,
  courseLetter,
  holeInCourse,
  holeNumber,
  par,
  officialDistance,
  onSaved,
  availableCourses,
  savedHoleIds,
  onSelectHole,
  onPrevHole,
  onNextHole,
}: YardageBookModalProps) {
  const [targetDistance, setTargetDistance] = useState<number>(officialDistance || 60);
  const [aimingPoint, setAimingPoint] = useState<string>('깃대');
  const [customAiming, setCustomAiming] = useState<string>('');
  const [targetScore, setTargetScore] =
    useState<YardageHoleNote['targetScore']>('파 세이브(3~4타)');

  const [turfType, setTurfType] = useState<YardageHoleNote['turfType']>('천연잔디');
  const [backSpace, setBackSpace] = useState<YardageHoleNote['backSpace']>('여유');
  const [sideSpace, setSideSpace] = useState<YardageHoleNote['sideSpace']>('여유');
  const [greenSpeed, setGreenSpeed] = useState<YardageHoleNote['greenSpeed']>('보통');
  const [fairwayCondition, setFairwayCondition] =
    useState<YardageHoleNote['fairwayCondition']>('양호');
  const [memo, setMemo] = useState<string>('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'CLUB_SHARED'>('PRIVATE');
  const [autoOpenInRound, setAutoOpenInRound] = useState<boolean>(false);
  const [paperNotePhotoUrl, setPaperNotePhotoUrl] = useState<string | undefined>(undefined);

  // Drawing & Stamp states (기본값 'VIEW' = 실수 그리기 방지, [궤적 펜] 눌렀을 때만 1회 그리기 후 자동 해제)
  const [holeShape, setHoleShape] = useState<YardageHoleShape>('STRAIGHT');
  const [greenAngle, setGreenAngle] = useState<number>(0);
  const [activeTool, setActiveTool] = useState<'VIEW' | 'PEN' | YardageStamp['type']>('VIEW');
  const [strokes, setStrokes] = useState<YardageStroke[]>([]);
  const [stamps, setStamps] = useState<YardageStamp[]>([]);
  const [historyStack, setHistoryStack] = useState<('STROKE' | 'STAMP')[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  const initialSwingRef = useRef<number>(60);

  // OCR & Voice STT states
  const [isOcrLoading, setIsOcrLoading] = useState<boolean>(false);
  const [ocrStatusMsg, setOcrStatusMsg] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);
  const [hasExistingNote, setHasExistingNote] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const ocrCameraInputRef = useRef<HTMLInputElement | null>(null);
  const ocrAlbumInputRef = useRef<HTMLInputElement | null>(null);

  // Load existing note when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setSavedFeedback(false);
    setConfirmDelete(false);
    setOcrStatusMsg(null);
    setActiveTool('VIEW');
    scrollBodyRef.current?.scrollTo({ top: 0 });
    setAutoOpenInRound(YardageBookStorage.getAutoOpenInRound());

    const existing = YardageBookStorage.getNote(courseId, courseLetter, holeInCourse);
    if (existing) {
      setHasExistingNote(true);
      const loadedDist = existing.targetDistance ?? (officialDistance || 60);
      initialSwingRef.current = loadedDist;
      setTargetDistance(loadedDist);
      const isPreset = AIMING_PRESETS.some((p) => p.id === existing.aimingPoint);
      setAimingPoint(existing.aimingPoint || '깃대');
      setCustomAiming(isPreset ? '' : existing.aimingPoint || '');
      setTargetScore(existing.targetScore || '파 세이브(3~4타)');
      setTurfType(existing.turfType || '천연잔디');
      setBackSpace(existing.backSpace || '여유');
      setSideSpace(existing.sideSpace || '여유');
      setGreenSpeed(existing.greenSpeed || '보통');
      setFairwayCondition(existing.fairwayCondition || '양호');
      setMemo(existing.memo || '');
      setVisibility(existing.visibility || 'PRIVATE');
      setHoleShape(existing.holeShape || 'STRAIGHT');
      setGreenAngle(typeof existing.greenAngle === 'number' ? existing.greenAngle : 0);
      setPaperNotePhotoUrl(existing.paperNotePhotoUrl);
      setStrokes(Array.isArray(existing.strokes) ? existing.strokes : []);
      setStamps(Array.isArray(existing.stamps) ? existing.stamps : []);
      setHistoryStack([
        ...Array((existing.strokes || []).length).fill('STROKE' as const),
        ...Array((existing.stamps || []).length).fill('STAMP' as const),
      ]);
    } else {
      setHasExistingNote(false);
      const defaultSwing =
        par === 3
          ? officialDistance || 50
          : par === 4
            ? officialDistance > 0
              ? Math.min(officialDistance, 70)
              : 65
            : officialDistance > 0
              ? Math.min(officialDistance, 80)
              : 75;
      initialSwingRef.current = defaultSwing;
      setTargetDistance(defaultSwing);
      setAimingPoint('깃대');
      setCustomAiming('');
      setTargetScore('파 세이브(3~4타)');
      setTurfType('천연잔디');
      setBackSpace('여유');
      setSideSpace('여유');
      setGreenSpeed('보통');
      setFairwayCondition('양호');
      setMemo('');
      setVisibility('PRIVATE');
      setHoleShape('STRAIGHT');
      setGreenAngle(0);
      setPaperNotePhotoUrl(undefined);
      setStrokes([]);
      setStamps([]);
      setHistoryStack([]);
    }
  }, [isOpen, courseId, courseLetter, holeInCourse, officialDistance]);

  const redrawCanvas = useCallback(
    (
      nextStrokes: YardageStroke[] = strokes,
      nextStamps: YardageStamp[] = stamps,
      livePoints?: { x: number; y: number }[]
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      drawBaseCourseDiagram(ctx, w, h, holeShape, backSpace, sideSpace, targetDistance, targetScore, greenAngle);

      // Draw saved strokes + optional live stroke
      const allStrokes = livePoints && livePoints.length > 0
        ? [...nextStrokes, { points: livePoints, color: '#EF4444' }]
        : nextStrokes;

      allStrokes.forEach((st) => {
        if (!st.points || st.points.length < 1) return;
        ctx.save();
        ctx.strokeStyle = st.color || '#EF4444';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(st.points[0].x * w, st.points[0].y * h);
        for (let i = 1; i < st.points.length; i++) {
          ctx.lineTo(st.points[i].x * w, st.points[i].y * h);
        }
        ctx.stroke();

        // Draw directional arrow head at the end
        if (st.points.length >= 2) {
          const prev = st.points[Math.max(0, st.points.length - 4)];
          const last = st.points[st.points.length - 1];
          drawArrowHead(ctx, prev.x * w, prev.y * h, last.x * w, last.y * h);
        }
        ctx.restore();
      });

      // Draw stamps
      nextStamps.forEach((sp) => {
        const meta = STAMP_TOOLS.find((t) => t.type === sp.type) || LEGACY_STAMP_META[sp.type];
        if (!meta) return;
        const px = sp.x * w;
        const py = sp.y * h;
        ctx.save();
        if (sp.type === 'PUTT_SPOT') {
          // Icon-only circular marker for PUTT_SPOT (no text inside)
          ctx.fillStyle = meta.badgeColor;
          ctx.beginPath();
          ctx.arc(px, py, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⛳', px, py + 1);
          ctx.restore();
          return;
        }
        ctx.font = 'bold 12px sans-serif';
        const label = meta.short;
        const textW = ctx.measureText(label).width;
        const boxW = textW + 14;
        const boxH = 24;
        ctx.fillStyle = meta.badgeColor;
        ctx.beginPath();
        ctx.roundRect(px - boxW / 2, py - boxH / 2, boxW, boxH, 12);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, px, py + 1);
        ctx.restore();
      });
    },
    [strokes, stamps, holeShape, backSpace, sideSpace, targetDistance, targetScore, greenAngle]
  );

  useEffect(() => {
    if (isOpen) {
      redrawCanvas(strokes, stamps);
    }
  }, [isOpen, strokes, stamps, holeShape, backSpace, sideSpace, targetDistance, targetScore, greenAngle, redrawCanvas]);

  const getNormalizedCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0.5, y: 0.5 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0.02, Math.min(0.98, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeTool === 'VIEW') return;
    e.preventDefault();
    const pt = getNormalizedCoords(e);

    if (activeTool !== 'PEN') {
      const newStamp: YardageStamp = {
        id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: activeTool,
        x: pt.x,
        y: pt.y,
      };
      const nextStamps = [...stamps, newStamp];
      setStamps(nextStamps);
      setHistoryStack((prev) => [...prev, 'STAMP']);
      setActiveTool('VIEW'); // 스탬프도 1회 배치 후 자동 잠금
      return;
    }

    isDrawingRef.current = true;
    currentStrokeRef.current = [pt];
    e.currentTarget.setPointerCapture?.(e.pointerId);
    redrawCanvas(strokes, stamps, currentStrokeRef.current);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeTool !== 'PEN') return;
    e.preventDefault();
    const pt = getNormalizedCoords(e);
    currentStrokeRef.current.push(pt);
    redrawCanvas(strokes, stamps, currentStrokeRef.current);
  };

  const handleCanvasPointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const pts = currentStrokeRef.current;
    currentStrokeRef.current = [];
    if (pts.length >= 2) {
      const nextStrokes = [...strokes, { points: pts, color: '#EF4444' }];
      setStrokes(nextStrokes);
      setHistoryStack((prev) => [...prev, 'STROKE']);
      setActiveTool('VIEW'); // 🌟 [대표님 지시]: 궤적 펜 1회 그리기 완료 후 즉시 잠금('VIEW')으로 복귀!
    }
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const last = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    if (last === 'STROKE' && strokes.length > 0) {
      setStrokes((prev) => prev.slice(0, -1));
    } else if (last === 'STAMP' && stamps.length > 0) {
      setStamps((prev) => prev.slice(0, -1));
    }
  };

  const handleClearCanvas = () => {
    setStrokes([]);
    setStamps([]);
    setHistoryStack([]);
  };

  const handlePaperNoteUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (e.target) e.target.value = '';

    setIsOcrLoading(true);
    setOcrStatusMsg('✨ AI가 손글씨 공략 노트를 판독 중입니다...');

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setPaperNotePhotoUrl(dataUrl);
      try {
        const res = await fetch('/api/yardage/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: dataUrl,
            officialDistance,
            courseName,
            holeLabel: `${courseLetter}-${holeInCourse}`,
          }),
        });
        const data = await res.json();
        if (data?.success && data.parsed) {
          const p = data.parsed;
          if (p.targetDistance) setTargetDistance(Number(p.targetDistance));
          if (p.aimingPoint) {
            const isPreset = AIMING_PRESETS.some((ap) => ap.id === p.aimingPoint);
            setAimingPoint(p.aimingPoint);
            setCustomAiming(isPreset ? '' : p.aimingPoint);
          }
          if (p.targetScore) setTargetScore(p.targetScore);
          if (p.turfType) setTurfType(p.turfType);
          if (p.backSpace) setBackSpace(p.backSpace);
          if (p.sideSpace) setSideSpace(p.sideSpace);
          if (p.greenSpeed) setGreenSpeed(p.greenSpeed);
          if (p.fairwayCondition) setFairwayCondition(p.fairwayCondition);
          if (p.memo) setMemo(p.memo);
          setOcrStatusMsg('✅ 종이 공략 노트 AI 자동 변환 완료! (원본 사진 첨부됨)');
        } else {
          setOcrStatusMsg('⚠️ 자동 판독에 실패하여 원본 사진만 첨부했습니다.');
        }
      } catch {
        setOcrStatusMsg('⚠️ 네트워크 오류로 원본 사진만 첨부했습니다.');
      } finally {
        setIsOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('이 브라우저에서는 음성 인식을 지원하지 않습니다. 직접 입력해 주세요.');
      return;
    }
    if (isListening) {
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setMemo((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    recognition.start();
  };

  const persistCurrentNote = () => {
    const drawingDataUrl = canvasRef.current?.toDataURL('image/png') || '';
    const finalAiming = customAiming.trim() ? customAiming.trim() : aimingPoint;
    const note: YardageHoleNote = {
      id: buildYardageNoteId(courseId, courseLetter, holeInCourse),
      courseId,
      courseName,
      courseLetter,
      holeInCourse,
      holeNumber,
      par,
      officialDistance: officialDistance || 60,
      targetDistance,
      aimingPoint: finalAiming,
      targetScore,
      turfType,
      backSpace,
      sideSpace,
      greenSpeed,
      fairwayCondition,
      memo: memo.trim(),
      holeShape,
      greenAngle,
      strokes,
      stamps,
      drawingDataUrl,
      paperNotePhotoUrl,
      visibility,
      updatedAt: new Date().toISOString(),
    };
    YardageBookStorage.saveNote(note);
    setHasExistingNote(true);
    if (onSaved) onSaved(note);
    return note;
  };

  const handleSave = () => {
    persistCurrentNote();
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 550);
  };

  const handleDeleteNote = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    YardageBookStorage.deleteNote(courseId, courseLetter, holeInCourse);
    setHasExistingNote(false);
    setConfirmDelete(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="yardage-book-modal"
      className="fixed inset-0 z-[75] bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
    >
      <div className="bg-white text-stone-900 rounded-3xl w-full max-w-lg max-h-[94vh] flex flex-col shadow-2xl border-2 border-emerald-500 overflow-hidden">
        {/* 상단 헤더 (초슬림 핵심 정보 + 확인 및 닫기) */}
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white flex items-center justify-between gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-yellow-400 text-stone-950 text-xs sm:text-sm font-black shadow-xs truncate">
            {courseLetter}-{holeInCourse}홀 · Par {par} · 공식 {officialDistance || 60}m
          </span>
          <button
            type="button"
            data-testid="btn-yardage-header-confirm-close"
            onClick={() => {
              const isModified =
                hasExistingNote ||
                strokes.length > 0 ||
                stamps.length > 0 ||
                memo.trim() !== '' ||
                holeShape !== 'STRAIGHT' ||
                greenAngle !== 0 ||
                backSpace !== '여유' ||
                sideSpace !== '여유' ||
                aimingPoint !== '깃대' ||
                customAiming.trim() !== '' ||
                targetScore !== '파 세이브(3~4타)' ||
                targetDistance !== initialSwingRef.current ||
                Boolean(paperNotePhotoUrl);
              if (isModified) {
                persistCurrentNote();
              }
              onClose();
            }}
            aria-label="확인 및 닫기"
            className="px-3.5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs sm:text-sm shadow-lg border-2 border-yellow-200 flex items-center gap-1 cursor-pointer active:scale-95 transition shrink-0"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>확인 및 닫기</span>
          </button>
        </div>

        {/* 비게임 연속 편집용 코스 & 홀 퀵 점프 네비게이션 */}
        {availableCourses && availableCourses.length > 0 && onSelectHole && (
          <div className="px-3 py-2 bg-emerald-950/95 border-b border-emerald-800 shrink-0 space-y-1.5" data-testid="yardage-continuous-nav">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {availableCourses.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  data-testid={`yardage-nav-course-${letter}`}
                  onClick={() => {
                    persistCurrentNote();
                    onSelectHole(letter, 1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 cursor-pointer transition ${
                    courseLetter === letter
                      ? 'bg-amber-400 text-stone-950 shadow-xs'
                      : 'bg-emerald-900/70 text-emerald-200 hover:bg-emerald-800'
                  }`}
                >
                  {letter}코스
                </button>
              ))}
            </div>
            <div className="grid grid-cols-9 gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hNum) => {
                const noteId = buildYardageNoteId(courseId, courseLetter, hNum);
                const isSaved = savedHoleIds ? savedHoleIds.has(noteId) : YardageBookStorage.hasNote(courseId, courseLetter, hNum);
                const isCurrent = holeInCourse === hNum;
                return (
                  <button
                    key={hNum}
                    type="button"
                    data-testid={`yardage-nav-hole-${hNum}`}
                    onClick={() => {
                      persistCurrentNote();
                      onSelectHole(courseLetter, hNum);
                    }}
                    className={`relative py-1 rounded-lg text-[11px] font-black cursor-pointer transition ${
                      isCurrent
                        ? 'bg-white text-emerald-950 ring-2 ring-amber-400'
                        : isSaved
                          ? 'bg-emerald-700/80 text-white hover:bg-emerald-600'
                          : 'bg-emerald-900/50 text-emerald-200 hover:bg-emerald-800'
                    }`}
                  >
                    {hNum}
                    {isSaved && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 border border-emerald-950" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 스크롤 본문 */}
        <div ref={scrollBodyRef} className="p-3.5 sm:p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* ② 중앙 인터랙티브 코스 도면 (손가락 드로잉 & 스탬프) */}
          <div className="bg-stone-900 text-white rounded-2xl p-3 space-y-2 border border-stone-700">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-amber-300">
                ✏️ 공략 도면
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  data-testid="btn-yardage-undo"
                  onClick={handleUndo}
                  className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-stone-600"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>되돌리기</span>
                </button>
                <button
                  type="button"
                  data-testid="btn-yardage-clear-canvas"
                  onClick={handleClearCanvas}
                  className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-rose-900/60 text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-stone-600"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>초기화</span>
                </button>
              </div>
            </div>

            {/* 펜 & 스탬프 도구 바 */}
            <div className="flex items-center flex-wrap gap-1">
              <button
                type="button"
                data-testid="tool-yardage-pen"
                onClick={() => setActiveTool(activeTool === 'PEN' ? 'VIEW' : 'PEN')}
                className={`px-2 py-1.5 rounded-xl text-[10.5px] font-black shrink-0 cursor-pointer border transition ${
                  activeTool === 'PEN'
                    ? 'bg-rose-600 text-white border-rose-400 shadow-sm ring-2 ring-rose-300/60'
                    : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                }`}
              >
                {activeTool === 'PEN' ? '🖍️ 그리기 대기중 (1회)' : '🖍️ 궤적 펜'}
              </button>
              {STAMP_TOOLS.map((st) => (
                <button
                  key={st.type}
                  type="button"
                  data-testid={`tool-yardage-stamp-${st.type}`}
                  onClick={() => setActiveTool(activeTool === st.type ? 'VIEW' : st.type)}
                  className={`px-2 py-1.5 rounded-xl text-[10.5px] font-black shrink-0 cursor-pointer border transition ${
                    activeTool === st.type
                      ? 'bg-amber-400 text-stone-950 border-yellow-200 shadow-sm'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* 좌편: 🏆 목표 전략 + 우편: HTML5 Canvas 그린·코스 도면 */}
            <div className="flex items-stretch gap-2">
              <div
                data-testid="yardage-target-score-left"
                className="w-[64px] sm:w-[72px] shrink-0 bg-stone-800/90 border border-stone-700 rounded-xl p-1.5 flex flex-col justify-between gap-1.5"
              >
                <div className="text-[10.5px] font-black text-amber-300 text-center leading-tight pt-0.5">
                  🏆 목표
                </div>
                <div className="flex-1 flex flex-col justify-center gap-1.5">
                  {TARGET_SCORE_PRESETS.map((ts) => (
                    <button
                      key={ts}
                      type="button"
                      onClick={() => setTargetScore(ts)}
                      className={`w-full px-1 rounded-lg text-xs font-black border cursor-pointer transition text-center ${
                        ts === '안전 운영' ? 'py-1.5 leading-[1.12]' : 'py-2.5 leading-none'
                      } ${
                        targetScore === ts
                          ? 'bg-amber-400 text-stone-950 border-yellow-200 shadow-sm'
                          : 'bg-stone-900/80 text-stone-300 border-stone-700 hover:bg-stone-700'
                      }`}
                    >
                      {ts === '버디 도전' ? (
                        '버디'
                      ) : ts === '파 세이브(3~4타)' ? (
                        '파'
                      ) : (
                        <span className="block text-center leading-[1.12]">
                          욕심
                          <br />
                          금지
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-w-0 rounded-xl overflow-hidden border-2 border-emerald-500/70 bg-emerald-950 flex justify-center relative">
                <canvas
                  ref={canvasRef}
                  data-testid="yardage-drawing-canvas"
                  width={380}
                  height={260}
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={handleCanvasPointerUp}
                  onPointerCancel={handleCanvasPointerUp}
                  style={{ touchAction: activeTool === 'VIEW' ? 'pan-y' : 'none' }}
                  className={`w-full h-auto block ${
                    activeTool === 'VIEW' ? 'cursor-default' : 'cursor-crosshair'
                  }`}
                />
              </div>
            </div>

            {/* 홀 형태 선택 (직선 / 좌도그렉 / 우도그렉) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-black text-stone-400 shrink-0">코스 모양</span>
              <div className="grid grid-cols-3 gap-1 flex-1">
                {HOLE_SHAPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    data-testid={`btn-yardage-shape-${opt.value}`}
                    onClick={() => setHoleShape(opt.value)}
                    className={`py-1 px-1.5 rounded-lg text-[11px] font-black border cursor-pointer transition ${
                      holeShape === opt.value
                        ? 'bg-emerald-500 text-stone-950 border-emerald-300 shadow-xs'
                        : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 어프로치 그린 둘레 각도 조정 (10도 단위 무제한 + / -) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-black text-stone-400 shrink-0">그린 각도</span>
              <div className="flex items-center gap-1 flex-1">
                <button
                  type="button"
                  data-testid="btn-yardage-green-angle-minus10"
                  onClick={() => setGreenAngle((a) => a - 10)}
                  className="flex-1 py-1 px-2 rounded-lg text-[11px] font-black border bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700 cursor-pointer active:scale-95 transition"
                >
                  ↺ -10°
                </button>
                <button
                  type="button"
                  data-testid="yardage-green-angle-value"
                  onClick={() => setGreenAngle(0)}
                  title="누르면 0°로 초기화"
                  className="min-w-[64px] py-1 px-2 rounded-lg text-[11px] font-black border bg-amber-400 text-stone-950 border-yellow-200 text-center cursor-pointer"
                >
                  {greenAngle > 0 ? `+${greenAngle}°` : `${greenAngle}°`}
                </button>
                <button
                  type="button"
                  data-testid="btn-yardage-green-angle-plus10"
                  onClick={() => setGreenAngle((a) => a + 10)}
                  className="flex-1 py-1 px-2 rounded-lg text-[11px] font-black border bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700 cursor-pointer active:scale-95 transition"
                >
                  ↻ +10°
                </button>
              </div>
            </div>
          </div>

          {/* ① 상단 제원 및 에이밍 설정 */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2.5">
            {/* 최적 티샷스윙 크기 (1m / 10m 단위 조절) */}
            <div className="space-y-1.5">
              <div className="text-xs font-black text-stone-800">🏌️ 최적 티샷스윙 크기</div>
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  data-testid="btn-yardage-dist-minus10"
                  onClick={() => setTargetDistance((d) => Math.max(10, d - 10))}
                  className="px-2 py-1.5 rounded-xl bg-white hover:bg-stone-200 border border-stone-300 font-black text-[11px] cursor-pointer active:scale-95 shrink-0"
                >
                  -10m
                </button>
                <button
                  type="button"
                  data-testid="btn-yardage-dist-minus1"
                  onClick={() => setTargetDistance((d) => Math.max(10, d - 1))}
                  className="px-2 py-1.5 rounded-xl bg-white hover:bg-stone-200 border border-stone-300 font-black text-[11px] cursor-pointer active:scale-95 shrink-0"
                >
                  -1m
                </button>
                <div className="flex-1 flex items-center justify-center bg-white border-2 border-rose-500 rounded-xl px-2 py-1 min-w-[76px]">
                  <input
                    type="number"
                    data-testid="input-yardage-target-dist"
                    value={targetDistance}
                    onChange={(e) => setTargetDistance(Math.max(10, Number(e.target.value) || 0))}
                    className="w-16 text-center font-black text-2xl text-rose-600 outline-none leading-none"
                  />
                  <span className="text-sm font-black text-rose-600">m</span>
                </div>
                <button
                  type="button"
                  data-testid="btn-yardage-dist-plus1"
                  onClick={() => setTargetDistance((d) => Math.min(300, d + 1))}
                  className="px-2 py-1.5 rounded-xl bg-white hover:bg-stone-200 border border-stone-300 font-black text-[11px] cursor-pointer active:scale-95 shrink-0"
                >
                  +1m
                </button>
                <button
                  type="button"
                  data-testid="btn-yardage-dist-plus10"
                  onClick={() => setTargetDistance((d) => Math.min(300, d + 10))}
                  className="px-2 py-1.5 rounded-xl bg-white hover:bg-stone-200 border border-stone-300 font-black text-[11px] cursor-pointer active:scale-95 shrink-0"
                >
                  +10m
                </button>
              </div>
            </div>

            {/* 에이밍(조준점) */}
            <div className="space-y-1">
              <div className="text-xs font-black text-stone-800">🎯 에이밍(조준점) 선택</div>
              <div className="grid grid-cols-4 gap-1">
                {AIMING_PRESETS.map((ap) => (
                  <button
                    key={ap.id}
                    type="button"
                    onClick={() => {
                      setAimingPoint(ap.id);
                      setCustomAiming('');
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-black border cursor-pointer transition ${
                      aimingPoint === ap.id && !customAiming
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {ap.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customAiming}
                onChange={(e) => setCustomAiming(e.target.value)}
                placeholder="직접 입력 (예: 페어웨이 중앙 소나무)"
                className="w-full px-2.5 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 outline-none focus:border-emerald-600"
              />
            </div>

          </div>

          {/* ② 핵심 공략 및 주의사항 메모 + 음성 입력(STT) */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-stone-800">
                📝 핵심 공략 & 주의사항 메모
              </label>
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer border transition ${
                  isListening
                    ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                    : 'bg-white text-emerald-800 border-emerald-400 hover:bg-emerald-50'
                }`}
              >
                {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                <span>{isListening ? '음성 듣는 중...' : '🎤 음성 입력'}</span>
              </button>
            </div>
            <textarea
              data-testid="textarea-yardage-memo"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              placeholder="예: 그린 앞 좌로 흐름, 4타 위주로 부드럽게 스트로크"
              className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 resize-none"
            />
          </div>

          {/* ③ 환경 체크 */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2.5">
            {/* 그린 종류 */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-stone-800">🌱 그린 종류</span>
              <div className="flex items-center gap-1.5">
                {(['천연잔디', '인조잔디'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    data-testid={`btn-yardage-turf-${t}`}
                    onClick={() => setTurfType(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer transition ${
                      turfType === t
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-stone-700 border-stone-300'
                    }`}
                  >
                    {t === '천연잔디' ? '🌱 천연잔디' : '🟩 인조잔디'}
                  </button>
                ))}
              </div>
            </div>

            {/* 그린 주변 여유 공간 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-2 rounded-xl border border-stone-200 space-y-1">
                <div className="text-[11px] font-black text-stone-700">그린 뒤 공간</div>
                <div className="grid grid-cols-2 gap-1">
                  {(['여유', '없음(위험)'] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBackSpace(val)}
                      className={`py-1 px-1 rounded-lg text-[10.5px] font-black border cursor-pointer ${
                        backSpace === val
                          ? val === '여유'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-stone-50 text-stone-600 border-stone-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-stone-200 space-y-1">
                <div className="text-[11px] font-black text-stone-700">그린 좌·우 공간</div>
                <div className="grid grid-cols-2 gap-1">
                  {(['여유', '좁음'] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSideSpace(val)}
                      className={`py-1 px-1 rounded-lg text-[10.5px] font-black border cursor-pointer ${
                        sideSpace === val
                          ? val === '여유'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-amber-500 text-stone-950 border-amber-500'
                          : 'bg-stone-50 text-stone-600 border-stone-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 그린 스피드 & 페어웨이 상태 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-stone-800 shrink-0">⚡ 그린 스피드</span>
                <div className="flex items-center gap-1">
                  {(['빠름(빙판)', '보통', '느림(까끌)'] as const).map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      data-testid={`btn-yardage-speed-${spd}`}
                      onClick={() => setGreenSpeed(spd)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer ${
                        greenSpeed === spd
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      {spd === '빠름(빙판)' ? '❄️ 빠름(빙판)' : spd === '보통' ? '👌 보통' : '🌾 느림'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-stone-800 shrink-0">⛳ 페어웨이</span>
                <div className="flex items-center gap-1">
                  {(['양호', '젖음/질퍽', '맨땅 많음'] as const).map((fw) => (
                    <button
                      key={fw}
                      type="button"
                      onClick={() => setFairwayCondition(fw)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer ${
                        fairwayCondition === fw
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-stone-700 border-stone-300'
                      }`}
                    >
                      {fw}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* 제일 하단: 종이 공략 노트 이미지·사진 자동 변환 & 프라이버시 + 자동 펼치기 */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 space-y-2">
            <input
              ref={ocrCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              data-testid="yardage-ocr-camera-input"
              onChange={handlePaperNoteUpload}
              className="hidden"
            />
            <input
              ref={ocrAlbumInputRef}
              type="file"
              accept="image/*"
              data-testid="yardage-ocr-album-input"
              onChange={handlePaperNoteUpload}
              className="hidden"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-testid="btn-yardage-paper-ocr"
                disabled={isOcrLoading}
                onClick={() => ocrCameraInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-98"
              >
                <Camera className="w-4 h-4 shrink-0" />
                <span>
                  {isOcrLoading ? 'AI 판독 중...' : '📸 종이 공략 노트 찍어서 자동 변환'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => ocrAlbumInputRef.current?.click()}
                disabled={isOcrLoading}
                className="py-2.5 px-2.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
                title="앨범에서 종이 노트 사진 불러오기"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>앨범</span>
              </button>
            </div>

            {ocrStatusMsg && (
              <div
                data-testid="yardage-ocr-status"
                className="text-[11px] font-bold text-emerald-900 bg-white px-2.5 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{ocrStatusMsg}</span>
              </div>
            )}

            {paperNotePhotoUrl && (
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-stone-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={paperNotePhotoUrl}
                  alt="원본 종이 공략 노트"
                  className="w-12 h-12 rounded-lg object-cover border border-stone-300 shrink-0"
                />
                <div className="text-[11px] text-stone-600 font-bold flex-1">
                  원본 종이 공략 노트 첨부됨
                </div>
                <button
                  type="button"
                  onClick={() => setPaperNotePhotoUrl(undefined)}
                  className="text-[10px] font-bold text-rose-600 px-2 py-1 rounded hover:bg-rose-50 cursor-pointer"
                >
                  삭제
                </button>
              </div>
            )}

            {/* 프라이버시 & 자동 펼치기 스위치 */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-200/70 flex-wrap">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  data-testid="btn-yardage-privacy-private"
                  onClick={() => setVisibility('PRIVATE')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer border transition ${
                    visibility === 'PRIVATE'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-300'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>🔒 나만 보기</span>
                </button>
                <button
                  type="button"
                  data-testid="btn-yardage-privacy-club"
                  onClick={() => setVisibility('CLUB_SHARED')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer border transition ${
                    visibility === 'CLUB_SHARED'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-stone-600 border-stone-300'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>🏛️ 우리 클럽 공유</span>
                </button>
              </div>

              <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  data-testid="toggle-yardage-auto-open"
                  checked={autoOpenInRound}
                  onChange={(e) => {
                    setAutoOpenInRound(e.target.checked);
                    YardageBookStorage.setAutoOpenInRound(e.target.checked);
                  }}
                  className="w-3.5 h-3.5 accent-emerald-700 cursor-pointer"
                />
                <span>저장된 홀 진입 시 자동 펼치기</span>
              </label>
            </div>
          </div>

          {/* 스크롤 최하단 저장·삭제 바 (고정 해제하여 도면·입력창 공간 확보) */}
          <div className="pt-1 pb-8 flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 border border-stone-300 font-black text-xs text-stone-700 cursor-pointer shrink-0"
            >
              닫기
            </button>
            <button
              type="button"
              data-testid="btn-delete-yardage-note"
              onClick={handleDeleteNote}
              className={`px-3 py-3 rounded-2xl font-black text-xs border flex items-center gap-1 cursor-pointer shrink-0 transition ${
                confirmDelete
                  ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmDelete ? '정말 삭제?' : '삭제'}</span>
            </button>
            <button
              type="button"
              data-testid="btn-save-yardage-note"
              onClick={handleSave}
              className="flex-1 py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg border border-emerald-400 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition"
            >
              {savedFeedback ? (
                <>
                  <Check className="w-4 h-4 text-yellow-300 stroke-[3]" />
                  <span>✅ 저장 완료!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-yellow-300" />
                  <span>💾 공략집 저장하기</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
