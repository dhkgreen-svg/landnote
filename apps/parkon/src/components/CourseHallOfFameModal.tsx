'use client';

import React, { useState } from 'react';
import { X, Trophy, Flame, Crown, Medal, Play, ArrowRight, Sparkles } from 'lucide-react';
import { BadgeStorage, HallOfFameRanker } from '@/lib/badgeStorage';
import { useRouter } from 'next/navigation';

interface CourseHallOfFameModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
  myVisitCount?: number;
}

export function CourseHallOfFameModal({
  isOpen,
  onClose,
  courseId,
  courseName,
  myVisitCount = 0,
}: CourseHallOfFameModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'ALL_TIME' | 'MONTHLY'>('ALL_TIME');

  if (!isOpen) return null;

  const currentMonth = new Date().getMonth() + 1;
  const rankers = tab === 'ALL_TIME'
    ? BadgeStorage.getHallOfFame(courseId, myVisitCount)
    : BadgeStorage.getMonthHallOfFame(courseId);

  const myRank = rankers.find((r) => r.isMe);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-stone-950 text-white rounded-3xl w-full max-w-md overflow-hidden border-2 border-amber-400 shadow-2xl flex flex-col max-h-[90vh]">
        {/* 헤더 */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 fill-current text-stone-950" />
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                {courseName.replace('파크골프장', '')} 명예의 전당
              </h3>
              <p className="text-[11px] font-bold text-stone-900">
                이 구장을 가장 사랑하는 최다 완주 골퍼 TOP 10
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-900/20 text-stone-950 hover:bg-stone-900/30 flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 탭 전환: [전체 누적 랭킹] vs [이달의 챔피언] */}
        <div className="flex border-b border-stone-800 bg-stone-900/60 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setTab('ALL_TIME')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              tab === 'ALL_TIME'
                ? 'bg-amber-400 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            🏆 전체 누적 랭킹
          </button>
          <button
            type="button"
            onClick={() => setTab('MONTHLY')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
              tab === 'MONTHLY'
                ? 'bg-amber-400 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-current text-orange-600" />
            <span>🔥 {currentMonth}월 이달의 챔피언</span>
          </button>
        </div>

        {/* 내 순위 요약 배너 */}
        {myRank && (
          <div className="bg-stone-900 border-b border-stone-800 p-3 sm:p-3.5 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">👉</span>
              <div>
                <span className="text-xs text-stone-400 font-bold block">
                  나의 현재 순위 ({tab === 'ALL_TIME' ? '전체' : `${currentMonth}월`})
                </span>
                <span className="text-sm font-black text-amber-300">
                  {myRank.displayRank || `${myRank.rank}위`} ({myRank.visitCount}회 완주)
                </span>
              </div>
            </div>
            {myRank.rank > 1 && (
              <span className="text-[11px] font-extrabold text-stone-400 bg-white/10 px-2.5 py-1 rounded-full">
                앞 순위와 {rankers[myRank.rank - 2]?.visitCount - myRank.visitCount + 1}회 차이! 🔥
              </span>
            )}
          </div>
        )}

        {/* 랭킹 목록 스크롤 */}
        <div className="p-4 space-y-2 overflow-y-auto flex-1 overscroll-contain divide-y divide-stone-900">
          {rankers.map((r, idx) => {
            const isTop3 = r.rank <= 3;
            const medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `${r.rank}위`;

            return (
              <div
                key={`${r.name}_${idx}`}
                className={`py-2.5 px-3 rounded-2xl flex items-center justify-between transition ${
                  r.isMe
                    ? 'bg-amber-500/20 border border-amber-400/80 shadow-md ring-1 ring-amber-400'
                    : isTop3
                    ? 'bg-stone-900/90 border border-stone-800'
                    : 'bg-stone-900/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* 순위 메달/배지 (동점자 공동 순위 처리) */}
                  <div className="w-10 text-center shrink-0 flex flex-col items-center">
                    <span className="text-lg font-black leading-none">
                      {medal}
                    </span>
                    {r.isTie && (
                      <span className="text-[9px] text-amber-300 font-black tracking-tighter">
                        공동
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-black truncate ${r.isMe ? 'text-amber-300 font-black' : 'text-white'}`}>
                        {r.name}
                      </span>
                      {r.isMe && (
                        <span className="text-[9px] bg-amber-400 text-stone-950 font-black px-1.5 py-0.2 rounded-full">
                          나
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 font-medium">
                      {r.tierTitle}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-amber-400">
                    {r.visitCount}회 완주
                  </div>
                  {r.todayCount && r.todayCount > 1 && (
                    <span className="text-[9.5px] text-orange-400 font-bold flex items-center justify-end gap-0.5">
                      <Flame className="w-2.5 h-2.5 fill-current" />
                      <span>오늘 {r.todayCount}회차</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* 공정 랭킹 및 동점자 기준 안내 */}
          <div className="pt-3 pb-1 text-center">
            <p className="text-[10.5px] text-stone-400 leading-relaxed bg-stone-900/60 p-2.5 rounded-xl border border-stone-800/80">
              💡 <strong>공정 랭킹 안내:</strong> 완주 횟수가 동일한 경우 <span className="text-amber-300 font-bold">공동 순위</span>가 부여되며, 최근 라운드를 더 많이 진행한 골퍼가 우선 정렬됩니다.
            </p>
          </div>
        </div>

        {/* 하단 도전 버튼 */}
        <div className="p-3.5 bg-stone-900 border-t border-stone-800 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push(`/round/new?courseId=${courseId}`);
            }}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
          >
            <span>🔥 순위 역전하러 지금 티샷하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
