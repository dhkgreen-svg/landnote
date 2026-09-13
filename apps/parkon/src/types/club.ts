export interface ClubPlayer {
  id: string;
  name: string;
  isLeader: boolean;
  scores: Record<number, number>; // holeNum -> stroke
  totalStrokes: number;
  parDiff: number;
  holesCompleted: number;
  gender?: 'M' | 'F'; // 남/여
  handicapTier?: 'ADVANCED' | 'INTERMEDIATE' | 'BEGINNER'; // 상급/중급/초급
  paymentStatus?: 'PAID' | 'UNPAID'; // [NEW] 참가비 입금 상태 ('PAID' | 'UNPAID')
  paidAt?: string; // [NEW] 입금 확인 일시 (예: '9/12 14:30')
  handicap?: number; // [NEW] 신페리오 등 산출 핸디캡 (예: 7.2)
  netScore?: number; // [NEW] 핸디캡 적용 네트 스코어 (totalStrokes - handicap)
  waitNumber?: number; // [NEW] 정원 초과 시 대기 번호 (예: 1, 2)
}

export interface ClubGroup {
  groupNumber: number; // 1, 2, 3, 4, 5...
  name: string;        // '1조', '2조'
  startCourseLetter: string; // 'A', 'B' (샷건 동시 티샷 지원)
  leaderName: string;
  players: ClubPlayer[]; // 3~4인 (상황에 따라 2~5인 가능)
  sessionId?: string;    // linked RoundSession id
  totalScore?: number;
  avgScore?: number;
  status: 'WAITING' | 'PLAYING' | 'FINISHED' | 'RECRUITING';
}

export interface ClubEventRoom {
  id: string;          // e.g. 'dongrak-monthly-9'
  clubId?: string;     // linked club id (e.g. 'club-gumi-dongrak')
  clubName?: string;   // e.g. '구미 동락 에이스 파크골프 클럽'
  title: string;       // e.g. '구미 동락클럽 9월 정기 월례회'
  courseId: string;
  courseName: string;
  hostName: string;    // 총무/개설자 (e.g. '김총무')
  selectedCourseLetters: string[]; // ['A', 'B']
  totalHoles: number;  // 18
  targetTotalPlayers?: number; // 예상 정원 (자유 인원 시 선택 사항)
  entryFee?: number;   // [NEW] 1인 참가비 (예: 10000원, 0이면 무료)
  bankAccount?: string; // [NEW] 총무 입금 계좌 안내 (예: '농협 352-1234-5678-93 홍길동')
  gameMode?: 'STROKE' | 'NEW_PERIO' | 'SCRAMBLE' | 'STABLEFORD' | 'CASUAL'; // [NEW] 경기 방식
  gameModeTitle?: string; // [NEW] 경기 방식 표기명 (예: '신페리오 방식 (핸디캡 적용)')
  gameRuleNotes?: string; // [NEW] 대회 요강 및 로컬 룰 공시 (예: 'OB 시 2벌타 특설티, 컨시드 1클럽 샤프트')
  nearPinHole?: number; // [NEW] 니어핀 지정 홀 번호 (선택)
  longestHole?: number; // [NEW] 롱기스트 지정 홀 번호 (선택)
  awardConfig?: AwardRuleConfig; // [NEW] 시상 룰 및 행운상 추첨 커스텀 설정
  groups: ClubGroup[];
  waitingPool?: ClubPlayer[]; // 참가 신청 대기 명단 (조 편성 전)
  groupingMethod?: 'RANDOM' | 'BALANCED_GENDER' | 'BALANCED_TIER' | 'KEEP_LEADERS' | 'MANUAL';
  status: 'RECRUITING' | 'PLAYING' | 'FINISHED';
  createdAt: string;
}

// 🎁 시상 룰 & 행운상 추첨 인터페이스
export interface LuckyDrawWinner {
  id: string;
  name: string;
  groupNumber?: number;
  prizeName: string;
  drawnAt: string;
}

export type SpecialAwardType = 'PAR_MASTER' | 'DUCK_22' | 'LUCKY_7' | 'LAST_PLACE' | 'NEAR_MISS';

export interface AwardRuleConfig {
  winnerGraceMonths?: number; // 0 = 미적용, 1 = 직전 1회 우승자 제외, 2 = 최근 2회, 3 = 최근 3개월
  lastWinnerNames?: string[]; // 직전 우승자 명단 (예: ['박찬호'])
  enableLuckyDraw?: boolean;  // 행운상 추첨기 활성화 여부
  luckyDrawWinners?: LuckyDrawWinner[]; // 현장 추첨 당첨자 명단
  enableSpecialAwards?: boolean; // 이색 특별상 활성화 여부
  specialAwardsSelected?: SpecialAwardType[]; // 선택된 특별상 목록
}

export interface SpecialAwardWinner {
  type: SpecialAwardType;
  title: string;
  badge: string;
  winnerName: string;
  groupNumber?: number;
  description: string;
  valueInfo?: string; // e.g. "파(Par) 14개 달성", "22위 (72타)"
}

// 1. 클럽 커뮤니티 정보
export interface ClubMember {
  id: string;
  name: string;
  role: 'PRESIDENT' | 'MANAGER' | 'MEMBER'; // 회장 / 총무 / 회원
  joinedAt: string;
  phone?: string;
}

export interface ParkGolfClub {
  id: string;
  name: string;              // 예: 동락 에이스 클럽
  region: string;            // 예: 경북 구미
  homeCourseId: string;      // 구미 동락 파크골프장
  homeCourseName: string;
  description: string;       // 소개글
  presidentName: string;     // 회장
  managerName: string;       // 총무
  contactPhone?: string;     // 문의 연락처
  memberCount: number;       // 회원 수
  members: ClubMember[];     // 소속 회원 명부
  pendingMembers?: { id: string; name: string; phone?: string; requestedAt: string; message?: string }[]; // 가입 승인 대기 명단
  isPublic: boolean;         // 공개 여부
  badgeColor?: string;       // 뱃지 테마 색상
  createdAt: string;
}

// 2. 번개 모임 (실시간 라운드 조인)
export interface FlashGathering {
  id: string;
  title: string;             // 예: 오늘 14:00 삼락 2명 급구!
  type: 'OPEN' | 'CLUB_ONLY';// 오픈 개인 번개 vs 클럽 전용 번개
  clubId?: string;           // 클럽 번개인 경우 클럽 ID
  clubName?: string;
  courseId: string;
  courseName: string;
  playDate: string;          // 2026-09-12
  playTime: string;          // 14:00
  targetCount: number;       // 총 정원 (보통 4명)
  currentParticipants: { id: string; name: string; joinedAt: string; phone?: string }[];
  waitingList?: { id: string; name: string; joinedAt: string; phone?: string; waitNumber: number }[]; // 정원 초과 시 대기 번호 명단
  hostName: string;          // 개설자
  notes?: string;
  status: 'RECRUITING' | 'FULL' | 'CLOSED';
  createdAt: string;
}

export interface ClubLeaderboardTeam {
  rank: number;
  groupNumber: number;
  groupName: string;
  leaderName: string;
  playersCount: number;
  totalStrokes: number;
  avgStrokes: number;
  parDiff: number;
  holesCompleted: number;
}

export interface ClubLeaderboardIndividual {
  rank: number;
  playerId: string;
  playerName: string;
  groupNumber: number;
  totalStrokes: number;
  parDiff: number;
  holesCompleted: number;
  isLeader: boolean;
  handicap?: number; // [NEW] 신페리오 핸디캡
  netScore?: number; // [NEW] 핸디캡 적용 네트 스코어
}
