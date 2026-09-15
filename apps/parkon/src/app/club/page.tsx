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
} from 'lucide-react';
import { ClubEventRoom, ParkGolfClub, ClubMember } from '@/types/club';
import { Course } from '@/types/parkon';
import { ClubStorage } from '@/lib/clubStorage';
import { ParkOnStorage } from '@/lib/storage';
import { DEFAULT_COURSES } from '@/lib/defaultCourses';
import { getDefaultSelfName } from '@/lib/playerUtils';

const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export default function ClubGatheringHomePage() {
  const router = useRouter();

  // 3대 전문 허브 탭: 'CLUBS' (내 소속 클럽) | 'TOURNAMENTS' (새 대회 개설) | 'LIVE_EVENTS' (대회 전광판 & 리더보드)
  const [activeHubTab, setActiveHubTab] = useState<'CLUBS' | 'TOURNAMENTS' | 'LIVE_EVENTS'>('CLUBS');

  // 전국 구장 목록 & 구장 검색 모달 상태
  const [allCourses, setAllCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [showCourseSearchModal, setShowCourseSearchModal] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [courseRegionFilter, setCourseRegionFilter] = useState('전체');
  const [tempSelectedCourseId, setTempSelectedCourseId] = useState<string | null>(null);

  // 안내 토스트 메시지
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ========================================================
  // 1. [클럽 관리] 상태
  // ========================================================
  const [clubs, setClubs] = useState<ParkGolfClub[]>([]);
  const [myClubIds, setMyClubIds] = useState<string[]>([]);
  const [showCreateClubModal, setShowCreateClubModal] = useState(false);
  const [showClubBrowseModal, setShowClubBrowseModal] = useState(false);
  const [selectedClubDetail, setSelectedClubDetail] = useState<ParkGolfClub | null>(null);

  // 회장/총무 클럽 관리 모달 (가입 승인 대기 탭 / 회원 명부 탭)
  const [managingClub, setManagingClub] = useState<ParkGolfClub | null>(null);
  const [managingClubTab, setManagingClubTab] = useState<'PENDING' | 'MEMBERS'>('PENDING');

  // 클럽 가입 신청 모달 상태
  const [applyingClub, setApplyingClub] = useState<ParkGolfClub | null>(null);
  const [applicantName, setApplicantName] = useState('홍길동(본인)');
  const [applicantPhone, setApplicantPhone] = useState('010-9988-7766');
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
  // 2. [대회 개설 & 방 목록] 상태
  // ========================================================
  const [rooms, setRooms] = useState<ClubEventRoom[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [justCreatedId, setJustCreatedId] = useState<string | null>(null);

  // 대회 개설 서브 팝업 모달 상태
  const [showCreateFeeModal, setShowCreateFeeModal] = useState(false);
  const [showCreateGameModeModal, setShowCreateGameModeModal] = useState(false);
  const [showCreateRulesModal, setShowCreateRulesModal] = useState(false);
  const [customGraceMonths, setCustomGraceMonths] = useState<number>(3);
  const [customConcede, setCustomConcede] = useState<string>('1클럽 샤프트 이내 (약 80cm)');

  // 새 대회 폼 상태
  const [tournamentClubId, setTournamentClubId] = useState<string>('');
  const [title, setTitle] = useState('구미 동락 파크골프 클럽 9월 정기 월례회');
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

  // 초기 로딩
  useEffect(() => {
    refreshAllData();

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const joinId = urlParams.get('join');
      if (joinId) {
        const target = ClubStorage.getClubById(joinId);
        if (target) {
          setApplyingClub(target);
          showToast(`📩 '${target.name}' 클럽 가입 초청장으로 접속하셨습니다. 가입 신청을 진행하세요!`);
        }
      }
    }
  }, []);

  const refreshAllData = () => {
    setRooms(ClubStorage.getAllRooms());
    setClubs(ClubStorage.getAllClubs());
    setMyClubIds(ClubStorage.getMyClubIds());

    const list = ParkOnStorage.getAllCourses();
    setAllCourses(list);
    const homeCourseId = ParkOnStorage.getHomeCourseId();
    if (homeCourseId && list.some((c) => c.id === homeCourseId)) {
      setSelectedCourseId(homeCourseId);
      setNewClubHomeCourseId(homeCourseId);
    } else if (list.length > 0) {
      setSelectedCourseId(list[0].id);
      setNewClubHomeCourseId(list[0].id);
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
    handleCourseChange(courseId);
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

  // ========================================================
  // [대회 개설 핸들러]
  // ========================================================
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const course = allCourses.find((c) => c.id === selectedCourseId) || allCourses[0] || DEFAULT_COURSES[0];
    const linkedClub = clubs.find((c) => c.id === tournamentClubId);

    const newRoom = ClubStorage.createRoom({
      title: title || `${course.name} 정기 모임`,
      courseId: course.id,
      courseName: course.name,
      hostName: hostName || '총무',
      selectedCourseLetters: selectedLetters,
      groupCount: Number(groupCount) || 5,
      targetTotalPlayers: targetPlayers,
      clubId: linkedClub?.id,
      clubName: linkedClub?.name,
      entryFee: Number(entryFee) || 0,
      bankAccount: bankAccount.trim(),
      gameMode,
      gameRuleNotes: gameRuleNotes.trim(),
    });

    setRooms(ClubStorage.getAllRooms());
    setShowCreateModal(false);
    setJustCreatedId(newRoom.id);
    showToast(`🏆 '${newRoom.title}' 대회가 개설되었습니다! 카톡에 공유하세요.`);
  };

  // 클럽 홈에서 '이 클럽 대회 개설' 클릭 시
  const handleOpenTournamentForClub = (club: ParkGolfClub) => {
    setTournamentClubId(club.id);
    setTitle(`${club.name} 정기 월례회`);
    if (club.homeCourseId) {
      handleCourseChange(club.homeCourseId);
    }
    setHostName(club.managerName || '총무');
    setActiveHubTab('TOURNAMENTS');
    setShowCreateModal(true);
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
    if (confirm(`'${club.name}' 클럽에서 탈퇴하시겠습니까?`)) {
      ClubStorage.leaveClub(club.id, selfName);
      refreshAllData();
      showToast(`'${club.name}' 클럽에서 탈퇴하였습니다.`);
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

      {/* 1촌 친목 번개 이관 안내 배너 */}
      <div className="p-3 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-purple-500/10 border border-amber-300/60 rounded-2xl flex items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">⚡</span>
          <p className="text-stone-800 font-bold leading-tight text-[11px]">
            개인 및 지인 간 4인 친목 번개는 <strong className="text-emerald-800">[나의 연대기 &gt; 1촌 네트워크]</strong>의 <strong className="text-amber-800">[1촌 번개 띄우기]</strong>를 이용해주세요!
          </p>
        </div>
        <Link
          href="/chronicle"
          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black rounded-xl text-[11px] shadow-2xs shrink-0 transition"
        >
          1촌 번개 ▶
        </Link>
      </div>

      {/* 2. 클럽 & 대회 전문 3대 핵심 탭 (내 소속 클럽 / 새 대회 개설 / 대회 전광판) */}
      <section className="bg-white p-2 rounded-2xl border-2 border-stone-200 shadow-sm grid grid-cols-3 gap-1.5">
        {/* 버튼 1: 내 소속 클럽 */}
        <button
          type="button"
          onClick={() => setActiveHubTab('CLUBS')}
          className={`py-3 px-1 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
            activeHubTab === 'CLUBS'
              ? 'bg-gradient-to-b from-emerald-600 to-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-400/40'
              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
          }`}
        >
          <Building2 className={`w-5 h-5 ${activeHubTab === 'CLUBS' ? 'text-amber-300' : 'text-emerald-700'}`} />
          <span className="whitespace-nowrap font-extrabold text-[12px]">내 소속 클럽</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeHubTab === 'CLUBS' ? 'bg-emerald-950 text-amber-300' : 'bg-stone-200 text-stone-600'
            }`}
          >
            {myClubs.length}개 소속
          </span>
        </button>

        {/* 버튼 2: 새 대회 개설 */}
        <button
          type="button"
          onClick={() => setActiveHubTab('TOURNAMENTS')}
          className={`py-3 px-1 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
            activeHubTab === 'TOURNAMENTS'
              ? 'bg-gradient-to-b from-purple-700 to-purple-900 text-white border-purple-950 shadow-md ring-2 ring-purple-400/40'
              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
          }`}
        >
          <Sparkles className={`w-5 h-5 ${activeHubTab === 'TOURNAMENTS' ? 'text-yellow-300' : 'text-purple-700'}`} />
          <span className="whitespace-nowrap font-extrabold text-[12px]">새 대회 개설</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeHubTab === 'TOURNAMENTS' ? 'bg-purple-950 text-yellow-300' : 'bg-stone-200 text-stone-600'
            }`}
          >
            신페리오·샷건
          </span>
        </button>

        {/* 버튼 3: 대회 전광판 & 리더보드 */}
        <button
          type="button"
          onClick={() => setActiveHubTab('LIVE_EVENTS')}
          className={`py-3 px-1 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1 cursor-pointer border ${
            activeHubTab === 'LIVE_EVENTS'
              ? 'bg-gradient-to-b from-amber-500 to-amber-700 text-stone-950 border-amber-800 shadow-md ring-2 ring-amber-300/60'
              : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
          }`}
        >
          <Trophy className={`w-5 h-5 ${activeHubTab === 'LIVE_EVENTS' ? 'text-stone-950 fill-stone-950' : 'text-amber-600'}`} />
          <span className="whitespace-nowrap font-extrabold text-[12px]">대회 전광판</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeHubTab === 'LIVE_EVENTS' ? 'bg-amber-950 text-amber-300' : 'bg-stone-200 text-stone-600'
            }`}
          >
            {rooms.length}개 방
          </span>
        </button>
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
              const myMemberInfo =
                club.members.find((m) => m.name.includes('본인')) || club.members[0];
              const isExecutive =
                myMemberInfo?.role === 'PRESIDENT' || myMemberInfo?.role === 'MANAGER';
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
                        {isExecutive ? (
                          <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>👑</span>
                            <span>{myMemberInfo?.role === 'PRESIDENT' ? '회장' : '총무'} (집행부 관리 권한)</span>
                          </span>
                        ) : (
                          <span className="bg-stone-100 text-stone-700 border border-stone-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>👤</span>
                            <span>일반 회원</span>
                          </span>
                        )}
                        <span className="text-[11px] text-stone-500 font-bold">
                          정회원 {club.memberCount}명
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
                        onClick={() => setSelectedClubDetail(club)}
                        className="text-stone-600 hover:text-stone-900 px-2.5 py-1.5 rounded-xl text-xs font-bold border border-stone-200 bg-stone-50 cursor-pointer shrink-0"
                      >
                        회원 명부
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

                  {/* 권한별 액션 버튼 영역 */}
                  {isExecutive ? (
                    // 1. 회장·총무 (집행부): 대회 개설 권한, 회원 승인 관리, 번개 모임, 카톡 초청장
                    <div className="space-y-2 pt-1 border-t border-stone-200">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenTournamentForClub(club)}
                          className="py-2.5 px-3 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trophy className="w-4 h-4 text-yellow-300" />
                          <span>🏆 이 클럽 대회 개설</span>
                        </button>

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
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleCreateTournamentForClub(club)}
                          className="py-2.5 px-3 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trophy className="w-3.5 h-3.5 text-yellow-300" />
                          <span>🏆 새 대회/월례회 개설</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleCopyClubInvite(e, club)}
                          className={`py-2 px-3 active:scale-95 text-xs font-black rounded-xl transition flex items-center justify-center gap-1 cursor-pointer border ${
                            copiedClubId === club.id
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300 animate-pulse'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
                          }`}
                        >
                          {copiedClubId === club.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                              <span>✅ 초청장 복사 완료!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5 text-stone-700" />
                              <span>📢 카톡 가입 초청장 복사</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 2. 일반 회원: 대회 전광판 확인, 회원 명부 확인
                    <div className="space-y-2 pt-1 border-t border-stone-200">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveHubTab('LIVE_EVENTS');
                            showToast(`📡 '${club.name}'의 진행 중인 대회 전광판으로 이동했습니다.`);
                          }}
                          className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-950 text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-purple-200"
                        >
                          <Trophy className="w-4 h-4 text-purple-700" />
                          <span>대회 전광판 보기</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedClubDetail(club)}
                          className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-stone-300"
                        >
                          <Users className="w-4 h-4 text-stone-600" />
                          <span>👥 회원 명부 ({club.memberCount}명)</span>
                        </button>
                      </div>

                      {/* 대회 및 친목 번개 안내 뱃지 */}
                      <div className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 flex items-center gap-1.5 text-[11px] text-stone-500 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>공식 월례회 개설은 집행부가 진행하며, 개인 4인 친목 번개는 [1촌 네트워크]에서 자유롭게 여실 수 있습니다.</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 탭 2: [새 대회 / 정기 월례회 개설 센터] */}
      {/* ========================================================================= */}
      {activeHubTab === 'TOURNAMENTS' && (
        <div className="space-y-3 animate-fadeIn">
          {/* 총무/주최자 대회 개설 배너 */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-emerald-900 text-white rounded-3xl p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                🏆 클럽 공식 정기대회 · 월례회 개설 OS
              </span>
              <span className="text-[11px] text-purple-200 font-bold">신페리오 · 샷건 동시 티오프</span>
            </div>
            <div>
              <h2 className="text-lg font-black leading-snug">
                16명부터 144명까지!<br />카톡 링크 하나로 전원 동시 입장
              </h2>
              <p className="text-xs text-purple-100/90 mt-1.5 leading-relaxed">
                총무님이 대회를 개설하고 단체 카톡방에 공유하면, 각 조 회원들이 원터치로 입장하여
                실시간 조별 스코어와 전체 리더보드가 스마트폰에 동시 집계됩니다.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="w-full min-h-[52px] bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-purple-950 font-black text-sm rounded-2xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer border border-yellow-300"
              >
                <Sparkles className="w-5 h-5 text-purple-950" />
                <span>+ 공식 대회 / 월례회 개설하기 (신페리오 &amp; 샷건)</span>
              </button>
            </div>
          </div>

          {/* 원클릭 대회 퀵 프리셋 (신속 개설 지원) */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs font-black text-stone-900">클럽 규모별 신속 개설 프리셋</h3>
              </div>
              <span className="text-[10px] text-stone-400 font-bold">터치 시 자동 조편성</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setTargetPlayers(16);
                  setGroupCount(4);
                  setSelectedLetters(['A', 'B']);
                  setShowCreateModal(true);
                }}
                className="p-3 bg-purple-50/70 hover:bg-purple-100 border border-purple-200 rounded-2xl text-left transition active:scale-95 cursor-pointer"
              >
                <div className="text-[10px] font-black text-purple-700">소규모 정기 월례회</div>
                <div className="text-sm font-black text-stone-900 mt-0.5">4개 조 (16명)</div>
                <div className="text-[10px] text-stone-500 mt-1">A, B 2개 코스 (18홀)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetPlayers(32);
                  setGroupCount(8);
                  setSelectedLetters(['A', 'B', 'C', 'D']);
                  setShowCreateModal(true);
                }}
                className="p-3 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-left transition active:scale-95 cursor-pointer"
              >
                <div className="text-[10px] font-black text-emerald-700">표준 클럽 정기대회</div>
                <div className="text-sm font-black text-stone-900 mt-0.5">8개 조 (32명)</div>
                <div className="text-[10px] text-stone-500 mt-1">A, B, C, D 4개 코스 (36홀)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetPlayers(64);
                  setGroupCount(16);
                  setShowCreateModal(true);
                }}
                className="p-3 bg-blue-50/70 hover:bg-blue-100 border border-blue-200 rounded-2xl text-left transition active:scale-95 cursor-pointer"
              >
                <div className="text-[10px] font-black text-blue-700">클럽 친선 챔피언십</div>
                <div className="text-sm font-black text-stone-900 mt-0.5">16개 조 (64명)</div>
                <div className="text-[10px] text-stone-500 mt-1">동시 티오프 샷건 모드</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetPlayers(144);
                  setGroupCount(36);
                  setShowCreateModal(true);
                }}
                className="p-3 bg-amber-50/70 hover:bg-amber-100 border border-amber-200 rounded-2xl text-left transition active:scale-95 cursor-pointer"
              >
                <div className="text-[10px] font-black text-amber-800">전국 연합 메이저 대회</div>
                <div className="text-sm font-black text-stone-900 mt-0.5">36개 조 (144명)</div>
                <div className="text-[10px] text-stone-500 mt-1">구장 전체 샷건 동시 스타트</div>
              </button>
            </div>
          </div>

          {/* 파크골프 공식 경기 룰 & 신페리오 안내 가이드 */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
              <span>📖</span>
              <span>파크온 대회 운영 자동화 시스템 가이드</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                <div className="font-black text-stone-900 flex items-center gap-1">
                  <span>🎯</span>
                  <span>신페리오(New Perio) 자동 핸디캡 산출</span>
                </div>
                <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
                  18홀 중 12개 히든홀을 무작위 추첨하여 핸디캡을 자동 계산합니다. 초보자도 실력자와 대등하게 우승 경쟁을 펼칠 수 있습니다.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                <div className="font-black text-stone-900 flex items-center gap-1">
                  <span>⏰</span>
                  <span>동시 티오프 샷건(Shot-gun) 스타트</span>
                </div>
                <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
                  모든 조가 서로 다른 홀에서 일제히 티오프하여 경기를 시작하고 동시에 종료할 수 있어 대기 시간을 획기적으로 줄입니다.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                <div className="font-black text-stone-900 flex items-center gap-1">
                  <span>🎁</span>
                  <span>자동 시상 산출 &amp; 행운권 추첨 룰렛</span>
                </div>
                <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
                  우승, 준우승, 3위, 메달리스트, 롱기스트, 니어리스트, 행운상, 22위 오리상을 시스템이 1초 만에 자동 선별하며 스마트폰 룰렛 추첨을 지원합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 탭 3: [진행 중인 대회 & 디지털 전광판] */}
      {/* ========================================================================= */}
      {activeHubTab === 'LIVE_EVENTS' && (
        <div className="space-y-3 animate-fadeIn">
          {/* 전광판 헤더 배너 */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-purple-900 text-white rounded-3xl p-5 shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                📡 실시간 디지털 리더보드 전광판
              </span>
              <span className="text-xs text-amber-200 font-bold">동시 {rooms.length}개 대회 라이브</span>
            </div>
            <h2 className="text-base font-black">클럽 대회 전광판 &amp; 실시간 갤러리</h2>
            <p className="text-xs text-amber-100 leading-relaxed font-medium">
              참가 중인 대회의 실시간 조별 스코어, 팀/개인 순위 변동, 홀별 성적 및 시상식 결과를 즉시 확인하세요.
            </p>
          </div>

          {/* 현재 개설된 대회 방 목록 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-black text-stone-800 px-1">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>개설된 클럽 대회 방 ({rooms.length}개)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveHubTab('TOURNAMENTS');
                  setShowCreateModal(true);
                }}
                className="text-purple-700 hover:text-purple-900 font-black text-xs cursor-pointer flex items-center gap-0.5"
              >
                <span>+ 새 대회 개설</span>
              </button>
            </div>

            {rooms.length === 0 && (
              <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <Users className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-base text-stone-900">진행 중인 대회가 없습니다</h3>
                  <p className="text-xs text-stone-500 font-semibold leading-relaxed">
                    클럽 월례회나 친선 대회를 새로 개설하여 회원들을 초대해보세요!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveHubTab('TOURNAMENTS');
                    setShowCreateModal(true);
                  }}
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black rounded-xl shadow-sm transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-purple-300" />
                  <span>새 대회 방 개설하기</span>
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
                        {room.clubName && (
                          <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-md">
                            🏛️ {room.clubName}
                          </span>
                        )}
                        <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                          {room.groups.length}개 조 ({targetCapacity}인 규모)
                        </span>
                        <span className="bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md">
                          {ClubStorage.getGameModeInfo(room.gameMode).badge}
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
                <label className="text-xs font-extrabold text-stone-800">홈 구장 선택</label>
                <select
                  value={newClubHomeCourseId}
                  onChange={(e) => setNewClubHomeCourseId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
                >
                  {allCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.region})
                    </option>
                  ))}
                </select>
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

            {/* 하단 닫기 바 */}
            <div className="p-3 border-t border-stone-200 flex justify-end bg-stone-50">
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
              {/* 주최 클럽 선택 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">주최 클럽 선택</label>
                <select
                  value={tournamentClubId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setTournamentClubId(cid);
                    const cl = clubs.find((x) => x.id === cid);
                    if (cl) {
                      setTitle(`${cl.name} 정기 월례회`);
                      if (cl.homeCourseId) handleCourseChange(cl.homeCourseId);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600"
                >
                  <option value="">자율 오픈 친선 대회 (소속 무관)</option>
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

              {/* 참가 인원수 (오르내림 +/- 스테퍼) */}
              {(() => {
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
              })()}

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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
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
              <input
                type="text"
                value={courseSearchTerm}
                onChange={(e) => setCourseSearchTerm(e.target.value)}
                placeholder="구장명 또는 지역 검색 (예: 동락, 부산, 여의도)"
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
              />

              <div className="max-h-60 overflow-y-auto space-y-1.5">
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
    </div>
  );
}
