export interface TournamentNotice {
  id: string;
  country?: 'KR' | 'JP';
  title: string;
  titleKo?: string;
  titleJa?: string;
  host: string;
  hostKo?: string;
  hostJa?: string;
  region: string;
  regionKo?: string;
  regionJa?: string;
  courseName: string;
  courseNameKo?: string;
  courseNameJa?: string;
  courseId?: string;
  status: 'RECRUITING' | 'UPCOMING' | 'CLOSED';
  periodStr: string;
  periodStrKo?: string;
  periodStrJa?: string;
  eventDateStr: string;
  eventDateStrKo?: string;
  eventDateStrJa?: string;
  entryFee: string;
  entryFeeKo?: string;
  entryFeeJa?: string;
  targetCount: string;
  targetCountKo?: string;
  targetCountJa?: string;
  qualification: string;
  qualificationKo?: string;
  qualificationJa?: string;
  linkUrl: string;
  directNoticeUrl?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  isAiCurated: boolean;
  createdAt: string;
  lat?: number;
  lng?: number;
}

export interface ParkGolfNewsItem {
  id: string;
  country?: 'KR' | 'JP';
  title: string;
  titleKo?: string;
  titleJa?: string;
  summary: string;
  summaryKo?: string;
  summaryJa?: string;
  source: string;
  sourceKo?: string;
  sourceJa?: string;
  region: string;
  regionKo?: string;
  regionJa?: string;
  category: 'MAJOR' | 'LOCAL' | 'USER_REPORT';
  dateStr: string;
  dateStrKo?: string;
  dateStrJa?: string;
  linkUrl?: string;
  authorName?: string;
  viewCount: number;
  likeCount: number;
  lat?: number;
  lng?: number;
}

export interface UserVoiceItem {
  id: string;
  authorName: string;
  category: 'BUG' | 'FEATURE' | 'COURSE_INFO' | 'GENERAL';
  title: string;
  content: string;
  status: 'RECEIVED' | 'IN_REVIEW' | 'RESOLVED';
  officialReply?: string;
  likeCount: number;
  createdAt: string;
  likedByMe?: boolean;
}

export interface FreeBoardPost {
  id: string;
  authorName: string;
  region?: string;
  content: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  likedByMe?: boolean;
}
