'use client';

import React, { useState } from 'react';
import { X, Copy, Check, MessageCircle, Send, Share2, Sparkles } from 'lucide-react';
import { ParkOnStorage } from '@/lib/storage';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface AppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppShareModal({ isOpen, onClose }: AppShareModalProps) {
  const { isJapanese, isEnglish } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rawUser = ParkOnStorage.getUserDisplayName();
  const cleanUser = rawUser && rawUser !== '파크골퍼' && rawUser !== 'パークゴルファー' ? rawUser : '';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.parkgolfallinone.com';
  const shareUrl = cleanUser
    ? `${origin}/install?by=${encodeURIComponent(cleanUser)}`
    : `${origin}/install`;

  const shareTitle = isJapanese
    ? '[PARKY パキ] パークゴルフ オールインワン アプリ推薦'
    : isEnglish
    ? '[PARKY] ParkGolf All-in-One App'
    : '[파키 PARKY] 파크골프 올인원 공식 앱 추천';

  const shareText = isJapanese
    ? `[PARKY パキ] ${cleanUser ? `${cleanUser}様が推薦する` : ''}パークゴルフ必須アプリ！\n⛳ リアルタイム モバイルスコアボード · 全国コース情報\nスマホのホーム画面にすぐ登録して使えます:\n${shareUrl}`
    : isEnglish
    ? `[PARKY] ${cleanUser ? `Recommended by ${cleanUser}: ` : ''}Essential ParkGolf App!\n⛳ Real-time Mobile Scoreboard & Course Info\n${shareUrl}`
    : `[파키 PARKY] ${cleanUser ? `${cleanUser} 님이 추천하는 ` : ''}대한민국 1등 파크골프 필수 앱!\n⛳ 실시간 모바일 스코어보드 · 전국 400개 구장 날씨/제원\n폰 바탕화면에 바로 설치하고 편하게 쓰세요:\n${shareUrl}`;

  const copyToClipboard = async (customToastMsg?: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      return true;
    } catch {
      return false;
    }
  };

  // 1. 카카오톡으로 추천하기
  const handleKakaoShare = async () => {
    await copyToClipboard();

    // 모바일 Web Share API가 지원되는 경우 직접 시스템/카카오톡 공유창 호출
    if (typeof navigator !== 'undefined' && navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent || '')) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // PC/기타 환경: 카카오톡 공유 링크 브릿지 또는 클립보드 안내
    const kakaoWebUrl = `https://sharer.kakao.com/talk/friends/picker/link?app_key=d836ea4ff92716a4f911913fbbfce2db&validation_action=default&validation_params=${encodeURIComponent(JSON.stringify({ title: shareTitle, description: shareText, url: shareUrl }))}`;
    
    // 카카오 웹 공유 팝업 시도
    const width = 450;
    const height = 650;
    const left = typeof window !== 'undefined' ? Math.max(0, (window.screen.width - width) / 2) : 100;
    const top = typeof window !== 'undefined' ? Math.max(0, (window.screen.height - height) / 2) : 100;
    
    const popup = window.open(
      kakaoWebUrl,
      'KakaoSharePopup',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // 팝업 차단 시 클립보드 복사 안내 유지
      alert(isJapanese ? 'クリップボードに推薦メッセージがコピーされました！' : '카카오톡에 붙여넣을 수 있도록 추천 메시지와 링크가 복사되었습니다!');
    }
  };

  // 2. 라인(LINE)으로 추천하기
  const handleLineShare = async () => {
    await copyToClipboard();
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`;
    window.open(lineUrl, '_blank', 'noopener,noreferrer');
  };

  // 3. URL 및 메시지 복사하기
  const handleCopyLink = async () => {
    await copyToClipboard();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border-2 border-stone-200 overflow-hidden flex flex-col">
        {/* 상단 헤더 */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-stone-950 p-4 flex items-center justify-between shrink-0 shadow-xs border-b border-amber-400">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-white/90 text-stone-950 flex items-center justify-center text-base font-black shadow-2xs">
              📢
            </span>
            <div>
              <div className="text-base font-black leading-tight">
                {isJapanese ? 'PARKY アプリを推薦する' : isEnglish ? 'Recommend PARKY App' : '파키(PARKY) 앱 추천하기'}
              </div>
              <div className="text-[10.5px] font-bold text-amber-950/80">
                {isJapanese ? '友人にワンタッチでアプリを紹介' : '동반 골퍼·친구에게 원터치로 앱 소개'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white active:scale-95 text-stone-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 바디 컨텐츠 */}
        <div className="p-4 space-y-3">
          {/* 복사 성공 토스트 알림 */}
          {copied && (
            <div className="bg-emerald-600 text-white text-xs font-black p-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 animate-in zoom-in-95 duration-150">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {isJapanese
                  ? '推薦リンクがコピーされました！'
                  : '추천 링크와 메시지가 복사되었습니다!'}
              </span>
            </div>
          )}

          {/* 3대 추천 방식 선택 버튼들 */}
          <div className="space-y-2.5">
            {/* 1. 카카오톡으로 추천하기 */}
            <button
              type="button"
              onClick={handleKakaoShare}
              className="w-full py-3.5 px-4 bg-[#FEE500] hover:bg-[#FADA0A] active:scale-[0.98] text-[#191919] rounded-2xl font-black text-sm shadow-md border border-[#E6CF00] flex items-center justify-between transition cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-[#191919] text-[#FEE500] flex items-center justify-center text-xs font-black shadow-2xs">
                  💬
                </span>
                <span className="text-sm font-black">
                  {isJapanese ? 'カカオトークで推薦する' : '카카오톡으로 추천하기'}
                </span>
              </div>
              <span className="text-xs font-black text-[#381E1F] bg-white/60 group-hover:bg-white px-2.5 py-1 rounded-xl transition">
                {isJapanese ? '共有 ▶' : '바로가기 ▶'}
              </span>
            </button>

            {/* 2. 라인(LINE)으로 추천하기 */}
            <button
              type="button"
              onClick={handleLineShare}
              className="w-full py-3.5 px-4 bg-[#06C755] hover:bg-[#05b34c] active:scale-[0.98] text-white rounded-2xl font-black text-sm shadow-md border border-[#04a044] flex items-center justify-between transition cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-white text-[#06C755] flex items-center justify-center text-xs font-black shadow-2xs">
                  LINE
                </span>
                <span className="text-sm font-black">
                  {isJapanese ? 'LINEで推薦する' : '라인(LINE)으로 추천하기'}
                </span>
              </div>
              <span className="text-xs font-black text-emerald-950 bg-white/90 group-hover:bg-white px-2.5 py-1 rounded-xl transition">
                {isJapanese ? '送信 ▶' : '바로가기 ▶'}
              </span>
            </button>

            {/* 3. URL 복사하기 */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-3.5 px-4 bg-stone-100 hover:bg-stone-200 active:scale-[0.98] text-stone-900 rounded-2xl font-black text-sm shadow-sm border-2 border-stone-300 flex items-center justify-between transition cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-stone-800 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                  🔗
                </span>
                <span className="text-sm font-black">
                  {isJapanese ? '推薦リンク(URL)をコピー' : '추천 링크(URL) 복사하기'}
                </span>
              </div>
              <span className="text-xs font-black text-stone-700 bg-white group-hover:bg-white px-2.5 py-1 rounded-xl border border-stone-200 transition">
                {copied ? '복사됨 ✓' : '복사 ▶'}
              </span>
            </button>
          </div>

          {/* 추천 메시지 미리보기 박스 */}
          <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 text-left space-y-1">
            <div className="flex items-center justify-between text-[10.5px] font-bold text-stone-500">
              <span>{isJapanese ? '送信メッセージプレビュー' : '전송될 추천 메시지 미리보기'}</span>
              <span className="text-emerald-700 font-black">
                {isJapanese ? '公式リンク' : '공식 인증'}
              </span>
            </div>
            <div className="text-xs text-stone-800 font-medium whitespace-pre-line bg-white p-2.5 rounded-xl border border-stone-200/80 leading-relaxed break-all">
              {shareText}
            </div>
          </div>
        </div>

        {/* 하단 닫기 */}
        <div className="p-3 bg-stone-100 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-white hover:bg-stone-50 active:scale-98 border border-stone-300 rounded-xl text-xs font-black text-stone-700 transition cursor-pointer shadow-2xs"
          >
            {isJapanese ? '閉じる' : '✕ 닫기'}
          </button>
        </div>
      </div>
    </div>
  );
}
