'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, Download, Share2, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import { RoundSession } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';

interface WatermarkPhotoCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: RoundSession | null;
}

export function WatermarkPhotoCardModal({ isOpen, onClose, session }: WatermarkPhotoCardModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const myName = ParkOnStorage.getUserDisplayName();

  const courseName = session?.courseName || '구미 동락 파크골프장';
  const totalHoles = session?.totalHoles || 18;
  const dateStr = session?.completedAt
    ? new Date(session.completedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  // Calculate my score
  const myPlayer = session?.players?.find((p) => p.isSelf || p.name === myName) || session?.players?.[0];
  const myStrokes = myPlayer?.totalStrokes || 58;
  const parDiff = myPlayer?.totalParDiff ?? -2;
  const parDiffStr = parDiff === 0 ? 'Even Par' : parDiff > 0 ? `+${parDiff} Over` : `${parDiff} Under Par`;

  const companionNames = session?.players
    ? session.players.map((p) => p.name).join(' · ')
    : `${myName} · 이영호 · 박철수 · 정순자`;

  // Draw Canvas
  const generatePhotoCard = useCallback((imageSrc: string | null) => {
    setIsGenerating(true);
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350; // 4:5 Phone portrait ratio
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mascotImg = new Image();
    mascotImg.crossOrigin = 'anonymous';
    mascotImg.src = '/parky.jpg';

    const renderLayers = (userImg: HTMLImageElement | null) => {
      // 1. Background
      if (userImg) {
        // Draw user image cover fit
        const scale = Math.max(canvas.width / userImg.width, canvas.height / userImg.height);
        const x = (canvas.width - userImg.width * scale) / 2;
        const y = (canvas.height - userImg.height * scale) / 2;
        ctx.drawImage(userImg, x, y, userImg.width * scale, userImg.height * scale);
      } else {
        // Beautiful green turf gradient fallback
        const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bgGrad.addColorStop(0, '#064e3b');
        bgGrad.addColorStop(0.5, '#047857');
        bgGrad.addColorStop(1, '#065f46');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Pattern circles
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.arc(540, 675, 420, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(540, 675, 300, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Top Scrim & Bottom Scrim Gradients
      const topScrim = ctx.createLinearGradient(0, 0, 0, 260);
      topScrim.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      topScrim.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = topScrim;
      ctx.fillRect(0, 0, canvas.width, 260);

      const bottomScrim = ctx.createLinearGradient(0, 700, 0, canvas.height);
      bottomScrim.addColorStop(0, 'rgba(0, 0, 0, 0)');
      bottomScrim.addColorStop(0.4, 'rgba(0, 0, 0, 0.65)');
      bottomScrim.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
      ctx.fillStyle = bottomScrim;
      ctx.fillRect(0, 700, canvas.width, canvas.height - 700);

      // 3. Top Header Badges
      // Left Badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.roundRect(50, 50, 310, 54, 27);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillText('⛳ 파크온 공식 인증 라운드', 74, 86);

      // Right Logo
      ctx.fillStyle = '#FDE047'; // bright yellow
      ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('ParkOn', 1030, 86);
      ctx.textAlign = 'left';

      // 4. Center Highlight if no user image
      if (!userImg) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📸 오늘의 라운드 기념 사진을 올려보세요!', 540, 580);
        ctx.font = 'normal 26px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('동반자와 함께 찍은 사진이 워터마크 포토 카드로 완성됩니다', 540, 630);
        ctx.textAlign = 'left';
      }

      // 5. Bottom Metadata Card
      const cardY = 880;
      const cardH = 390;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)'; // dark glass
      ctx.beginPath();
      ctx.roundRect(50, cardY, 980, cardH, 36);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Mascot Emblem on top right of metadata card
      if (mascotImg.complete && mascotImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(930, cardY + 90, 65, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(mascotImg, 930 - 65, cardY + 90 - 65, 130, 130);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(930, cardY + 90, 65, 0, Math.PI * 2);
        ctx.strokeStyle = '#FBBF24'; // gold border
        ctx.lineWidth = 5;
        ctx.stroke();
      }

      // Course Name & Date
      ctx.fillStyle = '#FBBF24'; // Gold
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillText(`📅 ${dateStr} · ${totalHoles}홀 완주`, 90, cardY + 60);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 44px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillText(courseName, 90, cardY + 120);

      // Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(90, cardY + 150);
      ctx.lineTo(840, cardY + 150);
      ctx.stroke();

      // Score Highlight
      ctx.fillStyle = '#34D399'; // Emerald-400
      ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillText('🏆 라운드 최종 성적', 90, cardY + 195);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 60px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillText(`${myStrokes}타`, 90, cardY + 265);

      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillText(`(${parDiffStr})`, 270, cardY + 258);

      // Companions list
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillText(`🤝 동반 1촌: ${companionNames}`, 90, cardY + 325);

      // Footer Watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'normal 18px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillText('대한민국 1등 파크골프 스마트 스코어보드 · parkongolf.com', 90, cardY + 360);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCardDataUrl(dataUrl);
      setIsGenerating(false);
    };

    mascotImg.onload = () => {
      if (imageSrc) {
        const userImg = new Image();
        userImg.crossOrigin = 'anonymous';
        userImg.src = imageSrc;
        userImg.onload = () => renderLayers(userImg);
        userImg.onerror = () => renderLayers(null);
      } else {
        renderLayers(null);
      }
    };
    mascotImg.onerror = () => {
      if (imageSrc) {
        const userImg = new Image();
        userImg.crossOrigin = 'anonymous';
        userImg.src = imageSrc;
        userImg.onload = () => renderLayers(userImg);
      } else {
        renderLayers(null);
      }
    };
  }, [courseName, dateStr, totalHoles, myStrokes, parDiffStr, companionNames]);

  useEffect(() => {
    if (isOpen) {
      generatePhotoCard(selectedImage);
    }
  }, [isOpen, selectedImage, generatePhotoCard]);

  if (!isOpen) return null;

  // Handle Photo selection from camera / gallery
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setSelectedImage(src);
      generatePhotoCard(src);
    };
    reader.readAsDataURL(file);
  };

  // Download Card to Phone Gallery
  const handleDownload = () => {
    if (!cardDataUrl) return;
    const link = document.createElement('a');
    link.download = `파크온_${courseName}_${dateStr.replace(/[^0-9]/g, '')}_포토카드.jpg`;
    link.href = cardDataUrl;
    link.click();

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Web Share API (KakaoTalk / Band)
  const handleShare = async () => {
    if (!cardDataUrl) return;
    try {
      if (navigator.share) {
        const blob = await (await fetch(cardDataUrl)).blob();
        const file = new File([blob], `파크온_${courseName}_포토카드.jpg`, { type: 'image/jpeg' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `[파크온] ${courseName} 완주 기념 포토카드`,
            text: `${myName} 님의 ${courseName} ${totalHoles}홀 완주(${myStrokes}타) 기념 카드입니다.`,
            files: [file],
          });
          return;
        }
      }
    } catch {
      // fallback to download
    }
    handleDownload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-4 text-white space-y-4 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight">워터마크 기념 포토카드</h3>
              <p className="text-xs text-stone-400 font-medium">동반 사진 위에 파크온 공식 인증 합성</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-5 h-5" />
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

        {/* Photo Card Preview Container */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-stone-700 shadow-xl aspect-[4/5] bg-stone-950 flex items-center justify-center">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-2 text-stone-400 text-xs font-bold">
              <Sparkles className="w-6 h-6 text-amber-400 animate-spin" />
              <span>포토카드 합성 중...</span>
            </div>
          ) : cardDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cardDataUrl}
              alt="워터마크 포토카드"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-stone-500 text-xs font-medium">카드를 생성하고 있습니다...</div>
          )}

          {/* Quick Photo Upload Trigger Button Overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute top-3 right-3 py-2 px-3 bg-black/65 hover:bg-black/85 text-white text-xs font-bold rounded-xl border border-white/30 backdrop-blur-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-amber-300" />
            <span>{selectedImage ? '사진 변경' : '내 사진 올리기'}</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-950 border border-emerald-500 rounded-xl text-center text-xs font-black text-emerald-300 animate-in fade-in">
            ✓ 스마트폰 앨범에 고화질 포토카드가 저장되었습니다!
          </div>
        )}

        {/* 2대 핵심 액션 버튼 (Senior Friendly 54px+) */}
        <div className="space-y-2 pt-1">
          {/* 1. 카톡 / 밴드 1초 공유 버튼 */}
          <button
            type="button"
            onClick={handleShare}
            className="w-full min-h-[54px] bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black rounded-2xl text-base flex items-center justify-center gap-2 shadow-lg active:scale-98 transition cursor-pointer"
          >
            <Share2 className="w-5 h-5 text-[#191919]" />
            <span>💬 카카오톡 / 밴드 동반자에게 1초 공유</span>
          </button>

          {/* 2. 사진첩 다운로드 저장 버튼 */}
          <button
            type="button"
            onClick={handleDownload}
            className="w-full min-h-[52px] bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-base flex items-center justify-center gap-2 shadow-md active:scale-98 transition cursor-pointer"
          >
            <Download className="w-5 h-5 text-white" />
            <span>💾 스마트폰 사진첩 앨범에 저장하기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
