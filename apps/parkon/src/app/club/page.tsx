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
  Bell,
  AlertTriangle,
} from 'lucide-react';
import { ClubEventRoom, ClubGroup, ClubPlayer, ParkGolfClub, ClubMember, FlashGathering, TournamentType, ClubInvitation, ClubRecruitStatus } from '@/types/club';
import { Course } from '@/types/parkon';
import { ClubStorage } from '@/lib/clubStorage';
import { CompanionStorage, Companionship, CompanionLightningRound } from '@/lib/companionStorage';
import { ParkOnStorage } from '@/lib/storage';
import { DEFAULT_COURSES } from '@/lib/defaultCourses';
import { getDefaultSelfName } from '@/lib/playerUtils';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getCourseDualName } from '@/lib/courseLocalization';
import { calculateTier, getUserCompleted9Holes } from '@/lib/courseBlockTier';
import { DiamondTierBadge } from '@/components/DiamondTierBadge';

const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

const TEE_TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00',
];

function formatTeeTimeLabel(timeStr: string, isJapanese: boolean) {
  const parts = timeStr.split(':');
  const h = parseInt(parts[0] || '14', 10);
  const m = parts[1] || '00';
  const isPm = h >= 12;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const h12Str = h12 < 10 ? `0${h12}` : `${h12}`;

  if (isJapanese) {
    return `${isPm ? '午後' : '午前'} ${h12Str}:${m}`;
  }
  return `${isPm ? '오후' : '오전'} ${h12Str}:${m}`;
}

function formatKoreanPlayTime(timeStr?: string, isJa = false, isEn = false): string {
  if (!timeStr) {
    if (isJa) return '午後 2時';
    if (isEn) return '2:00 PM';
    return '오후 2시';
  }
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let hour = parseInt(match[1], 10);
    const min = parseInt(match[2], 10);
    const isPm = hour >= 12;
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;

    if (isJa) {
      const ampm = isPm ? '午後' : '午前';
      if (min === 0) return `${ampm} ${hour}時`;
      return `${ampm} ${hour}時 ${min}分`;
    }
    if (isEn) {
      const ampm = isPm ? 'PM' : 'AM';
      const minStr = min < 10 ? `0${min}` : `${min}`;
      return `${hour}:${minStr} ${ampm}`;
    }
    const ampm = isPm ? '오후' : '오전';
    if (min === 0) {
      return `${ampm} ${hour}시`;
    }
    return `${ampm} ${hour}시 ${min}분`;
  }
  return trimmed;
}

export default function ClubGatheringHomePage() {
  const router = useRouter();
  const { t, isJapanese, isEnglish } = useTranslation();

  // 3대 전문 허브 탭: 'CLUBS' (내 클럽 바로가기) | 'TOURNAMENTS' (새 대회 개설) | 'FLASH' (번개 모임 갖기)
  const [activeHubTab, setActiveHubTab] = useState<'CLUBS' | 'TOURNAMENTS' | 'FLASH'>('CLUBS');
  // 대회 개설 모달 호출 출처 ('HUB' | 'MANAGING_CLUB' | 'CLUB_GATHERING')
  const [createModalSource, setCreateModalSource] = useState<'HUB' | 'MANAGING_CLUB' | 'CLUB_GATHERING'>('HUB');


  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab')?.toUpperCase();
        if (tabParam === 'TOURNAMENTS' || tabParam === 'FLASH' || tabParam === 'CLUBS') {
          setActiveHubTab(tabParam as any);
          localStorage.setItem('parkon_club_active_tab', tabParam);
        } else {
          const savedTab = localStorage.getItem('parkon_club_active_tab');
          if (savedTab === 'TOURNAMENTS' || savedTab === 'FLASH' || savedTab === 'CLUBS') {
            setActiveHubTab(savedTab as any);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

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

  // 클럽 환경 설정(톱니바퀴) 모달 및 안전 탈퇴 2중 확인 모달 상태
  const [clubSettingModal, setClubSettingModal] = useState<ParkGolfClub | null>(null);
  const [confirmLeaveTarget, setConfirmLeaveTarget] = useState<ParkGolfClub | null>(null);
  const [clubNoticeAlertEnabled, setClubNoticeAlertEnabled] = useState<boolean>(true);
  const [clubRealtimeSyncEnabled, setClubRealtimeSyncEnabled] = useState<boolean>(true);


  // [NEW] 클럽 모임(정기전 / 번개) 개최 선택 모달 상태
  const [clubGatheringModal, setClubGatheringModal] = useState<ParkGolfClub | null>(null);

  // 클럽 3대 서브 탭 상태: 'SHORTCUT' (클럽 바로가기) | 'CREATE' (새 클럽 창단하기) | 'BROWSE' (클럽 찾아보기 가입)
  const [clubSubTab, setClubSubTab] = useState<'SHORTCUT' | 'CREATE' | 'BROWSE'>('SHORTCUT');
  const [clubBrowseSearch, setClubBrowseSearch] = useState('');
  const [browseConfirmedSearch, setBrowseConfirmedSearch] = useState('');
  // [NEW] 단원(회원) 모집 중인 클럽만 보기 필터
  const [onlyRecruitingFilter, setOnlyRecruitingFilter] = useState(false);

  const [managingClub, setManagingClub] = useState<ParkGolfClub | null>(null);
  const [managingClubTab, setManagingClubTab] = useState<'INVITE' | 'PENDING' | 'MEMBERS' | 'DUES'>('MEMBERS');
  const [roleModalMember, setRoleModalMember] = useState<{
    memberId: string;
    memberName: string;
    currentRole: string;
    customRoleName?: string;
  } | null>(null);
  const [customRoleInput, setCustomRoleInput] = useState('');
  // [NEW] 50인 이상 대규모 클럽 회원 검색 및 직책 필터 상태
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'ALL' | 'EXECUTIVE' | 'MEMBER'>('ALL');
  const [duesFilter, setDuesFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [clubMatchModal, setClubMatchModal] = useState<ParkGolfClub | null>(null);
  const [editRecruitStatus, setEditRecruitStatus] = useState<ClubRecruitStatus>('RECRUITING');
  const [editRecruitQuota, setEditRecruitQuota] = useState<number>(5);
  const [editRecruitDate, setEditRecruitDate] = useState<string>('');
  const [editRecruitNotes, setEditRecruitNotes] = useState<string>('');
  const [showArchivedMembers, setShowArchivedMembers] = useState<boolean>(false);
  const [expandedChronicleId, setExpandedChronicleId] = useState<string | null>(null);
  const [clubDetailTab, setClubDetailTab] = useState<'MEMBERS' | 'HALL_OF_FAME' | 'CHRONICLE'>('MEMBERS');
  const [chronicleSearchTerm, setChronicleSearchTerm] = useState('');
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});

  // 클럽 대항전 개설 및 대표 선수 선발 상태
  const [matchOpponentClubId, setMatchOpponentClubId] = useState<string>('OPEN');
  const [matchPlayerQuota, setMatchPlayerQuota] = useState<number>(16);
  const [matchSelectedMemberIds, setMatchSelectedMemberIds] = useState<string[]>([]);

  // 클럽 가입 신청 모달 상태
  const [applyingClub, setApplyingClub] = useState<ParkGolfClub | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantMessage, setApplicantMessage] = useState('');

  // 새 클럽 창단 폼 상태
  const [newClubName, setNewClubName] = useState('');
  const [newClubRegion, setNewClubRegion] = useState('경북 구미');
  const [newClubHomeCourseId, setNewClubHomeCourseId] = useState('course-gumi-dongrak');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [newClubPresident, setNewClubPresident] = useState('');
  const [newClubManager, setNewClubManager] = useState('');
  const [newClubPhone, setNewClubPhone] = useState('');

  // ========================================================
  // 2. [새 대회 개설 & 실시간 전광판] 상태
  // ========================================================
  const [rooms, setRooms] = useState<ClubEventRoom[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);
  const [createdSuccessRoom, setCreatedSuccessRoom] = useState<ClubEventRoom | null>(null);
  const [copiedSuccessInvite, setCopiedSuccessInvite] = useState<boolean>(false);
  const [tournamentViewMode, setTournamentViewMode] = useState<'CREATE' | 'LIVE_BOARD'>('LIVE_BOARD');

  // 대회 성격 및 규정: 클럽 대항전 vs 시·도 단위 공식 대회 vs 클럽 월례회
  const [tournamentType, setTournamentType] = useState<TournamentType>('CLUB_MATCH');
  const [participatingClubIds, setParticipatingClubIds] = useState<string[]>([]);
  const [regionalScope, setRegionalScope] = useState<string>('경상북도 구미시');

  // [NEW] 클럽 대항전(교류전) 전용 매칭 & 엔트리 상태 (대표님 요청)
  const [matchInviteType, setMatchInviteType] = useState<'DIRECT_CHALLENGE' | 'OPEN_CHALLENGE'>('DIRECT_CHALLENGE');
  const [matchTeamCount, setMatchTeamCount] = useState<number>(2); // 2개 팀, 3개 팀, 4개 팀
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(16); // 클럽당 16명 (기본)
  const [showOpponentClubPicker, setShowOpponentClubPicker] = useState<boolean>(false);
  const [opponentClubSearchTerm, setOpponentClubSearchTerm] = useState<string>('');

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
  const [targetPlayers, setTargetPlayers] = useState<number>(30); // 기본 30명 (대표님 요청)
  const [recruitPolicy, setRecruitPolicy] = useState<'OPEN_ALL' | 'FIXED_QUOTA'>('OPEN_ALL');
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
  const [showPastFlashGatherings, setShowPastFlashGatherings] = useState(false);

  // 1촌 번개 개설 모달 상태 (무제한 인원수 제한 없음 기본 추천)
  const [showCreate1ChonModal, setShowCreate1ChonModal] = useState(false);
  const [ltnLightningScope, setLtnLightningScope] = useState<'FOUR_PLAYERS' | 'MULTI_OPEN'>('MULTI_OPEN');
  const [ltnCourseId, setLtnCourseId] = useState('course-gumi-dongrak');
  const [ltnDateStr, setLtnDateStr] = useState('오늘');
  const [ltnTimeStr, setLtnTimeStr] = useState('14:30');
  const [ltnNotes, setLtnNotes] = useState('2인 이상 모이면 바로 출발합니다!');
  const [ltnInvited1Chons, setLtnInvited1Chons] = useState<string[]>([]);

  // 클럽원 전용 번개 개설 모달 상태 (무제한 인원수 제한 없음 기본 추천)
  const [showCreateClubFlashModal, setShowCreateClubFlashModal] = useState(false);
  const [clubFlashLightningScope, setClubFlashLightningScope] = useState<'FOUR_PLAYERS' | 'MULTI_OPEN'>('MULTI_OPEN');
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

  useEffect(() => {
    if (isJapanese) {
      if (!ltnNotes || ltnNotes === '2인 이상 모이면 바로 출발합니다!') {
        setLtnNotes('2人以上集まればすぐ出発します！');
      }
      if (!clubFlashNotes || clubFlashNotes === '2인 이상 모이면 언제든 바로 출발합니다!') {
        setClubFlashNotes('2人以上集まればいつでもすぐ出発します！');
      }
      if (!clubFlashTitle || clubFlashTitle === '오늘 번개 치실 분! (2인 이상 출발)') {
        setClubFlashTitle('本日招集マッチ参加者募集！(2名以上出発)');
      }
    } else {
      if (ltnNotes === '2人以上集まればすぐ出発します！') {
        setLtnNotes('2인 이상 모이면 바로 출발합니다!');
      }
      if (clubFlashNotes === '2人以上集まればいつでもすぐ出発します！') {
        setClubFlashNotes('2인 이상 모이면 언제든 바로 출발합니다!');
      }
      if (clubFlashTitle === '本日招集マッチ参加者募集！(2名以上出発)') {
        setClubFlashTitle('오늘 번개 치실 분! (2인 이상 출발)');
      }
    }
  }, [isJapanese]);

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

  // 직책 배지 표시 도우미 (회장/부회장/총무/감사/이사/경기위원장/맞춤직책)
  const getRoleBadge = (role: string, customRoleName?: string) => {
    if (customRoleName && customRoleName.trim()) {
      const name = customRoleName.trim();
      if (name.includes('회장') && !name.includes('부회장')) {
        return { text: `👑 ${name}`, style: 'bg-amber-400 text-stone-950 font-black shadow-2xs' };
      }
      if (name.includes('부회장')) {
        return { text: `🥈 ${name}`, style: 'bg-amber-100 text-amber-900 border border-amber-300 font-black' };
      }
      if (name.includes('총무') || name.includes('재무') || name.includes('사무')) {
        return { text: `📋 ${name}`, style: 'bg-emerald-600 text-white font-black shadow-2xs' };
      }
      if (name.includes('감사')) {
        return { text: `⚖️ ${name}`, style: 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-black' };
      }
      if (name.includes('이사') || name.includes('위원')) {
        return { text: `🏛️ ${name}`, style: 'bg-sky-100 text-sky-900 border border-sky-300 font-black' };
      }
      if (name.includes('고문')) {
        return { text: `🎖️ ${name}`, style: 'bg-purple-100 text-purple-900 border border-purple-300 font-black' };
      }
      return { text: `🏷️ ${name}`, style: 'bg-teal-100 text-teal-900 border border-teal-300 font-black' };
    }

    switch (role) {
      case 'PRESIDENT':
        return { text: '👑 회장', style: 'bg-amber-400 text-stone-950 font-black shadow-2xs' };
      case 'VICE_PRESIDENT':
        return { text: '🥈 부회장', style: 'bg-amber-100 text-amber-900 border border-amber-300 font-black' };
      case 'MANAGER':
        return { text: '📋 총무', style: 'bg-emerald-600 text-white font-black shadow-2xs' };
      case 'AUDITOR':
        return { text: '⚖️ 감사', style: 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-black' };
      case 'DIRECTOR':
        return { text: '🏛️ 이사', style: 'bg-sky-100 text-sky-900 border border-sky-300 font-black' };
      case 'CAPTAIN':
        return { text: '🏆 경기위원장', style: 'bg-orange-100 text-orange-900 border border-orange-300 font-black' };
      case 'MEMBER':
      default:
        return { text: '회원', style: 'bg-stone-200 text-stone-700 font-medium' };
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // [권한 제어] 특정 클럽의 총무/회장(임원진) 권한 여부 판별 (100% 자동 직책 판별)
  const isClubExecutive = (club: ParkGolfClub | null | undefined): boolean => {
    if (!club) return false;
    const selfName = (ParkOnStorage.getUserDisplayName(club.id) || ParkOnStorage.getUserDisplayName()).trim();
    const myMemberInfo = club.members?.find(
      (m) =>
        m.name.trim() === selfName ||
        m.name.includes('(본인)') ||
        m.name === '김대희' ||
        m.id === 'm1'
    );
    const actualManager =
      myMemberInfo?.role === 'MANAGER' ||
      club.managerName?.includes(selfName) ||
      club.managerName?.includes('김대희') ||
      club.managerName?.includes('본인');
    const actualPresident =
      myMemberInfo?.role === 'PRESIDENT' || club.presidentName?.includes(selfName);
    return Boolean(actualManager || actualPresident);
  };

  // [권한 제어] 사용자가 속한 클럽 중 하나라도 총무/임원진 권한이 있는지 여부 (100% 자동 직책 판별)
  const isAnyClubExecutive = (): boolean => {
    const myClubsList = clubs.filter((c) => myClubIds.includes(c.id));
    return myClubsList.some((c) => isClubExecutive(c));
  };

  const handleTabSwitch = (tab: 'CLUBS' | 'TOURNAMENTS' | 'FLASH') => {
    setActiveHubTab(tab);
    if (tab === 'TOURNAMENTS') {
      // 일반 회원은 항상 '실시간 전광판'으로 우선 진입 (대회 개설 센터 강제 진입 차단)
      if (!isAnyClubExecutive()) {
        setTournamentViewMode('LIVE_BOARD');
      }
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('parkon_club_active_tab', tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab.toLowerCase());
        window.history.replaceState({}, '', url.toString());
      } catch (e) {
        // ignore
      }
    }
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
    updateMatchTitle(matchInviteType, count, playersPerTeam, participatingClubIds);
  };

  // 대항전 팀당 출전 인원(엔트리) 변경
  const handlePlayersPerTeamChange = (count: number) => {
    const valid = Math.max(2, Math.min(100, count));
    setPlayersPerTeam(valid);
    const newTotal = matchTeamCount * valid;
    setTargetPlayers(newTotal);
    const opt = ClubStorage.calculateOptimalGroups(newTotal);
    setGroupCount(opt.groupCount);
    updateMatchTitle(matchInviteType, matchTeamCount, valid, participatingClubIds);
  };

  // 대항전 상대 클럽 지목 토글 (대표님 요청: 1개든 10개든 자유롭게 만족할 때까지 선택)
  const toggleOpponentClub = (clubId: string) => {
    let next: string[];
    if (participatingClubIds.includes(clubId)) {
      next = participatingClubIds.filter((id) => id !== clubId);
    } else {
      next = [...participatingClubIds, clubId];
    }
    setParticipatingClubIds(next);
    const newTeamCount = Math.max(2, next.length + 1);
    setMatchTeamCount(newTeamCount);
    const newTotal = newTeamCount * playersPerTeam;
    setTargetPlayers(newTotal);
    const opt = ClubStorage.calculateOptimalGroups(newTotal);
    setGroupCount(opt.groupCount);
    updateMatchTitle(matchInviteType, newTeamCount, playersPerTeam, next);
  };

  // 대항전 제목 자동 생성
  const updateMatchTitle = (
    inviteType: 'DIRECT_CHALLENGE' | 'OPEN_CHALLENGE',
    teamCount: number,
    perTeam: number,
    pClubIds: string[]
  ) => {
    const hostClub = clubs.find((c) => c.id === tournamentClubId) || myClubs[0];
    const hostName = hostClub ? hostClub.name.replace(' 파크골프 클럽', '').replace(' 클럽', '') : '우리 클럽';

    if (inviteType === 'OPEN_CHALLENGE') {
      setTitle(`[도전팀 구함] ${hostName} 친선 교류전 (${perTeam}인전) ⚔️`);
      return;
    }

    const oppClubs = clubs.filter((c) => pClubIds.includes(c.id) && c.id !== hostClub?.id);
    const oppNames = oppClubs.map((c) => c.name.replace(' 파크골프 클럽', '').replace(' 클럽', ''));

    const total = teamCount * perTeam;
    if (oppNames.length === 1) {
      setTitle(`${hostName} vs ${oppNames[0]} ${total}인 친선 대항전 ⚔️`);
    } else if (oppNames.length > 1) {
      setTitle(`${hostName} 외 ${oppNames.length}개 클럽 (${oppNames.join(', ')}) ${total}인 대항전 ⚔️`);
    } else {
      setTitle(`${hostName} 클럽 친선 대항전 (${perTeam}인전) ⚔️`);
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
    setCreatedSuccessRoom(newRoom);
    setCopiedSuccessInvite(false);
    showToast(`🏆 '${newRoom.title}' 대회가 개설되었습니다! 전광판에 등록되었습니다.`);
  };

  // 클럽 홈에서 '이 클럽 자체 월례회 열기' 클릭 시
  const handleOpenTournamentForClub = (club: ParkGolfClub) => {
    if (!isClubExecutive(club)) {
      showToast(`🔒 대회 개설은 '${club.name}' 총무 및 임원진 전용 권한입니다. 일반 회원은 개설된 대회 참가만 가능합니다.`);
      return;
    }
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
    if (!isAnyClubExecutive()) {
      showToast(isJapanese ? '🔒 クラブ対抗戦の開設は役員専用権限です。一般会員は開設された大会への参加のみ可能です。' : '🔒 클럽 대항전 개설은 클럽 총무 및 임원진 전용 권한입니다. 일반 회원은 개설된 대회 참가만 가능합니다.');
      return;
    }
    setTournamentType('CLUB_MATCH');
    setMatchInviteType('DIRECT_CHALLENGE');
    setMatchTeamCount(2);
    setPlayersPerTeam(16);
    setTargetPlayers(32);
    setGroupCount(8);
    setSelectedLetters(['A', 'B', 'C', 'D']);
    // 대표님 지시: 임의로 상대 클럽을 지정하지 않고 완전한 백지 상태([])로 시작
    setParticipatingClubIds([]);
    const hostClub = myClubs[0] || clubs[0];
    setTournamentClubId(hostClub?.id || '');
    const hostName = hostClub ? hostClub.name.replace(' 파크골프 클럽', '').replace(' 클럽', '') : '우리 클럽';
    setTitle(`${hostName} 클럽 대항전 ⚔️`);
    setCreateModalSource('HUB');
    handleTabSwitch('TOURNAMENTS');
    setTournamentViewMode('CREATE');
    setShowCreateModal(true);
  };

  // [🏆 시·도 단위 공식 오픈 대회] 모드 개설 팝업 오픈
  const handleOpenRegionalOpenTournament = () => {
    if (!isAnyClubExecutive()) {
      showToast(isJapanese ? '🔒 公式大会の開設は役員専用権限です。一般会員は開設された大会への参加のみ可能です。' : '🔒 시·도 단위 공식 대회 개설은 클럽 총무 및 임원진 전용 권한입니다. 일반 회원은 개설된 대회 참가만 가능합니다.');
      return;
    }
    setTournamentType('REGIONAL_OPEN');
    setRegionalScope('경상북도 구미시');
    setTitle('2026 제1회 구미시장배 파크골프 오픈 챔피언십 🏆');
    setTargetPlayers(64);
    setGroupCount(16);
    setSelectedLetters(['A', 'B', 'C', 'D']);
    setTournamentClubId('');
    setCreateModalSource('HUB');
    handleTabSwitch('TOURNAMENTS');
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

    const text = `⚡ [파크골프 올인원 1촌 번개 호출]
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

  // 클럽 번개 라운드 시작 (4인은 초기 스코어보드 라운드 설정(/round/new) 화면으로 진입, 5인 이상은 조 편성 미리보기 & 전광판)
  const handleStartClubFlashRound = (flash: FlashGathering) => {
    const rawParticipants = flash.currentParticipants || [];

    // 구장 ID 매칭 (양호/양포 및 구장명 대응)
    let targetCourseId = flash.courseId;
    const allCourses = ParkOnStorage.getAllCourses();
    const foundCourse = allCourses.find((c) => {
      if (flash.courseId && c.id === flash.courseId) return true;
      if (flash.courseName && c.name === flash.courseName) return true;
      const fName = (flash.courseName || '').toLowerCase().replace(/\s+/g, '');
      const cName = c.name.toLowerCase().replace(/\s+/g, '');
      if (fName && (cName.includes(fName) || fName.includes(cName))) return true;
      if ((fName.includes('양호') || fName.includes('양포')) && (cName.includes('양호') || cName.includes('양포'))) return true;
      return false;
    });
    if (foundCourse) {
      targetCourseId = foundCourse.id;
    } else if (!targetCourseId) {
      targetCourseId = ParkOnStorage.getHomeCourseId();
    }

    if (rawParticipants.length <= 4) {
      const names = rawParticipants.map((p) => p.name).filter(Boolean);
      if (names.length === 0) {
        const selfName = ParkOnStorage.getUserDisplayName(selectedFlashClubId) || '플레이어';
        names.push(selfName);
      }
      while (names.length < 4) {
        names.push(`동반자${names.length}`);
      }
      router.push(`/round/new?courseId=${encodeURIComponent(targetCourseId)}&players=${encodeURIComponent(names.slice(0, 4).join(','))}`);
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
    showToast(
      isJapanese
        ? `🔄 '${sourcePlayer.name}' ↔ '${targetPlayerObj.name}' 組の入れ替え完了！`
        : `🔄 '${sourcePlayer.name}' ↔ '${targetPlayerObj.name}' 조 맞바꾸기 완료!`
    );
  };

  // 번개 조 편성 카카오톡 단톡방 공유 복사
  const handleSharePreviewRoomKakao = async () => {
    if (!previewRoom) return;
    const text = ClubStorage.generateGroupFormationKakaoShareText(previewRoom, isJapanese);
    await copyTextToClipboard(text);
    if (isJapanese && typeof window !== 'undefined') {
      const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
      window.open(lineUrl, '_blank');
    }
    showToast(
      isJapanese
        ? `📋 全組編成のLINE告知文がコピーされました！ (LINEを開きます)`
        : `📋 전체 조 편성 카톡 공지문이 복사되었습니다! 단톡방에 붙여넣기 하세요.`
    );
  };


  // 조 편성 확정 및 실시간 전광판 룸 시작
  const handleConfirmAndStartRound = () => {
    if (!previewRoom) return;
    ClubStorage.saveRoom(previewRoom);
    showToast(
      isJapanese
        ? `⛳ 組編成が確定しました！ リアルタイム電光掲示板へ移動します。`
        : `⛳ 조 편성이 확정되었습니다! 실시간 전광판으로 입장합니다.`
    );
    const roomId = previewRoom.id;
    setPreviewRoom(null);
    setSelectedSwapPlayer(null);
    router.push(`/club/${roomId}`);
  };

  // 클럽 번개 카톡/LINE 공유
  const handleShareClubFlashKakao = async (flash: FlashGathering) => {
    const text = ClubStorage.generateFlashKakaoShareText(flash, isJapanese);
    await copyTextToClipboard(text);
    if (isJapanese && typeof window !== 'undefined') {
      const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
      window.open(lineUrl, '_blank');
    }
    showToast(
      isJapanese
        ? `📋 LINEクラブ共有案内文がコピーされました！ (LINEを開きます)`
        : `📋 카카오톡 클럽방 공유 안내문이 복사되었습니다! 클럽 단톡방에 붙여넣기 하세요.`
    );
  };

  // ========================================================
  // [클럽 창단 & 가입 핸들러]
  // ========================================================
  const handleCreateClubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim()) {
      showToast(isJapanese ? '⚠️ クラブ名を入力してください。' : '⚠️ 클럽 이름을 입력해 주세요.');
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
    setClubSubTab('SHORTCUT');
    showToast(`🎉 '${created.name}' 클럽이 창단되었습니다!`);
  };

  const handleJoinClub = (club: ParkGolfClub) => {
    const selfName = getDefaultSelfName();
    const result = ClubStorage.joinClub(club.id, selfName);
    refreshAllData();
    if (result && result.isRestored) {
      showToast(
        `🎉 '${club.name}'에 다시 오신 것을 환영합니다! 최초 가입일(${result.originalJoinedAt}) 및 과거 대회 출전 이력(${result.pastCount || 0}회)이 100% 원상 복구되었습니다!`
      );
    } else {
      showToast(`🎉 '${club.name}'에 가입되었습니다!`);
    }
  };

  // 클럽 탈퇴 요청 시 안전 2중 확인 팝업 호출
  const handleLeaveClub = (club: ParkGolfClub) => {
    setConfirmLeaveTarget(club);
  };

  // 2중 확인 팝업에서 최종 확인 클릭 시 실제 탈퇴 실행
  const handleExecuteLeaveClub = (club: ParkGolfClub) => {
    const selfName = getDefaultSelfName();
    ClubStorage.leaveClub(club.id, selfName);
    refreshAllData();
    if (managingClub?.id === club.id) setManagingClub(null);
    if (selectedClubDetail?.id === club.id) setSelectedClubDetail(null);
    setClubSettingModal(null);
    setConfirmLeaveTarget(null);
    showToast(`🚪 '${club.name}' 클럽에서 안전하게 탈퇴되었습니다. (과거 대회 이력은 비밀 보관소에 영구 보존되며 재가입 시 원상 복구됩니다)`);
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

  // [대표님 지시] 대기 신청자 전체 1초 일괄 승인
  const handleApproveAllPendingMembers = (clubId: string) => {
    const count = ClubStorage.approveAllPendingMembers(clubId);
    if (count > 0) {
      refreshAllData();
      const updated = ClubStorage.getClubById(clubId);
      if (updated && managingClub?.id === clubId) {
        setManagingClub(updated);
      }
      showToast(`🎉 대기 신청자 ${count}명 전원이 정회원으로 1초 일괄 승인되었습니다!`);
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

  // 직책 임명 및 위임 (회장 / 부회장 / 총무 / 감사 / 이사 / 경기위원장 / 맞춤직책 / 일반 회원)
  const handleAssignRole = (
    clubId: string,
    memberId: string,
    newRole: string,
    customRoleName?: string,
    memberName?: string
  ) => {
    const roleLabel = customRoleName?.trim()
      ? customRoleName.trim()
      : newRole === 'PRESIDENT'
      ? '회장'
      : newRole === 'VICE_PRESIDENT'
      ? '부회장'
      : newRole === 'MANAGER'
      ? '총무'
      : newRole === 'AUDITOR'
      ? '감사'
      : newRole === 'DIRECTOR'
      ? '이사'
      : newRole === 'CAPTAIN'
      ? '경기위원장'
      : '일반 회원';

    const success = ClubStorage.updateMemberRole(clubId, memberId, newRole, customRoleName);
    if (success) {
      refreshAllData();
      const updated = ClubStorage.getClubById(clubId);
      if (updated && managingClub?.id === clubId) {
        setManagingClub(updated);
      }
      showToast(`🎖️ '${memberName || '회원'}'님이 '${roleLabel}'(으)로 임명되었습니다.`);
      setRoleModalMember(null);
      setCustomRoleInput('');
    }
  };

  // 대항전 개설 및 대표 선수단 확정 등록
  const handleCreateClubMatchSubmit = (club: ParkGolfClub) => {
    if (matchSelectedMemberIds.length === 0) {
      showToast(isJapanese ? '⚠️ 対抗戦に出場する選手を最低1名以上選択してください。' : '⚠️ 대항전에 출전할 선수를 최소 1명 이상 선택해 주세요.');
      return;
    }

    const opponentClub = clubs.find((c) => c.id === matchOpponentClubId);
    const opponentName = opponentClub ? opponentClub.name.replace(' 파크골프 클럽', '').replace(' 클럽', '') : '도전팀';
    const hostName = club.name.replace(' 파크골프 클럽', '').replace(' 클럽', '');
    const titleText = matchOpponentClubId === 'OPEN'
      ? `[도전팀 구함] ${hostName} 친선 교류전 (${matchPlayerQuota}인전) ⚔️`
      : `${hostName} vs ${opponentName} ${matchPlayerQuota * 2}인 친선 대항전 ⚔️`;

    const selectedMembers = club.members.filter((m) => matchSelectedMemberIds.includes(m.id));
    const players: ClubPlayer[] = selectedMembers.map((m, idx) => ({
      id: `p_${Date.now()}_${idx}`,
      name: `[${hostName}] ${m.name}`,
      isLeader: idx === 0,
      scores: {},
      totalStrokes: 0,
      parDiff: 0,
      holesCompleted: 0,
      gender: 'M',
      handicapTier: 'INTERMEDIATE',
    }));

    const optimal = ClubStorage.calculateOptimalGroups(players.length);
    const groups: ClubGroup[] = [];
    let pIdx = 0;
    for (let i = 0; i < optimal.groupCount; i++) {
      const cap = optimal.distribution[i] || 4;
      const grpPlayers = players.slice(pIdx, pIdx + cap);
      pIdx += cap;
      groups.push({
        groupNumber: i + 1,
        name: `${i + 1}조`,
        startCourseLetter: 'A',
        players: grpPlayers,
        leaderName: grpPlayers[0]?.name || '',
        status: 'WAITING',
      });
    }

    const newRoom: ClubEventRoom = {
      id: `match_${Date.now()}`,
      title: titleText,
      clubId: club.id,
      clubName: club.name,
      courseId: club.homeCourseId,
      courseName: club.homeCourseName,
      hostName: club.managerName || club.presidentName || '클럽 집행부',
      selectedCourseLetters: ['A', 'B'],
      totalHoles: 18,
      targetTotalPlayers: matchPlayerQuota * (matchOpponentClubId === 'OPEN' ? 1 : 2),
      status: 'RECRUITING',
      createdAt: new Date().toISOString().split('T')[0],
      groups,
      waitingPool: [],
      gameMode: 'NEW_PERIO',
      tournamentType: 'CLUB_MATCH',
      participatingClubs: [
        { clubId: club.id, clubName: club.name },
        { clubId: opponentClub ? opponentClub.id : 'OPEN', clubName: opponentClub ? opponentClub.name : '도전 대기팀' },
      ],
    };

    ClubStorage.saveRoom(newRoom);
    refreshAllData();
    setManagingClub(null);
    setActiveHubTab('TOURNAMENTS');
    setTournamentViewMode('LIVE_BOARD');
    setJustCreatedId(newRoom.id);
    setCreatedSuccessRoom(newRoom);
    setCopiedSuccessInvite(false);
    showToast(`⚔️ '${titleText}'이 개설되었습니다! 우리 클럽 출전 선수 ${players.length}명이 등록되었습니다.`);
  };

  // 회원 연회비 납부 상태 토글
  const handleToggleMemberDues = (
    clubId: string,
    memberId: string,
    newPaidStatus: boolean,
    memberName: string
  ) => {
    const success = ClubStorage.updateMemberDues(clubId, memberId, newPaidStatus);
    if (success) {
      refreshAllData();
      const updated = ClubStorage.getClubById(clubId);
      if (updated && managingClub?.id === clubId) {
        setManagingClub(updated);
      }
      showToast(
        newPaidStatus
          ? `💰 '${memberName}'님의 연회비 납부 완료가 확인되었습니다.`
          : `⏳ '${memberName}'님이 미납 상태로 변경되었습니다.`
      );
    }
  };

  // 클럽 연회비 기준 금액 변경
  const handleUpdateAnnualDuesAmount = (clubId: string, amountStr: string) => {
    const num = parseInt(amountStr.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num) || num < 0) return;
    const success = ClubStorage.updateClubAnnualDues(clubId, num);
    if (success) {
      refreshAllData();
      const updated = ClubStorage.getClubById(clubId);
      if (updated && managingClub?.id === clubId) {
        setManagingClub(updated);
      }
      showToast(`💰 클럽 기준 연회비가 '${num.toLocaleString()}원'으로 설정되었습니다.`);
    }
  };

  // 회장/총무 클럽 통합 관리실 오픈
  const handleOpenClubManagement = (club: ParkGolfClub, defaultTab: 'PENDING' | 'MEMBERS' | 'DUES' = 'MEMBERS') => {
    setManagingClub(club);
    setManagingClubTab(defaultTab);
    setEditRecruitStatus(club.recruitStatus || (club.isParkOnClub !== false ? 'RECRUITING' : 'ALWAYS'));
    setEditRecruitQuota(club.recruitQuota !== undefined ? club.recruitQuota : 5);
    setEditRecruitDate(club.recruitTargetDate || '');
    setEditRecruitNotes(club.recruitNotes || '');
  };

  // 단원(회원) 모집 설정 저장
  const handleSaveRecruitmentSettings = () => {
    if (!managingClub) return;
    const updated = ClubStorage.updateClubRecruitment(managingClub.id, {
      recruitStatus: editRecruitStatus,
      recruitQuota: Number(editRecruitQuota) || 0,
      recruitTargetDate: editRecruitDate.trim(),
      recruitNotes: editRecruitNotes.trim(),
    });
    if (updated) {
      setManagingClub(updated);
      refreshAllData();
      showToast(`📢 '${managingClub.name}' 신규 단원 모집 설정이 저장되었습니다.`);
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
      showToast(isJapanese ? '⚠️ お名前を入力してください。' : '⚠️ 성함을 입력해 주세요.');
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
    showToast(
      isJapanese
        ? `📨 '${appliedClubName}'への加入申請が完了しました。総務の承認後に正会員として登録されます。`
        : `📨 '${appliedClubName}'에 가입 신청이 완료되었습니다. 총무님 승인 후 정회원으로 등록됩니다.`
    );
  };

  // 초청장 링크로 즉시 가입
  const handleDirectJoinByInvite = (club: ParkGolfClub) => {
    const myName = applicantName || getDefaultSelfName() || (isJapanese ? '会員' : '회원');
    ClubStorage.directJoinViaInvite(club.id, {
      name: myName,
      phone: applicantPhone || '',
    });
    refreshAllData();
    setShowClubBrowseModal(false);
    showToast(
      isJapanese
        ? `🎉 '${club.name}'に正会員として即時加入しました！`
        : `🎉 '${club.name}'에 즉시 정회원으로 가입되었습니다!`
    );
  };

  // ========================================================
  // [클럽 기반 공식 대회/월례회 개설 핸들러]
  // ========================================================
  const handleCreateTournamentForClub = (club: ParkGolfClub) => {
    setTournamentClubId(club.id);
    setSelectedCourseId(club.homeCourseId);
    setTitle(`[${club.name}] 정기 월례회`);
    setCreateModalSource('MANAGING_CLUB');
    handleTabSwitch('TOURNAMENTS');
    setShowCreateModal(true);
    showToast(
      isJapanese
        ? `🏆 '${club.name}' 公式大会・月例会開設画面へ移動しました。`
        : `🏆 '${club.name}' 공식 대회/월례회 개설 화면으로 이동했습니다.`
    );
  };

  // 새로 개설된 대회 카톡/LINE 초대장 복사
  const handleCopySuccessInvite = async () => {
    if (!createdSuccessRoom) return;
    const text = ClubStorage.generateKakaoShareText(createdSuccessRoom, isJapanese);
    await copyTextToClipboard(text);
    if (isJapanese && typeof window !== 'undefined') {
      const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
      window.open(lineUrl, '_blank');
    }
    setCopiedSuccessInvite(true);
    showToast(
      isJapanese
        ? `📢 '${createdSuccessRoom.title}' LINE招待状がコピーされました！ (LINEを開きます)`
        : `📢 '${createdSuccessRoom.title}' 카톡 초대장이 복사되었습니다! 카톡에 붙여넣기 하세요.`
    );
    setTimeout(() => setCopiedSuccessInvite(false), 4000);
  };

  // 카카오톡 / LINE 초대장 복사
  const handleCopyInvite = async (e: React.MouseEvent, room: ClubEventRoom) => {
    e.stopPropagation();
    const text = ClubStorage.generateKakaoShareText(room, isJapanese);
    await copyTextToClipboard(text);
    if (isJapanese && typeof window !== 'undefined') {
      const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
      window.open(lineUrl, '_blank');
    }
    setCopiedRoomId(room.id);
    setTimeout(() => setCopiedRoomId(null), 3000);
    showToast(
      isJapanese
        ? `📢 '${room.title}' LINE招待状がコピーされました！ (LINEを開きます)`
        : `📢 '${room.title}' 카톡 초대장이 복사되었습니다! 카톡에 붙여넣기 하세요.`
    );
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

  // --- 스마트 'N' 알림 상태 판별 로직 (대표님 맞춤: 번개/대회/클럽 독립 감지) ---
  // 1. 번개 모임 활성 여부 (개인 1촌 번개 vs 클럽 전용 번개)
  const hasActive1ChonFlash = Boolean(
    lightningRounds.some((r) => r.status === 'RECRUITING' || r.status === 'FULL') ||
    flashGatherings.some((f) => f.type === 'OPEN' && f.status !== 'CLOSED')
  );
  const hasActiveClubFlash = Boolean(
    flashGatherings.some((f) => f.type === 'CLUB_ONLY' && f.status !== 'CLOSED')
  );
  const hasFlashNotice = hasActive1ChonFlash || hasActiveClubFlash;

  // 2. 새 대회/대항전 활성 여부 (클럽 대항전 및 시·도 단위 공식대회)
  const hasTournamentNotice = Boolean(
    rooms.some(
      (r) =>
        (r.status === 'PLAYING' || r.status === 'RECRUITING') &&
        (r.tournamentType === 'CLUB_MATCH' || r.tournamentType === 'REGIONAL_OPEN')
    )
  );

  // 3. 클럽 자체 공지/초청장/승인대기/소속 클럽 활동 여부
  const hasClubNotice = Boolean(
    clubInvitations.length > 0 ||
    hasActiveClubFlash ||
    rooms.some((r) => r.tournamentType === 'CLUB_INTERNAL' && (r.status === 'PLAYING' || r.status === 'RECRUITING')) ||
    myClubs.some((c) => (c.pendingMembers?.length || 0) > 0)
  );

  return (
    <div className="p-3 max-w-xl mx-auto space-y-3 pb-12">
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

      {/* 파크골프 올인원 3대 소셜 & 대회 통합 관제 센터 타이틀 바 (군더더기 텍스트 완전 제거) */}
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-950 via-purple-950 to-stone-900 border-2 border-emerald-400/40 rounded-2xl shadow-sm text-white flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">⛳</span>
          <h1 className="text-xs sm:text-sm font-black text-amber-300 tracking-tight truncate">
            {isJapanese ? 'パークゴルフ オールインワン クラブ・大会・交流統合センター' : '파크골프 올인원 3대 소셜 & 대회 통합 관제 센터'}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/');
            }
          }}
          className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer shrink-0"
          title={isJapanese ? "閉じる" : "닫기"}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. 클럽 & 대회 & 번개 3대 핵심 탭 */}
      <section className="bg-white p-1.5 rounded-2xl border-2 border-stone-200 shadow-sm grid grid-cols-3 gap-1.5">
        {/* 탭 1: 내 클럽 바로가기 */}
        <button
          type="button"
          onClick={() => handleTabSwitch('CLUBS')}
          className={`relative py-2.5 px-1 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
            activeHubTab === 'CLUBS'
              ? 'bg-gradient-to-b from-emerald-600 to-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-400/40'
              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
          }`}
        >
          {hasClubNotice && (
            <span
              className="absolute top-1 right-1.5 w-3.5 h-3.5 bg-red-600 text-white text-[8.5px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse ring-1.5 ring-white shrink-0"
              title={isJapanese ? "所属クラブの通知/集まり/招待" : "소속 클럽 공지/모임/초청 알림"}
            >
              N
            </span>
          )}
          <Building2 className={`w-4 h-4 ${activeHubTab === 'CLUBS' ? 'text-amber-300' : 'text-emerald-700'}`} />
          <span className="whitespace-nowrap font-extrabold text-[11px]">{isJapanese ? 'クラブ' : '클럽'}</span>
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
              activeHubTab === 'CLUBS' ? 'bg-emerald-950 text-amber-300' : 'bg-stone-200 text-stone-600'
            }`}
          >
            {myClubs.length}{isJapanese ? '所属' : '개 소속'}
          </span>
        </button>

        {/* 탭 2: 새 대회 개설 */}
        <button
          type="button"
          onClick={() => handleTabSwitch('TOURNAMENTS')}
          className={`relative py-2.5 px-1 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
            activeHubTab === 'TOURNAMENTS'
              ? 'bg-gradient-to-b from-purple-700 to-purple-900 text-white border-purple-950 shadow-md ring-2 ring-purple-400/40'
              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
          }`}
        >
          {hasTournamentNotice && (
            <span
              className="absolute top-1 right-1.5 w-3.5 h-3.5 bg-red-600 text-white text-[8.5px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse ring-1.5 ring-white shrink-0"
              title={isJapanese ? "進行/募集中の新大会・対抗戦通知" : "진행/모집 중인 새 대회·대항전 알림"}
            >
              N
            </span>
          )}
          <Swords className={`w-4 h-4 ${activeHubTab === 'TOURNAMENTS' ? 'text-yellow-300' : 'text-purple-700'}`} />
          <span className="whitespace-nowrap font-extrabold text-[11px]">{isJapanese ? '公式大会' : '새 대회'}</span>
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
              activeHubTab === 'TOURNAMENTS' ? 'bg-purple-950 text-yellow-300' : 'bg-stone-200 text-stone-600'
            }`}
          >
            {isJapanese ? '対抗戦・月例' : '대항전·시도'}
          </span>
        </button>

        {/* 탭 3: 번개 모임 갖기 */}
        <button
          type="button"
          onClick={() => handleTabSwitch('FLASH')}
          className={`relative py-2.5 px-1 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
            activeHubTab === 'FLASH'
              ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-stone-950 border-amber-800 shadow-md ring-2 ring-amber-300/60'
              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
          }`}
        >
          {hasFlashNotice && (
            <span
              className="absolute top-1 right-1.5 w-3.5 h-3.5 bg-red-600 text-white text-[8.5px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse ring-1.5 ring-white shrink-0"
              title={isJapanese ? "進行/募集中の仲間ラウンド通知" : "진행/모집 중인 번개 모임 알림"}
            >
              N
            </span>
          )}
          <Zap className={`w-4 h-4 ${activeHubTab === 'FLASH' ? 'text-stone-950 fill-stone-950' : 'text-amber-600'}`} />
          <span className="whitespace-nowrap font-extrabold text-[11px]">{isJapanese ? '仲間ラウンド' : '번개 모임'}</span>
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
              activeHubTab === 'FLASH' ? 'bg-amber-950 text-amber-300' : 'bg-stone-200 text-stone-600'
            }`}
          >
            {isJapanese ? '招集・交流' : '1촌·동호인'}
          </span>
        </button>
      </section>

      {/* ========================================================================= */}
      {/* 탭 1: [클럽 바로가기] (내 클럽 목록, 새 클럽 창단, 전국 클럽 탐색 및 가입) */}
      {/* ========================================================================= */}
      {activeHubTab === 'CLUBS' && (
        <div className="space-y-3 animate-fadeIn">
          {/* 대표님 요청: 클럽 3대 서브 탭 (클럽 바로가기 / 새 클럽 창단하기 / 클럽 찾아보기 가입) */}
          <div className="bg-white p-1.5 rounded-2xl border-2 border-stone-200 shadow-xs grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setClubSubTab('SHORTCUT')}
              className={`relative py-2 px-1 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                clubSubTab === 'SHORTCUT'
                  ? 'bg-gradient-to-b from-emerald-600 to-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-400/40'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              {hasClubNotice && (
                <span
                  className="absolute top-1 right-1.5 w-3.5 h-3.5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse ring-1 ring-white shrink-0"
                  title={isJapanese ? "新しい所属クラブ通知あり" : "새로운 소속 클럽 알림 있음"}
                >
                  N
                </span>
              )}
              <Building2 className={`w-4 h-4 ${clubSubTab === 'SHORTCUT' ? 'text-amber-300' : 'text-emerald-700'}`} />
              <span className="whitespace-nowrap font-extrabold text-[11px]">{isJapanese ? '所属クラブ' : '내 소속 클럽 바로가기'}</span>
            </button>

            <button
              type="button"
              onClick={() => setClubSubTab('CREATE')}
              className={`py-2 px-1 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                clubSubTab === 'CREATE'
                  ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-stone-950 border-amber-800 shadow-md ring-2 ring-amber-300/60'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              <Plus className={`w-4 h-4 ${clubSubTab === 'CREATE' ? 'text-stone-950' : 'text-amber-600'}`} />
              <span className="whitespace-nowrap font-extrabold text-[11px]">{isJapanese ? '新クラブ創設' : '새 클럽 창단하기'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setClubSubTab('BROWSE');
                setShowClubBrowseModal(true);
              }}
              className={`py-2 px-1 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
                clubSubTab === 'BROWSE'
                  ? 'bg-gradient-to-b from-purple-700 to-purple-900 text-white border-purple-950 shadow-md ring-2 ring-purple-400/40'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              <Search className={`w-4 h-4 ${clubSubTab === 'BROWSE' ? 'text-amber-300' : 'text-purple-700'}`} />
              <span className="whitespace-nowrap font-extrabold text-[11px]">{isJapanese ? 'クラブ検索・加入' : '클럽 찾아보기 가입'}</span>
            </button>
          </div>

          {/* ===================================================================== */}
          {/* 서브 탭 1: 클럽 바로가기 */}
          {/* ===================================================================== */}
          {clubSubTab === 'SHORTCUT' && (
            <div className="space-y-3 animate-fadeIn">
              {/* ⛳ [NEW] 실시간 기동된 내 대회 조 4인 대기실 원터치 입장 배너 */}
              {(() => {
                const selfName = (ParkOnStorage.getUserDisplayName() || '').trim();
                if (!selfName) return null;
                for (const r of rooms) {
                  if (r.status === 'PLAYING') {
                    for (const g of r.groups) {
                      if (g.linkedRoundRoomId && g.players.some((p) => p.name.includes(selfName) || selfName.includes(p.name))) {
                        return (
                          <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-2xl p-4 shadow-lg border-2 border-emerald-300 space-y-2.5 animate-fadeIn">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-ping" />
                                {isJapanese ? '大会リアルタイム待機中' : '대회 실시간 경기 기동됨'}
                              </span>
                              <span className="text-[11px] text-emerald-100 font-bold truncate max-w-[200px]">
                                {r.title}
                              </span>
                            </div>
                            <div className="text-sm font-black">
                              🏌️ <strong className="text-amber-300">{selfName}</strong> 님은 【제 {g.groupNumber}조】입니다!
                              <span className="text-xs text-emerald-100 font-medium ml-1.5">(조장: {g.leaderName})</span>
                            </div>
                            <Link
                              href={`/round/waiting?roomId=${g.linkedRoundRoomId}&guest=${encodeURIComponent(selfName)}`}
                              className="w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 text-stone-950 font-black text-xs py-3 rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-amber-300"
                            >
                              <span>👉 [ ⛳ 제 {g.groupNumber}조 실시간 경기 대기실 입장하기 ]</span>
                            </Link>
                          </div>
                        );
                      }
                    }
                  }
                }
                return null;
              })()}

              {/* 도착한 초청장 목록 */}
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
                            {isJapanese ? '届いたクラブ加入招待状' : '도착한 클럽 가입 초청장'}
                          </h3>
                          <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                            {clubInvitations.length}{isJapanese ? '件' : '건'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 font-bold mt-0.5">
                          {isJapanese
                            ? 'クラブ執行部から正会員の加入招待が届きました。'
                            : '클럽 집행부로부터 정회원 가입 초청을 받았습니다.'}
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
                                {isJapanese ? '招待状' : '초청장'}
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
                              <span>{inv.region} · {inv.homeCourseName}</span>
                            </p>
                            <p className="text-xs text-emerald-800 font-bold mt-1">
                              {isJapanese ? '招待者: ' : '초청자: '}{inv.inviterName}
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
                            <span>{isJapanese ? '🤝 招待を承認 (加入)' : '🤝 초청 수락 (가입)'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectInvite(inv.id, inv.clubName)}
                            className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-bold text-xs rounded-xl border border-stone-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <X className="w-4 h-4 text-stone-500" />
                            <span>{isJapanese ? '辞退する' : '정중히 거절'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 내 소속 클럽 카드 목록 */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-stone-800 px-1 gap-2 flex-wrap pb-0.5">
                  <span>{isJapanese ? `所属クラブ (${myClubs.length}箇所加入中)` : `내 소속 클럽 (${myClubs.length}곳 가입됨)`}</span>
                </div>

                {myClubs.length === 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center space-y-3 shadow-xs">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center text-2xl">
                      🏛️
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-stone-900 font-black">
                        {isJapanese ? '現在加入中のクラブがありません。' : '현재 가입된 클럽이 없습니다.'}
                      </p>
                      <p className="text-xs text-stone-500 font-medium">
                        {isJapanese
                          ? '新しいクラブを創設するか、全国のクラブを探して加入してみましょう！'
                          : '새로운 클럽을 창단하거나, 전국의 멋진 클럽을 찾아 가입해 보세요!'}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setClubSubTab('CREATE')}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black rounded-xl cursor-pointer shadow-xs transition active:scale-95"
                      >
                        + {isJapanese ? '新クラブ創設' : '새 클럽 창단하기'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setClubSubTab('BROWSE');
                          setShowClubBrowseModal(true);
                        }}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs transition active:scale-95"
                      >
                        🔍 {isJapanese ? 'クラブ検索 (加入)' : '클럽 찾아보기 (가입)'}
                      </button>
                    </div>
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

                  const actualManager =
                    myMemberInfo?.role === 'MANAGER' ||
                    club.managerName.includes(selfName) ||
                    club.managerName.includes('김대희') ||
                    club.managerName.includes('본인');
                  const actualPresident =
                    myMemberInfo?.role === 'PRESIDENT' || club.presidentName.includes(selfName);
                  const actualExecutive = actualManager || actualPresident;

                  // 대표님 지시: 클럽별 실제 권한(총무/회장 등)에 따라 100% 자동 직책 판별
                  const isExecutive = actualExecutive;
                  const isManager = isExecutive && actualManager;
                  const isPresident = isExecutive && !isManager && actualPresident;
                  const pendingCount = club.pendingMembers?.length || 0;

                  const thisClubHasActiveGathering = Boolean(
                    flashGatherings.some((f) => f.clubId === club.id && f.status !== 'CLOSED') ||
                    rooms.some((r) => r.clubId === club.id && r.tournamentType === 'CLUB_INTERNAL' && (r.status === 'PLAYING' || r.status === 'RECRUITING'))
                  );

                  const thisClubHasActiveMatch = Boolean(
                    rooms.some((r) =>
                      (r.clubId === club.id || r.participatingClubs?.some((p) => p.clubId === club.id)) &&
                      (r.tournamentType === 'CLUB_MATCH' || r.tournamentType === 'REGIONAL_OPEN') &&
                      (r.status === 'PLAYING' || r.status === 'RECRUITING')
                    )
                  );

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
                              {isJapanese ? '所属クラブ' : '내 소속 클럽'}
                            </span>
                            {isManager ? (
                              <span className="bg-amber-100 text-amber-950 border border-amber-400 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                                <span>👑</span>
                                <span>{isJapanese ? '総務 (管理者権限)' : '총무 (본인 관리 권한)'}</span>
                              </span>
                            ) : isPresident ? (
                              <span className="bg-purple-100 text-purple-950 border border-purple-400 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                                <span>🎖️</span>
                                <span>{isJapanese ? '会長 / 役員 (本人)' : '회장 / 임원 (본인)'}</span>
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                                <span>⛳</span>
                                <span>{isJapanese ? '正会員 (本人)' : '정회원 (본인)'}</span>
                              </span>
                            )}
                            <span className="text-[11px] text-stone-500 font-bold">
                              {isJapanese ? `会員 ${club.memberCount}人` : `회원 ${club.memberCount}명`}
                            </span>
                            {isExecutive && pendingCount > 0 && (
                              <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                                {isJapanese ? `加入承認待ち ${pendingCount}人!` : `가입 승인 대기 ${pendingCount}명!`}
                              </span>
                            )}
                          </div>
                          <h3 className="font-black text-base text-stone-900 mt-1 leading-snug">
                            {club.name}
                          </h3>
                          <p className="text-xs text-stone-500 font-medium flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{club.region} · {isJapanese ? 'ホームコース: ' : '홈 구장: '}<strong>{club.homeCourseName}</strong></span>
                          </p>
                        </div>

                        {/* 우측 상단: [⚙️ 설정] 및 그 바로 밑에 [📢 초청장] 버튼 */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setClubSettingModal(club)}
                            className="px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-950 transition cursor-pointer border border-stone-200 flex items-center gap-1 shadow-2xs active:scale-95 text-xs font-bold"
                            title={isJapanese ? `${club.name} 設定` : `${club.name} 환경 및 탈퇴 설정`}
                          >
                            <Settings className="w-3.5 h-3.5 text-stone-600" />
                            <span>{isJapanese ? '設定' : '설정'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleCopyClubInvite(e, club)}
                            className={`py-1 px-2.5 active:scale-95 text-xs font-black rounded-xl transition flex items-center gap-1 cursor-pointer border ${
                              copiedClubId === club.id
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300 animate-pulse'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs'
                            }`}
                            title={isJapanese ? "クラブ招待リンクコピー" : "클럽 가입 초청장 복사 및 카톡 공유"}
                          >
                            {copiedClubId === club.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                <span className="whitespace-nowrap">{isJapanese ? '✅ コピー済!' : '✅ 복사됨!'}</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                                <span className="whitespace-nowrap">{isJapanese ? '📢 招待' : '📢 초청장'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 font-medium bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                        💬 &ldquo;{club.description}&rdquo;
                      </p>

                      {/* 3대 핵심 액션 버튼 (회장·총무 관리자 vs 일반 회원) */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {isExecutive ? (
                          <>
                            {/* 1. 회원 관리 (회장/총무) */}
                            <button
                              type="button"
                              onClick={() => {
                                handleOpenClubManagement(club, pendingCount > 0 ? 'PENDING' : 'MEMBERS');
                              }}
                              className="py-2.5 px-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer text-center"
                              title={isJapanese ? "新規加入承認および会員管理" : "신규 가입 승인 및 회원 관리"}
                            >
                              <Users className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                              <span className="truncate">{isJapanese ? '👥 会員管理' : '👥 회원 관리'}</span>
                            </button>

                            {/* 2. 클럽 모임 개최 (정기전 / 번개) */}
                            <button
                              type="button"
                              onClick={() => setClubGatheringModal(club)}
                              className="relative py-2.5 px-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-black text-xs rounded-xl shadow-xs transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer text-center"
                              title={isJapanese ? "クラブ月例会・集まり開設" : "클럽 월례회·정기전 개설 또는 당일 번개치기"}
                            >
                              {thisClubHasActiveGathering && (
                                <span
                                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse ring-1.5 ring-white shrink-0"
                                  title={isJapanese ? "進行中のクラブ集まりあり" : "진행 중인 클럽 모임·번개 있음"}
                                >
                                  N
                                </span>
                              )}
                              <Calendar className="w-3.5 h-3.5 text-stone-950 shrink-0" />
                              <span className="truncate">{isJapanese ? '⛳ 月例会・集まり' : '⛳ 모임·정기전'}</span>
                            </button>

                            {/* 3. 대회·대항전 개설 (클럽 대항전 및 공식 대회) */}
                            <button
                              type="button"
                              onClick={() => {
                                setClubMatchModal(club);
                                setMatchSelectedMemberIds(club.members.map((m) => m.id));
                              }}
                              className="relative py-2.5 px-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer text-center"
                              title={isJapanese ? "他クラブ対抗戦または公式大会開設" : "타 클럽 대항전 또는 전국 공개 대회 개설"}
                            >
                              {thisClubHasActiveMatch && (
                                <span
                                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse ring-1.5 ring-white shrink-0"
                                  title={isJapanese ? "進行中のクラブ対抗戦あり" : "진행 중인 클럽 대항전 있음"}
                                >
                                  N
                                </span>
                              )}
                              <Swords className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                              <span className="truncate">{isJapanese ? '⚔️ 公式大会・対抗戦' : '⚔️ 대회·대항전'}</span>
                            </button>
                          </>
                        ) : (
                          <>
                            {/* 1. 회원 명부 (일반 회원) */}
                            <button
                              type="button"
                              onClick={() => setSelectedClubDetail(club)}
                              className="py-2.5 px-1.5 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 text-xs font-black rounded-xl shadow-xs transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer border border-stone-300 text-center"
                              title={isJapanese ? "クラブ会員名簿の確認" : "클럽 회원 명부 및 임원 현황 조회"}
                            >
                              <Users className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                              <span className="truncate">{isJapanese ? '👥 会員名簿' : '👥 회원 명부'}</span>
                            </button>

                            {/* 2. 정기전·번개 참여 (일반 회원) */}
                            <button
                              type="button"
                              onClick={() => {
                                setClubGatheringModal(club);
                              }}
                              className="relative py-2.5 px-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-black text-xs rounded-xl shadow-xs transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer text-center"
                              title={isJapanese ? "クラブの招集マッチ・定期戦に参加" : "우리 클럽 번개 라운드 및 정기 모임 현황 확인/참가"}
                            >
                              {thisClubHasActiveGathering && (
                                <span
                                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse ring-1.5 ring-white shrink-0"
                                  title={isJapanese ? "進行中のクラブ集まりあり" : "진행 중인 클럽 모임·번개 있음"}
                                >
                                  N
                                </span>
                              )}
                              <Zap className="w-3.5 h-3.5 text-stone-950 shrink-0" />
                              <span className="truncate">{isJapanese ? '⚡ 招集・定期戦' : '⚡ 번개·정기전'}</span>
                            </button>

                            {/* 3. 대회·대항전 참여 (일반 회원) */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveHubTab('TOURNAMENTS');
                                setTournamentViewMode('LIVE_BOARD');
                                showToast(isJapanese ? `🏆 '${club.name}' 出場対抗戦および公式大会電光板へ移動しました。` : `🏆 '${club.name}' 출전 대항전 및 공식 대회 전광판으로 이동했습니다.`);
                              }}
                              className="relative py-2.5 px-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer text-center"
                              title={isJapanese ? "進行中のクラブ対抗戦および公式大会電光板を確認" : "진행 중인 클럽 대항전 및 공식 대회 전광판 확인"}
                            >
                              {thisClubHasActiveMatch && (
                                <span
                                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse ring-1.5 ring-white shrink-0"
                                  title={isJapanese ? "進行中のクラブ対抗戦あり" : "진행 중인 클럽 대항전 있음"}
                                >
                                  N
                                </span>
                              )}
                              <Trophy className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                              <span className="truncate">{isJapanese ? '🏆 大会・対抗戦' : '🏆 대회·대항전'}</span>
                            </button>
                          </>
                        )}
                      </div>

                      {/* 📜 클럽 공식 연대기 (대회 실록 & 명예의 전당) 바로가기 */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClubDetail(club);
                          setClubDetailTab('CHRONICLE');
                        }}
                        className="w-full mt-2.5 py-2 px-3 bg-gradient-to-r from-amber-50 via-purple-50/40 to-amber-50 hover:from-amber-100 hover:to-purple-100 border border-amber-200/80 rounded-xl text-xs font-black text-amber-950 flex items-center justify-between transition cursor-pointer active:scale-98 shadow-2xs"
                      >
                        <span className="flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>📜 &lsquo;{club.name}&rsquo; {isJapanese ? '永久大会年代記＆殿堂' : '영구 대회 연대기 & 명예의 전당'}</span>
                        </span>
                        <span className="text-[10px] text-purple-700 font-extrabold flex items-center gap-0.5">
                          <span>{isJapanese ? '実録を見る' : '실록 보기'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 서브 탭 2: 새 클럽 창단하기 */}
          {/* ===================================================================== */}
          {clubSubTab === 'CREATE' && (
            <div className="bg-white rounded-2xl p-4 border-2 border-amber-300 shadow-sm space-y-4 animate-fadeIn">
              <div className="border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-sm">
                    🏛️
                  </span>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-stone-900">
                      {isJapanese ? '新パークゴルフクラブ創設' : '새 파크골프 클럽 창단하기'}
                    </h3>
                    <p className="text-[11px] text-stone-500 font-bold">
                      {isJapanese
                        ? '自分だけのクラブを開設し、愛好者仲間と大会や集まりを一緒に楽しみましょう。'
                        : '나만의 클럽을 개설하고 동호인 회원들과 대회 및 모임을 함께 즐기세요.'}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleCreateClubSubmit} className="space-y-3.5 text-stone-800">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">
                    {isJapanese ? 'クラブ名 *' : '클럽 이름 *'}
                  </label>
                  <input
                    type="text"
                    value={newClubName}
                    onChange={(e) => setNewClubName(e.target.value)}
                    placeholder={isJapanese ? '例: 幕別エースパークゴルフクラブ' : '예: 구미 동락 에이스 파크골프 클럽'}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500 focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">
                    {isJapanese ? '本拠地地域' : '연고 지역'}
                  </label>
                  <input
                    type="text"
                    value={newClubRegion}
                    onChange={(e) => setNewClubRegion(e.target.value)}
                    placeholder={isJapanese ? '例: 北海道幕別、札幌、福岡など' : '예: 경북 구미, 부산 사상, 대구 수성구 등'}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-stone-800">
                      {isJapanese ? 'ホームコース選択 *' : '홈 구장 선택 *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCourseSearchTarget('NEW_CLUB');
                        setCourseSearchTerm('');
                        setCourseRegionFilter(isJapanese ? 'すべて' : '전체');
                        setShowCourseSearchModal(true);
                      }}
                      className="text-emerald-700 hover:text-emerald-900 text-xs font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isJapanese ? '全国コース検索' : '전국 구장 검색'}</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCourseSearchTarget('NEW_CLUB');
                      setCourseSearchTerm('');
                      setCourseRegionFilter(isJapanese ? 'すべて' : '전체');
                      setShowCourseSearchModal(true);
                    }}
                    className="w-full p-2.5 bg-stone-50 hover:bg-amber-50/50 border border-stone-300 rounded-xl flex items-center justify-between text-xs font-bold text-stone-800 transition cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="truncate font-black">{newClubSelectedCourse.name}</span>
                    </span>
                    <span className="text-stone-500 shrink-0 text-[11px] ml-2">
                      {newClubSelectedCourse.region} · {newClubSelectedCourse.totalHoles}{isJapanese ? 'ホール' : '홀'} ▾
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-stone-800">
                      {isJapanese ? '会長名' : '회장 이름'}
                    </label>
                    <input
                      type="text"
                      value={newClubPresident}
                      onChange={(e) => setNewClubPresident(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-stone-800">
                      {isJapanese ? '総務名 (本人)' : '총무 이름 (본인)'}
                    </label>
                    <input
                      type="text"
                      value={newClubManager}
                      onChange={(e) => setNewClubManager(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">
                    {isJapanese ? '問合せ連絡先' : '문의 연락처'}
                  </label>
                  <input
                    type="text"
                    value={newClubPhone}
                    onChange={(e) => setNewClubPhone(e.target.value)}
                    placeholder="010-1234-5678"
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">
                    {isJapanese ? 'クラブ紹介文' : '클럽 소개글'}
                  </label>
                  <textarea
                    value={newClubDesc}
                    onChange={(e) => setNewClubDesc(e.target.value)}
                    rows={2}
                    placeholder={
                      isJapanese
                        ? '例: 幕別コースを愛する愛好者クラブです。毎月第2土曜日に定例月例会を開催！'
                        : '예: 구미 동락구장을 사랑하는 동호인 클럽입니다. 매월 둘째 주 토요일 정기 월례회 개최!'
                    }
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-stone-950 font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-amber-600 mt-2"
                >
                  <Plus className="w-5 h-5 text-stone-950" />
                  <span>{isJapanese ? '新クラブ創設完了 🚀' : '새 클럽 창단 완료 🚀'}</span>
                </button>
              </form>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 서브 탭 3: 클럽 찾아보기 가입 */}
          {/* ===================================================================== */}
          {clubSubTab === 'BROWSE' && (() => {
            const searchTerm = (browseConfirmedSearch || clubBrowseSearch).trim().toLowerCase();
            const filtered = clubs
              .filter((c) => {
                if (onlyRecruitingFilter) {
                  const isRec = c.recruitStatus === 'RECRUITING' || c.recruitStatus === 'ALWAYS';
                  if (!isRec) return false;
                }
                if (!searchTerm) return true;
                return (
                  c.name.toLowerCase().includes(searchTerm) ||
                  c.region.toLowerCase().includes(searchTerm) ||
                  c.homeCourseName.toLowerCase().includes(searchTerm) ||
                  (c.description && c.description.toLowerCase().includes(searchTerm))
                );
              })
              .sort((a, b) => {
                const aIsParkOn = a.isParkOnClub !== false ? 1 : 0;
                const bIsParkOn = b.isParkOnClub !== false ? 1 : 0;
                if (aIsParkOn !== bIsParkOn) return bIsParkOn - aIsParkOn;

                const aRec = a.recruitStatus === 'RECRUITING' || a.recruitStatus === 'ALWAYS' ? 2 : a.recruitStatus === 'SCHEDULED' ? 1 : 0;
                const bRec = b.recruitStatus === 'RECRUITING' || b.recruitStatus === 'ALWAYS' ? 2 : b.recruitStatus === 'SCHEDULED' ? 1 : 0;
                if (aRec !== bRec) return bRec - aRec;

                return (b.memberCount || 0) - (a.memberCount || 0);
              });

            return (
              <div className="bg-white rounded-2xl p-4 border-2 border-purple-200 shadow-sm space-y-3.5 animate-fadeIn">
                <div className="border-b border-stone-200 pb-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-black text-sm">
                        🔍
                      </span>
                      <div>
                        <h3 className="font-black text-sm sm:text-base text-stone-900">
                          {isJapanese ? '全国クラブ検索＆加入' : '전국 클럽 찾아보기 및 가입'}
                        </h3>
                        <p className="text-[11px] text-stone-500 font-bold">
                          {isJapanese
                            ? '希望のクラブに加入申請を送ると、総務の承認後に正会員として登録されます。'
                            : '원하는 클럽에 가입 신청을 보내면 총무님의 승인 후 정회원으로 등록됩니다.'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowClubBrowseModal(true)}
                      className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-black rounded-xl cursor-pointer transition shrink-0 flex items-center gap-1 shadow-2xs"
                    >
                      <span>🪟</span>
                      <span className="hidden sm:inline">{isJapanese ? 'ポップアップで' : '팝업창으로'}</span>
                      <span>{isJapanese ? '拡大表示' : '크게보기'}</span>
                    </button>
                  </div>

                  {/* 실시간 클럽 검색창 & 검색 버튼 */}
                  <div className="flex gap-2 pt-1">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={clubBrowseSearch}
                        onChange={(e) => setClubBrowseSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            setBrowseConfirmedSearch(clubBrowseSearch.trim());
                          }
                        }}
                        placeholder={
                          isJapanese
                            ? '地域(例: 北海道、幕別、札幌)またはクラブ名入力...'
                            : '지역(예: 구미, 대구, 부산) 또는 클럽명 입력...'
                        }
                        className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-300 focus:border-purple-500 rounded-xl text-xs font-bold outline-none focus:bg-white"
                      />
                      {clubBrowseSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setClubBrowseSearch('');
                            setBrowseConfirmedSearch('');
                          }}
                          className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 text-xs font-bold cursor-pointer p-0.5"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setBrowseConfirmedSearch(clubBrowseSearch.trim())}
                      className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer shrink-0 transition flex items-center gap-1"
                    >
                      <Search className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isJapanese ? '検索' : '검색'}</span>
                    </button>
                  </div>

                  {/* 단원(회원) 모집 필터 옵션 */}
                  <div className="flex items-center justify-between text-xs pt-1 px-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={onlyRecruitingFilter}
                        onChange={(e) => setOnlyRecruitingFilter(e.target.checked)}
                        className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                      />
                      <span className="font-extrabold text-stone-700 text-xs">
                        {isJapanese ? '🟢 新規メンバー募集中のクラブのみ表示' : '🟢 신규 단원(회원) 모집 중인 클럽만 보기'}
                      </span>
                    </label>
                    <span className="text-[10px] font-bold text-stone-400">
                      {isJapanese
                        ? onlyRecruitingFilter
                          ? '募集中フィルターON'
                          : '全状態'
                        : onlyRecruitingFilter
                        ? '모집 중 필터 켬'
                        : '전체 상태'}
                    </span>
                  </div>

                  {/* 검색 결과 수 안내 */}
                  <div className="text-[11px] font-black pt-0.5">
                    {searchTerm ? (
                      filtered.length > 0 ? (
                        <span className="text-purple-900">
                          {isJapanese
                            ? `✅ '${browseConfirmedSearch || clubBrowseSearch}' 検索結果: 全${filtered.length}クラブ (👑 パークゴルフ オールインワン加盟クラブ優先)`
                            : `✅ '${browseConfirmedSearch || clubBrowseSearch}' 검색 결과: 총 ${filtered.length}개 클럽 (👑 파크골프 올인원 가입 클럽 1순위)`}
                        </span>
                      ) : (
                        <span className="text-rose-600">
                          {isJapanese
                            ? `❌ '${browseConfirmedSearch || clubBrowseSearch}' の検索結果がありません (0件)`
                            : `❌ '${browseConfirmedSearch || clubBrowseSearch}' 검색 결과가 없습니다 (0건)`}
                        </span>
                      )
                    ) : (
                      <span className="text-stone-500 font-bold">
                        {isJapanese
                          ? `全クラブ一覧 (全${clubs.length}ヶ所 · 👑 パークゴルフ オールインワン加盟クラブ優先表示)`
                          : `전체 클럽 목록 (총 ${clubs.length}곳 · 👑 파크골프 올인원 가입 클럽 최우선 정렬)`}
                      </span>
                    )}
                  </div>
                </div>

                {/* 클럽 검색 목록 */}
                <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
                  {filtered.length === 0 ? (
                    <div className="p-6 bg-stone-50 border-2 border-dashed border-stone-300 rounded-2xl text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-stone-200 text-stone-500 mx-auto flex items-center justify-center text-lg font-black">
                        🔍
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-black text-stone-900 text-sm">
                          {isJapanese
                            ? searchTerm
                              ? `'${browseConfirmedSearch || clubBrowseSearch}' の検索結果がありません (0件)`
                              : '登録されたクラブがありません'
                            : searchTerm
                            ? `'${browseConfirmedSearch || clubBrowseSearch}' 검색 결과가 없습니다 (0건)`
                            : '등록된 클럽이 없습니다'}
                        </p>
                        <p className="text-xs text-stone-500 font-bold">
                          {isJapanese
                            ? '該当する地域またはクラブがありません。最初のクラブを創設してみましょう！'
                            : '현재 등록된 해당 지역 또는 클럽이 없습니다. 직접 첫 번째 클럽을 창단해보세요!'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setClubSubTab('CREATE')}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black text-xs rounded-xl shadow-xs active:scale-95 cursor-pointer"
                      >
                        {isJapanese ? '➕ 新クラブを直接創設' : '➕ 새 클럽 직접 창단하기'}
                      </button>
                    </div>
                  ) : (
                    filtered.map((club) => {
                      const isJoined = myClubIds.includes(club.id);
                      const isParkOn = club.isParkOnClub !== false;

                      return (
                        <div
                          key={club.id}
                          className={`p-3.5 rounded-2xl border-2 transition space-y-2 ${
                            isParkOn
                              ? 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 border-amber-400 shadow-xs'
                              : isJoined
                              ? 'bg-emerald-50/60 border-emerald-300'
                              : 'bg-stone-50 hover:bg-stone-100/80 border-stone-200'
                          }`}
                        >
                          {/* 클럽 구분 배지 (파크골프 올인원 가입 클럽 최우선 강조 & 단원 모집 상태) */}
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isParkOn ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-black text-[10px] shadow-xs border border-amber-600/40">
                                  <span>👑</span>
                                  <span>{isJapanese ? 'パークゴルフ オールインワン加盟クラブ' : '파크골프 올인원 가입 클럽'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-200 text-stone-600 font-bold text-[10px]">
                                  {isJapanese ? '一般愛好会' : '일반 동호회'}
                                </span>
                              )}

                              {/* 단원 모집 상태 배지 */}
                              {club.recruitStatus === 'RECRUITING' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[10px]">
                                  <span>🟢</span>
                                  <span>
                                    {isJapanese
                                      ? `メンバー募集中 ${club.recruitQuota ? `(${club.recruitQuota}名)` : ''}`
                                      : `단원 모집 중 ${club.recruitQuota ? `(${club.recruitQuota}명)` : ''}`}
                                  </span>
                                </span>
                              )}
                              {club.recruitStatus === 'ALWAYS' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[10px]">
                                  <span>🟢</span>
                                  <span>{isJapanese ? 'メンバー常時募集' : '단원 상시 모집'}</span>
                                </span>
                              )}
                              {club.recruitStatus === 'SCHEDULED' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-black text-[10px]">
                                  <span>⏳</span>
                                  <span>{isJapanese ? 'メンバー募集予定' : '단원 모집 예정'}</span>
                                </span>
                              )}
                              {club.recruitStatus === 'CLOSED' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-200 text-stone-600 font-bold text-[10px]">
                                  <span>🔒</span>
                                  <span>{isJapanese ? '募集締切 (募集なし)' : '모집 마감 (모집 없음)'}</span>
                                </span>
                              )}
                            </div>

                            {isJoined && (
                              <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                                {isJapanese ? '所属クラブ' : '내 소속 클럽'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <h4 className="font-black text-sm text-stone-900">{club.name}</h4>
                              <p className="text-xs text-stone-600 font-bold">
                                📍 {club.region} · {club.homeCourseName} ({isJapanese ? `会員 ${club.memberCount}名` : `회원 ${club.memberCount}명`})
                              </p>
                              <p className="text-[11px] text-stone-400 font-medium">
                                {isJapanese
                                  ? `会長: ${club.presidentName || '未指定'} · 総務: ${club.managerName || '未指定'}`
                                  : `회장: ${club.presidentName || '미지정'} · 총무: ${club.managerName || '미지정'}`}
                              </p>
                            </div>

                            <div className="flex flex-col gap-1 shrink-0">
                              {isJoined ? (
                                <Link
                                  href={`/club/${club.id}`}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 text-center flex items-center justify-center gap-1"
                                >
                                  <span>{isJapanese ? '移動' : '바로가기'}</span>
                                  <span>⛳</span>
                                </Link>
                              ) : club.recruitStatus === 'CLOSED' ? (
                                <button
                                  disabled
                                  className="px-3 py-1.5 bg-stone-200 text-stone-400 font-bold text-xs rounded-xl cursor-not-allowed text-center"
                                >
                                  {isJapanese ? '🔒 募集締切' : '🔒 모집 마감'}
                                </button>
                              ) : club.recruitStatus === 'SCHEDULED' ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    showToast(
                                      isJapanese
                                        ? `📅 [${club.name}] ${club.recruitTargetDate || '後日'}に新規メンバー正式募集告知がオープンされます。`
                                        : `📅 [${club.name}] ${club.recruitTargetDate || '추후'}에 신규 단원 정식 모집 공고가 오픈됩니다.`
                                    )
                                  }
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer text-center active:scale-95"
                                >
                                  {isJapanese ? '募集予定通知 🔔' : '모집 예정 알림 🔔'}
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setApplyingClub(club)}
                                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 cursor-pointer text-center"
                                  >
                                    {isJapanese ? '加入申請 ✍️' : '가입 신청 ✍️'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDirectJoinByInvite(club)}
                                    className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-[10px] rounded-lg cursor-pointer text-center border border-amber-300 active:scale-95"
                                  >
                                    {isJapanese ? '招待即時加入 ⚡' : '초청 즉시가입 ⚡'}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* 단원 모집 요강 & 소개글 */}
                          <div className="space-y-1">
                            {club.recruitNotes && (
                              <div className="text-[11px] font-bold text-emerald-900 bg-emerald-50/80 p-2 rounded-xl border border-emerald-200/60 flex items-start gap-1.5">
                                <span className="shrink-0">📢</span>
                                <span>{club.recruitNotes}</span>
                              </div>
                            )}
                            {club.description && (
                              <p className="text-[11px] text-stone-600 font-medium leading-relaxed bg-white/80 p-2 rounded-xl border border-stone-200/60">
                                {club.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 탭 2: [새 대회 개설 센터 - 클럽 대항전 & 시·도 공식 대회] */}
      {/* ========================================================================= */}
      {activeHubTab === 'TOURNAMENTS' && (
        <div className="space-y-3 animate-fadeIn">
          {/* 서브 뷰 토글: [대회 개설 센터] vs [실시간 전광판] */}
          <div className="bg-white p-1.5 rounded-2xl border-2 border-stone-200 shadow-sm grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (!isAnyClubExecutive()) {
                  showToast(isJapanese ? '🔒 大会の開設はクラブ総務および役員専用の権限です。一般会員はリアルタイム電光掲示板から大会に参加できます。' : '🔒 대회 개설은 클럽 총무 및 임원진 전용 권한입니다. 일반 회원은 실시간 전광판을 통해 대회에 참가하실 수 있습니다.');
                  return;
                }
                setTournamentViewMode('CREATE');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                tournamentViewMode === 'CREATE'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-800 text-white border-purple-900 shadow-sm'
                  : isAnyClubExecutive()
                  ? 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-400 border-stone-200'
              }`}
            >
              {isAnyClubExecutive() ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4 text-stone-400" />}
              <span>{isAnyClubExecutive() ? (isJapanese ? '大会開設センター' : '대회 개설 센터') : (isJapanese ? '大会開設 (総務専用)' : '대회 개설 (총무 전용)')}</span>
            </button>
            <button
              type="button"
              onClick={() => setTournamentViewMode('LIVE_BOARD')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                tournamentViewMode === 'LIVE_BOARD'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-800 text-white border-purple-900 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              <Trophy className={`w-4 h-4 ${tournamentViewMode === 'LIVE_BOARD' ? 'text-yellow-300' : 'text-purple-600'}`} />
              <span>{isJapanese ? `リアルタイム電光掲示板 (${rooms.length}ルーム)` : `실시간 전광판 (${rooms.length}개 방)`}</span>
            </button>
          </div>

          {/* 서브 뷰 1: 대회 개설 센터 (대표님 지시: 총무/임원진만 사용 가능) */}
          {tournamentViewMode === 'CREATE' && isAnyClubExecutive() && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleOpenClubMatchTournament}
                className="w-full py-4 px-4 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 active:scale-98 text-white font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border-2 border-purple-600"
              >
                <Swords className="w-5 h-5 text-yellow-300 shrink-0" />
                <span>{isJapanese ? 'クラブ対抗戦を開設する' : '클럽 대항전 개설하기'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenRegionalOpenTournament}
                className="w-full py-4 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-stone-950 font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border-2 border-amber-600"
              >
                <Trophy className="w-5 h-5 text-stone-950 shrink-0" />
                <span>{isJapanese ? '都道府県・地域公式大会を開設する' : '시도 단위 대회 개설하기'}</span>
              </button>
            </div>
          )}

          {/* 개설된 대회 목록 및 실시간 전광판 */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between text-xs font-black text-stone-800 px-1">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>{isJapanese ? `開催中の大会電光掲示板一覧 (${rooms.length}件)` : `개설된 대회 전광판 목록 (${rooms.length}개)`}</span>
              </span>
              {isAnyClubExecutive() && (
                <button
                  type="button"
                  onClick={() => {
                    setTournamentViewMode('CREATE');
                    setShowCreateModal(true);
                  }}
                  className="text-purple-700 hover:text-purple-900 font-black text-xs cursor-pointer flex items-center gap-0.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isJapanese ? '新規大会開設' : '새 대회 개설'}</span>
                </button>
              )}
            </div>

            {rooms.length === 0 && (
              <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <Swords className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-base text-stone-900">{isJapanese ? '開催中の大会がありません' : '개설된 대회가 없습니다'}</h3>
                  <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                    {isJapanese ? 'クラブ対抗戦や公式大会を開設して会員を招待してみましょう！' : '클럽 간 대항전이나 시·도 공식 대회를 개설하여 회원들을 초대해보세요!'}
                  </p>
                </div>
                {isAnyClubExecutive() ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTournamentViewMode('CREATE');
                      setShowCreateModal(true);
                    }}
                    className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black rounded-xl shadow-sm transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-purple-300" />
                    <span>{isJapanese ? '新規大会を開設する' : '새 대회 개설하기'}</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-xs text-stone-500 font-bold bg-stone-100 px-3.5 py-2 rounded-xl border border-stone-200">
                    <Lock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{isJapanese ? '大会の開設はクラブ総務および役員専用の権限です' : '대회 개설은 클럽 총무 및 임원진 전용 권한입니다'}</span>
                  </div>
                )}
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
                            <span>{isJapanese ? 'クラブ対抗戦' : '클럽 대항전'}</span>
                          </span>
                        ) : room.tournamentType === 'REGIONAL_OPEN' ? (
                          <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-amber-700" />
                            <span>{isJapanese ? '都道府県・地域公式大会' : '시·도 공식대회'}</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>{isJapanese ? '🏅 クラブ月例会' : '🏅 클럽 정기월례회'}</span>
                          </span>
                        )}

                        {room.clubName && (
                          <span className="bg-stone-100 text-stone-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                            🏛️ {room.clubName}
                          </span>
                        )}

                        <span className="bg-purple-50 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {isJapanese ? `${room.groups.length}組 (${targetCapacity}名規模)` : `${room.groups.length}개 조 (${targetCapacity}인 규모)`}
                        </span>

                        {room.status === 'FINISHED' ? (
                          <span className="bg-stone-200 text-stone-700 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            {isJapanese ? '🏁 競技終了' : '🏁 경기 종료'}
                          </span>
                        ) : room.status === 'RECRUITING' ? (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            {isJapanese ? '⏳ 参加受付中' : '⏳ 참가 접수 중'}
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            {isJapanese ? 'リアルタイムラウンド中' : '실시간 라운드 중'}
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
                        title={isJapanese ? 'LINE招待状をコピー' : '카톡 초대장 복사'}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(room)}
                        className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition cursor-pointer"
                        title={isJapanese ? 'ルーム設定編集' : '모임 방 설정 수정'}
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoomToDelete(room)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        title={isJapanese ? 'ルーム削除' : '모임 방 삭제'}
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
                        {room.courseName} ({room.totalHoles}{isJapanese ? 'ホール' : '홀'})
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-black text-[10px]">
                        💰 {typeof room.entryFee === 'number' && room.entryFee > 0 ? (isJapanese ? `¥${room.entryFee.toLocaleString()}` : `${room.entryFee.toLocaleString()}원`) : (isJapanese ? '無料' : '무료')}
                      </span>
                      <span className="font-extrabold text-purple-900">{isJapanese ? `総務: ${room.hostName}` : `총무: ${room.hostName}`}</span>
                    </div>
                  </div>

                  {/* 참가 인원 현황 프로그레스 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-stone-600">
                        {isJapanese ? <>現在の登録人数: <strong>{totalPlayers}名</strong> / 定員 {targetCapacity}名</> : <>현재 등록 인원: <strong>{totalPlayers}명</strong> / 정원 {targetCapacity}명</>}
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
                            {isJapanese ? `${room.matchTeamCount || 2}チーム対抗戦 (1クラブあたり${room.playersPerTeam || Math.round(targetCapacity / (room.matchTeamCount || 2))}名出場)` : `${room.matchTeamCount || 2}개 팀 대항전 (클럽당 ${room.playersPerTeam || Math.round(targetCapacity / (room.matchTeamCount || 2))}명 출전)`}
                          </span>
                        </span>
                        <span className="text-[10px] text-purple-700 font-extrabold bg-purple-200/70 px-2 py-0.5 rounded-md">
                          {room.matchInviteType === 'OPEN_CHALLENGE' ? (isJapanese ? '📢 全国オープンチャレンジ' : '📢 전국 오픈 챌린지') : (isJapanese ? '⚔️ クラブ対抗戦' : '⚔️ 클럽 대항전')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopyInvite(e, room)}
                        className="w-full py-2.5 px-3 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-purple-800"
                      >
                        <Share2 className="w-3.5 h-3.5 text-yellow-300" />
                        <span>{isJapanese ? '⚔️ 相手クラブに公式挑戦状を送る' : '⚔️ 상대 클럽에 카톡 공식 도전장 보내기'}</span>
                      </button>
                    </div>
                  )}

                  {/* 전광판 입장 버튼 (Senior Touch 52px Target) */}
                  <div className="space-y-1.5 pt-0.5">
                    {room.status === 'FINISHED' && (
                      <button
                        type="button"
                        onClick={() => {
                          const reportText = ClubStorage.generateTournamentResultReport(room);
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(reportText);
                            showToast(isJapanese ? '🏆 [表彰式＆受取確認] 結果要約告知がコピーされました！LINEグループに共有してください。' : '🏆 [시상식 및 수령 확인] 결과 요약 공지가 복사되었습니다! 카톡 단체방에 공유하세요.');
                          }
                        }}
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-amber-300 active:scale-95"
                      >
                        <Trophy className="w-4 h-4 text-stone-950 shrink-0" />
                        <span>{isJapanese ? '📋 表彰式＆受取確認 (告知コピー)' : '📋 1초 시상식 및 수령 확인 (공지 복사)'}</span>
                      </button>
                    )}

                    <Link
                      href={`/club/${room.id}`}
                      className="w-full min-h-[52px] bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 active:scale-98 text-white font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-purple-600"
                    >
                      <Trophy className="w-5 h-5 text-yellow-300" />
                      <span>{isJapanese ? '📡 リアルタイム電光掲示板に入場 (組別スコア / リーダーボード)' : '📡 실시간 디지털 전광판 입장 (조별 스코어 / 리더보드)'}</span>
                      <ArrowRight className="w-4 h-4 text-purple-200" />
                    </Link>
                  </div>
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
          {/* 2대 번개 서브 탭 (1촌 전용 번개 vs 클럽원 전용 번개) */}
          <div className="bg-white p-1.5 rounded-2xl border-2 border-stone-200 shadow-sm grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setFlashSubTab('1CHON')}
              className={`relative py-3 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                flashSubTab === '1CHON'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-800 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              {hasActive1ChonFlash && (
                <span
                  className="absolute top-1 right-1.5 w-3.5 h-3.5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse ring-1 ring-white shrink-0"
                  title={isJapanese ? '進行中の仲間マッチあり' : '진행 중인 1촌 번개 있음'}
                >
                  N
                </span>
              )}
              <Heart className={`w-4 h-4 ${flashSubTab === '1CHON' ? 'text-amber-300 fill-amber-300' : 'text-emerald-700'}`} />
              <span className="text-xs font-black">{isJapanese ? '⚡ 仲間専用マッチ' : '⚡ 내 1촌 전용 번개'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                flashSubTab === '1CHON' ? 'bg-emerald-950 text-amber-300' : 'bg-stone-200 text-stone-600'
              }`}>
                {companions.length}{isJapanese ? '名' : '명'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFlashSubTab('CLUB_ONLY')}
              className={`relative py-3 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                flashSubTab === 'CLUB_ONLY'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 border-amber-700 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              {hasActiveClubFlash && (
                <span
                  className="absolute top-1 right-1.5 w-3.5 h-3.5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse ring-1 ring-white shrink-0"
                  title={isJapanese ? '進行中のクラブ員マッチあり' : '진행 중인 클럽원 번개 있음'}
                >
                  N
                </span>
              )}
              <Users className={`w-4 h-4 ${flashSubTab === 'CLUB_ONLY' ? 'text-stone-950' : 'text-amber-600'}`} />
              <span className="text-xs font-black">{isJapanese ? '👥 クラブ員専用マッチ' : '👥 클럽원 전용 번개'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                flashSubTab === 'CLUB_ONLY' ? 'bg-amber-950 text-amber-300' : 'bg-stone-200 text-stone-600'
              }`}>
                {myClubs.length}{isJapanese ? 'か所' : '곳'}
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
                      {isJapanese ? `ゴルフ仲間ネットワーク (${companions.length}名)` : `내 1촌 동반자 네트워크 (${companions.length}명)`}
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    {isJapanese ? '検証済みの仲間' : '서로 검증된 인연'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 font-medium">
                  {isJapanese ? 'ラウンドを共に完走して検証されたゴルフ仲間のリストです。マッチ開設時、下記の仲間に招待が送信されます。' : '나와 라운드를 함께 완주하여 검증된 1촌 목록입니다. 번개 개설 시 아래 1촌들에게 번개가 발송됩니다.'}
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
                          {isJapanese ? `通算${comp.roundCount}回同伴` : `통산 ${comp.roundCount}회 동반`}
                        </div>
                      </div>
                      <div className="text-[9px] text-stone-500 truncate" title={comp.lastCourseName}>
                        {comp.lastCourseName || (isJapanese ? '全国パークゴルフ場' : '전국 구장')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 1촌 번개방 개설 버튼 (Senior Touch 52px Target) */}
                <button
                  type="button"
                  onClick={() => {
                    setLtnLightningScope('MULTI_OPEN');
                    setShowCreate1ChonModal(true);
                  }}
                  className="w-full min-h-[52px] bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 text-white font-black text-sm rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-emerald-600"
                >
                  <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                  <span>{isJapanese ? '⚡ 仲間に招集マッチを開設する' : '⚡ 내 1촌에게 번개방 개설하기'}</span>
                </button>
              </div>

              {/* 진행 중인 1촌 번개 목록 */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-stone-800 px-1">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>{isJapanese ? `進行中の仲間マッチ (${lightningRounds.length}件)` : `진행 중인 1촌 번개 (${lightningRounds.length}개)`}</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-bold">{isJapanese ? '承諾(Accept)時に参加確定' : '수락(Accept) 시 참가 확정'}</span>
                </div>

                {lightningRounds.length === 0 && (
                  <div className="bg-white rounded-3xl p-6 border border-stone-200 text-center space-y-2">
                    <p className="text-xs text-stone-500 font-bold">{isJapanese ? '現在進行中の仲間マッチはありません。' : '현재 진행 중인 1촌 번개가 없습니다.'}</p>
                    <p className="text-[11px] text-stone-400 font-medium">{isJapanese ? '上のボタンを押して、ゴルフ仲間に最初のマッチを提案してみましょう！' : '위 버튼을 눌러 내 1촌들에게 첫 번째 번개를 띄워보세요!'}</p>
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
                              <span>{isMultiOpen ? (isJapanese ? '👥 4名以上マッチ (無制限)' : '👥 4인 이상 번개 (무제한)') : (isJapanese ? '⛳ 4名マッチ' : '⛳ 4인 번개')}</span>
                            </span>
                            <span className="bg-stone-100 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              📅 {round.dateStr} {round.timeStr}
                            </span>
                            {isMultiOpen ? (
                              <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md">
                                {isJapanese ? `現在${acceptedCount}名参加中${acceptedCount >= 2 ? '・スタート可能！' : ''}` : `현재 ${acceptedCount}명 참여 중 ${acceptedCount >= 2 ? '· 출발 가능!' : ''}`}
                              </span>
                            ) : isFull ? (
                              <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                                {isJapanese ? '🎉 4名完了 (スタート可能)' : '🎉 4인 완료 (출발 가능)'}
                              </span>
                            ) : (
                              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                                {acceptedCount >= 2 ? (isJapanese ? `🟢 2名以上確定 (${acceptedCount}/4名、スタート可能)` : `🟢 2인 이상 모임 (${acceptedCount}/4명, 출발 가능)`) : (isJapanese ? `⏳ 仲間の承諾待ち (${acceptedCount}/4명)` : `⏳ 1촌 수락 대기 중 (${acceptedCount}/4명)`)}
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
                          title={isJapanese ? 'LINEグループに共有' : '1촌 단톡방 공유'}
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
                          {isJapanese ? '開設者' : '개설자'}: <strong>{round.hostName}</strong> {isHost && <span className="text-emerald-700 font-bold">({isJapanese ? '本人/リーダー' : '본인/방장'})</span>}
                          {round.invited1ChonNames && round.invited1ChonNames.length > 0 && (
                            <span> · {isJapanese ? '指定仲間' : '지정 1촌'}: {round.invited1ChonNames.join(', ')}</span>
                          )}
                        </div>
                      </div>

                      {/* 수락(Accept) 현황 프로그레스 & 수락 동반자 명단 */}
                      <div className="space-y-1.5 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                        <div className="flex justify-between text-xs font-extrabold text-stone-800">
                          <span>{isJapanese ? '仲間承諾(参加)確定者:' : '1촌 수락(참가) 확정자:'}</span>
                          <span className="text-emerald-800 font-black">
                            {isMultiOpen ? (isJapanese ? `${acceptedCount}名 (人数無制限)` : `${acceptedCount}명 (인원 무제한)`) : (isJapanese ? `${acceptedCount} / 4名完了` : `${acceptedCount} / 4명 완료`)}
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
                              {p.isHost && <span className="text-[9px] text-emerald-600 font-bold">({isJapanese ? 'リーダー' : '방장'})</span>}
                            </span>
                          ))}
                          {!isMultiOpen && !isFull && (
                            <span className="bg-stone-100 text-stone-400 text-[11px] font-bold px-2 py-1 rounded-lg border border-dashed border-stone-300">
                              + {4 - acceptedCount}{isJapanese ? '名 承諾待ち' : '명 수락 대기 중'}
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
                                  {isJapanese ? `⛳ 現在${acceptedCount}名ですぐスタート (${acceptedCount > 4 ? 'リアルタイム組別電光板' : 'スコアカード'} ▶)` : `⛳ 현재 ${acceptedCount}명으로 지금 바로 출발 (${acceptedCount > 4 ? '실시간 조별 전광판' : '스코어카드'} ▶)`}
                                </span>
                              </button>
                            </div>
                          ) : (
                            <div className="w-full py-3 bg-stone-100 border border-dashed border-stone-300 rounded-xl text-center text-xs text-stone-500 font-bold">
                              {isJapanese ? '⏳ 仲間の承諾待ち (最低2名承諾でリーダーがすぐスタートできます)' : '⏳ 1촌 수락 대기 중 (최소 2인 수락 시 방장이 바로 출발할 수 있습니다)'}
                            </div>
                          )
                        ) : (
                          // 초대받은 1촌 입장
                          hasAccepted ? (
                            <div className="space-y-1.5">
                              <div className="flex gap-2">
                                <div className="flex-1 min-h-[48px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs rounded-xl flex items-center justify-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                  <span>{isJapanese ? '参加承諾完了 (リーダーのスタート待ち)' : '참가 수락 완료 (방장 출발 대기 중)'}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCancel1ChonLightning(round.id)}
                                  className="px-3 min-h-[48px] bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl border border-stone-300 transition cursor-pointer"
                                >
                                  {isJapanese ? '承諾取消' : '수락 취소'}
                                </button>
                              </div>
                              {acceptedCount >= 2 && (
                                <p className="text-[11px] text-center text-emerald-700 font-bold">
                                  {isJapanese ? '🟢 2名以上集まりました！リーダーがスタートボタンを押すとラウンドが開始されます。' : '🟢 2명 이상 모였습니다! 방장이 언제든 출발 버튼을 누르면 라운드가 시작됩니다.'}
                                </p>
                              )}
                            </div>
                          ) : isFull ? (
                            <div className="space-y-1.5">
                              <div className="w-full py-2 bg-stone-100 text-stone-600 rounded-xl text-center text-xs font-bold border border-stone-200">
                                {isJapanese ? '🎉 定員締切 (4名完了)' : '🎉 4인 정원 마감'}
                              </div>
                              <button
                                type="button"
                                onClick={() => showToast(isJapanese ? "⏳ 仲間マッチのキャンセル待ち登録が完了しました。空きが出次第優先してお知らせします。" : "⏳ 1촌 번개 대기 접수가 완료되었습니다. 취소 발생 시 우선 알림을 드립니다.")}
                                className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer border border-amber-600 active:scale-95"
                              >
                                <span>{isJapanese ? '⏳ キャンセル待ち登録 (空き発生時に自動繰り上げ)' : '⏳ 대기자 등록 (취소 발생 시 자동 승계)'}</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAccept1ChonLightning(round.id)}
                              className="w-full min-h-[52px] bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-98 text-white font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-emerald-500"
                            >
                              <Hand className="w-5 h-5 text-amber-300" />
                              <span>{isJapanese ? '✋ 承諾する (参加確定)' : '✋ 수락하기 (참가 확정하기)'}</span>
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
              {/* 대표님 요청: 소속 클럽 선택 박스 전면 제거, 슬림한 '번개 개설하기' 버튼 단독 배치 (작은 번개 아이콘) */}
              <button
                type="button"
                onClick={() => {
                  const targetClub = myClubs[0] || clubs.find((c) => c.id === selectedFlashClubId) || clubs[0];
                  if (targetClub) {
                    setSelectedFlashClubId(targetClub.id);
                  }
                  setClubFlashLightningScope('MULTI_OPEN');
                  setShowCreateClubFlashModal(true);
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-stone-950 font-black text-xs rounded-2xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-amber-500"
              >
                <Zap className="w-3.5 h-3.5 text-stone-950 fill-stone-950 shrink-0" />
                <span>{isJapanese ? 'マッチを開設する' : '번개 개설하기'}</span>
              </button>

              {/* 클럽 번개 모집 목록 */}
              <div className="space-y-2.5">
                {(() => {
                  const currentClubId = selectedFlashClubId || myClubs[0]?.id || clubs[0]?.id;
                  const selClub = clubs.find((c) => c.id === currentClubId) || myClubs[0];
                  const filtered = flashGatherings.filter((g) =>
                    g.type === 'CLUB_ONLY' &&
                    (currentClubId ? g.clubId === currentClubId : true)
                  );

                  const todayStr = new Date().toISOString().slice(0, 10);
                  // 오늘 및 향후 번개 (진행 중)
                  const upcomingGatherings = filtered.filter(
                    (g) => (!g.playDate || g.playDate >= todayStr) && g.status !== 'CLOSED'
                  );
                  // 지난 번개 (과거 날짜 또는 마감/종료)
                  const pastGatherings = filtered.filter(
                    (g) => (g.playDate && g.playDate < todayStr) || g.status === 'CLOSED'
                  );

                  const renderFlashCard = (flash: FlashGathering, isPast = false) => {
                    const selfName = ParkOnStorage.getUserDisplayName(selectedFlashClubId);
                    const isParticipant = flash.currentParticipants.some((p) => p.name.includes(selfName));
                    const isHost = flash.hostName.includes(selfName) || flash.currentParticipants[0]?.name.includes(selfName);
                    const isMultiOpen = flash.lightningScope === 'MULTI_OPEN' || flash.targetCount >= 999;
                    const isFull = !isMultiOpen && flash.currentParticipants.length >= 4;

                    return (
                      <div
                        key={flash.id}
                        className={`rounded-2xl p-4 border-2 shadow-sm space-y-3 transition ${
                          isPast
                            ? 'bg-stone-50 border-stone-200 opacity-80'
                            : isFull
                            ? 'bg-amber-50/30 border-amber-400 ring-2 ring-amber-200'
                            : flash.currentParticipants.length >= 2
                            ? 'bg-white border-amber-400 ring-1 ring-amber-200'
                            : 'bg-white border-stone-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md">
                                🏛️ {flash.clubName}
                              </span>
                              <span className="bg-stone-100 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                {isMultiOpen ? (isJapanese ? '👥 4名以上マッチ (無制限)' : '👥 4인 이상 번개 (무제한)') : (isJapanese ? '⛳ 4名マッチ' : '⛳ 4인 번개')}
                              </span>
                              <span className="bg-stone-100 text-stone-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                📅 {flash.playDate} {flash.playTime}
                              </span>
                              {isPast ? (
                                <span className="bg-stone-200 text-stone-700 text-[10px] font-black px-2 py-0.5 rounded-md">
                                  {isJapanese ? '🏁 過去のマッチ (終了)' : '🏁 지난 번개 (종료)'}
                                </span>
                              ) : isMultiOpen ? (
                                <span className="bg-amber-200 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                                  {isJapanese ? `現在${flash.currentParticipants.length}名参加中${flash.currentParticipants.length >= 2 ? '・スタート可能！' : ''}` : `현재 ${flash.currentParticipants.length}명 참여 중 ${flash.currentParticipants.length >= 2 ? '· 출발 가능!' : ''}`}
                                </span>
                              ) : isFull ? (
                                <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                                  {isJapanese ? '🎉 4名完了 (スタート可能)' : '🎉 4인 완료 (출발 가능)'}
                                </span>
                              ) : (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                                  {flash.currentParticipants.length >= 2
                                    ? (isJapanese ? `🟢 2名以上確定 (${flash.currentParticipants.length}/4名、スタート可能)` : `🟢 2인 이상 모임 (${flash.currentParticipants.length}/4명, 출발 가능)`)
                                    : (isJapanese ? `募集中 (${flash.currentParticipants.length}/4名)` : `모집 중 (${flash.currentParticipants.length}/4명)`)}
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
                            title={isJapanese ? 'クラブLINEグループに共有' : '클럽 단톡방 공유'}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 text-xs space-y-1">
                          <div className="font-bold text-stone-800">
                            {isJapanese ? '場所' : '장소'}: <strong>{flash.courseName}</strong> · {isJapanese ? '開設者' : '개설자'}: {flash.hostName} {isHost && <span className="text-amber-700 font-bold">({isJapanese ? '本人/リーダー' : '본인/방장'})</span>}
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
                              {idx === 0 && <span className="text-[9px] text-amber-700 font-bold">({isJapanese ? 'リーダー' : '방장'})</span>}
                            </span>
                          ))}
                          {!isPast && !isMultiOpen && !isFull && (
                            <span className="bg-stone-100 text-stone-400 text-[11px] font-bold px-2 py-1 rounded-lg border border-dashed border-stone-300">
                              + {4 - flash.currentParticipants.length}{isJapanese ? '名 募集中' : '명 모집 중'}
                            </span>
                          )}
                        </div>

                        {/* 조작 버튼 영역 */}
                        <div className="pt-1 space-y-2">
                          {isPast ? (
                            <div className="w-full py-2 bg-stone-100 border border-stone-200 rounded-xl text-center text-xs text-stone-500 font-bold">
                              {isJapanese ? `🏁 競技完了した過去のマッチです (${flash.currentParticipants.length}名参加)` : `🏁 경기 완료된 과거 번개입니다 (${flash.currentParticipants.length}명 참가)`}
                            </div>
                          ) : isHost ? (
                            flash.currentParticipants.length >= 2 ? (
                              <div className="space-y-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartClubFlashRound(flash)}
                                  className="w-full min-h-[52px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 active:scale-98 text-stone-950 font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border border-yellow-300"
                                >
                                  <Play className="w-5 h-5 text-stone-950 fill-stone-950" />
                                  <span>
                                    {isJapanese ? `⛳ 現在${flash.currentParticipants.length}名ですぐスタート (${flash.currentParticipants.length > 4 ? 'リアルタイム組別電光板' : 'スコアカード'} ▶)` : `⛳ 현재 ${flash.currentParticipants.length}명으로 지금 바로 출발 (${flash.currentParticipants.length > 4 ? '실시간 조별 전광판' : '스코어카드'} ▶)`}
                                  </span>
                                </button>
                              </div>
                            ) : (
                              <div className="w-full py-2.5 bg-stone-100 border border-dashed border-stone-300 rounded-xl text-center text-xs text-stone-500 font-bold">
                                {isJapanese ? '⏳ クラブ員の参加待ち (最低2名集まればリーダーがすぐスタートできます)' : '⏳ 클럽원 참가 대기 중 (최소 2인 모이면 방장이 바로 출발할 수 있습니다)'}
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
                                  {isJapanese ? '参加申請を取消す' : '참가 신청 취소하기'}
                                </button>
                                {flash.currentParticipants.length >= 2 && (
                                  <p className="text-[11px] text-center text-emerald-700 font-bold">
                                    {isJapanese ? '🟢 2名以上集まりました！リーダーがスタートボタンを押すとラウンドが開始されます。' : '🟢 2명 이상 모였습니다! 방장이 출발 버튼을 누르면 라운드가 시작됩니다.'}
                                  </p>
                                )}
                              </div>
                            ) : isFull ? (() => {
                              const isWaiting = flash.waitingList?.some((w) => w.name.includes(selfName));
                              const waitIdx = (flash.waitingList || []).findIndex((w) => w.name.includes(selfName));
                              const waitRank = waitIdx >= 0 ? waitIdx + 1 : 0;
                              const totalWait = flash.waitingList?.length || 0;

                              return (
                                <div className="space-y-1.5">
                                  <div className="w-full py-2 bg-stone-100 text-stone-600 rounded-xl text-center text-xs font-bold border border-stone-200">
                                    {isJapanese ? `🎉 定員締切 (4名完了)${totalWait > 0 ? ` · 待ち${totalWait}名` : ''}` : `🎉 정원 마감 (4인 완료)${totalWait > 0 ? ` · 대기 ${totalWait}명` : ''}`}
                                  </div>
                                  {isWaiting ? (
                                    <div className="flex gap-2">
                                      <div className="flex-1 py-2.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-black text-center flex items-center justify-center gap-1 shadow-2xs">
                                        <span>{isJapanese ? `⏳ キャンセル待ち第${waitRank}順位登録完了` : `⏳ 대기 ${waitRank}순위 등록 완료`}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleLeaveClubFlash(flash.id)}
                                        className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-bold border border-stone-300 cursor-pointer"
                                      >
                                        {isJapanese ? '待ち取消' : '대기 취소'}
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleJoinClubFlash(flash.id)}
                                      className="w-full min-h-[46px] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 text-stone-950 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer border border-amber-600 active:scale-95"
                                    >
                                      <span>{isJapanese ? '⏳ キャンセル待ち登録 (空き発生時に自動繰り上げ)' : '⏳ 대기자 등록 (취소 발생 시 자동 승계)'}</span>
                                    </button>
                                  )}
                                </div>
                              );
                            })() : (
                              <button
                                type="button"
                                onClick={() => handleJoinClubFlash(flash.id)}
                                className="w-full min-h-[48px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-amber-600"
                              >
                                <Hand className="w-4 h-4 text-stone-950" />
                                <span>{isJapanese ? '✋ クラブマッチに参加申請する' : '✋ 클럽 번개 참가 신청하기'}</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <>
                      {/* ⚡ 현재 참여 가능한 오늘/예정 번개 헤더 */}
                      <div className="flex items-center justify-between text-xs font-black text-stone-800 px-1">
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                          <span>{selClub?.name ? `${selClub.name} ` : ''}{isJapanese ? `参加可能なマッチ (${upcomingGatherings.length}件)` : `참여 가능한 번개 (${upcomingGatherings.length}개)`}</span>
                        </span>
                      </div>

                      {upcomingGatherings.length === 0 ? (
                        <div className="bg-white rounded-3xl p-6 border border-stone-200 text-center space-y-2">
                          <p className="text-xs text-stone-500 font-bold">{isJapanese ? '現在募集中のマッチはありません。' : '현재 모집 중인 번개가 없습니다.'}</p>
                          <p className="text-[11px] text-stone-400 font-medium">{isJapanese ? '上の[マッチを開設する]ボタンを押して、クラブ会員に提案してみましょう！' : '위 [번개 개설하기] 버튼을 눌러 클럽 회원들에게 번개를 제안해보세요!'}</p>
                        </div>
                      ) : (
                        upcomingGatherings.map((flash) => renderFlashCard(flash, false))
                      )}

                      {/* 📁 지난 번개 완료 내역 (3개월 누적 대비 아코디언 분리) */}
                      {pastGatherings.length > 0 && (
                        <div className="pt-2 border-t border-stone-200/80">
                          <button
                            type="button"
                            onClick={() => setShowPastFlashGatherings((prev) => !prev)}
                            className="w-full min-h-[44px] py-2.5 px-3 bg-stone-100 hover:bg-stone-200/80 active:bg-stone-200 border border-stone-200 rounded-xl flex items-center justify-between text-xs font-bold text-stone-700 transition cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <span>{isJapanese ? `📁 過去のマッチ完了履歴 (${pastGatherings.length}件)` : `📁 지난 번개 완료 내역 (${pastGatherings.length}건)`}</span>
                            </span>
                            <span className="text-xs font-bold text-stone-500">
                              {showPastFlashGatherings ? (isJapanese ? '閉じる ▲' : '접기 ▲') : (isJapanese ? 'もっと見る ▼' : '펼쳐보기 ▼')}
                            </span>
                          </button>

                          {showPastFlashGatherings && (
                            <div className="space-y-2.5 mt-2.5">
                              {pastGatherings.map((flash) => renderFlashCard(flash, true))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );

                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 최하단 여유롭고 완만한 와이드 이전으로 복귀 버튼 */}
      <div className="pt-2 pb-8">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1) {
              router.back();
            } else {
              router.push('/');
            }
          }}
          className="w-full py-3.5 px-4 bg-white hover:bg-stone-50 border-2 border-stone-300 hover:border-stone-400 text-stone-800 font-black text-sm rounded-2xl shadow-xs transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-stone-600" />
          <span>{isJapanese ? '戻る' : '이전으로'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: 새 클럽 창단 모달 (회장/총무) */}
      {/* ========================================================================= */}
      {showCreateClubModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-base">{isJapanese ? '新規パークゴルフクラブ創設' : '새 파크골프 클럽 창단'}</h3>
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
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? 'クラブ名 *' : '클럽 이름 *'}</label>
                <input
                  type="text"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  placeholder={isJapanese ? '例: 札幌さくらパークゴルフクラブ' : '예: 구미 동락 에이스 파크골프 클럽'}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '活動地域' : '연고 지역'}</label>
                <input
                  type="text"
                  value={newClubRegion}
                  onChange={(e) => setNewClubRegion(e.target.value)}
                  placeholder={isJapanese ? '例: 北海道 札幌、東京都 江東区など' : '예: 경북 구미, 부산 사상 등'}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800">{isJapanese ? 'ホームコース選択 *' : '홈 구장 선택 *'}</label>
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
                    <span>{isJapanese ? '全国コース検索' : '전국 구장 검색'}</span>
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
                    {newClubSelectedCourse.region} · {newClubSelectedCourse.totalHoles}{isJapanese ? 'ホール ▾' : '홀 ▾'}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '会長名' : '회장 이름'}</label>
                  <input
                    type="text"
                    value={newClubPresident}
                    onChange={(e) => setNewClubPresident(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '総務名 (本人)' : '총무 이름 (본인)'}</label>
                  <input
                    type="text"
                    value={newClubManager}
                    onChange={(e) => setNewClubManager(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? 'お問い合わせ連絡先' : '문의 연락처'}</label>
                <input
                  type="text"
                  value={newClubPhone}
                  onChange={(e) => setNewClubPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? 'クラブ紹介文' : '클럽 소개글'}</label>
                <textarea
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  rows={2}
                  placeholder={isJapanese ? '例: さくらコースを愛する愛好家クラブです。毎月第2土曜日に定期月例会開催！' : '예: 구미 동락구장을 사랑하는 동호인 클럽입니다. 매월 둘째 주 토요일 정기 월례회 개최!'}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateClubModal(false)}
                  className="w-1/3 py-3 bg-stone-100 text-stone-600 font-bold text-xs rounded-xl"
                >
                  {isJapanese ? 'キャンセル' : '취소'}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md"
                >
                  {isJapanese ? '新規クラブを創設する' : '새 클럽 창단하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: 전국 클럽 찾아보기 및 가입 신청 모달 (팝업창) */}
      {/* ========================================================================= */}
      {showClubBrowseModal && (() => {
        const searchTerm = (browseConfirmedSearch || clubBrowseSearch).trim().toLowerCase();
        const filtered = clubs
          .filter((c) => {
            if (onlyRecruitingFilter) {
              const isRec = c.recruitStatus === 'RECRUITING' || c.recruitStatus === 'ALWAYS';
              if (!isRec) return false;
            }
            if (!searchTerm) return true;
            return (
              c.name.toLowerCase().includes(searchTerm) ||
              c.region.toLowerCase().includes(searchTerm) ||
              c.homeCourseName.toLowerCase().includes(searchTerm) ||
              (c.description && c.description.toLowerCase().includes(searchTerm))
            );
          })
          .sort((a, b) => {
            // 1순위: 파크골프 올인원 공식 가입 클럽 최우선 상단 정렬
            const aIsParkOn = a.isParkOnClub !== false ? 1 : 0;
            const bIsParkOn = b.isParkOnClub !== false ? 1 : 0;
            if (aIsParkOn !== bIsParkOn) return bIsParkOn - aIsParkOn;

            // 2순위: 단원 모집 중인 클럽 우선 (RECRUITING / ALWAYS > SCHEDULED > CLOSED)
            const aRec = a.recruitStatus === 'RECRUITING' || a.recruitStatus === 'ALWAYS' ? 2 : a.recruitStatus === 'SCHEDULED' ? 1 : 0;
            const bRec = b.recruitStatus === 'RECRUITING' || b.recruitStatus === 'ALWAYS' ? 2 : b.recruitStatus === 'SCHEDULED' ? 1 : 0;
            if (aRec !== bRec) return bRec - aRec;

            // 3순위: 회원 수 많은 순
            return (b.memberCount || 0) - (a.memberCount || 0);
          });

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
              {/* 모달 상단 헤더 */}
              <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-stone-900 text-white p-4 flex items-center justify-between shrink-0 shadow-sm border-b border-purple-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-stone-950 flex items-center justify-center font-black text-sm shadow-xs">
                    🔍
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white flex items-center gap-1.5">
                      <span>{isJapanese ? '全国クラブ検索＆加入申請' : '전국 클럽 찾아보기 및 가입'}</span>
                    </h3>
                    <p className="text-[11px] text-amber-300 font-bold">
                      {isJapanese ? '地域またはクラブ名を検索してパークゴルフ オールインワン加入クラブを見つけましょう' : '지역 또는 클럽명을 검색하여 파크골프 올인원 가입 클럽을 우선 찾아보세요'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClubBrowseModal(false)}
                  className="text-stone-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 검색창 & 단원 모집 필터 (고정 영역) */}
              <div className="p-3.5 bg-stone-50 border-b border-stone-200 space-y-2.5 shrink-0">
                {/* 검색 인풋 & 검색 버튼 */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
                    <input
                      type="text"
                      value={clubBrowseSearch}
                      onChange={(e) => setClubBrowseSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          setBrowseConfirmedSearch(clubBrowseSearch.trim());
                        }
                      }}
                      placeholder={isJapanese ? '地域(例: 札幌、東京、大阪)またはクラブ名を入力...' : '지역(예: 구미, 대구, 부산) 또는 클럽명 입력...'}
                      className="w-full pl-9 pr-8 py-2.5 bg-white border-2 border-purple-300 focus:border-purple-600 rounded-xl text-xs font-black placeholder:text-stone-400 outline-none transition shadow-xs"
                    />
                    {clubBrowseSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setClubBrowseSearch('');
                          setBrowseConfirmedSearch('');
                        }}
                        className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 text-xs font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setBrowseConfirmedSearch(clubBrowseSearch.trim())}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 active:scale-95 text-white font-black text-xs rounded-xl shadow-md cursor-pointer shrink-0 transition flex items-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isJapanese ? '検索' : '검색'}</span>
                  </button>
                </div>

                {/* 단원(회원) 모집 중 필터 옵션 (지역 칩 제거 후 신설) */}
                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyRecruitingFilter}
                      onChange={(e) => setOnlyRecruitingFilter(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                    />
                    <span className="font-extrabold text-stone-700 text-xs">
                      {isJapanese ? '🟢 新規会員募集中クラブのみ表示' : '🟢 신규 단원(회원) 모집 중인 클럽만 보기'}
                    </span>
                  </label>
                  <span className="text-[10px] font-bold text-stone-400">
                    {onlyRecruitingFilter ? (isJapanese ? '募集中フィルターON' : '모집 중 필터 켬') : (isJapanese ? '全ての状態' : '전체 상태')}
                  </span>
                </div>

                {/* 검색 상태 안내 */}
                <div className="flex items-center justify-between text-[11px] px-0.5">
                  {searchTerm ? (
                    filtered.length > 0 ? (
                      <span className="font-black text-purple-900 flex items-center gap-1">
                        <span>✅</span>
                        <span>{isJapanese ? `「${browseConfirmedSearch || clubBrowseSearch}」検索結果: 計 ${filtered.length}クラブ (👑 パークゴルフ オールインワン加入クラブ最優先)` : `'${browseConfirmedSearch || clubBrowseSearch}' 검색 결과: 총 ${filtered.length}개 클럽 (👑 파크골프 올인원 가입 클럽 1순위)`}</span>
                      </span>
                    ) : (
                      <span className="font-black text-rose-600 flex items-center gap-1">
                        <span>❌</span>
                        <span>{isJapanese ? `「${browseConfirmedSearch || clubBrowseSearch}」検索結果がありません (0件)` : `'${browseConfirmedSearch || clubBrowseSearch}' 검색 결과가 없습니다 (0건)`}</span>
                      </span>
                    )
                  ) : (
                    <span className="font-bold text-stone-500">
                      {isJapanese ? `全国登録クラブ一覧 (計 ${clubs.length}か所 · 👑 パークゴルフ オールインワン加入クラブ最優先)` : `전국 등록 클럽 전체보기 (총 ${clubs.length}곳 · 👑 파크골프 올인원 가입 클럽 최우선 정렬)`}
                    </span>
                  )}
                </div>
              </div>

              {/* 검색 결과 리스트 (스크롤 영역) */}
              <div className="p-3.5 space-y-3 overflow-y-auto flex-1">
                {filtered.length === 0 ? (
                  <div className="p-6 bg-stone-50 border-2 border-dashed border-stone-300 rounded-2xl text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-stone-200 text-stone-500 mx-auto flex items-center justify-center text-xl font-black">
                      🔍
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-stone-900 text-sm">
                        {searchTerm ? (isJapanese ? `「${browseConfirmedSearch || clubBrowseSearch}」検索結果がありません (0件)` : `'${browseConfirmedSearch || clubBrowseSearch}' 검색 결과가 없습니다 (0건)`) : (isJapanese ? '登録されたクラブがありません' : '등록된 클럽이 없습니다')}
                      </p>
                      <p className="text-xs text-stone-500 font-bold leading-relaxed">
                        {isJapanese ? <>現在登録されている該当クラブがありません。<br />地域第1号のクラブを今すぐ創設してみましょう！</> : <>현재 등록되어 있는 해당 클럽이나 지역 동호회가 없습니다.<br />우리 지역 1호 클럽을 지금 직접 창단해보세요!</>}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowClubBrowseModal(false);
                        setClubSubTab('CREATE');
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black text-xs rounded-xl shadow-md active:scale-95 cursor-pointer"
                    >
                      {isJapanese ? '➕ 新規クラブを創設する' : '➕ 새 클럽 직접 창단하기'}
                    </button>
                  </div>
                ) : (
                  filtered.map((club) => {
                    const isJoined = myClubIds.includes(club.id);
                    const isParkOn = club.isParkOnClub !== false;

                    return (
                      <div
                        key={club.id}
                        className={`p-3.5 rounded-2xl border-2 transition space-y-2.5 ${
                          isParkOn
                            ? 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 border-amber-400 shadow-sm'
                            : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        {/* 클럽 구분 배지 (파크골프 올인원 가입 클럽 최우선 강조 & 단원 모집 상태) */}
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isParkOn ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-black text-[10px] shadow-xs border border-amber-600/40">
                                <span>👑</span>
                                <span>{isJapanese ? 'パークゴルフ オールインワン加入クラブ' : '파크골프 올인원 가입 클럽'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-200 text-stone-600 font-bold text-[10px]">
                                {isJapanese ? '一般愛好会' : '일반 동호회'}
                              </span>
                            )}

                            {/* 단원 모집 상태 배지 */}
                            {club.recruitStatus === 'RECRUITING' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[10px]">
                                <span>🟢</span>
                                <span>{isJapanese ? `会員募集中 ${club.recruitQuota ? `(${club.recruitQuota}名)` : ''}` : `단원 모집 중 ${club.recruitQuota ? `(${club.recruitQuota}명)` : ''}`}</span>
                              </span>
                            )}
                            {club.recruitStatus === 'ALWAYS' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-[10px]">
                                <span>🟢</span>
                                <span>{isJapanese ? '会員常時募集中' : '단원 상시 모집'}</span>
                              </span>
                            )}
                            {club.recruitStatus === 'SCHEDULED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-black text-[10px]">
                                <span>⏳</span>
                                <span>{isJapanese ? '会員募集予定' : '단원 모집 예정'}</span>
                              </span>
                            )}
                            {club.recruitStatus === 'CLOSED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-200 text-stone-600 font-bold text-[10px]">
                                <span>🔒</span>
                                <span>{isJapanese ? '募集締切 (募集なし)' : '모집 마감 (모집 없음)'}</span>
                              </span>
                            )}
                          </div>

                          {isJoined && (
                            <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span>✓</span>
                              <span>{isJapanese ? '所属クラブ' : '내 소속 클럽'}</span>
                            </span>
                          )}
                        </div>

                        {/* 클럽 기본 정보 & 액션 버튼 */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <h4 className="font-black text-sm text-stone-900 leading-tight">
                              {club.name}
                            </h4>
                            <p className="text-xs text-stone-600 font-bold">
                              📍 {club.region} · {club.homeCourseName} ({isJapanese ? `会員 ${club.memberCount}名` : `회원 ${club.memberCount}명`})
                            </p>
                            <p className="text-[11px] text-stone-400 font-medium">
                              {isJapanese ? `会長: ${club.presidentName || '未指定'} · 総務: ${club.managerName || '未指定'}` : `회장: ${club.presidentName || '미지정'} · 총무: ${club.managerName || '미지정'}`}
                            </p>
                          </div>

                          <div className="flex flex-col gap-1.5 shrink-0">
                            {isJoined ? (
                              <Link
                                href={`/club/${club.id}`}
                                onClick={() => setShowClubBrowseModal(false)}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 text-center flex items-center justify-center gap-1"
                              >
                                <span>{isJapanese ? '移動' : '바로가기'}</span>
                                <span>⛳</span>
                              </Link>
                            ) : club.recruitStatus === 'CLOSED' ? (
                              <button
                                disabled
                                className="px-3 py-1.5 bg-stone-200 text-stone-400 font-bold text-xs rounded-xl cursor-not-allowed text-center"
                              >
                                {isJapanese ? '🔒 募集締切' : '🔒 모집 마감'}
                              </button>
                            ) : club.recruitStatus === 'SCHEDULED' ? (
                              <button
                                type="button"
                                onClick={() => showToast(isJapanese ? `📅 [${club.name}] ${club.recruitTargetDate || '後日'}に新規会員募集が開始されます。` : `📅 [${club.name}] ${club.recruitTargetDate || '추후'}에 신규 단원 정식 모집 공고가 오픈됩니다.`)}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer text-center active:scale-95"
                              >
                                {isJapanese ? '募集予定通知 🔔' : '모집 예정 알림 🔔'}
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowClubBrowseModal(false);
                                    setApplyingClub(club);
                                  }}
                                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer text-center"
                                >
                                  {isJapanese ? '加入申請 ✍️' : '가입 신청 ✍️'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDirectJoinByInvite(club)}
                                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-[10px] rounded-lg cursor-pointer text-center border border-amber-300 active:scale-95"
                                >
                                  {isJapanese ? '招待で即時加入 ⚡' : '초청 즉시가입 ⚡'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* 단원 모집 요강 & 소개글 */}
                        <div className="space-y-1">
                          {club.recruitNotes && (
                            <div className="text-[11px] font-bold text-emerald-900 bg-emerald-50/80 p-2 rounded-xl border border-emerald-200/60 flex items-start gap-1.5">
                              <span className="shrink-0">📢</span>
                              <span>{club.recruitNotes}</span>
                            </div>
                          )}
                          {club.description && (
                            <p className="text-[11px] text-stone-600 font-medium leading-relaxed bg-white/80 p-2 rounded-xl border border-stone-200/60">
                              {club.description}
                            </p>
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

      {/* ========================================================================= */}
      {/* MODAL 2-1: 클럽 가입 신청서 작성 모달 */}
      {/* ========================================================================= */}
      {applyingClub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">{isJapanese ? 'クラブ加入申請書' : '클럽 가입 신청서'}</h3>
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
                <label className="font-black text-stone-800">{isJapanese ? '申請者氏名 *' : '신청자 성함 *'}</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder={isJapanese ? '例: 山田太郎' : '예: 홍길동'}
                  required
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-black text-stone-800">{isJapanese ? '連絡先' : '연락처'}</label>
                <input
                  type="text"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-black text-stone-800">{isJapanese ? '挨拶 / 申請メッセージ' : '가입 인사 / 신청 메시지'}</label>
                <textarea
                  value={applicantMessage}
                  onChange={(e) => setApplicantMessage(e.target.value)}
                  rows={2}
                  placeholder={isJapanese ? '総務への簡単な挨拶やメッセージを入力してください。' : '총무님께 전달할 간단한 가입 인사를 남겨주세요.'}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-medium"
                />
              </div>

              <div className="p-2.5 bg-stone-100 rounded-xl text-[11px] text-stone-600 font-medium leading-relaxed">
                {isJapanese ? '💡 加入申請を提出すると、クラブ総務の承認後に正会員として登録され、定期月例会に参加できます。' : '💡 가입 신청을 제출하시면 클럽 총무님의 승인 후 즉시 정회원으로 등록되어 정기 월례회에 참가하실 수 있습니다.'}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setApplyingClub(null)}
                  className="w-1/3 py-2.5 bg-stone-100 text-stone-600 font-bold rounded-xl"
                >
                  {isJapanese ? 'キャンセル' : '취소'}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow-md"
                >
                  {isJapanese ? '総務へ加入申請を送信' : '총무님께 가입 신청 접수'}
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
                    {isJapanese ? '👑 クラブ会員管理室' : '👑 클럽 회원 관리실'}
                  </span>
                  <h3 className="font-extrabold text-base">{managingClub.name}</h3>
                </div>
                <p className="text-[11px] text-emerald-200 mt-0.5">
                  {isJapanese ? `ホームコース: ${managingClub.homeCourseName} · 正会員 ${managingClub.memberCount}名` : `홈 구장: ${managingClub.homeCourseName} · 정회원 ${managingClub.memberCount}명`}
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

            {/* 4대 클럽 회원 관리 탭: 회원 초대장 / 가입 신청 명단 / 회원 명단 / 회비 관리 */}
            <div className="grid grid-cols-4 p-2 bg-stone-100 border-b border-stone-200 gap-1 text-[11px] font-black">
              {/* 1. 회원 초대장 탭 */}
              <button
                type="button"
                onClick={() => setManagingClubTab('INVITE')}
                className={`py-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  managingClubTab === 'INVITE'
                    ? 'bg-white text-emerald-950 shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>💌</span>
                <span>{isJapanese ? '会員招待状' : '회원 초대장'}</span>
              </button>

              {/* 2. 신규 가입 신청 명단 탭 */}
              <button
                type="button"
                onClick={() => setManagingClubTab('PENDING')}
                className={`py-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  managingClubTab === 'PENDING'
                    ? 'bg-white text-emerald-950 shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>{isJapanese ? '加入申請者一覧' : '가입 신청 명단'}</span>
                {(managingClub.pendingMembers?.length || 0) > 0 ? (
                  <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                    {managingClub.pendingMembers?.length}
                  </span>
                ) : (
                  <span className="text-[9px] text-stone-400 font-bold">0</span>
                )}
              </button>

              {/* 3. 회원 명단 & 직책 배정 탭 */}
              <button
                type="button"
                onClick={() => setManagingClubTab('MEMBERS')}
                className={`py-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  managingClubTab === 'MEMBERS'
                    ? 'bg-white text-emerald-950 shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span>{isJapanese ? '会員名簿' : '회원 명단'}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                  {managingClub.members.length}{isJapanese ? '名' : '명'}
                </span>
              </button>

              {/* 4. 회비 관리 (연회비 수납 대장) 탭 */}
              <button
                type="button"
                onClick={() => setManagingClubTab('DUES')}
                className={`py-2 rounded-xl transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  managingClubTab === 'DUES'
                    ? 'bg-white text-amber-950 shadow-xs border border-amber-300 ring-1 ring-amber-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>{isJapanese ? '会費管理' : '회비 관리'}</span>
              </button>
            </div>

            {/* 내용 영역 */}
            <div className="p-4 space-y-3 max-h-[65vh] overflow-y-auto text-xs">
              {/* 탭 0: 신규 회원 카톡 가입 초대 */}
              {managingClubTab === 'INVITE' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 border-2 border-emerald-300 rounded-2xl p-4 text-center space-y-3 shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mx-auto text-2xl shadow-md">
                      💌
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-emerald-950">
                        {isJapanese ? '新規会員LINE加入招待状' : '신규 회원 카카오톡 가입 초대장'}
                      </h4>
                      <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                        {isJapanese ? <>LINEグループや知人に招待状を共有しましょう。<br />リンクをクリックするだけで簡単に加入申請ができます。</> : <>카카오톡 단체방이나 지인에게 초청장을 공유하세요.<br />스마트폰 링크 클릭 한 번으로 간편하게 가입을 신청할 수 있습니다.</>}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-emerald-200 text-left space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
                        <span>{isJapanese ? '招待クラブ' : '초대 클럽'}</span>
                        <span className="text-emerald-950 font-black">{managingClub.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
                        <span>{isJapanese ? 'ホームコース' : '홈 구장'}</span>
                        <span className="text-stone-800 font-black">{managingClub.homeCourseName}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-500">
                        <span>{isJapanese ? '現在の正会員' : '현재 정회원'}</span>
                        <span className="text-emerald-700 font-black">{managingClub.members.length}{isJapanese ? '名' : '명'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleCopyClubInvite(e, managingClub)}
                      className={`w-full py-3.5 text-white font-black text-xs sm:text-sm rounded-xl shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer transition ${
                        copiedClubId === managingClub.id
                          ? 'bg-emerald-600 border border-emerald-400 ring-2 ring-emerald-300 animate-pulse'
                          : 'bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900'
                      }`}
                    >
                      {copiedClubId === managingClub.id ? (
                        <>
                          <Check className="w-5 h-5 text-white stroke-[3]" />
                          <span>{isJapanese ? '✅ LINE招待状のコピー完了！' : '✅ 카톡 초청장 복사 완료!'}</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-5 h-5" />
                          <span>{isJapanese ? '📢 LINE加入招待状をコピー＆送信' : '📢 카톡 가입 초대장 복사 & 전송'}</span>
                        </>
                      )}
                    </button>

                    <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-200 text-left text-[10px] text-stone-600 space-y-1 leading-relaxed">
                      <p className="font-bold text-emerald-900">{isJapanese ? '💡 LINE送信方法のご案内:' : '💡 카톡 전송 방법 안내:'}</p>
                      <p>{isJapanese ? '1. 上のボタンを押すと、招待メッセージと専用リンクが自動コピーされます。' : '1. 위 버튼을 누르면 카톡 초대 문구와 전용 링크가 자동 복사됩니다.'}</p>
                      <p>{isJapanese ? '2. LINEグループやトーク画面を開いて[貼り付け]して送信してください。' : '2. 카카오톡 단체방이나 개인톡 채팅창을 열고 [붙여넣기]하여 전송해 주세요.'}</p>
                      <p>{isJapanese ? <>3. 会員が申請すると<strong>[加入申請者一覧]</strong>タブで承諾できます。</> : <>3. 회원이 신청하면 <strong>[가입 신청 명단]</strong> 탭에서 수락하실 수 있습니다.</>}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 탭 1: 가입 승인 대기 명단 */}
              {managingClubTab === 'PENDING' && (
                <div className="space-y-2.5">
                  {(!managingClub.pendingMembers || managingClub.pendingMembers.length === 0) ? (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto font-black text-sm">
                        ✓
                      </div>
                      <p className="font-black text-stone-800 text-sm">{isJapanese ? '保留中の加入申請はありません' : '대기 중인 가입 신청이 없습니다'}</p>
                      <p className="text-[11px] text-stone-500 leading-relaxed font-medium">
                        {isJapanese ? '上部の「LINE加入招待状をコピー」を押してLINEグループに共有すると、会員が申請できます。' : '상단의 ‘카톡 가입 초청장 복사’ 버튼을 눌러 카카오톡 단체방에 공유하면 회원들이 신청할 수 있습니다.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* [대표님 지시] 가입 대기자 20~50인 몰릴 때 1초 일괄 승인 버튼 */}
                      <div className="flex items-center justify-between gap-2 p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl shadow-xs">
                        <div>
                          <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-emerald-700" />
                            <span>{isJapanese ? <>申請待ち 合計 <strong>{managingClub.pendingMembers.length}名</strong></> : <>대기 신청자 총 <strong>{managingClub.pendingMembers.length}명</strong></>}</span>
                          </div>
                          <p className="text-[10px] text-emerald-800 font-bold mt-0.5">
                            {isJapanese ? 'ワンクリックで申請者全員を正会員として登録します。' : '원클릭으로 대기자 전원을 정회원으로 등록합니다.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApproveAllPendingMembers(managingClub.id)}
                          className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 hover:from-emerald-700 text-white font-black text-xs rounded-xl shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0 border border-emerald-500"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>{isJapanese ? '✅ 全員を一括承認' : '✅ 전체 1초 일괄 승인'}</span>
                        </button>
                      </div>

                      {managingClub.pendingMembers.map((p) => {
                        const comp = p.totalCompleted9Holes !== undefined ? p.totalCompleted9Holes : getUserCompleted9Holes(p.name);
                        const tier = calculateTier(comp);
                        return (
                        <div
                          key={p.id}
                          className="bg-stone-50 border-2 border-emerald-300 rounded-2xl p-3.5 space-y-2.5 shadow-xs"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-sm text-stone-900">{p.name}</span>
                                {p.memberCode && (
                                  <span className="text-[10px] bg-stone-200 text-stone-700 font-mono font-bold px-1.5 py-0.2 rounded">
                                    {p.memberCode}
                                  </span>
                                )}
                                <DiamondTierBadge
                                  tier={tier}
                                  completedCount={comp}
                                  size="xs"
                                  showLabel={true}
                                />
                                <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-1.5 py-0.2 rounded">
                                  {isJapanese ? '承認待ち' : '승인 대기'}
                                </span>
                              </div>
                            <div className="text-[11px] text-stone-500 font-bold mt-0.5">
                              📞 {p.phone || (isJapanese ? '連絡先未記載' : '연락처 미기재')} · ⏱️ {p.requestedAt}
                            </div>
                          </div>

                          <div className="flex gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleApproveMember(managingClub.id, p.id, p.name)}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{isJapanese ? '承認' : '수락'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectMember(managingClub.id, p.id, p.name)}
                              className="px-2.5 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs rounded-xl active:scale-95 cursor-pointer"
                            >
                              {isJapanese ? '拒否' : '거절'}
                            </button>
                          </div>
                        </div>

                        {p.message && (
                          <p className="text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200 text-[11px] font-medium leading-relaxed">
                            💬 &ldquo;{p.message}&rdquo;
                          </p>
                        )}
                      </div>
                      );
                    })}
                    </>
                  )}
                </div>
              )}

              {managingClubTab === 'MEMBERS' && (() => {
                const totalMembers = managingClub.members || [];
                const executiveCount = totalMembers.filter((m) => m.role !== 'MEMBER' || !!(m.customRoleName && m.customRoleName.trim())).length;
                const regularCount = totalMembers.length - executiveCount;

                const filteredMembers = totalMembers.filter((m) => {
                  const matchSearch =
                    !memberSearchTerm.trim() ||
                    m.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                    (m.phone && m.phone.includes(memberSearchTerm.trim()));

                  const isExec = m.role !== 'MEMBER' || !!(m.customRoleName && m.customRoleName.trim());
                  const matchRole =
                    memberRoleFilter === 'ALL' ||
                    (memberRoleFilter === 'EXECUTIVE' && isExec) ||
                    (memberRoleFilter === 'MEMBER' && !isExec);

                  return matchSearch && matchRole;
                });

                return (
                  <div className="space-y-2.5">
                    {/* 🔍 50인~100인 대규모 회원 1초 검색 및 직책 필터 바 */}
                    <div className="bg-white rounded-2xl p-2.5 border border-stone-200 shadow-2xs space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={memberSearchTerm}
                          onChange={(e) => setMemberSearchTerm(e.target.value)}
                          placeholder={isJapanese ? '🔍 会員名または電話番号で検索...' : '🔍 회원 이름 또는 전화번호 뒷자리 검색...'}
                          className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
                        />
                        {memberSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setMemberSearchTerm('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* 직책 필터 탭 */}
                      <div className="grid grid-cols-3 gap-1 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setMemberRoleFilter('ALL')}
                          className={`py-1.5 rounded-lg transition text-center cursor-pointer ${
                            memberRoleFilter === 'ALL'
                              ? 'bg-emerald-700 text-white font-black shadow-xs'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                          }`}
                        >
                          {isJapanese ? `全体 (${totalMembers.length}名)` : `전체 (${totalMembers.length}명)`}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemberRoleFilter('EXECUTIVE')}
                          className={`py-1.5 rounded-lg transition text-center cursor-pointer ${
                            memberRoleFilter === 'EXECUTIVE'
                              ? 'bg-emerald-700 text-white font-black shadow-xs'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                          }`}
                        >
                          {isJapanese ? `👑 役員 (${executiveCount}名)` : `👑 임원진 (${executiveCount}명)`}
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemberRoleFilter('MEMBER')}
                          className={`py-1.5 rounded-lg transition text-center cursor-pointer ${
                            memberRoleFilter === 'MEMBER'
                              ? 'bg-emerald-700 text-white font-black shadow-xs'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                          }`}
                        >
                          {isJapanese ? `⛳ 一般会員 (${regularCount}名)` : `⛳ 일반회원 (${regularCount}명)`}
                        </button>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-950 font-medium leading-relaxed">
                      {isJapanese ? <>💡 役職配属の<strong>[🎖️ 役職任命]</strong>ボタンを押して会長、副会長、総務、監査、理事などを任命したり、<strong>カスタム役職(筆頭副会長、顧問等)</strong>を直接設定できます。</> : <>💡 직책 배정의 <strong>[🎖️ 직책 임명]</strong> 버튼을 눌러 회장, 부회장, 총무, 감사, 이사 등을 임명하거나 <strong>맞춤 직책(수석부회장, 고문 등)</strong>을 직접 수정할 수 있습니다.</>}
                    </div>

                    {filteredMembers.length === 0 ? (
                      <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                        <p className="text-xs font-black text-stone-700">{isJapanese ? '検索条件に一致する会員がいません。' : '검색 조건에 일치하는 회원이 없습니다.'}</p>
                        <p className="text-[11px] text-stone-400">{isJapanese ? '他の名前や電話番号で検索してみてください。' : '다른 이름이나 전화번호로 검색해 보세요.'}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredMembers.map((m, idx) => {
                      const roleBadge = getRoleBadge(m.role, m.customRoleName);
                      const isNonRegular = m.role !== 'MEMBER' || !!(m.customRoleName && m.customRoleName.trim());
                      const comp = m.totalCompleted9Holes !== undefined ? m.totalCompleted9Holes : getUserCompleted9Holes(m.name);
                      const tier = calculateTier(comp);
                      return (
                        <div
                          key={m.id || idx}
                          className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 text-[10px] flex items-center justify-center font-black shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-black text-stone-900 text-sm">{m.name}</span>
                                  {m.memberCode && (
                                    <span className="text-[10px] bg-stone-200 text-stone-700 font-mono font-bold px-1.5 py-0.2 rounded">
                                      {m.memberCode}
                                    </span>
                                  )}
                                  <DiamondTierBadge
                                    tier={tier}
                                    completedCount={comp}
                                    size="xs"
                                    showLabel={true}
                                  />
                                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-black border ${roleBadge.style}`}>
                                    {roleBadge.text}
                                  </span>
                                </div>
                                {m.phone && (
                                  <span className="text-[10px] text-stone-400 font-medium">📞 {m.phone}</span>
                                )}
                              </div>
                            </div>

                            <span className="text-[10px] text-stone-400 font-medium shrink-0">{m.joinedAt} {isJapanese ? '加入' : '가입'}</span>
                          </div>

                          {/* 직책 배정 액션 버튼 바 */}
                          <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-stone-200/70">
                            <span className="text-[10px] font-bold text-stone-500 mr-0.5">{isJapanese ? '役職任命:' : '직책 배정:'}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setRoleModalMember({
                                  memberId: m.id,
                                  memberName: m.name,
                                  currentRole: m.role,
                                  customRoleName: m.customRoleName,
                                });
                                setCustomRoleInput(m.customRoleName || '');
                              }}
                              className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-[11px] rounded-lg shadow-2xs transition cursor-pointer active:scale-95 flex items-center gap-1"
                            >
                              <span>{isJapanese ? '🎖️ 役職任命' : '🎖️ 직책 임명'}</span>
                              <span className="text-[9px]">▾</span>
                            </button>
                            {isNonRegular && (
                              <button
                                type="button"
                                onClick={() => handleAssignRole(managingClub.id, m.id, 'MEMBER', undefined, m.name)}
                                className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-[10px] rounded-lg border border-stone-300 transition cursor-pointer active:scale-95"
                              >
                                {isJapanese ? '一般会員' : '일반 회원'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 🔐 탈퇴 회원 비밀 보관소 (영구 보존 & 복귀 시 원상 회복) */}
                {(() => {
                  const archivedList = ClubStorage.getArchivedMembers(managingClub.id);
                  return (
                    <div className="mt-4 pt-3 border-t border-stone-200">
                      <div className="bg-stone-100/90 rounded-2xl p-3 border border-stone-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">🔐</span>
                            <span className="font-black text-xs text-stone-900">
                              {isJapanese ? `退会会員アーカイブ (${archivedList.length}名保存中)` : `탈퇴 회원 비밀 보관소 (${archivedList.length}명 보존 중)`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowArchivedMembers(!showArchivedMembers)}
                            className="text-[11px] font-black text-purple-700 hover:text-purple-900 cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-purple-200 shadow-2xs"
                          >
                            {showArchivedMembers ? (isJapanese ? '閉じる ▲' : '접기 ▲') : (isJapanese ? 'アーカイブ名簿を表示 ▼' : '보관 명부 보기 ▼')}
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-500 font-medium leading-relaxed">
                          {isJapanese ? '退会した会員の初回加入日および過去の出場・受賞記録は削除されず安全に保管されます。再復帰時に過去の記録が100%復元されます。' : '클럽을 탈퇴한 회원의 최초 가입일 및 과거 출전/수상 기록은 삭제되지 않고 안전하게 암호 보존됩니다. 언제든 다시 복귀하면 과거 기록이 100% 원상 복구됩니다.'}
                        </p>

                        {showArchivedMembers && (
                          <div className="space-y-1.5 pt-2 animate-fadeIn">
                            {archivedList.length === 0 ? (
                              <div className="text-center py-4 text-stone-400 text-xs font-bold bg-white rounded-xl">
                                {isJapanese ? '現在保管されている退会会員はありません。' : '현재 보관된 탈퇴 회원이 없습니다.'}
                              </div>
                            ) : (
                              archivedList.map((a, aIdx) => (
                                <div
                                  key={a.id || aIdx}
                                  className="p-2.5 bg-white rounded-xl border border-stone-200 text-xs space-y-1 shadow-2xs"
                                >
                                  <div className="flex items-center justify-between font-black">
                                    <span className="text-stone-900 flex items-center gap-1">
                                      <span>👤 {a.name}</span>
                                      <span className="bg-stone-100 text-stone-600 text-[9px] px-1.5 py-0.2 rounded font-bold">
                                        {isJapanese ? `元 ${a.roleAtLeave === 'PRESIDENT' ? '会長' : a.roleAtLeave === 'MANAGER' ? '総務' : '会員'}` : `과거 ${a.roleAtLeave === 'PRESIDENT' ? '회장' : a.roleAtLeave === 'MANAGER' ? '총무' : '회원'}`}
                                      </span>
                                    </span>
                                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-extrabold border border-emerald-200">
                                      {isJapanese ? '再加入時に復元待機' : '재가입 시 원상 복구 대기'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-medium">
                                    <span>{isJapanese ? <>初回加入: <strong>{a.joinedAt}</strong> (退会: {a.leftAt})</> : <>최초 가입: <strong>{a.joinedAt}</strong> (탈퇴: {a.leftAt})</>}</span>
                                    <span>{isJapanese ? <>過去出場: <strong>{a.pastTournamentsCount}回</strong></> : <>과거 출전: <strong>{a.pastTournamentsCount}회</strong></>}</span>
                                  </div>
                                  {a.pastAwards && a.pastAwards.length > 0 && (
                                    <div className="text-[10px] text-amber-800 bg-amber-50/80 p-1 rounded font-bold">
                                      {isJapanese ? `🏅 過去受賞: ${a.pastAwards.join(', ')}` : `🏅 과거 수상: ${a.pastAwards.join(', ')}`}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

              {/* 탭 3: 회비 관리 (연회비 수납 대장 & 납부 관리) */}
              {managingClubTab === 'DUES' && (() => {
                const defaultDues = managingClub.annualDuesAmount || 50000;
                const paidList = managingClub.members.filter((m) => !!m.duesPaid);
                const unpaidList = managingClub.members.filter((m) => !m.duesPaid);
                const totalCollected = paidList.reduce((acc, m) => acc + (m.duesAmount || defaultDues), 0);
                const percent = managingClub.members.length > 0 ? Math.round((paidList.length / managingClub.members.length) * 100) : 0;

                return (
                  <div className="space-y-3">
                    {/* 1. 연회비 요약 배너 */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-3.5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                        <div className="flex items-center gap-2 font-black text-xs text-amber-950">
                          <span className="p-1 rounded-lg bg-amber-200/70 text-amber-900">💰</span>
                          <span>{isJapanese ? 'クラブ年会費納入状況' : '클럽 연회비 납부 현황'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-white px-2.5 py-1 rounded-xl border border-amber-200 shadow-2xs">
                          <span>{isJapanese ? '年会費:' : '연회비:'}</span>
                          <strong className="font-black text-amber-700 font-mono">
                            {isJapanese ? `¥${defaultDues.toLocaleString()}` : `${defaultDues.toLocaleString()}원`}
                          </strong>
                        </div>
                      </div>

                      {/* 수납 통계 3분할 카드 */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 bg-white rounded-xl border border-amber-200 shadow-2xs">
                          <span className="text-[10px] text-stone-500 font-bold block">{isJapanese ? '正会員' : '정회원'}</span>
                          <strong className="text-sm font-black text-stone-900 font-mono">
                            {managingClub.members.length}{isJapanese ? '名' : '명'}
                          </strong>
                        </div>
                        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-300 shadow-2xs">
                          <span className="text-[10px] text-emerald-800 font-bold block">{isJapanese ? '納入完了' : '납부 완료'}</span>
                          <strong className="text-sm font-black text-emerald-700 font-mono">
                            {paidList.length}{isJapanese ? '名' : '명'} ({percent}%)
                          </strong>
                        </div>
                        <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-300 shadow-2xs">
                          <span className="text-[10px] text-rose-800 font-bold block">{isJapanese ? '未納会員' : '미납 회원'}</span>
                          <strong className="text-sm font-black text-rose-700 font-mono">
                            {unpaidList.length}{isJapanese ? '名' : '명'}
                          </strong>
                        </div>
                      </div>

                      {/* 수납 총액 요약 바 */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="font-bold text-amber-900">{isJapanese ? '納入累計額:' : '총 수납 누적액:'}</span>
                        <span className="font-black text-emerald-800 font-mono text-sm">
                          {isJapanese ? `¥${totalCollected.toLocaleString()}` : `${totalCollected.toLocaleString()}원`}
                        </span>
                      </div>
                      {/* [대표님 지시] 미납 회원 존재 시 1초 카톡 납부 독려 안내문 복사 */}
                      {unpaidList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const text = `📢 [${managingClub.name}] ${isJapanese ? '年会費納入状況のご案内' : '연회비 납부 현황 및 안내'}\n` +
                              `• ${isJapanese ? '年会費' : '연회비'}: ${(defaultDues).toLocaleString()}${isJapanese ? '円' : '원'}\n` +
                              `• ${isJapanese ? '納入状況' : '납부 현황'}: ${isJapanese ? `計 ${managingClub.members.length}名中 ${paidList.length}名完納 (${percent}%)` : `총 ${managingClub.members.length}명 중 ${paidList.length}명 완납 (${percent}%)`}\n` +
                              `• ${isJapanese ? '未納会員' : '미납 회원'} (${unpaidList.length}${isJapanese ? '名' : '명'}): ${unpaidList.map(u => u.name).join(', ')}\n\n` +
                              `${isJapanese ? '円滑なクラブ運営と定期ラウンドのため、お早めの納入をお願い申し上げます。' : '클럽의 원활한 운영과 정기 라운드를 위해 빠른 입금 부탁드립니다. 감사합니다!'}\n` +
                              `• ${isJapanese ? 'お問い合わせ' : '문의 및 확인'}: ${isJapanese ? '総務' : '총무'} (${managingClub.managerName || (isJapanese ? '役員一同' : '집행부')})`;
                            navigator.clipboard.writeText(text);
                            showToast(isJapanese ? `📢 未納会員${unpaidList.length}名への納入案内文がコピーされました！LINEに共有してください。` : `📢 미납 ${unpaidList.length}인 납부 독려 공지문이 복사되었습니다! 카톡에 공유하세요.`);
                          }}
                          className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Share2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>{isJapanese ? `📢 未納会員${unpaidList.length}名 LINE納入案内文をコピー` : `📢 미납 회원 ${unpaidList.length}인 카톡 납부 안내문 복사`}</span>
                        </button>
                      )}
                    </div>

                    {/* 2. 회원별 연회비 수납 대장 목록 및 필터 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="font-black text-xs text-stone-800 flex items-center gap-1">
                          <span>📋</span> <span>{isJapanese ? '会員別年会費納入台帳' : '회원별 연회비 수납 대장'}</span>
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium">{isJapanese ? 'ワンクリック納入確認' : '원클릭 납부 확인'}</span>
                      </div>

                      {/* [대표님 지시] 수납 대장 필터 (전체 / 완납 / 미납자) */}
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setDuesFilter('ALL')}
                          className={`py-1.5 text-xs font-black rounded-lg transition cursor-pointer text-center ${
                            duesFilter === 'ALL'
                              ? 'bg-white text-stone-900 shadow-2xs'
                              : 'text-stone-500 hover:text-stone-800'
                          }`}
                        >
                          {isJapanese ? `全体 (${managingClub.members.length}名)` : `전체 (${managingClub.members.length}명)`}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuesFilter('PAID')}
                          className={`py-1.5 text-xs font-black rounded-lg transition cursor-pointer text-center ${
                            duesFilter === 'PAID'
                              ? 'bg-emerald-700 text-white shadow-2xs'
                              : 'text-emerald-700 hover:text-emerald-900'
                          }`}
                        >
                          {isJapanese ? `完納 (${paidList.length}名)` : `완납 (${paidList.length}명)`}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDuesFilter('UNPAID')}
                          className={`py-1.5 text-xs font-black rounded-lg transition cursor-pointer text-center ${
                            duesFilter === 'UNPAID'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'text-rose-600 hover:text-rose-800'
                          }`}
                        >
                          {isJapanese ? `未納 (${unpaidList.length}名)` : `미납 (${unpaidList.length}명)`}
                        </button>
                      </div>

                      <div className="space-y-2">
                        {managingClub.members
                          .filter((m) => {
                            if (duesFilter === 'PAID') return !!m.duesPaid;
                            if (duesFilter === 'UNPAID') return !m.duesPaid;
                            return true;
                          })
                          .map((m, idx) => {
                          const isPaid = !!m.duesPaid;
                          return (
                            <div
                              key={m.id || idx}
                              className={`p-3 rounded-2xl border transition shadow-2xs space-y-2 ${
                                isPaid
                                  ? 'bg-emerald-50/60 border-emerald-300'
                                  : 'bg-stone-50 border-stone-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 text-[10px] flex items-center justify-center font-black">
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-black text-stone-900 text-sm">{m.name}</span>
                                      {(() => {
                                        const b = getRoleBadge(m.role, m.customRoleName);
                                        return (
                                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-black border ${b.style}`}>
                                            {b.text}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                    {m.phone && (
                                      <span className="text-[10px] text-stone-400 font-medium">📞 {m.phone}</span>
                                    )}
                                  </div>
                                </div>

                                {/* 납부 상태 배지 */}
                                <div className="text-right">
                                  {isPaid ? (
                                    <div className="space-y-0.5">
                                      <span className="inline-flex items-center gap-0.5 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                        <span>{isJapanese ? '完納' : '완납'}</span>
                                      </span>
                                      <span className="text-[9px] text-emerald-800 block font-medium">
                                        {m.duesPaidAt || (isJapanese ? '納入確認' : '납부 확인')}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200">
                                      <span>{isJapanese ? '未納' : '미납'}</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 수납 관리 버튼 바 */}
                              <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-xs">
                                <span className="text-[10px] text-stone-500 font-medium">
                                  {isPaid
                                    ? (isJapanese ? `納入額: ¥${Number(m.duesAmount || defaultDues).toLocaleString()} (${m.duesNotes || '納入'})` : `납부액: ${Number(m.duesAmount || defaultDues).toLocaleString()}원 (${m.duesNotes || '수납'})`)
                                    : (isJapanese ? `年会費 ¥${defaultDues.toLocaleString()} 納入待ち` : `연회비 ${defaultDues.toLocaleString()}원 납부 대기`)}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  {isPaid ? (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleMemberDues(managingClub.id, m.id, false, m.name)}
                                      className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-[10px] rounded-lg cursor-pointer transition active:scale-95"
                                    >
                                      {isJapanese ? '未納に変更' : '미납으로 변경'}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleMemberDues(managingClub.id, m.id, true, m.name)}
                                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg shadow-2xs cursor-pointer transition active:scale-95 flex items-center gap-1"
                                    >
                                      <Coins className="w-3 h-3 text-amber-300" />
                                      <span>{isJapanese ? '納入確認完了' : '수납 확인 완료'}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 하단 버튼 바 (클럽 설정 + 닫기) */}
            <div className="p-3 border-t border-stone-200 flex items-center justify-between bg-stone-50">
              <button
                type="button"
                onClick={() => {
                  if (managingClub) {
                    const c = managingClub;
                    setClubSettingModal(c);
                  }
                }}
                className="px-3 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-2xs"
                title={isJapanese ? 'クラブ設定および環境管理' : '클럽 설정 및 환경 관리'}
              >
                <Settings className="w-3.5 h-3.5 text-stone-600" />
                <span>{isJapanese ? '⚙️ クラブ設定' : '⚙️ 클럽 설정'}</span>
              </button>

              <button
                type="button"
                onClick={() => setManagingClub(null)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-black rounded-xl text-xs cursor-pointer"
              >
                {isJapanese ? '閉じる' : '닫기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3-0-1: 회원 직책 임명 & 맞춤 직책 직접 수정 모달 */}
      {/* ========================================================================= */}
      {roleModalMember && managingClub && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white p-4 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-amber-300 text-base shrink-0">
                  🎖️
                </div>
                <div>
                  <h4 className="font-black text-sm text-white tracking-tight">
                    {isJapanese ? '役職任命および委任' : '직책 임명 및 위임'}
                  </h4>
                  <p className="text-[11px] text-emerald-200">
                    <strong className="text-amber-300 font-bold">{roleModalMember.memberName}</strong> {isJapanese ? '会員の役職設定' : '회원님 직책 설정'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRoleModalMember(null);
                  setCustomRoleInput('');
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white text-xs font-bold transition shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* 1. 기본 공식 직책 목록 (원터치 선택) */}
              <div className="space-y-2">
                <div className="text-[11px] font-black text-stone-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>📋</span>
                    <span>{isJapanese ? '標準役職ワンタッチ選択' : '표준 직책 원터치 선택'}</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">{isJapanese ? 'タップで即時任命' : '클릭 시 즉시 임명'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      role: 'PRESIDENT',
                      label: isJapanese ? '👑 会長' : '👑 회장',
                      desc: isJapanese ? 'クラブ統括代表' : '클럽 총괄 대표',
                      style: 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950 font-black',
                    },
                    {
                      role: 'VICE_PRESIDENT',
                      label: isJapanese ? '🥈 副会長' : '🥈 부회장',
                      desc: isJapanese ? '会長補佐' : '회장단 보좌',
                      style: 'bg-amber-50/60 hover:bg-amber-100 border-amber-200 text-amber-900 font-black',
                    },
                    {
                      role: 'MANAGER',
                      label: isJapanese ? '📋 総務' : '📋 총무',
                      desc: isJapanese ? '事務・会計統括' : '클럽 살림·재무 총괄',
                      style: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-950 font-black',
                    },
                    {
                      role: 'AUDITOR',
                      label: isJapanese ? '⚖️ 監査' : '⚖️ 감사',
                      desc: isJapanese ? '会計・運営監査' : '회계·운영 감사',
                      style: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-950 font-black',
                    },
                    {
                      role: 'DIRECTOR',
                      label: isJapanese ? '🏛️ 理事' : '🏛️ 이사',
                      desc: isJapanese ? '運営委員会委員' : '운영위원회 위원',
                      style: 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-950 font-black',
                    },
                    {
                      role: 'CAPTAIN',
                      label: isJapanese ? '🏆 競技委員長' : '🏆 경기위원장',
                      desc: isJapanese ? '大会組編成・ルール統括' : '대회 조편성·룰 총괄',
                      style: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-950 font-black',
                    },
                  ].map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() =>
                        handleAssignRole(
                          managingClub.id,
                          roleModalMember.memberId,
                          item.role,
                          undefined,
                          roleModalMember.memberName
                        )
                      }
                      className={`p-2.5 rounded-xl border text-left transition active:scale-95 cursor-pointer shadow-2xs ${item.style}`}
                    >
                      <div className="text-xs font-black">{item.label}</div>
                      <div className="text-[10px] text-stone-500 font-medium">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. 맞춤 직책 직접 입력 / 수정 (대표님 핵심 요구사항) */}
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <div className="text-[11px] font-black text-stone-800 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span>✏️</span>
                    <span>{isJapanese ? '役職名 直接入力・編集' : '직책 이름 직접 입력 / 수정'}</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">{isJapanese ? 'カスタム役職' : '자유 맞춤 직책'}</span>
                </div>

                <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2.5">
                  <p className="text-[10px] text-stone-600 font-medium leading-relaxed">
                    {isJapanese ? '筆頭副会長、女性副会長、顧問、指導部長などクラブ独自の役職名を自由に入力できます。' : '수석부회장, 여성부회장, 고문, 훈련부장 등 우리 클럽만의 직책명을 원하는 대로 직접 적을 수 있습니다.'}
                  </p>

                  {/* 빠른 추천 칩 버튼들 */}
                  <div className="flex flex-wrap gap-1.5">
                    {(isJapanese ? ['筆頭副会長', '女性副会長', '顧問', '指導部長', '広報理事', '競技部長'] : ['수석부회장', '여성부회장', '고문', '훈련부장', '홍보이사', '경기부장']).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setCustomRoleInput(tag)}
                        className="px-2 py-0.8 bg-white hover:bg-stone-100 text-stone-700 text-[10px] font-bold rounded-lg border border-stone-300 transition cursor-pointer active:scale-95"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={customRoleInput}
                      onChange={(e) => setCustomRoleInput(e.target.value)}
                      placeholder={isJapanese ? '役職名入力 (例: 筆頭副会長)' : '직책명 입력 (예: 수석부회장)'}
                      className="flex-1 px-3 py-2 text-xs font-bold border border-stone-300 rounded-xl bg-white focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 text-stone-900"
                      maxLength={20}
                    />
                    <button
                      type="button"
                      disabled={!customRoleInput.trim()}
                      onClick={() => {
                        if (!customRoleInput.trim()) return;
                        handleAssignRole(
                          managingClub.id,
                          roleModalMember.memberId,
                          'CUSTOM',
                          customRoleInput.trim(),
                          roleModalMember.memberName
                        );
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-xs shrink-0 ${
                        customRoleInput.trim()
                          ? 'bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      {isJapanese ? '任命する' : '임명하기'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. 일반 회원으로 초기화 및 닫기 */}
              <div className="pt-2 border-t border-stone-200 flex justify-between items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleAssignRole(
                      managingClub.id,
                      roleModalMember.memberId,
                      'MEMBER',
                      undefined,
                      roleModalMember.memberName
                    )
                  }
                  className="px-2.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer active:scale-95 border border-stone-300 truncate"
                >
                  {isJapanese ? '👤 一般会員 (解除)' : '👤 일반 회원 (해제)'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoleModalMember(null);
                    setCustomRoleInput('');
                  }}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl text-xs transition cursor-pointer shrink-0"
                >
                  {isJapanese ? '閉じる' : '닫기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚔️ 클럽 대항전(교류전) 공식 개설 모달 */}
      {clubMatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border-2 border-purple-500 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚔️</span>
                <div>
                  <h3 className="font-extrabold text-base leading-snug">
                    {isJapanese ? 'クラブ対抗戦(交流戦) 公式開設' : '클럽 대항전(교류전) 공식 개설'}
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    {clubMatchModal.name} · {isJapanese ? '代表選手団選抜' : '대표 선수단 선발'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClubMatchModal(null)}
                className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 overflow-y-auto text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-800 flex items-center gap-1">
                  <span>{isJapanese ? '🎯 対抗戦の相手クラブ指定' : '🎯 대항전 상대 클럽 지정'}</span>
                </label>
                <select
                  value={matchOpponentClubId}
                  onChange={(e) => setMatchOpponentClubId(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-black focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="OPEN">{isJapanese ? '🌐 全国オープンチャレンジ (どのクラブでも挑戦受諾可能)' : '🌐 전국 공개 챌린지 (어느 클럽이든 도전 수락 가능)'}</option>
                  {clubs
                    .filter((c) => c.id !== clubMatchModal.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        ⚔️ [{c.region}] {c.name} ({isJapanese ? `会員 ${c.memberCount}名` : `회원 ${c.memberCount}명`})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-black text-stone-800">
                  <span>{isJapanese ? '👥 1クラブあたりの出場定員' : '👥 클럽당 출전 엔트리 정원'}</span>
                  <span className="text-purple-700">{matchPlayerQuota}{isJapanese ? '名' : '명'} ({isJapanese ? `計 ${matchPlayerQuota * 2}名マッチ` : `총 ${matchPlayerQuota * 2}명 매치`})</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[8, 12, 16, 20].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setMatchPlayerQuota(q)}
                      className={`py-2 rounded-xl text-xs font-black border transition cursor-pointer active:scale-95 ${
                        matchPlayerQuota === q
                          ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {q}{isJapanese ? '名' : '명'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-xs font-black text-stone-800">
                  <span>{isJapanese ? `📋 代表出場選手の選択 (${matchSelectedMemberIds.length}/${matchPlayerQuota}名)` : `📋 대표 출전 선수 선택 ({matchSelectedMemberIds.length}/{matchPlayerQuota}명)`}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = clubMatchModal.members.map((m) => m.id);
                      setMatchSelectedMemberIds(
                        matchSelectedMemberIds.length === allIds.length ? [] : allIds.slice(0, matchPlayerQuota)
                      );
                    }}
                    className="text-[11px] text-purple-700 hover:underline font-bold cursor-pointer"
                  >
                    {matchSelectedMemberIds.length === clubMatchModal.members.length ? (isJapanese ? '全解除' : '전체 해제') : (isJapanese ? '定員一括選択' : '정원 일괄 선택')}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-[35vh] overflow-y-auto p-1 bg-stone-50 rounded-2xl border border-stone-200">
                  {clubMatchModal.members.map((m) => {
                    const isSelected = matchSelectedMemberIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setMatchSelectedMemberIds(matchSelectedMemberIds.filter((id) => id !== m.id));
                          } else {
                            if (matchSelectedMemberIds.length >= matchPlayerQuota) {
                              showToast(isJapanese ? `⚠️ 定員(${matchPlayerQuota}名)を超えることはできません。` : `⚠️ 엔트리 정원(${matchPlayerQuota}명)을 초과할 수 없습니다.`);
                              return;
                            }
                            setMatchSelectedMemberIds([...matchSelectedMemberIds, m.id]);
                          }
                        }}
                        className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer text-left ${
                          isSelected
                            ? 'bg-purple-100 border-purple-500 text-purple-950 shadow-2xs'
                            : 'bg-white border-stone-200 text-stone-700 hover:border-purple-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isSelected
                                ? 'bg-purple-700 text-white'
                                : 'border border-stone-300 bg-stone-50'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                          <span className="font-black truncate">{m.name}</span>
                          {m.role === 'PRESIDENT' ? (
                            <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1 rounded shrink-0">{isJapanese ? '会長' : '회장'}</span>
                          ) : m.role === 'MANAGER' ? (
                            <span className="text-[9px] bg-emerald-100 text-emerald-900 font-bold px-1 rounded shrink-0">{isJapanese ? '総務' : '총무'}</span>
                          ) : null}
                        </div>
                        <span className="text-[10px] text-stone-400 font-medium shrink-0">
                          {isSelected ? (isJapanese ? '選抜済' : '선발됨') : (isJapanese ? '選択' : '선택')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleCreateClubMatchSubmit(clubMatchModal);
                  setClubMatchModal(null);
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-600 hover:to-indigo-600 active:scale-98 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-purple-500 mt-2"
              >
                <Swords className="w-4 h-4 text-yellow-300" />
                <span>{isJapanese ? `対抗戦公式開設＆選手団${matchSelectedMemberIds.length}名確定 🚀` : `대항전 공식 개설 및 선수단 ${matchSelectedMemberIds.length}명 확정 🚀`}</span>
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
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedClubDetail;
                    setSelectedClubDetail(null);
                    setClubSettingModal(c);
                  }}
                  className="p-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 hover:text-white transition cursor-pointer border border-emerald-700/50"
                  title={isJapanese ? 'クラブ設定および退会管理' : '클럽 설정 및 탈퇴 관리'}
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClubDetail(null)}
                  className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 탭 바: [👥 회원 명부] vs [💎 명예의 전당] vs [📜 클럽 대회 실록] */}
            <div className="grid grid-cols-3 p-1.5 bg-stone-100 border-b border-stone-200 gap-1 text-xs font-black">
              <button
                type="button"
                onClick={() => setClubDetailTab('MEMBERS')}
                className={`py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
                  clubDetailTab === 'MEMBERS'
                    ? 'bg-white text-emerald-950 shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-stone-600" />
                <span>{isJapanese ? '会員名簿' : '회원 명부'}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {selectedClubDetail.members.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setClubDetailTab('HALL_OF_FAME')}
                className={`py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
                  clubDetailTab === 'HALL_OF_FAME'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-stone-950 shadow-xs border border-amber-300'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>{isJapanese ? '殿堂' : '명예의 전당'}</span>
              </button>

              <button
                type="button"
                onClick={() => setClubDetailTab('CHRONICLE')}
                className={`py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
                  clubDetailTab === 'CHRONICLE'
                    ? 'bg-emerald-700 text-white shadow-xs border border-emerald-800'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>{isJapanese ? '大会記録' : '대회 실록'}</span>
                <span className="bg-emerald-800 text-emerald-100 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {ClubStorage.getClubChronicles(selectedClubDetail.id).length}
                </span>
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto text-xs">
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-emerald-950 space-y-1">
                <div className="flex justify-between font-black">
                  <span>{isJapanese ? `会長: ${selectedClubDetail.presidentName}` : `회장: ${selectedClubDetail.presidentName}`}</span>
                  <span>{isJapanese ? `総務: ${selectedClubDetail.managerName}` : `총무: ${selectedClubDetail.managerName}`}</span>
                </div>
                {selectedClubDetail.contactPhone && (
                  <div className="text-stone-600 font-bold">
                    {isJapanese ? `お問い合わせ: ${selectedClubDetail.contactPhone}` : `문의처: ${selectedClubDetail.contactPhone}`}
                  </div>
                )}
              </div>

              {/* 탭 1: 소속 회원 명부 */}
              {clubDetailTab === 'MEMBERS' && (
                <div>
                  <h4 className="font-black text-stone-900 mb-2">
                    {isJapanese ? `所属会員名簿 (${selectedClubDetail.members.length}名)` : `소속 회원 명부 (${selectedClubDetail.members.length}명)`}
                  </h4>
                  <div className="space-y-1.5">
                    {selectedClubDetail.members.map((m, idx) => {
                      const comp = getUserCompleted9Holes(m.name);
                      const tier = calculateTier(comp);
                      return (
                        <div
                          key={m.id || idx}
                          className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between font-bold text-stone-800"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-black shrink-0">
                              {idx + 1}
                            </span>
                            <span className="truncate text-sm font-black text-stone-900">{m.name}</span>
                            <DiamondTierBadge
                              tier={tier}
                              completedCount={comp}
                              size="xs"
                              showLabel={true}
                            />
                          </span>
                          <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-black shrink-0">
                            {m.role === 'PRESIDENT' ? (isJapanese ? '👑 会長' : '👑 회장') : m.role === 'MANAGER' ? (isJapanese ? '📋 총무' : '📋 총무') : (isJapanese ? '会員' : '회원')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 탭 2: 💎 클럽 다이아몬드 명예의 전당 (누적 완주 횟수 랭킹) */}
              {clubDetailTab === 'HALL_OF_FAME' && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100 p-3.5 rounded-2xl border border-amber-300 text-stone-900 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 font-black text-xs text-amber-950">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      <span>{isJapanese ? '👑 クラブ名誉の殿堂 (ダイヤモンドティアランキング)' : '👑 클럽 명예의 전당 (다이아몬드 티어 랭킹)'}</span>
                    </div>
                    <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                      {isJapanese
                        ? 'クラブ会員の累計完走回数に基づき、ゴールデン、ピンク、ブルーの各ダイヤモンドティア順に公式表彰されます。'
                        : '소속 회원들의 누적 9홀 완주 횟수에 따라 골든(500회+), 핑크(100회+), 블루(30회+) 명예의 전당에 영구 등재됩니다.'}
                    </p>
                  </div>

                  {(() => {
                    const diamondRankings = ClubStorage.getClubDiamondRankings(selectedClubDetail.id);
                    if (diamondRankings.length === 0) {
                      return (
                        <div className="text-center py-8 text-stone-400 font-bold text-xs">
                          {isJapanese ? '登録された会員がいません。' : '등록된 회원이 없습니다.'}
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-2">
                        {diamondRankings.map((dr) => {
                          const medalBadge =
                            dr.rank === 1
                              ? (isJapanese ? '🥇 1位' : '🥇 1위')
                              : dr.rank === 2
                              ? (isJapanese ? '🥈 2位' : '🥈 2위')
                              : dr.rank === 3
                              ? (isJapanese ? '🥉 3位' : '🥉 3위')
                              : `${dr.rank}${isJapanese ? '位' : '위'}`;
                          const isTop3 = dr.rank <= 3;
                          return (
                            <div
                              key={dr.memberId}
                              className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition ${
                                isTop3
                                  ? 'bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 border-amber-300 shadow-2xs'
                                  : 'bg-white border-stone-200 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`text-xs font-black px-2 py-1 rounded-xl shrink-0 ${
                                    dr.rank === 1
                                      ? 'bg-amber-400 text-stone-950 font-black'
                                      : dr.rank === 2
                                      ? 'bg-stone-300 text-stone-900 font-bold'
                                      : dr.rank === 3
                                      ? 'bg-amber-700 text-white font-bold'
                                      : 'bg-stone-100 text-stone-600 font-medium'
                                  }`}
                                >
                                  {medalBadge}
                                </span>
                                <div>
                                  <div className="flex items-center gap-1.5 font-black text-xs text-stone-900">
                                    <span>{dr.memberName}</span>
                                    <span className="text-[10px] font-mono text-stone-400">({dr.memberCode})</span>
                                    {dr.customRoleName ? (
                                      <span className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full font-bold">
                                        {dr.customRoleName}
                                      </span>
                                    ) : dr.role === 'PRESIDENT' ? (
                                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
                                        {isJapanese ? '👑 会長' : '👑 회장'}
                                      </span>
                                    ) : dr.role === 'MANAGER' ? (
                                      <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-bold">
                                        {isJapanese ? '📋 総務' : '📋 총무'}
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="text-[10px] text-stone-500 font-medium mt-0.5">
                                    {isJapanese
                                      ? `計 ${dr.totalCompleted9Holes}回 完走達成 · ${dr.tier.nameJa}`
                                      : `총 ${dr.totalCompleted9Holes}회 완주 달성 · ${dr.tierTitle}`}
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0">
                                <DiamondTierBadge tier={dr.tier} completedCount={dr.totalCompleted9Holes} size="md" enableAura={isTop3} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 탭 3: 클럽 대회 실록 & 명예의 전당 (회원 100% 열람 허용) */}
              {clubDetailTab === 'CHRONICLE' && (
                <div className="space-y-3">
                  {/* 권한 검사: 현재 소속 회원인가? */}
                  {!myClubIds.includes(selectedClubDetail.id) ? (
                    <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-2.5 p-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl">
                        🔒
                      </div>
                      <div className="font-black text-sm text-stone-900">{isJapanese ? 'クラブ会員専用の非公開記録' : '클럽 회원 전용 비밀 실록'}</div>
                      <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
                        {isJapanese ? 'クラブ大会記録および全会員のスコアボードは所属正会員にのみ公開されます。退会会員や非会員は閲覧できませんが、クラブに加入(または再加入)すると過去の全記録をすぐに閲覧できます。' : '클럽 대회 실록 및 전 회원 스코어보드는 현재 소속된 정회원에게만 100% 공개됩니다. 탈퇴 회원이거나 비회원은 열람할 수 없으며, 클럽에 가입(또는 재가입)하시면 과거 모든 기록을 즉시 열람하실 수 있습니다.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClubDetail(null);
                          handleJoinClub(selectedClubDetail);
                        }}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs shadow-xs transition active:scale-95 cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>{isJapanese ? 'クラブ入場 / 復帰申請 ▶' : '클럽 입장 / 복귀 신청 ▶'}</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-[11px] text-amber-950 font-medium leading-relaxed mb-3">
                        {isJapanese ? <>📜 <strong>正会員公式記録:</strong> 当クラブの過去の全大会記録、歴代優勝者および詳細スコアボードを自由に確認できます。</> : <>📜 <strong>정회원 공식 실록:</strong> 우리 클럽의 과거 모든 대회 기록, 역대 우승자 및 상세 스코어보드를 100% 자유롭게 확인하실 수 있습니다.</>}
                      </div>

                      {(() => {
                        const rawChronicles = ClubStorage.getClubChronicles(selectedClubDetail.id);
                        if (rawChronicles.length === 0) {
                          return (
                            <div className="text-center py-6 bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-1.5">
                              <Trophy className="w-7 h-7 text-stone-300 mx-auto" />
                              <div className="text-xs font-black text-stone-700">{isJapanese ? '開催された大会記録がありません。' : '개최된 대회 실록이 없습니다.'}</div>
                              <div className="text-[10px] text-stone-400">{isJapanese ? '新規大会が完了すると公式年代記に永久登録されます。' : '새 대회가 완료되면 공식 연대기에 영구 등재됩니다.'}</div>
                            </div>
                          );
                        }

                        const searchTrimmed = chronicleSearchTerm.trim().toLowerCase();
                        const filteredChronicles = rawChronicles.filter((c) => {
                          if (!searchTrimmed) return true;
                          return (
                            c.title?.toLowerCase().includes(searchTrimmed) ||
                            c.courseName?.toLowerCase().includes(searchTrimmed) ||
                            c.winnerName?.toLowerCase().includes(searchTrimmed) ||
                            c.medalistName?.toLowerCase().includes(searchTrimmed) ||
                            c.runnerUpName?.toLowerCase().includes(searchTrimmed) ||
                            c.rankings?.some((r) => r.playerName?.toLowerCase().includes(searchTrimmed))
                          );
                        });

                        // 월별 그룹화 (최신순)
                        const groupedByMonth: { [key: string]: typeof filteredChronicles } = {};
                        filteredChronicles.forEach((chr) => {
                          const clean = chr.heldAt.replace(/[^0-9]/g, '');
                          const key = clean.length >= 6
                            ? (isJapanese ? `${clean.slice(0, 4)}年 ${parseInt(clean.slice(4, 6), 10)}月` : `${clean.slice(0, 4)}년 ${parseInt(clean.slice(4, 6), 10)}월`)
                            : (isJapanese ? 'その他/未分類' : '기타/미분류');
                          if (!groupedByMonth[key]) groupedByMonth[key] = [];
                          groupedByMonth[key].push(chr);
                        });
                        const monthKeys = Object.keys(groupedByMonth);

                        return (
                          <div className="space-y-3">
                            {/* 🔍 연대기 실록 검색창 및 아코디언 일괄 제어 */}
                            <div className="bg-stone-50 border border-stone-200 rounded-xl p-2 flex flex-col sm:flex-row items-center gap-2">
                              <div className="relative flex-1 w-full">
                                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  value={chronicleSearchTerm}
                                  onChange={(e) => setChronicleSearchTerm(e.target.value)}
                                  placeholder={isJapanese ? '大会名、ゴルフ場、優勝者/選手名で検索...' : '대회명, 골프장, 우승자/선수명 검색...'}
                                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                                {chronicleSearchTerm && (
                                  <button
                                    type="button"
                                    onClick={() => setChronicleSearchTerm('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-black p-0.5"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end text-xs font-bold">
                                <span className="text-stone-500 font-bold shrink-0">{isJapanese ? `計 ${filteredChronicles.length}回` : `총 ${filteredChronicles.length}회`}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const allOpen: Record<string, boolean> = {};
                                      monthKeys.forEach((k) => (allOpen[k] = false));
                                      setCollapsedMonths(allOpen);
                                    }}
                                    className="px-2.5 py-1.5 min-h-[32px] bg-white hover:bg-stone-100 active:bg-stone-200 border border-stone-200 rounded-lg text-stone-700 transition cursor-pointer text-xs font-bold"
                                  >
                                    {isJapanese ? '全展開' : '전체 펼치기'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const allClosed: Record<string, boolean> = {};
                                      monthKeys.forEach((k) => (allClosed[k] = true));
                                      setCollapsedMonths(allClosed);
                                    }}
                                    className="px-2.5 py-1.5 min-h-[32px] bg-white hover:bg-stone-100 active:bg-stone-200 border border-stone-200 rounded-lg text-stone-700 transition cursor-pointer text-xs font-bold"
                                  >
                                    {isJapanese ? '全折りたたみ' : '전체 접기'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {filteredChronicles.length === 0 ? (
                              <div className="text-center py-6 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                                <div className="text-xs font-bold text-stone-600">{isJapanese ? '検索条件に一致する大会がありません。' : '검색 조건에 맞는 대회가 없습니다.'}</div>
                                <button
                                  type="button"
                                  onClick={() => setChronicleSearchTerm('')}
                                  className="text-[11px] text-amber-700 font-bold underline cursor-pointer"
                                >
                                  {isJapanese ? '検索条件クリア' : '검색어 초기화'}
                                </button>
                              </div>
                            ) : (
                              monthKeys.map((monthKey) => {
                                const list = groupedByMonth[monthKey];
                                const isCollapsed = collapsedMonths[monthKey] === true;
                                return (
                                  <div key={monthKey} className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                                    {/* 월별 아코디언 헤더 */}
                                    <button
                                      type="button"
                                      onClick={() => setCollapsedMonths((prev) => ({ ...prev, [monthKey]: !isCollapsed }))}
                                      className="w-full px-3 py-2.5 min-h-[44px] bg-gradient-to-r from-stone-100 via-stone-50 to-amber-50/40 hover:bg-stone-100 active:bg-amber-100/50 flex items-center justify-between border-b border-stone-200 transition cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-black text-xs text-stone-900 flex items-center gap-1">
                                          📅 {monthKey}
                                        </span>
                                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                                          {isJapanese ? `${list.length}回 大会` : `${list.length}회 대회`}
                                        </span>
                                      </div>
                                      <span className="text-xs font-bold text-stone-500">
                                        {isCollapsed ? (isJapanese ? '展開 ▼' : '펼치기 ▼') : (isJapanese ? '折りたたみ ▲' : '접기 ▲')}
                                      </span>
                                    </button>

                                    {/* 대회 목록 (아코디언 본문) */}
                                    {!isCollapsed && (
                                      <div className="p-2 space-y-2.5 bg-stone-50/30">
                                        {list.map((chr) => {
                                          const isExpanded = expandedChronicleId === chr.id;
                                          return (
                                            <div
                                              key={chr.id}
                                              className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden"
                                            >
                                              <div className="p-3 space-y-2 bg-gradient-to-r from-stone-50 to-amber-50/20">
                                                <div className="flex items-start justify-between gap-1">
                                                  <div>
                                                    <div className="flex items-center gap-1 flex-wrap">
                                                      <span className="bg-purple-100 text-purple-900 border border-purple-200 text-[9px] font-black px-1.5 py-0.2 rounded">
                                                        {chr.gameMode || (isJapanese ? '公式ストローク' : '정규 방식')}
                                                      </span>
                                                      <span className="text-[10px] text-stone-400">📅 {chr.heldAt}</span>
                                                    </div>
                                                    <h5 className="font-black text-xs text-stone-900 mt-1">{chr.title}</h5>
                                                    <div className="text-[10px] text-stone-500">
                                                      📍 {chr.courseName} · {chr.totalHoles}{isJapanese ? 'ホール' : '홀'} · {chr.totalParticipants}{isJapanese ? '名参加' : '명 참가'}
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* 👑 우승자 명예의 전당 */}
                                                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                                                  <div className="bg-amber-100/80 border border-amber-300 rounded-xl p-1.5 text-center">
                                                    <div className="text-[9px] font-black text-amber-900">{isJapanese ? '👑 1位 優勝' : '👑 1위 우승자'}</div>
                                                    <div className="text-xs font-black text-stone-900">{chr.winnerName}</div>
                                                    <div className="text-[9px] text-amber-800 font-bold">{chr.winnerScore > 0 ? (isJapanese ? `${chr.winnerScore}打` : `${chr.winnerScore}타`) : ''}</div>
                                                  </div>

                                                  {chr.medalistName ? (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-1.5 text-center">
                                                      <div className="text-[9px] font-black text-blue-900">{isJapanese ? '🏅 メダリスト' : '🏅 메달리스트'}</div>
                                                      <div className="text-xs font-black text-stone-900">{chr.medalistName}</div>
                                                      <div className="text-[9px] text-blue-700 font-bold">{chr.medalistScore ? (isJapanese ? `${chr.medalistScore}打` : `${chr.medalistScore}타`) : ''}</div>
                                                    </div>
                                                  ) : chr.runnerUpName ? (
                                                    <div className="bg-stone-100 border border-stone-300 rounded-xl p-1.5 text-center">
                                                      <div className="text-[9px] font-black text-stone-700">{isJapanese ? '🥈 準優勝' : '🥈 준우승'}</div>
                                                      <div className="text-xs font-black text-stone-900">{chr.runnerUpName}</div>
                                                      <div className="text-[9px] text-stone-500 font-bold">{chr.runnerUpScore ? (isJapanese ? `${chr.runnerUpScore}打` : `${chr.runnerUpScore}타`) : ''}</div>
                                                    </div>
                                                  ) : null}
                                                </div>

                                                {/* 3위 / 롱기스트 / 니어핀 서브 배지 */}
                                                {(chr.thirdPlaceName || chr.longestName || chr.nearPinName) && (
                                                  <div className="grid grid-cols-3 gap-1 pt-0.5 text-center text-[9px] font-bold">
                                                    {chr.thirdPlaceName && (
                                                      <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-1">
                                                        <span className="text-amber-800">{isJapanese ? '🥉 3位:' : '🥉 3위:'}</span> <strong className="text-stone-900">{chr.thirdPlaceName}</strong>
                                                      </div>
                                                    )}
                                                    {chr.longestName && (
                                                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-1">
                                                        <span className="text-emerald-800">{isJapanese ? '🚀 ドラコン:' : '🚀 롱기:'}</span> <strong className="text-stone-900">{chr.longestName}</strong>
                                                      </div>
                                                    )}
                                                    {chr.nearPinName && (
                                                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-1">
                                                        <span className="text-pink-800">{isJapanese ? '🎯 ニアピン:' : '🎯 니어:'}</span> <strong className="text-stone-900">{chr.nearPinName}</strong>
                                                      </div>
                                                    )}
                                                  </div>
                                                )}

                                                {/* 📸 [3단계] 단체 기념사진 (워터마크 각인) 표출 또는 즉석 업로드 */}
                                                {chr.groupPhotoUrl ? (
                                                  <div className="relative rounded-xl overflow-hidden border-2 border-amber-300 shadow-2xs mt-1">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                      src={chr.groupPhotoUrl}
                                                      alt={isJapanese ? '大会団体記念写真' : '대회 단체 기념사진'}
                                                      className="w-full h-auto object-cover max-h-56"
                                                    />
                                                    <div className="bg-stone-900/80 text-amber-200 text-[10px] font-black px-2.5 py-1 flex items-center justify-between">
                                                      <span>{isJapanese ? '📸 公式団体記念写真' : '📸 공식 단체 기념사진'}</span>
                                                      <span className="text-[9px] text-amber-300">{isJapanese ? 'パークゴルフ オールインワン 公式実録' : '파크골프 올인원 공식 실록'}</span>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <label className="w-full py-1.5 bg-amber-50/80 hover:bg-amber-100 border border-amber-200 border-dashed rounded-xl text-[10px] font-black text-amber-900 flex items-center justify-center gap-1 transition cursor-pointer mt-1">
                                                    <span>{isJapanese ? '📸 団体記念写真の登録 (公式透かし自動刻印)' : '📸 단체 기념사진 등록 (골드 워터마크 자동 각인)'}</span>
                                                    <input
                                                      type="file"
                                                      accept="image/*"
                                                      className="hidden"
                                                      onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        const compressed = await ClubStorage.compressAndWatermarkPhoto(
                                                          file,
                                                          `${selectedClubDetail.name} ${chr.title}`
                                                        );
                                                        if (compressed) {
                                                          chr.groupPhotoUrl = compressed;
                                                          const allChr = ClubStorage.getAllGlobalChronicles();
                                                          const target = allChr.find((c) => c.id === chr.id);
                                                          if (target) target.groupPhotoUrl = compressed;
                                                          localStorage.setItem('parkon_club_chronicles_v1', JSON.stringify(allChr));
                                                          setToastMessage('📸 단체 기념사진이 워터마크 각인되어 영구 아카이빙되었습니다!');
                                                          setClubDetailTab('CHRONICLE');
                                                        }
                                                      }}
                                                    />
                                                  </label>
                                                )}

                                                <button
                                                  type="button"
                                                  onClick={() => setExpandedChronicleId(isExpanded ? null : chr.id)}
                                                  className="w-full py-1.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-[10px] font-black text-purple-700 flex items-center justify-center gap-1 transition cursor-pointer"
                                                >
                                                  <span>{isExpanded ? (isJapanese ? '順位表を閉じる ▲' : '전체 순위 닫기 ▲') : (isJapanese ? '📋 参加者全順位＆スコアを見る ▼' : '📋 참가자 전체 순위 & 스코어보기 ▼')}</span>
                                                </button>
                                              </div>

                                              {isExpanded && (
                                                <div className="p-3 border-t border-stone-200 bg-stone-50/50 space-y-1.5 animate-fadeIn">
                                                  <div className="text-[11px] font-black text-stone-800 flex items-center justify-between">
                                                    <span>{isJapanese ? `大会公式全順位 (${chr.rankings.length}名)` : `대회 공식 전체 순위 (${chr.rankings.length}명)`}</span>
                                                    <span className="text-[9px] text-stone-400">{isJapanese ? '永久保存' : '영구 보존'}</span>
                                                  </div>

                                                  <div className="space-y-1">
                                                    {chr.rankings.map((r) => (
                                                      <div
                                                        key={r.playerId}
                                                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs gap-2 ${
                                                          r.rank === 1
                                                            ? 'bg-amber-50 border-amber-300 font-black'
                                                            : r.rank === 2
                                                            ? 'bg-stone-100 border-stone-300 font-bold'
                                                            : 'bg-white border-stone-200'
                                                        }`}
                                                      >
                                                        <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                                                          <span className={`w-5 shrink-0 text-center text-[10px] font-black ${
                                                            r.rank === 1 ? 'text-amber-700' : 'text-stone-500'
                                                          }`}>
                                                            {r.rank}{isJapanese ? '位' : '위'}
                                                          </span>
                                                          <span className="font-black text-stone-900 break-words">{r.playerName}</span>
                                                          <span className="text-[10px] text-stone-400 shrink-0">({r.groupNumber}{isJapanese ? '組' : '조'})</span>
                                                          {r.awards && r.awards.length > 0 && (
                                                            <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold shrink-0">
                                                              {r.awards[0]}
                                                            </span>
                                                          )}
                                                        </div>

                                                        <div className="flex items-center gap-1.5 shrink-0 text-right">
                                                          {r.handicap !== undefined && (
                                                            <span className="text-[10px] text-stone-400">HDCP {r.handicap}</span>
                                                          )}
                                                          <span className="font-black text-purple-800 text-sm">{r.totalStrokes}{isJapanese ? '打' : '타'}</span>
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-stone-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedClubDetail;
                    setSelectedClubDetail(null);
                    setClubSettingModal(c);
                  }}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition"
                  title={isJapanese ? 'クラブ設定および環境管理' : '클럽 설정 및 환경 관리'}
                >
                  <Settings className="w-3.5 h-3.5 text-stone-500" />
                  <span>{isJapanese ? '⚙️ クラブ設定' : '⚙️ 클럽 설정'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClubDetail(null)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 font-black rounded-xl cursor-pointer"
                >
                  {isJapanese ? '閉じる' : '닫기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: 클럽 환경 설정표 모달 (톱니바퀴 모양 누르면 열림) */}
      {/* ========================================================================= */}
      {clubSettingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            {/* 상단 헤더 */}
            <div className="bg-gradient-to-r from-stone-800 to-stone-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-stone-700/80 border border-stone-600 flex items-center justify-center text-sm shadow-inner">
                  ⚙️
                </span>
                <div>
                  <h3 className="font-black text-base">{isJapanese ? 'クラブ環境設定' : '클럽 환경 설정'}</h3>
                  <p className="text-[11px] text-stone-300 font-medium">
                    {clubSettingModal.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClubSettingModal(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-stone-800">
              {/* 1. 클럽 제원 및 기본 정보 표 */}
              <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-2.5">
                <div className="text-xs font-black text-stone-900 flex items-center gap-1.5 border-b border-stone-200 pb-2">
                  <span>📋</span>
                  <span>{isJapanese ? 'クラブ基本情報表' : '클럽 기본 제원 표'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-white border border-stone-200/80">
                    <span className="text-stone-400 font-bold block text-[10px]">{isJapanese ? '所属クラブ' : '소속 클럽'}</span>
                    <span className="font-black text-stone-800 truncate block">{clubSettingModal.name}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-stone-200/80">
                    <span className="text-stone-400 font-bold block text-[10px]">{isJapanese ? 'ホームコース' : '홈 구장'}</span>
                    <span className="font-black text-stone-800 truncate block">{clubSettingModal.homeCourseName}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-stone-200/80">
                    <span className="text-stone-400 font-bold block text-[10px]">{isJapanese ? '会長 / 総務' : '회장 / 총무'}</span>
                    <span className="font-bold text-stone-700 truncate block">
                      {clubSettingModal.presidentName || (isJapanese ? '未指定' : '미지정')} / {clubSettingModal.managerName || (isJapanese ? '未指定' : '미지정')}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-stone-200/80">
                    <span className="text-stone-400 font-bold block text-[10px]">{isJapanese ? '登録会員' : '등록 회원'}</span>
                    <span className="font-black text-emerald-700 block">{clubSettingModal.memberCount}{isJapanese ? '名' : '명'}</span>
                  </div>
                </div>
              </div>

              {/* 2. 클럽 알림 및 기능 설정표 */}
              <div className="bg-white rounded-2xl p-3.5 border border-stone-200 space-y-3">
                <div className="text-xs font-black text-stone-900 flex items-center gap-1.5 border-b border-stone-200 pb-2">
                  <Bell className="w-3.5 h-3.5 text-stone-600" />
                  <span>{isJapanese ? '通知および便利機能' : '알림 및 편의 기능'}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div>
                    <div className="font-bold text-stone-900">{isJapanese ? 'クラブ告知＆招集マッチ通知' : '클럽 공지 및 번개 라운드 알림'}</div>
                    <div className="text-[11px] text-stone-500">{isJapanese ? '会員募集、月例会通知を受信' : '회원 모집, 월례회 알림 수신'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClubNoticeAlertEnabled(!clubNoticeAlertEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors cursor-pointer p-0.5 flex items-center ${
                      clubNoticeAlertEnabled ? 'bg-emerald-600 justify-end' : 'bg-stone-300 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <div className="flex items-center justify-between py-1 border-t border-stone-100">
                  <div>
                    <div className="font-bold text-stone-900">{isJapanese ? '同伴者リアルタイムスコア同期' : '동반자 실시간 스코어 동기화'}</div>
                    <div className="text-[11px] text-stone-500">{isJapanese ? 'ラウンド時にスコアボードを自動連動' : '라운드 시 스코어보드 자동 연동'}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClubRealtimeSyncEnabled(!clubRealtimeSyncEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors cursor-pointer p-0.5 flex items-center ${
                      clubRealtimeSyncEnabled ? 'bg-emerald-600 justify-end' : 'bg-stone-300 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>

              {/* 3. 위험 구역: 클럽 회원 관리 (탈퇴) */}
              <div className="bg-rose-50/70 rounded-2xl p-3.5 border border-rose-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-rose-800 font-black text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{isJapanese ? '会員管理およびクラブ退会' : '회원 관리 및 클럽 탈퇴'}</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed font-medium">
                  {isJapanese ? 'クラブを退会すると所属クラブ一覧から除外され、活動履歴および対抗戦の参加資格が初期化されます。誤って退会しないようご注意ください。' : '클럽에서 탈퇴하시면 내 소속 클럽 목록에서 제외되며, 회원 활동 내역 및 클럽 대항전 참가 자격이 초기화됩니다. 실수로 탈퇴되지 않도록 주의해 주세요.'}
                </p>
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmLeaveTarget(clubSettingModal)}
                    className="px-3.5 py-2 bg-white hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 hover:border-rose-600 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-2xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isJapanese ? 'クラブを退会する' : '클럽 탈퇴하기'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setClubSettingModal(null)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-black rounded-xl text-xs cursor-pointer"
              >
                {isJapanese ? '閉じる' : '닫기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: 클럽 탈퇴 2중 안전 확인 팝업 (확인 눌러야만 탈퇴 진행) */}
      {/* ========================================================================= */}
      {confirmLeaveTarget && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border-2 border-rose-500 overflow-hidden text-center p-5 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-2xl shadow-inner">
              🚪
            </div>

            <div className="space-y-1.5">
              <h3 className="font-black text-base text-stone-900">{isJapanese ? 'クラブ退会 最終確認' : '클럽 탈퇴 최종 확인'}</h3>
              <p className="text-xs text-stone-700 font-bold">
                {isJapanese ? <>本当に「<span className="text-rose-600 font-black">{confirmLeaveTarget.name}</span>」から退会しますか？</> : <>정말로 &lsquo;<span className="text-rose-600 font-black">{confirmLeaveTarget.name}</span>&rsquo;에서 탈퇴하시겠습니까?</>}
              </p>
            </div>

            <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-left text-[11px] text-stone-600 space-y-1.5 font-medium">
              <div className="text-rose-700 font-black">{isJapanese ? '⚠️ 退会時の注意事項:' : '⚠️ 탈퇴 시 유의사항:'}</div>
              <div>{isJapanese ? '• 所属クラブ一覧から除外され、クラブ内記録へのアクセス権限が停止されます。' : '• 내 소속 클럽 목록에서 즉시 제외되며 클럽 내부 실록 접근 권한이 정지됩니다.'}</div>
              <div>{isJapanese ? '• 保有中のクラブ役職(会長/総務/役員)が自動返納されます。' : '• 보유 중인 클럽 직책(회장/총무/임원)이 자동 반납됩니다.'}</div>
              <div className="pt-1.5 border-t border-stone-200 text-emerald-800 font-bold flex items-start gap-1 leading-snug">
                <span className="shrink-0 text-sm">🛡️</span>
                <span>
                  {isJapanese ? <><strong>永久履歴保存および復帰保証:</strong> 退会時、会員情報は一般リストから非表示になりますが、初回加入日・過去の大会出場記録および受賞履歴は「アーカイブ」に安全に保管されます。再加入時にすべての過去記録が100%復旧されます。</> : <><strong>영구 이력 보존 및 복귀 보장:</strong> 탈퇴 즉시 회원님의 정보는 일반 목록에서 비밀 처리되지만, 최초 가입일·과거 대회 출전 기록 및 수상 훈장은 &lsquo;비밀 보관소&rsquo;에 안전 암호 보존됩니다. 언제든 다시 복귀하시면 모든 과거 기록이 100% 원상 복원됩니다.</>}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmLeaveTarget(null)}
                className="py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black rounded-xl text-xs cursor-pointer transition active:scale-95"
              >
                {isJapanese ? 'キャンセル (所属維持)' : '취소 (클럽 유지)'}
              </button>
              <button
                type="button"
                onClick={() => handleExecuteLeaveClub(confirmLeaveTarget)}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs cursor-pointer transition active:scale-95 shadow-md flex items-center justify-center gap-1"
              >
                <span>{isJapanese ? '確認 (退会確定)' : '확인 (탈퇴 확정)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: 클럽 모임 개최 선택 모달 (정기전 / 월례회 / 번개치기) */}
      {/* ========================================================================= */}
      {clubGatheringModal && (() => {
        const c = clubGatheringModal;
        const selfName = ParkOnStorage.getUserDisplayName(c.id);
        const activeClubFlash = flashGatherings.filter((f) => f.clubId === c.id && f.status !== 'CLOSED');
        const activeClubRooms = rooms.filter((r) => r.clubId === c.id && r.status !== 'FINISHED');
        const totalActiveCount = activeClubFlash.length + activeClubRooms.length;

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-xl shadow-inner">
                    ⛳
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base sm:text-lg tracking-tight">{isJapanese ? 'クラブ集会・定期戦統括' : '클럽 모임 · 정기전 관제'}</h3>
                      <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-full">
                        {c.name}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-200/90 mt-0.5">
                      {isJapanese ? '現在募集・進行中の集会状況および新規集会開設' : '현재 모집·진행 중인 모임 현황 및 새 모임 개설'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setClubGatheringModal(null)}
                  className="text-stone-300 hover:text-white p-2 rounded-xl hover:bg-emerald-700/50 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
                {/* ------------------------------------------------------------- */}
                {/* 1. [최우선 상단 배치] 우리 클럽 전용 새 모임 개설 (번개치기 & 대회 개최) */}
                {/* ------------------------------------------------------------- */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-stone-900 flex items-center gap-1.5">
                      <span className="text-emerald-700">✨</span>
                      <span>{isJapanese ? '当クラブ専用 新規集会開設' : '우리 클럽 전용 새 모임 개설'}</span>
                    </h4>
                    <span className="text-[11px] text-stone-500 font-bold">{isJapanese ? 'ワンタッチ主催' : '1초 원터치 주최'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* [ ⚡ 클럽 번개치기 ] */}
                    <button
                      type="button"
                      onClick={() => {
                        setClubGatheringModal(null);
                        setSelectedFlashClubId(c.id);
                        setClubFlashCourseId(c.homeCourseId);
                        setClubFlashTitle(`[${c.name}] 오늘 당일 번개 라운드 ⚡`);
                        setClubFlashLightningScope('MULTI_OPEN');
                        setShowCreateClubFlashModal(true);
                      }}
                      className="py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-stone-950 font-black text-xs sm:text-sm text-center transition cursor-pointer shadow-xs flex items-center justify-center gap-1 border border-amber-600/30 whitespace-nowrap"
                    >
                      <span>⚡</span>
                      <span>{isJapanese ? '招集マッチを開設' : '클럽 번개치기'}</span>
                    </button>

                    {/* [ 🏆 대회 개최하기 (월례회 등) ] - 총무/임원진 전용 권한 제어 */}
                    {(() => {
                      const isExec = isClubExecutive(c);
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (!isExec) {
                              showToast(isJapanese ? `🔒 大会開設は「${c.name}」総務および役員専用の権限です。一般会員は開設済み大会への参加のみ可能です。` : `🔒 대회 개설은 '${c.name}' 총무 및 임원진 전용 권한입니다. 일반 회원은 개설된 대회 참가만 가능합니다.`);
                              return;
                            }
                            setClubGatheringModal(null);
                            setTournamentClubId(c.id);
                            setTitle(isJapanese ? `[${c.name}] 第${new Date().getMonth() + 1}回 定期月例会 ⛳` : `[${c.name}] 제${new Date().getMonth() + 1}회 정기 월례회 ⛳`);
                            setSelectedCourseId(c.homeCourseId);
                            setHostName(c.managerName || c.presidentName || '총무');
                            setTournamentType('CLUB_INTERNAL');
                            setCreateModalSource('CLUB_GATHERING');
                            setShowCreateModal(true);
                          }}
                          className={`py-2.5 sm:py-3 px-1.5 sm:px-3 rounded-xl active:scale-98 font-black text-[11px] sm:text-xs md:text-sm text-center transition cursor-pointer shadow-xs flex items-center justify-center gap-1 border whitespace-nowrap ${
                            isExec
                              ? 'bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white border-emerald-600/30'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-500 border-stone-300'
                          }`}
                          title={isExec ? '클럽 정기 월례회 및 자체 대회 개설' : '대회 개설은 총무 및 임원진 전용 권한입니다.'}
                        >
                          <span>{isExec ? '🏆' : '🔒'}</span>
                          <span>{isExec ? (isJapanese ? '大会を開催する (月例会等)' : '대회 개최하기 (월례회 등)') : (isJapanese ? '大会開催 (総務専用)' : '대회 개최 (총무 전용)')}</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* 2. [🔥 현재 모집/진행 중인 클럽 모임 (N건)] */}
                {/* ------------------------------------------------------------- */}
                <div className="space-y-3 pt-3 border-t border-stone-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-stone-900 flex items-center gap-1.5">
                      <span className="text-rose-500">🔥</span>
                      <span>{isJapanese ? '現在募集・進行中のクラブ集会' : '현재 모집 · 진행 중인 클럽 모임'}</span>
                      <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold">
                        {totalActiveCount}{isJapanese ? '件' : '건'}
                      </span>
                    </h4>
                    {totalActiveCount > 0 && (
                      <span className="text-[11px] text-stone-400">{isJapanese ? 'ワンタッチ参加＆スコアボード連動' : '원터치 참여 & 스코어보드 연동'}</span>
                    )}
                  </div>

                  {totalActiveCount === 0 ? (
                    /* 빈 상태 안내 배너 */
                    <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-1.5">
                      <p className="text-sm font-bold text-stone-700">
                        {isJapanese ? '⚡ 現在募集中のマッチや進行中の定期戦はありません。' : '⚡ 현재 모집 중인 번개나 진행 중인 정기전이 없습니다.'}
                      </p>
                      <p className="text-xs text-stone-500">
                        {isJapanese ? <>上の<strong className="text-amber-600">[招集マッチを開設]</strong>または<strong className="text-emerald-700">[大会を開催する]</strong>を押して、最初の集会を開設してみましょう！</> : <>위 <strong className="text-amber-600">[번개치기 개설]</strong> 또는 <strong className="text-emerald-700">[대회 개최하기]</strong> 버튼을 눌러 오늘 첫 모임을 개설해 보세요!</>}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* 번개 라운드 목록 */}
                      {activeClubFlash.map((flash) => {
                        const isJoined = flash.currentParticipants.some((p) => p.name === selfName);
                        const isHost = flash.hostName === selfName;
                        const pCount = flash.currentParticipants.length;
                        const maxCount = flash.targetCount === 999 ? (isJapanese ? '無制限' : '무제한') : `${flash.targetCount}${isJapanese ? '名' : '명'}`;
                        const canStart = pCount >= 2;

                        return (
                          <div
                            key={flash.id}
                            className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 shadow-xs space-y-3 hover:border-amber-400 transition"
                          >
                            {/* 1. 상단: 제목 [번개 모집 중] 및 우측 상태 배지 */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-base shadow-xs shrink-0">
                                  ⚡
                                </span>
                                <div>
                                  <h4 className="font-black text-base text-stone-950 tracking-tight">
                                    {isJapanese ? 'マッチ募集中' : '번개 모집 중'}
                                  </h4>
                                  <p className="text-[11px] text-amber-900/80 font-bold">
                                    {flash.title || `[${c.name}] 오늘 당일 번개 라운드`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {canStart ? (
                                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-600 text-white shadow-xs animate-pulse">
                                    {isJapanese ? `🟢 2名以上スタート可能！ (${pCount}/${maxCount})` : `🟢 2인 이상 출발 가능! (${pCount}/${maxCount})`}
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-500 text-stone-950 shadow-xs">
                                    🟡 {flash.targetCount === 999 ? (isJapanese ? '募集中' : '모집 중') : (isJapanese ? `${Math.max(0, flash.targetCount - pCount)}名募集中` : `${Math.max(0, flash.targetCount - pCount)}명 모집 중`)} ({pCount}/${maxCount})
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 2. 핵심 제원: 장소 & 시간 */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/90 p-2.5 rounded-xl border border-amber-200 text-xs shadow-2xs">
                              <div className="flex items-center gap-1.5">
                                <span className="text-amber-800 font-black shrink-0">{isJapanese ? '📍 場所:' : '📍 장소:'}</span>
                                <span className="text-stone-900 font-black truncate">{flash.courseName}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-amber-800 font-black shrink-0">{isJapanese ? '⏰ 時間:' : '⏰ 시간:'}</span>
                                <span className="text-stone-900 font-black">
                                  {formatKoreanPlayTime(flash.playTime)} ({flash.playDate})
                                </span>
                              </div>
                            </div>

                            {/* 3. 모임 메모 */}
                            {flash.notes && (
                              <div className="text-[11px] text-stone-600 bg-amber-100/50 px-2.5 py-1.5 rounded-lg border border-amber-200/60 flex items-center gap-1.5">
                                <span className="shrink-0">💬</span>
                                <span>{flash.notes}</span>
                              </div>
                            )}

                            {/* 참가자 명단 표출 */}
                            <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200/80 text-xs text-stone-700 flex flex-wrap items-center gap-2">
                              <span className="font-black text-amber-900 shrink-0">{isJapanese ? '👥 参加者:' : '👥 참가자:'}</span>
                              <div className="flex flex-wrap items-center gap-1.5 font-bold">
                                {flash.currentParticipants.map((p, idx) => (
                                  <span
                                    key={p.id || idx}
                                    className={`px-2 py-0.5 rounded-lg text-xs ${
                                      p.name === flash.hostName
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-black'
                                        : 'bg-stone-100 text-stone-800'
                                    }`}
                                  >
                                    {p.name === flash.hostName ? `👑 ${p.name}(${isJapanese ? 'リーダー' : '방장'})` : p.name}
                                  </span>
                                ))}
                                {flash.waitingList && flash.waitingList.length > 0 && (
                                  <span className="text-stone-400 text-[11px]">
                                    ({isJapanese ? '待ち' : '대기'} {flash.waitingList.length}{isJapanese ? '名' : '명'})
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 원터치 액션 버튼 바 */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                              {/* 1. 회원용: 나도 번개 참여하기 / 취소 */}
                              {isJoined ? (
                                <button
                                  type="button"
                                  onClick={() => handleLeaveClubFlash(flash.id)}
                                  className="py-2.5 px-3 bg-stone-200 hover:bg-stone-300 active:scale-95 text-stone-700 font-bold text-xs rounded-xl transition cursor-pointer text-center"
                                >
                                  {isJapanese ? '✕ マッチ参加取消' : '✕ 번개 참여 취소'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleJoinClubFlash(flash.id)}
                                  className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-stone-950 font-black text-xs rounded-xl shadow-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                                >
                                  <span>✋</span>
                                  <span>{isJapanese ? '参加する' : '나도 번개 참여하기'}</span>
                                </button>
                              )}

                              {/* 2. 방장/참가자용: 경기 시작하기 */}
                              <button
                                type="button"
                                onClick={() => {
                                  setClubGatheringModal(null);
                                  handleStartClubFlashRound(flash);
                                }}
                                className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                              >
                                <span>🏌️</span>
                                <span>{isJapanese ? '競技をスタートする' : '경기 시작하기'}</span>
                              </button>

                              {/* 3. 카톡 단톡방 공유 */}
                              <button
                                type="button"
                                onClick={() => handleShareClubFlashKakao(flash)}
                                className="py-2.5 px-3 bg-yellow-400 hover:bg-yellow-500 active:scale-95 text-stone-950 font-black text-xs rounded-xl shadow-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                                title={isJapanese ? 'クラブLINEグループに招待状を即時共有' : '클럽 단톡방에 번개 초대장 즉시 공유'}
                              >
                                <span>📢</span>
                                <span>{isJapanese ? 'LINEグループ共有' : '카톡 단톡방 공유'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* 클럽 공식 대회 / 월례회 목록 */}
                      {activeClubRooms.map((room) => {
                        const totalPlayers = room.groups.reduce((acc, g) => acc + g.players.length, 0);

                        return (
                          <div
                            key={room.id}
                            className="p-4 rounded-2xl bg-emerald-50/80 border-2 border-emerald-300 shadow-xs space-y-3 hover:border-emerald-400 transition"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">🏆</span>
                                <span className="font-black text-sm text-emerald-950">
                                  {room.title}
                                </span>
                              </div>
                              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-700 text-white shadow-xs">
                                {isJapanese ? `18ホール月例会 · ${room.groups.length}組 (${totalPlayers}名)` : `18홀 월례회 · ${room.groups.length}개 조 (${totalPlayers}명)`}
                              </span>
                            </div>

                            <p className="text-xs text-stone-600 font-medium">
                              {isJapanese ? 'コース:' : '구장:'} <strong className="text-stone-800">{room.courseName}</strong> | {isJapanese ? '主催:' : '주최:'} {room.hostName}
                            </p>

                            <div className="flex justify-end gap-2 pt-1">
                              <Link
                                href={`/club/${room.id}`}
                                onClick={() => setClubGatheringModal(null)}
                                className="py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                              >
                                <span>📊</span>
                                <span>{isJapanese ? 'リアルタイム大会ルームに入場 (電光掲示板)' : '실시간 대회 룸 입장 (전광판)'}</span>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setClubGatheringModal(null)}
                  className="px-5 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-black rounded-xl text-xs cursor-pointer active:scale-95 transition"
                >
                  {isJapanese ? '閉じる' : '닫기'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 4: 새 대회 개설 모달 (주최 클럽 선택 + A-B-C-D 4열 + +/- 오르내림 스테퍼) */}
      {/* ========================================================================= */}
      {showCreateModal && (() => {
        const handleCloseCreateModal = () => {
          setShowCreateModal(false);
          if (createModalSource === 'MANAGING_CLUB' && tournamentClubId) {
            const cl = clubs.find((c) => c.id === tournamentClubId);
            if (cl) setManagingClub(cl);
          } else if (createModalSource === 'CLUB_GATHERING' && tournamentClubId) {
            const cl = clubs.find((c) => c.id === tournamentClubId);
            if (cl) setClubGatheringModal(cl);
          }
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
              <div className={`text-white p-4 flex items-center justify-between ${
                tournamentType === 'CLUB_MATCH'
                  ? 'bg-gradient-to-r from-purple-800 to-indigo-900'
                  : tournamentType === 'REGIONAL_OPEN'
                  ? 'bg-gradient-to-r from-amber-600 to-stone-900'
                  : 'bg-gradient-to-r from-emerald-800 to-emerald-950'
              }`}>
                <div className="flex items-center gap-2">
                  {tournamentType === 'CLUB_MATCH' ? (
                    <Swords className="w-5 h-5 text-yellow-300" />
                  ) : tournamentType === 'REGIONAL_OPEN' ? (
                    <Trophy className="w-5 h-5 text-yellow-300" />
                  ) : (
                    <Trophy className="w-5 h-5 text-emerald-300" />
                  )}
                  <h3 className="font-extrabold text-base">
                    {tournamentType === 'CLUB_MATCH'
                      ? (isJapanese ? 'クラブ対抗戦 新規開設' : '새 대회 클럽 대항전 개설')
                      : tournamentType === 'REGIONAL_OPEN'
                      ? (isJapanese ? '都道府県公式大会 新規開設' : '새 대회 시·도 공식 대회 개설')
                      : (isJapanese ? 'クラブ定期月例会 新規開設' : '새 대회 클럽 정기 월례회 개설')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            <form onSubmit={handleCreateRoom} className="p-4 space-y-3.5 text-stone-800 max-h-[82vh] overflow-y-auto">
              {/* 클럽 대항전 전용: 매칭 방식, 팀 수, 상대 클럽 선택 (대표님 지시: 중복 선택 제거 후 직결) */}
              {tournamentType === 'CLUB_MATCH' && (
                <div className="space-y-2.5 bg-purple-50 p-3 rounded-2xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5 text-purple-700" />
                      <span>{isJapanese ? 'クラブ対抗戦マッチング設定' : '클럽 대항전 매칭 설정'}</span>
                    </span>
                    <span className="text-[10px] bg-purple-700 text-white font-bold px-2 py-0.5 rounded-full">
                      {isJapanese ? 'クラブ対抗戦モード' : '클럽 대항전 모드'}
                    </span>
                  </div>

                  {/* 1. 초청 및 매칭 방식 (지정 도전장 vs 전국 공개 챌린지) */}
                  <div className="space-y-1 bg-white p-2.5 rounded-xl border border-purple-200">
                    <label className="text-[11px] font-black text-purple-950 flex items-center justify-between">
                      <span>{isJapanese ? '対戦相手の招待・マッチング方式選択' : '상대 초청 및 매칭 방식 선택'}</span>
                      <span className="text-[10px] text-purple-700 font-bold">
                        {matchInviteType === 'DIRECT_CHALLENGE' ? (isJapanese ? `${matchTeamCount}チーム対決` : `${matchTeamCount}개 팀 대결`) : (isJapanese ? '公開募集' : '공개 모집')}
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMatchInviteType('DIRECT_CHALLENGE');
                          updateMatchTitle('DIRECT_CHALLENGE', matchTeamCount, playersPerTeam, participatingClubIds);
                        }}
                        className={`py-2 px-1.5 text-[11px] font-black rounded-lg border transition cursor-pointer flex flex-col items-center justify-center text-center leading-tight ${
                          matchInviteType === 'DIRECT_CHALLENGE'
                            ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                            : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Swords className="w-3.5 h-3.5 text-yellow-300" />
                          <span>{isJapanese ? '相手クラブ直接選択' : '상대 클럽 직접 선택'}</span>
                        </span>
                        <span className="text-[9px] opacity-90 mt-0.5">{isJapanese ? '(特定クラブと直接対決)' : '(특정 클럽 직접 대결)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMatchInviteType('OPEN_CHALLENGE');
                          updateMatchTitle('OPEN_CHALLENGE', matchTeamCount, playersPerTeam, participatingClubIds);
                        }}
                        className={`py-2 px-1.5 text-[11px] font-black rounded-lg border transition cursor-pointer flex flex-col items-center justify-center text-center leading-tight ${
                          matchInviteType === 'OPEN_CHALLENGE'
                            ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                            : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        <span>{isJapanese ? '📢 全国公開チャレンジ' : '📢 전국 공개 챌린지'}</span>
                        <span className="text-[9px] opacity-90 mt-0.5">{isJapanese ? '(挑戦チーム募集告知)' : '(도전팀 모집 공고)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. 대표님 요청: [2개 팀, 3개 팀, 4개 팀] 버튼 제거하고, 안내문만 표출 */}
                  <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-purple-200 text-xs">
                    <span className="font-extrabold text-purple-950 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-700" />
                      <span>{isJapanese ? '対抗戦チーム数現況' : '대항전 팀 수 현황'}</span>
                    </span>
                    <span className="bg-purple-100 text-purple-900 font-black px-2.5 py-1 rounded-md text-[11px]">
                      {matchInviteType === 'DIRECT_CHALLENGE'
                        ? participatingClubIds.length === 0
                          ? (isJapanese ? '計2チーム対決予定 (相手クラブ未選択)' : '총 2개 팀 대결 예정 (상대 클럽 미선택)')
                          : (isJapanese ? `計${matchTeamCount}チーム対決 (自クラブ + 相手${participatingClubIds.length}チーム)` : `총 ${matchTeamCount}개 팀 대결 (우리 클럽 + 상대 ${participatingClubIds.length}팀)`)
                        : (isJapanese ? '計2チーム対決 (1 vs 1 対決)' : '총 2개 팀 대결 (1 vs 1 맞대결)')}
                    </span>
                  </div>

                  {/* 3. 상대 클럽 선택 시: 선택된 상대 클럽 태그 목록 및 [검색/추가] 버튼 */}
                  {matchInviteType === 'DIRECT_CHALLENGE' && (
                    <div className="space-y-2 bg-white p-3 rounded-2xl border border-purple-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                          <Swords className="w-3.5 h-3.5 text-purple-700" />
                          <span>{isJapanese ? '選択された相手クラブ' : '선택된 상대 클럽'} ({participatingClubIds.length}{isJapanese ? '件' : '곳'})</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowOpponentClubPicker(true)}
                          className="px-3 py-1.5 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer border border-purple-600"
                        >
                          <Search className="w-3.5 h-3.5 text-yellow-300" />
                          <span>{isJapanese ? 'クラブ検索・選択 🔍' : '클럽 검색 & 선택 🔍'}</span>
                        </button>
                      </div>

                      {participatingClubIds.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => setShowOpponentClubPicker(true)}
                          className="w-full py-3.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-800 border-2 border-dashed border-purple-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        >
                          <Search className="w-4 h-4 text-purple-600" />
                          <span>{isJapanese ? '🔍 タップして対戦相手クラブを検索・選択 (1〜10チーム自由選択)' : '🔍 터치하여 대결할 상대 클럽을 검색·선택하세요 (1~10팀 자유 선택)'}</span>
                        </button>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {participatingClubIds.map((cId) => {
                            const target = clubs.find((c) => c.id === cId);
                            if (!target) return null;
                            return (
                              <span
                                key={cId}
                                className="inline-flex items-center gap-1.5 bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs"
                              >
                                <span>{target.name}</span>
                                <button
                                  type="button"
                                  onClick={() => toggleOpponentClub(cId)}
                                  className="text-purple-200 hover:text-white font-black text-sm ml-0.5 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </span>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => setShowOpponentClubPicker(true)}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold rounded-xl border border-purple-200 transition cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{isJapanese ? 'クラブ追加選択' : '클럽 추가 선택'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 전국 공개 공지 안내 (공개 챌린지 시에만 표출) */}
                  {matchInviteType === 'OPEN_CHALLENGE' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-950 font-bold space-y-1">
                      <div className="flex items-center gap-1 font-black text-amber-900">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>{isJapanese ? '📢 全国パークゴルフ広場 公開募集告知' : '📢 전국 파크골프 광장 공개 모집 공지'}</span>
                      </div>
                      <p className="text-[11px] text-stone-700 font-medium leading-relaxed">
                        {isJapanese ? (
                          <>ルーム開設時にParkOn全国ラウンジに<strong>「[挑戦チーム募集] 親善交流戦」</strong>告知が自動登録され、他クラブが[挑戦申請]を押し主催者が承認すると対抗戦が成立します！</>
                        ) : (
                          <>방 개설 시 파크골프 올인원 전국 라운지에 <strong>'[도전팀 구함] 친선 교류전'</strong> 공지가 자동 등록되며, 다른 클럽이 [도전 신청]을 누르고 주최자가 승낙하면 대항전이 성립됩니다!</>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 시·도 공식대회 전용: 관할 지역 입력 (대표님 지시: 중복 선택 제거 후 직결) */}
              {tournamentType === 'REGIONAL_OPEN' && (
                <div className="space-y-1.5 bg-amber-50 p-3 rounded-2xl border border-amber-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-700" />
                      <span>{isJapanese ? '都道府県公式大会 管轄地域' : '시·도 공식대회 관할 지역'}</span>
                    </span>
                    <span className="text-[10px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded-full">
                      {isJapanese ? '公式大会モード' : '공식 대회 모드'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={regionalScope}
                    onChange={(e) => setRegionalScope(e.target.value)}
                    placeholder={isJapanese ? '例: 東京都、大阪府、北海道' : '예: 경상북도 구미시, 대구광역시'}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* 주최 클럽 선택 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '主催/代表クラブ選択' : '주최/대표 클럽 선택'}</label>
                <select
                  value={tournamentClubId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setTournamentClubId(cid);
                    const cl = clubs.find((x) => x.id === cid);
                    if (cl) {
                      if (tournamentType === 'CLUB_INTERNAL') setTitle(`${cl.name} ${isJapanese ? '定期月例会' : '정기 월례회'}`);
                      if (cl.homeCourseId) handleCourseChange(cl.homeCourseId);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600"
                >
                  <option value="">{isJapanese ? '協会 / 連合主催 (所属不問)' : '협회 / 연합 주최 (소속 무관)'}</option>
                  {myClubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      🏛️ {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 모임 제목 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '大会 / イベント名 *' : '대회 / 모임 이름 *'}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isJapanese ? '例: 東京パークゴルフクラブ 9月定期月例会' : '예: 구미 동락 파크골프 클럽 9월 정기 월례회'}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              {/* 구장 선택 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '大会コース選択' : '대회 구장 선택'}</label>
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
                    <span>{isJapanese ? '全国コース検索' : '전국 구장 검색'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-stone-50 border border-stone-300 rounded-xl flex items-center justify-between text-xs font-bold text-stone-800">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="truncate">{selectedCourse.name}</span>
                  </span>
                  <span className="text-stone-500 shrink-0">
                    {selectedCourse.region} · {isJapanese ? `計 ${selectedCourse.totalHoles}ホール` : `총 ${selectedCourse.totalHoles}홀`}
                  </span>
                </div>
              </div>

              {/* 참가 인원수 설정: 클럽 대항전(팀당 엔트리 × 팀 수) vs 일반 월례회/시도대회 (대표님 요청) */}
              {tournamentType === 'CLUB_MATCH' ? (
                <div className="space-y-2 bg-purple-50/80 p-3 rounded-2xl border-2 border-purple-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-700" />
                      <span>{isJapanese ? 'クラブごと出場エントリー (1チームあたりの人数)' : '클럽당 출전 엔트리 (팀당 인원)'}</span>
                    </span>
                    <span className="text-purple-800 font-bold text-[11px]">
                      {isJapanese ? '+ / - ボタンまたは直接入力' : '+ / - 버튼 및 숫자 직접 입력'}
                    </span>
                  </div>

                  {/* +/- 오르내림 스테퍼 (자유 조절 & 직접 입력) */}
                  <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlayersPerTeamChange(Math.max(2, playersPerTeam - 1))}
                        className="w-12 h-12 rounded-xl bg-purple-100 hover:bg-purple-200 active:scale-95 text-purple-900 flex items-center justify-center font-black text-2xl border border-purple-300 transition cursor-pointer shadow-xs shrink-0"
                        title={isJapanese ? '1人減らす' : '1명 내림'}
                      >
                        <Minus className="w-6 h-6 stroke-[3]" />
                      </button>

                      <div className="flex-1 flex flex-col items-center justify-center py-1 px-3 bg-purple-50/60 rounded-xl border-2 border-purple-400 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs font-black text-purple-900">{isJapanese ? '1クラブあたり' : '클럽당'}</span>
                          <input
                            type="number"
                            min={2}
                            max={999}
                            value={playersPerTeam}
                            onChange={(e) => handlePlayersPerTeamChange(Number(e.target.value))}
                            className="w-16 text-center text-3xl font-black text-purple-950 bg-transparent focus:outline-none"
                          />
                          <span className="text-base font-black text-purple-800">{isJapanese ? '人' : '명'}</span>
                        </div>
                        <span className="text-[10px] font-bold text-stone-500">
                          {matchTeamCount}{isJapanese ? 'チーム' : '개 팀'} × {playersPerTeam}{isJapanese ? '人' : '명'} = {isJapanese ? '計 ' : '총 '}{matchTeamCount * playersPerTeam}{isJapanese ? '人出場' : '명 출전'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePlayersPerTeamChange(Math.min(999, playersPerTeam + 1))}
                        className="w-12 h-12 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-95 text-white flex items-center justify-center font-black text-2xl border border-purple-800 transition cursor-pointer shadow-md shrink-0"
                        title={isJapanese ? '1人増やす' : '1명 올림'}
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
                    const oppClubs = clubs.filter((c) => participatingClubIds.includes(c.id) && c.id !== hostClub?.id);
                    const oppText = oppClubs.length > 0
                      ? oppClubs.map((c) => c.name).join(', ')
                      : (matchInviteType === 'OPEN_CHALLENGE' ? (isJapanese ? '全国オープン挑戦クラブ' : '전국 오픈 도전자 클럽') : (isJapanese ? '相手クラブ' : '상대 클럽'));

                    return (
                      <div className="bg-gradient-to-br from-white to-purple-50 p-3 rounded-xl border border-purple-300 text-xs font-bold text-stone-800 space-y-1.5">
                        <div className="flex items-center justify-between text-purple-950 font-black border-b border-purple-100 pb-1">
                          <span>{isJapanese ? '🎯 対抗戦マッチング設計要約' : '🎯 대항전 매칭 설계 요약'}</span>
                          <span className="text-purple-700">{isJapanese ? `計 ${opt.groupCount}組 (${totalP}人)` : `총 ${opt.groupCount}개 조 (${totalP}명)`}</span>
                        </div>
                        <div className="text-[11px] text-purple-900 font-extrabold flex items-center gap-1.5 flex-wrap">
                          <span className="bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                            {hostClub?.name || (isJapanese ? '自クラブ' : '우리 클럽')} ({playersPerTeam}{isJapanese ? '人' : '명'})
                          </span>
                          <span className="text-purple-600">⚔️ VS ⚔️</span>
                          <span className="bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                            {oppText} ({playersPerTeam}{isJapanese ? '人' : '명'})
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-600 font-medium leading-relaxed">
                          {isJapanese ? (
                            <>👉 <strong>ライバルクロス対決 組編成</strong>: 各組に両クラブの選手が{Math.max(1, Math.round(playersPerTeam / opt.groupCount))}人ずつ対決配置され、お互いの打数を相互マーキングします。</>
                          ) : (
                            <>👉 <strong>라이벌 크로스 맞대결 조편성</strong>: 각 조당 양 클럽 선수가 {Math.max(1, Math.round(playersPerTeam / opt.groupCount))}명씩 맞대결 배치되어 서로 타수를 상호 마킹합니다.</>
                          )}
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
                  if (isJapanese) {
                    if (targetPlayers <= 4) {
                      summaryText = `計 1組 (${targetPlayers}人)`;
                    } else if (threeCount === 0) {
                      summaryText = `計 ${k}組 (4人組 ${fourCount}組)`;
                    } else if (fourCount === 0) {
                      summaryText = `計 ${k}組 (3人組 ${threeCount}組)`;
                    } else {
                      summaryText = `計 ${k}組 (4人組 ${fourCount}組 + 3人組 ${threeCount}組)`;
                    }
                  } else {
                    if (targetPlayers <= 4) {
                      summaryText = `총 1개 조 (${targetPlayers}명)`;
                    } else if (threeCount === 0) {
                      summaryText = `총 ${k}개 조 (4인 조 ${fourCount}개 조)`;
                    } else if (fourCount === 0) {
                      summaryText = `총 ${k}개 조 (3인 조 ${threeCount}개 조)`;
                    } else {
                      summaryText = `총 ${k}개 조 (4인 ${fourCount}개 조 + 3인 ${threeCount}개 조)`;
                    }
                  }

                  return (
                    <div className="space-y-2.5 bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200">
                      {/* 1. 모집 방식 선택 (자유 모집 vs 정원 제한) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-purple-700" />
                            <span>{isJapanese ? '参加人数募集方式' : '참가 인원 모집 방식'}</span>
                          </span>
                          <span className="text-purple-700 font-bold text-[10px]">{isJapanese ? '幹事集計・カスタム割当' : '총무 집계 및 맞춤 배정'}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => setRecruitPolicy('OPEN_ALL')}
                            className={`py-2 px-2 rounded-xl text-xs font-black border transition cursor-pointer flex flex-col items-center justify-center text-center ${
                              recruitPolicy === 'OPEN_ALL'
                                ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            <span>{isJapanese ? '👥 全会員対象 自由募集' : '👥 전 회원 대상 자유 모집'}</span>
                            <span className="text-[9px] opacity-90 mt-0.5">{isJapanese ? '(定員無制限・自由受付・推奨)' : '(인원 무제한 자율 접수 · 권장)'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRecruitPolicy('FIXED_QUOTA')}
                            className={`py-2 px-2 rounded-xl text-xs font-black border transition cursor-pointer flex flex-col items-center justify-center text-center ${
                              recruitPolicy === 'FIXED_QUOTA'
                                ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            <span>{isJapanese ? '🎯 定員制限 先着順' : '🎯 정원 제한 선착순'}</span>
                            <span className="text-[9px] opacity-90 mt-0.5">{isJapanese ? '(目標人数で締切)' : '(목표 인원 마감)'}</span>
                          </button>
                        </div>
                      </div>

                      {/* 안내 문구 배너 */}
                      <div className="p-2.5 rounded-xl bg-purple-100/70 border border-purple-200 text-[11px] text-purple-950 font-medium leading-relaxed">
                        {isJapanese ? (
                          recruitPolicy === 'OPEN_ALL' ? (
                            <>
                              📢 <strong>全会員自由募集</strong>: 開設後すぐにクラブ全会員を対象に参加募集が開始されます。締切後に幹事が参加人数を集計し、<strong>ゲスト(招待者)や当日参加者</strong>を追加して3〜4人の最適組に柔軟に一括編成します。
                            </>
                          ) : (
                            <>
                              🎯 <strong>定員制限モード</strong>: 設定された定員まで先着順で受け付け、超過分はキャンセル待ち名簿に自動配置されます。
                            </>
                          )
                        ) : (
                          recruitPolicy === 'OPEN_ALL' ? (
                            <>
                              📢 <strong>전 회원 자유 모집</strong>: 개설 즉시 클럽 전 회원을 대상으로 참가 신청이 열립니다. 신청 마감 후 총무가 신청 인원을 집계하고, <strong>게스트(초청자)나 현장 참가자</strong>를 추가하여 3~4인 최적 조로 유연하게 일괄 배정합니다.
                            </>
                          ) : (
                            <>
                              🎯 <strong>정원 제한 모드</strong>: 설정된 정원까지만 선착순 접수되며, 초과 신청자는 대기자 명단에 자동 배치됩니다.
                            </>
                          )
                        )}
                      </div>

                      {/* 인원수 조절 (+ / - 버튼 및 직접 입력) */}
                      <div className="bg-white p-3 rounded-xl border border-purple-200/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-stone-600">
                          <span>{recruitPolicy === 'OPEN_ALL' ? (isJapanese ? '予想参加人数 (基準値)' : '예상 참가 인원 (기준치)') : (isJapanese ? '最大参加定員' : '최대 참가 정원')}</span>
                          <span className="text-purple-700 font-bold">{isJapanese ? '+ / - ボタンまたは直接入力' : '+ / - 버튼 또는 직접 입력'}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleTargetPlayersChange(Math.max(1, targetPlayers - 1))}
                            className="w-12 h-12 rounded-xl bg-purple-100 hover:bg-purple-200 active:scale-95 text-purple-900 flex items-center justify-center font-black text-2xl border border-purple-300 transition cursor-pointer shadow-xs shrink-0"
                            title={isJapanese ? '1人減らす' : '1명 내림'}
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
                            <span className="text-base font-black text-purple-800">{isJapanese ? '人' : '명'}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleTargetPlayersChange(Math.min(999, targetPlayers + 1))}
                            className="w-12 h-12 rounded-xl bg-purple-700 hover:bg-purple-800 active:scale-95 text-white flex items-center justify-center font-black text-2xl border border-purple-800 transition cursor-pointer shadow-md shrink-0"
                            title={isJapanese ? '1人増やす' : '1명 올림'}
                          >
                            <Plus className="w-6 h-6 stroke-[3]" />
                          </button>
                        </div>
                      </div>

                      {/* 3~4인 최적 조 편성 요약 */}
                      <div className="bg-white p-2.5 rounded-xl border border-purple-200/80 text-xs font-black text-purple-950 flex items-center justify-between">
                        <span>🎯 {targetPlayers}{isJapanese ? '人基準 最適組編成:' : '명 기준 최적 조 편성:'}</span>
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
                    <span>{isJapanese ? 'プレーコース選択' : '플레이 코스 선택'}</span>
                  </span>
                  <span className="text-stone-500 font-bold text-[11px]">{isJapanese ? 'タップして選択' : '터치하여 선택'}</span>
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
                              showToast(isJapanese ? '⚠️ 最低1つのコースを選択してください。' : '⚠️ 최소 1개 코스는 선택되어야 합니다.');
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
                        <span className="whitespace-nowrap">{letStr}{isJapanese ? 'コース' : '코스'}</span>
                        {isSelected && <span className="text-[10px] font-black">✓</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs font-black text-emerald-950 flex items-center justify-between">
                  <span>{isJapanese ? '⛳ 指定競技コース:' : '⛳ 지정 경기 코스:'}</span>
                  <span className="text-emerald-800 font-black text-sm">
                    {selectedLetters.join('-')} {isJapanese ? `コース (計 ${selectedLetters.length * 9}ホール)` : `코스 (총 ${selectedLetters.length * 9}홀)`}
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
                    <div className="text-xs font-black text-stone-800">{isJapanese ? '参加費・振込口座のご案内' : '참가비 & 입금 계좌 안내'}</div>
                    <div className="text-[11px] font-bold text-amber-800">
                      {entryFee > 0 ? (isJapanese ? `1人 ${entryFee.toLocaleString()}円 · ${bankAccount || '口座登録済'}` : `1인 ${entryFee.toLocaleString()}원 · ${bankAccount || '계좌 등록됨'}`) : (isJapanese ? '無料 (参加費なし)' : '무료 (참가비 없음)')}
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
                  {isJapanese ? '設定 ⚙️' : '설정 ⚙️'}
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
                    <div className="text-xs font-black text-stone-800">{isJapanese ? '公式競技方式' : '공식 경기 방식'}</div>
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
                  {isJapanese ? '方式選択 ▾' : '방식 선택 ▾'}
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
                    <div className="text-xs font-black text-stone-800">{isJapanese ? 'ローカルルール・特別表彰の告知' : '로컬 룰 & 특별시상 공시'}</div>
                    <div className="text-[11px] font-medium text-stone-600 truncate max-w-[200px]">
                      {gameRuleNotes ? gameRuleNotes.slice(0, 24) + '...' : (isJapanese ? '基本規定を適用' : '기본 규정 적용')}
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
                  {isJapanese ? '告知設定 ▾' : '공시 설정 ▾'}
                </button>
              </div>

              {/* 총무 이름 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '幹事 / 主催者名' : '총무 / 주최자 이름'}</label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder={isJapanese ? '例: 田中幹事' : '예: 김총무'}
                  required
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="w-1/3 py-3 bg-stone-100 text-stone-600 font-bold text-xs rounded-xl"
                >
                  {isJapanese ? 'キャンセル' : '취소'}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md"
                >
                  {isJapanese ? '大会ルーム開設完了' : '대회 방 개설 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}

      {/* ------------------------------------------------------------------------- */}
      {/* SUB-MODAL: 대항전 상대 클럽 찾기 & 다중 지목 모달 (대표님 요청: 착착착 쌓이는 장바구니/지목 슬롯 & 검색 기반 백지 상태) */}
      {/* ------------------------------------------------------------------------- */}
      {showOpponentClubPicker && (() => {
        // 내가 과거에 대항전을 치렀던 상대 클럽 추출
        const pastOpponentClubIds = Array.from(
          new Set(
            rooms
              .filter((r) => r.tournamentType === 'CLUB_MATCH')
              .flatMap((r) => r.participatingClubs?.map((p) => p.clubId) || [])
              .filter((id) => id && id !== tournamentClubId && !id.startsWith('ext-'))
          )
        );
        const pastOpponentClubs = clubs.filter((c) => pastOpponentClubIds.includes(c.id));
        const term = opponentClubSearchTerm.trim().toLowerCase();

        // 검색어 입력 시 필터링된 결과
        const searchResults = term
          ? clubs.filter((c) => {
              if (c.id === tournamentClubId) return false;
              return (
                c.name.toLowerCase().includes(term) ||
                c.region.toLowerCase().includes(term) ||
                (c.homeCourseName && c.homeCourseName.toLowerCase().includes(term))
              );
            })
          : [];

        return (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
            style={{ zIndex: 99999 }}
          >
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[88vh]">
              {/* 헤더 */}
              <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Swords className="w-5 h-5 text-yellow-300" />
                  <h3 className="font-extrabold text-base">{isJapanese ? '対抗戦 相手クラブ検索・選択' : '대항전 상대 클럽 찾기 & 선택'}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOpponentClubPicker(false)}
                  className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. 선택된 상대 클럽 슬롯 (대표님 요청: 착착착 쌓이는 영역) */}
              <div className="p-3 bg-purple-50/80 border-b border-purple-200 shrink-0 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-purple-950 flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-purple-700" />
                    <span>{isJapanese ? '現在選択された対戦チーム' : '현재 선택된 대결 팀'} ({participatingClubIds.length}{isJapanese ? '件' : '곳'})</span>
                  </span>
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-200/80 px-2 py-0.5 rounded-full">
                    {isJapanese ? '計 ' : '총 '}{Math.max(2, participatingClubIds.length + 1)}{isJapanese ? 'チーム対抗戦' : '개 팀 대항전'}
                  </span>
                </div>

                {participatingClubIds.length === 0 ? (
                  <div className="py-2 text-center text-xs text-stone-400 font-bold border border-dashed border-purple-300 rounded-xl bg-white/70">
                    {isJapanese ? '下部でクラブ検索後[+ 選択]を押すとここに追加されます' : '아래에서 클럽 검색 후 [+ 선택]을 누르면 여기에 착착착 쌓입니다'}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-0.5">
                    {participatingClubIds.map((cId) => {
                      const target = clubs.find((c) => c.id === cId);
                      if (!target) return null;
                      return (
                        <span
                          key={cId}
                          className="inline-flex items-center gap-1.5 bg-purple-700 text-white text-xs font-bold px-2.5 py-1 rounded-xl shadow-xs animate-fadeIn"
                        >
                          <span>{target.name}</span>
                          <button
                            type="button"
                            onClick={() => toggleOpponentClub(cId)}
                            className="text-purple-200 hover:text-white font-black text-sm ml-0.5 cursor-pointer"
                            title={isJapanese ? '選択解除' : '선택 취소'}
                          >
                            ✕
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. 검색창 */}
              <div className="p-3 bg-stone-50 border-b border-stone-200 shrink-0 space-y-1">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={opponentClubSearchTerm}
                    onChange={(e) => setOpponentClubSearchTerm(e.target.value)}
                    placeholder={isJapanese ? 'クラブ名または地域 (例: 東京、大阪、福岡など) 検索...' : '클럽명 또는 지역(예: 구미, 김천, 부산, 대구) 검색...'}
                    className="w-full pl-9 pr-8 py-2.5 bg-white border-2 border-purple-200 focus:border-purple-600 rounded-xl text-xs font-bold focus:outline-none shadow-2xs"
                    autoFocus
                  />
                  {opponentClubSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setOpponentClubSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-black p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* 3. 본문 목록 (검색 결과 또는 최근 대항전 기록 / 백지 상태) */}
              <div className="p-3 overflow-y-auto space-y-2 flex-1">
                {/* Case A: 검색어 입력 시 결과 표출 */}
                {term ? (
                  searchResults.length === 0 ? (
                    <div className="py-12 text-center text-stone-500 space-y-1">
                      <p className="text-sm font-bold">{isJapanese ? `「${opponentClubSearchTerm}」の検索結果がありません。` : `'${opponentClubSearchTerm}' 검색 결과가 없습니다.`}</p>
                      <p className="text-xs text-stone-400">{isJapanese ? '別の地域名やクラブ名でお探しください。' : '다른 지역명이나 클럽명으로 찾아보세요.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-[11px] font-black text-stone-600 px-1">
                        {isJapanese ? `検索結果 (${searchResults.length}件) - 希望するチームをタップして選択` : `검색 결과 (${searchResults.length}건) - 원하는 팀을 터치하여 선택하세요`}
                      </div>
                      {searchResults.map((c) => {
                        const isSelected = participatingClubIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleOpponentClub(c.id)}
                            className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-purple-50 border-purple-600 shadow-xs'
                                : 'bg-white border-stone-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="bg-purple-100 text-purple-900 font-bold text-[10px] px-2 py-0.5 rounded-md">
                                  📍 {c.region}
                                </span>
                                <span className="text-[10px] text-stone-500 font-medium">
                                  {isJapanese ? '会員 ' : '회원 '}{c.members?.length || c.memberCount || 0}{isJapanese ? '人' : '명'}
                                </span>
                              </div>
                              <h4 className="font-black text-sm text-stone-900 truncate">
                                {c.name}
                              </h4>
                              <p className="text-[11px] text-stone-500 truncate">
                                ⛳ {isJapanese ? 'ホームコース' : '홈 구장'}: {c.homeCourseName}
                              </p>
                            </div>

                            <div className="shrink-0">
                              {isSelected ? (
                                <span className="px-3 py-1.5 bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1">
                                  <span>✓</span>
                                  <span>{isJapanese ? '選択済' : '선택됨'}</span>
                                </span>
                              ) : (
                                <span className="px-3 py-1.5 bg-stone-100 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-stone-200 transition flex items-center gap-1">
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>{isJapanese ? '選択' : '선택'}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  /* Case B: 검색어가 없을 때 (대표님 요청: 과거 대항전 팀만 띄우고, 없으면 깔끔한 백지 상태 유지) */
                  pastOpponentClubs.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-black text-purple-900 bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-200">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                          <span>{isJapanese ? '⚡ 最近対戦したチーム (クイック再選択)' : '⚡ 최근 대항전을 치렀던 팀 (빠른 재선택)'}</span>
                        </span>
                        <span>{pastOpponentClubs.length}{isJapanese ? '件' : '곳'}</span>
                      </div>
                      {pastOpponentClubs.map((c) => {
                        const isSelected = participatingClubIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleOpponentClub(c.id)}
                            className={`p-3 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-purple-50 border-purple-600 shadow-xs'
                                : 'bg-white border-stone-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="bg-purple-100 text-purple-900 font-bold text-[10px] px-2 py-0.5 rounded-md">
                                  📍 {c.region}
                                </span>
                                <span className="text-[10px] text-stone-500 font-medium">
                                  {isJapanese ? '会員 ' : '회원 '}{c.members?.length || c.memberCount || 0}{isJapanese ? '人' : '명'}
                                </span>
                              </div>
                              <h4 className="font-black text-sm text-stone-900 truncate">
                                {c.name}
                              </h4>
                              <p className="text-[11px] text-stone-500 truncate">
                                ⛳ {isJapanese ? 'ホームコース' : '홈 구장'}: {c.homeCourseName}
                              </p>
                            </div>

                            <div className="shrink-0">
                              {isSelected ? (
                                <span className="px-3 py-1.5 bg-purple-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1">
                                  <span>✓</span>
                                  <span>{isJapanese ? '選択済' : '선택됨'}</span>
                                </span>
                              ) : (
                                <span className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition flex items-center gap-1">
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>{isJapanese ? '再戦選択' : '재대결 선택'}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* 대표님 요청: 과거 대항 팀이 없으면 무작위 클럽을 나열하지 않고 백지 안내 상태 */
                    <div className="py-14 text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
                        🔍
                      </div>
                      <div className="space-y-1 px-4">
                        <h4 className="font-extrabold text-stone-800 text-sm">{isJapanese ? '相手クラブを検索してください' : '상대 클럽을 검색해 주세요'}</h4>
                        <p className="text-xs text-stone-500 font-medium leading-relaxed">
                          {isJapanese ? (
                            <>上部検索バーに対戦したいクラブ名や地域 (例: 東京、大阪、福岡など)を検索すると<br />希望するチームを上部リストに追加できます。</>
                          ) : (
                            <>상단 검색창에 대결을 원하는 클럽명이나 지역(예: 구미, 김천, 대구, 부산 등)을 검색하시면<br />원하는 팀들을 상단 선택 목록에 차곡차곡 담을 수 있습니다.</>
                          )}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* 하단 고정 액션 바 */}
              <div className="p-3 bg-stone-50 border-t border-stone-200 shrink-0 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="text-stone-500 font-bold">{isJapanese ? '選択されたクラブ: ' : '선택된 클럽: '}</span>
                  <strong className="text-purple-800 font-black">{participatingClubIds.length}{isJapanese ? '件' : '곳'}</strong>
                  <span className="text-stone-400 text-[11px] ml-1">
                    ({isJapanese ? '計 ' : '총 '}{Math.max(2, participatingClubIds.length + 1)}{isJapanese ? 'チーム対決' : '개 팀 대결'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOpponentClubPicker(false)}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  {isJapanese ? '選択確認完了' : '선택 확인 완료'} ({participatingClubIds.length}{isJapanese ? '件' : '곳'})
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
                <h3 className="font-extrabold text-base">{isJapanese ? '参加費・振込口座の設定' : '참가비 & 입금 계좌 설정'}</h3>
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
                  <span>{isJapanese ? '1人参加費 (円)' : '1인 참가비 (원)'}</span>
                  <span className="text-amber-700 font-extrabold">{entryFee === 0 ? (isJapanese ? '無料' : '무료') : `${entryFee.toLocaleString()}${isJapanese ? '円' : '원'}`}</span>
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
                    {isJapanese ? '無料 (0円)' : '무료 (0원)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryFee((prev) => prev + 1000)}
                    className="py-2 rounded-xl text-xs font-black border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 active:scale-95 transition cursor-pointer shadow-2xs"
                  >
                    {isJapanese ? '+1,000円' : '+1,000원'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryFee((prev) => prev + 5000)}
                    className="py-2 rounded-xl text-xs font-black border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 active:scale-95 transition cursor-pointer shadow-2xs"
                  >
                    {isJapanese ? '+5,000円' : '+5,000원'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryFee((prev) => prev + 10000)}
                    className="py-2 rounded-xl text-xs font-black border border-amber-400 bg-amber-500 text-amber-950 hover:bg-amber-600 active:scale-95 transition cursor-pointer shadow-xs"
                  >
                    {isJapanese ? '+10,000円' : '+10,000원'}
                  </button>
                </div>
                <p className="text-[10px] text-stone-500 mb-1.5">
                  {isJapanese ? '💡 押すごとに金額が加算されます (例: 1万円2回 + 5千円クリックで25,000円、無料クリックで0円リセット)' : '💡 누를 때마다 금액이 합산됩니다 (예: 1만원 2번 + 5천원 클릭 시 25,000원, 무료 클릭 시 0원 초기화)'}
                </p>
                <div className="relative">
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={entryFee}
                    onChange={(e) => setEntryFee(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold pr-8"
                    placeholder={isJapanese ? '直接入力 (例: 15000)' : '직접 입력 (예: 15000)'}
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-stone-500">{isJapanese ? '円' : '원'}</span>
                </div>
              </div>

              {/* 입금 계좌 안내 */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-800">{isJapanese ? '振込案内口座番号' : '입금 안내 계좌번호'}</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder={isJapanese ? '例: 三菱UFJ銀行 123-4567890 田中幹事' : '예: 농협 352-1234-5678 홍길동'}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                />
                <p className="text-[10px] text-stone-500 leading-tight">
                  {isJapanese ? '💡 参加者に口座番号が即時案内され、幹事はリアルタイムで入金確認(チェック)を行えます。' : '💡 참가자들에게 계좌번호가 즉시 안내되며, 총무님은 실시간으로 입금 확인(체크)을 진행할 수 있습니다.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateFeeModal(false)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition active:scale-98"
              >
                {isJapanese ? '設定確認および閉じる' : '설정 확인 및 닫기'}
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
                <h3 className="font-extrabold text-base">{isJapanese ? '公式競技方式の確定' : '공식 경기 방식 확정'}</h3>
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
                {isJapanese ? '大会の趣旨に合った競技方式を選択してください。ルーム開設後も変更可能です。' : '대회 성격에 맞는 경기 방식을 선택하세요. 방 개설 후에도 변경 가능합니다.'}
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
                        setGameRuleNotes(isJapanese ? '正統ストローク(18ホール最少打数順)、同打時バックカウント(後半9ホール合算)優先、OKパット1クラブシャフト以内、OB2打罰' : '정통 스트로크(18홀 최저타순), 동타 시 백카운트(후반 9홀 합산) 우선, 컨시드 1클럽 샤프트 이내, OB 2벌타');
                      } else if (mode === 'NEW_PERIO') {
                        setGameRuleNotes(isJapanese ? '新ペリア方式(12個隠しホールハンディキャップ算出)、OKパット1クラブシャフト以内認定、OB時2打罰後特設ティー進行' : '신페리오 방식(12개 숨은 홀 핸디캡 산출), 컨시드 1클럽 샤프트 길이 이내 인정, OB 시 2벌타 후 특설티 진행');
                      } else if (mode === 'SCRAMBLE') {
                        setGameRuleNotes(isJapanese ? 'チームスクランブル(ベストボール団体戦)、組員全員ティーショット後ベストボール位置から2打目進行' : '팀 스크램블(베스트볼 단체전), 조원 모두 티샷 후 최고 위치 볼에서 2번째 샷 진행');
                      } else if (mode === 'CASUAL') {
                        setGameRuleNotes(isJapanese ? '親善エンジョイラウンド、順位不問ラッキールーレット抽選および特別賞表彰' : '친선 명랑 라운드, 순위 무관 행운권 룰렛 추첨 및 다파상·오리상 특별 시상 진행');
                      } else if (mode === 'STABLEFORD') {
                        setGameRuleNotes(isJapanese ? 'ステーブルフォード方式(ホール別打数ごとの勝ち点合算)、規定18ホール最高得点者優勝' : '스테이블포드 방식(홀별 타수별 승점 합산), 규정 18홀 최고 승점자 우승');
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
                          {isJapanese ? '現在選択中 ✓' : '현재 선택됨 ✓'}
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
                  {isJapanese ? '選択完了および閉じる' : '선택 완료 및 닫기'}
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
                  <h3 className="font-black text-base sm:text-lg tracking-tight">{isJapanese ? '大会ローカルルール・特別表彰 詳細設定' : '대회 로컬 룰 & 특별 시상 상세 공시'}</h3>
                  <p className="text-[11px] text-emerald-200 font-medium">
                    {isJapanese ? '大会告知事項に入る規定と表彰ルールをクリックしてきめ細かく設定してください。' : '대회 공지사항에 들어갈 규정과 시상 룰을 클릭하여 촘촘하게 세팅하세요.'}
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
                    {isJapanese ? '⚡ ワンクリック推奨ルールパック (1秒で設定)' : '⚡ 원클릭 추천 룰 팩 (누르면 1초 세팅)'}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">{isJapanese ? 'パークゴルフ公式セット' : '파크골프 공식 세트'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setGameRuleNotes(
                        isJapanese
                          ? '正統ストローク(18ホール最少打数順)、同打時バックカウント(後半9ホール合算)優先、OKパット1クラブシャフト以内認定、OB2打罰特設ティー進行、バンカー/修理地無罰ドロップおよび足跡均し、4番ホールニアピン表彰、最多パー賞、ホールインワン祝賀賞'
                          : '정통 스트로크(18홀 최저타순), 동타 시 백카운트(후반 9홀 합산) 우선, 컨시드 1클럽 샤프트 이내 인정, OB 2벌타 특설티 진행, 벙커/수리지 무벌타 드롭 및 발자국 정리, 4번홀 니어핀 시상, 최다 파(다파상), 홀인원 축하상'
                      );
                    }}
                    className="p-2 rounded-xl text-left bg-white hover:bg-emerald-100/70 border border-emerald-300 text-stone-800 transition cursor-pointer active:scale-95 shadow-2xs flex flex-col"
                  >
                    <span className="text-xs font-black text-emerald-900">{isJapanese ? '🥇 標準月例会パック' : '🥇 표준 월례회 팩'}</span>
                    <span className="text-[10px] text-stone-500 font-medium truncate">{isJapanese ? 'ストローク+ニアピン+最多パー' : '스트로크+니어핀+다파상'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGameRuleNotes(
                        isJapanese
                          ? '新ペリア方式(12個隠しホールハンディ自動算出)、ネットスコア1位優勝および最少打数メダリスト個別表彰、OKパット1クラブシャフト以内認定、OB2打罰特設ティー進行、4番ホールニアピン表彰、最多パー賞、現場ラッキールーレット抽選'
                          : '신페리오 방식(12개 숨은 홀 핸디캡 자동산출), 네트스코어 1위 우승 및 최저타수 메달리스트 분리 시상, 컨시드 1클럽 샤프트 이내 인정, OB 2벌타 특설티 진행, 4번홀 니어핀 시상, 다파상, 현장 실시간 행운권 룰렛 추첨'
                      );
                    }}
                    className="p-2 rounded-xl text-left bg-white hover:bg-emerald-100/70 border border-emerald-300 text-stone-800 transition cursor-pointer active:scale-95 shadow-2xs flex flex-col"
                  >
                    <span className="text-xs font-black text-indigo-900">{isJapanese ? '🎯 新ペリアパック' : '🎯 신페리오 팩'}</span>
                    <span className="text-[10px] text-stone-500 font-medium truncate">{isJapanese ? 'ハンディ+メダリスト+ルーレット' : '핸디캡+메달리스트+룰렛'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGameRuleNotes(
                        isJapanese
                          ? '親善エンジョイラウンド(順位負担のない親睦ラウンド)、OKパット50cm円形ライン以内認定、バンカー/修理地無罰自由ドロップ、現場ラッキールーレット抽選、ラッキーダック賞(22位)、ラッキーセブン賞(7位)、情熱激励賞(初心者完走応援)'
                          : '친선 명랑 라운드(순위 부담 없는 친목 라운드), 컨시드 50cm 원형 라인 이내 인정, 벙커/수리지 무벌타 자유 드롭, 현장 실시간 룰렛 행운 추첨, 행운의 오리상(22위), 행운의 7위상, 열정 격려상(초보 완주 응원)'
                      );
                    }}
                    className="p-2 rounded-xl text-left bg-white hover:bg-emerald-100/70 border border-emerald-300 text-stone-800 transition cursor-pointer active:scale-95 shadow-2xs flex flex-col"
                  >
                    <span className="text-xs font-black text-amber-900">{isJapanese ? '⛳ 親善エンジョイパック' : '⛳ 명랑 친목 팩'}</span>
                    <span className="text-[10px] text-stone-500 font-medium truncate">{isJapanese ? '緩和OK+ダック賞+抽選券' : '완화 컨시드+오리상+행운권'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGameRuleNotes(
                        isJapanese
                          ? '公認チャンピオンシップ ストロークプレー、完全ホールアウト必須(OKパットなし)、OB2打罰特設ティー厳格適用、同打時バックカウント優先、ゴムティー(2.3cm以下)遵守、同伴者相互スコア確認および最終署名必須'
                          : '공인 챔피언십 스트로크 플레이, 노 컨시드 (전 홀 홀아웃 필수), OB 2벌타 특설티 엄격 적용, 동타 시 백카운트 우선, 고무 티(2.3cm 이하) 준수, 동반자 상호 스코어 확인 및 최종 서명 필수'
                      );
                    }}
                    className="p-2 rounded-xl text-left bg-white hover:bg-emerald-100/70 border border-emerald-300 text-stone-800 transition cursor-pointer active:scale-95 shadow-2xs flex flex-col"
                  >
                    <span className="text-xs font-black text-rose-900">{isJapanese ? '🏆 選手権パック' : '🏆 챔피언십 팩'}</span>
                    <span className="text-[10px] text-stone-500 font-medium truncate">{isJapanese ? 'OKなし+ホールアウト+相互署名' : '노컨시드+홀아웃+상호서명'}</span>
                  </button>
                </div>
              </div>

              {/* ⛳ 1. 컨시드(OK) 기준 설정 (거리 / 샤프트 맞춤 선택 및 가변 입력) */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    {isJapanese ? '⛳ 1. OKパット(コンシード)距離および基準設定 (選択/変更)' : '⛳ 1. 컨시드(OK) 거리 및 기준 설정 (선택/변경)'}
                  </h4>
                  <span className="text-[10px] text-teal-700 font-bold">{isJapanese ? 'パークゴルフ シャフト規定' : '파크골프 샤프트 규정'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { label: isJapanese ? '1クラブシャフト (約80cm)' : '1클럽 샤프트 (약 80cm)', desc: isJapanese ? 'パークゴルフ標準クラブ長' : '파크골프 표준 클럽 길이', key: '1클럽' },
                    { label: isJapanese ? '半クラブシャフト (約40cm)' : '반 클럽 샤프트 (약 40cm)', desc: isJapanese ? '精密パッティング基準' : '정밀 퍼팅 기준', key: '반 클럽' },
                    { label: isJapanese ? '円形白線ライン (50cm)' : '원형 백색 라인 (50cm)', desc: isJapanese ? 'カップ白線以内' : '홀컵 백색선 이내', key: '백색 라인' },
                    { label: isJapanese ? '30cm以内' : '30cm 이내', desc: isJapanese ? '厳格基準' : '엄격 기준', key: '30cm' },
                    { label: isJapanese ? '1m (1メートル)以内' : '1m (1미터) 이내', desc: isJapanese ? '親善エンジョイ緩和基準' : '친선 명랑 완화 기준', key: '1m' },
                    { label: isJapanese ? 'OKなし (完全ホールアウト必須)' : '노 컨시드 (홀아웃 필수)', desc: isJapanese ? '全員ホールイン完了必須' : '전원 홀인 완료 필수', key: '노 컨시드' },
                  ].map((c) => {
                    const isSelected = gameRuleNotes.includes(c.label) || (c.key === '1클럽' && (gameRuleNotes.includes('1클럽') || gameRuleNotes.includes('1クラブ'))) || (c.key === '노 컨시드' && (gameRuleNotes.includes('노 컨시드') || gameRuleNotes.includes('OKなし')));
                    return (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => {
                          setCustomConcede(c.label);
                          let notes = gameRuleNotes
                            .split(',')
                            .map((s) => s.trim())
                            .filter((s) => s && !s.includes('컨시드') && !s.includes('コンシード') && !s.includes('OKパット') && !s.includes('OKなし'));
                          const newClause = c.key === '노 컨시드'
                            ? (isJapanese ? 'OKなし (全ホール完全ホールアウト必須)' : '노 컨시드 (전 홀 홀아웃 필수)')
                            : (isJapanese ? `OKパット ${c.label} 認定` : `컨시드 ${c.label} 인정`);
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
                    {isJapanese ? '📌 2. 必須競技ルール＆安全ペナルティ規定' : '📌 2. 필수 경기 규칙 & 안전 벌타 규정'}
                  </h4>
                  <span className="text-[10px] text-stone-500 font-bold">{isJapanese ? 'クリックで自動追加/解除' : '클릭 시 자동 추가/제거'}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { ko: 'OB 2벌타 후 특설티(드롭존) 진행', ja: 'OB2打罰後特設ティー(ドロップゾーン)進行' },
                    { ko: 'OB 2벌타 후 나간 지점 2클럽 이내 드롭', ja: 'OB2打罰後出た地点から2クラブ以内ドロップ' },
                    { ko: '고무 티 규정: 반드시 고무 티(높이 2.3cm 이하) 사용', ja: 'ゴムティー規定: 必ずゴムティー(高さ2.3cm以下)使用' },
                    { ko: '티잉 그라운드 안전: 매트 밖 발 벗어남(스탠스 아웃) 금지', ja: 'ティーインググラウンド安全: マット外スタンスアウト禁止' },
                    { ko: '벙커/수리지 무벌타 드롭 및 발자국 고무래 정리 필수', ja: 'バンカー/修理地無罰ドロップおよび足跡均し必須' },
                    { ko: '안전망/철조망 구제: 1클럽 무벌타 드롭', ja: '防護ネット/フェンス救済: 1クラブ無罰ドロップ' },
                    { ko: '페어웨이 디봇 1클럽 무벌타 드롭 허용', ja: 'フェアウェイディボット 1クラブ無罰ドロップ許容' },
                    { ko: '동타 시 백카운트(후반 9홀 합산) 우선', ja: '同打時バックカウント(後半9ホール合算)優先' },
                    { ko: '동타 시 연장 서든데스 1홀 진행', ja: '同打時延長サドンデス1ホール進行' },
                  ].map((item) => {
                    const rule = isJapanese ? item.ja : item.ko;
                    const isSelected = gameRuleNotes.includes(item.ko) || gameRuleNotes.includes(item.ja);
                    return (
                      <button
                        key={rule}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            const filtered = gameRuleNotes
                              .split(',')
                              .map((s) => s.trim())
                              .filter((s) => s && s !== item.ko && s !== item.ja && !s.includes(item.ko) && !s.includes(item.ja))
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
                    {isJapanese ? '🎁 3. 大会特別表彰＆多彩なラッキー賞 (ロングドライブ危険除外)' : '🎁 3. 대회 특별 시상 & 풍성한 행운상 (롱기스트 위험 제외)'}
                  </h4>
                  <span className="text-[10px] text-amber-700 font-bold">{isJapanese ? '人気表彰項目' : '인기 시상 항목'}</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">
                  {isJapanese ? '💡 パークゴルフは安全のためドラコン(飛距離)競争を避け、ニアピンや多彩な親睦ラッキー賞を表彰します。' : '💡 파크골프는 안전을 위해 장타(롱기스트) 경쟁을 지양하고, 니어핀 및 다채로운 친목 행운상을 시상합니다.'}
                </p>

                {/* 기록 시상 */}
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-stone-600">{isJapanese ? '🎯 記録表彰 (実力＆ナイスショット)' : '🎯 기록 시상 (실력 & 나이스 샷)'}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { ko: '홀인원(Hole-in-One) 축하상', ja: 'ホールインワン(Hole-in-One)祝賀賞' },
                      { ko: '4번홀 니어핀 시상 (파3 홀컵 최근접)', ja: '4番ホール ニアピン賞 (Par3カップ最近接)' },
                      { ko: '최다 버디상 (공격적 플레이어)', ja: '最多バーディー賞 (アグレッシブプレーヤー)' },
                      { ko: '다파상 (Par Master: 18홀 최다 파)', ja: '最多パー賞 (Par Master: 18ホール最多パー)' },
                    ].map((item) => {
                      const rule = isJapanese ? item.ja : item.ko;
                      const isSelected = gameRuleNotes.includes(item.ko) || gameRuleNotes.includes(item.ja);
                      return (
                        <button
                          key={rule}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              const filtered = gameRuleNotes
                                .split(',')
                                .map((s) => s.trim())
                                .filter((s) => s && s !== item.ko && s !== item.ja && !s.includes(item.ko) && !s.includes(item.ja))
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
                  <span className="text-[11px] font-black text-stone-600">{isJapanese ? '🍀 ラッキー＆親睦表彰 (多彩なプレゼント)' : '🍀 행운 & 친목 시상 (풍성한 선물)'}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { ko: '행운의 오리상 (22위: 오리 두 마리 행운상)', ja: 'ラッキーダック賞 (22位: ゾロ目ラッキー賞)' },
                      { ko: '행운의 럭키세븐상 (7위 시상)', ja: 'ラッキーセブン賞 (7位表彰)' },
                      { ko: '행운의 피그상 (88위 또는 특정 순위 횡재상)', ja: 'ラッキーピッグ賞 (88位または特定順位ラッキー賞)' },
                      { ko: '열정 격려상 (초보 완주 응원, 최다 타수)', ja: '情熱激励賞 (初心者完走応援、最多打数)' },
                      { ko: '아차상 (1타 차 입상 탈락자 위로)', ja: 'おしかったで賞 (1打差入賞逃し慰労)' },
                      { ko: '베스트 매너상 (신사·숙녀 신사도상)', ja: 'ベストマナー賞 (紳士・淑女のマナー賞)' },
                      { ko: '잉꼬 원앙상 (부부/가족 동반 참가상)', ja: 'おしどり夫婦賞 (夫婦/家族同伴参加賞)' },
                      { ko: '현장 실시간 행운권 룰렛 추첨 가동', ja: '会場リアルタイム ラッキールーレット抽選稼働' },
                    ].map((item) => {
                      const rule = isJapanese ? item.ja : item.ko;
                      const isSelected = gameRuleNotes.includes(item.ko) || gameRuleNotes.includes(item.ja);
                      return (
                        <button
                          key={rule}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              const filtered = gameRuleNotes
                                .split(',')
                                .map((s) => s.trim())
                                .filter((s) => s && s !== item.ko && s !== item.ja && !s.includes(item.ko) && !s.includes(item.ja))
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
                    {isJapanese ? '🛡️ 4. 前回優勝者 商品表彰猶予 (独占防止 可変設定)' : '🛡️ 4. 직전 우승자 상품 시상 유예 (독식 방지 가변 설정)'}
                  </h4>
                  <span className="text-[10px] text-purple-700 font-bold">{isJapanese ? '和合ローカルルール' : '화합 로컬 룰'}</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">
                  {isJapanese ? '優勝常連による賞品独占を防ぎ、次順位(2位)会員に賞品を継承します。(1位には名誉メダリストを授与)' : '우승 고수의 상품 독식을 방지하고 차순위(2위) 회원에게 상품을 승계합니다. (1위 고수에게는 명예 메달리스트 수여)'}
                </p>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {[
                    { label: isJapanese ? '適用なし (0ヶ月)' : '미적용 (0개월)', val: 0 },
                    { label: isJapanese ? '1ヶ月猶予' : '1개월간 유예', val: 1 },
                    { label: isJapanese ? '2ヶ月猶予' : '2개월간 유예', val: 2 },
                    { label: isJapanese ? '3ヶ月猶予 (標準)' : '3개월간 유예 (표준)', val: 3 },
                    { label: isJapanese ? '6ヶ月猶予' : '6개월간 유예', val: 6 },
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
                            .filter((s) => s && !s.includes('우승자') && !s.includes('시상 유예') && !s.includes('優勝者') && !s.includes('表彰猶予'));
                          if (m.val > 0) {
                            notes.push(isJapanese ? `前回大会優勝者 ${m.val}ヶ月間賞品表彰猶予 (次順位継承＆名誉メダリスト個別)` : `직전 대회 우승자 ${m.val}개월간 상품 시상 유예 (차순위 승계 & 명예 메달리스트 분리)`);
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
                    <span className="text-[11px] font-bold text-stone-600">{isJapanese ? '直接入力:' : '직접 입력:'}</span>
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
                          .filter((s) => s && !s.includes('우승자') && !s.includes('시상 유예') && !s.includes('優勝者') && !s.includes('表彰猶予'));
                        if (val > 0) {
                          notes.push(isJapanese ? `前回大会優勝者 ${val}개월간賞品表彰猶予 (次順位継承＆名誉メダリスト個別)` : `직전 대회 우승자 ${val}개월간 상품 시상 유예 (차순위 승계 & 명예 메달리스트 분리)`);
                        }
                        setGameRuleNotes(notes.join(', '));
                      }}
                      className="w-14 px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-black text-center"
                    />
                    <span className="text-[11px] font-bold text-stone-600">{isJapanese ? 'ヶ月間' : '개월간'}</span>
                  </div>
                </div>
              </div>

              {/* 🤝 5. 파크골프 에티켓 & 매너 규정 */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    {isJapanese ? '🤝 5. パークゴルフ エチケット＆マナー規定' : '🤝 5. 파크골프 에티켓 & 매너 규정'}
                  </h4>
                  <span className="text-[10px] text-blue-700 font-bold">{isJapanese ? '紳士の競技' : '신사도 경기'}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { ko: '동반자 스코어 상호 확인 및 경기 후 최종 서명 필수', ja: '同伴者スコア相互確認および競技後最終署名必須' },
                    { ko: '그린 잔디 보호: 클럽 헤드로 잔디 찍기(디봇 내기) 절대 금지', ja: 'グリーン芝保護: クラブヘッドで芝を傷つける(ディボット)行為厳禁' },
                    { ko: '볼 마킹 매너: 다른 동반자 퍼팅 라인 방해 시 볼마커 필수 사용', ja: 'ボールマーキングマナー: 同伴者パッティングライン邪魔時はマーカー必須使用' },
                    { ko: '플레이 지연 방지 (홀당 준비된 선수부터 신속 티샷)', ja: 'プレー遅延防止 (ホールごとに準備できた選手から迅速にティーショット)' },
                  ].map((item) => {
                    const rule = isJapanese ? item.ja : item.ko;
                    const isSelected = gameRuleNotes.includes(item.ko) || gameRuleNotes.includes(item.ja);
                    return (
                      <button
                        key={rule}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            const filtered = gameRuleNotes
                              .split(',')
                              .map((s) => s.trim())
                              .filter((s) => s && s !== item.ko && s !== item.ja && !s.includes(item.ko) && !s.includes(item.ja))
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
                    {isJapanese ? '最終告知案内文 (リアルタイム組み合わせおよび直接入力修正可能)' : '최종 공시 안내문 (실시간 조합 및 직접 타이핑 수정 가능)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setGameRuleNotes('')}
                    className="text-[11px] text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
                  >
                    {isJapanese ? '内容をクリア' : '내용 비우기'}
                  </button>
                </div>
                <textarea
                  value={gameRuleNotes}
                  onChange={(e) => setGameRuleNotes(e.target.value)}
                  rows={4}
                  placeholder={isJapanese ? '大会規定、OKパット基準、特別表彰内容などを自由に記入するか、上のボタンを押して追加してください。' : '대회 규정, 컨시드 기준, 특별 시상 내역 등을 자유롭게 적거나 위 버튼을 눌러 추가하세요.'}
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
                {isJapanese ? 'ローカルルール告知設定完了' : '로컬 룰 공시 설정 완료'}
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
                <h3 className="font-extrabold text-base">{isJapanese ? '全国パークゴルフ場検索' : '전국 파크골프장 검색'}</h3>
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
                  placeholder={isJapanese ? 'コース名または地域検索 (例: 東京、大阪、北海道、福岡)' : '구장명 또는 지역 검색 (예: 동락, 부산, 양평, 대구)'}
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
                    {reg === '전체' ? (isJapanese ? '全て' : '전체') : reg}
                  </button>
                ))}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-0.5">
                {filteredSearchCourses.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-400">
                    {isJapanese ? '検索されたパークゴルフ場がありません。' : '검색된 파크골프장이 없습니다.'}
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
                        {c.region} · {isJapanese ? `計 ${c.totalHoles}ホール` : `총 ${c.totalHoles}홀`}
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-700">{isJapanese ? '選択' : '선택'}</span>
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
              <h3 className="font-extrabold text-base">{isJapanese ? 'イベントルーム設定の編集' : '모임 방 설정 수정'}</h3>
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
                <label className="font-bold text-stone-700">{isJapanese ? 'イベント名' : '모임 이름'}</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">{isJapanese ? '幹事名' : '총무 이름'}</label>
                <input
                  type="text"
                  value={editHostName}
                  onChange={(e) => setEditHostName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">{isJapanese ? '進行状態' : '진행 상태'}</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'RECRUITING' | 'PLAYING' | 'FINISHED')}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                >
                  <option value="RECRUITING">{isJapanese ? '⏳ 参加受付中' : '⏳ 참가 접수 중'}</option>
                  <option value="PLAYING">{isJapanese ? '⛳ ラウンド進行中' : '⛳ 실시간 라운드 중'}</option>
                  <option value="FINISHED">{isJapanese ? '🏁 競技終了 (結果確定)' : '🏁 경기 종료 (결과 확정)'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">{isJapanese ? '1人参加費 (円、0なら無料)' : '1인 참가비 (원, 0이면 무료)'}</label>
                <input
                  type="number"
                  value={editEntryFee}
                  onChange={(e) => setEditEntryFee(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">{isJapanese ? '振込案内口座' : '입금 계좌 안내'}</label>
                <input
                  type="text"
                  value={editBankAccount}
                  onChange={(e) => setEditBankAccount(e.target.value)}
                  placeholder={isJapanese ? '例: 三菱UFJ銀行 123-4567890 田中幹事' : '예: 농협 352-1234-5678-93 김총무'}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">{isJapanese ? '大会競技方式' : '대회 경기 방식'}</label>
                <select
                  value={editGameMode}
                  onChange={(e) => setEditGameMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                >
                  <option value="NEW_PERIO">{isJapanese ? '🎯 新ペリア方式 (12個隠しホールハンディ)' : '🎯 신페리오 방식 (12개 숨은 홀 핸디캡)'}</option>
                  <option value="STROKE">{isJapanese ? '🏆 正統ストローク (18ホール最少打数順位)' : '🏆 정통 스트로크 (18홀 최저타수 순위)'}</option>
                  <option value="SCRAMBLE">{isJapanese ? '🤝 チームスクランブル (団体ベストボール)' : '🤝 팀 스크램블 (단체 베스트볼)'}</option>
                  <option value="CASUAL">{isJapanese ? '⛳ 親善エンジョイラウンド (親睦)' : '⛳ 친선 명랑 라운드 (친목)'}</option>
                  <option value="STABLEFORD">{isJapanese ? '🎖️ ステーブルフォード (ホール別勝点制)' : '🎖️ 스테이블포드 (홀별 승점제)'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-700">{isJapanese ? '大会ローカルルール・特別表彰 告知' : '대회 로컬 룰 & 특별 시상 공시'}</label>
                <textarea
                  rows={2}
                  value={editGameRuleNotes}
                  onChange={(e) => setEditGameRuleNotes(e.target.value)}
                  placeholder={isJapanese ? '例: OB時2打罰特設ティー進行、OKパット1クラブ、4番ホールニアピン賞' : '예: OB 시 2벌타 특설티 진행, 컨시드 1클럽, 4번홀 니어핀 시상'}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="w-1/3 py-2.5 bg-stone-100 text-stone-600 font-bold rounded-xl"
                >
                  {isJapanese ? 'キャンセル' : '취소'}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-purple-700 text-white font-black rounded-xl"
                >
                  {isJapanese ? '編集を保存' : '수정 저장'}
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
            <h3 className="font-black text-base text-stone-900">{isJapanese ? 'イベントルームを削除しますか？' : '모임 방을 삭제하시겠습니까?'}</h3>
            <p className="text-xs text-stone-500 font-medium">
              {isJapanese ? `「${roomToDelete.title}」ルームのスコアおよび組編成データがすべて削除されます。` : `‘${roomToDelete.title}’ 방의 스코어 및 조 편성 데이터가 모두 삭제됩니다.`}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoomToDelete(null)}
                className="flex-1 py-2.5 bg-stone-100 text-stone-600 font-bold text-xs rounded-xl"
              >
                {isJapanese ? 'キャンセル' : '취소'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl"
              >
                {isJapanese ? '削除確定' : '삭제 확정'}
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
                <h3 className="font-extrabold text-base">{isJapanese ? 'クラブ内活動名の設定' : '클럽 내 활동명 설정'}</h3>
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
                  {isJapanese ? (
                    <>
                      <span className="font-black text-emerald-800">「{aliasTargetClub.name}」</span>で使用するお名前を決めてください。
                    </>
                  ) : (
                    <>
                      <span className="font-black text-emerald-800">&lsquo;{aliasTargetClub.name}&rsquo;</span>에서 사용할 회원님의 이름을 정해주세요.
                    </>
                  )}
                </p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {isJapanese ? 'クラブごとに本名(例: 田中太郎)またはニックネーム(例: ゴルファー)を個別に設定できます。' : '클럽마다 실명(예: 홍길동) 또는 닉네임(예: 골퍼)을 다르게 지정할 수 있습니다.'}
                </p>
              </div>

              {/* 빠른 선택 버튼 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-stone-600">{isJapanese ? 'クイック選択' : '빠른 선택'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const kakaoUser = ParkOnStorage.getKakaoUser();
                      setAliasInputName(kakaoUser?.realName || (isJapanese ? '田中太郎' : '홍길동'));
                    }}
                    className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-left transition cursor-pointer"
                  >
                    <div className="text-[10px] font-bold text-emerald-700">{isJapanese ? '本名を適用' : '실명 적용'}</div>
                    <div className="text-xs font-black text-emerald-950 truncate">
                      {ParkOnStorage.getKakaoUser()?.realName || (isJapanese ? '田中太郎' : '홍길동')}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const kakaoUser = ParkOnStorage.getKakaoUser();
                      setAliasInputName(kakaoUser?.aliasName || (isJapanese ? 'ゴルファー' : '골퍼'));
                    }}
                    className="p-2.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-left transition cursor-pointer"
                  >
                    <div className="text-[10px] font-bold text-purple-700">{isJapanese ? '仮名/ニックネーム適用' : '가명/닉네임 적용'}</div>
                    <div className="text-xs font-black text-purple-950 truncate">
                      {ParkOnStorage.getKakaoUser()?.aliasName || (isJapanese ? 'ゴルファー' : '골퍼')}
                    </div>
                  </button>
                </div>
              </div>

              {/* 직접 입력창 */}
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700">{isJapanese ? '活動名を直接入力' : '활동명 직접 입력'}</label>
                <input
                  type="text"
                  value={aliasInputName}
                  onChange={(e) => setAliasInputName(e.target.value)}
                  placeholder={isJapanese ? '例: 田中太郎 または ゴルファー' : '예: 홍길동 또는 골퍼'}
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
                  {isJapanese ? 'キャンセル' : '취소'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = aliasInputName.trim();
                    if (!trimmed) {
                      showToast(isJapanese ? '⚠️ 活動名を入力してください。' : '⚠️ 활동명을 입력해 주세요.');
                      return;
                    }
                    ParkOnStorage.setClubUserAlias(aliasTargetClub.id, trimmed);
                    ClubStorage.updateClubMemberAlias(aliasTargetClub.id, trimmed);
                    refreshAllData();
                    showToast(isJapanese ? `「${aliasTargetClub.name}」の活動名が「${trimmed}」に変更されました。` : `'${aliasTargetClub.name}' 활동명이 '${trimmed}'(으)로 변경되었습니다.`);
                    setAliasTargetClub(null);
                  }}
                  className="w-2/3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                >
                  {isJapanese ? '活動名を保存確定' : '활동명 저장 확정'}
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
                    {isJapanese ? 'LINE招待状のコピー完了！' : '카톡 초청장 복사 완료!'}
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
                    {isJapanese ? '招待文と参加リンクがコピーされました！' : '초대 문구와 가입 링크가 복사되었습니다!'}
                  </h4>
                  <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5 font-medium">
                    {isJapanese ? (
                      <>LINEグループや知人とのチャットで<strong>[貼り付け]</strong>(入力欄を長押しして「ペースト」)するとすぐに送信できます。</>
                    ) : (
                      <>카카오톡 단체방이나 지인과의 채팅창에 들어가서 <strong>[붙여넣기]</strong>(입력창을 꾹 누른 후 &lsquo;붙여넣기&rsquo;) 하시면 바로 전송됩니다.</>
                    )}
                  </p>
                </div>
              </div>

              {/* 복사된 초대장 전문 미리보기 */}
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-700 flex items-center justify-between">
                  <span>{isJapanese ? '招待状の内容プレビュー' : '초청장 내용 미리보기'}</span>
                  <span className="text-[10px] text-stone-400 font-bold">{isJapanese ? 'クリップボード保存内容' : '클립보드 저장 내용'}</span>
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
                          title: isJapanese ? `[${inviteModalClub.name}] 入会招待状` : `[${inviteModalClub.name}] 가입 초청장`,
                          text,
                        });
                      } catch {
                        // ignore user cancel
                      }
                    }}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-amber-500"
                  >
                    <span>💬</span>
                    <span>{isJapanese ? 'LINEアプリですぐに送信する' : '카카오톡 앱으로 바로 전송하기'}</span>
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const text = ClubStorage.generateClubInviteText(inviteModalClub);
                      await copyTextToClipboard(text);
                      showToast(isJapanese ? '📢 クリップボードにもう一度コピーされました！' : '📢 클립보드에 한 번 더 복사되었습니다!');
                    }}
                    className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-xs rounded-xl border border-stone-300 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5 text-stone-600" />
                    <span>{isJapanese ? 'もう一度コピー' : '한 번 더 복사'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInviteModalClub(null)}
                    className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer text-center"
                  >
                    {isJapanese ? '確認 (閉じる)' : '확인 (닫기)'}
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
                <h3 className="font-extrabold text-base">{isJapanese ? '⚡ 親しい仲間 あんしん招集マッチ開設' : '⚡ 1촌 안심 번개방 개설'}</h3>
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
                {isJapanese ? (
                  <>💡 <strong>親しい仲間専用招集マッチ案内</strong>: 不特定多数ではなく登録された仲間だけに通知が届き、各仲間が<strong>[承認する ✋]</strong>を押すことで最終参加確定となります。</>
                ) : (
                  <>💡 <strong>1촌 전용 번개 안내</strong>: 불특정 다수가 아닌 내 1촌 동반자들에게만 번개가 전달되며, 각 1촌이 <strong>[수락하기 ✋]</strong>를 눌러야만 최종 참가 확정됩니다.</>
                )}
              </div>

              {/* 구장 선택 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '招集マッチコース選択 *' : '번개 라운드 구장 선택 *'}</label>
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
                    <span>{isJapanese ? '全国コース検索' : '전국 구장 검색'}</span>
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
                  {(() => {
                    const dual = getCourseDualName(ltnSelectedCourse, isJapanese);
                    const displayRegion = isJapanese
                      ? (ltnSelectedCourse.regionJa || ltnSelectedCourse.region)
                      : (ltnSelectedCourse.regionKo || ltnSelectedCourse.region);
                    return (
                      <>
                        <span className="flex items-center gap-1.5 min-w-0 pr-2">
                          <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span className="truncate font-black flex items-center gap-1.5">
                            {dual.flag && <span>{dual.flag}</span>}
                            <span>{dual.primary}</span>
                            {dual.showSecondary && dual.secondary && (
                              <span className="text-[11px] text-emerald-700 font-bold ml-1">{dual.secondary}</span>
                            )}
                          </span>
                        </span>
                        <span className="text-stone-500 shrink-0 text-[11px] ml-auto">
                          {displayRegion} · {isJapanese ? `${ltnSelectedCourse.totalHoles}ホール ▾` : `${ltnSelectedCourse.totalHoles}홀 ▾`}
                        </span>
                      </>
                    );
                  })()}
                </button>
              </div>

              {/* 일시 선택 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '日付選択' : '일자 선택'}</label>
                  <select
                    value={ltnDateStr}
                    onChange={(e) => setLtnDateStr(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
                  >
                    <option value="오늘">{isJapanese ? '今日' : '오늘'}</option>
                    <option value="내일">{isJapanese ? '明日' : '내일'}</option>
                    <option value="이번 주 토요일">{isJapanese ? '今週土曜日' : '이번 주 토요일'}</option>
                    <option value="이번 주 일요일">{isJapanese ? '今週日曜日' : '이번 주 일요일'}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">{isJapanese ? 'ティーオフ時間' : '티오프 시간'}</label>
                  <select
                    value={ltnTimeStr}
                    onChange={(e) => setLtnTimeStr(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    {TEE_TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {formatTeeTimeLabel(time, isJapanese)}
                      </option>
                    ))}
                    {!TEE_TIME_OPTIONS.includes(ltnTimeStr) && (
                      <option value={ltnTimeStr}>
                        {formatTeeTimeLabel(ltnTimeStr, isJapanese)}
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* 번개 구분 2가지 선택 (4인 번개 vs 4인 이상 무제한 번개) */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '招集マッチ方式選択 (2種類) *' : '번개 방식 선택 (2가지) *'}</label>
                <div className="grid grid-cols-2 gap-2">
                  {/* [대표님 지시] 무조건 인원수 제한 없음(무제한)이 먼저 체크되고 기본 추천 */}
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
                      <span className="font-black text-xs text-stone-900">{isJapanese ? '👥 人数制限なし' : '👥 인원 수 제한 없음'}</span>
                      <span className="bg-amber-500 text-stone-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                        {isJapanese ? '基本おすすめ' : '기본 추천'}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium mt-1 leading-snug">
                      {isJapanese ? (
                        <>5人、10人、20人 自由参加<br /><strong className="text-emerald-800 font-bold">10人集まれば3組自動編成！</strong></>
                      ) : (
                        <>5인, 10인, 20인 자유 참가<br /><strong className="text-emerald-800 font-bold">10명 오면 3개 조 자동 편성!</strong></>
                      )}
                    </div>
                  </button>

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
                      <span className="font-black text-xs text-stone-900">{isJapanese ? '⛳ 4人ラウンド' : '⛳ 4명 라운드'}</span>
                      <span className="bg-stone-200 text-stone-700 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                        {isJapanese ? '単一4人' : '단일 4인'}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium mt-1 leading-snug">
                      {isJapanese ? (
                        <>最大4人締切 (1組)<br /><strong className="text-stone-700 font-bold">2人集まれば即時スタート！</strong></>
                      ) : (
                        <>최대 4인 마감 (1개 조)<br /><strong className="text-stone-700 font-bold">2명만 모여도 즉시 출발!</strong></>
                      )}
                    </div>
                  </button>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 font-medium leading-relaxed">
                  {isJapanese ? (
                    ltnLightningScope === 'MULTI_OPEN' ? (
                      <span>💡 <strong>人数制限なし (基本おすすめ)</strong>: 5人でも10人でも人数制限なく自由に参加でき、2人以上集まればいつでもルームリーダーが組別スコアボードラウンドを開始できます。(10人集まれば3チームに自動分割！)</span>
                    ) : (
                      <span>💡 <strong>4人招集マッチ</strong>: ちょうど1組(4人)のみ募集し、4人に満たなくても<strong>2人承認すればルームリーダーが即座にラウンドを開始</strong>できます。</span>
                    )
                  ) : (
                    ltnLightningScope === 'MULTI_OPEN' ? (
                      <span>💡 <strong>인원 수 제한 없음 (기본 추천)</strong>: 5명이든, 10명이든 인원 제한 없이 자유롭게 참가할 수 있으며, 2인 이상 모이면 언제든 방장이 조별 전광판 라운드를 시작할 수 있습니다. (10명 모이면 3팀으로 자동 분할!)</span>
                    ) : (
                      <span>💡 <strong>4인 번개</strong>: 딱 1개 조(4인)만 모집하며, 4인이 안 되어도 <strong>두 명만 수락하면 방장이 즉시 라운드를 시작</strong>할 수 있습니다.</span>
                    )
                  )}
                </div>
              </div>

              {/* 특정 1촌 지정 선택 (선택 사항) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '招待する仲間を指定 (任意)' : '초대할 1촌 지정 (선택)'}</label>
                  <span className="text-[10px] text-stone-500">{isJapanese ? '未選択時は全登録仲間に送信' : '미선택 시 전체 1촌에게 발송'}</span>
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
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '仲間への一言メッセージ' : '동반자 초대 한마디'}</label>
                <input
                  type="text"
                  value={ltnNotes}
                  onChange={(e) => setLtnNotes(e.target.value)}
                  placeholder={isJapanese ? '例: 午後涼しい時に18ホール楽しく回りましょう！' : '예: 오후 선선할 때 18홀 편하게 도실 1촌 수락해주세요!'}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-[50px] bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white font-black text-sm rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-emerald-600"
                >
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>{isJapanese ? '⚡ 仲間招集マッチオープン (承認受付開始)' : '⚡ 1촌 번개방 오픈하기 (수락 대기 시작)'}</span>
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
                <h3 className="font-extrabold text-base">{isJapanese ? '⚡ クラブ会員専用 招集マッチ開設' : '⚡ 클럽원 전용 번개 개설'}</h3>
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
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '対象クラブ' : '대상 클럽'}</label>
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
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '募集タイトル *' : '번개 모집 제목 *'}</label>
                <input
                  type="text"
                  value={clubFlashTitle}
                  onChange={(e) => setClubFlashTitle(e.target.value)}
                  placeholder={isJapanese ? '例: 今日14:00 2名急募！' : '예: 오늘 14:00 2명 급구!'}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-600"
                  required
                />
              </div>

              {/* 구장 선택 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '招集マッチコース選択 *' : '번개 라운드 구장 선택 *'}</label>
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
                    <span>{isJapanese ? '全国コース検索' : '전국 구장 검색'}</span>
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
                  {(() => {
                    const dual = getCourseDualName(clubFlashSelectedCourse, isJapanese);
                    const displayRegion = isJapanese
                      ? (clubFlashSelectedCourse.regionJa || clubFlashSelectedCourse.region)
                      : (clubFlashSelectedCourse.regionKo || clubFlashSelectedCourse.region);
                    return (
                      <>
                        <span className="flex items-center gap-1.5 min-w-0 pr-2">
                          <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                          <span className="truncate font-black flex items-center gap-1.5">
                            {dual.flag && <span>{dual.flag}</span>}
                            <span>{dual.primary}</span>
                            {dual.showSecondary && dual.secondary && (
                              <span className="text-[11px] text-amber-800 font-bold ml-1">{dual.secondary}</span>
                            )}
                          </span>
                        </span>
                        <span className="text-stone-500 shrink-0 text-[11px] ml-auto">
                          {displayRegion} · {isJapanese ? `${clubFlashSelectedCourse.totalHoles}ホール ▾` : `${clubFlashSelectedCourse.totalHoles}홀 ▾`}
                        </span>
                      </>
                    );
                  })()}
                </button>
              </div>

              {/* 일시 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '日付' : '일자'}</label>
                  <select
                    value={clubFlashDate}
                    onChange={(e) => setClubFlashDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                  >
                    <option value="오늘">{isJapanese ? '今日' : '오늘'}</option>
                    <option value="내일">{isJapanese ? '明日' : '내일'}</option>
                    <option value="이번 주 토요일">{isJapanese ? '今週土曜日' : '이번 주 토요일'}</option>
                    <option value="이번 주 일요일">{isJapanese ? '今週日曜日' : '이번 주 일요일'}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-stone-800">{isJapanese ? '時間' : '시간'}</label>
                  <select
                    value={clubFlashTime}
                    onChange={(e) => setClubFlashTime(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {TEE_TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>
                        {formatTeeTimeLabel(time, isJapanese)}
                      </option>
                    ))}
                    {!TEE_TIME_OPTIONS.includes(clubFlashTime) && (
                      <option value={clubFlashTime}>
                        {formatTeeTimeLabel(clubFlashTime, isJapanese)}
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* 클럽 번개 구분 2가지 선택 (4인 번개 vs 4인 이상 무제한 번개) */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? 'クラブ招集マッチ方式選択 (2種類) *' : '클럽 번개 방식 선택 (2가지) *'}</label>
                <div className="grid grid-cols-2 gap-2">
                  {/* [대표님 지시] 무조건 인원수 제한 없음(무제한)이 먼저 체크되고 기본 추천 */}
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
                      <span className="font-black text-xs text-stone-900">{isJapanese ? '👥 人数制限なし' : '👥 인원 수 제한 없음'}</span>
                      <span className="bg-amber-500 text-stone-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                        {isJapanese ? '基本おすすめ' : '기본 추천'}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium mt-1 leading-snug">
                      {isJapanese ? (
                        <>5人、10人、20人 自由参加<br /><strong className="text-amber-900 font-bold">10人来れば3組自動編成！</strong></>
                      ) : (
                        <>5인, 10인, 20인 자유 참가<br /><strong className="text-amber-900 font-bold">10명 오면 3개 조 자동 편성!</strong></>
                      )}
                    </div>
                  </button>

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
                      <span className="font-black text-xs text-stone-900">{isJapanese ? '⛳ 4人ラウンド' : '⛳ 4명 라운드'}</span>
                      <span className="bg-stone-200 text-stone-700 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                        {isJapanese ? '単一4人' : '단일 4인'}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium mt-1 leading-snug">
                      {isJapanese ? (
                        <>最大4人締切 (1組)<br /><strong className="text-stone-700 font-bold">2人集まれば即時スタート！</strong></>
                      ) : (
                        <>최대 4인 마감 (1개 조)<br /><strong className="text-stone-700 font-bold">2명만 모여도 즉시 출발!</strong></>
                      )}
                    </div>
                  </button>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-950 font-medium leading-relaxed">
                  {isJapanese ? (
                    clubFlashLightningScope === 'MULTI_OPEN' ? (
                      <span>💡 <strong>人数制限なし (基本おすすめ)</strong>: 5人でも10人でも20人でも制限なく会員が参加でき、集まった人数に合わせて2〜5組に自動編成されて電光掲示板ルームが始まります。(10人集まれば3チームに自動分割！)</span>
                    ) : (
                      <span>💡 <strong>4人招集マッチ</strong>: ちょうど1組(4人)のみ募集し、4人に満たなくても<strong>2人集まれば主催者が即座にラウンドを開始</strong>できます。</span>
                    )
                  ) : (
                    clubFlashLightningScope === 'MULTI_OPEN' ? (
                      <span>💡 <strong>인원 수 제한 없음 (기본 추천)</strong>: 5명이든, 10명이든, 20명이든 인원 제한 없이 회원이 참가하며, 모인 인원에 맞춰 2~5개 조로 자동 편성되어 전광판 룸이 시작됩니다. (10명 모이면 3팀으로 자동 분할!)</span>
                    ) : (
                      <span>💡 <strong>4인 번개</strong>: 딱 1개 조(4인)만 모집하며, 4인이 안 되어도 <strong>두 명만 모이면 번개 친 사람(방장)이 즉시 라운드를 시작</strong>할 수 있습니다.</span>
                    )
                  )}
                </div>
              </div>

              {/* 안내글 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">{isJapanese ? 'クラブ会員案内メッセージ' : '클럽원 안내 메시지'}</label>
                <input
                  type="text"
                  value={clubFlashNotes}
                  onChange={(e) => setClubFlashNotes(e.target.value)}
                  placeholder={isJapanese ? '例: クラブ正会員のマナーラウンド 一緒に楽しみましょう！' : '예: 클럽 정회원 매너 라운드 함께해요!'}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-[50px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-sm rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-amber-500"
                >
                  <Zap className="w-4 h-4 text-stone-950 fill-stone-950" />
                  <span>{isJapanese ? '⚡ クラブ専用 招集マッチ登録' : '⚡ 클럽 전용 번개 모집 등록'}</span>
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
                    <span>{isJapanese ? '招集マッチ 組編成＆席の入れ替え' : '번개 조 편성 & 자리 맞바꾸기'}</span>
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black px-2 py-0.5 rounded-full">
                      {isJapanese
                        ? `計 ${previewRoom.groups.length}組 (${previewRoom.groups.reduce((s, g) => s + g.players.length, 0)}人)`
                        : `총 ${previewRoom.groups.length}개 조 (${previewRoom.groups.reduce((s, g) => s + g.players.length, 0)}명)`}
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 font-semibold mt-0.5">
                    📍 {previewRoom.courseName} · {isJapanese ? '総括リーダー:' : '총괄 방장:'} <strong className="text-stone-900">{previewRoom.hostName}</strong>
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
                <span className="bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded text-[10px] font-black">
                  {isJapanese ? '案内' : '안내'}
                </span>
                <span>
                  {isJapanese ? (
                    <>👑 招集マッチ総括リーダー(<strong>{previewRoom.hostName}</strong>)は<strong>1組1番(1組リーダー)</strong>として固定配置されました。</>
                  ) : (
                    <>👑 번개 총괄 방장(<strong>{previewRoom.hostName}</strong>)은 <strong>1조 1번(1조 조장)</strong>으로 고정 배치되었습니다.</>
                  )}
                </span>
              </div>
              <div className="flex items-start gap-2 text-stone-700 text-[11px] pt-1 border-t border-amber-200/60">
                <ArrowLeftRight className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>{isJapanese ? '現場組員入れ替え(Swap)' : '현장 조원 맞바꾸기(Swap)'}</strong>: {isJapanese ? '選手をタップした後、別の選手をタップすると2人の組が即座に入れ替わります。' : '선수를 누른 후 다른 선수를 누르면 두 사람의 조가 즉시 맞바뀝니다.'}
                  {selectedSwapPlayer && (
                    <span className="text-amber-900 font-black ml-1 bg-amber-200/80 px-1.5 py-0.5 rounded">
                      {isJapanese
                        ? `👉 現在 '${selectedSwapPlayer.playerName}' 選択中 - 入れ替える選手をタップしてください！`
                        : `👉 현재 '${selectedSwapPlayer.playerName}' 선택됨 - 맞바꿀 선수를 터치하세요!`}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* 카톡 / 밴드 단톡방 공유 복사 바 */}
            {isJapanese ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSharePreviewRoomKakao}
                  className="w-full min-h-[46px] bg-[#06C755] hover:bg-[#05b34c] text-white border border-[#05b34c] font-black text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                >
                  <Share2 className="w-4 h-4 text-white" />
                  <span>📋 全組編成 LINE告知文を送る</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSharePreviewRoomKakao}
                  className="w-full min-h-[46px] bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] border border-[#E6CF00] font-black text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                >
                  <Share2 className="w-4 h-4 text-[#191919]" />
                  <span>📋 전체 조 편성 카톡 공지 복사</span>
                </button>
              </div>
            )}

            {/* 조 목록 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[46vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {previewRoom.groups.map((group, gIdx) => (
                  <div
                    key={group.groupNumber}
                    className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-stone-200/70 pb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs text-stone-900">{group.name}</span>
                        <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-1">
                          <span>🚩</span>
                          <span>
                            {ClubStorage.getGroupStartHole(gIdx, previewRoom.selectedCourseLetters, group.startCourseLetter)} {isJapanese ? 'ティーショット出発' : '티샷 출발'}
                          </span>
                        </span>
                      </div>
                      <span className="text-[11px] font-black text-stone-500">
                        {isJapanese ? `${group.players.length}人割当` : `${group.players.length}명 배정`}
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
                                  {isJapanese ? '👑 リーダー' : '👑 조장'}
                                </span>
                              )}
                              {isHostPlayer && (
                                <span className="bg-stone-900 text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded shrink-0">
                                  {isJapanese ? '⭐ 主催' : '⭐ 방장'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-stone-400 font-bold shrink-0">
                              {isSelected
                                ? (isJapanese ? '選択中 (タップで解除)' : '선택됨 (터치해 취소)')
                                : (isJapanese ? 'タップで入れ替え' : '터치해 맞바꾸기')}
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
                {isJapanese ? '閉じる / 募集維持' : '닫기 / 모집 유지'}
              </button>
              <button
                type="button"
                onClick={handleConfirmAndStartRound}
                className="w-2/3 min-h-[50px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-emerald-500"
              >
                <Play className="w-5 h-5 text-white fill-white" />
                <span>{isJapanese ? '🚀 組編成確定＆電光掲示板スタート！' : '🚀 조 편성 확정 & 전광판 시작!'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏆 대회 개설 완료 축하 및 회원 안내 / 관리실 입장 모달 (대표님 요청 표준) */}
      {/* ========================================================================= */}
      {createdSuccessRoom && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-stone-200 overflow-hidden max-h-[92vh] flex flex-col">
            {/* 상단 축하 헤더 */}
            <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-stone-900 text-white p-5 shrink-0 relative">
              <button
                type="button"
                onClick={() => setCreatedSuccessRoom(null)}
                className="absolute top-4 right-4 text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="bg-yellow-400 text-stone-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                  <span>{isJapanese ? '開設完了' : '개설 완료'}</span>
                </span>
                <span className="text-xs text-purple-200 font-bold">{isJapanese ? '幹事管制センター' : '총무 관제 센터'}</span>
              </div>
              <h3 className="font-black text-lg sm:text-xl leading-tight mt-1.5 text-white">
                {isJapanese ? '大会が正常に開設されました！ 🎉' : '대회가 성공적으로 개설되었습니다! 🎉'}
              </h3>
              <p className="text-xs text-purple-200/90 mt-1 font-medium leading-relaxed">
                {isJapanese ? (
                  <>
                    さあ、下の<strong className="text-yellow-300">[ステップ1] LINE招待状</strong>をグループに送信し、{' '}
                    <strong className="text-yellow-300">[ステップ2] 管理室</strong>で参加者確認と組編成を進めてください。
                  </>
                ) : (
                  <>
                    이제 아래 <strong className="text-yellow-300">[1단계] 카톡 초대장</strong>을 단톡방에 전송하고,{' '}
                    <strong className="text-yellow-300">[2단계] 관리실</strong>에서 참가자 및 조 편성을 진행하세요.
                  </>
                )}
              </p>
            </div>

            {/* 본문 콘텐츠 */}
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* 대회 핵심 요약 카드 */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate">{createdSuccessRoom.title}</span>
                  </span>
                  <span className="text-[10px] font-black bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-md shrink-0">
                    {isJapanese
                      ? `${createdSuccessRoom.targetTotalPlayers || 30}人規模`
                      : `${createdSuccessRoom.targetTotalPlayers || 30}명 규모`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-purple-200/60">
                  <div className="flex items-center gap-1 text-stone-700 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{createdSuccessRoom.courseName} ({createdSuccessRoom.totalHoles}{isJapanese ? 'ホール' : '홀'})</span>
                  </div>
                  <div className="flex items-center gap-1 text-stone-700 font-bold">
                    <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      {createdSuccessRoom.entryFee
                        ? `${createdSuccessRoom.entryFee.toLocaleString()}${isJapanese ? '円' : '원'}`
                        : (isJapanese ? '参加費無料' : '참가비 무료')}
                    </span>
                  </div>
                </div>
                {createdSuccessRoom.bankAccount && (
                  <div className="bg-white/90 p-2 rounded-xl border border-purple-100 text-[11px] text-stone-600 font-bold">
                    {isJapanese ? '🏦 振込口座:' : '🏦 입금 계좌:'} <span className="text-stone-900 font-black">{createdSuccessRoom.bankAccount}</span>
                  </div>
                )}
              </div>

              {/* [동선 1단계] 카카오톡 단톡방에 초대장 보내기 */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 text-xs font-black flex items-center justify-center">
                      1
                    </span>
                    <span>{isJapanese ? '会員にお知らせ (LINEグループ)' : '회원들에게 알리기 (카카오톡 단톡방)'}</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    {isJapanese ? 'ワンタッチコピー' : '원터치 복사'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
                  {isJapanese
                    ? '下の黄色いボタンを押すと、グループ用告知文と参加申込リンクがコピーされます。LINEグループにそのままペーストしてください！'
                    : '아래 노란색 버튼을 누르면 단톡방용 공지문과 참가 신청 링크가 복사됩니다. 카톡 단톡방에 붙여넣기 하세요!'}
                </p>

                {/* 카카오톡 복사 대형 버튼 (Senior Touch) */}
                <button
                  type="button"
                  onClick={handleCopySuccessInvite}
                  className="w-full min-h-[50px] bg-[#FEE500] hover:bg-[#FDD835] active:scale-98 text-[#191919] font-black text-sm rounded-2xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer border border-[#E6CF00]"
                >
                  {copiedSuccessInvite ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                      <span>{isJapanese ? '✅ コピー完了！ LINEグループにそのままペーストしてください' : '✅ 복사 완료! 카톡 단톡방에 바로 붙여넣기 하세요'}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-5 h-5 text-[#191919]" />
                      <span>{isJapanese ? '📢 LINEグループに招待状を送る (文面コピー)' : '📢 카카오톡 단톡방에 초대장 보내기 (문구 복사)'}</span>
                    </>
                  )}
                </button>

                {/* 초대장 문구 미리보기 상자 */}
                <div className="bg-white rounded-xl p-2.5 border border-stone-200 text-[11px] text-stone-600 font-medium whitespace-pre-wrap max-h-28 overflow-y-auto leading-relaxed">
                  {ClubStorage.generateKakaoShareText(createdSuccessRoom)}
                </div>
              </div>

              {/* [동선 2단계] 대회 관리실 & 조 편성 전광판 바로가기 */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-700 text-white text-xs font-black flex items-center justify-center">
                      2
                    </span>
                    <span>{isJapanese ? '大会管理室＆組編成電光掲示板に入場' : '대회 관리실 & 조 편성 전광판 입장'}</span>
                  </span>
                  <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full">
                    {isJapanese ? '幹事専用管理' : '총무 전용 관리'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
                  {isJapanese
                    ? '会員のリアルタイム受付状況、会費入金チェック、ゲスト追加、そして最終組の自動割り振りを進めます。'
                    : '회원들의 실시간 접수 현황, 회비 입금 체크, 게스트 추가, 그리고 최종 30명 8개 조 자동 배정을 진행합니다.'}
                </p>

                {/* 관리실 바로가기 버튼 */}
                <button
                  type="button"
                  onClick={() => {
                    const id = createdSuccessRoom.id;
                    setCreatedSuccessRoom(null);
                    router.push(`/club/${id}`);
                  }}
                  className="w-full min-h-[50px] bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 active:scale-98 text-white font-black text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-purple-600"
                >
                  <Trophy className="w-5 h-5 text-yellow-300" />
                  <span>{isJapanese ? '📡 大会管理室＆組編成電光掲示板へ移動' : '📡 대회 관리실 & 조 편성 전광판 바로가기'}</span>
                  <ArrowRight className="w-4 h-4 text-purple-200" />
                </button>
              </div>

              {/* 총무 현장 가이드 안내 팁 */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 space-y-1.5 text-xs">
                <div className="font-black text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isJapanese ? '幹事様のための自動化運営ヒント' : '총무님을 위한 자동화 운영 팁'}</span>
                </div>
                <ul className="text-[11px] text-stone-700 space-y-1 list-disc list-inside leading-relaxed font-medium">
                  {isJapanese ? (
                    <>
                      <li><strong>会員申込</strong>: 会員がLINEリンクをタップするかParkOnに接続すると、本人の名前で1秒で申込完了し待機リストに登録されます。</li>
                      <li><strong>ゲスト追加</strong>: 管理室で <code>[➕ ゲスト/現場追加]</code> から外部招待客や当日来場者を即座に追加できます。</li>
                      <li><strong>組編成</strong>: 受付締切後、管理室で <code>[🎲 スマート組編成]</code> を押すと最も公平に自動組分けされます。</li>
                    </>
                  ) : (
                    <>
                      <li><strong>회원 신청</strong>: 회원들이 카톡 링크를 누르거나 파크골프 올인원에 접속하면 본인 이름으로 1초 만에 신청되어 대기 명단에 쌓입니다.</li>
                      <li><strong>게스트 추가</strong>: 관리실에서 <code>[➕ 게스트/현장 추가]</code>로 외부 초청자나 현장 방문객을 즉시 명단에 추가할 수 있습니다.</li>
                      <li><strong>조 편성</strong>: 접수 마감 후 관리실에서 <code>[🎲 스마트 조 편성]</code>을 누르면 30명 기준 8개 조(4인 6개 + 3인 2개)로 가장 공정하게 자동 분배됩니다.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* 하단 닫기 바 */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setCreatedSuccessRoom(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-black rounded-xl text-xs transition cursor-pointer"
              >
                {isJapanese ? '閉じる (大会一覧を見る)' : '닫기 (대회 목록 보기)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

