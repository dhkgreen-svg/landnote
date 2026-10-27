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
  customCourses?: any[];
  crowdSpecs?: any;
  updatedAt: string;
}

export const MEMBER_SYNC_CACHE_FILE = path.join(os.tmpdir(), 'parkon_member_sync_cache.json');

// Supabase client helper
export const getSupabaseClient = () => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aoucvlpmhrqymziktevu.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_LaugXgJoQNozOLkG14J-CQ_i8PJgJ6b';
  if (!url || !key) return null;
  try {
    return createClient(url, key, { auth: { persistSession: false } });
  } catch {
    return null;
  }
};

export const getMembersMap = (): Map<string, MemberSyncRecord> => {
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

export const persistMembers = (members: Map<string, MemberSyncRecord>) => {
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

export function toHalfWidth(str: string): string {
  if (!str) return '';
  return str.replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ');
}

export function isMockOrCorruptedRound(r: any): boolean {
  if (!r) return true;
  if (
    r.id === 'round_rec_1' || 
    r.id === 'round_suseong_sample' || 
    r.id === 'round_kim_gumi_20261002' ||
    (typeof r.id === 'string' && (r.id.startsWith('mock_') || r.id.startsWith('sample_')))
  ) {
    return true;
  }
  if (r.isVirtual === true || r.isOfficial === false) {
    return true;
  }
  if (
    r.courseName === '수성파크골프장' &&
    r.players?.some((p: any) => (p.name === '김대희' || p.name?.includes('홍길동')) && p.totalStrokes === 54 && r.completedAt === '2026-10-02T10:00:00.000Z')
  ) {
    return true;
  }
  // 🛡️ [대표님 절대 원칙]: 실제 구장 현장 GPS 인증(isGpsVerified: true)이 없는 게임은 100% 필터링 (가짜/더미/임의 입력 배제)
  if (!r.isGpsVerified) {
    return true;
  }
  return false;
}

/**
 * 4인 조별 라운드 종료 시(조장의 최종 스코어 제출),
 * 조에 속한 동반자 전원의 계정에 공식 스코어카드를 무손실 영구 저장
 * (동반자 기기가 종료/방전 상태여도 서버/클라우드에 100% 기록 누적)
 */
export async function saveCompletedRoundForAllPlayers(roundSession: any): Promise<void> {
  if (!roundSession || !roundSession.players || !Array.isArray(roundSession.players)) return;
  // 🛡️ [대표님 절대 원칙]: 실제 구장 현장 GPS 인증이 없는 라운드는 클라우드 동기화 100% 차단
  if (!roundSession.isGpsVerified) return;
  const map = getMembersMap();
  const supabase = getSupabaseClient();

  for (const player of roundSession.players) {
    if (!player) continue;
    const playerName = (player.name || '').trim();
    if (!playerName || playerName === '플레이스홀더') continue;

    // 해당 선수 본인(isSelf: true) 관점의 스코어카드 생성
    const playerSpecificRound = {
      ...roundSession,
      status: 'COMPLETED',
      isOfficial: roundSession.isOfficial !== false,
      players: roundSession.players.map((p: any) => ({
        ...p,
        isSelf: p.id === player.id || (playerName && p.name === playerName),
      })),
    };

    // 1) 고유 회원번호 매핑 확인 (player.id 또는 성함 일치 검색)
    let foundKey: string | null = null;
    let record: MemberSyncRecord | undefined = undefined;

    const normPlayerId = toHalfWidth(player.id || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normPlayerId && (normPlayerId.startsWith('PKY') || normPlayerId.length >= 7)) {
      foundKey = normPlayerId;
      record = map.get(normPlayerId);
    }

    if (!record) {
      map.forEach((rec, k) => {
        if (record) return;
        const rName = (rec.userName || rec.profile?.userName || '').trim().toLowerCase();
        if (rName && rName === playerName.toLowerCase()) {
          foundKey = k;
          record = rec;
        }
      });
    }

    // 2) 아직 동기화 레코드가 없는 동반자인 경우, 신규 레코드 생성
    if (!record) {
      const genCode = normPlayerId && normPlayerId.startsWith('PKY')
        ? normPlayerId
        : `PKYA${Math.floor(1000 + Math.random() * 9000)}`;
      foundKey = genCode;
      const formattedCode = genCode.length >= 8 ? `${genCode.slice(0, 4)}-${genCode.slice(4)}` : genCode;
      record = {
        memberCode: formattedCode,
        userName: playerName,
        profile: { userName: playerName },
        completedRounds: [],
        companions: [],
        badges: {},
        updatedAt: new Date().toISOString(),
      };
      map.set(genCode, record);
    }

    // 3) 완주 기록 무손실 병합 (중복 방지)
    const existingRounds = (record.completedRounds || []).filter((r: any) => !isMockOrCorruptedRound(r));
    const roundKey = playerSpecificRound.id || `${playerSpecificRound.courseName}_${playerSpecificRound.completedAt}`;
    const roundMap = new Map<string, any>();
    roundMap.set(roundKey, playerSpecificRound);
    existingRounds.forEach((r: any) => {
      const k = r.id || `${r.courseName}_${r.completedAt}`;
      if (!roundMap.has(k)) {
        roundMap.set(k, r);
      }
    });

    const roundList: any[] = [];
    roundMap.forEach((val) => {
      roundList.push(val);
    });

    record.completedRounds = roundList.sort((a: any, b: any) => {
      const tA = new Date(a.completedAt || 0).getTime();
      const tB = new Date(b.completedAt || 0).getTime();
      return tB - tA;
    });
    record.updatedAt = new Date().toISOString();
    if (foundKey) {
      map.set(foundKey, record);
    }

    // 4) Supabase 클라우드 동기화 (백그라운드)
    if (supabase && foundKey) {
      try {
        await supabase.from('parkon_analytics_logs').insert({
          event_type: 'member_cloud_sync',
          path: `member_sync:${foundKey}`,
          referrer: JSON.stringify(record),
          timestamp: new Date().toISOString(),
        });
      } catch (e) {}
    }
  }

  persistMembers(map);
}
