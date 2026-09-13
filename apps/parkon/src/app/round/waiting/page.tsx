'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ParkOnStorage } from '@/lib/storage';
import { RoundSession, RoundPlayer } from '@/types/parkon';
import { CheckCircle2, Users, MapPin, Flag, Home, Sparkles, Loader2 } from 'lucide-react';
import { ParkOnRoom } from '@/app/api/round/room/route';

function WaitingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roomId = searchParams.get('roomId') || '';
  const guestParam = searchParams.get('guest') || '';

  const [room, setRoom] = useState<ParkOnRoom | null>(null);
  const [guestName, setGuestName] = useState<string>(guestParam);
  const [startingToast, setStartingToast] = useState<string | null>(null);

  // 1. 게스트 이름 초기화
  useEffect(() => {
    if (guestParam) {
      setGuestName(decodeURIComponent(guestParam));
    } else {
      try {
        const defaultName = ParkOnStorage.getUserDisplayName();
        setGuestName(defaultName && defaultName !== '파크골퍼' ? defaultName : '동반자');
      } catch {
        setGuestName('동반자');
      }
    }
  }, [guestParam]);

  // 2. 룸 상태 1초 폴링 및 동기화
  useEffect(() => {
    if (!roomId) return;

    let isSubscribed = true;

    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/round/room?roomId=${encodeURIComponent(roomId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.room && isSubscribed) {
            setRoom(data.room);

            // 조장이 티샷을 시작했는지 확인
            if (data.room.status === 'STARTED' && data.room.roundId) {
              handleRoundStart(data.room);
            }
          }
        }
      } catch (err) {
        console.error('Room polling error:', err);
      }
    };

    fetchRoom();
    const interval = setInterval(fetchRoom, 1000);

    // BroadcastChannel 이중 동기화 (동일 브라우저/디바이스 테스트 시 즉시 반응)
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('parkon_room_sync');
      bc.onmessage = (event) => {
        if (event.data && event.data.roomId === roomId && isSubscribed) {
          if (event.data.room) {
            setRoom(event.data.room);
            if (event.data.room.status === 'STARTED') {
              handleRoundStart(event.data.room);
            }
          }
        }
      };
    }

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [roomId, guestName]);

  // 3. 조장이 티샷을 시작했을 때 동반자도 경기 세션을 로컬에 복제하고 자동 이동
  const handleRoundStart = (activeRoom: ParkOnRoom) => {
    if (startingToast) return; // 이미 이동 중

    setStartingToast('⛳ 조장님이 티샷을 시작했습니다! 스코어카드로 입장합니다...');

    try {
      let session: RoundSession | null = activeRoom.roundSession;

      if (session) {
        // 동반자 본인(isSelf: true) 및 조장(isLeader: true) 명확 분리
        const myName = guestName.trim() || '동반자';
        const updatedPlayers: RoundPlayer[] = session.players.map((p, idx) => {
          const isLeader = p.isLeader || idx === 0;
          const isMe = !isLeader && (p.name === myName || idx === 1);
          return {
            ...p,
            isLeader,
            isSelf: isMe,
          };
        });

        // 만약 내 이름이 명단에 없다면 추가
        if (!updatedPlayers.some((p) => p.isSelf) && updatedPlayers.length < 6) {
          updatedPlayers.push({
            id: `p_guest_${Date.now()}`,
            name: myName,
            isLeader: false,
            isSelf: true,
            scores: {},
            obCount: {},
            totalStrokes: 0,
            totalParDiff: 0,
          });
        }

        const customizedSession: RoundSession = {
          ...session,
          players: updatedPlayers,
        };

        ParkOnStorage.saveCurrentRound(customizedSession);
      }

      setTimeout(() => {
        router.replace(`/round/${activeRoom.roundId}`);
      }, 1000);
    } catch (e) {
      console.error('Failed to transition to round:', e);
      router.replace(`/round/${activeRoom.roundId}`);
    }
  };

  const leaderName = room?.leaderName || '조장';
  const playersList = room?.players || [
    { id: '1', name: leaderName, isLeader: true },
    { id: '2', name: guestName, isLeader: false },
    { id: '3', name: '동반자2 (대기 중)', isLeader: false },
    { id: '4', name: '동반자3 (대기 중)', isLeader: false },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-start p-4 select-none pb-12">
      {/* 시작 시 축하 전환 토스트 */}
      {startingToast && (
        <div className="fixed top-6 left-4 right-4 z-50 max-w-sm mx-auto bg-emerald-700 text-white font-black text-sm p-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-emerald-400 animate-bounce">
          <Sparkles className="w-6 h-6 text-amber-300 shrink-0" />
          <p className="leading-snug">{startingToast}</p>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-emerald-800/10">
        {/* Header Visual Hero */}
        <div className="bg-emerald-900 text-white p-6 text-center relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-700/30 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-6 -top-6 w-32 h-32 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />

          {/* 파키 마스코트 환영 깃발 이미지 */}
          <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-md border-2 border-emerald-400/40 bg-emerald-800 mb-3.5">
            <Image
              src="/mascot/사진저장고_사진_20260913_28.jpg"
              alt="파크온 마스코트 환영 파키"
              fill
              className="object-cover"
              priority
            />
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-black bg-amber-400 text-amber-950 px-3 py-1 rounded-full uppercase tracking-wider mb-2 shadow-sm">
            👑 조장 초대 라운드 대기실
          </span>
          <h1 className="text-xl font-black tracking-tight text-white mb-1">
            {leaderName} 님의 방에 입장했습니다!
          </h1>
          <p className="text-xs text-emerald-200 font-medium">
            조장님이 구장과 홀 설정을 마친 후 [티샷 시작]을 누르면 함께 시작합니다.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* 1. 구장 및 코스 안내 카드 */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>{room?.courseName || '구미 동락 파크골프장'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold bg-white/80 p-2.5 rounded-xl border border-emerald-100">
              <Flag className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                출발 예정 코스: <strong className="text-emerald-950 font-black">{room?.courseLetter || 'A'}코스 {room?.startHoleIndex || 1}번 홀</strong>
              </span>
            </div>
          </div>

          {/* 2. 참여자 명단 카드 */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-stone-800 font-black text-sm">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>함께하는 동반자 명단</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                실시간 룸 대기 중
              </span>
            </div>

            <div className="space-y-2">
              {playersList.map((p, idx) => {
                const isLeader = p.isLeader || idx === 0;
                const isMe = p.name === guestName;

                return (
                  <div
                    key={p.id || idx}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                      isLeader
                        ? 'bg-amber-50/90 border-amber-300 text-amber-950 font-black'
                        : isMe
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-950 font-black'
                        : 'bg-white border-stone-200 text-stone-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          isLeader
                            ? 'bg-amber-400 text-amber-950'
                            : isMe
                            ? 'bg-emerald-700 text-white'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-sm font-black">
                        {p.name || `동반자 ${idx + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isLeader && (
                        <span className="text-xs bg-amber-200 text-amber-900 font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                          👑 조장 (설정 권한)
                        </span>
                      )}
                      {isMe && !isLeader && (
                        <span className="text-xs bg-emerald-700 text-white font-black px-2 py-0.5 rounded-md">
                          본인 (나)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. 조장 권한 안내 및 대기 상태 펄스 박스 */}
          <div className="bg-amber-50/90 border-2 border-amber-300/80 rounded-2xl p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-amber-950 font-black text-sm">
              <Loader2 className="w-4 h-4 text-amber-700 animate-spin" />
              <span>조장님이 라운드를 설정 중입니다</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              코스 선택과 티샷 시작은 <strong>초대한 조장({leaderName} 님)</strong>이 총괄 진행합니다.<br />
              조장님이 <strong>[티샷 시작]</strong>을 누르면 이 화면이 자동으로 경기 스코어카드로 전환되니 잠시만 대기해 주세요.
            </p>
          </div>

          {/* 4. 홈으로 이동 */}
          <div className="pt-2">
            <Link
              href="/"
              className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-98"
            >
              <Home className="w-4 h-4" />
              <span>대기 취소하고 홈으로 돌아가기</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WaitingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-stone-600">대기실 불러오는 중...</div>}>
      <WaitingContent />
    </Suspense>
  );
}
