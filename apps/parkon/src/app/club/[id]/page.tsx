'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  Users,
  Trophy,
  Share2,
  FileText,
  Crown,
  Play,
  UserPlus,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle,
  X,
  Dices,
  Scale,
  Award,
  Clock,
  RotateCcw,
  ArrowRightLeft,
  Plus,
  Coins,
  Check,
  ChevronRight,
  HelpCircle,
  BookOpen,
  Gift,
  Shuffle,
  Trash2,
  Settings,
  ShieldCheck,
  Search,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import {
  ClubEventRoom,
  ClubGroup,
  ClubPlayer,
  ClubLeaderboardTeam,
  ClubLeaderboardIndividual,
  LuckyDrawWinner,
  AwardRuleConfig,
  SpecialAwardWinner,
} from '@/types/club';
import { ClubStorage } from '@/lib/clubStorage';
import { ParkOnStorage } from '@/lib/storage';
import { RoundPlayer, RoundSession } from '@/types/parkon';
import { DEFAULT_COURSES } from '@/lib/defaultCourses';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { generateClubAwardCardImage, downloadClubAwardCard } from '@/lib/clubAwardImageGenerator';

const MEMBERS_10P: ClubPlayer[] = [
  { id: 'mem_1', name: '김총무(조장1)', isLeader: true, scores: {}, totalStrokes: 0, parDiff: 0, holesCompleted: 0, gender: 'M', handicapTier: 'ADVANCED' },
  { id: 'mem_2', name: '강호동', isLeader: false, scores: {}, totalStrokes: 0, parDiff: 0, holesCompleted: 0, gender: 'M', handicapTier: 'INTERMEDIATE' },
  { id: 'mem_3', name: '유재석', isLeader: false, scores: {}, totalStrokes: 0, parDiff: 0, holesCompleted: 0, gender: 'M', handicapTier: 'INTERMEDIATE' },
  { id: 'mem_4', name: '송지효', isLeader: false, scores: {}, totalStrokes: 0, parDiff: 0, holesCompleted: 0, gender: 'F', handicapTier: 'INTERMEDIATE' },
  { id: 'mem_5', name: '하동훈(조장2)', isLeader: true, scores: {}, totalStrokes: 0, parDiff: 0, holesCompleted: 0, gender: 'M', handicapTier: 'INTERMEDIATE' },
  { id: 'mem_6', name: '신동엽', isLeader: false, scores: {}, totalStrokes: 0, parDiff: 0, holesCompleted: 0, gender: 'M', handicapTier: 'INTERMEDIATE' },
  { id: 'mem_7', name: '이수근', isLeader: false, scores: {}, totalStrokes: 0, parDiff: 0, holesCompleted: 0, gender: 'M', handicapTier: 'INTERMEDIATE' },
  { id: 'mem_8', name: '서장훈(조장3)', isLeader: true, scores: {}, totalStrokes: 0, parDiff: 0, holesCompleted: 0, gender: 'M', handicapTier: 'INTERMEDIATE' },
  { id: 'mem_9', name: '김희철', isLeader: false, scores: {}, totalStrokes: 0, parDiff: 0, holesCompleted: 0, gender: 'M', handicapTier: 'INTERMEDIATE' },
  { id: 'mem_10', name: '조세호', isLeader: false, scores: {}, totalStrokes: 0, parDiff: 0, holesCompleted: 0, gender: 'M', handicapTier: 'INTERMEDIATE' },
];

const PRE_CONFIGURED_10P_GROUPS: ClubGroup[] = [
  {
    groupNumber: 1,
    name: '1조 (4인)',
    startCourseLetter: 'A',
    leaderName: '김총무(조장1)',
    status: 'WAITING',
    players: MEMBERS_10P.slice(0, 4),
  },
  {
    groupNumber: 2,
    name: '2조 (3인)',
    startCourseLetter: 'A',
    leaderName: '하동훈(조장2)',
    status: 'WAITING',
    players: MEMBERS_10P.slice(4, 7),
  },
  {
    groupNumber: 3,
    name: '3조 (3인)',
    startCourseLetter: 'A',
    leaderName: '서장훈(조장3)',
    status: 'WAITING',
    players: MEMBERS_10P.slice(7, 10),
  },
];

const DEFAULT_10P_ROOM: ClubEventRoom = {
  id: 'tourney-10p-live',
  title: '2026 가을맞이 클럽 10인 친선 정기전',
  courseId: 'course-gumi-dongrak',
  courseName: '구미 동락 파크골프장 A코스',
  hostName: '김총무(조장1)',
  selectedCourseLetters: ['A'],
  totalHoles: 9,
  targetTotalPlayers: 10,
  gameMode: 'NEW_PERIO',
  gameModeTitle: '신페리오 방식 (핸디캡 적용)',
  hiddenHolesHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  sealedSecret: 'eyJob2xlcyI6WzMsNiw4XSwic2FsdCI6InBhcmtpMjAyNiJ9',
  isUnsealed: false,
  unsealedHoles: [],
  waitingPool: MEMBERS_10P,
  groups: [],
  status: 'RECRUITING',
  groupingStatus: 'WAITING',
  groupingConfirmed: false,
  createdAt: '2026-10-09T21:40:00.000Z',
};

export default function ClubRoomDetailPage() {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-center text-xs font-bold text-stone-300">
        <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p>파키 앱 - 모임 대기실 연결 중...</p>
      </div>
    );
  }

  return (
    <React.Suspense fallback={<div className="p-6 text-center text-xs font-bold text-stone-500">모임 로딩 중...</div>}>
      <ClubRoomDetailContent />
    </React.Suspense>
  );
}

function ClubRoomDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params?.id as string;
  const { isJapanese } = useTranslation();

  const paramRole = searchParams?.get('role')?.toUpperCase();
  const paramUser = searchParams?.get('user');

  const [room, setRoom] = useState<ClubEventRoom | null>(() => {
    if (roomId === 'tourney-10p-live') {
      return DEFAULT_10P_ROOM;
    }
    if (typeof window !== 'undefined') {
      return ClubStorage.getRoom(roomId);
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState<'roster' | 'team' | 'individual'>('roster');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // [3단계] 그로스 vs 신페리오 듀얼 탭 & 실시간 홀인원 토스트 & 1080p 시상 카드 상태
  const [leaderboardViewMode, setLeaderboardViewMode] = useState<'NEW_PERIO' | 'GROSS'>('GROSS');
  const [holeInOneToast, setHoleInOneToast] = useState<{ playerName: string; groupNumber: number; holeNumber: number } | null>(null);
  const [generatingAwardCard, setGeneratingAwardCard] = useState<boolean>(false);

  // Join modal state (Direct group or waiting pool)
  const [joiningGroup, setJoiningGroup] = useState<number | null>(null); // null = waiting pool
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerGender, setNewPlayerGender] = useState<'M' | 'F'>('M');
  const [newPlayerTier, setNewPlayerTier] = useState<'ADVANCED' | 'INTERMEDIATE' | 'BEGINNER'>('INTERMEDIATE');
  const [joinAsLeader, setJoinAsLeader] = useState<boolean>(false);

  // Smart Auto-Grouping Modal State (전면 개편: 1단계 조건/추첨 설정 + 2단계 가편성 Swap & 원터치 출발)
  const [showAutoGroupModal, setShowAutoGroupModal] = useState<boolean>(false);
  const [modalStep, setModalStep] = useState<'CONFIG' | 'PREVIEW'>('CONFIG');
  const [customGroupCount, setCustomGroupCount] = useState<number>(3);

  // [섹션 A] 필수 전제 조건
  const [condFixLeaders, setCondFixLeaders] = useState<boolean>(true); // [☑️] 각 조 조장 우선 고정 배치
  const [selectedLeaderIds, setSelectedLeaderIds] = useState<string[]>([]);

  // 🔗 [반드시 함께 묶을 동반 그룹] (다중 그룹 지원)
  const [condTogether, setCondTogether] = useState<boolean>(false);
  const [togetherGroups, setTogetherGroups] = useState<{ id: string; playerIds: string[]; targetGroupNumber?: number }[]>([
    { id: 'tog_1', playerIds: [] },
  ]);

  // 🚫 [반드시 서로 다른 조로 분리할 그룹] (다중 기피 지정)
  const [condSeparate, setCondSeparate] = useState<boolean>(false);
  const [separateGroups, setSeparateGroups] = useState<{ id: string; playerIds: string[] }[]>([
    { id: 'sep_1', playerIds: [] },
  ]);

  const [condBalanceGender, setCondBalanceGender] = useState<boolean>(true); // [☑️] 남녀 성비 균등 배분
  const [condSeparatePrev, setCondSeparatePrev] = useState<boolean>(true); // [☑️] 직전 모임 동반자 자동 분리

  // [섹션 B] 최종 분배 방식 ('RANDOM' | 'SNAKE_TIER')
  const [finalDrawType, setFinalDrawType] = useState<'RANDOM' | 'SNAKE_TIER'>('RANDOM');

  // 2단계 모달에서 Swap 대상 선택 상태
  const [selectedSwapPlayer, setSelectedSwapPlayer] = useState<{ id: string; name: string; groupNumber: number } | null>(null);
  const [showGroupResults, setShowGroupResults] = useState<boolean>(false);
  const [searchMyName, setSearchMyName] = useState<string>('');

  // Player Move between groups state
  const [movingPlayer, setMovingPlayer] = useState<{ fromGroup: number; playerId: string; playerName: string } | null>(null);

  // 참가비 및 계좌 설정 모달 상태
  const [showPaymentConfigModal, setShowPaymentConfigModal] = useState<boolean>(false);
  const [configFee, setConfigFee] = useState<number>(10000);
  const [configBankAccount, setConfigBankAccount] = useState<string>('');

  // 경기 방식 & 대회 요강 모달 상태
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  // ⚙️ 경기 방식 & 시상 룰 맞춤 마법사 모달 상태
  const [showAwardConfigModal, setShowAwardConfigModal] = useState<boolean>(false);
  const [cfgGameMode, setCfgGameMode] = useState<'STROKE' | 'NEW_PERIO' | 'SCRAMBLE' | 'STABLEFORD' | 'CASUAL'>('NEW_PERIO');
  const [cfgRuleNotes, setCfgRuleNotes] = useState<string>('');
  const [cfgWinnerGraceMonths, setCfgWinnerGraceMonths] = useState<number>(0);
  const [cfgLastWinnerNames, setCfgLastWinnerNames] = useState<string>('');
  const [cfgEnableLuckyDraw, setCfgEnableLuckyDraw] = useState<boolean>(true);
  const [cfgEnableSpecialAwards, setCfgEnableSpecialAwards] = useState<boolean>(true);

  // 🎰 현장 실시간 행운상 룰렛 추첨 모달 상태
  const [showLuckyDrawModal, setShowLuckyDrawModal] = useState<boolean>(false);
  const [drawPrizeName, setDrawPrizeName] = useState<string>('행운상 (파크골프 양말 세트)');
  const [drawFilterMode, setDrawFilterMode] = useState<'UNAWARDED' | 'ALL'>('UNAWARDED');
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [currentCandidateName, setCurrentCandidateName] = useState<string>('');
  const [drawnWinner, setDrawnWinner] = useState<{ id: string; name: string; groupNumber?: number } | null>(null);

  // [대표님 지시] 200인 이상 대규모 대회 리더보드 검색 및 내 순위 바로가기 상태
  const [leaderboardSearch, setLeaderboardSearch] = useState<string>('');
  const [leaderboardFilter, setLeaderboardFilter] = useState<'ALL' | 'TOP10' | 'MY_GROUP'>('ALL');
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);

  // 👑 vs 👤 엄격한 권한(Role) 기반 단방향 자동 판정 (스위처 제거 완료)

  const [currentUserName, setCurrentUserName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const u = new URLSearchParams(window.location.search).get('user');
      if (u) return u;
      const stored =
        ParkOnStorage.getUserDisplayName() ||
        ParkOnStorage.getUserProfile()?.userName ||
        ParkOnStorage.getKakaoUser()?.realName;
      if (stored) return stored;
    }
    return '김총무';
  });
  const [showManagerDrawer, setShowManagerDrawer] = useState<boolean>(false); // 총무 전용 관리 메뉴(수납/시상) 접이식 서랍

  const loadRoom = useCallback(async () => {
    if (!roomId) return;
    let found: ClubEventRoom | null = null;

    // 🔄 실시간 모의 라이브 룸인 경우 서버 API 최신 상태 우선 로드
    if (roomId.includes('tourney-10p-live') || roomId.includes('live')) {
      try {
        const res = await fetch(`/api/club/live-room?id=${roomId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.room) {
            found = data.room;
            ClubStorage.saveRoom(data.room);
          }
        }
      } catch {}
    }

    if (!found) {
      found = ClubStorage.getRoom(roomId);
    }

    if (!found) {
      try {
        const res = await fetch(`/api/club/live-room?id=${roomId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.room) {
            found = data.room;
            ClubStorage.saveRoom(data.room);
          }
        }
      } catch {}
    }
    if (found) {
      setRoom(found);
      setCfgGameMode(found.gameMode || 'NEW_PERIO');
      setCfgRuleNotes(found.gameRuleNotes || '');
      setCfgWinnerGraceMonths(found.awardConfig?.winnerGraceMonths || 0);
      setCfgLastWinnerNames((found.awardConfig?.lastWinnerNames || []).join(', '));
      setCfgEnableLuckyDraw(found.awardConfig?.enableLuckyDraw ?? true);
      setCfgEnableSpecialAwards(found.awardConfig?.enableSpecialAwards ?? true);
    }
  }, [roomId]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  // 🌐 URL 쿼리 파라미터(?role=manager / ?role=player & user=...) 자동 감지 및 헤더/스토리지 100% 동기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlUser = urlParams.get('user');

      if (urlUser) {
        setCurrentUserName(urlUser);
        // 헤더 및 전역 스토리지에도 1:1 동기화
        const prev = ParkOnStorage.getUserProfile() || {};
        if (prev.userName !== urlUser) {
          ParkOnStorage.saveUserProfile({ ...prev, userName: urlUser });
          window.dispatchEvent(new Event('parkon_profile_updated'));
        }
      } else {
        const stored =
          ParkOnStorage.getUserDisplayName() ||
          ParkOnStorage.getUserProfile()?.userName ||
          ParkOnStorage.getKakaoUser()?.realName;
        if (stored) setCurrentUserName(stored);
      }
    }
  }, [paramUser, paramRole]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 🔄 [3단계] 전 조 실시간 스코어 동기화 & 홀인원(1타) 골든 축하 감지 (최상위 Hook)
  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(async () => {
      try {
        const liveRes = await fetch(`/api/club/live-room?id=${roomId}`);
        if (liveRes.ok) {
          const liveData = await liveRes.json();
          if (liveData && liveData.room) {
            setRoom(liveData.room);
            ClubStorage.saveRoom(liveData.room);
          }
        }
      } catch {}

      const res = await ClubStorage.syncTournamentScoresFromRoundRooms(roomId);
      if (res.success && res.room && res.updatedGroupsCount > 0) {
        setRoom(res.room);
      }
      if (res.holeInOneAlerts && res.holeInOneAlerts.length > 0) {
        setHoleInOneToast(res.holeInOneAlerts[0]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [roomId]);

  const rawIndividuals = React.useMemo(() => {
    if (!room) return [];
    return ClubStorage.getIndividualLeaderboard(room);
  }, [room]);

  // [3단계] 듀얼 탭(그로스 vs 신페리오)에 따른 실시간 순위 정렬 (최상위 Hook)
  const displayIndividuals = React.useMemo(() => {
    if (leaderboardViewMode === 'GROSS') {
      const list = [...rawIndividuals].sort((a, b) => a.totalStrokes - b.totalStrokes || a.parDiff - b.parDiff);
      return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
    }
    return rawIndividuals;
  }, [rawIndividuals, leaderboardViewMode]);

  if (!room) {
    return (
      <div className="p-6 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-stone-400 mx-auto" />
        <h2 className="text-lg font-black text-stone-800">모임 방을 찾을 수 없습니다</h2>
        <p className="text-xs text-stone-500 font-bold">
          삭제되었거나 유효하지 않은 모임 주소입니다.
        </p>
        <Link
          href="/club"
          className="inline-block bg-purple-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-sm hover:bg-purple-800"
        >
          클럽 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const teams = ClubStorage.getTeamLeaderboard(room);
  const individuals = rawIndividuals;
  const groupPlayersCount = room.groups.reduce((sum, g) => sum + g.players.length, 0);
  const waitingPoolCount = (room.waitingPool || []).length;
  const totalAllPlayers = groupPlayersCount + waitingPoolCount;
  const allCurrentPlayers: ClubPlayer[] = [
    ...(room.waitingPool || []),
    ...room.groups.flatMap((g) => g.players),
  ];

  const paymentSummary = ClubStorage.getPaymentSummary(room);
  const gameModeInfo = ClubStorage.getGameModeInfo(room.gameMode);
  const specialAwards = ClubStorage.calculateSpecialAwards(room);
  const graceInfo = ClubStorage.getWinnerGraceInfo(room, individuals);

  // 1. 단일 유저 상태 동기화: URL user 우선, 없으면 currentUserName, 없으면 '김총무'
  const currentUser = (paramUser || currentUserName || '김총무').trim();
  const effectiveUserName = currentUser;

  // 3. 엄격한 권한(Role) 기반 단방향 자동 판정:
  // 오직 클럽 주관자/총무로 지정된 계정(isHost)만 총무 관제 모드로 진입.
  // 그 외의 모든 일반 회원은 선택권 없이 무조건 '일반 참가자 초단순 모드'로만 고정 렌더링.
  const isHost =
    currentUser === '김총무' ||
    currentUser.includes('김총무') ||
    Boolean(room?.hostName && (currentUser.includes(room.hostName) || room.hostName.includes(currentUser)));

  const isDev = process.env.NODE_ENV !== 'production';

  // 로컬 개발 환경에서 주소창 쿼리스트링(?role=manager)이 명시적으로 주어졌을 때만 테스트 편의로 허용
  const effectiveRole =
    isDev && paramRole === 'MANAGER'
      ? 'MANAGER'
      : isDev && paramRole === 'PLAYER'
      ? 'PLAYER'
      : isHost
      ? 'MANAGER'
      : 'PLAYER';

  const isManager = effectiveRole === 'MANAGER';

  // 1. 경기 진행 중 여부 (PLAYING / FINISHED)
  const isMatchPlaying = Boolean(room?.status === 'PLAYING' || room?.status === 'FINISHED');

  // 2. 조 편성 확정 완료 단계 (3단계: status === 'GROUPED' 또는 groupingConfirmed)
  // 단, 경기가 이미 시작된 경우는 경기 진행 관제 모드로 자동 전환
  const isGroupingConfirmed = Boolean(
    !isMatchPlaying && (room?.status === 'GROUPED' || room?.groupingConfirmed || room?.groupingStatus === 'CONFIRMED')
  );

  // 3. 조 편성 가편성 미리보기 단계 (2단계)
  const isGroupingPreview = Boolean(
    !isMatchPlaying && !isGroupingConfirmed && room?.groupingStatus === 'PREVIEW'
  );

  // 4. 조 편성 전 대기실/모집 단계 (1단계: status !== 'PLAYING' 및 조 미확정/재편성 상태)
  const isGroupingWaiting = Boolean(
    !isMatchPlaying && !isGroupingConfirmed && !isGroupingPreview
  );

  // 2. 조 편성 자동 매핑 로직 연결 (1:1 정확한 조 배정)
  const myGroup = React.useMemo(() => {
    if (!room || !currentUser) return null;
    if (room.groups.length === 0) return null;
    const cleanUser = currentUser.replace(/\(.*?\)/g, '').trim().toLowerCase();

    // 1) 룸 내 그룹의 플레이어 중 이름 일치 검색
    const found = room.groups.find((g) =>
      g.players.some((p) => {
        const pClean = p.name.replace(/\(.*?\)/g, '').trim().toLowerCase();
        return pClean === cleanUser || pClean.includes(cleanUser) || cleanUser.includes(pClean);
      })
    );
    if (found) return found;

    // 2) 10인 모의 방일 경우 1:1 완벽 확정 매핑 (Fail-Safe)
    if (['김총무', '강호동', '유재석', '송지효'].some((k) => cleanUser.includes(k))) {
      return room.groups.find((g) => g.groupNumber === 1) || room.groups[0] || null;
    }
    if (['하동훈', '신동엽', '이수근'].some((k) => cleanUser.includes(k))) {
      return room.groups.find((g) => g.groupNumber === 2) || room.groups[1] || null;
    }
    if (['서장훈', '김희철', '조세호'].some((k) => cleanUser.includes(k))) {
      return room.groups.find((g) => g.groupNumber === 3) || room.groups[2] || null;
    }

    if (isHost) {
      return room.groups[0] || null;
    }

    return room.groups[0] || null;
  }, [room, currentUser, isHost]);

  // 👤 현재 사용자가 대기 풀에 있는지 확인
  const myWaitingEntry = React.useMemo(() => {
    if (!room || !currentUser) return null;
    const cleanUser = currentUser.replace(/\(.*?\)/g, '').trim().toLowerCase();
    return (room.waitingPool || []).find((p) => {
      const pClean = p.name.replace(/\(.*?\)/g, '').trim().toLowerCase();
      return pClean === cleanUser || pClean.includes(cleanUser) || cleanUser.includes(pClean);
    });
  }, [room, currentUser]);

  const myPlayerInfo = React.useMemo(() => {
    if (!myGroup || !currentUser) return null;
    const cleanUser = currentUser.replace(/\(.*?\)/g, '').trim().toLowerCase();
    return myGroup.players.find((p) => {
      const pClean = p.name.replace(/\(.*?\)/g, '').trim().toLowerCase();
      return pClean === cleanUser || pClean.includes(cleanUser) || cleanUser.includes(pClean);
    });
  }, [myGroup, currentUser]);

  // 🏆 [3단계] 1080p 공식 시상식 카드 1초 생성 및 다운로드
  const handleGenerateAndDownloadAwardCard = async () => {
    if (!room) return;
    setGeneratingAwardCard(true);
    try {
      const champion = individuals[0];
      const sortedByGross = [...individuals].sort((a, b) => a.totalStrokes - b.totalStrokes);
      const medalist = sortedByGross[0];
      const runnerUp = individuals[1];
      const thirdPlace = individuals[2];

      const specialAwardsList = ClubStorage.calculateSpecialAwards(room);
      const longestSpecial = specialAwardsList.find((sa) => sa.title.includes('롱기스트') || sa.badge === '🚀');
      const nearPinSpecial = specialAwardsList.find((sa) => sa.title.includes('니어핀') || sa.badge === '🎯');

      const result = await generateClubAwardCardImage({
        clubName: room.clubName || '공식 파크골프 클럽',
        tournamentTitle: room.title,
        courseName: room.courseName,
        totalHoles: room.totalHoles,
        playDate: room.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        totalParticipants: totalAllPlayers,
        gameModeTitle: room.gameModeTitle || ClubStorage.getGameModeInfo(room.gameMode).title,
        championName: champion?.playerName || '우승자',
        championNet: champion?.netScore ?? champion?.totalStrokes ?? 0,
        championGross: champion?.totalStrokes ?? 0,
        championHandicap: champion?.handicap ?? 0,
        medalistName: medalist?.playerName,
        medalistGross: medalist?.totalStrokes,
        runnerUpName: runnerUp?.playerName,
        runnerUpNet: runnerUp?.netScore ?? runnerUp?.totalStrokes,
        thirdPlaceName: thirdPlace?.playerName,
        thirdPlaceNet: thirdPlace?.netScore ?? thirdPlace?.totalStrokes,
        longestName: longestSpecial?.winnerName,
        longestDistance: isJapanese ? '最長飛距離 1位' : '장타 1위',
        nearPinName: nearPinSpecial?.winnerName,
        nearPinDistance: isJapanese ? 'ピン至近 1位' : '핀 밀착 1위',
        specialAwards: specialAwardsList,
        isJapanese: Boolean(isJapanese),
      });

      if (result) {
        downloadClubAwardCard(result);
        showToast(
          isJapanese
            ? '🏆 1080p高画質クラブ公式表彰カードがダウンロードされました！'
            : '🏆 1080p 고화질 클럽 공식 시상식 카드가 다운로드되었습니다!'
        );
      } else {
        alert(isJapanese ? '表彰カード画像の生成に失敗しました。' : '시상 카드 이미지 생성에 실패하였습니다.');
      }
    } catch (e) {
      console.error(e);
      alert(isJapanese ? '表彰カード生成中にエラーが発生しました。' : '시상 카드 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingAwardCard(false);
    }
  };

  // ⚙️ 경기 방식 및 시상 룰 커스텀 설정 저장
  const handleSaveAwardConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    const splitWinners = cfgLastWinnerNames
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    ClubStorage.updateRoom(room.id, {
      gameMode: cfgGameMode,
      gameRuleNotes: cfgRuleNotes.trim(),
    });

    const updatedWithAwards = ClubStorage.saveAwardConfig(room.id, {
      winnerGraceMonths: Number(cfgWinnerGraceMonths) || 0,
      lastWinnerNames: splitWinners,
      enableLuckyDraw: cfgEnableLuckyDraw,
      enableSpecialAwards: cfgEnableSpecialAwards,
      luckyDrawWinners: room.awardConfig?.luckyDrawWinners || [],
    });

    if (updatedWithAwards) {
      setRoom(updatedWithAwards);
      showToast('⚙️ 경기 방식 및 시상 룰 맞춤 설정이 저장되었습니다!');
    }
    setShowAwardConfigModal(false);
  };

  // 🎰 현장 행운상 추첨 룰렛 시작
  const handleStartLuckyDraw = () => {
    if (!room || isSpinning) return;
    const allParticipants: { id: string; name: string; groupNumber?: number }[] = [];
    room.groups.forEach((g) => {
      g.players.forEach((p) => {
        allParticipants.push({ id: p.id, name: p.name, groupNumber: g.groupNumber });
      });
    });
    (room.waitingPool || []).forEach((p) => {
      allParticipants.push({ id: p.id, name: p.name });
    });

    if (allParticipants.length === 0) {
      alert('추첨 가능한 참가자가 없습니다.');
      return;
    }

    let candidates = allParticipants;
    if (drawFilterMode === 'UNAWARDED') {
      const existingLuckyIds = new Set((room.awardConfig?.luckyDrawWinners || []).map((w) => w.id));
      const top3Ids = new Set(individuals.slice(0, 3).map((p) => p.playerId));
      const specialWinnerNames = new Set(specialAwards.map((sa) => sa.winnerName));

      const filtered = allParticipants.filter((p) => {
        if (existingLuckyIds.has(p.id)) return false;
        if (top3Ids.has(p.id)) return false;
        if (specialWinnerNames.has(p.name)) return false;
        return true;
      });

      if (filtered.length > 0) {
        candidates = filtered;
      }
    }

    setIsSpinning(true);
    setDrawnWinner(null);

    let count = 0;
    const interval = setInterval(() => {
      const randIdx = Math.floor(Math.random() * candidates.length);
      setCurrentCandidateName(candidates[randIdx].name);
      count++;
      if (count >= 16) {
        clearInterval(interval);
        const finalWinner = candidates[Math.floor(Math.random() * candidates.length)];
        setCurrentCandidateName(finalWinner.name);
        setDrawnWinner(finalWinner);
        setIsSpinning(false);
      }
    }, 90);
  };

  // 🎰 행운상 당첨자 확정 저장
  const handleConfirmLuckyWinner = () => {
    if (!room || !drawnWinner) return;
    const newWinner: LuckyDrawWinner = {
      id: drawnWinner.id,
      name: drawnWinner.name,
      groupNumber: drawnWinner.groupNumber,
      prizeName: drawPrizeName.trim() || '행운상',
      drawnAt: `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
    };
    const updated = ClubStorage.addLuckyDrawWinner(room.id, newWinner);
    if (updated) {
      setRoom(updated);
      showToast(`🎉 '${drawnWinner.name}' 회원님 행운상 당첨 확정!`);
      setDrawnWinner(null);
    }
  };

  // 🎰 행운상 당첨자 취소
  const handleRemoveLuckyWinner = (winnerId: string, winnerName: string) => {
    if (!room) return;
    if (!confirm(`'${winnerName}' 님의 행운상 당첨을 취소하시겠습니까?`)) return;
    const updated = ClubStorage.removeLuckyDrawWinner(room.id, winnerId);
    if (updated) {
      setRoom(updated);
      showToast(`행운상 당첨이 취소되었습니다.`);
    }
  };

  // 참가비 입금 상태 토글 (미납 ↔ 입금 완료)
  const handleTogglePayment = (playerId: string, playerName: string) => {
    if (!room) return;
    const updated = ClubStorage.togglePlayerPayment(room.id, playerId);
    if (updated) {
      setRoom(updated);
      const isPaidNow =
        updated.groups.some((g) => g.players.some((p) => p.id === playerId && p.paymentStatus === 'PAID')) ||
        (updated.waitingPool || []).some((p) => p.id === playerId && p.paymentStatus === 'PAID');

      if (isPaidNow) {
        showToast(`✅ '${playerName}' 님의 참가비 입금이 확인되었습니다!`);
      } else {
        showToast(`⏳ '${playerName}' 님의 입금 상태를 [미납]으로 변경했습니다.`);
      }
    }
  };

  // 참가비 수납 현황 카카오톡/LINE 리포트 복사
  const handleCopyPaymentReport = async () => {
    if (!room) return;
    const text = ClubStorage.generatePaymentStatusKakaoReport(room, isJapanese);
    if (isJapanese && typeof window !== 'undefined') {
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank');
    }
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        showToast(isJapanese ? '💰 参加費現況レポートがコピーされました！LINEに共有してください。' : '💰 참가비 수납 현황 리포트가 복사되었습니다! 카톡에 공유하세요.');
        return;
      } catch (e) {
        console.warn(e);
      }
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(isJapanese ? '💰 参加費現況レポートがコピーされました！LINEに共有してください。' : '💰 참가비 수납 현황 리포트가 복사되었습니다! 카톡에 공유하세요.');
  };

  // 참가비/계좌 설정 저장
  const handleSavePaymentConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    const updated = ClubStorage.updatePaymentConfig(room.id, {
      entryFee: Number(configFee) || 0,
      bankAccount: configBankAccount.trim(),
    });
    if (updated) {
      setRoom(updated);
      showToast('💰 참가비 및 입금 계좌 설정이 저장되었습니다.');
    }
    setShowPaymentConfigModal(false);
  };

  // 카카오톡/LINE 초대장 복사
  const handleCopyKakaoInvite = () => {
    const text = ClubStorage.generateKakaoShareText(room, isJapanese);
    if (isJapanese && typeof window !== 'undefined') {
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank');
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(isJapanese ? 'LINE招待文がコピーされました！トークルームに貼り付けしてください ⛳' : '카카오톡 초대 문구가 복사되었습니다! 단톡방에 붙여넣기 하세요 ⛳');
    }
  };

  // 전체 조 편성표 카카오톡/LINE 공지 복사
  const handleCopyGroupFormationKakao = () => {
    const text = ClubStorage.generateGroupFormationKakaoShareText(room, isJapanese);
    if (isJapanese && typeof window !== 'undefined') {
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank');
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(isJapanese ? '📢 全組編成結果がコピーされました！LINEに共有してください。' : '📢 전체 조 편성 결과가 복사되었습니다! 단톡방에 공유하세요.');
    }
  };

  // [대표님 지시] 1초 시상식 및 수령 확인 리포트 복사
  const handleCopyTournamentReport = () => {
    const text = ClubStorage.generateTournamentResultReport(room, isJapanese);
    if (isJapanese && typeof window !== 'undefined') {
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank');
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(isJapanese ? '🏆 [表彰式および受領確認] 結果要約がコピーされました！LINEグループに共有してください。' : '🏆 [시상식 및 수령 확인] 결과 요약 공지가 복사되었습니다! 카톡 단체방에 공유하세요.');
    }
  };

  // 📋 계좌번호 1초 원터치 복사
  const handleCopyAccount = () => {
    if (!room?.bankAccount) {
      showToast(isJapanese ? '登録された振込口座がありません。幹事にお問い合わせください。' : '등록된 입금 계좌가 없습니다. 총무에게 문의해 주세요.');
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(room.bankAccount);
    }
    showToast(isJapanese ? `🏦 '${room.bankAccount}' 口座番号がコピーされました！` : `🏦 '${room.bankAccount}' 계좌가 복사되었습니다! 은행 앱에 붙여넣기 하세요.`);
  };

  // 📢 미납자 타겟 카카오톡/LINE 독촉 안내문 복사
  const handleCopyUnpaidReminder = () => {
    if (!room) return;
    const text = ClubStorage.generateUnpaidKakaoReminderText(room, isJapanese);
    if (isJapanese && typeof window !== 'undefined') {
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, '_blank');
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    showToast(isJapanese ? '📢 未納者向けLINE催促案内文がコピーされました！' : '📢 미납자 대상 맞춤 카톡 독촉 안내문이 복사되었습니다!');
  };

  // ⚡ [현장 긴급 대응] 결원(노쇼) 발생 시 대기 1순위 투입 또는 3인 1조 즉시 전환
  const handleQuickReplaceMissingPlayer = (groupNumber: number, playerId: string, playerName: string) => {
    if (!room) return;

    if (room.waitingPool && room.waitingPool.length > 0) {
      const cand = room.waitingPool.find((p) => p.waitNumber === 1) || room.waitingPool[0];
      if (
        confirm(
          `🚨 [결원 발생 긴급 대체]\n\n'${playerName}' 회원님의 불참(노쇼)으로\n대기 1순위 '${cand.name}' 님을 [${groupNumber}조]로 즉시 1초 투입하시겠습니까?\n\n(취소 선택 시 '3인 1조 자동 전환'으로 넘어갑니다)`
        )
      ) {
        const res = ClubStorage.replacePlayerWithWaitingCandidate(room.id, groupNumber, playerId);
        if (res.success && res.room) {
          setRoom(res.room);
          showToast(res.message);
          return;
        }
      }
    }

    // 대기자가 없거나 취소 시 결번 없는 자연스러운 3인 1조 자동 전환
    if (
      confirm(
        `⚡ [3인 1조 규격 자동 전환]\n\n'${playerName}' 회원님을 조에서 제외하고\n[${groupNumber}조]를 결번 없이 자연스러운 '3인 1조'로 즉시 전환하시겠습니까?`
      )
    ) {
      const res = ClubStorage.convertGroupToThreePlayers(room.id, groupNumber, playerId);
      if (res.success && res.room) {
        setRoom(res.room);
        showToast(res.message);
      } else {
        alert(res?.message || '3인 1조 전환에 실패하였습니다.');
      }
    }
  };

  // 🚀 [전 조 동시 출발 확정] 1조부터 N조까지 Supabase 4인 실시간 대기실 일괄 가동
  const handleLaunchAllGroups = async () => {
    if (!room) return;
    if (
      !confirm(
        isJapanese
          ? `🚀 全${room.groups.length}組のリアルタイム待機室を一括起動しますか？\n参加者のスマートフォンに待機室案内バ너がリアルタイム表示されます。`
          : `🚀 총 ${room.groups.length}개 조의 4인 실시간 경기 대기실을 일괄 기동하시겠습니까?\n\n대회 참가자 전원의 스마트폰에 '[제 N조 실시간 경기 입장하기]' 배너가 자동 활성화됩니다.`
      )
    ) {
      return;
    }
    const res = await ClubStorage.launchAllTournamentGroups(room.id);
    if (res.success && res.room) {
      setRoom(res.room);
      showToast(res.message);
    }
    try {
      await fetch('/api/club/live-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, action: 'START_MATCH' }),
      });
    } catch {}
  };

  // 🔓 [신페리오 자물쇠 해제] 대회 마감 시 숨은 홀 전격 공개
  const handleUnsealHiddenHoles = () => {
    if (!room) return;
    if (
      !confirm(
        isJapanese
          ? '🔓 新ペリア隠しホール暗号を解除し、電光掲示板に電撃公開しますか？'
          : '🔓 신페리오 숨은 홀 자물쇠를 해제하고, 전광판에 전격 공개하시겠습니까?\n\n참가자 전원의 핸디캡과 네트 스코어가 투명하게 즉시 재계산됩니다!'
      )
    ) {
      return;
    }
    const res = ClubStorage.unsealTournamentHiddenHoles(room.id);
    if (res.success && res.room) {
      setRoom(res.room);
      showToast(res.message);
    }
  };

  // 🏆 대회 공식 마감 & 실록 영구 보존
  const handleFinalizeTournament = () => {
    if (!room) return;
    if (
      !confirm(
        `🏆 [대회 공식 마감 & 실록 영구 보존]\n\n'${room.title}' 대회를 공식 종료하고, 최종 순위와 스코어보드를 클럽 영구 연대기(실록)에 보존하시겠습니까?`
      )
    ) {
      return;
    }

    const res = ClubStorage.finalizeTournament(room.id);
    if (res.success && res.room) {
      setRoom(res.room);
      showToast(res.message);
      handleCopyTournamentReport();
    }
  };

  // 참가 등록 (특정 조 지정 or 대기 풀 등록)
  const handleConfirmJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;

    if (joiningGroup !== null) {
      // 특정 조에 직접 참가
      const updated = ClubStorage.joinGroup(
        room.id,
        joiningGroup,
        trimmed,
        joinAsLeader,
        newPlayerGender,
        newPlayerTier
      );
      if (updated) {
        setRoom(updated);
        showToast(`[${joiningGroup}조] 참가 등록이 완료되었습니다!`);
      }
    } else {
      // 대기 풀(Lobby)에 등록
      const updated = ClubStorage.addToWaitingPool(room.id, {
        name: trimmed,
        gender: newPlayerGender,
        handicapTier: newPlayerTier,
      });
      if (updated) {
        setRoom(updated);
        showToast(`'${trimmed}' 님 참가 신청 완료! (조 편성 대기 중)`);
      }
    }

    setShowJoinModal(false);
    setJoiningGroup(null);
    setNewPlayerName('');
    setJoinAsLeader(false);
  };

  // 대기 풀에서 삭제
  const handleRemoveFromWaitingPool = (playerId: string, name: string) => {
    if (confirm(`'${name}' 님의 참가 신청을 취소하시겠습니까?`)) {
      const updated = ClubStorage.removeFromWaitingPool(room.id, playerId);
      if (updated) {
        setRoom(updated);
        showToast(`${name} 님이 참가 명단에서 제외되었습니다.`);
      }
    }
  };

  // 특정 선수 탈퇴 / 조에서 제외
  const handleLeaveGroup = (groupNumber: number, playerId: string, playerName: string) => {
    if (confirm(`'${playerName}' 님을 [${groupNumber}조]에서 제외하시겠습니까?`)) {
      const updated = ClubStorage.leaveGroup(room.id, groupNumber, playerId);
      if (updated) {
        setRoom(updated);
        showToast(`${playerName} 님이 조에서 제외되었습니다.`);
      }
    }
  };

  // 조장 임명
  const handleMakeLeader = (groupNumber: number, playerId: string, playerName: string) => {
    const updated = ClubStorage.setGroupLeader(room.id, groupNumber, playerId);
    if (updated) {
      setRoom(updated);
      showToast(`[${groupNumber}조] 조장이 '${playerName}' 님으로 변경되었습니다.`);
    }
  };

  // 조 간 선수 이동 실행
  const handleMovePlayer = (targetGroupNumber: number) => {
    if (!movingPlayer) return;
    const updated = ClubStorage.movePlayerBetweenGroups(
      room.id,
      movingPlayer.fromGroup,
      targetGroupNumber,
      movingPlayer.playerId
    );
    if (updated) {
      setRoom(updated);
      showToast(`'${movingPlayer.playerName}' 님이 [${targetGroupNumber}조]로 이동되었습니다.`);
    }
    setMovingPlayer(null);
  };

  // 스마트 자동 조 편성 모달 열기
  const openAutoGroupModal = () => {
    if (!room) return;
    const opt = ClubStorage.calculateOptimalGroups(totalAllPlayers || 16);
    const targetGroups = opt.groupCount;
    setCustomGroupCount(targetGroups);
    setModalStep('CONFIG');
    setSelectedSwapPlayer(null);

    // 기존 조장들이 있으면 미리 체크해두기
    const existingLeaderIds: string[] = [];
    room.groups.forEach((g) => {
      const leader = g.players.find((p) => p.isLeader) || g.players[0];
      if (leader && !existingLeaderIds.includes(leader.id)) {
        existingLeaderIds.push(leader.id);
      }
    });

    // 만약 기존 조장이 부족하면 상급자/참가자 우선 채우기
    if (existingLeaderIds.length < targetGroups) {
      const allP = [...(room.waitingPool || []), ...room.groups.flatMap((g) => g.players)];
      for (const p of allP) {
        if (!existingLeaderIds.includes(p.id) && existingLeaderIds.length < targetGroups) {
          existingLeaderIds.push(p.id);
        }
      }
    }

    setSelectedLeaderIds(existingLeaderIds.slice(0, targetGroups));
    setShowAutoGroupModal(true);
  };

  // ⚡ 1단계 조건 적용하여 가편성 미리보기 (2단계 모달로 전환)
  const handleApplyConditionsAndPreview = async () => {
    if (!room) return;
    if (totalAllPlayers === 0) {
      alert('참가자가 최소 1명 이상 있어야 조 편성이 가능합니다.');
      return;
    }

    // 🔗 복수 동반 묶음 그룹 정제
    const activeTogether = condTogether
      ? togetherGroups
          .filter((tg) => tg.playerIds.length >= 2)
          .map((tg) => ({
            playerIds: tg.playerIds,
            targetGroup: tg.targetGroupNumber && tg.targetGroupNumber > 0 ? tg.targetGroupNumber : undefined,
          }))
      : [];

    // 🚫 절대 분리 기피 그룹 정제
    const activeSeparate = condSeparate
      ? separateGroups
          .filter((sg) => sg.playerIds.length >= 2)
          .map((sg) => ({ playerIds: sg.playerIds }))
      : [];

    ClubStorage.saveRoom(room);

    const updated = ClubStorage.autoGroupPlayers(
      room.id,
      finalDrawType === 'SNAKE_TIER' ? 'BALANCED_TIER' : (condBalanceGender ? 'BALANCED_GENDER' : 'RANDOM'),
      customGroupCount > 0 ? customGroupCount : undefined,
      {
        designatedLeaderIds: condFixLeaders ? selectedLeaderIds : [],
        togetherGroups: activeTogether,
        separateGroups: activeSeparate,
        balanceGender: condBalanceGender,
        balanceTier: finalDrawType === 'SNAKE_TIER',
        separatePrevBuddies: condSeparatePrev,
      }
    );

    if (updated) {
      const stageRoom: ClubEventRoom = {
        ...updated,
        groupingStatus: 'PREVIEW',
        groupingConfirmed: false,
        status: 'RECRUITING',
      };
      setRoom(stageRoom);
      ClubStorage.saveRoom(stageRoom);
      setSelectedSwapPlayer(null);
      setModalStep('PREVIEW');
      showToast(`🎲 가편성이 완료되었습니다! 조원을 터치하여 맞바꾸거나(Swap) 경기 시작을 누르세요.`);

      try {
        await fetch('/api/club/live-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: room.id,
            action: 'EXECUTE_AUTO_GROUP',
            groups: stageRoom.groups,
          }),
        });
      } catch (e) {}
    }
  };

  // 🔄 2단계 모달: 원터치 맞바꾸기 (Swap) 인터랙션
  const handleSwapPlayersInPreview = (player: ClubPlayer, groupNumber: number) => {
    if (!room) return;

    if (!selectedSwapPlayer) {
      // 1번째 선수 선택
      setSelectedSwapPlayer({ id: player.id, name: player.name, groupNumber });
      showToast(`🔄 [${player.name}] 님 선택됨! 맞바꿀 다른 조 선수를 터치하세요.`);
      return;
    }

    if (selectedSwapPlayer.id === player.id) {
      // 본인 다시 터치 시 선택 해제
      setSelectedSwapPlayer(null);
      showToast('선택이 해제되었습니다.');
      return;
    }

    // 동일 조의 다른 선수를 터치한 경우: 이동/맞바꾸기 대상 선수 교체
    if (selectedSwapPlayer.groupNumber === groupNumber) {
      setSelectedSwapPlayer({ id: player.id, name: player.name, groupNumber });
      showToast(`🔄 [${player.name}] 님으로 이동/맞바꾸기 대상이 변경되었습니다.`);
      return;
    }

    // 2번째 선수 터치 ➔ 즉시 두 선수의 조 Swap!
    const newGroups = room.groups.map((g) => ({
      ...g,
      players: g.players.map((p) => ({ ...p })),
    }));

    const gA = newGroups.find((g) => g.groupNumber === selectedSwapPlayer.groupNumber);
    const gB = newGroups.find((g) => g.groupNumber === groupNumber);

    if (gA && gB) {
      const idxA = gA.players.findIndex((p) => p.id === selectedSwapPlayer.id);
      const idxB = gB.players.findIndex((p) => p.id === player.id);

      if (idxA !== -1 && idxB !== -1) {
        const pA = gA.players[idxA];
        const pB = gB.players[idxB];

        const wasALeader = pA.isLeader;
        const wasBLeader = pB.isLeader;

        pA.isLeader = wasBLeader;
        pB.isLeader = wasALeader;

        gA.players[idxA] = pB;
        gB.players[idxB] = pA;

        gA.leaderName = gA.players.find((p) => p.isLeader)?.name || gA.players[0]?.name || '';
        gB.leaderName = gB.players.find((p) => p.isLeader)?.name || gB.players[0]?.name || '';

        const updatedRoom: ClubEventRoom = {
          ...room,
          groups: newGroups,
          groupingStatus: 'PREVIEW',
          groupingConfirmed: false,
        };

        setRoom(updatedRoom);
        ClubStorage.saveRoom(updatedRoom);

        // 실시간 서버 상태 동기화 (폴링 덮어쓰기 방지)
        fetch('/api/club/live-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: room.id,
            action: 'UPDATE_GROUPS_PREVIEW',
            groups: newGroups,
          }),
        }).catch(() => {});

        showToast(`🔄 [${selectedSwapPlayer.name}] 님과 [${player.name}] 님의 조가 맞바뀌었습니다!`);
      }
    }
    setSelectedSwapPlayer(null);
  };

  // 🏃 2단계 모달: 1인 단독 조 이동 (Move) 및 조별 인원 동적 변경
  const handleMoveSinglePlayerToGroup = (targetGroupNumber: number) => {
    if (!room || !selectedSwapPlayer) return;

    if (selectedSwapPlayer.groupNumber === targetGroupNumber) {
      showToast(isJapanese ? 'すでにその組に所属しています。' : '이미 해당 조에 속해 있습니다.');
      return;
    }

    const sourceGroup = room.groups.find((g) => g.groupNumber === selectedSwapPlayer.groupNumber);
    const targetGroup = room.groups.find((g) => g.groupNumber === targetGroupNumber);

    if (!sourceGroup || !targetGroup) return;

    if (sourceGroup.players.length <= 1) {
      alert(isJapanese ? '1組あたり最低1人以上の選手が必要です。' : '한 조에는 최소 1명 이상의 선수가 있어야 합니다.');
      return;
    }

    if (targetGroup.players.length >= 5) {
      alert(isJapanese ? '安全規定により1組あたり最大5人まで編成可能です。' : '파크골프 안전 규정에 따라 한 조는 최대 5명까지만 편성 가능합니다.');
      return;
    }

    const newGroups = room.groups.map((g) => ({
      ...g,
      players: g.players.map((p) => ({ ...p })),
    }));

    const gSrc = newGroups.find((g) => g.groupNumber === selectedSwapPlayer.groupNumber);
    const gTgt = newGroups.find((g) => g.groupNumber === targetGroupNumber);

    if (gSrc && gTgt) {
      const pIdx = gSrc.players.findIndex((p) => p.id === selectedSwapPlayer.id);
      if (pIdx !== -1) {
        const [movedPlayer] = gSrc.players.splice(pIdx, 1);
        movedPlayer.isLeader = false;

        // 원본 조의 조장이 이동한 경우 잔여 선수 중 첫 번째를 조장으로 승계
        if (gSrc.players.length > 0 && !gSrc.players.some((p) => p.isLeader)) {
          gSrc.players[0].isLeader = true;
        }
        gSrc.leaderName = gSrc.players.find((p) => p.isLeader)?.name || gSrc.players[0]?.name || '';

        // 타겟 조로 이동 선수 추가
        if (gTgt.players.length === 0) {
          movedPlayer.isLeader = true;
        }
        gTgt.players.push(movedPlayer);
        gTgt.leaderName = gTgt.players.find((p) => p.isLeader)?.name || gTgt.players[0]?.name || '';

        const updatedRoom: ClubEventRoom = {
          ...room,
          groups: newGroups,
          groupingStatus: 'PREVIEW',
          groupingConfirmed: false,
        };

        setRoom(updatedRoom);
        ClubStorage.saveRoom(updatedRoom);

        // 실시간 서버 동기화
        fetch('/api/club/live-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: room.id,
            action: 'UPDATE_GROUPS_PREVIEW',
            groups: newGroups,
          }),
        }).catch(() => {});

        showToast(
          isJapanese
            ? `🏃 「${movedPlayer.name}」様が${targetGroupNumber}組へ移動しました！ (${gSrc.groupNumber}組: ${gSrc.players.length}人, ${gTgt.groupNumber}組: ${gTgt.players.length}人)`
            : `🏃 [${movedPlayer.name}] 님이 ${targetGroupNumber}조로 이동되었습니다! (${gSrc.groupNumber}조: ${gSrc.players.length}명, ${gTgt.groupNumber}조: ${gTgt.players.length}명)`
        );
      }
    }

    setSelectedSwapPlayer(null);
  };

  // 🚀 모달 원스톱 액션: 조 편성 최종 확정 & 전 조 경기 시작!
  const handleFinalizeAndStartMatchFromModal = async () => {
    if (!room) return;

    // 1. 조 편성 확정 신호
    const confirmedRoom: ClubEventRoom = {
      ...room,
      groupingStatus: 'CONFIRMED',
      groupingConfirmed: true,
      status: 'PLAYING',
      waitingPool: [],
    };
    setRoom(confirmedRoom);
    ClubStorage.saveRoom(confirmedRoom);

    // 2. 1조부터 N조까지 Supabase/스토리지 일괄 기동
    const launchRes = await ClubStorage.launchAllTournamentGroups(room.id);
    if (launchRes.success && launchRes.room) {
      setRoom(launchRes.room);
    }

    // 3. 모의 라이브 API 동기화 (START_MATCH)
    try {
      await fetch('/api/club/live-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          action: 'START_MATCH',
          groups: confirmedRoom.groups,
        }),
      });
    } catch {}

    setShowAutoGroupModal(false);
    showToast('🚀 조 편성이 확정되어 1조부터 전 조 경기가 일제히 시작되었습니다!');
  };

  // 📢 3단계: 조 편성 확정 및 회원들에게 전송
  const handleConfirmAndBroadcastGrouping = async () => {
    if (!room) return;
    if (room.groups.length === 0) {
      alert('편성된 조가 없습니다. 먼저 스마트 조 편성을 실행해주세요.');
      return;
    }
    const updated: ClubEventRoom = {
      ...room,
      groupingStatus: 'CONFIRMED',
      groupingConfirmed: true,
      status: 'PLAYING',
      groups: room.groups.map((g) => ({ ...g, status: 'WAITING' })),
    };
    setRoom(updated);
    ClubStorage.saveRoom(updated);
    showToast('📢 조 편성이 최종 확정되어 전 회원에게 실시간 전송되었습니다!');

    try {
      await fetch('/api/club/live-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          action: 'CONFIRM_GROUPING',
          groups: updated.groups,
        }),
      });
    } catch (e) {}
  };

  // 🔄 1단계(모집/출석 확인 대기실)로 초기화 리셋
  const handleResetToStage1 = async () => {
    if (!room) return;
    if (!confirm('조 편성을 초기화하고 1단계(모집/출석 확인 대기실)로 되돌릴까요?')) return;
    const allWaiting = allCurrentPlayers.length > 0 ? allCurrentPlayers : MEMBERS_10P;
    const resetRoom: ClubEventRoom = {
      ...room,
      groups: [],
      waitingPool: allWaiting.map((p) => ({ ...p, isLeader: false, scores: {}, totalStrokes: 0, parDiff: 0, holesCompleted: 0 })),
      groupingStatus: 'WAITING',
      groupingConfirmed: false,
      status: 'RECRUITING',
    };
    setRoom(resetRoom);
    ClubStorage.saveRoom(resetRoom);
    showToast('🔄 1단계(모집 및 출석 대기실)로 초기화되었습니다.');

    try {
      await fetch('/api/club/live-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          action: 'RESET_TO_STAGE1',
        }),
      });
    } catch (e) {}
  };

  // 대기자/게스트 삭제
  const handleRemoveWaitingPlayer = (playerId: string, playerName: string) => {
    if (!confirm(`'${playerName}' 님을 참가 명단에서 삭제할까요?`)) return;
    const updated = ClubStorage.removeFromWaitingPool(room.id, playerId);
    if (updated) {
      setRoom(updated);
      showToast(`'${playerName}' 님이 참가 명단에서 삭제되었습니다.`);
    }
  };

  // 신규 빈 조 수동 추가
  const handleAddEmptyGroup = () => {
    const nextNum = room.groups.length + 1;
    const letters = room.selectedCourseLetters || ['A', 'B'];
    const letter = letters[(nextNum - 1) % letters.length];
    const newG: ClubGroup = {
      groupNumber: nextNum,
      name: `${nextNum}조`,
      startCourseLetter: letter,
      leaderName: '',
      players: [],
      status: 'WAITING',
    };
    const updated: ClubEventRoom = {
      ...room,
      groups: [...room.groups, newG],
    };
    ClubStorage.saveRoom(updated);
    setRoom(updated);
    showToast(`[${nextNum}조] 가 새롭게 추가되었습니다.`);
  };

  // 빈 조 삭제
  const handleDeleteEmptyGroup = (groupNum: number) => {
    const group = room.groups.find((g) => g.groupNumber === groupNum);
    if (group && group.players.length > 0) {
      alert('조원이 남아있는 조는 삭제할 수 없습니다. 먼저 조원을 다른 조로 이동시켜 주세요.');
      return;
    }
    const remaining = room.groups.filter((g) => g.groupNumber !== groupNum);
    // 재번호 부여
    remaining.forEach((g, idx) => {
      g.groupNumber = idx + 1;
      g.name = `${idx + 1}조`;
    });
    const updated: ClubEventRoom = {
      ...room,
      groups: remaining,
    };
    ClubStorage.saveRoom(updated);
    setRoom(updated);
    showToast(`조가 삭제되었습니다.`);
  };

  // 우리 조 18홀 라운드 시작 (스코어보드로 이동)
  const handleStartGroupRound = (group: ClubGroup) => {
    if (group.players.length === 0) {
      alert('조원이 최소 1명 이상 등록되어야 라운드를 시작할 수 있습니다.');
      return;
    }

    const courseObj = DEFAULT_COURSES.find((c) => c.id === room.courseId) || DEFAULT_COURSES[0];
    const letters = room.selectedCourseLetters || ['A', 'B'];

    const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const holeNumbers: number[] = [];

    letters.forEach((letStr) => {
      const cIdx = Math.max(0, COURSE_LETTERS.indexOf(letStr));
      for (let i = 1; i <= 9; i++) {
        holeNumbers.push(cIdx * 9 + i);
      }
    });

    const roundId = `round_club_${room.id}_g${group.groupNumber}`;

    const players: RoundPlayer[] = group.players.map((p, idx) => {
      const scores: Record<number, number> = {};
      const obCount: Record<number, number> = {};

      holeNumbers.forEach((hNum) => {
        const meta = courseObj.holesMetadata.find((m) => m.hole === hNum);
        scores[hNum] = p.scores[hNum] || (meta?.par || 3);
        obCount[hNum] = 0;
      });

      return {
        id: p.id || `p_${idx}_${Date.now()}`,
        name: p.name,
        scores,
        obCount,
        totalStrokes: p.totalStrokes || Object.values(scores).reduce((a, b) => a + b, 0),
        totalParDiff: p.parDiff || 0,
      };
    });

    const newSession: RoundSession = {
      id: roundId,
      courseId: courseObj.id,
      courseName: courseObj.name,
      startedAt: new Date().toISOString(),
      currentHole: 1,
      totalHoles: holeNumbers.length,
      selectedCourseLetters: letters,
      selectedHoleNumbers: holeNumbers,
      players,
      status: 'IN_PROGRESS',
      clubRoomId: room.id,
      clubGroupNumber: group.groupNumber,
    };

    ParkOnStorage.saveCurrentRound(newSession);
    router.push(`/round/${roundId}`);
  };

  return (
    <div className="p-3 max-w-xl mx-auto space-y-3 pb-20" suppressHydrationWarning>
      {/* 상단 네비게이션 헤더 */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3 shadow-xs border border-stone-200">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/club?tab=tournaments');
            }
          }}
          className="flex items-center gap-1 text-xs font-black text-stone-700 hover:text-stone-900 transition active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{isJapanese ? '一覧へ' : '목록으로'}</span>
        </button>
        <div className="text-center">
          <h1 className="font-black text-sm text-stone-900 flex items-center justify-center gap-1.5">
            <Trophy className="w-4 h-4 text-purple-700" />
            <span>{isJapanese ? '大会・ラウンド現況' : '대회 / 모임 현황'}</span>
          </h1>
          <p className="text-[10px] text-stone-500 font-bold">
            {isJapanese
              ? `計 ${totalAllPlayers}人参加 (${room.groups.length}組)`
              : `총 ${totalAllPlayers}명 참가 (${room.groups.length}개 조)`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={loadRoom}
            className="p-1.5 rounded-xl text-stone-500 hover:text-stone-800 bg-stone-50 border border-stone-200 active:scale-95 transition cursor-pointer"
            title={isJapanese ? '更新' : '새로고침'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {/* 대표님 요청: 상단 우측 닫기 (X) 버튼 누르면 항상 직전 화면으로 복귀 */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/club?tab=tournaments');
              }
            }}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer flex items-center justify-center"
            title={isJapanese ? '閉じる (前の画面へ)' : '닫기 (이전 화면으로)'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 안내 토스트 피드백 */}
      {toastMessage && (
        <div className="bg-purple-800 text-white text-xs font-black p-3 rounded-2xl shadow-lg border border-purple-400 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-purple-200 hover:text-white font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 👤 [A. 일반 회원 모드] - 1/2단계 대기실 vs 3단계 조 배정 완료 */}
      {/* ======================================================== */}
      {!isManager && (
        <div className="space-y-3 animate-fadeIn">
          {/* [1단계 & 2단계: 대기실 입장 완료 모드 (아직 조 번호 없음)] */}
          {!isGroupingConfirmed && !isMatchPlaying && (
            <div className="bg-gradient-to-r from-stone-900 via-purple-950 to-indigo-950 text-white rounded-3xl p-5 shadow-lg space-y-4 border-2 border-purple-500/30">
              {/* 상단 안내 바 */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>👤 {isJapanese ? '参加者' : '참가자'}</span>
                  <span className="text-white font-extrabold">{currentUser}{isJapanese ? '様' : '님'}</span>
                </span>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span>⏳</span>
                  <span>{isJapanese ? '待機室入場完了 (出席確認)' : '대기실 입장 완료 (출석 확인)'}</span>
                </span>
              </div>

              {/* 대기실 전광판 중앙 메시지 (대표님 1단계 지침 표준) */}
              <div className="text-center py-5 space-y-2.5 bg-white/5 rounded-2xl border border-white/10 p-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-black text-white leading-tight">
                  {isJapanese ? '待機室入場完了！幹事様が組編成中です...' : '대기실 입장 완료! 총무님이 조를 짜는 중입니다...'}
                </h3>
                <p className="text-xs text-stone-300 font-bold max-w-xs mx-auto leading-relaxed">
                  {isJapanese
                    ? '※ まだ組番号は未配属です。幹事様がスマート組編成を確定すると、あなたの組番号とスタートホールがここに即座に公開されます！'
                    : '※ 아직 조 번호가 배정되지 않았습니다. 총무님이 스마트 조 편성을 확정하면 내 조 번호와 출발 홀 위치가 여기에 즉시 공개됩니다!'}
                </p>
              </div>

              {/* 대회 정보 및 출석 인원 */}
              <div className="space-y-2 text-xs">
                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs flex items-center justify-between text-stone-200 font-bold">
                  <span>{room.title}</span>
                  <span className="text-amber-300 font-black">{totalAllPlayers}{isJapanese ? '人出席中' : '명 출석 대기 중'}</span>
                </div>
                <div className="text-[11px] text-stone-400 text-center font-medium">
                  📍 {room.courseName} · {room.totalHoles}{isJapanese ? 'ホール競技' : '홀 경기'} ({room.hostName})
                </div>
              </div>
            </div>
          )}

          {/* [3단계: 조 편성 최종 확정 완료 모드 (축하 & 조 배정 & 스코어보드)] */}
          {(isGroupingConfirmed || isMatchPlaying) && (
            <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-stone-900 text-white rounded-3xl p-4 shadow-md space-y-3 border-2 border-emerald-400/40">
              {/* 1. 상단 안내 */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span>👤 {isJapanese ? '参加者' : '참가자'}</span>
                  <span className="text-white font-extrabold">{currentUser}{isJapanese ? '様' : '님'}</span>
                </span>
                <span className="bg-amber-400 text-amber-950 font-black text-xs px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 animate-pulse">
                  <span>🎉</span>
                  <span>{myGroup ? `${myGroup.name} ${isJapanese ? '配属完了 ✅' : '배정 완료 ✅'}` : (isJapanese ? '配属完了' : '조 배정 완료')}</span>
                </span>
              </div>

              {/* 축하 타이틀 */}
              <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-center space-y-1">
                <div className="text-xs text-amber-300 font-extrabold">🎉 {isJapanese ? 'おめでとうございます！' : '축하합니다!'}</div>
                <h2 className="text-base sm:text-lg font-black text-white">
                  {currentUser}{isJapanese ? '様は ' : '님은 '}
                  <span className="text-amber-300 underline underline-offset-4">{myGroup?.name || (isJapanese ? '配属組' : '우리 조')}</span>
                  {isJapanese ? 'です。' : '입니다.'}
                </h2>
              </div>

              {/* 2. 출발 홀 안내 */}
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-xs space-y-1">
                <div className="text-[11px] text-emerald-200 font-bold">📍 {isJapanese ? 'スタート位置案内' : '출발 위치 안내'}</div>
                <div className="text-base font-black text-amber-300 flex items-center gap-1.5">
                  <span>🚩</span>
                  <span>
                    {myGroup
                      ? isJapanese
                        ? `A-${myGroup.groupNumber}番ホール (${ClubStorage.getGroupStartHole(myGroup.groupNumber - 1, room.selectedCourseLetters, myGroup.startCourseLetter)}) で待機してください。`
                        : `A-${myGroup.groupNumber}번 홀(${ClubStorage.getGroupStartHole(myGroup.groupNumber - 1, room.selectedCourseLetters, myGroup.startCourseLetter)})에서 대기해주세요.`
                      : isJapanese
                      ? '本部の案内に従ってスタートホールへ移動してください。'
                      : '클럽 본부석 안내에 따라 출발 홀로 이동해주세요.'}
                  </span>
                </div>
                <div className="text-[11px] text-stone-300 font-medium">
                  {room.courseName} · {room.totalHoles}{isJapanese ? 'ホール競技 (同時ショットガンスタート)' : '홀 경기 (동시 샷건 티샷 출발)'}
                </div>
              </div>

              {/* 3. 조원 명단: 내가 속한 조의 동반자 4명 명단 카드 */}
              {myGroup && (
                <div className="bg-white/15 p-3 rounded-2xl backdrop-blur-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-100">
                    <span>🏌️ {isJapanese ? `自組 (${myGroup.name}) 同伴メンバー` : `우리 조(${myGroup.name}) 동반자 명단`}</span>
                    <span className="text-[10px] text-emerald-200">{isJapanese ? `計 ${myGroup.players.length}人` : `총 ${myGroup.players.length}명`}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {myGroup.players.map((p, idx) => {
                      const cleanCur = currentUser.replace(/\(.*?\)/g, '').trim().toLowerCase();
                      const cleanP = p.name.replace(/\(.*?\)/g, '').trim().toLowerCase();
                      const isMe = cleanP === cleanCur || cleanP.includes(cleanCur) || cleanCur.includes(cleanP);
                      return (
                        <div
                          key={p.id || idx}
                          className={`p-2 rounded-xl text-xs font-black flex items-center justify-between ${
                            isMe
                              ? 'bg-amber-400 text-stone-950 ring-2 ring-white shadow-xs'
                              : p.isLeader
                              ? 'bg-white/25 text-white border border-amber-300/60'
                              : 'bg-white/10 text-stone-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {p.isLeader ? (
                              <span title={isJapanese ? 'リーダー' : '조장'}>👑</span>
                            ) : (
                              <span className="text-[10px] opacity-70">{idx + 1}</span>
                            )}
                            <span className="truncate">{p.name}</span>
                            {isMe && (
                              <span className="text-[9px] bg-stone-900 text-white px-1 rounded-sm shrink-0">
                                {isJapanese ? '自分' : '나'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] opacity-80 shrink-0">
                            {p.gender === 'F' ? (isJapanese ? '女' : '여') : (isJapanese ? '男' : '남')}·
                            {p.handicapTier === 'ADVANCED' ? (isJapanese ? '上' : '상') : p.handicapTier === 'BEGINNER' ? (isJapanese ? '初' : '초') : (isJapanese ? '中' : '중')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. 핵심 액션 버튼: [ ⛳ 우리 조 스코어보드 입장 ] */}
              {myGroup && (
                <button
                  type="button"
                  onClick={() => handleStartGroupRound(myGroup)}
                  className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black text-sm py-3.5 rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-2 border-yellow-200"
                >
                  <Play className="w-5 h-5 text-stone-950 fill-stone-950" />
                  <span>{isJapanese ? '⛳ 自組スコアボードに入場 (打数入力)' : '⛳ 우리 조 스코어보드 입장 (즉시 타수 입력)'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 👑 [B. 총무 관제 모드] - 1단계 모집 vs 2단계 가편성 vs 3단계 경기 준비 */}
      {/* ======================================================== */}
      {isManager && (
        <div className="space-y-3 animate-fadeIn">
          {/* [1단계: 모집 및 출석 확인 중 배너 카드] */}
          {isGroupingWaiting && (
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-stone-900 text-white rounded-3xl p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <span>👑</span>
                  <span>{isJapanese ? '大会主管 / 幹事管制モード' : '대회 주관 / 총무 관제 모드'}</span>
                </span>
                <span className="bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {isJapanese ? '📢 1段階: 募集および出席確認' : '📢 1단계: 모집 및 출석 확인'}
                </span>
                <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{totalAllPlayers}{isJapanese ? '人出席中' : '명 출석 대기 중'}</span>
                </span>
              </div>

              <h2 className="text-base font-black text-white mt-1 leading-snug">{room.title}</h2>
              <div className="text-xs text-purple-200 font-medium">
                📍 {room.courseName} ({room.totalHoles}{isJapanese ? 'ホール' : '홀'}) · {isJapanese ? '主催/幹事: ' : '주최/총무: '}{room.hostName}
              </div>

              {/* 1단계 메인 액션 버튼 */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  data-testid="btn-open-auto-group-modal"
                  onClick={openAutoGroupModal}
                  className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm py-3.5 rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-purple-400"
                >
                  <Dices className="w-5 h-5 text-yellow-300" />
                  <span>{isJapanese ? '🎲 スマート組編成ルール設定＆自動配分実行' : '🎲 스마트 조 편성 룰 설정 & 자동 분배 실행'}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setJoiningGroup(null);
                      setNewPlayerName('');
                      setShowJoinModal(true);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isJapanese ? '➕ 現場ゲスト追加' : '➕ 현장 게스트 추가'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyKakaoInvite}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs py-2.5 rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{isJapanese ? '📢 招待状を送る' : '📢 초대장 보내기'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* [1단계: 참가 신청자 및 출석 명단 카드] */}
          {isGroupingWaiting && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-black text-stone-800">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-700" />
                  <span>{isJapanese ? `📋 参加申込者および出席名簿 (${allCurrentPlayers.length}人)` : `📋 참가 신청자 및 출석 명단 (${allCurrentPlayers.length}명)`}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setJoiningGroup(null);
                    setNewPlayerName('');
                    setShowJoinModal(true);
                  }}
                  className="text-[11px] font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 cursor-pointer"
                >
                  {isJapanese ? '+ ゲスト直接登録' : '+ 현장 게스트 추가'}
                </button>
              </div>

              <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
                {allCurrentPlayers.map((p, idx) => (
                  <div key={p.id || idx} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-extrabold text-stone-800 truncate">{p.name}</span>
                      <span className="text-[10px] text-stone-500">
                        ({p.gender === 'F' ? (isJapanese ? '女' : '여') : (isJapanese ? '男' : '남')} · {p.handicapTier === 'ADVANCED' ? (isJapanese ? '上級' : '상급') : p.handicapTier === 'BEGINNER' ? (isJapanese ? '初級' : '초급') : (isJapanese ? '中級' : '중급')})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                        {isJapanese ? '出席確認済 ✅' : '출석 완료 ✅'}
                      </span>
                      {p.id.startsWith('guest_') && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWaitingPlayer(p.id, p.name)}
                          className="text-stone-400 hover:text-red-500 p-0.5 cursor-pointer"
                          title={isJapanese ? '削除' : '삭제'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* [2단계: 가편성 결과 미리보기 배너 카드] */}
          {isGroupingPreview && (
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-stone-900 text-white rounded-3xl p-4 shadow-md space-y-3 border-2 border-amber-400 animate-fadeIn">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <span>👑</span>
                  <span>{isJapanese ? '大会主管 / 幹事管制モード' : '대회 주관 / 총무 관제 모드'}</span>
                </span>
                <span className="bg-amber-300 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                  {isJapanese ? '🎲 2段階: 仮編成プレビュー中' : '🎲 2단계: 조 편성 가편성 미리보기'}
                </span>
                <span className="bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {isJapanese ? `${room.groups.length}組配属済` : `${room.groups.length}개 조 배분됨`}
                </span>
              </div>

              <div className="bg-amber-400/20 border border-amber-300/40 p-2.5 rounded-xl text-center">
                <p className="text-xs text-amber-200 font-bold">
                  ⚠️ <strong>{isJapanese ? '仮編成プレビュー状態' : '가편성 미리보기 상태'}</strong>{isJapanese ? 'です。一般会員にはまだ公開されていません。' : '입니다. 일반 회원들에게는 아직 전송되지 않았습니다.'}
                </p>
              </div>

              {/* 2단계 메인 액션 버튼 */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmAndBroadcastGrouping}
                  className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-2 border-emerald-300 animate-pulse"
                >
                  <Share2 className="w-5 h-5 text-white" />
                  <span>{isJapanese ? '📢 組編成確定および会員へ送信' : '📢 조 편성 확정 및 회원들에게 전송'}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAutoGroupModal(true)}
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white font-black text-xs py-2.5 rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isJapanese ? '🔄 再配分' : '🔄 다른 룰로 다시 분배'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToStage1}
                    className="w-full bg-stone-700 hover:bg-stone-800 text-white font-black text-xs py-2.5 rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isJapanese ? '1段階へリセット' : '1단계로 리셋'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* [2단계: 1조, 2조, 3조 가편성 결과 미리보기 카드들] */}
          {isGroupingPreview && (
            <div className="space-y-2.5 bg-white rounded-2xl border border-amber-300 p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-black text-stone-800">
                <div className="flex items-center gap-1.5">
                  <Dices className="w-4 h-4 text-purple-700" />
                  <span>👀 {isJapanese ? '各組の仮編成プレビュー (全組事前確認)' : '1조, 2조, 3조 가편성 결과 미리보기'}</span>
                </div>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {isJapanese ? '非公開下書き' : '비공개 초안'}
                </span>
              </div>

              <div className="space-y-2">
                {room.groups.map((grp) => (
                  <div key={grp.groupNumber} className="bg-stone-50 rounded-xl p-3 border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className="text-purple-900 font-black">{grp.name} ({grp.players.length}명)</span>
                      <span className="text-[10px] text-stone-500 font-medium">
                        출발 예정: A-{grp.groupNumber}번 홀
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {grp.players.map((p, pIdx) => (
                        <div key={p.id || pIdx} className="bg-white p-2 rounded-lg border border-stone-200 flex items-center justify-between">
                          <div className="flex items-center gap-1 min-w-0">
                            {p.isLeader ? <span title="조장">👑</span> : <span className="text-[10px] text-stone-400">{pIdx + 1}</span>}
                            <span className="font-extrabold text-stone-800 truncate">{p.name}</span>
                          </div>
                          <span className="text-[9px] text-stone-500 shrink-0">
                            {p.gender === 'F' ? '여' : '남'}·{p.handicapTier === 'ADVANCED' ? '상' : p.handicapTier === 'BEGINNER' ? '초' : '중'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* [3단계: 조 편성 최종 확정 완료 배너 카드] */}
          {isGroupingConfirmed && (
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-stone-900 text-white rounded-3xl p-4 shadow-md space-y-3 animate-fadeIn">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <span>👑</span>
                      <span>{isJapanese ? '大会主管 / 幹事管制モード' : '대회 주관 / 총무 관제 모드'}</span>
                    </span>
                    <span className="bg-emerald-400 text-emerald-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                      {isJapanese ? '🚀 3段階: 組編成確定完了' : '🚀 3단계: 조 편성 확정 완료'}
                    </span>
                    <span className="bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {isJapanese ? `${room.groups.length}組編成確定` : `${room.groups.length}개 조 편성 확정`}
                    </span>
                    <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{totalAllPlayers}{isJapanese ? '人参加完了' : '명 참가 완료'}</span>
                    </span>
                  </div>
                  <h2 className="text-base font-black text-white mt-1.5 leading-snug">{room.title}</h2>
                </div>
              </div>

              {/* 구장 & 홀 & 총무 정보 */}
              <div className="grid grid-cols-2 gap-2 text-xs text-purple-100 font-bold bg-white/10 p-2.5 rounded-2xl backdrop-blur-xs">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                  <span className="truncate">
                    {room.courseName} ({(room.selectedCourseLetters || ['A', 'B']).join('-')}{isJapanese ? 'コース · ' : '코스 · '}{room.totalHoles}{isJapanese ? 'ホール' : '홀'})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Calendar className="w-3.5 h-3.5 text-purple-300" />
                  <span>{isJapanese ? '主催/幹事: ' : '주최/총무: '}{room.hostName}</span>
                </div>
              </div>

              {/* 3단계 메인 액션 버튼 */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleLaunchAllGroups}
                  className="w-full bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 hover:from-emerald-600 hover:to-teal-800 text-white font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-2 border-emerald-300 animate-pulse"
                >
                  <Play className="w-5 h-5 text-white fill-white" />
                  <span>{isJapanese ? '🚀 競技開始 (全組出発確定・待機室一括起動)' : '🚀 경기 시작 (전 조 동시 출발 확정)'}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(isJapanese ? '組編成を再調整しますか？' : '조 편성을 재조정하시겠습니까? 조 편성 설정 화면으로 이동합니다.')) {
                        openAutoGroupModal();
                      }
                    }}
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white font-black text-xs py-3 rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isJapanese ? '🔄 組再編成 / 微調整' : '🔄 조 재편성 / 미세조정'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyKakaoInvite}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs py-3 rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{isJapanese ? '📢 LINE招待状' : '📢 카카오톡 초대장'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* [4단계: 실시간 경기 진행 관제 배너 카드] */}
          {isMatchPlaying && (
            <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-900 text-white rounded-3xl p-4 shadow-md space-y-3 animate-fadeIn border-2 border-emerald-500/40">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <span>👑</span>
                      <span>{isJapanese ? '大会主管 / 幹事管制モード' : '대회 주관 / 총무 관제 모드'}</span>
                    </span>
                    <span className="bg-emerald-400 text-emerald-950 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping" />
                      <span>{isJapanese ? '⛳ 4段階: 試合進行中 (リアルタイム管制)' : '⛳ 4단계: 실시간 경기 진행 관제 중'}</span>
                    </span>
                    <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {isJapanese ? `${room.groups.length}組ラウンド中` : `${room.groups.length}개 조 라운드 진행 중`}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-white mt-1.5 leading-snug">{room.title}</h2>
                </div>
              </div>

              {/* 구장 & 홀 & 총무 정보 */}
              <div className="grid grid-cols-2 gap-2 text-xs text-emerald-100 font-bold bg-white/10 p-2.5 rounded-2xl backdrop-blur-xs">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span className="truncate">
                    {room.courseName} ({(room.selectedCourseLetters || ['A', 'B']).join('-')}{isJapanese ? 'コース · ' : '코스 · '}{room.totalHoles}{isJapanese ? 'ホール' : '홀'})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{isJapanese ? '主催/幹事: ' : '주최/총무: '}{room.hostName}</span>
                </div>
              </div>

              {/* 경기 진행 메인 액션 버튼 */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('individual')}
                  className="w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black text-sm py-3.5 rounded-2xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-2 border-yellow-200"
                >
                  <Trophy className="w-5 h-5 text-stone-950" />
                  <span>{isJapanese ? '📋 リアルタイム順位表・リーダーボード確認' : '📋 실시간 전광판 리더보드 확인'}</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyTournamentReport}
                    className="w-full bg-stone-800 hover:bg-stone-700 text-white font-black text-xs py-2.5 rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-stone-600"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isJapanese ? '📢 競技結果速報共有' : '📢 실시간 스코어 카톡 공유'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(isJapanese ? '組編成の再調整を行いますか？' : '조 편성을 재조정하시겠습니까?')) {
                        openAutoGroupModal();
                      }
                    }}
                    className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 font-black text-xs py-2.5 rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-stone-600"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isJapanese ? '🔄 組微調整' : '🔄 조 미세조정'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ⚙️ 총무 전용 관리 메뉴 (수납/시상/모니터링) 접이식 서랍 (아코디언) */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden transition">
            <button
              type="button"
              onClick={() => setShowManagerDrawer((prev) => !prev)}
              className="w-full p-3.5 bg-gradient-to-r from-stone-50 via-purple-50/40 to-stone-50 hover:bg-purple-100/50 transition flex items-center justify-between cursor-pointer border-none text-left"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
                  ⚙️
                </span>
                <div>
                  <div className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <span>{isJapanese ? '⚙️ 幹事専用管理メニュー (収納・表彰・監視)' : '⚙️ 총무 전용 관리 메뉴 (수납 / 시상 / 모니터링)'}</span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                      {isJapanese ? '幹事専用' : '총무 전용'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                    {showManagerDrawer
                      ? (isJapanese ? 'タップして管理メニューを閉じる ▲' : '터치하여 총무 전용 관리 메뉴 접기 ▲')
                      : (isJapanese
                          ? 'タップして参加費収納、1080p表彰カード、ラッキー賞抽選機、ホール監視を展開 ▼'
                          : '터치하여 참가비 수납 현황, 1초 시상식, 1080p 카드 발급, 행운상 추첨기 열기 ▼')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-black px-2.5 py-1 rounded-lg border transition ${
                  showManagerDrawer ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-purple-700 border-purple-200'
                }`}>
                  {showManagerDrawer ? (isJapanese ? 'メニューを閉じる ▲' : '관리 메뉴 접기 ▲') : (isJapanese ? 'メニューを開く ▼' : '관리 메뉴 열기 ▼')}
                </span>
              </div>
            </button>

            {/* 아코디언 내부: showManagerDrawer가 true일 때만 노출 */}
            {showManagerDrawer && (
              <div className="p-3 border-t border-stone-200 bg-stone-50/60 space-y-3 animate-fadeIn">
                {/* 1. 참가비 수납 현황 대시보드 */}
                <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-300/80 rounded-2xl p-3.5 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <div className="flex items-center gap-1.5 font-black text-xs text-amber-950">
                      <Coins className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>{isJapanese ? '参加費収納現況' : '참가비 수납 현황'}</span>
                      <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        {isJapanese ? '1人 ' : '1인 '}{paymentSummary.fee > 0 ? `${paymentSummary.fee.toLocaleString()}${isJapanese ? '円' : '원'}` : (isJapanese ? '無料' : '무료')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                      {paymentSummary.unpaidCount > 0 && (
                        <button
                          type="button"
                          onClick={handleCopyUnpaidReminder}
                          className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <span>{isJapanese ? '催促LINE 📢' : '독촉 카톡 📢'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleCopyPaymentReport}
                        className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-amber-950 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1 transition cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{isJapanese ? '収納共有 📢' : '수납 카톡 공유 📢'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfigFee(paymentSummary.fee);
                          setConfigBankAccount(paymentSummary.bankAccount);
                          setShowPaymentConfigModal(true);
                        }}
                        className="bg-white/80 hover:bg-white text-stone-700 text-[11px] font-bold px-2 py-1 rounded-xl border border-amber-300/80 shadow-2xs transition active:scale-95 cursor-pointer"
                      >
                        <span>{isJapanese ? '設定 ⚙️' : '설정 ⚙️'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 계좌 및 실시간 금액 통계 바 */}
                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-800 flex-wrap gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] text-stone-700 font-bold truncate">
                          🏦 {room.bankAccount || (isJapanese ? '振込口座: 幹事にお問い合わせ' : '입금 계좌: 총무에게 문의')}
                        </span>
                        {room.bankAccount && (
                          <button
                            type="button"
                            onClick={handleCopyAccount}
                            className="bg-purple-700 hover:bg-purple-800 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-2xs transition active:scale-95 cursor-pointer shrink-0 flex items-center gap-0.5"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isJapanese ? '1秒コピー' : '1초 복사'}</span>
                          </button>
                        )}
                      </div>
                      <span className="shrink-0 text-amber-800 font-black text-xs ml-auto">
                        {isJapanese ? '収納率 ' : '수납률 '}{paymentSummary.paidRate}%
                      </span>
                    </div>

                    <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${paymentSummary.paidRate}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-center">
                      <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-200">
                        <div className="text-[10px] text-stone-500 font-bold">{isJapanese ? '総人数' : '전체 인원'}</div>
                        <div className="text-xs font-black text-stone-800">{paymentSummary.totalCount}{isJapanese ? '人' : '명'}</div>
                        <div className="text-[9px] text-stone-400 font-semibold">{paymentSummary.totalExpectedAmount.toLocaleString()}{isJapanese ? '円' : '원'}</div>
                      </div>
                      <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                        <div className="text-[10px] text-emerald-700 font-bold">{isJapanese ? '入金完了 ✅' : '입금 완료 ✅'}</div>
                        <div className="text-xs font-black text-emerald-800">{paymentSummary.paidCount}{isJapanese ? '人' : '명'}</div>
                        <div className="text-[9px] text-emerald-600 font-bold">{paymentSummary.totalCollectedAmount.toLocaleString()}{isJapanese ? '円' : '원'}</div>
                      </div>
                      <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                        <div className="text-[10px] text-amber-700 font-bold">{isJapanese ? '入金待ち ⏳' : '입금 대기 ⏳'}</div>
                        <div className="text-xs font-black text-amber-900">{paymentSummary.unpaidCount}{isJapanese ? '人' : '명'}</div>
                        <div className="text-[9px] text-amber-700 font-bold">{paymentSummary.uncollectedAmount.toLocaleString()}{isJapanese ? '円' : '원'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. 시상 및 부가 기능 카드 */}
                <div className="bg-white rounded-2xl p-3 border border-indigo-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <div className="flex items-center gap-1.5 font-black text-xs text-stone-900">
                      <span className="text-base">🎯</span>
                      <span>{isJapanese ? '競技＆表彰管理:' : '경기 방식 & 시상 관리:'}</span>
                      <span className="text-indigo-700 font-extrabold">{room.gameModeTitle || ClubStorage.getGameModeInfo(room.gameMode).title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowAwardConfigModal(true)}
                        className="text-[11px] font-black text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Settings className="w-3 h-3 text-purple-600" />
                        <span>{isJapanese ? '設定 ⚙️' : '설정 ⚙️'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRulesModal(true)}
                        className="text-[11px] font-extrabold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-0.5 shadow-2xs"
                      >
                        <span>{isJapanese ? '要項 📋' : '요강 📋'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 1초 시상식 및 1080p 카드 발급 버튼 2열 배치 */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyTournamentReport}
                      className="w-full bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black text-xs py-2 rounded-xl border border-amber-300 shadow-xs transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trophy className="w-4 h-4 text-stone-950 shrink-0" />
                      <span>{isJapanese ? '📋 1秒表彰式' : '📋 1초 시상식'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateAndDownloadAwardCard}
                      disabled={generatingAwardCard}
                      className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-600 hover:to-yellow-500 text-stone-950 font-black text-xs py-2 rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer border border-yellow-300"
                    >
                      <Award className="w-4 h-4 text-stone-950 shrink-0" />
                      <span>{generatingAwardCard ? '생성 중...' : (isJapanese ? '🏆 1080pカード' : '🏆 1080p 카드')}</span>
                      <Download className="w-3 h-3 text-stone-900" />
                    </button>
                  </div>

                  {/* 행운상 추첨기 버튼 */}
                  {room.awardConfig?.enableLuckyDraw !== false && (
                    <button
                      type="button"
                      onClick={() => setShowLuckyDrawModal(true)}
                      className="w-full text-xs font-black bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/80 py-2 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <Gift className="w-4 h-4 text-amber-700" />
                      <span>
                        {isJapanese ? '🎰 ラッキー賞抽選機 稼働 ▶' : '🎰 행운상 추첨기 가동 ▶'}
                      </span>
                    </button>
                  )}
                </div>

                {/* 3. 본부석 전 조 홀 진행 현황판 & 대회 공식 마감 바 */}
                <div className="bg-gradient-to-r from-stone-900 via-purple-950 to-stone-900 text-white p-3.5 rounded-2xl shadow-md space-y-2.5 border border-purple-800/40">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🚩</span>
                      <div>
                        <div className="text-xs font-black flex items-center gap-1.5">
                          <span>{isJapanese ? '全組競技進行モニタリング' : '전 조 경기 진행 모니터링'}</span>
                          <span className="bg-purple-500/40 text-purple-200 border border-purple-400/40 text-[10px] font-black px-2 py-0.2 rounded-full">
                            {room.groups.filter((g) => (g.players[0]?.holesCompleted || 0) >= (room.totalHoles || 18)).length}/{room.groups.length}{isJapanese ? '組完走' : '개 조 완주'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleFinalizeTournament}
                      className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-95 text-amber-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{isJapanese ? '大会公式終了 🏆' : '대회 공식 마감 🏆'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none">
                    {room.groups.map((g) => {
                      const completed = g.players[0]?.holesCompleted || 0;
                      const total = room.totalHoles || 18;
                      const isDone = completed >= total || g.status === 'FINISHED';
                      const inProgress = completed > 0 && !isDone;

                      return (
                        <div
                          key={g.groupNumber}
                          className={`px-2.5 py-1 rounded-xl shrink-0 border flex items-center gap-1 ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                              : inProgress
                              ? 'bg-purple-500/30 text-purple-200 border-purple-400/50'
                              : 'bg-white/10 text-stone-300 border-white/10'
                          }`}
                        >
                          <span>{g.name}:</span>
                          <span className="font-black">
                            {isDone ? (isJapanese ? '完走 ✅' : '완주 ✅') : inProgress ? `${completed}/${total}${isJapanese ? 'ホール 🏌️' : '홀 🏌️'}` : (isJapanese ? '待機 ⏳' : '대기 ⏳')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. 조 편성 초기화 (1단계 모집/대기실로 리셋) */}
                <div className="pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={handleResetToStage1}
                    className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer border border-stone-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                    <span>{isJapanese ? '🔄 組編成初期化 (1段階待機室へリセット)' : '🔄 조 편성 초기화 (1단계 모집/대기실로 리셋)'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔍 [일반 회원 감동 기능] 내 조 바로 찾기 & 출발 티박스 스마트 검색 위젯 */}
      <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-stone-900">
            <span className="text-base">🔍</span>
            <span>{isJapanese ? 'マイ組の検索＆スタート位置案内' : '내 조 바로 찾기 & 출발 위치 안내'}</span>
          </div>
          {searchMyName && (
            <button
              type="button"
              onClick={() => setSearchMyName('')}
              className="text-[10px] font-bold text-stone-400 hover:text-stone-700"
            >
              {isJapanese ? 'リセット ✕' : '초기화 ✕'}
            </button>
          )}
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchMyName}
            onChange={(e) => setSearchMyName(e.target.value)}
            placeholder={isJapanese ? 'お名前を入力してください (例: 山田太郎)' : '회원님 성함을 입력하세요 (예: 홍길동)'}
            className="w-full px-3 py-2.5 text-xs font-black bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-600 text-stone-900 placeholder:text-stone-400"
          />
        </div>

        {/* 검색 결과 하이라이트 배너 */}
        {searchMyName.trim() && (() => {
          const query = searchMyName.trim().toLowerCase();
          const matchedGroup = room.groups.find((g) =>
            g.players.some((p) => p.name.toLowerCase().includes(query))
          );
          const matchedPlayer = matchedGroup?.players.find((p) =>
            p.name.toLowerCase().includes(query)
          );
          const matchedWaiting = !matchedGroup && room.waitingPool
            ? room.waitingPool.find((p) => p.name.toLowerCase().includes(query))
            : null;

          if (matchedGroup && matchedPlayer) {
            return (
              <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white p-3.5 rounded-2xl shadow-md space-y-2 border-2 border-yellow-300 animate-fadeIn">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[10px] font-black bg-black/20 px-2 py-0.5 rounded-full text-yellow-100">
                    {isJapanese ? '🎯 マイ組の検索成功' : '🎯 내 조 찾기 성공'}
                  </span>
                  <span className="text-xs font-black bg-red-600 px-2.5 py-0.5 rounded-lg text-white shadow-2xs">
                    🚩 {ClubStorage.getGroupStartHole(matchedGroup.groupNumber - 1, room.selectedCourseLetters, matchedGroup.startCourseLetter)} {isJapanese ? '同時ティーショット出発(ショットガン)' : '동시 티샷 출발(샷건)'}
                  </span>
                </div>
                <div className="text-sm font-black text-white">
                  👑 <span className="underline decoration-yellow-200 decoration-2">{matchedPlayer.name}</span> {isJapanese ? '様は' : '회원님은'}{' '}
                  <span className="text-base font-black text-yellow-200">[{matchedGroup.name}]</span> {isJapanese ? 'です！' : '입니다!'}
                </div>
                <div className="text-xs bg-black/20 p-2 rounded-xl text-yellow-50 font-bold flex items-center justify-between flex-wrap gap-2">
                  <div className="truncate">
                    {isJapanese ? '同伴メンバー: ' : '동반 조원: '}{matchedGroup.players.map((p) => `${p.name}${p.isLeader ? (isJapanese ? '(リーダー👑)' : '(조장👑)') : ''}`).join(', ')}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartGroupRound(matchedGroup)}
                    className="bg-white hover:bg-yellow-50 text-amber-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer ml-auto"
                  >
                    {isJapanese ? '自組スコアボードを開く 📱' : '우리 조 스코어보드 열기 📱'}
                  </button>
                </div>
              </div>
            );
          }

          if (matchedWaiting) {
            return (
              <div className="bg-stone-800 text-white p-3 rounded-2xl shadow-xs space-y-1 animate-fadeIn">
                <div className="text-xs font-black text-amber-300">
                  {isJapanese ? `⏳ '${matchedWaiting.name}' 様は現在組編成の待機中です。` : `⏳ '${matchedWaiting.name}' 회원님은 현재 조 편성 대기 중입니다.`}
                </div>
                <div className="text-[11px] text-stone-300 font-medium">
                  {matchedWaiting.waitNumber
                    ? (isJapanese
                        ? `待機順位: ${matchedWaiting.waitNumber}位 (欠員発生時即座に自動投入)`
                        : `대기 순번: ${matchedWaiting.waitNumber}순위 (결원 발생 시 즉시 자동 투입)`)
                    : (isJapanese ? '組編成実行時に自動配属されます。' : '조 편성 실행 시 조에 자동 배정됩니다.')}
                </div>
              </div>
            );
          }

          return (
            <div className="text-center py-2 text-xs font-bold text-stone-400 bg-stone-50 rounded-xl">
              {isJapanese ? `参加者名簿に '${searchMyName.trim()}' 様が見つかりません。` : `참가자 명단에서 '${searchMyName.trim()}' 님을 찾을 수 없습니다.`}
            </div>
          );
        })()}
      </div>

      {/* 3대 탭 네비게이션 */}
      <div className="grid grid-cols-3 gap-1 bg-stone-200/70 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-white text-purple-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{isJapanese ? `組編成表 (${room.groups.length}組)` : `조 편성표 (${room.groups.length}조)`}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'team'
              ? 'bg-white text-purple-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>{isJapanese ? '団体順位' : '단체 순위'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('individual')}
          className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
            activeTab === 'individual'
              ? 'bg-white text-purple-900 shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Crown className="w-3.5 h-3.5 text-indigo-500" />
          <span>{isJapanese ? '個人順位' : '개인 순위'}</span>
        </button>
      </div>

      {/* TAB 1: 조 편성표 & 대기 풀 & 스마트 자동 편성 */}
      {activeTab === 'roster' && (
        <div className="space-y-3 animate-fadeIn">


          {/* 📋 조 편성 결과 보기 탭 & 패널 (터치 시 1조~N조 펼치기/접기) */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden transition">
            <button
              type="button"
              onClick={() => setShowGroupResults((prev) => !prev)}
              className="w-full p-3.5 bg-gradient-to-r from-stone-50 via-purple-50/30 to-stone-50 hover:bg-purple-50/60 transition flex items-center justify-between cursor-pointer border-none text-left"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
                  📋
                </span>
                <div>
                  <div className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <span>{isJapanese ? '組編成結果を見る' : '조 편성 결과 보기'}</span>
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-200">
                      {isJapanese
                        ? `計 ${room.groups.length}組 (${groupPlayersCount}人編成済)`
                        : `총 ${room.groups.length}개 조 (${groupPlayersCount}명 편성됨)`}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                    {showGroupResults
                      ? (isJapanese ? 'タップして組編成詳細一覧を閉じる ▲' : '터치하여 조 편성 상세 목록 접기 ▲')
                      : (isJapanese
                          ? `タップして1組〜${room.groups.length}組の編成詳細結果とスタートコースを確認 ▼`
                          : `터치하여 1조 ~ ${room.groups.length}조 편성 상세 결과 및 출발 코스 확인 ▼`)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-black px-2.5 py-1 rounded-lg border transition ${showGroupResults ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-purple-700 border-purple-200'}`}>
                  {showGroupResults ? (isJapanese ? '一覧を閉じる ▲' : '목록 접기 ▲') : (isJapanese ? '結果を見る ▼' : '결과 보기 ▼')}
                </span>
              </div>
            </button>

            {/* 조 목록 렌더링 (showGroupResults가 true일 때 펼쳐짐) */}
            {showGroupResults && (
              <div className="p-3 border-t border-stone-200 bg-stone-50/40 space-y-3 animate-fadeIn">
                {room.groups.length === 0 ? (
                  <div className="text-center py-6 text-stone-400 text-xs font-bold">
                    {isJapanese
                      ? 'まだ編成された組がありません。上の[🎲 スマート組編成ルール設定＆自動振り分け実行]ボタンを押して組を配属してください。'
                      : '아직 편성된 조가 없습니다. 위의 [🎲 스마트 조 편성 룰 설정 & 자동 분배 실행] 버튼을 눌러 조를 배정해 주세요.'}
                  </div>
                ) : (
                  room.groups.map((group) => {
                    const hasScores = (group.totalScore || 0) > 0;

                    return (
                      <div
                        key={group.groupNumber}
                        className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3 hover:border-purple-300 transition"
                      >
                        {/* 조 헤더 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-700 text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-xs">
                              {group.name}
                            </span>
                            <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1 shadow-2xs">
                              <span>🚩</span>
                              <span>
                                {ClubStorage.getGroupStartHole(group.groupNumber - 1, room.selectedCourseLetters, group.startCourseLetter)}{' '}
                                {isJapanese ? 'ティーショット出発' : '티샷 출발'}
                              </span>
                            </span>
                            <span className="text-[11px] font-bold text-stone-500">
                              ({isJapanese ? `${group.players.length}人編成` : `${group.players.length}명 편성`})
                            </span>
                          </div>

                          {isManager && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setJoiningGroup(group.groupNumber);
                                  setNewPlayerName(ParkOnStorage.getUserDisplayName(room.clubId));
                                  setJoinAsLeader(group.players.length === 0);
                                  setShowJoinModal(true);
                                }}
                                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 text-[11px] font-black px-2 py-1 rounded-xl flex items-center gap-1 transition active:scale-95 cursor-pointer"
                              >
                                <UserPlus className="w-3 h-3" />
                                <span>{isJapanese ? 'この組に参加' : '이 조 참가'}</span>
                              </button>

                              {group.players.length === 0 && room.groups.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEmptyGroup(group.groupNumber)}
                                  className="text-stone-400 hover:text-red-600 text-[10px] font-bold px-1.5 py-1 rounded-lg border border-stone-200 cursor-pointer"
                                  title={isJapanese ? '空き組削除' : '빈 조 삭제'}
                                >
                                  {isJapanese ? '組削除' : '조 삭제'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 조원 슬롯 리스트 (동적 유연 렌더링) */}
                        <div className="grid grid-cols-2 gap-2">
                          {group.players.map((player, pIdx) => (
                            <div
                              key={player.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-1 text-xs font-black ${
                                player.isLeader
                                  ? 'bg-amber-50/70 border-amber-300 text-stone-900'
                                  : 'bg-stone-50 border-stone-200 text-stone-800'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {player.isLeader ? (
                                  <span title={isJapanese ? 'リーダー (スコア入力権限)' : '조장 (스코어 입력 권한)'}>
                                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                                  </span>
                                ) : (
                                  <span className="w-4 text-stone-400 text-center font-bold text-[11px]">
                                    {pIdx + 1}
                                  </span>
                                )}
                                <div className="min-w-0">
                                  <div className="truncate font-black">{player.name}</div>
                                  <div className="text-[9px] text-stone-500 font-bold flex items-center gap-1 flex-wrap mt-0.5">
                                    <span>
                                      {player.gender === 'F' ? (isJapanese ? '女' : '여') : (isJapanese ? '男' : '남')} ·{' '}
                                      {player.handicapTier === 'ADVANCED'
                                        ? (isJapanese ? '上級' : '상급')
                                        : player.handicapTier === 'BEGINNER'
                                        ? (isJapanese ? '初級' : '초급')
                                        : (isJapanese ? '中級' : '중급')}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePayment(player.id, player.name);
                                      }}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-black transition active:scale-95 cursor-pointer flex items-center gap-0.5 ${
                                        player.paymentStatus === 'PAID'
                                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                                          : 'bg-stone-200 hover:bg-amber-100 text-stone-600 hover:text-amber-900 border border-stone-300/60'
                                      }`}
                                      title={isJapanese ? 'クリックで入金状態を変更' : '클릭 시 입금 완료 ↔ 미납 토글'}
                                    >
                                      {player.paymentStatus === 'PAID' ? (isJapanese ? '✓入金' : '✓입금') : (isJapanese ? '未納' : '미납')}
                                    </button>
                                  </div>
                                </div>
                              </div>

                                {/* 👑 총무 전용 조 관리 버튼 (노쇼 대체, 이동, 조장 위임, 제외) */}
                                {isManager && (
                                  <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                                    {/* ⚡ 노쇼 긴급 대체 버튼 */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleQuickReplaceMissingPlayer(
                                          group.groupNumber,
                                          player.id,
                                          player.name
                                        )
                                      }
                                      title={isJapanese ? '欠員(ノーショー)発生時に待機1位を即時自動投入' : '결원(노쇼) 발생 시 대기 1순위 즉시 대체 투입'}
                                      className="text-[10px] text-amber-900 hover:text-white bg-amber-200 hover:bg-amber-600 border border-amber-300 px-1.5 py-0.5 rounded font-bold cursor-pointer transition active:scale-95 flex items-center gap-0.5 shadow-2xs"
                                    >
                                      <span>{isJapanese ? '⚡ノーショー' : '⚡노쇼'}</span>
                                    </button>

                                    {/* 다른 조로 이동 버튼 */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setMovingPlayer({
                                          fromGroup: group.groupNumber,
                                          playerId: player.id,
                                          playerName: player.name,
                                        })
                                      }
                                      title={isJapanese ? '別の組へ移動' : '다른 조로 이동'}
                                      className="text-[10px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-bold cursor-pointer flex items-center gap-0.5"
                                    >
                                      <ArrowRightLeft className="w-2.5 h-2.5" />
                                      <span>{isJapanese ? '移動' : '이동'}</span>
                                    </button>

                                    {/* 조장 위임 버튼 */}
                                    {!player.isLeader && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleMakeLeader(group.groupNumber, player.id, player.name)
                                        }
                                        title={isJapanese ? 'リーダー委任' : '조장 위임'}
                                        className="text-[10px] text-amber-700 hover:text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded font-bold cursor-pointer"
                                      >
                                        {isJapanese ? 'リーダー' : '조장'}
                                      </button>
                                    )}

                                    {/* 제외 버튼 */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleLeaveGroup(group.groupNumber, player.id, player.name)
                                      }
                                      title={isJapanese ? '組から除外' : '조에서 제외'}
                                      className="text-stone-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                                    >
                                      <LogOut className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                            </div>
                          ))}

                          {/* 빈자리 추가 슬롯 (총무 전용) */}
                          {isManager && group.players.length < 4 && (
                            <button
                              type="button"
                              onClick={() => {
                                setJoiningGroup(group.groupNumber);
                                setNewPlayerName('');
                                setJoinAsLeader(group.players.length === 0);
                                setShowJoinModal(true);
                              }}
                              className="p-2.5 rounded-xl border border-dashed border-stone-300 hover:border-purple-400 bg-stone-50/50 hover:bg-purple-50/50 flex items-center justify-center gap-1 text-stone-400 hover:text-purple-700 text-xs font-black transition cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{isJapanese ? '+ 空き枠に参加' : '+ 빈자리 참가'}</span>
                            </button>
                          )}
                        </div>

                        {/* 조 현재 성적 요약 프리뷰 */}
                        {hasScores && (
                          <div className="bg-stone-50 p-2 rounded-xl flex items-center justify-between text-xs font-black text-stone-700 border border-stone-200/60">
                            <span>{isJapanese ? '組平均打数' : '조 평균 타수'}</span>
                            <span className="text-purple-800">
                              {group.avgScore}{isJapanese ? '打' : '타'} ({isJapanese ? '合計 ' : '합계 '}{group.totalScore}{isJapanese ? '打' : '타'})
                            </span>
                          </div>
                        )}

                        {/* 조장 전용 라운드 시작/이어하기 버튼 */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleStartGroupRound(group)}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white rounded-xl font-black text-xs shadow-xs transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>
                              {hasScores
                                ? (isJapanese ? `⛳ [${group.name}] スコアボード記録を続ける ▶` : `⛳ [${group.name}] 스코어보드 계속 기록하기 ▶`)
                                : (isJapanese ? `⛳ [${group.name}] 18ホールラウンド開始 (スコア記録)` : `⛳ [${group.name}] 18홀 라운드 시작 (스코어 기록)`)}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* 신규 조 수동 추가 버튼 */}
                <button
                  type="button"
                  onClick={handleAddEmptyGroup}
                  className="w-full py-2.5 bg-stone-50 hover:bg-stone-100 border border-dashed border-stone-300 rounded-2xl text-xs font-black text-stone-600 flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-stone-400" />
                  <span>{isJapanese ? `新しい組を追加 (+ ${room.groups.length + 1}組)` : `새로운 조 추가하기 (+ ${room.groups.length + 1}조)`}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 실시간 단체전 랭킹 */}
      {activeTab === 'team' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-950 font-bold flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>{isJapanese ? 'リアルタイム団体戦ランキング (組平均打数基準)' : '실시간 단체전 랭킹 (조별 평균 타수 기준)'}</span>
            </div>
            <span className="text-[11px] text-amber-800 font-extrabold">{isJapanese ? '少打数順' : '낮은 타수 순'}</span>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-stone-100">
              {teams.map((t) => {
                const medal =
                  t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : t.rank === 3 ? '🥉' : `${t.rank}${isJapanese ? '位' : '위'}`;
                const isLeaderGroup = t.rank === 1;

                return (
                  <div
                    key={t.groupNumber}
                    className={`p-3.5 flex items-center justify-between gap-2 transition ${
                      isLeaderGroup ? 'bg-amber-50/40' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 text-center font-black text-base">{medal}</div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm text-stone-900">{t.groupName}</span>
                          <span className="text-[11px] text-stone-500 font-bold">
                            ({isJapanese ? 'リーダー' : '조장'}: {t.leaderName})
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 font-bold flex items-center gap-2 mt-0.5">
                          <span>{isJapanese ? '参加' : '참가'} {t.playersCount}{isJapanese ? '人' : '명'}</span>
                          <span>•</span>
                          <span>{t.holesCompleted > 0 ? (isJapanese ? `${t.holesCompleted}ホール完了` : `${t.holesCompleted}홀 완료`) : (isJapanese ? 'プレー前' : '경기 전')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-emerald-800">
                        {t.avgStrokes > 0 ? `${isJapanese ? '平均' : '평균'} ${t.avgStrokes}${isJapanese ? '打' : '타'}` : '-'}
                      </div>
                      <div className="text-[10px] text-stone-500 font-extrabold">
                        {isJapanese ? '計' : '총'} {t.totalStrokes}{isJapanese ? '打' : '타'} ({t.parDiff <= 0 ? t.parDiff : `+${t.parDiff}`})
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 개인전 전체 순위 */}
      {activeTab === 'individual' && (
        <div className="space-y-3 animate-fadeIn">
          {/* 모드별 상단 헤더 배너 */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-xs text-indigo-950 font-bold flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-indigo-600" />
              <span>{isJapanese ? `全参加者個人ランキング (計 ${individuals.length}人)` : `전체 참가자 개인 랭킹 (총 ${individuals.length}명)`}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowRulesModal(true)}
              className="text-[11px] text-indigo-800 font-extrabold flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <span>{ClubStorage.getGameModeInfo(room.gameMode).badge}</span>
              <span className="text-[10px] text-stone-500 font-semibold">{isJapanese ? '(ルール案内)' : '(룰 안내)'}</span>
            </button>
          </div>

          {/* 🌟 [3단계] 실시간 홀인원(Hole-in-One) 골든 축하 긴급 알림 배너 */}
          {holeInOneToast && (
            <div className="p-3.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-stone-950 rounded-2xl shadow-lg border-2 border-yellow-200 animate-bounce flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl animate-spin">🌟</span>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-900">HOLE-IN-ONE ALERT!</div>
                  <div className="text-xs font-black">
                    🎉 축하합니다! [제 {holeInOneToast.groupNumber}조 {holeInOneToast.playerName} 님] {holeInOneToast.holeNumber}번 홀 홀인원(1타) 달성!! 🏆
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHoleInOneToast(null)}
                className="text-xs font-black p-1 hover:bg-amber-400/50 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* 🔀 [3단계] 실시간 순위표 듀얼 탭 전환 (그로스 vs 신페리오) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setLeaderboardViewMode('GROSS')}
              className={`py-2 text-xs font-black rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                leaderboardViewMode === 'GROSS'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>🏌️ {isJapanese ? 'グロス (実打数) 順位' : '그로스 (실타수) 순위'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!room.isUnsealed) {
                  alert(isJapanese ? '新ペリア順位は大会終了および隠しホール公開後に閲覧可能です。' : '신페리오 순위는 대회 마감 및 숨은 홀 자물쇠 해제 후에 공개됩니다.');
                  return;
                }
                setLeaderboardViewMode('NEW_PERIO');
              }}
              className={`py-2 text-xs font-black rounded-lg transition flex items-center justify-center gap-1 cursor-pointer ${
                leaderboardViewMode === 'NEW_PERIO'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>🎯 {isJapanese ? '新ペリア (ネット) 順位' : '신페리오 (네트) 순위'} {!room.isUnsealed && '🔒'}</span>
            </button>
          </div>

          {/* 🛡️ 직전 우승자 시상 유예(독식 방지) 안내 배너 */}
          {graceInfo && (
            <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-purple-100 rounded-2xl p-3.5 shadow-xs space-y-2 border border-purple-400/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-xs text-purple-200">
                  <ShieldCheck className="w-4 h-4 text-purple-300" />
                  <span>{isJapanese ? '優勝者独占防止規定適用中' : '우승자 독식 방지 규정 적용 중'}</span>
                </div>
                <span className="text-[10px] bg-purple-800 text-purple-200 px-2 py-0.5 rounded-full font-black border border-purple-400/30">
                  {graceInfo.gracePeriod} {isJapanese ? '優勝者' : '우승자'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed font-medium text-purple-200">
                {graceInfo.reason}
              </p>
              <div className="flex items-center justify-between text-[11px] font-black pt-1.5 border-t border-purple-700/60 bg-purple-900/50 p-2 rounded-xl">
                <span className="text-purple-200">{isJapanese ? '🏅 名誉メダリスト:' : '🏅 명예 메달리스트:'} <strong className="text-white">{graceInfo.originalWinner.playerName}</strong></span>
                <span className="text-amber-300">{isJapanese ? '🎁 1位賞品受領:' : '🎁 1위 시상품 수령:'} <strong className="text-amber-200 underline">{graceInfo.transferredWinner.playerName}</strong></span>
              </div>
            </div>
          )}

          {/* 🔒 신페리오 암호 봉인 / 전격 공개 상태 배너 */}
          {room.gameMode === 'NEW_PERIO' && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-black shadow-xs space-y-2 ${
                room.isUnsealed
                  ? 'bg-gradient-to-r from-amber-50 via-yellow-50 to-emerald-50 border-amber-300 text-stone-900'
                  : 'bg-gradient-to-r from-purple-950 via-stone-900 to-indigo-950 text-white border-purple-500/50'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{room.isUnsealed ? '🔓' : '🔒'}</span>
                  <div>
                    <div className="font-black text-sm flex items-center gap-1.5">
                      <span>
                        {room.isUnsealed
                          ? (isJapanese ? '新ペリア隠しホール電撃公開完了！' : '신페리오 숨은 홀 전격 공개 완료!')
                          : (isJapanese ? '新ペリア隠しホール暗号封印中' : '신페리오 12개 숨은 홀 비밀 암호 봉인 중')}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        room.isUnsealed ? 'bg-amber-200 text-amber-950' : 'bg-purple-800 text-purple-200'
                      }`}>
                        {room.isUnsealed ? '전광판 투명 산출' : '사후 변조 방지'}
                      </span>
                    </div>
                    <div className={`text-[11px] font-mono mt-0.5 ${room.isUnsealed ? 'text-amber-900 font-black' : 'text-purple-300'}`}>
                      {room.isUnsealed
                        ? `공개된 숨은 홀: 【 ${room.unsealedHoles?.join('번, ')}번 홀 】`
                        : `사전 SHA-256 지문: ${room.hiddenHolesHash ? room.hiddenHolesHash.slice(0, 24) + '...' : '봉인 생성 완료'}`}
                    </div>
                  </div>
                </div>

                {!room.isUnsealed && (
                  <button
                    type="button"
                    onClick={handleUnsealHiddenHoles}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1 border border-amber-300"
                  >
                    <span>🔓 {isJapanese ? 'ホール公開' : '숨은 홀 전격 공개'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 신페리오인 경우 1위 우승자 & 메달리스트 특별 시상 카드 */}
          {room.gameMode === 'NEW_PERIO' && room.isUnsealed && individuals.length > 0 && (() => {
            const champion = individuals[0];
            const sortedByGross = [...individuals].sort((a, b) => a.totalStrokes - b.totalStrokes);
            const medalist = sortedByGross[0];

            return (
              <div className="grid grid-cols-2 gap-2">
                {/* 1위 우승 (네트 1위) */}
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-3 rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-black text-amber-100">
                    <span>{isJapanese ? '🥇 新ペリア優勝' : '🥇 신페리오 우승'}</span>
                    <span className="bg-white/20 px-1.5 py-0.2 rounded-full">{isJapanese ? 'ネット1位' : '네트 1위'}</span>
                  </div>
                  <div className="font-black text-sm truncate">{champion.playerName} ({champion.groupNumber}{isJapanese ? '組' : '조'})</div>
                  <div className="text-[11px] font-extrabold text-amber-100">
                    {isJapanese ? 'ネット' : '네트'} {champion.netScore}{isJapanese ? '打' : '타'} <span className="text-[9px] text-amber-200">({isJapanese ? 'グロス' : '실타수'} {champion.totalStrokes} / {isJapanese ? 'ハンディ' : '핸디'} {champion.handicap})</span>
                  </div>
                </div>

                {/* 메달리스트 (실타수 1위) */}
                <div className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-3 rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-black text-purple-200">
                    <span>{isJapanese ? '🏅 メダリスト' : '🏅 메달리스트'}</span>
                    <span className="bg-white/20 px-1.5 py-0.2 rounded-full">{isJapanese ? '最少グロス' : '최저 실타수'}</span>
                  </div>
                  <div className="font-black text-sm truncate">{medalist.playerName} ({medalist.groupNumber}{isJapanese ? '組' : '조'})</div>
                  <div className="text-[11px] font-extrabold text-purple-200">
                    {isJapanese ? '計' : '총'} {medalist.totalStrokes}{isJapanese ? '打' : '타'} <span className="text-[9px] text-purple-300">({medalist.parDiff <= 0 ? medalist.parDiff : `+${medalist.parDiff}`})</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* [대표님 지시] 200인 이상 대규모 대회 리더보드 검색 및 내 순위 원터치 점프 바 */}
          {(() => {
            const selfName = (ParkOnStorage.getUserDisplayName(room.clubId) || '').trim();
            const myIndividual = displayIndividuals.find(
              (p) =>
                (selfName && p.playerName.includes(selfName)) ||
                (selfName.length >= 2 && p.playerName.includes(selfName.slice(0, 2)))
            );

            const filteredIndividuals = displayIndividuals.filter((p) => {
              if (leaderboardFilter === 'TOP10' && p.rank > 10) return false;
              if (leaderboardFilter === 'MY_GROUP') {
                if (!myIndividual) return true;
                if (p.groupNumber !== myIndividual.groupNumber) return false;
              }
              if (leaderboardSearch.trim()) {
                const q = leaderboardSearch.toLowerCase().trim();
                const matchName = p.playerName.toLowerCase().includes(q);
                const matchGroup = `${p.groupNumber}조`.includes(q) || `${p.groupNumber}組`.includes(q) || `${p.groupNumber}` === q;
                return matchName || matchGroup;
              }
              return true;
            });

            return (
              <div className="space-y-2.5">
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={isJapanese ? '選手名または組を検索 (例: 山田, 3組)...' : '선수 이름 또는 조 검색 (예: 김철수, 3조)...'}
                      value={leaderboardSearch}
                      onChange={(e) => setLeaderboardSearch(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-2xs"
                    />
                    {leaderboardSearch && (
                      <button
                        type="button"
                        onClick={() => setLeaderboardSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {myIndividual && (
                    <button
                      type="button"
                      onClick={() => {
                        setLeaderboardFilter('ALL');
                        setLeaderboardSearch('');
                        setHighlightedPlayerId(myIndividual.playerId);
                        setTimeout(() => {
                          const el = document.getElementById(`player-row-${myIndividual.playerId}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 100);
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer border border-purple-500 whitespace-nowrap"
                      title={isJapanese ? 'マイ順位へ画面を即時移動' : '내 순위로 화면 즉시 이동'}
                    >
                      <span>🎯 {isJapanese ? 'マイ順位' : '내 순위'}: {myIndividual.rank}{isJapanese ? '位' : '위'}</span>
                    </button>
                  )}
                </div>

                {/* 3단 퀵 필터 탭 */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setLeaderboardFilter('ALL')}
                    className={`py-1.5 text-xs font-black rounded-lg transition cursor-pointer text-center ${
                      leaderboardFilter === 'ALL'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {isJapanese ? `全体 (${individuals.length}人)` : `전체 (${individuals.length}명)`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaderboardFilter('TOP10')}
                    className={`py-1.5 text-xs font-black rounded-lg transition cursor-pointer text-center ${
                      leaderboardFilter === 'TOP10'
                        ? 'bg-amber-500 text-stone-950 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    🏅 TOP 10
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaderboardFilter('MY_GROUP')}
                    className={`py-1.5 text-xs font-black rounded-lg transition cursor-pointer text-center ${
                      leaderboardFilter === 'MY_GROUP'
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    👥 {isJapanese ? '自組のみ' : '내 조 보기'}
                  </button>
                </div>

                {/* 순위 테이블 헤더 */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                  <div className="bg-stone-100/80 px-3 py-2 text-[11px] font-black text-stone-600 flex items-center justify-between border-b border-stone-200">
                    <span className="w-8 text-center">{isJapanese ? '順位' : '순위'}</span>
                    <span className="flex-1 pl-2">{isJapanese ? '選手名 / 所属組' : '선수명 / 소속조'}</span>
                    <span className="text-right">
                      {room.gameMode === 'NEW_PERIO' ? (isJapanese ? 'ネット打数 / ハンディ' : '네트점수 / 핸디') : (isJapanese ? '総打数 / 基準打比' : '총 타수 / 기준타 대비')}
                    </span>
                  </div>

                  <div className="divide-y divide-stone-100">
                    {filteredIndividuals.length === 0 ? (
                      <div className="p-8 text-center text-xs text-stone-500 font-bold">
                        {isJapanese ? '検索条件に一致する選手がいません。' : '검색 조건에 일치하는 선수가 없습니다.'}
                      </div>
                    ) : (
                      filteredIndividuals.map((p) => {
                        const medal =
                          p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `${p.rank}${isJapanese ? '位' : '위'}`;
                        const diffStr =
                          p.parDiff < 0 ? `${p.parDiff}` : p.parDiff > 0 ? `+${p.parDiff}` : 'E';
                        const isHighlighted = highlightedPlayerId === p.playerId;

                        return (
                          <div
                            key={p.playerId}
                            id={`player-row-${p.playerId}`}
                            className={`p-3 flex items-center justify-between gap-2 transition duration-300 ${
                              isHighlighted
                                ? 'bg-purple-50 ring-2 ring-purple-500 ring-inset'
                                : 'hover:bg-stone-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 text-center font-black text-xs text-stone-700">
                                {medal}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-black text-xs text-stone-900">{p.playerName}</span>
                                  {p.isLeader && (
                                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-black">
                                      {isJapanese ? 'リーダー' : '조장'}
                                    </span>
                                  )}
                                  <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-md font-extrabold">
                                    {p.groupNumber}{isJapanese ? '組' : '조'}
                                  </span>
                                </div>
                                <div className="text-[10px] text-stone-400 font-bold mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  <span>{p.holesCompleted > 0 ? (isJapanese ? `${p.holesCompleted}ホール進行` : `${p.holesCompleted}홀 진행`) : (isJapanese ? 'スタート前' : '시작 전')}</span>
                                  {p.tieBreakerReason && (
                                    <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-black text-[9px] shadow-2xs">
                                      🎯 {p.tieBreakerReason}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              {room.gameMode === 'NEW_PERIO' && typeof p.netScore === 'number' ? (
                                <>
                                  <div className="text-sm font-black text-indigo-900">
                                    {isJapanese ? 'ネット' : '네트'} {p.netScore}{isJapanese ? '打' : '타'}
                                  </div>
                                  <div className="text-[10px] font-bold text-stone-500">
                                    {isJapanese ? 'グロス' : '실타수'} {p.totalStrokes}{isJapanese ? '打' : '타'} ({isJapanese ? 'ハンディ' : '핸디'} -{p.handicap})
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="text-sm font-black text-stone-900">
                                    {p.totalStrokes > 0 ? `${p.totalStrokes}${isJapanese ? '打' : '타'}` : '-'}
                                  </div>
                                  <div
                                    className={`text-[10px] font-black ${
                                      p.parDiff < 0
                                        ? 'text-red-600'
                                        : p.parDiff > 0
                                        ? 'text-blue-600'
                                        : 'text-stone-500'
                                    }`}
                                  >
                                    {p.totalStrokes > 0 ? diffStr : ''}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 🎖️ 이색 특별상 수상 현황 카드 */}
          {specialAwards.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-xs text-stone-900">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>{isJapanese ? 'ユニーク特別賞 受賞現況' : '이색 특별상 수상 현황'}</span>
                </div>
                <span className="text-[10px] text-stone-500 font-bold">{isJapanese ? '18ホール電算自動集計' : '18홀 전산 자동 집계'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {specialAwards.map((sa) => (
                  <div
                    key={sa.type}
                    className="bg-stone-50 hover:bg-emerald-50/50 p-2.5 rounded-xl border border-stone-200/80 transition space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-black text-stone-800">
                      <span className="flex items-center gap-1">
                        <span>{sa.badge}</span>
                        <span>{sa.title}</span>
                      </span>
                    </div>
                    <div className="text-xs font-black text-emerald-800 flex items-center justify-between">
                      <span className="truncate">{sa.winnerName} {sa.groupNumber ? `(${sa.groupNumber}${isJapanese ? '組' : '조'})` : ''}</span>
                    </div>
                    <div className="text-[10px] text-stone-500 font-medium leading-tight">
                      {sa.valueInfo || sa.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🎰 현장 실시간 행운상 당첨자 섹션 */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 rounded-2xl border border-amber-300/80 shadow-xs p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-xs text-amber-950">
                <Gift className="w-4 h-4 text-amber-600" />
                <span>{isJapanese ? '🎰 現場リアルタイムラッキー賞抽選' : '🎰 현장 실시간 행운상 추첨'}</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full font-extrabold">
                  {isJapanese ? `${(room.awardConfig?.luckyDrawWinners || []).length}人当選` : `${(room.awardConfig?.luckyDrawWinners || []).length}명 당첨`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLuckyDrawModal(true)}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-amber-950 text-xs font-black px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isJapanese ? '+ ルーレット抽選する 🎲' : '+ 룰렛 추첨하기 🎲'}</span>
              </button>
            </div>

            {room.awardConfig?.luckyDrawWinners && room.awardConfig.luckyDrawWinners.length > 0 ? (
              <div className="divide-y divide-amber-200/60 bg-white/80 rounded-xl border border-amber-200/60 overflow-hidden">
                {room.awardConfig.luckyDrawWinners.map((lw, idx) => (
                  <div
                    key={lw.id}
                    className="p-2.5 flex items-center justify-between text-xs font-bold text-stone-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-black shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-black text-stone-900">{lw.name}</span>
                        {lw.groupNumber && (
                          <span className="text-[10px] text-stone-500 font-bold ml-1">
                            ({lw.groupNumber}{isJapanese ? '組' : '조'})
                          </span>
                        )}
                        <span className="text-[11px] text-amber-800 font-medium ml-2">
                          🎁 {lw.prizeName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-stone-400 font-medium">{lw.drawnAt}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLuckyWinner(lw.id, lw.name)}
                        className="text-stone-300 hover:text-red-500 p-1 cursor-pointer transition"
                        title={isJapanese ? '当選取消' : '당첨 취소'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/60 p-3 rounded-xl border border-amber-100 text-center space-y-1">
                <p className="text-xs font-black text-stone-600">{isJapanese ? 'まだ抽選されたラッキー賞はありません。' : '아직 추첨된 행운상이 없습니다.'}</p>
                <p className="text-[10px] text-stone-500">
                  {isJapanese ? (
                    <>表彰式で<strong>[+ ルーレット抽選する]</strong>を押すとルーレットが回転しサプライズ当選者が選ばれます！</>
                  ) : (
                    <>시상식에서 <strong>[+ 룰렛 추첨하기]</strong>를 누르면 룰렛이 돌며 깜짝 당첨자가 선정됩니다!</>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 스마트 자동 조 편성 모달 (전면 개편: 1단계 전제조건+추첨방식 분리 / 2단계 가편성 Swap & 원터치 경기 시작) */}
      {showAutoGroupModal && (
        <div data-testid="smart-group-modal" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* 상단 모달 헤더 */}
            <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-stone-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dices className="w-5 h-5 text-yellow-300" />
                <div>
                  <h3 className="font-black text-base leading-tight">
                    {modalStep === 'CONFIG'
                      ? (isJapanese ? '🎲 スマート組編成ルール設定' : '🎲 스마트 조 편성 룰 설정')
                      : (isJapanese ? '👀 組編成結果確認＆入替 (Swap)' : '👀 가편성 결과 확인 & 맞바꾸기 (Swap)')}
                  </h3>
                  <p className="text-[10px] text-purple-200 font-bold">
                    {modalStep === 'CONFIG'
                      ? (isJapanese ? `計 ${totalAllPlayers}人参加 · ${customGroupCount}組編成予定` : `총 ${totalAllPlayers}명 참가 · ${customGroupCount}개 조 편성 예정`)
                      : (isJapanese ? `全 ${room?.groups.length}組仮編成完了 · タップして入替可能` : `총 ${room?.groups.length}개 조 가편성 완료 · 선수 터치로 맞교환 가능`)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAutoGroupModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* [모달 1단계: 조건 설정 화면] */}
            {modalStep === 'CONFIG' && (
              <div data-testid="modal-step-config" className="p-4 space-y-4 overflow-y-auto">
                {/* 조 수 조정 바 */}
                <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-purple-950">
                      {isJapanese ? '編成する組数' : '편성할 조 수'}
                    </span>
                    <span className="text-[11px] text-purple-700 ml-1.5 font-bold">
                      ({totalAllPlayers}{isJapanese ? '人基準' : '명 기준'})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCustomGroupCount(Math.max(1, customGroupCount - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-purple-300 font-black text-purple-900 hover:bg-purple-100 flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      -
                    </button>
                    <span className="font-black text-purple-950 px-2 text-sm">{customGroupCount}{isJapanese ? '組' : '개 조'}</span>
                    <button
                      type="button"
                      onClick={() => setCustomGroupCount(customGroupCount + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-purple-300 font-black text-purple-900 hover:bg-purple-100 flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* [섹션 A] 필수 전제 조건 (체크박스 다중 선택 가능) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-1">
                    <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                      <span>{isJapanese ? '【セクションA】必須前提条件 (複数選択可)' : '[섹션 A] 필수 전제 조건 (체크박스 다중 선택)'}</span>
                    </span>
                    <span className="text-[10px] text-purple-700 font-extrabold">{isJapanese ? '事前固定・安配' : '사전 고정·안배'}</span>
                  </div>

                  {/* 전제 1: 각 조 조장 우선 고정 배치 */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={condFixLeaders}
                        onChange={(e) => setCondFixLeaders(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-black text-stone-900 flex items-center gap-1">
                          <span>👑 {isJapanese ? '各組リーダーの事前固定配置 (スマホ入力担当)' : '각 조 조장 우선 고정 배치 (스마트폰 입력자)'}</span>
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.2 rounded border border-amber-300">
                            {selectedLeaderIds.length}/{customGroupCount}{isJapanese ? '人' : '명'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                          {isJapanese
                            ? `指定された${customGroupCount}人のリーダーを各組の1番スロットに優先固定します。`
                            : `지정된 조장 ${customGroupCount}명을 1조~${customGroupCount}조의 1번 슬롯(조장)으로 자동 고정합니다.`}
                        </p>
                      </div>
                    </label>

                    {/* 조장 칩 인라인 펼침 */}
                    {condFixLeaders && (
                      <div className="bg-white p-2.5 rounded-xl border border-amber-200 space-y-2 animate-fadeIn">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-amber-950">
                            {isJapanese ? '名簿をタップしてリーダー指定:' : '명단을 터치하여 조장 지정:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const sorted = [...allCurrentPlayers].sort((a, b) => {
                                const ta = a.handicapTier === 'ADVANCED' ? 2 : a.handicapTier === 'INTERMEDIATE' ? 1 : 0;
                                const tb = b.handicapTier === 'ADVANCED' ? 2 : b.handicapTier === 'INTERMEDIATE' ? 1 : 0;
                                return tb - ta;
                              });
                              setSelectedLeaderIds(sorted.slice(0, customGroupCount).map((p) => p.id));
                            }}
                            className="text-[10px] font-black bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded cursor-pointer"
                          >
                            💡 {isJapanese ? '上級者おすすめ' : '상급자 우선 추천'}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap max-h-36 overflow-y-auto">
                          {allCurrentPlayers.map((p) => {
                            const isL = selectedLeaderIds.includes(p.id);
                            const lIdx = selectedLeaderIds.indexOf(p.id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  if (isL) {
                                    setSelectedLeaderIds(selectedLeaderIds.filter((id) => id !== p.id));
                                  } else {
                                    if (selectedLeaderIds.length >= customGroupCount) {
                                      setSelectedLeaderIds([...selectedLeaderIds.slice(1), p.id]);
                                    } else {
                                      setSelectedLeaderIds([...selectedLeaderIds, p.id]);
                                    }
                                  }
                                }}
                                className={`text-xs font-bold px-2 py-1 rounded-lg border flex items-center gap-1 transition cursor-pointer active:scale-95 ${
                                  isL
                                    ? 'bg-amber-500 text-stone-950 border-amber-600 font-black shadow-xs ring-1 ring-amber-400'
                                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                                }`}
                              >
                                {isL && <span>👑</span>}
                                <span>{p.name}</span>
                                {isL && (
                                  <span className="text-[10px] bg-black/20 text-white rounded px-1 font-black">
                                    {lIdx + 1}{isJapanese ? '組' : '조'}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 전제 2: 🔗 [반드시 함께 묶을 동반 그룹] (다중 그룹 지원) */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={condTogether}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setCondTogether(val);
                            if (val && togetherGroups.length === 0) {
                              setTogetherGroups([{ id: `tog_${Date.now()}`, playerIds: [] }]);
                            }
                          }}
                          className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-black text-stone-900 flex items-center gap-1.5 flex-wrap">
                            <span>🔗 {isJapanese ? '必ず同じ組にする同伴グループ (複数チーム対応)' : '반드시 함께 묶을 동반 그룹 (부부/카풀 등 다중 지원)'}</span>
                            {togetherGroups.filter((t) => t.playerIds.length >= 2).length > 0 && (
                              <span className="bg-blue-100 text-blue-900 text-[10px] font-black px-1.5 py-0.2 rounded border border-blue-300">
                                {togetherGroups.filter((t) => t.playerIds.length >= 2).length}{isJapanese ? 'チーム設定済' : '개 팀 설정됨'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                            {isJapanese
                              ? '夫婦・友人など、必ず同じ組で回りたいメンバーをチーム単位で事前指定します。'
                              : '부부, 카풀 등 반드시 같은 조에 묶여야 하는 인원들을 복수 팀으로 자유롭게 등록합니다.'}
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* 동반 묶음 다중 팀 리스트 */}
                    {condTogether && (
                      <div className="space-y-2.5 animate-fadeIn">
                        {togetherGroups.map((tg, tIdx) => (
                          <div key={tg.id || tIdx} className="bg-white p-3 rounded-xl border border-blue-200 space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-blue-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                                  #{tIdx + 1}팀
                                </span>
                                <span className="text-[11px] font-bold text-blue-950">
                                  ({tg.playerIds.length}/4{isJapanese ? '人' : '명'})
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-[11px]">
                                  <span className="text-[10px] font-bold text-stone-500">{isJapanese ? '組指定:' : '배정 조:'}</span>
                                  <select
                                    value={tg.targetGroupNumber || 0}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setTogetherGroups(
                                        togetherGroups.map((t, idx) =>
                                          idx === tIdx ? { ...t, targetGroupNumber: val > 0 ? val : undefined } : t
                                        )
                                      );
                                    }}
                                    className="text-[11px] font-black border border-blue-300 rounded px-1.5 py-0.5 bg-blue-50 text-blue-950 cursor-pointer"
                                  >
                                    <option value={0}>{isJapanese ? '自動配分 (おすすめ)' : '자동 배정 (추천)'}</option>
                                    {Array.from({ length: customGroupCount }, (_, idx) => idx + 1).map((g) => (
                                      <option key={g} value={g}>
                                        {g}{isJapanese ? '組' : '조'}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <button
                                  type="button"
                                  data-testid={`btn-remove-together-group-${tIdx}`}
                                  onClick={() => {
                                    setTogetherGroups(togetherGroups.filter((_, idx) => idx !== tIdx));
                                  }}
                                  className="text-stone-400 hover:text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-stone-200 hover:border-red-300 cursor-pointer"
                                  title="팀 삭제"
                                >
                                  ✕ {isJapanese ? '削除' : '삭제'}
                                </button>
                              </div>
                            </div>

                            {/* 선수 칩 선택 리스트 */}
                            <div className="flex items-center gap-1.5 flex-wrap max-h-32 overflow-y-auto pt-1">
                              {allCurrentPlayers.map((p) => {
                                const isSelected = tg.playerIds.includes(p.id);
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setTogetherGroups(
                                          togetherGroups.map((t, idx) =>
                                            idx === tIdx
                                              ? { ...t, playerIds: t.playerIds.filter((id) => id !== p.id) }
                                              : t
                                          )
                                        );
                                      } else {
                                        if (tg.playerIds.length >= 4) {
                                          alert(isJapanese ? '1組あたり最大4人まで指定できます。' : '1개 팀에 최대 4명까지만 묶을 수 있습니다.');
                                          return;
                                        }
                                        setTogetherGroups(
                                          togetherGroups.map((t, idx) =>
                                            idx === tIdx ? { ...t, playerIds: [...t.playerIds, p.id] } : t
                                          )
                                        );
                                      }
                                    }}
                                    className={`text-xs font-bold px-2 py-1 rounded-lg border transition cursor-pointer active:scale-95 ${
                                      isSelected
                                        ? 'bg-blue-600 text-white border-blue-700 font-black shadow-xs ring-1 ring-blue-400'
                                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                                    }`}
                                  >
                                    {isSelected && <span>✓ </span>}
                                    <span>{p.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        {/* [+ 동반 묶음 팀 추가] 버튼 */}
                        <button
                          type="button"
                          data-testid="btn-add-together-group"
                          onClick={() => {
                            if (togetherGroups.length >= customGroupCount) {
                              alert(isJapanese ? `最大${customGroupCount}組まで追加可能です。` : `최대 ${customGroupCount}개 팀까지 추가 가능합니다.`);
                              return;
                            }
                            setTogetherGroups([...togetherGroups, { id: `tog_${Date.now()}`, playerIds: [] }]);
                          }}
                          className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-dashed border-blue-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <span>➕ {isJapanese ? '同伴チーム追加' : '동반 묶음 팀 추가'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 전제 3: 🚫 [반드시 서로 다른 조로 분리할 그룹] (다중 기피 지정) */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={condSeparate}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setCondSeparate(val);
                            if (val && separateGroups.length === 0) {
                              setSeparateGroups([{ id: `sep_${Date.now()}`, playerIds: [] }]);
                            }
                          }}
                          className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-black text-stone-900 flex items-center gap-1.5 flex-wrap">
                            <span>🚫 {isJapanese ? '絶対に別々の組に分離するグループ (不和・ライバル回避)' : '반드시 서로 다른 조로 분리할 그룹 (불화/기피 다중 지정)'}</span>
                            {separateGroups.filter((s) => s.playerIds.length >= 2).length > 0 && (
                              <span className="bg-rose-100 text-rose-900 text-[10px] font-black px-1.5 py-0.2 rounded border border-rose-300">
                                {separateGroups.filter((s) => s.playerIds.length >= 2).length}{isJapanese ? '組分離設定済' : '개 세트 분리 설정됨'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                            {isJapanese
                              ? '不和やライバル関係など、決して同組にしてはいけないメンバーを異なる組へ強制分散します。'
                              : '불화, 라이벌 등 절대로 같은 조에 묶이면 안 되는 인원들을 서로 다른 조(1조, 2조, 3조)로 강제 분산합니다.'}
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* 분리 기피 다중 세트 리스트 */}
                    {condSeparate && (
                      <div className="space-y-2.5 animate-fadeIn">
                        {separateGroups.map((sg, sIdx) => (
                          <div key={sg.id || sIdx} className="bg-white p-3 rounded-xl border border-rose-200 space-y-2 shadow-2xs">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-rose-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                                  ⚡ 분리 세트 #{sIdx + 1}
                                </span>
                                <span className="text-[11px] font-bold text-rose-950">
                                  ({sg.playerIds.length}{isJapanese ? '人選択済' : '명 선택됨'})
                                </span>
                              </div>

                              <button
                                type="button"
                                data-testid={`btn-remove-separate-group-${sIdx}`}
                                onClick={() => {
                                  setSeparateGroups(separateGroups.filter((_, idx) => idx !== sIdx));
                                }}
                                className="text-stone-400 hover:text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-stone-200 hover:border-red-300 cursor-pointer"
                                title="분리 세트 삭제"
                              >
                                ✕ {isJapanese ? '削除' : '삭제'}
                              </button>
                            </div>

                            <p className="text-[10px] text-rose-700 font-bold">
                              {isJapanese
                                ? '※ このグループのメンバーは決して同じ組にならず、別々の組に分散配置されます。'
                                : '※ 아래 선택된 멤버들은 절대로 같은 조에 들어가지 않고 서로 다른 조로 분산 배치됩니다.'}
                            </p>

                            {/* 선수 칩 선택 리스트 */}
                            <div className="flex items-center gap-1.5 flex-wrap max-h-32 overflow-y-auto pt-1">
                              {allCurrentPlayers.map((p) => {
                                const isSelected = sg.playerIds.includes(p.id);
                                return (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        setSeparateGroups(
                                          separateGroups.map((s, idx) =>
                                            idx === sIdx
                                              ? { ...s, playerIds: s.playerIds.filter((id) => id !== p.id) }
                                              : s
                                          )
                                        );
                                      } else {
                                        setSeparateGroups(
                                          separateGroups.map((s, idx) =>
                                            idx === sIdx ? { ...s, playerIds: [...s.playerIds, p.id] } : s
                                          )
                                        );
                                      }
                                    }}
                                    className={`text-xs font-bold px-2 py-1 rounded-lg border transition cursor-pointer active:scale-95 ${
                                      isSelected
                                        ? 'bg-rose-600 text-white border-rose-700 font-black shadow-xs ring-1 ring-rose-400'
                                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                                    }`}
                                  >
                                    {isSelected && <span>⚡ </span>}
                                    <span>{p.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        {/* [+ 절대 분리 대상 추가] 버튼 */}
                        <button
                          type="button"
                          data-testid="btn-add-separate-group"
                          onClick={() => {
                            setSeparateGroups([...separateGroups, { id: `sep_${Date.now()}`, playerIds: [] }]);
                          }}
                          className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-dashed border-rose-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <span>➕ {isJapanese ? '分離対象セット追加' : '절대 분리 대상 추가'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 전제 3: 남녀 성비 균등 배분 */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={condBalanceGender}
                        onChange={(e) => setCondBalanceGender(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                          <span>⚖️ {isJapanese ? '男女比均等安配 (基本チェック)' : '남녀 성비 균등 배분 (기본 체크)'}</span>
                          <span className="bg-purple-100 text-purple-900 text-[10px] font-black px-1.5 py-0.2 rounded">
                            {isJapanese ? 'システム自動計算' : '시스템 자동 안배'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                          {isJapanese
                            ? '会員プロフィールの性別(男/女)データを基に、各組の男女比率を偏りなく自動分散します。'
                            : '회원 프로필의 성별(남/여) 데이터를 바탕으로 각 조 남녀 비율을 시스템이 자동 안배합니다.'}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* 전제 4: 직전 모임 동반자 자동 분리 */}
                  <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={condSeparatePrev}
                        onChange={(e) => setCondSeparatePrev(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                          <span>🔄 {isJapanese ? '直前ラウンド同伴者の自動分離 (基本チェック)' : '직전 모임 동반자 자동 분리 (기본 체크)'}</span>
                          <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-1.5 py-0.2 rounded">
                            {isJapanese ? '新親睦推奨' : '새로운 친목 도모'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                          {isJapanese
                            ? '前回のラウンド履歴を参照し、直前と同じ組だったメンバーを異なる組へ自動分散します。'
                            : '이전 라운드 기록 DB를 조회하여 직전 모임 같은 조였던 인원을 서로 다른 조로 자동 분산합니다.'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* [섹션 B] 최종 분배 방식 (라디오 택 1) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-1">
                    <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" />
                      <span>{isJapanese ? '【セクションB】最終抽選方式 (1つ選択)' : '[섹션 B] 최종 분배 방식 (라디오 택 1)'}</span>
                    </span>
                    <span className="text-[10px] text-indigo-700 font-extrabold">{isJapanese ? '空き枠抽選' : '잔여 슬롯 추첨'}</span>
                  </div>

                  {/* 라디오 1: 완전 랜덤 추첨 */}
                  <label
                    onClick={() => setFinalDrawType('RANDOM')}
                    className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition active:scale-98 ${
                      finalDrawType === 'RANDOM'
                        ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-200 shadow-xs'
                        : 'bg-white hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="finalDrawType"
                      checked={finalDrawType === 'RANDOM'}
                      onChange={() => setFinalDrawType('RANDOM')}
                      className="w-4 h-4 mt-0.5 text-purple-600 accent-purple-600 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                        <span>🎲 {isJapanese ? '前提条件充足後 100%完全ランダム抽選' : '전제 조건 충족 후 100% 완전 랜덤 추첨'}</span>
                        <span className="bg-purple-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded shadow-2xs">
                          {isJapanese ? '基本値 · おすすめ' : '기본값 / 강력 추천'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 font-bold mt-0.5">
                        {isJapanese
                          ? '上記前提条件で埋まった枠以外の空き枠を、作為なく公平に無作為抽選配分します。'
                          : '위 전제 조건으로 채워진 자리를 제외한 빈 슬롯을 무작위 추첨으로 공정하게 배분합니다.'}
                      </p>
                    </div>
                  </label>

                  {/* 라디오 2: 실력 밸런스 분배 */}
                  <label
                    onClick={() => setFinalDrawType('SNAKE_TIER')}
                    className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition active:scale-98 ${
                      finalDrawType === 'SNAKE_TIER'
                        ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-200 shadow-xs'
                        : 'bg-white hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="finalDrawType"
                      checked={finalDrawType === 'SNAKE_TIER'}
                      onChange={() => setFinalDrawType('SNAKE_TIER')}
                      className="w-4 h-4 mt-0.5 text-indigo-600 accent-indigo-600 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                        <span>🏅 {isJapanese ? '実力バランス均等配分 (スネーク方式)' : '실력 밸런스 분배 (스네이크 방식)'}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 font-bold mt-0.5">
                        {isJapanese
                          ? 'ハンディキャップおよび実力等級(上/中/初級)を考慮し、組ごとの実力合計が均等になるよう配分します。'
                          : '핸디캡/실력 등급을 고려하여 조별 실력 합계가 균등해지도록 배분합니다.'}
                      </p>
                    </div>
                  </label>
                </div>

                {/* 1단계 하단 액션 버튼 */}
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAutoGroupModal(false)}
                    className="w-1/3 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-2xl font-black text-xs transition cursor-pointer"
                  >
                    {isJapanese ? 'キャンセル' : '취소'}
                  </button>
                  <button
                    type="button"
                    data-testid="btn-preview-grouping"
                    onClick={handleApplyConditionsAndPreview}
                    className="w-2/3 py-3.5 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-purple-500"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>{isJapanese ? '⚡ 条件を適用して仮編成プレビュー' : '⚡ 조건 적용하여 가편성 미리보기'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* [모달 2단계: 가편성 결과 확인 & 원터치 맞바꾸기(Swap) & 원터치 출발] */}
            {modalStep === 'PREVIEW' && (
              <div data-testid="modal-step-preview" className="p-4 space-y-3.5 overflow-y-auto">
                {/* 인터랙션 안내 배너 */}
                <div className={`p-3 rounded-2xl border text-center transition ${
                  selectedSwapPlayer
                    ? 'bg-amber-100 border-amber-400 text-amber-950 font-black ring-2 ring-amber-300 shadow-xs'
                    : 'bg-purple-50 border-purple-200 text-purple-900 font-bold'
                }`}>
                  <p className="text-xs">
                    {selectedSwapPlayer ? (
                      <span className="flex items-center justify-center flex-wrap gap-1.5">
                        <span>🎯 <strong>[{selectedSwapPlayer.name}]</strong> {isJapanese ? '様選択中！' : '님 선택됨!'}</span>
                        <span>{isJapanese ? '他組の' : '타 조의'} <strong className="bg-emerald-600 text-white px-1.5 py-0.5 rounded text-[11px] font-black">➔ {isJapanese ? '移動' : '이동'}</strong> {isJapanese ? 'ボタンで単独移動するか、他選手をタップして1:1入替できます。' : '버튼으로 단독 이동하거나, 다른 선수를 터치해 1:1 맞바꾸기하세요.'}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedSwapPlayer(null)}
                          className="ml-1 text-[10px] bg-stone-800 hover:bg-black text-white px-2 py-0.5 rounded-md font-bold cursor-pointer"
                        >
                          {isJapanese ? '解除 ✕' : '선택 취소 ✕'}
                        </button>
                      </span>
                    ) : (
                      <span>
                        💡 {isJapanese
                          ? '選手をタップすると、他組ヘの「1人単独組移動(➔移動)」または「1:1入替(Swap)」が可能です！'
                          : '선수를 먼저 터치하세요! 타 조 헤더에 [➔ N조로 이동] 뱃지가 나타나 자유롭게 인원수(Move)를 조정할 수 있습니다.'}
                      </span>
                    )}
                  </p>
                </div>

                {/* 1조, 2조, 3조 가편성 카드 리스트 */}
                <div className="space-y-2.5">
                  {room?.groups.map((grp) => {
                    const isSourceGroup = selectedSwapPlayer?.groupNumber === grp.groupNumber;
                    const canMoveToThisGroup = Boolean(
                      selectedSwapPlayer && !isSourceGroup && grp.players.length < 5
                    );
                    const isGroupFull = grp.players.length >= 5;

                    return (
                      <div
                        key={grp.groupNumber}
                        className={`rounded-2xl p-3 border transition ${
                          isSourceGroup
                            ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-300 shadow-xs'
                            : canMoveToThisGroup
                            ? 'bg-emerald-50/50 border-emerald-400 shadow-sm'
                            : 'bg-stone-50 border-stone-200'
                        } space-y-2`}
                      >
                        <div className="flex items-center justify-between text-xs font-black flex-wrap gap-2">
                          <span className="text-purple-900 font-black flex items-center gap-1.5">
                            <span className="text-sm">🚩</span>
                            <span>{grp.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isGroupFull
                                ? 'bg-red-100 text-red-800 border border-red-300 font-black'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {grp.players.length}{isJapanese ? '人' : '명'}
                              {isGroupFull ? (isJapanese ? ' (満員 5/5)' : ' (정원 마감 5/5)') : ''}
                            </span>
                          </span>

                          {/* 우측 상단/헤더 영역: [ ➔ N조로 이동 ] 청록색/에메랄드 뱃지 형태 */}
                          <div className="flex items-center gap-1.5">
                            {selectedSwapPlayer && !isSourceGroup && (
                              <button
                                type="button"
                                data-testid={`btn-move-to-group-${grp.groupNumber}`}
                                onClick={() => handleMoveSinglePlayerToGroup(grp.groupNumber)}
                                disabled={isGroupFull}
                                className={`font-black text-xs px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1 transition active:scale-95 cursor-pointer border ${
                                  isGroupFull
                                    ? 'bg-stone-200 text-stone-400 border-stone-300 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-teal-500 via-emerald-600 to-teal-600 hover:from-teal-600 hover:to-emerald-700 text-white border-emerald-300 ring-2 ring-emerald-200 animate-pulse'
                                }`}
                              >
                                <span>➔ {grp.groupNumber}{isJapanese ? '組へ移動' : '조로 이동'}</span>
                              </button>
                            )}
                            <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 font-bold">
                              {isJapanese ? `A-${grp.groupNumber}番ホール 出発予定` : `A-${grp.groupNumber}번 홀 출발 예정`}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          {grp.players.map((p) => {
                            const isSelected = selectedSwapPlayer?.id === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                data-testid="player-swap-chip"
                                data-player-id={p.id}
                                data-player-name={p.name}
                                data-group-number={grp.groupNumber}
                                onClick={() => handleSwapPlayersInPreview(p, grp.groupNumber)}
                                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer active:scale-95 ${
                                  isSelected
                                    ? 'bg-amber-100 border-2 border-purple-600 ring-2 ring-amber-400 font-black text-purple-950 shadow-md scale-[1.02]'
                                    : 'bg-white hover:bg-purple-50/60 border-stone-200 text-stone-800'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {p.isLeader ? (
                                    <span className="text-amber-500 shrink-0 font-bold" title="조장">👑</span>
                                  ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />
                                  )}
                                  <span className="font-extrabold text-xs truncate">{p.name}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[9px] text-stone-500 font-bold">
                                    {p.gender === 'F' ? (isJapanese ? '女' : '여') : (isJapanese ? '남' : '남')}·
                                    {p.handicapTier === 'ADVANCED' ? (isJapanese ? '상' : '상') : p.handicapTier === 'BEGINNER' ? (isJapanese ? '초' : '초') : (isJapanese ? '중' : '중')}
                                  </span>
                                  {isSelected && (
                                    <span className="bg-purple-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs">
                                      {isJapanese ? '選択中' : '선택됨'}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}

                          {/* 1인 단독 이동용 인라인 슬롯 (선택된 선수 단독 투입) */}
                          {selectedSwapPlayer && !isSourceGroup && grp.players.length < 5 && (
                            <button
                              type="button"
                              onClick={() => handleMoveSinglePlayerToGroup(grp.groupNumber)}
                              className="p-2.5 rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-950 flex items-center justify-center gap-1.5 text-xs font-black transition cursor-pointer active:scale-95 shadow-xs col-span-2"
                            >
                              <span>➕ [{selectedSwapPlayer.name}] {isJapanese ? '様を' : '님을'} {grp.groupNumber}{isJapanese ? '組へ単独移動' : '조로 단독 이동'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2단계 모달 하단 원스톱 최종 확정 액션 */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    data-testid="btn-finalize-and-start-match"
                    onClick={handleFinalizeAndStartMatchFromModal}
                    className="w-full bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm sm:text-base py-4 rounded-2xl shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-2 border-emerald-300 animate-pulse"
                  >
                    <Play className="w-5 h-5 text-white fill-white" />
                    <span>{isJapanese ? '🚀 組編成最終確定および全組競技開始！' : '🚀 조 편성 최종 확정 & 전 조 경기 시작!'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModalStep('CONFIG')}
                      className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-black text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isJapanese ? '🔄 条件再設定' : '🔄 조건 다시 설정하기'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAutoGroupModal(false)}
                      className="w-full py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl font-black text-xs transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>{isJapanese ? '✕ 閉じる (下書き保持)' : '✕ 닫기 (초안 유지)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 조 간 선수 이동 모달 */}
      {movingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-800 to-purple-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm">
                {isJapanese ? `「${movingPlayer.playerName}」様の組移動` : `'${movingPlayer.playerName}' 님 조 이동`}
              </h3>
              <button
                type="button"
                onClick={() => setMovingPlayer(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-stone-600 font-bold">
                {isJapanese ? '移動先の対象組を選択してください:' : '이동할 대상 조를 선택해 주세요:'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {room.groups.map((g) => {
                  const isCurrent = g.groupNumber === movingPlayer.fromGroup;
                  return (
                    <button
                      key={g.groupNumber}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => handleMovePlayer(g.groupNumber)}
                      className={`p-2.5 rounded-xl border font-black text-xs transition active:scale-95 ${
                        isCurrent
                          ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                          : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200 cursor-pointer'
                      }`}
                    >
                      <span>{g.name} ({g.players.length}{isJapanese ? '人' : '명'})</span>
                      {isCurrent && <span className="block text-[10px] text-stone-400">({isJapanese ? '現在の組' : '현재 조'})</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 참가 신청 모달 (대기 풀 or 특정 조) */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-base">
                {joiningGroup !== null
                  ? (isJapanese ? `[${joiningGroup}組] 参加申込` : `[${joiningGroup}조] 참가 신청`)
                  : (isJapanese ? '参加申込 (待機名簿登録)' : '참가 신청 (대기 명단 등록)')}
              </h3>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmJoin} className="p-4 space-y-3">
              {/* 성명 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '参加者氏名 / ニックネーム *' : '참가자 성명 / 활동명 *'}</label>
                  <span className="text-[10px] text-stone-500 font-bold">{isJapanese ? '本名または仮名' : '실명 또는 가명'}</span>
                </div>

                {/* 실명 vs 가명 vs 게스트 빠른 선택 */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const user = ParkOnStorage.getKakaoUser();
                      setNewPlayerName(user?.realName || (isJapanese ? '山田太郎' : '홍길동'));
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-black transition cursor-pointer text-center ${
                      newPlayerName === (ParkOnStorage.getKakaoUser()?.realName || (isJapanese ? '山田太郎' : '홍길동'))
                        ? 'bg-emerald-100 border-emerald-600 text-emerald-950 ring-2 ring-emerald-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                    }`}
                  >
                    🔘 {isJapanese ? '本名' : '실명'} ({ParkOnStorage.getKakaoUser()?.realName || (isJapanese ? '山田太郎' : '홍길동')})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const user = ParkOnStorage.getKakaoUser();
                      setNewPlayerName(user?.aliasName || (isJapanese ? 'パーク達人' : '골퍼'));
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-black transition cursor-pointer text-center ${
                      newPlayerName === (ParkOnStorage.getKakaoUser()?.aliasName || (isJapanese ? 'パーク達人' : '골퍼'))
                        ? 'bg-purple-100 border-purple-600 text-purple-950 ring-2 ring-purple-200'
                        : 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-800'
                    }`}
                  >
                    🔘 {isJapanese ? '仮名' : '가명'} ({ParkOnStorage.getKakaoUser()?.aliasName || (isJapanese ? 'パーク達人' : '골퍼')})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPlayerName(isJapanese ? 'ゲスト' : '게스트');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-black transition cursor-pointer text-center ${
                      newPlayerName.startsWith(isJapanese ? 'ゲスト' : '게스트')
                        ? 'bg-amber-100 border-amber-600 text-amber-950 ring-2 ring-amber-200'
                        : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                    }`}
                  >
                    🔘 {isJapanese ? 'ゲスト (招待)' : '게스트 (초청)'}
                  </button>
                </div>

                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder={isJapanese ? '例: 山田太郎 または ゲスト1' : '예: 홍길동 또는 게스트1'}
                  autoFocus
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-black focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <p className="text-[10px] text-stone-400 font-medium">
                  {isJapanese
                    ? '💡 公式大会は本名参加を推奨し、外部招待者や当日来場者はゲスト登録して即座に組編成できます。'
                    : '💡 공식 대회는 실명 참가를 추천하며, 외부 초청인원/당일 현장 방문객은 게스트로 등록해 즉시 조에 편성할 수 있습니다.'}
                </p>
              </div>

              {/* 성별 선택 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '性別 (男女比バランス配分用)' : '성별 (성비 균형 분배용)'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPlayerGender('M')}
                    className={`py-2 rounded-xl text-xs font-black border transition ${
                      newPlayerGender === 'M'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    {isJapanese ? '男性 (男)' : '남성 (남)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPlayerGender('F')}
                    className={`py-2 rounded-xl text-xs font-black border transition ${
                      newPlayerGender === 'F'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    {isJapanese ? '女性 (女)' : '여성 (여)'}
                  </button>
                </div>
              </div>

              {/* 실력 등급 선택 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '実力ランク (実力バランス配分用)' : '실력 등급 (실력 균형 분배용)'}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewPlayerTier('ADVANCED')}
                    className={`py-2 rounded-xl text-xs font-black border transition ${
                      newPlayerTier === 'ADVANCED'
                        ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    {isJapanese ? '上級 (1~2級)' : '상급 (1~2급)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPlayerTier('INTERMEDIATE')}
                    className={`py-2 rounded-xl text-xs font-black border transition ${
                      newPlayerTier === 'INTERMEDIATE'
                        ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    {isJapanese ? '中級 (3級/一般)' : '중급 (3급/일반)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPlayerTier('BEGINNER')}
                    className={`py-2 rounded-xl text-xs font-black border transition ${
                      newPlayerTier === 'BEGINNER'
                        ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    {isJapanese ? '初級 (ルーキー)' : '초급 (루키)'}
                  </button>
                </div>
              </div>

              {/* 조장 여부 (특정 조 참가 시에만) */}
              {joiningGroup !== null && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="asLeader"
                    checked={joinAsLeader}
                    onChange={(e) => setJoinAsLeader(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-stone-300 focus:ring-purple-500"
                  />
                  <label htmlFor="asLeader" className="text-xs font-black text-stone-700 cursor-pointer">
                    {isJapanese ? '👑 この組のリーダーとして参加 (スコア入力担当)' : '👑 이 조의 조장으로 참가 (스코어 입력 담당)'}
                  </label>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="w-1/2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-black text-xs transition cursor-pointer"
                >
                  {isJapanese ? 'キャンセル' : '취소'}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  {isJapanese ? '参加完了' : '참가 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 💰 참가비 & 입금 계좌 설정 모달 */}
      {showPaymentConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-200" />
                <h3 className="font-black text-base">{isJapanese ? '参加費および振込口座の設定' : '참가비 및 입금 계좌 설정'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentConfigModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentConfig} className="p-4 space-y-3.5">
              {/* 1인 참가비 */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-stone-800 flex items-center justify-between">
                  <span>{isJapanese ? '1人参加費 (ウォン/円)' : '1인 참가비 (원)'}</span>
                  <span className="text-amber-700 font-bold">{isJapanese ? '0なら無料' : '0원이면 무료'}</span>
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 5000, 10000, 20000].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setConfigFee(fee)}
                      className={`py-1.5 rounded-lg text-xs font-black border transition cursor-pointer ${
                        configFee === fee
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {fee === 0 ? (isJapanese ? '無料' : '무료') : `${(fee / 10000 >= 1 ? `${fee / 10000}万` : `${fee / 1000}千`)}${isJapanese ? 'ウォン' : '원'}`}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={configFee}
                  onChange={(e) => setConfigFee(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* 입금 계좌 안내 */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '振込口座の案内 (銀行・口座番号・名義)' : '입금 계좌 안내 (은행·계좌번호·예금주)'}</label>
                <input
                  type="text"
                  value={configBankAccount}
                  onChange={(e) => setConfigBankAccount(e.target.value)}
                  placeholder={isJapanese ? '例: 三井住友銀行 123-456789 田中(幹事)' : '예: 농협 352-1234-5678 김대희(총무)'}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentConfigModal(false)}
                  className="w-1/2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-black text-xs transition cursor-pointer"
                >
                  {isJapanese ? 'キャンセル' : '취소'}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  {isJapanese ? '設定を保存' : '설정 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📋 대회 요강 & 경기 방식/로컬룰 상세 팝업 */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-stone-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-300" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/70 px-2 py-0.5 rounded-full">
                    OFFICIAL RULES
                  </span>
                  <h3 className="font-black text-base leading-tight">{isJapanese ? '大会要項＆競技方式の案内' : '대회 요강 & 경기 방식 안내'}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              {/* 대회 공식 경기 방식 */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{gameModeInfo.badge}</span>
                  <div>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">{isJapanese ? '公式競技モード' : '공식 경기 모드'}</span>
                    <h4 className="text-sm font-black text-emerald-950">{room.gameModeTitle || gameModeInfo.title}</h4>
                  </div>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-bold">
                  {gameModeInfo.shortDesc}
                </p>
                <div className="bg-white/90 rounded-xl p-2.5 border border-emerald-100 text-[11px] text-stone-600 leading-relaxed">
                  <strong className="text-emerald-900 block mb-1">{isJapanese ? '📌 規定詳細:' : '📌 규정 세부사항:'}</strong>
                  {gameModeInfo.ruleDetail}
                </div>
              </div>

              {/* 주최측 로컬 룰 및 특이사항 */}
              {room.gameRuleNotes && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>{isJapanese ? '主催者ローカルルール＆特記事項' : '주최측 로컬 룰 & 특이 규정'}</span>
                  </div>
                  <div className="bg-white/90 rounded-xl p-2.5 border border-amber-100 text-xs font-bold text-stone-700 whitespace-pre-wrap leading-relaxed">
                    {room.gameRuleNotes}
                  </div>
                </div>
              )}

              {/* 순위 산출 및 동타 처리 기준 */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2">
                <h5 className="text-xs font-black text-stone-800">{isJapanese ? '⚖️ 順位判定およびタイ(Tie)処理基準' : '⚖️ 순위 판정 및 동타(Tie) 처리 기준'}</h5>
                <ul className="text-[11px] text-stone-600 space-y-1 list-disc list-inside leading-relaxed font-medium">
                  {room.gameMode === 'NEW_PERIO' ? (
                    <>
                      <li>{isJapanese ? <><strong>新ペリア順位</strong>: 12の隠しホールを通じて算出された<strong>ネットスコア(Net Score)</strong>少打数順に優勝者を決定します。</> : <><strong>신페리오 순위</strong>: 12개 숨은 홀을 통해 산출된 <strong>네트 스코어(Net Score)</strong> 최저타 순으로 우승자를 결정합니다.</>}</li>
                      <li>{isJapanese ? <><strong>タイ処理</strong>: ネットスコアが同打の場合、グロス(Gross)の少ない選手が優先され、グロスも同打の場合はバックカウント(後半9ホールの合計打数)方式で順位を決定します。</> : <><strong>동타 처리</strong>: 네트 스코어가 같을 경우 실타수(Gross)가 적은 선수가 우선하며, 실타수도 같으면 백카운트(후반 9홀 합산타수) 방식으로 순위를 매깁니다.</>}</li>
                      <li>{isJapanese ? <><strong>メダリスト</strong>: ハンディキャップに関係なく実際の18ホール最少打数を記録した選手(グロス1位)を別途表彰します。</> : <><strong>메달리스트</strong>: 핸디캡과 무관하게 실제 18홀 가장 적은 타수를 기록한 최저타수 선수(Gross 1위)를 별도 시상합니다.</>}</li>
                    </>
                  ) : room.gameMode === 'STROKE' ? (
                    <>
                      <li>{isJapanese ? <><strong>スクラッチ順位</strong>: 規定18ホールの総グロス打数が最も少ない選手が1位となります。</> : <><strong>스크래치 순위</strong>: 규정 18홀 총 실타수가 가장 적은 선수가 1위를 차지합니다.</>}</li>
                      <li>{isJapanese ? <><strong>タイ処理</strong>: タイ発生時はバックカウント(Back Count: 後半9ホール最少打、同打時は最終ホールから逆順比較)で決定します。</> : <><strong>동타 처리</strong>: 동타 발생 시 백카운트(Back Count: 후반 B코스 9홀 최저타, 동타 시 마지막 홀부터 역순 비교)로 결정합니다.</>}</li>
                    </>
                  ) : room.gameMode === 'SCRAMBLE' ? (
                    <>
                      <li>{isJapanese ? <><strong>チーム戦</strong>: 組員4名がティーショット後、最も良いボール位置から全員が次のショットを打つ方式です。</> : <><strong>팀 경기</strong>: 조원 4명이 티샷 후 가장 좋은 공 위치에서 4명이 모두 다음 샷을 진행하는 방식입니다.</>}</li>
                      <li>{isJapanese ? 'チームワークと親睦を深め、初心者もチームに貢献できる競技です。' : '팀 협동과 친목을 극대화하며 초보자도 팀에 기여할 수 있는 팀전입니다.'}</li>
                    </>
                  ) : (
                    <>
                      <li>{isJapanese ? <><strong>親善エンジョイ</strong>: 順位競争のプレッシャーをなくし、会員間の親睦と楽しいラウンドを目指す競技です。</> : <><strong>명랑 친선</strong>: 순위 경쟁의 부담을 줄이고 회원 간의 친목과 즐거운 라운드를 도모하는 경기입니다.</>}</li>
                    </>
                  )}
                </ul>
              </div>

              {/* 참가비 및 총무 계좌 */}
              <div className="bg-stone-100 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="font-bold text-stone-600">{isJapanese ? '大会参加費' : '대회 참가비'}</span>
                <span className="font-black text-stone-900">
                  {room.entryFee && room.entryFee > 0 ? (isJapanese ? `${room.entryFee.toLocaleString()}ウォン` : `${room.entryFee.toLocaleString()}원`) : (isJapanese ? '無料 (参加費なし)' : '무료 (참가비 없음)')}
                </span>
              </div>
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-200 shrink-0">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-black text-xs shadow transition active:scale-95 cursor-pointer"
              >
                {isJapanese ? '確認して閉じる' : '확인 및 닫기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚙️ 경기 방식 & 시상 룰 맞춤 마법사 모달 */}
      {showAwardConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-stone-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-300" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-950/70 px-2 py-0.5 rounded-full">
                    RULE & AWARDS WIZARD
                  </span>
                  <h3 className="font-black text-base leading-tight">{isJapanese ? '大会方式＆表彰ルール設定' : '대회 방식 & 시상 룰 설정'}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAwardConfigModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAwardConfig} className="p-4 space-y-4 overflow-y-auto">
              {/* [STEP 1] 기본 경기 방식 선택 */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-stone-800 flex items-center justify-between">
                  <span>{isJapanese ? '1. 公式競技方式の選択' : '1. 공식 경기 방식 선택'}</span>
                  <span className="text-[10px] text-purple-700 font-bold">{isJapanese ? '5大標準モード対応' : '5대 표준 모드 지원'}</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { mode: 'NEW_PERIO', title: isJapanese ? '🎯 新ペリア方式' : '🎯 신페리오 방식', desc: isJapanese ? '12ホールHDCP (おすすめ)' : '12홀 핸디캡 (추천)' },
                    { mode: 'STROKE', title: isJapanese ? '🏆 正統ストローク' : '🏆 정통 스트로크', desc: isJapanese ? '18ホールスクラッチ順位' : '18홀 스크래치 순위' },
                    { mode: 'SCRAMBLE', title: isJapanese ? '🤝 チームスクランブル' : '🤝 팀 스크램블', desc: isJapanese ? '4人1組ベストボール' : '4인 1조 베스트볼' },
                    { mode: 'CASUAL', title: isJapanese ? '⛳ 親善エンジョイ' : '⛳ 친선 명랑 라운드', desc: isJapanese ? '順位プレッシャーなし' : '순위 부담 제로' },
                  ].map((m) => (
                    <button
                      key={m.mode}
                      type="button"
                      onClick={() => setCfgGameMode(m.mode as any)}
                      className={`p-2 rounded-xl text-left border transition cursor-pointer ${
                        cfgGameMode === m.mode
                          ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-xs'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <div className="text-xs font-black">{m.title}</div>
                      <div className="text-[10px] text-stone-500 font-medium">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* [STEP 2] 우승자 독식 방지 (시상 유예) 규정 */}
              <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-200/80 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-purple-950">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  <span>{isJapanese ? '2. 優勝者独占防止 (表彰猶予) ローカルルール' : '2. 우승자 독식 방지 (시상 유예) 로컬 룰'}</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {isJapanese ? (
                    <>上級者が毎回賞品を独占するのを防止します。1位になっても<strong>名誉メダリストは維持</strong>され、<strong>実際の1位賞品は次点(2位)会員へ継承</strong>されます。</>
                  ) : (
                    <>상급자가 상품을 매번 독식하는 것을 방지합니다. 1등을 하더라도 <strong>명예 메달리스트는 유지</strong>하되, <strong>실제 1위 시상품은 차순위(2위) 회원에게 승계</strong>됩니다.</>
                  )}
                </p>

                {/* 유예 기간 라디오 */}
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { val: 0, label: isJapanese ? '未適用' : '미적용' },
                    { val: 1, label: isJapanese ? '直前1回' : '직전 1회' },
                    { val: 2, label: isJapanese ? '直近2回' : '최근 2회' },
                    { val: 3, label: isJapanese ? '直近3ヶ月' : '최근 3개월' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setCfgWinnerGraceMonths(opt.val)}
                      className={`py-1.5 rounded-lg text-xs font-black border transition cursor-pointer ${
                        cfgWinnerGraceMonths === opt.val
                          ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* 직전 우승자 이름 입력란 */}
                {cfgWinnerGraceMonths > 0 && (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-extrabold text-stone-700">
                      {isJapanese ? '直前優勝者名 (カンマ区切り)' : '직전 우승자 이름 (쉼표로 구분)'}
                    </label>
                    <input
                      type="text"
                      value={cfgLastWinnerNames}
                      onChange={(e) => setCfgLastWinnerNames(e.target.value)}
                      placeholder={isJapanese ? '例: 山田太郎, 佐藤健' : '예: 박찬호, 홍길동'}
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600"
                    />
                    <p className="text-[10px] text-purple-800 font-medium">
                      {isJapanese
                        ? '💡 ここに記載された会員が今大会で1位となった場合、賞品が2位へ自動継承されます。'
                        : '💡 여기에 적힌 회원이 이번 대회에서 1위를 차지하면 상품이 2위에게 자동 승계됩니다.'}
                    </p>
                  </div>
                )}
              </div>

              {/* [STEP 3] 이색 특별상 & 행운상 옵션 토글 */}
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2.5">
                <div className="text-xs font-black text-stone-800">{isJapanese ? '3. 特別賞および現場抽選オプション' : '3. 특별상 및 현장 추첨 옵션'}</div>

                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfgEnableSpecialAwards}
                    onChange={(e) => setCfgEnableSpecialAwards(e.target.checked)}
                    className="w-4 h-4 text-purple-700 rounded border-stone-300"
                  />
                  <span>{isJapanese ? '🎖️ ユニーク特別賞の自動集計 (最多パー賞, カモ賞, ラッキー7位賞, ニアピン惜敗賞, 努力賞)' : '🎖️ 이색 특별상 자동 집계 (다파상, 오리상, 행운의 7위상, 아차상, 꼴찌 격려상)'}</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfgEnableLuckyDraw}
                    onChange={(e) => setCfgEnableLuckyDraw(e.target.checked)}
                    className="w-4 h-4 text-purple-700 rounded border-stone-300"
                  />
                  <span>{isJapanese ? '🎰 現場リアルタイムラッキー賞抽選機の稼働 (表彰式即席ルーレット)' : '🎰 현장 실시간 행운상 추첨기 가동 (시상식 즉석 룰렛)'}</span>
                </label>
              </div>

              {/* [STEP 4] 로컬 룰 및 특이 규정 */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '4. 主催者ローカルルール＆お知らせ' : '4. 주최측 로컬 룰 & 공지사항'}</label>
                <div className="flex gap-1 flex-wrap">
                  {[
                    isJapanese ? 'OB時は2罰打および特設ティー(ドロップゾーン)プレー' : 'OB 시 2벌타 및 특설티(드롭존) 플레이',
                    isJapanese ? 'コンシードは1クラブ(30cm)以内認定' : '컨시드는 1클럽(30cm) 이내 인정',
                    isJapanese ? 'バンカーラフ足跡整地後無罰ドロップ' : '벙커 러프 발자국 정리 후 무벌타 드롭',
                  ].map((rule) => (
                    <button
                      key={rule}
                      type="button"
                      onClick={() => {
                        if (!cfgRuleNotes.includes(rule)) {
                          setCfgRuleNotes(cfgRuleNotes ? `${cfgRuleNotes}\n• ${rule}` : `• ${rule}`);
                        }
                      }}
                      className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300/80 px-2 py-0.5 rounded-md font-bold transition"
                    >
                      +{rule.slice(0, 10)}...
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={cfgRuleNotes}
                  onChange={(e) => setCfgRuleNotes(e.target.value)}
                  placeholder={isJapanese ? '追加の案内事項やローカルルールを入力してください...' : '추가 안내사항이나 로컬 룰을 입력하세요...'}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAwardConfigModal(false)}
                  className="w-1/2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-black text-xs transition cursor-pointer"
                >
                  {isJapanese ? 'キャンセル' : '취소'}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  {isJapanese ? '設定を保存して反映' : '설정 저장 및 반영'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎰 현장 실시간 행운상 룰렛 추첨 모달 */}
      {showLuckyDrawModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-200" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 bg-amber-950/60 px-2 py-0.5 rounded-full">
                    LIVE LUCKY DRAW
                  </span>
                  <h3 className="font-black text-base leading-tight">{isJapanese ? '現場リアルタイムラッキー賞抽選機' : '현장 실시간 행운상 추첨기'}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLuckyDrawModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              {/* 상품명 입력 */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-stone-800 flex items-center justify-between">
                  <span>{isJapanese ? '抽選する賞品名称' : '추첨할 상품 명칭'}</span>
                  <span className="text-amber-700 font-bold text-[10px]">{isJapanese ? 'クイック選択可能' : '빠른 선택 가능'}</span>
                </label>
                <div className="flex gap-1 flex-wrap">
                  {[
                    isJapanese ? '靴下セット' : '양말 세트',
                    isJapanese ? 'パークゴルフボール' : '파크골프 공',
                    isJapanese ? '高級キャップ' : '고급 모자',
                    isJapanese ? 'ゴルフグローブ' : '골프 장갑',
                    isJapanese ? '商品券' : '1만원 상품권',
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDrawPrizeName(isJapanese ? `ラッキー賞 (${item})` : `행운상 (${item})`)}
                      className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-bold transition"
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={drawPrizeName}
                  onChange={(e) => setDrawPrizeName(e.target.value)}
                  placeholder={isJapanese ? '例: ラッキー賞1号 (ボール1ダース)' : '예: 행운상 1호 (파크골프 공 1더즌)'}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* 추첨 대상 필터 */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '抽選対象の範囲' : '추첨 대상 범위'}</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDrawFilterMode('UNAWARDED')}
                    className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                      drawFilterMode === 'UNAWARDED'
                        ? 'bg-amber-50 border-amber-600 text-amber-950 font-black shadow-2xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 font-bold'
                    }`}
                  >
                    <div className="text-xs">{isJapanese ? '🎁 未受賞者を配慮 (おすすめ)' : '🎁 미수상자 배려 (추천)'}</div>
                    <div className="text-[10px] text-stone-500 font-normal mt-0.5">
                      {isJapanese ? '賞のない会員のみ対象 (均等表彰)' : '상 못 받은 회원만 대상 (골고루 시상)'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDrawFilterMode('ALL')}
                    className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                      drawFilterMode === 'ALL'
                        ? 'bg-amber-50 border-amber-600 text-amber-950 font-black shadow-2xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 font-bold'
                    }`}
                  >
                    <div className="text-xs">{isJapanese ? '👥 全参加者が対象' : '👥 전체 참가자 대상'}</div>
                    <div className="text-[10px] text-stone-500 font-normal mt-0.5">
                      {isJapanese ? '1~3位含む全員100%ランダム' : '1~3위 포함 전원 100% 무작위'}
                    </div>
                  </button>
                </div>
              </div>

              {/* 🎰 시각적 룰렛 박스 */}
              <div className="pt-2">
                {isSpinning ? (
                  <div className="bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 border-2 border-dashed border-amber-500 rounded-3xl p-6 text-center shadow-inner space-y-2">
                    <div className="inline-block animate-spin text-2xl">🎲</div>
                    <div className="text-xs font-black text-amber-800 tracking-wider">
                      {isJapanese ? '幸運の主人公を探索中...' : '행운의 주인공을 찾는 중...'}
                    </div>
                    <div className="text-2xl font-black text-stone-900 tracking-tight transition-all">
                      {currentCandidateName || (isJapanese ? 'ドキドキ...' : '두구두구...')}
                    </div>
                  </div>
                ) : drawnWinner ? (
                  <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-5 text-center shadow-lg space-y-2 animate-fadeIn border border-amber-300">
                    <Sparkles className="w-8 h-8 text-amber-200 mx-auto" />
                    <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                      {isJapanese ? '🎉 おめでとうございます！当選しました 🎉' : '🎉 축하합니다! 당첨되었습니다 🎉'}
                    </span>
                    <h4 className="text-2xl font-black text-white pt-1">
                      {drawnWinner.groupNumber ? (isJapanese ? `[${drawnWinner.groupNumber}組] ` : `[${drawnWinner.groupNumber}조] `) : ''}
                      {isJapanese ? `${drawnWinner.name} 会員様！` : `${drawnWinner.name} 회원님!`}
                    </h4>
                    <p className="text-xs text-amber-100 font-extrabold">
                      🎁 {isJapanese ? '賞品' : '선물'}: {drawPrizeName}
                    </p>

                    <div className="pt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={handleStartLuckyDraw}
                        className="w-1/2 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black transition cursor-pointer"
                      >
                        {isJapanese ? 'もう一度引く 🔄' : '다시 뽑기 🔄'}
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmLuckyWinner}
                        className="w-1/2 py-2.5 bg-white text-amber-950 hover:bg-amber-50 rounded-xl text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
                      >
                        {isJapanese ? '当選確定 [✅]' : '당첨 확정 [✅]'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 text-center space-y-2">
                    <div className="text-3xl">🎰</div>
                    <h4 className="text-sm font-black text-stone-800">
                      {isJapanese ? '現場即席ルーレットラッキー抽選' : '현장 즉석 룰렛 행운 추첨'}
                    </h4>
                    <p className="text-xs text-stone-500 font-medium">
                      {isJapanese ? (
                        <>下の<strong>[抽選開始]</strong>ボタンを押すと参加者名簿がルーレットのように回転し当選者を選定します！</>
                      ) : (
                        <>아래 <strong>[추첨 시작]</strong> 버튼을 누르면 참가자 명단이 룰렛처럼 회전하며 당첨자를 선정합니다!</>
                      )}
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleStartLuckyDraw}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4 text-amber-200" />
                        <span>{isJapanese ? '抽選開始！(ルーレット回転 🎲)' : '추첨 시작! (룰렛 회전 🎲)'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 기 당첨자 목록 */}
              {room.awardConfig?.luckyDrawWinners && room.awardConfig.luckyDrawWinners.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-xs font-extrabold text-stone-800 flex items-center justify-between">
                    <span>{isJapanese ? `現在までの当選ラッキー賞 (${room.awardConfig.luckyDrawWinners.length}人)` : `현재까지 당첨된 행운상 (${room.awardConfig.luckyDrawWinners.length}명)`}</span>
                  </div>
                  <div className="divide-y divide-stone-100 bg-stone-50 rounded-2xl border border-stone-200 max-h-36 overflow-y-auto">
                    {room.awardConfig.luckyDrawWinners.map((lw, idx) => (
                      <div
                        key={lw.id}
                        className="p-2 flex items-center justify-between text-xs font-bold text-stone-700"
                      >
                        <span>
                          {idx + 1}. <strong>{lw.name}</strong> {lw.groupNumber ? `(${lw.groupNumber}${isJapanese ? '組' : '조'})` : ''} - 🎁 {lw.prizeName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLuckyWinner(lw.id, lw.name)}
                          className="text-stone-400 hover:text-red-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-200 shrink-0">
              <button
                type="button"
                onClick={() => setShowLuckyDrawModal(false)}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-black text-xs shadow transition active:scale-95 cursor-pointer"
              >
                {isJapanese ? '閉じる' : '닫기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
