'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, Trophy, ThumbsUp, PartyPopper, Flame, Radio } from 'lucide-react';
import { CompanionStorage, CheerFeedItem, CheerReactionType } from '@/lib/companionStorage';

export function CompanionFeedWidget() {
  const [feed, setFeed] = useState<CheerFeedItem[]>([]);
  const [activeCheerMsg, setActiveCheerMsg] = useState<string>('');

  useEffect(() => {
    const loadFeed = () => {
      setFeed(CompanionStorage.getCheerFeed());
    };
    loadFeed();
    window.addEventListener('parkon_cheer_updated', loadFeed);
    window.addEventListener('storage', loadFeed);
    return () => {
      window.removeEventListener('parkon_cheer_updated', loadFeed);
      window.removeEventListener('storage', loadFeed);
    };
  }, []);

  const handleSendCheer = (feedId: string, type: CheerReactionType, companionName: string) => {
    CompanionStorage.sendCheer(feedId, type);
    const label = type === 'NICE_SHOT' ? '나이스샷 굿샷!' : type === 'CONGRATS' ? '축하 메시지' : '힘찬 파이팅';
    setActiveCheerMsg(`${companionName} 님께 '${label}' 응원을 전달했습니다! 🎉`);
    setTimeout(() => setActiveCheerMsg(''), 2500);
  };

  if (feed.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Heart className="w-4 h-4 fill-amber-500 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-stone-900 tracking-tight flex items-center gap-1.5">
              <span>1촌 동반자 소식 & 원터치 응원</span>
            </h3>
            <p className="text-[11px] text-stone-400 font-medium">동반자의 라운드 완주에 나이스샷을 보내보세요</p>
          </div>
        </div>
        <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
          <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
          실시간
        </span>
      </div>

      {activeCheerMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-xs font-black text-emerald-900 animate-in fade-in slide-in-from-top-1">
          {activeCheerMsg}
        </div>
      )}

      {/* Feed List */}
      <div className="space-y-3">
        {feed.slice(0, 3).map((item) => {
          return (
            <div
              key={item.id}
              className="p-3 bg-stone-50/80 hover:bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2.5 transition"
            >
              {/* Feed Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {item.companionName.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-stone-900">{item.companionName}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                        1촌
                      </span>
                      {item.isPlaying && (
                        <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                          라운드 중
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-500 font-medium">
                      {item.courseName} · {item.timeAgoStr}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action content & Score */}
              <div className="bg-white p-2.5 rounded-xl border border-stone-200/60 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">{item.actionText}</span>
                {item.scoreSummary && (
                  <span className="text-xs font-black text-emerald-700">{item.scoreSummary}</span>
                )}
              </div>

              {/* 3대 원터치 응원 버튼 (Senior Friendly 44px+) */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSendCheer(item.id, 'NICE_SHOT', item.companionName)}
                  className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer border ${
                    item.myCheer === 'NICE_SHOT'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white hover:bg-blue-50 text-blue-800 border-blue-200'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>나이스샷</span>
                  <span className="text-[10px] opacity-80">({item.cheers.NICE_SHOT || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendCheer(item.id, 'CONGRATS', item.companionName)}
                  className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer border ${
                    item.myCheer === 'CONGRATS'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  <PartyPopper className="w-3.5 h-3.5" />
                  <span>축하해요</span>
                  <span className="text-[10px] opacity-80">({item.cheers.CONGRATS || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendCheer(item.id, 'FIGHTING', item.companionName)}
                  className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer border ${
                    item.myCheer === 'FIGHTING'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>파이팅</span>
                  <span className="text-[10px] opacity-80">({item.cheers.FIGHTING || 0})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
