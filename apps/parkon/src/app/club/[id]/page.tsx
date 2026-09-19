'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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

export default function ClubRoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;

  const [room, setRoom] = useState<ClubEventRoom | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'team' | 'individual'>('roster');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Join modal state (Direct group or waiting pool)
  const [joiningGroup, setJoiningGroup] = useState<number | null>(null); // null = waiting pool
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerGender, setNewPlayerGender] = useState<'M' | 'F'>('M');
  const [newPlayerTier, setNewPlayerTier] = useState<'ADVANCED' | 'INTERMEDIATE' | 'BEGINNER'>('INTERMEDIATE');
  const [joinAsLeader, setJoinAsLeader] = useState<boolean>(false);

  // Smart Auto-Grouping Modal State
  const [showAutoGroupModal, setShowAutoGroupModal] = useState<boolean>(false);
  const [groupMethod, setGroupMethod] = useState<'RANDOM' | 'ASSIGN_LEADERS' | 'PARTIAL_ASSIGN' | 'BALANCED_GENDER' | 'BALANCED_TIER' | 'KEEP_LEADERS'>('ASSIGN_LEADERS');
  const [customGroupCount, setCustomGroupCount] = useState<number>(0);
  const [selectedLeaderIds, setSelectedLeaderIds] = useState<string[]>([]);
  const [preAssignedGroupMap, setPreAssignedGroupMap] = useState<Record<string, number>>({});
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

  const loadRoom = useCallback(() => {
    if (!roomId) return;
    const found = ClubStorage.getRoom(roomId);
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

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
  const individuals = ClubStorage.getIndividualLeaderboard(room);
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

  // 참가비 수납 현황 카카오톡 리포트 복사
  const handleCopyPaymentReport = async () => {
    if (!room) return;
    const text = ClubStorage.generatePaymentStatusKakaoReport(room);
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        showToast('💰 참가비 수납 현황 리포트가 복사되었습니다! 카톡에 공유하세요.');
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
    showToast('💰 참가비 수납 현황 리포트가 복사되었습니다! 카톡에 공유하세요.');
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

  // 카카오톡 초대장 복사
  const handleCopyKakaoInvite = () => {
    const text = ClubStorage.generateKakaoShareText(room);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('카카오톡 초대 문구가 복사되었습니다! 단톡방에 붙여넣기 하세요 ⛳');
    }
  };

  // 전체 조 편성표 카카오톡 공지 복사
  const handleCopyGroupFormationKakao = () => {
    const text = ClubStorage.generateGroupFormationKakaoShareText(room);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('📢 전체 조 편성 결과가 복사되었습니다! 단톡방에 공유하세요.');
    }
  };

  // 최종 대회 결과 리포트 복사
  const handleCopyTournamentReport = () => {
    const text = ClubStorage.generateTournamentResultReport(room);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('대회 최종 결과 요약 리포트가 복사되었습니다! 카톡에 공유하세요 🏆');
    }
  };

  // 📋 계좌번호 1초 원터치 복사
  const handleCopyAccount = () => {
    if (!room?.bankAccount) {
      showToast('등록된 입금 계좌가 없습니다. 총무에게 문의해 주세요.');
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(room.bankAccount);
    }
    showToast(`🏦 '${room.bankAccount}' 계좌가 복사되었습니다! 은행 앱에 붙여넣기 하세요.`);
  };

  // 📢 미납자 타겟 카카오톡 독촉 안내문 복사
  const handleCopyUnpaidReminder = () => {
    if (!room) return;
    const text = ClubStorage.generateUnpaidKakaoReminderText(room);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    showToast('📢 미납자 대상 맞춤 카톡 독촉 안내문이 복사되었습니다!');
  };

  // ⚡ [현장 긴급 대응] 결원(노쇼) 발생 시 대기 1순위 1초 즉시 투입
  const handleQuickReplaceMissingPlayer = (groupNumber: number, playerId: string, playerName: string) => {
    if (!room) return;
    if (!room.waitingPool || room.waitingPool.length === 0) {
      alert('현재 대기 신청자(대기 풀)에 등록된 인원이 없습니다.');
      return;
    }

    const cand = room.waitingPool.find((p) => p.waitNumber === 1) || room.waitingPool[0];
    if (
      !confirm(
        `🚨 [결원 발생 긴급 대체]\n\n'${playerName}' 회원님의 불참(노쇼)으로\n대기 1순위 '${cand.name}' 님을 [${groupNumber}조]로 즉시 1초 투입하시겠습니까?`
      )
    ) {
      return;
    }

    const res = ClubStorage.replacePlayerWithWaitingCandidate(room.id, groupNumber, playerId);
    if (res.success && res.room) {
      setRoom(res.room);
      showToast(res.message);
    } else {
      alert(res.message);
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
    setPreAssignedGroupMap({});
    setShowAutoGroupModal(true);
  };

  // 스마트 자동 조 편성 실행 (RUN)
  const handleExecuteAutoGroup = () => {
    if (totalAllPlayers === 0) {
      alert('참가자가 최소 1명 이상 있어야 조 편성이 가능합니다.');
      return;
    }

    if (groupMethod === 'ASSIGN_LEADERS' && selectedLeaderIds.length === 0) {
      if (!confirm('조장으로 지정된 인원이 없습니다. 완전 랜덤으로 진행할까요?')) {
        return;
      }
    }

    const updated = ClubStorage.autoGroupPlayers(
      room.id,
      groupMethod,
      customGroupCount > 0 ? customGroupCount : undefined,
      {
        designatedLeaderIds: selectedLeaderIds,
        preAssignedGroupMap,
      }
    );
    if (updated) {
      setRoom(updated);
      setShowAutoGroupModal(false);
      setShowGroupResults(true);
      showToast(`🎯 총 ${updated.groups.length}개 조 스마트 편성이 완료되었습니다!`);
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
    <div className="p-3 max-w-xl mx-auto space-y-3 pb-20">
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
          <span>목록으로</span>
        </button>
        <div className="text-center">
          <h1 className="font-black text-sm text-stone-900 flex items-center justify-center gap-1.5">
            <Trophy className="w-4 h-4 text-purple-700" />
            <span>대회 / 모임 현황</span>
          </h1>
          <p className="text-[10px] text-stone-500 font-bold">
            총 {totalAllPlayers}명 참가 ({room.groups.length}개 조)
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={loadRoom}
            className="p-1.5 rounded-xl text-stone-500 hover:text-stone-800 bg-stone-50 border border-stone-200 active:scale-95 transition cursor-pointer"
            title="새로고침"
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
            title="닫기 (이전 화면으로)"
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

      {/* 모임 메인 배너 카드 */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-stone-900 text-white rounded-3xl p-4 shadow-md space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-purple-500/30 text-purple-200 border border-purple-400/40 text-[10px] font-black px-2 py-0.5 rounded-full">
                {room.groups.length}개 조 편성
              </span>
              <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {totalAllPlayers}명 참가 완료 (조당 3~4인)
              </span>
              <button
                type="button"
                onClick={() => setShowRulesModal(true)}
                className="bg-amber-400 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-xs hover:bg-amber-300"
              >
                <span>{ClubStorage.getGameModeInfo(room.gameMode).badge}</span>
                <span className="underline font-bold text-[9px]">대회 요강 & 룰 공시 📋</span>
              </button>
            </div>
            <h2 className="text-base font-black text-white mt-1.5 leading-snug">{room.title}</h2>
          </div>
        </div>

        {/* 구장 & 홀 & 총무 정보 */}
        <div className="grid grid-cols-2 gap-2 text-xs text-purple-100 font-bold bg-white/10 p-2.5 rounded-2xl backdrop-blur-xs">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-purple-300 shrink-0" />
            <span className="truncate">
              {room.courseName} ({(room.selectedCourseLetters || ['A', 'B']).join('-')}코스 · {room.totalHoles}홀)
            </span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <Calendar className="w-3.5 h-3.5 text-purple-300" />
            <span>주최/총무: {room.hostName}</span>
          </div>
        </div>

        {/* 원터치 액션 버튼들 (초대장 복사, 결과 리포트 복사) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyKakaoInvite}
            className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs py-2.5 rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>카톡 초대장 복사 📢</span>
          </button>
          <button
            type="button"
            onClick={handleCopyTournamentReport}
            className="w-full bg-white/20 hover:bg-white/30 text-white font-black text-xs py-2.5 rounded-xl border border-white/20 shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>결과 리포트 복사 📋</span>
          </button>
        </div>
      </div>

      {/* 🎯 대회 경기 방식 & 공식 룰 공시 카드 */}
      <div className="bg-white rounded-2xl p-3 border border-indigo-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5 font-black text-xs text-stone-900">
            <span className="text-base">🎯</span>
            <span>공식 경기 방식:</span>
            <span className="text-indigo-700 font-extrabold">{room.gameModeTitle || ClubStorage.getGameModeInfo(room.gameMode).title}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowAwardConfigModal(true)}
              className="text-[11px] font-black text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Settings className="w-3 h-3 text-purple-600" />
              <span>경기&시상 설정 ⚙️</span>
            </button>
            <button
              type="button"
              onClick={() => setShowRulesModal(true)}
              className="text-[11px] font-extrabold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-0.5 shadow-2xs"
            >
              <span>요강 📋</span>
            </button>
          </div>
        </div>

        {/* 시상 옵션 활성화 뱃지 표시 */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {room.awardConfig?.winnerGraceMonths && room.awardConfig.winnerGraceMonths > 0 ? (
            <span className="text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-600" />
              <span>우승자 독식 방지 ({room.awardConfig.winnerGraceMonths === 1 ? '직전 1회 제외' : room.awardConfig.winnerGraceMonths === 2 ? '최근 2회 제외' : `최근 ${room.awardConfig.winnerGraceMonths}개월 제외`})</span>
            </span>
          ) : null}

          {room.awardConfig?.enableLuckyDraw !== false && (
            <button
              type="button"
              onClick={() => setShowLuckyDrawModal(true)}
              className="text-[10px] font-black bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/80 px-2 py-0.5 rounded-lg flex items-center gap-1 transition active:scale-95 cursor-pointer"
            >
              <Gift className="w-3 h-3 text-amber-700" />
              <span>🎰 행운상 추첨기 {room.awardConfig?.luckyDrawWinners && room.awardConfig.luckyDrawWinners.length > 0 ? `(${room.awardConfig.luckyDrawWinners.length}명 당첨)` : '가동'} ▶</span>
            </button>
          )}

          {specialAwards.length > 0 && (
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-600" />
              <span>이색 특별상 {specialAwards.length}개 산출됨</span>
            </span>
          )}
        </div>

        {room.gameRuleNotes && (
          <div className="bg-stone-50 p-2 rounded-xl border border-stone-200/80 text-[11px] text-stone-600 font-medium flex items-start gap-1.5">
            <span className="text-indigo-600 font-bold shrink-0">📌 로컬 룰:</span>
            <span className="leading-snug">{room.gameRuleNotes}</span>
          </div>
        )}
      </div>

      {/* 💰 참가비 수납 현황 대시보드 카드 */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-300/80 rounded-2xl p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5 font-black text-xs text-amber-950">
            <Coins className="w-4 h-4 text-amber-700 shrink-0" />
            <span>참가비 수납 현황</span>
            <span className="bg-amber-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              1인 {paymentSummary.fee > 0 ? `${paymentSummary.fee.toLocaleString()}원` : '무료'}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {paymentSummary.unpaidCount > 0 && (
              <button
                type="button"
                onClick={handleCopyUnpaidReminder}
                className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1 transition cursor-pointer"
                title="미납자 대상 카톡 독촉 안내문 복사"
              >
                <span>독촉 카톡 복사 📢</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyPaymentReport}
              className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-amber-950 text-[11px] font-black px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1 transition cursor-pointer"
              title="입금 현황 카톡 복사"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>수납 카톡 공유 📢</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setConfigFee(paymentSummary.fee);
                setConfigBankAccount(paymentSummary.bankAccount);
                setShowPaymentConfigModal(true);
              }}
              className="bg-white/80 hover:bg-white text-stone-700 text-[11px] font-bold px-2 py-1 rounded-xl border border-amber-300/80 shadow-2xs transition active:scale-95 cursor-pointer"
              title="참가비/계좌 설정"
            >
              <span>설정 ⚙️</span>
            </button>
          </div>
        </div>

        {/* 계좌 및 실시간 금액 통계 바 */}
        <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-stone-800 flex-wrap gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] text-stone-700 font-bold truncate">
                🏦 {room.bankAccount || '입금 계좌: 총무에게 문의'}
              </span>
              {room.bankAccount && (
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="bg-purple-700 hover:bg-purple-800 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-2xs transition active:scale-95 cursor-pointer shrink-0 flex items-center gap-0.5"
                  title="계좌번호 1초 복사"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>1초 복사</span>
                </button>
              )}
            </div>
            <span className="shrink-0 text-amber-800 font-black text-xs ml-auto">
              수납률 {paymentSummary.paidRate}%
            </span>
          </div>

          {/* 프로그레스 바 */}
          <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${paymentSummary.paidRate}%` }}
            />
          </div>

          {/* 3열 요약 그리드 */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-center">
            <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-200">
              <div className="text-[10px] text-stone-500 font-bold">전체 인원</div>
              <div className="text-xs font-black text-stone-800">{paymentSummary.totalCount}명</div>
              <div className="text-[9px] text-stone-400 font-semibold">{paymentSummary.totalExpectedAmount.toLocaleString()}원</div>
            </div>
            <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
              <div className="text-[10px] text-emerald-700 font-bold">입금 완료 ✅</div>
              <div className="text-xs font-black text-emerald-800">{paymentSummary.paidCount}명</div>
              <div className="text-[9px] text-emerald-600 font-bold">{paymentSummary.totalCollectedAmount.toLocaleString()}원</div>
            </div>
            <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-200">
              <div className="text-[10px] text-amber-700 font-bold">입금 대기 ⏳</div>
              <div className="text-xs font-black text-amber-900">{paymentSummary.unpaidCount}명</div>
              <div className="text-[9px] text-amber-700 font-bold">{paymentSummary.uncollectedAmount.toLocaleString()}원</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 [일반 회원 감동 기능] 내 조 바로 찾기 & 출발 티박스 스마트 검색 위젯 */}
      <div className="bg-white rounded-2xl p-3 border border-stone-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-stone-900">
            <span className="text-base">🔍</span>
            <span>내 조 바로 찾기 & 출발 위치 안내</span>
          </div>
          {searchMyName && (
            <button
              type="button"
              onClick={() => setSearchMyName('')}
              className="text-[10px] font-bold text-stone-400 hover:text-stone-700"
            >
              초기화 ✕
            </button>
          )}
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchMyName}
            onChange={(e) => setSearchMyName(e.target.value)}
            placeholder="회원님 성함을 입력하세요 (예: 홍길동)"
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
                    🎯 내 조 찾기 성공
                  </span>
                  <span className="text-xs font-black bg-white/20 px-2.5 py-0.5 rounded-lg text-white">
                    🚩 {matchedGroup.startCourseLetter}코스 1번 홀 동시 출발(샷건)
                  </span>
                </div>
                <div className="text-sm font-black text-white">
                  👑 <span className="underline decoration-yellow-200 decoration-2">{matchedPlayer.name}</span> 회원님은{' '}
                  <span className="text-base font-black text-yellow-200">[{matchedGroup.name}]</span> 입니다!
                </div>
                <div className="text-xs bg-black/20 p-2 rounded-xl text-yellow-50 font-bold flex items-center justify-between flex-wrap gap-2">
                  <div className="truncate">
                    동반 조원: {matchedGroup.players.map((p) => `${p.name}${p.isLeader ? '(조장👑)' : ''}`).join(', ')}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartGroupRound(matchedGroup)}
                    className="bg-white hover:bg-yellow-50 text-amber-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer ml-auto"
                  >
                    우리 조 스코어보드 열기 📱
                  </button>
                </div>
              </div>
            );
          }

          if (matchedWaiting) {
            return (
              <div className="bg-stone-800 text-white p-3 rounded-2xl shadow-xs space-y-1 animate-fadeIn">
                <div className="text-xs font-black text-amber-300">
                  ⏳ '{matchedWaiting.name}' 회원님은 현재 조 편성 대기 중입니다.
                </div>
                <div className="text-[11px] text-stone-300 font-medium">
                  {matchedWaiting.waitNumber
                    ? `대기 순번: ${matchedWaiting.waitNumber}순위 (결원 발생 시 즉시 자동 투입)`
                    : '조 편성 실행 시 조에 자동 배정됩니다.'}
                </div>
              </div>
            );
          }

          return (
            <div className="text-center py-2 text-xs font-bold text-stone-400 bg-stone-50 rounded-xl">
              참가자 명단에서 '{searchMyName.trim()}' 님을 찾을 수 없습니다.
            </div>
          );
        })()}
      </div>

      {/* 🚩 [본부석 총무 모니터링] 전 조 실시간 홀 진행 현황판 & 대회 공식 마감 바 */}
      <div className="bg-gradient-to-r from-stone-900 via-purple-950 to-stone-900 text-white p-3.5 rounded-2xl shadow-md space-y-2.5 border border-purple-800/40">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">🚩</span>
            <div>
              <div className="text-xs font-black flex items-center gap-1.5">
                <span>전 조 경기 진행 모니터링</span>
                <span className="bg-purple-500/40 text-purple-200 border border-purple-400/40 text-[10px] font-black px-2 py-0.2 rounded-full">
                  {room.groups.filter((g) => (g.players[0]?.holesCompleted || 0) >= (room.totalHoles || 18)).length}/{room.groups.length}개 조 완주
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
            <span>대회 공식 마감 & 실록 박제 🏆</span>
          </button>
        </div>

        {/* 조별 실시간 홀 진행 배지 목록 */}
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
                  {isDone ? '완주 ✅' : inProgress ? `${completed}/${total}홀 🏌️` : '대기 ⏳'}
                </span>
              </div>
            );
          })}
        </div>
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
          <span>조 편성표 ({room.groups.length}조)</span>
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
          <span>단체 순위</span>
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
          <span>개인 순위</span>
        </button>
      </div>

      {/* TAB 1: 조 편성표 & 대기 풀 & 스마트 자동 편성 */}
      {activeTab === 'roster' && (
        <div className="space-y-3 animate-fadeIn">
          {/* 스마트 자동 편성 컨트롤 패널 */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-xs text-purple-950">
                <Sparkles className="w-4 h-4 text-purple-700 shrink-0" />
                <span>스마트 조 편성 (총 {totalAllPlayers}명 참여)</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyGroupFormationKakao}
                  className="bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] border border-[#E6CF00] text-[11px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                  title="전체 조 편성 카톡 단톡방 공유"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>📋 조 편성 카톡 복사</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJoiningGroup(null);
                    setNewPlayerName(ParkOnStorage.getUserDisplayName(room.clubId));
                    setShowJoinModal(true);
                  }}
                  className="bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 text-[11px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ 참가자 등록</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJoiningGroup(null);
                    setNewPlayerName('게스트');
                    setShowJoinModal(true);
                  }}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                  title="외부 게스트 또는 현장 참가자 대기 명단 추가"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-700" />
                  <span>➕ 게스트/현장 추가</span>
                </button>
              </div>
            </div>

            {/* 대기 풀 (Lobby Pool) 명단 */}
            {waitingPoolCount > 0 && (
              <div className="bg-white p-2.5 rounded-xl border border-purple-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-black text-stone-700">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>조 배정 대기 중인 회원 ({waitingPoolCount}명)</span>
                    {room.waitingPool?.some((p) => p.waitNumber) && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-1.5 py-0.2 rounded-md font-black">
                        정원 초과 대기 {room.waitingPool.filter((p) => p.waitNumber).length}명
                      </span>
                    )}
                  </span>
                  <span className="text-purple-700">아래 자동 편성으로 즉시 배정</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {room.waitingPool?.map((wp) => (
                    <span
                      key={wp.id}
                      className={`border text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs ${
                        wp.waitNumber
                          ? 'bg-amber-50 border-amber-300 text-amber-950'
                          : 'bg-purple-50 border-purple-200 text-purple-900'
                      }`}
                    >
                      {wp.waitNumber && (
                        <span className="bg-amber-600 text-white rounded px-1 text-[9px] font-black">
                          대기 {wp.waitNumber}번
                        </span>
                      )}
                      <span>{wp.name}</span>
                      <span className={wp.waitNumber ? 'text-[10px] text-amber-700' : 'text-[10px] text-purple-600'}>
                        ({wp.gender === 'F' ? '여' : '남'}·
                        {wp.handicapTier === 'ADVANCED' ? '상' : wp.handicapTier === 'BEGINNER' ? '초' : '중'})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTogglePayment(wp.id, wp.name)}
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded cursor-pointer transition active:scale-95 flex items-center gap-0.5 ${
                          wp.paymentStatus === 'PAID'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-stone-200 text-stone-600 hover:bg-amber-100 hover:text-amber-900'
                        }`}
                        title="클릭 시 입금 상태 변경"
                      >
                        {wp.paymentStatus === 'PAID' ? '✓입금' : '미납'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromWaitingPool(wp.id, wp.name)}
                        className="text-stone-400 hover:text-red-500 text-[10px] font-black ml-0.5 cursor-pointer"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 최적 조 편성 실행 버튼 */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openAutoGroupModal}
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-black text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Dices className="w-4 h-4 text-purple-200" />
                <span>🎲 스마트 조 편성 룰 설정 & 자동 분배 실행</span>
              </button>
            </div>
          </div>

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
                    <span>조 편성 결과 보기</span>
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-200">
                      총 {room.groups.length}개 조 ({groupPlayersCount}명 편성됨)
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                    {showGroupResults
                      ? '터치하여 조 편성 상세 목록 접기 ▲'
                      : `터치하여 1조 ~ ${room.groups.length}조 편성 상세 결과 및 출발 코스 확인 ▼`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-black px-2.5 py-1 rounded-lg border transition ${showGroupResults ? 'bg-purple-700 text-white border-purple-700' : 'bg-white text-purple-700 border-purple-200'}`}>
                  {showGroupResults ? '목록 접기 ▲' : '결과 보기 ▼'}
                </span>
              </div>
            </button>

            {/* 조 목록 렌더링 (showGroupResults가 true일 때 펼쳐짐) */}
            {showGroupResults && (
              <div className="p-3 border-t border-stone-200 bg-stone-50/40 space-y-3 animate-fadeIn">
                {room.groups.length === 0 ? (
                  <div className="text-center py-6 text-stone-400 text-xs font-bold">
                    아직 편성된 조가 없습니다. 위의 [🎲 스마트 조 편성 룰 설정 & 자동 분배 실행] 버튼을 눌러 조를 배정해 주세요.
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
                            <span className="text-xs font-black text-purple-900 bg-purple-100/80 px-2 py-0.5 rounded-lg border border-purple-200 flex items-center gap-1">
                              <span>🚩</span>
                              <span>{group.startCourseLetter}코스 1번 홀 출발</span>
                            </span>
                            <span className="text-[11px] font-bold text-stone-500">
                              ({group.players.length}명 편성)
                            </span>
                          </div>

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
                              <span>이 조 참가</span>
                            </button>

                            {group.players.length === 0 && room.groups.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteEmptyGroup(group.groupNumber)}
                                className="text-stone-400 hover:text-red-600 text-[10px] font-bold px-1.5 py-1 rounded-lg border border-stone-200 cursor-pointer"
                                title="빈 조 삭제"
                              >
                                조 삭제
                              </button>
                            )}
                          </div>
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
                                  <span title="조장 (스코어 입력 권한)">
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
                                      {player.gender === 'F' ? '여' : '남'} ·{' '}
                                      {player.handicapTier === 'ADVANCED'
                                        ? '상급'
                                        : player.handicapTier === 'BEGINNER'
                                        ? '초급'
                                        : '중급'}
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
                                      title="클릭 시 입금 완료 ↔ 미납 토글"
                                    >
                                      {player.paymentStatus === 'PAID' ? '✓입금' : '미납'}
                                    </button>
                                  </div>
                                </div>
                              </div>

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
                                  title="결원(노쇼) 발생 시 대기 1순위 즉시 대체 투입"
                                  className="text-[10px] text-amber-900 hover:text-white bg-amber-200 hover:bg-amber-600 border border-amber-300 px-1.5 py-0.5 rounded font-bold cursor-pointer transition active:scale-95 flex items-center gap-0.5 shadow-2xs"
                                >
                                  <span>⚡노쇼</span>
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
                                  title="다른 조로 이동"
                                  className="text-[10px] text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-bold cursor-pointer flex items-center gap-0.5"
                                >
                                  <ArrowRightLeft className="w-2.5 h-2.5" />
                                  <span>이동</span>
                                </button>

                                {/* 조장 위임 버튼 */}
                                {!player.isLeader && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMakeLeader(group.groupNumber, player.id, player.name)
                                    }
                                    title="조장 위임"
                                    className="text-[10px] text-amber-700 hover:text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded font-bold cursor-pointer"
                                  >
                                    조장
                                  </button>
                                )}

                                {/* 제외 버튼 */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleLeaveGroup(group.groupNumber, player.id, player.name)
                                  }
                                  title="조에서 제외"
                                  className="text-stone-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                                >
                                  <LogOut className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* 빈자리 추가 슬롯 */}
                          {group.players.length < 4 && (
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
                              <span>+ 빈자리 참가</span>
                            </button>
                          )}
                        </div>

                        {/* 조 현재 성적 요약 프리뷰 */}
                        {hasScores && (
                          <div className="bg-stone-50 p-2 rounded-xl flex items-center justify-between text-xs font-black text-stone-700 border border-stone-200/60">
                            <span>조 평균 타수</span>
                            <span className="text-purple-800">
                              {group.avgScore}타 (합계 {group.totalScore}타)
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
                                ? `⛳ [${group.name}] 스코어보드 계속 기록하기 ▶`
                                : `⛳ [${group.name}] 18홀 라운드 시작 (스코어 기록)`}
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
                  <span>새로운 조 추가하기 (+ {room.groups.length + 1}조)</span>
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
              <span>실시간 단체전 랭킹 (조별 평균 타수 기준)</span>
            </div>
            <span className="text-[11px] text-amber-800 font-extrabold">낮은 타수 순</span>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-stone-100">
              {teams.map((t) => {
                const medal =
                  t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : t.rank === 3 ? '🥉' : `${t.rank}위`;
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
                            (조장: {t.leaderName})
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 font-bold flex items-center gap-2 mt-0.5">
                          <span>참가 {t.playersCount}명</span>
                          <span>•</span>
                          <span>{t.holesCompleted > 0 ? `${t.holesCompleted}홀 완료` : '경기 전'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-emerald-800">
                        {t.avgStrokes > 0 ? `평균 ${t.avgStrokes}타` : '-'}
                      </div>
                      <div className="text-[10px] text-stone-500 font-extrabold">
                        총 {t.totalStrokes}타 ({t.parDiff <= 0 ? t.parDiff : `+${t.parDiff}`})
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
              <span>전체 참가자 개인 랭킹 (총 {individuals.length}명)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowRulesModal(true)}
              className="text-[11px] text-indigo-800 font-extrabold flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <span>{ClubStorage.getGameModeInfo(room.gameMode).badge}</span>
              <span className="text-[10px] text-stone-500 font-semibold">(룰 안내)</span>
            </button>
          </div>

          {/* 🛡️ 직전 우승자 시상 유예(독식 방지) 안내 배너 */}
          {graceInfo && (
            <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-purple-100 rounded-2xl p-3.5 shadow-xs space-y-2 border border-purple-400/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-xs text-purple-200">
                  <ShieldCheck className="w-4 h-4 text-purple-300" />
                  <span>우승자 독식 방지 규정 적용 중</span>
                </div>
                <span className="text-[10px] bg-purple-800 text-purple-200 px-2 py-0.5 rounded-full font-black border border-purple-400/30">
                  {graceInfo.gracePeriod} 우승자
                </span>
              </div>
              <p className="text-[11px] leading-relaxed font-medium text-purple-200">
                {graceInfo.reason}
              </p>
              <div className="flex items-center justify-between text-[11px] font-black pt-1.5 border-t border-purple-700/60 bg-purple-900/50 p-2 rounded-xl">
                <span className="text-purple-200">🏅 명예 메달리스트: <strong className="text-white">{graceInfo.originalWinner.playerName}</strong></span>
                <span className="text-amber-300">🎁 1위 시상품 수령: <strong className="text-amber-200 underline">{graceInfo.transferredWinner.playerName}</strong></span>
              </div>
            </div>
          )}

          {/* 신페리오인 경우 1위 우승자 & 메달리스트 특별 시상 카드 */}
          {room.gameMode === 'NEW_PERIO' && individuals.length > 0 && (() => {
            const champion = individuals[0];
            const sortedByGross = [...individuals].sort((a, b) => a.totalStrokes - b.totalStrokes);
            const medalist = sortedByGross[0];

            return (
              <div className="grid grid-cols-2 gap-2">
                {/* 1위 우승 (네트 1위) */}
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-3 rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-black text-amber-100">
                    <span>🥇 신페리오 우승</span>
                    <span className="bg-white/20 px-1.5 py-0.2 rounded-full">네트 1위</span>
                  </div>
                  <div className="font-black text-sm truncate">{champion.playerName} ({champion.groupNumber}조)</div>
                  <div className="text-[11px] font-extrabold text-amber-100">
                    네트 {champion.netScore}타 <span className="text-[9px] text-amber-200">(실타수 {champion.totalStrokes} / 핸디 {champion.handicap})</span>
                  </div>
                </div>

                {/* 메달리스트 (실타수 1위) */}
                <div className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-3 rounded-2xl shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-black text-purple-200">
                    <span>🏅 메달리스트</span>
                    <span className="bg-white/20 px-1.5 py-0.2 rounded-full">최저 실타수</span>
                  </div>
                  <div className="font-black text-sm truncate">{medalist.playerName} ({medalist.groupNumber}조)</div>
                  <div className="text-[11px] font-extrabold text-purple-200">
                    총 {medalist.totalStrokes}타 <span className="text-[9px] text-purple-300">({medalist.parDiff <= 0 ? medalist.parDiff : `+${medalist.parDiff}`})</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 순위 테이블 헤더 */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="bg-stone-100/80 px-3 py-2 text-[11px] font-black text-stone-600 flex items-center justify-between border-b border-stone-200">
              <span className="w-8 text-center">순위</span>
              <span className="flex-1 pl-2">선수명 / 소속조</span>
              <span className="text-right">
                {room.gameMode === 'NEW_PERIO' ? '네트점수 / 핸디' : '총 타수 / 기준타 대비'}
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {individuals.map((p) => {
                const medal =
                  p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `${p.rank}위`;
                const diffStr =
                  p.parDiff < 0 ? `${p.parDiff}` : p.parDiff > 0 ? `+${p.parDiff}` : 'E';

                return (
                  <div
                    key={p.playerId}
                    className="p-3 flex items-center justify-between gap-2 hover:bg-stone-50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 text-center font-black text-xs text-stone-700">
                        {medal}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-stone-900">{p.playerName}</span>
                          {p.isLeader && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-black">
                              조장
                            </span>
                          )}
                          <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-md font-extrabold">
                            {p.groupNumber}조
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-bold mt-0.5">
                          {p.holesCompleted > 0 ? `${p.holesCompleted}홀 진행` : '시작 전'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {room.gameMode === 'NEW_PERIO' && typeof p.netScore === 'number' ? (
                        <>
                          <div className="text-sm font-black text-indigo-900">
                            네트 {p.netScore}타
                          </div>
                          <div className="text-[10px] font-bold text-stone-500">
                            실타수 {p.totalStrokes}타 (핸디 -{p.handicap})
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-black text-stone-900">
                            {p.totalStrokes > 0 ? `${p.totalStrokes}타` : '-'}
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
              })}
            </div>
          </div>

          {/* 🎖️ 이색 특별상 수상 현황 카드 */}
          {specialAwards.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-xs text-stone-900">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>이색 특별상 수상 현황</span>
                </div>
                <span className="text-[10px] text-stone-500 font-bold">18홀 전산 자동 집계</span>
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
                      <span className="truncate">{sa.winnerName} {sa.groupNumber ? `(${sa.groupNumber}조)` : ''}</span>
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
                <span>🎰 현장 실시간 행운상 추첨</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full font-extrabold">
                  {(room.awardConfig?.luckyDrawWinners || []).length}명 당첨
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLuckyDrawModal(true)}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-amber-950 text-xs font-black px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ 룰렛 추첨하기 🎲</span>
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
                            ({lw.groupNumber}조)
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
                        title="당첨 취소"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/60 p-3 rounded-xl border border-amber-100 text-center space-y-1">
                <p className="text-xs font-black text-stone-600">아직 추첨된 행운상이 없습니다.</p>
                <p className="text-[10px] text-stone-500">
                  시상식에서 <strong>[+ 룰렛 추첨하기]</strong>를 누르면 룰렛이 돌며 깜짝 당첨자가 선정됩니다!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 스마트 자동 조 편성 모달 */}
      {showAutoGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dices className="w-5 h-5 text-purple-300" />
                <h3 className="font-black text-base">스마트 조 편성 룰 설정</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAutoGroupModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto">
              {/* 참가자 인원 정보 및 최적 조 계산 */}
              <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-stone-800">
                  <span>총 참가자 수:</span>
                  <span className="text-purple-800 font-black">{totalAllPlayers}명</span>
                </div>
                {(() => {
                  const opt = ClubStorage.calculateOptimalGroups(totalAllPlayers);
                  const distStr = opt.distribution.join('명 + ') + '명';
                  return (
                    <div className="text-[11px] text-purple-900 font-bold bg-white p-2 rounded-xl border border-purple-200/70">
                      🎯 <strong>3~4인 기준 추천:</strong> 총 {opt.groupCount}개 조 ({distStr})
                    </div>
                  );
                })()}

                {/* 조 수 조정 */}
                <div className="flex items-center justify-between text-xs font-extrabold text-stone-700 pt-1">
                  <span>편성할 조 수:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCustomGroupCount(Math.max(1, customGroupCount - 1))}
                      className="w-6 h-6 rounded-md bg-white border border-stone-300 font-black hover:bg-stone-100"
                    >
                      -
                    </button>
                    <span className="font-black text-purple-900 px-1">{customGroupCount}개 조</span>
                    <button
                      type="button"
                      onClick={() => setCustomGroupCount(customGroupCount + 1)}
                      className="w-6 h-6 rounded-md bg-white border border-stone-300 font-black hover:bg-stone-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 5대 조 편성 옵션 선택 (대표님 요청 표준) */}
              <div className="space-y-2">
                <label className="text-xs font-black text-stone-800 flex items-center justify-between">
                  <span>조 편성 옵션 선택</span>
                  <span className="text-[10px] text-purple-700 font-bold">총무 맞춤 자동 분배</span>
                </label>

                {/* 옵션 1: 무조건 100% 완전 랜덤 */}
                <button
                  type="button"
                  onClick={() => setGroupMethod('RANDOM')}
                  className={`w-full p-3 rounded-2xl border text-left transition active:scale-98 cursor-pointer flex items-start gap-2.5 ${
                    groupMethod === 'RANDOM'
                      ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-200'
                      : 'bg-white hover:bg-stone-50 border-stone-200'
                  }`}
                >
                  <Dices className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-black text-stone-900">🎲 1. 무조건 100% 완전 랜덤 편성</div>
                    <div className="text-[11px] text-stone-500 font-bold mt-0.5">
                      전체 참가자를 순수 무작위로 추첨하여 각 조에 골고루 배치합니다. (조건 없이 랜덤)
                    </div>
                  </div>
                </button>

                {/* 옵션 2: 조장 지정 후 돌리기 (총무 강력 추천) */}
                <button
                  type="button"
                  onClick={() => setGroupMethod('ASSIGN_LEADERS')}
                  className={`w-full p-3 rounded-2xl border text-left transition active:scale-98 cursor-pointer flex items-start gap-2.5 ${
                    groupMethod === 'ASSIGN_LEADERS'
                      ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-300 shadow-xs'
                      : 'bg-white hover:bg-stone-50 border-stone-200'
                  }`}
                >
                  <Crown className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <span>👑 2. 각 조 조장 {customGroupCount}명 지정 후 돌리기</span>
                      <span className="bg-amber-200/80 text-amber-900 text-[10px] px-1.5 py-0.2 rounded font-black">
                        총무 추천
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-800/80 font-bold mt-0.5">
                      스마트폰 입력이나 리딩을 맡을 조장 {customGroupCount}명을 미리 체크하면, 1조부터 {customGroupCount}조에 1명씩 고정하고 나머지를 랜덤 분배합니다.
                    </div>
                  </div>
                </button>

                {/* 조장 지정 모드 선택 시 활성화되는 인터랙티브 체크 명단 패널 */}
                {groupMethod === 'ASSIGN_LEADERS' && (
                  <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-3.5 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-amber-600" />
                        <span>조장 체크 ({selectedLeaderIds.length} / {customGroupCount}명 지정됨)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const candidates = [...allCurrentPlayers];
                          candidates.sort((a, b) => {
                            const ta = a.handicapTier === 'ADVANCED' ? 2 : a.handicapTier === 'INTERMEDIATE' ? 1 : 0;
                            const tb = b.handicapTier === 'ADVANCED' ? 2 : b.handicapTier === 'INTERMEDIATE' ? 1 : 0;
                            return tb - ta;
                          });
                          setSelectedLeaderIds(candidates.slice(0, customGroupCount).map((p) => p.id));
                        }}
                        className="text-[10px] font-black bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md cursor-pointer transition shadow-2xs"
                      >
                        💡 상급자 우선 자동 추천
                      </button>
                    </div>

                    <p className="text-[11px] text-amber-900 font-medium">
                      아래 명단에서 각 조를 이끌 조장 <strong>{customGroupCount}명</strong>을 체크해 주세요. 체크된 순서대로 1조, 2조, 3조... 의 조장으로 배정됩니다.
                    </p>

                    <div className="max-h-52 overflow-y-auto space-y-1 bg-white p-2 rounded-xl border border-amber-200">
                      {allCurrentPlayers.map((p) => {
                        const isLeader = selectedLeaderIds.includes(p.id);
                        const leaderIndex = selectedLeaderIds.indexOf(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              if (isLeader) {
                                setSelectedLeaderIds(selectedLeaderIds.filter((id) => id !== p.id));
                              } else {
                                if (selectedLeaderIds.length >= customGroupCount) {
                                  alert(`이미 조장 정원(${customGroupCount}명)이 모두 찼습니다. 다른 회원을 해제하고 선택하세요.`);
                                  return;
                                }
                                setSelectedLeaderIds([...selectedLeaderIds, p.id]);
                              }
                            }}
                            className={`w-full p-2 rounded-lg border text-xs flex items-center justify-between transition cursor-pointer ${
                              isLeader
                                ? 'bg-amber-100/80 border-amber-500 font-black text-amber-950 ring-1 ring-amber-300'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-amber-50/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black ${
                                  isLeader ? 'bg-amber-600 text-white' : 'border border-stone-300 bg-white'
                                }`}
                              >
                                {isLeader ? '✓' : ''}
                              </span>
                              <span className="font-black">{p.name}</span>
                              <span className="text-[10px] text-stone-500">
                                ({p.gender === 'F' ? '여' : '남'}·
                                {p.handicapTier === 'ADVANCED' ? '상급' : p.handicapTier === 'BEGINNER' ? '초급' : '중급'})
                              </span>
                            </div>
                            {isLeader && (
                              <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-1.5 py-0.5 rounded shadow-2xs">
                                👑 {leaderIndex + 1}조 조장
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 옵션 3: 일부 인원 특정 조 사전 지정 후 돌리기 */}
                <button
                  type="button"
                  onClick={() => setGroupMethod('PARTIAL_ASSIGN')}
                  className={`w-full p-3 rounded-2xl border text-left transition active:scale-98 cursor-pointer flex items-start gap-2.5 ${
                    groupMethod === 'PARTIAL_ASSIGN'
                      ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-200 shadow-xs'
                      : 'bg-white hover:bg-stone-50 border-stone-200'
                  }`}
                >
                  <Users className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-black text-stone-900">📌 3. 일부 인원 조 고정 후 나머지 돌리기</div>
                    <div className="text-[11px] text-stone-500 font-bold mt-0.5">
                      부부, 친구, 초보자 동반 등 특정 인원을 원하는 조에 미리 고정 배치하고, 나머지 인원만 빈자리로 자동 분배합니다.
                    </div>
                  </div>
                </button>

                {/* 일부 인원 고정 모드 선택 시 활성화되는 인터랙티브 조 선택 패널 */}
                {groupMethod === 'PARTIAL_ASSIGN' && (
                  <div className="bg-blue-50/90 border border-blue-300 rounded-2xl p-3.5 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span>특정 조 사전 고정 ({Object.keys(preAssignedGroupMap).length}명 고정됨)</span>
                      </span>
                      {Object.keys(preAssignedGroupMap).length > 0 && (
                        <button
                          type="button"
                          onClick={() => setPreAssignedGroupMap({})}
                          className="text-[10px] font-bold text-stone-500 hover:underline cursor-pointer"
                        >
                          전체 초기화
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-blue-900 font-medium">
                      고정하고 싶은 회원의 조 번호를 선택하세요. '자동 분배'로 둔 회원은 남은 빈자리에 무작위로 분배됩니다.
                    </p>

                    <div className="max-h-52 overflow-y-auto space-y-1.5 bg-white p-2 rounded-xl border border-blue-200">
                      {allCurrentPlayers.map((p) => {
                        const assignedGroup = preAssignedGroupMap[p.id] || 0;
                        return (
                          <div
                            key={p.id}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                              assignedGroup > 0
                                ? 'bg-blue-50/80 border-blue-400 font-black text-blue-950'
                                : 'bg-stone-50 border-stone-200 text-stone-700'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-black">{p.name}</span>
                              <span className="text-[10px] text-stone-500">
                                ({p.gender === 'F' ? '여' : '남'}·
                                {p.handicapTier === 'ADVANCED' ? '상' : p.handicapTier === 'BEGINNER' ? '초' : '중'})
                              </span>
                            </div>

                            <select
                              value={assignedGroup}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setPreAssignedGroupMap((prev) => {
                                  const next = { ...prev };
                                  if (val > 0) {
                                    next[p.id] = val;
                                  } else {
                                    delete next[p.id];
                                  }
                                  return next;
                                });
                              }}
                              className={`px-2 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                                assignedGroup > 0
                                  ? 'bg-blue-600 text-white border-blue-700 font-black'
                                  : 'bg-white text-stone-700 border-stone-300'
                              }`}
                            >
                              <option value={0}>🎲 자동 분배</option>
                              {Array.from({ length: customGroupCount }, (_, idx) => idx + 1).map((gNum) => (
                                <option key={gNum} value={gNum}>
                                  📌 {gNum}조 고정
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 옵션 4: 남녀 성비 균등 */}
                <button
                  type="button"
                  onClick={() => setGroupMethod('BALANCED_GENDER')}
                  className={`w-full p-3 rounded-2xl border text-left transition active:scale-98 cursor-pointer flex items-start gap-2.5 ${
                    groupMethod === 'BALANCED_GENDER'
                      ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-200'
                      : 'bg-white hover:bg-stone-50 border-stone-200'
                  }`}
                >
                  <Scale className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-black text-stone-900">⚖️ 4. 남녀 성비 균등 분배</div>
                    <div className="text-[11px] text-stone-500 font-bold mt-0.5">
                      각 조에 남성과 여성이 치우치지 않고 골고루 섞이도록 자동 배분합니다.
                    </div>
                  </div>
                </button>

                {/* 옵션 5: 실력 균등 */}
                <button
                  type="button"
                  onClick={() => setGroupMethod('BALANCED_TIER')}
                  className={`w-full p-3 rounded-2xl border text-left transition active:scale-98 cursor-pointer flex items-start gap-2.5 ${
                    groupMethod === 'BALANCED_TIER'
                      ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-200'
                      : 'bg-white hover:bg-stone-50 border-stone-200'
                  }`}
                >
                  <Award className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-black text-stone-900">🏅 5. 실력 균형 분배 (스네이크)</div>
                    <div className="text-[11px] text-stone-500 font-bold mt-0.5">
                      상급자, 중급자, 초급자가 한 조에 쏠리지 않도록 밸런스를 맞춥니다.
                    </div>
                  </div>
                </button>
              </div>

              {/* 실행 버튼 (RUN) */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAutoGroupModal(false)}
                  className="w-1/3 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-black text-xs transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAutoGroup}
                  className="w-2/3 py-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-purple-500"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>🚀 조건 적용하여 조 편성 실행 (RUN)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 조 간 선수 이동 모달 */}
      {movingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-800 to-purple-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm">
                '{movingPlayer.playerName}' 님 조 이동
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
                이동할 대상 조를 선택해 주세요:
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
                      <span>{g.name} ({g.players.length}명)</span>
                      {isCurrent && <span className="block text-[10px] text-stone-400">(현재 조)</span>}
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
                {joiningGroup !== null ? `[${joiningGroup}조] 참가 신청` : '참가 신청 (대기 명단 등록)'}
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
                  <label className="text-xs font-extrabold text-stone-800">참가자 성명 / 활동명 *</label>
                  <span className="text-[10px] text-stone-500 font-bold">실명 또는 가명</span>
                </div>

                {/* 실명 vs 가명 vs 게스트 빠른 선택 */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const user = ParkOnStorage.getKakaoUser();
                      setNewPlayerName(user?.realName || '김대희');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-black transition cursor-pointer text-center ${
                      newPlayerName === (ParkOnStorage.getKakaoUser()?.realName || '김대희')
                        ? 'bg-emerald-100 border-emerald-600 text-emerald-950 ring-2 ring-emerald-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                    }`}
                  >
                    🔘 실명 ({ParkOnStorage.getKakaoUser()?.realName || '김대희'})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const user = ParkOnStorage.getKakaoUser();
                      setNewPlayerName(user?.aliasName || '나이스버디');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-black transition cursor-pointer text-center ${
                      newPlayerName === (ParkOnStorage.getKakaoUser()?.aliasName || '나이스버디')
                        ? 'bg-purple-100 border-purple-600 text-purple-950 ring-2 ring-purple-200'
                        : 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-800'
                    }`}
                  >
                    🔘 가명 ({ParkOnStorage.getKakaoUser()?.aliasName || '나이스버디'})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPlayerName('게스트');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-black transition cursor-pointer text-center ${
                      newPlayerName.startsWith('게스트')
                        ? 'bg-amber-100 border-amber-600 text-amber-950 ring-2 ring-amber-200'
                        : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                    }`}
                  >
                    🔘 게스트 (초청)
                  </button>
                </div>

                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="예: 김대희 또는 게스트1"
                  autoFocus
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-black focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <p className="text-[10px] text-stone-400 font-medium">
                  💡 공식 대회는 실명 참가를 추천하며, 외부 초청인원/당일 현장 방문객은 게스트로 등록해 즉시 조에 편성할 수 있습니다.
                </p>
              </div>

              {/* 성별 선택 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">성별 (성비 균형 분배용)</label>
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
                    남성 (남)
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
                    여성 (여)
                  </button>
                </div>
              </div>

              {/* 실력 등급 선택 */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-stone-800">실력 등급 (실력 균형 분배용)</label>
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
                    상급 (1~2급)
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
                    중급 (3급/일반)
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
                    초급 (루키)
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
                    👑 이 조의 조장으로 참가 (스코어 입력 담당)
                  </label>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="w-1/2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-black text-xs transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  참가 완료
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
                <h3 className="font-black text-base">참가비 및 입금 계좌 설정</h3>
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
                  <span>1인 참가비 (원)</span>
                  <span className="text-amber-700 font-bold">0원이면 무료</span>
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
                      {fee === 0 ? '무료' : `${(fee / 10000 >= 1 ? `${fee / 10000}만` : `${fee / 1000}천`)}원`}
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
                <label className="text-xs font-extrabold text-stone-800">입금 계좌 안내 (은행·계좌번호·예금주)</label>
                <input
                  type="text"
                  value={configBankAccount}
                  onChange={(e) => setConfigBankAccount(e.target.value)}
                  placeholder="예: 농협 352-1234-5678 김대희(총무)"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentConfigModal(false)}
                  className="w-1/2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-black text-xs transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  설정 저장
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
                  <h3 className="font-black text-base leading-tight">대회 요강 & 경기 방식 안내</h3>
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
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">공식 경기 모드</span>
                    <h4 className="text-sm font-black text-emerald-950">{room.gameModeTitle || gameModeInfo.title}</h4>
                  </div>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-bold">
                  {gameModeInfo.shortDesc}
                </p>
                <div className="bg-white/90 rounded-xl p-2.5 border border-emerald-100 text-[11px] text-stone-600 leading-relaxed">
                  <strong className="text-emerald-900 block mb-1">📌 규정 세부사항:</strong>
                  {gameModeInfo.ruleDetail}
                </div>
              </div>

              {/* 주최측 로컬 룰 및 특이사항 */}
              {room.gameRuleNotes && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>주최측 로컬 룰 & 특이 규정</span>
                  </div>
                  <div className="bg-white/90 rounded-xl p-2.5 border border-amber-100 text-xs font-bold text-stone-700 whitespace-pre-wrap leading-relaxed">
                    {room.gameRuleNotes}
                  </div>
                </div>
              )}

              {/* 순위 산출 및 동타 처리 기준 */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2">
                <h5 className="text-xs font-black text-stone-800">⚖️ 순위 판정 및 동타(Tie) 처리 기준</h5>
                <ul className="text-[11px] text-stone-600 space-y-1 list-disc list-inside leading-relaxed font-medium">
                  {room.gameMode === 'NEW_PERIO' ? (
                    <>
                      <li><strong>신페리오 순위</strong>: 12개 숨은 홀을 통해 산출된 <strong>네트 스코어(Net Score)</strong> 최저타 순으로 우승자를 결정합니다.</li>
                      <li><strong>동타 처리</strong>: 네트 스코어가 같을 경우 실타수(Gross)가 적은 선수가 우선하며, 실타수도 같으면 백카운트(후반 9홀 합산타수) 방식으로 순위를 매깁니다.</li>
                      <li><strong>메달리스트</strong>: 핸디캡과 무관하게 실제 18홀 가장 적은 타수를 기록한 최저타수 선수(Gross 1위)를 별도 시상합니다.</li>
                    </>
                  ) : room.gameMode === 'STROKE' ? (
                    <>
                      <li><strong>스크래치 순위</strong>: 규정 18홀 총 실타수가 가장 적은 선수가 1위를 차지합니다.</li>
                      <li><strong>동타 처리</strong>: 동타 발생 시 백카운트(Back Count: 후반 B코스 9홀 최저타, 동타 시 마지막 홀부터 역순 비교)로 결정합니다.</li>
                    </>
                  ) : room.gameMode === 'SCRAMBLE' ? (
                    <>
                      <li><strong>팀 경기</strong>: 조원 4명이 티샷 후 가장 좋은 공 위치에서 4명이 모두 다음 샷을 진행하는 방식입니다.</li>
                      <li>팀 협동과 친목을 극대화하며 초보자도 팀에 기여할 수 있는 팀전입니다.</li>
                    </>
                  ) : (
                    <>
                      <li><strong>명랑 친선</strong>: 순위 경쟁의 부담을 줄이고 회원 간의 친목과 즐거운 라운드를 도모하는 경기입니다.</li>
                    </>
                  )}
                </ul>
              </div>

              {/* 참가비 및 총무 계좌 */}
              <div className="bg-stone-100 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="font-bold text-stone-600">대회 참가비</span>
                <span className="font-black text-stone-900">
                  {room.entryFee && room.entryFee > 0 ? `${room.entryFee.toLocaleString()}원` : '무료 (참가비 없음)'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-200 shrink-0">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-black text-xs shadow transition active:scale-95 cursor-pointer"
              >
                확인 및 닫기
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
                  <h3 className="font-black text-base leading-tight">대회 방식 & 시상 룰 설정</h3>
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
                  <span>1. 공식 경기 방식 선택</span>
                  <span className="text-[10px] text-purple-700 font-bold">5대 표준 모드 지원</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { mode: 'NEW_PERIO', title: '🎯 신페리오 방식', desc: '12홀 핸디캡 (추천)' },
                    { mode: 'STROKE', title: '🏆 정통 스트로크', desc: '18홀 스크래치 순위' },
                    { mode: 'SCRAMBLE', title: '🤝 팀 스크램블', desc: '4인 1조 베스트볼' },
                    { mode: 'CASUAL', title: '⛳ 친선 명랑 라운드', desc: '순위 부담 제로' },
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
                  <span>2. 우승자 독식 방지 (시상 유예) 로컬 룰</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  상급자가 상품을 매번 독식하는 것을 방지합니다. 1등을 하더라도 <strong>명예 메달리스트는 유지</strong>하되, <strong>실제 1위 시상품은 차순위(2위) 회원에게 승계</strong>됩니다.
                </p>

                {/* 유예 기간 라디오 */}
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { val: 0, label: '미적용' },
                    { val: 1, label: '직전 1회' },
                    { val: 2, label: '최근 2회' },
                    { val: 3, label: '최근 3개월' },
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
                      직전 우승자 이름 (쉼표로 구분)
                    </label>
                    <input
                      type="text"
                      value={cfgLastWinnerNames}
                      onChange={(e) => setCfgLastWinnerNames(e.target.value)}
                      placeholder="예: 박찬호, 김대희"
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600"
                    />
                    <p className="text-[10px] text-purple-800 font-medium">
                      💡 여기에 적힌 회원이 이번 대회에서 1위를 차지하면 상품이 2위에게 자동 승계됩니다.
                    </p>
                  </div>
                )}
              </div>

              {/* [STEP 3] 이색 특별상 & 행운상 옵션 토글 */}
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2.5">
                <div className="text-xs font-black text-stone-800">3. 특별상 및 현장 추첨 옵션</div>

                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfgEnableSpecialAwards}
                    onChange={(e) => setCfgEnableSpecialAwards(e.target.checked)}
                    className="w-4 h-4 text-purple-700 rounded border-stone-300"
                  />
                  <span>🎖️ 이색 특별상 자동 집계 (다파상, 오리상, 행운의 7위상, 아차상, 꼴찌 격려상)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfgEnableLuckyDraw}
                    onChange={(e) => setCfgEnableLuckyDraw(e.target.checked)}
                    className="w-4 h-4 text-purple-700 rounded border-stone-300"
                  />
                  <span>🎰 현장 실시간 행운상 추첨기 가동 (시상식 즉석 룰렛)</span>
                </label>
              </div>

              {/* [STEP 4] 로컬 룰 및 특이 규정 */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-stone-800">4. 주최측 로컬 룰 & 공지사항</label>
                <div className="flex gap-1 flex-wrap">
                  {[
                    'OB 시 2벌타 및 특설티(드롭존) 플레이',
                    '컨시드는 1클럽(30cm) 이내 인정',
                    '벙커 러프 발자국 정리 후 무벌타 드롭',
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
                  placeholder="추가 안내사항이나 로컬 룰을 입력하세요..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAwardConfigModal(false)}
                  className="w-1/2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-black text-xs transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-black text-xs shadow-md transition active:scale-95 cursor-pointer"
                >
                  설정 저장 및 반영
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
                  <h3 className="font-black text-base leading-tight">현장 실시간 행운상 추첨기</h3>
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
                  <span>추첨할 상품 명칭</span>
                  <span className="text-amber-700 font-bold text-[10px]">빠른 선택 가능</span>
                </label>
                <div className="flex gap-1 flex-wrap">
                  {['양말 세트', '파크골프 공', '고급 모자', '골프 장갑', '1만원 상품권'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDrawPrizeName(`행운상 (${item})`)}
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
                  placeholder="예: 행운상 1호 (파크골프 공 1더즌)"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* 추첨 대상 필터 */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-stone-800">추첨 대상 범위</label>
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
                    <div className="text-xs">🎁 미수상자 배려 (추천)</div>
                    <div className="text-[10px] text-stone-500 font-normal mt-0.5">
                      상 못 받은 회원만 대상 (골고루 시상)
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
                    <div className="text-xs">👥 전체 참가자 대상</div>
                    <div className="text-[10px] text-stone-500 font-normal mt-0.5">
                      1~3위 포함 전원 100% 무작위
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
                      행운의 주인공을 찾는 중...
                    </div>
                    <div className="text-2xl font-black text-stone-900 tracking-tight transition-all">
                      {currentCandidateName || '두구두구...'}
                    </div>
                  </div>
                ) : drawnWinner ? (
                  <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-5 text-center shadow-lg space-y-2 animate-fadeIn border border-amber-300">
                    <Sparkles className="w-8 h-8 text-amber-200 mx-auto" />
                    <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                      🎉 축하합니다! 당첨되었습니다 🎉
                    </span>
                    <h4 className="text-2xl font-black text-white pt-1">
                      {drawnWinner.groupNumber ? `[${drawnWinner.groupNumber}조] ` : ''}
                      {drawnWinner.name} 회원님!
                    </h4>
                    <p className="text-xs text-amber-100 font-extrabold">
                      🎁 선물: {drawPrizeName}
                    </p>

                    <div className="pt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={handleStartLuckyDraw}
                        className="w-1/2 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-black transition cursor-pointer"
                      >
                        다시 뽑기 🔄
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmLuckyWinner}
                        className="w-1/2 py-2.5 bg-white text-amber-950 hover:bg-amber-50 rounded-xl text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
                      >
                        당첨 확정 [✅]
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 text-center space-y-2">
                    <div className="text-3xl">🎰</div>
                    <h4 className="text-sm font-black text-stone-800">
                      현장 즉석 룰렛 행운 추첨
                    </h4>
                    <p className="text-xs text-stone-500 font-medium">
                      아래 <strong>[추첨 시작]</strong> 버튼을 누르면 참가자 명단이 룰렛처럼 회전하며 당첨자를 선정합니다!
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleStartLuckyDraw}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl text-xs font-black shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4 text-amber-200" />
                        <span>추첨 시작! (룰렛 회전 🎲)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 기 당첨자 목록 */}
              {room.awardConfig?.luckyDrawWinners && room.awardConfig.luckyDrawWinners.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-xs font-extrabold text-stone-800 flex items-center justify-between">
                    <span>현재까지 당첨된 행운상 ({room.awardConfig.luckyDrawWinners.length}명)</span>
                  </div>
                  <div className="divide-y divide-stone-100 bg-stone-50 rounded-2xl border border-stone-200 max-h-36 overflow-y-auto">
                    {room.awardConfig.luckyDrawWinners.map((lw, idx) => (
                      <div
                        key={lw.id}
                        className="p-2 flex items-center justify-between text-xs font-bold text-stone-700"
                      >
                        <span>
                          {idx + 1}. <strong>{lw.name}</strong> {lw.groupNumber ? `(${lw.groupNumber}조)` : ''} - 🎁 {lw.prizeName}
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
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
