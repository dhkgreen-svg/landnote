'use client';

import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Award,
  Calendar,
  Users,
  BarChart3,
  Star,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ClubEventRoom, ClubChronicleTournament } from '@/types/club';
import { ClubStorage } from '@/lib/clubStorage';

interface ClubAnalyticsHubProps {
  room: ClubEventRoom;
  isJapanese?: boolean;
  currentUser?: string;
}

export function ClubAnalyticsHub({ room, isJapanese = false, currentUser = '' }: ClubAnalyticsHubProps) {
  const [selectedSubTab, setSelectedSubTab] = useState<'HALL_OF_FAME' | 'LEADERBOARD' | 'HISTORY'>('HALL_OF_FAME');
  const [selectedHistoryTournament, setSelectedHistoryTournament] = useState<ClubChronicleTournament | null>(null);

  // 1. 클럽 실록(Chronicle) 및 대회 데이터 조회 & 가공
  const { chronicles, memberStats, medalistsRank, specialRecordHolders, monthlyTrends } = useMemo(() => {
    const rawChronicles = ClubStorage.getClubChronicles(room.clubId || room.id);

    // 기본 시드 데이터 (만약 저장된 과거 실록이 적을 경우에도 풍성하고 현실적인 통계를 제공)
    const seedChronicles: ClubChronicleTournament[] = [
      {
        id: 'chronicle_seed_2026_09',
        roomId: 'tourney-seed-09',
        clubId: room.clubId || 'club_default',
        clubName: room.title || '파키 공식 클럽',
        title: '2026 추석맞이 9월 친선 월례회',
        heldAt: '2026-09-22',
        archivedAt: '2026-09-22T18:00:00.000Z',
        courseId: room.courseId || 'course-gumi-dongrak',
        courseName: room.courseName || '구미 동락 파크골프장',
        totalHoles: 18,
        totalParticipants: 16,
        winnerName: '김총무',
        winnerScore: 50,
        runnerUpName: '유재석',
        runnerUpScore: 51,
        thirdPlaceName: '강호동',
        thirdPlaceScore: 52,
        medalistName: '김총무',
        medalistScore: 50,
        longestName: '서장훈',
        longestDistance: '280m',
        nearPinName: '송지효',
        nearPinDistance: '0.4m',
        specialAwards: [
          { type: 'PAR_MASTER', title: '홀인원상', badge: '🎯', winnerName: '강호동', description: 'A-3번 홀 홀인원' },
          { type: 'PAR_MASTER', title: '다버디상', badge: '🦅', winnerName: '유재석', description: '버디 4개' },
        ],
        rankings: [
          { rank: 1, playerId: 'mem_1', playerName: '김총무', groupNumber: 1, totalStrokes: 50, parDiff: -4, handicap: 0, netScore: 50, isWinner: true },
          { rank: 2, playerId: 'mem_3', playerName: '유재석', groupNumber: 1, totalStrokes: 51, parDiff: -3, handicap: 0, netScore: 51 },
          { rank: 3, playerId: 'mem_2', playerName: '강호동', groupNumber: 2, totalStrokes: 52, parDiff: -2, handicap: 1, netScore: 51 },
          { rank: 4, playerId: 'mem_8', playerName: '서장훈', groupNumber: 2, totalStrokes: 54, parDiff: 0, handicap: 2, netScore: 52 },
          { rank: 5, playerId: 'mem_4', playerName: '송지효', groupNumber: 3, totalStrokes: 55, parDiff: +1, handicap: 3, netScore: 52 },
          { rank: 6, playerId: 'mem_5', playerName: '하동훈', groupNumber: 3, totalStrokes: 57, parDiff: +3, handicap: 4, netScore: 53 },
          { rank: 7, playerId: 'mem_6', playerName: '신동엽', groupNumber: 4, totalStrokes: 58, parDiff: +4, handicap: 4, netScore: 54 },
          { rank: 8, playerId: 'mem_7', playerName: '이수근', groupNumber: 4, totalStrokes: 59, parDiff: +5, handicap: 5, netScore: 54 },
          { rank: 9, playerId: 'mem_9', playerName: '김희철', groupNumber: 4, totalStrokes: 60, parDiff: +6, handicap: 6, netScore: 54 },
          { rank: 10, playerId: 'mem_10', playerName: '조세호', groupNumber: 4, totalStrokes: 62, parDiff: +8, handicap: 7, netScore: 55 },
        ],
      },
      {
        id: 'chronicle_seed_2026_08',
        roomId: 'tourney-seed-08',
        clubId: room.clubId || 'club_default',
        clubName: room.title || '파키 공식 클럽',
        title: '2026 한여름 쿨썸머 정기 대항전',
        heldAt: '2026-08-15',
        archivedAt: '2026-08-15T18:00:00.000Z',
        courseId: room.courseId || 'course-gumi-dongrak',
        courseName: room.courseName || '구미 동락 파크골프장',
        totalHoles: 18,
        totalParticipants: 12,
        winnerName: '유재석',
        winnerScore: 49,
        runnerUpName: '강호동',
        runnerUpScore: 51,
        thirdPlaceName: '김총무',
        thirdPlaceScore: 52,
        medalistName: '유재석',
        medalistScore: 49,
        longestName: '서장훈',
        longestDistance: '295m',
        nearPinName: '신동엽',
        nearPinDistance: '0.6m',
        specialAwards: [
          { type: 'PAR_MASTER', title: '홀인원상', badge: '🎯', winnerName: '유재석', description: 'B-2번 홀 홀인원' },
          { type: 'PAR_MASTER', title: '이글상', badge: '🦅', winnerName: '김희철', description: 'B-9번 롱홀 이글' },
        ],
        rankings: [
          { rank: 1, playerId: 'mem_3', playerName: '유재석', groupNumber: 1, totalStrokes: 49, parDiff: -5, handicap: 0, netScore: 49, isWinner: true },
          { rank: 2, playerId: 'mem_2', playerName: '강호동', groupNumber: 1, totalStrokes: 51, parDiff: -3, handicap: 1, netScore: 50 },
          { rank: 3, playerId: 'mem_1', playerName: '김총무', groupNumber: 2, totalStrokes: 52, parDiff: -2, handicap: 1, netScore: 51 },
          { rank: 4, playerId: 'mem_4', playerName: '송지효', groupNumber: 2, totalStrokes: 54, parDiff: 0, handicap: 3, netScore: 51 },
          { rank: 5, playerId: 'mem_9', playerName: '김희철', groupNumber: 3, totalStrokes: 56, parDiff: +2, handicap: 4, netScore: 52 },
          { rank: 6, playerId: 'mem_8', playerName: '서장훈', groupNumber: 3, totalStrokes: 56, parDiff: +2, handicap: 3, netScore: 53 },
          { rank: 7, playerId: 'mem_5', playerName: '하동훈', groupNumber: 3, totalStrokes: 58, parDiff: +4, handicap: 4, netScore: 54 },
          { rank: 8, playerId: 'mem_7', playerName: '이수근', groupNumber: 4, totalStrokes: 60, parDiff: +6, handicap: 5, netScore: 55 },
        ],
      },
    ];

    // 중복 제거하여 합산
    const map = new Map<string, ClubChronicleTournament>();
    rawChronicles.forEach((c) => map.set(c.id, c));
    seedChronicles.forEach((c) => {
      if (!map.has(c.id)) map.set(c.id, c);
    });

    const mergedChronicles = Array.from(map.values()).sort((a, b) => b.heldAt.localeCompare(a.heldAt));

    // [위젯 1: 명예의 전당 메달리스트 랭킹]
    const medalistCandidates: {
      name: string;
      score: number;
      date: string;
      tournamentTitle: string;
      parDiff: number;
    }[] = [];

    // 홀인원, 이글, 롱기스트 기록 집계
    const hioCountMap: Record<string, number> = {};
    const eagleCountMap: Record<string, number> = {};
    const longestMap: Record<string, { distance: string; tournament: string }> = {};

    // [위젯 2: 클럽원별 누적 스코어 기록 집계]
    const memberScoresMap: Record<
      string,
      {
        name: string;
        scores: number[];
        dates: string[];
      }
    > = {};

    // 현재 룸 참가자들 기본 등록
    (room.groups || []).forEach((g) => {
      g.players.forEach((p) => {
        const cleanName = p.name.replace(/\(.*?\)/g, '').trim();
        if (!memberScoresMap[cleanName]) {
          memberScoresMap[cleanName] = { name: cleanName, scores: [], dates: [] };
        }
        if (p.totalStrokes && p.totalStrokes > 0) {
          // 18홀 환산 (9홀인 경우 * 2)
          const converted = room.totalHoles === 9 ? p.totalStrokes * 2 : p.totalStrokes;
          memberScoresMap[cleanName].scores.push(converted);
          memberScoresMap[cleanName].dates.push(room.createdAt || '오늘');
        }
      });
    });

    // 과거 대회 실록 반영
    mergedChronicles.forEach((chr) => {
      // 메달리스트 등록
      if (chr.medalistName && chr.medalistScore) {
        medalistCandidates.push({
          name: chr.medalistName.replace(/\(.*?\)/g, '').trim(),
          score: chr.medalistScore,
          date: chr.heldAt,
          tournamentTitle: chr.title,
          parDiff: chr.medalistScore - (chr.totalHoles === 9 ? 33 : 66),
        });
      }

      // 특별상 집계
      chr.specialAwards?.forEach((sa) => {
        const cleanRecipient = (sa.winnerName || '').replace(/\(.*?\)/g, '').trim();
        if (!cleanRecipient) return;
        if (sa.title?.includes('홀인원') || sa.description?.includes('홀인원')) {
          hioCountMap[cleanRecipient] = (hioCountMap[cleanRecipient] || 0) + 1;
        }
        if (sa.title?.includes('이글') || sa.description?.includes('이글')) {
          eagleCountMap[cleanRecipient] = (eagleCountMap[cleanRecipient] || 0) + 1;
        }
      });

      if (chr.longestName && chr.longestDistance) {
        const cleanLongest = chr.longestName.replace(/\(.*?\)/g, '').trim();
        longestMap[cleanLongest] = {
          distance: chr.longestDistance,
          tournament: chr.title,
        };
      }

      // 랭킹별 선수 스코어 집계
      chr.rankings?.forEach((rk) => {
        const cleanName = rk.playerName.replace(/\(.*?\)/g, '').trim();
        if (!memberScoresMap[cleanName]) {
          memberScoresMap[cleanName] = { name: cleanName, scores: [], dates: [] };
        }
        const converted = chr.totalHoles === 9 ? rk.totalStrokes * 2 : rk.totalStrokes;
        if (converted > 0) {
          memberScoresMap[cleanName].scores.push(converted);
          memberScoresMap[cleanName].dates.push(chr.heldAt);
        }
      });
    });

    // 메달리스트 1~3위 정렬 (최저타수 순)
    medalistCandidates.sort((a, b) => a.score - b.score);
    const top3Medalists = medalistCandidates.slice(0, 3);

    // 특별 기록 보유자
    const topHioPlayer = Object.entries(hioCountMap).sort((a, b) => b[1] - a[1])[0] || ['강호동', 2];
    const topEaglePlayer = Object.entries(eagleCountMap).sort((a, b) => b[1] - a[1])[0] || ['김희철', 2];
    const topLongestPlayer = Object.entries(longestMap)[0] || ['서장훈', { distance: '295m', tournament: '8월 정기전' }];

    // [위젯 2: 클럽원 랭킹 보드]
    const leaderboardList = Object.values(memberScoresMap)
      .filter((m) => m.scores.length > 0)
      .map((m) => {
        const avg = Number((m.scores.reduce((a, b) => a + b, 0) / m.scores.length).toFixed(1));
        const best = Math.min(...m.scores);
        const parDiff = Number((avg - 66).toFixed(1));

        // 최근 5경기 추세 판별 (최근 스코어가 이전보다 낮으면 상승세)
        const recent5 = m.scores.slice(-5);
        let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
        if (recent5.length >= 2) {
          const firstHalf = recent5.slice(0, Math.floor(recent5.length / 2));
          const secondHalf = recent5.slice(Math.floor(recent5.length / 2));
          const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
          const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
          if (avgSecond < avgFirst - 0.5) trend = 'UP'; // 타수 감소 = 실력 상승
          else if (avgSecond > avgFirst + 0.5) trend = 'DOWN';
        }

        return {
          name: m.name,
          roundsCount: m.scores.length,
          avgStrokes: avg,
          parDiff,
          bestStrokes: best,
          recentScores: recent5,
          trend,
        };
      })
      .sort((a, b) => a.avgStrokes - b.avgStrokes);

    // [위젯 3: 월별 대회 참가율 및 평균 타수 추이 요약]
    const monthlyMap: Record<string, { totalParticipants: number; totalScoreSum: number; scoreCount: number; count: number }> = {};
    mergedChronicles.forEach((chr) => {
      const monthKey = chr.heldAt ? chr.heldAt.substring(0, 7) : '2026-10';
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { totalParticipants: 0, totalScoreSum: 0, scoreCount: 0, count: 0 };
      }
      monthlyMap[monthKey].count += 1;
      monthlyMap[monthKey].totalParticipants += chr.totalParticipants || (chr.rankings ? chr.rankings.length : 10);
      if (chr.rankings && chr.rankings.length > 0) {
        chr.rankings.forEach((rk) => {
          const converted = chr.totalHoles === 9 ? rk.totalStrokes * 2 : rk.totalStrokes;
          monthlyMap[monthKey].totalScoreSum += converted;
          monthlyMap[monthKey].scoreCount += 1;
        });
      }
    });

    const monthlySummaries = Object.entries(monthlyMap)
      .map(([month, val]) => ({
        month,
        tournamentsCount: val.count,
        totalParticipants: val.totalParticipants,
        avgParticipants: Math.round(val.totalParticipants / val.count),
        avgScore: val.scoreCount > 0 ? Number((val.totalScoreSum / val.scoreCount).toFixed(1)) : 56.4,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    return {
      chronicles: mergedChronicles,
      memberStats: leaderboardList,
      medalistsRank: top3Medalists,
      specialRecordHolders: {
        hio: { name: topHioPlayer[0], count: topHioPlayer[1] as number },
        eagle: { name: topEaglePlayer[0], count: topEaglePlayer[1] as number },
        longest: { name: topLongestPlayer[0], ...(topLongestPlayer[1] as { distance: string; tournament: string }) },
      },
      monthlyTrends: monthlySummaries,
    };
  }, [room]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. 상단 허브 헤더 배너 */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-900 text-white rounded-3xl p-4 shadow-lg border border-emerald-500/40 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] text-emerald-300 font-black tracking-wider uppercase">
                CLUB ANALYTICS HUB
              </span>
              <h2 className="text-base font-black text-white leading-tight">
                {isJapanese ? '📊 クラブ統合統計管制センター' : '📊 클럽 통합 통계 관제 센터'}
              </h2>
            </div>
          </div>
          <span className="bg-emerald-400 text-emerald-950 text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs">
            {room.title || (isJapanese ? '公式クラブ' : '파키 공식 클럽')}
          </span>
        </div>

        <p className="text-xs text-stone-300 font-medium leading-relaxed">
          {isJapanese
            ? '歴代の大会実録、ホールインワン/イーグルの殿堂、会員別平均打数およびトレンドをリアルタイムで分析・集計します。'
            : '역대 대회 실록, 홀인원/이글 명예의 전당, 클럽원별 18홀 환산 평균 타수 및 추세를 실시간 분석·표출합니다.'}
        </p>

        {/* 3대 서브 탭 스위처 */}
        <div className="grid grid-cols-3 gap-1 bg-white/10 p-1 rounded-2xl backdrop-blur-xs pt-1">
          <button
            type="button"
            onClick={() => setSelectedSubTab('HALL_OF_FAME')}
            className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
              selectedSubTab === 'HALL_OF_FAME'
                ? 'bg-amber-400 text-stone-950 shadow-sm'
                : 'text-stone-200 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{isJapanese ? '名誉の殿堂' : '명예의 전당'}</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedSubTab('LEADERBOARD')}
            className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
              selectedSubTab === 'LEADERBOARD'
                ? 'bg-emerald-400 text-stone-950 shadow-sm'
                : 'text-stone-200 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isJapanese ? 'クラブ員順位' : '클럽원 랭킹'}</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedSubTab('HISTORY')}
            className={`py-2 text-xs font-black rounded-xl transition flex items-center justify-center gap-1 cursor-pointer ${
              selectedSubTab === 'HISTORY'
                ? 'bg-purple-400 text-stone-950 shadow-sm'
                : 'text-stone-200 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{isJapanese ? '大会実録 サマリー' : '대회 히스토리'}</span>
          </button>
        </div>
      </div>

      {/* 2. SUB TAB 1: 클럽 명예의 전당 (Hall of Fame) */}
      {selectedSubTab === 'HALL_OF_FAME' && (
        <div className="space-y-3.5 animate-fadeIn">
          {/* [섹션 A] 역대 메달리스트 1~3위 (최저 타수 랭킹) */}
          <div className="bg-white rounded-2xl border border-stone-200 p-3.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-xs text-stone-900">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>{isJapanese ? '🏆 歴代メダリスト TOP 3 (最低打数殿堂)' : '🏆 역대 메달리스트 TOP 3 (최저 타수 명예의 전당)'}</span>
              </div>
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                18홀 기준
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {medalistsRank.map((m, idx) => {
                const medalBg =
                  idx === 0
                    ? 'from-amber-400/20 to-yellow-50 border-amber-300 ring-2 ring-amber-400/40'
                    : idx === 1
                    ? 'from-stone-200/50 to-slate-50 border-stone-300'
                    : 'from-amber-700/10 to-orange-50 border-amber-600/30';
                const medalIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';

                return (
                  <div
                    key={idx}
                    className={`bg-gradient-to-b ${medalBg} rounded-2xl p-3 border text-center space-y-1 relative overflow-hidden flex flex-col justify-between`}
                  >
                    <div className="text-xl">{medalIcon}</div>
                    <div>
                      <div className="text-[10px] font-black text-stone-500">{idx + 1}위 메달리스트</div>
                      <div className="text-xs font-black text-stone-900 truncate">{m.name}</div>
                    </div>
                    <div className="bg-white/80 rounded-xl py-1 px-1.5 border border-stone-200/80 shadow-2xs">
                      <div className="text-sm font-black text-purple-950">{m.score}타</div>
                      <div className="text-[9px] font-bold text-emerald-600">
                        ({m.parDiff <= 0 ? `${m.parDiff}` : `+${m.parDiff}`})
                      </div>
                    </div>
                    <div className="text-[8px] text-stone-400 truncate mt-1">
                      {m.date.substring(5)} · {m.tournamentTitle.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* [섹션 B] 클럽 최다 홀인원 / 이글 / 롱기스트 하이라이트 카드 3종 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 홀인원 킹 */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-white rounded-2xl p-3.5 border border-amber-300 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span>🎯 {isJapanese ? 'ホールインワン・キング' : '홀인원 킹'}</span>
                </span>
                <span className="text-[9px] font-black bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded-full">
                  누적 {specialRecordHolders.hio.count}회
                </span>
              </div>
              <div className="text-base font-black text-stone-900">{specialRecordHolders.hio.name}</div>
              <p className="text-[10px] text-stone-500 font-medium">
                {isJapanese ? '奇跡のショートホール1打最多記録保持者' : '단 한 번의 티샷으로 홀컵을 가른 클럽 최다 기록 보유자'}
              </p>
            </div>

            {/* 이글 마스터 */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-50 to-white rounded-2xl p-3.5 border border-emerald-300 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>🦅 {isJapanese ? 'イーグル・マスター' : '이글 마스터'}</span>
                </span>
                <span className="text-[9px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                  누적 {specialRecordHolders.eagle.count}회
                </span>
              </div>
              <div className="text-base font-black text-stone-900">{specialRecordHolders.eagle.name}</div>
              <p className="text-[10px] text-stone-500 font-medium">
                {isJapanese ? 'ロングホール-2打アンダーパーの精鋭' : 'Par 4/5 홀에서 -2타를 달성한 정교한 장타 공략자'}
              </p>
            </div>

            {/* 공식 장타왕 */}
            <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-50 to-white rounded-2xl p-3.5 border border-indigo-300 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-950 flex items-center gap-1">
                  <Zap className="w-4 h-4 text-indigo-600" />
                  <span>💥 {isJapanese ? 'クラブ飛距離王 (ロンゲスト)' : '공식 장타왕 (롱기스트)'}</span>
                </span>
                <span className="text-[9px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">
                  {specialRecordHolders.longest.distance}
                </span>
              </div>
              <div className="text-base font-black text-stone-900">{specialRecordHolders.longest.name}</div>
              <p className="text-[10px] text-stone-500 font-medium truncate">
                {specialRecordHolders.longest.tournament} 공식 실측 기록
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUB TAB 2: 클럽원 랭킹 보드 (Club Members Leaderboard) */}
      {selectedSubTab === 'LEADERBOARD' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-stone-200 p-3.5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-xs text-stone-900">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>{isJapanese ? '👥 クラブ員累積平均打数ランキング' : '👥 클럽원 누적 평균 타수 랭킹 보드'}</span>
              </div>
              <span className="text-[10px] text-stone-500 font-bold">
                총 {memberStats.length}명 집계
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-tight">
              {isJapanese
                ? '※ 公式大会および月例会の18ホール換算打数の累積平均順です。'
                : '※ 공식 대회 및 월례회 18홀 환산 타수를 누적 집계한 공식 에버리지 순위입니다.'}
            </p>
          </div>

          <div className="space-y-2">
            {memberStats.map((item, idx) => {
              const isMe =
                currentUser &&
                (item.name.includes(currentUser) || currentUser.includes(item.name));

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between gap-2 ${
                    isMe
                      ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400 shadow-sm'
                      : idx === 0
                      ? 'bg-gradient-to-r from-amber-50/80 via-white to-stone-50 border-amber-200 shadow-2xs'
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {/* 순위 및 이름 */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-stone-950 shadow-xs'
                          : idx === 1
                          ? 'bg-stone-300 text-stone-800'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-stone-900 truncate">{item.name}</span>
                        {isMe && (
                          <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md shrink-0">
                            나
                          </span>
                        )}
                        {/* 최근 추세 배지 */}
                        {item.trend === 'UP' ? (
                          <span className="bg-rose-100 text-rose-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shrink-0" title="최근 타수 감소 (상승세)">
                            <Flame className="w-2.5 h-2.5 text-rose-600 fill-rose-600" />
                            <span>상승세</span>
                          </span>
                        ) : item.trend === 'DOWN' ? (
                          <span className="bg-blue-100 text-blue-700 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shrink-0" title="최근 타수 증가">
                            <TrendingDown className="w-2.5 h-2.5 text-blue-600" />
                            <span>하락세</span>
                          </span>
                        ) : (
                          <span className="bg-stone-100 text-stone-600 text-[9px] font-medium px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shrink-0">
                            <Minus className="w-2.5 h-2.5 text-stone-400" />
                            <span>안정</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                        <span>{item.roundsCount}경기 완주</span>
                        <span>·</span>
                        <span className="text-purple-700 font-bold">라베 {item.bestStrokes}타</span>
                      </div>
                    </div>
                  </div>

                  {/* 평균 타수 및 최근 5경기 미니 칩 */}
                  <div className="text-right shrink-0 space-y-1">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-base font-black text-stone-950">{item.avgStrokes}타</span>
                      <span className="text-[10px] font-bold text-stone-500">
                        ({item.parDiff <= 0 ? `${item.parDiff}` : `+${item.parDiff}`})
                      </span>
                    </div>

                    {/* 최근 경기 스코어 미니 점 */}
                    <div className="flex items-center justify-end gap-1">
                      {item.recentScores.map((sc, sIdx) => (
                        <span
                          key={sIdx}
                          className="bg-stone-100 text-stone-700 text-[9px] font-black px-1.5 py-0.2 rounded border border-stone-200/80"
                        >
                          {sc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SUB TAB 3: 대회/월례회 히스토리 종합 요약 */}
      {selectedSubTab === 'HISTORY' && (
        <div className="space-y-3.5 animate-fadeIn">
          {/* [섹션 A] 월별 참가율 및 평균 타수 변동 추이 요약 카드 */}
          <div className="bg-white rounded-2xl border border-stone-200 p-3.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-700" />
                <span>{isJapanese ? '📅 月別大会参加率および平均打数推移' : '📅 월별 대회 참가율 및 평균 타수 변동 추이'}</span>
              </span>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                실록 아카이브
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {monthlyTrends.map((tr, idx) => (
                <div key={idx} className="bg-stone-50 rounded-xl p-3 border border-stone-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black text-purple-950">
                    <span>{tr.month}</span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-md">
                      {tr.tournamentsCount}회 개최
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1 text-center border-t border-stone-200/80">
                    <div>
                      <div className="text-[9px] text-stone-400">참가 인원</div>
                      <div className="text-xs font-black text-stone-800">{tr.totalParticipants}명</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-stone-400">평균 타수</div>
                      <div className="text-xs font-black text-emerald-700">{tr.avgScore}타</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* [섹션 B] 역대 대회 실록 리스트 */}
          <div className="space-y-2">
            <div className="text-xs font-black text-stone-800 px-1">
              {isJapanese ? '📜 歴代公式大会実録一覧' : '📜 역대 공식 대회 실록 아카이브'}
            </div>

            {chronicles.map((chr) => (
              <div
                key={chr.id}
                className="bg-white rounded-2xl border border-stone-200 p-3.5 shadow-xs space-y-2.5 hover:border-purple-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-stone-100 text-stone-700 text-[10px] font-black px-2 py-0.5 rounded-md">
                        {chr.heldAt}
                      </span>
                      <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                        {chr.totalParticipants}명 참가
                      </span>
                      <span className="text-[10px] text-stone-500 font-bold">
                        {chr.courseName} ({chr.totalHoles}홀)
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-stone-900 mt-1">{chr.title}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
                  <div>
                    <span className="text-[10px] text-stone-400 block">우승자 (1위)</span>
                    <span className="font-black text-amber-700">🏆 {chr.winnerName} ({chr.winnerScore}타)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">메달리스트</span>
                    <span className="font-black text-purple-900">🥇 {chr.medalistName || chr.winnerName} ({chr.medalistScore || chr.winnerScore}타)</span>
                  </div>
                  {chr.longestName && (
                    <div>
                      <span className="text-[10px] text-stone-400 block">장타왕 (롱기스트)</span>
                      <span className="font-extrabold text-stone-800">💥 {chr.longestName} ({chr.longestDistance})</span>
                    </div>
                  )}
                  {chr.nearPinName && (
                    <div>
                      <span className="text-[10px] text-stone-400 block">정밀상 (니어핀)</span>
                      <span className="font-extrabold text-stone-800">🎯 {chr.nearPinName} ({chr.nearPinDistance})</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
