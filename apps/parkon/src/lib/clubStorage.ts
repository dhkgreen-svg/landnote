import {
  ClubEventRoom,
  ClubGroup,
  ClubPlayer,
  ClubLeaderboardTeam,
  ClubLeaderboardIndividual,
  ParkGolfClub,
  ClubMember,
  ArchivedClubMember,
  ClubChronicleTournament,
  ClubInvitation,
  FlashGathering,
  LuckyDrawWinner,
  AwardRuleConfig,
  SpecialAwardWinner,
  SpecialAwardType,
  ClubRecruitStatus,
} from '@/types/club';
import { supabase } from './supabase';
import { calculateTier, getUserCompleted9Holes, UserDiamondTier } from './courseBlockTier';
import {
  generateSealedNewPerioHolesSync,
  verifyAndUnsealHolesSync,
  calculateDynamicNewPerio,
} from './newPerioSealer';

const STORAGE_KEYS = {
  CLUB_ROOMS: 'parkon_club_rooms_v1',
  ACTIVE_CLUB_ROOM_ID: 'parkon_active_club_room_id_v1',
  CLUBS: 'parkon_clubs_v2',
  MY_CLUB_IDS: 'parkon_my_club_ids_v1',
  CLUB_INVITATIONS: 'parkon_club_invitations_v1',
  FLASH_GATHERINGS: 'parkon_flash_gatherings_v1',
  CLUB_CHRONICLES: 'parkon_club_chronicles_v1',
};

// 기본 번개 데이터 (사용자 직접 개설 전에는 빈 목록 유지)
function generateDefaultSeedFlash(): FlashGathering[] {
  return [];
}

export const ClubStorage = {
  // 1. 전체 방 목록 조회
  getAllRooms(): ClubEventRoom[] {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLUB_ROOMS);
      if (data !== null) {
        const rooms: ClubEventRoom[] = JSON.parse(data);
        // 사용자가 직접 만든 방만 유지하고 이전 가상 시드 방('dongrak-monthly-sep') 및 비정상 복사/홍보 텍스트 방 정리
        const isCorrupted = (str?: string) => {
          if (!str) return false;
          return /160억|준신축|빌딩|수지분석|대로변|메디컬|vercel\.app|https?:\/\//i.test(str) || str.length > 80 || str.includes('\n');
        };

        const realRooms = rooms.filter((r) => {
          if (r.id === 'dongrak-monthly-sep') return false;
          if (isCorrupted(r.title) || isCorrupted(r.clubName)) return false;
          if (r.participatingClubs?.some((c) => isCorrupted(c.clubName))) return false;
          return true;
        });
        if (realRooms.length !== rooms.length) {
          localStorage.setItem(STORAGE_KEYS.CLUB_ROOMS, JSON.stringify(realRooms));
        }

        // 혹시 남아있을 수 있는 구버전 레거시 키의 오염 데이터도 함께 소탕
        ['parkon_club_rooms', 'parkon_club_event_rooms', 'parkon_tournament_rooms'].forEach((k) => {
          try {
            const leg = localStorage.getItem(k);
            if (leg && /160억|준신축|빌딩|수지분석|대로변|메디컬|vercel\.app|https?:\/\//i.test(leg)) {
              localStorage.removeItem(k);
            }
          } catch {}
        });

        return realRooms;
      }
    } catch {
      // fallback
    }
    return [];
  },

  // 2. 단일 방 조회
  getRoom(roomId: string): ClubEventRoom | null {
    const rooms = this.getAllRooms();
    const found = rooms.find((r) => r.id === roomId);
    return found || null;
  },

  // 3. 방 저장
  saveRoom(room: ClubEventRoom): void {
    if (typeof window === 'undefined') return;
    try {
      const rooms = this.getAllRooms().filter((r) => r.id !== room.id);
      rooms.unshift(room);
      // [10만명 3개월 누적 대비] 최근 50개 룸 롤링 보관 (과거 완료 대회는 연대기 실록으로 영구 보존)
      const cappedRooms = rooms.slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.CLUB_ROOMS, JSON.stringify(cappedRooms));

      // 📜 대회 개최 내용 및 경기 기록을 클럽 연대기(Club Chronicle)에 영구 보존
      if (room.clubId || (room.groups && room.groups.some((g) => g.players.length > 0))) {
        this.archiveEventRoomToClubChronicle(room);
      }
    } catch (e) {
      console.error('Failed to save club room:', e);
    }
  },

  // 3-0. 방 삭제
  deleteRoom(roomId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLUB_ROOMS);
      const rooms: ClubEventRoom[] = data ? JSON.parse(data) : [];
      const updated = rooms.filter((r) => r.id !== roomId);
      localStorage.setItem(STORAGE_KEYS.CLUB_ROOMS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete club room:', e);
    }
  },

  // 3-0-1. 방 정보 수정 / 관리
  updateRoom(roomId: string, updates: Partial<ClubEventRoom>): ClubEventRoom | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLUB_ROOMS);
      const rooms: ClubEventRoom[] = data ? JSON.parse(data) : [];
      const idx = rooms.findIndex((r) => r.id === roomId);
      if (idx === -1) return null;
      rooms[idx] = { ...rooms[idx], ...updates };
      localStorage.setItem(STORAGE_KEYS.CLUB_ROOMS, JSON.stringify(rooms));
      return rooms[idx];
    } catch (e) {
      console.error('Failed to update club room:', e);
      return null;
    }
  },

  // 3-1. 최적 조 수 및 조별 인원 자동 계산 (3~4인 기준)
  calculateOptimalGroups(playerCount: number): { groupCount: number; distribution: number[] } {
    if (playerCount <= 0) return { groupCount: 1, distribution: [] };
    if (playerCount <= 4) return { groupCount: 1, distribution: [playerCount] };
    if (playerCount === 5) return { groupCount: 2, distribution: [3, 2] };

    // 6인 이상: 3~4인 1조 최적 분할
    const k = Math.ceil(playerCount / 4);
    const fourCount = Math.max(0, playerCount - 3 * k);
    const threeCount = Math.max(0, 4 * k - playerCount);

    const distribution: number[] = [];
    for (let i = 0; i < fourCount; i++) distribution.push(4);
    for (let i = 0; i < threeCount; i++) distribution.push(3);

    const sum = distribution.reduce((a, b) => a + b, 0);
    if (sum !== playerCount) {
      const fallbackDist = Array(k).fill(0);
      for (let i = 0; i < playerCount; i++) fallbackDist[i % k]++;
      return { groupCount: k, distribution: fallbackDist };
    }

    return { groupCount: k, distribution };
  },

  // 3-2. 대기 풀에 참가자 등록 (Lobby Pool)
  addToWaitingPool(
    roomId: string,
    player: {
      name: string;
      gender?: 'M' | 'F';
      handicapTier?: 'ADVANCED' | 'INTERMEDIATE' | 'BEGINNER';
    }
  ): ClubEventRoom | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const trimmed = player.name.trim();
    if (!trimmed) return room;

    if (!room.waitingPool) room.waitingPool = [];

    // 중복 체크
    const exists =
      room.waitingPool.some((p) => p.name === trimmed) ||
      room.groups.some((g) => g.players.some((p) => p.name === trimmed));
    if (exists) {
      alert(`'${trimmed}' 님은 이미 참가 신청 명단에 등록되어 있습니다.`);
      return room;
    }

    const currentActiveCount =
      (room.groups?.reduce((acc, g) => acc + (g.players?.length || 0), 0) || 0) +
      room.waitingPool.filter((p) => !p.waitNumber).length;
    const targetLimit = room.targetTotalPlayers || (room.groups?.length ? room.groups.length * 4 : 0);

    let waitNumber: number | undefined = undefined;
    if (targetLimit > 0 && currentActiveCount >= targetLimit) {
      const currentWaitingCount = room.waitingPool.filter((p) => p.waitNumber).length;
      waitNumber = currentWaitingCount + 1;
    }

    const newPlayer: ClubPlayer = {
      id: `wp_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      isLeader: false,
      scores: {},
      totalStrokes: 0,
      parDiff: 0,
      holesCompleted: 0,
      gender: player.gender || 'M',
      handicapTier: player.handicapTier || 'INTERMEDIATE',
      waitNumber,
    };

    room.waitingPool.push(newPlayer);
    this.saveRoom(room);
    return room;
  },

  // 3-3. 대기 풀에서 참가자 제외 및 대기자 승격
  removeFromWaitingPool(roomId: string, playerId: string): ClubEventRoom | null {
    const room = this.getRoom(roomId);
    if (!room) return null;
    if (!room.waitingPool) return room;

    const target = room.waitingPool.find((p) => p.id === playerId);
    const wasRegular = target && !target.waitNumber;

    room.waitingPool = room.waitingPool.filter((p) => p.id !== playerId);

    // 정원 자리가 비었고 1순위 대기자가 있으면 자동 승격
    if (wasRegular) {
      const firstWait = room.waitingPool.find((p) => p.waitNumber === 1);
      if (firstWait) {
        delete firstWait.waitNumber;
      }
    }

    // 남은 대기자 번호 재정렬
    let waitSeq = 1;
    room.waitingPool.forEach((p) => {
      if (p.waitNumber) {
        p.waitNumber = waitSeq++;
      }
    });

    this.saveRoom(room);
    return room;
  },

  // 3-4. 스마트 조 편성 엔진 (완전 랜덤 / 조장 지정 고정 / 일부 인원 고정 / 성비 균형 / 실력 균형 / 조장 사전지정 유지)
  autoGroupPlayers(
    roomId: string,
    method: 'RANDOM' | 'BALANCED_GENDER' | 'BALANCED_TIER' | 'KEEP_LEADERS' | 'ASSIGN_LEADERS' | 'PARTIAL_ASSIGN',
    customGroupCount?: number,
    options?: {
      designatedLeaderIds?: string[];
      preAssignedGroupMap?: Record<string, number>;
    }
  ): ClubEventRoom | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    // 1. 전체 참가자 통합 수집 (대기 풀 + 기존 조원)
    const allPlayersMap = new Map<string, ClubPlayer>();
    if (room.waitingPool) {
      room.waitingPool.forEach((p) => allPlayersMap.set(p.id, { ...p, isLeader: false }));
    }
    room.groups.forEach((g) => {
      g.players.forEach((p) => {
        if (!allPlayersMap.has(p.id)) {
          allPlayersMap.set(p.id, { ...p, isLeader: false });
        }
      });
    });

    const allPlayers = Array.from(allPlayersMap.values());
    const totalCount = allPlayers.length;
    if (totalCount === 0) return room;

    // 2. 최적 조 수 계산
    const optimal = this.calculateOptimalGroups(totalCount);
    let groupCount = customGroupCount || optimal.groupCount;
    if (method === 'ASSIGN_LEADERS' && options?.designatedLeaderIds && options.designatedLeaderIds.length > 0) {
      groupCount = Math.max(groupCount, options.designatedLeaderIds.length);
    }
    if (method === 'PARTIAL_ASSIGN' && options?.preAssignedGroupMap) {
      const maxPreGroup = Math.max(...Object.values(options.preAssignedGroupMap), 1);
      groupCount = Math.max(groupCount, maxPreGroup);
    }

    // 3. 조별 정원 배분(distribution) 계산
    let distribution: number[] = [];
    if (customGroupCount && customGroupCount !== optimal.groupCount) {
      const dist = Array(groupCount).fill(0);
      for (let i = 0; i < totalCount; i++) dist[i % groupCount]++;
      distribution = dist;
    } else {
      distribution = [...optimal.distribution];
      while (distribution.length < groupCount) {
        distribution.push(4);
      }
    }

    // 4. 신규 조 객체 초기화 (ABCD 코스 순환)
    const letters = room.selectedCourseLetters.length > 0 ? room.selectedCourseLetters : ['A', 'B'];
    const newGroups: ClubGroup[] = [];
    for (let i = 1; i <= groupCount; i++) {
      const courseLetter = letters[(i - 1) % letters.length];
      newGroups.push({
        groupNumber: i,
        name: `${i}조`,
        startCourseLetter: courseLetter,
        leaderName: '',
        players: [],
        status: 'WAITING',
      });
    }

    // 5. 조건별 사전 고정 배치 처리
    const placedPlayerIds = new Set<string>();

    // [조건 A] 조장 N명 지정 후 돌리기 (ASSIGN_LEADERS)
    if (method === 'ASSIGN_LEADERS' && options?.designatedLeaderIds && options.designatedLeaderIds.length > 0) {
      options.designatedLeaderIds.forEach((leaderId, idx) => {
        if (idx < groupCount) {
          const leaderPlayer = allPlayers.find((p) => p.id === leaderId);
          if (leaderPlayer) {
            const playerObj: ClubPlayer = {
              ...leaderPlayer,
              isLeader: true,
            };
            newGroups[idx].players.push(playerObj);
            newGroups[idx].leaderName = playerObj.name;
            placedPlayerIds.add(leaderPlayer.id);
          }
        }
      });
    }
    // [조건 B] 일부 인원 특정 조 사전 배치 후 나머지 돌리기 (PARTIAL_ASSIGN)
    else if (method === 'PARTIAL_ASSIGN' && options?.preAssignedGroupMap) {
      Object.entries(options.preAssignedGroupMap).forEach(([playerId, targetGroupNumber]) => {
        const player = allPlayers.find((p) => p.id === playerId);
        const grpIdx = targetGroupNumber - 1;
        if (player && grpIdx >= 0 && grpIdx < groupCount) {
          const isFirstInGroup = newGroups[grpIdx].players.length === 0;
          const playerObj: ClubPlayer = {
            ...player,
            isLeader: isFirstInGroup,
          };
          newGroups[grpIdx].players.push(playerObj);
          if (isFirstInGroup) {
            newGroups[grpIdx].leaderName = playerObj.name;
          }
          placedPlayerIds.add(player.id);
        }
      });
    }
    // [조건 C] 기존 조장 유지 (KEEP_LEADERS)
    else if (method === 'KEEP_LEADERS') {
      room.groups.forEach((g, idx) => {
        if (idx < groupCount) {
          const leader = g.players.find((p) => p.isLeader) || g.players[0];
          if (leader) {
            const playerObj: ClubPlayer = { ...leader, isLeader: true };
            newGroups[idx].players.push(playerObj);
            newGroups[idx].leaderName = playerObj.name;
            placedPlayerIds.add(leader.id);
          }
        }
      });
    }

    // 6. 나머지 일반 대상 인원(후보군) 수집
    const remainingCandidates = allPlayers.filter((p) => !placedPlayerIds.has(p.id));

    // 7. 후보군 셔플 및 정렬
    let orderedCandidates = [...remainingCandidates];

    if (method === 'RANDOM' || method === 'ASSIGN_LEADERS' || method === 'PARTIAL_ASSIGN' || method === 'KEEP_LEADERS') {
      // 순수 무작위 셔플 (Fisher-Yates)
      for (let i = orderedCandidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [orderedCandidates[i], orderedCandidates[j]] = [orderedCandidates[j], orderedCandidates[i]];
      }
    } else if (method === 'BALANCED_GENDER') {
      const males = orderedCandidates.filter((p) => p.gender !== 'F');
      const females = orderedCandidates.filter((p) => p.gender === 'F');

      males.sort(() => Math.random() - 0.5);
      females.sort(() => Math.random() - 0.5);

      orderedCandidates = [];
      const maxLen = Math.max(males.length, females.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < males.length) orderedCandidates.push(males[i]);
        if (i < females.length) orderedCandidates.push(females[i]);
      }
    } else if (method === 'BALANCED_TIER') {
      const tierWeight = { ADVANCED: 3, INTERMEDIATE: 2, BEGINNER: 1 };
      orderedCandidates.sort((a, b) => {
        const wa = tierWeight[a.handicapTier || 'INTERMEDIATE'];
        const wb = tierWeight[b.handicapTier || 'INTERMEDIATE'];
        if (wb !== wa) return wb - wa;
        return Math.random() - 0.5;
      });
    }

    // 8. 스네이크 방식으로 남은 빈 슬롯 균등 분배
    let gIdx = 0;
    let forward = true;

    orderedCandidates.forEach((player) => {
      let targetGroup: ClubGroup | undefined;
      let attempts = 0;

      while (attempts < groupCount) {
        const group = newGroups[gIdx];
        const capacity = distribution[gIdx] || 4;
        if (group.players.length < capacity) {
          targetGroup = group;
          break;
        }
        if (forward) {
          gIdx++;
          if (gIdx >= groupCount) {
            gIdx = groupCount - 1;
            forward = false;
          }
        } else {
          gIdx--;
          if (gIdx < 0) {
            gIdx = 0;
            forward = true;
          }
        }
        attempts++;
      }

      if (!targetGroup) {
        newGroups.sort((a, b) => a.players.length - b.players.length);
        targetGroup = newGroups[0];
        newGroups.sort((a, b) => a.groupNumber - b.groupNumber);
      }

      const isFirst = targetGroup.players.length === 0;
      targetGroup.players.push({
        ...player,
        isLeader: isFirst,
      });

      if (forward) {
        gIdx++;
        if (gIdx >= groupCount) {
          gIdx = groupCount - 1;
          forward = false;
        }
      } else {
        gIdx--;
        if (gIdx < 0) {
          gIdx = 0;
          forward = true;
        }
      }
    });

    // 9. 최종 조장 확정
    newGroups.forEach((g) => {
      if (g.players.length > 0) {
        if (!g.players.some((p) => p.isLeader)) {
          g.players[0].isLeader = true;
        }
        const leader = g.players.find((p) => p.isLeader) || g.players[0];
        g.leaderName = leader.name;
      } else {
        g.leaderName = '';
      }
    });

    room.groups = newGroups;
    room.waitingPool = [];
    room.groupingMethod = method;
    room.targetTotalPlayers = totalCount;

    this.saveRoom(room);
    return room;
  },

  // 3-5. 조 간 선수 이동 (드래그/원클릭 이동)
  movePlayerBetweenGroups(
    roomId: string,
    fromGroupNum: number,
    toGroupNum: number,
    playerId: string
  ): ClubEventRoom | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const fromGroup = room.groups.find((g) => g.groupNumber === fromGroupNum);
    const toGroup = room.groups.find((g) => g.groupNumber === toGroupNum);
    if (!fromGroup || !toGroup) return null;

    const playerIndex = fromGroup.players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) return null;

    const [player] = fromGroup.players.splice(playerIndex, 1);
    player.isLeader = false;

    if (fromGroup.players.length > 0 && !fromGroup.players.some((p) => p.isLeader)) {
      fromGroup.players[0].isLeader = true;
      fromGroup.leaderName = fromGroup.players[0].name;
    } else if (fromGroup.players.length === 0) {
      fromGroup.leaderName = '';
    }

    toGroup.players.push(player);
    if (toGroup.players.length === 1) {
      player.isLeader = true;
      toGroup.leaderName = player.name;
    }

    this.saveRoom(room);
    return room;
  },

  // 3-6. [현장 긴급 대응] 결원(노쇼/지각) 발생 시 대기 1순위자 1초 긴급 투입 & 맞교환
  replacePlayerWithWaitingCandidate(
    roomId: string,
    groupNumber: number,
    missingPlayerId: string
  ): {
    success: boolean;
    replacedPlayerName?: string;
    newPlayerName?: string;
    room?: ClubEventRoom;
    message: string;
  } {
    const room = this.getRoom(roomId);
    if (!room) return { success: false, message: '모임 방을 찾을 수 없습니다.' };

    const targetGroup = room.groups.find((g) => g.groupNumber === groupNumber);
    if (!targetGroup) return { success: false, message: `${groupNumber}조를 찾을 수 없습니다.` };

    const pIdx = targetGroup.players.findIndex((p) => p.id === missingPlayerId);
    if (pIdx === -1) return { success: false, message: '해당 선수를 조에서 찾을 수 없습니다.' };

    const missingPlayer = targetGroup.players[pIdx];

    // 대기자 찾기 (대기 1순위 우선, 없으면 대기 풀 첫 번째)
    if (!room.waitingPool || room.waitingPool.length === 0) {
      return { success: false, message: '투입 가능한 대기 신청자(대기 풀)가 없습니다.' };
    }

    let candIdx = room.waitingPool.findIndex((p) => p.waitNumber === 1);
    if (candIdx === -1) candIdx = 0;

    const [candidate] = room.waitingPool.splice(candIdx, 1);
    delete candidate.waitNumber;

    // 조장 여부 승계 또는 신규 배정
    candidate.isLeader = missingPlayer.isLeader;
    if (candidate.isLeader) {
      targetGroup.leaderName = candidate.name;
    }

    // 조에서 결원자 제거하고 신규 대기자 투입
    targetGroup.players.splice(pIdx, 1, candidate);

    // 남은 대기자 번호 재정렬
    let seq = 1;
    room.waitingPool.forEach((p) => {
      p.waitNumber = seq++;
    });

    this.saveRoom(room);
    return {
      success: true,
      replacedPlayerName: missingPlayer.name,
      newPlayerName: candidate.name,
      room,
      message: `'${missingPlayer.name}' 님의 빈자리에 대기 1순위 '${candidate.name}' 님이 1초 만에 즉시 투입되었습니다! ⚡`,
    };
  },

  // 3-6-B. [현장 긴급 대응] 대기자가 없는 순수 결원(노쇼) 발생 시 '3인 1조' 규격으로 즉시 자동 전환
  convertGroupToThreePlayers(
    roomId: string,
    groupNumber: number,
    missingPlayerId: string
  ): {
    success: boolean;
    removedPlayerName?: string;
    group?: ClubGroup;
    room?: ClubEventRoom;
    message: string;
  } {
    const room = this.getRoom(roomId);
    if (!room) return { success: false, message: '모임 방을 찾을 수 없습니다.' };

    const targetGroup = room.groups.find((g) => g.groupNumber === groupNumber);
    if (!targetGroup) return { success: false, message: `${groupNumber}조를 찾을 수 없습니다.` };

    const pIdx = targetGroup.players.findIndex((p) => p.id === missingPlayerId);
    if (pIdx === -1) return { success: false, message: '해당 선수를 조에서 찾을 수 없습니다.' };

    const [removedPlayer] = targetGroup.players.splice(pIdx, 1);

    // 잔여 인원(3인) 티오프 타순 및 조장 자동 재정렬
    if (targetGroup.players.length > 0) {
      if (!targetGroup.players.some((p) => p.isLeader)) {
        targetGroup.players[0].isLeader = true;
      }
      const leader = targetGroup.players.find((p) => p.isLeader) || targetGroup.players[0];
      targetGroup.leaderName = leader.name;
    } else {
      targetGroup.leaderName = '';
    }

    this.saveRoom(room);
    this.syncEventToSupabase(room).catch(() => {});

    return {
      success: true,
      removedPlayerName: removedPlayer.name,
      group: targetGroup,
      room,
      message: `'${removedPlayer.name}' 님의 불참으로 [${groupNumber}조]가 결번 없이 자연스러운 3인 1조로 즉시 전환되었습니다! ⚡`,
    };
  },

  // 3-6-C. 🔓 [신페리오 투명 공개] 대회 마감 시 자물쇠 해제 및 무결성 검증
  unsealTournamentHiddenHoles(
    roomId: string
  ): {
    success: boolean;
    unsealedHoles: number[];
    room?: ClubEventRoom;
    message: string;
  } {
    const room = this.getRoom(roomId);
    if (!room) return { success: false, unsealedHoles: [], message: '모임 방을 찾을 수 없습니다.' };

    if (room.isUnsealed && room.unsealedHoles && room.unsealedHoles.length > 0) {
      return {
        success: true,
        unsealedHoles: room.unsealedHoles,
        room,
        message: '이미 신페리오 숨은 홀이 공개되어 있습니다.',
      };
    }

    if (!room.sealedSecret) {
      // 봉인 토큰이 없을 경우 즉석에서 12개 무작위 생성
      const fallback = generateSealedNewPerioHolesSync(room.totalHoles || 18);
      room.sealedSecret = fallback.sealedSecret;
      room.hiddenHolesHash = fallback.hiddenHolesHash;
    }

    const unsealRes = verifyAndUnsealHolesSync(room.sealedSecret, room.hiddenHolesHash);
    if (!unsealRes.success) {
      return { success: false, unsealedHoles: [], room, message: unsealRes.message };
    }

    room.isUnsealed = true;
    room.unsealedHoles = unsealRes.unsealedHoles;

    this.saveRoom(room);
    this.syncEventToSupabase(room).catch(() => {});

    return {
      success: true,
      unsealedHoles: unsealRes.unsealedHoles,
      room,
      message: `🎉 신페리오 12개 숨은 홀 [${unsealRes.unsealedHoles.join(', ')}번]이 전격 공개되었습니다!`,
    };
  },

  // 3-6-D. 🚀 [전 조 동시 출발 확정] 1조부터 N조까지 Supabase 4인 실시간 대기실 일괄 생성
  async launchAllTournamentGroups(
    roomId: string
  ): Promise<{
    success: boolean;
    room?: ClubEventRoom;
    launchedCount: number;
    message: string;
  }> {
    const room = this.getRoom(roomId);
    if (!room) return { success: false, launchedCount: 0, message: '모임 방을 찾을 수 없습니다.' };

    let count = 0;
    const now = Date.now();

    for (const group of room.groups) {
      const linkedRoundRoomId = `room_club_${room.id}_g${group.groupNumber}`;
      group.linkedRoundRoomId = linkedRoundRoomId;
      group.sessionId = `round_club_${room.id}_g${group.groupNumber}`;
      group.status = 'PLAYING';
      count++;

      // Supabase round_rooms 테이블 일괄 레코드 생성 (오프라인 Fail-Safe)
      try {
        await supabase.from('round_rooms').upsert(
          {
            room_id: linkedRoundRoomId,
            leader_name: group.leaderName || (group.players[0]?.name) || '조장',
            course_id: room.courseId,
            course_name: room.courseName,
            course_letter: group.startCourseLetter || 'A',
            start_hole_index: 1,
            player_count: group.players.length,
            players: group.players.map((p, pIdx) => ({
              id: p.id,
              name: p.name,
              isLeader: p.isLeader || pIdx === 0,
              handicapTier: p.handicapTier || 'INTERMEDIATE',
            })),
            status: 'WAITING',
            updated_at: now,
          },
          { onConflict: 'room_id' }
        );
      } catch (err) {
        // 네트워크 장애 시에도 로컬 진행 보장
      }
    }

    room.status = 'PLAYING';
    this.saveRoom(room);
    await this.syncEventToSupabase(room);

    return {
      success: true,
      room,
      launchedCount: count,
      message: `🚀 총 ${count}개 조의 실시간 경기 대기실이 전원 기동되었습니다!`,
    };
  },

  // 3-6-D. 🔄 [3단계] 전 조 실시간 스코어 동기화 & 홀인원(1타) 감지
  async syncTournamentScoresFromRoundRooms(roomId: string): Promise<{
    success: boolean;
    room?: ClubEventRoom;
    holeInOneAlerts: { playerName: string; groupNumber: number; holeNumber: number }[];
    updatedGroupsCount: number;
  }> {
    const room = this.getRoom(roomId);
    if (!room) return { success: false, holeInOneAlerts: [], updatedGroupsCount: 0 };

    const holeInOneAlerts: { playerName: string; groupNumber: number; holeNumber: number }[] = [];
    let updatedGroupsCount = 0;

    // Supabase round_rooms 테이블에서 현재 대회의 연동 룸들 조회
    try {
      const roomPrefix = `room_club_${roomId}_g`;
      const { data, error } = await supabase
        .from('round_rooms')
        .select('*')
        .like('room_id', `${roomPrefix}%`);

      if (data && !error && data.length > 0) {
        for (const row of data) {
          const matchedGroup = room.groups.find((g) => g.linkedRoundRoomId === row.room_id);
          if (!matchedGroup) continue;

          const session = row.round_session;
          if (session && session.players && Array.isArray(session.players)) {
            updatedGroupsCount++;
            for (const sp of session.players) {
              const targetPlayer = matchedGroup.players.find((p) => p.name === sp.name || p.id === sp.id);
              if (targetPlayer) {
                const prevScores = targetPlayer.scores || {};
                targetPlayer.scores = sp.scores || targetPlayer.scores;
                targetPlayer.totalStrokes = sp.totalStrokes || targetPlayer.totalStrokes;
                targetPlayer.parDiff = sp.parDiff !== undefined ? sp.parDiff : targetPlayer.parDiff;
                targetPlayer.holesCompleted = Object.keys(targetPlayer.scores || {}).length;

                // 홀인원(1타) 신규 발생 감지
                if (sp.scores) {
                  for (const [hStr, score] of Object.entries(sp.scores)) {
                    const hNum = Number(hStr);
                    if (score === 1 && prevScores[hNum] !== 1) {
                      holeInOneAlerts.push({
                        playerName: targetPlayer.name,
                        groupNumber: matchedGroup.groupNumber,
                        holeNumber: hNum,
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      // 오프라인이거나 네트워크 오류 시 기존 로컬 데이터 유지
    }

    if (updatedGroupsCount > 0) {
      this.saveRoom(room);
    }

    return {
      success: true,
      room,
      holeInOneAlerts,
      updatedGroupsCount,
    };
  },

  // 3-7. 대회 공식 마감 & 영구 실록 확정
  finalizeTournament(roomId: string): { success: boolean; room?: ClubEventRoom; message: string } {
    const room = this.getRoom(roomId);
    if (!room) return { success: false, message: '모임 방을 찾을 수 없습니다.' };

    room.status = 'FINISHED';

    // 신페리오 경기 모드일 경우 대회 마감 시 숨은 홀 자동 자물쇠 해제 보장
    if (room.gameMode === 'NEW_PERIO' && !room.isUnsealed) {
      this.unsealTournamentHiddenHoles(roomId);
    }

    this.saveRoom(room);
    this.syncEventToSupabase(room).catch(() => {});

    return {
      success: true,
      room,
      message: `'${room.title}' 대회가 공식 마감되어 클럽 연대기에 영구 보존되었습니다! 🏆`,
    };
  },

  // 🌐 Supabase 'club_events' 원격 영구 동기화 (Fail-Safe)
  async syncEventToSupabase(room: ClubEventRoom): Promise<void> {
    if (!room || !room.id || typeof window === 'undefined') return;
    try {
      await supabase.from('club_events').upsert(
        {
          id: room.id,
          club_id: room.clubId || 'club-default',
          club_name: room.clubName,
          tournament_type: room.tournamentType || 'CLUB_INTERNAL',
          title: room.title,
          course_id: room.courseId,
          course_name: room.courseName,
          host_name: room.hostName,
          selected_course_letters: room.selectedCourseLetters,
          total_holes: room.totalHoles,
          target_total_players: room.targetTotalPlayers,
          entry_fee: room.entryFee,
          bank_account: room.bankAccount,
          game_mode: room.gameMode,
          game_mode_title: room.gameModeTitle,
          game_rule_notes: room.gameRuleNotes,
          near_pin_hole: room.nearPinHole,
          longest_hole: room.longestHole,
          award_config: room.awardConfig,
          hidden_holes_hash: room.hiddenHolesHash,
          sealed_secret: room.sealedSecret,
          is_unsealed: room.isUnsealed || false,
          unsealed_holes: room.unsealedHoles || [],
          groups: room.groups,
          waiting_pool: room.waitingPool || [],
          grouping_method: room.groupingMethod,
          status: room.status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch {}
  },

  // 🔄 Supabase에서 클럽 대회 목록 원격 가져오기 및 로컬 병합
  async fetchEventsFromSupabase(clubId?: string): Promise<ClubEventRoom[]> {
    if (typeof window === 'undefined') return this.getAllRooms();
    try {
      let query = supabase.from('club_events').select('*').order('updated_at', { ascending: false });
      if (clubId) {
        query = query.eq('club_id', clubId);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        const localRooms = this.getAllRooms();
        const mergedMap = new Map<string, ClubEventRoom>();
        localRooms.forEach((r) => mergedMap.set(r.id, r));

        data.forEach((row: any) => {
          const remoteRoom: ClubEventRoom = {
            id: row.id,
            clubId: row.club_id,
            clubName: row.club_name,
            tournamentType: row.tournament_type,
            title: row.title,
            courseId: row.course_id,
            courseName: row.course_name,
            hostName: row.host_name,
            selectedCourseLetters: row.selected_course_letters || ['A', 'B'],
            totalHoles: row.total_holes || 18,
            targetTotalPlayers: row.target_total_players,
            entryFee: row.entry_fee,
            bankAccount: row.bank_account,
            gameMode: row.game_mode,
            gameModeTitle: row.game_mode_title,
            gameRuleNotes: row.game_rule_notes,
            nearPinHole: row.near_pin_hole,
            longestHole: row.longest_hole,
            awardConfig: row.award_config,
            hiddenHolesHash: row.hidden_holes_hash,
            sealedSecret: row.sealed_secret,
            isUnsealed: row.is_unsealed,
            unsealedHoles: row.unsealed_holes,
            groups: row.groups || [],
            waitingPool: row.waiting_pool || [],
            groupingMethod: row.grouping_method,
            status: row.status,
            createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          };
          mergedMap.set(remoteRoom.id, remoteRoom);
        });

        const mergedList = Array.from(mergedMap.values());
        localStorage.setItem(STORAGE_KEYS.CLUB_ROOMS, JSON.stringify(mergedList));
        return mergedList;
      }
    } catch {}
    return this.getAllRooms();
  },

  // 4. 신규 방 생성
  createRoom(params: {
    title: string;
    courseId: string;
    courseName: string;
    hostName: string;
    selectedCourseLetters: string[];
    groupCount?: number;
    targetTotalPlayers?: number;
    clubId?: string;
    clubName?: string;
    tournamentType?: 'CLUB_MATCH' | 'REGIONAL_OPEN' | 'CLUB_INTERNAL';
    participatingClubs?: { clubId: string; clubName: string }[];
    matchTeamCount?: number;
    playersPerTeam?: number;
    matchInviteType?: 'DIRECT_CHALLENGE' | 'OPEN_CHALLENGE';
    regionScope?: string;
    entryFee?: number;
    bankAccount?: string;
    gameMode?: 'STROKE' | 'NEW_PERIO' | 'SCRAMBLE' | 'STABLEFORD' | 'CASUAL';
    gameModeTitle?: string;
    gameRuleNotes?: string;
    nearPinHole?: number;
    longestHole?: number;
  }): ClubEventRoom {
    const id = `club-${Date.now().toString(36)}`;
    const groups: ClubGroup[] = [];
    const letters = params.selectedCourseLetters.length > 0 ? params.selectedCourseLetters : ['A', 'B'];
    const cnt = params.groupCount || (params.targetTotalPlayers ? Math.ceil(params.targetTotalPlayers / 4) : 4);

    for (let i = 1; i <= cnt; i++) {
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

    const defaultRuleNotes = params.gameMode === 'NEW_PERIO'
      ? '신페리오 방식(12개 숨은 홀 핸디캡 산출), 컨시드 1클럽 샤프트 길이 이내 인정, OB 시 2벌타 후 특설티 진행'
      : '정통 스트로크 최저타수 순위, 컨시드 1클럽 샤프트 길이 이내 인정, OB 시 2벌타 후 특설티 진행';

    const newRoom: ClubEventRoom = {
      id,
      clubId: params.clubId,
      clubName: params.clubName,
      tournamentType: params.tournamentType || (params.participatingClubs && params.participatingClubs.length > 1 ? 'CLUB_MATCH' : 'CLUB_INTERNAL'),
      participatingClubs: params.participatingClubs,
      matchTeamCount: params.matchTeamCount,
      playersPerTeam: params.playersPerTeam,
      matchInviteType: params.matchInviteType,
      regionScope: params.regionScope,
      title: params.title.trim() || '파크골프 동호회 정기 모임',
      courseId: params.courseId,
      courseName: params.courseName,
      hostName: params.hostName.trim() || '총무',
      selectedCourseLetters: letters,
      totalHoles: letters.length * 9,
      targetTotalPlayers: params.targetTotalPlayers || cnt * 4,
      entryFee: params.entryFee ?? 10000,
      bankAccount: params.bankAccount?.trim() || '농협 352-1234-5678 김대희(총무)',
      gameMode: params.gameMode || 'NEW_PERIO',
      gameModeTitle: params.gameModeTitle || (params.gameMode === 'STROKE' ? '정통 스트로크 (최저타수)' : '신페리오 방식 (핸디캡 적용)'),
      gameRuleNotes: params.gameRuleNotes?.trim() || defaultRuleNotes,
      nearPinHole: params.nearPinHole,
      longestHole: params.longestHole,
      // 🔒 [NEW] 신페리오 사전 무작위 봉인 필드 자동 생성
      hiddenHolesHash: params.gameMode !== 'STROKE' ? generateSealedNewPerioHolesSync(letters.length * 9).hiddenHolesHash : undefined,
      sealedSecret: params.gameMode !== 'STROKE' ? generateSealedNewPerioHolesSync(letters.length * 9).sealedSecret : undefined,
      isUnsealed: false,
      unsealedHoles: [],
      groups,
      waitingPool: [],
      status: 'RECRUITING',
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.saveRoom(newRoom);
    this.syncEventToSupabase(newRoom).catch(() => {});
    return newRoom;
  },

  // 5. 특정 조 참가
  joinGroup(
    roomId: string,
    groupNumber: number,
    playerName: string,
    asLeader = false,
    gender: 'M' | 'F' = 'M',
    handicapTier: 'ADVANCED' | 'INTERMEDIATE' | 'BEGINNER' = 'INTERMEDIATE'
  ): ClubEventRoom | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const group = room.groups.find((g) => g.groupNumber === groupNumber);
    if (!group) return null;

    // 이미 같은 이름이 있는지 확인
    const trimmed = playerName.trim();
    if (!trimmed) return room;

    const existingPlayer = group.players.find((p) => p.name === trimmed);
    if (existingPlayer) return room;

    if (group.players.length >= 5) {
      alert('해당 조는 이미 5명 정원이 찼습니다!');
      return room;
    }

    const isFirst = group.players.length === 0;
    const makeLeader = asLeader || isFirst || !group.leaderName;

    const newPlayer: ClubPlayer = {
      id: `p_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      isLeader: makeLeader,
      scores: {},
      totalStrokes: 0,
      parDiff: 0,
      holesCompleted: 0,
      gender,
      handicapTier,
    };

    if (makeLeader) {
      group.players.forEach((p) => (p.isLeader = false));
      group.leaderName = trimmed;
    }

    group.players.push(newPlayer);
    this.saveRoom(room);
    return room;
  },

  // 6. 조에서 나가기
  leaveGroup(roomId: string, groupNumber: number, playerId: string): ClubEventRoom | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const group = room.groups.find((g) => g.groupNumber === groupNumber);
    if (!group) return null;

    group.players = group.players.filter((p) => p.id !== playerId);
    if (group.players.length > 0 && !group.players.some((p) => p.isLeader)) {
      group.players[0].isLeader = true;
      group.leaderName = group.players[0].name;
    } else if (group.players.length === 0) {
      group.leaderName = '';
    }

    this.saveRoom(room);
    return room;
  },

  // 7. 조장 지정
  setGroupLeader(roomId: string, groupNumber: number, playerId: string): ClubEventRoom | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const group = room.groups.find((g) => g.groupNumber === groupNumber);
    if (!group) return null;

    group.players.forEach((p) => {
      if (p.id === playerId) {
        p.isLeader = true;
        group.leaderName = p.name;
      } else {
        p.isLeader = false;
      }
    });

    this.saveRoom(room);
    return room;
  },

  // 8. 조별 타수 동기화
  updateGroupScores(
    roomId: string,
    groupNumber: number,
    playerUpdates: { playerId?: string; playerName: string; scores: Record<number, number>; totalStrokes: number; parDiff: number; holesCompleted: number }[]
  ): ClubEventRoom | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const group = room.groups.find((g) => g.groupNumber === groupNumber);
    if (!group) return null;

    let groupTotal = 0;
    let validCount = 0;

    playerUpdates.forEach((up) => {
      const p = group.players.find((pl) => (up.playerId && pl.id === up.playerId) || pl.name === up.playerName);
      if (p) {
        p.scores = up.scores;
        p.totalStrokes = up.totalStrokes;
        p.parDiff = up.parDiff;
        p.holesCompleted = up.holesCompleted;
        groupTotal += up.totalStrokes;
        validCount++;
      }
    });

    if (validCount > 0) {
      group.totalScore = groupTotal;
      group.avgScore = Math.round((groupTotal / validCount) * 10) / 10;
      if (group.status !== 'FINISHED') {
        group.status = 'PLAYING';
      }
    }

    this.saveRoom(room);
    return room;
  },

  // 8-1. 조 상태 변경 (대기 / 경기 중 / 완주)
  setGroupStatus(roomId: string, groupNumber: number, status: 'WAITING' | 'PLAYING' | 'FINISHED'): ClubEventRoom | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const group = room.groups.find((g) => g.groupNumber === groupNumber);
    if (!group) return null;

    group.status = status;
    if (room.groups.every((g) => g.status === 'FINISHED')) {
      room.status = 'FINISHED';
    } else if (room.groups.some((g) => g.status === 'PLAYING' || g.status === 'FINISHED')) {
      room.status = 'PLAYING';
    }

    this.saveRoom(room);
    return room;
  },

  // 9. 팀(조)별 실시간 리더보드 계산
  getTeamLeaderboard(room: ClubEventRoom): ClubLeaderboardTeam[] {
    const list: ClubLeaderboardTeam[] = room.groups.map((g) => {
      let total = 0;
      let totalParDiff = 0;
      let maxHoles = 0;
      const count = g.players.length;

      g.players.forEach((p) => {
        total += p.totalStrokes || 0;
        totalParDiff += p.parDiff || 0;
        if (p.holesCompleted > maxHoles) maxHoles = p.holesCompleted;
      });

      const avgStrokes = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
      const avgParDiff = count > 0 ? Math.round((totalParDiff / count) * 10) / 10 : 0;

      return {
        rank: 0,
        groupNumber: g.groupNumber,
        groupName: g.name,
        leaderName: g.leaderName || '미지정',
        playersCount: count,
        totalStrokes: total,
        avgStrokes,
        parDiff: avgParDiff,
        holesCompleted: maxHoles,
      };
    });

    // 정렬: 진행 홀이 있고 평균 타수가 낮은 조가 1등
    list.sort((a, b) => {
      if (a.playersCount === 0 && b.playersCount === 0) return a.groupNumber - b.groupNumber;
      if (a.playersCount === 0) return 1;
      if (b.playersCount === 0) return -1;
      if (a.avgStrokes === 0 && b.avgStrokes === 0) return a.groupNumber - b.groupNumber;
      if (a.avgStrokes === 0) return 1;
      if (b.avgStrokes === 0) return -1;
      return a.avgStrokes - b.avgStrokes;
    });

    list.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return list;
  },

  // 9-1. 경기 방식 메타데이터 안내
  getGameModeInfo(mode?: 'STROKE' | 'NEW_PERIO' | 'SCRAMBLE' | 'STABLEFORD' | 'CASUAL') {
    switch (mode) {
      case 'NEW_PERIO':
        return {
          key: 'NEW_PERIO',
          title: '신페리오 방식 (핸디캡 적용)',
          badge: '🎯 신페리오',
          shortDesc: '12개 숨은 홀 기반 핸디캡 자동 계산 · 초보자도 우승 가능',
          ruleDetail:
            '18홀 중 12개 숨은 홀 타수를 집계하여 핸디캡을 산출한 뒤, [총타수 - 핸디캡 = 네트스코어]로 순위를 결정합니다. 당일 샷 감각이 좋은 초보 회원도 실력자와 공평하게 우승을 겨룰 수 있는 가장 인기 있는 방식입니다.',
        };
      case 'SCRAMBLE':
        return {
          key: 'SCRAMBLE',
          title: '팀 스크램블 (단체 베스트볼)',
          badge: '🤝 팀 스크램블',
          shortDesc: '팀원 전원 티샷 후 가장 좋은 공 위치에서 다음 샷 진행',
          ruleDetail:
            '조원 모두가 티샷한 후 가장 좋은 위치의 공을 선택하여 전원이 그 위치에서 다음 샷을 합니다. 초보자의 부담을 덜고 팀원 간의 협동과 친목을 극대화하는 즐거운 경기입니다.',
        };
      case 'STABLEFORD':
        return {
          key: 'STABLEFORD',
          title: '스테이블포드 (승점제)',
          badge: '🎖️ 스테이블포드',
          shortDesc: '홀별 타수에 따른 승점 합산 방식 · 공격적인 플레이 유도',
          ruleDetail:
            '알바트로스 5점, 이글 4점, 버디 3점, 파 2점, 보기 1점 등 홀별 성적에 따라 승점을 부여하고, 최종 승점이 가장 높은 선수가 우승하는 경기 방식입니다.',
        };
      case 'CASUAL':
        return {
          key: 'CASUAL',
          title: '친선 명랑 라운드 (친목)',
          badge: '⛳ 친선 명랑',
          shortDesc: '순위 경쟁 없이 건강과 친목에 집중하는 자유 라운드',
          ruleDetail:
            '승패나 순위의 부담 없이 동호인 간의 매너와 친목, 건강 증진에 집중하는 자유로운 라운드입니다.',
        };
      case 'STROKE':
      default:
        return {
          key: 'STROKE',
          title: '정통 스트로크 플레이 (최저타수)',
          badge: '🏆 정통 스트로크',
          shortDesc: '18홀 총 타수가 가장 적은 선수가 우승하는 정석 챔피언십',
          ruleDetail:
            '규정된 18홀의 총 타수가 가장 적은 순서대로 순위를 매기는 가장 정통적이고 공인된 경기 방식입니다. 동타 시 후반 9홀(백카운트) 최저타순으로 순위를 결정합니다.',
        };
    }
  },

  // 10. 개인별 실시간 리더보드 계산 (신페리오 핸디캡 및 정통 스트로크 지원)
  getIndividualLeaderboard(room: ClubEventRoom): ClubLeaderboardIndividual[] {
    const list: ClubLeaderboardIndividual[] = [];
    const isNewPerio = room.gameMode === 'NEW_PERIO';
    const isUnsealed = !!room.isUnsealed;
    const activeHiddenHoles = (isUnsealed && room.unsealedHoles && room.unsealedHoles.length > 0)
      ? room.unsealedHoles
      : [];

    room.groups.forEach((g) => {
      g.players.forEach((p) => {
        let handicap: number | undefined;
        let netScore: number | undefined;

        if (isNewPerio && p.holesCompleted > 0) {
          if (isUnsealed && activeHiddenHoles.length > 0) {
            // 🔓 [공개 완료] 암호 해제된 숨은 홀 기반 공정 정밀 계산
            const calc = calculateDynamicNewPerio(
              p.scores,
              p.totalStrokes,
              activeHiddenHoles,
              room.totalHoles || 18
            );
            handicap = calc.handicap;
            netScore = calc.netScore;
          } else {
            // 🔒 [봉인 진행 중] 경기 마감 전까지는 블라인드 처리 (사전 타수 조작 원천 차단)
            handicap = undefined;
            netScore = undefined;
          }
        }

        // 파크골프 공식 백카운트(후반 10~18번홀 타수 합계) 산출
        let backCountScore = 0;
        for (let h = 10; h <= 18; h++) {
          if (typeof p.scores[h] === 'number') {
            backCountScore += p.scores[h];
          }
        }

        list.push({
          rank: 0,
          playerId: p.id,
          playerName: p.name,
          groupNumber: g.groupNumber,
          totalStrokes: p.totalStrokes || 0,
          parDiff: p.parDiff || 0,
          holesCompleted: p.holesCompleted || 0,
          isLeader: p.isLeader,
          handicap,
          netScore,
          backCountScore,
        });
      });
    });

    // 정렬: 신페리오 공개 시 네트 스코어 최저타순, 미공개/스트로크는 총타수 최저타순
    // 동타 시 파크골프 공식 룰: 후반 9홀 백카운트 최저타순 우선!
    list.sort((a, b) => {
      if (a.holesCompleted === 0 && b.holesCompleted === 0) return 0;
      if (a.holesCompleted === 0) return 1;
      if (b.holesCompleted === 0) return -1;

      if (isNewPerio && isUnsealed && typeof a.netScore === 'number' && typeof b.netScore === 'number') {
        const diff = a.netScore - b.netScore;
        if (diff !== 0) return diff;
        // 네트 동타 시: 백카운트(후반 9홀) 적은 선수 우선
        const bcDiff = (a.backCountScore || 0) - (b.backCountScore || 0);
        if (bcDiff !== 0) return bcDiff;
        // 백카운트까지 같으면 실타수(Gross) 적은 선수 우선
        return a.totalStrokes - b.totalStrokes;
      }

      const strokeDiff = a.totalStrokes - b.totalStrokes;
      if (strokeDiff !== 0) return strokeDiff;

      // 스트로크 동타 시: 백카운트(후반 9홀) 적은 선수 우선
      const bcDiff = (a.backCountScore || 0) - (b.backCountScore || 0);
      if (bcDiff !== 0) return bcDiff;

      return (b.holesCompleted || 0) - (a.holesCompleted || 0);
    });

    list.forEach((item, idx) => {
      item.rank = idx + 1;
      // 동타 발생 여부 감지 및 판정 근거 부여
      const sameScoreWithNext = idx < list.length - 1 && (
        (isNewPerio && list[idx + 1].netScore === item.netScore) ||
        (!isNewPerio && list[idx + 1].totalStrokes === item.totalStrokes)
      );
      const sameScoreWithPrev = idx > 0 && (
        (isNewPerio && list[idx - 1].netScore === item.netScore) ||
        (!isNewPerio && list[idx - 1].totalStrokes === item.totalStrokes)
      );

      if (sameScoreWithNext || sameScoreWithPrev) {
        if (isNewPerio && typeof item.handicap === 'number') {
          item.tieBreakerReason = `신페리오 -${item.handicap} (백카운트 ${item.backCountScore || 0}타)`;
        } else if (item.backCountScore && item.backCountScore > 0) {
          item.tieBreakerReason = `백카운트 우선 (후반 9홀 ${item.backCountScore}타)`;
        }
      }
    });

    return list;
  },

  // 11. 카카오톡 / LINE 공유 링크 및 초대 메시지 생성
  generateKakaoShareText(room: ClubEventRoom, isJapanese?: boolean): string {
    const totalCurrentPlayers = room.groups.reduce((sum, g) => sum + g.players.length, 0);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.parkgolfallinone.com';
    const link = `${origin}/club/${room.id}`;
    const modeInfo = this.getGameModeInfo(room.gameMode);

    if (room.tournamentType === 'CLUB_MATCH') {
      const hostClub = room.clubName || (isJapanese ? '主催クラブ' : '주최 클럽');
      const oppClubs =
        room.participatingClubs && room.participatingClubs.length > 0
          ? room.participatingClubs
              .map((c) => c.clubName)
              .filter((n) => n !== hostClub)
              .join(', ') || (isJapanese ? '対戦相手クラブ' : '상대 클럽')
          : (isJapanese ? '全国パークゴルフクラブ' : '전국 파크골프 클럽');
      const teamCount = room.matchTeamCount || 2;
      const perTeam = room.playersPerTeam || Math.round((room.targetTotalPlayers || 32) / teamCount);
      const isDirect = room.matchInviteType !== 'OPEN_CHALLENGE';

      if (isJapanese) {
        return `⚔️ [ParkOn クラブ対抗戦 公式${isDirect ? '挑戦状' : 'オープンチャレンジ'}]

🏆 ${room.title}
🏛️ 対戦カード: [${hostClub}] ⚔️ VS ⚔️ [${oppClubs}]
📍 コース: ${room.courseName} (${room.totalHoles}ホール)
👥 出場枠: ${teamCount}チーム (各チーム ${perTeam}名 / 計 ${room.targetTotalPlayers || 32}名)
🎯 競技方式: ${room.gameModeTitle || modeInfo.title}
⛳ 組編成: ライバル直接対決組編成 (計 ${room.groups.length}組)

👇 以下のリンクから対抗戦を受諾し、エントリーを行ってください！
${link}`;
      }

      return `⚔️ [파크골프 올인원 클럽 대항전 공식 ${isDirect ? '도전장' : '오픈 챌린지'}]

🏆 ${room.title}
🏛️ 대결 매치: [${hostClub}] ⚔️ VS ⚔️ [${oppClubs}]
📍 구장: ${room.courseName} (${room.totalHoles}홀)
👥 출전 엔트리: ${teamCount}개 팀 (팀당 ${perTeam}명 / 총 ${room.targetTotalPlayers || 32}명)
🎯 경기 방식: ${room.gameModeTitle || modeInfo.title}
⛳ 조 편성: 라이벌 크로스 맞대결 조편성 (총 ${room.groups.length}개 조)

👇 아래 링크를 눌러 대항전 수락 및 출전 엔트리를 등록하세요!
${link}`;
    }

    let feeInfo = '';
    if (typeof room.entryFee === 'number' && room.entryFee > 0) {
      feeInfo = isJapanese
        ? `\n💵 参加費: ${room.entryFee.toLocaleString()}ウォン`
        : `\n💵 참가비: ${room.entryFee.toLocaleString()}원`;
      if (room.bankAccount) {
        feeInfo += isJapanese ? `\n🏦 振込口座: ${room.bankAccount}` : `\n🏦 입금계좌: ${room.bankAccount}`;
      }
    } else if (room.entryFee === 0) {
      feeInfo = isJapanese ? `\n💵 参加費: 無料` : `\n💵 참가비: 무료`;
    }

    let rulesInfo = isJapanese ? `\n🎯 競技方式: ${room.gameModeTitle || modeInfo.title}` : `\n🎯 경기 방식: ${room.gameModeTitle || modeInfo.title}`;
    if (room.gameRuleNotes) {
      rulesInfo += isJapanese ? `\n📌 大会ルール: ${room.gameRuleNotes}` : `\n📌 대회 룰: ${room.gameRuleNotes}`;
    }

    if (isJapanese) {
      return `⛳ [パークゴルフ オールインワン クラブ招集招待]\n\n🏆 ${room.title}\n📍 コース: ${room.courseName}\n👥 参加人数: ${totalCurrentPlayers}名 / ${room.targetTotalPlayers}名 (${room.groups.length}組 編成)${feeInfo}${rulesInfo}\n\n以下のリンクから自分の組を確認し、リアルタイム電光掲示板へご参加ください:\n${link}`;
    }

    return `⛳ [파크골프 올인원 클럽 모임 초대]\n\n🏆 ${room.title}\n📍 구장: ${room.courseName}\n👥 참가 인원: ${totalCurrentPlayers}명 / ${room.targetTotalPlayers}명 (${room.groups.length}개 조 편성)${feeInfo}${rulesInfo}\n\n아래 링크를 누르면 본인 조 확인 및 실시간 스코어보드로 입장합니다:\n${link}`;
  },

  // 12. 대회 최종 결과 텍스트 리포트 생성 (총무 복사용)
  generateTournamentResultReport(room: ClubEventRoom, isJapanese?: boolean): string {
    const teams = this.getTeamLeaderboard(room);
    const individuals = this.getIndividualLeaderboard(room);
    const modeInfo = this.getGameModeInfo(room.gameMode);

    if (isJapanese) {
      let report = `🏆 [${room.title} 大会最終結果]\n`;
      report += `📍 コース: ${room.courseName} (${room.totalHoles}ホール)\n`;
      const gameModeLabelJa =
        room.gameModeTitle ||
        (room.gameMode === 'NEW_PERIO'
          ? '新ペリオ (ハンディ戦)'
          : room.gameMode === 'SCRAMBLE'
          ? 'スクランブル'
          : room.gameMode === 'STABLEFORD'
          ? 'ステーブルフォード'
          : 'カジュアル親善');
      report += `🎯 競技方式: ${gameModeLabelJa}\n\n`;

      report += `🥇 [チーム対抗戦 団体順位]\n`;
      const displayTeams = teams.slice(0, 5);
      displayTeams.forEach((t) => {
        const medal = t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : t.rank === 3 ? '🥉' : '▪️';
        report += `${medal} ${t.rank}位 ${t.groupName} (組長: ${t.leaderName}) : 平均 ${t.avgStrokes}打\n`;
      });
      if (teams.length > 5) {
        report += `  (※ 他 ${teams.length - 5}組の全順位はParkOn電光掲示板リンクで確認)\n`;
      }

      const getPlayerTagJa = (playerId: string, defaultName: string, groupNum?: number): string => {
        let matchedPhone: string | undefined;
        for (const g of room.groups) {
          const found = g.players.find((p) => p.name === defaultName || p.id === playerId);
          if (found?.phone) {
            matchedPhone = found.phone;
            break;
          }
        }
        if (!matchedPhone && room.clubId) {
          const club = this.getClubById(room.clubId);
          const member = club?.members.find((m) => m.name === defaultName || m.id === playerId);
          if (member?.phone) {
            matchedPhone = member.phone;
          }
        }
        const clubPart = room.clubName ? `${room.clubName}` : '';
        const phoneDigits = matchedPhone ? matchedPhone.replace(/[^0-9]/g, '') : '';
        const phonePart = phoneDigits.length >= 4 ? `末尾 ${phoneDigits.slice(-4)}` : '';
        const parts = [clubPart, phonePart || (groupNum ? `${groupNum}組` : '')].filter(Boolean);
        return parts.length > 0 ? ` (${parts.join(' / ')})` : (groupNum ? ` (${groupNum}組)` : '');
      };

      if (room.gameMode === 'NEW_PERIO') {
        report += `\n🎯 [新ペリオ個人戦 最終順位 (ハンディキャップ適用)]\n`;
        individuals.slice(0, 5).forEach((p) => {
          const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : '▪️';
          report += `${medal} ${p.rank}位 ${p.playerName}${getPlayerTagJa(p.playerId, p.playerName, p.groupNumber)} : ネット ${p.netScore}打 (実打数 ${p.totalStrokes}打, HDCP ${p.handicap})\n`;
        });

        const sortedByGross = [...individuals].sort((a, b) => a.totalStrokes - b.totalStrokes);
        const medalist = sortedByGross[0];
        if (medalist) {
          report += `\n🏅 [メダリスト (グロス最少打)] : ${medalist.playerName}${getPlayerTagJa(medalist.playerId, medalist.playerName, medalist.groupNumber)} - 計 ${medalist.totalStrokes}打\n`;
        }
      } else {
        report += `\n🎖️ [個人戦 TOP 5]\n`;
        individuals.slice(0, 5).forEach((p) => {
          const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : '▪️';
          const diffStr = p.parDiff <= 0 ? `${p.parDiff}` : `+${p.parDiff}`;
          report += `${medal} ${p.rank}位 ${p.playerName}${getPlayerTagJa(p.playerId, p.playerName, p.groupNumber)} : ${p.totalStrokes}打 (${diffStr})\n`;
        });
      }

      const specialAwards = this.calculateSpecialAwards(room);
      if (specialAwards.length > 0) {
        report += `\n🎖️ [特別賞 受賞者]\n`;
        specialAwards.forEach((sa) => {
          report += `${sa.badge} ${sa.title}: ${sa.winnerName} (${sa.groupNumber ? `${sa.groupNumber}組, ` : ''}${sa.valueInfo || ''})\n`;
        });
      }

      if (room.awardConfig?.luckyDrawWinners && room.awardConfig.luckyDrawWinners.length > 0) {
        report += `\n🎰 [ラッキードロー 当選者]\n`;
        room.awardConfig.luckyDrawWinners.forEach((lw, idx) => {
          report += `🎁 当選 ${idx + 1}号: ${lw.name} (${lw.groupNumber ? `${lw.groupNumber}組, ` : ''}${lw.prizeName})\n`;
        });
      }

      report += `\n══════════════════════════════\n`;
      report += `📋 [🏆 表彰式および賞金・賞品受領案内]\n`;
      report += `• 賞金およびトロフィー・賞品は本人確認のうえ現地受領または指定口座へ送金されます。\n`;
      report += `• お問い合わせ: 幹事 (${room.hostName || 'クラブ事務局'})\n`;
      report += `══════════════════════════════\n`;
      report += `⛳ パークゴルフ オールインワン 公式大会管制センター リアルタイム集計\n`;
      return report;
    }

    let report = `🏆 [${room.title} 대회 최종 결과]\n`;
    report += `📍 구장: ${room.courseName} (${room.totalHoles}홀)\n`;
    report += `🎯 경기 방식: ${room.gameModeTitle || modeInfo.title}\n\n`;

    report += `🥇 [팀 대항전 단체 순위]\n`;
    const displayTeams = teams.slice(0, 5);
    displayTeams.forEach((t) => {
      const medal = t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : t.rank === 3 ? '🥉' : '▪️';
      report += `${medal} ${t.rank}위 ${t.groupName} (조장: ${t.leaderName}) : 평균 ${t.avgStrokes}타\n`;
    });
    if (teams.length > 5) {
      report += `  (※ 외 ${teams.length - 5}개 조 전체 순위는 파크골프 올인원 전광판 링크에서 확인)\n`;
    }

    // [대표님 지시] 5만명 전국망 대비 동명이인 방지 3중 식별 태그 (이름 + 소속클럽 + 전화뒷자리/조)
    const getPlayerTag = (playerId: string, defaultName: string, groupNum?: number): string => {
      let matchedPhone: string | undefined;
      for (const g of room.groups) {
        const found = g.players.find((p) => p.name === defaultName || p.id === playerId);
        if (found?.phone) {
          matchedPhone = found.phone;
          break;
        }
      }
      if (!matchedPhone && room.clubId) {
        const club = this.getClubById(room.clubId);
        const member = club?.members.find((m) => m.name === defaultName || m.id === playerId);
        if (member?.phone) {
          matchedPhone = member.phone;
        }
      }
      const clubPart = room.clubName ? `${room.clubName}` : '';
      const phoneDigits = matchedPhone ? matchedPhone.replace(/[^0-9]/g, '') : '';
      const phonePart = phoneDigits.length >= 4 ? `끝자리 ${phoneDigits.slice(-4)}` : '';
      const parts = [clubPart, phonePart || (groupNum ? `${groupNum}조` : '')].filter(Boolean);
      return parts.length > 0 ? ` (${parts.join(' / ')})` : (groupNum ? ` (${groupNum}조)` : '');
    };

    if (room.gameMode === 'NEW_PERIO') {
      report += `\n🎯 [신페리오 개인전 최종 순위 (핸디캡 적용)]\n`;
      individuals.slice(0, 5).forEach((p) => {
        const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : '▪️';
        report += `${medal} ${p.rank}위 ${p.playerName}${getPlayerTag(p.playerId, p.playerName, p.groupNumber)} : 네트 ${p.netScore}타 (실타수 ${p.totalStrokes}타, 핸디 ${p.handicap})\n`;
      });

      const sortedByGross = [...individuals].sort((a, b) => a.totalStrokes - b.totalStrokes);
      const medalist = sortedByGross[0];
      if (medalist) {
        report += `\n🏅 [메달리스트 (실타수 최저타)] : ${medalist.playerName}${getPlayerTag(medalist.playerId, medalist.playerName, medalist.groupNumber)} - 총 ${medalist.totalStrokes}타\n`;
      }
    } else {
      report += `\n🎖️ [개인전 TOP 5]\n`;
      individuals.slice(0, 5).forEach((p) => {
        const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : '▪️';
        const diffStr = p.parDiff <= 0 ? `${p.parDiff}` : `+${p.parDiff}`;
        report += `${medal} ${p.rank}위 ${p.playerName}${getPlayerTag(p.playerId, p.playerName, p.groupNumber)} : ${p.totalStrokes}타 (${diffStr})\n`;
      });
    }

    // 🛡️ 직전 우승자 시상 유예(독식 방지) 리포트 반영
    const graceInfo = this.getWinnerGraceInfo(room, individuals);
    if (graceInfo) {
      report += `\n🛡️ [우승자 시상 유예(독식 방지) 알림]\n`;
      report += `• 명예 1위: ${graceInfo.originalWinner.playerName}${getPlayerTag('', graceInfo.originalWinner.playerName)} (${graceInfo.originalWinner.totalStrokes}타)\n`;
      report += `• 🎁 1위 시상품 승계: ${graceInfo.transferredWinner.playerName}${getPlayerTag('', graceInfo.transferredWinner.playerName)} (${graceInfo.transferredWinner.totalStrokes}타)\n`;
      report += `  (${graceInfo.reason})\n`;
    }

    // 🎖️ 이색 특별상 리포트 반영
    const specialAwards = this.calculateSpecialAwards(room);
    if (specialAwards.length > 0) {
      report += `\n🎖️ [이색 특별상 수상자]\n`;
      specialAwards.forEach((sa) => {
        report += `${sa.badge} ${sa.title}: ${sa.winnerName} (${sa.groupNumber ? `${sa.groupNumber}조, ` : ''}${sa.valueInfo || ''})\n`;
      });
    }

    // 🎰 현장 랜덤 행운상 당첨자 리포트 반영
    if (room.awardConfig?.luckyDrawWinners && room.awardConfig.luckyDrawWinners.length > 0) {
      report += `\n🎰 [현장 룰렛 행운상 당첨자]\n`;
      room.awardConfig.luckyDrawWinners.forEach((lw, idx) => {
        report += `🎁 행운상 ${idx + 1}호: ${lw.name} (${lw.groupNumber ? `${lw.groupNumber}조, ` : ''}${lw.prizeName})\n`;
      });
    }

    if (room.gameRuleNotes) {
      report += `\n📌 대회 룰: ${room.gameRuleNotes}\n`;
    }

    // ✍️ 대표님 지시: 시상식 및 상금·상품 수령 확인 안내 섹션
    report += `\n══════════════════════════════\n`;
    report += `📋 [🏆 시상식 및 상금·상품 수령 확인 안내]\n`;
    report += `• 시상금 및 트로피/시상품은 수상자 본인 확인 후 현장 수령 또는 등록 계좌로 지급됩니다.\n`;
    report += `• 수령 확인: 수상자 전원 서명 또는 확인 완료 시 클럽 공식 연대기에 영구 등재됩니다.\n`;
    report += `• 문의 및 수령 확인: 총무 (${room.hostName || '클럽 집행부'})\n`;
    report += `══════════════════════════════\n`;
    report += `⛳ 파크골프 올인원 (ParkGolf All-in-One) 공식 대회 관제 센터 실시간 집계\n`;

    return report;
  },

  // 12-0-1. 이색 특별상 자동 계산
  calculateSpecialAwards(room: ClubEventRoom): SpecialAwardWinner[] {
    const list: SpecialAwardWinner[] = [];
    const individuals = this.getIndividualLeaderboard(room);
    if (individuals.length === 0) return list;

    // 1. 다파상 (PAR_MASTER): 18홀 중 파(3타 기준)를 가장 많이 기록한 선수
    let maxParCount = 0;
    let parMaster: { name: string; groupNum: number; parCount: number } | null = null;

    room.groups.forEach((g) => {
      g.players.forEach((p) => {
        if (p.holesCompleted === 0) return;
        let parCount = 0;
        Object.values(p.scores || {}).forEach((stroke) => {
          if (stroke === 3) parCount++;
        });
        if (parCount > maxParCount) {
          maxParCount = parCount;
          parMaster = { name: p.name, groupNum: g.groupNumber, parCount };
        }
      });
    });

    if (parMaster && (parMaster as any).parCount > 0) {
      list.push({
        type: 'PAR_MASTER',
        title: '다파상 (Par Master)',
        badge: '👑',
        winnerName: (parMaster as any).name,
        groupNumber: (parMaster as any).groupNum,
        description: '파(Par)를 가장 많이 기록하여 기복 없는 안정적인 샷을 뽐낸 선수!',
        valueInfo: `파 ${(parMaster as any).parCount}개 기록`,
      });
    }

    // 2. 오리상 (DUCK_22): 22위 (오리 두 마리)
    if (individuals.length >= 22) {
      const duckPlayer = individuals[21];
      list.push({
        type: 'DUCK_22',
        title: '행운의 오리상 (22위)',
        badge: '🦆',
        winnerName: duckPlayer.playerName,
        groupNumber: duckPlayer.groupNumber,
        description: '22위(오리 2마리)를 차지하여 시상식의 행운과 웃음을 선물한 주인공!',
        valueInfo: `22위 (${duckPlayer.totalStrokes}타)`,
      });
    }

    // 3. 행운의 7위상 (LUCKY_7)
    if (individuals.length >= 7) {
      const luckyPlayer = individuals[6];
      list.push({
        type: 'LUCKY_7',
        title: '행운의 7위상 (Lucky 7)',
        badge: '🍀',
        winnerName: luckyPlayer.playerName,
        groupNumber: luckyPlayer.groupNumber,
        description: '행운의 숫자 7위를 기록하여 뜻밖의 횡재를 거머쥔 행운의 선수!',
        valueInfo: `7위 (${luckyPlayer.totalStrokes}타)`,
      });
    }

    // 4. 아차상 (NEAR_MISS): 4위
    if (individuals.length >= 4) {
      const nearMissPlayer = individuals[3];
      list.push({
        type: 'NEAR_MISS',
        title: '아차상 (Near Miss)',
        badge: '💔',
        winnerName: nearMissPlayer.playerName,
        groupNumber: nearMissPlayer.groupNumber,
        description: '아깝게 1~3위 입상을 놓친 가장 아쉬운 회원에게 드리는 위로의 상!',
        valueInfo: `4위 (${nearMissPlayer.totalStrokes}타)`,
      });
    }

    // 5. 열정 격려상 (LAST_PLACE): 완주자 중 최다타수
    const completedPlayers = individuals.filter((p) => p.holesCompleted > 0);
    if (completedPlayers.length >= 5) {
      const lastPlayer = completedPlayers[completedPlayers.length - 1];
      list.push({
        type: 'LAST_PLACE',
        title: '열정 격려상 (초보 응원)',
        badge: '🐢',
        winnerName: lastPlayer.playerName,
        groupNumber: lastPlayer.groupNumber,
        description: '끝까지 18홀을 멋지게 완주한 열정! 파크골프 실력 성장을 응원합니다.',
        valueInfo: `완주 (${lastPlayer.totalStrokes}타)`,
      });
    }

    return list;
  },

  // 12-0-2. 직전 우승자 시상 유예(독식 방지) 체크
  getWinnerGraceInfo(room: ClubEventRoom, individuals: ClubLeaderboardIndividual[]) {
    const config = room.awardConfig;
    if (!config || !config.winnerGraceMonths || config.winnerGraceMonths <= 0) {
      return null;
    }

    if (!individuals || individuals.length < 2) return null;

    const lastWinners = config.lastWinnerNames || [];
    if (lastWinners.length === 0) return null;

    const firstPlace = individuals[0];
    const isExcluded = lastWinners.some(
      (w) =>
        firstPlace.playerName.toLowerCase().includes(w.trim().toLowerCase()) ||
        w.trim().toLowerCase().includes(firstPlace.playerName.toLowerCase())
    );

    if (isExcluded) {
      const secondPlace = individuals[1];
      const gracePeriodStr =
        config.winnerGraceMonths === 1
          ? '직전 1회'
          : config.winnerGraceMonths === 2
          ? '최근 2회'
          : `최근 ${config.winnerGraceMonths}개월`;

      return {
        originalWinner: firstPlace,
        transferredWinner: secondPlace,
        gracePeriod: gracePeriodStr,
        reason: `${firstPlace.playerName} 님은 ${gracePeriodStr} 우승자로, 명예 메달리스트는 유지하며 1위 상품은 차순위(${secondPlace.playerName} 님)에게 승계되었습니다.`,
      };
    }

    return null;
  },

  // 12-0-3. 시상 룰 및 커스텀 설정 저장
  saveAwardConfig(roomId: string, config: AwardRuleConfig): ClubEventRoom | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    room.awardConfig = {
      ...room.awardConfig,
      ...config,
    };
    this.saveRoom(room);
    return room;
  },

  // 12-0-4. 행운상 추첨 당첨자 추가
  addLuckyDrawWinner(roomId: string, winner: LuckyDrawWinner): ClubEventRoom | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    if (!room.awardConfig) {
      room.awardConfig = { enableLuckyDraw: true, luckyDrawWinners: [] };
    }
    if (!room.awardConfig.luckyDrawWinners) {
      room.awardConfig.luckyDrawWinners = [];
    }

    // 중복 제거 후 추가
    room.awardConfig.luckyDrawWinners = room.awardConfig.luckyDrawWinners.filter((w) => w.id !== winner.id);
    room.awardConfig.luckyDrawWinners.push(winner);
    this.saveRoom(room);
    return room;
  },

  // 12-0-5. 행운상 당첨자 삭제/취소
  removeLuckyDrawWinner(roomId: string, winnerId: string): ClubEventRoom | null {
    const room = this.getRoom(roomId);
    if (!room || !room.awardConfig?.luckyDrawWinners) return null;

    room.awardConfig.luckyDrawWinners = room.awardConfig.luckyDrawWinners.filter((w) => w.id !== winnerId);
    this.saveRoom(room);
    return room;
  },

  // 12-1. 참가비 입금 상태 토글 (미납 ↔ 입금 완료)
  togglePlayerPayment(roomId: string, playerId: string): ClubEventRoom | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    let found = false;
    const now = new Date();
    const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (const group of room.groups) {
      const player = group.players.find((p) => p.id === playerId);
      if (player) {
        if (player.paymentStatus === 'PAID') {
          player.paymentStatus = 'UNPAID';
          player.paidAt = undefined;
        } else {
          player.paymentStatus = 'PAID';
          player.paidAt = timeStr;
        }
        found = true;
        break;
      }
    }

    if (!found && room.waitingPool) {
      const player = room.waitingPool.find((p) => p.id === playerId);
      if (player) {
        if (player.paymentStatus === 'PAID') {
          player.paymentStatus = 'UNPAID';
          player.paidAt = undefined;
        } else {
          player.paymentStatus = 'PAID';
          player.paidAt = timeStr;
        }
        found = true;
      }
    }

    if (found) {
      this.saveRoom(room);
      return room;
    }
    return null;
  },

  // 12-2. 참가비 & 입금계좌 설정 업데이트
  updatePaymentConfig(
    roomId: string,
    config: { entryFee?: number; bankAccount?: string }
  ): ClubEventRoom | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    if (typeof config.entryFee === 'number') {
      room.entryFee = config.entryFee;
    }
    if (config.bankAccount !== undefined) {
      room.bankAccount = config.bankAccount.trim();
    }

    this.saveRoom(room);
    return room;
  },

  // 12-3. 참가비 수납 현황 요약 통계 집계
  getPaymentSummary(room: ClubEventRoom) {
    const fee = typeof room.entryFee === 'number' ? room.entryFee : 10000;
    const allPlayers: ClubPlayer[] = [];
    room.groups.forEach((g) => allPlayers.push(...g.players));
    if (room.waitingPool) {
      allPlayers.push(...room.waitingPool);
    }

    const totalCount = allPlayers.length;
    const paidPlayers = allPlayers.filter((p) => p.paymentStatus === 'PAID');
    const unpaidPlayers = allPlayers.filter((p) => p.paymentStatus !== 'PAID');
    const paidCount = paidPlayers.length;
    const unpaidCount = unpaidPlayers.length;

    const totalExpectedAmount = totalCount * fee;
    const totalCollectedAmount = paidCount * fee;
    const uncollectedAmount = unpaidCount * fee;
    const paidRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

    return {
      fee,
      bankAccount: room.bankAccount || '농협 352-1234-5678 김대희(총무)',
      totalCount,
      paidCount,
      unpaidCount,
      paidPlayers,
      unpaidPlayers,
      totalExpectedAmount,
      totalCollectedAmount,
      uncollectedAmount,
      paidRate,
    };
  },

  // 12-4. 참가비 수납 현황 카카오톡/LINE 리포트 생성 (총무 단톡방 공유용)
  generatePaymentStatusKakaoReport(room: ClubEventRoom, isJapanese?: boolean): string {
    const s = this.getPaymentSummary(room);
    const feeStr = isJapanese
      ? (s.fee > 0 ? `${s.fee.toLocaleString()}円` : '無料')
      : (s.fee > 0 ? `${s.fee.toLocaleString()}원` : '무료');
    const bankStr = s.bankAccount || (isJapanese ? '幹事へお問い合わせ' : '총무에게 문의');

    if (isJapanese) {
      let report = `💰 [${room.title}] 参加費・会計 現況案内\n\n`;
      report += `📍 コース: ${room.courseName}\n`;
      report += `💵 1人参加費: ${feeStr}\n`;
      report += `🏦 振込口座: ${bankStr}\n\n`;
      report += `📊 [リアルタイム集計]\n`;
      report += `• 総参加人数: ${s.totalCount}名\n`;
      report += `• 入金完了: ${s.paidCount}名 (${s.totalCollectedAmount.toLocaleString()}円 / ${s.paidRate}%)\n`;
      report += `• 入金待ち: ${s.unpaidCount}名 (${s.uncollectedAmount.toLocaleString()}円)\n\n`;

      report += `✅ [入金完了 (${s.paidCount}名)]\n`;
      if (s.paidPlayers.length > 0) {
        report += s.paidPlayers.map((p) => `${p.name}${p.paidAt ? `(${p.paidAt})` : ''}`).join(', ') + '\n';
      } else {
        report += 'まだ入金完了者はいません。\n';
      }

      report += `\n⏳ [入金確認待ち (${s.unpaidCount}名)]\n`;
      if (s.unpaidPlayers.length > 0) {
        report += s.unpaidPlayers.map((p) => p.name).join(', ') + '\n';
        report += `\n📢 上記名簿の方は案内された口座にお振込の上、幹事へお知らせください。円滑な大会準備のためご協力をお願いいたします。🙏`;
      } else {
        report += 'すべての参加者様のお支払いが完了しました！ありがとうございます 👏';
      }

      return report;
    }

    let report = `💰 [${room.title}] 참가비 입금 현황 안내\n\n`;
    report += `📍 구장: ${room.courseName}\n`;
    report += `💵 1인 참가비: ${feeStr}\n`;
    report += `🏦 입금 계좌: ${bankStr}\n\n`;
    report += `📊 [실시간 수납 통계]\n`;
    report += `• 총 참가 인원: ${s.totalCount}명\n`;
    report += `• 입금 완료: ${s.paidCount}명 (${s.totalCollectedAmount.toLocaleString()}원 / ${s.paidRate}%)\n`;
    report += `• 입금 대기: ${s.unpaidCount}명 (${s.uncollectedAmount.toLocaleString()}원)\n\n`;

    report += `✅ [입금 완료 (${s.paidCount}명)]\n`;
    if (s.paidPlayers.length > 0) {
      report += s.paidPlayers.map((p) => `${p.name}${p.paidAt ? `(${p.paidAt})` : ''}`).join(', ') + '\n';
    } else {
      report += '아직 입금 완료자가 없습니다.\n';
    }

    report += `\n⏳ [입금 확인 대기 (${s.unpaidCount}명)]\n`;
    if (s.unpaidPlayers.length > 0) {
      report += s.unpaidPlayers.map((p) => p.name).join(', ') + '\n';
      report += `\n📢 위 명단에 계신 분들은 안내된 계좌로 입금 후 총무에게 알려주세요! 원활한 대회 준비를 위해 협조 부탁드립니다. 🙏`;
    } else {
      report += '모든 참가자분의 입금이 완료되었습니다! 감사합니다 👏';
    }

    return report;
  },

  // 12-5. 미납자 타겟 카카오톡/LINE 독촉 안내문 생성 (총무 복사용)
  generateUnpaidKakaoReminderText(room: ClubEventRoom, isJapanese?: boolean): string {
    const s = this.getPaymentSummary(room);
    const feeStr = isJapanese
      ? (s.fee > 0 ? `${s.fee.toLocaleString()}円` : '無料')
      : (s.fee > 0 ? `${s.fee.toLocaleString()}원` : '무료');
    const bankStr = s.bankAccount || (isJapanese ? '幹事へお問い合わせ' : '총무에게 문의');

    if (isJapanese) {
      if (s.unpaidCount === 0) {
        return `🎉 [${room.title}] 参加者全員(${s.totalCount}名)のお支払いが完了しました！幹事として皆様の迅速なご協力に心より感謝申し上げます。🙏`;
      }
      let text = `📢 [${room.title}] 参加費お振込みのお願い (幹事告知)\n\n`;
      text += `会員の皆様こんにちは！大会の円滑な運営および保険・賞品準備のため、まだ入金確認が取れていない会員様におかれましてはお振込みをお願い申し上げます。\n\n`;
      text += `💵 1人参加費: ${feeStr}\n`;
      text += `🏦 振込口座: ${bankStr}\n\n`;
      text += `⏳ [入金確認待ち会員 (${s.unpaidCount}名)]\n`;
      text += s.unpaidPlayers.map((p, idx) => `${idx + 1}. ${p.name}`).join('\n');
      text += `\n\n💡 お振込みの際はお振込人名義をご本人のお名前にしていただけますと迅速に確認できます。よろしくお願い申し上げます！⛳`;
      return text;
    }

    if (s.unpaidCount === 0) {
      return `🎉 [${room.title}] 참가자 전원(${s.totalCount}명) 입금 완료되었습니다! 총무로서 회원님들의 신속한 협조에 진심으로 감사드립니다. 🙏`;
    }

    let text = `📢 [${room.title}] 참가비 입금 확인 안내 (총무 공지)\n\n`;
    text += `회원 여러분 안녕하세요! 대회의 원활한 진행 및 보험/기념품 준비를 위해 아직 입금 확인이 되지 않은 회원님께서는 입금을 부탁드립니다.\n\n`;
    text += `💵 1인 참가비: ${feeStr}\n`;
    text += `🏦 입금 계좌: ${bankStr}\n\n`;
    text += `⏳ [입금 확인 대기 회원 (${s.unpaidCount}명)]\n`;
    text += s.unpaidPlayers.map((p, idx) => `${idx + 1}. ${p.name}`).join('\n');
    text += `\n\n💡 입금 시 입금자명을 본인 성함으로 보내주시면 빠른 확인이 가능합니다. 감사합니다! ⛳`;
    return text;
  },

  // ==========================================
  // [NEW] 클럽 커뮤니티 관리 (창단, 가입, 다중 클럽 관리)
  // ==========================================
  getAllClubs(): ParkGolfClub[] {
    if (typeof window === 'undefined') return [];
    try {
      // 1. 과거 구버전 더미 캐시 키(v1 및 레거시 키) 완전 파기 및 청소
      const legacyKeys = ['parkon_clubs_v1', 'parkon_clubs', 'clubs_data', 'parkon_mock_clubs', 'INITIAL_CLUBS'];
      for (const k of legacyKeys) {
        try {
          if (localStorage.getItem(k) !== null) {
            localStorage.removeItem(k);
          }
        } catch {}
      }

      // 2. parkon_clubs_v2에서만 실제 사용자가 등록한 클럽 로드
      const data = localStorage.getItem(STORAGE_KEYS.CLUBS);
      let userClubs: ParkGolfClub[] = [];
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // 혹시라도 남아있을 수 있는 가상 더미 데이터 패턴(club-gumi-, club-seoul-, 회장: 최한강 등) 전면 차단
          userClubs = parsed.filter((c) => {
            if (!c || !c.id || !c.name) return false;
            if (
              c.id.startsWith('club-gumi-') ||
              c.id.startsWith('club-daegu-') ||
              c.id.startsWith('club-busan-') ||
              c.id.startsWith('club-seoul-') ||
              c.id.startsWith('club-seed-') ||
              c.id.startsWith('club-miryang-') ||
              c.id.startsWith('club-changwon-') ||
              c.id.startsWith('club-test-') ||
              c.presidentName === '최한강' ||
              c.managerName === '조총무' ||
              c.presidentName === '박회장' ||
              c.managerName === '김총무'
            ) {
              return false;
            }
            return true;
          });
          if (userClubs.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(userClubs));
          }
        }
      }

      // 오직 실제 사용자가 직접 등록한 실존 클럽만 반환 (가상 더미 병합 완전 제거)
      return userClubs;
    } catch {
      return [];
    }
  },

  getClubById(id: string): ParkGolfClub | null {
    const list = this.getAllClubs();
    return list.find((c) => c.id === id) || null;
  },

  getClub(id: string): ParkGolfClub | null {
    return this.getClubById(id);
  },

  updateClubRecruitment(
    clubId: string,
    recruitment: {
      recruitStatus: ClubRecruitStatus;
      recruitQuota?: number;
      recruitTargetDate?: string;
      recruitNotes?: string;
    }
  ): ParkGolfClub | null {
    if (typeof window === 'undefined') return null;
    try {
      const allClubs = this.getAllClubs();
      const clubIndex = allClubs.findIndex((c) => c.id === clubId);
      if (clubIndex === -1) return null;

      const updated = {
        ...allClubs[clubIndex],
        ...recruitment,
      };

      const data = localStorage.getItem(STORAGE_KEYS.CLUBS);
      let userClubs: ParkGolfClub[] = data ? JSON.parse(data) : [];
      const userIdx = userClubs.findIndex((c) => c.id === clubId);
      if (userIdx >= 0) {
        userClubs[userIdx] = updated;
      } else {
        userClubs.unshift(updated);
      }
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(userClubs));
      return updated;
    } catch (e) {
      console.error('Failed to update club recruitment:', e);
      return null;
    }
  },

  createClub(clubData: {
    name: string;
    region: string;
    homeCourseId: string;
    homeCourseName: string;
    description: string;
    presidentName: string;
    managerName: string;
    contactPhone?: string;
    isPublic?: boolean;
    badgeColor?: string;
    recruitStatus?: ClubRecruitStatus;
    recruitQuota?: number;
    recruitNotes?: string;
    annualDuesAmount?: number;
  }): ParkGolfClub {
    const list = this.getAllClubs();
    const newId = `club-${Date.now()}`;
    const newClub: ParkGolfClub = {
      id: newId,
      name: clubData.name,
      region: clubData.region,
      homeCourseId: clubData.homeCourseId,
      homeCourseName: clubData.homeCourseName,
      description: clubData.description,
      presidentName: clubData.presidentName || '회장',
      managerName: clubData.managerName || '김총무(본인)',
      contactPhone: clubData.contactPhone || '',
      memberCount: 1,
      members: [
        {
          id: `m_${Date.now()}`,
          name: clubData.managerName || '김총무(본인)',
          role: 'MANAGER',
          joinedAt: new Date().toISOString().slice(0, 10),
          phone: clubData.contactPhone,
        },
      ],
      pendingMembers: [],
      isPublic: clubData.isPublic !== false,
      badgeColor: clubData.badgeColor || 'emerald',
      isParkOnClub: true, // 사용자가 직접 등록한 클럽은 공식 가입 클럽
      recruitStatus: clubData.recruitStatus || 'RECRUITING',
      recruitQuota: clubData.recruitQuota,
      recruitNotes: clubData.recruitNotes,
      annualDuesAmount: clubData.annualDuesAmount || 50000,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    list.unshift(newClub);
    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(list));
      const myClubs = this.getMyClubIds();
      if (!myClubs.includes(newId)) {
        myClubs.push(newId);
        localStorage.setItem(STORAGE_KEYS.MY_CLUB_IDS, JSON.stringify(myClubs));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('parkon_clubs_updated', { detail: newClub }));
      }
    } catch {
      // ignore
    }
    return newClub;
  },

  getMyClubIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MY_CLUB_IDS);
      if (data === null) {
        return [];
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  },

  // 1. 가입 신청하기 (총무 승인 대기 상태로 등록, memberCode 및 티어 자동 바인딩)
  requestJoinClub(
    clubId: string,
    applicant: { name: string; phone?: string; message?: string; memberCode?: string }
  ): boolean {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club) return false;

    if (!club.pendingMembers) club.pendingMembers = [];
    const cleanName = applicant.name.trim();
    const cleanCode = (applicant.memberCode || '').trim() || (typeof window !== 'undefined' ? localStorage.getItem('parkon_member_code_v1') || localStorage.getItem('parkon_member_code') || '' : '');
    const alreadyPending = club.pendingMembers.some((p) => p.name === cleanName || (cleanCode && p.memberCode === cleanCode));
    if (alreadyPending) return true;

    const completed = typeof window !== 'undefined' ? getUserCompleted9Holes(cleanName) : 0;
    const tier = calculateTier(completed);

    club.pendingMembers.push({
      id: `pm_${Date.now()}`,
      name: cleanName,
      phone: applicant.phone || '',
      memberCode: cleanCode || `PKYB-${Math.floor(1000 + Math.random() * 9000)}`,
      diamondTier: tier.code,
      totalCompleted9Holes: completed,
      requestedAt: '방금 전',
      message: applicant.message || '클럽 회원 가입을 신청합니다.',
    });

    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(list));
      this.syncClubToSupabase(club);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('parkon_clubs_updated', { detail: club }));
      }
      return true;
    } catch {
      return false;
    }
  },

  // 2. 가입 수락 (승인 -> 정회원으로 등록, 과거 탈퇴자 복귀 시 원상 회복)
  approveMember(clubId: string, pendingId: string): { success: boolean; isRestored?: boolean; originalJoinedAt?: string } {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club || !club.pendingMembers) return { success: false };

    const pending = club.pendingMembers.find((p) => p.id === pendingId);
    if (!pending) return { success: false };

    // 대기열에서 제거
    club.pendingMembers = club.pendingMembers.filter((p) => p.id !== pendingId);

    // 과거 탈퇴 회원 비밀 보관소에서 복원 검사
    if (!club.archivedMembers) club.archivedMembers = [];
    const archivedIdx = club.archivedMembers.findIndex(
      (a) => a.name.trim() === pending.name.trim() || (pending.phone && a.phone === pending.phone)
    );

    let isRestored = false;
    let joinedAtDate = new Date().toISOString().slice(0, 10);

    if (archivedIdx !== -1) {
      const archived = club.archivedMembers[archivedIdx];
      club.archivedMembers.splice(archivedIdx, 1);
      isRestored = true;
      joinedAtDate = archived.joinedAt; // 최초 가입일 원상 복구!
    }

    const cleanCode = pending.memberCode || (typeof window !== 'undefined' ? localStorage.getItem('parkon_member_code_v1') || localStorage.getItem('parkon_member_code') || '' : '') || `PKYB-${Math.floor(1000 + Math.random() * 9000)}`;
    const comp9H = typeof window !== 'undefined' ? getUserCompleted9Holes(pending.name) : 0;
    const tier = calculateTier(comp9H);

    // 정회원으로 등록
    club.members.push({
      id: `m_${Date.now()}`,
      memberCode: cleanCode,
      name: pending.name,
      role: 'MEMBER',
      joinedAt: joinedAtDate,
      phone: pending.phone,
      diamondTier: tier.code,
      totalCompleted9Holes: comp9H,
    });
    club.memberCount = club.members.length;

    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(list));
      this.syncClubToSupabase(club);
      return { success: true, isRestored, originalJoinedAt: joinedAtDate };
    } catch {
      return { success: false };
    }
  },

  // 2-1. [대표님 지시] 가입 대기자 전체 1초 일괄 승인
  approveAllPendingMembers(clubId: string): number {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club || !club.pendingMembers || club.pendingMembers.length === 0) return 0;
    const count = club.pendingMembers.length;
    const pendingCopy = [...club.pendingMembers];
    pendingCopy.forEach((p) => {
      this.approveMember(clubId, p.id);
    });
    return count;
  },

  // 3. 가입 거절
  rejectMember(clubId: string, pendingId: string): boolean {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club || !club.pendingMembers) return false;

    club.pendingMembers = club.pendingMembers.filter((p) => p.id !== pendingId);

    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(list));
      this.syncClubToSupabase(club);
      return true;
    } catch {
      return false;
    }
  },

  // 3-1. ☁️ Supabase 원격 동기화 (오프라인 Fail-Safe 2-Way 연동)
  async syncClubToSupabase(club: ParkGolfClub): Promise<boolean> {
    if (!club || !club.id) return false;
    try {
      // 1. clubs 마스터 테이블 Upsert
      const { error: clubErr } = await supabase.from('clubs').upsert(
        {
          id: club.id,
          name: club.name,
          region: club.region,
          home_course_id: club.homeCourseId || '',
          home_course_name: club.homeCourseName || '',
          description: club.description || '',
          president_name: club.presidentName || '',
          manager_name: club.managerName || '',
          contact_phone: club.contactPhone || '',
          member_count: club.members ? club.members.length : 1,
          is_public: club.isPublic !== false,
          is_parkon_club: Boolean(club.isParkOnClub),
          recruit_status: club.recruitStatus || 'ALWAYS',
          recruit_quota: club.recruitQuota || 50,
          annual_dues_amount: club.annualDuesAmount || 50000,
          badge_color: club.badgeColor || 'emerald',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      if (clubErr) {
        console.warn('Supabase club upsert error (fail-safe):', clubErr);
      }

      // 2. club_members 테이블 Upsert
      if (club.members && club.members.length > 0) {
        const memberRows = club.members.map((m) => {
          const mCode = m.memberCode || m.id;
          const comp = typeof window !== 'undefined' ? getUserCompleted9Holes(m.name) : 0;
          const tier = calculateTier(comp);
          return {
            id: `${club.id}_${mCode}`,
            club_id: club.id,
            member_code: mCode,
            name: m.name,
            role: m.role || 'MEMBER',
            custom_role_name: m.customRoleName || '',
            phone: m.phone || '',
            diamond_tier: tier.code,
            completed_9holes: comp,
            dues_paid: Boolean(m.duesPaid),
            dues_paid_at: m.duesPaidAt || '',
            joined_at: m.joinedAt || new Date().toISOString().slice(0, 10),
            status: 'ACTIVE',
            updated_at: new Date().toISOString(),
          };
        });

        const { error: memErr } = await supabase.from('club_members').upsert(
          memberRows,
          { onConflict: 'id' }
        );
        if (memErr) {
          console.warn('Supabase club_members upsert error (fail-safe):', memErr);
        }
      }
      return true;
    } catch (e) {
      console.warn('syncClubToSupabase exception (fail-safe):', e);
      return false;
    }
  },

  // 3-2. ☁️ Supabase 원격 클럽 목록 불러오기 (캐시 병합)
  async fetchClubsFromSupabase(): Promise<ParkGolfClub[]> {
    try {
      const { data: remoteClubs, error } = await supabase
        .from('clubs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !remoteClubs || remoteClubs.length === 0) {
        return this.getAllClubs();
      }

      const localList = this.getAllClubs();
      const merged = [...localList];

      for (const rc of remoteClubs) {
        const existIdx = merged.findIndex((c) => c.id === rc.id);
        const mappedClub: ParkGolfClub = {
          id: rc.id,
          name: rc.name,
          region: rc.region,
          homeCourseId: rc.home_course_id,
          homeCourseName: rc.home_course_name,
          description: rc.description || '',
          presidentName: rc.president_name || '',
          managerName: rc.manager_name || '',
          contactPhone: rc.contact_phone || '',
          memberCount: rc.member_count || 1,
          members: existIdx !== -1 ? merged[existIdx].members : [],
          isPublic: rc.is_public !== false,
          isParkOnClub: rc.is_parkon_club,
          recruitStatus: rc.recruit_status || 'ALWAYS',
          recruitQuota: rc.recruit_quota || 50,
          annualDuesAmount: rc.annual_dues_amount || 50000,
          badgeColor: rc.badge_color || 'emerald',
          createdAt: rc.created_at || new Date().toISOString(),
        };

        if (existIdx === -1) {
          merged.push(mappedClub);
        } else {
          merged[existIdx] = {
            ...merged[existIdx],
            ...mappedClub,
            members: merged[existIdx].members,
          };
        }
      }

      try {
        localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(merged));
      } catch {}

      return merged;
    } catch {
      return this.getAllClubs();
    }
  },

  // 4. 카카오톡 클럽 가입 초청장 문구 생성
  generateClubInviteText(club: ParkGolfClub): string {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/club/join?clubId=${club.id}`
        : `https://www.parkgolfallinone.com/club/join?clubId=${club.id}`;

    return `[파크골프 올인원 공식 클럽 가입 초청장 ⛳]
"${club.name}"에서 ${club.managerName || '총무'}님이 귀하를 정회원으로 초대합니다!

📍 홈 구장: ${club.homeCourseName} (${club.region})
👥 회원 수: ${club.memberCount}명 활동 중
💬 클럽 소개: ${club.description}

👇 아래 링크를 터치하여 파크골프 올인원에서 1초 만에 가입 신청하세요!
${shareUrl}`;
  },

  // 5. 초청장 링크를 통한 즉시 가입 (과거 탈퇴자 복귀 시 원상 회복)
  directJoinViaInvite(
    clubId: string,
    member: { name: string; phone?: string }
  ): { success: boolean; isRestored?: boolean; originalJoinedAt?: string } {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club) return { success: false };

    const alreadyMember = club.members.some((m) => m.name === member.name);
    let isRestored = false;
    let joinedAtDate = new Date().toISOString().slice(0, 10);

    if (!alreadyMember) {
      if (!club.archivedMembers) club.archivedMembers = [];
      const archivedIdx = club.archivedMembers.findIndex(
        (a) => a.name.trim() === member.name.trim() || (member.phone && a.phone === member.phone)
      );

      if (archivedIdx !== -1) {
        const archived = club.archivedMembers[archivedIdx];
        club.archivedMembers.splice(archivedIdx, 1);
        isRestored = true;
        joinedAtDate = archived.joinedAt;
      }

      club.members.push({
        id: `m_${Date.now()}`,
        name: member.name,
        role: 'MEMBER',
        joinedAt: joinedAtDate,
        phone: member.phone,
      });
      club.memberCount = club.members.length;
    }

    const myClubs = this.getMyClubIds();
    if (!myClubs.includes(clubId)) {
      myClubs.push(clubId);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(list));
      localStorage.setItem(STORAGE_KEYS.MY_CLUB_IDS, JSON.stringify(myClubs));
      return { success: true, isRestored, originalJoinedAt: joinedAtDate };
    } catch {
      return { success: false };
    }
  },

  // 6. 클럽 가입 및 복귀 (과거 탈퇴 회원의 경우 가입일 및 연대기 이력 100% 원상 복구)
  joinClub(
    clubId: string,
    memberName: string,
    phone?: string
  ): { success: boolean; isRestored: boolean; originalJoinedAt?: string; pastCount?: number; pastAwards?: string[] } {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club) return { success: false, isRestored: false };

    const cleanName = memberName.trim();
    const alreadyMember = club.members.some(
      (m) => m.name.trim() === cleanName || (cleanName.includes('김대희') && m.name.includes('김대희'))
    );

    let isRestored = false;
    let originalJoinedAt: string | undefined;
    let pastCount: number | undefined;
    let pastAwards: string[] | undefined;

    // 🔐 비밀 보관소에서 과거 탈퇴 이력 대조
    if (!club.archivedMembers) club.archivedMembers = [];
    const archivedIdx = club.archivedMembers.findIndex(
      (a) =>
        a.name.trim() === cleanName ||
        (cleanName.includes('김대희') && a.name.includes('김대희')) ||
        (phone && a.phone === phone)
    );

    if (archivedIdx !== -1) {
      // 🌟 과거 회원 확인! 원상 회복 절차 수행
      const archived = club.archivedMembers[archivedIdx];
      club.archivedMembers.splice(archivedIdx, 1); // 보관함에서 꺼내어 정회원 승격
      isRestored = true;
      originalJoinedAt = archived.joinedAt;
      pastCount = archived.pastTournamentsCount;
      pastAwards = archived.pastAwards;

      if (!alreadyMember) {
        club.members.push({
          id: archived.id || `m_${Date.now()}`,
          name: memberName,
          role: 'MEMBER',
          joinedAt: archived.joinedAt, // 🌟 최초 가입일 100% 원상 복구!
          phone: phone || archived.phone,
        });
        club.memberCount = club.members.length;
      }
    } else if (!alreadyMember) {
      // 신규 가입
      club.members.push({
        id: `m_${Date.now()}`,
        name: memberName,
        role: 'MEMBER',
        joinedAt: new Date().toISOString().slice(0, 10),
        phone,
      });
      club.memberCount = club.members.length;
    }

    const myClubs = this.getMyClubIds();
    if (!myClubs.includes(clubId)) {
      myClubs.push(clubId);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(list));
      localStorage.setItem(STORAGE_KEYS.MY_CLUB_IDS, JSON.stringify(myClubs));
      return { success: true, isRestored, originalJoinedAt, pastCount, pastAwards };
    } catch {
      return { success: false, isRestored: false };
    }
  },

  // 7. 클럽 안전 탈퇴 (기록 비밀 보관 처리: 일반 목록 비공개 + 비밀 보관소에 가입일/과거대회이력 영구 보존)
  leaveClub(
    clubId: string,
    memberName: string
  ): { success: boolean; archived?: ArchivedClubMember } {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club) return { success: false };

    // 대상 멤버 조회
    const targetMember = club.members.find(
      (m) =>
        m.name.trim() === memberName.trim() ||
        (memberName.includes('김대희') && m.name.includes('김대희')) ||
        (m.name.includes('(본인)') && memberName.includes('(본인)'))
    );

    // 클럽 연대기에서 해당 회원의 과거 출전 횟수, 수상 이력, 최고 타수 산출
    const chronicles = this.getClubChronicles(clubId);
    let pastTournamentsCount = 0;
    const pastAwards: string[] = [];
    let bestScore: number | undefined;

    const searchKey = memberName.replace('(본인)', '').trim();
    chronicles.forEach((chr) => {
      const myRank = chr.rankings.find(
        (r) => r.playerName.trim() === memberName.trim() || r.playerName.includes(searchKey)
      );
      if (myRank) {
        pastTournamentsCount++;
        if (myRank.awards && myRank.awards.length > 0) {
          myRank.awards.forEach((aw) => pastAwards.push(`[${chr.title.slice(0, 10)}] ${aw}`));
        }
        if (!bestScore || (myRank.totalStrokes > 0 && myRank.totalStrokes < bestScore)) {
          bestScore = myRank.totalStrokes;
        }
      }
    });

    // 🔐 비밀 보관소용 아카이브 레코드 생성
    const archivedRecord: ArchivedClubMember = {
      id: targetMember?.id || `arch_${Date.now()}`,
      name: targetMember?.name || memberName,
      roleAtLeave: targetMember?.role || 'MEMBER',
      joinedAt: targetMember?.joinedAt || new Date().toISOString().slice(0, 10), // 최초 가입일 영구 보존!
      leftAt: new Date().toISOString().slice(0, 10),
      phone: targetMember?.phone,
      pastTournamentsCount,
      pastAwards,
      bestScore,
      secretHash: `SEC_${Date.now().toString(36)}`,
    };

    if (!club.archivedMembers) {
      club.archivedMembers = [];
    }
    // 기존 동일인 아카이브가 있다면 최신으로 갱신
    club.archivedMembers = club.archivedMembers.filter(
      (a) => a.name.trim() !== memberName.trim() && !a.name.includes(searchKey)
    );
    club.archivedMembers.unshift(archivedRecord);

    // 활성 회원 명부에서 제거 (비밀 처리 / 권한 상실)
    club.members = club.members.filter(
      (m) =>
        m.name.trim() !== memberName.trim() &&
        !m.name.includes('(본인)') &&
        (memberName.includes('김대희') ? !m.name.includes('김대희') : true)
    );
    club.memberCount = club.members.length;

    // 만약 총무나 회장이 나간 경우 다음 멤버에게 권한 자동 위임
    if (
      (club.managerName.includes(memberName) || club.managerName.includes('김대희') || club.managerName.includes('(본인)')) &&
      club.members.length > 0
    ) {
      club.managerName = club.members[0].name;
      club.members[0].role = 'MANAGER';
    }
    if (
      (club.presidentName.includes(memberName) || club.presidentName.includes('김대희') || club.presidentName.includes('(본인)')) &&
      club.members.length > 0
    ) {
      club.presidentName = club.members[0].name;
      club.members[0].role = 'PRESIDENT';
    }

    // 내 소속 클럽 목록에서 제외 (클럽 내부 실록 접근 권한 제한)
    let myClubs = this.getMyClubIds();
    myClubs = myClubs.filter((id) => id !== clubId);

    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(list));
      localStorage.setItem(STORAGE_KEYS.MY_CLUB_IDS, JSON.stringify(myClubs));
      return { success: true, archived: archivedRecord };
    } catch {
      return { success: false };
    }
  },

  // 8. 클럽 탈퇴 회원 비밀 보관소 조회
  getArchivedMembers(clubId: string): ArchivedClubMember[] {
    const club = this.getClubById(clubId);
    return club?.archivedMembers || [];
  },

  // ==========================================
  // 📜 클럽 영구 연대기 (대회 실록 & 명예의 전당) 영구 보존 및 조회
  // ==========================================
  archiveEventRoomToClubChronicle(
    room: ClubEventRoom,
    options?: { groupPhotoUrl?: string; awardCardUrl?: string; longestDistance?: string; nearPinDistance?: string }
  ): ClubChronicleTournament | null {
    if (typeof window === 'undefined') return null;
    try {
      const individuals = this.getIndividualLeaderboard(room);
      const teams = this.getTeamLeaderboard(room);
      const specialAwards = this.calculateSpecialAwards(room);
      const totalParticipants = (room.groups || []).reduce((sum, g) => sum + g.players.length, 0);

      const winner = individuals[0];
      const runnerUp = individuals[1];
      const thirdPlace = individuals[2];
      const medalist = individuals.reduce<ClubLeaderboardIndividual | null>((best, cur) => {
        if (!best || (cur.totalStrokes > 0 && cur.totalStrokes < best.totalStrokes)) return cur;
        return best;
      }, null);

      const longestSpecial = specialAwards.find((sa) => sa.title.includes('롱기스트') || sa.badge === '🚀');
      const nearPinSpecial = specialAwards.find((sa) => sa.title.includes('니어핀') || sa.badge === '🎯');

      const chronicleId = `chronicle_${room.id}`;
      const chronicleRecord: ClubChronicleTournament = {
        id: chronicleId,
        roomId: room.id,
        clubId: room.clubId || 'default-club',
        clubName: room.clubName || '공식 파크골프 클럽',
        title: room.title,
        heldAt: room.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        courseId: room.courseId,
        courseName: room.courseName,
        totalHoles: room.totalHoles,
        gameMode: room.gameModeTitle || this.getGameModeInfo(room.gameMode).title,
        totalParticipants,
        winnerName: winner && winner.totalStrokes > 0 ? winner.playerName : '대회 진행중',
        winnerScore: winner ? (winner.netScore ?? winner.totalStrokes) : 0,
        runnerUpName: runnerUp && runnerUp.totalStrokes > 0 ? runnerUp.playerName : undefined,
        runnerUpScore: runnerUp ? (runnerUp.netScore ?? runnerUp.totalStrokes) : undefined,
        thirdPlaceName: thirdPlace && thirdPlace.totalStrokes > 0 ? thirdPlace.playerName : undefined,
        thirdPlaceScore: thirdPlace ? (thirdPlace.netScore ?? thirdPlace.totalStrokes) : undefined,
        medalistName: medalist && medalist.totalStrokes > 0 ? medalist.playerName : undefined,
        medalistScore: medalist ? medalist.totalStrokes : undefined,
        longestName: longestSpecial?.winnerName || undefined,
        longestDistance: options?.longestDistance || '장타 1위',
        nearPinName: nearPinSpecial?.winnerName || undefined,
        nearPinDistance: options?.nearPinDistance || '핀 밀착 1위',
        groupPhotoUrl: options?.groupPhotoUrl || undefined,
        awardCardUrl: options?.awardCardUrl || undefined,
        specialAwards: specialAwards.length > 0 ? specialAwards : undefined,
        luckyDrawWinners: room.awardConfig?.luckyDrawWinners || [],
        rankings: individuals.map((ind) => {
          const awardsWon: string[] = [];
          if (ind.rank === 1) awardsWon.push('우승 🏆');
          else if (ind.rank === 2) awardsWon.push('준우승 🥈');
          if (medalist && ind.playerId === medalist.playerId) awardsWon.push('메달리스트 🏅');
          const spMatch = specialAwards.filter((sp) => sp.winnerName === ind.playerName);
          spMatch.forEach((sp) => awardsWon.push(`${sp.badge} ${sp.title}`));
          return {
            rank: ind.rank,
            playerId: ind.playerId,
            playerName: ind.playerName,
            groupNumber: ind.groupNumber,
            totalStrokes: ind.totalStrokes,
            parDiff: ind.parDiff,
            handicap: ind.handicap,
            netScore: ind.netScore,
            isWinner: ind.rank === 1,
            awards: awardsWon,
          };
        }),
        groupResults: teams.map((t) => ({
          groupNumber: t.groupNumber,
          groupName: t.groupName,
          leaderName: t.leaderName,
          avgScore: t.avgStrokes,
          totalScore: t.totalStrokes,
          playersCount: t.playersCount,
        })),
        notes: room.gameRuleNotes,
        archivedAt: new Date().toISOString(),
      };

      // 1. 전역 연대기 목록에 영구 저장
      const allChronicles = this.getAllGlobalChronicles();
      const existingIdx = allChronicles.findIndex((c) => c.id === chronicleId || c.roomId === room.id);
      if (existingIdx !== -1) {
        allChronicles[existingIdx] = chronicleRecord;
      } else {
        allChronicles.unshift(chronicleRecord);
      }
      // [10만명 3개월 누적 대비] 전역 연대기 캐시는 최신 150건까지만 롤링 보관하여 브라우저 용량(5MB) 초과 방지
      const cappedChronicles = allChronicles.slice(0, 150);
      localStorage.setItem(STORAGE_KEYS.CLUB_CHRONICLES, JSON.stringify(cappedChronicles));

      // 2. 소속 클럽 엔티티에도 영구 반영
      if (room.clubId) {
        const clubs = this.getAllClubs();
        const club = clubs.find((c) => c.id === room.clubId);
        if (club) {
          if (!club.chronicles) club.chronicles = [];
          const cIdx = club.chronicles.findIndex((c) => c.id === chronicleId || c.roomId === room.id);
          if (cIdx !== -1) {
            club.chronicles[cIdx] = chronicleRecord;
          } else {
            club.chronicles.unshift(chronicleRecord);
          }
          if (club.chronicles.length > 100) {
            club.chronicles = club.chronicles.slice(0, 100);
          }
          localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(clubs));
        }
      }

      return chronicleRecord;
    } catch (e) {
      console.error('Failed to archive tournament to club chronicle:', e);
      return null;
    }
  },

  getAllGlobalChronicles(): ClubChronicleTournament[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLUB_CHRONICLES);
      if (data) {
        const list: ClubChronicleTournament[] = JSON.parse(data);
        const isCorrupted = (str?: string) => {
          if (!str) return false;
          return /160억|준신축|빌딩|수지분석|대로변|메디컬|vercel\.app|https?:\/\//i.test(str) || str.length > 80 || str.includes('\n');
        };
        const cleaned = list.filter((c) => !isCorrupted(c.title) && !isCorrupted(c.clubName));
        if (cleaned.length !== list.length) {
          localStorage.setItem(STORAGE_KEYS.CLUB_CHRONICLES, JSON.stringify(cleaned));
        }
        return cleaned;
      }
      return [];
    } catch {
      return [];
    }
  },

  getClubChronicles(clubId: string): ClubChronicleTournament[] {
    const globalList = this.getAllGlobalChronicles();
    const club = this.getClubById(clubId);
    const clubSpecific = club?.chronicles || [];

    const map = new Map<string, ClubChronicleTournament>();
    clubSpecific.forEach((c) => map.set(c.id, c));
    globalList.filter((c) => c.clubId === clubId).forEach((c) => map.set(c.id, c));

    // Also include any active rooms that belong to this club as live chronicle entries
    const allRooms = this.getAllRooms();
    allRooms
      .filter((r) => r.clubId === clubId)
      .forEach((r) => {
        const chrId = `chronicle_${r.id}`;
        if (!map.has(chrId)) {
          const generated = this.archiveEventRoomToClubChronicle(r);
          if (generated) map.set(generated.id, generated);
        }
      });

    return Array.from(map.values()).sort((a, b) => b.heldAt.localeCompare(a.heldAt));
  },

  // 특정 회원의 클럽 내 과거 대회 출전 이력 조회
  getMemberPastHistoryInClub(clubId: string, memberName: string) {
    const chronicles = this.getClubChronicles(clubId);
    const searchKey = memberName.replace('(본인)', '').trim();
    const playedChronicles: {
      tournament: ClubChronicleTournament;
      myRecord: ClubChronicleTournament['rankings'][0];
    }[] = [];

    chronicles.forEach((chr) => {
      const myRec = chr.rankings.find(
        (r) => r.playerName.trim() === memberName.trim() || r.playerName.includes(searchKey)
      );
      if (myRec) {
        playedChronicles.push({
          tournament: chr,
          myRecord: myRec,
        });
      }
    });

    return playedChronicles;
  },

  // 3-8. 💎 [3단계] 클럽 다이아몬드 명예의 전당 랭킹 보드 산출
  getClubDiamondRankings(clubId: string): {
    rank: number;
    memberId: string;
    memberName: string;
    memberCode: string;
    role: string;
    customRoleName?: string;
    tier: UserDiamondTier;
    totalCompleted9Holes: number;
    tierTitle: string;
  }[] {
    const club = this.getClubById(clubId);
    if (!club || !club.members) return [];

    const ranked = club.members.map((m) => {
      const completed = m.totalCompleted9Holes || (typeof window !== 'undefined' ? getUserCompleted9Holes(m.name) : 0);
      const tierObj = calculateTier(completed);
      return {
        memberId: m.id,
        memberName: m.name,
        memberCode: m.memberCode || 'PKYA-0000',
        role: m.role,
        customRoleName: m.customRoleName,
        tier: tierObj,
        totalCompleted9Holes: completed,
        tierTitle: tierObj.nameKo,
        weight: completed,
      };
    });

    ranked.sort((a, b) => b.weight - a.weight || a.memberName.localeCompare(b.memberName));

    return ranked.map((item, idx) => ({
      rank: idx + 1,
      memberId: item.memberId,
      memberName: item.memberName,
      memberCode: item.memberCode,
      role: item.role,
      customRoleName: item.customRoleName,
      tier: item.tier,
      totalCompleted9Holes: item.totalCompleted9Holes,
      tierTitle: item.tierTitle,
    }));
  },

  // 3-9. 📸 [3단계] 단체 기념사진 브라우저 캔버스 경량 압축(100KB 이하) & 골드 워터마크 각인
  async compressAndWatermarkPhoto(file: File, watermarkText: string): Promise<string> {
    if (typeof window === 'undefined') return '';
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(img.src);

          ctx.drawImage(img, 0, 0, w, h);

          // 우측 하단 골드 워터마크 띠
          const barH = Math.max(32, Math.round(h * 0.07));
          ctx.fillStyle = 'rgba(6, 40, 30, 0.75)';
          ctx.fillRect(0, h - barH, w, barH);

          ctx.fillStyle = '#fef08a';
          ctx.font = `bold ${Math.max(12, Math.round(barH * 0.42))}px sans-serif`;
          ctx.textAlign = 'right';
          ctx.fillText(`파크골프 올인원 공식 실록 | ${watermarkText}`, w - 16, h - Math.round(barH * 0.32));

          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressed);
        };
        img.onerror = () => resolve('');
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  },

  // ==========================================
  // [NEW] 클럽 가입 초청장 관리 (도착한 초청장 수락/거절 & 발송)
  // ==========================================
  getClubInvitations(): ClubInvitation[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLUB_INVITATIONS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((inv) => inv && inv.id && !inv.id.startsWith('inv-ss-'));
    } catch {
      return [];
    }
  },

  acceptClubInvitation(invitationId: string, userName: string): boolean {
    const invites = this.getClubInvitations();
    const target = invites.find((inv) => inv.id === invitationId);
    if (!target) return false;

    // 해당 클럽에 즉시 가입 등록
    this.joinClub(target.clubId, userName);

    // 초청장 목록에서 제거
    const updated = invites.filter((inv) => inv.id !== invitationId);
    try {
      localStorage.setItem(STORAGE_KEYS.CLUB_INVITATIONS, JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  },

  rejectClubInvitation(invitationId: string): boolean {
    const invites = this.getClubInvitations();
    const updated = invites.filter((inv) => inv.id !== invitationId);
    try {
      localStorage.setItem(STORAGE_KEYS.CLUB_INVITATIONS, JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  },

  sendClubInvitation(invitation: Omit<ClubInvitation, 'id' | 'createdAt'>): boolean {
    const invites = this.getClubInvitations();
    const newInv: ClubInvitation = {
      ...invitation,
      id: `inv-${Date.now()}`,
      createdAt: '방금 전',
    };
    invites.unshift(newInv);
    try {
      localStorage.setItem(STORAGE_KEYS.CLUB_INVITATIONS, JSON.stringify(invites));
      return true;
    } catch {
      return false;
    }
  },


  // 특정 클럽에서 내가 사용할 활동명(실명/별명) 변경 저장
  updateClubMemberAlias(clubId: string, newAliasName: string): boolean {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club) return false;

    const member = club.members.find(
      (m) =>
        m.name.includes('본인') ||
        m.id === 'm2' ||
        m.id === 'mb3' ||
        m.role === 'MANAGER' ||
        m.name.includes('김총무') ||
        m.name.includes('홍길동')
    );

    if (member) {
      member.name = newAliasName;
      if (member.role === 'MANAGER') {
        club.managerName = newAliasName;
      }
    }

    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  },

  // 회원의 직책(회장/부회장/총무/감사/이사/경기위원장/맞춤직책) 배정 및 클럽 공식 직책자 정보 연동
  updateMemberRole(
    clubId: string,
    memberId: string,
    newRole: 'PRESIDENT' | 'VICE_PRESIDENT' | 'MANAGER' | 'AUDITOR' | 'DIRECTOR' | 'CAPTAIN' | 'MEMBER' | string,
    customRoleName?: string
  ): boolean {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club) return false;

    const targetMember = club.members.find((m) => m.id === memberId);
    if (!targetMember) return false;

    const effectiveName = customRoleName?.trim() || '';

    if (newRole === 'PRESIDENT' || effectiveName === '회장') {
      club.members.forEach((m) => {
        if ((m.role === 'PRESIDENT' || m.customRoleName === '회장') && m.id !== memberId) {
          m.role = 'MEMBER';
          m.customRoleName = undefined;
        }
      });
      club.presidentName = targetMember.name;
    } else if (newRole === 'MANAGER' || effectiveName === '총무') {
      club.members.forEach((m) => {
        if ((m.role === 'MANAGER' || m.customRoleName === '총무') && m.id !== memberId) {
          m.role = 'MEMBER';
          m.customRoleName = undefined;
        }
      });
      club.managerName = targetMember.name;
    } else {
      if (targetMember.role === 'PRESIDENT') {
        club.presidentName = '공석';
      } else if (targetMember.role === 'MANAGER') {
        club.managerName = '공석';
      }
    }

    targetMember.role = newRole;
    targetMember.customRoleName = customRoleName?.trim() ? customRoleName.trim() : undefined;

    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  },

  // 클럽 연회비 기준 금액 설정
  updateClubAnnualDues(clubId: string, amount: number): boolean {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club) return false;
    club.annualDuesAmount = amount;
    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  },

  // 회원별 연회비 납부 상태 토글 및 기록
  updateMemberDues(
    clubId: string,
    memberId: string,
    duesPaid: boolean,
    amount?: number,
    notes?: string
  ): boolean {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club) return false;
    const member = club.members.find((m) => m.id === memberId);
    if (!member) return false;

    member.duesPaid = duesPaid;
    if (duesPaid) {
      member.duesPaidAt = new Date().toISOString().slice(0, 10);
      member.duesAmount = amount || club.annualDuesAmount || 50000;
      member.duesNotes = notes || '수납 완료';
    } else {
      member.duesPaidAt = undefined;
      member.duesNotes = undefined;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  },

  // ==========================================
  // [NEW] 번개 모임 (실시간 라운드 조인) 관리
  // ==========================================
  getAllFlashGatherings(): FlashGathering[] {
    if (typeof window === 'undefined') return generateDefaultSeedFlash();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FLASH_GATHERINGS);
      if (!data) {
        const seeds = generateDefaultSeedFlash();
        localStorage.setItem(STORAGE_KEYS.FLASH_GATHERINGS, JSON.stringify(seeds));
        return seeds;
      }
      return JSON.parse(data);
    } catch {
      return generateDefaultSeedFlash();
    }
  },

  createFlashGathering(data: {
    title: string;
    type: 'OPEN' | 'CLUB_ONLY';
    clubId?: string;
    clubName?: string;
    courseId: string;
    courseName: string;
    playDate: string;
    playTime: string;
    targetCount?: number;
    lightningScope?: 'FOUR_PLAYERS' | 'MULTI_OPEN';
    hostName: string;
    notes?: string;
  }): FlashGathering {
    const list = this.getAllFlashGatherings();
    const newId = `flash-${Date.now()}`;
    const scope = data.lightningScope || (data.targetCount && data.targetCount > 4 ? 'MULTI_OPEN' : 'FOUR_PLAYERS');
    const target = scope === 'MULTI_OPEN' ? 999 : (data.targetCount || 4);

    const newGathering: FlashGathering = {
      id: newId,
      title: data.title,
      type: data.type,
      clubId: data.clubId,
      clubName: data.clubName,
      courseId: data.courseId,
      courseName: data.courseName,
      playDate: data.playDate,
      playTime: data.playTime,
      targetCount: target,
      lightningScope: scope,
      currentParticipants: [
        {
          id: `p_${Date.now()}`,
          name: `${data.hostName} (개설자)`,
          joinedAt: new Date().toISOString(),
        },
      ],
      hostName: data.hostName,
      notes: data.notes || '',
      status: 'RECRUITING',
      createdAt: new Date().toISOString(),
    };

    list.unshift(newGathering);
    // [10만명 3개월 누적 대비] 번개 모임 목록은 최근 100건으로 롤링 유지하여 무한 누적 방지
    const cappedList = list.slice(0, 100);
    try {
      localStorage.setItem(STORAGE_KEYS.FLASH_GATHERINGS, JSON.stringify(cappedList));
    } catch {
      // ignore
    }
    return newGathering;
  },

  joinFlashGathering(
    gatheringId: string,
    participantName: string,
    phone?: string
  ): { success: boolean; isWaitlist: boolean; waitNumber?: number; message?: string } {
    const list = this.getAllFlashGatherings();
    const item = list.find((g) => g.id === gatheringId);
    if (!item) return { success: false, isWaitlist: false, message: '모임을 찾을 수 없습니다.' };

    if (!item.waitingList) item.waitingList = [];

    const alreadyJoined = item.currentParticipants.some((p) => p.name.includes(participantName));
    if (alreadyJoined) return { success: true, isWaitlist: false, message: '이미 참가자로 등록되어 있습니다.' };

    const isMultiOpen = item.lightningScope === 'MULTI_OPEN' || item.targetCount >= 999;

    // 4인 번개일 때만 정원 초과 대기자 등록
    if (!isMultiOpen && item.currentParticipants.length >= 4) {
      item.status = 'FULL';
      const waitNumber = item.waitingList.length + 1;
      item.waitingList.push({
        id: `wait_${Date.now()}`,
        name: participantName,
        joinedAt: new Date().toISOString(),
        phone,
        waitNumber,
      });

      try {
        localStorage.setItem(STORAGE_KEYS.FLASH_GATHERINGS, JSON.stringify(list));
        return { success: true, isWaitlist: true, waitNumber };
      } catch {
        return { success: false, isWaitlist: true, message: '저장 실패' };
      }
    }

    // 정규 참가자 등록 (4인 이상 무제한 번개는 무제한 등록!)
    item.currentParticipants.push({
      id: `p_${Date.now()}`,
      name: participantName,
      joinedAt: new Date().toISOString(),
      phone,
    });

    if (!isMultiOpen && item.currentParticipants.length >= 4) {
      item.status = 'FULL';
    }

    try {
      localStorage.setItem(STORAGE_KEYS.FLASH_GATHERINGS, JSON.stringify(list));
      return { success: true, isWaitlist: false };
    } catch {
      return { success: false, isWaitlist: false, message: '저장 실패' };
    }
  },

  cancelFlashGathering(
    gatheringId: string,
    participantName: string
  ): { success: boolean; promotedPlayerName?: string } {
    const list = this.getAllFlashGatherings();
    const item = list.find((g) => g.id === gatheringId);
    if (!item) return { success: false };

    if (!item.waitingList) item.waitingList = [];

    const wasParticipant = item.currentParticipants.some((p) => p.name.includes(participantName));
    const wasWaiting = item.waitingList.some((p) => p.name.includes(participantName));

    if (wasWaiting) {
      item.waitingList = item.waitingList.filter((p) => !p.name.includes(participantName));
      item.waitingList.forEach((p, idx) => {
        p.waitNumber = idx + 1;
      });
    }

    let promotedPlayerName: string | undefined = undefined;

    if (wasParticipant) {
      item.currentParticipants = item.currentParticipants.filter(
        (p) => !p.name.includes(participantName)
      );

      // 대기자가 있으면 1순위 대기자를 자동 참가자로 즉시 승격!
      if (item.waitingList.length > 0) {
        const nextInLine = item.waitingList.shift()!;
        promotedPlayerName = nextInLine.name;
        item.currentParticipants.push({
          id: nextInLine.id,
          name: nextInLine.name,
          joinedAt: new Date().toISOString(),
          phone: nextInLine.phone,
        });

        // 남은 대기자 순번 재정렬
        item.waitingList.forEach((p, idx) => {
          p.waitNumber = idx + 1;
        });
      }
    }

    if (item.currentParticipants.length < item.targetCount) {
      item.status = 'RECRUITING';
    } else {
      item.status = 'FULL';
    }

    try {
      localStorage.setItem(STORAGE_KEYS.FLASH_GATHERINGS, JSON.stringify(list));
      return { success: true, promotedPlayerName };
    } catch {
      return { success: false };
    }
  },

  leaveFlashGathering(
    gatheringId: string,
    participantName: string
  ): { success: boolean; promotedPlayerName?: string } {
    return this.cancelFlashGathering(gatheringId, participantName);
  },

  // 카카오톡 / LINE 번개 모집 초대장 문구 생성
  generateFlashKakaoShareText(flash: FlashGathering, isJapanese?: boolean): string {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/club?hub=FLASH&flashId=${flash.id}`
        : `https://www.parkgolfallinone.com/club?hub=FLASH&flashId=${flash.id}`;

    const clubBadge = flash.clubName
      ? `[${flash.clubName}]`
      : isJapanese
      ? '[ParkOn 招集マッチ]'
      : '[파크골프 올인원 번개]';
    const isMultiOpen = flash.lightningScope === 'MULTI_OPEN' || flash.targetCount >= 999;
    const capacityText = isMultiOpen
      ? (isJapanese ? `4人以上 人数無制限 (現在 ${flash.currentParticipants.length}名参加中!)` : `4인 이상 인원 무제한 (현재 ${flash.currentParticipants.length}명 참여 중!)`)
      : (isJapanese ? `4人募集 (現在 ${flash.currentParticipants.length}/4名、2名以上で即時出発)` : `4인 번개 (현재 ${flash.currentParticipants.length}/4명, 2인 이상 출발 가능)`);

    if (isJapanese) {
      return `${clubBadge} ⚡ 招集マッチ参加者募集！
"${flash.title}"

⛳ コース: ${flash.courseName}
📅 日時: ${flash.playDate} ${flash.playTime}
👥 募集: ${capacityText}
👤 参加者: ${flash.currentParticipants.map((p) => p.name).join(', ')}
${flash.notes ? `💬 メッセージ: "${flash.notes}"\n` : ''}
👇 下のParkOnリンクをタップしてワンタップで参加！
${shareUrl}`;
    }

    return `${clubBadge} ⚡ 번개 라운드 긴급 모집!
"${flash.title}"

⛳ 장소: ${flash.courseName}
📅 일시: ${flash.playDate} ${flash.playTime}
👥 모집: ${capacityText}
👤 현재 참가: ${flash.currentParticipants.map((p) => p.name).join(', ')}
${flash.notes ? `💬 안내: "${flash.notes}"\n` : ''}
👇 아래 파크골프 올인원 링크를 눌러 1초 만에 바로 조인하세요!
${shareUrl}`;
  },

  // 전체 조 편성 카카오톡 / LINE 단톡방 공지 문구 생성
  generateGroupFormationKakaoShareText(room: ClubEventRoom, isJapanese?: boolean): string {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://www.parkgolfallinone.com';
    const link = `${origin}/club/${room.id}`;
    const totalPlayers = room.groups.reduce((sum, g) => sum + g.players.length, 0);

    let text = isJapanese
      ? `📢 [パークゴルフ オールインワン] ${room.courseName} 組編成結果\n`
      : `📢 [파크골프 올인원] ${room.courseName} 라운드 조 편성 결과\n`;
    text += `🏆 ${room.title}\n`;
    text += isJapanese
      ? `👥 計 ${room.groups.length}組 (${totalPlayers}名 割当完了)\n`
      : `👥 총 ${room.groups.length}개 조 (${totalPlayers}명 배정 완료)\n`;
    text += `---------------------------------\n`;

    room.groups.forEach((g, gIdx) => {
      const leaderStr = g.leaderName
        ? (isJapanese ? ` (代表: ${g.leaderName})` : ` (조장: ${g.leaderName})`)
        : '';
      const startHoleRaw = this.getGroupStartHole(gIdx, room.selectedCourseLetters, g.startCourseLetter);
      const startHoleStr = isJapanese
        ? `[🚩 ${startHoleRaw.replace('홀', '番H')} 出発]`
        : `[🚩 ${startHoleRaw} 티샷]`;
      const members = g.players.map((p) => (p.isLeader ? `👑${p.name}` : p.name)).join(', ');
      text += `⛳ ${g.name} ${startHoleStr}${leaderStr}: ${members || (isJapanese ? '割当待機中' : '배정 대기 중')}\n`;
    });

    text += `---------------------------------\n`;
    text += isJapanese
      ? `📡 リアルタイム電光掲示板 ＆ スコアボード:\n${link}`
      : `📡 실시간 디지털 전광판 & 스코어보드 바로가기:\n${link}`;
    return text;
  },

  // [대표님 지시] 50개 조 이상 대규모 샷건 출발 홀 자동 순환 분배 계산
  getGroupStartHole(groupIndex: number, roomCourseLetters?: string[], groupStartCourseLetter?: string): string {
    const letters = roomCourseLetters && roomCourseLetters.length > 0 ? roomCourseLetters : ['A', 'B'];
    const totalPhysicalHoles = letters.length * 9;
    const holeOffset = groupIndex % totalPhysicalHoles;
    const courseIndex = Math.floor(holeOffset / 9);
    const holeNumber = (holeOffset % 9) + 1;
    const courseLetter = letters[courseIndex] || 'A';
    const wave = Math.floor(groupIndex / totalPhysicalHoles);
    const waveSuffix = wave > 0 ? ` (${wave + 1}부)` : '';
    return `${courseLetter}-${holeNumber}홀${waveSuffix}`;
  },
};

