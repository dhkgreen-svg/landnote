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

  const totalPageviews = store.logs.length;
  const todayLogs = store.logs.filter((l) => l.dateStr === todayStr);
  const todayPageviews = todayLogs.length;

  const uniqueIps = new Set(store.logs.map((l) => l.ip));
  const uniqueVisitors = uniqueIps.size;

  const todayUniqueIps = new Set(todayLogs.map((l) => l.ip));
  const todayUniqueVisitors = todayUniqueIps.size;

  // Daily trend (last 7 days)
  const dailyTrend: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dStr = d.toISOString().split('T')[0];
    dailyTrend[dStr] = store.logs.filter((l) => l.dateStr === dStr).length;
  }

  // Active rooms from server
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
      totalPageviews,
      todayPageviews,
      uniqueVisitors,
      todayUniqueVisitors,
      activeRoomsCount,
      activeRoomsList,
      popularPages: store.popularPages,
      dailyTrend,
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
    };

    const store = getAnalyticsStore();
    store.logs.push(log);

    if (store.logs.length > 2000) {
      store.logs = store.logs.slice(-2000);
    }

    store.popularPages[currentPath] = (store.popularPages[currentPath] || 0) + 1;
    saveAnalyticsStore(store);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
