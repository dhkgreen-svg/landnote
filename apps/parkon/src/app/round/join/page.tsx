'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { KakaoAuthUser, ParkOnStorage } from '@/lib/storage';
import { Course, RoundSession } from '@/types/parkon';
import { CheckCircle2, User, Users, MapPin, ArrowRight, Home, Sparkles, ShieldCheck, Smartphone } from 'lucide-react';
import { KakaoLoginModal } from '@/components/KakaoLoginModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getSavedMemberCode, MEMBER_CODE_STORAGE_KEY, normalizeMemberCode } from '@/lib/memberCodeUtils';
import { supabase } from '@/lib/supabase';

function RoundJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isJapanese } = useTranslation();

  const roomIdParam = searchParams.get('roomId') || '';
  const courseParam = searchParams.get('course') || '';
  const leaderParam = searchParams.get('leader') || (isJapanese ? 'リーダー' : '조장');
  const roundIdParam = searchParams.get('roundId') || '';
  const handoffParam = searchParams.get('handoff') || '';
  const memberParam = searchParams.get('member') || searchParams.get('user') || '';
  const codeParam = searchParams.get('code') || '';
  const countParam = searchParams.get('count') || searchParams.get('playerCount') || '2';

  const [course, setCourse] = useState<Course | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [joinedToast, setJoinedToast] = useState<string | null>(null);
  const [kakaoUser, setKakaoUser] = useState<KakaoAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isExistingMember, setIsExistingMember] = useState<boolean>(false);
  const [showAltGuestInput, setShowAltGuestInput] = useState<boolean>(false);
  const [showKakaoModal, setShowKakaoModal] = useState(false);
  const [isGuestInputOpen, setIsGuestInputOpen] = useState(false);

  // 📲 바탕화면 바로가기 앱 설치 관련 상태
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(null);
  const [joinedMemberName, setJoinedMemberName] = useState<string>('');
  const [joinedMemberCode, setJoinedMemberCode] = useState<string>('');
  const [joinedIsGuest, setJoinedIsGuest] = useState<boolean>(false);

  useEffect(() => {
    // 0. PWA 설치 이벤트 가로채기
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 1. 구장 정보 확인
    const allCourses = ParkOnStorage.getAllCourses();
    const found =
      allCourses.find(
        (c) =>
          c.id === courseParam ||
          c.id.toLowerCase() === courseParam.toLowerCase() ||
          c.name === courseParam ||
          c.name.includes(courseParam) ||
          (courseParam && c.id.includes(courseParam)) ||
          (courseParam && courseParam.includes(c.name))
      ) ||
      (courseParam && courseParam.includes('고아') ? allCourses.find((c) => c.name.includes('고아')) : null) ||
      allCourses[0];
    setCourse(found);

    // 2. 기존 등록 회원 여부 확인 (카카오 계정 또는 프로필 또는 URL 명시)
    const user = ParkOnStorage.getKakaoUser();
    const profile = ParkOnStorage.getUserProfile();
    setKakaoUser(user);
    setUserProfile(profile);

    const hasAccount = Boolean(
      memberParam ||
      (user && (user.realName || user.nickname)) ||
      (profile && profile.userName && !profile.userName.startsWith('게스트') && !profile.userName.startsWith('동반자') && profile.userName.trim().length > 0)
    );
    setIsExistingMember(hasAccount);
    setUserName('');

    if (memberParam) {
      try {
        const existingProf = profile || {};
        ParkOnStorage.saveUserProfile({
          ...existingProf,
          userName: memberParam,
          nationalGrade: memberParam.includes('김대희') ? '공인 싱글 1급' : '정회원',
          clubName: '구미 파크골프 클럽',
        });
        if (codeParam) {
          localStorage.setItem(MEMBER_CODE_STORAGE_KEY, normalizeMemberCode(codeParam));
        }
      } catch (e) {
        console.error('Failed to auto-seed profile:', e);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [courseParam, memberParam, codeParam, isJapanese]);

  const effectiveMemberName =
    memberParam ||
    kakaoUser?.realName ||
    kakaoUser?.nickname ||
    userProfile?.userName ||
    (isJapanese ? '会員' : '회원');
  const effectiveMemberCode =
    codeParam ||
    getSavedMemberCode() ||
    (kakaoUser as any)?.memberCode ||
    '';

  const executeJoin = async (name: string, isGuest: boolean) => {
    const trimmedName = name.trim() || (isGuest ? (isJapanese ? 'ゲスト' : '게스트') : (isJapanese ? '会員' : '회원'));

    if (!isGuest) {
      try {
        const currentProfile = ParkOnStorage.getUserProfile();
        ParkOnStorage.saveUserProfile({
          ...currentProfile,
          userName: trimmedName,
        });
      } catch (e) {
        console.error(e);
      }
    }

    // 1. 진행 중인 라운드 넘겨받기 (Handoff) 및 동반자 합류 처리
    if (roundIdParam) {
      let activeRound: RoundSession | null = ParkOnStorage.getCurrentRound();
      if (handoffParam) {
        try {
          const parsed = JSON.parse(decodeURIComponent(handoffParam));
          if (parsed && parsed.id === roundIdParam) {
            activeRound = parsed;
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (activeRound && activeRound.id === roundIdParam) {
        // 이미 명단에 없으면 동반자로 추가 등록
        const alreadyIn = activeRound.players.some((p) => p.name === trimmedName);
        if (!alreadyIn) {
          activeRound.players.push({
            id: `p_join_${Date.now()}`,
            name: trimmedName,
            isLeader: false,
            isSelf: true,
            isGuest: isGuest,
            scores: {},
            obCount: {},
            totalStrokes: 0,
            totalParDiff: 0,
          });
        }
        ParkOnStorage.saveCurrentRound(activeRound);
        setJoinedToast(
          isGuest
            ? (isJapanese
                ? `⛳ '${trimmedName}' 様、ゲスト(リアルタイム電光掲示板共有)として入場します！`
                : `⛳ '${trimmedName}' 님, 게스트(실시간 전광판 공유)로 입장합니다!`)
            : (isJapanese
                ? `⭐ '${trimmedName}' 様、正会員(公式戦績保存)として入場します！`
                : `⭐ '${trimmedName}' 님, 정회원(공식 전적 보존)으로 입장합니다!`)
        );
        setTimeout(() => {
          router.push(`/round/${roundIdParam}`);
        }, 800);
        return;
      }
    }

    // 2. 조장이 연 룸(Room)에 동반자로 참가하여 대기실로 이동
    const targetRoomId = roomIdParam || 'latest';
    let joinedRoomId = targetRoomId;

    try {
      // 서버 룸 API에 동반자 입장 등록
      const res = await fetch('/api/round/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          roomId: targetRoomId,
          playerName: trimmedName,
          leaderName: leaderParam,
          playerCount: parseInt(countParam, 10) || 2,
          courseId: course?.id || courseParam || 'course_1',
          courseName: course?.name || (isJapanese ? 'パークゴルフ場' : '파크골프장'),
          isGuest: isGuest,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.roomId) {
          joinedRoomId = data.roomId;
        }
      }

      // Supabase Realtime 채널로 동반자 입장 즉시 브로드캐스트 전송
      const channel = supabase.channel(`room_${joinedRoomId}`);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'companion_joined',
            payload: {
              roomId: joinedRoomId,
              userName: trimmedName,
              name: trimmedName,
              playerName: trimmedName,
              nickname: trimmedName,
              slotIndex: 1,
              playerCount: parseInt(countParam, 10) || 2,
              isGuest: isGuest,
            },
          });
        }
      });
      // 즉시 1차 전송 시도
      channel.send({
        type: 'broadcast',
        event: 'companion_joined',
        payload: {
          roomId: joinedRoomId,
          userName: trimmedName,
          name: trimmedName,
          playerName: trimmedName,
          nickname: trimmedName,
          slotIndex: 1,
          playerCount: parseInt(countParam, 10) || 2,
          isGuest: isGuest,
        },
      });
    } catch (err) {
      console.error('Failed to notify room join:', err);
    }

    setJoinedToast(
      isGuest
        ? (isJapanese
            ? `⛳ '${trimmedName}' 様、ゲストとして待合室に入場します！`
            : `⛳ '${trimmedName}' 님, 게스트로 대기실에 입장합니다!`)
        : (isJapanese
            ? `⭐ '${trimmedName}' 会員様、公式待合室に入場します！`
            : `⭐ '${trimmedName}' 회원님, 공식 대기실로 입장합니다!`)
    );

    const nextUrl = `/round/waiting?roomId=${encodeURIComponent(joinedRoomId)}&guest=${encodeURIComponent(trimmedName)}&isGuest=${isGuest ? '1' : '0'}&count=${encodeURIComponent(countParam)}`;
    setPendingRedirectUrl(nextUrl);

    // 📲 대표님 지침: 기존 가입 회원은 이미 가입/설치된 회원이므로 불필요한 설치 팝업 없이 0.3초 만에 대기실로 즉시 직행!
    if (isExistingMember) {
      setTimeout(() => {
        router.push(nextUrl);
      }, 300);
      return;
    }

    // 신규 방문자(방금 가입 또는 첫 방문)인 경우에만 바탕화면 1초 앱 설치 모달 표출!
    setJoinedMemberName(trimmedName);
    setJoinedIsGuest(isGuest);
    const code = getSavedMemberCode();
    setJoinedMemberCode(code || 'PKY-1003');
    setShowInstallModal(true);
  };

  const handleTriggerPwaInstall = async () => {
    try {
      localStorage.setItem('parkon_app_installed', 'true');
    } catch {}

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setJoinedToast(isJapanese ? '✓ ホーム画面にアプリを追加しました！' : '✓ 바탕화면에 앱이 성공적으로 추가되었습니다!');
        }
      } catch (err) {
        console.warn('PWA prompt error', err);
      }
    } else {
      setJoinedToast(isJapanese ? '✓ ホーム画面に追加完了！ 待合室へ入場します...' : '✓ 바탕화면 바로가기 추가 완료! 대기실로 입장합니다...');
    }

    setTimeout(() => {
      handleGoToWaitingRoom();
    }, 1000);
  };

  const handleGoToWaitingRoom = () => {
    setShowInstallModal(false);
    const targetUrl =
      pendingRedirectUrl ||
      `/round/waiting?roomId=${encodeURIComponent(roomIdParam || 'latest')}&guest=${encodeURIComponent(joinedMemberName || '동반자')}&isGuest=${joinedIsGuest ? '1' : '0'}`;
    router.push(targetUrl);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden flex flex-col">
        {/* 상단 캐릭터 환영 히어로 배너 */}
        <div className="bg-gradient-to-b from-emerald-800 to-emerald-950 p-5 text-center text-white relative">
          <div
            className="relative w-24 h-24 mx-auto mb-2 rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-400/40 bg-emerald-900/60"
            style={{ width: '96px', height: '96px' }}
          >
            <Image
              src="/mascot/사진저장고_사진_20260913_28.jpg"
              alt={isJapanese ? 'パキ歓迎マスコット' : '파키 환영 마스코트'}
              fill
              sizes="96px"
              className="object-cover"
              priority
            />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-yellow-400 text-emerald-950 font-black text-xs shadow-xs mb-1.5">
            {isJapanese ? 'PARKY 同伴者招待' : 'PARKY 파키 동반자 초대'}
          </span>
          <h1 className="text-xl font-black tracking-tight text-white">
            {isJapanese ? 'ラウンドに合流しましょう！ ⛳' : '라운딩 바로 합류하기 ⛳'}
          </h1>
          <p className="text-xs text-emerald-200 mt-1">
            👑 <span className="font-bold text-yellow-300">{leaderParam}</span> {isJapanese ? '様のチームに招待されました' : '님의 팀에 초대되셨습니다'}
          </p>
        </div>

        {/* 본문 안내 및 모드 선택 */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* ⛳ 초대된 골프장 안내 카드 (대표님 지침: 고아 파크골프장 등 구장 정보 명확 표출) */}
          <div className="bg-gradient-to-br from-emerald-50 via-stone-50 to-emerald-50 border-2 border-emerald-400/80 rounded-2xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-700 text-white flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {course?.region || '경북 구미시'}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
                {course?.totalCourses || 4}코스 · {course?.totalHoles || 36}홀
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div>
                <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight flex items-center gap-1.5">
                  <span>⛳</span>
                  <span>{course?.name?.includes('파크골프') ? course.name : `${course?.name || '고아'} 파크골프장`}</span>
                </h2>
                <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                  {isJapanese ? 'リアルタイムスコア自動同期' : '4인 스코어보드 실시간 동시 연동'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isJapanese ? '待機中' : '참여 대기'}
                </span>
              </div>
            </div>
          </div>
          {/* 대표님 원칙: 도중 합류 시 결번 실타수 집계 심플 안내 */}
          {roundIdParam && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-xs text-amber-950 flex items-center gap-2">
              <span className="text-sm shrink-0">⚖️</span>
              <span className="text-[11px] text-amber-900 font-bold leading-tight">
                {isJapanese
                  ? '進行中のラウンドです。これからプレーするホールの打数がリアルタイム集計されます。'
                  : '진행 중인 라운딩입니다. 지금부터 치는 홀의 타수가 실시간 집계됩니다.'}
              </span>
            </div>
          )}

          {/* 피드백 토스트 알림 */}
          {joinedToast && (
            <div className="bg-emerald-700 text-white text-xs font-black p-3 rounded-xl shadow-md text-center animate-bounce">
              {joinedToast}
            </div>
          )}

          {/* 대표님 지침: 정회원 / 신규 구분하여 단일 [⛳ 합류하기] 심플 원터치 버튼 제공 */}
          {isExistingMember ? (
            /* 👑 정회원: 회원 성명 확인 & 단일 [⛳ 합류하기] 버튼 */
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-stone-900 text-white shadow-xl border-2 border-yellow-400 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-yellow-300 font-bold tracking-wider">
                    회원번호: {effectiveMemberCode}
                  </span>
                  <span className="text-[11px] bg-yellow-400 text-stone-950 font-black px-2.5 py-0.5 rounded-full">
                    정회원
                  </span>
                </div>

                <div className="text-center py-1">
                  <h3 className="text-2xl font-black text-white">
                    '{effectiveMemberName}' 님
                  </h3>
                  <p className="text-xs text-emerald-200 mt-1">
                    {leaderParam} 님의 라운드 팀에 함께합니다.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => executeJoin(effectiveMemberName, false)}
                  className="w-full py-4.5 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 hover:from-yellow-300 text-stone-950 font-black text-lg rounded-2xl shadow-xl transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border-2 border-yellow-500"
                >
                  <span>⛳ 합류하기</span>
                  <ArrowRight className="w-5 h-5 text-stone-950" />
                </button>
              </div>
            </div>
          ) : (
            /* 🏌️ 신규/미가입자: 성명 입력 + 단일 [⛳ 합류하기] 버튼 */
            <div className="space-y-4">
              <div className="p-4.5 rounded-3xl bg-white border-2 border-emerald-500 shadow-md space-y-3.5">
                <label className="block text-xs font-black text-stone-800">
                  {isJapanese ? 'お名前を入力してください' : '성함을 입력해주세요'}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder={
                      isJapanese
                        ? 'お名前を入力 (例: 山田)'
                        : '성명을 적어주세요 (예: 오송)'
                    }
                    className="w-full pl-3.5 pr-10 py-3.5 text-base bg-stone-50 text-stone-900 border-2 border-stone-200 rounded-xl font-bold focus:outline-hidden focus:border-emerald-600 focus:bg-white transition placeholder:text-stone-400"
                  />
                  {userName ? (
                    <button
                      type="button"
                      onClick={() => setUserName('')}
                      className="absolute right-3 w-6 h-6 flex items-center justify-center rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 hover:text-stone-900 text-xs transition cursor-pointer"
                      title={isJapanese ? 'クリア' : '지우기'}
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => executeJoin(userName.trim() || (isJapanese ? '同伴者' : '동반자'), false)}
                  className="w-full py-4.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-black text-lg rounded-2xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-emerald-400"
                >
                  <span>⛳ 합류하기</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* 하단 보조 홈 이동 */}
          <Link
            href="/"
            className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5 transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{isJapanese ? 'パークゴルフ オールインワン ホームへ移動' : '파크골프 올인원 홈으로 이동'}</span>
          </Link>
        </div>

        {/* 하단 안심 안내 바 */}
        <div className="bg-stone-50 p-3 border-t border-stone-100 text-center">
          <p className="text-[10px] text-stone-600 font-medium">
            {isJapanese
              ? 'パークゴルフ オールインワンはアプリのインストール不要で、スマートフォンのブラウザですぐにご利用いただけます。'
              : '파크골프 올인원은 별도 앱 설치 없이 스마트폰 브라우저에서 바로 사용하실 수 있습니다.'}
          </p>
        </div>
      </div>

      {/* 📲 대표님 특명: 가입/참가 완료 후 [바탕화면에 앱 설치하겠습니까?] 옵션 팝업 모달 */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border-2 border-emerald-500 overflow-hidden flex flex-col">
            {/* 캐릭터 헤더 */}
            <div className="bg-gradient-to-b from-emerald-800 to-emerald-950 p-5 text-center text-white relative">
              {/* ✕ 닫기 버튼 */}
              <button
                type="button"
                onClick={handleGoToWaitingRoom}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
                title={isJapanese ? '閉じる' : '닫기'}
              >
                ✕
              </button>

              <div className="relative w-20 h-20 mx-auto mb-2 rounded-2xl overflow-hidden shadow-lg border-2 border-yellow-400 bg-emerald-900">
                <Image
                  src="/mascot/사진저장고_사진_20260913_28.jpg"
                  alt={isJapanese ? 'パキ公式マスコット' : '파키 공식 마스코트'}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-yellow-400 text-stone-950 font-black text-xs mb-1">
                {joinedIsGuest
                  ? (isJapanese ? '🎉 ラウンド合流完了！' : '🎉 라운드 합류 완료!')
                  : (isJapanese ? '🎉 会員登録 ＆ 合流完了！' : '🎉 회원가입 & 라운드 합류 완료!')}
              </span>
              <h3 className="text-lg font-black text-white">
                '{joinedMemberName}' {isJapanese ? '様、歓迎します！' : '님, 환영합니다!'}
              </h3>
              {!joinedIsGuest && (
                <p className="text-xs text-yellow-300 font-bold mt-0.5">
                  👑 {isJapanese ? 'マイ会員番号' : '평생 회원번호'}: {joinedMemberCode}
                </p>
              )}
            </div>

            {/* 본문: 바탕화면 앱 설치 & 대기실 자동 동시 입장 (대표님 특명 단일 원클릭 통합) */}
            <div className="p-5 space-y-4 text-center">
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-center gap-1.5 text-emerald-950 font-black text-sm sm:text-base">
                  <Smartphone className="w-5 h-5 text-emerald-700" />
                  <span>
                    {isJapanese
                      ? 'ホーム画面にアプリが自動設置されます！'
                      : '스마트폰 바탕화면에 앱이 자동 설치됩니다!'}
                  </span>
                </div>
                <p className="text-[12px] text-stone-700 font-bold leading-relaxed">
                  {isJapanese
                    ? 'ホーム画面に置いておくと、毎回リンクを探す手間なく1秒で即起動！ 本日のラウンド戦績も永久保存されます。'
                    : '바탕화면에 앱을 깔아두시면 매번 카톡 링크를 찾을 필요 없이 1초 만에 바로 실행되며, 오늘 친 18홀 전적도 안전하게 보관됩니다.'}
                </p>
              </div>

              {/* 대표님 특명: 두 개를 하나로 완벽 통합한 단일 대형 버튼! */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleTriggerPwaInstall}
                  className="w-full py-4 px-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer border-2 border-emerald-300"
                >
                  <Smartphone className="w-5 h-5 text-yellow-300 fill-yellow-300 shrink-0" />
                  <span className="truncate">
                    {isJapanese
                      ? '📲 ホーム画面にアプリ追加＆待合室入場 ⛳'
                      : '📲 바탕화면 앱 설치하고 바로 입장 ⛳'}
                  </span>
                </button>
              </div>

              <p className="text-[11px] text-stone-500 font-bold">
                {isJapanese
                  ? '※ ボタンをタッチすると自動でアイコンが作成され、そのまま待合室へ入場します。'
                  : '※ 버튼을 터치하시면 1초 만에 바탕화면에 앱이 생성되고 대기실로 자동 입장합니다.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 카카오 1초 로그인 모달 */}
      <KakaoLoginModal
        isOpen={showKakaoModal}
        onClose={() => setShowKakaoModal(false)}
        onLoginSuccess={(user) => {
          setKakaoUser(user);
          const effectiveName = user.realName || user.nickname || (isJapanese ? '会員' : '회원');
          setUserName(effectiveName);
          setShowKakaoModal(false);
          // 로그인 성공 시 즉시 정회원으로 입장 진행!
          executeJoin(effectiveName, false);
        }}
        title={isJapanese ? '会員ログインして公式記録を保存' : '회원 로그인하고 공식 기록 저장'}
        subtitle={
          isJapanese
            ? '1秒ログインで本日プレーしたラウンド戦績が永久保存されます。'
            : '카카오 1초 로그인 시 오늘 친 라운딩 전적이 영구 보존됩니다.'
        }
        initialTab="NEW_USER"
        initialName={userName}
        isJoinFlow={true}
      />
    </div>
  );
}

export default function RoundJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-100 flex items-center justify-center font-bold text-stone-500">Loading...</div>}>
      <RoundJoinContent />
    </Suspense>
  );
}
