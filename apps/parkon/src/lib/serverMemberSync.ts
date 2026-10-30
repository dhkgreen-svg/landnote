import fs from 'fs';
import path from 'path';
import os from 'os';
import { createClient } from '@supabase/supabase-js';
import baselineMembersData from '@/data/member_sync_baseline.json';

export interface MemberSyncRecord {
  memberCode: string;
  userName?: string;
  phoneNumber?: string;
  altPhones?: string[];
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

export const FAKE_TEST_ROUND_IDS = new Set([
  'round_rec_1',
  'round_suseong_sample',
  'round_kim_gumi_20261002',
  'round_live_1791117870020',
  'round_chronicle_4players_test',
  'round_plana_test_1',
  'round_ceo_photo_download_01',
  'round_verified_field_01',
  'round_fast_mock_02',
  'round_to_delete_03',
  'round_1791008874732',
  'round_1791008230171',
  'round_27h_abc_field',
  'round_27h_abc_test',
  'round_test_abc_multicourse',
  'round_1791111047887',
]);

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

export function isMockOrCorruptedRound(r: any): boolean {
  if (!r) return true;
  if (typeof r.id === 'string' && (FAKE_TEST_ROUND_IDS.has(r.id) || r.id.startsWith('mock_') || r.id.startsWith('sample_'))) {
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
  return false;
}

export function isInvalidOrPlaceholderPlayerName(name?: string | null): boolean {
  if (!name) return true;
  const clean = name.trim();
  if (clean.length < 2 || /[ㄱ-ㅎㅏ-ㅣ]/.test(clean) || /^\d+$/.test(clean)) return true;
  const lower = clean.toLowerCase();
  if (
    lower === '플레이스홀더' ||
    lower === '플레이어' ||
    lower === '홍길동' ||
    lower === '손오공' ||
    lower === '조장' ||
    lower === '본인' ||
    lower === '회원' ||
    lower === '파크골퍼' ||
    lower === '골퍼' ||
    lower === '게스트' ||
    lower === '동반 게스트' ||
    lower === '선수' ||
    lower.startsWith('동반자') ||
    lower.startsWith('게스트') ||
    lower.startsWith('조장 ') ||
    lower.startsWith('player') ||
    lower.startsWith('同伴') ||
    lower.startsWith('ゲスト')
  ) {
    return true;
  }
  return false;
}

export const getMembersMap = (): Map<string, MemberSyncRecord> => {
  const g = globalThis as any;
  if (!g.__parkonMemberSyncV3) {
    g.__parkonMemberSyncV3 = new Map<string, MemberSyncRecord>();
    try {
      if (baselineMembersData && typeof baselineMembersData === 'object') {
        for (const [k, v] of Object.entries(baselineMembersData)) {
          const rec = v as MemberSyncRecord;
          if (rec && Array.isArray(rec.completedRounds)) {
            rec.completedRounds = rec.completedRounds.filter((r) => !isMockOrCorruptedRound(r));
          }
          g.__parkonMemberSyncV3.set(k.toUpperCase().replace(/[^A-Z0-9]/g, ''), rec);
        }
      }
    } catch (e) {
      console.error('Failed to load baseline member sync records:', e);
    }
    try {
      if (fs.existsSync(MEMBER_SYNC_CACHE_FILE)) {
        const raw = fs.readFileSync(MEMBER_SYNC_CACHE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          const rec = v as MemberSyncRecord;
          if (rec && Array.isArray(rec.completedRounds)) {
            rec.completedRounds = rec.completedRounds.filter((r) => !isMockOrCorruptedRound(r));
          }
          g.__parkonMemberSyncV3.set(k.toUpperCase().replace(/[^A-Z0-9]/g, ''), rec);
        }
      }
    } catch (e) {
      console.error('Failed to load member sync records from disk:', e);
    }
  }
  return g.__parkonMemberSyncV3;
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

/**
 * 4인 조별 라운드 종료 시(조장의 최종 스코어 제출),
 * 조에 속한 기존 등록 정회원 동반자들의 계정에 공식 스코어카드를 무손실 영구 저장
 * (미가입 임시 이름 '동반자 1', '게스트' 등으로 유령 회원이 생성되는 현상 원천 차단)
 */
export async function saveCompletedRoundForAllPlayers(roundSession: any, skipPersist = false): Promise<void> {
  if (!roundSession || !roundSession.players || !Array.isArray(roundSession.players)) return;
  if (roundSession.isVirtual || roundSession.isOfficial === false) return;

  const map = getMembersMap();
  let updatedAny = false;

  for (const player of roundSession.players) {
    if (!player) continue;
    const playerName = (player.name || '').trim();
    if (isInvalidOrPlaceholderPlayerName(playerName)) continue;

    // 해당 선수 본인(isSelf: true) 관점의 스코어카드 생성
    const playerSpecificRound = {
      ...roundSession,
      status: 'COMPLETED',
      isOfficial: true,
      players: roundSession.players.map((p: any) => ({
        ...p,
        isSelf: p.id === player.id || (playerName && p.name === playerName),
      })),
    };

    // 기존 등록된 정회원 매핑 확인 (player.memberCode, player.id 또는 성함 일치 검색)
    let foundKey: string | null = null;
    let record: MemberSyncRecord | undefined = undefined;

    const normMemberCode = toHalfWidth(player.memberCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (normMemberCode && map.has(normMemberCode)) {
      foundKey = normMemberCode;
      record = map.get(normMemberCode);
    }

    const normPlayerId = toHalfWidth(player.id || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!record && normPlayerId && normPlayerId.startsWith('PKY') && map.has(normPlayerId)) {
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

    // 정회원으로 등록된 계정이 있는 경우에만 완주 기록 병합 (유령 계정 자동 생성 금지)
    if (!record || !foundKey) {
      continue;
    }

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

    record.completedRounds = Array.from(roundMap.values()).sort((a: any, b: any) => {
      const tA = new Date(a.completedAt || 0).getTime();
      const tB = new Date(b.completedAt || 0).getTime();
      return tB - tA;
    });
    record.updatedAt = new Date().toISOString();
    map.set(foundKey, record);
    updatedAny = true;
  }

  if (updatedAny && !skipPersist) {
    persistMembers(map);
  }
}
