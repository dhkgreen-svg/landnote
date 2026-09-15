export interface TournamentNotice {
  id: string;
  title: string;
  host: string;
  region: string;
  courseName: string;
  courseId?: string;
  status: 'RECRUITING' | 'UPCOMING' | 'CLOSED';
  periodStr: string;
  eventDateStr: string;
  entryFee: string;
  targetCount: string;
  qualification: string;
  linkUrl: string;
  isAiCurated: boolean;
  createdAt: string;
  lat?: number;
  lng?: number;
}

export interface ParkGolfNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  region: string;
  category: 'MAJOR' | 'LOCAL' | 'USER_REPORT';
  dateStr: string;
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
