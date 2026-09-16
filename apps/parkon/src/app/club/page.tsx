'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Users,
  Award,
  Plus,
  Minus,
  Share2,
  Trophy,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  X,
  Flag,
  Search,
  Check,
  Settings,
  Trash2,
  Building2,
  Flame,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  UserCheck,
  UserX,
  Copy,
  Lock,
  Edit3,
  Coins,
  Zap,
  Swords,
  Heart,
  Send,
  Play,
  Hand,
  ArrowLeftRight,
  LogOut,
  Mail,
  Newspaper,
} from 'lucide-react';
import { ClubEventRoom, ClubGroup, ClubPlayer, ParkGolfClub, ClubMember, FlashGathering, TournamentType, ClubInvitation } from '@/types/club';
import { Course } from '@/types/parkon';
import { ClubStorage } from '@/lib/clubStorage';
import { CompanionStorage, Companionship, CompanionLightningRound } from '@/lib/companionStorage';
import { ParkOnStorage } from '@/lib/storage';
import { DEFAULT_COURSES } from '@/lib/defaultCourses';
import { getDefaultSelfName } from '@/lib/playerUtils';

const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export default function ClubGatheringHomePage() {
  const router = useRouter();

  // 3대 전문 허브 탭: 'CLUBS' (내 클럽 바로가기) | 'TOURNAMENTS' (새 대회 개설) | 'FLASH' (번개 모임 갖기)
  const [activeHubTab, setActiveHubTab] = useState<'CLUBS' | 'TOURNAMENTS' | 'FLASH'>('CLUBS');

  // 전국 구장 목록 & 구장 검색 모달 상태
  const [allCourses, setAllCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [showCourseSearchModal, setShowCourseSearchModal] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [courseRegionFilter, setCourseRegionFilter] = useState('전체');
  const [tempSelectedCourseId, setTempSelectedCourseId] = useState<string | null>(null);
  const [courseSearchTarget, setCourseSearchTarget] = useState<'TOURNAMENT' | '1CHON' | 'CLUB_FLASH' | 'NEW_CLUB'>('TOURNAMENT');

  // 안내 토스트 메시지
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ========================================================
  // 1. [내 클럽 관리] 상태
  // ========================================================
  const [clubs, setClubs] = useState<ParkGolfClub[]>([]);
  const [myClubIds, setMyClubIds] = useState<string[]>([]);
  const [showCreateClubModal, setShowCreateClubModal] = useState(false);
  const [showClubBrowseModal, setShowClubBrowseModal] = useState(false);
  const [selectedClubDetail, setSelectedClubDetail] = useState<ParkGolfClub | null>(null);
  const [clubInvitations, setClubInvitations] = useState<ClubInvitation[]>([]);

  // 회장/총무 클럽 관리 모달 (가입 승인 대기 탭 / 회원 명부 탭)
  const [managingClub, setManagingClub] = useState<ParkGolfClub | null>(null);
  const [managingClubTab, setManagingClubTab] = useState<'PENDING' | 'MEMBERS'>('PENDING');

  // 클럽 가입 신청 모달 상태
  const [applyingClub, setApplyingClub] = useState<ParkGolfClub | null>(null);
  const [applicantName, setApplicantName] = useState('김대희(본인)');
  const [applicantPhone, setApplicantPhone] = useState('010-3814-1422');
  const [applicantMessage, setApplicantMessage] = useState('클럽에 가입하여 매너 라운드 함께하고 싶습니다!');

  // 새 클럽 창단 폼 상태
  const [newClubName, setNewClubName] = useState('');
  const [newClubRegion, setNewClubRegion] = useState('경북 구미');
  const [newClubHomeCourseId, setNewClubHomeCourseId] = useState('course-gumi-dongrak');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [newClubPresident, setNewClubPresident] = useState('박회장');
  const [newClubManager, setNewClubManager] = useState('김총무(본인)');
  const [newClubPhone, setNewClubPhone] = useState('010-1234-5678');

  // ========================================================
  // 2. [새 대회 개설 & 실시간 전광판] 상태
  // ========================================================
  const [rooms, setRooms] = useState<ClubEventRoom[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);
  const [tournamentViewMode, setTournamentViewMode] = useState<'CREATE' | 'LIVE_BOARD'>('CREATE');

  // 대회 성격 및 규정: 클럽 대항전 vs 시·도 단위 공식 대회 vs 클럽 월례회
  const [tournamentType, setTournamentType] = useState<TournamentType>('CLUB_MATCH');
  const [participatingClubIds, setParticipatingClubIds] = useState<string[]>([]);
  const [regionalScope, setRegionalScope] = useState<string>('경상북도 구미시');

  // [NEW] 클럽 대항전(교류전) 전용 매칭 & 엔트리 상태 (대표님 요청)
  const [matchInviteType, setMatchInviteType] = useState<'DIRECT_CHALLENGE' | 'OPEN_CHALLENGE'>('DIRECT_CHALLENGE');
  const [matchTeamCount, setMatchTeamCount] = useState<number>(2); // 2개 팀, 3개 팀, 4개 팀
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(16); // 클럽당 16명 (기본)
  const [customOpponentName, setCustomOpponentName] = useState<string>('');

  // 대회 개설 서브 팝업 모달 상태
  const [showCreateFeeModal, setShowCreateFeeModal] = useState(false);
  const [showCreateGameModeModal, setShowCreateGameModeModal] = useState(false);
  const [showCreateRulesModal, setShowCreateRulesModal] = useState(false);
  const [customGraceMonths, setCustomGraceMonths] = useState<number>(3);
  const [customConcede, setCustomConcede] = useState<string>('1클럽 샤프트 이내 (약 80cm)');

  // 새 대회 폼 상태
  const [tournamentClubId, setTournamentClubId] = useState<string>('');
  const [title, setTitle] = useState('구미 동락 vs 부산 삼락 파크골프 클럽 친선 대항전 ⚔️');
  const [selectedCourseId, setSelectedCourseId] = useState('course-gumi-dongrak');
  const [hostName, setHostName] = useState('김총무');
  const [targetPlayers, setTargetPlayers] = useState<number>(32); // 기본 32명 (8개 조)
  const [groupCount, setGroupCount] = useState<number>(8);
  const [selectedLetters, setSelectedLetters] = useState<string[]>(['A', 'B']);
  const [entryFee, setEntryFee] = useState<number>(10000); // 1인 참가비 (기본 10,000원)
  const [bankAccount, setBankAccount] = useState('농협 352-1234-5678 김대희(총무)'); // 입금 계좌 안내
  const [gameMode, setGameMode] = useState<'STROKE' | 'NEW_PERIO' | 'SCRAMBLE' | 'STABLEFORD' | 'CASUAL'>('STROKE');
  const [gameRuleNotes, setGameRuleNotes] = useState('정통 스트로크(18홀 최저타순), 동타 시 백카운트(후반 9홀 합산) 우선, 컨시드 1클럽 샤프트 이내, OB 2벌타');

  // 모임 방 수정 및 삭제 상태
  const [editingRoom, setEditingRoom] = useState<ClubEventRoom | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editHostName, setEditHostName] = useState('');
  const [editTargetPlayers, setEditTargetPlayers] = useState<number>(16);
  const [editStatus, setEditStatus] = useState<'RECRUITING' | 'PLAYING' | 'FINISHED'>('PLAYING');
  const [editEntryFee, setEditEntryFee] = useState<number>(10000);
  const [editBankAccount, setEditBankAccount] = useState('');
  const [editGameMode, setEditGameMode] = useState<'STROKE' | 'NEW_PERIO' | 'SCRAMBLE' | 'STABLEFORD' | 'CASUAL'>('NEW_PERIO');
  const [editGameRuleNotes, setEditGameRuleNotes] = useState('');
  const [roomToDelete, setRoomToDelete] = useState<ClubEventRoom | null>(null);

  // 클럽별 사용자 활동명(실명/별명) 설정 모달 상태
  const [aliasTargetClub, setAliasTargetClub] = useState<ParkGolfClub | null>(null);
  const [aliasInputName, setAliasInputName] = useState('');

  // 카톡 초대장 복사 상태 피드백 및 초청장 미리보기 모달 상태
  const [copiedClubId, setCopiedClubId] = useState<string | null>(null);
  const [inviteModalClub, setInviteModalClub] = useState<ParkGolfClub | null>(null);
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);

  // ========================================================
  // 3. [번개 모임 갖기 - 1촌 번개 & 클럽원 전용 번개] 상태
  // ========================================================
  const [flashSubTab, setFlashSubTab] = useState<'1CHON' | 'CLUB_ONLY'>('1CHON');
  const [companions, setCompanions] = useState<Companionship[]>([]);
  const [lightningRounds, setLightningRounds] = useState<CompanionLightningRound[]>([]);
  const [flashGatherings, setFlashGatherings] = useState<FlashGathering[]>([]);
  const [selectedFlashClubId, setSelectedFlashClubId] = useState<string>('');

  // 1촌 번개 개설 모달 상태 (4인 번개 기본 vs 4인 이상 번개 무제한)
  const [showCreate1ChonModal, setShowCreate1ChonModal] = useState(false);
  const [ltnLightningScope, setLtnLightningScope] = useState<'FOUR_PLAYERS' | 'MULTI_OPEN'>('FOUR_PLAYERS');
  const [ltnCourseId, setLtnCourseId] = useState('course-gumi-dongrak');
  const [ltnDateStr, setLtnDateStr] = useState('오늘');
  const [ltnTimeStr, setLtnTimeStr] = useState('14:30');
  const [ltnNotes, setLtnNotes] = useState('2인 이상 모이면 바로 출발합니다!');
  const [ltnInvited1Chons, setLtnInvited1Chons] = useState<string[]>([]);

  // 클럽원 전용 번개 개설 모달 상태 (4인 번개 기본 vs 4인 이상 번개 무제한)
  const [showCreateClubFlashModal, setShowCreateClubFlashModal] = useState(false);
  const [clubFlashLightningScope, setClubFlashLightningScope] = useState<'FOUR_PLAYERS' | 'MULTI_OPEN'>('FOUR_PLAYERS');
  const [clubFlashTitle, setClubFlashTitle] = useState('오늘 번개 치실 분! (2인 이상 출발)');
  const [clubFlashCourseId, setClubFlashCourseId] = useState('course-gumi-dongrak');
  const [clubFlashDate, setClubFlashDate] = useState('오늘');
  const [clubFlashTime, setClubFlashTime] = useState('14:00');
  const [clubFlashNotes, setClubFlashNotes] = useState('2인 이상 모이면 언제든 바로 출발합니다!');

  // 번개 라운드 조 편성 미리보기 & 현장 자리 맞바꾸기(Swap) 모달 상태
  const [previewRoom, setPreviewRoom] = useState<ClubEventRoom | null>(null);
  const [selectedSwapPlayer, setSelectedSwapPlayer] = useState<{
    groupIndex: number;
    playerIndex: number;
    playerId: string;
    playerName: string;
  } | null>(null);

  // 초기 로딩
  useEffect(() => {
    refreshAllData();

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hub = urlParams.get('hub') || urlParams.get('tab');
      if (hub === 'FLASH' || hub === 'flash') setActiveHubTab('FLASH');
      else if (hub === 'TOURNAMENTS' || hub === 'tournaments') setActiveHubTab('TOURNAMENTS');
      else if (hub === 'CLUBS' || hub === 'clubs') setActiveHubTab('CLUBS');

      const joinId = urlParams.get('join');
      if (joinId) {
        const target = ClubStorage.getClubById(joinId);
        if (target) {
          setApplyingClub(target);
          showToast(`📩 '${target.name}' 클럽 가입 초청장으로 접속하셨습니다. 가입 신청을 진행하세요!`);
        }
      }

      const handleSync = () => {
        setLightningRounds(CompanionStorage.getLightningRounds());
        setCompanions(CompanionStorage.getCompanions());
        setFlashGatherings(ClubStorage.getAllFlashGatherings());
      };
      window.addEventListener('parkon_lightning_updated', handleSync);
      window.addEventListener('parkon_companion_updated', handleSync);
      return () => {
        window.removeEventListener('parkon_lightning_updated', handleSync);
        window.removeEventListener('parkon_companion_updated', handleSync);
      };
    }
  }, []);

  const refreshAllData = () => {
    setRooms(ClubStorage.getAllRooms());
    const allClubsList = ClubStorage.getAllClubs();
    setClubs(allClubsList);
    const myIds = ClubStorage.getMyClubIds();
    setMyClubIds(myIds);
    setFlashGatherings(ClubStorage.getAllFlashGatherings());
    setCompanions(CompanionStorage.getCompanions());
    setLightningRounds(CompanionStorage.getLightningRounds());
    setClubInvitations(ClubStorage.getClubInvitations());

    const list = ParkOnStorage.getAllCourses();
    setAllCourses(list);
    const homeCourseId = ParkOnStorage.getHomeCourseId();
    if (homeCourseId && list.some((c) => c.id === homeCourseId)) {
      setSelectedCourseId(homeCourseId);
      setNewClubHomeCourseId(homeCourseId);
      setLtnCourseId(homeCourseId);
      setClubFlashCourseId(homeCourseId);
    } else if (list.length > 0) {
      setSelectedCourseId(list[0].id);
      setNewClubHomeCourseId(list[0].id);
      setLtnCourseId(list[0].id);
      setClubFlashCourseId(list[0].id);
    }

    if (myIds.length > 0) {
      setSelectedFlashClubId(myIds[0]);
    } else if (allClubsList.length > 0) {
      setSelectedFlashClubId(allClubsList[0].id);
    }

    const selfName = getDefaultSelfName();
    setApplicantName(selfName);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 모바일 / 카카오톡 인앱 브라우저 완벽 호환 클립보드 복사 함수
  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    // 1차: 최신 navigator.clipboard 시도
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('navigator.clipboard writeText failed, fallback to execCommand', err);
      }
    }

    // 2차: document.execCommand('copy') fallback (iOS, 구형 안드로이드, 카톡 브라우저)
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
    } catch (e) {
      console.error('execCommand copy failed', e);
      return false;
    }
  };

  const selectedCourse = allCourses.find((c) => c.id === selectedCourseId) || allCourses[0] || DEFAULT_COURSES[0];
  const ltnSelectedCourse = allCourses.find((c) => c.id === ltnCourseId) || allCourses[0] || DEFAULT_COURSES[0];
  const clubFlashSelectedCourse = allCourses.find((c) => c.id === clubFlashCourseId) || allCourses[0] || DEFAULT_COURSES[0];
  const newClubSelectedCourse = allCourses.find((c) => c.id === newClubHomeCourseId) || allCourses[0] || DEFAULT_COURSES[0];
  const totalNumCourses = selectedCourse.totalCourses || Math.max(1, Math.round(selectedCourse.totalHoles / 9));
  const availableLetters = COURSE_LETTERS.slice(0, totalNumCourses);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    const c = allCourses.find((x) => x.id === courseId) || allCourses[0] || DEFAULT_COURSES[0];
    const n = c.totalCourses || Math.max(1, Math.round(c.totalHoles / 9));
    const letters = COURSE_LETTERS.slice(0, n);
    setSelectedLetters(letters.slice(0, Math.min(2, letters.length)));
    if (!title || title.includes('파크골프') || title.includes('월례회') || title.includes('정기 모임')) {
      setTitle(`${c.name} 정기 대회`);
    }
  };

  const confirmCourseSelection = (courseId: string) => {
    const c = allCourses.find((x) => x.id === courseId) || allCourses[0];
    if (courseSearchTarget === '1CHON') {
      setLtnCourseId(courseId);
      showToast(`⛳ 번개 구장이 '${c.name}'(으)로 선택되었습니다.`);
    } else if (courseSearchTarget === 'CLUB_FLASH') {
      setClubFlashCourseId(courseId);
      showToast(`⛳ 번개 구장이 '${c.name}'(으)로 선택되었습니다.`);
    } else if (courseSearchTarget === 'NEW_CLUB') {
      setNewClubHomeCourseId(courseId);
      if (!newClubRegion || newClubRegion === '경북 구미') {
        setNewClubRegion(c.region);
      }
      showToast(`⛳ 클럽 홈 구장이 '${c.name}'(으)로 선택되었습니다.`);
    } else {
      handleCourseChange(courseId);
      showToast(`⛳ 대회 구장이 '${c.name}'(으)로 선택되었습니다.`);
    }
    setShowCourseSearchModal(false);
  };

  // 전국 구장 검색 필터링 (구장명, 지역, 무공백 매칭)
  const filteredSearchCourses = allCourses.filter((c) => {
    if (courseRegionFilter !== '전체') {
      if (!c.region.includes(courseRegionFilter)) return false;
    }
    if (!courseSearchTerm.trim()) return true;
    const term = courseSearchTerm.trim().toLowerCase();
    const matchName = c.name.toLowerCase().includes(term);
    const matchRegion = c.region.toLowerCase().includes(term);
    const noSpaceTerm = term.replace(/\s+/g, '');
    const noSpaceName = c.name.toLowerCase().replace(/\s+/g, '');
    return matchName || matchRegion || noSpaceName.includes(noSpaceTerm);
  });

  // 대회 인원수 변경 시 최적 조 수 자동 계산
  const handleTargetPlayersChange = (val: number) => {
    const num = Math.max(1, Math.min(999, val || 1));
    setTargetPlayers(num);
    const optimal = ClubStorage.calculateOptimalGroups(num);
    setGroupCount(optimal.groupCount);
  };

  // 대항전 팀 수 변경
  const handleMatchTeamCountChange = (count: number) => {
    setMatchTeamCount(count);
    const newTotal = count * playersPerTeam;
    setTargetPlayers(newTotal);
    const opt = ClubStorage.calculateOptimalGroups(newTotal);
    setGroupCount(opt.groupCount);
    updateMatchTitle(matchInviteType, count, playersPerTeam, participatingClubIds, customOpponentName);
  };

  // 대항전 팀당 출전 인원(엔트리) 변경
  const handlePlayersPerTeamChange = (count: number) => {
    const valid = Math.max(2, Math.min(100, count));
    setPlayersPerTeam(valid);
    const newTotal = matchTeamCount * valid;
    setTargetPlayers(newTotal);
    const opt = ClubStorage.calculateOptimalGroups(newTotal);
    setGroupCount(opt.groupCount);
    updateMatchTitle(matchInviteType, matchTeamCount, valid, participatingClubIds, customOpponentName);
  };

  // 대항전 제목 자동 생성
  const updateMatchTitle = (
    inviteType: 'DIRECT_CHALLENGE' | 'OPEN_CHALLENGE',
    teamCount: number,
    perTeam: number,
    pClubIds: string[],
    customOpp: string
  ) => {
    const hostClub = clubs.find((c) => c.id === tournamentClubId) || myClubs[0];
    const hostName = hostClub ? hostClub.name.replace(' 파크골프 클럽', '').replace(' 클럽', '') : '우리 클럽';

    if (inviteType === 'OPEN_CHALLENGE') {
      setTitle(`[도전팀 구함] ${hostName} 친선 교류전 (${perTeam}인전) ⚔️`);
      return;
    }

    const oppClub = clubs.find((c) => pClubIds.includes(c.id) && c.id !== hostClub?.id);
    const oppName = oppClub
      ? oppClub.name.replace(' 파크골프 클럽', '').replace(' 클럽', '')
      : customOpp.trim() || '부산 삼락';

    const total = teamCount * perTeam;
    if (teamCount === 2) {
      setTitle(`${hostName} vs ${oppName} ${total}인 친선 대항전 ⚔️`);
    } else {
      setTitle(`${hostName} 외 ${teamCount - 1}개 클럽 친선 삼파전 (${total}인) ⚔️`);
    }
  };

  // ========================================================
  // [대회 개설 핸들러]
  // ========================================================
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const course = allCourses.find((c) => c.id === selectedCourseId) || allCourses[0] || DEFAULT_COURSES[0];
    const linkedClub = clubs.find((c) => c.id === tournamentClubId);

    // 대항전 참가 클럽 목록 정리
    let pClubs: { clubId: string; clubName: string }[] | undefined = undefined;
    if (tournamentType === 'CLUB_MATCH') {
      const list: { clubId: string; clubName: string }[] = [];
      if (linkedClub) {
        list.push({ clubId: linkedClub.id, clubName: linkedClub.name });
      }
      clubs
        .filter((c) => participatingClubIds.includes(c.id) && c.id !== linkedClub?.id)
        .forEach((c) => list.push({ clubId: c.id, clubName: c.name }));

      if (customOpponentName.trim() && !list.some((c) => c.clubName === customOpponentName.trim())) {
        list.push({ clubId: `ext-${Date.now()}`, clubName: customOpponentName.trim() });
      }
      pClubs = list.length > 0 ? list : undefined;
    }

    const calculatedTotal = tournamentType === 'CLUB_MATCH'
      ? matchTeamCount * playersPerTeam
      : targetPlayers;

    const calculatedGroups = tournamentType === 'CLUB_MATCH'
      ? Math.ceil(calculatedTotal / 4)
      : (Number(groupCount) || 5);

    const newRoom = ClubStorage.createRoom({
      title: title || `${course.name} 정기 모임`,
      courseId: course.id,
      courseName: course.name,
      hostName: hostName || '총무',
      selectedCourseLetters: selectedLetters,
      groupCount: calculatedGroups,
      targetTotalPlayers: calculatedTotal,
      clubId: linkedClub?.id,
      clubName: linkedClub?.name,
      tournamentType,
      participatingClubs: pClubs,
      matchTeamCount: tournamentType === 'CLUB_MATCH' ? matchTeamCount : undefined,
      playersPerTeam: tournamentType === 'CLUB_MATCH' ? playersPerTeam : undefined,
      matchInviteType: tournamentType === 'CLUB_MATCH' ? matchInviteType : undefined,
      regionScope: tournamentType === 'REGIONAL_OPEN' ? regionalScope : undefined,
      entryFee: Number(entryFee) || 0,
      bankAccount: bankAccount.trim(),
      gameMode,
      gameRuleNotes: gameRuleNotes.trim(),
    });

    setRooms(ClubStorage.getAllRooms());
    setShowCreateModal(false);
    setJustCreatedId(newRoom.id);
    showToast(`🏆 '${newRoom.title}' 대회가 개설되었습니다! 전광판에 등록되었습니다.`);
  };

  // 클럽 홈에서 '이 클럽 자체 월례회 열기' 클릭 시
  const handleOpenTournamentForClub = (club: ParkGolfClub) => {
    setTournamentClubId(club.id);
    setTournamentType('CLUB_INTERNAL');
    setTitle(`${club.name} 정기 월례회 🏅`);
    if (club.homeCourseId) {
      handleCourseChange(club.homeCourseId);
    }
    setHostName(club.managerName || '총무');
    setActiveHubTab('TOURNAMENTS');
    setTournamentViewMode('CREATE');
    setShowCreateModal(true);
  };

  // [⚔️ 클럽 대항전 (교류전)] 모드 개설 팝업 오픈
  const handleOpenClubMatchTournament = () => {
    setTournamentType('CLUB_MATCH');
    setMatchInviteType('DIRECT_CHALLENGE');
    setMatchTeamCount(2);
    setPlayersPerTeam(16);
    setTargetPlayers(32);
    setGroupCount(8);
    setSelectedLetters(['A', 'B', 'C', 'D']);
    if (myClubs.length > 0) {
      setTournamentClubId(myClubs[0].id);
      const other = clubs.find((c) => c.id !== myClubs[0].id);
      if (other) {
        setParticipatingClubIds([other.id]);
        setTitle(`${myClubs[0].name.replace(' 파크골프 클럽', '')} vs ${other.name.replace(' 파크골프 클럽', '')} 32인 친선 대항전 ⚔️`);
      } else {
        setTitle(`${myClubs[0].name.replace(' 파크골프 클럽', '')} vs 부산 삼락 32인 친선 대항전 ⚔️`);
      }
    } else {
      const first = clubs[0]?.id;
      const second = clubs[1]?.id;
      setTournamentClubId(first || '');
      setParticipatingClubIds(second ? [second] : []);
      setTitle('구미 동락 vs 부산 삼락 32인 친선 대항전 ⚔️');
    }
    setActiveHubTab('TOURNAMENTS');
    setTournamentViewMode('CREATE');
    setShowCreateModal(true);
  };

  // [🏆 시·도 단위 공식 오픈 대회] 모드 개설 팝업 오픈
  const handleOpenRegionalOpenTournament = () => {
    setTournamentType('REGIONAL_OPEN');
    setRegionalScope('경상북도 구미시');
    setTitle('2026 제1회 구미시장배 파크골프 오픈 챔피언십 🏆');
    setTargetPlayers(64);
    setGroupCount(16);
    setSelectedLetters(['A', 'B', 'C', 'D']);
    setTournamentClubId('');
    setActiveHubTab('TOURNAMENTS');
    setTournamentViewMode('CREATE');
    setShowCreateModal(true);
  };

  // ========================================================
  // [1촌 번개 & 클럽 전용 번개 핸들러]
  // ========================================================
  // 1촌 번개방 개설 (4인 번개 vs 4인 이상 무제한 번개)
  const handleCreate1ChonLightningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const course = allCourses.find((c) => c.id === ltnCourseId) || allCourses[0];
    const newLtn = CompanionStorage.createLightningRound({
      courseId: course.id,
      courseName: course.name,
      dateStr: ltnDateStr,
      timeStr: ltnTimeStr,
      lightningScope: ltnLightningScope,
      targetPlayersCount: ltnLightningScope === 'MULTI_OPEN' ? 999 : 4,
      notes: ltnNotes.trim(),
      invited1ChonNames: ltnInvited1Chons.length > 0 ? ltnInvited1Chons : undefined,
    });
    setLightningRounds(CompanionStorage.getLightningRounds());
    setShowCreate1ChonModal(false);
    const modeName = ltnLightningScope === 'MULTI_OPEN' ? '4인 이상 무제한 번개' : '4인 번개 (2인 이상 출발)';
    showToast(`⚡ '${course.name}' 1촌 ${modeName}방이 개설되었습니다! 2인 이상 모이면 즉시 출발할 수 있습니다.`);
  };

  // 1촌 번개 수락(Accept)
  const handleAccept1ChonLightning = (roundId: string) => {
    const success = CompanionStorage.acceptLightningRound(roundId);
    if (success) {
      setLightningRounds(CompanionStorage.getLightningRounds());
      showToast(`✋ 1촌 번개 참가를 '수락'하셨습니다! 2인 이상 모이면 방장이 언제든 라운드를 시작할 수 있습니다.`);
    } else {
      showToast(`이미 정원이 마감되었거나 수락에 실패했습니다.`);
    }
  };

  // 1촌 번개 수락 취소 / 불참
  const handleCancel1ChonLightning = (roundId: string) => {
    CompanionStorage.cancelAcceptLightningRound(roundId);
    setLightningRounds(CompanionStorage.getLightningRounds());
    showToast(`1촌 번개 참가를 취소하였습니다.`);
  };

  // 1촌 번개 수락 완료 시 스코어보드 / 전광판 바로 시작 (10인 등 다인원 또는 4인 이하 지원)
  const handleStart1ChonRound = (round: CompanionLightningRound) => {
    const rawPlayerList = round.acceptedPlayers && round.acceptedPlayers.length > 0
      ? round.acceptedPlayers
      : round.currentPlayers;

    // 4인 이하일 때는 간편 스코어카드로 시작
    if (rawPlayerList.length <= 4) {
      const names = rawPlayerList.map((p) => p.name).join(',');
      router.push(`/score/quick?courseId=${round.courseId}&players=${encodeURIComponent(names)}`);
      return;
    }

    // 5인 이상 다인원 (10인, 100인 등):
    // 1) 방장 1조 조장 고정: 방장을 맨 앞으로 이동하여 1조 1번(1조 조장)으로 배치
    const hostName = round.hostName || ParkOnStorage.getUserDisplayName();
    const hostIdx = rawPlayerList.findIndex((p) => p.name === hostName || (p as any).isHost);
    let playerList = [...rawPlayerList];
    if (hostIdx > 0) {
      const [hostPlayer] = playerList.splice(hostIdx, 1);
      playerList.unshift(hostPlayer);
    }

    // 2) 2~N개 조 자동 균등 편성 (조당 3~4명)
    const groupCount = Math.max(2, Math.ceil(playerList.length / 4));
    const letters = ['A', 'B'];
    const groups: ClubGroup[] = [];

    for (let i = 1; i <= groupCount; i++) {
      const courseLetter = letters[(i - 1) % letters.length];
      groups.push({
        groupNumber: i,
        name: `${i}조`,
        startCourseLetter: courseLetter,
        leaderName: '',
        players: [],
        status: 'WAITING',
      });
    }

    playerList.forEach((p, idx) => {
      const gIdx = idx % groupCount;
      const isLeader = groups[gIdx].players.length === 0;
      if (isLeader) groups[gIdx].leaderName = p.name;
      groups[gIdx].players.push({
        id: p.id || `p_${Date.now()}_${idx}`,
        name: p.name,
        isLeader,
        scores: {},
        totalStrokes: 0,
        parDiff: 0,
        holesCompleted: 0,
      });
    });

    const newRoom: ClubEventRoom = {
      id: `chon-flash-${Date.now()}`,
      tournamentType: 'CLUB_INTERNAL',
      title: `⚡ [1촌번개] ${round.hostName}의 1촌 ${playerList.length}인 단체 라운드`,
      courseId: round.courseId,
      courseName: round.courseName,
      hostName: round.hostName,
      selectedCourseLetters: letters,
      totalHoles: 18,
      targetTotalPlayers: playerList.length,
      gameMode: 'NEW_PERIO',
      gameModeTitle: '신페리오 방식 (핸디캡 적용)',
      gameRuleNotes: '1촌 단체 번개 라운드 (실시간 조별 전광판 및 조 편성)',
      groups,
      status: 'PLAYING',
      createdAt: new Date().toISOString().split('T')[0],
    };

    // 조 편성 미리보기 및 현장 자리 맞바꾸기(Swap) 모달 열기
    setPreviewRoom(newRoom);
    setSelectedSwapPlayer(null);
    showToast(`🎯 총 ${groups.length}개 조가 자동 편성되었습니다. 자리 맞바꾸기 확인 후 시작하세요!`);
  };

  // 1촌 번개 카톡 공유
  const handleShare1ChonLightningKakao = async (round: CompanionLightningRound) => {
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/club?hub=FLASH&ltnId=${round.id}`
      : `https://parkongolf.com/club?hub=FLASH&ltnId=${round.id}`;
    const acceptedCount = (round.acceptedPlayers || round.currentPlayers).length;
    const isMultiOpen = round.lightningScope === 'MULTI_OPEN' || round.targetPlayersCount >= 999;
    const capacityText = isMultiOpen
      ? `4인 이상 인원 무제한 (현재 ${acceptedCount}명 수락, 2인 이상 출발 가능)`
      : `4인 번개 (현재 ${acceptedCount}/4명 수락, 2인 이상 출발 가능)`;

    const text = `⚡ [파크온 1촌 번개 호출]
⛳ 장소: ${round.courseName}
📅 일시: ${round.dateStr} ${round.timeStr}
👥 모집: ${capacityText}
💬 메시지: "${round.notes}"

👇 아래 링크를 눌러 1촌 번개 참가 [수락하기 ✋]를 눌러주세요!
${shareUrl}`;

    await copyTextToClipboard(text);
    showToast(`📋 1촌 번개 카톡 안내문이 복사되었습니다! 1촌 단톡방에 공유하세요.`);
  };

  // 클럽원 전용 번개 개설 (4인 번개 vs 4인 이상 무제한 번개)
  const handleCreateClubFlashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const club = clubs.find((c) => c.id === selectedFlashClubId);
    const course = allCourses.find((c) => c.id === clubFlashCourseId) || allCourses[0];
    const selfName = ParkOnStorage.getUserDisplayName(selectedFlashClubId);
    const scope = clubFlashLightningScope;

    ClubStorage.createFlashGathering({
      title: clubFlashTitle.trim() || (scope === 'MULTI_OPEN' ? `${course.name} 4인 이상 번개 라운드` : `${course.name} 4인 번개 라운드`),
      type: 'CLUB_ONLY',
      clubId: club?.id,
      clubName: club?.name,
      courseId: course.id,
      courseName: course.name,
      playDate: clubFlashDate,
      playTime: clubFlashTime,
      lightningScope: scope,
      targetCount: scope === 'MULTI_OPEN' ? 999 : 4,
      hostName: selfName,
      notes: clubFlashNotes.trim(),
    });

    setFlashGatherings(ClubStorage.getAllFlashGatherings());
    setShowCreateClubFlashModal(false);
    const modeName = scope === 'MULTI_OPEN' ? '4인 이상 무제한 번개' : '4인 번개 (2인 이상 출발)';
    showToast(`⚡ '${club?.name || '클럽'}' 전용 ${modeName}가 개설되었습니다!`);
  };

  // 클럽 번개 참가 신청
  const handleJoinClubFlash = (flashId: string) => {
    const selfName = ParkOnStorage.getUserDisplayName(selectedFlashClubId);
    const res = ClubStorage.joinFlashGathering(flashId, selfName);
    if (res.success) {
      setFlashGatherings(ClubStorage.getAllFlashGatherings());
      if (res.isWaitlist) {
        showToast(`정원 마감으로 대기 ${res.waitNumber}번으로 등록되었습니다!`);
      } else {
        showToast(`🎉 클럽 번개 참가가 확정되었습니다!`);
      }
    }
  };

  // 클럽 번개 참가 취소
  const handleLeaveClubFlash = (flashId: string) => {
    const selfName = ParkOnStorage.getUserDisplayName(selectedFlashClubId);
    ClubStorage.leaveFlashGathering(flashId, selfName);
    setFlashGatherings(ClubStorage.getAllFlashGatherings());
    showToast(`클럽 번개 참가 신청을 취소하였습니다.`);
  };

  // 클럽 번개 라운드 시작 (4인 이하는 간편 스코어카드, 5인 이상은 조 편성 미리보기 & 전광판)
  const handleStartClubFlashRound = (flash: FlashGathering) => {
    const rawParticipants = flash.currentParticipants;
    if (rawParticipants.length === 0) return;

    if (rawParticipants.length <= 4) {
      const names = rawParticipants.map((p) => p.name).join(',');
      router.push(`/score/quick?courseId=${flash.courseId}&players=${encodeURIComponent(names)}`);
      return;
    }

    // 5인 이상 다인원 (10인, 100인 등):
    // 1) 방장 1조 조장 고정: 방장을 맨 앞으로 이동하여 1조 1번(1조 조장)으로 배치
    const hostName = flash.hostName || ParkOnStorage.getUserDisplayName();
    const hostIdx = rawParticipants.findIndex((p) => p.name === hostName);
    let participants = [...rawParticipants];
    if (hostIdx > 0) {
      const [hostPlayer] = participants.splice(hostIdx, 1);
      participants.unshift(hostPlayer);
    }

    // 2) 2~N개 조 이상으로 자동 균등 편성 (조당 3~4명)
    const groupCount = Math.max(2, Math.ceil(participants.length / 4));
    const letters = ['A', 'B'];
    const groups: ClubGroup[] = [];

    for (let i = 1; i <= groupCount; i++) {
      const courseLetter = letters[(i - 1) % letters.length];
      groups.push({
        groupNumber: i,
        name: `${i}조`,
        startCourseLetter: courseLetter,
        leaderName: '',
        players: [],
        status: 'WAITING',
      });
    }

    participants.forEach((p, idx) => {
      const gIdx = idx % groupCount;
      const isLeader = groups[gIdx].players.length === 0;
      if (isLeader) groups[gIdx].leaderName = p.name;
      groups[gIdx].players.push({
        id: p.id || `p_${Date.now()}_${idx}`,
        name: p.name,
        isLeader,
        scores: {},
        totalStrokes: 0,
        parDiff: 0,
        holesCompleted: 0,
      });
    });

    const newRoom: ClubEventRoom = {
      id: `club-flash-${Date.now()}`,
      clubId: flash.clubId,
      clubName: flash.clubName,
      tournamentType: 'CLUB_INTERNAL',
      title: `⚡ [클럽번개] ${flash.clubName || '클럽'} ${flash.title}`,
      courseId: flash.courseId,
      courseName: flash.courseName,
      hostName: flash.hostName,
      selectedCourseLetters: letters,
      totalHoles: 18,
      targetTotalPlayers: participants.length,
      gameMode: 'NEW_PERIO',
      gameModeTitle: '신페리오 방식 (핸디캡 적용)',
      gameRuleNotes: `${participants.length}인 클럽 번개 라운드 (실시간 조별 전광판 및 순위)`,
      groups,
      status: 'PLAYING',
      createdAt: new Date().toISOString().split('T')[0],
    };

    // 조 편성 미리보기 및 현장 자리 맞바꾸기(Swap) 모달 열기
    setPreviewRoom(newRoom);
    setSelectedSwapPlayer(null);
    showToast(`🎯 총 ${groups.length}개 조가 자동 편성되었습니다. 자리 맞바꾸기 확인 후 시작하세요!`);
  };

  // 번개 조원 현장 맞바꾸기(Swap) 핸들러
  const handlePlayerSwapClick = (groupIndex: number, playerIndex: number) => {
    if (!previewRoom) return;
    const targetPlayer = previewRoom.groups[groupIndex]?.players[playerIndex];
    if (!targetPlayer) return;

    if (!selectedSwapPlayer) {
      // 1단계: 첫 번째 선수 선택
      setSelectedSwapPlayer({
        groupIndex,
        playerIndex,
        playerId: targetPlayer.id,
        playerName: targetPlayer.name,
      });
      showToast(`'${targetPlayer.name}' 선택됨. 맞바꿀 다른 선수를 터치하세요.`);
      return;
    }

    // 동일 인물 재선택 시 선택 취소
    if (selectedSwapPlayer.groupIndex === groupIndex && selectedSwapPlayer.playerIndex === playerIndex) {
      setSelectedSwapPlayer(null);
      showToast(`선택을 취소하였습니다.`);
      return;
    }

    // 2단계: 두 선수 자리 맞바꾸기
    const updatedGroups = previewRoom.groups.map((g) => ({
      ...g,
      players: [...g.players],
    }));

    const sourceGroup = updatedGroups[selectedSwapPlayer.groupIndex];
    const targetGroup = updatedGroups[groupIndex];

    const sourcePlayer = sourceGroup.players[selectedSwapPlayer.playerIndex];
    const targetPlayerObj = targetGroup.players[playerIndex];

    sourceGroup.players[selectedSwapPlayer.playerIndex] = targetPlayerObj;
    targetGroup.players[playerIndex] = sourcePlayer;

    // 조장 재산정: 각 조의 1번 선수(인덱스 0)를 조장으로 설정
    [sourceGroup, targetGroup].forEach((grp) => {
      grp.players.forEach((p, pIdx) => {
        p.isLeader = pIdx === 0;
      });
      if (grp.players[0]) {
        grp.leaderName = grp.players[0].name;
      }
    });

    setPreviewRoom({
      ...previewRoom,
      groups: updatedGroups,
    });
    setSelectedSwapPlayer(null);
    showToast(`🔄 '${sourcePlayer.name}' ↔ '${targetPlayerObj.name}' 조 맞바꾸기 완료!`);
  };

  // 번개 조 편성 카카오톡 단톡방 공유 복사
  const handleSharePreviewRoomKakao = async () => {
    if (!previewRoom) return;
    const text = ClubStorage.generateGroupFormationKakaoShareText(previewRoom);
    await copyTextToClipboard(text);
    showToast(`📋 전체 조 편성 카톡 공지문이 복사되었습니다! 단톡방에 붙여넣기 하세요.`);
  };

  // 조 편성 확정 및 실시간 전광판 룸 시작
  const handleConfirmAndStartRound = () => {
    if (!previewRoom) return;
    ClubStorage.saveRoom(previewRoom);
    showToast(`⛳ 조 편성이 확정되었습니다! 실시간 전광판으로 입장합니다.`);
    const roomId = previewRoom.id;
    setPreviewRoom(null);
    setSelectedSwapPlayer(null);
    router.push(`/club/${roomId}`);
  };

  // 클럽 번개 카톡 공유
  const handleShareClubFlashKakao = async (flash: FlashGathering) => {
    const text = ClubStorage.generateFlashKakaoShareText(flash);
    await copyTextToClipboard(text);
    showToast(`📋 카카오톡 클럽방 공유 안내문이 복사되었습니다! 클럽 단톡방에 붙여넣기 하세요.`);
  };

  // ========================================================
  // [클럽 창단 & 가입 핸들러]
  // ========================================================
  const handleCreateClubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim()) {
      alert('클럽 이름을 입력해 주세요.');
      return;
    }
    const homeCourse = allCourses.find((c) => c.id === newClubHomeCourseId) || allCourses[0];
    const created = ClubStorage.createClub({
      name: newClubName.trim(),
      region: newClubRegion.trim() || homeCourse.region,
      homeCourseId: homeCourse.id,
      homeCourseName: homeCourse.name,
      description: newClubDesc.trim() || `${homeCourse.name}를 중심으로 활동하는 친목 클럽입니다.`,
      presidentName: newClubPresident.trim() || '회장',
      managerName: newClubManager.trim() || '총무(본인)',
      contactPhone: newClubPhone.trim(),
      isPublic: true,
      badgeColor: 'emerald',
    });

    refreshAllData();
    setShowCreateClubModal(false);
    showToast(`🎉 '${created.name}' 클럽이 창단되었습니다!`);
  };

  const handleJoinClub = (club: ParkGolfClub) => {
    const selfName = getDefaultSelfName();
    ClubStorage.joinClub(club.id, selfName);
    refreshAllData();
    showToast(`🎉 '${club.name}'에 가입되었습니다!`);
  };

  const handleLeaveClub = (club: ParkGolfClub) => {
    const selfName = getDefaultSelfName();
    const isExecutive =
      club.managerName.includes(selfName) ||
      club.presidentName.includes(selfName) ||
      club.managerName.includes('김대희') ||
      club.presidentName.includes('김대희');

    const confirmMsg = isExecutive
      ? `[클럽 관리자 나가기 확인]\n'${club.name}'에서 나가시겠습니까?\n\n확인 시 내 소속 클럽 목록에서 즉시 제외되며, 관리 권한이 정리됩니다.`
      : `[클럽 탈퇴 확인]\n정말 '${club.name}'에서 탈퇴(나가기)하시겠습니까?\n\n내 소속 클럽 목록에서 즉시 제외됩니다.`;

    if (confirm(confirmMsg)) {
      ClubStorage.leaveClub(club.id, selfName);
      refreshAllData();
      if (managingClub?.id === club.id) setManagingClub(null);
      showToast(`'${club.name}' 클럽에서 탈퇴(나가기) 완료되었습니다.`);
    }
  };

  // 초청 수락 및 거절 핸들러
  const handleAcceptInvite = (invitationId: string, clubName: string) => {
    const selfName = getDefaultSelfName();
    const success = ClubStorage.acceptClubInvitation(invitationId, selfName);
    if (success) {
      refreshAllData();
      showToast(`🎉 '${clubName}' 초청을 수락하여 가입 완료되었습니다!`);
    }
  };

  const handleRejectInvite = (invitationId: string, clubName: string) => {
    if (confirm(`'${clubName}' 클럽 초청을 거절하시겠습니까?`)) {
      ClubStorage.rejectClubInvitation(invitationId);
      refreshAllData();
      showToast(`'${clubName}' 클럽 초청을 사양했습니다.`);
    }
  };

  // 가입 승인 (수락 -> 정회원으로 등록)
  const handleApproveMember = (clubId: string, pendingId: string, applicantName: string) => {
    const success = ClubStorage.approveMember(clubId, pendingId);
    if (success) {
      refreshAllData();
      const updated = ClubStorage.getClubById(clubId);
      if (updated && managingClub?.id === clubId) {
        setManagingClub(updated);
      }
      showToast(`🎉 ${applicantName}님이 정회원으로 가입 승인되었습니다!`);
    }
  };

  // 가입 거절
  const handleRejectMember = (clubId: string, pendingId: string, applicantName: string) => {
    if (confirm(`${applicantName}님의 가입 신청을 거절하시겠습니까?`)) {
      ClubStorage.rejectMember(clubId, pendingId);
      refreshAllData();
      const updated = ClubStorage.getClubById(clubId);
      if (updated && managingClub?.id === clubId) {
        setManagingClub(updated);
      }
      showToast(`${applicantName}님의 가입 신청이 거절되었습니다.`);
    }
  };

  // 카카오톡 클럽 가입 초청장 복사
  const handleCopyClubInvite = async (e: React.MouseEvent, club: ParkGolfClub) => {
    e.stopPropagation();
    const text = ClubStorage.generateClubInviteText(club);
    const success = await copyTextToClipboard(text);

    // 버튼 인플레이스 시각 피드백 (3초간 복사 완료 표시)
    setCopiedClubId(club.id);
    setTimeout(() => setCopiedClubId(null), 3000);

    // 하단 플로팅 토스트 표시
    showToast(
      success
        ? `✅ '${club.name}' 카톡 초청장이 복사되었습니다! 카톡에 붙여넣기 하세요.`
        : `📢 '${club.name}' 초청장이 열렸습니다. 아래 창에서 문구를 확인하고 공유하세요.`
    );

    // 초청장 전문 미리보기 및 카카오톡 바로 전송 모달 오픈
    setInviteModalClub(club);
  };

  // 클럽 가입 신청서 제출
  const handleSubmitJoinApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingClub) return;
    if (!applicantName.trim()) {
      alert('성함을 입력해 주세요.');
      return;
    }
    ClubStorage.requestJoinClub(applyingClub.id, {
      name: applicantName.trim(),
      phone: applicantPhone.trim(),
      message: applicantMessage.trim(),
    });
    refreshAllData();
    const appliedClubName = applyingClub.name;
    setApplyingClub(null);
    setShowClubBrowseModal(false);
    showToast(`📨 '${appliedClubName}'에 가입 신청이 완료되었습니다. 총무님 승인 후 정회원으로 등록됩니다.`);
  };

  // 초청장 링크로 즉시 가입
  const handleDirectJoinByInvite = (club: ParkGolfClub) => {
    ClubStorage.directJoinViaInvite(club.id, {
      name: '홍길동(본인)',
      phone: '010-1234-5678',
    });
    refreshAllData();
    setShowClubBrowseModal(false);
    showToast(`🎉 '${club.name}'에 즉시 정회원으로 가입되었습니다!`);
  };

  // ========================================================
  // [클럽 기반 공식 대회/월례회 개설 핸들러]
  // ========================================================
  const handleCreateTournamentForClub = (club: ParkGolfClub) => {
    setTournamentClubId(club.id);
    setSelectedCourseId(club.homeCourseId);
    setTitle(`[${club.name}] 정기 월례회`);
    setActiveHubTab('TOURNAMENTS');
    setShowCreateModal(true);
    showToast(`🏆 '${club.name}' 공식 대회/월례회 개설 화면으로 이동했습니다.`);
  };

  // 카카오톡 초대장 복사
  const handleCopyInvite = async (e: React.MouseEvent, room: ClubEventRoom) => {
    e.stopPropagation();
    const text = ClubStorage.generateKakaoShareText(room);
    await copyTextToClipboard(text);
    setCopiedRoomId(room.id);
    setTimeout(() => setCopiedRoomId(null), 3000);
    showToast(`📢 '${room.title}' 카톡 초대장이 복사되었습니다! 카톡에 붙여넣기 하세요.`);
  };

  // 모임 방 정보 수정 모달 열기
  const handleOpenEditModal = (room: ClubEventRoom) => {
    setEditingRoom(room);
    setEditTitle(room.title);
    setEditHostName(room.hostName);
    setEditTargetPlayers(room.targetTotalPlayers || room.groups.length * 4);
    setEditStatus(room.status || 'PLAYING');
    setEditEntryFee(typeof room.entryFee === 'number' ? room.entryFee : 10000);
    setEditBankAccount(room.bankAccount || '');
    setEditGameMode(room.gameMode || 'NEW_PERIO');
    setEditGameRuleNotes(room.gameRuleNotes || '');
  };

  // 모임 방 정보 수정 저장
  const handleSaveRoomEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    const updated = ClubStorage.updateRoom(editingRoom.id, {
      title: editTitle.trim() || editingRoom.title,
      hostName: editHostName.trim() || editingRoom.hostName,
      targetTotalPlayers: editTargetPlayers,
      status: editStatus,
      entryFee: Number(editEntryFee) || 0,
      bankAccount: editBankAccount.trim(),
      gameMode: editGameMode,
      gameRuleNotes: editGameRuleNotes.trim(),
    });
    if (updated) {
      refreshAllData();
      showToast(`'${updated.title}' 모임 정보가 수정되었습니다.`);
    }
    setEditingRoom(null);
  };

  // 모임 방 삭제 확정
  const handleConfirmDelete = () => {
    if (!roomToDelete) return;
    const delTitle = roomToDelete.title;
    ClubStorage.deleteRoom(roomToDelete.id);
    refreshAllData();
    setRoomToDelete(null);
    showToast(`'${delTitle}' 모임 방이 삭제되었습니다.`);
  };

  // 내 가입 클럽 목록 필터링
  const myClubs = clubs.filter((c) => myClubIds.includes(c.id));
  const otherClubs = clubs.filter((c) => !myClubIds.includes(c.id));

  return (
    <div className="p-3 max-w-xl mx-auto space-y-3 pb-12">
      {/* 1. 상단 네비게이션 헤더 */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3 shadow-xs border border-stone-200">
        <Link
          href="/"
          className="flex items-center gap-1 text-xs font-black text-stone-700 hover:text-stone-900 transition active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>홈으로</span>
        </Link>
        <div className="text-center">
          <h1 className="font-black text-sm text-stone-900 flex items-center justify-center gap-1.5">
            <Users className="w-4 h-4 text-purple-700" />
            <span>클럽 &amp; 대회 운영 센터</span>
          </h1>
          <p className="text-[10px] text-stone-500 font-bold">
            전국 파크골프 클럽 관리 · 공식 정기 월례회 &amp; 샷건 대회 운영 OS
          </p>
        </div>
        <div className="w-12" />
      </div>

      {/* 안내 토스트 피드백 (스크롤 위치와 상관없이 화면 하단에 항상 고정 플로팅) */}
      {toastMessage && (
        <div className="fixed bottom-6 inset-x-4 max-w-sm mx-auto z-[9999] bg-stone-950/95 backdrop-blur-sm text-white text-xs font-black p-4 rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="leading-snug">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white font-bold ml-2 text-sm cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3대 핵심 허브 가이드 배너 */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-950 via-purple-950 to-stone-900 border-2 border-emerald-400/40 rounded-2xl shadow-sm text-white flex items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="text-xl shrink-0 mt-0.5">⛳</span>
          <div className="space-y-0.5">
            <h2 className="text-xs font-black text-amber-300">
              파크온 3대 소셜 &amp; 대회 통합 관제 센터
            </h2>
            <p className="text-[11px] text-stone-300 leading-snug">
              <strong className="text-emerald-300">[내 클럽 바로가기]</strong>에서 소속 클럽 관리,{' '}
              <strong className="text-purple-300">[새 대회 개설]</strong>에서 클럽 대항전 &amp; 시·도 공식대회 주최,{' '}
              <strong className="text-amber-300">[번개 모임 갖기]</strong>에서 1촌 및 클럽원 전용 번개를 즐기세요!
            </p>
          </div>
        </div>
      </div>

      {/* 2. 클럽 & 대회 & 번개 3대 핵심 탭 (대표님 요청 명칭 반영) */}
      <section className="bg-white p-1.5 rounded-2xl border-2 border-stone-200 shadow-sm grid grid-cols-4 gap-1">
        {/* 탭 1: 내 클럽 바로가기 */}
        <button
          type="button"
          onClick={() => setActiveHubTab('CLUBS')}
          className={`py-2.5 px-0.5 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
            activeHubTab === 'CLUBS'
              ? 'bg-gradient-to-b from-emerald-600 to-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-400/40'
              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
          }`}
        >
          <Building2 className={`w-4 h-4 ${activeHubTab === 'CLUBS' ? 'text-amber-300' : 'text-emerald-700'}`} />
          <span className="whitespace-nowrap font-extrabold text-[11px]">내 클럽</span>
          <span
            className={`text-[9px] px-1 py-0.2 rounded-full font-bold ${
              activeHubTab === 'CLUBS' ? 'bg-emerald-950 text-amber-300' : 'bg-stone-200 text-stone-600'
            }`}
          >
            {myClubs.length}개 소속
          </span>
        </button>

        {/* 탭 2: 새 대회 개설 */}
        <button
          type="button"
          onClick={() => setActiveHubTab('TOURNAMENTS')}
          className={`py-2.5 px-0.5 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
            activeHubTab === 'TOURNAMENTS'
              ? 'bg-gradient-to-b from-purple-700 to-purple-900 text-white border-purple-950 shadow-md ring-2 ring-purple-400/40'
              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
          }`}
        >
          <Swords className={`w-4 h-4 ${activeHubTab === 'TOURNAMENTS' ? 'text-yellow-300' : 'text-purple-700'}`} />
          <span className="whitespace-nowrap font-extrabold text-[11px]">새 대회</span>
          <span
            className={`text-[9px] px-1 py-0.2 rounded-full font-bold ${
              activeHubTab === 'TOURNAMENTS' ? 'bg-purple-950 text-yellow-300' : 'bg-stone-200 text-stone-600'
            }`}
          >
            대항전·시도
          </span>
        </button>

        {/* 탭 3: 번개 모임 갖기 */}
        <button
          type="button"
          onClick={() => setActiveHubTab('FLASH')}
          className={`py-2.5 px-0.5 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
            activeHubTab === 'FLASH'
              ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-stone-950 border-amber-800 shadow-md ring-2 ring-amber-300/60'
              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
          }`}
        >
          <Zap className={`w-4 h-4 ${activeHubTab === 'FLASH' ? 'text-stone-950 fill-stone-950' : 'text-amber-600'}`} />
          <span className="whitespace-nowrap font-extrabold text-[11px]">번개 모임</span>
          <span
            className={`text-[9px] px-1 py-0.2 rounded-full font-black ${
              activeHubTab === 'FLASH' ? 'bg-amber-950 text-amber-300' : 'bg-stone-200 text-stone-600'
            }`}
          >
            1촌·동호인
          </span>
        </button>

        {/* 탭 4: 게시판 & 파크골프 뉴스 바로가기 */}
        <Link
          href="/board"
          className="py-2.5 px-0.5 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border bg-gradient-to-b from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-950 border-purple-300 shadow-xs"
        >
          <div className="relative">
            <Newspaper className="w-4 h-4 text-purple-700" />
            <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <span className="whitespace-nowrap font-extrabold text-[11px] text-purple-950">게시판·뉴스</span>
          <span className="text-[9px] px-1 py-0.2 rounded-full font-black bg-purple-200 text-purple-900">
            공고·신문고
          </span>
        </Link>
      </section>

      {/* ========================================================================= */}
      {/* 탭 1: [클럽 바로가기] (내 클럽 목록, 새 클럽 창단, 전국 클럽 탐색 및 가입) */}
      {/* ========================================================================= */}
      {activeHubTab === 'CLUBS' && (
        <div className="space-y-3 animate-fadeIn">
          {/* 상단 액션 배너 */}
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 text-white rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  🏛️ 클럽 커뮤니티
                </span>
                <h2 className="text-base font-black mt-1">내가 가입한 파크골프 클럽</h2>
                <p className="text-xs text-emerald-200 mt-0.5">
                  소속 클럽에서 대회 주최, 회원 명부 관리, 실시간 번개 모임을 즐기세요!
                </p>
              </div>
            </div>

            {/* 대표님 요청: 상단 새 클럽 창단하기 & 클럽 찾아보기 2대 핵심 버튼 */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreateClubModal(true)}
                className="bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black px-3 py-2.5 rounded-xl text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ 새 클럽 창단하기</span>
              </button>

              <button
                type="button"
                onClick={() => setShowClubBrowseModal(true)}
                className="bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-400/60 font-black px-3 py-2.5 rounded-xl text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search className="w-4 h-4 text-amber-300" />
                <span>🔍 클럽 찾아보기 (가입)</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* [NEW] 도착한 클럽 가입 초청장 섹션 (초청 수락 및 거절) */}
          {/* ======================================================== */}
          {clubInvitations.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-2xl p-4 border-2 border-amber-400 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-sm shadow-xs">
                    📨
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-sm text-stone-900">
                        도착한 클럽 가입 초청장
                      </h3>
                      <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                        {clubInvitations.length}건
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 font-bold mt-0.5">
                      클럽 집행부로부터 정회원 가입 초청을 받았습니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-0.5">
                {clubInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-white rounded-xl p-3.5 border border-amber-300/80 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-amber-100 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                            초청장
                          </span>
                          <span className="text-[11px] text-stone-500 font-bold">
                            {inv.createdAt}
                          </span>
                        </div>
                        <h4 className="font-black text-sm text-stone-900 mt-1">
                          {inv.clubName}
                        </h4>
                        <p className="text-xs text-stone-500 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                          <span>
                            {inv.region} · {inv.homeCourseName}
                          </span>
                        </p>
                        <p className="text-xs text-emerald-800 font-bold mt-1">
                          초청자: {inv.inviterName}
                        </p>
                      </div>
                    </div>

                    {inv.message && (
                      <p className="text-xs text-stone-700 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 leading-relaxed font-medium">
                        💬 &ldquo;{inv.message}&rdquo;
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAcceptInvite(inv.id, inv.clubName)}
                        className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>🤝 초청 수락 (가입)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectInvite(inv.id, inv.clubName)}
                        className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-bold text-xs rounded-xl border border-stone-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4 text-stone-500" />
                        <span>정중히 거절</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 내 소속 클럽 카드 리스트 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-black text-stone-800 px-1">
              <span>내 소속 클럽 ({myClubs.length}곳 가입됨)</span>
              <span className="text-[11px] text-stone-500 font-bold">
                권한: 회장/총무(관리·대회) · 일반 회원(번개·명부)
              </span>
            </div>

            {myClubs.length === 0 && (
              <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center space-y-2">
                <p className="text-xs text-stone-500 font-bold">가입된 클럽이 없습니다.</p>
                <button
                  type="button"
                  onClick={() => setShowClubBrowseModal(true)}
                  className="px-4 py-2 bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  전국 클럽 찾아보고 가입 신청하기
                </button>
              </div>
            )}

            {myClubs.map((club) => {
              const selfName = (ParkOnStorage.getUserDisplayName(club.id) || ParkOnStorage.getUserDisplayName()).trim();
              const myMemberInfo =
                club.members.find(
                  (m) =>
                    m.name.trim() === selfName ||
                    m.name.includes('(본인)') ||
                    m.name === '김대희' ||
                    m.id === 'm1'
                ) || club.members[0];

              const isManager =
                myMemberInfo?.role === 'MANAGER' ||
                club.managerName.includes(selfName) ||
                club.managerName.includes('김대희') ||
                club.managerName.includes('본인');
              const isPresident =
                myMemberInfo?.role === 'PRESIDENT' || club.presidentName.includes(selfName);
              const isExecutive = isManager || isPresident;
              const pendingCount = club.pendingMembers?.length || 0;

              return (
                <div
                  key={club.id}
                  className={`bg-white rounded-2xl p-4 border-2 shadow-sm space-y-3 transition ${
                    isExecutive ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-stone-200'
                  }`}
                >
                  {/* 상단 뱃지 및 기본 정보 */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          내 소속 클럽
                        </span>
                        {isManager ? (
                          <span className="bg-amber-100 text-amber-950 border border-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>👑</span>
                            <span>총무 (본인 관리 권한)</span>
                          </span>
                        ) : isPresident ? (
                          <span className="bg-purple-100 text-purple-950 border border-purple-400 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>🎖️</span>
                            <span>회장 / 임원 (본인)</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>⛳</span>
                            <span>정회원 (본인)</span>
                          </span>
                        )}
                        <span className="text-[11px] text-stone-500 font-bold">
                          회원 {club.memberCount}명
                        </span>
                        {isExecutive && pendingCount > 0 && (
                          <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                            가입 승인 대기 {pendingCount}명!
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-base text-stone-900 mt-1 leading-snug">
                        {club.name}
                      </h3>
                      <p className="text-xs text-stone-500 font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        <span>
                          {club.region} · {club.homeCourseName}
                        </span>
                      </p>
                    </div>

                    {isExecutive ? (
                      <button
                        type="button"
                        onClick={() => {
                          setManagingClub(club);
                          setManagingClubTab(pendingCount > 0 ? 'PENDING' : 'MEMBERS');
                        }}
                        className="relative text-emerald-800 hover:text-emerald-950 px-2.5 py-1.5 rounded-xl text-xs font-black border-2 border-emerald-600 bg-emerald-50 cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Settings className="w-3.5 h-3.5 text-emerald-700" />
                        <span>클럽 관리</span>
                        {pendingCount > 0 && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute -top-1 -right-1 ring-2 ring-white animate-bounce" />
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleLeaveClub(club)}
                        className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-rose-200 bg-white cursor-pointer flex items-center gap-1 shrink-0 transition active:scale-95"
                        title="클럽 탈퇴 및 나가기"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>클럽 나가기</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 leading-relaxed font-medium">
                    {club.description}
                  </p>

                  {/* 클럽별 활동명 (실명 / 가명) 설정 배너 */}
                  <div className="flex items-center justify-between bg-stone-50/90 border border-stone-200 px-3 py-2 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-stone-700">
                      <span>🏷️ 이 클럽 내 활동명:</span>
                      <span className="font-black text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300">
                        {ParkOnStorage.getUserDisplayName(club.id)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAliasTargetClub(club);
                        setAliasInputName(ParkOnStorage.getUserDisplayName(club.id));
                      }}
                      className="text-xs font-black text-emerald-700 hover:text-emerald-900 underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>활동명 변경</span>
                    </button>
                  </div>

                  {/* 대표님 요청: [이 클럽 전용 번개 치기] 원클릭 바로가기 버튼 */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFlashClubId(club.id);
                        setFlashSubTab('CLUB_ONLY');
                        setActiveHubTab('FLASH');
                        showToast(`⚡ '${club.name}' 전용 번개 탭으로 이동했습니다.`);
                      }}
                      className="w-full min-h-[46px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-stone-950 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer border border-amber-600"
                    >
                      <Zap className="w-4 h-4 text-stone-950 fill-stone-950" />
                      <span>⚡ 이 클럽 전용 번개 치기 (소속 회원 전용 라운드)</span>
                    </button>
                  </div>

                  {/* 권한별 액션 버튼 영역 */}
                  <div className="space-y-2 pt-1 border-t border-stone-200">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenTournamentForClub(club)}
                        className="py-2.5 px-3 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Trophy className="w-4 h-4 text-yellow-300" />
                        <span>🏆 클럽 자체 월례회 열기</span>
                      </button>

                      {isExecutive ? (
                        <button
                          type="button"
                          onClick={() => {
                            setManagingClub(club);
                            setManagingClubTab(pendingCount > 0 ? 'PENDING' : 'MEMBERS');
                          }}
                          className={`py-2.5 px-3 active:scale-95 text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                            pendingCount > 0
                              ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          <Users className="w-4 h-4" />
                          <span>
                            회원 관리 {pendingCount > 0 ? `(대기 ${pendingCount}명)` : `(${club.memberCount}명)`}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedClubDetail(club)}
                          className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-stone-300"
                        >
                          <Users className="w-4 h-4 text-stone-600" />
                          <span>👥 회원 명부 ({club.memberCount}명)</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleCopyClubInvite(e, club)}
                        className={`py-2.5 px-3 active:scale-95 text-xs font-black rounded-xl transition flex items-center justify-center gap-1 cursor-pointer border ${
                          copiedClubId === club.id
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300 animate-pulse'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
                        }`}
                      >
                        {copiedClubId === club.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                            <span>✅ 복사 완료!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5 text-stone-700" />
                            <span>📢 초청장 복사</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLeaveClub(club)}
                        className="py-2.5 px-3 bg-white hover:bg-rose-50 active:scale-95 text-rose-700 text-xs font-black rounded-xl border border-rose-300 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        title="소속 클럽 탈퇴 및 나가기"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>🚪 클럽 나가기</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 탭 2: [새 대회 개설 센터 - 클럽 대항전 & 시·도 공식 대회] */}
      {/* ========================================================================= */}
      {activeHubTab === 'TOURNAMENTS' && (
        <div className="space-y-3 animate-fadeIn">
          {/* 대회 성격 및 규정 배너 */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-stone-900 text-white rounded-3xl p-5 shadow-md space-y-3 border-2 border-purple-500/40">
            <div className="flex items-center justify-between">
              <span className="bg-purple-500/30 text-yellow-300 border border-yellow-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Swords className="w-3.5 h-3.5 text-yellow-300" />
                <span>클럽 대항전 &amp; 시·도 공식 대회 주최 센터</span>
              </span>
              <span className="text-[11px] text-purple-200 font-bold">신페리오 · 샷건 동시 티오프</span>
            </div>
            <div>
              <h2 className="text-lg font-black leading-snug">
                단일 클럽 월례회를 넘어,<br />클럽 간 대항전 &amp; 시·도 공식 대회를 개설하세요!
              </h2>
              <p className="text-xs text-purple-100/90 mt-1.5 leading-relaxed font-medium">
                단일 클럽 내부 월례회는 <strong className="text-amber-300">[내 클럽 바로가기]</strong>에서 진행하며,{' '}
                <strong className="text-yellow-300">[새 대회 개설]</strong>은 2개 이상의 클럽 간 맞붙는{' '}
                <strong>[클럽 대항전(교류전)]</strong> 및 구미시·대구시 등 <strong>[시·도 단위 공식 오픈 대회]</strong>를 개설하고
                실시간 디지털 전광판을 송출하는 특화 공간입니다.
              </p>
            </div>

            {/* 서브 뷰 토글: 대회 개설 모드 vs 실시간 전광판 보기 */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTournamentViewMode('CREATE')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                  tournamentViewMode === 'CREATE'
                    ? 'bg-yellow-400 text-purple-950 border-yellow-300 shadow-md font-black'
                    : 'bg-purple-950/60 text-purple-200 border-purple-700/60 hover:bg-purple-900'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>대회 개설 센터</span>
              </button>
              <button
                type="button"
                onClick={() => setTournamentViewMode('LIVE_BOARD')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                  tournamentViewMode === 'LIVE_BOARD'
                    ? 'bg-yellow-400 text-purple-950 border-yellow-300 shadow-md font-black'
                    : 'bg-purple-950/60 text-purple-200 border-purple-700/60 hover:bg-purple-900'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>실시간 전광판 ({rooms.length}개 방)</span>
              </button>
            </div>
          </div>

          {/* 서브 뷰 1: 대회 개설 센터 */}
          {tournamentViewMode === 'CREATE' && (
            <div className="space-y-3">
              {/* 대표님 요청: 2대 핵심 대회 모드 카드 (클럽 대항전 vs 시·도 공식 대회) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 카드 A: [클럽 대항전 (교류전)] */}
                <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50/40 p-4 rounded-3xl border-2 border-purple-300 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-purple-700 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Swords className="w-3 h-3 text-yellow-300" />
                      <span>클럽 간 자존심 대결</span>
                    </span>
                    <span className="text-[11px] text-purple-700 font-bold">2개 이상 클럽</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-purple-950 flex items-center gap-1.5">
                      <span>⚔️ 클럽 대항전 (교류전) 개설</span>
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed font-medium">
                      우리 클럽과 상대 클럽을 지정하여 클럽 간 친선 교류전을 개최합니다.
                      클럽별 대표 선수의 스코어를 합산하여 클럽 우승을 가립니다!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenClubMatchTournament}
                    className="w-full min-h-[48px] bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white font-black text-xs rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer border border-purple-600"
                  >
                    <Swords className="w-4 h-4 text-yellow-300" />
                    <span>⚔️ 클럽 대항전 개설하기 ▶</span>
                  </button>
                </div>

                {/* 카드 B: [시·도 단위 공식 오픈 대회] */}
                <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-4 rounded-3xl border-2 border-amber-300 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-amber-600 text-stone-950 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-stone-950" />
                      <span>시·군·구·도 공식</span>
                    </span>
                    <span className="text-[11px] text-amber-800 font-bold">전체 동호인 오픈</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-950 flex items-center gap-1.5">
                      <span>🏆 시·도 공식 대회 (구미시배 등)</span>
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed font-medium">
                      구미시장배, 대구시 협회장배 등 시·도 단위 공식 대회를 주최합니다.
                      신페리오 핸디캡 산출, 샷건 티오프, 대형 실시간 전광판을 지원합니다!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenRegionalOpenTournament}
                    className="w-full min-h-[48px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer border border-amber-500"
                  >
                    <Trophy className="w-4 h-4 text-stone-950" />
                    <span>🏆 시·도 단위 공식대회 개설하기 ▶</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* 개설된 대회 목록 및 실시간 전광판 */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between text-xs font-black text-stone-800 px-1">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>개설된 대회 전광판 목록 ({rooms.length}개)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setTournamentViewMode('CREATE');
                  setShowCreateModal(true);
                }}
                className="text-purple-700 hover:text-purple-900 font-black text-xs cursor-pointer flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 대회 개설</span>
              </button>
            </div>

            {rooms.length === 0 && (
              <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <Swords className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-base text-stone-900">개설된 대회가 없습니다</h3>
                  <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                    클럽 간 대항전이나 시·도 공식 대회를 개설하여 회원들을 초대해보세요!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTournamentViewMode('CREATE');
                    setShowCreateModal(true);
                  }}
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black rounded-xl shadow-sm transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-purple-300" />
                  <span>새 대회 개설하기</span>
                </button>
              </div>
            )}

            {rooms.map((room) => {
              const totalPlayers = room.groups.reduce((sum, g) => sum + g.players.length, 0);
              const targetCapacity = room.targetTotalPlayers || room.groups.length * 4 || 16;
              const percent = Math.min(100, Math.round((totalPlayers / targetCapacity) * 100));

              return (
                <div
                  key={room.id}
                  className={`bg-white rounded-2xl p-4 border shadow-sm space-y-3 transition ${
                    room.id === justCreatedId
                      ? 'border-purple-600 ring-2 ring-purple-200 bg-purple-50/20'
                      : 'border-stone-200 hover:border-purple-300'
                  }`}
                >
                  {/* 상단: 타이틀 & 상태 뱃지 & 액션 버튼 */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {room.tournamentType === 'CLUB_MATCH' ? (
                          <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Swords className="w-3 h-3 text-purple-700" />
                            <span>클럽 대항전</span>
                          </span>
                        ) : room.tournamentType === 'REGIONAL_OPEN' ? (
                          <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-amber-700" />
                            <span>시·도 공식대회</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>🏅 클럽 정기월례회</span>
                          </span>
                        )}

                        {room.clubName && (
                          <span className="bg-stone-100 text-stone-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                            🏛️ {room.clubName}
                          </span>
                        )}

                        <span className="bg-purple-50 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {room.groups.length}개 조 ({targetCapacity}인 규모)
                        </span>

                        {room.status === 'FINISHED' ? (
                          <span className="bg-stone-200 text-stone-700 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            🏁 경기 종료
                          </span>
                        ) : room.status === 'RECRUITING' ? (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            ⏳ 참가 접수 중
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            실시간 라운드 중
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-base text-stone-900 mt-1 leading-snug">
                        {room.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleCopyInvite(e, room)}
                        className="p-2 text-stone-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition cursor-pointer"
                        title="카톡 초대장 복사"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(room)}
                        className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                        title="모임 방 설정 수정"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoomToDelete(room)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        title="모임 방 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 정보 요약 */}
                  <div className="flex items-center justify-between text-xs text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <span className="flex items-center gap-1 font-bold text-stone-700">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        {room.courseName} ({room.totalHoles}홀)
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-black text-[10px]">
                        💰 {typeof room.entryFee === 'number' && room.entryFee > 0 ? `${room.entryFee.toLocaleString()}원` : '무료'}
                      </span>
                      <span className="font-extrabold text-purple-900">총무: {room.hostName}</span>
                    </div>
                  </div>

                  {/* 참가 인원 현황 프로그레스 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-stone-600">
                        현재 등록 인원: <strong>{totalPlayers}명</strong> / 정원 {targetCapacity}명
                      </span>
                      <span className="text-purple-700 font-black">{percent}%</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* 대항전 전용 매치 정보 & 카톡 공식 도전장 발송 버튼 */}
                  {room.tournamentType === 'CLUB_MATCH' && (
                    <div className="bg-purple-50/90 rounded-2xl p-2.5 border border-purple-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-black text-purple-950">
                        <span className="flex items-center gap-1">
                          <Swords className="w-3.5 h-3.5 text-purple-700" />
                          <span>
                            {room.matchTeamCount || 2}개 팀 대항전 (클럽당 {room.playersPerTeam || Math.round(targetCapacity / (room.matchTeamCount || 2))}명 출전)
                          </span>
                        </span>
                        <span className="text-[10px] text-purple-700 font-extrabold bg-purple-200/70 px-2 py-0.5 rounded-md">
                          {room.matchInviteType === 'OPEN_CHALLENGE' ? '📢 전국 오픈 챌린지' : '⚔️ 지정 클럽 지목전'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopyInvite(e, room)}
                        className="w-full py-2.5 px-3 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-purple-800"
                      >
                        <Share2 className="w-3.5 h-3.5 text-yellow-300" />
                        <span>⚔️ 상대 클럽에 카톡 공식 도전장 보내기</span>
                      </button>
                    </div>
                  )}

                  {/* 전광판 입장 버튼 (Senior Touch 52px Target) */}
                  <Link
                    href={`/club/${room.id}`}
                    className="w-full min-h-[52px] bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 active:scale-98 text-white font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-purple-600"
                  >
                    <Trophy className="w-5 h-5 text-yellow-300" />
                    <span>📡 실시간 디지털 전광판 입장 (조별 스코어 / 리더보드)</span>
                    <ArrowRight className="w-4 h-4 text-purple-200" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 탭 3: [번개 모임 갖기 - 1촌 전용 번개 & 클럽원 전용 번개] */}
      {/* ========================================================================= */}
      {activeHubTab === 'FLASH' && (
        <div className="space-y-3 animate-fadeIn">
          {/* 번개 모임 메인 배너 */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-emerald-900 text-white rounded-3xl p-5 shadow-md space-y-2 border-2 border-amber-400/50">
            <div className="flex items-center justify-between">
              <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-stone-950" />
                <span>파크온 번개 모임 센터</span>
              </span>
              <span className="text-xs text-amber-200 font-bold">1촌 안심 번개 · 클럽 번개</span>
            </div>
            <h2 className="text-base font-black">실시간 파크골프 번개 라운드</h2>
            <p className="text-xs text-amber-100 leading-relaxed font-medium">
              불특정 다수가 아닌 <strong>[내 1촌 동반자 네트워크]</strong>에 번개를 띄워 [수락]한 동반자들과 안심 라운드를 즐기거나,{' '}
              <strong>[소속 클럽]</strong> 회원들 전용 번개를 바로 시작하세요!
            </p>
          </div>

          {/* 2대 번개 서브 탭 (1촌 전용 번개 vs 클럽원 전용 번개) */}
          <div className="bg-white p-1.5 rounded-2xl border-2 border-stone-200 shadow-sm grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setFlashSubTab('1CHON')}
              className={`py-3 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                flashSubTab === '1CHON'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-800 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${flashSubTab === '1CHON' ? 'text-amber-300 fill-amber-300' : 'text-emerald-700'}`} />
              <span className="text-xs font-black">⚡ 내 1촌 전용 번개</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                flashSubTab === '1CHON' ? 'bg-emerald-950 text-amber-300' : 'bg-stone-200 text-stone-600'
              }`}>
                {companions.length}명
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFlashSubTab('CLUB_ONLY')}
              className={`py-3 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                flashSubTab === 'CLUB_ONLY'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 border-amber-700 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              <Users className={`w-4 h-4 ${flashSubTab === 'CLUB_ONLY' ? 'text-stone-950' : 'text-amber-600'}`} />
              <span className="text-xs font-black">👥 클럽원 전용 번개</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                flashSubTab === 'CLUB_ONLY' ? 'bg-amber-950 text-amber-300' : 'bg-stone-200 text-stone-600'
              }`}>
                {myClubs.length}곳
              </span>
            </button>
          </div>

          {/* 서브 탭 1: [내 1촌 전용 번개] */}
          {flashSubTab === '1CHON' && (
            <div className="space-y-3 animate-fadeIn">
              {/* 대표님 요청: 내 1촌 리스트 먼저 노출 & 번개 띄우기 */}
              <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                    <h3 className="text-xs font-black text-stone-900">
                      내 1촌 동반자 네트워크 ({companions.length}명)
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    서로 검증된 인연
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 font-medium">
                  나와 라운드를 함께 완주하여 검증된 1촌 목록입니다. 번개 개설 시 아래 1촌들에게 번개가 발송됩니다.
                </p>

                {/* 1촌 동반자 가로 스크롤 카드 */}
                <div className="flex gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                  {companions.map((comp) => (
                    <div
                      key={comp.id}
                      className="shrink-0 w-36 p-2.5 bg-stone-50 hover:bg-emerald-50/60 border border-stone-200 rounded-2xl space-y-1.5 transition text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center mx-auto shadow-xs">
                        {comp.companionName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-black text-xs text-stone-900">{comp.companionName}</div>
                        <div className="text-[10px] text-emerald-700 font-bold">
                          통산 {comp.roundCount}회 동반
                        </div>
                      </div>
                      <div className="text-[9px] text-stone-500 truncate" title={comp.lastCourseName}>
                        {comp.lastCourseName || '전국 구장'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 1촌 번개방 개설 버튼 (Senior Touch 52px Target) */}
                <button
                  type="button"
                  onClick={() => setShowCreate1ChonModal(true)}
                  className="w-full min-h-[52px] bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 text-white font-black text-sm rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-emerald-600"
                >
                  <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                  <span>⚡ 내 1촌에게 번개방 개설하기 (4인 라운드 모집)</span>
                </button>
              </div>

              {/* 진행 중인 1촌 번개 목록 */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-stone-800 px-1">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>진행 중인 1촌 번개 ({lightningRounds.length}개)</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-bold">수락(Accept) 시 참가 확정</span>
                </div>

                {lightningRounds.length === 0 && (
                  <div className="bg-white rounded-3xl p-6 border border-stone-200 text-center space-y-2">
                    <p className="text-xs text-stone-500 font-bold">현재 진행 중인 1촌 번개가 없습니다.</p>
                    <p className="text-[11px] text-stone-400 font-medium">위 버튼을 눌러 내 1촌들에게 첫 번째 번개를 띄워보세요!</p>
                  </div>
                )}

                {lightningRounds.map((round) => {
                  const acceptedList = round.acceptedPlayers && round.acceptedPlayers.length > 0
                    ? round.acceptedPlayers
                    : round.currentPlayers.map((p) => ({ ...p, acceptedAt: round.createdAt }));
                  const acceptedCount = acceptedList.length;
                  const isMultiOpen = round.lightningScope === 'MULTI_OPEN' || round.targetPlayersCount >= 999;
                  const isFull = !isMultiOpen && acceptedCount >= 4;
                  const selfName = (ParkOnStorage.getUserDisplayName()).trim();
                  const isHost = round.hostName.trim() === selfName || round.hostId === 'self';
                  const hasAccepted = acceptedList.some((p) => p.name.trim() === selfName || (p.isHost && isHost));

                  return (
                    <div
                      key={round.id}
                      className={`bg-white rounded-2xl p-4 border-2 shadow-sm space-y-3 transition ${
                        isFull
                          ? 'border-amber-400 ring-2 ring-amber-200 bg-amber-50/30'
                          : acceptedCount >= 2
                          ? 'border-emerald-400 ring-1 ring-emerald-200'
                          : 'border-stone-200'
                      }`}
                    >
                      {/* 상단 뱃지 & 헤더 */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Heart className="w-3 h-3 text-emerald-700 fill-emerald-700" />
                              <span>{isMultiOpen ? '👥 4인 이상 번개 (무제한)' : '⛳ 4인 번개'}</span>
                            </span>
                            <span className="bg-stone-100 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              📅 {round.dateStr} {round.timeStr}
                            </span>
                            {isMultiOpen ? (
                              <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md">
                                현재 {acceptedCount}명 참여 중 {acceptedCount >= 2 ? '· 출발 가능!' : ''}
                              </span>
                            ) : isFull ? (
                              <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                                🎉 4인 완료 (출발 가능)
                              </span>
                            ) : (
                              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                                {acceptedCount >= 2 ? `🟢 2인 이상 모임 (${acceptedCount}/4명, 출발 가능)` : `⏳ 1촌 수락 대기 중 (${acceptedCount}/4명)`}
                              </span>
                            )}
                          </div>
                          <h3 className="font-black text-base text-stone-900 mt-1 leading-snug">
                            {round.courseName}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleShare1ChonLightningKakao(round)}
                          className="p-2 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition cursor-pointer shrink-0"
                          title="1촌 단톡방 공유"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 메시지 & 초대 대상 */}
                      <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 text-xs space-y-1">
                        <div className="font-bold text-stone-800 flex items-center gap-1">
                          <span>💬</span>
                          <span>&quot;{round.notes}&quot;</span>
                        </div>
                        <div className="text-[10px] text-stone-500 font-medium">
                          개설자: <strong>{round.hostName}</strong> {isHost && <span className="text-emerald-700 font-bold">(본인/방장)</span>}
                          {round.invited1ChonNames && round.invited1ChonNames.length > 0 && (
                            <span> · 지정 1촌: {round.invited1ChonNames.join(', ')}</span>
                          )}
                        </div>
                      </div>

                      {/* 수락(Accept) 현황 프로그레스 & 수락 동반자 명단 */}
                      <div className="space-y-1.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                        <div className="flex justify-between text-xs font-extrabold text-stone-800">
                          <span>1촌 수락(참가) 확정자:</span>
                          <span className="text-emerald-800 font-black">
                            {isMultiOpen ? `${acceptedCount}명 (인원 무제한)` : `${acceptedCount} / 4명 완료`}
                          </span>
                        </div>

                        {/* 프로그레스 바 */}
                        <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-600 to-amber-500 h-full rounded-full transition-all duration-500"
                            style={{
                              width: isMultiOpen
                                ? `${Math.min(100, Math.max(20, (acceptedCount / 10) * 100))}%`
                                : `${Math.min(100, (acceptedCount / 4) * 100)}%`
                            }}
                          />
                        </div>

                        {/* 수락 완료 동반자 명단 칩 */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {acceptedList.map((p, idx) => (
                            <span
                              key={idx}
                              className="bg-white border border-emerald-300 text-emerald-950 text-[11px] font-black px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{p.name}</span>
                              {p.isHost && <span className="text-[9px] text-emerald-600 font-bold">(방장)</span>}
                            </span>
                          ))}
                          {!isMultiOpen && !isFull && (
                            <span className="bg-stone-100 text-stone-400 text-[11px] font-bold px-2 py-1 rounded-lg border border-dashed border-stone-300">
                              + {4 - acceptedCount}명 수락 대기 중
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 대표님 요청 핵심: 4인이 안 되어도 번개 친 사람(방장)은 2명이라도 언제든 바로 진행! */}
                      <div className="pt-1 space-y-2">
                        {isHost ? (
                          acceptedCount >= 2 ? (
                            <div className="space-y-1.5">
                              <button
                                type="button"
                                onClick={() => handleStart1ChonRound(round)}
                                className="w-full min-h-[52px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 active:scale-98 text-stone-950 font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border border-yellow-300"
                              >
                                <Play className="w-5 h-5 text-stone-950 fill-stone-950" />
                                <span>
                                  ⛳ 현재 {acceptedCount}명으로 지금 바로 출발 ({acceptedCount > 4 ? '실시간 조별 전광판' : '스코어카드'} ▶)
                                </span>
                              </button>
                              {!isFull && (
                                <p className="text-[11px] text-center text-stone-500 font-medium">
                                  💡 {isMultiOpen ? '추가 1촌을 더 기다리거나, 지금 바로 출발할 수 있습니다.' : '4인을 채울 때까지 더 기다리거나, 2명 이상이면 지금 바로 출발할 수 있습니다.'}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="w-full py-3 bg-stone-100 border border-dashed border-stone-300 rounded-xl text-center text-xs text-stone-500 font-bold">
                              ⏳ 1촌 수락 대기 중 (최소 2인 수락 시 방장이 바로 출발할 수 있습니다)
                            </div>
                          )
                        ) : (
                          // 초대받은 1촌 입장
                          hasAccepted ? (
                            <div className="space-y-1.5">
                              <div className="flex gap-2">
                                <div className="flex-1 min-h-[48px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs rounded-xl flex items-center justify-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                  <span>참가 수락 완료 (방장 출발 대기 중)</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCancel1ChonLightning(round.id)}
                                  className="px-3 min-h-[48px] bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl border border-stone-300 transition cursor-pointer"
                                >
                                  수락 취소
                                </button>
                              </div>
                              {acceptedCount >= 2 && (
                                <p className="text-[11px] text-center text-emerald-700 font-bold">
                                  🟢 2명 이상 모였습니다! 방장이 언제든 출발 버튼을 누르면 라운드가 시작됩니다.
                                </p>
                              )}
                            </div>
                          ) : isFull ? (
                            <div className="w-full py-3 bg-stone-100 text-stone-500 rounded-xl text-center text-xs font-bold">
                              정원 마감 (4인 완료)
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAccept1ChonLightning(round.id)}
                              className="w-full min-h-[52px] bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-98 text-white font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-emerald-500"
                            >
                              <Hand className="w-5 h-5 text-amber-300" />
                              <span>✋ 수락하기 (참가 확정하기)</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 서브 탭 2: [클럽원 전용 번개] */}
          {flashSubTab === 'CLUB_ONLY' && (
            <div className="space-y-3 animate-fadeIn">
              {/* 대표님 요청: 자기가 속한 클럽 선택 바 */}
              <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-black text-stone-900">
                      소속 클럽 선택 (자기가 속한 클럽 전용 번개)
                    </h3>
                  </div>
                  <span className="text-[10px] text-stone-400 font-bold">회원끼리만 라운드</span>
                </div>

                {myClubs.length === 0 ? (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-xs text-stone-500 font-bold">소속된 클럽이 없습니다.</p>
                    <button
                      type="button"
                      onClick={() => setActiveHubTab('CLUBS')}
                      className="px-4 py-2 bg-emerald-700 text-white text-xs font-black rounded-xl"
                    >
                      [내 클럽 바로가기]에서 클럽 가입하기
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 클럽 선택 칩 */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {myClubs.map((club) => (
                        <button
                          key={club.id}
                          type="button"
                          onClick={() => setSelectedFlashClubId(club.id)}
                          className={`shrink-0 py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer border flex items-center gap-1.5 ${
                            selectedFlashClubId === club.id
                              ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs ring-2 ring-amber-300'
                              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                          }`}
                        >
                          <span>🏛️</span>
                          <span>{club.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* 선택된 클럽 요약 & 번개 개설 버튼 */}
                    {(() => {
                      const selClub = clubs.find((c) => c.id === selectedFlashClubId) || myClubs[0];
                      if (!selClub) return null;
                      return (
                        <div className="pt-1 space-y-2">
                          <div className="flex items-center justify-between text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                            <span className="font-bold text-stone-700">홈구장: {selClub.homeCourseName}</span>
                            <span className="font-black text-emerald-800">소속 회원 {selClub.memberCount}명</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowCreateClubFlashModal(true)}
                            className="w-full min-h-[52px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-stone-950 font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-amber-500"
                          >
                            <Zap className="w-5 h-5 text-stone-950 fill-stone-950" />
                            <span>⚡ {selClub.name} 전용 번개 개설하기</span>
                          </button>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* 선택된 클럽의 번개 모집 목록 */}
              <div className="space-y-2.5">
                {(() => {
                  const filtered = flashGatherings.filter((g) => g.clubId === selectedFlashClubId);
                  const selClub = clubs.find((c) => c.id === selectedFlashClubId);

                  return (
                    <>
                      <div className="flex items-center justify-between text-xs font-black text-stone-800 px-1">
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                          <span>{selClub?.name || '클럽'} 번개 모집 ({filtered.length}개)</span>
                        </span>
                      </div>

                      {filtered.length === 0 ? (
                        <div className="bg-white rounded-3xl p-6 border border-stone-200 text-center space-y-2">
                          <p className="text-xs text-stone-500 font-bold">진행 중인 클럽 번개가 없습니다.</p>
                          <p className="text-[11px] text-stone-400 font-medium">위 버튼을 눌러 클럽 회원들에게 번개를 제안해보세요!</p>
                        </div>
                      ) : (
                        filtered.map((flash) => {
                          const selfName = ParkOnStorage.getUserDisplayName(selectedFlashClubId);
                          const isParticipant = flash.currentParticipants.some((p) => p.name.includes(selfName));
                          const isHost = flash.hostName.includes(selfName) || flash.currentParticipants[0]?.name.includes(selfName);
                          const isMultiOpen = flash.lightningScope === 'MULTI_OPEN' || flash.targetCount >= 999;
                          const isFull = !isMultiOpen && flash.currentParticipants.length >= 4;

                          return (
                            <div
                              key={flash.id}
                              className={`bg-white rounded-2xl p-4 border-2 shadow-sm space-y-3 transition ${
                                isFull
                                  ? 'border-amber-400 ring-2 ring-amber-200 bg-amber-50/30'
                                  : flash.currentParticipants.length >= 2
                                  ? 'border-amber-400 ring-1 ring-amber-200'
                                  : 'border-stone-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md">
                                      🏛️ {flash.clubName}
                                    </span>
                                    <span className="bg-stone-100 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                      {isMultiOpen ? '👥 4인 이상 번개 (무제한)' : '⛳ 4인 번개'}
                                    </span>
                                    <span className="bg-stone-100 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                      📅 {flash.playDate} {flash.playTime}
                                    </span>
                                    {isMultiOpen ? (
                                      <span className="bg-amber-200 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                                        현재 {flash.currentParticipants.length}명 참여 중 {flash.currentParticipants.length >= 2 ? '· 출발 가능!' : ''}
                                      </span>
                                    ) : isFull ? (
                                      <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                                        🎉 4인 완료 (출발 가능)
                                      </span>
                                    ) : (
                                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                                        {flash.currentParticipants.length >= 2
                                          ? `🟢 2인 이상 모임 (${flash.currentParticipants.length}/4명, 출발 가능)`
                                          : `모집 중 (${flash.currentParticipants.length}/4명)`}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className="font-black text-base text-stone-900 mt-1 leading-snug">
                                    {flash.title}
                                  </h3>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleShareClubFlashKakao(flash)}
                                  className="p-2 text-stone-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition cursor-pointer shrink-0"
                                  title="클럽 단톡방 공유"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 text-xs space-y-1">
                                <div className="font-bold text-stone-800">
                                  장소: <strong>{flash.courseName}</strong> · 개설자: {flash.hostName} {isHost && <span className="text-amber-700 font-bold">(본인/방장)</span>}
                                </div>
                                {flash.notes && (
                                  <div className="text-[11px] text-stone-600">&quot;{flash.notes}&quot;</div>
                                )}
                              </div>

                              {/* 참가자 명단 */}
                              <div className="flex flex-wrap gap-1.5">
                                {flash.currentParticipants.map((p, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-emerald-50 border border-emerald-300 text-emerald-950 text-[11px] font-black px-2 py-0.5 rounded-md flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>{p.name}</span>
                                    {idx === 0 && <span className="text-[9px] text-amber-700 font-bold">(방장)</span>}
                                  </span>
                                ))}
                                {!isMultiOpen && !isFull && (
                                  <span className="bg-stone-100 text-stone-400 text-[11px] font-bold px-2 py-1 rounded-lg border border-dashed border-stone-300">
                                    + {4 - flash.currentParticipants.length}명 모집 중
                                  </span>
                                )}
                              </div>

                              {/* 대표님 요청 핵심: 4인이 안 되어도 번개 친 사람(방장)은 2명이라도 언제든 바로 진행! */}
                              <div className="pt-1 space-y-2">
                                {isHost ? (
                                  flash.currentParticipants.length >= 2 ? (
                                    <div className="space-y-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleStartClubFlashRound(flash)}
                                        className="w-full min-h-[52px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 active:scale-98 text-stone-950 font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border border-yellow-300"
                                      >
                                        <Play className="w-5 h-5 text-stone-950 fill-stone-950" />
                                        <span>
                                          ⛳ 현재 {flash.currentParticipants.length}명으로 지금 바로 출발 ({flash.currentParticipants.length > 4 ? '실시간 조별 전광판' : '스코어카드'} ▶)
                                        </span>
                                      </button>
                                      {!isFull && (
                                        <p className="text-[11px] text-center text-stone-500 font-medium">
                                          💡 {isMultiOpen ? '추가 회원을 더 기다리거나, 지금 바로 출발할 수 있습니다.' : '4인을 채울 때까지 더 기다리거나, 2명 이상이면 지금 바로 출발할 수 있습니다.'}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="w-full py-2.5 bg-stone-100 border border-dashed border-stone-300 rounded-xl text-center text-xs text-stone-500 font-bold">
                                      ⏳ 클럽원 참가 대기 중 (최소 2인 모이면 방장이 바로 출발할 수 있습니다)
                                    </div>
                                  )
                                ) : (
                                  // 클럽원 입장
                                  isParticipant ? (
                                    <div className="space-y-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleLeaveClubFlash(flash.id)}
                                        className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl border border-stone-300 cursor-pointer"
                                      >
                                        참가 신청 취소하기
                                      </button>
                                      {flash.currentParticipants.length >= 2 && (
                                        <p className="text-[11px] text-center text-emerald-700 font-bold">
                                          🟢 2명 이상 모였습니다! 방장이 출발 버튼을 누르면 라운드가 시작됩니다.
                                        </p>
                                      )}
                                    </div>
                                  ) : isFull ? (
                                    <div className="w-full py-2.5 bg-stone-100 text-stone-500 rounded-xl text-center text-xs font-bold">
                                      정원 마감 (4인 완료)
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleJoinClubFlash(flash.id)}
                                      className="w-full min-h-[48px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-amber-600"
                                    >
                                      <Hand className="w-4 h-4 text-stone-950" />
                                      <span>✋ 클럽 번개 참가 신청하기</span>
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: 새 클럽 창단 모달 (회장/총무) */}
      {/* ========================================================================= */}
      {showCreateClubModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-base">새 파크골프 클럽 창단</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateClubModal(false)}
                className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClubSubmit} className="p-4 space-y-3.5 text-stone-800 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">클럽 이름 *</label>
                <input
                  type="text"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  placeholder="예: 구미 동락 에이스 파크골프 클럽"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">연고 지역</label>
                <input
                  type="text"
                  value={newClubRegion}
                  onChange={(e) => setNewClubRegion(e.target.value)}
                  placeholder="예: 경북 구미, 부산 사상 등"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800">홈 구장 선택 *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCourseSearchTarget('NEW_CLUB');
                      setCourseSearchTerm('');
                      setCourseRegionFilter('전체');
                      setShowCourseSearchModal(true);
                    }}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>전국 구장 검색</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCourseSearchTarget('NEW_CLUB');
                    setCourseSearchTerm('');
                    setCourseRegionFilter('전체');
                    setShowCourseSearchModal(true);
                  }}
                  className="w-full p-2.5 bg-stone-50 hover:bg-emerald-50/50 border border-stone-300 rounded-xl flex items-center justify-between text-xs font-bold text-stone-800 transition cursor-pointer text-left"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate font-black">{newClubSelectedCourse.name}</span>
                  </span>
                  <span className="text-stone-500 shrink-0 text-[11px] ml-2">
                    {newClubSelectedCourse.region} · {newClubSelectedCourse.totalHoles}홀 ▾
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">회장 이름</label>
                  <input
                    type="text"
                    value={newClubPresident}
                    onChange={(e) => setNewClubPresident(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">총무 이름 (본인)</label>
                  <input
                    type="text"
                    value={newClubManager}
                    onChange={(e) => setNewClubManager(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">문의 연락처</label>
                <input
                  type="text"
                  value={newClubPhone}
                  onChange={(e) => setNewClubPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">클럽 소개글</label>
                <textarea
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  rows={2}
                  placeholder="예: 구미 동락구장을 사랑하는 동호인 클럽입니다. 매월 둘째 주 토요일 정기 월례회 개최!"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateClubModal(false)}
                  className="w-1/3 py-3 bg-stone-100 text-stone-600 font-bold text-xs rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md"
                >
                  새 클럽 창단하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: 전국 클럽 찾아보기 및 가입 신청 모달 */}
      {/* ========================================================================= */}
      {showClubBrowseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-base">전국 파크골프 클럽 찾아보기</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowClubBrowseModal(false)}
                className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 font-bold leading-relaxed">
                ℹ️ 원하는 클럽에 <span className="font-black text-emerald-800">[가입 신청]</span>을 하시면 총무님의 승인 후 정회원으로 등록됩니다. 초청장을 받으신 경우 바로 가입도 가능합니다.
              </div>

              {otherClubs.length === 0 && (
                <div className="p-6 text-center text-xs text-stone-500 font-bold">
                  현재 등록된 모든 클럽에 이미 가입되어 있습니다!
                </div>
              )}

              {otherClubs.map((club) => (
                <div
                  key={club.id}
                  className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-black text-sm text-stone-900">{club.name}</h4>
                      <p className="text-xs text-stone-500 font-bold mt-0.5">
                        📍 {club.region} · {club.homeCourseName} (회원 {club.memberCount}명)
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setApplyingClub(club)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 cursor-pointer text-center"
                      >
                        가입 신청
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDirectJoinByInvite(club)}
                        className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-[10px] rounded-lg cursor-pointer text-center"
                      >
                        초청 즉시가입
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
                    {club.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2-1: 클럽 가입 신청서 작성 모달 */}
      {/* ========================================================================= */}
      {applyingClub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">클럽 가입 신청서</h3>
                <p className="text-[11px] text-emerald-200">{applyingClub.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyingClub(null)}
                className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitJoinApplication} className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-black text-stone-800">신청자 성함 *</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="예: 홍길동"
                  required
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-black text-stone-800">연락처</label>
                <input
                  type="text"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-black text-stone-800">가입 인사 / 신청 메시지</label>
                <textarea
                  value={applicantMessage}
                  onChange={(e) => setApplicantMessage(e.target.value)}
                  rows={2}
                  placeholder="총무님께 전달할 간단한 가입 인사를 남겨주세요."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium"
                />
              </div>

              <div className="p-2.5 bg-stone-100 rounded-xl text-[11px] text-stone-600 font-medium leading-relaxed">
                💡 가입 신청을 제출하시면 클럽 총무님의 승인 후 즉시 정회원으로 등록되어 정기 월례회에 참가하실 수 있습니다.
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setApplyingClub(null)}
                  className="w-1/3 py-2.5 bg-stone-100 text-stone-600 font-bold rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow-md"
                >
                  총무님께 가입 신청 접수
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3-0: [회장·총무 전용] 클럽 통합 관리 모달 (승인 대기열 + 전체 회원 명부 + 초청장) */}
      {/* ========================================================================= */}
      {managingClub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 text-white p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-1.5 py-0.2 rounded-md">
                    👑 집행부 관리실
                  </span>
                  <h3 className="font-extrabold text-base">{managingClub.name}</h3>
                </div>
                <p className="text-[11px] text-emerald-200 mt-0.5">
                  홈 구장: {managingClub.homeCourseName} · 정회원 {managingClub.memberCount}명
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingClub(null)}
                className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 상단 카톡 가입 초청장 전송 바 */}
            <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-200 flex items-center justify-between">
              <div className="text-xs font-bold text-emerald-950">
                <span>신규 회원 카톡 초대하기</span>
              </div>
              <button
                type="button"
                onClick={(e) => handleCopyClubInvite(e, managingClub)}
                className={`px-3 py-1.5 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer transition ${
                  copiedClubId === managingClub.id
                    ? 'bg-emerald-600 border border-emerald-400 ring-2 ring-emerald-300 animate-pulse'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                {copiedClubId === managingClub.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                    <span>✅ 복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>📢 카톡 가입 초청장 복사</span>
                  </>
                )}
              </button>
            </div>

            {/* 탭 네비게이션: 가입 승인 대기 명단 vs 전체 회원 명부 */}
            <div className="grid grid-cols-2 p-2 bg-stone-100 border-b border-stone-200 gap-1 text-xs font-black">
              <button
                type="button"
                onClick={() => setManagingClubTab('PENDING')}
                className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  managingClubTab === 'PENDING'
                    ? 'bg-white text-emerald-950 shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>가입 승인 대기</span>
                {(managingClub.pendingMembers?.length || 0) > 0 ? (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {managingClub.pendingMembers?.length}
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400 font-bold">0</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setManagingClubTab('MEMBERS')}
                className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  managingClubTab === 'MEMBERS'
                    ? 'bg-white text-emerald-950 shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>전체 회원 명부</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {managingClub.members.length}
                </span>
              </button>
            </div>

            {/* 내용 영역 */}
            <div className="p-4 space-y-3 max-h-[65vh] overflow-y-auto text-xs">
              {/* 탭 1: 가입 승인 대기 명단 */}
              {managingClubTab === 'PENDING' && (
                <div className="space-y-2.5">
                  {(!managingClub.pendingMembers || managingClub.pendingMembers.length === 0) ? (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto font-black text-sm">
                        ✓
                      </div>
                      <p className="font-black text-stone-800 text-sm">대기 중인 가입 신청이 없습니다</p>
                      <p className="text-[11px] text-stone-500 leading-relaxed font-medium">
                        상단의 &lsquo;카톡 가입 초청장 복사&rsquo; 버튼을 눌러 카카오톡 단체방에 공유하면 회원들이 신청할 수 있습니다.
                      </p>
                    </div>
                  ) : (
                    managingClub.pendingMembers.map((p) => (
                      <div
                        key={p.id}
                        className="bg-stone-50 border-2 border-emerald-300 rounded-2xl p-3.5 space-y-2.5 shadow-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-sm text-stone-900">{p.name}</span>
                              <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-1.5 py-0.2 rounded">
                                승인 대기
                              </span>
                            </div>
                            <div className="text-[11px] text-stone-500 font-bold mt-0.5">
                              📞 {p.phone || '연락처 미기재'} · ⏱️ {p.requestedAt}
                            </div>
                          </div>

                          <div className="flex gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleApproveMember(managingClub.id, p.id, p.name)}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>수락</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectMember(managingClub.id, p.id, p.name)}
                              className="px-2.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs rounded-xl active:scale-95 cursor-pointer"
                            >
                              거절
                            </button>
                          </div>
                        </div>

                        {p.message && (
                          <p className="text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200 text-[11px] font-medium leading-relaxed">
                            💬 &ldquo;{p.message}&rdquo;
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 탭 2: 전체 회원 명부 */}
              {managingClubTab === 'MEMBERS' && (
                <div className="space-y-1.5">
                  {managingClub.members.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between font-bold text-stone-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-black">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-black text-stone-900">{m.name}</span>
                            {m.name.includes('본인') && (
                              <span className="text-[9px] bg-emerald-700 text-white px-1 rounded font-black">
                                나
                              </span>
                            )}
                          </div>
                          {m.phone && (
                            <span className="text-[10px] text-stone-400 font-medium">{m.phone}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-stone-400 font-medium">{m.joinedAt}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-black ${
                            m.role === 'PRESIDENT'
                              ? 'bg-amber-100 text-amber-950 border border-amber-300'
                              : m.role === 'MANAGER'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {m.role === 'PRESIDENT' ? '👑 회장' : m.role === 'MANAGER' ? '📋 총무' : '회원'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 하단 버튼 바 (클럽 나가기 / 탈퇴 + 닫기) */}
            <div className="p-3 border-t border-stone-200 flex items-center justify-between bg-stone-50">
              <button
                type="button"
                onClick={() => {
                  if (managingClub) handleLeaveClub(managingClub);
                }}
                className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-2xs"
                title="클럽 관리자 권한 인계 및 클럽 탈퇴"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>🚪 이 클럽 나가기 (탈퇴)</span>
              </button>

              <button
                type="button"
                onClick={() => setManagingClub(null)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-black rounded-xl text-xs cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: 일반 회원용 클럽 상세 및 회원 명부 모달 */}
      {/* ========================================================================= */}
      {selectedClubDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">{selectedClubDetail.name}</h3>
                <p className="text-[11px] text-emerald-200">
                  📍 {selectedClubDetail.homeCourseName} ({selectedClubDetail.region})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClubDetail(null)}
                className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto text-xs">
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-emerald-950 space-y-1">
                <div className="flex justify-between font-black">
                  <span>회장: {selectedClubDetail.presidentName}</span>
                  <span>총무: {selectedClubDetail.managerName}</span>
                </div>
                {selectedClubDetail.contactPhone && (
                  <div className="text-stone-600 font-bold">
                    문의처: {selectedClubDetail.contactPhone}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-black text-stone-900 mb-2">
                  소속 회원 명부 ({selectedClubDetail.members.length}명)
                </h4>
                <div className="space-y-1.5">
                  {selectedClubDetail.members.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between font-bold text-stone-800"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-black">
                          {idx + 1}
                        </span>
                        <span>{m.name}</span>
                      </span>
                      <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-black">
                        {m.role === 'PRESIDENT' ? '👑 회장' : m.role === 'MANAGER' ? '📋 총무' : '회원'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200 flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    handleLeaveClub(selectedClubDetail);
                    setSelectedClubDetail(null);
                  }}
                  className="text-red-600 font-bold hover:underline cursor-pointer"
                >
                  클럽 탈퇴하기
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClubDetail(null)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 font-black rounded-xl cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: 새 대회 개설 모달 (주최 클럽 선택 + A-B-C-D 4열 + +/- 오르내림 스테퍼) */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-800 to-purple-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-300" />
                <h3 className="font-extrabold text-base">새 대회 / 월례회 개설</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="p-4 space-y-3.5 text-stone-800 max-h-[82vh] overflow-y-auto">
              {/* 대회 성격 및 모드 선택 (대표님 요청) */}
              <div className="space-y-1.5 bg-purple-50 p-3 rounded-2xl border border-purple-200">
                <label className="text-xs font-black text-purple-950 flex items-center gap-1">
                  <Swords className="w-3.5 h-3.5 text-purple-700" />
                  <span>대회 성격 및 주최 유형 선택 *</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTournamentType('CLUB_MATCH');
                      if (!title.includes('대항전')) {
                        setTitle('구미 동락 vs 부산 삼락 파크골프 클럽 친선 대항전 ⚔️');
                      }
                    }}
                    className={`py-2 px-1 text-[11px] font-black rounded-xl border transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      tournamentType === 'CLUB_MATCH'
                        ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span>⚔️ 클럽 대항전</span>
                    <span className="text-[9px] font-medium opacity-90">(교류전)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTournamentType('REGIONAL_OPEN');
                      if (!title.includes('오픈') && !title.includes('배')) {
                        setTitle('2026 제1회 구미시장배 파크골프 오픈 챔피언십 🏆');
                      }
                    }}
                    className={`py-2 px-1 text-[11px] font-black rounded-xl border transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      tournamentType === 'REGIONAL_OPEN'
                        ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span>🏆 시·도 공식대회</span>
                    <span className="text-[9px] font-medium opacity-90">(구미시배 등)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTournamentType('CLUB_INTERNAL');
                      const cl = clubs.find((x) => x.id === tournamentClubId) || myClubs[0];
                      if (cl) setTitle(`${cl.name} 정기 월례회 🏅`);
                    }}
                    className={`py-2 px-1 text-[11px] font-black rounded-xl border transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      tournamentType === 'CLUB_INTERNAL'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span>🏅 클럽 월례회</span>
                    <span className="text-[9px] font-medium opacity-90">(단일 클럽)</span>
                  </button>
                </div>

                {/* 대항전인 경우: 매칭 방식, 팀 수, 상대 클럽 선택 (대표님 요청) */}
                {tournamentType === 'CLUB_MATCH' && (
                  <div className="pt-2 space-y-2.5">
                    {/* 1. 초청 및 매칭 방식 (지정 도전장 vs 전국 공개 챌린지) */}
                    <div className="space-y-1 bg-white p-2.5 rounded-xl border border-purple-200">
                      <label className="text-[11px] font-black text-purple-950 flex items-center justify-between">
                        <span>상대 초청 및 매칭 방식 선택</span>
                        <span className="text-[10px] text-purple-700 font-bold">2가지 트랙 지원</span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setMatchInviteType('DIRECT_CHALLENGE');
                            updateMatchTitle('DIRECT_CHALLENGE', matchTeamCount, playersPerTeam, participatingClubIds, customOpponentName);
                          }}
                          className={`py-2 px-1.5 text-[11px] font-black rounded-lg border transition cursor-pointer flex flex-col items-center justify-center text-center leading-tight ${
                            matchInviteType === 'DIRECT_CHALLENGE'
                              ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                              : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          <span>⚔️ 지정 클럽 지목</span>
                          <span className="text-[9px] opacity-90 mt-0.5">(카톡 공식 도전장 발송)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMatchInviteType('OPEN_CHALLENGE');
                            updateMatchTitle('OPEN_CHALLENGE', matchTeamCount, playersPerTeam, participatingClubIds, customOpponentName);
                          }}
                          className={`py-2 px-1.5 text-[11px] font-black rounded-lg border transition cursor-pointer flex flex-col items-center justify-center text-center leading-tight ${
                            matchInviteType === 'OPEN_CHALLENGE'
                              ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                              : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          <span>📢 전국 공개 챌린지</span>
                          <span className="text-[9px] opacity-90 mt-0.5">(도전팀 모집 공고)</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. 대항전 참가 팀 수 선택 (2팀 / 3팀 / 4팀) */}
                    <div className="space-y-1 bg-white p-2.5 rounded-xl border border-purple-200">
                      <label className="text-[11px] font-black text-purple-950 flex items-center justify-between">
                        <span>대항전 팀 수 선택</span>
                        <span className="text-[10px] text-purple-700 font-bold">{matchTeamCount}개 팀 대결</span>
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                        {[
                          { count: 2, label: '2개 팀', sub: '(1 vs 1 맞대결)' },
                          { count: 3, label: '3개 팀', sub: '(삼파전 교류전)' },
                          { count: 4, label: '4개 팀', sub: '(4강 연합전)' },
                        ].map((t) => (
                          <button
                            key={t.count}
                            type="button"
                            onClick={() => handleMatchTeamCountChange(t.count)}
                            className={`py-1.5 px-1 text-[11px] font-black rounded-lg border transition cursor-pointer flex flex-col items-center justify-center ${
                              matchTeamCount === t.count
                                ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                                : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                            }`}
                          >
                            <span>{t.label}</span>
                            <span className="text-[9px] opacity-90">{t.sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. 상대 클럽 지정 (지정 지목 시) 또는 전국 공개 공지 안내 */}
                    {matchInviteType === 'DIRECT_CHALLENGE' ? (
                      <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-purple-200">
                        <label className="text-[11px] font-black text-purple-950 flex items-center justify-between">
                          <span>상대 맞대결 클럽 선택 ({matchTeamCount - 1}개 클럽)</span>
                          <span className="text-[10px] text-stone-500">터치하여 선택</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {clubs
                            .filter((c) => c.id !== tournamentClubId)
                            .map((c) => {
                              const isSelected = participatingClubIds.includes(c.id);
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => {
                                    let next: string[];
                                    if (isSelected) {
                                      next = participatingClubIds.filter((id) => id !== c.id);
                                    } else {
                                      if (matchTeamCount === 2) {
                                        next = [c.id];
                                      } else {
                                        next = [...participatingClubIds.filter((id) => id !== tournamentClubId), c.id];
                                      }
                                    }
                                    setParticipatingClubIds(next);
                                    updateMatchTitle(matchInviteType, matchTeamCount, playersPerTeam, next, customOpponentName);
                                  }}
                                  className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                                    isSelected
                                      ? 'bg-purple-700 text-white border-purple-800'
                                      : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                                  }`}
                                >
                                  {isSelected ? '✓' : '+'} {c.name}
                                </button>
                              );
                            })}
                        </div>
                        <div className="pt-0.5">
                          <input
                            type="text"
                            value={customOpponentName}
                            onChange={(e) => {
                              setCustomOpponentName(e.target.value);
                              updateMatchTitle(matchInviteType, matchTeamCount, playersPerTeam, participatingClubIds, e.target.value);
                            }}
                            placeholder="기타 클럽 직접 입력 (예: 칠곡 왜관 클럽, 대구 달성 클럽)"
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-950 font-bold space-y-1">
                        <div className="flex items-center gap-1 font-black text-amber-900">
                          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                          <span>📢 전국 파크골프 광장 공개 모집 공지</span>
                        </div>
                        <p className="text-[11px] text-stone-700 font-medium leading-relaxed">
                          방 개설 시 파크온 전국 라운지에 <strong>'[도전팀 구함] 친선 교류전'</strong> 공지가 자동 등록되며, 다른 클럽이 [도전 신청]을 누르고 주최자가 승낙하면 대항전이 성립됩니다!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 시·도 공식대회인 경우: 관할 지역 입력 */}
                {tournamentType === 'REGIONAL_OPEN' && (
                  <div className="pt-2 space-y-1">
                    <label className="text-[11px] font-extrabold text-stone-700">공식 주관 시·도 관할 지역</label>
                    <input
                      type="text"
                      value={regionalScope}
                      onChange={(e) => setRegionalScope(e.target.value)}
                      placeholder="예: 경상북도 구미시, 대구광역시"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* 주최 클럽 선택 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">주최/대표 클럽 선택</label>
                <select
                  value={tournamentClubId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setTournamentClubId(cid);
                    const cl = clubs.find((x) => x.id === cid);
                    if (cl) {
                      if (tournamentType === 'CLUB_INTERNAL') setTitle(`${cl.name} 정기 월례회`);
                      if (cl.homeCourseId) handleCourseChange(cl.homeCourseId);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600"
                >
                  <option value="">협회 / 연합 주최 (소속 무관)</option>
                  {myClubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      🏛️ {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 모임 제목 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">대회 / 모임 이름 *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 구미 동락 파크골프 클럽 9월 정기 월례회"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              {/* 구장 선택 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800">대회 구장 선택</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCourseSearchTarget('TOURNAMENT');
                      setTempSelectedCourseId(selectedCourseId);
                      setShowCourseSearchModal(true);
                    }}
                    className="text-purple-700 hover:text-purple-900 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>전국 구장 검색</span>
                  </button>
                </div>
                <div className="p-2.5 bg-stone-50 border border-stone-300 rounded-xl flex items-center justify-between text-xs font-bold text-stone-800">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">{selectedCourse.name}</span>
                  </span>
                  <span className="text-stone-500 shrink-0">
                    {selectedCourse.region} · 총 {selectedCourse.totalHoles}홀
                  </span>
                </div>
              </div>

              {/* 참가 인원수 설정: 클럽 대항전(팀당 엔트리 × 팀 수) vs 일반 월례회/시도대회 (대표님 요청) */}
              {tournamentType === 'CLUB_MATCH' ? (
                <div className="space-y-2 bg-purple-50/80 p-3 rounded-2xl border-2 border-purple-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-700" />
                      <span>클럽당 출전 엔트리 (팀당 인원)</span>
                    </span>
                    <span className="text-purple-800 font-bold text-[11px]">
                      + / - 버튼 및 숫자 직접 입력
                    </span>
                  </div>

                  {/* +/- 오르내림 스테퍼 (자유 조절 & 직접 입력) */}
                  <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlayersPerTeamChange(Math.max(2, playersPerTeam - 1))}
                        className="w-12 h-12 rounded-xl bg-purple-100 hover:bg-purple-200 active:scale-95 text-purple-900 flex items-center justify-center font-black text-2xl border border-purple-300 transition cursor-pointer shadow-xs shrink-0"
                        title="1명 내림"
                      >
                        <Minus className="w-6 h-6 stroke-[3]" />
                      </button>

                      <div className="flex-1 flex flex-col items-center justify-center py-1 px-3 bg-purple-50/60 rounded-xl border-2 border-purple-400 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs font-black text-purple-900">클럽당</span>
                          <input
                            type="number"
                            min={2}
                            max={999}
                            value={playersPerTeam}
                            onChange={(e) => handlePlayersPerTeamChange(Number(e.target.value))}
                            className="w-16 text-center text-3xl font-black text-purple-950 bg-transparent focus:outline-none"
                          />
                          <span className="text-base font-black text-purple-800">명</span>
                        </div>
                        <span className="text-[10px] font-bold text-stone-500">
                          {matchTeamCount}개 팀 × {playersPerTeam}명 = 총 {matchTeamCount * playersPerTeam}명 출전
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePlayersPerTeamChange(Math.min(999, playersPerTeam + 1))}
                        className="w-12 h-12 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-95 text-white flex items-center justify-center font-black text-2xl border border-purple-800 transition cursor-pointer shadow-md shrink-0"
                        title="1명 올림"
                      >
                        <Plus className="w-6 h-6 stroke-[3]" />
                      </button>
                    </div>
                  </div>

                  {/* 실시간 매칭 & 라이벌 조편성 요약 배너 */}
                  {(() => {
                    const totalP = matchTeamCount * playersPerTeam;
                    const opt = ClubStorage.calculateOptimalGroups(totalP);
                    const hostClub = clubs.find((c) => c.id === tournamentClubId) || myClubs[0];
                    const oppClub = clubs.find((c) => participatingClubIds.includes(c.id) && c.id !== hostClub?.id);
                    const oppText = oppClub
                      ? oppClub.name
                      : customOpponentName.trim() || (matchInviteType === 'OPEN_CHALLENGE' ? '전국 오픈 도전자 클럽' : '부산 삼락 파크골프 클럽');

                    return (
                      <div className="bg-gradient-to-br from-white to-purple-50 p-3 rounded-xl border border-purple-300 text-xs font-bold text-stone-800 space-y-1.5">
                        <div className="flex items-center justify-between text-purple-950 font-black border-b border-purple-100 pb-1">
                          <span>🎯 대항전 매칭 설계 요약</span>
                          <span className="text-purple-700">총 {opt.groupCount}개 조 ({totalP}명)</span>
                        </div>
                        <div className="text-[11px] text-purple-900 font-extrabold flex items-center gap-1.5 flex-wrap">
                          <span className="bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                            {hostClub?.name || '우리 클럽'} ({playersPerTeam}명)
                          </span>
                          <span className="text-purple-600">⚔️ VS ⚔️</span>
                          <span className="bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                            {oppText} ({playersPerTeam}명)
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-600 font-medium leading-relaxed">
                          👉 <strong>라이벌 크로스 맞대결 조편성</strong>: 각 조당 양 클럽 선수가 {Math.max(1, Math.round(playersPerTeam / opt.groupCount))}명씩 맞대결 배치되어 서로 타수를 상호 마킹합니다.
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                (() => {
                  const opt = ClubStorage.calculateOptimalGroups(targetPlayers);
                  const k = opt.groupCount;
                  const fourCount = Math.max(0, targetPlayers - 3 * k);
                  const threeCount = Math.max(0, 4 * k - targetPlayers);

                  let summaryText = '';
                  if (targetPlayers <= 4) {
                    summaryText = `총 1개 조 (${targetPlayers}명)`;
                  } else if (threeCount === 0) {
                    summaryText = `총 ${k}개 조 (4인 조 ${fourCount}개 조)`;
                  } else if (fourCount === 0) {
                    summaryText = `총 ${k}개 조 (3인 조 ${threeCount}개 조)`;
                  } else {
                    summaryText = `총 ${k}개 조 (4인 ${fourCount}개 조 + 3인 ${threeCount}개 조)`;
                  }

                  return (
                    <div className="space-y-2 bg-purple-50/70 p-3 rounded-2xl border border-purple-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-purple-700" />
                          <span>참가 인원수</span>
                        </span>
                        <span className="text-purple-800 font-bold text-[11px]">
                          + / - 버튼으로 간편 조절
                        </span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-purple-200/80 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleTargetPlayersChange(Math.max(1, targetPlayers - 1))}
                            className="w-12 h-12 rounded-xl bg-purple-100 hover:bg-purple-200 active:scale-95 text-purple-900 flex items-center justify-center font-black text-2xl border border-purple-300 transition cursor-pointer shadow-xs shrink-0"
                            title="1명 내림"
                          >
                            <Minus className="w-6 h-6 stroke-[3]" />
                          </button>

                          <div className="flex-1 flex items-center justify-center gap-1.5 py-1 px-3 bg-purple-50/60 rounded-xl border-2 border-purple-400 text-center">
                            <input
                              type="number"
                              min={1}
                              max={999}
                              value={targetPlayers}
                              onChange={(e) => handleTargetPlayersChange(Number(e.target.value))}
                              className="w-20 text-center text-3xl font-black text-purple-950 bg-transparent focus:outline-none"
                            />
                            <span className="text-base font-black text-purple-800">명</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleTargetPlayersChange(Math.min(999, targetPlayers + 1))}
                            className="w-12 h-12 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-95 text-white flex items-center justify-center font-black text-2xl border border-purple-800 transition cursor-pointer shadow-md shrink-0"
                            title="1명 올림"
                          >
                            <Plus className="w-6 h-6 stroke-[3]" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-purple-200/80 text-xs font-black text-purple-950 flex items-center justify-between">
                        <span>🎯 3~4인 최적 조 편성:</span>
                        <span className="text-purple-800 font-black">{summaryText}</span>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* 플레이 코스 선택 (대표님 요청: A·B·C·D 4개 한 줄 나열) */}
              <div className="space-y-2 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between text-xs font-black text-stone-800">
                  <span className="flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-emerald-700" />
                    <span>플레이 코스 선택</span>
                  </span>
                  <span className="text-stone-500 font-bold text-[11px]">터치하여 선택</span>
                </div>

                <div
                  className={`grid gap-1.5 pt-0.5 ${
                    availableLetters.length === 1
                      ? 'grid-cols-1 max-w-[120px]'
                      : availableLetters.length === 2
                      ? 'grid-cols-2'
                      : availableLetters.length === 3
                      ? 'grid-cols-3'
                      : 'grid-cols-4'
                  }`}
                >
                  {availableLetters.map((letStr) => {
                    const isSelected = selectedLetters.includes(letStr);
                    return (
                      <button
                        key={letStr}
                        type="button"
                        onClick={() => {
                          let updated: string[];
                          if (isSelected) {
                            if (selectedLetters.length <= 1) {
                              alert('최소 1개 코스는 선택되어야 합니다.');
                              return;
                            }
                            updated = selectedLetters.filter((l) => l !== letStr);
                          } else {
                            updated = [...selectedLetters, letStr].sort(
                              (a, b) => COURSE_LETTERS.indexOf(a) - COURSE_LETTERS.indexOf(b)
                            );
                          }
                          setSelectedLetters(updated);
                        }}
                        className={`py-2.5 px-1 rounded-xl text-xs font-black border transition active:scale-95 cursor-pointer flex items-center justify-center gap-0.5 ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                            : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
                        }`}
                      >
                        <span className="whitespace-nowrap">{letStr}코스</span>
                        {isSelected && <span className="text-[10px] font-black">✓</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs font-black text-emerald-950 flex items-center justify-between">
                  <span>⛳ 지정 경기 코스:</span>
                  <span className="text-emerald-800 font-black text-sm">
                    {selectedLetters.join('-')} 코스 (총 {selectedLetters.length * 9}홀)
                  </span>
                </div>
              </div>

              {/* 참가비 및 입금 계좌 안내 (팝업 호출형 간소화) */}
              <div
                onClick={() => setShowCreateFeeModal(true)}
                className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80 flex items-center justify-between cursor-pointer hover:border-amber-400 hover:bg-amber-50/90 transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <div className="text-xs font-black text-stone-800">참가비 & 입금 계좌 안내</div>
                    <div className="text-[11px] font-bold text-amber-800">
                      {entryFee > 0 ? `1인 ${entryFee.toLocaleString()}원 · ${bankAccount || '계좌 등록됨'}` : '무료 (참가비 없음)'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateFeeModal(true);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-amber-950 rounded-xl text-xs font-black shadow-2xs transition cursor-pointer"
                >
                  설정 ⚙️
                </button>
              </div>

              {/* 대회 경기 방식 공시 (팝업 호출형 간소화) */}
              <div
                onClick={() => setShowCreateGameModeModal(true)}
                className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-200/80 flex items-center justify-between cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/90 transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl shrink-0">{ClubStorage.getGameModeInfo(gameMode).badge}</span>
                  <div>
                    <div className="text-xs font-black text-stone-800">공식 경기 방식</div>
                    <div className="text-[11px] font-bold text-indigo-800">
                      {ClubStorage.getGameModeInfo(gameMode).title}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateGameModeModal(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-2xs transition cursor-pointer"
                >
                  방식 선택 ▾
                </button>
              </div>

              {/* 로컬 룰 & 특별시상 공시 (팝업 호출형 간소화) */}
              <div
                onClick={() => setShowCreateRulesModal(true)}
                className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80 flex items-center justify-between cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/90 transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <div className="text-xs font-black text-stone-800">로컬 룰 & 특별시상 공시</div>
                    <div className="text-[11px] font-medium text-stone-600 truncate max-w-[200px]">
                      {gameRuleNotes ? gameRuleNotes.slice(0, 24) + '...' : '기본 규정 적용'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateRulesModal(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-2xs transition cursor-pointer"
                >
                  공시 설정 ▾
                </button>
              </div>

              {/* 총무 이름 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">총무 / 주최자 이름</label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="예: 김총무"
                  required
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/3 py-3 bg-stone-100 text-stone-600 font-bold text-xs rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md"
                >
                  대회 방 개설 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* SUB-MODAL: 대회 개설 - 참가비 & 입금 계좌 설정 모달 */}
      {/* ------------------------------------------------------------------------- */}
      {showCreateFeeModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-200" />
                <h3 className="font-extrabold text-base">참가비 & 입금 계좌 설정</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateFeeModal(false)}
                className="text-amber-100 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* 1인 참가비 금액 */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-800 flex justify-between">
                  <span>1인 참가비 (원)</span>
                  <span className="text-amber-700 font-extrabold">{entryFee === 0 ? '무료' : `${entryFee.toLocaleString()}원`}</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setEntryFee(0)}
                    className={`py-2 rounded-xl text-xs font-black border transition cursor-pointer active:scale-95 ${
                      entryFee === 0
                        ? 'bg-stone-800 text-white border-stone-800 shadow-xs'
                        : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    무료 (0원)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryFee((prev) => prev + 1000)}
                    className="py-2 rounded-xl text-xs font-black border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 active:scale-95 transition cursor-pointer shadow-2xs"
                  >
                    +1,000원
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryFee((prev) => prev + 5000)}
                    className="py-2 rounded-xl text-xs font-black border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 active:scale-95 transition cursor-pointer shadow-2xs"
                  >
                    +5,000원
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryFee((prev) => prev + 10000)}
                    className="py-2 rounded-xl text-xs font-black border border-amber-400 bg-amber-500 text-amber-950 hover:bg-amber-600 active:scale-95 transition cursor-pointer shadow-xs"
                  >
                    +10,000원
                  </button>
                </div>
                <p className="text-[10px] text-stone-500 mb-1.5">
                  💡 누를 때마다 금액이 합산됩니다 (예: 1만원 2번 + 5천원 클릭 시 25,000원, 무료 클릭 시 0원 초기화)
                </p>
                <div className="relative">
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={entryFee}
                    onChange={(e) => setEntryFee(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold pr-8"
                    placeholder="직접 입력 (예: 15000)"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-stone-500">원</span>
                </div>
              </div>

              {/* 입금 계좌 안내 */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-800">입금 안내 계좌번호</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="예: 농협 352-1234-5678 홍길동"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                />
                <p className="text-[10px] text-stone-500 leading-tight">
                  💡 참가자들에게 계좌번호가 즉시 안내되며, 총무님은 실시간으로 입금 확인(체크)을 진행할 수 있습니다.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateFeeModal(false)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition active:scale-98"
              >
                설정 확인 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* SUB-MODAL: 대회 개설 - 경기 방식 선택 모달 */}
      {/* ------------------------------------------------------------------------- */}
      {showCreateGameModeModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-base">공식 경기 방식 확정</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateGameModeModal(false)}
                className="text-indigo-100 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2.5 max-h-[75vh] overflow-y-auto">
              <p className="text-xs text-stone-600 font-medium">
                대회 성격에 맞는 경기 방식을 선택하세요. 방 개설 후에도 변경 가능합니다.
              </p>

              {(['STROKE', 'NEW_PERIO', 'SCRAMBLE', 'CASUAL', 'STABLEFORD'] as const).map((mode) => {
                const info = ClubStorage.getGameModeInfo(mode);
                const isSelected = gameMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setGameMode(mode);
                      if (mode === 'STROKE') {
                        setGameRuleNotes('정통 스트로크(18홀 최저타순), 동타 시 백카운트(후반 9홀 합산) 우선, 컨시드 1클럽 샤프트 이내, OB 2벌타');
                      } else if (mode === 'NEW_PERIO') {
                        setGameRuleNotes('신페리오 방식(12개 숨은 홀 핸디캡 산출), 컨시드 1클럽 샤프트 길이 이내 인정, OB 시 2벌타 후 특설티 진행');
                      } else if (mode === 'SCRAMBLE') {
                        setGameRuleNotes('팀 스크램블(베스트볼 단체전), 조원 모두 티샷 후 최고 위치 볼에서 2번째 샷 진행');
                      } else if (mode === 'CASUAL') {
                        setGameRuleNotes('친선 명랑 라운드, 순위 무관 행운권 룰렛 추첨 및 다파상·오리상 특별 시상 진행');
                      } else if (mode === 'STABLEFORD') {
                        setGameRuleNotes('스테이블포드 방식(홀별 타수별 승점 합산), 규정 18홀 최고 승점자 우승');
                      }
                      setShowCreateGameModeModal(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border-2 transition flex flex-col gap-1 cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 shadow-xs'
                        : 'border-stone-200 bg-white hover:border-indigo-300 hover:bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                        <span className="text-base">{info.badge.split(' ')[0]}</span>
                        <span>{info.title}</span>
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                          현재 선택됨 ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-stone-600 pl-6">
                      {info.shortDesc}
                    </p>
                  </button>
                );
              })}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGameModeModal(false)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition active:scale-98"
                >
                  선택 완료 및 닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* SUB-MODAL: 대회 개설 - 로컬 룰 & 특별 시상 공시 모달 (카테고리별 상세 설정) */}
      {/* ------------------------------------------------------------------------- */}
      {showCreateRulesModal && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* 팝업 헤더 */}
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600/60 rounded-xl">
                  <Award className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg tracking-tight">대회 로컬 룰 & 특별 시상 상세 공시</h3>
                  <p className="text-[11px] text-emerald-200 font-medium">
                    대회 공지사항에 들어갈 규정과 시상 룰을 클릭하여 촘촘하게 세팅하세요.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateRulesModal(false)}
                className="text-emerald-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 팝업 본문 (스크롤) */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-stone-800 flex-1">
              {/* ⚡ 원클릭 완성형 룰 팩 프리셋 */}
              <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3 sm:p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    ⚡ 원클릭 추천 룰 팩 (누르면 1초 세팅)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">파크골프 공식 세트</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setGameRuleNotes(
                        '정통 스트로크(18홀 최저타순), 동타 시 백카운트(후반 9홀 합산) 우선, 컨시드 1클럽 샤프트 이내 인정, OB 2벌타 특설티 진행, 벙커/수리지 무벌타 드롭 및 발자국 정리, 4번홀 니어핀 시상, 최다 파(다파상), 홀인원 축하상'
                      );
                    }}
                    className="p-2 rounded-xl text-left bg-white hover:bg-emerald-100/70 border border-emerald-300 text-stone-800 transition cursor-pointer active:scale-95 shadow-2xs flex flex-col"
                  >
                    <span className="text-xs font-black text-emerald-900">🥇 표준 월례회 팩</span>
                    <span className="text-[10px] text-stone-500 font-medium truncate">스트로크+니어핀+다파상</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGameRuleNotes(
                        '신페리오 방식(12개 숨은 홀 핸디캡 자동산출), 네트스코어 1위 우승 및 최저타수 메달리스트 분리 시상, 컨시드 1클럽 샤프트 이내 인정, OB 2벌타 특설티 진행, 4번홀 니어핀 시상, 다파상, 현장 실시간 행운권 룰렛 추첨'
                      );
                    }}
                    className="p-2 rounded-xl text-left bg-white hover:bg-emerald-100/70 border border-emerald-300 text-stone-800 transition cursor-pointer active:scale-95 shadow-2xs flex flex-col"
                  >
                    <span className="text-xs font-black text-indigo-900">🎯 신페리오 팩</span>
                    <span className="text-[10px] text-stone-500 font-medium truncate">핸디캡+메달리스트+룰렛</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGameRuleNotes(
                        '친선 명랑 라운드(순위 부담 없는 친목 라운드), 컨시드 50cm 원형 라인 이내 인정, 벙커/수리지 무벌타 자유 드롭, 현장 실시간 룰렛 행운 추첨, 행운의 오리상(22위), 행운의 7위상, 열정 격려상(초보 완주 응원)'
                      );
                    }}
                    className="p-2 rounded-xl text-left bg-white hover:bg-emerald-100/70 border border-emerald-300 text-stone-800 transition cursor-pointer active:scale-95 shadow-2xs flex flex-col"
                  >
                    <span className="text-xs font-black text-amber-900">⛳ 명랑 친목 팩</span>
                    <span className="text-[10px] text-stone-500 font-medium truncate">완화 컨시드+오리상+행운권</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGameRuleNotes(
                        '공인 챔피언십 스트로크 플레이, 노 컨시드 (전 홀 홀아웃 필수), OB 2벌타 특설티 엄격 적용, 동타 시 백카운트 우선, 고무 티(2.3cm 이하) 준수, 동반자 상호 스코어 확인 및 최종 서명 필수'
                      );
                    }}
                    className="p-2 rounded-xl text-left bg-white hover:bg-emerald-100/70 border border-emerald-300 text-stone-800 transition cursor-pointer active:scale-95 shadow-2xs flex flex-col"
                  >
                    <span className="text-xs font-black text-rose-900">🏆 챔피언십 팩</span>
                    <span className="text-[10px] text-stone-500 font-medium truncate">노컨시드+홀아웃+상호서명</span>
                  </button>
                </div>
              </div>

              {/* ⛳ 1. 컨시드(OK) 기준 설정 (거리 / 샤프트 맞춤 선택 및 가변 입력) */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    ⛳ 1. 컨시드(OK) 거리 및 기준 설정 (선택/변경)
                  </h4>
                  <span className="text-[10px] text-teal-700 font-bold">파크골프 샤프트 규정</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { label: '1클럽 샤프트 (약 80cm)', desc: '파크골프 표준 클럽 길이' },
                    { label: '반 클럽 샤프트 (약 40cm)', desc: '정밀 퍼팅 기준' },
                    { label: '원형 백색 라인 (50cm)', desc: '홀컵 백색선 이내' },
                    { label: '30cm 이내', desc: '엄격 기준' },
                    { label: '1m (1미터) 이내', desc: '친선 명랑 완화 기준' },
                    { label: '노 컨시드 (홀아웃 필수)', desc: '전원 홀인 완료 필수' },
                  ].map((c) => {
                    const isSelected = gameRuleNotes.includes(c.label) || (c.label.includes('1클럽') && gameRuleNotes.includes('1클럽'));
                    return (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => {
                          setCustomConcede(c.label);
                          let notes = gameRuleNotes
                            .split(',')
                            .map((s) => s.trim())
                            .filter((s) => s && !s.includes('컨시드'));
                          const newClause = c.label === '노 컨시드 (홀아웃 필수)'
                            ? '노 컨시드 (전 홀 홀아웃 필수)'
                            : `컨시드 ${c.label} 인정`;
                          notes.unshift(newClause);
                          setGameRuleNotes(notes.join(', '));
                        }}
                        className={`p-2 rounded-xl text-left border transition cursor-pointer active:scale-95 flex flex-col ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                            : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        <span className="text-xs font-black flex items-center justify-between">
                          <span>{c.label}</span>
                          {isSelected && <span className="text-[10px]">✓</span>}
                        </span>
                        <span className={`text-[10px] ${isSelected ? 'text-teal-100' : 'text-stone-500'}`}>
                          {c.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 📌 2. 필수 핵심 경기 규칙 & 안전 벌타 규정 (파크골프 공인 규칙) */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    📌 2. 필수 경기 규칙 & 안전 벌타 규정
                  </h4>
                  <span className="text-[10px] text-stone-500 font-bold">클릭 시 자동 추가/제거</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'OB 2벌타 후 특설티(드롭존) 진행',
                    'OB 2벌타 후 나간 지점 2클럽 이내 드롭',
                    '고무 티 규정: 반드시 고무 티(높이 2.3cm 이하) 사용',
                    '티잉 그라운드 안전: 매트 밖 발 벗어남(스탠스 아웃) 금지',
                    '벙커/수리지 무벌타 드롭 및 발자국 고무래 정리 필수',
                    '안전망/철조망 구제: 1클럽 무벌타 드롭',
                    '페어웨이 디봇 1클럽 무벌타 드롭 허용',
                    '동타 시 백카운트(후반 9홀 합산) 우선',
                    '동타 시 연장 서든데스 1홀 진행',
                  ].map((rule) => {
                    const isSelected = gameRuleNotes.includes(rule);
                    return (
                      <button
                        key={rule}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            const filtered = gameRuleNotes
                              .split(',')
                              .map((s) => s.trim())
                              .filter((s) => s && s !== rule && !s.includes(rule))
                              .join(', ');
                            setGameRuleNotes(filtered);
                          } else {
                            setGameRuleNotes((prev) => (prev ? `${prev}, ${rule}` : rule));
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 active:scale-95 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {isSelected ? '✓' : '+'} {rule}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 🎁 3. 대회 특별 시상 & 풍성한 행운상 (롱기스트 제외! 파크골프 맞춤!) */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    🎁 3. 대회 특별 시상 & 풍성한 행운상 (롱기스트 위험 제외)
                  </h4>
                  <span className="text-[10px] text-amber-700 font-bold">인기 시상 항목</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">
                  💡 파크골프는 안전을 위해 장타(롱기스트) 경쟁을 지양하고, 니어핀 및 다채로운 친목 행운상을 시상합니다.
                </p>

                {/* 기록 시상 */}
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-stone-600">🎯 기록 시상 (실력 & 나이스 샷)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '홀인원(Hole-in-One) 축하상',
                      '4번홀 니어핀 시상 (파3 홀컵 최근접)',
                      '최다 버디상 (공격적 플레이어)',
                      '다파상 (Par Master: 18홀 최다 파)',
                    ].map((rule) => {
                      const isSelected = gameRuleNotes.includes(rule);
                      return (
                        <button
                          key={rule}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              const filtered = gameRuleNotes
                                .split(',')
                                .map((s) => s.trim())
                                .filter((s) => s && s !== rule && !s.includes(rule))
                                .join(', ');
                              setGameRuleNotes(filtered);
                            } else {
                              setGameRuleNotes((prev) => (prev ? `${prev}, ${rule}` : rule));
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 active:scale-95 ${
                            isSelected
                              ? 'bg-amber-500 text-amber-950 border-amber-600 shadow-xs font-black'
                              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          {isSelected ? '✓' : '+'} {rule}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 행운 & 친목 시상 */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-black text-stone-600">🍀 행운 & 친목 시상 (풍성한 선물)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '행운의 오리상 (22위: 오리 두 마리 행운상)',
                      '행운의 럭키세븐상 (7위 시상)',
                      '행운의 피그상 (88위 또는 특정 순위 횡재상)',
                      '열정 격려상 (초보 완주 응원, 최다 타수)',
                      '아차상 (1타 차 입상 탈락자 위로)',
                      '베스트 매너상 (신사·숙녀 신사도상)',
                      '잉꼬 원앙상 (부부/가족 동반 참가상)',
                      '현장 실시간 행운권 룰렛 추첨 가동',
                    ].map((rule) => {
                      const isSelected = gameRuleNotes.includes(rule);
                      return (
                        <button
                          key={rule}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              const filtered = gameRuleNotes
                                .split(',')
                                .map((s) => s.trim())
                                .filter((s) => s && s !== rule && !s.includes(rule))
                                .join(', ');
                              setGameRuleNotes(filtered);
                            } else {
                              setGameRuleNotes((prev) => (prev ? `${prev}, ${rule}` : rule));
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 active:scale-95 ${
                            isSelected
                              ? 'bg-amber-100 text-amber-900 border-amber-400 shadow-2xs font-black'
                              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          {isSelected ? '✓' : '+'} {rule}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 🛡️ 4. 직전 대회 우승자 시상 유예 (독식 방지 - [ N ]개월간 가변 선택) */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                    🛡️ 4. 직전 우승자 상품 시상 유예 (독식 방지 가변 설정)
                  </h4>
                  <span className="text-[10px] text-purple-700 font-bold">화합 로컬 룰</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">
                  우승 고수의 상품 독식을 방지하고 차순위(2위) 회원에게 상품을 승계합니다. (1위 고수에게는 명예 메달리스트 수여)
                </p>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {[
                    { label: '미적용 (0개월)', val: 0 },
                    { label: '1개월간 유예', val: 1 },
                    { label: '2개월간 유예', val: 2 },
                    { label: '3개월간 유예 (표준)', val: 3 },
                    { label: '6개월간 유예', val: 6 },
                  ].map((m) => {
                    const isSelected = customGraceMonths === m.val;
                    return (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => {
                          setCustomGraceMonths(m.val);
                          let notes = gameRuleNotes
                            .split(',')
                            .map((s) => s.trim())
                            .filter((s) => s && !s.includes('우승자') && !s.includes('시상 유예'));
                          if (m.val > 0) {
                            notes.push(`직전 대회 우승자 ${m.val}개월간 상품 시상 유예 (차순위 승계 & 명예 메달리스트 분리)`);
                          }
                          setGameRuleNotes(notes.join(', '));
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{m.label}
                      </button>
                    );
                  })}
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-[11px] font-bold text-stone-600">직접 입력:</span>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={customGraceMonths}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        setCustomGraceMonths(val);
                        let notes = gameRuleNotes
                          .split(',')
                          .map((s) => s.trim())
                          .filter((s) => s && !s.includes('우승자') && !s.includes('시상 유예'));
                        if (val > 0) {
                          notes.push(`직전 대회 우승자 ${val}개월간 상품 시상 유예 (차순위 승계 & 명예 메달리스트 분리)`);
                        }
                        setGameRuleNotes(notes.join(', '));
                      }}
                      className="w-14 px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-black text-center"
                    />
                    <span className="text-[11px] font-bold text-stone-600">개월간</span>
                  </div>
                </div>
              </div>

              {/* 🤝 5. 파크골프 에티켓 & 매너 규정 */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    🤝 5. 파크골프 에티켓 & 매너 규정
                  </h4>
                  <span className="text-[10px] text-blue-700 font-bold">신사도 경기</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '동반자 스코어 상호 확인 및 경기 후 최종 서명 필수',
                    '그린 잔디 보호: 클럽 헤드로 잔디 찍기(디봇 내기) 절대 금지',
                    '볼 마킹 매너: 다른 동반자 퍼팅 라인 방해 시 볼마커 필수 사용',
                    '플레이 지연 방지 (홀당 준비된 선수부터 신속 티샷)',
                  ].map((rule) => {
                    const isSelected = gameRuleNotes.includes(rule);
                    return (
                      <button
                        key={rule}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            const filtered = gameRuleNotes
                              .split(',')
                              .map((s) => s.trim())
                              .filter((s) => s && s !== rule && !s.includes(rule))
                              .join(', ');
                            setGameRuleNotes(filtered);
                          } else {
                            setGameRuleNotes((prev) => (prev ? `${prev}, ${rule}` : rule));
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 active:scale-95 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        {isSelected ? '✓' : '+'} {rule}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ✏️ 최종 공시 안내문 (직접 수정/추가 가능) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                    최종 공시 안내문 (실시간 조합 및 직접 타이핑 수정 가능)
                  </label>
                  <button
                    type="button"
                    onClick={() => setGameRuleNotes('')}
                    className="text-[11px] text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
                  >
                    내용 비우기
                  </button>
                </div>
                <textarea
                  value={gameRuleNotes}
                  onChange={(e) => setGameRuleNotes(e.target.value)}
                  rows={4}
                  placeholder="대회 규정, 컨시드 기준, 특별 시상 내역 등을 자유롭게 적거나 위 버튼을 눌러 추가하세요."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-2xl text-xs font-bold leading-relaxed resize-none focus:bg-white focus:border-emerald-500 transition shadow-2xs"
                />
              </div>
            </div>

            {/* 팝업 푸터 (하단 고정) */}
            <div className="p-4 bg-stone-100 border-t border-stone-200 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreateRulesModal(false)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-md cursor-pointer transition active:scale-98 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                로컬 룰 공시 설정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: 전국 구장 검색 모달 */}
      {/* ========================================================================= */}
      {showCourseSearchModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-base">전국 파크골프장 검색</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCourseSearchModal(false)}
                className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={courseSearchTerm}
                  onChange={(e) => setCourseSearchTerm(e.target.value)}
                  placeholder="구장명 또는 지역 검색 (예: 동락, 부산, 양평, 대구)"
                  className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600 focus:bg-white"
                  autoFocus
                />
              </div>

              {/* 지역 필터 칩 (대한민국 전국 표준 행정 지명 순서) */}
              <div className="flex flex-wrap gap-1">
                {['전체', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'].map((reg) => (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => setCourseRegionFilter(reg)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      courseRegionFilter === reg
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-0.5">
                {filteredSearchCourses.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-400">
                    검색된 파크골프장이 없습니다.
                  </div>
                ) : null}
                {filteredSearchCourses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => confirmCourseSelection(c.id)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 hover:bg-emerald-50 hover:border-emerald-400 text-left transition flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-black text-stone-900">{c.name}</div>
                      <div className="text-[11px] text-stone-500 font-medium">
                        {c.region} · 총 {c.totalHoles}홀
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-700">선택</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: 모임 방 정보 수정 모달 */}
      {/* ========================================================================= */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-800 to-purple-950 text-white p-4 flex items-center justify-between">
              <h3 className="font-extrabold text-base">모임 방 설정 수정</h3>
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoomEdit} className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-700">모임 이름</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">총무 이름</label>
                <input
                  type="text"
                  value={editHostName}
                  onChange={(e) => setEditHostName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">진행 상태</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'RECRUITING' | 'PLAYING' | 'FINISHED')}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                >
                  <option value="RECRUITING">⏳ 참가 접수 중</option>
                  <option value="PLAYING">⛳ 실시간 라운드 중</option>
                  <option value="FINISHED">🏁 경기 종료 (결과 확정)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">1인 참가비 (원, 0이면 무료)</label>
                <input
                  type="number"
                  value={editEntryFee}
                  onChange={(e) => setEditEntryFee(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">입금 계좌 안내</label>
                <input
                  type="text"
                  value={editBankAccount}
                  onChange={(e) => setEditBankAccount(e.target.value)}
                  placeholder="예: 농협 352-1234-5678-93 김총무"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">대회 경기 방식</label>
                <select
                  value={editGameMode}
                  onChange={(e) => setEditGameMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                >
                  <option value="NEW_PERIO">🎯 신페리오 방식 (12개 숨은 홀 핸디캡)</option>
                  <option value="STROKE">🏆 정통 스트로크 (18홀 최저타수 순위)</option>
                  <option value="SCRAMBLE">🤝 팀 스크램블 (단체 베스트볼)</option>
                  <option value="CASUAL">⛳ 친선 명랑 라운드 (친목)</option>
                  <option value="STABLEFORD">🎖️ 스테이블포드 (홀별 승점제)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">대회 로컬 룰 & 특별 시상 공시</label>
                <textarea
                  rows={2}
                  value={editGameRuleNotes}
                  onChange={(e) => setEditGameRuleNotes(e.target.value)}
                  placeholder="예: OB 시 2벌타 특설티 진행, 컨시드 1클럽, 4번홀 니어핀 시상"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="w-1/3 py-2.5 bg-stone-100 text-stone-600 font-bold rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-purple-700 text-white font-black rounded-xl"
                >
                  수정 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: 모임 방 삭제 확인 모달 */}
      {/* ========================================================================= */}
      {roomToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-stone-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-stone-900">모임 방을 삭제하시겠습니까?</h3>
            <p className="text-xs text-stone-500 font-medium">
              &lsquo;{roomToDelete.title}&rsquo; 방의 스코어 및 조 편성 데이터가 모두 삭제됩니다.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoomToDelete(null)}
                className="flex-1 py-2.5 bg-stone-100 text-stone-600 font-bold text-xs rounded-xl"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl"
              >
                삭제 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: 클럽별 활동명 (실명 / 가명) 설정 모달 */}
      {/* ========================================================================= */}
      {aliasTargetClub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-stone-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-300" />
                <h3 className="font-extrabold text-base">클럽 내 활동명 설정</h3>
              </div>
              <button
                type="button"
                onClick={() => setAliasTargetClub(null)}
                className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-stone-800">
              <div>
                <p className="text-xs font-bold text-stone-600">
                  <span className="font-black text-emerald-800">&lsquo;{aliasTargetClub.name}&rsquo;</span>에서 사용할 회원님의 이름을 정해주세요.
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  클럽마다 실명(예: 김대희) 또는 닉네임(예: 나이스버디)을 다르게 지정할 수 있습니다.
                </p>
              </div>

              {/* 빠른 선택 버튼 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-stone-600">빠른 선택</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const kakaoUser = ParkOnStorage.getKakaoUser();
                      setAliasInputName(kakaoUser?.realName || '김대희');
                    }}
                    className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-left transition cursor-pointer"
                  >
                    <div className="text-[10px] font-bold text-emerald-700">실명 적용</div>
                    <div className="text-xs font-black text-emerald-950 truncate">
                      {ParkOnStorage.getKakaoUser()?.realName || '김대희'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const kakaoUser = ParkOnStorage.getKakaoUser();
                      setAliasInputName(kakaoUser?.aliasName || '나이스버디');
                    }}
                    className="p-2.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-left transition cursor-pointer"
                  >
                    <div className="text-[10px] font-bold text-purple-700">가명/닉네임 적용</div>
                    <div className="text-xs font-black text-purple-950 truncate">
                      {ParkOnStorage.getKakaoUser()?.aliasName || '나이스버디'}
                    </div>
                  </button>
                </div>
              </div>

              {/* 직접 입력창 */}
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700">활동명 직접 입력</label>
                <input
                  type="text"
                  value={aliasInputName}
                  onChange={(e) => setAliasInputName(e.target.value)}
                  placeholder="예: 김대희 또는 나이스버디"
                  maxLength={15}
                  className="w-full px-3 py-2.5 border-2 border-stone-300 focus:border-emerald-600 rounded-xl text-sm font-black focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAliasTargetClub(null)}
                  className="w-1/3 py-2.5 bg-stone-100 text-stone-600 font-bold text-xs rounded-xl"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = aliasInputName.trim();
                    if (!trimmed) {
                      alert('활동명을 입력해 주세요.');
                      return;
                    }
                    ParkOnStorage.setClubUserAlias(aliasTargetClub.id, trimmed);
                    ClubStorage.updateClubMemberAlias(aliasTargetClub.id, trimmed);
                    refreshAllData();
                    showToast(`'${aliasTargetClub.name}' 활동명이 '${trimmed}'(으)로 변경되었습니다.`);
                    setAliasTargetClub(null);
                  }}
                  className="w-2/3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                >
                  활동명 저장 확정
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 11: 카톡 가입 초청장 복사 완료 & 카톡 바로 전송 팝업 모달 */}
      {/* ========================================================================= */}
      {inviteModalClub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border-2 border-emerald-500 overflow-hidden">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📢</span>
                <div>
                  <h3 className="font-extrabold text-base leading-snug">
                    카톡 초청장 복사 완료!
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    {inviteModalClub.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalClub(null)}
                className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-stone-800">
              {/* 복사 성공 안내 박스 */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <h4 className="font-black text-xs text-emerald-950">
                    초대 문구와 가입 링크가 복사되었습니다!
                  </h4>
                  <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5 font-medium">
                    카카오톡 단체방이나 지인과의 채팅창에 들어가서 <strong>[붙여넣기]</strong>(입력창을 꾹 누른 후 &lsquo;붙여넣기&rsquo;) 하시면 바로 전송됩니다.
                  </p>
                </div>
              </div>

              {/* 복사된 초대장 전문 미리보기 */}
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 flex items-center justify-between">
                  <span>초청장 내용 미리보기</span>
                  <span className="text-[10px] text-stone-400 font-bold">클립보드 저장 내용</span>
                </label>
                <div className="bg-stone-50 border border-stone-300 rounded-xl p-3 text-[11px] text-stone-800 whitespace-pre-line font-mono leading-relaxed max-h-36 overflow-y-auto">
                  {ClubStorage.generateClubInviteText(inviteModalClub)}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-2 pt-1">
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const text = ClubStorage.generateClubInviteText(inviteModalClub);
                      try {
                        await navigator.share({
                          title: `[${inviteModalClub.name}] 가입 초청장`,
                          text,
                        });
                      } catch {
                        // ignore user cancel
                      }
                    }}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-amber-500"
                  >
                    <span>💬</span>
                    <span>카카오톡 앱으로 바로 전송하기</span>
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const text = ClubStorage.generateClubInviteText(inviteModalClub);
                      await copyTextToClipboard(text);
                      showToast('📢 클립보드에 한 번 더 복사되었습니다!');
                    }}
                    className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-xs rounded-xl border border-stone-300 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5 text-stone-600" />
                    <span>한 번 더 복사</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInviteModalClub(null)}
                    className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer text-center"
                  >
                    확인 (닫기)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: 1촌 전용 번개방 개설 모달 */}
      {/* ========================================================================= */}
      {showCreate1ChonModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                <h3 className="font-extrabold text-base">⚡ 1촌 안심 번개방 개설</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate1ChonModal(false)}
                className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate1ChonLightningSubmit} className="p-4 space-y-3.5 text-stone-800 max-h-[82vh] overflow-y-auto">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-medium leading-relaxed">
                💡 <strong>1촌 전용 번개 안내</strong>: 불특정 다수가 아닌 내 1촌 동반자들에게만 번개가 전달되며,
                각 1촌이 <strong>[수락하기 ✋]</strong>를 눌러야만 최종 참가 확정됩니다.
              </div>

              {/* 구장 선택 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800">번개 라운드 구장 선택 *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCourseSearchTarget('1CHON');
                      setCourseSearchTerm('');
                      setCourseRegionFilter('전체');
                      setShowCourseSearchModal(true);
                    }}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>전국 구장 검색</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCourseSearchTarget('1CHON');
                    setCourseSearchTerm('');
                    setCourseRegionFilter('전체');
                    setShowCourseSearchModal(true);
                  }}
                  className="w-full p-2.5 bg-stone-50 hover:bg-emerald-50/50 border border-stone-300 rounded-xl flex items-center justify-between text-xs font-bold text-stone-800 transition cursor-pointer text-left"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate font-black">{ltnSelectedCourse.name}</span>
                  </span>
                  <span className="text-stone-500 shrink-0 text-[11px] ml-2">
                    {ltnSelectedCourse.region} · {ltnSelectedCourse.totalHoles}홀 ▾
                  </span>
                </button>
              </div>

              {/* 일시 선택 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">일자 선택</label>
                  <select
                    value={ltnDateStr}
                    onChange={(e) => setLtnDateStr(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="오늘">오늘</option>
                    <option value="내일">내일</option>
                    <option value="이번 주 토요일">이번 주 토요일</option>
                    <option value="이번 주 일요일">이번 주 일요일</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">티오프 시간</label>
                  <input
                    type="time"
                    value={ltnTimeStr}
                    onChange={(e) => setLtnTimeStr(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* 번개 구분 2가지 선택 (4인 번개 vs 4인 이상 무제한 번개) */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-stone-800">번개 방식 선택 (2가지) *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLtnLightningScope('FOUR_PLAYERS')}
                    className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                      ltnLightningScope === 'FOUR_PLAYERS'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-300 shadow-xs'
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-stone-900">⛳ 4명 라운드 (기본)</span>
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
                        기본 4인
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium mt-1 leading-snug">
                      최대 4인 (1개 조)<br />
                      <strong className="text-emerald-800 font-bold">2명만 모여도 즉시 출발!</strong>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLtnLightningScope('MULTI_OPEN')}
                    className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                      ltnLightningScope === 'MULTI_OPEN'
                        ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-300 shadow-xs'
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-stone-900">👥 인원 수 제한 없음</span>
                      <span className="bg-amber-500 text-stone-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                        무제한
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium mt-1 leading-snug">
                      5인, 10인, 20인 자유 참가<br />
                      <strong className="text-emerald-800 font-bold">모인 인원으로 자동 조 편성</strong>
                    </div>
                  </button>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 font-medium leading-relaxed">
                  {ltnLightningScope === 'FOUR_PLAYERS' ? (
                    <span>💡 <strong>4인 번개</strong>: 4인이 안 되어도 <strong>두 명만 수락하면 방장이 즉시 라운드를 시작</strong>할 수 있습니다.</span>
                  ) : (
                    <span>💡 <strong>4인 이상 번개</strong>: 5명이든, 10명이든, 20명이든 인원 제한 없이 참가할 수 있으며, 2인 이상 모이면 언제든 방장이 조별 전광판 라운드를 시작할 수 있습니다.</span>
                  )}
                </div>
              </div>

              {/* 특정 1촌 지정 선택 (선택 사항) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800">초대할 1촌 지정 (선택)</label>
                  <span className="text-[10px] text-stone-500">미선택 시 전체 1촌에게 발송</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {companions.map((c) => {
                    const isSelected = ltnInvited1Chons.includes(c.companionName);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setLtnInvited1Chons(ltnInvited1Chons.filter((n) => n !== c.companionName));
                          } else {
                            setLtnInvited1Chons([...ltnInvited1Chons, c.companionName]);
                          }
                        }}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-800'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {isSelected ? '✓' : '+'} {c.companionName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 번개 안내 메시지 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">동반자 초대 한마디</label>
                <input
                  type="text"
                  value={ltnNotes}
                  onChange={(e) => setLtnNotes(e.target.value)}
                  placeholder="예: 오후 선선할 때 18홀 편하게 도실 1촌 수락해주세요!"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-[50px] bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-black text-sm rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-emerald-600"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>⚡ 1촌 번개방 오픈하기 (수락 대기 시작)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 10: 클럽원 전용 번개 개설 모달 */}
      {/* ========================================================================= */}
      {showCreateClubFlashModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-stone-950 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-stone-950" />
                <h3 className="font-extrabold text-base">⚡ 클럽원 전용 번개 개설</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateClubFlashModal(false)}
                className="text-stone-800 hover:text-black p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClubFlashSubmit} className="p-4 space-y-3.5 text-stone-800 max-h-[82vh] overflow-y-auto">
              {/* 클럽 선택 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">대상 클럽</label>
                <select
                  value={selectedFlashClubId}
                  onChange={(e) => {
                    setSelectedFlashClubId(e.target.value);
                    const c = clubs.find((x) => x.id === e.target.value);
                    if (c && c.homeCourseId) setClubFlashCourseId(c.homeCourseId);
                  }}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-600"
                >
                  {myClubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      🏛️ {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 번개 제목 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">번개 모집 제목 *</label>
                <input
                  type="text"
                  value={clubFlashTitle}
                  onChange={(e) => setClubFlashTitle(e.target.value)}
                  placeholder="예: 오늘 14:00 2명 급구!"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              {/* 구장 선택 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800">번개 라운드 구장 선택 *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setCourseSearchTarget('CLUB_FLASH');
                      setCourseSearchTerm('');
                      setCourseRegionFilter('전체');
                      setShowCourseSearchModal(true);
                    }}
                    className="text-amber-700 hover:text-amber-900 text-xs font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>전국 구장 검색</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCourseSearchTarget('CLUB_FLASH');
                    setCourseSearchTerm('');
                    setCourseRegionFilter('전체');
                    setShowCourseSearchModal(true);
                  }}
                  className="w-full p-2.5 bg-stone-50 hover:bg-amber-50/50 border border-stone-300 rounded-xl flex items-center justify-between text-xs font-bold text-stone-800 transition cursor-pointer text-left"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate font-black">{clubFlashSelectedCourse.name}</span>
                  </span>
                  <span className="text-stone-500 shrink-0 text-[11px] ml-2">
                    {clubFlashSelectedCourse.region} · {clubFlashSelectedCourse.totalHoles}홀 ▾
                  </span>
                </button>
              </div>

              {/* 일시 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">일자</label>
                  <select
                    value={clubFlashDate}
                    onChange={(e) => setClubFlashDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                  >
                    <option value="오늘">오늘</option>
                    <option value="내일">내일</option>
                    <option value="이번 주 토요일">이번 주 토요일</option>
                    <option value="이번 주 일요일">이번 주 일요일</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">시간</label>
                  <input
                    type="time"
                    value={clubFlashTime}
                    onChange={(e) => setClubFlashTime(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* 클럽 번개 구분 2가지 선택 (4인 번개 vs 4인 이상 무제한 번개) */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-stone-800">클럽 번개 방식 선택 (2가지) *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setClubFlashLightningScope('FOUR_PLAYERS')}
                    className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                      clubFlashLightningScope === 'FOUR_PLAYERS'
                        ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-300 shadow-xs'
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-stone-900">⛳ 4명 라운드 (기본)</span>
                      <span className="bg-stone-800 text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                        기본 4인
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium mt-1 leading-snug">
                      최대 4인 (1개 조)<br />
                      <strong className="text-amber-900 font-bold">2명만 모여도 즉시 출발!</strong>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClubFlashLightningScope('MULTI_OPEN')}
                    className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                      clubFlashLightningScope === 'MULTI_OPEN'
                        ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-300 shadow-xs'
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-stone-900">👥 인원 수 제한 없음</span>
                      <span className="bg-amber-500 text-stone-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                        무제한
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium mt-1 leading-snug">
                      5인, 10인, 20인 자유 참가<br />
                      <strong className="text-amber-900 font-bold">모인 인원으로 자동 조 편성</strong>
                    </div>
                  </button>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-950 font-medium leading-relaxed">
                  {clubFlashLightningScope === 'FOUR_PLAYERS' ? (
                    <span>💡 <strong>4인 번개</strong>: 4인이 안 되어도 <strong>두 명만 모이면 번개 친 사람(방장)이 즉시 라운드를 시작</strong>할 수 있습니다.</span>
                  ) : (
                    <span>💡 <strong>4인 이상 번개</strong>: 5명이든, 10명이든, 20명이든 인원 제한 없이 회원이 참가하며, 모인 인원에 맞춰 2~5개 조로 자동 편성되어 전광판 룸이 시작됩니다.</span>
                  )}
                </div>
              </div>

              {/* 안내글 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">클럽원 안내 메시지</label>
                <input
                  type="text"
                  value={clubFlashNotes}
                  onChange={(e) => setClubFlashNotes(e.target.value)}
                  placeholder="예: 클럽 정회원 매너 라운드 함께해요!"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-[50px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-sm rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-amber-500"
                >
                  <Zap className="w-4 h-4 text-stone-950 fill-stone-950" />
                  <span>⚡ 클럽 전용 번개 모집 등록</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 번개 조 편성 미리보기 & 현장 자리 맞바꾸기(Swap) 모달 */}
      {previewRoom && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col border border-stone-200 animate-fadeIn">
            {/* 상단 타이틀 & 닫기 */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-sm shrink-0">
                  <Sparkles className="w-5 h-5 text-stone-950 fill-stone-950" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-stone-900 flex items-center gap-1.5 flex-wrap">
                    <span>번개 조 편성 & 자리 맞바꾸기</span>
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black px-2 py-0.5 rounded-full">
                      총 {previewRoom.groups.length}개 조 ({previewRoom.groups.reduce((s, g) => s + g.players.length, 0)}명)
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 font-semibold mt-0.5">
                    📍 {previewRoom.courseName} · 총괄 방장: <strong className="text-stone-900">{previewRoom.hostName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewRoom(null);
                  setSelectedSwapPlayer(null);
                }}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 안내 배너: 방장 1조 조장 고정 + 맞바꾸기 가이드 */}
            <div className="space-y-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3 text-xs leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <span className="bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded text-[10px] font-black">안내</span>
                <span>👑 번개 총괄 방장(<strong>{previewRoom.hostName}</strong>)은 <strong>1조 1번(1조 조장)</strong>으로 고정 배치되었습니다.</span>
              </div>
              <div className="flex items-start gap-2 text-stone-700 text-[11px] pt-1 border-t border-amber-200/60">
                <ArrowLeftRight className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>현장 조원 맞바꾸기(Swap)</strong>: 선수를 누른 후 다른 선수를 누르면 두 사람의 조가 즉시 맞바뀝니다.
                  {selectedSwapPlayer && (
                    <span className="text-amber-900 font-black ml-1 bg-amber-200/80 px-1.5 py-0.5 rounded">
                      👉 현재 '{selectedSwapPlayer.playerName}' 선택됨 - 맞바꿀 선수를 터치하세요!
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* 카톡 단톡방 공유 복사 바 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSharePreviewRoomKakao}
                className="w-full min-h-[46px] bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-black text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer border border-[#E6CF00] active:scale-98"
              >
                <Share2 className="w-4 h-4 text-[#191919]" />
                <span>📋 전체 조 편성 카톡 공지 복사</span>
              </button>
            </div>

            {/* 조 목록 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[46vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {previewRoom.groups.map((group, gIdx) => (
                  <div
                    key={group.groupNumber}
                    className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-stone-200/70 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-stone-900">{group.name}</span>
                        <span className="text-[10px] bg-stone-200 text-stone-700 font-bold px-1.5 py-0.2 rounded">
                          {group.startCourseLetter}코스 출발
                        </span>
                      </div>
                      <span className="text-[11px] font-black text-stone-500">
                        {group.players.length}명 배정
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {group.players.map((player, pIdx) => {
                        const isSelected =
                          selectedSwapPlayer?.groupIndex === gIdx &&
                          selectedSwapPlayer?.playerIndex === pIdx;
                        const isHostPlayer = player.name === previewRoom.hostName;

                        return (
                          <button
                            key={player.id || `${gIdx}_${pIdx}`}
                            type="button"
                            onClick={() => handlePlayerSwapClick(gIdx, pIdx)}
                            className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? 'bg-amber-100 border-2 border-amber-500 font-black text-stone-950 shadow-sm scale-102 ring-2 ring-amber-300'
                                : 'bg-white border border-stone-200 hover:border-amber-300 hover:bg-amber-50/50 text-stone-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {pIdx + 1}
                              </span>
                              <span className="font-bold text-xs truncate">{player.name}</span>
                              {player.isLeader && (
                                <span className="bg-amber-500 text-stone-950 text-[9px] font-black px-1.5 py-0.2 rounded shrink-0">
                                  👑 조장
                                </span>
                              )}
                              {isHostPlayer && (
                                <span className="bg-stone-900 text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded shrink-0">
                                  ⭐ 방장
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-stone-400 font-bold shrink-0">
                              {isSelected ? '선택됨 (터치해 취소)' : '터치해 맞바꾸기'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 하단 확정 버튼 영역 */}
            <div className="pt-2 border-t border-stone-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPreviewRoom(null);
                  setSelectedSwapPlayer(null);
                }}
                className="w-1/3 min-h-[50px] bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs sm:text-sm rounded-2xl transition cursor-pointer border border-stone-300"
              >
                닫기 / 모집 유지
              </button>
              <button
                type="button"
                onClick={handleConfirmAndStartRound}
                className="w-2/3 min-h-[50px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-emerald-500"
              >
                <Play className="w-5 h-5 text-white fill-white" />
                <span>🚀 조 편성 확정 & 전광판 시작!</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

