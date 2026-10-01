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
    // 게스트 이름 입력칸은 홍길동 등의 기본값 없이 항상 깨끗한 빈칸으로 시작
    setUserName('');
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

          {/* 대표님 특명: 2대 핵심 선택 (1. 가입 없이 바로 합류하기 vs 2. 카카오톡으로 가입하고 합류하기) */}
          <div className="space-y-4">
            {/* [선택 1] 가입 없이 바로 합류하기 (게스트 빠른 입장) */}
            <div className="p-4 rounded-3xl bg-white border-2 border-emerald-500 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-stone-800">
                  {isJapanese ? 'お名前 (またはニックネーム)' : '성함 또는 닉네임 입력'}
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {isJapanese ? '登録なしで即合流' : '가입 없이 1초 합류'}
                </span>
              </div>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={
                  isJapanese
                    ? 'お名前を入力してください (例: パク・プロ)'
                    : "성함을 입력하세요 (예: 이프로, 최사장...)"
                }
                className="w-full px-3.5 py-3 text-base bg-stone-50 text-stone-900 border-2 border-stone-200 rounded-xl font-bold focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => executeJoin(userName.trim() || (isJapanese ? '同伴者' : '동반자'), true)}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-base rounded-2xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-emerald-400"
              >
                <span>{isJapanese ? '🏌️ 会員登録なしで今すぐ合流する' : '🏌️ 가입 없이 바로 합류하기'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* [선택 2] 파키 회원가입과 동시 합류하기 (정회원 평생 전적 보존) */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-50 via-yellow-50/50 to-amber-50 border-2 border-yellow-400 shadow-sm space-y-2.5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-black text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>{isJapanese ? 'マイ年代記・生涯戦績を永久保存' : '나의 연대기 · 평생 전적 영구 보존'}</span>
              </div>

              {kakaoUser ? (
                <button
                  type="button"
                  onClick={() => executeJoin(kakaoUser.realName || kakaoUser.nickname || (isJapanese ? '会員' : '회원'), false)}
                  className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-black text-sm sm:text-base rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-yellow-500/60"
                >
                  <span>
                    {isJapanese
                      ? '⚡ パキ正会員として公式合流する'
                      : '⚡ 파키 정회원으로 공식 합류하기'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-stone-950" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowKakaoModal(true)}
                  className="w-full py-3.5 bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-black text-sm sm:text-base rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-yellow-500/60"
                >
                  <span>{isJapanese ? '⚡ パキ会員登録と同時に合流する' : '⚡ 파키 회원가입과 동시 합류하기'}</span>
                  <ArrowRight className="w-4 h-4 text-stone-950" />
                </button>
              )}

              <p className="text-[10px] text-stone-500 font-medium">
                {isJapanese
                  ? '※ 1秒簡単認証でパキ正会員となり、本日の戦績がマイ年代記に永久保存されます。'
                  : '※ 1초 간편인증으로 파키 정회원이 되며, 오늘 친 18홀 전적이 나의 연대기에 평생 저장됩니다.'}
              </p>
            </div>
          </div>

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
