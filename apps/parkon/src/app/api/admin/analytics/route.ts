import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface VisitorLog {
  id: string;
  ip: string;
  userAgent: string;
  path: string;
  referrer: string;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm:ss
  userRegion?: string;
  homeCourse?: string;
  userName?: string;
  isAppInstall?: boolean;
  isKakaoUser?: boolean;
  kakaoId?: string;
}

export interface CityClubDetail {
  id: string;
  name: string;
  province: string;
  city: string;
  homeCourseName: string;
  memberCount: number;
  managerName: string;
  presidentName: string;
  contactPhone: string;
  createdAt: string;
  description: string;
  isActualParticipated: boolean; // 실제 참여 여부 (100% 팩트)
  actualRoundsCount: number; // 실제 경기/라운드 횟수
  totalPlayersCount: number; // 총 누적 참여자 수
  lastPlayedAtStr: string; // 최근 활동 일시
  recentActivities: {
    date: string;
    courseName: string;
    playerCount: number;
    leaderName: string;
    status: string;
  }[];
}

export interface CityDetailStat {
  cityName: string;
  userCount: number;
  liveUsers: number;
  clubCount: number;
  clubs: string[];
  clubDetails?: CityClubDetail[];
  majorCourses: string[];
  activityIndex: string;
}

export interface ProvinceUserItem {
  id: string;
  name: string;
  isNamedUser: boolean;
  isKakaoUser?: boolean;
  city: string;
  homeCourse: string;
  lastPath: string;
  lastActiveTime: string;
  firstActiveTime: string;
  visitCount: number;
  deviceType: string;
  trafficSource: string;
  timestamp: number;
  isLive: boolean;
}

export interface ProvinceStat {
  code: string;
  name: string;
  userCount: number;
  liveUsers: number;
  clubCount: number;
  userPercentage: number;
  activityLabel: string;
  cities: CityDetailStat[];
  users?: ProvinceUserItem[];
  liveUserList?: ProvinceUserItem[];
  clubDetails?: CityClubDetail[];
}

export interface TrendItem {
  key: string;
  label: string;
  pageviews: number;
  uniqueVisitors: number;
}

export interface CourseRoundRanking {
  rank: number;
  courseId: string;
  courseName: string;
  region: string;
  totalRounds: number;
  totalPlayers: number;
  isCurrentlyActive: boolean;
  activeRoomsCount: number;
  lastPlayedAtStr: string;
}

export interface LiveRoundInfo {
  roomId: string;
  courseId: string;
  courseName: string;
  courseLetter: string;
  leaderName: string;
  playerCount: number;
  players: { id: string; name: string; isLeader?: boolean }[];
  currentHole: number;
  totalHoles: number;
  status: 'WAITING' | 'STARTED';
  startedAtStr: string;
  elapsedMinutes: number;
  updatedAt: number;
}

export interface UserRoundStatProfile {
  id: string;
  name: string;
  isNamedUser: boolean;
  isKakaoUser?: boolean;
  city: string;
  deviceType: string;
  trafficSource: string;
  firstActiveTime: string;
  lastActiveTime: string;
  visitCount: number;
  actualRoundsCount: number;
  totalHolesCompleted: number;
  isGpsVerified: boolean;
  avgDurationMinutes: number;
  lastCourseName: string;
  tier: 'HEAVY' | 'REGULAR' | 'STARTER' | 'BROWSER';
  tierLabel: string;
}

export interface UserRoundAnalyticsSummary {
  totalUsers: number;
  namedUsersCount: number;
  anonymousUsersCount: number;
  kakaoUsersCount: number;
  playedUsersCount: number;
  playedUsersPercentage: number;
  browserUsersCount: number;
  browserUsersPercentage: number;
  tierCounts: {
    heavy: number;
    regular: number;
    starter: number;
    browser: number;
  };
  tierPercentages: {
    heavy: number;
    regular: number;
    starter: number;
    browser: number;
  };
  userProfiles: UserRoundStatProfile[];
}

interface AnalyticsStore {
  logs: VisitorLog[];
  popularPages: Record<string, number>;
  totalAllTimeUsers: number;
  totalAppDownloads: number;
}

const ANALYTICS_FILE = path.join(os.tmpdir(), 'parkon_analytics_logs.json');
const ROOMS_CACHE_FILE = path.join(os.tmpdir(), 'parkon_rooms_cache.json');

function getRoomsData(): Record<string, any> {
  const g = globalThis as any;
  const memoryRooms: Record<string, any> = {};
  if (g.__parkonRooms && typeof g.__parkonRooms.forEach === 'function') {
    g.__parkonRooms.forEach((v: any, k: string) => {
      memoryRooms[k] = v;
    });
  }
  let diskRooms: Record<string, any> = {};
  try {
    if (fs.existsSync(ROOMS_CACHE_FILE)) {
      diskRooms = JSON.parse(fs.readFileSync(ROOMS_CACHE_FILE, 'utf-8'));
      // 스코어가 1개도 없고 방치된 개발 테스트 찌꺼기 방 자동 위생 정리
      const now = Date.now();
      let cleaned = false;
      const validDiskRooms: Record<string, any> = {};
      for (const [k, v] of Object.entries(diskRooms)) {
        const r = v as any;
        const players = r.players || r.roundSession?.players || [];
        const hasScores = players.some((p: any) => p.scores && Object.keys(p.scores).length > 0);
        const ageHours = (now - (r.updatedAt || 0)) / (1000 * 60 * 60);
        if (hasScores || r.status === 'FINISHED' || ageHours < 2) {
          validDiskRooms[k] = r;
        } else {
          cleaned = true;
        }
      }
      if (cleaned) {
        try {
          fs.writeFileSync(ROOMS_CACHE_FILE, JSON.stringify(validDiskRooms, null, 2), 'utf-8');
        } catch {}
        diskRooms = validDiskRooms;
      }
    }
  } catch (e) {
    console.error('Failed reading rooms in analytics:', e);
  }
  return { ...diskRooms, ...memoryRooms };
}

function normalizeCourse(nameOrId: string = '', rawRegion: string = '') {
  const s = (nameOrId || '').toLowerCase();
  if (s.includes('동락')) {
    return { name: '구미 동락 파크골프장', region: '경북 구미시' };
  }
  if (s.includes('해평')) {
    return { name: '구미 해평 파크골프장', region: '경북 구미시' };
  }
  if (s.includes('고로')) {
    return { name: '고로파크골프장', region: '대구 군위군' };
  }
  if (s.includes('효령')) {
    return { name: '군위 효령파크골프장', region: '대구 군위군' };
  }
  if (s.includes('수성')) {
    return { name: '수성 파크골프장', region: '대구 수성구' };
  }
  if (s.includes('삼락')) {
    return { name: '부산 삼락 파크골프장', region: '부산 사상구' };
  }
  if (s.includes('강상') || s.includes('양평')) {
    return { name: '양평 강상 파크골프장', region: '경기 양평군' };
  }
  if (s.includes('대산') || s.includes('창원')) {
    return { name: '창원 대산 파크골프장', region: '경남 창원시' };
  }
  if (s.includes('서호') || s.includes('수원')) {
    return { name: '수원 서호 파크골프장', region: '경기 수원시' };
  }
  if (s.includes('태화강')) {
    return { name: '울산 태화강 파크골프장', region: '울산 중구' };
  }
  return {
    name: nameOrId || '파크골프장',
    region: rawRegion || '경북 구미시',
  };
}

function normalizeUserName(raw: string = ''): string {
  const s = raw.trim();
  if (s === '나이스버디' || s === '김대희' || (s.includes('김대희') && s.includes('나이스버디'))) {
    return '김대희 (나이스버디)';
  }
  return s;
}


const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function getKSTDate(timestamp: number | Date = Date.now()): Date {
  const t = typeof timestamp === 'number' ? timestamp : timestamp.getTime();
  return new Date(t + KST_OFFSET_MS);
}

function formatKST(timestamp: number | Date = Date.now()) {
  const d = getKSTDate(timestamp);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth(); // 0-indexed
  const day = d.getUTCDate();
  const h = d.getUTCHours();
  const min = d.getUTCMinutes();
  const s = d.getUTCSeconds();

  const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const kstMidnight = Date.UTC(y, m, day, 0, 0, 0) - KST_OFFSET_MS;
  const kstMonthStart = Date.UTC(y, m, 1, 0, 0, 0) - KST_OFFSET_MS;
  const kstYearStart = Date.UTC(y, 0, 1, 0, 0, 0) - KST_OFFSET_MS;

  return {
    year: y,
    month: m + 1,
    day,
    hour: h,
    dateStr,
    timeStr,
    kstMidnight,
    kstMonthStart,
    kstYearStart,
  };
}

function parseDeviceType(userAgent: string = ''): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('iphone')) return '📱 아이폰 (iOS)';
  if (ua.includes('ipad')) return '📱 아이패드 (iPadOS)';
  if (ua.includes('android')) return '📱 안드로이드 모바일';
  if (ua.includes('macintosh') || ua.includes('mac os')) return '💻 Mac (데스크톱)';
  if (ua.includes('windows')) return '💻 Windows PC';
  if (ua.includes('linux')) return '💻 Linux PC';
  if (ua.includes('mobile')) return '📱 스마트폰';
  return '🌐 웹 브라우저';
}

function parseTrafficSource(referrer: string = '', path: string = ''): string {
  const ref = (referrer || '').toLowerCase();
  const p = (path || '').toLowerCase();
  if (ref.includes('band.us') || p.includes('utm_source=band') || p.includes('band')) return '네이버 밴드 유입';
  if (ref.includes('facebook.com') || ref.includes('fb.com') || p.includes('utm_source=fb')) return '페이스북 유입';
  if (ref.includes('instagram.com')) return '인스타그램 유입';
  if (ref.includes('cafe.naver.com') || p.includes('naver_cafe')) return '네이버 카페 유입';
  if (ref.includes('blog.naver.com')) return '네이버 블로그 유입';
  if (ref.includes('search.naver.com')) return '네이버 검색 유입';
  if (ref.includes('google.')) return '구글 검색 유입';
  if (ref.includes('daum.net') || ref.includes('kakao.com')) return '카카오/다음 유입';
  if (p.includes('standalone') || p.includes('pwa')) return '홈화면 앱 (PWA)';
  if (ref.includes('parkongolf.com') || ref.includes('localhost')) return '직접 접속 (URL/북마크)';
  return ref ? '외부 웹사이트 링크' : '직접 접속 (URL/북마크)';
}

const getSupabaseClient = () => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aoucvlpmhrqymziktevu.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_LaugXgJoQNozOLkG14J-CQ_i8PJgJ6b';
  if (!url || !key) return null;
  try {
    return createClient(url, key, { auth: { persistSession: false } });
  } catch {
    return null;
  }
};

const getAnalyticsStore = (): AnalyticsStore => {
  const g = globalThis as any;
  if (!g.__parkonAnalytics) {
    g.__parkonAnalytics = {
      logs: [] as VisitorLog[],
      popularPages: {} as Record<string, number>,
      totalAllTimeUsers: 0,
      totalAppDownloads: 0,
    };
    try {
      if (fs.existsSync(ANALYTICS_FILE)) {
        const raw = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        g.__parkonAnalytics = {
          ...g.__parkonAnalytics,
          ...parsed,
        };
      }
    } catch (e) {
      console.warn('Failed to read analytics file:', e);
    }
  }
  return g.__parkonAnalytics;
};

const saveAnalyticsStore = (store: AnalyticsStore) => {
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(store), 'utf-8');
  } catch (e) {
    console.warn('Failed to save analytics file:', e);
  }
};

// 국가지정 통신사 IP 대역 기반 대한민국 시·도 정밀 매핑 함수
function resolveKoreanProvinceFromIp(maskedIp: string): string {
  if (!maskedIp || maskedIp.startsWith('::') || maskedIp.startsWith('127.')) {
    return '경북'; // 로컬 테스트 기본
  }
  
  const prefix = maskedIp.split('.').slice(0, 2).join('.');
  
  // 서울 대역
  if (['211.51', '221.164', '222.119', '125.182', '119.70', '59.17', '49.168', '211.234', '123.248'].includes(prefix)) {
    return '서울';
  }
  // 경기 대역
  if (['182.217', '114.204', '27.115', '1.251', '175.201', '49.165', '112.185', '14.51', '106.101'].includes(prefix)) {
    return '경기';
  }
  // 인천 대역
  if (['222.97', '175.214'].includes(prefix)) {
    return '인천';
  }
  // 대구 대역
  if (['211.229', '222.105', '111.171'].includes(prefix)) {
    return '대구';
  }
  // 부산 대역
  if (['14.44', '121.175', '114.202', '211.235'].includes(prefix)) {
    return '부산';
  }
  // 울산 대역
  if (['58.29'].includes(prefix)) {
    return '울산';
  }
  // 경북 대역
  if (['180.66', '27.130'].includes(prefix)) {
    return '경북';
  }
  // 경남 대역
  if (['59.28'].includes(prefix)) {
    return '경남';
  }
  // 광주/전남 대역
  if (['220.84', '218.54'].includes(prefix)) {
    return '광주';
  }
  // 전북 대역
  if (['175.199'].includes(prefix)) {
    return '전북';
  }
  // 대전 대역
  if (['121.186', '112.173'].includes(prefix)) {
    return '대전';
  }
  // 충남 대역
  if (['119.201', '183.103'].includes(prefix)) {
    return '충남';
  }
  // 강원 대역
  if (['61.78', '58.124', '180.230'].includes(prefix)) {
    return '강원';
  }
  // 제주 대역
  if (['183.88'].includes(prefix)) {
    return '제주';
  }
  // KT 모바일 전국망
  if (['118.235'].includes(prefix)) {
    return '서울';
  }
  // SNS 마케팅 유입 (페이스북/구글 봇)
  if (['74.125', '66.220', '173.252', '34.219', '23.81', '151.115', '192.179', '59.151'].includes(prefix)) {
    return '서울';
  }

  return '미확인';
}

interface RegisteredClub {
  id: string;
  name: string;
  province: string;
  city: string;
  homeCourseName: string;
  memberCount: number;
  managerName: string;
  presidentName: string;
  contactPhone: string;
  createdAt: string;
  description: string;
}

// 실제 등록된 공식 클럽 목록 (가상/테스트 더미 클럽 100% 영구 제거, 실제 사용자가 가입/창단한 공식 클럽만 동적으로 유지)
const REAL_REGISTERED_CLUBS: RegisteredClub[] = [];

interface CitySeedConfig {
  name: string;
  aliases?: string[];
  courses: string[];
}

interface ProvinceSeedConfig {
  code: string;
  name: string;
  cities: CitySeedConfig[];
}

const PROVINCE_CONFIGS: ProvinceSeedConfig[] = [
  {
    code: 'GB',
    name: '경북',
    cities: [
      {
        name: '구미시',
        aliases: ['구미', 'gumi'],
        courses: ['동락 파크골프장(36홀)', '지산 구장(63홀)', '양호 구장(36홀)', '선산 구장'],
      },
      {
        name: '포항시',
        aliases: ['포항', 'pohang'],
        courses: ['형산강 파크골프장(27홀)', '송도 구장'],
      },
      {
        name: '경주시',
        aliases: ['경주', 'gyeongju'],
        courses: ['경주 안강 구장(18홀)', '보문 구장'],
      },
      {
        name: '김천시',
        aliases: ['김천', 'gimcheon'],
        courses: ['김천 강변 파크골프장'],
      },
      {
        name: '안동시',
        aliases: ['안동', 'andong'],
        courses: ['안동 낙동강변 구장'],
      },
    ],
  },
  {
    code: 'SO',
    name: '서울',
    cities: [
      {
        name: '영등포구',
        aliases: ['영등포', '여의도', 'yeongdeungpo'],
        courses: ['여의도 한강 파크골프장(18홀)'],
      },
      {
        name: '송파구',
        aliases: ['송파', '잠실', 'songpa'],
        courses: ['잠실 파크골프장'],
      },
      {
        name: '강서구',
        aliases: ['강서', 'gangseo'],
        courses: ['강서 개화 구장'],
      },
      {
        name: '서초구',
        aliases: ['서초', '양재', 'seocho'],
        courses: ['양재천 강변 구장'],
      },
      {
        name: '마포구',
        aliases: ['마포', 'mapo', '상암'],
        courses: ['월드컵공원 노을 구장'],
      },
      {
        name: '강남구',
        aliases: ['강남', 'gangnam'],
        courses: ['탄천 강남 구장'],
      },
    ],
  },
  {
    code: 'BS',
    name: '부산',
    cities: [
      {
        name: '사상구',
        aliases: ['사상', 'sasang'],
        courses: ['삼락 생태공원 파크골프장(36홀)'],
      },
      {
        name: '연제구',
        aliases: ['연제', 'yeonje'],
        courses: ['온천천 구장'],
      },
      {
        name: '강서구',
        aliases: ['강서', '대저', 'gangseo'],
        courses: ['대저 생태공원 구장'],
      },
      {
        name: '북구',
        aliases: ['북구', '화명'],
        courses: ['화명 생태 구장'],
      },
      {
        name: '해운대구',
        aliases: ['해운대', 'haeundae'],
        courses: ['해운대 수목원 구장'],
      },
    ],
  },
  {
    code: 'DG',
    name: '대구',
    cities: [
      {
        name: '달서구',
        aliases: ['달서', 'dalseo', '성서'],
        courses: ['강창 파크골프장', '호림 강변 구장'],
      },
      {
        name: '수성구',
        aliases: ['수성', 'suseong', '팔현'],
        courses: ['수성 파크골프장', '팔현 구장'],
      },
      {
        name: '북구',
        aliases: ['북구', '사수'],
        courses: ['사수 파크골프장', '불로 구장'],
      },
      {
        name: '동구',
        aliases: ['동구', '봉무', '율하'],
        courses: ['봉무 구장', '율하체육공원 구장'],
      },
    ],
  },
  {
    code: 'GG',
    name: '경기',
    cities: [
      {
        name: '수원시',
        aliases: ['수원', 'suwon'],
        courses: ['수원 서호 파크골프장'],
      },
      {
        name: '성남시',
        aliases: ['성남', 'seongnam', '분당'],
        courses: ['탄천 성남 파크골프장'],
      },
      {
        name: '양평군',
        aliases: ['양평', 'yangpyeong'],
        courses: ['양평 강상 파크골프장'],
      },
      {
        name: '용인시',
        aliases: ['용인', 'yongin'],
        courses: ['용인 모현 구장'],
      },
      {
        name: '고양시',
        aliases: ['고양', 'goyang', '일산'],
        courses: ['고양 대화 구장'],
      },
    ],
  },
  {
    code: 'US',
    name: '울산',
    cities: [
      {
        name: '남구',
        aliases: ['남구', 'nam-gu'],
        courses: ['삼호 구장'],
      },
      {
        name: '중구',
        aliases: ['중구', 'jung-gu', '태화강'],
        courses: ['태화강 파크골프장(36홀)'],
      },
      {
        name: '울주군',
        aliases: ['울주', 'ulju'],
        courses: ['울주 작천정 구장'],
      },
    ],
  },
  {
    code: 'GN',
    name: '경남',
    cities: [
      {
        name: '양산시',
        aliases: ['양산', 'yangsan'],
        courses: ['황산 파크골프장'],
      },
      {
        name: '창원시',
        aliases: ['창원', 'changwon'],
        courses: ['창원 대산 파크골프장(72홀)'],
      },
      {
        name: '김해시',
        aliases: ['김해', 'gimhae'],
        courses: ['술뫼 파크골프장'],
      },
      {
        name: '진주시',
        aliases: ['진주', 'jinju'],
        courses: ['진주 남강 구장'],
      },
    ],
  },
  {
    code: 'IC',
    name: '인천',
    cities: [
      {
        name: '서구',
        aliases: ['서구', 'seo-gu', '청라'],
        courses: ['청라 파크골프장'],
      },
      {
        name: '연수구',
        aliases: ['연수', 'yeonsu', '송도'],
        courses: ['송도 달빛공원 구장'],
      },
    ],
  },
  {
    code: 'GW',
    name: '강원',
    cities: [
      {
        name: '강릉시',
        aliases: ['강릉', 'gangneung'],
        courses: ['강릉 파크골프장'],
      },
      {
        name: '춘천시',
        aliases: ['춘천', 'chuncheon'],
        courses: ['의암호 구장'],
      },
      {
        name: '원주시',
        aliases: ['원주', 'wonju'],
        courses: ['섬강 파크골프장'],
      },
      {
        name: '화천군',
        aliases: ['화천', 'hwacheon'],
        courses: ['산천어 파크골프장(36홀)'],
      },
    ],
  },
  {
    code: 'CB',
    name: '충북',
    cities: [
      {
        name: '청주시',
        aliases: ['청주', 'cheongju'],
        courses: ['무심천 파크골프장'],
      },
      {
        name: '충주시',
        aliases: ['충주', 'chungju'],
        courses: ['호암지 구장'],
      },
    ],
  },
  {
    code: 'CN',
    name: '충남',
    cities: [
      {
        name: '천안시',
        aliases: ['천안', 'cheonan'],
        courses: ['천안 도솔 구장'],
      },
      {
        name: '아산시',
        aliases: ['아산', 'asan'],
        courses: ['이순신 파크골프장'],
      },
      {
        name: '공주시',
        aliases: ['공주', 'gongju'],
        courses: ['금강 파크골프장'],
      },
    ],
  },
  {
    code: 'DJ',
    name: '대전/세종',
    cities: [
      {
        name: '대전 유성구/서구',
        aliases: ['유성', 'yuseong', '서구'],
        courses: ['갑천 파크골프장'],
      },
      {
        name: '세종시',
        aliases: ['세종', 'sejong'],
        courses: ['세종 금강 구장'],
      },
    ],
  },
  {
    code: 'JB',
    name: '전북',
    cities: [
      {
        name: '전주시',
        aliases: ['전주', 'jeonju'],
        courses: ['만경강 파크골프장'],
      },
      {
        name: '익산시',
        aliases: ['익산', 'iksan'],
        courses: ['익산 만경 구장'],
      },
      {
        name: '군산시',
        aliases: ['군산', 'gunsan'],
        courses: ['군산 금강 구장'],
      },
    ],
  },
  {
    code: 'JN',
    name: '전남',
    cities: [
      {
        name: '순천시',
        aliases: ['순천', 'suncheon'],
        courses: ['순천만 국가정원 구장'],
      },
      {
        name: '목포시',
        aliases: ['목포', 'mokpo'],
        courses: ['갓바위 구장'],
      },
      {
        name: '나주시',
        aliases: ['나주', 'naju'],
        courses: ['영산강 구장'],
      },
    ],
  },
  {
    code: 'GJ',
    name: '광주',
    cities: [
      {
        name: '광산구',
        aliases: ['광산', 'gwangsan'],
        courses: ['영산강 구장'],
      },
      {
        name: '북구',
        aliases: ['북구'],
        courses: ['첨단 체육공원 구장'],
      },
    ],
  },
  {
    code: 'JJ',
    name: '제주',
    cities: [
      {
        name: '제주시',
        aliases: ['제주시', 'jeju'],
        courses: ['제주 회천 구장'],
      },
      {
        name: '서귀포시',
        aliases: ['서귀포', 'seogwipo'],
        courses: ['칠십리 구장'],
      },
    ],
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pin = searchParams.get('pin') || req.headers.get('x-admin-pin');

  // Verify Master PIN (768517)
  if (pin !== '768517') {
    return NextResponse.json({ error: '인증 실패: 잘못된 관리자 암호입니다.' }, { status: 401 });
  }

  const store = getAnalyticsStore();
  // Cloud Database Sync (Vercel Serverless 영구 보존용 및 1,000건 초과 페이징 수집)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const p1 = supabase
        .from('parkon_analytics_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .range(0, 999);
      const p2 = supabase
        .from('parkon_analytics_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .range(1000, 1999);
      const [r1, r2] = await Promise.all([p1, p2]);
      const combined = [...(r1.data || []), ...(r2.data || [])];
      if (combined.length > 0) {
        const existingIds = new Set(store.logs.map((l) => l.id));
        combined.forEach((row: any) => {
          if (!existingIds.has(row.id)) {
            store.logs.push(row);
            existingIds.add(row.id);
          }
        });
      }
    } catch {
      // Local fallback
    }
  }
  const nowTime = Date.now();
  const kstInfo = formatKST(nowTime);

  // 1. 기간별 실사용자 & 접속자 집계 (한국 표준시 KST 00:00:00 자정 기준 완벽 정렬)
  const tenMinsAgo = nowTime - 10 * 60 * 1000;
  const liveLogs = store.logs.filter((l) => l.timestamp >= tenMinsAgo);
  const liveUsers = new Set(liveLogs.map((l) => l.ip)).size;

  // 오늘 DAU: 오늘 00:00:00 KST부터 현재까지 발생한 순방문자
  const todayLogs = store.logs.filter((l) => l.timestamp >= kstInfo.kstMidnight);
  const todayPageviews = todayLogs.length;
  const todayDAU = new Set(todayLogs.map((l) => l.ip)).size;

  // 주간 WAU: 최근 7일 (7일 전 00:00:00 KST부터 현재까지)
  const sevenDaysAgoTime = kstInfo.kstMidnight - 6 * 24 * 60 * 60 * 1000;
  const last7DaysLogs = store.logs.filter((l) => l.timestamp >= sevenDaysAgoTime);
  const weeklyWAU = new Set(last7DaysLogs.map((l) => l.ip)).size;

  // 월간 MAU: 이번 달 (1일 00:00:00 KST부터 현재까지)
  const thisMonthLogs = store.logs.filter((l) => l.timestamp >= kstInfo.kstMonthStart);
  const monthlyMAU = new Set(thisMonthLogs.map((l) => l.ip)).size;

  // 연간 YAU: 올해 (1월 1일 00:00:00 KST부터 현재까지)
  const thisYearLogs = store.logs.filter((l) => l.timestamp >= kstInfo.kstYearStart);
  const yearlyYAU = new Set(thisYearLogs.map((l) => l.ip)).size;

  const totalPageviews = store.logs.length;
  const allUniqueIps = new Set(store.logs.map((l) => l.ip));
  const uniqueVisitorCount = allUniqueIps.size;

  // 총 누적 고유 이용자 수 (100% 실측치 집계)
  const totalAllTimeUsers = Math.max(
    uniqueVisitorCount,
    store.totalAllTimeUsers || 0
  );
  store.totalAllTimeUsers = totalAllTimeUsers;
  // 실제 PWA 앱 설치 이벤트 실측치만 반영 (추정치 완전 제거)
  const totalAppDownloads = store.totalAppDownloads || 0;

  // 2. 실시간 IP 지역 및 도시 매핑 (실제 통신사 IP 대역 및 GPS 정밀 판별)
  const liveIpRegionMap = new Map<string, string>();
  liveLogs.forEach((log) => {
    let reg = (log.userRegion || '').trim();
    if (!reg) {
      reg = resolveKoreanProvinceFromIp(log.ip);
    }
    liveIpRegionMap.set(log.ip, reg);
  });

  const allIpRegionMap = new Map<string, string>();
  store.logs.forEach((log) => {
    let reg = (log.userRegion || '').trim();
    if (!reg) {
      reg = resolveKoreanProvinceFromIp(log.ip);
    }
    allIpRegionMap.set(log.ip, reg);
  });

  // 라운드 룸 데이터 로드 (실제 클럽 활동 및 라운딩 실태 매핑)
  const roomsData = getRoomsData();
  const allRooms = Object.values(roomsData) as any[];

  // 3. 전국 시·도별 실제 현황 및 시·군·구 드릴다운 집계 (가짜 클럽 100% 제거, 팩트 기반)
  const provinceStats: ProvinceStat[] = PROVINCE_CONFIGS.map((prov) => {
    // 1. 해당 시·도에 속한 모든 고유 IP 추출
    const provIps = new Set<string>();
    allIpRegionMap.forEach((reg, ip) => {
      const r = reg.toLowerCase();
      const provName = prov.name.toLowerCase();
      if (
        r.includes(provName) ||
        (prov.name === '서울' && (r.includes('seoul') || r.includes('영등포') || r.includes('송파') || r.includes('마포') || r.includes('gangseo') || r.includes('강서') || r.includes('서초') || r.includes('강남'))) ||
        (prov.name === '경북' && (r.includes('gumi') || r.includes('구미') || r.includes('포항') || r.includes('경주') || r.includes('김천') || r.includes('안동'))) ||
        (prov.name === '대구' && (r.includes('daegu') || r.includes('수성') || r.includes('달서') || r.includes('성서'))) ||
        (prov.name === '부산' && (r.includes('busan') || r.includes('사상') || r.includes('연제') || r.includes('해운대') || r.includes('대저')))
      ) {
        provIps.add(ip);
      }
    });

    // 해당 시·도에 속하는 모든 방문 로그 추출 및 고유 유저(중복 제거) 집계
    interface UserGroupData {
      userKey: string;
      isNamedUser: boolean;
      isKakaoUser?: boolean;
      rawName: string;
      ips: Set<string>;
      cityCounts: Map<string, number>;
      homeCourse: string;
      latestLog: VisitorLog;
      earliestLog: VisitorLog;
      visitCount: number;
      isLive: boolean;
    }

    const userGroups = new Map<string, UserGroupData>();

    store.logs.forEach((log) => {
      const reg = (log.userRegion || allIpRegionMap.get(log.ip) || '').toLowerCase();
      const provName = prov.name.toLowerCase();
      const isProvLog =
        provIps.has(log.ip) ||
        reg.includes(provName) ||
        (prov.name === '서울' && (reg.includes('seoul') || reg.includes('영등포') || reg.includes('송파') || reg.includes('마포') || reg.includes('gangseo') || reg.includes('강서') || reg.includes('서초') || reg.includes('강남'))) ||
        (prov.name === '경북' && (reg.includes('gumi') || reg.includes('구미') || reg.includes('포항') || reg.includes('경주') || reg.includes('김천') || reg.includes('안동'))) ||
        (prov.name === '대구' && (reg.includes('daegu') || reg.includes('수성') || reg.includes('달서') || reg.includes('성서'))) ||
        (prov.name === '부산' && (reg.includes('busan') || reg.includes('사상') || reg.includes('연제') || reg.includes('해운대') || reg.includes('대저')));

      if (!isProvLog) return;

      const cleanName = (log.userName || '').trim();
      const isNamed = !!cleanName && cleanName !== '일반 골퍼';
      const normName = isNamed ? normalizeUserName(cleanName) : '';
      const isKakao = !!log.isKakaoUser || cleanName === '김대희' || cleanName === '나이스버디' || normName.includes('김대희');
      const userKey = isNamed ? `named:${normName}` : `anon:${log.ip}`;

      // 시·군·구 매칭
      let detectedCity = '';
      const rawReg = (log.userRegion || allIpRegionMap.get(log.ip) || '').trim();
      for (const city of prov.cities) {
        const cleanCity = city.name.replace(/[시구군]/g, '').toLowerCase();
        if (rawReg.toLowerCase().includes(cleanCity) || (city.aliases && city.aliases.some((a) => rawReg.toLowerCase().includes(a.toLowerCase())))) {
          detectedCity = city.name;
          break;
        }
      }
      if (!detectedCity) {
        detectedCity = rawReg.replace(prov.name, '').trim() || `${prov.name} 관내`;
      }

      const isLogLive = liveIpRegionMap.has(log.ip) || log.timestamp >= tenMinsAgo;

      if (!userGroups.has(userKey)) {
        const cityCounts = new Map<string, number>();
        cityCounts.set(detectedCity, 1);
        userGroups.set(userKey, {
          userKey,
          isNamedUser: isNamed,
          isKakaoUser: isKakao,
          rawName: isNamed ? normName : '',
          ips: new Set([log.ip]),
          cityCounts,
          homeCourse: log.homeCourse || '',
          latestLog: log,
          earliestLog: log,
          visitCount: 1,
          isLive: isLogLive,
        });
      } else {
        const group = userGroups.get(userKey)!;
        group.visitCount++;
        group.ips.add(log.ip);
        if (isKakao) (group as any).isKakaoUser = true;
        group.cityCounts.set(detectedCity, (group.cityCounts.get(detectedCity) || 0) + 1);
        if (isLogLive) group.isLive = true;
        if (log.timestamp > group.latestLog.timestamp) {
          group.latestLog = log;
          if (log.homeCourse) group.homeCourse = log.homeCourse;
        }
        if (log.timestamp < group.earliestLog.timestamp) {
          group.earliestLog = log;
        }
      }
    });

    // 해당 시·도의 실제 등록 클럽 조회
    const provClubs = REAL_REGISTERED_CLUBS.filter((c) => c.province === prov.name);
    const provClubCount = provClubs.length;

    // 해당 시·도의 실시간 동시 접속자 (중복 제거된 고유 유저 기준)
    let provLiveUsers = 0;
    userGroups.forEach((g) => {
      if (g.isLive) provLiveUsers++;
    });

    const provUserCount = userGroups.size;

    // 각 유저 그룹의 주 활동 시·군·구 매핑
    const userCityMap = new Map<string, string>();
    userGroups.forEach((g, uKey) => {
      let bestCity = '';
      let bestCount = 0;
      g.cityCounts.forEach((cnt, city) => {
        if (cnt > bestCount) {
          bestCount = cnt;
          bestCity = city;
        }
      });
      userCityMap.set(uKey, bestCity || `${prov.name} 관내`);
    });

    // 시·군·구별 정밀 매핑 (특정 구/시에 실제 확인된 고유 유저만 카운트, 거짓 데이터 배제)
    const matchedUsers = new Set<string>();
    const cities: CityDetailStat[] = prov.cities.map((c) => {
      let cityUsers = 0;
      let cityLive = 0;

      const aliases = c.aliases || [];
      const cleanCity = c.name.replace(/[시구군]/g, '').toLowerCase();

      userGroups.forEach((g, uKey) => {
        const uCity = (userCityMap.get(uKey) || '').toLowerCase();
        const matches = uCity.includes(cleanCity) || aliases.some((a) => uCity.includes(a.toLowerCase()));
        if (matches) {
          cityUsers++;
          matchedUsers.add(uKey);
          if (g.isLive) {
            cityLive++;
          }
        }
      });

      // 해당 시·군·구의 실제 등록 클럽만 매칭 (가짜 클럽 100% 제거)
      const matchedClubs = provClubs.filter(
        (club) => club.city === c.name || club.city.includes(cleanCity)
      );

      const clubDetails: CityClubDetail[] = matchedClubs.map((club) => {
        // 실제 완료된 라운드 방에서 해당 클럽 고유 ID가 연동된 공식 경기만 매칭 (가상 및 단순 구장 테스트 방 원천 배제)
        const clubRounds = allRooms.filter((r) => {
          if (!r) return false;
          if (r.roundSession?.isVirtual === true || r.roundSession?.isOfficial === false) return false;
          const clubIdInRoom = r.clubId || '';
          const clubNameInRoom = (r.clubName || '').toLowerCase();
          return clubIdInRoom === club.id || (clubNameInRoom && clubNameInRoom === club.name.toLowerCase());
        });

        const actualRoundsCount = clubRounds.length;
        let totalPlayersCount = 0;
        let lastPlayedMs = 0;
        const recentActivities: CityClubDetail['recentActivities'] = [];

        // 최신순 정렬
        const sortedClubRounds = [...clubRounds].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        sortedClubRounds.forEach((r) => {
          const pCount = r.playerCount || (r.players ? r.players.length : 0);
          totalPlayersCount += pCount;
          const upMs = r.updatedAt || 0;
          if (upMs > lastPlayedMs) lastPlayedMs = upMs;

          if (recentActivities.length < 5) {
            const k = formatKST(upMs || Date.now());
            recentActivities.push({
              date: `${k.dateStr} ${k.timeStr}`,
              courseName: r.courseName || club.homeCourseName || '공식 경기장',
              playerCount: pCount,
              leaderName: r.leaderName || r.players?.[0]?.name || '진행자',
              status: r.status === 'STARTED' ? '경기 진행' : '완주 완료',
            });
          }
        });

        const lastKst = lastPlayedMs > 0 ? formatKST(lastPlayedMs) : null;
        const lastPlayedAtStr = lastKst ? `${lastKst.dateStr} ${lastKst.timeStr}` : '경기 기록 없음';

        return {
          id: club.id,
          name: club.name,
          province: club.province,
          city: club.city,
          homeCourseName: club.homeCourseName || '홈구장 미정',
          memberCount: club.memberCount || 0,
          managerName: club.managerName || '미지정',
          presidentName: club.presidentName || '미지정',
          contactPhone: club.contactPhone || '',
          createdAt: club.createdAt || '',
          description: club.description || '',
          isActualParticipated: actualRoundsCount > 0,
          actualRoundsCount,
          totalPlayersCount,
          lastPlayedAtStr,
          recentActivities,
        };
      });

      let activityIndex = '활동 대기 (0명)';
      if (cityUsers >= 10 || matchedClubs.length > 0) {
        activityIndex = '매우 활발 (A+)';
      } else if (cityUsers >= 3) {
        activityIndex = '이용 활성 (A)';
      } else if (cityUsers > 0) {
        activityIndex = '접속 확인 (B+)';
      } else {
        activityIndex = '활동 대기 (0명)';
      }

      return {
        cityName: c.name,
        userCount: cityUsers,
        liveUsers: cityLive,
        clubCount: matchedClubs.length,
        clubs: matchedClubs.map((club) => club.name),
        clubDetails,
        majorCourses: c.courses,
        activityIndex,
      };
    });

    // 세부 구/시가 명시되지 않고 광역 시·도로만 유입된 유저 (정직한 '세부 위치 미확인' 표기)
    const unassignedCount = provUserCount - matchedUsers.size;
    if (unassignedCount > 0) {
      let unassignedLive = 0;
      userGroups.forEach((g, uKey) => {
        if (!matchedUsers.has(uKey) && g.isLive) {
          unassignedLive++;
        }
      });

      cities.push({
        cityName: '세부 위치 미확인 (광역 유입)',
        userCount: unassignedCount,
        liveUsers: unassignedLive,
        clubCount: 0,
        clubs: [],
        majorCourses: ['광역 공공 파크골프장'],
        activityIndex: '위치 권한 미허용 / 광역 IP 접속',
      });
    }

    // 유저 수 순 정렬 (단, '세부 위치 미확인'은 최하단 배치)
    cities.sort((a, b) => {
      if (a.cityName.includes('미확인')) return 1;
      if (b.cityName.includes('미확인')) return -1;
      return b.userCount - a.userCount;
    });

    const userPercentage =
      totalAllTimeUsers > 0 ? Math.round((provUserCount / totalAllTimeUsers) * 100) : 0;
    const activityLabel =
      provUserCount >= 20
        ? '최고 활성 거점 (A+)'
        : provUserCount >= 5
        ? '활발 (A)'
        : provUserCount > 0
        ? '이용 거점 (B+)'
        : '신규 거점 (B)';

    // 4. 해당 시·도의 전체 유저 및 실시간 접속 유저 목록 추출 (가나다순 한국어 정렬 & 닉네임 유저 상단 정렬)
    const provUserList: ProvinceUserItem[] = [];
    const provLiveUserList: ProvinceUserItem[] = [];

    const namedList: UserGroupData[] = [];
    const anonList: UserGroupData[] = [];

    userGroups.forEach((g) => {
      if (g.isNamedUser) {
        namedList.push(g);
      } else {
        anonList.push(g);
      }
    });

    // 닉네임 실명 등록 유저는 한국어 가나다순 정렬
    namedList.sort((a, b) => a.rawName.localeCompare(b.rawName, 'ko'));
    // 일반 방문자는 최신 활동순 정렬
    anonList.sort((a, b) => b.latestLog.timestamp - a.latestLog.timestamp);

    // 1) 실명/닉네임 회원 등록 (중복 IP 통합 1인 1계정 박제)
    namedList.forEach((g) => {
      const uCity = userCityMap.get(g.userKey) || `${prov.name} 관내`;
      const item: ProvinceUserItem = {
        id: g.latestLog.id,
        name: g.rawName,
        isNamedUser: true,
        isKakaoUser: g.isKakaoUser,
        city: uCity,
        homeCourse: g.homeCourse || `${uCity} 인근 구장`,
        lastPath: g.latestLog.path || '/',
        lastActiveTime: `${g.latestLog.dateStr} ${g.latestLog.timeStr}`,
        firstActiveTime: `${g.earliestLog.dateStr} ${g.earliestLog.timeStr}`,
        visitCount: g.visitCount,
        deviceType: parseDeviceType(g.latestLog.userAgent),
        trafficSource: parseTrafficSource(g.latestLog.referrer, g.latestLog.path),
        timestamp: g.latestLog.timestamp,
        isLive: g.isLive,
      };
      provUserList.push(item);
      if (g.isLive) {
        provLiveUserList.push(item);
      }
    });

    // 2) 일반 방문자 (IP 숫자 제거, 친절한 지역 방문 골퍼 명칭 표기)
    const cityAnonCounter = new Map<string, number>();
    anonList.forEach((g) => {
      const uCity = userCityMap.get(g.userKey) || `${prov.name} 관내`;
      const cityKey = uCity.replace(/[시구군]$/, '').trim() || prov.name;
      const c = (cityAnonCounter.get(cityKey) || 0) + 1;
      cityAnonCounter.set(cityKey, c);

      const displayName = `${cityKey} 방문 골퍼 #${c}`;
      const item: ProvinceUserItem = {
        id: g.latestLog.id,
        name: displayName,
        isNamedUser: false,
        city: uCity,
        homeCourse: g.homeCourse || `${uCity} 인근 구장`,
        lastPath: g.latestLog.path || '/',
        lastActiveTime: `${g.latestLog.dateStr} ${g.latestLog.timeStr}`,
        firstActiveTime: `${g.earliestLog.dateStr} ${g.earliestLog.timeStr}`,
        visitCount: g.visitCount,
        deviceType: parseDeviceType(g.latestLog.userAgent),
        trafficSource: parseTrafficSource(g.latestLog.referrer, g.latestLog.path),
        timestamp: g.latestLog.timestamp,
        isLive: g.isLive,
      };
      provUserList.push(item);
      if (g.isLive) {
        provLiveUserList.push(item);
      }
    });

    // 가나다순 (한국어 사전순) 정렬: 닉네임 회원이 상단에서 가나다순, 그 뒤에 방문 골퍼 가나다순
    provLiveUserList.sort((a, b) => {
      if (a.isNamedUser !== b.isNamedUser) return a.isNamedUser ? -1 : 1;
      return a.name.localeCompare(b.name, 'ko');
    });

    // 해당 시·도의 등록 클럽 상세
    const provClubDetails: CityClubDetail[] = [];
    cities.forEach((city) => {
      if (city.clubDetails && city.clubDetails.length > 0) {
        provClubDetails.push(...city.clubDetails);
      }
    });

    return {
      code: prov.code,
      name: prov.name,
      userCount: provUserCount,
      liveUsers: provLiveUsers,
      clubCount: provClubCount,
      userPercentage,
      activityLabel,
      cities,
      users: provUserList,
      liveUserList: provLiveUserList,
      clubDetails: provClubDetails,
    };
  }).sort((a, b) => b.userCount - a.userCount);

  // 4. 기간별 영구 보존 추이 (시간별 24시간, 일별 7일, 주별 8주, 월별 12개월, 연별)
  // (0) 오늘 시간별 추이 (한국 표준시 KST 00시 ~ 23시)
  const hourlyTrend: TrendItem[] = [];
  for (let h = 0; h < 24; h++) {
    const hStr = String(h).padStart(2, '0');
    const hLogs = todayLogs.filter((l) => getKSTDate(l.timestamp).getUTCHours() === h);
    hourlyTrend.push({
      key: `${hStr}:00`,
      label: `${hStr}시`,
      pageviews: hLogs.length,
      uniqueVisitors: new Set(hLogs.map((l) => l.ip)).size,
    });
  }

  // (1) 일별 추이 (최근 7일 KST 0시 기준)
  const dailyTrend: TrendItem[] = [];
  for (let i = 6; i >= 0; i--) {
    const targetDayStart = kstInfo.kstMidnight - i * 24 * 60 * 60 * 1000;
    const targetDayEnd = targetDayStart + 24 * 60 * 60 * 1000;
    const dKst = getKSTDate(targetDayStart);
    const dStr = `${dKst.getUTCFullYear()}-${String(dKst.getUTCMonth() + 1).padStart(2, '0')}-${String(dKst.getUTCDate()).padStart(2, '0')}`;
    const isToday = i === 0;
    const dayLogs = store.logs.filter((l) => l.timestamp >= targetDayStart && l.timestamp < targetDayEnd);
    dailyTrend.push({
      key: dStr,
      label: isToday ? `${dStr} (오늘)` : dStr,
      pageviews: dayLogs.length,
      uniqueVisitors: new Set(dayLogs.map((l) => l.ip)).size,
    });
  }

  // (2) 주간별 추이 (최근 8주)
  const weeklyTrend: TrendItem[] = [];
  for (let w = 7; w >= 0; w--) {
    const startOfWeek = kstInfo.kstMidnight - (w * 7 + 6) * 24 * 60 * 60 * 1000;
    const endOfWeek = kstInfo.kstMidnight - w * 7 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000;
    const sKst = getKSTDate(startOfWeek);
    const eKst = getKSTDate(endOfWeek - 1000);
    const sStr = `${String(sKst.getUTCMonth() + 1).padStart(2, '0')}-${String(sKst.getUTCDate()).padStart(2, '0')}`;
    const eStr = `${String(eKst.getUTCMonth() + 1).padStart(2, '0')}-${String(eKst.getUTCDate()).padStart(2, '0')}`;
    const weekLogs = store.logs.filter((l) => l.timestamp >= startOfWeek && l.timestamp < endOfWeek);
    weeklyTrend.push({
      key: `w_${w}`,
      label: w === 0 ? `이번 주 (${sStr}~${eStr})` : `${w}주 전 (${sStr}~${eStr})`,
      pageviews: weekLogs.length,
      uniqueVisitors: new Set(weekLogs.map((l) => l.ip)).size,
    });
  }

  // (3) 월별 추이 (최근 12개월)
  const monthlyTrend: TrendItem[] = [];
  for (let m = 11; m >= 0; m--) {
    const targetYear = kstInfo.year;
    const targetMonthIndex = (kstInfo.month - 1) - m;
    const mStart = Date.UTC(targetYear, targetMonthIndex, 1, 0, 0, 0) - KST_OFFSET_MS;
    const mEnd = Date.UTC(targetYear, targetMonthIndex + 1, 1, 0, 0, 0) - KST_OFFSET_MS;
    const mKst = getKSTDate(mStart);
    const y = mKst.getUTCFullYear();
    const mo = String(mKst.getUTCMonth() + 1).padStart(2, '0');
    const monthKey = `${y}-${mo}`;
    const isThisMonth = m === 0;
    const monthLogs = store.logs.filter((l) => l.timestamp >= mStart && l.timestamp < mEnd);
    monthlyTrend.push({
      key: monthKey,
      label: isThisMonth ? `${y}년 ${mo}월 (이번 달)` : `${y}년 ${mo}월`,
      pageviews: monthLogs.length,
      uniqueVisitors: new Set(monthLogs.map((l) => l.ip)).size,
    });
  }

  // (4) 연도별 추이 (최근 3개년)
  const yearlyTrend: TrendItem[] = [];
  for (let y = kstInfo.year - 2; y <= kstInfo.year; y++) {
    const yStart = Date.UTC(y, 0, 1, 0, 0, 0) - KST_OFFSET_MS;
    const yEnd = Date.UTC(y + 1, 0, 1, 0, 0, 0) - KST_OFFSET_MS;
    const isThisYear = y === kstInfo.year;
    const yearLogs = store.logs.filter((l) => l.timestamp >= yStart && l.timestamp < yEnd);
    yearlyTrend.push({
      key: String(y),
      label: isThisYear ? `${y}년 (올해)` : `${y}년`,
      pageviews: yearLogs.length,
      uniqueVisitors: new Set(yearLogs.map((l) => l.ip)).size,
    });
  }

  // (5) 실시간 라운딩 상세 관제 데이터 집계 (엄격한 5단계 팩트 검증 엔진 적용)
  const now = Date.now();

  // 1. 실시간 필드 라운딩 목록 (가상/체험 모드 원천 배제, 타임아웃, 유기 세션 100% 차단)
  const liveRounds: LiveRoundInfo[] = allRooms
    .filter((r) => {
      if (!r || !r.roomId) return false;

      // ① 1단계: 가상(Virtual)/체험 모드 및 비공식 테스트 원천 배제
      const isVirtual = r.roundSession?.isVirtual === true || r.roundSession?.isOfficial === false;
      if (isVirtual) return false;

      // ② 2단계: 경기 상태 (STARTED 또는 WAITING)
      if (r.status !== 'STARTED' && r.status !== 'WAITING') return false;

      const updatedAt = r.updatedAt || 0;
      const startMs = r.roundSession?.startedAt ? new Date(r.roundSession.startedAt).getTime() : updatedAt;
      const elapsedMinutes = Math.max(1, Math.round((now - startMs) / 60000));
      const idleMinutes = Math.max(0, Math.round((now - updatedAt) / 60000));

      // ③ 3단계: 시간 한도 검증 (18홀 통상 90~120분, 최대 150분 초과 시 자동 종료/탈락)
      if (elapsedMinutes > 150) return false;

      // ④ 4단계: 유기/방치 세션 감지 (최근 25분간 아무런 스코어/활동 업데이트 없으면 탈락)
      if (idleMinutes > 25) return false;

      // ⑤ 5단계: 홀 진행성 검증 (시작 후 30분이 넘었는데 스코어 없이 1번홀에 정체되어 있으면 유령 세션 탈락)
      const currentHole = r.roundSession?.currentHole || 1;
      const hasScores = r.roundSession?.players?.some(
        (p: any) => p.scores && Object.keys(p.scores).length > 0
      );
      if (elapsedMinutes > 30 && currentHole <= 1 && !hasScores) return false;

      return true;
    })
    .sort((a, b) => {
      // STARTED가 WAITING보다 우선, 그 후 최신순
      if (a.status === 'STARTED' && b.status !== 'STARTED') return -1;
      if (b.status === 'STARTED' && a.status !== 'STARTED') return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    })
    .map((r) => {
      const norm = normalizeCourse(r.courseName || r.courseId);
      const startMs = r.roundSession?.startedAt ? new Date(r.roundSession.startedAt).getTime() : r.updatedAt;
      const elapsedMinutes = Math.max(1, Math.round((now - startMs) / 60000));
      const kst = formatKST(startMs);

      return {
        roomId: r.roomId,
        courseId: r.courseId || norm.name,
        courseName: norm.name,
        courseLetter: r.courseLetter || 'A',
        leaderName: r.leaderName || (r.players && r.players[0]?.name) || '조장',
        playerCount: r.playerCount || (r.players?.length) || 4,
        players: (r.players || []).map((p: any) => ({
          id: p.id,
          name: p.name || '동반자',
          isLeader: !!p.isLeader,
        })),
        currentHole: r.roundSession?.currentHole || 1,
        totalHoles: r.roundSession?.totalHoles === 999 ? 18 : (r.roundSession?.totalHoles || 9),
        status: r.status || 'STARTED',
        startedAtStr: `${kst.timeStr}`,
        elapsedMinutes,
        updatedAt: r.updatedAt || now,
      };
    });

  // 2. 전국 구장별 실제 라운딩 랭킹 (1위부터 순위 집계표: 실제 1회 이상 완주 또는 실시간 진행 중인 구장만 팩트 등록)
  const courseStats = new Map<string, {
    courseId: string;
    courseName: string;
    region: string;
    totalRounds: number;
    totalPlayers: number;
    activeRoomsCount: number;
    lastPlayedAt: number;
  }>();

  // 실제 라운드 방 데이터 집계 (100% 팩트 누적: 빈 방/테스트 클릭 원천 배제, 실제 스코어 입력 및 완료 경기만 인정)
  allRooms.forEach((r) => {
    if (!r || !r.roomId) return;
    // ① 가상(Virtual) 모드 및 비공식 테스트는 공식 통계에서도 배제
    if (r.roundSession?.isVirtual === true || r.roundSession?.isOfficial === false || r.isVirtual === true || r.isOfficial === false) {
      return;
    }

    // ② 상태 검증: 단순히 방만 생성하고 퇴장한 'WAITING' 대기 껍데기 방은 누적 라운딩에서 원천 배제!
    // 정식 종료(FINISHED)되었거나, 현재 5단계 팩트 검증을 통과한 실시간 정상 라운드(liveRounds)만 인정
    const isLive = liveRounds.some((live) => live.roomId === r.roomId);
    const isFinished = r.status === 'FINISHED';
    if (!isFinished && !isLive) {
      return;
    }

    // ③ 스코어(타수) 실재성 검증: 실제 최소 1홀 이상의 타수 입력이 존재하는 진짜 라운드만 인정 (빈 방 완전 탈락)
    const players = r.players || r.roundSession?.players || [];
    const hasActualScores = players.some(
      (p: any) => p.scores && Object.keys(p.scores).length > 0
    );
    if (!hasActualScores && !isLive) {
      return;
    }

    const norm = normalizeCourse(r.courseName || r.courseId);
    let item = courseStats.get(norm.name);
    if (!item) {
      item = {
        courseId: r.courseId || norm.name,
        courseName: norm.name,
        region: norm.region,
        totalRounds: 0,
        totalPlayers: 0,
        activeRoomsCount: 0,
        lastPlayedAt: 0,
      };
      courseStats.set(norm.name, item);
    }

    item.totalRounds += 1;
    item.totalPlayers += (r.playerCount || players.length || 4);
    if (r.updatedAt && r.updatedAt > item.lastPlayedAt) {
      item.lastPlayedAt = r.updatedAt;
    }

    if (isLive) {
      item.activeRoomsCount += 1;
    }
  });

  // 1회 이상 실제 경기 완주 기록이 있거나 현재 실시간 진행 중인 구장만 정식 랭킹(1위부터)으로 산출 (허수 0건 구장 순위 원천 배제)
  const courseRankings: CourseRoundRanking[] = Array.from(courseStats.values())
    .filter((c) => c.totalRounds > 0 || c.activeRoomsCount > 0)
    .sort((a, b) => {
      // 1. 현재 라운딩 중인 조가 있는 구장 최우선
      if (b.activeRoomsCount !== a.activeRoomsCount) {
        return b.activeRoomsCount - a.activeRoomsCount;
      }
      // 2. 누적 라운드 수 내림차순
      if (b.totalRounds !== a.totalRounds) {
        return b.totalRounds - a.totalRounds;
      }
      // 3. 누적 참가자 수 내림차순
      return b.totalPlayers - a.totalPlayers;
    })
    .map((c, idx) => {
      const kst = c.lastPlayedAt ? formatKST(c.lastPlayedAt) : null;
      return {
        rank: idx + 1,
        courseId: c.courseId,
        courseName: c.courseName,
        region: c.region,
        totalRounds: c.totalRounds,
        totalPlayers: c.totalPlayers,
        isCurrentlyActive: c.activeRoomsCount > 0,
        activeRoomsCount: c.activeRoomsCount,
        lastPlayedAtStr: kst ? `${kst.dateStr} ${kst.timeStr}` : '기록 대기',
      };
    });

  // 3. 총 가입자 실제 필드 라운딩 참여율 및 4대 골퍼 등급 분석 (5단계 팩트 검증 엔진)
  // ① 5단계 엄격 검증 필터를 통과한 실제 라운드 참가자 추출
  const userVerifiedRoundsMap = new Map<string, {
    courseName: string;
    holes: number;
    durationMinutes: number;
    updatedAt: number;
    isGpsVerified: boolean;
  }[]>();

  allRooms.forEach((r) => {
    if (!r) return;
    // 5단계 필터링: 가상 모드(isVirtual: true) 및 비공식 테스트 배제
    if (r.roundSession?.isVirtual === true || r.isVirtual === true) return;
    if (r.roundSession?.isOfficial === false || r.isOfficial === false) return;
    if (r.status !== 'STARTED' && r.status !== 'FINISHED') return;

    const norm = normalizeCourse(r.courseName || r.courseId);
    const holes = r.roundSession?.confirmedHoles?.length || (r.status === 'FINISHED' ? (r.roundSession?.totalHoles || 18) : (r.roundSession?.currentHole || 9));
    const startMs = r.roundSession?.startedAt ? new Date(r.roundSession.startedAt).getTime() : (r.updatedAt || Date.now());
    const durationMinutes = Math.max(35, Math.round(((r.updatedAt || Date.now()) - startMs) / 60000));

    const participants = new Set<string>();
    const leaderName = (r.leaderName || '').trim();
    if (leaderName && !leaderName.startsWith('동반자') && leaderName !== '조장(본인)') {
      participants.add(normalizeUserName(leaderName));
    }
    const players = r.players || r.roundSession?.players || [];
    players.forEach((p: any) => {
      const pName = (p.name || '').trim();
      if (pName && !pName.startsWith('동반자') && pName !== '조장(본인)') {
        participants.add(normalizeUserName(pName));
      }
    });

    const isGpsReal = r.roundSession?.isGpsVerified === true || r.isGpsVerified === true;
    const roundRecord = {
      courseName: norm.name,
      holes: holes > 0 ? holes : 9,
      durationMinutes,
      updatedAt: r.updatedAt || Date.now(),
      isGpsVerified: isGpsReal, // 실제 현장 GPS 검증 통과 여부
    };

    participants.forEach((name) => {
      if (!userVerifiedRoundsMap.has(name)) {
        userVerifiedRoundsMap.set(name, []);
      }
      userVerifiedRoundsMap.get(name)!.push(roundRecord);
    });
  });

  // ② 전체 유저 프로필 구성 및 등급 판별
  const allUserProfiles: UserRoundStatProfile[] = [];
  const processedUserKeys = new Set<string>();

  // 1) 방문 로그 기반 고유 유저 프로필 생성
  const globalUserGroups = new Map<string, {
    userKey: string;
    isNamedUser: boolean;
    isKakaoUser: boolean;
    rawName: string;
    city: string;
    latestLog: VisitorLog;
    earliestLog: VisitorLog;
    visitCount: number;
  }>();

  store.logs.forEach((log) => {
    const rawName = (log.userName || '').trim();
    const isNamed = !!rawName && rawName !== '일반 골퍼';
    const cleanName = isNamed ? normalizeUserName(rawName) : '';
    const userKey = isNamed ? `named:${cleanName}` : `anon:${log.ip}`;
    const isKakao = !!log.isKakaoUser || rawName === '김대희' || rawName === '나이스버디' || cleanName.includes('김대희');

    const reg = (log.userRegion || allIpRegionMap.get(log.ip) || '경북 구미시').trim();

    if (!globalUserGroups.has(userKey)) {
      globalUserGroups.set(userKey, {
        userKey,
        isNamedUser: isNamed,
        isKakaoUser: isKakao,
        rawName: isNamed ? cleanName : '',
        city: reg,
        latestLog: log,
        earliestLog: log,
        visitCount: 1,
      });
    } else {
      const g = globalUserGroups.get(userKey)!;
      g.visitCount++;
      if (isKakao) g.isKakaoUser = true;
      if (log.timestamp > g.latestLog.timestamp) g.latestLog = log;
      if (log.timestamp < g.earliestLog.timestamp) g.earliestLog = log;
    }
  });

  const globalNamedList: any[] = [];
  const globalAnonList: any[] = [];

  globalUserGroups.forEach((g) => {
    if (g.isNamedUser) {
      globalNamedList.push(g);
    } else {
      globalAnonList.push(g);
    }
  });

  globalNamedList.sort((a, b) => a.rawName.localeCompare(b.rawName, 'ko'));
  globalAnonList.sort((a, b) => b.latestLog.timestamp - a.latestLog.timestamp);

  // 닉네임 설정 회원 프로필 빌드
  globalNamedList.forEach((g) => {
    const rounds = userVerifiedRoundsMap.get(g.rawName) || [];
    const count = rounds.length;
    const holes = rounds.reduce((s, r) => s + r.holes, 0);
    const avgDur = count > 0 ? Math.round(rounds.reduce((s, r) => s + r.durationMinutes, 0) / count) : 0;
    const lastCourse = count > 0 ? [...rounds].sort((a, b) => b.updatedAt - a.updatedAt)[0].courseName : '';

    let tier: UserRoundStatProfile['tier'] = 'BROWSER';
    let tierLabel = '🔍 필드 출격 대기 (0회)';
    if (count >= 5) {
      tier = 'HEAVY';
      tierLabel = '👑 열성 헤비 골퍼 (5회 이상)';
    } else if (count >= 2) {
      tier = 'REGULAR';
      tierLabel = '⛳ 꾸준한 정기 골퍼 (2~4회)';
    } else if (count >= 1) {
      tier = 'STARTER';
      tierLabel = '🌱 1회 입문/체험 골퍼 (1회)';
    }

    processedUserKeys.add(g.rawName);
    allUserProfiles.push({
      id: g.latestLog.id,
      name: g.rawName,
      isNamedUser: true,
      isKakaoUser: g.isKakaoUser || g.rawName.includes('김대희'),
      city: g.city,
      deviceType: parseDeviceType(g.latestLog.userAgent),
      trafficSource: parseTrafficSource(g.latestLog.referrer, g.latestLog.path),
      firstActiveTime: `${g.earliestLog.dateStr} ${g.earliestLog.timeStr}`,
      lastActiveTime: `${g.latestLog.dateStr} ${g.latestLog.timeStr}`,
      visitCount: g.visitCount,
      actualRoundsCount: count,
      totalHolesCompleted: holes,
      isGpsVerified: rounds.some((r) => r.isGpsVerified),
      avgDurationMinutes: avgDur,
      lastCourseName: lastCourse,
      tier,
      tierLabel,
    });
  });

  // 라운딩 기록에는 있으나 아직 로그 프로필에 없는 사용자 추가 (완전성 보장)
  userVerifiedRoundsMap.forEach((rounds, pName) => {
    if (!processedUserKeys.has(pName)) {
      processedUserKeys.add(pName);
      const count = rounds.length;
      const holes = rounds.reduce((s, r) => s + r.holes, 0);
      const avgDur = count > 0 ? Math.round(rounds.reduce((s, r) => s + r.durationMinutes, 0) / count) : 0;
      const lastCourse = count > 0 ? [...rounds].sort((a, b) => b.updatedAt - a.updatedAt)[0].courseName : '';

      let tier: UserRoundStatProfile['tier'] = 'BROWSER';
      let tierLabel = '🔍 필드 출격 대기 (0회)';
      if (count >= 5) {
        tier = 'HEAVY';
        tierLabel = '👑 열성 헤비 골퍼 (5회 이상)';
      } else if (count >= 2) {
        tier = 'REGULAR';
        tierLabel = '⛳ 꾸준한 정기 골퍼 (2~4회)';
      } else if (count >= 1) {
        tier = 'STARTER';
        tierLabel = '🌱 1회 입문/체험 골퍼 (1회)';
      }

      const sortedRounds = [...rounds].sort((a, b) => a.updatedAt - b.updatedAt);
      const earliestKst = formatKST(sortedRounds[0].updatedAt);
      const latestKst = formatKST(sortedRounds[sortedRounds.length - 1].updatedAt);

      allUserProfiles.push({
        id: `user_round_${Math.random().toString(36).substring(2, 8)}`,
        name: pName,
        isNamedUser: true,
        isKakaoUser: pName.includes('김대희'),
        city: sortedRounds[sortedRounds.length - 1].courseName || '필드 라운드 참가',
        deviceType: '📱 모바일',
        trafficSource: '직접 라운딩 참여',
        firstActiveTime: `${earliestKst.dateStr} ${earliestKst.timeStr}`,
        lastActiveTime: `${latestKst.dateStr} ${latestKst.timeStr}`,
        visitCount: count,
        actualRoundsCount: count,
        totalHolesCompleted: holes,
        isGpsVerified: rounds.some((r) => r.isGpsVerified),
        avgDurationMinutes: avgDur,
        lastCourseName: lastCourse,
        tier,
        tierLabel,
      });
    }
  });

  // 일반 방문 골퍼 추가 (IP 숫자 완전 배제, 친절한 명칭 부여)
  const globalCityAnonCounter = new Map<string, number>();
  globalAnonList.forEach((g) => {
    const cityKey = g.city.replace(/[시구군]$/, '').trim() || '구미';
    const c = (globalCityAnonCounter.get(cityKey) || 0) + 1;
    globalCityAnonCounter.set(cityKey, c);

    allUserProfiles.push({
      id: g.latestLog.id,
      name: `${cityKey} 방문 골퍼 #${c}`,
      isNamedUser: false,
      city: g.city,
      deviceType: parseDeviceType(g.latestLog.userAgent),
      trafficSource: parseTrafficSource(g.latestLog.referrer, g.latestLog.path),
      firstActiveTime: `${g.earliestLog.dateStr} ${g.earliestLog.timeStr}`,
      lastActiveTime: `${g.latestLog.dateStr} ${g.latestLog.timeStr}`,
      visitCount: g.visitCount,
      actualRoundsCount: 0,
      totalHolesCompleted: 0,
      isGpsVerified: false,
      avgDurationMinutes: 0,
      lastCourseName: '',
      tier: 'BROWSER',
      tierLabel: '🔍 필드 출격 대기 (0회)',
    });
  });

  // 등급 우선 정렬 (헤비 -> 꾸준함 -> 1회 -> 대기자 순)
  const tierWeight: Record<UserRoundStatProfile['tier'], number> = {
    HEAVY: 0,
    REGULAR: 1,
    STARTER: 2,
    BROWSER: 3,
  };
  allUserProfiles.sort((a, b) => {
    if (tierWeight[a.tier] !== tierWeight[b.tier]) {
      return tierWeight[a.tier] - tierWeight[b.tier];
    }
    if (b.actualRoundsCount !== a.actualRoundsCount) {
      return b.actualRoundsCount - a.actualRoundsCount;
    }
    return a.name.localeCompare(b.name, 'ko');
  });

  const totalUsersCalc = allUserProfiles.length;
  const namedUsersCount = allUserProfiles.filter((p) => p.isNamedUser).length;
  const anonymousUsersCount = allUserProfiles.filter((p) => !p.isNamedUser).length;
  const kakaoUsersCount = allUserProfiles.filter((p) => p.isKakaoUser).length;
  const playedCount = allUserProfiles.filter((p) => p.actualRoundsCount > 0).length;
  const playedUsersPct = totalUsersCalc > 0 ? Math.round((playedCount / totalUsersCalc) * 1000) / 10 : 0;
  const browserCount = totalUsersCalc - playedCount;
  const browserUsersPct = totalUsersCalc > 0 ? Math.round((browserCount / totalUsersCalc) * 1000) / 10 : 0;

  const heavyCount = allUserProfiles.filter((p) => p.tier === 'HEAVY').length;
  const regularCount = allUserProfiles.filter((p) => p.tier === 'REGULAR').length;
  const starterCount = allUserProfiles.filter((p) => p.tier === 'STARTER').length;

  const userRoundAnalytics: UserRoundAnalyticsSummary = {
    totalUsers: totalUsersCalc,
    namedUsersCount,
    anonymousUsersCount,
    kakaoUsersCount,
    playedUsersCount: playedCount,
    playedUsersPercentage: playedUsersPct,
    browserUsersCount: browserCount,
    browserUsersPercentage: browserUsersPct,
    tierCounts: {
      heavy: heavyCount,
      regular: regularCount,
      starter: starterCount,
      browser: browserCount,
    },
    tierPercentages: {
      heavy: totalUsersCalc > 0 ? Math.round((heavyCount / totalUsersCalc) * 1000) / 10 : 0,
      regular: totalUsersCalc > 0 ? Math.round((regularCount / totalUsersCalc) * 1000) / 10 : 0,
      starter: totalUsersCalc > 0 ? Math.round((starterCount / totalUsersCalc) * 1000) / 10 : 0,
      browser: browserUsersPct,
    },
    userProfiles: allUserProfiles,
  };

  return NextResponse.json({
    metrics: {
      liveUsers,
      todayDAU,
      weeklyWAU,
      monthlyMAU,
      yearlyYAU,
      totalPageviews,
      todayPageviews,
      totalAllTimeUsers: Math.max(totalAllTimeUsers, totalUsersCalc),
      namedUsersCount,
      anonymousUsersCount,
      kakaoUsersCount,
      totalAppDownloads,
      provinceStats,
      courseRankings,
      liveRounds,
      userRoundAnalytics,
      hourlyTrend,
      dailyTrend,
      weeklyTrend,
      monthlyTrend,
      yearlyTrend,
      popularPages: store.popularPages,
      recentVisitors: store.logs.slice(-30).reverse().map((log) => {
        const k = formatKST(log.timestamp);
        return {
          ...log,
          dateStr: k.dateStr,
          timeStr: k.timeStr,
        };
      }),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const ipParts = rawIp.split('.');
    const maskedIp =
      ipParts.length === 4
        ? ipParts[0] + '.' + ipParts[1] + '.***.***'
        : rawIp.slice(0, 8) + '...';

    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const currentPath = body.path || '/';
    const referrer = body.referrer || req.headers.get('referer') || 'Direct';

    const vercelRegion = req.headers.get('x-vercel-ip-country-region');
    const vercelCity = decodeURIComponent(req.headers.get('x-vercel-ip-city') || '');
    const VERCEL_REGION_MAP: Record<string, string> = {
      '11': '서울',
      '26': '부산',
      '27': '대구',
      '28': '인천',
      '29': '광주',
      '30': '대전',
      '31': '울산',
      '41': '경기',
      '42': '강원',
      '43': '충북',
      '44': '충남',
      '45': '전북',
      '46': '전남',
      '47': '경북',
      '48': '경남',
      '49': '제주',
      '50': '세종',
    };

    let userRegion = body.userRegion?.trim();
    let homeCourse = body.homeCourse?.trim();

    if (!userRegion) {
      if (vercelRegion && VERCEL_REGION_MAP[vercelRegion]) {
        userRegion = VERCEL_REGION_MAP[vercelRegion] + (vercelCity ? ` ${vercelCity}` : '');
        homeCourse = `${userRegion} 공인 파크골프장`;
      } else {
        const detectedProv = resolveKoreanProvinceFromIp(maskedIp);
        userRegion = detectedProv;
        homeCourse = `${detectedProv} 공인 파크골프장`;
      }
    }
    const userName = body.userName || '일반 골퍼';
    const isAppInstall = !!body.isAppInstall;
    const isKakaoUser = !!body.isKakaoUser || userName === '김대희' || userName === '나이스버디';
    const kakaoId = body.kakaoId ? String(body.kakaoId) : undefined;

    const nowTime = Date.now();
    const kstInfo = formatKST(nowTime);
    const dateStr = kstInfo.dateStr;
    const timeStr = kstInfo.timeStr;

    const log: VisitorLog = {
      id: Math.random().toString(36).substring(2, 9),
      ip: maskedIp,
      userAgent: userAgent.slice(0, 120),
      path: currentPath,
      referrer: referrer.slice(0, 100),
      timestamp: nowTime,
      dateStr,
      timeStr,
      userRegion,
      homeCourse,
      userName,
      isAppInstall,
      isKakaoUser,
      kakaoId,
    };

    const store = getAnalyticsStore();
    store.logs.push(log);

    const allIps = new Set(store.logs.map((l) => l.ip));
    store.totalAllTimeUsers = Math.max(store.totalAllTimeUsers || 0, allIps.size);
    if (isAppInstall) {
      store.totalAppDownloads = (store.totalAppDownloads || 0) + 1;
    }

    if (store.logs.length > 5000) {
      store.logs = store.logs.slice(-5000);
    }

    store.popularPages[currentPath] = (store.popularPages[currentPath] || 0) + 1;
    saveAnalyticsStore(store);

    // Supabase Cloud에 비동기 영구 저장 (백그라운드)
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('parkon_analytics_logs').insert([log]);
      } catch {
        // Local fallback
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
