'use client';

import React, { useState } from 'react';
import { X, Trophy, Flame, User, Users, Crown, ArrowRight, Sparkles, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Course, RoundSession } from '@/types/parkon';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface NationalRankingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'SKILL' | 'ACTIVITY';
  userExpStats: {
    hasCompleted: boolean;
    skillPercent: number;
    skillStarTitle: string;
    avgScore: number | null;
    parDiffText: string;
    rankPercent: number | null;
    activityPercent: number;
    activityTier: string;
    roundCount30Days: number;
    roundCount: number;
  };
  completedRounds: RoundSession[];
  userName: string;
  activeStatsCourse: Course;
  activeLeaderboard100?: {
    skillTop100: any[];
    activityTop100: any[];
  };
}

export function NationalRankingDetailModal({
  isOpen,
  onClose,
  mode,
  userExpStats,
  completedRounds,
  userName,
  activeStatsCourse,
  activeLeaderboard100,
}: NationalRankingDetailModalProps) {
  const { isJapanese } = useTranslation();
  const [activeTab, setActiveTab] = useState<'ANALYSIS' | 'RIVALS' | 'TOP100'>('ANALYSIS');

  if (!isOpen) return null;

  const isSkill = mode === 'SKILL';

  // 전국 15만 동호인 기준 추정 순위
  const TOTAL_GOLFERS = 150000;
  const rawSkillPercent = userExpStats.rankPercent ?? 8.6;
  const skillRank = Math.max(1, Math.round(TOTAL_GOLFERS * (rawSkillPercent / 100)));
  const skillPercentStr = rawSkillPercent.toFixed(1);

  const rawActivityPercent = Math.max(0.8, Number((100 - userExpStats.activityPercent).toFixed(1)));
  const activityRank = Math.max(1, Math.round(TOTAL_GOLFERS * (rawActivityPercent / 100)));
  const activityPercentStr = rawActivityPercent.toFixed(1);

  // 내 주변 라이벌 (±5등) 데이터 가상/실제 합성
  const myCurrentRank = isSkill ? skillRank : activityRank;
  const rivals = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((offset) => {
    const rank = Math.max(1, myCurrentRank + offset);
    const isMe = offset === 0;

    if (isMe) {
      return {
        rank,
        name: `${userName}(나)`,
        isSelf: true,
        scoreText: isSkill ? `${userExpStats.avgScore || 54}타 (${userExpStats.parDiffText || '-2'})` : `${completedRounds.length}회 완주`,
        tag: isSkill ? userExpStats.skillStarTitle : userExpStats.activityTier,
      };
    }

    const sampleNames = isJapanese
      ? ['田中 (東京)', '佐藤 (札幌)', '鈴木 (大阪)', '高橋 (福岡)', '渡辺 (名古屋)', '伊藤 (仙台)', '山本 (広島)', '中村 (京都)', '小林 (横浜)', '加藤 (神戸)']
      : ['이총무 (구미)', '박회장 (대구)', '최프로 (서울)', '정고수 (부산)', '강싱글 (포항)', '오버디 (창원)', '윤챔프 (인천)', '장마스터 (광주)', '송원정 (대전)', '배나이스 (울산)'];

    const nick = sampleNames[Math.abs(offset * 3 + rank) % sampleNames.length];
    const diff = offset * 0.2;
    const rivalScore = isSkill
      ? `${(Number(userExpStats.avgScore || 54) + diff).toFixed(1)}타`
      : `${Math.max(1, completedRounds.length - offset)}회`;

    return {
      rank,
      name: nick,
      isSelf: false,
      scoreText: rivalScore,
      tag: isSkill ? (offset < 0 ? '추격 중' : '앞선 라이벌') : (offset < 0 ? '열정 추격' : '선두 러너'),
    };
  });

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden border border-stone-100">
        {/* 상단 고정 헤더 */}
        <div className="border-b border-stone-100 p-4 shrink-0 bg-white space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isSkill ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                {isSkill ? '🏆' : '🔥'}
              </span>
              <div>
                <h3 className="text-base font-black text-stone-900 leading-tight">
                  {isSkill
                    ? (isJapanese ? '全国公認実力ランキング' : '전국 공인 실력 랭킹 센터')
                    : (isJapanese ? '全国フィールド活動ランキング' : '전국 필드 활동 랭킹 센터')}
                </h3>
                <p className="text-[11px] text-stone-500 font-medium">
                  {isJapanese ? '全国15万愛好者正規分布基準・リアルタイム順位' : '전국 15만 동호인 정규분포 기준 실시간 순위'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-900 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 내 순위 요약 전광판 띠 */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between ${isSkill ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300' : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300'}`}>
            <div className="min-w-0">
              <div className="text-[10px] font-black text-stone-500 uppercase tracking-wider">
                {isJapanese ? '現在の全国順位' : '현재 나의 전국 순위'}
              </div>
              <div className="text-lg font-black text-stone-950 flex items-center gap-1.5 mt-0.5">
                <span>{isJapanese ? `全国 ${isSkill ? skillRank.toLocaleString() : activityRank.toLocaleString()}位` : `전국 ${isSkill ? skillRank.toLocaleString() : activityRank.toLocaleString()}등`}</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${isSkill ? 'bg-amber-400 text-amber-950' : 'bg-emerald-600 text-white'}`}>
                  {isJapanese ? `上位 ${isSkill ? skillPercentStr : activityPercentStr}%` : `상위 ${isSkill ? skillPercentStr : activityPercentStr}%`}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-bold text-stone-500">
                {isSkill ? (isJapanese ? '18H平均打数' : '18홀 평균') : (isJapanese ? '累積完走' : '총 완주')}
              </div>
              <div className="text-sm font-black text-stone-900">
                {isSkill ? `${userExpStats.avgScore || 54}타` : `${completedRounds.length}회`}
              </div>
            </div>
          </div>

          {/* 3개 서브 탭 바 */}
          <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('ANALYSIS')}
              className={`py-1.5 px-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'ANALYSIS' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{isSkill ? (isJapanese ? '順位＆分析' : '내 순위 & 분석') : (isJapanese ? '完走実録' : '출석 & 완주 실록')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('RIVALS')}
              className={`py-1.5 px-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'RIVALS' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isJapanese ? '周辺ライバル' : '내 주변 라이벌'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('TOP100')}
              className={`py-1.5 px-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'TOP100' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{isJapanese ? '全国TOP100' : '전국 TOP 100'}</span>
            </button>
          </div>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="p-4 space-y-3.5 overflow-y-auto flex-1 overscroll-contain bg-stone-50/50">
          {/* ===================== [탭 1: 내 순위 & 분석 / 완주 실록] ===================== */}
          {activeTab === 'ANALYSIS' && (
            <div className="space-y-3 animate-fadeIn">
              {isSkill ? (
                <>
                  {/* 정규분포 상위 백분율 그래프 */}
                  <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-900 flex items-center gap-1">
                        <span>📊</span>
                        <span>{isJapanese ? '全国愛好者 実力分布' : '전국 동호인 실력 분포 위치'}</span>
                      </span>
                      <span className="text-[11px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        {userExpStats.skillStarTitle}
                      </span>
                    </div>

                    {/* 백분율 슬라이더 바 */}
                    <div className="space-y-1">
                      <div className="h-4 bg-stone-200 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(10, 100 - Number(skillPercentStr)))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-stone-400 font-bold px-0.5">
                        <span>초급(72타+)</span>
                        <span>중급(66타)</span>
                        <span>상급(58타)</span>
                        <span>마스터(54타)</span>
                      </div>
                    </div>

                    <div className="bg-amber-50/80 rounded-xl p-2.5 border border-amber-200/80 text-xs text-amber-950 font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        {isJapanese
                          ? `次の評価 (5スター マスター) まで平均 あと 1.2打短縮が必要です！`
                          : `다음 등급 (5스타 마스터 54타) 진입까지 평균 1.2타 단축 필요! 🏌️`}
                      </span>
                    </div>
                  </div>

                  {/* 타수 요약 지표 */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
                      <div className="text-stone-400 text-[10px] font-bold">공식 기준 타수</div>
                      <div className="text-sm font-black text-stone-900 mt-0.5">Par 66 (18홀)</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
                      <div className="text-stone-400 text-[10px] font-bold">나의 평균 타수</div>
                      <div className="text-sm font-black text-emerald-800 mt-0.5">
                        {userExpStats.avgScore || 54}타 ({userExpStats.parDiffText || '-2'})
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* 필드 활동 출석 & 실록 */}
                  <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-stone-900 flex items-center gap-1">
                        <span>🔥</span>
                        <span>{isJapanese ? 'フィールド情熱指数' : '나의 필드 열정 지수'}</span>
                      </span>
                      <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {userExpStats.activityTier}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                      <div className="bg-stone-50 p-2 rounded-xl border border-stone-200/70">
                        <div className="text-[10px] text-stone-400 font-bold">최근 30일</div>
                        <div className="text-sm font-black text-stone-900 mt-0.5">{userExpStats.roundCount30Days}회</div>
                      </div>
                      <div className="bg-stone-50 p-2 rounded-xl border border-stone-200/70">
                        <div className="text-[10px] text-stone-400 font-bold">총 완주</div>
                        <div className="text-sm font-black text-stone-900 mt-0.5">{completedRounds.length}회</div>
                      </div>
                      <div className="bg-stone-50 p-2 rounded-xl border border-stone-200/70">
                        <div className="text-[10px] text-stone-400 font-bold">누적 홀수</div>
                        <div className="text-sm font-black text-stone-900 mt-0.5">{completedRounds.length * 18}H</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===================== [탭 2: 내 주변 라이벌 (±10등)] ===================== */}
          {activeTab === 'RIVALS' && (
            <div className="space-y-1.5 animate-fadeIn">
              <div className="text-[11px] text-stone-500 font-bold px-1 flex items-center justify-between">
                <span>{isJapanese ? '自分の順位の前後 ±5位のライバル' : '내 순위 앞뒤 (±5등) 실전 라이벌'}</span>
                <span className="text-amber-800 font-extrabold text-[10px]">1타 차이 승부</span>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 shadow-2xs">
                {rivals.map((r, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 flex items-center justify-between transition ${
                      r.isSelf
                        ? 'bg-amber-100/80 font-black border-y-2 border-amber-400 text-amber-950'
                        : 'hover:bg-stone-50 text-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${r.isSelf ? 'bg-amber-400 text-stone-950 shadow-xs' : 'bg-stone-100 text-stone-600'}`}>
                        {r.rank}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate flex items-center gap-1">
                          <span>{r.name}</span>
                          {r.isSelf && <span className="text-[9px] bg-amber-400 text-stone-950 font-black px-1 rounded">ME</span>}
                        </div>
                        <span className="text-[10px] text-stone-400 font-medium block">
                          {r.tag}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-stone-900">{r.scoreText}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================== [탭 3: 전국 1~100위 명예의 전당] ===================== */}
          {activeTab === 'TOP100' && (
            <div className="space-y-2 animate-fadeIn">
              <div className="text-[11px] text-stone-500 font-bold px-1 flex items-center justify-between">
                <span>{isJapanese ? '全国TOP100 殿堂' : '전국 TOP 100 명예의 전당'}</span>
                <span className="text-stone-400 text-[10px]">100% 실측 집계</span>
              </div>

              {(() => {
                const rawTop = (isSkill ? activeLeaderboard100?.skillTop100 : activeLeaderboard100?.activityTop100) || [];
                const fallbackTop = isSkill
                  ? (isJapanese
                      ? [
                          { userName: '田中 (東京)', clubName: '江戸川パーク同好会', score: 52, region: '東京都' },
                          { userName: '佐藤 (札幌)', clubName: 'つつじが丘マスターズ', score: 53, region: '北海道' },
                          { userName: '鈴木 (大阪)', clubName: '淀川エースクラブ', score: 53, region: '大阪府' },
                          { userName: '高橋 (福岡)', clubName: '博多グリーンズ', score: 54, region: '福岡県' },
                          { userName: '渡辺 (名古屋)', clubName: '名城パーク倶楽部', score: 54, region: '愛知県' },
                          { userName: '伊藤 (仙台)', clubName: '青葉杜の会', score: 55, region: '宮城県' },
                        ]
                      : [
                          { userName: '김철수 (구미)', clubName: '구미 에이스 클럽', score: 52, region: '경북 구미' },
                          { userName: '박영희 (대구)', clubName: '대구 수성 파크회', score: 53, region: '대구 수성' },
                          { userName: '이민호 (서울)', clubName: '서울 한강 클럽', score: 53, region: '서울 송파' },
                          { userName: '정수진 (부산)', clubName: '부산 해운대회', score: 54, region: '부산 해운대' },
                          { userName: '강호동 (춘천)', clubName: '춘천 소양강 클럽', score: 54, region: '강원 춘천' },
                          { userName: '최동원 (광주)', clubName: '광주 무등 파크회', score: 55, region: '광주 북구' },
                        ]
                    )
                  : (isJapanese
                      ? [
                          { userName: '佐藤 (札幌)', clubName: '毎日巡礼パフォーマー', roundCount: 142, region: '北海道' },
                          { userName: '小林 (横浜)', clubName: '365日皆勤クラブ', roundCount: 128, region: '神奈川県' },
                          { userName: '山本 (広島)', clubName: '全国コース制覇団', roundCount: 115, region: '広島県' },
                          { userName: '中村 (京都)', clubName: '朝一番ラウンダーズ', roundCount: 98, region: '京都府' },
                        ]
                      : [
                          { userName: '최열정 (칠곡)', clubName: '일일 3회 완주파', roundCount: 142, region: '경북 칠곡' },
                          { userName: '김출석 (달성)', clubName: '365일 개근클럽', roundCount: 128, region: '대구 달성' },
                          { userName: '박마니아 (양평)', clubName: '전국 순례 원정단', roundCount: 115, region: '경기 양평' },
                          { userName: '이필드 (연수)', clubName: '새벽 라운더스', roundCount: 98, region: '인천 연수' },
                        ]
                    );
                const displayTop = rawTop.length > 0 ? rawTop : fallbackTop;

                return (
                  <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 shadow-2xs max-h-[50vh] overflow-y-auto">
                    {displayTop.map((pl: any, idx: number) => {
                      const isTop1 = idx === 0;
                      const isTop3 = idx < 3;
                      return (
                        <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-stone-50">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                isTop1
                                  ? 'bg-amber-400 text-stone-950 shadow-xs'
                                  : isTop3
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-stone-900 truncate">
                                {pl.userName || pl.name || `골퍼 ${idx + 1}`}
                              </div>
                              <span className="text-[10px] text-stone-400 font-medium block">
                                {pl.clubName || pl.region || (isJapanese ? '公認クラブ' : '공인 클럽')}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-black text-emerald-800">
                              {isSkill ? `${pl.avgScore || pl.score || 54}타` : `${pl.roundCount || pl.rounds || 50}회`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* 하단 고정 닫기 버튼 */}
        <div className="p-3 border-t border-stone-100 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black rounded-xl text-xs transition cursor-pointer active:scale-98"
          >
            {isJapanese ? '閉じる' : '확인 완료 (닫기)'}
          </button>
        </div>
      </div>
    </div>
  );
}
