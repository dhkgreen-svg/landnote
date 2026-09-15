import {
  ClubEventRoom,
  ClubGroup,
  ClubPlayer,
  ClubLeaderboardTeam,
  ClubLeaderboardIndividual,
  ParkGolfClub,
  ClubMember,
  FlashGathering,
  LuckyDrawWinner,
  AwardRuleConfig,
  SpecialAwardWinner,
  SpecialAwardType,
} from '@/types/club';

const STORAGE_KEYS = {
  CLUB_ROOMS: 'parkon_club_rooms_v1',
  ACTIVE_CLUB_ROOM_ID: 'parkon_active_club_room_id_v1',
  CLUBS: 'parkon_clubs_v1',
  MY_CLUB_IDS: 'parkon_my_club_ids_v1',
  FLASH_GATHERINGS: 'parkon_flash_gatherings_v1',
};

// 기본 샘플 클럽 데이터
function generateDefaultSeedClubs(): ParkGolfClub[] {
  return [
    {
      id: 'club-gumi-dongrak',
      name: '구미 동락 에이스 파크골프 클럽',
      region: '경북 구미',
      homeCourseId: 'course-gumi-dongrak',
      homeCourseName: '구미 동락 파크골프장',
      description: '구미 동락구장을 사랑하는 5070 동호인 클럽입니다. 매월 둘째 주 토요일 정기 월례회 개최!',
      presidentName: '박회장',
      managerName: '김총무(본인)',
      contactPhone: '010-1234-5678',
      memberCount: 38,
      members: [
        { id: 'm1', name: '박회장', role: 'PRESIDENT', joinedAt: '2026-01-01', phone: '010-1111-2222' },
        { id: 'm2', name: '김총무(본인)', role: 'MANAGER', joinedAt: '2026-01-02', phone: '010-1234-5678' },
        { id: 'm3', name: '이순신', role: 'MEMBER', joinedAt: '2026-02-15', phone: '010-3333-4444' },
        { id: 'm4', name: '강감찬', role: 'MEMBER', joinedAt: '2026-03-01', phone: '010-5555-6666' },
        { id: 'm5', name: '을지문덕', role: 'MEMBER', joinedAt: '2026-03-05', phone: '010-7777-8888' },
      ],
      pendingMembers: [
        {
          id: 'pm_1',
          name: '정약용',
          phone: '010-9123-4567',
          requestedAt: '오늘 11:20',
          message: '동락구장에서 자주 칩니다. 회원 가입 신청합니다!',
        },
        {
          id: 'pm_2',
          name: '신사임당',
          phone: '010-8876-5432',
          requestedAt: '오늘 13:40',
          message: '주말 월례회 참석하고 싶어요^^',
        },
      ],
      isPublic: true,
      badgeColor: 'emerald',
      createdAt: '2026-01-01',
    },
    {
      id: 'club-busan-samrak',
      name: '부산 낙동 파크골프 사랑방',
      region: '부산 사상',
      homeCourseId: 'course-busan-samrak',
      homeCourseName: '부산 삼락 파크골프장',
      description: '삼락 생태공원의 맑은 바람과 함께 즐기는 친목 파크골프 클럽입니다. 초보 환영!',
      presidentName: '이회장',
      managerName: '최총무',
      contactPhone: '010-9876-5432',
      memberCount: 45,
      members: [
        { id: 'mb1', name: '이회장', role: 'PRESIDENT', joinedAt: '2026-02-01', phone: '010-9999-8888' },
        { id: 'mb2', name: '최총무', role: 'MANAGER', joinedAt: '2026-02-05', phone: '010-9876-5432' },
        { id: 'mb3', name: '김총무(본인)', role: 'MEMBER', joinedAt: '2026-02-20', phone: '010-1234-5678' },
        { id: 'mb4', name: '박영수', role: 'MEMBER', joinedAt: '2026-03-01', phone: '010-3344-5566' },
      ],
      pendingMembers: [],
      isPublic: true,
      badgeColor: 'amber',
      createdAt: '2026-02-01',
    },
    {
      id: 'club-seoul-hangang',
      name: '서울 한강 시니어 파크골프회',
      region: '서울 영등포',
      homeCourseId: 'course-seoul-yeouido',
      homeCourseName: '여의도 파크골프장',
      description: '여의도 한강 둔치에서 건강과 우정을 다지는 수도권 명문 파크골프 클럽입니다.',
      presidentName: '정회장',
      managerName: '강총무',
      contactPhone: '010-5555-8888',
      memberCount: 52,
      members: [
        { id: 'ms1', name: '정회장', role: 'PRESIDENT', joinedAt: '2026-01-10', phone: '010-2211-3344' },
        { id: 'ms2', name: '강총무', role: 'MANAGER', joinedAt: '2026-01-12', phone: '010-5555-8888' },
      ],
      pendingMembers: [],
      isPublic: true,
      badgeColor: 'purple',
      createdAt: '2026-01-10',
    },
  ];
}

// 기본 샘플 번개 데이터
function generateDefaultSeedFlash(): FlashGathering[] {
  return [
    {
      id: 'flash-1',
      title: '오늘 14:00 동락 2명 급구! (18홀 편하게 치실 분)',
      type: 'OPEN',
      courseId: 'course-gumi-dongrak',
      courseName: '구미 동락 파크골프장',
      playDate: '오늘 (당일)',
      playTime: '14:00',
      targetCount: 4,
      currentParticipants: [
        { id: 'fp1', name: '김총무 (개설자)', joinedAt: '2026-09-12 10:00' },
        { id: 'fp2', name: '이순신', joinedAt: '2026-09-12 11:30' },
      ],
      hostName: '김총무',
      notes: '18홀 가볍게 치고 커피 한잔해요! 초보자 환영합니다.',
      status: 'RECRUITING',
      createdAt: '2026-09-12T01:00:00.000Z',
    },
    {
      id: 'flash-2',
      title: '주말 토요일 오전 9시 삼락 1명 조인 모십니다',
      type: 'OPEN',
      courseId: 'course-busan-samrak',
      courseName: '부산 삼락 파크골프장',
      playDate: '9월 13일(일)',
      playTime: '09:00',
      targetCount: 4,
      currentParticipants: [
        { id: 'fp3', name: '최총무 (개설자)', joinedAt: '2026-09-12 09:00' },
        { id: 'fp4', name: '박영수', joinedAt: '2026-09-12 09:40' },
        { id: 'fp5', name: '정미경', joinedAt: '2026-09-12 10:10' },
      ],
      hostName: '최총무',
      notes: '36홀 완주 목표, 매너 플레이어 모십니다.',
      status: 'RECRUITING',
      createdAt: '2026-09-12T02:00:00.000Z',
    },
    {
      id: 'flash-3',
      title: '[동락클럽 전용] 평일 오후 번개 4인 라운드',
      type: 'CLUB_ONLY',
      clubId: 'club-gumi-dongrak',
      clubName: '구미 동락 에이스 파크골프 클럽',
      courseId: 'course-gumi-dongrak',
      courseName: '구미 동락 파크골프장',
      playDate: '오늘 (당일)',
      playTime: '16:00',
      targetCount: 4,
      currentParticipants: [
        { id: 'fp6', name: '박회장 (개설자)', joinedAt: '2026-09-12 08:30' },
      ],
      hostName: '박회장',
      notes: '동락클럽 회원님들 번개입니다. 저녁 식사 같이해요.',
      status: 'RECRUITING',
      createdAt: '2026-09-12T02:30:00.000Z',
    },
  ];
}

// 실전 20명 5개 조 시드 데이터 생성
function generateDefaultSeedRoom(): ClubEventRoom {
  const seedGroups: ClubGroup[] = [
    {
      groupNumber: 1,
      name: '1조',
      startCourseLetter: 'A',
      leaderName: '홍길동(본인)',
      status: 'PLAYING',
      players: [
        {
          id: 'p_1_1',
          name: '홍길동(본인)',
          isLeader: true,
          scores: { 1: 3, 2: 3, 3: 4, 4: 3, 5: 3, 6: 4, 7: 3, 8: 3, 9: 4, 10: 3, 11: 3, 12: 3 },
          totalStrokes: 39,
          parDiff: -3,
          holesCompleted: 12,
        },
        {
          id: 'p_1_2',
          name: '김영호',
          isLeader: false,
          scores: { 1: 3, 2: 4, 3: 4, 4: 3, 5: 4, 6: 4, 7: 3, 8: 3, 9: 5, 10: 3, 11: 4, 12: 3 },
          totalStrokes: 43,
          parDiff: 1,
          holesCompleted: 12,
        },
        {
          id: 'p_1_3',
          name: '이순신',
          isLeader: false,
          scores: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 4, 7: 3, 8: 3, 9: 4, 10: 3, 11: 3, 12: 4 },
          totalStrokes: 39,
          parDiff: -3,
          holesCompleted: 12,
        },
        {
          id: 'p_1_4',
          name: '강감찬',
          isLeader: false,
          scores: { 1: 4, 2: 4, 3: 4, 4: 3, 5: 4, 6: 5, 7: 3, 8: 4, 9: 4, 10: 4, 11: 3, 12: 4 },
          totalStrokes: 46,
          parDiff: 4,
          holesCompleted: 12,
        },
      ],
      avgScore: 41.8,
      totalScore: 167,
    },
    {
      groupNumber: 2,
      name: '2조',
      startCourseLetter: 'A',
      leaderName: '박찬호',
      status: 'PLAYING',
      players: [
        {
          id: 'p_2_1',
          name: '박찬호',
          isLeader: true,
          scores: { 1: 3, 2: 3, 3: 4, 4: 4, 5: 3, 6: 4, 7: 4, 8: 3, 9: 4, 10: 3, 11: 3 },
          totalStrokes: 38,
          parDiff: -1,
          holesCompleted: 11,
        },
        {
          id: 'p_2_2',
          name: '류현진',
          isLeader: false,
          scores: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 4, 7: 3, 8: 3, 9: 4, 10: 3, 11: 3 },
          totalStrokes: 35,
          parDiff: -4,
          holesCompleted: 11,
        },
        {
          id: 'p_2_3',
          name: '추신수',
          isLeader: false,
          scores: { 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 3, 8: 4, 9: 4, 10: 4, 11: 4 },
          totalStrokes: 43,
          parDiff: 4,
          holesCompleted: 11,
        },
        {
          id: 'p_2_4',
          name: '손흥민',
          isLeader: false,
          scores: { 1: 3, 2: 4, 3: 4, 4: 3, 5: 3, 6: 4, 7: 3, 8: 3, 9: 4, 10: 3, 11: 4 },
          totalStrokes: 38,
          parDiff: -1,
          holesCompleted: 11,
        },
      ],
      avgScore: 38.5,
      totalScore: 154,
    },
    {
      groupNumber: 3,
      name: '3조',
      startCourseLetter: 'B',
      leaderName: '이만기',
      status: 'PLAYING',
      players: [
        {
          id: 'p_3_1',
          name: '이만기',
          isLeader: true,
          scores: { 10: 3, 11: 3, 12: 3, 13: 4, 14: 3, 15: 3, 16: 4, 17: 3, 18: 4, 1: 3, 2: 3, 3: 4 },
          totalStrokes: 40,
          parDiff: -2,
          holesCompleted: 12,
        },
        {
          id: 'p_3_2',
          name: '강호동',
          isLeader: false,
          scores: { 10: 3, 11: 4, 12: 3, 13: 4, 14: 4, 15: 3, 16: 4, 17: 3, 18: 4, 1: 3, 2: 4, 3: 4 },
          totalStrokes: 43,
          parDiff: 1,
          holesCompleted: 12,
        },
        {
          id: 'p_3_3',
          name: '유재석',
          isLeader: false,
          scores: { 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 4, 17: 3, 18: 4, 1: 3, 2: 3, 3: 3 },
          totalStrokes: 38,
          parDiff: -4,
          holesCompleted: 12,
        },
        {
          id: 'p_3_4',
          name: '신동엽',
          isLeader: false,
          scores: { 10: 4, 11: 4, 12: 4, 13: 4, 14: 3, 15: 4, 16: 4, 17: 4, 18: 5, 1: 4, 2: 4, 3: 4 },
          totalStrokes: 48,
          parDiff: 6,
          holesCompleted: 12,
        },
      ],
      avgScore: 42.3,
      totalScore: 169,
    },
    {
      groupNumber: 4,
      name: '4조',
      startCourseLetter: 'B',
      leaderName: '최경주',
      status: 'PLAYING',
      players: [
        {
          id: 'p_4_1',
          name: '최경주',
          isLeader: true,
          scores: { 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 3, 17: 3, 18: 3, 1: 3, 2: 3, 3: 3, 4: 3 },
          totalStrokes: 39,
          parDiff: -7,
          holesCompleted: 13,
        },
        {
          id: 'p_4_2',
          name: '양용은',
          isLeader: false,
          scores: { 10: 3, 11: 3, 12: 3, 13: 4, 14: 3, 15: 3, 16: 4, 17: 3, 18: 4, 1: 3, 2: 3, 3: 4, 4: 3 },
          totalStrokes: 43,
          parDiff: -3,
          holesCompleted: 13,
        },
        {
          id: 'p_4_3',
          name: '박세리',
          isLeader: false,
          scores: { 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 4, 17: 3, 18: 4, 1: 3, 2: 3, 3: 3, 4: 3 },
          totalStrokes: 41,
          parDiff: -5,
          holesCompleted: 13,
        },
        {
          id: 'p_4_4',
          name: '신지애',
          isLeader: false,
          scores: { 10: 3, 11: 3, 12: 3, 13: 3, 14: 3, 15: 3, 16: 4, 17: 3, 18: 4, 1: 3, 2: 3, 3: 4, 4: 3 },
          totalStrokes: 42,
          parDiff: -4,
          holesCompleted: 13,
        },
      ],
      avgScore: 41.3,
      totalScore: 165,
    },
    {
      groupNumber: 5,
      name: '5조',
      startCourseLetter: 'A',
      leaderName: '김연아',
      status: 'RECRUITING',
      players: [
        {
          id: 'p_5_1',
          name: '김연아',
          isLeader: true,
          scores: { 1: 3, 2: 3, 3: 4, 4: 4, 5: 3, 6: 4, 7: 3, 8: 3, 9: 4, 10: 3 },
          totalStrokes: 34,
          parDiff: -1,
          holesCompleted: 10,
        },
        {
          id: 'p_5_2',
          name: '박태환',
          isLeader: false,
          scores: { 1: 3, 2: 4, 3: 4, 4: 3, 5: 4, 6: 4, 7: 3, 8: 3, 9: 5, 10: 4 },
          totalStrokes: 37,
          parDiff: 2,
          holesCompleted: 10,
        },
        {
          id: 'p_5_3',
          name: '장미란',
          isLeader: false,
          scores: { 1: 4, 2: 4, 3: 4, 4: 3, 5: 4, 6: 5, 7: 3, 8: 4, 9: 4, 10: 4 },
          totalStrokes: 39,
          parDiff: 4,
          holesCompleted: 10,
        },
        // 4번째 자리는 빈자리로 두어 새 회원이 바로 참가 가능
      ],
      avgScore: 36.7,
      totalScore: 110,
    },
  ];

  return {
    id: 'dongrak-monthly-sep',
    title: '구미 동락클럽 9월 정기 월례회 🏆',
    courseId: 'gumi-dongrak',
    courseName: '구미 동락 파크골프장',
    hostName: '김총무',
    selectedCourseLetters: ['A', 'B'],
    totalHoles: 18,
    targetTotalPlayers: 20,
    status: 'PLAYING',
    createdAt: new Date().toISOString().split('T')[0],
    groups: seedGroups,
  };
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
        // 사용자가 직접 만든 방만 유지하고 이전 가상 시드 방('dongrak-monthly-sep')은 정리
        const realRooms = rooms.filter((r) => r.id !== 'dongrak-monthly-sep');
        if (realRooms.length !== rooms.length) {
          localStorage.setItem(STORAGE_KEYS.CLUB_ROOMS, JSON.stringify(realRooms));
        }
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
      localStorage.setItem(STORAGE_KEYS.CLUB_ROOMS, JSON.stringify(rooms));
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

  // 3-4. 스마트 조 편성 엔진 (완전 랜덤 / 남녀 성비 균형 / 실력 균형 / 조장 사전지정 유지)
  autoGroupPlayers(
    roomId: string,
    method: 'RANDOM' | 'BALANCED_GENDER' | 'BALANCED_TIER' | 'KEEP_LEADERS',
    customGroupCount?: number
  ): ClubEventRoom | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const leaderMap = new Map<number, ClubPlayer>();

    if (method === 'KEEP_LEADERS') {
      room.groups.forEach((g) => {
        const leader = g.players.find((p) => p.isLeader) || g.players[0];
        if (leader) {
          leaderMap.set(g.groupNumber, { ...leader, isLeader: true });
        }
      });
    }

    // 풀에 들어갈 일반 인원 수집
    const candidatePlayers: ClubPlayer[] = [];
    if (room.waitingPool) {
      candidatePlayers.push(...room.waitingPool);
    }
    room.groups.forEach((g) => {
      g.players.forEach((p) => {
        if (method === 'KEEP_LEADERS' && leaderMap.get(g.groupNumber)?.id === p.id) {
          // 조장으로 보존
        } else {
          candidatePlayers.push({ ...p, isLeader: false });
        }
      });
    });

    const totalCount = candidatePlayers.length + (method === 'KEEP_LEADERS' ? leaderMap.size : 0);
    if (totalCount === 0) return room;

    // 최적 조 수 및 배분 계산
    const optimal = this.calculateOptimalGroups(totalCount);
    let groupCount = customGroupCount || optimal.groupCount;
    if (method === 'KEEP_LEADERS' && leaderMap.size > 0) {
      groupCount = Math.max(groupCount, leaderMap.size);
    }

    let distribution: number[] = [];
    if (customGroupCount && customGroupCount !== optimal.groupCount) {
      const dist = Array(customGroupCount).fill(0);
      for (let i = 0; i < totalCount; i++) dist[i % customGroupCount]++;
      distribution = dist;
    } else {
      distribution = [...optimal.distribution];
      while (distribution.length < groupCount) {
        distribution.push(0);
      }
    }

    // 알고리즘별 정렬 및 셔플
    let orderedCandidates = [...candidatePlayers];

    if (method === 'RANDOM' || method === 'KEEP_LEADERS') {
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

    // 신규 조 구성
    const letters = room.selectedCourseLetters.length > 0 ? room.selectedCourseLetters : ['A', 'B'];
    const newGroups: ClubGroup[] = [];

    for (let i = 1; i <= groupCount; i++) {
      const courseLetter = letters[(i - 1) % letters.length];
      const initialPlayers: ClubPlayer[] = [];

      if (method === 'KEEP_LEADERS' && leaderMap.has(i)) {
        initialPlayers.push(leaderMap.get(i)!);
      }

      newGroups.push({
        groupNumber: i,
        name: `${i}조`,
        startCourseLetter: courseLetter,
        leaderName: initialPlayers[0]?.name || '',
        players: initialPlayers,
        status: 'WAITING',
      });
    }

    // 스네이크 방식으로 조별 균등 채우기
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

      targetGroup.players.push(player);

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

    // 조장 확정 (첫 번째 사람 또는 기지정 조장)
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
      groups,
      waitingPool: [],
      status: 'RECRUITING',
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.saveRoom(newRoom);
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
    const hiddenHoles = [1, 2, 4, 5, 7, 8, 10, 11, 13, 14, 16, 17]; // 18홀 중 12개 숨은 홀 표준 배치

    room.groups.forEach((g) => {
      g.players.forEach((p) => {
        let handicap: number | undefined;
        let netScore: number | undefined;

        if (isNewPerio && p.holesCompleted > 0) {
          // 12개 숨은 홀 타수 집계
          let hiddenSum = 0;
          let countedHiddenHoles = 0;
          hiddenHoles.forEach((hNum) => {
            if (typeof p.scores[hNum] === 'number') {
              hiddenSum += p.scores[hNum];
              countedHiddenHoles++;
            }
          });

          if (countedHiddenHoles > 0) {
            // 표준 신페리오 공식: (12개 숨은홀 타수 합계 * 1.5 - 기준파(66)) * 0.8
            // 홀수 비례 보정 적용
            const scale = 12 / countedHiddenHoles;
            const estimatedHiddenSum = hiddenSum * scale;
            const rawHandicap = (estimatedHiddenSum * 1.5 - 66) * 0.8;
            handicap = Math.max(0, Math.round(rawHandicap * 10) / 10);
            netScore = Math.round((p.totalStrokes - handicap) * 10) / 10;
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
        });
      });
    });

    // 정렬: 신페리오는 네트 스코어 최저타순, 스트로크는 총타수 최저타순
    list.sort((a, b) => {
      if (a.holesCompleted === 0 && b.holesCompleted === 0) return 0;
      if (a.holesCompleted === 0) return 1;
      if (b.holesCompleted === 0) return -1;

      if (isNewPerio && typeof a.netScore === 'number' && typeof b.netScore === 'number') {
        const diff = a.netScore - b.netScore;
        if (diff !== 0) return diff;
        // 네트 동타 시 실타수(Gross)가 적은 선수 우선
        return a.totalStrokes - b.totalStrokes;
      }

      return a.totalStrokes - b.totalStrokes;
    });

    list.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return list;
  },

  // 11. 카카오톡 공유 링크 및 초대 메시지 생성
  generateKakaoShareText(room: ClubEventRoom): string {
    const totalCurrentPlayers = room.groups.reduce((sum, g) => sum + g.players.length, 0);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3005';
    const link = `${origin}/club/${room.id}`;
    const modeInfo = this.getGameModeInfo(room.gameMode);

    let feeInfo = '';
    if (typeof room.entryFee === 'number' && room.entryFee > 0) {
      feeInfo = `\n💵 참가비: ${room.entryFee.toLocaleString()}원`;
      if (room.bankAccount) {
        feeInfo += `\n🏦 입금계좌: ${room.bankAccount}`;
      }
    } else if (room.entryFee === 0) {
      feeInfo = `\n💵 참가비: 무료`;
    }

    let rulesInfo = `\n🎯 경기 방식: ${room.gameModeTitle || modeInfo.title}`;
    if (room.gameRuleNotes) {
      rulesInfo += `\n📌 대회 룰: ${room.gameRuleNotes}`;
    }

    return `⛳ [파크온 (ParkOn) 클럽 모임 초대]\n\n🏆 ${room.title}\n📍 구장: ${room.courseName}\n👥 참가 인원: ${totalCurrentPlayers}명 / ${room.targetTotalPlayers}명 (${room.groups.length}개 조 편성)${feeInfo}${rulesInfo}\n\n아래 링크를 누르면 본인 조 확인 및 실시간 스코어보드로 입장합니다:\n${link}`;
  },

  // 12. 대회 최종 결과 텍스트 리포트 생성 (총무 복사용)
  generateTournamentResultReport(room: ClubEventRoom): string {
    const teams = this.getTeamLeaderboard(room);
    const individuals = this.getIndividualLeaderboard(room);
    const modeInfo = this.getGameModeInfo(room.gameMode);

    let report = `🏆 [${room.title} 대회 최종 결과]\n`;
    report += `📍 구장: ${room.courseName} (${room.totalHoles}홀)\n`;
    report += `🎯 경기 방식: ${room.gameModeTitle || modeInfo.title}\n\n`;

    report += `🥇 [팀 대항전 단체 순위]\n`;
    teams.forEach((t) => {
      const medal = t.rank === 1 ? '🥇' : t.rank === 2 ? '🥈' : t.rank === 3 ? '🥉' : '▪️';
      report += `${medal} ${t.rank}위 ${t.groupName} (조장: ${t.leaderName}) : 평균 ${t.avgStrokes}타\n`;
    });

    if (room.gameMode === 'NEW_PERIO') {
      report += `\n🎯 [신페리오 개인전 최종 순위 (핸디캡 적용)]\n`;
      individuals.slice(0, 5).forEach((p) => {
        const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : '▪️';
        report += `${medal} ${p.rank}위 ${p.playerName} (${p.groupNumber}조) : 네트 ${p.netScore}타 (실타수 ${p.totalStrokes}타, 핸디 ${p.handicap})\n`;
      });

      const sortedByGross = [...individuals].sort((a, b) => a.totalStrokes - b.totalStrokes);
      const medalist = sortedByGross[0];
      if (medalist) {
        report += `\n🏅 [메달리스트 (실타수 최저타)] : ${medalist.playerName} (${medalist.groupNumber}조) - 총 ${medalist.totalStrokes}타\n`;
      }
    } else {
      report += `\n🎖️ [개인전 TOP 5]\n`;
      individuals.slice(0, 5).forEach((p) => {
        const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : '▪️';
        const diffStr = p.parDiff <= 0 ? `${p.parDiff}` : `+${p.parDiff}`;
        report += `${medal} ${p.rank}위 ${p.playerName} (${p.groupNumber}조) : ${p.totalStrokes}타 (${diffStr})\n`;
      });
    }

    // 🛡️ 직전 우승자 시상 유예(독식 방지) 리포트 반영
    const graceInfo = this.getWinnerGraceInfo(room, individuals);
    if (graceInfo) {
      report += `\n🛡️ [우승자 시상 유예(독식 방지) 알림]\n`;
      report += `• 명예 1위: ${graceInfo.originalWinner.playerName} (${graceInfo.originalWinner.totalStrokes}타)\n`;
      report += `• 🎁 1위 시상품 승계: ${graceInfo.transferredWinner.playerName} (${graceInfo.transferredWinner.totalStrokes}타)\n`;
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

  // 12-4. 참가비 수납 현황 카카오톡 리포트 생성 (총무 단톡방 공유용)
  generatePaymentStatusKakaoReport(room: ClubEventRoom): string {
    const s = this.getPaymentSummary(room);
    const feeStr = s.fee > 0 ? `${s.fee.toLocaleString()}원` : '무료';
    const bankStr = s.bankAccount || '총무에게 문의';

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

  // ==========================================
  // [NEW] 클럽 커뮤니티 관리 (창단, 가입, 다중 클럽 관리)
  // ==========================================
  getAllClubs(): ParkGolfClub[] {
    if (typeof window === 'undefined') return generateDefaultSeedClubs();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLUBS);
      if (!data) {
        const seeds = generateDefaultSeedClubs();
        localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(seeds));
        localStorage.setItem(
          STORAGE_KEYS.MY_CLUB_IDS,
          JSON.stringify(['club-gumi-dongrak', 'club-busan-samrak'])
        );
        return seeds;
      }
      const parsed: ParkGolfClub[] = JSON.parse(data);
      return parsed.map((c) => ({
        ...c,
        pendingMembers: c.pendingMembers || [],
      }));
    } catch {
      return generateDefaultSeedClubs();
    }
  },

  getClubById(id: string): ParkGolfClub | null {
    const list = this.getAllClubs();
    return list.find((c) => c.id === id) || null;
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
    } catch {
      // ignore
    }
    return newClub;
  },

  getMyClubIds(): string[] {
    const defaultIds = ['club-gumi-dongrak', 'club-busan-samrak'];
    if (typeof window === 'undefined') return defaultIds;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MY_CLUB_IDS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.MY_CLUB_IDS, JSON.stringify(defaultIds));
        return defaultIds;
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return defaultIds;
      }
      return parsed;
    } catch {
      return defaultIds;
    }
  },

  // 1. 가입 신청하기 (총무 승인 대기 상태로 등록)
  requestJoinClub(
    clubId: string,
    applicant: { name: string; phone?: string; message?: string }
  ): boolean {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club) return false;

    if (!club.pendingMembers) club.pendingMembers = [];
    const alreadyPending = club.pendingMembers.some((p) => p.name === applicant.name);
    if (alreadyPending) return true;

    club.pendingMembers.push({
      id: `pm_${Date.now()}`,
      name: applicant.name,
      phone: applicant.phone || '',
      requestedAt: '방금 전',
      message: applicant.message || '클럽 회원 가입을 신청합니다.',
    });

    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  },

  // 2. 가입 수락 (승인 -> 정회원으로 등록)
  approveMember(clubId: string, pendingId: string): boolean {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club || !club.pendingMembers) return false;

    const pending = club.pendingMembers.find((p) => p.id === pendingId);
    if (!pending) return false;

    // 대기열에서 제거
    club.pendingMembers = club.pendingMembers.filter((p) => p.id !== pendingId);

    // 정회원으로 등록
    club.members.push({
      id: `m_${Date.now()}`,
      name: pending.name,
      role: 'MEMBER',
      joinedAt: new Date().toISOString().slice(0, 10),
      phone: pending.phone,
    });
    club.memberCount = club.members.length;

    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  },

  // 3. 가입 거절
  rejectMember(clubId: string, pendingId: string): boolean {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club || !club.pendingMembers) return false;

    club.pendingMembers = club.pendingMembers.filter((p) => p.id !== pendingId);

    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  },

  // 4. 카카오톡 클럽 가입 초청장 문구 생성
  generateClubInviteText(club: ParkGolfClub): string {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/club?join=${club.id}`
        : `https://parkongolf.com/club?join=${club.id}`;

    return `[파크온 클럽 가입 초청장 ⛳]
"${club.name}"에서 ${club.managerName || '총무'}님이 귀하를 정회원으로 초대합니다!

📍 홈 구장: ${club.homeCourseName} (${club.region})
👥 회원 수: ${club.memberCount}명 활동 중
💬 클럽 소개: ${club.description}

👇 아래 링크를 터치하여 파크온에서 즉시 클럽에 입장하세요!
${shareUrl}`;
  },

  // 5. 초청장 링크를 통한 즉시 가입
  directJoinViaInvite(clubId: string, member: { name: string; phone?: string }): boolean {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club) return false;

    const alreadyMember = club.members.some((m) => m.name === member.name);
    if (!alreadyMember) {
      club.members.push({
        id: `m_${Date.now()}`,
        name: member.name,
        role: 'MEMBER',
        joinedAt: new Date().toISOString().slice(0, 10),
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
      return true;
    } catch {
      return false;
    }
  },

  joinClub(clubId: string, memberName: string, phone?: string): boolean {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (!club) return false;

    const alreadyMember = club.members.some((m) => m.name === memberName);
    if (!alreadyMember) {
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
      return true;
    } catch {
      return false;
    }
  },

  leaveClub(clubId: string, memberName: string): boolean {
    const list = this.getAllClubs();
    const club = list.find((c) => c.id === clubId);
    if (club) {
      club.members = club.members.filter((m) => m.name !== memberName);
      club.memberCount = Math.max(1, club.members.length);
    }

    let myClubs = this.getMyClubIds();
    myClubs = myClubs.filter((id) => id !== clubId);

    try {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(list));
      localStorage.setItem(STORAGE_KEYS.MY_CLUB_IDS, JSON.stringify(myClubs));
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
    targetCount: number;
    hostName: string;
    notes?: string;
  }): FlashGathering {
    const list = this.getAllFlashGatherings();
    const newId = `flash-${Date.now()}`;
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
      targetCount: data.targetCount || 4,
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
    try {
      localStorage.setItem(STORAGE_KEYS.FLASH_GATHERINGS, JSON.stringify(list));
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

    const alreadyWaiting = item.waitingList.find((p) => p.name.includes(participantName));
    if (alreadyWaiting) {
      return {
        success: true,
        isWaitlist: true,
        waitNumber: alreadyWaiting.waitNumber,
        message: `이미 대기 ${alreadyWaiting.waitNumber}번으로 접수되어 있습니다.`,
      };
    }

    // 정원 초과 시 -> 대기자 명단 자동 등록 (대기 번호 부여)
    if (item.currentParticipants.length >= item.targetCount) {
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

    // 정원 여유 있을 시 -> 정규 참가자 등록
    item.currentParticipants.push({
      id: `p_${Date.now()}`,
      name: participantName,
      joinedAt: new Date().toISOString(),
      phone,
    });

    if (item.currentParticipants.length >= item.targetCount) {
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

  // 카카오톡 번개 모집 초대장 문구 생성 (카톡 단체방 공유용)
  generateFlashKakaoShareText(flash: FlashGathering): string {
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/club?hub=FLASH&flashId=${flash.id}`
        : `https://parkongolf.com/club?hub=FLASH&flashId=${flash.id}`;

    const isMultiOpen = flash.targetCount >= 999;
    const remaining = isMultiOpen ? 0 : Math.max(0, flash.targetCount - flash.currentParticipants.length);
    const clubBadge = flash.clubName ? `[${flash.clubName}]` : `[파크온 번개]`;
    const capacityText = isMultiOpen
      ? `인원 수 제한 없음 (4인 이상 무제한)`
      : `총 ${flash.targetCount}명 중 ${remaining > 0 ? `${remaining}명 급구!` : '정원 마감'}`;

    return `${clubBadge} ⚡ 번개 라운드 긴급 모집!
"${flash.title}"

⛳ 장소: ${flash.courseName}
📅 일시: ${flash.playDate} ${flash.playTime}
👥 정원: ${capacityText}
👤 현재 참가: ${flash.currentParticipants.map((p) => p.name).join(', ')}
${flash.notes ? `💬 안내: "${flash.notes}"\n` : ''}
👇 아래 파크온 링크를 눌러 1초 만에 바로 조인하세요!
${shareUrl}`;
  },
};
