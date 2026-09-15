'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HelpCircle, MapPin, AlertTriangle, Trophy } from 'lucide-react';
import { ParkOnStorage, KakaoAuthUser } from '@/lib/storage';
import { KakaoLoginModal } from './KakaoLoginModal';

interface NavGuardInfo {
  url: string;
  type: 'HOME' | 'RULES' | 'COURSES';
  title: string;
  desc: string;
  icon: string;
  confirmText: string;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [showKakaoModal, setShowKakaoModal] = useState(false);
  const [kakaoUser, setKakaoUser] = useState<KakaoAuthUser | null>(null);
  const [pendingGuard, setPendingGuard] = useState<NavGuardInfo | null>(null);

  // 현재 라운딩 진행 중인 화면인지 여부 감지 (/round/[id] 등, /round/new 및 /round/result 제외)
  const isPlayingRound = Boolean(
    pathname?.startsWith('/round/') &&
    pathname !== '/round/new' &&
    pathname !== '/round/result'
  );

  useEffect(() => {
    const checkUser = () => {
      setKakaoUser(ParkOnStorage.getKakaoUser());
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    window.addEventListener('parkon_profile_updated', checkUser);
    window.addEventListener('parkon_round_player_sync', checkUser);
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('parkon_profile_updated', checkUser);
      window.removeEventListener('parkon_round_player_sync', checkUser);
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent, url: string, type: 'HOME' | 'RULES' | 'COURSES') => {
    if (isPlayingRound) {
      e.preventDefault();
      if (type === 'HOME') {
        setPendingGuard({
          url: '/',
          type: 'HOME',
          icon: '🏠',
          title: '홈(바탕화면)으로 돌아가시겠습니까?',
          desc: '현재 게임 진행 중입니다. 주머니 터치나 실수로 잘못 누르신 경우 [계속 라운딩하기]를 누르면 경기 화면이 그대로 유지됩니다.\n\n나가시더라도 스코어는 안전하게 자동 보존되며, 홈 상단 배너를 통해 언제든 그대로 이어하실 수 있습니다.',
          confirmText: '확인 (홈으로 나가기)',
        });
      } else if (type === 'RULES') {
        setPendingGuard({
          url: '/rules',
          type: 'RULES',
          icon: '❓',
          title: '지금 라운드 중에 룰 질문을 하시겠습니까?',
          desc: '현재 진행 중인 경기 기록은 안전하게 자동 보존됩니다.\n\n파크골프 규정집 및 AI 룰 솔로몬에서 궁금한 점을 질문하고 확인하신 후, 언제든 라운드로 복귀하실 수 있습니다.',
          confirmText: '확인 (룰 질문하기)',
        });
      } else if (type === 'COURSES') {
        setPendingGuard({
          url: '/courses',
          type: 'COURSES',
          icon: '📍',
          title: '전국 구장 찾기로 이동하시겠습니까?',
          desc: '현재 게임 진행 중입니다. 주머니에 넣거나 실수로 잘못 누르셨다면 [계속 라운딩하기]를 눌러 경기 화면을 유지하세요.\n\n구장 검색 후 언제든 상단 배너로 현재 라운드에 복귀하실 수 있습니다.',
          confirmText: '확인 (구장 찾기)',
        });
      }
    }
  };

  const executeConfirmedNav = () => {
    if (pendingGuard) {
      const targetUrl = pendingGuard.url;
      setPendingGuard(null);
      router.push(targetUrl);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-emerald-700 text-white shadow-md">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, '/', 'HOME')}
            className="flex items-center gap-2.5 group shrink-0"
          >
            {/* 공식 마스코트 파키 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="relative shrink-0">
              <img
                src="/parky.jpg"
                alt="파크온 마스코트 파키"
                className="w-9 h-9 rounded-full shadow-md border-2 border-amber-300 object-cover"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-emerald-950 rounded-full px-1 text-[8px] font-black shadow-xs">
                파키
              </span>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white whitespace-nowrap">
              파크온
            </span>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* 카카오 로그인 / 프로필 활동명 버튼 */}
            {kakaoUser ? (
              <button
                type="button"
                onClick={() => setShowKakaoModal(true)}
                className="bg-emerald-800 hover:bg-emerald-900 text-yellow-300 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1 border border-emerald-600/80 cursor-pointer shadow-xs transition active:scale-95 whitespace-nowrap"
                title="내 프로필 및 활동명 관리"
              >
                <span className="text-xs leading-none">💬</span>
                <span className="max-w-[75px] truncate font-extrabold">
                  {ParkOnStorage.getUserDisplayName()}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowKakaoModal(true)}
                className="bg-emerald-800 hover:bg-emerald-900 text-yellow-300 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1 border border-emerald-600/80 cursor-pointer shadow-xs transition active:scale-95 whitespace-nowrap"
                title="카카오 로그인 및 내 활동명 설정"
              >
                <span className="text-xs leading-none">💬</span>
                <span className="max-w-[75px] truncate font-extrabold">
                  {ParkOnStorage.getUserDisplayName()}
                </span>
              </button>
            )}

            {/* 0. 나의 파크골프 연대기 & 1촌 */}
            <Link
              href="/chronicle"
              className="w-9 h-9 rounded-full bg-white hover:bg-amber-100 text-emerald-800 hover:text-amber-950 border-2 border-amber-300 shadow-md flex items-center justify-center transition active:scale-95 shrink-0"
              title="나의 파크골프 연대기 & 1촌 명부"
            >
              <Trophy className="w-5 h-5 text-amber-600 stroke-[2.5]" />
            </Link>

            {/* 1. 룰 솔로몬 (물음표) 버튼 */}
            <Link
              href="/rules"
              onClick={(e) => handleNavClick(e, '/rules', 'RULES')}
              className="w-9 h-9 rounded-full bg-white hover:bg-amber-100 text-emerald-800 hover:text-amber-950 border-2 border-amber-300 shadow-md flex items-center justify-center transition active:scale-95 shrink-0"
              title="파크골프 규정 & AI 룰 솔로몬"
            >
              <HelpCircle className="w-5 h-5 stroke-[2.5]" />
            </Link>

            {/* 2. 전국 구장 (장소 찾기) 버튼 */}
            <Link
              href="/courses"
              onClick={(e) => handleNavClick(e, '/courses', 'COURSES')}
              className="w-9 h-9 rounded-full bg-white hover:bg-amber-100 text-emerald-800 hover:text-amber-950 border-2 border-amber-300 shadow-md flex items-center justify-center transition active:scale-95 shrink-0"
              title="전국 파크골프장 찾기"
            >
              <MapPin className="w-5 h-5 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </header>

      {/* ⚠️ 라운드 진행 중 오터치/주머니 방지 안내 모달 */}
      {pendingGuard && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border border-stone-200 animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-900 text-xl shadow-xs shrink-0">
                  {pendingGuard.icon}
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 leading-tight">
                    {pendingGuard.title}
                  </h3>
                  <p className="text-[11px] text-amber-700 font-bold">
                    ⚠️ 라운드 진행 중 오터치 방지 안내
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingGuard(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2">
              <p className="text-xs text-stone-700 leading-relaxed font-semibold whitespace-pre-line">
                {pendingGuard.desc}
              </p>
            </div>

            {/* Actions: Cancel is primary, high-visibility and safe */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingGuard(null)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 px-4 rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
              >
                <span>✓ 계속 라운딩하기 (원상태 유지)</span>
              </button>
              <button
                type="button"
                onClick={executeConfirmedNav}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold py-2.5 px-4 rounded-xl text-xs transition active:scale-[0.98] cursor-pointer"
              >
                <span>{pendingGuard.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카카오 로그인 모달 */}
      <KakaoLoginModal
        isOpen={showKakaoModal}
        onClose={() => {
          setShowKakaoModal(false);
          setKakaoUser(ParkOnStorage.getKakaoUser());
        }}
        onLoginSuccess={(user) => {
          setKakaoUser(user);
        }}
      />
    </>
  );
}
