import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createClient } from '@supabase/supabase-js';

export interface MemberSyncRecord {
  memberCode: string;
  userName?: string;
  phoneNumber?: string;
  profile?: any;
  kakaoUser?: any;
  completedRounds?: any[];
  companions?: any[];
  badges?: any;
  tour?: any;
  updatedAt: string;
}

const MEMBER_SYNC_CACHE_FILE = path.join(os.tmpdir(), 'parkon_member_sync_cache.json');

// Supabase client helper
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

const getMembersMap = (): Map<string, MemberSyncRecord> => {
  const g = globalThis as any;
  if (!g.__parkonMemberSync) {
    g.__parkonMemberSync = new Map<string, MemberSyncRecord>();
    try {
      if (fs.existsSync(MEMBER_SYNC_CACHE_FILE)) {
        const raw = fs.readFileSync(MEMBER_SYNC_CACHE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          g.__parkonMemberSync.set(k.toUpperCase().replace(/[^A-Z0-9]/g, ''), v as MemberSyncRecord);
        }
      }
    } catch (e) {
      console.error('Failed to load member sync records from disk:', e);
    }
  }
  return g.__parkonMemberSync;
};

const persistMembers = (members: Map<string, MemberSyncRecord>) => {
  try {
    const obj: Record<string, MemberSyncRecord> = {};
    members.forEach((v, k) => {
      obj[k] = v;
    });
    fs.writeFileSync(MEMBER_SYNC_CACHE_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to persist member sync records to disk:', e);
  }
};

function toHalfWidth(str: string): string {
  if (!str) return '';
  return str.replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ');
}

// GET /api/sync/member?code=... OR ?find=true&name=...&phone=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // 1. 성함 및 전화번호로 고유번호 찾기 (분실 시 조회)
  const isFindMode = searchParams.get('find') === 'true' || searchParams.has('name');
  if (isFindMode) {
    const searchName = (searchParams.get('name') || '').trim();
    const searchPhone = (searchParams.get('phone') || '').replace(/\D/g, '');
    const cleanSearchName = searchName.replace(/\s+/g, '');

    if (!cleanSearchName) {
      return NextResponse.json({ success: false, message: '성함을 입력해 주세요.' }, { status: 400 });
    }

    const map = getMembersMap();
    const matches: MemberSyncRecord[] = [];

    const checkMatch = (rec: MemberSyncRecord) => {
      const recName = (rec.userName || rec.profile?.userName || '').replace(/\s+/g, '');
      const recPhone = (rec.phoneNumber || (rec as any).userPhone || rec.profile?.phoneNumber || rec.profile?.phone || '').replace(/\D/g, '');

      // 이름 일치 검사
      const nameMatch = recName === cleanSearchName || (cleanSearchName.length >= 2 && recName.includes(cleanSearchName));
      // 전화번호 일치 검사 (전화번호가 입력된 경우 전체 또는 뒷 4자리 일치)
      const phoneMatch = !searchPhone || (recPhone && (recPhone.endsWith(searchPhone) || searchPhone.endsWith(recPhone)));

      return nameMatch && phoneMatch;
    };

    map.forEach((rec) => {
      if (checkMatch(rec)) {
        matches.push(rec);
      }
    });

    // Supabase 백업에서도 일치 회원 검색 (서버리스 인스턴스 재부팅 대응)
    if (matches.length === 0) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('parkon_analytics_logs')
            .select('*')
            .like('path', 'member_sync:%')
            .order('timestamp', { ascending: false })
            .limit(100);

          if (!error && Array.isArray(data)) {
            data.forEach((row: any) => {
              if (row.referrer) {
                try {
                  const rec = JSON.parse(row.referrer) as MemberSyncRecord;
                  if (rec && checkMatch(rec)) {
                    if (!matches.some((m) => m.memberCode === rec.memberCode)) {
                      matches.push(rec);
                    }
                  }
                } catch {}
              }
            });
          }
        } catch {}
      }
    }

    if (matches.length > 0) {
      return NextResponse.json({
        success: true,
        matches: matches.map((m) => ({
          memberCode: m.memberCode,
          userName: m.userName || m.profile?.userName || '골퍼',
          clubName: m.profile?.clubName || '',
          roundCount: m.completedRounds?.length || 0,
        })),
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: `입력하신 정보(성함: ${searchName}${searchPhone ? `, 전화번호: ${searchPhone}` : ''})와 일치하는 회원번호를 찾지 못했습니다.`,
      },
      { status: 404 }
    );
  }

  // 2. 7자리 고유번호로 데이터 단건 조회 (일본어 전각 지원)
  const rawCode = searchParams.get('code') || '';
  const cleanCode = toHalfWidth(rawCode).toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (!cleanCode) {
    return NextResponse.json({ success: false, message: '회원번호가 누락되었습니다.' }, { status: 400 });
  }

  const map = getMembersMap();
  let record = map.get(cleanCode);

  // Fallback to disk re-check
  if (!record && fs.existsSync(MEMBER_SYNC_CACHE_FILE)) {
    try {
      const diskObj = JSON.parse(fs.readFileSync(MEMBER_SYNC_CACHE_FILE, 'utf-8'));
      for (const [k, v] of Object.entries(diskObj)) {
        const normK = k.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (normK === cleanCode) {
          record = v as MemberSyncRecord;
          map.set(cleanCode, record);
          break;
        }
      }
    } catch {}
  }

  // Fallback to Supabase (parkon_analytics_logs)
  if (!record) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('parkon_analytics_logs')
          .select('*')
          .eq('path', `member_sync:${cleanCode}`)
          .order('timestamp', { ascending: false })
          .limit(1);

        if (!error && Array.isArray(data) && data.length > 0 && data[0].referrer) {
          try {
            record = JSON.parse(data[0].referrer) as MemberSyncRecord;
            map.set(cleanCode, record);
          } catch {}
        }
      } catch {}
    }
  }

  if (!record) {
    return NextResponse.json(
      { success: false, message: `회원번호(${rawCode})에 해당하는 저장된 데이터를 찾을 수 없습니다.` },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: record });
}

// POST /api/sync/member
export async function POST(req: NextRequest) {
  try {
    const body: MemberSyncRecord = await req.json();
    const rawCode = body.memberCode || '';
    const cleanCode = toHalfWidth(rawCode).toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!cleanCode) {
      return NextResponse.json({ success: false, message: '유효한 회원번호가 필요합니다.' }, { status: 400 });
    }

    const map = getMembersMap();
    let existing = map.get(cleanCode);
    if (!existing && fs.existsSync(MEMBER_SYNC_CACHE_FILE)) {
      try {
        const diskObj = JSON.parse(fs.readFileSync(MEMBER_SYNC_CACHE_FILE, 'utf-8'));
        existing = diskObj[cleanCode];
      } catch {}
    }

    // 완주 경기 기록(전적) 무손실 병합: 클라우드 기록과 클라이언트 기록의 합집합 보존
    const roundMap = new Map<string, any>();
    if (existing?.completedRounds && Array.isArray(existing.completedRounds)) {
      existing.completedRounds.forEach((r: any) => {
        const key = r.id || `${r.courseName}_${r.completedAt}`;
        roundMap.set(key, r);
      });
    }
    if (body.completedRounds && Array.isArray(body.completedRounds)) {
      body.completedRounds.forEach((r: any) => {
        const key = r.id || `${r.courseName}_${r.completedAt}`;
        roundMap.set(key, r);
      });
    }
    const mergedRounds = Array.from(roundMap.values()).sort((a: any, b: any) => {
      const tA = new Date(a.completedAt || 0).getTime();
      const tB = new Date(b.completedAt || 0).getTime();
      return tB - tA;
    });

    const record: MemberSyncRecord = {
      ...body,
      completedRounds: mergedRounds,
      memberCode: rawCode.includes('-') ? rawCode : (cleanCode.length === 7 ? `${cleanCode.slice(0, 3)}-${cleanCode.slice(3)}` : rawCode),
      phoneNumber: body.phoneNumber || (body as any).userPhone || body.profile?.phoneNumber || body.profile?.phone || existing?.phoneNumber || '',
      updatedAt: body.updatedAt || new Date().toISOString(),
    };

    map.set(cleanCode, record);
    persistMembers(map);

    // Supabase parkon_analytics_logs 에 영구 클라우드 보관
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase
            .from('parkon_analytics_logs')
            .insert([{
              id: `sync_${cleanCode}_${Date.now()}`,
              path: `member_sync:${cleanCode}`,
              referrer: JSON.stringify(record),
              userName: record.userName || '골퍼',
              homeCourse: record.memberCode,
              timestamp: Date.now(),
              dateStr: new Date().toISOString().slice(0, 10),
              timeStr: new Date().toTimeString().slice(0, 8),
            }]);
        } catch (err) {
          console.error('Supabase persistence error:', err);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      memberCode: record.memberCode,
      message: '회원 데이터가 클라우드에 안전하게 보관되었습니다.',
    });
  } catch (e: any) {
    console.error('Member sync POST error:', e);
    return NextResponse.json({ success: false, message: e?.message || '동기화 저장 실패' }, { status: 500 });
  }
}
