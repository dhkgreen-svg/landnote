'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Zap, Users, MapPin, Calendar, Clock, Sparkles, Check, ChevronRight, Play } from 'lucide-react';
import { ParkOnStorage } from '@/lib/storage';
import { CompanionStorage, CompanionLightningRound } from '@/lib/companionStorage';
import { DEFAULT_COURSES } from '@/lib/defaultCourses';

interface CompanionLightningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoundCreated?: () => void;
}

export function CompanionLightningModal({ isOpen, onClose, onRoundCreated }: CompanionLightningModalProps) {
  const router = useRouter();
  const myName = ParkOnStorage.getUserDisplayName();

  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');
  const [rounds, setRounds] = useState<CompanionLightningRound[]>([]);

  // Create Form State
  const [selectedCourseId, setSelectedCourseId] = useState<string>('course-gumi-dongrak');
  const [dateOption, setDateOption] = useState<string>('오늘');
  const [timeStr, setTimeStr] = useState<string>('14:30');
  const [selectedTags, setSelectedTags] = useState<string[]>(['명랑 라운드', '1촌 환영']);
  const [memo, setMemo] = useState<string>('선선한 날씨에 18홀 편하게 도실 1촌 모십니다!');
  const [successToast, setSuccessToast] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const load = () => {
      setRounds(CompanionStorage.getLightningRounds());
    };
    load();
    window.addEventListener('parkon_lightning_updated', load);
    return () => window.removeEventListener('parkon_lightning_updated', load);
  }, [isOpen]);

  if (!isOpen) return null;

  const quickTags = ['명랑 라운드', '초보 환영', '조기 라운드', '내기 없음', '매너 라운드', '18홀 집중'];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const course = DEFAULT_COURSES.find((c) => c.id === selectedCourseId) || DEFAULT_COURSES[0];
    const created = CompanionStorage.createLightningRound({
      courseId: course.id,
      courseName: course.name,
      dateStr: dateOption,
      timeStr,
      targetPlayersCount: 4,
      notes: memo,
      tags: selectedTags,
    });

    setSuccessToast(`⚡ '${course.name}' 1촌 번개가 등록되었습니다! 1촌 피드에 알림이 발송되었습니다.`);
    setRounds(CompanionStorage.getLightningRounds());
    setActiveTab('LIST');
    if (onRoundCreated) onRoundCreated();
    setTimeout(() => setSuccessToast(''), 3000);
  };

  const handleJoin = (id: string) => {
    const ok = CompanionStorage.joinLightningRound(id, myName);
    if (ok) {
      setRounds(CompanionStorage.getLightningRounds());
      setSuccessToast('번개 조에 참여했습니다! 4인이 모이면 스코어보드가 시작됩니다. ✋');
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  const handleStartRound = (ltn: CompanionLightningRound) => {
    // Start round directly
    onClose();
    router.push(`/round/new?courseId=${ltn.courseId}&players=${encodeURIComponent(ltn.currentPlayers.map((p) => p.name).join(','))}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-stone-200 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center font-black shadow-xs">
              <Zap className="w-6 h-6 fill-amber-300 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight">1촌 친목 번개 라운드</h3>
              <p className="text-xs text-amber-100 font-medium">신뢰하는 내 1촌 동반자들과 4인 조 모임</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection (Senior High Contrast) */}
        <div className="grid grid-cols-2 p-1.5 bg-stone-100 border-b border-stone-200 gap-1 text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab('LIST')}
            className={`min-h-[44px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'LIST'
                ? 'bg-white text-emerald-900 shadow-xs border border-emerald-300 font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-700" />
            <span>모집 중인 1촌 번개 ({rounds.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CREATE')}
            className={`min-h-[44px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'CREATE'
                ? 'bg-white text-emerald-900 shadow-xs border border-emerald-300 font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-600 fill-amber-500" />
            <span>+ 새 1촌 번개 띄우기</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-center text-xs font-black text-emerald-900 animate-in fade-in">
              {successToast}
            </div>
          )}

          {activeTab === 'LIST' ? (
            <div className="space-y-3">
              {rounds.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center font-bold text-xl">
                    ⚡
                  </div>
                  <p className="text-xs text-stone-500 font-medium">현재 모집 중인 1촌 번개가 없습니다.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('CREATE')}
                    className="py-2.5 px-4 bg-emerald-600 text-white font-black rounded-xl text-xs shadow cursor-pointer"
                  >
                    내가 먼저 1촌 번개 띄우기
                  </button>
                </div>
              ) : (
                rounds.map((r) => {
                  const isFull = r.currentPlayers.length >= r.targetPlayersCount;
                  const amIIn = r.currentPlayers.some((p) => p.name === myName);

                  return (
                    <div
                      key={r.id}
                      className="p-4 bg-stone-50 rounded-2xl border border-stone-200 shadow-xs space-y-3"
                    >
                      {/* Round Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-stone-900">{r.courseName}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isFull ? 'bg-stone-200 text-stone-600' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isFull ? '모집 완료' : '모집 중'}
                          </span>
                        </div>
                        <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          {r.dateStr} {r.timeStr}
                        </span>
                      </div>

                      {/* Notes & Tags */}
                      <p className="text-xs text-stone-600 font-medium">{r.notes}</p>
                      <div className="flex flex-wrap gap-1">
                        {r.tags.map((tag) => (
                          <span key={tag} className="text-[10px] bg-white border border-stone-200 text-stone-500 px-2 py-0.5 rounded-md font-bold">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Current Players (Avatar Pills) */}
                      <div className="bg-white p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-stone-400">참여 1촌 명단 ({r.currentPlayers.length}/{r.targetPlayersCount}명)</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {r.currentPlayers.map((p, idx) => (
                              <span
                                key={idx}
                                className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${
                                  p.isHost ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-stone-100 text-stone-800'
                                }`}
                              >
                                {p.isHost && <span>👑</span>}
                                <span>{p.name}</span>
                              </span>
                            ))}
                            {Array.from({ length: r.targetPlayersCount - r.currentPlayers.length }).map((_, i) => (
                              <span key={i} className="text-xs px-2.5 py-1 rounded-lg border border-dashed border-stone-300 text-stone-400 font-medium">
                                + 빈자리
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Button (Senior 50px+) */}
                      <div>
                        {isFull ? (
                          <button
                            type="button"
                            onClick={() => handleStartRound(r)}
                            className="w-full min-h-[50px] bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow active:scale-98 transition cursor-pointer"
                          >
                            <Play className="w-4 h-4 fill-white" />
                            <span>4인 조 완성! 스코어보드 바로 시작</span>
                          </button>
                        ) : amIIn ? (
                          <div className="w-full min-h-[44px] bg-emerald-50 text-emerald-800 font-black rounded-xl text-xs flex items-center justify-center gap-1 border border-emerald-300">
                            <Check className="w-4 h-4" />
                            <span>내가 참여한 번개입니다 (다른 1촌 대기 중)</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleJoin(r.id)}
                            className="w-full min-h-[50px] bg-stone-900 hover:bg-stone-800 text-amber-300 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow active:scale-98 transition cursor-pointer"
                          >
                            <span>✋ 번개 함께 가기 (참여하기)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4 text-left">
              {/* 1. 구장 선택 */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>어느 구장에서 번개 라운딩을 하실까요?</span>
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full min-h-[50px] px-3.5 rounded-xl border-2 border-stone-300 focus:border-emerald-600 bg-stone-50 font-bold text-sm text-stone-900 focus:outline-none cursor-pointer"
                >
                  {DEFAULT_COURSES.slice(0, 15).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.region} · {c.totalHoles}홀)
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. 일시 선택 (오늘/내일 빠른 버튼) */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-800 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>언제 만나서 티오프할까요?</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['오늘', '내일', '주말'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDateOption(opt)}
                      className={`min-h-[44px] rounded-xl text-xs font-black border transition cursor-pointer ${
                        dateOption === opt
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <div className="pt-1.5">
                  <input
                    type="time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="w-full min-h-[48px] px-4 rounded-xl border-2 border-stone-300 bg-stone-50 text-sm font-bold text-stone-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* 3. 성향 태그 */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-800">
                  라운드 성향 선택
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickTags.map((tag) => {
                    const isSel = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition cursor-pointer ${
                          isSel
                            ? 'bg-amber-400 text-emerald-950 border-amber-400 font-black shadow-2xs'
                            : 'bg-stone-100 text-stone-600 border-stone-200'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. 한마디 메모 */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-stone-800">
                  동반자에게 전할 한마디
                </label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="예: 편하게 18홀 돌아요!"
                  className="w-full min-h-[48px] px-3.5 rounded-xl border border-stone-300 bg-stone-50 text-sm font-bold text-stone-900 focus:outline-none"
                />
              </div>

              {/* Submit Button (Senior 52px+) */}
              <button
                type="submit"
                className="w-full min-h-[52px] bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-black rounded-2xl text-base flex items-center justify-center gap-2 shadow-md active:scale-98 transition cursor-pointer"
              >
                <Zap className="w-5 h-5 fill-white" />
                <span>나의 1촌들에게 번개 띄우기</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
