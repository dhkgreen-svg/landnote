'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, Download, Share2, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import { RoundSession } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface WatermarkPhotoCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: RoundSession | null;
  initialImage?: string | null;
  onSaveAndReturn?: (cardDataUrl: string) => void;
}

export function WatermarkPhotoCardModal({
  isOpen,
  onClose,
  session,
  initialImage,
  onSaveAndReturn,
}: WatermarkPhotoCardModalProps) {
  const { isJapanese, isEnglish } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage || null);
  const [clubTag, setClubTag] = useState<string>('');

  useEffect(() => {
    if (initialImage) {
      setSelectedImage(initialImage);
    }
  }, [initialImage]);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const myName = ParkOnStorage.getUserDisplayName();

  const courseName = session?.courseName || (isJapanese ? '同楽パークゴルフ場' : '구미 동락 파크골프장');
  const totalHoles = session?.totalHoles || 18;
  const dateStr = session?.completedAt
    ? new Date(session.completedAt).toLocaleDateString(isJapanese ? 'ja-JP' : 'ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString(isJapanese ? 'ja-JP' : 'ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  // Calculate my score
  const myPlayer = session?.players?.find((p) => p.isSelf || p.name === myName) || session?.players?.[0];
  const myStrokes = myPlayer?.totalStrokes || 58;
  const parDiff = myPlayer?.totalParDiff ?? -2;
  const parDiffStr = parDiff === 0 ? 'Even Par' : parDiff > 0 ? `+${parDiff} Over` : `${parDiff} Under Par`;

  const companionNames = session?.players
    ? session.players.map((p) => p.name).join(' · ')
    : `${myName}`;

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
      ctx.fillText('⛳ 파크골프 올인원 공식 인증', 74, 86);

      // Right Logo
      ctx.fillStyle = '#FDE047'; // bright yellow
      ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('ParkGolf All-in-One', 1030, 86);
      ctx.textAlign = 'left';

      // 4. Center Highlight if no user image
      if (!userImg) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isJapanese ? '📸 今日のラウンド記念写真を載せてみましょう！' : '📸 오늘의 라운드 기념 사진을 올려보세요!', 540, 580);
        ctx.font = 'normal 26px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(isJapanese ? '同伴者と一緒に撮った写真が公式記念フォトカードになります' : '동반자와 함께 찍은 사진이 워터마크 포토 카드로 완성됩니다', 540, 630);
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
      const dateText = clubTag.trim()
        ? `📅 ${dateStr} · 👥 ${clubTag.trim()}`
        : `📅 ${dateStr} · ${totalHoles}${isJapanese ? 'ホール完走' : '홀 완주'}`;
      ctx.fillText(dateText, 90, cardY + 60);

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
      ctx.fillText(isJapanese ? '🏆 ラウンド最終成績' : '🏆 라운드 최종 성적', 90, cardY + 195);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 60px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillText(`${myStrokes}${isJapanese ? '打' : '타'}`, 90, cardY + 265);

      ctx.fillStyle = '#FDE047';
      ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillText(`(${parDiffStr})`, 270, cardY + 258);

      // Companions list
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillText(`${isJapanese ? '🤝 同伴者: ' : '🤝 동반 1촌: '}${companionNames}`, 90, cardY + 325);

      // Footer Watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'normal 18px -apple-system, BlinkMacSystemFont, "Pretendard", sans-serif';
      ctx.fillText(isJapanese ? 'No.1 パークゴルフ スマートスコアボード · parkongolf.com' : '대한민국 1등 파크골프 스마트 스코어보드 · parkongolf.com', 90, cardY + 360);

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
  }, [courseName, dateStr, totalHoles, myStrokes, parDiffStr, companionNames, clubTag]);

  useEffect(() => {
    if (isOpen) {
      generatePhotoCard(selectedImage);
    }
  }, [isOpen, selectedImage, clubTag, generatePhotoCard]);

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
    link.download = `파크골프_올인원_${courseName}_${dateStr.replace(/[^0-9]/g, '')}_포토카드.jpg`;
    link.href = cardDataUrl;
    link.click();

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // 🔥 대표님 절대 원칙 지침: 사진 저장 완료 즉시 타수 기입창(2단계)으로 0.1초 원터치 복귀
  const handleSaveAndReturn = () => {
    // 1. Download to phone
    handleDownload();

    // 2. Persist to active session photos if session is present
    if (cardDataUrl && session) {
      try {
        const curPhotos = session.photos || [];
        const updatedSession: RoundSession = {
          ...session,
          photos: [...curPhotos, cardDataUrl],
        };
        ParkOnStorage.saveCurrentRound(updatedSession);
      } catch (err) {
        console.error('Failed to append photo to session:', err);
      }
    }

    // 3. Trigger callback if passed
    if (cardDataUrl && onSaveAndReturn) {
      onSaveAndReturn(cardDataUrl);
    }

    // 4. Close modal instantly
    onClose();
  };

  // Web Share API (KakaoTalk / Band)
  const handleShare = async () => {
    if (!cardDataUrl) return;
    try {
      if (navigator.share) {
        const blob = await (await fetch(cardDataUrl)).blob();
        const file = new File([blob], `파크골프_올인원_${courseName}_포토카드.jpg`, { type: 'image/jpeg' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `[파크골프 올인원] ${courseName} 완주 기념 포토카드`,
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
              <h3 className="font-black text-lg tracking-tight">
                {isJapanese ? '記念フォトカード' : isEnglish ? 'Commemorative Photo Card' : '워터마크 기념 포토카드'}
              </h3>
              <p className="text-xs text-stone-400 font-medium">
                {isJapanese ? '写真の上にパークゴルフ オールインワン公式認証合成' : '동반 사진 위에 파크골프 올인원 공식 인증 합성'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="py-1.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition text-xs font-black border border-stone-700 active:scale-95"
            title={isJapanese ? '閉じて競技画面に戻る' : '닫고 점수 입력 복귀'}
          >
            <X className="w-4 h-4 text-stone-400" />
            <span>{isJapanese ? 'スコア入力へ復帰' : '점수 입력 복귀'}</span>
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
              <span>{isJapanese ? 'フォトカード合成中...' : '포토카드 합성 중...'}</span>
            </div>
          ) : cardDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cardDataUrl}
              alt="워터마크 포토카드"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-stone-500 text-xs font-medium">
              {isJapanese ? 'カードを生成しています...' : '카드를 생성하고 있습니다...'}
            </div>
          )}

          {/* Quick Photo Upload Trigger Button Overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute top-3 right-3 py-2 px-3 bg-black/65 hover:bg-black/85 text-white text-xs font-bold rounded-xl border border-white/30 backdrop-blur-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-amber-300" />
            <span>{selectedImage ? (isJapanese ? '写真変更' : '사진 변경') : (isJapanese ? '写真をアップロード' : '내 사진 올리기')}</span>
          </button>
        </div>

        {/* 모임 / 클럽 명칭 (선택 기입 - 워터마크에 자동 반영) */}
        <div className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
          <span className="text-amber-400 font-bold shrink-0">{isJapanese ? '👥 クラブ/サークル:' : '👥 모임/클럽:'}</span>
          <input
            type="text"
            value={clubTag}
            onChange={(e) => setClubTag(e.target.value)}
            placeholder={isJapanese ? '例: パークゴルフ同好会 定期戦 (任意入力)' : '예: 구미 에이스 클럽 정기전 (선택 입력)'}
            maxLength={20}
            className="w-full bg-transparent text-white font-bold placeholder:text-stone-500 outline-none text-xs"
          />
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-950 border border-emerald-500 rounded-xl text-center text-xs font-black text-emerald-300 animate-in fade-in">
            {isJapanese ? '✓ スマホのアルバムに高画質フォトカードが保存されました！' : '✓ 스마트폰 앨범에 고화질 포토카드가 저장되었습니다!'}
          </div>
        )}

        {/* 🌟 대표님 현장 대응 UX: 3대 액션 버튼 (Senior Friendly 56px+) */}
        <div className="space-y-2 pt-1">
          {/* 🔥 1. 최우선 초대형 버튼: 사진 저장 후 즉시 경기 화면(점수 기입) 복귀 */}
          <button
            type="button"
            onClick={handleSaveAndReturn}
            className="w-full min-h-[56px] bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/40 active:scale-98 transition cursor-pointer border-2 border-emerald-400"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>{isJapanese ? '🏌️ 写真保存 ➔ プレイ復帰 (スコア入力)' : '🏌️ 사진 저장 완료 ➔ 바로 경기 복귀 (점수 입력)'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            {/* 2. 카톡 / 밴드 1초 공유 버튼 */}
            <button
              type="button"
              onClick={handleShare}
              className="w-full min-h-[50px] bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#191919]" />
              <span>{isJapanese ? 'LINE/SNS共有' : '💬 카톡 1초 공유'}</span>
            </button>

            {/* 3. 사진첩 다운로드 저장 버튼 */}
            <button
              type="button"
              onClick={handleDownload}
              className="w-full min-h-[50px] bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition cursor-pointer border border-stone-700"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{isJapanese ? 'アルバム保存' : '💾 사진첩 저장'}</span>
            </button>
          </div>

          {/* 4. 보조: 저장 없이 바로 닫기 */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-transparent hover:bg-stone-800/60 text-stone-400 hover:text-stone-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition active:scale-98 cursor-pointer"
          >
            <span>{isJapanese ? '✕ 写真保存なしで競技画面へ戻る' : '✕ 저장 없이 바로 경기 화면(점수 기입) 복귀'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
