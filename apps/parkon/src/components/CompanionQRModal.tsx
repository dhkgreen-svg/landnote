'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Copy, Check, UserPlus, Sparkles, ShieldCheck, Heart } from 'lucide-react';
import { ParkOnStorage } from '@/lib/storage';
import { CompanionStorage } from '@/lib/companionStorage';

interface CompanionQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanionAdded?: () => void;
}

export function CompanionQRModal({ isOpen, onClose, onCompanionAdded }: CompanionQRModalProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [manualName, setManualName] = useState('');
  const [activeTab, setActiveTab] = useState<'QR' | 'MANUAL'>('QR');
  const [successMsg, setSuccessMsg] = useState('');

  const myName = ParkOnStorage.getUserDisplayName();

  useEffect(() => {
    if (!isOpen) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.parkongolf.com';
    const connectUrl = `${origin}/chronicle?addFriend=${encodeURIComponent(myName)}&t=${Date.now()}`;

    QRCode.toDataURL(connectUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#064E3B', // deep emerald
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [isOpen, myName]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.parkongolf.com';
    const connectUrl = `${origin}/chronicle?addFriend=${encodeURIComponent(myName)}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(connectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    CompanionStorage.addOrUpdateCompanion(manualName.trim(), '현장 맺음', undefined, '현장 QR/수동 결연 1촌');
    setSuccessMsg(`'${manualName.trim()}' 님과 평생 1촌 동반자 인연이 맺어졌습니다! 🤝`);
    setManualName('');
    if (onCompanionAdded) onCompanionAdded();
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-sm">
              <Heart className="w-5 h-5 fill-emerald-950" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight">현장 1촌 동반자 맺기</h3>
              <p className="text-xs text-emerald-200 font-medium">동반자와 스마트폰으로 인연 맺기</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection (Senior High Contrast) */}
        <div className="grid grid-cols-2 p-2 bg-stone-100 border-b border-stone-200 gap-1.5 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab('QR')}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'QR'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>내 1촌 QR 비추기</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MANUAL')}
            className={`py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'MANUAL'
                ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>이름으로 바로 등록</span>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {successMsg ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 mx-auto bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md">
                ✓
              </div>
              <p className="text-sm font-black text-emerald-900">{successMsg}</p>
            </div>
          ) : activeTab === 'QR' ? (
            <div className="text-center space-y-3">
              <div className="inline-block p-3.5 bg-white border-4 border-emerald-600 rounded-3xl shadow-md">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt="1촌 QR 코드" className="w-52 h-52 mx-auto rounded-xl object-contain" />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-stone-400 font-bold">
                    QR 코드 생성 중...
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-left space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>동반자 폰 카메라로 스캔하세요!</span>
                </div>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  상대방의 스마트폰 기본 카메라로 위 QR 코드를 비추기만 하면 <strong>{myName}</strong> 님과 즉시 1촌으로 연결됩니다.
                </p>
              </div>

              {/* 52px+ Senior Action Button */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full min-h-[52px] bg-stone-900 hover:bg-stone-800 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-300">1촌 초대 링크 복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>카톡으로 1촌 초대 링크 보내기</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-black text-stone-700">
                  함께 라운딩하신 동반자 성함
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="예: 홍길동, 박회장님"
                  className="w-full min-h-[52px] px-4 rounded-2xl border-2 border-stone-300 focus:border-emerald-600 bg-stone-50 text-base font-bold text-stone-900 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 leading-relaxed">
                💡 등록된 1촌은 라운드 결과표에 자동으로 누적 동반 횟수가 카운트되며, 나의 파크골프 연대기에서 &apos;최다 동반 파트너&apos;로 영구 보존됩니다.
              </div>

              {/* 52px+ Senior Button */}
              <button
                type="submit"
                disabled={!manualName.trim()}
                className="w-full min-h-[52px] bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-base flex items-center justify-center gap-2 shadow-md active:scale-98 transition disabled:opacity-40 cursor-pointer"
              >
                <UserPlus className="w-5 h-5" />
                <span>1촌 동반자로 즉시 등록</span>
              </button>
            </form>
          )}

          <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-stone-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>파크온 1촌 네트워크는 안전하게 영구 보존됩니다.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
