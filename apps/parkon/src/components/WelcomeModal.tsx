'use client';

import React, { useEffect, useState } from 'react';
import { X, Smartphone, Play, Sparkles, CheckCircle2, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { ParkOnStorage, KakaoAuthUser } from '@/lib/storage';

interface WelcomeModalProps {
  onOpenKakaoLogin?: () => void;
  onOpenInstallGuide?: () => void;
}

export function WelcomeModal({ onOpenKakaoLogin, onOpenInstallGuide }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isWelcomed = localStorage.getItem('parkon_welcomed') === 'true';
    const hasKakao = Boolean(ParkOnStorage.getKakaoUser());
    const prof = ParkOnStorage.getUserProfile();
    const hasNamedProfile = Boolean(
      prof?.userName &&
      prof.userName !== '플레이어' &&
      prof.userName !== '조장(본인)' &&
      prof.userName !== '본인'
    );

    // 첫 방문자(또는 미등록 사용자)에게 2가지 관문 팝업 오픈
    if (!isWelcomed && !hasKakao && !hasNamedProfile) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStartWithGuestName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const effectiveName = guestName.trim() || '나이스버디';
    const profile = ParkOnStorage.getUserProfile();
    ParkOnStorage.saveUserProfile({
      ...profile,
      userName: effectiveName,
    });
    const guestUser: KakaoAuthUser = {
      id: 'guest_' + Date.now(),
      nickname: effectiveName,
      realName: effectiveName,
      aliasName: effectiveName,
      preferredDisplay: 'REAL',
      connectedAt: new Date().toISOString(),
    };
    ParkOnStorage.setKakaoUser(guestUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('parkon_welcomed', 'true');
    }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('parkon_profile_updated', { detail: { newName: effectiveName } }));
    setIsOpen(false);
  };

  const handleKakaoLogin = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parkon_welcomed', 'true');
    }
    setIsOpen(false);
    if (onOpenKakaoLogin) {
      onOpenKakaoLogin();
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parkon_welcomed', 'true');
    }
    setIsOpen(false);
  };

  const handleInstallAndUse = () => {
    if (onOpenInstallGuide) {
      onOpenInstallGuide();
    } else {
      window.dispatchEvent(new CustomEvent('parkon_open_install_guide'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scaleUp overflow-hidden border border-emerald-100 flex flex-col max-h-[92vh]">
        {/* 고정 상단 헤더: 언제든 바로 닫을 수 있는 X 버튼 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 shrink-0 bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shadow-xs">
              ⛳
            </span>
            <span className="text-xs font-black tracking-tight">
              파크온(PARKON) 첫 방문 환영
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-emerald-800/80 hover:bg-emerald-900 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition active:scale-95"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 스크롤 가능한 본문 */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 overscroll-contain text-center">
          {/* 공식 마스코트 파키 웰컴 사진 */}
          <div className="relative rounded-2xl overflow-hidden shadow-md border-2 border-emerald-300/80 bg-stone-100 aspect-square max-w-[200px] mx-auto group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/사진저장고_사진_20260913_28.jpg"
              alt="파크온 공식 마스코트 파키 환영인사"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-emerald-950/80 via-emerald-950/40 to-transparent p-1.5 text-white">
              <span className="text-[10px] font-black bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full shadow-xs inline-flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 fill-emerald-950" />
                <span>공식 마스코트 파키(Parky)</span>
              </span>
            </div>
          </div>

          {/* 환영 메시지 */}
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
              대한민국 No.1 파크골프 길라잡이<br />
              <span className="text-emerald-700">파크온(PARKON)</span>에 오신 것을 환영합니다!
            </h2>
            <p className="text-[11px] text-stone-500 font-medium">
              원하시는 시작 방식을 선택해 주세요.
            </p>
          </div>

          {/* [선택 1] 카카오 1초 로그인 (회원 모드 · 추천) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-yellow-50/50 to-emerald-50/70 border-2 border-amber-400 shadow-sm space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-white bg-emerald-700 px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300" />
                <span>추천 · 정식 회원</span>
              </span>
              <span className="text-[10px] font-black text-amber-800">기록 평생 보존 ⭐</span>
            </div>

            <h3 className="text-xs sm:text-sm font-black text-stone-900 leading-tight">
              카카오 1초 로그인하고 내 기록 평생 보존하기
            </h3>

            <ul className="text-[11px] text-stone-700 font-bold space-y-1 pl-0.5">
              <li className="flex items-center gap-1">
                <span className="text-emerald-700 font-black">✓</span> 18홀 전적 및 타수 스코어 100% 영구 보존
              </li>
              <li className="flex items-center gap-1">
                <span className="text-emerald-700 font-black">✓</span> 1~5스타 전국 공인 핸디캡 & 등급 랭킹 부여
              </li>
              <li className="flex items-center gap-1">
                <span className="text-emerald-700 font-black">✓</span> 동호인 디지털 명함 교환 & 1촌 인맥 등록
              </li>
            </ul>

            <button
              type="button"
              onClick={handleKakaoLogin}
              className="w-full py-3 bg-[#FEE500] hover:bg-[#FDD835] active:scale-95 text-[#191919] font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer border border-[#E6CF00] mt-1"
            >
              <span className="text-sm leading-none">💬</span>
              <span>⚡ 카카오 1초 로그인하고 시작하기</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#191919]" />
            </button>
          </div>

          {/* 구분선 */}
          <div className="relative flex py-0.5 items-center">
            <div className="flex-grow border-t border-stone-200"></div>
            <span className="flex-shrink mx-3 text-stone-400 text-[11px] font-bold">또는</span>
            <div className="flex-grow border-t border-stone-200"></div>
          </div>

          {/* [선택 2] 내 이름(별명) 치고 바로 가상 체험하기 (로그인 없이 즉시 시작) */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border-2 border-stone-200 hover:border-emerald-300 transition space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-stone-700 bg-stone-200 px-2 py-0.5 rounded-full">
                체험 모드
              </span>
              <span className="text-[10px] font-bold text-stone-500">로그인 불필요 · 3초 시작</span>
            </div>

            <div>
              <h3 className="text-xs sm:text-sm font-black text-stone-900 leading-tight">
                🎯 내 이름(별명) 넣고 바로 가상 체험하기
              </h3>
              <p className="text-[10.5px] text-stone-500 font-medium mt-0.5">
                로그인 없이 이름만 치고 3초 만에 가상 라운딩과 전국 400개 구장을 둘러보세요.
              </p>
            </div>

            <form onSubmit={handleStartWithGuestName} className="space-y-2 pt-0.5">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="이름 또는 별명 입력 (예: 홍길동, 나이스버디)"
                maxLength={12}
                className="w-full px-3 py-2 bg-white border-2 border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 rounded-xl font-black text-xs text-stone-900 placeholder:text-stone-400 outline-hidden transition"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-stone-900 hover:bg-black active:scale-95 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>
                  {guestName.trim() ? `'${guestName.trim()}'(으)로` : '내 이름으로'} 가상 체험 시작하기
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
            </form>
          </div>

          {/* 하단 스마트폰 홈 화면 앱 설치 안내 링크 */}
          <div className="pt-1 flex items-center justify-center gap-1 text-[11px] text-stone-500">
            <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
            <button
              type="button"
              onClick={handleInstallAndUse}
              className="font-black text-emerald-700 hover:underline cursor-pointer"
            >
              스마트폰 홈 화면에 1초 앱 깔아서 사용하기 &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
