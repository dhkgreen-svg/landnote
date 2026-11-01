'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, Check, Sparkles, RefreshCw } from 'lucide-react';
import { RoundSession, PhotoCardMeta } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';
import { ChroniclePhotoStorage } from '@/lib/chroniclePhotoStorage';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface WatermarkPhotoCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: RoundSession | null;
  currentHoleNumber?: number;
  currentCourseName?: string;
  currentHoleLabel?: string;
  currentHolePar?: number;
  initialImage?: string | null;
  onSaveAndReturn?: (cardDataUrl: string, meta?: PhotoCardMeta) => void;
}

export function WatermarkPhotoCardModal({
  isOpen,
  onClose,
  session,
  currentHoleNumber,
  currentCourseName,
  currentHoleLabel,
  currentHolePar,
  initialImage,
  onSaveAndReturn,
}: WatermarkPhotoCardModalProps) {
  const { isJapanese, isEnglish } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage || null);
  const [photoType, setPhotoType] = useState<'hole_in_one' | 'eagle' | 'regular'>('regular');
  const [achieverName, setAchieverName] = useState<string>('');
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastAutoDetectedHoleRef = useRef<string>('');

  const myName = ParkOnStorage.getUserDisplayName() || '김대희';
  const courseName = (currentCourseName || session?.courseName || '해평파크골프장').trim();

  // Compute clean date string YYYY.MM.DD
  const rawDate = session?.completedAt ? new Date(session.completedAt) : new Date();
  const dateStr = `${rawDate.getFullYear()}.${String(rawDate.getMonth() + 1).padStart(2, '0')}.${String(rawDate.getDate()).padStart(2, '0')}`;

  // Compute current hole label (e.g. A-3번홀)
  const holeLabel = React.useMemo(() => {
    if (currentHoleLabel) return currentHoleLabel;
    const hNum = currentHoleNumber || session?.currentHole || 1;
    const baseNum = ((Number(hNum) - 1) % 1000) + 1;
    const cIdx = Math.floor((baseNum - 1) / 9);
    const letter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'][cIdx] || 'A';
    const hInCourse = ((baseNum - 1) % 9) + 1;
    return `${letter}-${hInCourse}번홀`;
  }, [currentHoleLabel, currentHoleNumber, session?.currentHole]);

  useEffect(() => {
    if (initialImage) {
      setSelectedImage(initialImage);
    }
  }, [initialImage]);

  // Auto-detect Hole-in-One (1 stroke) or Eagle on current hole or session when modal opens
  useEffect(() => {
    if (!isOpen) {
      lastAutoDetectedHoleRef.current = '';
      return;
    }
    const players = session?.players || [];
    const activeHole = currentHoleNumber || session?.currentHole || 1;
    const activePar = currentHolePar || 4;
    const detectKey = `${session?.id || 'round'}_${activeHole}_${players.map((p) => `${p.id}:${p.scores?.[activeHole] || 0}`).join(',')}`;
    if (lastAutoDetectedHoleRef.current === detectKey) return;
    lastAutoDetectedHoleRef.current = detectKey;

    let detectedType: 'hole_in_one' | 'eagle' | 'regular' = 'regular';
    let detectedPlayer = players.find((p) => p.isSelf)?.name || players[0]?.name || myName;

    // 1. Check current hole first for 1 stroke (Hole-in-One)
    const hioPlayerOnCurrent = players.find((p) => Number(p.scores?.[activeHole]) === 1);
    if (hioPlayerOnCurrent) {
      detectedType = 'hole_in_one';
      detectedPlayer = hioPlayerOnCurrent.name || myName;
    } else {
      // Check any hole in session for 1 stroke
      const hioPlayerAny = players.find((p) =>
        Object.values(p.scores || {}).some((s) => Number(s) === 1)
      );
      if (hioPlayerAny) {
        detectedType = 'hole_in_one';
        detectedPlayer = hioPlayerAny.name || myName;
      } else {
        // Check for Eagle (strokes > 1 and par - strokes >= 2)
        const eaglePlayer = players.find((p) => {
          const s = Number(p.scores?.[activeHole] || 0);
          return s > 1 && activePar - s >= 2;
        });
        if (eaglePlayer) {
          detectedType = 'eagle';
          detectedPlayer = eaglePlayer.name || myName;
        }
      }
    }

    setPhotoType(detectedType);
    setAchieverName(detectedPlayer);
  }, [isOpen, currentHoleNumber, currentHolePar, session?.id, session?.currentHole, session?.players, myName]);

  // Serialize players snapshot into primitive string to prevent infinite dependency loops
  const playersSummaryKey = React.useMemo(() => {
    const activeHole = currentHoleNumber || session?.currentHole || 1;
    return (session?.players || [])
      .slice(0, 4)
      .map((p) => `${p.name}:${p.scores?.[activeHole] || 0}:${p.totalStrokes || 0}`)
      .join('|');
  }, [session?.players, currentHoleNumber, session?.currentHole]);

  // Draw Canvas with lightweight <= 1200px resolution (960x1200) and zero infinite loops
  const generatePhotoCard = useCallback(
    (
      imageSrc: string | null,
      theme: 'hole_in_one' | 'eagle' | 'regular',
      targetAchiever: string
    ) => {
      setIsGenerating(true);
      const canvas = document.createElement('canvas');
      // Lightweight max 1200px dimension to prevent memory lock/freezing
      canvas.width = 960;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsGenerating(false);
        return;
      }

      const renderCard = (userImg: HTMLImageElement | null) => {
        // 1. Background image (resized to <= 1200px automatically on canvas)
        if (userImg) {
          const scale = Math.max(canvas.width / userImg.width, canvas.height / userImg.height);
          const x = (canvas.width - userImg.width * scale) / 2;
          const y = (canvas.height - userImg.height * scale) / 2;
          ctx.drawImage(userImg, x, y, userImg.width * scale, userImg.height * scale);
        } else {
          const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          if (theme === 'hole_in_one') {
            bgGrad.addColorStop(0, '#451a03');
            bgGrad.addColorStop(0.5, '#78350f');
            bgGrad.addColorStop(1, '#1c1917');
          } else if (theme === 'eagle') {
            bgGrad.addColorStop(0, '#0c4a6e');
            bgGrad.addColorStop(0.5, '#0369a1');
            bgGrad.addColorStop(1, '#0f172a');
          } else {
            bgGrad.addColorStop(0, '#064e3b');
            bgGrad.addColorStop(0.5, '#047857');
            bgGrad.addColorStop(1, '#022c22');
          }
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Decorative rays/circles
          ctx.fillStyle = theme === 'hole_in_one' ? 'rgba(251, 191, 36, 0.08)' : 'rgba(255, 255, 255, 0.04)';
          ctx.beginPath();
          ctx.arc(480, 520, 340, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(480, 520, 220, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. Top & Bottom Scrims
        const topScrim = ctx.createLinearGradient(0, 0, 0, 240);
        topScrim.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
        topScrim.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = topScrim;
        ctx.fillRect(0, 0, canvas.width, 240);

        const bottomScrim = ctx.createLinearGradient(0, 620, 0, canvas.height);
        bottomScrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
        bottomScrim.addColorStop(0.35, 'rgba(0, 0, 0, 0.72)');
        bottomScrim.addColorStop(1, 'rgba(0, 0, 0, 0.94)');
        ctx.fillStyle = bottomScrim;
        ctx.fillRect(0, 620, canvas.width, canvas.height - 620);

        // 3. Theme Frame Border (Golden Frame for Hole-in-One, Sky Frame for Eagle)
        if (theme === 'hole_in_one') {
          ctx.save();
          const goldGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          goldGrad.addColorStop(0, '#FDE047');
          goldGrad.addColorStop(0.5, '#F59E0B');
          goldGrad.addColorStop(1, '#FEF08A');
          ctx.strokeStyle = goldGrad;
          ctx.lineWidth = 18;
          ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 3;
          ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);
          ctx.restore();
        } else if (theme === 'eagle') {
          ctx.save();
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 14;
          ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
          ctx.restore();
        }

        // 4. Top Celebration Banner
        if (theme === 'hole_in_one') {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.95)';
          ctx.beginPath();
          ctx.roundRect(48, 48, canvas.width - 96, 76, 38);
          ctx.fill();
          ctx.strokeStyle = '#FEF08A';
          ctx.lineWidth = 4;
          ctx.stroke();

          ctx.fillStyle = '#1C1917';
          ctx.font = '900 30px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🎉 홀인원(Hole-in-One) 공식 달성 기념!', canvas.width / 2, 97);
          ctx.textAlign = 'left';
        } else if (theme === 'eagle') {
          ctx.fillStyle = 'rgba(2, 132, 199, 0.95)';
          ctx.beginPath();
          ctx.roundRect(48, 48, canvas.width - 96, 72, 36);
          ctx.fill();
          ctx.strokeStyle = '#BAE6FD';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🦅 이글(Eagle) 공식 달성 기념!', canvas.width / 2, 95);
          ctx.textAlign = 'left';
        } else {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.88)';
          ctx.beginPath();
          ctx.roundRect(48, 48, 340, 52, 26);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
          ctx.fillText('📸 파키 앱 공식 라운드 기념', 72, 82);
        }

        // Center Hero Emblem if no user photo uploaded yet
        if (!userImg) {
          ctx.textAlign = 'center';
          if (theme === 'hole_in_one') {
            ctx.fillStyle = '#FDE047';
            ctx.font = '900 68px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
            ctx.fillText('🏆 HOLE IN ONE!', canvas.width / 2, 430);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
            ctx.fillText(`${targetAchiever || myName} 님 1타 홀인원 달성!`, canvas.width / 2, 500);
            ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
            ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
            ctx.fillText(`${courseName} · ${holeLabel}`, canvas.width / 2, 555);
          } else if (theme === 'eagle') {
            ctx.fillStyle = '#7DD3FC';
            ctx.font = '900 64px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
            ctx.fillText('🦅 EAGLE SHOT!', canvas.width / 2, 430);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
            ctx.fillText(`${targetAchiever || myName} 님 이글 달성!`, canvas.width / 2, 500);
          } else {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
            ctx.fillText('📸 오늘의 라운드 기념 포토카드', canvas.width / 2, 460);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.font = 'normal 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
            ctx.fillText(`${courseName} / ${dateStr} / ${holeLabel}`, canvas.width / 2, 515);
          }
          ctx.textAlign = 'left';
        }

        // 5. Bottom Metadata Card
        const cardY = 735;
        const cardH = 405;
        ctx.fillStyle =
          theme === 'hole_in_one'
            ? 'rgba(28, 25, 23, 0.90)'
            : 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath();
        ctx.roundRect(48, cardY, canvas.width - 96, cardH, 32);
        ctx.fill();
        ctx.strokeStyle =
          theme === 'hole_in_one'
            ? '#FBBF24'
            : theme === 'eagle'
            ? '#38BDF8'
            : 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = theme === 'hole_in_one' ? 4 : 2.5;
        ctx.stroke();

        // Standard Base Text: 구장명 / 일시 / 현재 진행 코스·홀(예: A-3번홀)
        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 23px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillText(`📍 ${courseName} / ${dateStr} / ${holeLabel}`, 80, cardY + 52);

        // Main Title inside Bottom Card
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        if (theme === 'hole_in_one') {
          ctx.fillText(`🏆 ${targetAchiever || myName} 님 홀인원(1타) 공식 달성!`, 80, cardY + 102);
        } else if (theme === 'eagle') {
          ctx.fillText(`🦅 ${targetAchiever || myName} 님 이글(Eagle) 달성!`, 80, cardY + 102);
        } else {
          ctx.fillText(`${courseName} (${holeLabel})`, 80, cardY + 102);
        }

        // Divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(80, cardY + 124);
        ctx.lineTo(canvas.width - 80, cardY + 124);
        ctx.stroke();

        // Players Grid (No '999홀 완주' or '완주 참가' ever!)
        const activeHole = currentHoleNumber || session?.currentHole || 1;
        const allPlayers =
          session?.players && session.players.length > 0
            ? session.players.slice(0, 4)
            : [{ id: 'p1', name: targetAchiever || myName, scores: { [activeHole]: theme === 'hole_in_one' ? 1 : 3 }, totalStrokes: 1, totalParDiff: 0, isSelf: true }];

        const gridX = 80;
        const gridY = cardY + 142;
        const colW = 385;
        const rowH = 92;

        allPlayers.forEach((pl: any, idx: number) => {
          const col = idx % 2;
          const row = Math.floor(idx / 2);
          const px = gridX + col * (colW + 24);
          const py = gridY + row * (rowH + 12);

          const isAchiever =
            (theme !== 'regular' && pl.name === targetAchiever) ||
            Number(pl.scores?.[activeHole]) === 1;

          ctx.fillStyle = isAchiever
            ? 'rgba(245, 158, 11, 0.25)'
            : 'rgba(255, 255, 255, 0.08)';
          ctx.beginPath();
          ctx.roundRect(px, py, colW, rowH, 16);
          ctx.fill();
          ctx.strokeStyle = isAchiever ? '#FBBF24' : 'rgba(255, 255, 255, 0.18)';
          ctx.lineWidth = isAchiever ? 2.5 : 1.5;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 21px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
          const pName = pl.name || `동반자 ${idx + 1}`;
          ctx.fillText(isAchiever ? `🏆 ${pName}` : `🏌️ ${pName}`, px + 18, py + 36);

          const holeStroke = Number(pl.scores?.[activeHole] || 0);
          if (holeStroke === 1 || (theme === 'hole_in_one' && pl.name === targetAchiever)) {
            ctx.fillStyle = '#FDE047';
            ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
            ctx.fillText(`1타 (홀인원 🏆)`, px + 18, py + 72);
          } else if (holeStroke > 0) {
            ctx.fillStyle = '#34D399';
            ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
            ctx.fillText(`${holeLabel} ${holeStroke}타`, px + 18, py + 72);
          } else if (pl.totalStrokes && pl.totalStrokes > 0) {
            ctx.fillStyle = '#34D399';
            ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
            ctx.fillText(`누적 ${pl.totalStrokes}타`, px + 18, py + 72);
          } else {
            ctx.fillStyle = '#A7F3D0';
            ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
            ctx.fillText(`${holeLabel} 라운드 동반`, px + 18, py + 72);
          }
        });

        // Footer Watermark
        ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillText(
          `⛳ 파키 앱 (PARKY APP) 공식 인증 포토카드 · ${courseName} / ${dateStr} / ${holeLabel}`,
          80,
          cardY + 378
        );

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCardDataUrl(dataUrl);
        setIsGenerating(false);
      };

      if (imageSrc) {
        const userImg = new Image();
        userImg.crossOrigin = 'anonymous';
        userImg.onload = () => {
          // Downscale image if > 1200px before compositing
          if (userImg.width > 1200 || userImg.height > 1200) {
            const tempCanvas = document.createElement('canvas');
            const ratio = Math.min(1200 / userImg.width, 1200 / userImg.height);
            tempCanvas.width = Math.round(userImg.width * ratio);
            tempCanvas.height = Math.round(userImg.height * ratio);
            const tCtx = tempCanvas.getContext('2d');
            if (tCtx) {
              tCtx.drawImage(userImg, 0, 0, tempCanvas.width, tempCanvas.height);
              const scaledImg = new Image();
              scaledImg.onload = () => renderCard(scaledImg);
              scaledImg.onerror = () => renderCard(userImg);
              scaledImg.src = tempCanvas.toDataURL('image/jpeg', 0.85);
              return;
            }
          }
          renderCard(userImg);
        };
        userImg.onerror = () => renderCard(null);
        userImg.src = imageSrc;
      } else {
        renderCard(null);
      }
    },
    [courseName, dateStr, holeLabel, currentHoleNumber, session?.currentHole, playersSummaryKey, myName]
  );

  useEffect(() => {
    if (isOpen) {
      generatePhotoCard(selectedImage, photoType, achieverName || myName);
    }
  }, [isOpen, selectedImage, photoType, achieverName, myName, generatePhotoCard]);

  if (!isOpen) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setSelectedImage(src);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleSaveComplete = async () => {
    if (!cardDataUrl || isSaving) return;
    setIsSaving(true);

    const meta: PhotoCardMeta = {
      photoUrl: cardDataUrl,
      photoType,
      achieverName: achieverName || myName,
      holeLabel,
      courseName,
      dateStr,
    };

    try {
      // 1. Save to ChroniclePhotoStorage for permanent gallery & badge classification
      const companions = (session?.players || []).map((p) => p.name).filter(Boolean);
      const cleanCourseShort = courseName.replace('파크골프장', '').replace('파크골프', '').trim();
      const captionMemo =
        photoType === 'hole_in_one'
          ? `${dateStr} ${cleanCourseShort} ${holeLabel.replace('번홀', '홀')} ${achieverName || myName} 님 홀인원`
          : photoType === 'eagle'
          ? `${dateStr} ${cleanCourseShort} ${holeLabel.replace('번홀', '홀')} ${achieverName || myName} 님 이글 달성`
          : `${dateStr} ${cleanCourseShort} ${holeLabel} 라운드 추억`;

      await ChroniclePhotoStorage.addPhoto({
        sessionId: session?.id,
        courseId: session?.courseId,
        courseName,
        date: dateStr.replace(/\./g, '-'),
        holeInfo: holeLabel,
        photoType,
        achieverName: achieverName || myName,
        holeLabel: holeLabel.replace('번홀', '홀'),
        companions: companions.length > 0 ? companions : [myName],
        scoreSummary:
          photoType === 'hole_in_one'
            ? '🏆 홀인원(1타) 공식 달성'
            : photoType === 'eagle'
            ? '🦅 이글 달성 기념'
            : `${holeLabel} 라운드 기념`,
        memo: captionMemo,
        imageUrl: cardDataUrl,
        thumbnailUrl: cardDataUrl,
      });

      // 2. Save to active session photos & photoMetadata
      if (session) {
        const curPhotos = session.photos || [];
        const curMeta = session.photoMetadata || [];
        const updatedSession: RoundSession = {
          ...session,
          photos: [...curPhotos, cardDataUrl],
          photoMetadata: [...curMeta, meta],
        };
        ParkOnStorage.saveCurrentRound(updatedSession);
      }

      if (onSaveAndReturn) {
        onSaveAndReturn(cardDataUrl, meta);
      }
    } catch (err) {
      console.error('Failed to save photo card:', err);
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  const playersList = session?.players && session.players.length > 0
    ? session.players
    : [{ id: 'self', name: myName }];

  return (
    <div
      data-testid="watermark-photo-card-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4"
    >
      <div className="bg-stone-900 border border-stone-700 rounded-3xl w-full max-w-md max-h-[94vh] flex flex-col text-white shadow-2xl overflow-hidden relative">
        {/* Loading Overlay during save (Zero Flicker) */}
        {isSaving && (
          <div
            data-testid="photo-saving-indicator"
            className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center gap-3"
          >
            <div className="w-10 h-10 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
            <span className="text-sm font-black text-amber-300">저장 중...</span>
          </div>
        )}

        {/* 1. Compact Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 shrink-0 bg-stone-950">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shrink-0">
              <Camera className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base tracking-tight truncate">
                {photoType === 'hole_in_one'
                  ? '🎉 홀인원(Hole-in-One) 공식 달성 기념!'
                  : photoType === 'eagle'
                  ? '🦅 이글(Eagle) 공식 달성 기념!'
                  : '📸 파키 앱 라운드 기념 인증샷'}
              </h3>
              <p className="text-[11px] text-amber-300 font-bold truncate">
                {courseName} / {dateStr} / {holeLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        {/* 2. Theme Selection Chips + Achiever Selection */}
        <div className="px-3.5 py-2.5 bg-stone-900 border-b border-stone-800 space-y-2 shrink-0">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              data-testid="theme-chip-hole-in-one"
              onClick={() => setPhotoType('hole_in_one')}
              className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition cursor-pointer border ${
                photoType === 'hole_in_one'
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-stone-950 border-yellow-200 shadow-md'
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
              }`}
            >
              <span>🏆 홀인원</span>
            </button>
            <button
              type="button"
              data-testid="theme-chip-eagle"
              onClick={() => setPhotoType('eagle')}
              className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition cursor-pointer border ${
                photoType === 'eagle'
                  ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white border-sky-200 shadow-md'
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
              }`}
            >
              <span>🦅 이글</span>
            </button>
            <button
              type="button"
              data-testid="theme-chip-regular"
              onClick={() => setPhotoType('regular')}
              className={`py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition cursor-pointer border ${
                photoType === 'regular'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
              }`}
            >
              <span>📸 라운드 기념</span>
            </button>
          </div>

          {/* Achiever Name Chips when Hole-in-One or Eagle selected */}
          {photoType !== 'regular' && playersList.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              <span className="text-[11px] font-bold text-amber-300 shrink-0">달성자:</span>
              {playersList.map((pl) => {
                const pName = pl.name || myName;
                const isSelected = (achieverName || myName) === pName;
                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => setAchieverName(pName)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black shrink-0 transition cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-400/25 text-amber-300 border-amber-400'
                        : 'bg-stone-800 text-stone-400 border-stone-700'
                    }`}
                  >
                    {pName}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Compact Preview Area (Fits on screen without pushing bottom bar off-screen) */}
        <div className="flex-1 min-h-0 p-3 flex flex-col items-center justify-center bg-stone-950 relative overflow-hidden">
          {photoType === 'hole_in_one' && (
            <div
              data-testid="golden-hole-in-one-banner"
              className="mb-2 w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-stone-950 font-black text-xs text-center shadow-md border border-yellow-200 shrink-0"
            >
              🎉 홀인원(Hole-in-One) 공식 달성 기념! ({achieverName || myName} 님)
            </div>
          )}
          <div
            className={`relative rounded-2xl overflow-hidden shadow-xl bg-stone-900 flex items-center justify-center max-h-[42vh] aspect-[4/5] ${
              photoType === 'hole_in_one'
                ? 'border-3 border-amber-400 ring-2 ring-yellow-300/60'
                : photoType === 'eagle'
                ? 'border-2 border-sky-400'
                : 'border border-stone-700'
            }`}
          >
            {isGenerating ? (
              <div className="flex flex-col items-center gap-2 text-stone-300 text-xs font-bold p-8">
                <Sparkles className="w-6 h-6 text-amber-400 animate-spin" />
                <span>포토카드 합성 중...</span>
              </div>
            ) : cardDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cardDataUrl}
                alt="기념 포토카드 미리보기"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-stone-400 text-xs font-medium p-8">카드 준비 중...</div>
            )}
          </div>
        </div>

        {/* 4. Fixed Bottom Bar: [ ✅ 등록 완료 ] & [ 🔄 다시 찍기 ] immediately visible without scroll */}
        <div className="p-3.5 bg-stone-900 border-t border-stone-800 shrink-0 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            data-testid="photo-retake-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving}
            className="w-full py-3.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-100 font-black rounded-2xl text-sm flex items-center justify-center gap-1.5 border border-stone-600 transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span>🔄 다시 찍기</span>
          </button>
          <button
            type="button"
            data-testid="photo-confirm-save-btn"
            onClick={handleSaveComplete}
            disabled={isSaving || isGenerating}
            className="w-full py-3.5 px-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-1.5 shadow-lg border border-emerald-400 transition active:scale-95 cursor-pointer"
          >
            <Check className="w-4.5 h-4.5 text-yellow-300 stroke-[3]" />
            <span>✅ 등록 완료</span>
          </button>
        </div>
      </div>
    </div>
  );
}
