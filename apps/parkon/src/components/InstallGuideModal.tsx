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
  const [mobileSubTab, setMobileSubTab] = useState<'KAKAO' | 'CHROME' | 'IOS'>('KAKAO');

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
    setMobileSubTab(ios ? 'IOS' : 'KAKAO');

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
          ) : (
            /* 스마트폰 (모바일) 설치 안내 - 시니어 맞춤 3단 분기 */
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
                  <span className="text-[11px] leading-tight font-black">카톡 링크 (필독)</span>
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
                  <span className="text-[11px] leading-tight font-black">크롬 · 삼성인터넷</span>
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
                  <span className="text-[11px] leading-tight font-black">아이폰 (사파리)</span>
                </button>
              </div>

              {/* 1) 카카오톡 링크로 접속한 경우 (가장 많은 시니어 사례) */}
              {mobileSubTab === 'KAKAO' && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs text-amber-950 leading-relaxed font-bold">
                    <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs mb-1">
                      <span>⚠️</span>
                      <span>카카오톡 화면 안에서는 앱 설치가 제한됩니다!</span>
                    </div>
                    카톡 내부에서는 보안상 바로 깔리지 않으므로, <strong className="underline text-emerald-900 font-black">아래 5단계 순서대로 딱 1번만</strong> 진행하시면 스마트폰 바탕화면에 정상적으로 깔립니다:
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
                        <div className="mt-1.5 p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 font-bold leading-normal">
                          💡 <strong>왜 3번째를 눌러야 하나요?</strong><br />
                          카톡 화면 안에서는 앱 설치 기능이 없기 때문에, 이 3번째 버튼을 눌러야 <strong>크롬(Chrome)이나 삼성인터넷 새 창</strong>으로 전환되어 앱 설치가 가능해집니다!
                        </div>
                      </div>
                    </div>

                    {/* 3단계 */}
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border-2 border-amber-200 shadow-xs">
                      <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-xs">
                        3
                      </span>
                      <div className="leading-relaxed">
                        크롬(Chrome)이나 인터넷 새 창이 뜨면, 화면 <strong className="text-emerald-900 font-black">우측 상단 (또는 우측 하단)</strong>의{' '}
                        <span className="font-black text-emerald-950 bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300">
                          점 세 개 [⋮] (더보기 메뉴)
                        </span>{' '}
                        를 다시 한번 터치합니다.
                      </div>
                    </div>

                    {/* 4단계 */}
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border-2 border-emerald-300 shadow-xs">
                      <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-xs">
                        4
                      </span>
                      <div className="leading-relaxed">
                        메뉴 목록에서{' '}
                        <span className="font-black text-white bg-emerald-700 px-2 py-0.5 rounded shadow-xs inline-block my-0.5">
                          [앱 설치]
                        </span>{' '}
                        또는{' '}
                        <span className="font-black text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 inline-block my-0.5">
                          [홈 화면에 추가]
                        </span>{' '}
                        (또는 다운로드 및 설치하기)를 터치합니다.
                      </div>
                    </div>

                    {/* 5단계 */}
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-400 shadow-xs">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-xs">
                        5
                      </span>
                      <div className="leading-relaxed">
                        화면에 뜨는 팝업창에서{' '}
                        <span className="font-black text-emerald-950 bg-amber-300 px-1.5 py-0.5 rounded border border-amber-400">
                          [설치]
                        </span>{' '}
                        또는 [추가]를 누르면 완료!
                        <p className="text-[11px] text-emerald-900 font-extrabold mt-1.5">
                          🎉 스마트폰 바탕화면에 귀여운 <strong>파키 골프공 아이콘 앱</strong>이 쏙 깔렸습니다! 앞으로는 이 아이콘만 누르면 주소창 없이 1초 만에 바로 열립니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2) 크롬 / 삼성인터넷으로 직접 접속한 경우 */}
              {mobileSubTab === 'CHROME' && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed font-bold">
                    🌐 크롬(Chrome) 또는 삼성인터넷 브라우저로 직접 접속하신 경우 아래 순서대로 1초 만에 설치하실 수 있습니다:
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-stone-200 shadow-xs">
                      <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        1
                      </span>
                      <div className="leading-relaxed">
                        화면 <strong className="text-emerald-900">우측 상단 (또는 우측 하단)</strong>의{' '}
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
                          [홈 화면에 추가]
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
                        <span className="font-black text-emerald-950 bg-amber-300 px-1.5 py-0.5 rounded">
                          [설치]
                        </span>{' '}
                        또는 [추가]를 누르면 스마트폰 바탕화면에 즉시 설치 완료됩니다!
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3) 아이폰 사파리 사용자인 경우 */}
              {mobileSubTab === 'IOS' && (
                <div className="space-y-3">
                  <div className="p-3 bg-stone-100 border border-stone-300 rounded-2xl text-xs text-stone-800 leading-relaxed font-bold">
                    🍎 아이폰(Safari 사파리)에서는 아래 순서대로 홈 화면에 추가하시면 됩니다:
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-stone-200 shadow-xs">
                      <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        1
                      </span>
                      <div className="leading-relaxed">
                        사파리 화면 <strong className="text-emerald-900">맨 아래 중앙</strong>의{' '}
                        <span className="font-black text-emerald-950 bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300">
                          공유 버튼 [⎋] (네모 위 화살표)
                        </span>{' '}
                        를 터치합니다.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white border border-stone-200 shadow-xs">
                      <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        2
                      </span>
                      <div className="leading-relaxed">
                        메뉴를 위로 살짝 올려서{' '}
                        <span className="font-black text-white bg-emerald-700 px-2 py-0.5 rounded shadow-xs">
                          [홈 화면에 추가 (+)]
                        </span>{' '}
                        를 터치합니다.
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-xs">
                      <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        3
                      </span>
                      <div className="leading-relaxed">
                        화면 오른쪽 상단의{' '}
                        <span className="font-black text-emerald-950 bg-amber-300 px-1.5 py-0.5 rounded">
                          [추가]
                        </span>{' '}
                        를 누르면 아이폰 바탕화면에 파키 아이콘이 생성됩니다!
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
