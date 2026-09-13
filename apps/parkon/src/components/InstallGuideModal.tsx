'use client';

import React, { useState, useEffect } from 'react';
import { X, Smartphone, Laptop, CheckCircle, ExternalLink } from 'lucide-react';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
}

export function InstallGuideModal({ isOpen, onClose, deferredPrompt: initialPrompt }: InstallGuideModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(initialPrompt || null);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isKakao, setIsKakao] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'AUTO' | 'PC' | 'MOBILE'>('AUTO');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|mobile/.test(userAgent);
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const kakao = userAgent.includes('kakaotalk');

    setIsDesktop(!isMobile);
    setIsIos(ios);
    setIsKakao(kakao);
    setActiveTab(!isMobile ? 'PC' : 'MOBILE');

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {activeTab === 'PC' ? (
              <Laptop className="w-5 h-5 text-yellow-300" />
            ) : (
              <Smartphone className="w-5 h-5 text-yellow-300" />
            )}
            <h3 className="font-extrabold text-base">
              {activeTab === 'PC' ? 'PC 바탕화면 앱 설치' : '스마트폰 바탕화면 앱 추가'}
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

        {/* 기기 선택 탭 (PC / 모바일 전환 가능) */}
        <div className="flex border-b border-stone-200 bg-stone-50 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('PC')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition border-b-2 cursor-pointer ${
              activeTab === 'PC'
                ? 'border-emerald-700 text-emerald-900 bg-white font-black'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>PC (컴퓨터) 설치</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MOBILE')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition border-b-2 cursor-pointer ${
              activeTab === 'MOBILE'
                ? 'border-emerald-700 text-emerald-900 bg-white font-black'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>스마트폰 (모바일) 설치</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-stone-800 overflow-y-auto">
          {/* 기존 구버전 삭제 안내 (공통) */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 leading-relaxed">
            <div className="font-extrabold flex items-center gap-1.5 text-red-800 mb-1">
              <span className="text-sm">⚠️</span>
              <span className="font-black">[기존 사용자 필독] 옛날 바로가기는 먼저 삭제!</span>
            </div>
            <p className="text-[11px] text-red-700 font-medium leading-normal">
              이전 임시 테스트 주소 시절 추가된 바로가기 아이콘은 바탕화면에서 <strong>꾹 눌러 [삭제]</strong>하신 후, 아래 방법으로 새로 설치하셔야 공식 주소(parkongolf.com)와 파키 심볼로 연결됩니다.
            </p>
          </div>

          {/* 앱 아이콘 미리보기 */}
          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.png"
              alt="파크온 앱 아이콘"
              className="w-12 h-12 rounded-2xl shadow-md border-2 border-amber-300 shrink-0 object-cover"
            />
            <div className="min-w-0">
              <div className="text-xs font-black text-emerald-950 flex items-center gap-1">
                <span>{activeTab === 'PC' ? 'PC 바탕화면에 생성되는 파크온 앱' : '스마트폰 바탕화면 파키 아이콘'}</span>
                <span className="bg-amber-400 text-emerald-950 px-1 py-0.2 rounded text-[9px] font-black">
                  공식
                </span>
              </div>
              <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                {activeTab === 'PC'
                  ? '설치하면 주소창 없는 윈도우 독립 창으로 빠르게 실행됩니다.'
                  : '설치 후 누르면 주소창 없는 전체화면 앱으로 바로 실행됩니다.'}
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
              {activeTab === 'PC' ? <Laptop className="w-4 h-4 text-emerald-950" /> : <Smartphone className="w-4 h-4 text-emerald-950" />}
              <span>
                {activeTab === 'PC' ? 'PC 바탕화면에 파크온 1초 자동 설치' : '스마트폰에 바로가기 1초 자동 추가'}
              </span>
            </button>
          )}

          {/* 탭별 설치 방법 안내 */}
          {activeTab === 'PC' ? (
            /* PC (컴퓨터 크롬, 엣지, 웨일 등) 설치 안내 */
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  브라우저(Chrome/Edge) 주소창 맨 오른쪽의{' '}
                  <span className="font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                    [컴퓨터에 앱 설치 💻]
                  </span>{' '}
                  아이콘을 클릭합니다.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  또는 브라우저 오른쪽 상단{' '}
                  <span className="font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                    더보기 메뉴 [⋮] ➔ [저장 및 공유] ➔ [파크온 설치]
                  </span>{' '}
                  (또는 바로가기 만들기)를 누릅니다.
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  컴퓨터 바탕화면과 시작 메뉴, 작업표시줄에 스마트폰 앱처럼 깔끔한 파크온 독립 프로그램이 생성됩니다!
                </div>
              </div>
            </div>
          ) : isKakao ? (
            /* 카카오톡 인앱 브라우저 안내 */
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 leading-relaxed font-bold">
                ⚠️ 카카오톡 안에서는 앱 설치가 제한됩니다. <span className="underline text-emerald-800">외부 브라우저로 1번만 열어주세요</span>:
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <div>화면 맨 우측 상단의 <span className="font-black text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded">점 세 개 [⋮]</span> 터치</div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <div>메뉴에서 <span className="font-black text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded">[다른 브라우저로 열기]</span> 터치</div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    3
                  </span>
                  <div>열린 크롬/사파리에서 <span className="font-black text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded">[홈 화면에 추가]</span>를 누르면 완료!</div>
                </div>
              </div>
            </div>
          ) : isIos ? (
            /* 아이폰 사파리 안내 */
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  1
                </span>
                <div>사파리 화면 하단 중앙의 <span className="font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">공유 버튼 [⎋]</span> 터치</div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  2
                </span>
                <div>메뉴를 위로 살짝 올려서 <span className="font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">[홈 화면에 추가]</span> 터치</div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  3
                </span>
                <div>우측 상단의 <span className="font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">[추가]</span>를 누르면 바탕화면에 파키 아이콘 생성 완료!</div>
              </div>
            </div>
          ) : (
            /* 안드로이드 크롬/삼성인터넷 안내 */
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  1
                </span>
                <div>브라우저 우측 상단(또는 하단)의 <span className="font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">더보기 메뉴 [⋮]</span> 터치</div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  2
                </span>
                <div><span className="font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">[앱 설치]</span> 또는 <span className="font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">[홈 화면에 추가]</span> 터치</div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  3
                </span>
                <div>바탕화면에 생성된 귀여운 파키 아이콘을 누르면 전체화면 전용 앱으로 바로 열립니다!</div>
              </div>
            </div>
          )}

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
