'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, Flag, Play, Plus, Trash2, ArrowLeft, MapPin, Edit3, Settings, QrCode, Copy, Check, Sparkles, Share2, X } from 'lucide-react';
import Link from 'next/link';
import { Course, RoundPlayer, RoundSession, formatCourseHolesText } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';
import { generateStandardHoles } from '@/lib/defaultCourses';
import { getDefaultSelfName, sortPlayersByLeaderAndAlphabetical, isDefaultCompanionName, isSampleOrPlaceholder } from '@/lib/playerUtils';
import { generateQrCodeDataUrl } from '@/lib/qrUtils';
import { PlayStartNoticeModal } from '@/components/PlayStartNoticeModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getCourseDualName } from '@/lib/courseLocalization';
import { supabase } from '@/lib/supabase';

const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

interface SetupPlayer {
  id: string;
  name: string;
  isLeader: boolean;
  isSelf: boolean;
}

interface CompanionSlotRowProps {
  slotIndex: number;
  name: string;
  isLeader: boolean;
  isSelf: boolean;
  isJapanese: boolean;
  onCommit: (slotIndex: number, newName: string) => void;
  onSetLeader: (slotIndex: number) => void;
  onFocusChange?: (slotIndex: number, focused: boolean) => void;
}

const CompanionSlotRow = React.memo(function CompanionSlotRow({
  slotIndex,
  name,
  isLeader,
  isSelf,
  isJapanese,
  onCommit,
  onSetLeader,
  onFocusChange,
}: CompanionSlotRowProps) {
  const [localName, setLocalName] = useState(name);
  const localNameRef = useRef(name);
  const isFocusedRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 부모(서버 폴링/QR 동반자 입장 등)에서 전달된 name 동기화 (단, 현재 포커스 중인 경우 타이핑 보호)
  useEffect(() => {
    if (!isFocusedRef.current && name !== localNameRef.current) {
      setLocalName(name);
      localNameRef.current = name;
    }
  }, [name]);

  // 즉시 부모로 확정 저장(Flush)하는 헬퍼
  const flushCommit = useCallback(
    (valueToCommit: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      localNameRef.current = valueToCommit;
      onCommit(slotIndex, valueToCommit);
    },
    [slotIndex, onCommit]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalName(val);
    localNameRef.current = val;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    // 350ms 후 부모/서버 동기화 디바운스
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      onCommit(slotIndex, val);
    }, 350);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    onFocusChange?.(slotIndex, true);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    onFocusChange?.(slotIndex, false);
    // 포커스 벗어날 때 대기 중인 디바운스를 즉시 플러시하여 값 확정
    flushCommit(localNameRef.current);
  };

  const handleClear = () => {
    setLocalName('');
    flushCommit('');
  };

  // 언마운트 시 잔여 타이머 클린업
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      key={`slot-companion-${slotIndex}`}
      className={`p-2.5 rounded-xl border-2 transition flex items-center gap-2.5 ${
        isLeader
          ? 'bg-amber-50/90 border-amber-400 shadow-xs'
          : 'bg-stone-50 border-stone-200 hover:bg-stone-100/50'
      }`}
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
          isLeader
            ? 'bg-amber-400 text-amber-950 shadow-xs'
            : 'bg-stone-200 text-stone-700'
        }`}
      >
        {slotIndex + 1}
      </span>

      <div className="flex-1 relative flex items-center">
        <input
          type="text"
          value={localName}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={
            isSelf
              ? (isJapanese ? '代表のお名前 (例: 山田)' : '성명을 적어주세요 (조장/본인)')
              : (isJapanese ? 'お名前を入力 (例: 田中)' : `동반자 ${slotIndex + 1} (예: 이총무, 박회장)`)
          }
          className="w-full bg-white border border-stone-300 rounded-lg pl-3 pr-8 py-1.5 text-sm font-bold text-stone-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-stone-400"
        />
        {localName ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 w-5 h-5 flex items-center justify-center rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 hover:text-stone-900 text-xs transition cursor-pointer"
            title={isJapanese ? 'クリア' : '지우기'}
          >
            ✕
          </button>
        ) : isSelf ? (
          <span className="absolute right-2 text-[10px] font-black text-blue-700 bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded pointer-events-none">
            {isJapanese ? '本人' : '본인'}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onSetLeader(slotIndex)}
        className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 transition flex items-center gap-1 active:scale-95 cursor-pointer ${
          isLeader
            ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300'
            : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-100 hover:text-stone-900'
        }`}
        title={isLeader ? (isJapanese ? '代表に指定中' : '현재 조장으로 지정됨') : (isJapanese ? '代表に指定' : '이 선수를 조장으로 지정')}
      >
        <span>👑</span>
        <span>
          {isLeader
            ? (isJapanese ? '代表' : '조장')
            : (isJapanese ? '代表選択' : '조장 선택')}
        </span>
      </button>
    </div>
  );
});

function NewRoundForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isJapanese, isEnglish } = useTranslation();
  const initialCourseId = searchParams.get('courseId') || searchParams.get('course');
  const playersParam = searchParams.get('players');
  const joinedPlayer = searchParams.get('joined');
  const isTrialMode =
    searchParams.get('mode') === 'trial' ||
    searchParams.get('mode') === 'virtual' ||
    searchParams.get('trial') === 'true';

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedCourseLetter, setSelectedCourseLetter] = useState<string>('A');
  const [startHoleIndex, setStartHoleIndex] = useState<number>(1);
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [playersList, setPlayersList] = useState<SetupPlayer[]>(() => [
    { id: 'p_self', name: '', isLeader: true, isSelf: true },
    { id: 'p_2', name: '', isLeader: false, isSelf: false },
    { id: 'p_3', name: '', isLeader: false, isSelf: false },
    { id: 'p_4', name: '', isLeader: false, isSelf: false },
  ]);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [roomId] = useState<string>(() => searchParams.get('roomId') || ('room_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)));
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [joinSimulationToast, setJoinSimulationToast] = useState<string | null>(null);
  const [showPlayStartNotice, setShowPlayStartNotice] = useState<boolean>(false);
  const [isUnlimitedRound, setIsUnlimitedRound] = useState<boolean>(true);
  const [targetHolesCount, setTargetHolesCount] = useState<number>(18);
  const [recentPartners, setRecentPartners] = useState<string[]>([]);
  // 슬롯별 독립 포커스 및 디바운스 관리
  const activeFocusIdxRef = useRef<number | null>(null);
  const syncDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userEditedSlotsRef = useRef<Set<number>>(new Set());
  const playersListRef = useRef<SetupPlayer[]>(playersList);
  playersListRef.current = playersList;

  useEffect(() => {
    try {
      const saved = localStorage.getItem('parkon_recent_partners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentPartners(parsed.filter((n) => typeof n === 'string' && n.trim().length > 0));
        }
      }
    } catch (e) {}
  }, []);

  const handleSelectRecentPartner = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    setPlayersList((prev) => {
      const next = [...prev];
      // 1. 이미 등록되어 있는지 확인
      const alreadyIdx = next.findIndex((p, i) => i < playerCount && p.name.trim() === cleanName);
      if (alreadyIdx !== -1) {
        return prev;
      }

      // 2. 비어있는 슬롯 찾기 (본인 제외, idx >= 1)
      let targetIdx = next.findIndex((p, i) => i >= 1 && i < playerCount && (!p.name || isDefaultCompanionName(p.name)));
      
      // 만약 현재 playerCount 내에 빈 슬롯이 없는데 playerCount < 4라면 인원 증가
      if (targetIdx === -1 && playerCount < 4) {
        targetIdx = playerCount;
        setPlayerCount((prevCount) => Math.min(4, prevCount + 1));
      } else if (targetIdx === -1) {
        // 이미 4명이 꽉 차있으면 마지막 슬롯(또는 첫 번째 동반자 슬롯) 대체
        targetIdx = next.length - 1;
      }

      if (targetIdx >= 1 && targetIdx < next.length) {
        next[targetIdx] = { ...next[targetIdx], name: cleanName };
      }
      return next;
    });
  };

  const leaderParam = searchParams.get('leader') || searchParams.get('member') || searchParams.get('user');

  useEffect(() => {
    const selfName = getDefaultSelfName(isJapanese);
    const effectiveLeader = leaderParam?.trim() || (selfName && !isSampleOrPlaceholder(selfName) ? selfName : (isJapanese ? '' : '김대희'));
    const hasCustomSelf = Boolean(effectiveLeader && !isSampleOrPlaceholder(effectiveLeader));

    if (effectiveLeader && !isJapanese) {
      try {
        const currentProf = ParkOnStorage.getUserProfile() || {};
        ParkOnStorage.saveUserProfile({
          ...currentProf,
          userName: effectiveLeader,
          nationalGrade: effectiveLeader.includes('김대희') ? '공인 싱글 1급' : '정회원',
          clubName: '구미 파크골프 클럽',
        });
        if (effectiveLeader.includes('김대희')) {
          localStorage.setItem('parkon_member_code_v1', 'PKYA-7788');
        }
      } catch (e) {}
    }

    if (playersParam) {
      const names = playersParam
        .split(',')
        .map((n) => decodeURIComponent(n.trim()))
        .filter(Boolean);

      if (names.length > 0) {
        const count = Math.min(4, Math.max(names.length, 4));
        setPlayerCount(count);
        const newList: SetupPlayer[] = [];
        for (let i = 0; i < count; i++) {
          let name = names[i] || '';
          const isFirst = i === 0;
          if (isFirst) {
            if (!name || isDefaultCompanionName(name)) {
              name = hasCustomSelf ? effectiveLeader : '';
            }
          } else {
            if (isDefaultCompanionName(name)) {
              name = '';
            }
          }
          newList.push({
            id: isFirst ? 'p_self' : `p_${i + 1}`,
            name,
            isLeader: isFirst,
            isSelf: isFirst,
          });
        }
        setPlayersList(newList);
      }
    } else {
      if (hasCustomSelf) {
        setPlayersList((prev) =>
          prev.map((p, idx) => ((idx === 0 || p.isSelf) ? { ...p, name: effectiveLeader, isSelf: true } : p))
        );
      }
    }
  }, [playersParam, leaderParam, isJapanese]);

  // Course correction/expansion modal state
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editHoles, setEditHoles] = useState<number>(18);
  const [editContributor, setEditContributor] = useState<string>('');

  useEffect(() => {
    const all = ParkOnStorage.getAllCourses();
    setCourses(all);
    if (initialCourseId && all.some((c) => c.id === initialCourseId)) {
      setSelectedCourseId(initialCourseId);
    } else if (initialCourseId) {
      const norm = initialCourseId.toLowerCase().replace(/\s+/g, '');
      const matched = all.find((c) => {
        const normName = c.name.toLowerCase().replace(/\s+/g, '');
        const normId = c.id.toLowerCase().replace(/\s+/g, '');
        return (
          normId === norm ||
          normName.includes(norm) ||
          norm.includes(normName) ||
          ((norm.includes('양호') || norm.includes('양포')) && (normName.includes('양호') || normName.includes('양포')))
        );
      });
      if (matched) {
        setSelectedCourseId(matched.id);
      } else {
        setSelectedCourseId(ParkOnStorage.getHomeCourseId());
      }
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
  }, [selectedCourseId, numCourses]);

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
    }
  }, [currentCourse]);

  const openEditModal = () => {
    if (currentCourse) {
      setEditHoles(currentCourse.totalHoles || 18);
    }
    const currentUserName =
      playersList.find((p) => p.isSelf || p.isLeader)?.name?.trim() ||
      playersList[0]?.name?.trim() ||
      ParkOnStorage.getUserDisplayName() ||
      getDefaultSelfName(isJapanese) ||
      '';
    setEditContributor(currentUserName);
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
      contributorName: editContributor.trim() || currentCourse.contributorName || '파크골프 올인원 골퍼',
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

  // 서버 룸(Room) 동기화 함수
  const syncRoomToServer = (overridePlayers?: SetupPlayer[]) => {
    if (!roomId) return;
    try {
      const listToSync = overridePlayers || playersListRef.current;
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
          players: listToSync.slice(0, playerCount).map((p) => ({
            id: p.id,
            name: p.name,
            isLeader: p.isLeader,
          })),
        }),
      }).catch((e) => console.error('Failed to sync room:', e));
    } catch (e) {
      console.error(e);
    }
  };

  // 슬롯별 확정 저장 콜백 (클로저 기반의 고정 인덱스 바인딩)
  const handleSlotCommit = useCallback((targetSlotIndex: number, newName: string) => {
    userEditedSlotsRef.current.add(targetSlotIndex);
    setPlayersList((prev) => {
      const next = [...prev];
      if (next[targetSlotIndex]) {
        next[targetSlotIndex] = { ...next[targetSlotIndex], name: newName };
      }
      return next;
    });
    // 서버에 최신 명단 동기화
    syncRoomToServer();
  }, [syncRoomToServer]);

  const handleSlotFocusChange = useCallback((slotIndex: number, focused: boolean) => {
    if (focused) {
      activeFocusIdxRef.current = slotIndex;
    } else if (activeFocusIdxRef.current === slotIndex) {
      activeFocusIdxRef.current = null;
    }
  }, []);

  const handleSetLeader = useCallback((index: number) => {
    setPlayersList((prev) =>
      prev.map((p, i) => ({
        ...p,
        isLeader: i === index,
      }))
    );
  }, []);

  // 플레이어 수 선택 변경 (1명 ~ 6명)
  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    const selfName = getDefaultSelfName(isJapanese);
    const hasCustomSelf = Boolean(selfName && !isSampleOrPlaceholder(selfName));
    setPlayersList((prev) => {
      const current = [...prev];
      if (current.length === 0) {
        current.push({ id: 'p_self', name: hasCustomSelf ? selfName : '', isLeader: true, isSelf: true });
      } else {
        current[0] = { ...current[0], name: current[0].name || (hasCustomSelf ? selfName : ''), isSelf: true };
      }

      if (count > current.length) {
        for (let i = current.length; i < count; i++) {
          current.push({
            id: `p_${Date.now()}_${i}`,
            name: '', // 빈 칸으로 초기화하여 '성명을 적어주세요' 플레이스홀더 노출
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

  // QR 코드 동반자 입장 실시간 감지 및 자동 배정 (오송 등 실시간 주입)
  const handleSimulateQrJoin = (guestName: string) => {
    if (!guestName) return;
    const cleanGuestName = guestName.trim();
    if (!cleanGuestName || isDefaultCompanionName(cleanGuestName)) return;

    setPlayersList((prev) => {
      // 이미 같은 이름의 플레이어가 1번 이후 슬롯에 등록되어 있다면 유지
      if (prev.some((p, idx) => idx > 0 && p.name && p.name.trim() === cleanGuestName)) {
        return prev;
      }
      // 사용자가 현재 포커스하여 직접 타이핑 중인 슬롯 및 조장이 수동 편집한 슬롯은 건너뛰고 빈 슬롯 찾기
      const targetIdx = prev.findIndex(
        (p, idx) => idx > 0 && idx !== activeFocusIdxRef.current && !userEditedSlotsRef.current.has(idx) && (!p.name || !p.name.trim() || isDefaultCompanionName(p.name))
      );
      let nextList = [...prev];
      if (targetIdx !== -1) {
        nextList[targetIdx] = { ...nextList[targetIdx], name: cleanGuestName };
      } else if (prev.length < 6) {
        nextList.push({
          id: `p_qr_${Date.now()}`,
          name: cleanGuestName,
          isLeader: false,
          isSelf: false,
        });
      }
      return nextList;
    });

    setJoinSimulationToast(
      isJapanese
        ? `🎉 '${cleanGuestName}' 様が参加しました！全員揃いましたのでゲームを開始できます！`
        : `🎉 '${cleanGuestName}' 님이 입장하였습니다! (${playerCount}명 참여 완료, 바로 시작 가능)`
    );
    setTimeout(() => setJoinSimulationToast(null), 3500);

    // 대표님 절대 지침: 동반자 입장 확인 시 1.2초 후 초대 팝업창을 자동으로 닫고 즉시 [티샷 시작] 화면으로 복귀!
    setTimeout(() => {
      setShowQrModal(false);
    }, 1200);
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

  // 초대 링크 및 실제 카메라 인식용 QR 코드 생성 (안정적 useMemo 및 캐시 적용으로 무한 루프/화면 멈춤 원천 차단)
  const currentLeader = playersList.find((p) => p.isLeader) || playersList[0];
  const leaderName = currentLeader?.name || '조장';
  const currentOrigin = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://www.parkgolfallinone.com';

  const inviteUrl = useMemo(() => {
    return `${currentOrigin}/round/join?roomId=${encodeURIComponent(roomId)}&course=${encodeURIComponent(selectedCourseId || 'course_1')}&leader=${encodeURIComponent(leaderName)}&count=${playerCount}`;
  }, [currentOrigin, roomId, selectedCourseId, leaderName, playerCount]);

  // QR 코드 중복 생성 방지용 캐시 Ref (동일 URL에 대해 중복 캔버스 연산 방지)
  const lastGeneratedQrUrlRef = useRef<string>('');

  useEffect(() => {
    let isCancelled = false;
    if (showQrModal && inviteUrl) {
      if (lastGeneratedQrUrlRef.current === inviteUrl && qrDataUrl) {
        return; // 이미 생성된 QR 코드가 있으므로 중복 생성 건너뜀 (CPU 0%, 화면 먹통 완전 방지)
      }
      generateQrCodeDataUrl(inviteUrl)
        .then((url) => {
          if (!isCancelled && url) {
            lastGeneratedQrUrlRef.current = inviteUrl;
            setQrDataUrl(url);
          }
        })
        .catch((err) => {
          console.error('Failed to generate real QR Code:', err);
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [showQrModal, inviteUrl, qrDataUrl]);

  // 1. 조장 화면 설정(구장, 코스, 시작홀, 인원) 변경 시 서버 룸 동기화
  useEffect(() => {
    syncRoomToServer();
  }, [selectedCourseId, currentCourse?.name, selectedCourseLetter, startHoleIndex, playerCount]);

  // 언마운트 시 디바운스 타이머 정리
  useEffect(() => {
    return () => {
      if (syncDebounceTimerRef.current) {
        clearTimeout(syncDebounceTimerRef.current);
      }
    };
  }, []);

  // 2. 동반자 입장 실시간 감지 (Supabase Realtime Presence & Broadcast 양방향 연동)
  useEffect(() => {
    if (!roomId) return;

    let isSubscribed = true;

    // Supabase Realtime 채널 구독
    const channel = supabase.channel(`room_${roomId}`, {
      config: {
        presence: { key: 'leader' },
        broadcast: { ack: true },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        Object.values(presenceState).forEach((presences: any) => {
          presences.forEach((p: any) => {
            const guestName = p.userName || p.playerName || p.name || p.nickname;
            if (guestName && p.role !== 'leader') {
              handleSimulateQrJoin(guestName);
            }
          });
        });
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((p: any) => {
          const guestName = p.userName || p.playerName || p.name || p.nickname;
          if (guestName && p.role !== 'leader') {
            handleSimulateQrJoin(guestName);
          }
        });
      })
      .on('broadcast', { event: 'companion_joined' }, ({ payload }) => {
        const guestName = payload?.userName || payload?.playerName || payload?.name || payload?.nickname;
        if (guestName && isSubscribed) {
          handleSimulateQrJoin(guestName);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            role: 'leader',
            leaderName,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    // DB / API fallback 1초 폴링
    const pollJoinedCompanions = async () => {
      // 1) 조장이 현재 포커스하여 타이핑 중인 상태에서는 전체 덮어쓰기 중단
      if (activeFocusIdxRef.current !== null) return;

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
                if (idx > 0) {
                  // 조장이 입력 중인 슬롯 또는 조장이 직접 편집/삭제한 슬롯은 절대 덮어쓰지 않음!
                  if (activeFocusIdxRef.current === idx) return;
                  if (userEditedSlotsRef.current.has(idx)) return;

                  const targetName = (sp.name || '').trim();
                  if (targetName && !isDefaultCompanionName(targetName)) {
                    if (next[idx] && next[idx].name !== targetName) {
                      next[idx] = { ...next[idx], name: targetName };
                      updated = true;
                    } else if (!next[idx] && next.length < 6) {
                      next.push({ id: `slot-p-${idx + 1}`, name: targetName, isLeader: false, isSelf: false });
                      updated = true;
                    }
                  }
                }
              });

              if (updated) {
                const latestGuest = serverPlayers.find(
                  (sp, idx) => idx > 0 && idx !== activeFocusIdxRef.current && !userEditedSlotsRef.current.has(idx) && sp.name && !isDefaultCompanionName(sp.name) && prev[idx]?.name !== sp.name
                );
                if (latestGuest) {
                  setJoinSimulationToast(`🎉 '${latestGuest.name}' 님이 라운드에 자동 입장하였습니다!`);
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

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [roomId, leaderName]);

  // 초대 메시지 및 공유 텍스트 (안전 메모이제이션)
  const shareCourseName = currentCourse?.name || (isJapanese ? 'パークゴルフ場' : '구미 동락 파크골프장');
  const shareTitle = isJapanese ? `[PARKY パキ] ${shareCourseName} ラウンド招待` : `[파키 PARKY] ${shareCourseName} 라운딩 초대`;
  const shareText = useMemo(() => {
    return isJapanese
      ? `[PARKY パキ同伴者招待]\n⛳ ${shareCourseName} で一緒にラウンドしましょう！\nリーダー: ${leaderName}\n以下のリンクを開くと同伴者として自動登録されます:\n${inviteUrl}`
      : `[파키 PARKY 동반자 초대]\n⛳ ${shareCourseName} 함께 라운딩해요!\n조장: ${leaderName}\n아래 링크를 누르면 동반자로 자동 등록됩니다:\n${inviteUrl}`;
  }, [shareCourseName, leaderName, inviteUrl, isJapanese]);

  // 안전한 클립보드 복사 함수 (window.prompt 차단 및 모바일 인앱 브라우저 호환)
  const copyToClipboardSafe = async (text: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('navigator.clipboard failed, fallback to execCommand', err);
      }
    }
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  };

  // 강력하고 안전한 카카오톡/문자/링크 공유 함수 (화면 멈춤/블로킹 100% 방지)
  const handleShareInvite = async () => {
    // 1. 클립보드 복사 즉시 수행
    await copyToClipboardSafe(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 4000);

    // 2. 모바일 환경에서 시스템 공유 시트 (카카오톡, 문자 등 직접 선택 가능)
    if (typeof navigator !== 'undefined' && navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent || '')) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: inviteUrl,
        });
        return;
      } catch (err) {
        // 사용자가 취소했더라도 클립보드 복사는 이미 완료되어 안전
      }
    }

    // 3. 일본어 모드 시 LINE 메신저 직접 실행 지원
    if (isJapanese && typeof window !== 'undefined') {
      try {
        window.open(`https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`, '_blank');
      } catch {
        // popup blocker fallback
      }
    }
  };

  const startRound = async () => {
    if (!currentCourse) return;

    const newId = 'round_' + Date.now();

    // Map active players based on current playerCount and apply sorting: Leader is always #1, others in Korean alphabetical order (가나다순)
    const activePlayers = playersList.slice(0, playerCount);
    const selfName = getDefaultSelfName(isJapanese);
    const cleanSelfName = (!selfName || isSampleOrPlaceholder(selfName)) ? (isJapanese ? '代表' : '조장') : selfName;

    const rawPlayers: RoundPlayer[] = activePlayers.map((p, idx) => {
      const trimmed = p.name.trim();
      let finalName = trimmed;
      if (!finalName || isDefaultCompanionName(finalName)) {
        if (p.isSelf || p.isLeader) {
          finalName = cleanSelfName;
        } else {
          finalName = isJapanese ? `同伴者 ${idx + 1}` : `동반자 ${idx + 1}`;
        }
      }
      return {
        id: `player_${idx}_${Date.now()}`,
        name: finalName,
        isLeader: p.isLeader,
        isSelf: p.isSelf,
        scores: {},
        obCount: {},
        totalStrokes: 0,
        totalParDiff: 0,
      };
    });

    const sortedPlayers = sortPlayersByLeaderAndAlphabetical(rawPlayers);

    const newSession: RoundSession = {
      id: newId,
      courseId: currentCourse.id,
      courseName: currentCourse.name,
      startedAt: new Date().toISOString(),
      currentHole: 1, // 1st hole of the session (which corresponds to orderedHoleNumbers[0])
      totalHoles: isUnlimitedRound ? 999 : targetHolesCount,
      selectedCourseLetters: [selectedCourseLetter],
      selectedHoleNumbers: orderedHoleNumbers,
      confirmedHoles: [],
      players: sortedPlayers,
      status: 'IN_PROGRESS',
      isOfficial: !isTrialMode,
      isVirtual: isTrialMode,
      isUnlimitedRound,
      targetHolesCount: isUnlimitedRound ? 999 : targetHolesCount,
      countingMode: 'PAR_BASE',
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('parkon_counting_mode', 'PAR_BASE');
      try {
        const guestNames = sortedPlayers
          .filter((p) => !p.isLeader && !p.isSelf && p.name && !isDefaultCompanionName(p.name))
          .map((p) => p.name.trim());
        if (guestNames.length > 0) {
          const currentPartners = recentPartners || [];
          const filtered = currentPartners.filter((n) => !guestNames.includes(n));
          const updatedPartners = [...guestNames, ...filtered].slice(0, 10);
          localStorage.setItem('parkon_recent_partners', JSON.stringify(updatedPartners));
          setRecentPartners(updatedPartners);
        }
      } catch (e) {
        console.warn('Failed to cache recent partners:', e);
      }
    }

    // 3. 서버 룸(Room)에 라운드 시작 알림 및 Supabase Realtime Broadcast 전송 -> 대기실의 동반자들도 즉시 스코어카드로 50ms 내 자동 이동!
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

      const channel = supabase.channel(`room_${roomId}`);
      channel.send({
        type: 'broadcast',
        event: 'round_started',
        payload: {
          roomId,
          roundId: newId,
          roundSession: newSession,
        },
      });
    } catch (e) {
      console.error('Failed to notify room start:', e);
    }

    ParkOnStorage.saveCurrentRound(newSession);
    ParkOnStorage.setHomeCourseId(currentCourse.id);
    router.push(`/round/${newId}`);
  };

  const handleInitiateStartRound = () => {
    if (isTrialMode) {
      startRound();
      return;
    }
    if (typeof window !== 'undefined') {
      const isPermanent = localStorage.getItem('parkon_hide_round_notice_permanent') === 'true';
      const hideDate = localStorage.getItem('parkon_hide_round_notice_date');
      const today = new Date().toISOString().slice(0, 10);
      if (isPermanent || hideDate === today) {
        startRound();
        return;
      }
    }
    setShowPlayStartNotice(true);
  };

  return (
    <div className="p-3.5 space-y-3.5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            className="p-1.5 -ml-1.5 text-stone-700 hover:text-stone-950 cursor-pointer"
            title="이전으로"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black text-stone-900 leading-tight flex items-center gap-1.5">
              <span>
                {isTrialMode
                  ? (isEnglish ? '🎯 Practice Round Setup' : isJapanese ? '🎯 バーチャル体験・チーム作成' : '🎯 프로그램 체험 연습 (팀 만들기)')
                  : (isEnglish ? 'New Round Setup' : isJapanese ? 'ラウンド開始設定' : '새 라운드 시작 설정')}
              </span>
              {isTrialMode && (
                <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-full">
                  {isEnglish ? 'Practice' : isJapanese ? '体験モード' : '체험 모드'}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-stone-600 font-semibold">
              {isTrialMode
                ? (isEnglish ? 'Experience team setup and companion invites (records not saved)' : isJapanese ? '実戦と同じように同伴者招待やチーム編成をお試しいただけます' : '동반자 초대 및 팀 구성을 실전과 똑같이 체험해 보세요 (기록 미저장)')
                : (isEnglish ? 'Select course and setup players to start' : isJapanese ? 'プレーするコースを自由に選択してください' : '플레이할 구장과 코스를 자유롭게 선택하세요')}
            </p>
          </div>
        </div>

        {/* 닫기 (X) 버튼 */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/');
            }
          }}
          className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer flex items-center justify-center"
          title={isJapanese ? '閉じる (前の画面へ)' : '닫기 (이전 화면으로)'}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 🎯 프로그램 체험 연습 안내 가이드 배너 */}
      {isTrialMode ? (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-2xl p-3.5 text-stone-950 shadow-md border-2 border-amber-300 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-black text-xs text-stone-950">
              <span className="text-sm">🎯</span>
              <span>{isJapanese ? '体験練習モード案内 (実戦と100%同一)' : '체험 연습 모드 안내 (실전과 100% 동일 진행)'}</span>
            </div>
            <span className="text-[10px] bg-stone-950 text-amber-300 font-black px-2 py-0.5 rounded-full">
              {isJapanese ? '安心練習' : '무흔적 안심 연습'}
            </span>
          </div>
          <p className="text-[11.5px] text-stone-950 font-bold leading-snug">
            {isJapanese
              ? '人数(1~4人)の選択、同伴者招待、代表者指定、スタートコースを設定し、[ティーショット開始] を押すとスコアカードへ移動します！'
              : '아래에서 동반자 인원수(1~4인) 선택, 동반자 초대(QR·문자), 조장 지정, 시작 코스를 실전처럼 설정한 뒤 [티샷 시작]을 누르시면 가상 스코어카드로 이동합니다!'}
          </p>
        </div>
      ) : null}

      {/* 1. Current Play Course Display Card */}
      {currentCourse && (
        <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-stone-200 shadow-sm">
          {(() => {
            const dual = getCourseDualName(currentCourse, isJapanese);
            return (
              <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-2xs">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-sm sm:text-base font-black text-emerald-950 flex items-center gap-1.5 truncate">
                    <span className="shrink-0">⛳</span>
                    {dual.flag && <span className="shrink-0">{dual.flag}</span>}
                    <span className="truncate">{dual.primary}</span>
                  </div>
                  {dual.showSecondary && dual.secondary && (
                    <div className="text-xs text-emerald-700 font-bold truncate pl-5">
                      {dual.secondary}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    href="/courses"
                    className="bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-bold py-1 px-2.5 rounded-lg flex items-center gap-1 shadow-2xs transition active:scale-95 text-[11px]"
                  >
                    <span>{isEnglish ? 'Change Course' : isJapanese ? 'コース変更' : '구장 변경'}</span>
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 2. Players Input */}
      <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-sm space-y-3">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>{isEnglish ? 'Player Roster' : isJapanese ? '同伴者名簿' : '동반자 명단'}</span>
            </label>
            <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {playerCount === 1
                ? (isEnglish ? '👤 Solo Play' : isJapanese ? '👤 個人・ソロプレー' : '👤 1인 혼자 플레이')
                : (isEnglish ? '👑 Leader #1' : isJapanese ? '👑 代表1番・整列' : '👑 조장 1번 · 나머지 가나다순 정렬')}
            </span>
          </div>

          <div className="flex items-center justify-between bg-stone-50 p-2 rounded-xl border border-stone-200/80">
            <span className="text-xs font-bold text-stone-700">{isEnglish ? 'Players:' : isJapanese ? 'プレー人数:' : '플레이어 수:'}</span>
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
                  {num}{isEnglish ? 'P' : isJapanese ? '人' : '명'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Player Rows */}
        <div className="space-y-2 pt-0.5">
          {playersList.slice(0, playerCount).map((player, idx) => (
            <CompanionSlotRow
              key={`slot-companion-${idx}`}
              slotIndex={idx}
              name={player.name}
              isLeader={player.isLeader}
              isSelf={player.isSelf}
              isJapanese={isJapanese}
              onCommit={handleSlotCommit}
              onSetLeader={handleSetLeader}
              onFocusChange={handleSlotFocusChange}
            />
          ))}
        </div>

        {/* ⚡ 최근 함께한 동반자 칩 목록 (단골/게스트 원터치 자동 완성) */}
        {recentPartners.length > 0 && (
          <div className="bg-stone-50 border border-stone-200/90 rounded-xl p-2.5 space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-stone-700 flex items-center gap-1">
                <span>⚡</span>
                <span>{isJapanese ? '最近の同伴者 (ワンタップ入力)' : '최근 함께한 동반자 (터치 시 자동 입력)'}</span>
              </span>
              <span className="text-[10px] text-stone-500 font-semibold">
                {isJapanese ? `${recentPartners.length}名 保存中` : `${recentPartners.length}명 기억됨`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
              {recentPartners.map((pName) => {
                const isAlreadyAdded = playersList.slice(0, playerCount).some((p) => p.name.trim() === pName.trim());
                return (
                  <button
                    key={pName}
                    type="button"
                    onClick={() => handleSelectRecentPartner(pName)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition shrink-0 active:scale-95 flex items-center gap-1 cursor-pointer ${
                      isAlreadyAdded
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/40'
                        : 'bg-white text-stone-700 border-stone-300 hover:border-emerald-500 hover:text-emerald-700 shadow-2xs'
                    }`}
                    title={isAlreadyAdded ? (isJapanese ? '既に追加済み' : '이미 추가됨') : (isJapanese ? 'タップして追加' : '터치하여 동반자에 추가')}
                  >
                    <span className="text-[10px]">{isAlreadyAdded ? '✓' : '+'}</span>
                    <span>{pName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 동반자 초대 배너 */}
        <button
          type="button"
          onClick={() => setShowQrModal(true)}
          className="w-full flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-300 rounded-xl p-2.5 shadow-xs transition active:scale-[0.99] cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">📱</span>
            <span className="text-sm font-black text-emerald-950">{isJapanese ? '同伴者を招待' : '동반자 초대'}</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs flex items-center gap-1.5 shrink-0">
            <QrCode className="w-3.5 h-3.5" />
            <span>{isJapanese ? 'QR / LINE / メッセージ招待' : 'QR / 카카오톡 / 문자 초대'}</span>
          </div>
        </button>

        {joinSimulationToast && (
          <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-3 py-2 rounded-xl text-xs font-bold animate-in fade-in flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{joinSimulationToast}</span>
          </div>
        )}
      </div>

      {/* 3. Starting Course & Hole Selection */}
      <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-black text-stone-900 flex items-center gap-1.5">
            <Flag className="w-4 h-4 text-emerald-700" />
            <span>{isJapanese ? 'どのコースからスタートしますか？' : '어느 코스부터 시작하겠습니까?'}</span>
          </label>
          <button
            type="button"
            onClick={openEditModal}
            className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-black py-1 px-2.5 rounded-lg flex items-center gap-1 shadow-2xs transition active:scale-95 text-[11px] cursor-pointer shrink-0"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>{isJapanese ? 'コース訂正' : '코스 정정'}</span>
          </button>
        </div>

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
                  {letter}{isJapanese ? 'コース' : '코스'}
                </span>
                {isSelected && (
                  <span className="text-xs font-black">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ⛳ 홀 번호 선택 */}
        <div className="pt-1.5 border-t border-stone-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black text-stone-800">
            <span>{isJapanese ? '何番ホールからスタートしますか？' : '몇 번 홀에서 티샷을 시작하겠습니까?'}</span>
            <span className="text-emerald-800 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
              {startHoleIndex === 1
                ? (isJapanese ? '1番 正規スタート' : '1번 정규 출발')
                : (isJapanese ? `${startHoleIndex}番 ショットガン` : `${startHoleIndex}번 샷건 출발`)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((hNum) => {
              const isSelected = startHoleIndex === hNum;
              return (
                <button
                  key={hNum}
                  type="button"
                  onClick={() => setStartHoleIndex(hNum)}
                  className={`py-1.5 rounded-lg font-black text-xs sm:text-sm transition flex items-center justify-center gap-1 border active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                  }`}
                >
                  <span>{hNum}{isJapanese ? '番ホール' : '번 홀'}</span>
                  {isSelected && <span className="text-xs text-yellow-300 font-black">✓</span>}
                </button>
              );
            })}
          </div>

          {startHoleIndex !== 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5 text-[10px] text-amber-900 font-bold flex items-center gap-1">
              <span>🎯</span>
              <span>
                {isJapanese
                  ? `ショットガン巡回: ${selectedCourseLetter}コース ${orderedHoleNumbers.map((h) => ((h - 1) % 9) + 1).join(' ➔ ')}番ホール (全9ホール)`
                  : `샷건 순환: ${selectedCourseLetter}코스 ${orderedHoleNumbers.map((h) => ((h - 1) % 9) + 1).join(' ➔ ')}번 홀 (총 9홀)`}
              </span>
            </div>
          )}
        </div>
      </div>



      {/* 5. Bottom Start Button */}
      <button
        type="button"
        onClick={handleInitiateStartRound}
        className={`w-full text-base font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 active:scale-[0.98] transition cursor-pointer ${
          isTrialMode
            ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 border-2 border-amber-300'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
      >
        <Play className="w-4 h-4 fill-current" />
        <span>
          {isTrialMode ? '🎯 ' : ''}
          {selectedCourseLetter}{isEnglish ? ' Course ' : isJapanese ? 'コース ' : '코스 '}
          {startHoleIndex}{isEnglish ? ' Hole ' : isJapanese ? '番ホール ' : '번 홀 '}
          {isTrialMode
            ? (isEnglish ? 'Start Practice Round' : isJapanese ? '体験ティーショット開始' : '체험 티샷 시작')
            : (isEnglish ? 'Start Tee Shot ⛳' : isJapanese ? 'ティーショット開始 ⛳' : '티샷 시작 ⛳')}
        </span>
      </button>

      {/* 5. Course Hole Expansion / Correction Modal */}
      {showEditModal && currentCourse && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-2xl space-y-3.5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-1">
                  <span>⛳ {currentCourse.name} {isJapanese ? 'コース/ホール数の訂正' : '코스/홀수 정정'}</span>
                </h3>
                <p className="text-[11px] text-stone-500 font-medium">
                  {isJapanese ? '新規登録の手間なくコース拡張を即時反映します' : '새로 등록할 필요 없이 코스 확장을 바로 반영합니다'}
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
                  {isJapanese ? '現在の球場の実際コース数およびホール数を選択' : '현재 구장의 실제 총 코스 및 홀수 선택'}
                </label>
                <select
                  value={editHoles}
                  onChange={(e) => setEditHoles(Number(e.target.value))}
                  className="w-full bg-stone-50 border-2 border-emerald-500 rounded-xl px-3 py-2.5 text-sm font-black text-stone-900 outline-none"
                >
                  <option value={9}>{isJapanese ? '計 1コース 9ホール (Aコース)' : '총 1코스 9홀 (A코스)'}</option>
                  <option value={18}>{isJapanese ? '計 2コース 18ホール (A, Bコース)' : '총 2코스 18홀 (A, B코스)'}</option>
                  <option value={27}>{isJapanese ? '計 3コース 27ホール (A, B, Cコース)' : '총 3코스 27홀 (A, B, C코스)'}</option>
                  <option value={36}>{isJapanese ? '計 4コース 36ホール (A, B, C, Dコース)' : '총 4코스 36홀 (A, B, C, D코스)'}</option>
                  <option value={45}>{isJapanese ? '計 5コース 45ホール (A~Eコース)' : '총 5코스 45홀 (A~E코스)'}</option>
                  <option value={54}>{isJapanese ? '計 6コース 54ホール (A~Fコース)' : '총 6코스 54홀 (A~F코스)'}</option>
                  <option value={63}>{isJapanese ? '計 7コース 63ホール (A~Gコース)' : '총 7코스 63홀 (A~G코스)'}</option>
                  <option value={72}>{isJapanese ? '計 8コース 72ホール (A~Hコース)' : '총 8코스 72홀 (A~H코스)'}</option>
                  <option value={108}>{isJapanese ? '計 12コース 108ホール (A~Lコース)' : '총 12코스 108홀 (A~L코스)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {isJapanese ? '訂正者 (名誉の殿堂登録)' : '정정자 (명예의 전당 등록)'}
                </label>
                <input
                  type="text"
                  value={editContributor}
                  onChange={(e) => setEditContributor(e.target.value)}
                  placeholder={isJapanese ? '訂正者のお名前' : '정정자 성명'}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-sm font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-950 font-medium leading-relaxed">
                {isJapanese ? (
                  <>💡 <b>新規登録を重複して行う必要はありません！</b> ここで変更すると球場の総コース数が拡張され、Aコース、Bコース等の選択が即座に可能になります。</>
                ) : (
                  <>💡 <b>신규 등록을 중복으로 하실 필요가 없습니다!</b> 여기서 변경하시면 구장의 총 코스 수가 확장되어 A코스, B코스 선택이 즉시 가능해집니다.</>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-1 border-t border-stone-100">
              <button
                type="button"
                onClick={handleSaveCourseCorrection}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl text-sm shadow active:scale-95 transition"
              >
                {isJapanese ? '即時訂正して反映する ✓' : '즉시 정정 및 반영하기 ✓'}
              </button>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs"
              >
                {isJapanese ? 'キャンセル' : '취소'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. QR Code Companion Auto-Invite Modal */}
      {showQrModal && (
        <div 
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-stone-200 animate-scaleUp max-h-[92vh] flex flex-col overflow-hidden cursor-default"
          >
            <div className="flex items-center justify-between border-b border-stone-100 p-4 shrink-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">📱</span>
                <div>
                  <h3 className="font-black text-stone-900 text-base leading-tight">{isJapanese ? '同伴者招待' : '동반자 초대'}</h3>
                  <p className="text-xs text-stone-500">{isJapanese ? 'QRスキャン または LINE・メッセージ送信' : 'QR 스캔 또는 카카오톡·문자 전송'}</p>
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
            <div className="p-4 space-y-3 overflow-y-auto flex-1 overscroll-contain">
              {/* 1. 제일 위: QR 코드 디스플레이 */}
              <div data-room-id={roomId} data-invite-url={inviteUrl} className="flex flex-col items-center justify-center p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-center">
                <div className="p-2.5 bg-white rounded-2xl shadow-sm border-2 border-emerald-500/30 flex flex-col items-center justify-center relative">
                  {qrDataUrl ? (
                    <div className="relative flex items-center justify-center">
                      <img
                        src={qrDataUrl}
                        alt={isJapanese ? '同伴者招待QRコード' : '동반자 초대 QR 코드'}
                        className="w-44 h-44 rounded-xl object-contain shadow-inner"
                      />
                      {/* Center Emblem Badge */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-md border-2 border-emerald-600 flex items-center justify-center">
                          <span className="text-xl">⛳</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-stone-400 font-bold text-sm">
                      {isJapanese ? 'QRコード生成中...' : 'QR 코드 생성 중...'}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 font-bold mt-1.5">
                  {isJapanese ? '📷 同伴者がスマホのカメラをかざすと、すぐに参加画面が開きます。' : '📷 동반자가 스마트폰 카메라로 비추면 바로 참가 화면이 열립니다.'}
                </p>
              </div>

              {/* 2. QR 바로 밑: 카카오톡 / 문자 초대장 보내기 */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={handleShareInvite}
                  className={`w-full py-3.5 px-4 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer ${
                    isJapanese
                      ? 'bg-[#06C755] hover:bg-[#05b34c] text-white border border-[#05b34c]'
                      : 'bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] border border-[#E6CF00]'
                  }`}
                >
                  <span className="text-base leading-none">{isJapanese ? '🟢' : '💬'}</span>
                  <span>
                    {copiedLink
                      ? (isJapanese ? '招待リンクのコピー完了！' : '초대 문구 복사 완료!')
                      : (isJapanese ? 'LINE / メッセージ招待状を送る' : '카카오톡 / 문자 초대장 보내기')}
                  </span>
                  {copiedLink ? (
                    <Check className={`w-4 h-4 ml-auto font-black ${isJapanese ? 'text-white' : 'text-emerald-800'}`} />
                  ) : (
                    <Share2 className={`w-4 h-4 ml-auto ${isJapanese ? 'text-white' : 'text-stone-700'}`} />
                  )}
                </button>

                {/* 문자(SMS) 직접 발송 버튼 (스마트폰 기본 메시지 앱 즉시 연동) */}
                <a
                  href={`sms:?&body=${encodeURIComponent(shareText)}`}
                  className="w-full py-2.5 px-4 font-bold rounded-xl text-xs flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 shadow-xs transition active:scale-98 text-center cursor-pointer"
                >
                  <span className="text-sm leading-none">📱</span>
                  <span>{isJapanese ? 'SMS(ショートメッセージ)で送信' : '문자(SMS)로 바로 보내기'}</span>
                </a>

                {/* 클릭 시 안내 문구 네모 박스 */}
                {copiedLink ? (
                  <div className="bg-emerald-700 text-white rounded-xl p-2.5 text-xs font-black text-center shadow-md animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col items-center justify-center gap-0.5">
                    <div className="flex items-center gap-1.5 text-emerald-100">
                      <span className="text-sm">📋</span>
                      <span className="text-xs font-black text-white">{isJapanese ? '招待リンクがコピーされました！' : '초대 링크가 복사되었습니다!'}</span>
                    </div>
                    <p className="text-[11px] text-emerald-100 font-medium leading-tight">
                      {isJapanese ? (
                        <>LINEやメッセージのトークルームに <span className="underline font-bold text-white">[貼り付け]</span> してください。</>
                      ) : (
                        <>카카오톡이나 문자 대화창에 <span className="underline font-bold text-white">[붙여넣기]</span> 하시면 됩니다.</>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg py-1 px-2.5 text-[11px] text-amber-900 text-center flex items-center justify-center gap-1">
                    <span>👉</span>
                    <span>{isJapanese ? 'クリックでコピーされ、LINEやメッセージのトークに[貼り付け]できます。' : '클릭 시 복사되며, 카카오톡·문자 대화창에 [붙여넣기] 하시면 됩니다.'}</span>
                  </div>
                )}
              </div>

              {/* 3. 그 다음: 실시간 동반자 참여 현황 */}
              <div className="bg-emerald-50/90 border-2 border-emerald-400/80 rounded-xl p-3 space-y-2 text-left shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <span>{isJapanese ? 'リアルタイム同伴者参加現況' : '실시간 동반자 참여 현황'}</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    {isJapanese ? 'リアルタイム自動検知中' : '실시간 자동 감지 중'}
                  </span>
                </div>

                <div className="space-y-1.5 pt-0.5">
                  {playersList.slice(0, playerCount).map((p, idx) => {
                    const rawName = (p.name || '').trim();
                    const isJoined = p.isLeader || (Boolean(rawName) && !isDefaultCompanionName(rawName));
                    const displayName = rawName || (isJapanese ? `同伴者 ${idx + 1}` : `동반자 ${idx + 1}`);

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
                          <span className={`truncate ${isJoined && !p.isLeader ? 'text-emerald-950 font-black' : ''}`}>
                            {displayName}
                          </span>
                        </div>

                        <div className="shrink-0">
                          {p.isLeader ? (
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-black px-1.5 py-0.5 rounded">
                              👑 {isJapanese ? 'リーダー' : '조장'}
                            </span>
                          ) : isJoined ? (
                            <span className="text-[10px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              ✓ {isJapanese ? '参加完了' : '입장 완료'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">
                              {isJapanese ? 'スキャン待機中...' : '스캔 대기 중...'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. 그 밑: 초대 구장 안내문 (작은 글씨) */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-xs text-stone-600 space-y-1.5">
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    ⛳ {isJapanese ? '招待球場' : '초대 구장'}: {currentCourse?.name || (isJapanese ? 'パークゴルフ場' : '동락파크골프장')}
                  </span>
                  <span className="text-[10px] font-bold text-stone-500 bg-stone-200/70 px-1.5 py-0.5 rounded">
                    {isJapanese ? '待合室コード' : '대기실 코드'}: #{roomId ? roomId.slice(-6).toUpperCase() : 'PARK'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
                  {isJapanese ? (
                    <>
                      • 同伴者が参加すると、上の参加現況名簿に名前が自動的に反映されます。<br />
                      • 会員は本名/ニックネームで自動入場し、非会員はゲストとして3秒で合流できます。<br />
                      • ラウンド開始後は同伴者のスマートフォンでもリアルタイムスコアが共有されます。
                    </>
                  ) : (
                    <>
                      • 동반자가 참여하면 위 참여 현황 명단에 이름이 자동으로 쏙 채워집니다.<br />
                      • 회원은 본인 실명/별명으로 자동 입장되며, 비회원은 게스트로 3초 만에 합류합니다.<br />
                      • 라운드 시작 후에는 동반자 스마트폰에서도 실시간 스코어가 함께 공유됩니다.
                    </>
                  )}
                </p>
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
