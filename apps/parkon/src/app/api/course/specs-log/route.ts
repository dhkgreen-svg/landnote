import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getSupabaseClient } from '@/lib/serverMemberSync';

export interface CourseSpecBigDataLog {
  id: string;
  eventType: 'HOLE_SPEC_EDIT' | 'COURSE_INFO_EDIT' | 'ADD_ZONE_COURSE';
  courseId: string;
  courseName: string;
  aliases?: string[];
  region?: string;
  totalCourses?: number;
  totalHoles?: number;
  holeNumber?: number;
  courseLetter?: string;
  holeInCourse?: number;
  par?: number;
  distanceMeter?: number;
  contributorName?: string;
  memberCode?: string;
  createdAt: string;
}

const LOG_CACHE_FILE = path.join(os.tmpdir(), 'parkon_course_bigdata_logs.json');
const MAX_LOCAL_LOGS = 5000;

function getLogsStore(): CourseSpecBigDataLog[] {
  const g = globalThis as any;
  if (!g.__parkonCourseBigDataLogs) {
    g.__parkonCourseBigDataLogs = [];
    try {
      if (fs.existsSync(LOG_CACHE_FILE)) {
        const raw = fs.readFileSync(LOG_CACHE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          g.__parkonCourseBigDataLogs = parsed;
        }
      }
    } catch {
      // ignore read errors
    }
  }
  return g.__parkonCourseBigDataLogs as CourseSpecBigDataLog[];
}

function persistLogsStore(logs: CourseSpecBigDataLog[]) {
  try {
    fs.writeFileSync(
      LOG_CACHE_FILE,
      JSON.stringify(logs.slice(-MAX_LOCAL_LOGS), null, 2),
      'utf-8'
    );
  } catch {
    // ignore read-only fs errors on serverless
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.courseId || !body.courseName || !body.eventType) {
      return NextResponse.json(
        { success: false, message: '필수 구장 수정 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const entry: CourseSpecBigDataLog = {
      id: `bd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      eventType: body.eventType,
      courseId: String(body.courseId),
      courseName: String(body.courseName).trim(),
      aliases: Array.isArray(body.aliases)
        ? body.aliases.map((a: any) => String(a).trim()).filter(Boolean).slice(0, 10)
        : undefined,
      region: body.region ? String(body.region) : undefined,
      totalCourses: typeof body.totalCourses === 'number' ? body.totalCourses : undefined,
      totalHoles: typeof body.totalHoles === 'number' ? body.totalHoles : undefined,
      holeNumber: typeof body.holeNumber === 'number' ? body.holeNumber : undefined,
      courseLetter: body.courseLetter ? String(body.courseLetter) : undefined,
      holeInCourse: typeof body.holeInCourse === 'number' ? body.holeInCourse : undefined,
      par: typeof body.par === 'number' ? body.par : undefined,
      distanceMeter: typeof body.distanceMeter === 'number' ? body.distanceMeter : undefined,
      contributorName: body.contributorName ? String(body.contributorName).trim() : '현장 골퍼',
      memberCode: body.memberCode ? String(body.memberCode).trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    const logs = getLogsStore();
    logs.push(entry);
    if (logs.length > MAX_LOCAL_LOGS) {
      logs.splice(0, logs.length - MAX_LOCAL_LOGS);
    }
    persistLogsStore(logs);

    let stored: 'supabase' | 'local_cache' = 'local_cache';
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('parkon_course_spec_logs').insert([
          {
            id: entry.id,
            event_type: entry.eventType,
            course_id: entry.courseId,
            course_name: entry.courseName,
            aliases: entry.aliases || [],
            region: entry.region || null,
            total_courses: entry.totalCourses ?? null,
            total_holes: entry.totalHoles ?? null,
            hole_number: entry.holeNumber ?? null,
            course_letter: entry.courseLetter || null,
            hole_in_course: entry.holeInCourse ?? null,
            par: entry.par ?? null,
            distance_meter: entry.distanceMeter ?? null,
            contributor_name: entry.contributorName || null,
            member_code: entry.memberCode || null,
            created_at: entry.createdAt,
          },
        ]);
        if (!error) {
          stored = 'supabase';
        }
      }
    } catch {
      // graceful fallback to local cache if table isn't provisioned yet
    }

    return NextResponse.json({
      success: true,
      id: entry.id,
      stored,
      totalCollected: logs.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message || '빅데이터 수집 처리 중 오류' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  const limit = Math.min(200, Math.max(1, Number(searchParams.get('limit') || 50)));

  const logs = getLogsStore();
  const filtered = courseId ? logs.filter((l) => l.courseId === courseId) : logs;
  const recent = filtered.slice(-limit).reverse();

  // Compute quick consensus summary per course+hole
  const holeConsensus: Record<
    string,
    { courseName: string; holeLabel: string; par: number; distanceMeter: number; reports: number }
  > = {};
  for (const item of filtered) {
    if (item.eventType === 'HOLE_SPEC_EDIT' && item.holeNumber && item.par && item.distanceMeter) {
      const key = `${item.courseId}__${item.holeNumber}__${item.par}__${item.distanceMeter}`;
      if (!holeConsensus[key]) {
        holeConsensus[key] = {
          courseName: item.courseName,
          holeLabel: item.courseLetter && item.holeInCourse ? `${item.courseLetter}-${item.holeInCourse}` : `${item.holeNumber}`,
          par: item.par,
          distanceMeter: item.distanceMeter,
          reports: 0,
        };
      }
      holeConsensus[key].reports += 1;
    }
  }

  return NextResponse.json({
    success: true,
    totalLogs: filtered.length,
    recent,
    consensus: Object.values(holeConsensus).sort((a, b) => b.reports - a.reports).slice(0, 50),
  });
}
