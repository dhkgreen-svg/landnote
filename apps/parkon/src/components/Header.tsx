'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HelpCircle, MapPin, AlertTriangle, Trophy, Newspaper, Globe } from 'lucide-react';
import { ParkOnStorage, KakaoAuthUser } from '@/lib/storage';
import { KakaoLoginModal } from './KakaoLoginModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';

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
  const { language, setLanguage, t, isJapanese } = useTranslation();

  const [showKakaoModal, setShowKakaoModal] = useState(false);
  const [kakaoUser, setKakaoUser] = useState<KakaoAuthUser | null>(null);
  const [pendingGuard, setPendingGuard] = useState<NavGuardInfo | null>(null);
  const [showLoginTip, setShowLoginTip] = useState(false);
  const [tipUserName, setTipUserName] = useState('');

  // 현재 라운딩 진행 중인 화면인지 여부 감지 (/round/[id] 등, /round/new 및 /round/result 제외)
  const isPlayingRound = Boolean(
    pathname?.startsWith('/round/') &&
    pathname !== '/round/new' &&
    pathname !== '/round/result'
  );

  // 등록된 사용자 이름 산출 (홍길동/플레이어/조장 등 예시값 제외하고 본인 직접 입력 여부 판별)
  const isSampleOrPlaceholder = (name?: string | null) => {
    if (!name) return true;
    const clean = name.trim();
    return (
      !clean ||
      clean === '홍길동' ||
      clean === '홍길동(본인)' ||
      clean === '플레이어' ||
      clean === '조장(본인)' ||
      clean === '본인' ||
      clean === '회원' ||
      clean === '파크골퍼' ||
      clean === '山田太郎' ||
      clean === 'ゲスト'
    );
  };

  const userProfile = typeof window !== 'undefined' ? ParkOnStorage.getUserProfile() : null;
  const rawDisplayName =
    (kakaoUser
      ? (kakaoUser.preferredDisplay === 'ALIAS'
          ? kakaoUser.aliasName || kakaoUser.realName
          : kakaoUser.realName || kakaoUser.nickname)
      : (userProfile?.userName || '')) || '';

  const hasRegisteredName = Boolean(rawDisplayName && !isSampleOrPlaceholder(rawDisplayName));
  const currentDisplayName = hasRegisteredName ? rawDisplayName.trim() : '';

  useEffect(() => {
    const checkUser = () => {
      setKakaoUser(ParkOnStorage.getKakaoUser());
    };
    checkUser();

    const handleShowTip = (e: any) => {
      const name = e.detail?.name || ParkOnStorage.getUserDisplayName();
      setTipUserName(name);
      setShowLoginTip(true);
    };

    window.addEventListener('storage', checkUser);
    window.addEventListener('parkon_profile_updated', checkUser);
    window.addEventListener('parkon_round_player_sync', checkUser);
    window.addEventListener('parkon_show_header_login_tip', handleShowTip);

    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('parkon_profile_updated', checkUser);
      window.removeEventListener('parkon_round_player_sync', checkUser);
      window.removeEventListener('parkon_show_header_login_tip', handleShowTip);
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
          title: isJapanese ? 'ホーム画面に戻りますか？' : '홈(바탕화면)으로 돌아가시겠습니까?',
          desc: isJapanese
            ? '現在ラウンド進行中です。ポケットの中での誤タップや誤操作の場合、[ラウンドを続ける]を押すと現在の画面がそのまま維持されます。\n\n移動してもスコアは安全に自動保存され、ホーム画面上部のバナーからいつでも続きを再開できます。'
            : '현재 게임 진행 중입니다. 주머니 터치나 실수로 잘못 누르신 경우 [계속 라운딩하기]를 누르면 경기 화면이 그대로 유지됩니다.\n\n나가시더라도 스코어는 안전하게 자동 보존되며, 홈 상단 배너를 통해 언제든 그대로 이어하실 수 있습니다.',
          confirmText: isJapanese ? '確認 (ホームへ移動)' : '확인 (홈으로 나가기)',
        });
      } else if (type === 'RULES') {
        setPendingGuard({
          url: '/rules',
          type: 'RULES',
          icon: '❓',
          title: isJapanese ? 'ラウンド中にルールを確認しますか？' : '지금 라운드 중에 룰 질문을 하시겠습니까?',
          desc: isJapanese
            ? '現在進行中のスコア記録は安全に自動保存されます。\n\nパークゴルフ公式ルールとAIルール案内で疑問を確認した後、いつでもラウンドに復帰できます。'
            : '현재 진행 중인 경기 기록은 안전하게 자동 보존됩니다.\n\n파크골프 규정집 및 AI 룰 솔로몬에서 궁금한 점을 질문하고 확인하신 후, 언제든 라운드로 복귀하실 수 있습니다.',
          confirmText: isJapanese ? '確認 (ルール確認へ)' : '확인 (룰 질문하기)',
        });
      } else if (type === 'COURSES') {
        setPendingGuard({
          url: '/courses',
          type: 'COURSES',
          icon: '📍',
          title: isJapanese ? '全国コース検索へ移動しますか？' : '전국 구장 찾기로 이동하시겠습니까?',
          desc: isJapanese
            ? '現在ラウンド進行中です。誤操作の場合は[ラウンドを続ける]を押して現在の画面を維持してください。\n\nコース確認後、いつでも上部バナーから現在のラウンドに復帰できます。'
            : '현재 게임 진행 중입니다. 주머니에 넣거나 실수로 잘못 누르셨다면 [계속 라운딩하기]를 눌러 경기 화면을 유지하세요.\n\n구장 검색 후 언제든 상단 배너로 현재 라운드에 복귀하실 수 있습니다.',
          confirmText: isJapanese ? '確認 (コース検索へ)' : '확인 (구장 찾기)',
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
        <div className="max-w-md mx-auto px-2.5 sm:px-4 h-14 flex items-center justify-between gap-1">
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
                alt="파크골프 올인원 마스코트 파키"
                className="w-9 h-9 rounded-full shadow-md border-2 border-amber-300 object-cover"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-emerald-950 rounded-full px-1 text-[8px] font-black shadow-xs">
                {isJapanese ? 'パキ' : '파키'}
              </span>
            </div>
            <div className="flex flex-col justify-center leading-none">
              <span className="font-black text-[12px] sm:text-[13px] tracking-wider text-white uppercase whitespace-nowrap font-sans">
                PARKGOLF
              </span>
              <span className="font-black text-[9.5px] sm:text-[10.5px] tracking-widest text-amber-300 uppercase whitespace-nowrap font-sans mt-0.5">
                ALL-IN-ONE
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* ✍️ 성명 입력 / 회원 프로필 버튼 */}
            <button
              type="button"
              onClick={() => setShowKakaoModal(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-xs transition active:scale-95 cursor-pointer shrink-0 border ${
                hasRegisteredName
                  ? 'bg-emerald-800/90 hover:bg-emerald-900 text-amber-300 border-amber-300/60'
                  : 'bg-amber-400 hover:bg-amber-300 text-stone-950 border-amber-500 shadow-sm animate-pulse'
              }`}
              title={
                hasRegisteredName
                  ? (isJapanese ? 'お名前・ニックネーム変更・連携' : '내 성명/별명 수정 및 카카오 연동')
                  : (isJapanese ? 'お名前入力＆簡単連携' : '내 성명 입력 및 카카오톡 간편 연동')
              }
            >
              <span className="text-[11px] leading-none">{hasRegisteredName ? '👤' : '✍️'}</span>
              <span className="truncate max-w-[75px] sm:max-w-[100px] leading-none">
                {hasRegisteredName
                  ? currentDisplayName
                  : (isJapanese ? 'お名前入力' : '성명 입력')}
              </span>
              {hasRegisteredName && <span className="text-[9px] opacity-75 leading-none">✏️</span>}
            </button>

            {/* 0. 나의 파크골프 연대기 & 1촌 */}
            <Link
              href="/chronicle"
              className="w-8 h-8 rounded-full bg-white hover:bg-amber-100 text-emerald-800 hover:text-amber-950 border-2 border-amber-300 shadow-md flex items-center justify-center transition active:scale-95 shrink-0"
              title={isJapanese ? '私のパークゴルフ年代記 ＆ 仲間名簿' : '나의 파크골프 연대기 & 1촌 명부'}
            >
              <Trophy className="w-4 h-4 text-amber-600 stroke-[2.5]" />
            </Link>

            {/* 0.5. 게시판 & 파크골프 뉴스 */}
            <Link
              href="/board"
              className="relative w-8 h-8 rounded-full bg-white hover:bg-amber-100 text-emerald-800 hover:text-amber-950 border-2 border-amber-300 shadow-md flex items-center justify-center transition active:scale-95 shrink-0"
              title={isJapanese ? '掲示板 ＆ パークゴルフニュース' : '게시판 & 파크골프 뉴스 (전국 시합 공고·열린 신문고)'}
            >
              <Newspaper className="w-4 h-4 text-purple-700 stroke-[2.5]" />
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black px-1 rounded-full animate-pulse shadow-xs">
                N
              </span>
            </Link>

            {/* 1. 룰 솔로몬 (물음표) 버튼 */}
            <Link
              href="/rules"
              onClick={(e) => handleNavClick(e, '/rules', 'RULES')}
              className="w-8 h-8 rounded-full bg-white hover:bg-amber-100 text-emerald-800 hover:text-amber-950 border-2 border-amber-300 shadow-md flex items-center justify-center transition active:scale-95 shrink-0"
              title={isJapanese ? '公式ルール ＆ AIルール案内' : '파크골프 규정 & AI 룰 솔로몬'}
            >
              <HelpCircle className="w-4 h-4 stroke-[2.5]" />
            </Link>

            {/* 2. 전국 구장 (장소 찾기) 버튼 */}
            <Link
              href="/courses"
              onClick={(e) => handleNavClick(e, '/courses', 'COURSES')}
              className="w-8 h-8 rounded-full bg-white hover:bg-amber-100 text-emerald-800 hover:text-amber-950 border-2 border-amber-300 shadow-md flex items-center justify-center transition active:scale-95 shrink-0"
              title={isJapanese ? '全国パークゴルフ場検索' : '전국 파크골프장 찾기'}
            >
              <MapPin className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>

        {/* 핑키의 1초 카카오 자동가입 안내 말풍선 팝업 */}
        {showLoginTip && (
          <div className="max-w-md mx-auto px-4 relative">
            <div className="absolute right-4 top-1 z-50 w-72 bg-amber-50 border-2 border-amber-400 rounded-2xl p-3.5 shadow-2xl animate-scaleUp text-stone-900">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 font-black text-xs text-amber-950">
                  <span className="text-sm leading-none">🐰</span>
                  <span>{isJapanese ? 'ピンキーの簡単案内' : '핑키의 1초 꿀팁 안내'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLoginTip(false)}
                  className="text-stone-400 hover:text-stone-700 font-bold text-xs p-0.5 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="text-xs space-y-1 font-bold text-stone-800 leading-relaxed">
                <p>
                  <span className="text-emerald-700 font-black">'{tipUserName || (isJapanese ? '会員' : '회원')}'</span> {isJapanese ? '様として登録されました！' : '님으로 등록되었습니다!'}
                </p>
                <p className="text-[11px] text-stone-700">
                  {isJapanese ? (
                    '上部のお名前をタップするとプロフィール確認と簡単ログインが可能です。パスワード不要で便利にご利用いただけます！'
                  ) : (
                    <>
                      위에 내 이름을 누르시면 <strong>카카오톡 창</strong>이 뜹니다. <span className="text-amber-900 underline decoration-amber-500 font-black">[확인]만 누르시면</span> 비밀번호 없이 <strong>자동으로 가입 완료</strong>됩니다!
                    </>
                  )}
                </p>
                <p className="text-[10px] text-stone-500 font-medium">
                  {isJapanese
                    ? '※ ずっと無料利用 ＆ スコア記録は安全に自動保管されます。'
                    : '※ 평생 무료 이용 & 내 경기 타수가 안전하게 자동 보관됩니다.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginTip(false)}
                className="mt-2 w-full py-1.5 bg-amber-400 hover:bg-amber-500 active:scale-95 text-stone-950 font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                {isJapanese ? '👍 確認 (わかりました)' : '👍 확인 (알겠습니다)'}
              </button>
            </div>
          </div>
        )}
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
                    {isJapanese ? '⚠️ ラウンド進行中の誤操作防止案内' : '⚠️ 라운드 진행 중 오터치 방지 안내'}
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
                <span>{isJapanese ? '✓ ラウンドを続ける (そのまま維持)' : '✓ 계속 라운딩하기 (원상태 유지)'}</span>
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
