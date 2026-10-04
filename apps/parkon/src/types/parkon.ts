export type UserRole = 'SUPER_ADMIN' | 'COURSE_MANAGER' | 'COACH' | 'USER';

export interface HoleMetadata {
  hole: number;
  par: number;
  distanceMeter: number;
  localRule?: string;
  tip?: string;
  isVerified?: boolean; // 실측 검증 완료 여부 (false면 미확인 팻말)
  contributedBy?: string; // 최초 실측 입력자
}

export interface CourseContribution {
  author: string;
  date: string;
  action: string;
}

export interface Course {
  id: string;
  name: string;
  region: string;
  country?: 'KR' | 'JP'; // 'KR' = 한국, 'JP' = 일본
  nameJa?: string;       // 일본어 구장명 (파크골프장 제외한 간결명)
  nameKo?: string;       // 한국어 구장명 (파크골프장 제외한 간결명)
  regionJa?: string;     // 일본어 지역명
  regionKo?: string;     // 한국어 지역명
  totalCourses?: number; // e.g. 7코스
  totalHoles: number;    // e.g. 63홀
  holesMetadata: HoleMetadata[];
  isVerified: boolean;
  isSpecsVerified?: boolean; // 전체 코스 제원이 공식 협회/골퍼 실측 검증 완료되었는지 여부
  specContributorName?: string; // 최초 제원 기여자
  isLocked?: boolean;    // 공식 제원 확정 잠금 여부
  certNo?: string;       // 일본 NPGA 공인 코스 번호 (예: 公認第439号)
  mapCode?: string;      // 일본 내비게이션 맵코드 (예: 574 819 013*44)
  mapcode?: string;      // 일본 맵코드 별칭
  holes?: number;        // 홀 수 별칭
  dist?: number;         // 총 거리(m)
  rental?: string;       // 클럽/볼 대여 정보
  city?: string;         // 일본 시구정촌
  pref?: string;         // 일본 도도부현/진흥국
  description?: string;
  descriptionKo?: string;
  descriptionJa?: string;
  contributorName?: string;
  contributedAt?: string;
  courseMaster?: string; // 👑 구장 마스터
  imageUrl?: string;     // 구장 안내도 및 스코어카드 사진
  contributionHistory?: CourseContribution[]; // 명예의 전당 히스토리
  createdAt?: string;
  address?: string;
  addressKo?: string;
  addressJa?: string;
  phone?: string;
  fee?: string;
  feeKo?: string;
  feeJa?: string;
  openHours?: string;
  openHoursKo?: string;
  openHoursJa?: string;
  closedDay?: string;
  closedDayKo?: string;
  closedDayJa?: string;
  parking?: string;
  parkingKo?: string;
  parkingJa?: string;
  lat?: number;
  lng?: number;
}

export interface CourseSpecialReport {
  id: string;
  courseId: string;
  type: 'EVENT' | 'CONSTRUCTION' | 'CLOSURE' | 'WAITING' | 'OTHER';
  typeName: string;
  badgeColor: string;
  icon: string;
  title: string;
  memo?: string;
  reportedAt: number;
  reportedTimeStr: string;
  reporterName?: string;
}

export function formatCourseHolesText(course: { totalHoles: number; totalCourses?: number }): string {
  const coursesCount = course.totalCourses || Math.max(1, Math.round(course.totalHoles / 9));
  return `총 ${coursesCount}코스 ${course.totalHoles}홀`;
}

export interface HoleTip {
  id: string;
  courseId: string;
  holeIndex: number;
  tipText: string;
  warningText?: string;
  upvotes: number;
  authorName?: string;
}

export interface PlayerScore {
  hole: number;
  strokes: number;
  ob: number;
}

export interface RoundPlayer {
  id: string;
  name: string;
  isLeader?: boolean; // 조장 여부 (조장은 항상 1번에 배치)
  isSelf?: boolean;   // 본인 여부
  isGuest?: boolean;  // 게스트(비회원) 여부: 실시간 공유 전용, 본인 폰 기록 미반영
  isOut?: boolean;    // 사정상 중도 퇴장/기권 여부 (기존 홀 기록 보존, 이후 홀 제외)
  departedHole?: number; // 퇴장 시점 홀 번호
  isResting?: boolean; // ☕ 잠시 빠짐 (휴식 중) - 현재 홀 입력 비활성화
  restingHoles?: number[]; // 휴식한 홀 목록
  scores: Record<number, number>; // hole -> strokes
  obCount: Record<number, number>; // hole -> ob count
  totalStrokes: number;
  totalParDiff: number;
}

export interface RoundSession {
  id: string;
  courseId: string;
  courseName: string;
  startedAt: string;
  completedAt?: string;
  updatedAt?: string;
  currentHole: number;
  totalHoles: number;
  selectedCourseLetters?: string[]; // e.g. ['B', 'D']
  selectedHoleNumbers?: number[];   // e.g. [10, 11, 12, ... 18, 28, 29, ... 36]
  confirmedHoles?: number[];        // list of hole numbers confirmed by user (via 확인 or 다음 홀)
  players: RoundPlayer[];
  status: 'IN_PROGRESS' | 'COMPLETED';
  isOfficial?: boolean; // true = 공식 전적/평균타수 반영, false = 연습/테스트 라운드(미반영)
  isVirtual?: boolean;  // true = 가상 라운딩 (체험/연습 모드, 시간 무제한, 종료 시 기록 제로 미보존)
  isUnlimitedRound?: boolean; // 무제한 자유 라운드 여부 (기본 true)
  targetHolesCount?: number;  // 목표 홀 수 (예: 18홀)
  countingMode?: 'ZERO_BASE' | 'PAR_BASE'; // 0베이스 vs Par기준
  isRefereeMode?: boolean;    // 공식 시합용 홀 전담 심판 모드
  refereeHole?: number;       // 심판 배정 홀
  matchType?: 'CLUB_MATCH' | 'TOURNAMENT' | 'CASUAL'; // 클럽전 | 정규대회 | 개인친선
  clubRoomId?: string;
  clubGroupNumber?: number;
  photos?: string[]; // 현장 인증샷 및 워터마크 포토카드 목록
  durationMinutes?: number; // 총 소요 시간 (분 단위)
  holeTimestamps?: Record<number, string>; // 홀별 완료 시각 타임스탬프
  isFieldVerified?: boolean; // 🏅 실제 필드 정규 완주 검증 여부 (정상 소요시간 & 홀 진행 검증)
  holeStep?: 'TEE_SHOT' | 'SCORING'; // 1단계 코스안내 전광판 vs 2단계 4인 스코어보드
  roomId?: string; // 실시간 룸 동기화 ID
  customHolesMetadata?: HoleMetadata[]; // 🏌️ 실시간 팀 공유 현장 실측 제원 (Par, 거리m 등)
  courseCompletedModal?: CourseCompletionModalInfo | null; // 🎉 9홀 코스 완주 시 다음 코스 이동/종료 선택 모달
}

export interface CourseCompletionModalInfo {
  isOpen: boolean;
  completedCourseLetter: string;
  completedRoundNumber: number;
  completedHolesCount: number;
  nextRecommendedLetter: string;
}

export interface CourseSkillRankItem {
  rank: number;
  rankLabel: string;
  name: string;
  clubName: string;
  score: number;
  grade: string;
  date: string;
  matchType: '클럽전' | '정규대회' | '개인친선';
  isMe?: boolean;
  isOutRank?: boolean; // 비공식 친선일 때 '등외 점수'
}

export interface CourseActivityRankItem {
  rank: number;
  name: string;
  clubName?: string;
  rounds: number;
  tier: string;
  isMe?: boolean;
}

export type GrassCondition = 'GOOD' | 'NORMAL' | 'BAD';

export type RollSpeed = 'VERY_FAST' | 'FAST' | 'NORMAL' | 'SLOW' | 'VERY_SLOW';
export type MoistureLevel = 'VERY_DRY' | 'DRY' | 'NORMAL' | 'WET' | 'VERY_WET';
export type GrassLength = 'VERY_SHORT' | 'SHORT' | 'MEDIUM' | 'LONG' | 'VERY_LONG';

export interface ConditionVoteLog {
  id: string;
  timestamp: number;
  timeStr: string;
  category: 'speed' | 'moisture' | 'length';
  value: string;
}

export interface CourseConditionState {
  courseId: string;
  condition: GrassCondition;
  votes: {
    good: number;
    normal: number;
    bad: number;
  };
  // 실전 3대 잔디 지표
  speed: RollSpeed;
  moisture: MoistureLevel;
  length: GrassLength;
  speedVotes: {
    very_fast: number;
    fast: number;
    normal: number;
    slow: number;
    very_slow: number;
  };
  moistureVotes: {
    very_dry: number;
    dry: number;
    normal: number;
    wet: number;
    very_wet: number;
  };
  lengthVotes: {
    very_short: number;
    short: number;
    medium: number;
    long: number;
    very_long: number;
  };
  myVotes?: {
    speed?: RollSpeed;
    moisture?: MoistureLevel;
    length?: GrassLength;
  };
  lastUpdated: string;
  lastUpdatedTime?: string;
  recentLogs?: ConditionVoteLog[];
}

export interface DisputeRule {
  id: string;
  category?: 'ob' | 'hazard' | 'facility' | 'swing' | 'general';
  title: string;
  situation: string;
  verdict: string;
  penalty: string;
  procedure: string;
  tags: string[];
  officialArticle?: string;
  officialRuleText?: string;
}

export interface LessonPrescription {
  condition: (player: RoundPlayer, totalPar: number) => boolean;
  title: string;
  prescription: string;
  drill: string;
}

export interface RoomPlayer {
  id: string;
  name: string;
  isLeader: boolean;
}

export interface ParkOnRoom {
  roomId: string;
  leaderName: string;
  courseId: string;
  courseName: string;
  courseLetter: string;
  startHoleIndex: number;
  playerCount: number;
  players: RoomPlayer[];
  status: 'WAITING' | 'STARTED' | 'COMPLETED';
  roundId?: string;
  roundSession?: any;
  updatedAt: number;
}
