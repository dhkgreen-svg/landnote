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

export interface ProvinceStat {
  code: string;
  name: string;
  userCount: number;
  userPercentage: number;
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

// 지역 표준화 헬퍼 (전국 17개 시도 매핑)
function normalizeRegion(raw?: string, path?: string): string {
  if (raw) {
    if (raw.includes('구미')) return '경북 구미시';
    if (raw.includes('포항')) return '경북 포항시';
    if (raw.includes('경북')) return '경상북도';
    if (raw.includes('대구')) return '대구광역시';
    if (raw.includes('부산')) return '부산광역시';
    if (raw.includes('창원') || raw.includes('김해') || raw.includes('경남')) return '경상남도';
    if (raw.includes('울산')) return '울산광역시';
    if (raw.includes('서울')) return '서울특별시';
    if (raw.includes('경기') || raw.includes('수원') || raw.includes('성남')) return '경기도';
    if (raw.includes('인천')) return '인천광역시';
    if (raw.includes('대전') || raw.includes('세종') || raw.includes('충남')) return '충청남도/대전';
    if (raw.includes('충북') || raw.includes('청주')) return '충청북도';
    if (raw.includes('광주') || raw.includes('전남')) return '전라남도/광주';
    if (raw.includes('전북') || raw.includes('전주')) return '전라북도';
    if (raw.includes('강원') || raw.includes('춘천')) return '강원특별자치도';
    if (raw.includes('제주')) return '제주특별자치도';
    return raw;
  }
  if (path) {
    if (path.includes('dongrak') || path.includes('gumi') || path.includes('yangho') || path.includes('jisan')) return '경북 구미시';
    if (path.includes('daegu') || path.includes('gangchang')) return '대구광역시';
    if (path.includes('busan') || path.includes('samrak')) return '부산광역시';
    if (path.includes('seoul') || path.includes('yeouido')) return '서울특별시';
  }
  return '경북 구미시'; // 기본 홈 베이스
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pin = searchParams.get('pin') || req.headers.get('x-admin-pin');

  // Verify Master PIN (768517)
  if (pin !== '768517') {
    return NextResponse.json({ error: '인증 실패: 잘못된 관리자 암호입니다.' }, { status: 401 });
  }

  const store = getAnalyticsStore();
  const now = new Date();
  const nowTime = now.getTime();
  const todayStr = now.toISOString().split('T')[0];

  // 1. [100% 실측 기간별 실사용자 집계]
  // (1) 현재 실시간 접속자 (최근 10분 내 활동 유저)
  const tenMinsAgo = nowTime - 10 * 60 * 1000;
  const liveLogs = store.logs.filter((l) => l.timestamp >= tenMinsAgo);
  const liveUsers = new Set(liveLogs.map((l) => l.ip)).size;

  // (2) 일일 총 누적 (Today DAU)
  const todayLogs = store.logs.filter((l) => l.dateStr === todayStr);
  const todayPageviews = todayLogs.length;
  const todayDAU = new Set(todayLogs.map((l) => l.ip)).size;

  // (3) 일주일 7일 총 누적 (7-Day WAU)
  const sevenDaysAgoTime = nowTime - 7 * 24 * 60 * 60 * 1000;
  const last7DaysLogs = store.logs.filter((l) => l.timestamp >= sevenDaysAgoTime);
  const weeklyWAU = new Set(last7DaysLogs.map((l) => l.ip)).size;

  // (4) 한 달 30일 총 누적 (30-Day MAU)
  const thirtyDaysAgoTime = nowTime - 30 * 24 * 60 * 60 * 1000;
  const last30DaysLogs = store.logs.filter((l) => l.timestamp >= thirtyDaysAgoTime);
  const monthlyMAU = new Set(last30DaysLogs.map((l) => l.ip)).size;

  // 총 누적 페이지뷰 & 총 방문자
  const totalPageviews = store.logs.length;
  const allUniqueIps = new Set(store.logs.map((l) => l.ip));
  const totalUniqueVisitors = allUniqueIps.size;

  // 2. [전국 8도 및 광역시·제주도별 통합 누계 (17개 시도)]
  // 실제 고유 유저의 IP별 최종 지역 매핑
  const ipRegionMap = new Map<string, string>();
  store.logs.forEach((log) => {
    const reg = normalizeRegion(log.userRegion, log.path);
    ipRegionMap.set(log.ip, reg);
  });

  // 전국 16개 광역시·도별 실제 방문자 분포 (가상 클럽 및 가상 통계 완전 제거)
  const baseProvinces: Array<{ code: string; name: string }> = [
    { code: 'GB', name: '경북' },
    { code: 'DG', name: '대구' },
    { code: 'US', name: '울산' },
    { code: 'BS', name: '부산' },
    { code: 'GN', name: '경남' },
    { code: 'SO', name: '서울' },
    { code: 'GG', name: '경기' },
    { code: 'IC', name: '인천' },
    { code: 'GW', name: '강원' },
    { code: 'CB', name: '충북' },
    { code: 'CN', name: '충남' },
    { code: 'DJ', name: '대전/세종' },
    { code: 'JB', name: '전북' },
    { code: 'JN', name: '전남' },
    { code: 'GJ', name: '광주' },
    { code: 'JJ', name: '제주' },
  ];

  const totalRealVisitors = Math.max(totalUniqueVisitors, 1);

  const provinceStats: ProvinceStat[] = baseProvinces.map((prov) => {
    let count = 0;
    ipRegionMap.forEach((reg) => {
      const r = reg.toLowerCase();
      if (
        (prov.code === 'GB' && (r.includes('경북') || r.includes('경상북도') || r.includes('구미') || r.includes('포항') || r.includes('경주') || r.includes('김천') || r.includes('안동'))) ||
        (prov.code === 'DG' && (r.includes('대구') || r.includes('달서') || r.includes('수성') || r.includes('북구'))) ||
        (prov.code === 'US' && (r.includes('울산') || r.includes('태화'))) ||
        (prov.code === 'BS' && (r.includes('부산') || r.includes('사상') || r.includes('강서') || r.includes('해운대'))) ||
        (prov.code === 'GN' && (r.includes('경남') || r.includes('경상남도') || r.includes('창원') || r.includes('김해') || r.includes('진주') || r.includes('양산'))) ||
        (prov.code === 'SO' && (r.includes('서울') || r.includes('영등포') || r.includes('송파') || r.includes('마포') || r.includes('강남'))) ||
        (prov.code === 'GG' && (r.includes('경기') || r.includes('수원') || r.includes('성남') || r.includes('용인') || r.includes('고양') || r.includes('남양주'))) ||
        (prov.code === 'IC' && (r.includes('인천') || r.includes('청라') || r.includes('송도') || r.includes('연수'))) ||
        (prov.code === 'GW' && (r.includes('강원') || r.includes('춘천') || r.includes('원주') || r.includes('강릉') || r.includes('화천'))) ||
        (prov.code === 'CB' && (r.includes('충북') || r.includes('충청북도') || r.includes('청주') || r.includes('충주') || r.includes('제천'))) ||
        (prov.code === 'CN' && (r.includes('충남') || r.includes('충청남도') || r.includes('천안') || r.includes('아산') || r.includes('공주') || r.includes('서산'))) ||
        (prov.code === 'DJ' && (r.includes('대전') || r.includes('세종') || r.includes('유성'))) ||
        (prov.code === 'JB' && (r.includes('전북') || r.includes('전라북도') || r.includes('전주') || r.includes('익산') || r.includes('군산'))) ||
        (prov.code === 'JN' && (r.includes('전남') || r.includes('전라남도') || r.includes('순천') || r.includes('목포') || r.includes('여수') || r.includes('나주'))) ||
        (prov.code === 'GJ' && (r.includes('광주') || r.includes('광산'))) ||
        (prov.code === 'JJ' && (r.includes('제주') || r.includes('서귀포')))
      ) {
        count++;
      }
    });

    const percentage = totalUniqueVisitors > 0 ? Math.round((count / totalRealVisitors) * 100) : 0;
    return {
      code: prov.code,
      name: prov.name,
      userCount: count,
      userPercentage: percentage,
    };
  }).sort((a, b) => b.userCount - a.userCount);

  // 3. [최근 7일간 일별 상세 추이 (100% 실측)]
  const dailyTrend: Record<string, { pageviews: number; uniqueVisitors: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(nowTime - i * 24 * 60 * 60 * 1000);
    const dStr = d.toISOString().split('T')[0];
    const dayLogs = store.logs.filter((l) => l.dateStr === dStr);
    dailyTrend[dStr] = {
      pageviews: dayLogs.length,
      uniqueVisitors: new Set(dayLogs.map((l) => l.ip)).size,
    };
  }

  return NextResponse.json({
    metrics: {
      liveUsers,
      todayDAU,
      weeklyWAU,
      monthlyMAU,
      totalPageviews,
      todayPageviews,
      totalUniqueVisitors,
      provinceStats,
      dailyTrend,
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
