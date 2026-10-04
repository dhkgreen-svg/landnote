'use client';

import React, { useState, useEffect } from 'react';
import { X, Smartphone, Laptop, CheckCircle, ExternalLink, Copy, Check, Rocket } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { escapeKakaoTalk, copyCurrentUrl, isKakaoTalkWebView, isIOS, isAndroid } from '@/lib/kakaoEscape';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  initialTab?: 'KAKAO' | 'CHROME' | 'IOS';
}

export function InstallGuideModal({ isOpen, onClose, deferredPrompt: initialPrompt, initialTab }: InstallGuideModalProps) {
  const { isJapanese, isEnglish } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(initialPrompt || null);
  const [mobileSubTab, setMobileSubTab] = useState<'KAKAO' | 'CHROME' | 'IOS'>('KAKAO');
  const [showPcOption, setShowPcOption] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialPrompt) {
      setDeferredPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isOpen) return;

    if (initialTab) {
      setMobileSubTab(initialTab);
    } else if (isKakaoTalkWebView()) {
      setMobileSubTab('KAKAO');
    } else if (isIOS()) {
      setMobileSubTab('IOS');
    } else {
      setMobileSubTab('CHROME');
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    if (deferredPrompt && deferredPrompt.prompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          try {
            localStorage.setItem('parkon_app_installed', 'true');
          } catch {}
          onClose();
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Install prompt error', err);
      }
    }
  };

  const handleCopyUrl = async () => {
    const success = await copyCurrentUrl();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleKakaoEscape = () => {
    escapeKakaoTalk();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-xs flex items-start justify-center p-2.5 sm:p-4 pt-3 sm:pt-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-yellow-300" />
            <h3 className="font-extrabold text-base">
              {isJapanese ? 'スマホ画面にアプリ追加' : isEnglish ? 'Add App to Home Screen' : '스마트폰 바탕화면 앱 추가'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 text-stone-800 overflow-y-auto">
          {/* 앱 아이콘 미리보기 */}
          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/parky.jpg"
              alt="파크골프 올인원 마스코트 파키"
              className="w-14 h-14 rounded-2xl shadow-md border-2 border-amber-300 shrink-0 object-cover"
            />
            <div className="min-w-0">
              <div className="text-xs font-black text-emerald-950 flex items-center gap-1">
                <span>{isJapanese ? 'スマホ画面 パッキー公式アイコン' : isEnglish ? 'Official Parky App Icon' : '바탕화면 파키 공식 앱 아이콘'}</span>
                <span className="bg-amber-400 text-emerald-950 px-1.5 py-0.2 rounded text-[9px] font-black shadow-xs">
                  {isJapanese ? '公式' : isEnglish ? 'Official' : '공식'}
                </span>
              </div>
              <div className="text-[11px] text-emerald-800 font-medium mt-0.5 leading-snug">
                {isJapanese
                  ? 'インストール後はアドレスバーのない全画面専用アプリで素早く起動します。'
                  : isEnglish
                  ? 'Launches instantly as a fullscreen app without an address bar.'
                  : '설치 후 누르면 주소창 없는 전체화면 전용 앱으로 1초 만에 실행됩니다.'}
              </div>
            </div>
          </div>

          {/* 브라우저가 원클릭 설치 지원 시 자동 버튼 노출 */}
          {deferredPrompt && (
            <button
              type="button"
              onClick={handleDirectInstall}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:brightness-105 active:scale-98 text-emerald-950 font-black text-xs rounded-xl shadow-md border border-amber-300 flex items-center justify-center gap-2 cursor-pointer transition animate-bounce"
            >
              <Smartphone className="w-4 h-4 text-emerald-950" />
              <span>{isJapanese ? '📲 スマホ画面に1秒自動追加' : isEnglish ? '📲 1-Sec Auto Install' : '스마트폰에 바로가기 1초 자동 추가'}</span>
            </button>
          )}

          {/* 스마트폰 (모바일) 설치 안내 - 시니어 맞춤 3단 분기 */}
          <div className="space-y-3">
            {/* 모바일 브라우저 유형 선택 탭 */}
            <div className="p-1 bg-stone-100 rounded-xl border border-stone-200 grid grid-cols-3 gap-1 text-xs font-black">
              <button
                type="button"
                onClick={() => setMobileSubTab('KAKAO')}
                className={`py-2 px-1.5 rounded-lg transition cursor-pointer flex flex-col items-center justify-center gap-0.5 text-center ${
                  mobileSubTab === 'KAKAO'
                    ? 'bg-amber-400 text-emerald-950 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="text-sm">💬</span>
                <span className="text-[11px] leading-tight font-black">
                  {isJapanese ? 'LINE / リンク' : isEnglish ? 'Link' : '카톡 링크 (필독)'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMobileSubTab('CHROME')}
                className={`py-2 px-1.5 rounded-lg transition cursor-pointer flex flex-col items-center justify-center gap-0.5 text-center ${
                  mobileSubTab === 'CHROME'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="text-sm">🌐</span>
                <span className="text-[11px] leading-tight font-black">
                  {isJapanese ? 'Chrome / Android' : isEnglish ? 'Chrome' : '크롬 · 삼성인터넷'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMobileSubTab('IOS')}
                className={`py-2 px-1.5 rounded-lg transition cursor-pointer flex flex-col items-center justify-center gap-0.5 text-center ${
                  mobileSubTab === 'IOS'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="text-sm">🍎</span>
                <span className="text-[11px] leading-tight font-black">
                  {isJapanese ? 'iPhone (Safari)' : isEnglish ? 'iPhone' : '아이폰 (사파리)'}
                </span>
              </button>
            </div>

            {/* 1) 카카오톡 링크로 접속한 경우 (Phase 1 카톡 원터치 탈출 엔진 탑재) */}
            {/* 1) 카카오톡 링크로 접속한 경우 */}
            {mobileSubTab === 'KAKAO' && (
              <div className="space-y-3">
                {/* 인터넷 창 바로 열기 액션 박스 */}
                <div className="p-3.5 bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100 border-2 border-amber-400 rounded-2xl shadow-sm text-center">
                  <div className="flex items-center justify-center gap-1.5 text-amber-950 font-black text-xs mb-1">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    <span>{isJapanese ? 'LINE・カカオ画面内ではアプリ追加が制限されます' : '카카오톡 화면 안에서는 앱 추가가 제한됩니다'}</span>
                  </div>
                  <p className="text-[11px] text-amber-900 font-semibold mb-3">
                    {isJapanese
                      ? '下のボタンをタップすると、スマートフォン標準ブラウザ（Safari・Chrome）が開き、すぐにインストールできます：'
                      : '아래 버튼을 누르시면 스마트폰 기본 인터넷 창(크롬·사파리)이 열리며 바탕화면에 바로 설치하실 수 있습니다:'}
                  </p>

                  <button
                    type="button"
                    onClick={handleKakaoEscape}
                    className="w-full py-3 px-3 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 hover:brightness-105 active:scale-98 text-white font-black text-xs rounded-xl shadow-md border-2 border-emerald-500 flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Smartphone className="w-4 h-4 text-yellow-300" />
                    <span>{isJapanese ? '📲 標準ブラウザで開いてアプリ追加' : '📲 기본 인터넷 창으로 열고 앱 설치하기'}</span>
                  </button>

                  {/* 주소 복사 보조 버튼 */}
                  <div className="mt-2.5 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-50 border border-amber-300 text-stone-700 text-[11px] font-bold rounded-lg cursor-pointer transition shadow-2xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                      <span>{isJapanese ? (copied ? 'URLコピー完了！' : 'URLをコピー') : (copied ? '주소 복사 완료!' : '주소(URL) 복사하기')}</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-stone-500 font-bold px-1">
                  {isJapanese ? '💡 画面が自動で開かない場合のみ、以下の手順をご確認ください：' : '💡 혹시 화면이 자동으로 안 뜰 때만 아래 3단계를 확인해 주세요:'}
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* 1단계 */}
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border-2 border-amber-200 shadow-xs">
                    <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-xs">
                      1
                    </span>
                    <div className="leading-relaxed">
                      카카오톡 화면 <strong className="text-emerald-900 font-black">우측 하단 (또는 우측 상단)</strong>의{' '}
                      <span className="font-black text-emerald-950 bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300">
                        점 세 개 [···] 또는 [⋮]
                      </span>{' '}
                      더보기 메뉴를 터치합니다.
                    </div>
                  </div>

                  {/* 2단계 */}
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border-2 border-emerald-300 shadow-xs">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-xs">
                      2
                    </span>
                    <div className="leading-relaxed">
                      나오는 메뉴 목록에서 <strong className="text-rose-600 underline font-black">위에서 3번째</strong>에 있는{' '}
                      <span className="font-black text-white bg-emerald-700 px-2 py-0.5 rounded shadow-xs inline-block my-0.5">
                        [다른 브라우저로 보기]
                      </span>{' '}
                      (또는 다른 브라우저로 열기)를 터치합니다.
                    </div>
                  </div>

                  {/* 3단계 */}
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border-2 border-amber-200 shadow-xs">
                    <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-xs">
                      3
                    </span>
                    <div className="leading-relaxed">
                      크롬(Chrome)이나 인터넷 새 창이 뜨면, 화면 <strong className="text-emerald-900 font-black">우측 상단</strong>의{' '}
                      <span className="font-black text-emerald-950 bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300">
                        점 세 개 [⋮]
                      </span>{' '}
                      를 누르고{' '}
                      <span className="font-black text-white bg-emerald-700 px-1.5 py-0.5 rounded">
                        [앱 설치]
                      </span>{' '}
                      또는 [홈 화면에 추가]를 누르면 완료!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2) 크롬 / 삼성인터넷으로 직접 접속한 경우 */}
            {mobileSubTab === 'CHROME' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed font-bold">
                  🌐 크롬(Chrome) 또는 삼성인터넷 브라우저로 접속 중이십니다:
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-stone-200 shadow-xs">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="leading-relaxed">
                      화면 <strong className="text-emerald-900 font-black">우측 상단 (또는 우측 하단)</strong>의{' '}
                      <span className="font-black text-emerald-950 bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300">
                        점 세 개 [⋮] (더보기 메뉴)
                      </span>{' '}
                      를 터치합니다.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-stone-200 shadow-xs">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="leading-relaxed">
                      메뉴 목록에서{' '}
                      <span className="font-black text-white bg-emerald-700 px-2 py-0.5 rounded shadow-xs">
                        [앱 설치]
                      </span>{' '}
                      또는{' '}
                      <span className="font-black text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        [현재 페이지 추가 ➔ 홈 화면]
                      </span>{' '}
                      를 누릅니다.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-xs">
                    <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="leading-relaxed">
                      확인 팝업에서{' '}
                      <span className="font-black text-emerald-950 bg-amber-300 px-1.5 py-0.5 rounded font-black">
                        [설치]
                      </span>{' '}
                      또는 [추가]를 누르면 스마트폰 바탕화면에 즉시 설치 완료됩니다!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3) 아이폰 사파리 사용자인 경우 (Phase 2 맞춤형 2스텝 대형 가이드) */}
            {mobileSubTab === 'IOS' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-xs text-emerald-950 leading-relaxed font-bold">
                  🍎 아이폰(Safari 사파리)에서는 아래 <strong className="underline text-emerald-900 font-black">2스텝 순서대로</strong> 딱 1번만 홈 화면에 추가하시면 됩니다:
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white border-2 border-emerald-300 shadow-xs">
                    <span className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-sm shrink-0 mt-0.5 shadow-xs">
                      1
                    </span>
                    <div className="leading-relaxed">
                      사파리 화면 <strong className="text-emerald-900 font-black">맨 아래 중앙</strong>의{' '}
                      <span className="inline-flex items-center gap-1 font-black text-emerald-950 bg-amber-200 px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs">
                        공유 버튼 ⎋ <span className="text-[10px] text-emerald-900">(네모 위 화살표)</span>
                      </span>{' '}
                      를 터치합니다.
                      <div className="mt-1 text-[11px] text-stone-500 font-semibold">
                        👇 사파리 브라우저 맨 아랫줄 가운데에 있습니다!
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white border-2 border-amber-300 shadow-xs">
                    <span className="w-7 h-7 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-sm shrink-0 mt-0.5 shadow-xs">
                      2
                    </span>
                    <div className="leading-relaxed">
                      메뉴를 위로 살짝 올려서{' '}
                      <span className="inline-flex items-center gap-1 font-black text-white bg-emerald-700 px-2 py-0.5 rounded-md shadow-xs">
                        [홈 화면에 추가 ➕]
                      </span>{' '}
                      를 터치한 후, 화면 오른쪽 상단의{' '}
                      <span className="font-black text-emerald-950 bg-amber-300 px-1.5 py-0.5 rounded border border-amber-400">
                        [추가]
                      </span>{' '}
                      를 누르면 끝!
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-2xl text-[11px] text-emerald-950 font-bold leading-normal">
                    🎉 아이폰 바탕화면에 귀여운 <strong>파키 공식 앱 아이콘</strong>이 생깁니다!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PC (컴퓨터) 설치 안내 옵션 (접이식) */}
          <div className="pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setShowPcOption(!showPcOption)}
              className="w-full py-2 px-3 text-stone-500 hover:text-stone-800 text-[11px] font-bold flex items-center justify-between rounded-xl bg-stone-50 hover:bg-stone-100 transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-stone-600" />
                <span>컴퓨터(PC) 화면에도 설치하시겠습니까?</span>
              </span>
              <span className="text-[10px] text-emerald-800 font-extrabold">
                {showPcOption ? '닫기 ▲' : '방법 보기 ▼'}
              </span>
            </button>

            {showPcOption && (
              <div className="mt-2 p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5 text-xs text-stone-700 leading-relaxed">
                <div className="font-extrabold text-stone-900 text-xs flex items-center gap-1">
                  💻 PC 크롬/엣지 브라우저에서 설치하는 방법:
                </div>
                <p>1. 브라우저 주소창 맨 오른쪽의 <strong>[앱 설치 💻]</strong> 아이콘을 클릭합니다.</p>
                <p>2. 또는 브라우저 오른쪽 상단 <strong>더보기 [⋮] ➔ [저장 및 공유] ➔ [파크골프 올인원 설치]</strong>를 누릅니다.</p>
                <p className="text-[11px] text-emerald-800 font-bold">
                  바탕화면과 작업표시줄에 스마트폰 앱처럼 깔끔한 파크골프 올인원 독립 프로그램이 생성됩니다!
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl transition mt-2 cursor-pointer shadow-md"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
}
