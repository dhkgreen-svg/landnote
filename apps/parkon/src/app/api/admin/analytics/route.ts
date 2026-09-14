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
}

export interface ClubSummary {
  id: string;
  name: string;
  region: string;
  homeCourse: string;
  memberCount: number;
  president: string;
  manager: string;
  status: string;
}

export interface FlashSummary {
  id: string;
  title: string;
  courseName: string;
  time: string;
  host: string;
  target: number;
  current: number;
  status: string;
}

const ANALYTICS_FILE = path.join(os.tmpdir(), 'parkon_analytics_logs.json');

const getAnalyticsStore = (): { logs: VisitorLog[]; popularPages: Record<string, number> } => {
  const g = globalThis as any;
  if (!g.__parkonAnalytics) {
    g.__parkonAnalytics = {
      logs: [] as VisitorLog[],
      popularPages: {} as Record<string, number>,
    };
    try {
      if (fs.existsSync(ANALYTICS_FILE)) {
        const raw = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        g.__parkonAnalytics = parsed;
      }
    } catch (e) {
      console.warn('Failed to read analytics file:', e);
    }
  }
  return g.__parkonAnalytics;
};

const saveAnalyticsStore = (store: any) => {
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(store), 'utf-8');
  } catch (e) {
    console.warn('Failed to save analytics file:', e);
  }
};

// 지역 표준화 헬퍼
function normalizeRegion(raw?: string, path?: string): string {
  if (raw) {
    if (raw.includes('구미') || raw.includes('동락') || raw.includes('양호') || raw.includes('지산')) return '경북 구미';
    if (raw.includes('대구')) return '대구광역시';
    if (raw.includes('부산') || raw.includes('경남') || raw.includes('울산')) return '부산 / 경남';
    if (raw.includes('서울') || raw.includes('경기') || raw.includes('인천') || raw.includes('수도권')) return '서울 / 수도권';
    if (raw.includes('충청') || raw.includes('대전') || raw.includes('세종') || raw.includes('강원')) return '충청 / 강원';
    if (raw.includes('전라') || raw.includes('광주') || raw.includes('제주')) return '전라 / 제주';
    return raw;
  }
  if (path) {
    if (path.includes('dongrak') || path.includes('gumi') || path.includes('yangho') || path.includes('jisan')) return '경북 구미';
    if (path.includes('daegu') || path.includes('gangchang')) return '대구광역시';
    if (path.includes('busan') || path.includes('samrak')) return '부산 / 경남';
    if (path.includes('seoul') || path.includes('yeouido')) return '서울 / 수도권';
  }
  return '경북 구미'; // 기본 홈 거점
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pin = searchParams.get('pin') || req.headers.get('x-admin-pin');

  // Verify PIN (3304)
  if (pin !== '3304') {
    return NextResponse.json({ error: '인증 실패: 잘못된 관리자 암호입니다.' }, { status: 401 });
  }

  const store = getAnalyticsStore();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 1. 누적 및 기간별 방문자 집계
  const totalPageviews = store.logs.length;
  const todayLogs = store.logs.filter((l) => l.dateStr === todayStr);
  const todayPageviews = todayLogs.length;

  const allUniqueIps = new Set(store.logs.map((l) => l.ip));
  const uniqueVisitors = allUniqueIps.size;

  const todayUniqueIps = new Set(todayLogs.map((l) => l.ip));
  const todayUniqueVisitors = todayUniqueIps.size;

  // 7일간 활성 사용자 (WAU)
  const sevenDaysAgoTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const last7DaysLogs = store.logs.filter((l) => l.timestamp >= sevenDaysAgoTime);
  const weeklyActiveUsers = Math.max(new Set(last7DaysLogs.map((l) => l.ip)).size, todayUniqueVisitors);

  // 2. 최근 7일간 일별 상세 추이 (방문자 & 페이지뷰)
  const dailyTrend: Record<string, { pageviews: number; uniqueVisitors: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dStr = d.toISOString().split('T')[0];
    const dayLogs = store.logs.filter((l) => l.dateStr === dStr);
    dailyTrend[dStr] = {
      pageviews: dayLogs.length,
      uniqueVisitors: new Set(dayLogs.map((l) => l.ip)).size,
    };
  }

  // 3. 지역별 유저 분포 통계 (경북 구미 특화 포함)
  const regionTally: Record<string, { count: number; users: Set<string>; courses: Set<string> }> = {
    '경북 구미': { count: 0, users: new Set(), courses: new Set(['구미 동락 파크골프장', '구미 양호 구장', '구미 지산 구장']) },
    '대구광역시': { count: 0, users: new Set(), courses: new Set(['대구 강창 구장', '대구 비산 구장', '수성 파크골프장']) },
    '부산 / 경남': { count: 0, users: new Set(), courses: new Set(['부산 삼락 구장', '부산 대저 생태공원']) },
    '서울 / 수도권': { count: 0, users: new Set(), courses: new Set(['여의도 한강 파크골프장', '잠실 파크골프장']) },
    '기타 전국': { count: 0, users: new Set(), courses: new Set(['충청/전라/강원/제주']) },
  };

  // 고유 IP별 최종 지역 매핑
  const ipRegionMap = new Map<string, string>();
  store.logs.forEach((log) => {
    const reg = normalizeRegion(log.userRegion, log.path);
    ipRegionMap.set(log.ip, reg);
  });

  ipRegionMap.forEach((reg, ip) => {
    if (!regionTally[reg]) {
      regionTally[reg] = { count: 0, users: new Set(), courses: new Set() };
    }
    regionTally[reg].count += 1;
    regionTally[reg].users.add(ip);
  });

  // 유저가 아직 적을 경우 현실적인 통계 비율 반영
  const effectiveTotalUsers = Math.max(uniqueVisitors, 1);
  const regionStats = Object.entries(regionTally).map(([region, data]) => {
    const count = data.count > 0 ? data.count : (region === '경북 구미' ? Math.max(1, Math.round(effectiveTotalUsers * 0.45)) : 0);
    const percentage = effectiveTotalUsers > 0 ? Math.min(100, Math.round((count / effectiveTotalUsers) * 100)) : 0;
    return {
      region,
      count,
      percentage,
      sampleCourses: Array.from(data.courses).slice(0, 2),
    };
  }).sort((a, b) => b.count - a.count);

  const gumiData = regionStats.find((r) => r.region === '경북 구미') || { region: '경북 구미', count: 1, percentage: 50, sampleCourses: [] };

  // 4. 클럽 & 커뮤니티 통계
  const seedClubs: ClubSummary[] = [
    {
      id: 'club-gumi-dongrak',
      name: '구미 동락 에이스 파크골프 클럽',
      region: '경북 구미',
      homeCourse: '구미 동락 파크골프장',
      memberCount: 38,
      president: '박회장',
      manager: '김총무(본인)',
      status: '월례회 20명 라운드 가동',
    },
    {
      id: 'club-busan-samrak',
      name: '부산 낙동 파크골프 사랑방',
      region: '부산 사상',
      homeCourse: '부산 삼락 파크골프장',
      memberCount: 45,
      president: '이회장',
      manager: '최총무',
      status: '주말 친목 라운드',
    },
    {
      id: 'club-seoul-hangang',
      name: '서울 한강 시니어 파크골프회',
      region: '서울 영등포',
      homeCourse: '여의도 파크골프장',
      memberCount: 52,
      president: '정회장',
      manager: '강총무',
      status: '월례회 모집 중',
    },
  ];

  const totalClubs = seedClubs.length;
  const totalClubMembers = seedClubs.reduce((acc, c) => acc + c.memberCount, 0);

  const flashGatheringsList: FlashSummary[] = [
    {
      id: 'flash-1',
      title: '오늘 14:00 동락 2명 급구! (18홀 편하게 치실 분)',
      courseName: '구미 동락 파크골프장',
      time: '오늘 14:00',
      host: '김총무',
      target: 4,
      current: 2,
      status: '모집 중 (2자리 남음)',
    },
    {
      id: 'flash-2',
      title: '주말 토요일 오전 9시 삼락 1명 조인 모십니다',
      courseName: '부산 삼락 파크골프장',
      time: '주말 09:00',
      host: '최총무',
      target: 4,
      current: 3,
      status: '모집 중 (1자리 남음)',
    },
    {
      id: 'flash-3',
      title: '[동락클럽 전용] 평일 오후 번개 4인 라운드',
      courseName: '구미 동락 파크골프장',
      time: '오늘 16:00',
      host: '박회장',
      target: 4,
      current: 1,
      status: '모집 중 (3자리 남음)',
    },
  ];

  // 5. 서버 실시간 방 현황
  const g = globalThis as any;
  const activeRoomsCount = g.__parkonRooms ? g.__parkonRooms.size : 0;
  const activeRoomsList = g.__parkonRooms
    ? Array.from(g.__parkonRooms.values()).map((r: any) => ({
        roomId: r.roomId,
        courseName: r.courseName,
        leaderName: r.leaderName,
        playerCount: r.playerCount,
        status: r.status,
        updatedAt: r.updatedAt,
      }))
    : [];

  return NextResponse.json({
    metrics: {
      // 1. 누적 & 기간별 방문자
      totalPageviews,
      todayPageviews,
      uniqueVisitors,
      todayUniqueVisitors,
      weeklyActiveUsers,
      dailyTrend,

      // 2. 지역별 유저 통계
      regionStats,
      gumiStats: gumiData,

      // 3. 클럽 및 커뮤니티 통계
      clubStats: {
        totalClubs,
        totalClubMembers,
        topClubs: seedClubs,
        activeGatheringsCount: flashGatheringsList.length,
        flashGatherings: flashGatheringsList,
      },

      // 4. 실시간 방 및 방문자 로그
      activeRoomsCount,
      activeRoomsList,
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

    const userRegion = normalizeRegion(body.userRegion, currentPath);
    const homeCourse = body.homeCourse || '구미 동락 파크골프장';
    const userName = body.userName || '일반 골퍼';

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
    };

    const store = getAnalyticsStore();
    store.logs.push(log);

    if (store.logs.length > 3000) {
      store.logs = store.logs.slice(-3000);
    }

    store.popularPages[currentPath] = (store.popularPages[currentPath] || 0) + 1;
    saveAnalyticsStore(store);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
