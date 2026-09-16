import { RoundSession } from '@/types/parkon';
import { UserBusinessCard } from '@/types/businessCard';
import { supabase } from './supabase';
import { ParkOnStorage } from './storage';

export interface Companionship {
  id: string;
  userId: string;
  companionId: string;
  companionName: string;
  roundCount: number;
  lastPlayedAt: string;
  lastCourseName?: string;
  createdAt: string;
  avatarColor?: string;
  memo?: string;
  businessCard?: UserBusinessCard;
}

export type CheerReactionType = 'NICE_SHOT' | 'CONGRATS' | 'FIGHTING';

export interface CheerFeedItem {
  id: string;
  companionId: string;
  companionName: string;
  courseName: string;
  actionText: string;
  scoreSummary?: string;
  timestamp: string;
  timeAgoStr: string;
  isPlaying?: boolean;
  cheers: Record<CheerReactionType, number>;
  myCheer?: CheerReactionType;
}

export interface CompanionLightningRound {
  id: string;
  hostId: string;
  hostName: string;
  courseId: string;
  courseName: string;
  dateStr: string; // '오늘', '내일', etc.
  timeStr: string; // '14:30'
  targetPlayersCount: number; // 4인 번개: 4명, 4인 이상 번개: 999 (무제한)
  lightningScope?: 'FOUR_PLAYERS' | 'MULTI_OPEN'; // 4인 번개 vs 4인 이상 무제한 번개
  invited1ChonNames?: string[]; // 초대 대상 1촌 이름 목록
  acceptedPlayers?: Array<{ id: string; name: string; isHost: boolean; acceptedAt: string }>; // 수락 완료 동반자
  currentPlayers: Array<{ id: string; name: string; isHost: boolean }>;
  notes: string;
  tags: string[];
  status: 'RECRUITING' | 'FULL' | 'STARTED';
  createdAt: string;
}

const STORAGE_KEYS = {
  COMPANIONS: 'parkon_companions_v1',
  CHEER_FEED: 'parkon_cheer_feed_v1',
  LIGHTNING_ROUNDS: 'parkon_companion_lightning_v1',
};

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-blue-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-teal-600',
  'bg-rose-600',
];

const DEFAULT_COMPANIONS: Companionship[] = [];

const DEFAULT_FEED_ITEMS: CheerFeedItem[] = [];

export const CompanionStorage = {
  // 1. 1촌 목록 조회
  getCompanions(): Companionship[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPANIONS);
      if (!data) return [];
      const parsed: Companionship[] = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      // Clean out legacy mock companions
      return parsed.filter(
        (c) =>
          c &&
          c.companionId !== 'user_lee_yh' &&
          c.companionId !== 'user_park_cs' &&
          c.companionId !== 'user_jung_sj' &&
          !c.id.startsWith('comp_')
      );
    } catch {
      return [];
    }
  },

  // 2. 1촌 저장
  saveCompanions(list: Companionship[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANIONS, JSON.stringify(list));
      window.dispatchEvent(new Event('parkon_companion_updated'));
    } catch (e) {
      console.error('Failed to save companions:', e);
    }
  },

  // 3. 1촌 단건 추가 / 업데이트 (QR 연결 및 수동 연결)
  addOrUpdateCompanion(
    companionName: string,
    lastCourseName?: string,
    companionId?: string,
    customMemo?: string
  ): Companionship {
    const list = this.getCompanions();
    const cleanName = companionName.trim();
    const targetId = companionId || `comp_${cleanName}_${Date.now()}`;

    const existingIdx = list.findIndex(
      (c) => c.companionName === cleanName || (companionId && c.companionId === companionId)
    );

    let result: Companionship;

    if (existingIdx >= 0) {
      const existing = list[existingIdx];
      result = {
        ...existing,
        companionName: cleanName,
        roundCount: existing.roundCount + 1,
        lastPlayedAt: new Date().toISOString(),
        lastCourseName: lastCourseName || existing.lastCourseName,
        memo: customMemo || existing.memo,
      };
      list[existingIdx] = result;
    } else {
      const randomColor = AVATAR_COLORS[list.length % AVATAR_COLORS.length];
      result = {
        id: `comp_rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: 'self',
        companionId: targetId,
        companionName: cleanName,
        roundCount: 1,
        lastPlayedAt: new Date().toISOString(),
        lastCourseName: lastCourseName || '전국 파크골프장',
        createdAt: new Date().toISOString(),
        avatarColor: randomColor,
        memo: customMemo || '새로 맺은 1촌 동반자',
      };
      list.unshift(result);
    }

    this.saveCompanions(list);
    this.syncToCloud(result);
    return result;
  },

  // 4. 라운드 완료 시 자동 1촌 연결 & 누적 횟수 증가 (핵심 락인 로직)
  autoConnectRoundCompanions(session: RoundSession): Companionship[] {
    if (!session.players || session.players.length === 0) return [];

    const selfName = ParkOnStorage.getUserDisplayName();
    // Identify companions who are not self
    const companions = session.players.filter((p) => {
      if (p.isSelf) return false;
      const pName = p.name.trim();
      if (pName === selfName.trim()) return false;
      if (pName === '본인' || pName === '본인(조장)') return false;
      return true;
    });

    const updatedCompanions: Companionship[] = [];
    companions.forEach((comp) => {
      const updated = this.addOrUpdateCompanion(comp.name, session.courseName, comp.id);
      updatedCompanions.push(updated);
    });

    // Also add to cheer feed
    this.createRoundCompletionFeed(session);

    return updatedCompanions;
  },

  // 5. 최다 동반 파트너 목록 (TOP N)
  getTopCompanions(limit = 3): Companionship[] {
    const list = [...this.getCompanions()];
    return list.sort((a, b) => b.roundCount - a.roundCount).slice(0, limit);
  },

  // 6. 1촌 활동 & 응원 피드
  getCheerFeed(): CheerFeedItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHEER_FEED);
      if (!data) return [];
      const parsed: CheerFeedItem[] = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (f) =>
          f &&
          f.companionId !== 'user_lee_yh' &&
          f.companionId !== 'user_park_cs' &&
          f.companionId !== 'user_jung_sj' &&
          !f.id.startsWith('feed_')
      );
    } catch {
      return [];
    }
  },

  saveCheerFeed(feed: CheerFeedItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CHEER_FEED, JSON.stringify(feed.slice(0, 30)));
      window.dispatchEvent(new Event('parkon_cheer_updated'));
    } catch (e) {
      console.error('Failed to save cheer feed:', e);
    }
  },

  // 원터치 응원 반응 발송 (NICE_SHOT | CONGRATS | FIGHTING)
  sendCheer(feedId: string, reactionType: CheerReactionType): CheerFeedItem | null {
    const feed = this.getCheerFeed();
    const itemIdx = feed.findIndex((f) => f.id === feedId);
    if (itemIdx < 0) return null;

    const item = feed[itemIdx];
    const prevCheer = item.myCheer;

    const updatedCheers = { ...item.cheers };
    if (prevCheer) {
      updatedCheers[prevCheer] = Math.max(0, (updatedCheers[prevCheer] || 1) - 1);
    }
    updatedCheers[reactionType] = (updatedCheers[reactionType] || 0) + 1;

    const updatedItem: CheerFeedItem = {
      ...item,
      cheers: updatedCheers,
      myCheer: reactionType,
    };

    feed[itemIdx] = updatedItem;
    this.saveCheerFeed(feed);

    // Supabase Cloud 비동기 저장
    this.syncCheerToCloud(feedId, reactionType, item.companionId);
    return updatedItem;
  },

  createRoundCompletionFeed(session: RoundSession): void {
    const selfName = ParkOnStorage.getUserDisplayName();
    const ranked = [...session.players].sort((a, b) => a.totalStrokes - b.totalStrokes);
    const selfRankIdx = ranked.findIndex((p) => p.name === selfName || p.isSelf);
    const myRank = selfRankIdx >= 0 ? selfRankIdx + 1 : 1;
    const myStrokes = ranked[selfRankIdx >= 0 ? selfRankIdx : 0]?.totalStrokes || 60;

    const newItem: CheerFeedItem = {
      id: `feed_${Date.now()}`,
      companionId: 'self',
      companionName: selfName,
      courseName: session.courseName,
      actionText: `${session.courseName} ${session.totalHoles}홀 완주!`,
      scoreSummary: `최종 ${myStrokes}타 (${myRank}위 완주 🎉)`,
      timestamp: new Date().toISOString(),
      timeAgoStr: '방금 전',
      isPlaying: false,
      cheers: { NICE_SHOT: 1, CONGRATS: 1, FIGHTING: 0 },
    };

    const feed = [newItem, ...this.getCheerFeed()].slice(0, 30);
    this.saveCheerFeed(feed);
  },

  // 7. Supabase 비동기 영구 저장 (백그라운드)
  async syncToCloud(comp: Companionship) {
    if (!supabase) return;
    try {
      await supabase.from('companionships').upsert({
        user_id: comp.userId,
        companion_id: comp.companionId,
        companion_name: comp.companionName,
        round_count: comp.roundCount,
        last_played_at: comp.lastPlayedAt,
      });
    } catch {
      // Local fallback
    }
  },

  async syncCheerToCloud(feedId: string, reactionType: CheerReactionType, companionId: string) {
    if (!supabase) return;
    try {
      await supabase.from('companion_cheers').insert({
        feed_id: feedId,
        reaction_type: reactionType,
        companion_id: companionId,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Local fallback
    }
  },

  // 8. 1촌 번개 라운드 시스템 (Track A)
  getLightningRounds(): CompanionLightningRound[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LIGHTNING_ROUNDS);
      if (!data) return [];
      const parsed: CompanionLightningRound[] = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((r) => r && r.id !== 'ltn_seed_1' && r.hostId !== 'user_lee_yh')
          .map((r) => ({
            ...r,
            acceptedPlayers: r.acceptedPlayers || r.currentPlayers.map((p) => ({
              ...p,
              acceptedAt: r.createdAt || new Date().toISOString(),
            })),
          }));
      }
      return [];
    } catch {
      return [];
    }
  },

  saveLightningRounds(rounds: CompanionLightningRound[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.LIGHTNING_ROUNDS, JSON.stringify(rounds.slice(0, 30)));
      window.dispatchEvent(new Event('parkon_lightning_updated'));
    } catch (e) {
      console.error('Failed to save lightning rounds:', e);
    }
  },

  createLightningRound(params: {
    courseId: string;
    courseName: string;
    dateStr: string;
    timeStr: string;
    targetPlayersCount?: number;
    lightningScope?: 'FOUR_PLAYERS' | 'MULTI_OPEN';
    invited1ChonNames?: string[];
    notes?: string;
    tags?: string[];
  }): CompanionLightningRound {
    const selfName = ParkOnStorage.getUserDisplayName();
    const scope = params.lightningScope || (params.targetPlayersCount && params.targetPlayersCount > 4 ? 'MULTI_OPEN' : 'FOUR_PLAYERS');
    const targetCount = scope === 'MULTI_OPEN' ? 999 : (params.targetPlayersCount || 4);

    const newLtn: CompanionLightningRound = {
      id: `ltn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      hostId: 'self',
      hostName: selfName,
      courseId: params.courseId,
      courseName: params.courseName,
      dateStr: params.dateStr,
      timeStr: params.timeStr,
      targetPlayersCount: targetCount,
      lightningScope: scope,
      invited1ChonNames: params.invited1ChonNames,
      acceptedPlayers: [
        { id: 'self', name: selfName, isHost: true, acceptedAt: new Date().toISOString() },
      ],
      currentPlayers: [{ id: 'self', name: selfName, isHost: true }],
      notes: params.notes || (scope === 'MULTI_OPEN' ? '4인 이상 인원 무제한 번개 라운드!' : '4인 안심 번개 라운드 (2인 이상 출발)!'),
      tags: params.tags && params.tags.length > 0 ? params.tags : [scope === 'MULTI_OPEN' ? '4인 이상 번개' : '4인 번개', '명랑 라운드'],
      status: 'RECRUITING',
      createdAt: new Date().toISOString(),
    };

    const list = [newLtn, ...this.getLightningRounds()];
    this.saveLightningRounds(list);

    // Also notify via cheer feed
    const feedItem: CheerFeedItem = {
      id: `feed_ltn_${Date.now()}`,
      companionId: 'self',
      companionName: selfName,
      courseName: params.courseName,
      actionText: scope === 'MULTI_OPEN'
        ? `⚡ [1촌 번개] ${params.courseName} (${params.dateStr} ${params.timeStr}) 4인 이상 무제한 모집!`
        : `⚡ [1촌 번개] ${params.courseName} (${params.dateStr} ${params.timeStr}) 4인 번개 (2인 이상 출발)!`,
      scoreSummary: scope === 'MULTI_OPEN' ? `현재 1명 수락 (인원 무제한)` : `현재 1/4명 수락 완료`,
      timestamp: new Date().toISOString(),
      timeAgoStr: '방금 전',
      isPlaying: false,
      cheers: { NICE_SHOT: 1, CONGRATS: 0, FIGHTING: 3 },
    };
    const feed = [feedItem, ...this.getCheerFeed()].slice(0, 30);
    this.saveCheerFeed(feed);

    return newLtn;
  },

  // 1촌 번개 수락(Accept) 기능 - 수락 시 확정 등록!
  acceptLightningRound(lightningId: string, playerName?: string): boolean {
    const list = this.getLightningRounds();
    const idx = list.findIndex((l) => l.id === lightningId);
    if (idx < 0) return false;

    const round = list[idx];
    const selfName = (playerName || ParkOnStorage.getUserDisplayName()).trim();
    if (!round.acceptedPlayers) {
      round.acceptedPlayers = round.currentPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        acceptedAt: new Date().toISOString(),
      }));
    }

    if (round.acceptedPlayers.some((p) => p.name === selfName)) {
      return true; // 이미 수락함
    }

    const isMultiOpen = round.lightningScope === 'MULTI_OPEN' || round.targetPlayersCount >= 999;

    // 4인 번개일 때만 4명 도달 시 마감 체크
    if (!isMultiOpen && round.acceptedPlayers.length >= 4) {
      return false; // 마감됨
    }

    const newPlayer = {
      id: `user_${Date.now()}`,
      name: selfName,
      isHost: false,
    };

    round.acceptedPlayers.push({
      ...newPlayer,
      acceptedAt: new Date().toISOString(),
    });

    if (!round.currentPlayers.some((p) => p.name === selfName)) {
      round.currentPlayers.push(newPlayer);
    }

    if (!isMultiOpen && round.acceptedPlayers.length >= 4) {
      round.status = 'FULL';
    }

    list[idx] = round;
    this.saveLightningRounds(list);
    return true;
  },

  // 1촌 번개 수락 취소 / 불참
  cancelAcceptLightningRound(lightningId: string, playerName?: string): boolean {
    const list = this.getLightningRounds();
    const idx = list.findIndex((l) => l.id === lightningId);
    if (idx < 0) return false;

    const round = list[idx];
    const selfName = (playerName || ParkOnStorage.getUserDisplayName()).trim();

    if (round.acceptedPlayers) {
      round.acceptedPlayers = round.acceptedPlayers.filter((p) => p.name !== selfName);
    }
    round.currentPlayers = round.currentPlayers.filter((p) => p.name !== selfName);

    if (round.status === 'FULL') {
      round.status = 'RECRUITING';
    }

    list[idx] = round;
    this.saveLightningRounds(list);
    return true;
  },

  joinLightningRound(lightningId: string, playerName?: string): boolean {
    return this.acceptLightningRound(lightningId, playerName);
  },

  leaveLightningRound(lightningId: string, playerName?: string): boolean {
    return this.cancelAcceptLightningRound(lightningId, playerName);
  },
};
