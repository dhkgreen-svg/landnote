export type UserRole = 'SUPER_ADMIN' | 'COURSE_MANAGER' | 'COACH' | 'USER';

export interface HoleMetadata {
  hole: number;
  par: number;
  distanceMeter: number;
  localRule?: string;
  tip?: string;
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
  totalCourses?: number; // e.g. 7코스
  totalHoles: number;    // e.g. 63홀
  holesMetadata: HoleMetadata[];
  isVerified: boolean;
  isLocked?: boolean;    // 공식 제원 확정 잠금 여부
  description?: string;
  contributorName?: string;
  contributedAt?: string;
  courseMaster?: string; // 👑 구장 마스터
  imageUrl?: string;     // 구장 안내도 및 스코어카드 사진
  contributionHistory?: CourseContribution[]; // 명예의 전당 히스토리
  createdAt?: string;
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
  clubRoomId?: string;
  clubGroupNumber?: number;
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
