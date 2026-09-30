'use client';

import React, { useRef, useState } from 'react';
import { Camera, Sparkles } from 'lucide-react';
import { WatermarkPhotoCardModal } from '@/components/WatermarkPhotoCardModal';
import { RoundSession } from '@/types/parkon';

import { useTranslation } from '@/lib/i18n/LanguageContext';

interface FloatingCameraFABProps {
  session?: RoundSession | null;
  currentHoleNumber?: number;
  currentCourseName?: string;
}

export function FloatingCameraFAB({ session, currentHoleNumber, currentCourseName }: FloatingCameraFABProps) {
  const { isJapanese, isEnglish } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCapturedImage(url);
      setShowPhotoModal(true);
    }
    // reset input so same file can be selected again
    if (e.target) e.target.value = '';
  };

  return (
    <>
      {/* 네이티브 후면 카메라 다이렉트 호출용 숨김 input (PWA 앱 이탈 없이 0.1초 구동) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />

      {/* 우측 하단 상시 고정 플로팅 카메라 버튼 (FAB) */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-center gap-1 animate-in fade-in zoom-in duration-300">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label={isJapanese ? '記念写真の撮影' : isEnglish ? 'Take photo' : '현장 인증샷 촬영'}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-stone-950 shadow-2xl flex flex-col items-center justify-center border-2 border-white/90 active:scale-90 transition-transform cursor-pointer group hover:shadow-amber-500/50"
        >
          <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-stone-950 fill-stone-950/20 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] sm:text-[11px] font-black tracking-tighter leading-none mt-0.5">
            {isJapanese ? '記念写真' : isEnglish ? 'Photo' : '인증샷'}
          </span>
        </button>
      </div>

      {/* 워터마크 자동 합성 및 카톡 공유 모달 */}
      <WatermarkPhotoCardModal
        isOpen={showPhotoModal}
        onClose={() => {
          setShowPhotoModal(false);
          setCapturedImage(null);
        }}
        session={session}
        initialImage={capturedImage}
      />
    </>
  );
}
