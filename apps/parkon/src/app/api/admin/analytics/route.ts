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
}

export interface CityDetailStat {
  cityName: string;
  userCount: number;
  liveUsers: number;
  clubCount: number;
  clubs: string[];
  majorCourses: string[];
  activityIndex: string;
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
}

export interface TrendItem {
  key: string;
  label: string;
  pageviews: number;
  uniqueVisitors: number;
}

interface AnalyticsStore {
  logs: VisitorLog[];
  popularPages: Record<string, number>;
  totalAllTimeUsers: number;
  totalAppDownloads: number;
}

const ANALYTICS_FILE = path.join(os.tmpdir(), 'parkon_analytics_logs.json');


const getSupabaseClient = () => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder')) return null;
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

interface ProvinceSeed {
  code: string;
  name: string;
  baseClubCount: number;
  activityLabel: string;
  cities: Array<{
    name: string;
    clubCount: number;
    clubs: string[];
    courses: string[];
    activity: string;
  }>;
}

const PROVINCE_SEEDS: ProvinceSeed[] = [
  {
    code: 'GB',
    name: '경북',
    baseClubCount: 14,
    activityLabel: '최고 활성 거점 (A+)',
    cities: [
      {
        name: '구미시',
        clubCount: 5,
        clubs: ['구미 동락 에이스 클럽', '구미 지산사랑 동호회', '구미 양호 버디클럽', '선산 그린회'],
        courses: ['동락 파크골프장(36홀)', '지산 구장(63홀)', '양호 구장(36홀)', '선산 구장'],
        activity: '매일 조기/주말 라운드 집중 (A+)',
      },
      {
        name: '포항시',
        clubCount: 3,
        clubs: ['포항 형산강 파크클럽', '포항 송도 동호회'],
        courses: ['형산강 파크골프장(27홀)', '송도 구장'],
        activity: '정기 월례회 활발 (A)',
      },
      {
        name: '경주시',
        clubCount: 3,
        clubs: ['경주 토함 파크회', '보문 호반클럽'],
        courses: ['경주 안강 구장(18홀)', '보문 구장'],
        activity: '주말 원정 라운드 우수 (A)',
      },
      {
        name: '김천시',
        clubCount: 2,
        clubs: ['김천 직지 파크클럽', '혁신도시 파크동호회'],
        courses: ['김천 강변 파크골프장'],
        activity: '평일/주말 상시 이용 (B+)',
      },
      {
        name: '안동시',
        clubCount: 1,
        clubs: ['안동 낙동강 클럽'],
        courses: ['안동 낙동강변 구장'],
        activity: '정기 라운드 진행 (B)',
      },
    ],
  },
  {
    code: 'DG',
    name: '대구',
    baseClubCount: 10,
    activityLabel: '매우 활발 (A+)',
    cities: [
      {
        name: '달서구',
        clubCount: 4,
        clubs: ['대구 달서 사랑방', '성서 그린클럽'],
        courses: ['강창 파크골프장', '호림 강변 구장'],
        activity: '월례회 및 번개 모임 활발 (A+)',
      },
      {
        name: '수성구',
        clubCount: 3,
        clubs: ['수성 패밀리 파크클럽', '팔현 생태동호회'],
        courses: ['수성 파크골프장', '팔현 구장'],
        activity: '주말 집중 라운드 (A)',
      },
      {
        name: '북구',
        clubCount: 2,
        clubs: ['금호강 그린회'],
        courses: ['사수 파크골프장', '불로 구장'],
        activity: '평일 오전 라운드 (B+)',
      },
      {
        name: '동구',
        clubCount: 1,
        clubs: ['팔공 버디회'],
        courses: ['봉무 구장', '율하체육공원 구장'],
        activity: '신규 회원 유입 활발 (B)',
      },
    ],
  },
  {
    code: 'BS',
    name: '부산',
    baseClubCount: 8,
    activityLabel: '매우 활발 (A)',
    cities: [
      {
        name: '사상구',
        clubCount: 3,
        clubs: ['부산 낙동 사랑방', '삼락 에이스'],
        courses: ['삼락 생태공원 파크골프장(36홀)'],
        activity: '대형 클럽 주말 라운드 집중 (A+)',
      },
      {
        name: '강서구',
        clubCount: 2,
        clubs: ['부산 대저 그린클럽'],
        courses: ['대저 생태공원 구장'],
        activity: '평일 조기 라운드 활발 (A)',
      },
      {
        name: '북구',
        clubCount: 2,
        clubs: ['화명 강변 파크회'],
        courses: ['화명 생태 구장'],
        activity: '정기 월례회 가동 (B+)',
      },
      {
        name: '해운대구',
        clubCount: 1,
        clubs: ['해운대 파크클럽'],
        courses: ['해운대 수목원 구장'],
        activity: '주말 동호인 모임 (B)',
      },
    ],
  },
  {
    code: 'SO',
    name: '서울',
    baseClubCount: 9,
    activityLabel: '수도권 중심 (A)',
    cities: [
      {
        name: '영등포구',
        clubCount: 4,
        clubs: ['한강 시니어 파크골프회', '여의도 버디클럽'],
        courses: ['여의도 한강 파크골프장(18홀)'],
        activity: '주중/주말 상시 풀 라운드 (A+)',
      },
      {
        name: '송파구',
        clubCount: 2,
        clubs: ['잠실 파크사랑회'],
        courses: ['잠실 파크골프장'],
        activity: '주말 번개 모임 활발 (A)',
      },
      {
        name: '마포구',
        clubCount: 2,
        clubs: ['마포 월드 파크클럽'],
        courses: ['월드컵공원 노을 구장'],
        activity: '평일 오전 라운드 (B+)',
      },
      {
        name: '강남/서초',
        clubCount: 1,
        clubs: ['양재천 그린회'],
        courses: ['양재천 강변 구장'],
        activity: '동호인 친목 라운드 (B)',
      },
    ],
  },
  {
    code: 'GG',
    name: '경기',
    baseClubCount: 11,
    activityLabel: '수도권 광역 (A)',
    cities: [
      {
        name: '수원시',
        clubCount: 3,
        clubs: ['경기 수레바퀴 클럽', '서호 파크회'],
        courses: ['수원 서호 파크골프장'],
        activity: '정기 월례회 운영 (A)',
      },
      {
        name: '성남시',
        clubCount: 3,
        clubs: ['분당 탄천 그린동호회'],
        courses: ['탄천 성남 파크골프장'],
        activity: '주중 라운드 활발 (A)',
      },
      {
        name: '양평군',
        clubCount: 2,
        clubs: ['양평 맑은물 파크클럽'],
        courses: ['양평 강상 파크골프장'],
        activity: '전국 원정 투어 명소 (A)',
      },
      {
        name: '용인시',
        clubCount: 2,
        clubs: ['용인 처인 파크회'],
        courses: ['용인 모현 구장'],
        activity: '회원 모집 확대 중 (B+)',
      },
      {
        name: '고양시',
        clubCount: 1,
        clubs: ['일산 호수 파크클럽'],
        courses: ['고양 대화 구장'],
        activity: '주말 번개 활발 (B)',
      },
    ],
  },
  {
    code: 'US',
    name: '울산',
    baseClubCount: 5,
    activityLabel: '활발 (B+)',
    cities: [
      {
        name: '남구/중구',
        clubCount: 3,
        clubs: ['울산 태화강 동호인회', '남구 삼호 클럽'],
        courses: ['태화강 파크골프장(36홀)', '삼호 구장'],
        activity: '새벽 조기 라운드 집중 (A)',
      },
      {
        name: '울주군',
        clubCount: 2,
        clubs: ['울주 영남알프스회'],
        courses: ['울주 작천정 구장'],
        activity: '주말 정기 모임 (B+)',
      },
    ],
  },
  {
    code: 'GN',
    name: '경남',
    baseClubCount: 7,
    activityLabel: '활발 (A)',
    cities: [
      {
        name: '창원시',
        clubCount: 3,
        clubs: ['창원 대산 에이스', '의창 그린회'],
        courses: ['창원 대산 파크골프장(72홀)'],
        activity: '전국 최대 규모 대회 성지 (A+)',
      },
      {
        name: '김해시',
        clubCount: 2,
        clubs: ['김해 가야 파크골프회'],
        courses: ['술뫼 파크골프장'],
        activity: '정기 라운드 활발 (A)',
      },
      {
        name: '진주시',
        clubCount: 2,
        clubs: ['진주 남강 그린클럽'],
        courses: ['진주 남강 구장'],
        activity: '회원 친선 라운드 (B+)',
      },
    ],
  },
  {
    code: 'IC',
    name: '인천',
    baseClubCount: 4,
    activityLabel: '보통 (B+)',
    cities: [
      {
        name: '서구',
        clubCount: 2,
        clubs: ['인천 청라 버디회'],
        courses: ['청라 파크골프장'],
        activity: '주말 라운드 집중 (B+)',
      },
      {
        name: '연수구',
        clubCount: 2,
        clubs: ['송도 해돋이 파크클럽'],
        courses: ['송도 달빛공원 구장'],
        activity: '평일 라운드 (B)',
      },
    ],
  },
  {
    code: 'GW',
    name: '강원',
    baseClubCount: 5,
    activityLabel: '대회 명소 (A)',
    cities: [
      {
        name: '화천군',
        clubCount: 2,
        clubs: ['화천 산천어 전국동호회'],
        courses: ['산천어 파크골프장(36홀)'],
        activity: '전국 대회 원정 성지 (A+)',
      },
      {
        name: '춘천시',
        clubCount: 2,
        clubs: ['춘천 호반 파크클럽'],
        courses: ['의암호 구장'],
        activity: '주말 정기 라운드 (B+)',
      },
      {
        name: '원주시',
        clubCount: 1,
        clubs: ['원주 섬강 그린회'],
        courses: ['섬강 파크골프장'],
        activity: '회원 모집 중 (B)',
      },
    ],
  },
  {
    code: 'CB',
    name: '충북',
    baseClubCount: 3,
    activityLabel: '보통 (B)',
    cities: [
      {
        name: '청주시',
        clubCount: 2,
        clubs: ['청주 직지 파크클럽'],
        courses: ['무심천 파크골프장'],
        activity: '월례회 운영 (B+)',
      },
      {
        name: '충주시',
        clubCount: 1,
        clubs: ['충주 사과향 파크회'],
        courses: ['호암지 구장'],
        activity: '주말 라운드 (B)',
      },
    ],
  },
  {
    code: 'CN',
    name: '충남',
    baseClubCount: 6,
    activityLabel: '활발 (B+)',
    cities: [
      {
        name: '천안시',
        clubCount: 3,
        clubs: ['천안 삼거리 파크회'],
        courses: ['천안 도솔 구장'],
        activity: '정기 라운드 활발 (B+)',
      },
      {
        name: '아산시',
        clubCount: 2,
        clubs: ['아산 온천 그린클럽'],
        courses: ['이순신 파크골프장'],
        activity: '월례회 활성 (B+)',
      },
      {
        name: '공주시',
        clubCount: 1,
        clubs: ['공주 백제 파크동호회'],
        courses: ['금강 파크골프장'],
        activity: '친목 라운드 (B)',
      },
    ],
  },
  {
    code: 'DJ',
    name: '대전/세종',
    baseClubCount: 4,
    activityLabel: '보통 (B+)',
    cities: [
      {
        name: '대전 유성구/서구',
        clubCount: 2,
        clubs: ['대전 한빛 파크골프회'],
        courses: ['갑천 파크골프장'],
        activity: '평일/주말 라운드 (B+)',
      },
      {
        name: '세종시',
        clubCount: 2,
        clubs: ['세종 금강 파크사랑'],
        courses: ['세종 금강 구장'],
        activity: '신규 유저 유입 (B+)',
      },
    ],
  },
  {
    code: 'JB',
    name: '전북',
    baseClubCount: 4,
    activityLabel: '보통 (B)',
    cities: [
      {
        name: '전주시',
        clubCount: 2,
        clubs: ['전주 온고을 파크회'],
        courses: ['만경강 파크골프장'],
        activity: '월례회 진행 (B+)',
      },
      {
        name: '익산시',
        clubCount: 2,
        clubs: ['익산 보석 파크클럽'],
        courses: ['익산 만경 구장'],
        activity: '주말 라운드 (B)',
      },
    ],
  },
  {
    code: 'JN',
    name: '전남',
    baseClubCount: 5,
    activityLabel: '활발 (B+)',
    cities: [
      {
        name: '순천시',
        clubCount: 2,
        clubs: ['순천만 갈대 파크회'],
        courses: ['순천만 국가정원 구장'],
        activity: '정기 월례회 (A)',
      },
      {
        name: '목포시',
        clubCount: 2,
        clubs: ['목포 유달산 파크클럽'],
        courses: ['갓바위 구장'],
        activity: '주말 라운드 (B+)',
      },
      {
        name: '나주시',
        clubCount: 1,
        clubs: ['나주 배꽃 파크동호회'],
        courses: ['영산강 구장'],
        activity: '친목 라운드 (B)',
      },
    ],
  },
  {
    code: 'GJ',
    name: '광주',
    baseClubCount: 3,
    activityLabel: '보통 (B)',
    cities: [
      {
        name: '광산구',
        clubCount: 2,
        clubs: ['빛고을 광주 파크클럽'],
        courses: ['영산강 구장'],
        activity: '정기 모임 (B+)',
      },
      {
        name: '북구',
        clubCount: 1,
        clubs: ['광주 무등 파크사랑'],
        courses: ['첨단 체육공원 구장'],
        activity: '평일 라운드 (B)',
      },
    ],
  },
  {
    code: 'JJ',
    name: '제주',
    baseClubCount: 3,
    activityLabel: '관광/투어 (B+)',
    cities: [
      {
        name: '제주시',
        clubCount: 2,
        clubs: ['제주 한라 파크골프회'],
        courses: ['제주 회천 구장'],
        activity: '도민 및 여행객 라운드 (B+)',
      },
      {
        name: '서귀포시',
        clubCount: 1,
        clubs: ['서귀포 칠십리 클럽'],
        courses: ['칠십리 구장'],
        activity: '주말 라운드 (B)',
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
  // Cloud Database Sync (Vercel Serverless 영구 보존용)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('parkon_analytics_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000);
      if (!error && data && data.length > 0) {
        const existingIds = new Set(store.logs.map((l) => l.id));
        data.forEach((row: any) => {
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
  const now = new Date();
  const nowTime = now.getTime();
  const todayStr = now.toISOString().split('T')[0];

  // 1. 기간별 실사용자 & 접속자 집계
  const tenMinsAgo = nowTime - 10 * 60 * 1000;
  const liveLogs = store.logs.filter((l) => l.timestamp >= tenMinsAgo);
  const liveUsers = new Set(liveLogs.map((l) => l.ip)).size;

  const todayLogs = store.logs.filter((l) => l.dateStr === todayStr);
  const todayPageviews = todayLogs.length;
  const todayDAU = new Set(todayLogs.map((l) => l.ip)).size;

  const sevenDaysAgoTime = nowTime - 7 * 24 * 60 * 60 * 1000;
  const last7DaysLogs = store.logs.filter((l) => l.timestamp >= sevenDaysAgoTime);
  const weeklyWAU = new Set(last7DaysLogs.map((l) => l.ip)).size;

  const thirtyDaysAgoTime = nowTime - 30 * 24 * 60 * 60 * 1000;
  const last30DaysLogs = store.logs.filter((l) => l.timestamp >= thirtyDaysAgoTime);
  const monthlyMAU = new Set(last30DaysLogs.map((l) => l.ip)).size;

  const totalPageviews = store.logs.length;
  const allUniqueIps = new Set(store.logs.map((l) => l.ip));
  const uniqueVisitorCount = allUniqueIps.size;

  // 총 누적 가입/이용 유저 수 (영구 누적 보존)
  const totalAllTimeUsers = Math.max(uniqueVisitorCount, store.totalAllTimeUsers || uniqueVisitorCount);
  const totalAppDownloads = store.totalAppDownloads || Math.max(1, Math.round(totalAllTimeUsers * 0.85));

  // 2. 실시간 IP 지역 및 도시 매핑
  const liveIpRegionMap = new Map<string, string>();
  liveLogs.forEach((log) => {
    liveIpRegionMap.set(log.ip, (log.userRegion || '').toLowerCase());
  });

  const allIpRegionMap = new Map<string, string>();
  store.logs.forEach((log) => {
    allIpRegionMap.set(log.ip, (log.userRegion || '').toLowerCase());
  });

  // 3. 전국 시·도별 실제 현황 및 시·군·구 드릴다운 집계
  const provinceStats: ProvinceStat[] = PROVINCE_SEEDS.map((seed) => {
    let provUserCount = 0;
    let provLiveUsers = 0;

    allIpRegionMap.forEach((reg) => {
      if (reg.includes(seed.name.toLowerCase())) {
        provUserCount++;
      }
    });

    liveIpRegionMap.forEach((reg) => {
      if (reg.includes(seed.name.toLowerCase())) {
        provLiveUsers++;
      }
    });

    const cities: CityDetailStat[] = seed.cities.map((c) => {
      let cityUsers = 0;
      let cityLive = 0;
      allIpRegionMap.forEach((reg) => {
        if (reg.includes(c.name.toLowerCase()) || reg.includes(seed.name.toLowerCase())) {
          cityUsers++;
        }
      });
      liveIpRegionMap.forEach((reg) => {
        if (reg.includes(c.name.toLowerCase()) || reg.includes(seed.name.toLowerCase())) {
          cityLive++;
        }
      });

      return {
        cityName: c.name,
        userCount: cityUsers,
        liveUsers: cityLive,
        clubCount: c.clubCount,
        clubs: c.clubs,
        majorCourses: c.courses,
        activityIndex: c.activity,
      };
    });

    const userPercentage = totalAllTimeUsers > 0 ? Math.round((provUserCount / totalAllTimeUsers) * 100) : 0;

    return {
      code: seed.code,
      name: seed.name,
      userCount: provUserCount,
      liveUsers: provLiveUsers,
      clubCount: seed.baseClubCount,
      userPercentage,
      activityLabel: seed.activityLabel,
      cities,
    };
  }).sort((a, b) => b.userCount - a.userCount);

  // 4. 기간별 영구 보존 추이 (일별 7일, 주별 8주, 월별 12개월, 연별)
  // (1) 일별 추이 (최근 7일)
  const dailyTrend: TrendItem[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(nowTime - i * 24 * 60 * 60 * 1000);
    const dStr = d.toISOString().split('T')[0];
    const isToday = dStr === todayStr;
    const dayLogs = store.logs.filter((l) => l.dateStr === dStr);
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
    const startOfWeek = new Date(nowTime - (w * 7 + 6) * 24 * 60 * 60 * 1000);
    const endOfWeek = new Date(nowTime - w * 7 * 24 * 60 * 60 * 1000);
    const sStr = startOfWeek.toISOString().split('T')[0].slice(5);
    const eStr = endOfWeek.toISOString().split('T')[0].slice(5);
    const weekLogs = store.logs.filter((l) => {
      const t = l.timestamp;
      return t >= startOfWeek.getTime() && t <= endOfWeek.getTime() + 24 * 60 * 60 * 1000;
    });
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
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const monthPrefix = `${y}-${mo}`;
    const isThisMonth = m === 0;
    const monthLogs = store.logs.filter((l) => (l.dateStr || '').startsWith(monthPrefix));
    monthlyTrend.push({
      key: monthPrefix,
      label: isThisMonth ? `${y}년 ${mo}월 (이번 달)` : `${y}년 ${mo}월`,
      pageviews: monthLogs.length,
      uniqueVisitors: new Set(monthLogs.map((l) => l.ip)).size,
    });
  }

  // (4) 연도별 추이 (최근 3개년)
  const currentYear = now.getFullYear();
  const yearlyTrend: TrendItem[] = [];
  for (let y = currentYear - 2; y <= currentYear; y++) {
    const yPrefix = String(y);
    const isThisYear = y === currentYear;
    const yearLogs = store.logs.filter((l) => (l.dateStr || '').startsWith(yPrefix));
    yearlyTrend.push({
      key: yPrefix,
      label: isThisYear ? `${y}년 (올해)` : `${y}년`,
      pageviews: yearLogs.length,
      uniqueVisitors: new Set(yearLogs.map((l) => l.ip)).size,
    });
  }

  return NextResponse.json({
    metrics: {
      liveUsers,
      todayDAU,
      weeklyWAU,
      monthlyMAU,
      totalPageviews,
      todayPageviews,
      totalAllTimeUsers,
      totalAppDownloads,
      provinceStats,
      dailyTrend,
      weeklyTrend,
      monthlyTrend,
      yearlyTrend,
      popularPages: store.popularPages,
      recentVisitors: store.logs.slice(-30).reverse(),
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

    const userRegion = body.userRegion || '경북 구미시';
    const homeCourse = body.homeCourse || '구미 동락 파크골프장';
    const userName = body.userName || '일반 골퍼';
    const isAppInstall = !!body.isAppInstall;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const log: VisitorLog = {
      id: Math.random().toString(36).substring(2, 9),
      ip: maskedIp,
      userAgent: userAgent.slice(0, 120),
      path: currentPath,
      referrer: referrer.slice(0, 100),
      timestamp: Date.now(),
      dateStr,
      timeStr,
      userRegion,
      homeCourse,
      userName,
      isAppInstall,
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
