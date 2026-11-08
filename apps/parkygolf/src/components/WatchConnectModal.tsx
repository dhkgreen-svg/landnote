'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Watch, Copy, Check, ExternalLink, Smartphone, Sparkles, ShieldCheck, Wifi } from 'lucide-react';
import Link from 'next/link';

interface WatchConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  roundId: string;
}

export function WatchConnectModal({ isOpen, onClose, roundId }: WatchConnectModalProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [pinCode, setPinCode] = useState<string>('7421');

  useEffect(() => {
    if (!isOpen || !roundId) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.parkgolfallinone.com';
    const watchUrl = `${origin}/round/${roundId}/watch`;

    // 4-digit deterministic PIN Code from roundId
    let hash = 0;
    for (let i = 0; i < roundId.length; i++) {
      hash = (hash * 31 + roundId.charCodeAt(i)) % 9000;
    }
    const pin = (1000 + Math.abs(hash)).toString().padStart(4, '0');
    setPinCode(pin);

    QRCode.toDataURL(watchUrl, {
      width: 260,
      margin: 1.5,
      color: {
        dark: '#022C22', // deep emerald black
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error('Watch QR generation error:', err));
  }, [isOpen, roundId]);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.parkgolfallinone.com';
  const watchUrl = `${origin}/round/${roundId}/watch`;

  const handleCopyLink = async () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(watchUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {}
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3.5 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-stone-900 border-2 border-emerald-500/80 rounded-3xl p-5 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-lg">
              ⌚
            </span>
            <div>
              <h3 className="text-base font-black text-emerald-300">
                스마트워치 원클릭 연동
              </h3>
              <p className="text-[11px] text-stone-400">
                손목 위에서 3초 만에 홀 마감
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center pt-1">
          <div className="p-3 bg-white rounded-3xl shadow-xl border-4 border-emerald-500/30">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="스마트워치 연결 QR 코드"
                className="w-48 h-48 object-contain rounded-xl"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-stone-600">
                QR 생성 중...
              </div>
            )}
          </div>

          {/* Quick PIN Code */}
          <div className="mt-3 flex items-center gap-2 px-3 py-1 bg-stone-950 rounded-full border border-stone-800 text-xs">
            <span className="text-stone-400 font-bold">간편 핀코드:</span>
            <span className="text-amber-400 font-mono font-black text-sm tracking-wider">
              {pinCode}
            </span>
          </div>
        </div>

        {/* Guide Callout for Galaxy & Apple Watch */}
        <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-[11px] text-stone-300 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>갤럭시 워치 & 애플 워치 연결 방법</span>
          </div>
          <p className="text-stone-300">
            • <strong>카메라/브라우저로 QR 비추기:</strong> 워치의 카메라 또는 삼성인터넷 앱으로 QR을 비추면 바로 손목 스코어보드가 실행됩니다.
          </p>
          <p className="text-stone-300">
            • <strong>화면 켜짐 유지 & 자동 동기화:</strong> 워치에서 타수를 변경하면 스마트폰에 <strong>실시간 즉각 동기화</strong>됩니다.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Direct Open Button */}
          <Link
            href={`/round/${roundId}/watch`}
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
          >
            <Watch className="w-4 h-4 stroke-[2.5]" />
            <span>이 기기에서 바로 워치 뷰 열기</span>
            <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
          </Link>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                <span className="text-emerald-400 font-black">워치 전용 링크 복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>워치 전용 연결 링크 복사</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
