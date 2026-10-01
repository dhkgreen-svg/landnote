'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { KakaoAuthUser, ParkOnStorage } from '@/lib/storage';
import { Course, RoundSession } from '@/types/parkon';
import { CheckCircle2, User, Users, MapPin, ArrowRight, Home, Sparkles, ShieldCheck } from 'lucide-react';
import { KakaoLoginModal } from '@/components/KakaoLoginModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';

function RoundJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isJapanese } = useTranslation();

  const roomIdParam = searchParams.get('roomId') || '';
  const courseParam = searchParams.get('course') || '';
  const leaderParam = searchParams.get('leader') || (isJapanese ? 'リーダー' : '조장');
  const roundIdParam = searchParams.get('roundId') || '';
  const handoffParam = searchParams.get('handoff') || '';

  const [course, setCourse] = useState<Course | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [joinedToast, setJoinedToast] = useState<string | null>(null);
  const [kakaoUser, setKakaoUser] = useState<KakaoAuthUser | null>(null);
  const [showKakaoModal, setShowKakaoModal] = useState(false);
  const [isGuestInputOpen, setIsGuestInputOpen] = useState(false);

  useEffect(() => {
    // 1. 구장 정보 확인
    const allCourses = ParkOnStorage.getAllCourses();
    const found =
      allCourses.find((c) => c.id === courseParam || c.id.toLowerCase() === courseParam.toLowerCase()) ||
      allCourses[0];
    setCourse(found);

    // 2. 카카오 회원 로그인 여부 확인
    const user = ParkOnStorage.getKakaoUser();
    setKakaoUser(user);
    if (user) {
      setUserName(user.realName || user.nickname || (isJapanese ? '会員' : '회원'));
    } else {
      const defaultName = ParkOnStorage.getUserDisplayName();
      setUserName(
        defaultName &&
          defaultName !== '파크골퍼' &&
          defaultName !== 'パークゴルファー' &&
          defaultName !== '김대희' &&
          defaultName !== '홍길동'
          ? defaultName
          : ''
      );
    }
  }, [courseParam, isJapanese]);

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
        if (!alreadyIn && activeRound.players.length < 4) {
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
    const targetRoomId = roomIdParam || `room_${courseParam || 'default'}`;

    try {
      // 서버 룸 API에 동반자 입장 등록
      await fetch('/api/round/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          roomId: targetRoomId,
          playerName: trimmedName,
          leaderName: leaderParam,
          courseId: course?.id || courseParam || 'course_1',
          courseName: course?.name || (isJapanese ? 'パークゴルフ場' : '파크골프장'),
          isGuest: isGuest,
        }),
      });

      // 동일 기기/브라우저 탭 간 즉시 동기화 브로드캐스트
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('parkon_room_sync');
        bc.postMessage({
          roomId: targetRoomId,
          joinedPlayer: trimmedName,
          isGuest: isGuest,
        });
        bc.close();
      }
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
    setTimeout(() => {
      router.push(`/round/waiting?roomId=${encodeURIComponent(targetRoomId)}&guest=${encodeURIComponent(trimmedName)}&isGuest=${isGuest ? '1' : '0'}`);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden flex flex-col">
        {/* 상단 캐릭터 환영 히어로 배너 */}
        <div className="bg-gradient-to-b from-emerald-800 to-emerald-950 p-5 text-center text-white relative">
          <div className="relative w-24 h-24 mx-auto mb-2 rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-400/40 bg-emerald-900/60">
            <Image
              src="/mascot/사진저장고_사진_20260913_28.jpg"
              alt={isJapanese ? 'パキ歓迎マスコット' : '파키 환영 마스코트'}
              fill
              className="object-cover"
              priority
            />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-yellow-400 text-emerald-950 font-black text-xs shadow-xs mb-1">
            {isJapanese ? 'PARKY 同伴者招待' : 'PARKY 파키 동반자 초대'}
          </span>
          <h1 className="text-xl font-black tracking-tight text-white">
            {isJapanese ? '一緒にパークゴルフをプレーしましょう！ ⛳' : '함께 파크골프 쳐요! ⛳'}
          </h1>
          <p className="text-xs text-emerald-200 mt-0.5">
            👑 <span className="font-bold text-yellow-300">{leaderParam}</span> {isJapanese ? '様から招待されました。' : '님이 초청하셨습니다.'}
          </p>
        </div>

        {/* 본문 안내 및 모드 선택 */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* 구장 정보 카드 */}
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shrink-0 shadow-xs">
              🏌️
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{course?.region || (isJapanese ? '全国' : '전국')}</span>
              </div>
              <div className="text-base font-black text-emerald-950 truncate">
                {course?.name || (isJapanese ? 'パークゴルフ場' : '파크골프장')}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium">
                {roundIdParam
                  ? (isJapanese ? '現在進行中のラウンドにそのまま合流します' : '현재 진행 중인 라운딩에 바로 합류합니다')
                  : (isJapanese ? 'リーダーとリアルタイムスコアボードを共有します' : '조장과 실시간 스코어보드를 공유합니다')}
              </div>
            </div>
          </div>

          {/* 대표님 원칙: 도중 합류 시 가상 점수 부여 금지 & 결번 실타수 집계 안내 */}
          {roundIdParam && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-xs text-amber-950 flex items-start gap-2">
              <span className="text-sm shrink-0">⚖️</span>
              <div className="leading-tight">
                <span className="font-extrabold text-amber-900 block">
                  {isJapanese ? '公正記録原則 (混乱防止)' : '공정 기록 원칙 (혼선 방지)'}
                </span>
                <span className="text-[11px] text-amber-800">
                  {isJapanese
                    ? '仮想スコアなしで、通過したホールは[欠番(-)]処理され、これから実際に打ったホールの打数のみ公式集計されます。'
                    : '가상 점수 없이, 지나간 홀은 [결번(-)] 처리되며 지금부터 실제로 친 홀의 타수만 공식 집계됩니다.'}
                </span>
              </div>
            </div>
          )}

          {/* 피드백 토스트 알림 */}
          {joinedToast && (
            <div className="bg-emerald-700 text-white text-xs font-black p-3 rounded-xl shadow-md text-center animate-bounce">
              {joinedToast}
            </div>
          )}

          {/* [CASE 1] 이미 카카오 정회원 로그인되어 있는 경우 */}
          {kakaoUser ? (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-500 rounded-2xl p-4 text-center space-y-3 shadow-xs">
              <div className="inline-flex items-center gap-1.5 text-emerald-800 text-[11px] font-black bg-emerald-100 px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" />
                <span>{isJapanese ? 'パークゴルフ オールインワン 正会員認証完了' : '파크골프 올인원 정회원 인증 완료'}</span>
              </div>
              <div>
                <p className="text-lg font-black text-stone-900">
                  '{kakaoUser.realName || kakaoUser.nickname}' {isJapanese ? '様' : '님'}
                </p>
                <p className="text-xs text-stone-600 font-semibold mt-0.5">
                  {isJapanese ? (
                    <>本日プレーした18ホールの記録が <span className="font-bold text-emerald-800">[マイ年代記]</span> に公式戦績として永久保存されます。</>
                  ) : (
                    <>오늘 친 18홀 기록이 <span className="font-bold text-emerald-800">[나의 연대기]</span>에 공식 전적으로 영구 저장됩니다.</>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => executeJoin(kakaoUser.realName || kakaoUser.nickname || (isJapanese ? '会員' : '회원'), false)}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-black text-sm rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-emerald-500"
              >
                <span>{isJapanese ? '⛳ 正会員としてラウンドに合流する' : '⛳ 정회원으로 라운딩 합류하기'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsGuestInputOpen(true)}
                className="text-xs text-stone-500 hover:text-stone-700 underline font-bold pt-1 cursor-pointer block mx-auto"
              >
                {isJapanese ? '今回だけ別の名前(ゲスト)で一時参加する' : '이번만 다른 이름(게스트)으로 임시 참여하기'}
              </button>
            </div>
          ) : (
            /* [CASE 2] 비로그인 상태: 회원 vs 게스트 선택 (대표님 기획 반영) */
            <div className="space-y-3">
              {/* 선택 1: 카카오 회원으로 라운딩하기 (추천) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 via-yellow-50/40 to-emerald-50/60 border-2 border-emerald-600 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-white bg-emerald-700 px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                    <span>{isJapanese ? 'おすすめ・会員モード' : '추천 · 회원 모드'}</span>
                  </span>
                  <span className="text-[11px] font-black text-emerald-800">{isJapanese ? '記録を永久保存 ⭐' : '기록 평생 보존 ⭐'}</span>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-black text-stone-950 leading-tight">
                    {isJapanese ? '会員ログインしてマイ記録を永久保存する' : '카카오 로그인하고 내 기록 평생 저장하기'}
                  </h3>
                  <ul className="text-xs text-stone-700 font-bold space-y-1 mt-2 pl-0.5">
                    <li className="flex items-center gap-1.5">
                      <span className="text-emerald-700 font-black">✓</span>
                      {isJapanese ? 'スマホの「マイ年代記」に18ホール戦績を100%永久保存' : "내 폰 '나의 연대기'에 18홀 전적 100% 영구 보존"}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-emerald-700 font-black">✓</span>
                      {isJapanese ? '1〜5スター等級ランキングおよび公認ハンディキャップ付与' : '1~5스타 등급 랭킹 및 공인 핸디캡 부여'}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-emerald-700 font-black">✓</span>
                      {isJapanese ? 'ゴルファー名刺交換およびフレンド名簿登録' : '동호인 디지털 명함 교환 및 1촌 명부 등록'}
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setShowKakaoModal(true)}
                  className="w-full py-3.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-400 hover:from-yellow-300 hover:to-amber-300 text-stone-950 font-black text-sm rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-amber-400"
                >
                  <span>{isJapanese ? '⚡ 1秒連携して会員としてスタート' : '⚡ 카카오 1초 로그인하고 회원으로 시작'}</span>
                  <ArrowRight className="w-4 h-4 text-stone-950" />
                </button>
              </div>

              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-stone-200"></div>
                <span className="flex-shrink mx-3 text-stone-400 text-xs font-bold">{isJapanese ? 'または' : '또는'}</span>
                <div className="flex-grow border-t border-stone-200"></div>
              </div>

              {/* 선택 2: 게스트(비회원)로 빠른 라운딩만 함께하기 */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border-2 border-stone-200 hover:border-stone-300 transition space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-stone-700 bg-stone-200 px-2 py-0.5 rounded-full">
                    {isJapanese ? 'クイックスタート' : '빠른 시작'}
                  </span>
                  <span className="text-[11px] font-bold text-stone-500">{isJapanese ? 'ログイン不要' : '로그인 불필요'}</span>
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-black text-stone-900">
                    {isJapanese ? '🚶 ゲスト(非会員)でクイックラウンドに参加' : '🚶 게스트(비회원)로 빠른 라운딩만 함께하기'}
                  </h3>
                  <p className="text-[11px] text-stone-500 font-semibold mt-0.5 leading-tight">
                    {isJapanese
                      ? 'ログイン不要でお名前を入力するだけで3秒で開始。リーダー端末とリアルタイムスコア共有のみ行われ、端末には記録が残りません。'
                      : '로그인 없이 이름만 넣고 3초 만에 시작합니다. 조장 폰과 실시간 점수 공유만 되며 내 폰에는 기록이 남지 않습니다.'}
                  </p>
                </div>

                <div className="pt-1 space-y-2">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder={
                      isJapanese
                        ? 'お名前またはニックネーム入力 (未入力時は「同伴者」で自動入場)'
                        : "이름 또는 별명 입력 (미입력 시 '동반자'로 자동 입장)"
                    }
                    className="w-full px-3 py-2 text-sm bg-white text-stone-900 border border-stone-300 rounded-xl font-bold focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200"
                  />
                  <button
                    type="button"
                    onClick={() => executeJoin(userName.trim() || (isJapanese ? '同伴者' : '동반자'), true)}
                    className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 active:bg-stone-900 text-white font-black text-xs rounded-xl shadow transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{isJapanese ? 'ゲストですぐ入場する' : '게스트로 바로 입장하기'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 게스트 수동 입력창 모달/드로어 (회원 로그인 상태에서 다른 이름 입력 원할 때) */}
          {kakaoUser && isGuestInputOpen && (
            <div className="p-3 bg-stone-100 rounded-xl border border-stone-300 space-y-2">
              <label className="text-xs font-bold text-stone-700">{isJapanese ? 'ゲスト用の一時的なお名前' : '게스트로 사용할 임시 이름'}</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={isJapanese ? '一時名を入力' : '임시 이름 입력'}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg font-bold"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => executeJoin(userName.trim() || (isJapanese ? 'ゲスト' : '게스트'), true)}
                  className="flex-1 py-2 bg-stone-700 text-white text-xs font-black rounded-lg"
                >
                  {isJapanese ? 'ゲストとして入場' : '게스트로 입장'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsGuestInputOpen(false)}
                  className="px-3 py-2 bg-stone-200 text-stone-700 text-xs font-bold rounded-lg"
                >
                  {isJapanese ? 'キャンセル' : '취소'}
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
              ? 'ParkOnはアプリのインストール不要で、スマートフォンのブラウザですぐにご利用いただけます。'
              : '파크골프 올인원은 별도 앱 설치 없이 스마트폰 브라우저에서 바로 사용하실 수 있습니다.'}
          </p>
        </div>
      </div>

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
