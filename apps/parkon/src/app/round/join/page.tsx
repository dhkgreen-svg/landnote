'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ParkOnStorage } from '@/lib/storage';
import { Course, RoundSession } from '@/types/parkon';
import { CheckCircle2, User, Users, MapPin, ArrowRight, Home } from 'lucide-react';

function RoundJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roomIdParam = searchParams.get('roomId') || '';
  const courseParam = searchParams.get('course') || '';
  const leaderParam = searchParams.get('leader') || '조장';
  const roundIdParam = searchParams.get('roundId') || '';
  const handoffParam = searchParams.get('handoff') || '';

  const [course, setCourse] = useState<Course | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [joinedToast, setJoinedToast] = useState<string | null>(null);

  useEffect(() => {
    // 1. 구장 정보 확인
    const allCourses = ParkOnStorage.getAllCourses();
    const found =
      allCourses.find((c) => c.id === courseParam || c.id.toLowerCase() === courseParam.toLowerCase()) ||
      allCourses[0];
    setCourse(found);

    // 2. 내 기본 이름 불러오기
    try {
      const defaultName = ParkOnStorage.getUserDisplayName();
      setUserName(defaultName && defaultName !== '파크골퍼' ? defaultName : '동반자');
    } catch {
      setUserName('동반자');
    }
  }, [courseParam]);

  const handleJoinRound = async () => {
    const trimmedName = userName.trim() || '동반자';

    // 내 프로필 이름 업데이트
    try {
      const currentProfile = ParkOnStorage.getUserProfile();
      ParkOnStorage.saveUserProfile({
        ...currentProfile,
        userName: trimmedName,
      });
    } catch (e) {
      console.error(e);
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
            scores: {},
            obCount: {},
            totalStrokes: 0,
            totalParDiff: 0,
          });
        }
        ParkOnStorage.saveCurrentRound(activeRound);
        setJoinedToast(`⛳ '${trimmedName}' 님, ${activeRound.courseName} 경기에 입장합니다!`);
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
          courseName: course?.name || '구미 동락 파크골프장',
        }),
      });

      // 동일 기기/브라우저 탭 간 즉시 동기화 브로드캐스트
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('parkon_room_sync');
        bc.postMessage({
          roomId: targetRoomId,
          joinedPlayer: trimmedName,
        });
        bc.close();
      }
    } catch (err) {
      console.error('Failed to notify room join:', err);
    }

    setJoinedToast(`⛳ '${trimmedName}' 님, 대기실로 입장합니다!`);
    setTimeout(() => {
      router.push(`/round/waiting?roomId=${encodeURIComponent(targetRoomId)}&guest=${encodeURIComponent(trimmedName)}`);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden flex flex-col">
        {/* 상단 캐릭터 환영 히어로 배너 */}
        <div className="bg-gradient-to-b from-emerald-800 to-emerald-950 p-5 text-center text-white relative">
          <div className="relative w-28 h-28 mx-auto mb-2 rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-400/40 bg-emerald-900/60">
            <Image
              src="/mascot/사진저장고_사진_20260913_28.jpg"
              alt="파키 환영 마스코트"
              fill
              className="object-cover"
              priority
            />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-yellow-400 text-emerald-950 font-black text-xs shadow-xs mb-1">
            PARKON 동반자 초대
          </span>
          <h1 className="text-xl font-black tracking-tight text-white">
            함께 파크골프 쳐요! ⛳
          </h1>
          <p className="text-xs text-emerald-200 mt-0.5">
            👑 <span className="font-bold text-yellow-300">{leaderParam}</span> 님이 초청하셨습니다.
          </p>
        </div>

        {/* 본문 안내 및 이름 입력 */}
        <div className="p-5 space-y-4">
          {/* 구장 정보 카드 */}
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shrink-0 shadow-xs">
              🏌️
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{course?.region || '전국'}</span>
              </div>
              <div className="text-base font-black text-emerald-950 truncate">
                {course?.name || '파크골프장'}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium">
                {roundIdParam ? '현재 진행 중인 라운딩에 바로 합류합니다' : '동반자 명단에 자동 등록되어 함께 시작합니다'}
              </div>
            </div>
          </div>

          {/* 내 이름 입력 카드 */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-stone-700 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>입장하실 내 이름(동반자명)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="이름을 입력하세요 (예: 김영수)"
                className="w-full px-3.5 py-3 text-base bg-white text-stone-900 border-2 border-stone-300 rounded-xl font-black focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition shadow-2xs"
              />
            </div>
            <p className="text-[11px] text-stone-500 font-medium">
              * 스코어카드에 표시될 이름입니다. 언제든 변경하실 수 있습니다.
            </p>
          </div>

          {/* 피드백 토스트 알림 */}
          {joinedToast && (
            <div className="bg-emerald-700 text-white text-xs font-black p-3 rounded-xl shadow-md text-center animate-bounce">
              {joinedToast}
            </div>
          )}

          {/* 메인 액션 버튼 */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleJoinRound}
              className="w-full py-4 px-4 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-black text-base rounded-2xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-emerald-500"
            >
              <span>⛳ 동반자로 입장하기</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <Link
              href="/"
              className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs rounded-xl text-center flex items-center justify-center gap-1.5 transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>파크온 홈으로 이동</span>
            </Link>
          </div>
        </div>

        {/* 하단 안심 안내 바 */}
        <div className="bg-stone-50 p-3 border-t border-stone-100 text-center">
          <p className="text-[10px] text-stone-600 font-medium">
            파크온은 별도 회원가입 없이 스마트폰 브라우저에서 바로 사용하실 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RoundJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-100 flex items-center justify-center font-bold text-stone-500">초대 정보 불러오는 중...</div>}>
      <RoundJoinContent />
    </Suspense>
  );
}
