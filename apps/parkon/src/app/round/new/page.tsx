'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, Flag, Play, Plus, Trash2, ArrowLeft, MapPin, Edit3, Settings, QrCode, Copy, Check, Sparkles, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Course, RoundPlayer, RoundSession, formatCourseHolesText } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';
import { generateStandardHoles } from '@/lib/defaultCourses';
import { getDefaultSelfName, sortPlayersByLeaderAndAlphabetical } from '@/lib/playerUtils';
import { generateQrCodeDataUrl } from '@/lib/qrUtils';
import { PlayStartNoticeModal } from '@/components/PlayStartNoticeModal';

const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

interface SetupPlayer {
  id: string;
  name: string;
  isLeader: boolean;
  isSelf: boolean;
}

function NewRoundForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || searchParams.get('course');
  const joinedPlayer = searchParams.get('joined');

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedCourseLetter, setSelectedCourseLetter] = useState<string>('A');
  const [startHoleIndex, setStartHoleIndex] = useState<number>(1);
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [playersList, setPlayersList] = useState<SetupPlayer[]>([
    { id: 'p_self', name: '김대희', isLeader: true, isSelf: true },
    { id: 'p_2', name: '동반자1', isLeader: false, isSelf: false },
    { id: 'p_3', name: '동반자2', isLeader: false, isSelf: false },
    { id: 'p_4', name: '동반자3', isLeader: false, isSelf: false },
  ]);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [roomId] = useState<string>(() => 'room_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [joinSimulationToast, setJoinSimulationToast] = useState<string | null>(null);
  const [showPlayStartNotice, setShowPlayStartNotice] = useState<boolean>(false);

  useEffect(() => {
    const selfName = getDefaultSelfName();
    if (selfName) {
      setPlayersList((prev) =>
        prev.map((p, idx) => (idx === 0 || p.isSelf ? { ...p, name: selfName, isSelf: true } : p))
      );
    }
  }, []);

  // Course correction/expansion modal state
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editHoles, setEditHoles] = useState<number>(18);
  const [editContributor, setEditContributor] = useState<string>('');

  useEffect(() => {
    const all = ParkOnStorage.getAllCourses();
    setCourses(all);
    if (initialCourseId && all.some((c) => c.id === initialCourseId)) {
      setSelectedCourseId(initialCourseId);
    } else {
      setSelectedCourseId(ParkOnStorage.getHomeCourseId());
    }
  }, [initialCourseId]);

  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const numCourses = currentCourse
    ? currentCourse.totalCourses || Math.max(1, Math.round(currentCourse.totalHoles / 9))
    : 2;
  const availableLetters = COURSE_LETTERS.slice(0, numCourses);

  // When course changes, initialize selected starting course safely to 'A'
  useEffect(() => {
    if (availableLetters.length > 0) {
      if (!availableLetters.includes(selectedCourseLetter)) {
        setSelectedCourseLetter(availableLetters[0]);
      }
    }
  }, [selectedCourseId]);

  // Compute 9 hole numbers in shotgun cyclic order starting from startHoleIndex (1 to 9)
  const courseIdx = Math.max(0, COURSE_LETTERS.indexOf(selectedCourseLetter));
  const baseHoles = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => courseIdx * 9 + i);
  const startOffset = Math.max(0, Math.min(8, startHoleIndex - 1));
  const orderedHoleNumbers: number[] = [
    ...baseHoles.slice(startOffset),
    ...baseHoles.slice(0, startOffset),
  ];

  // Calculate total Par for selected course (9 holes)
  const totalSelectedPar = baseHoles.reduce((sum, hNum) => {
    const meta = currentCourse?.holesMetadata.find((m) => m.hole === hNum);
    return sum + (meta?.par || 3);
  }, 0);

  useEffect(() => {
    if (currentCourse) {
      setEditHoles(currentCourse.totalHoles || 18);
      setEditContributor(currentCourse.contributorName || '');
    }
  }, [currentCourse]);

  const openEditModal = () => {
    if (currentCourse) {
      setEditHoles(currentCourse.totalHoles || 18);
      setEditContributor(currentCourse.contributorName || '');
    }
    setShowEditModal(true);
  };

  const handleSaveCourseCorrection = () => {
    if (!currentCourse) return;
    const coursesCount = Math.max(1, Math.round(editHoles / 9));
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedHoles = (currentCourse.holesMetadata && currentCourse.holesMetadata.length >= editHoles)
      ? currentCourse.holesMetadata.slice(0, editHoles)
      : generateStandardHoles(editHoles);

    const updatedCourse: Course = {
      ...currentCourse,
      totalCourses: coursesCount,
      totalHoles: editHoles,
      holesMetadata: updatedHoles,
      contributorName: editContributor.trim() || currentCourse.contributorName || '파크온 골퍼',
      contributedAt: todayStr,
    };

    ParkOnStorage.updateCourse(updatedCourse);

    // Refresh courses list in state
    const all = ParkOnStorage.getAllCourses();
    setCourses([...all]);
    setSelectedCourseId(updatedCourse.id);

    // Adjust selected course letter if out of range
    const newLetters = COURSE_LETTERS.slice(0, coursesCount);
    if (!newLetters.includes(selectedCourseLetter)) {
      setSelectedCourseLetter(newLetters[0] || 'A');
    }
    setStartHoleIndex(1);
    setShowEditModal(false);
  };

  const handlePlayerNameChange = (index: number, val: string) => {
    setPlayersList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: val };
      return updated;
    });
  };

  const handleSetLeader = (index: number) => {
    setPlayersList((prev) =>
      prev.map((p, i) => ({
        ...p,
        isLeader: i === index,
      }))
    );
  };

  // 플레이어 수 선택 변경 (1명 ~ 6명)
  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const selfName = getDefaultSelfName();
    setPlayersList((prev) => {
      const current = [...prev];
      if (current.length === 0) {
        current.push({ id: 'p_self', name: selfName, isLeader: true, isSelf: true });
      } else {
        current[0] = { ...current[0], name: current[0].name || selfName, isSelf: true };
      }

      if (count > current.length) {
        for (let i = current.length; i < count; i++) {
          current.push({
            id: `p_${Date.now()}_${i}`,
            name: `동반자${i}`,
            isLeader: false,
            isSelf: false,
          });
        }
      } else if (count < current.length) {
        current.splice(count);
        if (!current.some((p) => p.isLeader)) {
          current[0].isLeader = true;
        }
      }
      return current;
    });
  };

  // QR 코드 동반자 입장 시뮬레이션
  const handleSimulateQrJoin = (guestName: string) => {
    const targetIdx = playersList.findIndex((p, idx) => idx > 0 && (p.name.startsWith('동반자') || !p.name.trim()));
    if (targetIdx !== -1) {
      setPlayersList((prev) => {
        const updated = [...prev];
        updated[targetIdx] = { ...updated[targetIdx], name: guestName };
        return updated;
      });
    } else if (playerCount < 6) {
      const newCount = playerCount + 1;
      setPlayerCount(newCount);
      setPlayersList((prev) => [
        ...prev,
        {
          id: `p_qr_${Date.now()}`,
          name: guestName,
          isLeader: false,
          isSelf: false,
        },
      ]);
    }
    setJoinSimulationToast(`🎉 '${guestName}' 님이 QR 코드로 라운드에 자동 입장하였습니다!`);
    setTimeout(() => setJoinSimulationToast(null), 3500);
  };

  // URL 쿼리(초대 링크를 타고 들어온 동반자) 자동 합류 처리
  useEffect(() => {
    if (joinedPlayer) {
      const decodedName = decodeURIComponent(joinedPlayer).trim();
      if (decodedName) {
        handleSimulateQrJoin(decodedName);
      }
    }
  }, [joinedPlayer]);

  // 초대 링크 및 실제 카메라 인식용 QR 코드 생성 (roomId 포함)
  const currentLeader = playersList.find((p) => p.isLeader) || playersList[0];
  const leaderName = currentLeader?.name || '조장';
  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/round/join?roomId=${encodeURIComponent(roomId)}&course=${selectedCourseId || 'course_1'}&leader=${encodeURIComponent(leaderName)}`
    : `https://parkon.kr/round/join?roomId=${encodeURIComponent(roomId)}&course=${selectedCourseId || 'course_1'}&leader=${encodeURIComponent(leaderName)}`;

  useEffect(() => {
    if (showQrModal && inviteUrl) {
      generateQrCodeDataUrl(inviteUrl)
        .then((url) => {
          if (url) setQrDataUrl(url);
        })
        .catch((err) => {
          console.error('Failed to generate real QR Code:', err);
        });
    }
  }, [showQrModal, inviteUrl]);

  // 1. 조장의 셋업 변경사항을 서버 룸(Room)에 지속 동기화 (sync)
  useEffect(() => {
    if (!roomId) return;
    try {
      fetch('/api/round/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          roomId,
          leaderName,
          courseId: selectedCourseId || 'course_1',
          courseName: currentCourse?.name || '구미 동락 파크골프장',
          courseLetter: selectedCourseLetter,
          startHoleIndex,
          playerCount,
          players: playersList.slice(0, playerCount).map((p) => ({
            id: p.id,
            name: p.name,
            isLeader: p.isLeader,
          })),
        }),
      }).catch((e) => console.error('Failed to sync room:', e));
    } catch (e) {
      console.error(e);
    }
  }, [roomId, selectedCourseId, currentCourse?.name, selectedCourseLetter, startHoleIndex, playerCount, playersList, leaderName]);

  // 2. 동반자 입장 실시간 감지 (1초 폴링 + BroadcastChannel 즉각 반응)
  useEffect(() => {
    if (!roomId) return;

    let isSubscribed = true;

    const pollJoinedCompanions = async () => {
      try {
        const res = await fetch(`/api/round/room?roomId=${encodeURIComponent(roomId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.room && isSubscribed) {
            const serverPlayers: { id: string; name: string; isLeader: boolean }[] = data.room.players || [];

            setPlayersList((prev) => {
              let updated = false;
              const next = [...prev];

              serverPlayers.forEach((sp, idx) => {
                if (idx > 0 && sp.name && !sp.name.startsWith('동반자')) {
                  if (next[idx] && next[idx].name !== sp.name) {
                    next[idx] = { ...next[idx], name: sp.name };
                    updated = true;
                  } else if (!next[idx] && next.length < 6) {
                    next.push({ id: sp.id || `p_${Date.now()}`, name: sp.name, isLeader: false, isSelf: false });
                    updated = true;
                  }
                }
              });

              if (updated) {
                const latestGuest = serverPlayers.find((sp) => sp.name && !sp.isLeader && !sp.name.startsWith('동반자'));
                if (latestGuest) {
                  setJoinSimulationToast(`🎉 '${latestGuest.name}' 님이 QR 코드로 라운드에 자동 입장하였습니다!`);
                  setTimeout(() => setJoinSimulationToast(null), 3500);
                }
              }

              return updated ? next : prev;
            });
          }
        }
      } catch (e) {
        console.error('Failed to poll room guests:', e);
      }
    };

    const interval = setInterval(pollJoinedCompanions, 1000);

    // 동일 기기 탭 브로드캐스트 리스너
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('parkon_room_sync');
      bc.onmessage = (event) => {
        if (event.data && event.data.roomId === roomId && event.data.joinedPlayer && isSubscribed) {
          handleSimulateQrJoin(event.data.joinedPlayer);
        }
      };
    }

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      if (bc) bc.close();
    };
  }, [roomId]);

  // 강력한 카카오톡/문자/링크 공유 함수 (모바일 네이티브 공유 -> 클립보드 -> 임시 텍스트에어리어 -> 프롬프트 폴백)
  const handleShareInvite = async () => {
    const courseName = currentCourse?.name || '파크골프장';
    const shareTitle = `[파크온] ${courseName} 라운딩 초대`;
    const shareText = `[파크온 동반자 초대]\n⛳ ${courseName} 함께 라운딩해요!\n조장: ${leaderName}\n아래 링크를 누르면 동반자로 자동 등록됩니다:\n${inviteUrl}`;

    // 1. 모바일 환경에서 시스템 공유 시트 (카카오톡, 문자 등 직접 선택 가능)
    if (typeof navigator !== 'undefined' && navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent || '')) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: inviteUrl,
        });
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
        return;
      } catch (err) {
        // 사용자가 취소했거나 권한 제한 시 클립보드 복사로 전환
      }
    }

    // 2. 최신 비동기 클립보드 API
    let copied = false;
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        copied = true;
      } catch {
        copied = false;
      }
    }

    // 3. 권한 제한 / HTTP 환경 대비 임시 textarea + execCommand 폴백
    if (!copied && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        textarea.setAttribute('readonly', '');
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        copied = false;
      }
    }

    // 4. 최후의 수단: 브라우저 기본 안내창
    if (!copied && typeof window !== 'undefined') {
      window.prompt('초대 링크를 복사하여 카카오톡이나 문자에 붙여넣으세요:', inviteUrl);
      copied = true;
    }

    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 4000);
  };

  const startRound = async () => {
    if (!currentCourse) return;

    const newId = 'round_' + Date.now();

    // Map active players based on current playerCount and apply sorting: Leader is always #1, others in Korean alphabetical order (가나다순)
    const activePlayers = playersList.slice(0, playerCount);
    const rawPlayers: RoundPlayer[] = activePlayers.map((p, idx) => ({
      id: `player_${idx}_${Date.now()}`,
      name: p.name.trim() || (p.isSelf ? getDefaultSelfName() : `선수 ${idx + 1}`),
      isLeader: p.isLeader,
      isSelf: p.isSelf,
      scores: {},
      obCount: {},
      totalStrokes: 0,
      totalParDiff: 0,
    }));

    const sortedPlayers = sortPlayersByLeaderAndAlphabetical(rawPlayers);

    const newSession: RoundSession = {
      id: newId,
      courseId: currentCourse.id,
      courseName: currentCourse.name,
      startedAt: new Date().toISOString(),
      currentHole: 1, // 1st hole of the session (which corresponds to orderedHoleNumbers[0])
      totalHoles: 9,
      selectedCourseLetters: [selectedCourseLetter],
      selectedHoleNumbers: orderedHoleNumbers,
      confirmedHoles: [],
      players: sortedPlayers,
      status: 'IN_PROGRESS',
    };

    // 3. 서버 룸(Room)에 라운드 시작 알림 -> 대기실의 동반자들도 즉시 스코어카드로 자동 이동!
    try {
      await fetch('/api/round/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          roomId,
          roundSession: newSession,
        }),
      });

      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('parkon_room_sync');
        bc.postMessage({
          roomId,
          room: {
            status: 'STARTED',
            roundId: newId,
            roundSession: newSession,
          },
        });
        bc.close();
      }
    } catch (e) {
      console.error('Failed to notify room start:', e);
    }

    ParkOnStorage.saveCurrentRound(newSession);
    ParkOnStorage.setHomeCourseId(currentCourse.id);
    router.push(`/round/${newId}`);
  };

  const handleInitiateStartRound = () => {
    if (typeof window !== 'undefined') {
      const hideDate = localStorage.getItem('parkon_hide_round_notice_date');
      const today = new Date().toISOString().slice(0, 10);
      if (hideDate === today) {
        startRound();
        return;
      }
    }
    setShowPlayStartNotice(true);
  };

  return (
    <div className="p-3.5 space-y-3.5">
      {/* Top bar */}
      <div className="flex items-center gap-2">
        <Link href="/" className="p-1.5 -ml-1.5 text-stone-700 hover:text-stone-950">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-lg font-black text-stone-900 leading-tight">새 라운드 시작 설정</h2>
          <p className="text-[11px] text-stone-600 font-semibold">
            플레이할 구장과 코스를 자유롭게 선택하세요
          </p>
        </div>
      </div>

      {/* 🎯 가상 라운딩 1초 체험 배너 (기록 걱정 없이 언제든 테스트 가능) */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-3 text-white shadow-md flex items-center justify-between gap-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 font-black text-xs text-stone-950 bg-amber-200/90 w-fit px-2 py-0.5 rounded-full">
            <span>🎯</span>
            <span>기록 부담 없는 가상 라운딩 체험</span>
          </div>
          <p className="text-[11px] text-amber-100 font-medium leading-tight">
            시간 무제한 · 종료 시 기록 제로(무흔적) 안심 연습
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const virtualSession = ParkOnStorage.createVirtualRoundSession(currentCourse?.id || selectedCourseId);
            router.push(`/round/${virtualSession.id}`);
          }}
          className="bg-stone-950 hover:bg-stone-900 text-amber-300 font-black text-xs px-3 py-2 rounded-xl shrink-0 shadow transition active:scale-95 flex items-center gap-1 cursor-pointer"
        >
          <span>1초 체험 ▶</span>
        </button>
      </div>

      {/* 1. Current Play Course Display Card (구장에만 집중: 선택창/검색버튼/라벨 완전 제거) */}
      {currentCourse && (
        <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-sm">
          <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-3 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-base font-black text-emerald-950 flex items-center gap-1.5">
                <span>⛳</span>
                <span>{currentCourse.name}</span>
              </span>
              <span className="text-xs font-black bg-emerald-700 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                {formatCourseHolesText(currentCourse)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-stone-700 font-semibold pt-0.5">
              <p className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                <span>{currentCourse.region}</span>
              </p>
              <button
                type="button"
                onClick={openEditModal}
                className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-black py-1 px-2.5 rounded-lg flex items-center gap-1 shadow-xs transition active:scale-95 text-[11px]"
              >
                <Settings className="w-3 h-3 text-emerald-700" />
                <span>코스·홀수 정정</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Starting Course & Hole Selection (좌측 9개 칩 + 우측 시작 버튼) */}
      <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-sm space-y-2.5">
        <label className="text-sm font-black text-stone-900 flex items-center gap-1.5">
          <Flag className="w-4 h-4 text-emerald-700" />
          <span>어느 코스부터 시작하겠습니까?</span>
        </label>

        {/* Clean Course Chips Grid: 단일 선택 (A코스 한 줄 표시) */}
        <div className="grid grid-cols-4 gap-1.5 pt-0.5">
          {availableLetters.map((letter) => {
            const isSelected = selectedCourseLetter === letter;

            return (
              <button
                key={letter}
                type="button"
                onClick={() => {
                  setSelectedCourseLetter(letter);
                  setStartHoleIndex(1);
                }}
                className={`py-2 px-1.5 rounded-xl border-2 transition flex items-center justify-center gap-1 active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-1 ring-emerald-500/30'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
                }`}
              >
                <span className="font-black text-sm whitespace-nowrap">
                  {letter}코스
                </span>
                {isSelected && (
                  <span className="text-xs font-black">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ⛳ 홀 번호 선택 (1~9번 홀 3×3 전폭 레이아웃) */}
        <div className="pt-2 border-t border-stone-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-stone-800">
            <span>몇 번 홀에서 티샷을 시작하겠습니까?</span>
            <span className="text-emerald-800 font-extrabold bg-emerald-100 px-2.5 py-0.5 rounded-full text-xs">
              {startHoleIndex === 1 ? '1번 정규 출발' : `${startHoleIndex}번 샷건 출발`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hNum) => {
              const isSelected = startHoleIndex === hNum;
              return (
                <button
                  key={hNum}
                  type="button"
                  onClick={() => setStartHoleIndex(hNum)}
                  className={`py-3 rounded-xl font-black text-base transition flex items-center justify-center gap-1 border-2 active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400/40'
                      : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span>{hNum}번 홀</span>
                  {isSelected && <span className="text-xs text-yellow-300">✓</span>}
                </button>
              );
            })}
          </div>

          {startHoleIndex !== 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5 text-[10px] text-amber-900 font-bold flex items-center gap-1">
              <span>🎯</span>
              <span>
                샷건 순환: {selectedCourseLetter}코스 {orderedHoleNumbers.map((h) => ((h - 1) % 9) + 1).join(' ➔ ')}번 홀 (총 9홀)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Players Input with Dynamic Player Count & Leader Selection */}
      <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-sm space-y-3">
        {/* Header: 동반자 명단 + 플레이어 수 원터치 탭 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>동반자 명단</span>
            </label>
            <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              👑 조장 1번 · 나머지 가나다순 정렬
            </span>
          </div>

          <div className="flex items-center justify-between bg-stone-50 p-2 rounded-xl border border-stone-200/80">
            <span className="text-xs font-bold text-stone-700">플레이어 수:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePlayerCountChange(num)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition active:scale-95 cursor-pointer ${
                    playerCount === num
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  {num}명
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* QR Code Auto-Invite Banner */}
        <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl p-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            <div>
              <div className="text-xs font-black text-emerald-950">스마트폰 QR 동반자 자동 등록</div>
              <div className="text-[10px] text-emerald-700">카메라로 비추면 동반자 이름이 명단에 쏙 채워집니다</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs active:scale-95 transition flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR코드 초대</span>
          </button>
        </div>

        {/* Toast Notification when QR simulation adds a player */}
        {joinSimulationToast && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-3 py-2 rounded-xl text-xs font-bold animate-in fade-in flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{joinSimulationToast}</span>
          </div>
        )}

        {/* 안내문 */}
        <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-2.5 text-[11px] text-amber-950 font-bold space-y-0.5">
          <div className="flex items-center gap-1 text-amber-900 font-black">
            <span>💡</span>
            <span>조장 지정 및 정렬 안내</span>
          </div>
          <p className="text-stone-600 leading-snug">
            동반자 이름을 자유롭게 입력하신 후, 우측 끝의 <strong>[👑 조장]</strong> 버튼을 누르면 그 분이 1번으로 자동 지정되고 나머지 분들은 <strong>가나다순</strong>으로 자동 정렬되어 게임이 시작됩니다.
          </p>
        </div>

        {/* Dynamic Player Rows (1 to playerCount) */}
        <div className="space-y-2 pt-0.5">
          {playersList.slice(0, playerCount).map((player, idx) => (
            <div
              key={player.id}
              className={`p-2.5 rounded-xl border-2 transition flex items-center gap-2.5 ${
                player.isLeader
                  ? 'bg-amber-50/90 border-amber-400 shadow-xs'
                  : 'bg-stone-50 border-stone-200 hover:bg-stone-100/50'
              }`}
            >
              {/* Number circle */}
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                  player.isLeader
                    ? 'bg-amber-400 text-amber-950 shadow-xs'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {idx + 1}
              </span>

              {/* Name input */}
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => handlePlayerNameChange(idx, e.target.value)}
                  placeholder={player.isSelf ? '본인 이름 (김대희/나이스버디)' : `동반자 ${idx + 1} 이름 입력`}
                  className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-sm font-bold text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                {player.isSelf && (
                  <span className="absolute right-2 text-[10px] font-black text-blue-700 bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded">
                    본인
                  </span>
                )}
              </div>

              {/* Rightmost Leader Toggle Button (우측 끝 조장 버튼) */}
              <button
                type="button"
                onClick={() => handleSetLeader(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 transition flex items-center gap-1 active:scale-95 cursor-pointer ${
                  player.isLeader
                    ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
                    : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-100 hover:text-stone-900'
                }`}
                title={player.isLeader ? '현재 조장으로 지정됨 (1번 배치)' : '이 선수를 조장으로 지정'}
              >
                <span>👑</span>
                <span>{player.isLeader ? '조장' : '조장 선택'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Bottom Start Button */}
      <button
        type="button"
        onClick={handleInitiateStartRound}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-base font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
      >
        <Play className="w-4 h-4 fill-current" />
        <span>
          {selectedCourseLetter}코스 {startHoleIndex}번 홀 티샷 시작 ⛳
        </span>
      </button>

      {/* 5. Course Hole Expansion / Correction Modal */}
      {showEditModal && currentCourse && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-2xl space-y-3.5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-1">
                  <span>⛳ {currentCourse.name} 코스/홀수 정정</span>
                </h3>
                <p className="text-[11px] text-stone-500 font-medium">
                  새로 등록할 필요 없이 코스 확장을 바로 반영합니다
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  현재 구장의 실제 총 코스 및 홀수 선택
                </label>
                <select
                  value={editHoles}
                  onChange={(e) => setEditHoles(Number(e.target.value))}
                  className="w-full bg-stone-50 border-2 border-emerald-500 rounded-xl px-3 py-2.5 text-sm font-black text-stone-900 outline-none"
                >
                  <option value={9}>총 1코스 9홀 (A코스)</option>
                  <option value={18}>총 2코스 18홀 (A, B코스)</option>
                  <option value={27}>총 3코스 27홀 (A, B, C코스)</option>
                  <option value={36}>총 4코스 36홀 (A, B, C, D코스)</option>
                  <option value={45}>총 5코스 45홀 (A~E코스)</option>
                  <option value={54}>총 6코스 54홀 (A~F코스)</option>
                  <option value={63}>총 7코스 63홀 (A~G코스)</option>
                  <option value={72}>총 8코스 72홀 (A~H코스)</option>
                  <option value={108}>총 12코스 108홀 (A~L코스)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  정정자 닉네임 (명예의 전당 등록)
                </label>
                <input
                  type="text"
                  value={editContributor}
                  onChange={(e) => setEditContributor(e.target.value)}
                  placeholder="예: 옥성클럽회장 (선택)"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-950 font-medium leading-relaxed">
                💡 <b>신규 등록을 중복으로 하실 필요가 없습니다!</b> 여기서 변경하시면 구장의 총 코스 수가 확장되어 A코스, B코스 선택이 즉시 가능해집니다.
              </div>
            </div>

            <div className="flex gap-2 pt-1 border-t border-stone-100">
              <button
                type="button"
                onClick={handleSaveCourseCorrection}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl text-sm shadow active:scale-95 transition"
              >
                즉시 정정 및 반영하기 ✓
              </button>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. QR Code Companion Auto-Invite Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-stone-200 animate-scaleUp max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 p-4 shrink-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">📱</span>
                <div>
                  <h3 className="font-black text-stone-900 text-base leading-tight">동반자 QR코드 자동 초대</h3>
                  <p className="text-xs text-stone-500">카메라로 비추면 명단에 자동 등록</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center font-bold text-sm cursor-pointer shrink-0 transition"
              >
                ✕
              </button>
            </div>

            {/* 스크롤 가능한 모달 본문 */}
            <div className="p-4 space-y-3.5 overflow-y-auto flex-1 overscroll-contain">
              {/* QR Code Display */}
            <div data-room-id={roomId} data-invite-url={inviteUrl} className="flex flex-col items-center justify-center p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center space-y-2.5">
              <div className="p-3 bg-white rounded-2xl shadow-sm border-2 border-emerald-500/30 flex flex-col items-center justify-center relative">
                {qrDataUrl ? (
                  <div className="relative flex items-center justify-center">
                    <img
                      src={qrDataUrl}
                      alt="동반자 초대 QR 코드"
                      className="w-48 h-48 rounded-xl object-contain shadow-inner"
                    />
                    {/* Center Emblem Badge */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-md border-2 border-emerald-600 flex items-center justify-center">
                        <span className="text-xl">⛳</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-stone-400 font-bold text-sm">
                    QR 코드 생성 중...
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    초대 구장: {currentCourse?.name || '파크골프장'}
                  </span>
                  <span className="text-[11px] font-bold text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded-md">
                    대기실 코드: #{roomId ? roomId.slice(-6).toUpperCase() : 'PARK'}
                  </span>
                </div>
                <p className="text-[12px] text-stone-700 font-extrabold">
                  📷 동반자가 스마트폰 기본 카메라로 비추면 바로 참가 대기실이 열립니다.
                </p>
              </div>
            </div>

            {/* 실시간 동반자 입장 감지 현황 박스 (QR 모달 안에서 바로 확인 가능) */}
            <div className="bg-emerald-50/90 border-2 border-emerald-400/80 rounded-xl p-3 space-y-2 text-left shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>실시간 동반자 참여 현황</span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  실시간 자동 감지 중
                </span>
              </div>

              <div className="space-y-1.5 pt-0.5">
                {playersList.slice(0, playerCount).map((p, idx) => {
                  const isJoined = p.isLeader || !p.name.startsWith('동반자');
                  return (
                    <div
                      key={p.id || idx}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs transition ${
                        p.isLeader
                          ? 'bg-amber-100/90 border-amber-300 text-amber-950 font-black'
                          : isJoined
                          ? 'bg-white border-emerald-500 text-emerald-950 font-black shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-400 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                            p.isLeader
                              ? 'bg-amber-400 text-amber-950'
                              : isJoined
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-200 text-stone-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate">{p.name}</span>
                      </div>

                      <div className="shrink-0">
                        {p.isLeader ? (
                          <span className="text-[10px] bg-amber-200 text-amber-900 font-black px-1.5 py-0.5 rounded">
                            👑 조장
                          </span>
                        ) : isJoined ? (
                          <span className="text-[10px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            ✓ 입장 완료
                          </span>
                        ) : (
                          <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                            스캔 대기 중...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 눈에 잘 띄는 카카오톡/문자용 초대 링크 복사 네모 박스 (QR 바로 밑에 배치) */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={handleShareInvite}
                className="w-full py-3.5 px-4 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm border border-[#E6CF00] transition active:scale-98 cursor-pointer"
              >
                <span className="text-base leading-none">💬</span>
                <span>{copiedLink ? '초대 링크 복사 완료!' : '카카오톡 / 문자 초대장 보내기'}</span>
                {copiedLink ? (
                  <Check className="w-4 h-4 ml-auto text-emerald-800 font-black" />
                ) : (
                  <Share2 className="w-4 h-4 ml-auto text-stone-700" />
                )}
              </button>

              {/* 클릭 시 안내 문구 네모 박스 */}
              {copiedLink ? (
                <div className="bg-emerald-700 text-white rounded-xl p-3 text-xs font-black text-center shadow-md animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-1.5 text-emerald-100">
                    <span className="text-sm">📋</span>
                    <span className="text-xs font-black text-white">초대 링크가 복사되었습니다!</span>
                  </div>
                  <p className="text-[11px] text-emerald-100 font-medium leading-tight">
                    카카오톡이나 문자 등 <span className="underline font-bold text-white">초청하고 싶은 곳에 [붙여넣기]</span> 하시면 됩니다.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg py-1.5 px-2.5 text-[11px] text-amber-900 text-center flex items-center justify-center gap-1">
                  <span>👉</span>
                  <span>클릭 시 복사되며, 카카오톡·문자 대화창에 [붙여넣기] 하시면 됩니다.</span>
                </div>
              )}
            </div>

            {/* Guide bullet points */}
            <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3 text-xs text-amber-950 space-y-1">
              <div className="font-extrabold flex items-center gap-1 text-amber-900">
                <span>💡</span>
                <span>QR 동반자 자동 등록 안내</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                • 동반자가 파크온에 가입되어 있다면, 본인 프로필명(실명/닉네임)으로 자동 승인됩니다.<br />
                • 동반자가 참여하면 방장 화면의 명단 빈칸에 이름이 자동으로 쏙 채워집니다.<br />
                • 라운드 시작 후에는 동반자 스마트폰에서도 실시간 스코어가 함께 공유됩니다.
              </p>
            </div>

            {/* Instant Test Simulator Button */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  handleSimulateQrJoin('이동반');
                  setShowQrModal(false);
                }}
                className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>[체험 테스트] 동반자(이동반 님) 자동 참여 시뮬레이션</span>
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Play Start Verification & Encouragement Notice Modal */}
      <PlayStartNoticeModal
        isOpen={showPlayStartNotice}
        onClose={() => setShowPlayStartNotice(false)}
        onConfirm={() => {
          setShowPlayStartNotice(false);
          startRound();
        }}
        courseName={currentCourse?.name}
        courseLetter={selectedCourseLetter}
        startHole={startHoleIndex}
      />
    </div>
  );
}

export default function NewRoundPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-stone-600">설정 불러오는 중...</div>}>
      <NewRoundForm />
    </Suspense>
  );
}
