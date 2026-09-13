'use client';

import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface AdSenseSlotProps {
  client?: string;
  slot?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: boolean;
  className?: string;
}

export function AdSenseSlot({
  client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-XXXXXXXXXXXXXXXX',
  slot = '1234567890',
  format = 'auto',
  responsive = true,
  className = '',
}: AdSenseSlotProps) {
  const isDevOrPlaceholder = !process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || client.includes('XXXX');

  useEffect(() => {
    if (!isDevOrPlaceholder && typeof window !== 'undefined') {
      try {
        // @ts-expect-error Google adsbygoogle array push
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.warn('AdSense slot load error', err);
      }
    }
  }, [isDevOrPlaceholder]);

  // 구글 애드센스 심사 통과 전 / 플레이스홀더 모드: 레이아웃 붕괴 없는 유용한 파크골프 추천 배너
  if (isDevOrPlaceholder) {
    return (
      <div
        className={`my-3 p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200/70 text-center shadow-2xs ${className}`}
      >
        <div className="flex items-center justify-between text-[10px] text-emerald-800 font-bold mb-1">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            파크온 추천 정보
          </span>
          <span className="text-stone-400 font-medium">Sponsored</span>
        </div>
        <div className="text-xs font-black text-stone-800">
          🏌️ 전국 380개 공인 파크골프장 탐방 & 시니어 맞춤 용품 가이드
        </div>
        <p className="text-[10px] text-stone-500 mt-0.5 font-medium">
          파크온은 지속 가능한 무료 서비스를 위해 구글 애드센스 및 공식 파트너 광고를 지원합니다.
        </p>
      </div>
    );
  }

  // 실서비스 구글 애드센스 태그
  return (
    <div className={`my-3 text-center overflow-hidden ${className}`}>
      <span className="block text-[9px] text-stone-400 text-right mb-0.5 pr-1">광고 (Ad)</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
