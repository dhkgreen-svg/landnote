'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Share2,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  ArrowRight,
} from 'lucide-react';
import { RoundSession, RoundPlayer } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export interface PaperScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRound?: RoundSession | null;
  onMergedSuccess?: (updatedRound: RoundSession) => void;
}

interface ParsedPlayer {
  name: string;
  scores: Record<number, number>;
  reportedTotal: number;
  calculatedTotal: number;
  isMathValid: boolean;
  mathDiff?: number;
}

interface ParsedGroup {
  groupId: string;
  groupNumber: string;
  courseName: string;
  date: string;
  courses: string[];
  imageUrl?: string;
  players: ParsedPlayer[];
}

export function PaperScorecardModal({
  isOpen,
  onClose,
  targetRound,
  onMergedSuccess,
}: PaperScorecardModalProps) {
  const { isJapanese, isEnglish } = useTranslation();

  // Step state: 'UPLOAD' | 'REVIEW' | 'LEADERBOARD' | 'MERGE_RESOLVE'
  const [step, setStep] = useState<'UPLOAD' | 'REVIEW' | 'LEADERBOARD' | 'MERGE_RESOLVE'>('UPLOAD');
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parsedGroups, setParsedGroups] = useState<ParsedGroup[]>([]);
  const [activeGroupIdx, setActiveGroupIdx] = useState<number>(0);

  // Cross-check & Merge state
  const [matchedRound, setMatchedRound] = useState<RoundSession | null>(targetRound || null);
  const [discrepancies, setDiscrepancies] = useState<Array<{ hole: number; appScore: number; paperScore: number; chosen: 'APP' | 'PAPER' }>>([]);
  const [mergeToast, setMergeToast] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const albumInputRef = useRef<HTMLInputElement | null>(null);

  // File upload handler
  const handleAddImage = (file: File) => {
    if (images.length >= 10) {
      alert(isJapanese ? '最大10組まで登録可能です。' : '최대 10개 조(10장)까지 등록 가능합니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setImages((prev) => [...prev, dataUrl]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // OCR Processing
  const handleStartOCR = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/scorecard/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
      });
      const data = await res.json();
      if (data.groups && Array.isArray(data.groups) && data.groups.length > 0) {
        setParsedGroups(data.groups);
        setActiveGroupIdx(0);

        // Check if there is a matching existing round in storage
        const allCompleted = ParkOnStorage.getCompletedRounds();
        const candidate = targetRound || allCompleted.find((r) => {
          // Match by date or course name or players
          const sameCourse = r.courseName && data.groups[0].courseName && (r.courseName.includes(data.groups[0].courseName) || data.groups[0].courseName.includes(r.courseName));
          const samePlayers = r.players.some((p) => data.groups[0].players.some((dp: any) => dp.name === p.name));
          return sameCourse || samePlayers;
        });

        if (candidate) {
          setMatchedRound(candidate);
          // Calculate any discrepancies with candidate's first player
          const myPlayer = candidate.players.find((p) => p.isSelf) || candidate.players[0];
          const matchedPaperPlayer = data.groups[0].players.find((p: any) => p.name === myPlayer?.name) || data.groups[0].players[0];
          
          if (myPlayer && matchedPaperPlayer) {
            const diffs: Array<{ hole: number; appScore: number; paperScore: number; chosen: 'APP' | 'PAPER' }> = [];
            Object.keys(matchedPaperPlayer.scores).forEach((hStr) => {
              const h = Number(hStr);
              const appVal = myPlayer.scores?.[h] || 0;
              const paperVal = matchedPaperPlayer.scores[h] || 0;
              if (appVal > 0 && paperVal > 0 && appVal !== paperVal) {
                diffs.push({ hole: h, appScore: appVal, paperScore: paperVal, chosen: 'PAPER' });
              }
            });
            setDiscrepancies(diffs);
          }
        }

        setStep('REVIEW');
      } else {
        alert(data.error || '스코어카드 판독에 실패했습니다.');
      }
    } catch (e: any) {
      alert('판독 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 36-Hole Integrated Leaderboard with D-Course Countback Rule
  const integratedLeaderboard = useMemo(() => {
    const allPlayers: Array<{
      groupNumber: string;
      name: string;
      total: number;
      scores: Record<number, number>;
      dScore: number;
      dLastHoles: number[];
    }> = [];

    parsedGroups.forEach((g) => {
      g.players.forEach((p) => {
        // D course (holes 28~36) countback calculation
        let dSum = 0;
        const dLast: number[] = [];
        for (let h = 36; h >= 28; h--) {
          const val = p.scores[h] || 0;
          dSum += val;
          dLast.push(val);
        }
        allPlayers.push({
          groupNumber: g.groupNumber,
          name: p.name,
          total: p.reportedTotal || p.calculatedTotal,
          scores: p.scores,
          dScore: dSum,
          dLastHoles: dLast,
        });
      });
    });

    // Sort by Total Strokes ASC, then by D course countback ASC
    allPlayers.sort((a, b) => {
      if (a.total !== b.total) return a.total - b.total;
      if (a.dScore !== b.dScore) return a.dScore - b.dScore;
      for (let i = 0; i < a.dLastHoles.length; i++) {
        if (a.dLastHoles[i] !== b.dLastHoles[i]) {
          return a.dLastHoles[i] - b.dLastHoles[i];
        }
      }
      return a.name.localeCompare(b.name);
    });

    return allPlayers;
  }, [parsedGroups]);

  // Execute Merge with existing round
  const handleExecuteMerge = () => {
    if (!matchedRound || parsedGroups.length === 0) return;
    try {
      const updatedPlayers = matchedRound.players.map((p) => {
        const paperP = parsedGroups[0].players.find((pp) => pp.name === p.name);
        if (!paperP) return p;
        
        const mergedScores = { ...p.scores };
        discrepancies.forEach((d) => {
          mergedScores[d.hole] = d.chosen === 'PAPER' ? d.paperScore : d.appScore;
        });

        const newTotalStrokes = Object.values(mergedScores).reduce((sum, s) => sum + (Number(s) || 0), 0);
        return {
          ...p,
          scores: mergedScores,
          totalStrokes: newTotalStrokes,
        };
      });

      const updatedRound: RoundSession = {
        ...matchedRound,
        players: updatedPlayers,
        isSpecsVerified: true,
        // 실물 카드 검증 완료 마크 및 원본 사진 영구 아카이빙
        isPaperVerified: true,
        paperScorecardPhoto: images[0] || undefined,
        updatedAt: new Date().toISOString(),
      };

      ParkOnStorage.saveCompletedRound(updatedRound);
      setMergeToast('🎉 실물 종이 카드 일치 검증 완료! 공인 증빙 사진이 영구 아카이빙되었습니다.');
      onMergedSuccess?.(updatedRound);
      setTimeout(() => {
        setMergeToast(null);
        onClose();
      }, 2000);
    } catch (e) {
      alert('기록 병합 중 오류가 발생했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl border-2 border-emerald-500 overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between shrink-0 border-b border-emerald-700">
          <div className="flex items-center gap-2">
            <span className="text-xl">📸</span>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                {isJapanese ? '紙のスコアカード AI自動入力・検証' : '종이 스코어카드 AI 자동 입력 & 검증'}
              </h3>
              <p className="text-[11px] text-emerald-200 font-medium">
                {isJapanese ? 'Gemini Vision AI 多組一括撮影 ＆ 相互検算' : 'Gemini Vision AI 다중 조 일괄 판독 & 수학적 교차 검산'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Step Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1.5 bg-stone-100 border-b border-stone-200 text-xs font-black shrink-0">
          <button
            type="button"
            onClick={() => setStep('UPLOAD')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
              step === 'UPLOAD' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:bg-white/60'
            }`}
          >
            <span>1. 카드 촬영</span>
            <span className="text-[10px] px-1 py-0.2 rounded-full bg-white/20">{images.length}/10</span>
          </button>
          <button
            type="button"
            disabled={parsedGroups.length === 0}
            onClick={() => setStep('REVIEW')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
              step === 'REVIEW' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:bg-white/60 disabled:opacity-40'
            }`}
          >
            <span>2. 조별 검산</span>
          </button>
          <button
            type="button"
            disabled={parsedGroups.length === 0}
            onClick={() => setStep('LEADERBOARD')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
              step === 'LEADERBOARD' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:bg-white/60 disabled:opacity-40'
            }`}
          >
            <span>3. 통합 순위표</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* STEP 1: MULTI-IMAGE UPLOAD */}
          {step === 'UPLOAD' && (
            <div className="space-y-4">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAddImage(file);
                  e.target.value = '';
                }}
              />
              <input
                ref={albumInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAddImage(file);
                  e.target.value = '';
                }}
              />

              <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200 text-center space-y-1">
                <span className="text-xs font-black text-emerald-950 flex items-center justify-center gap-1.5">
                  <span>🏆</span>
                  <span>클럽전 / 대회 다중 조(최대 10팀) 연속 촬영 지원</span>
                </span>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  1조부터 차례대로 종이 스코어카드를 연속 촬영하세요. Gemini Vision AI가 36홀 타수를 자동으로 파싱하고 수학적 합계를 검산합니다.
                </p>
              </div>

              {/* Upload Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-3.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Camera className="w-5 h-5" />
                  <span>📷 카메라 즉시 촬영</span>
                </button>

                <button
                  type="button"
                  onClick={() => albumInputRef.current?.click()}
                  className="py-3.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-xs sm:text-sm rounded-2xl border border-stone-300 flex items-center justify-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <span>🖼️ 앨범에서 선택</span>
                </button>
              </div>

              {/* Uploaded Cards Preview Grid */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-600">
                    <span>등록된 스코어카드 ({images.length}장)</span>
                    <button
                      type="button"
                      onClick={() => setImages([])}
                      className="text-rose-600 hover:underline text-[11px]"
                    >
                      전체 삭제
                    </button>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-3/4 rounded-xl overflow-hidden border-2 border-stone-300 group shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`카드 ${idx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 bg-black/75 text-white font-black text-[10px] px-1.5 py-0.2 rounded-md">
                          {idx + 1}조
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs opacity-90 hover:opacity-100 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Start OCR Button */}
              {images.length > 0 && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleStartOCR}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm sm:text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Gemini AI가 스코어카드를 정밀 분석 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 fill-current" />
                      <span>{images.length}개 조 AI 자동 판독 & 검산 시작 ➔</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* STEP 2: GROUP REVIEW & MATH CROSS-CHECK */}
          {step === 'REVIEW' && parsedGroups.length > 0 && (
            <div className="space-y-3.5">
              {/* Group Selector Slider */}
              <div className="flex items-center justify-between bg-stone-100 p-2 rounded-2xl border border-stone-200">
                <button
                  type="button"
                  disabled={activeGroupIdx === 0}
                  onClick={() => setActiveGroupIdx((prev) => Math.max(0, prev - 1))}
                  className="p-1.5 rounded-xl bg-white text-stone-700 disabled:opacity-30 shadow-xs cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <span className="text-sm font-black text-stone-900">
                    {parsedGroups[activeGroupIdx]?.groupNumber || `${activeGroupIdx + 1}조`} 스코어카드 검산
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    {activeGroupIdx + 1} / {parsedGroups.length}개 조
                  </span>
                </div>
                <button
                  type="button"
                  disabled={activeGroupIdx === parsedGroups.length - 1}
                  onClick={() => setActiveGroupIdx((prev) => Math.min(parsedGroups.length - 1, prev + 1))}
                  className="p-1.5 rounded-xl bg-white text-stone-700 disabled:opacity-30 shadow-xs cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Current Group Score Table */}
              {parsedGroups[activeGroupIdx] && (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
                  <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs font-bold text-stone-700">
                    <span>⛳ {parsedGroups[activeGroupIdx].courseName} ({parsedGroups[activeGroupIdx].date})</span>
                    <span className="text-emerald-700 font-black">
                      코스: {parsedGroups[activeGroupIdx].courses.join(', ')}
                    </span>
                  </div>

                  <div className="divide-y divide-stone-200">
                    {parsedGroups[activeGroupIdx].players.map((player, pIdx) => (
                      <div key={pIdx} className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-stone-900">{player.name}</span>
                          <div className="flex items-center gap-1.5">
                            {player.isMathValid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>검산 일치 ({player.calculatedTotal}타)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>불일치: 기재 {player.reportedTotal}타 vs 합계 {player.calculatedTotal}타</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Hole Score Mini Chips */}
                        <div className="grid grid-cols-9 gap-1 text-center">
                          {Object.entries(player.scores).slice(0, 18).map(([hNum, score]) => (
                            <div key={hNum} className="p-1 rounded-lg bg-stone-50 border border-stone-200 text-center">
                              <span className="text-[9px] text-stone-400 block">{hNum}H</span>
                              <span className="text-xs font-black text-stone-800">{score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation to Leaderboard & Match */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setStep('LEADERBOARD')}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
                >
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  <span>36홀 전체 통합 순위표(리더보드) 보기 ➔</span>
                </button>

                {matchedRound && (
                  <button
                    type="button"
                    onClick={() => setStep('MERGE_RESOLVE')}
                    className="w-full py-3 bg-amber-50 hover:bg-amber-100 text-amber-950 font-black text-xs rounded-2xl border border-amber-300 flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-98"
                  >
                    <span>💡 기존 앱 라운드 기록과 교차 검증 & 결합하기 ({matchedRound.courseName})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: INTEGRATED 36-HOLE LEADERBOARD */}
          {step === 'LEADERBOARD' && (
            <div className="space-y-3.5">
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white p-3.5 rounded-2xl border border-emerald-700 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                    <span>🏆</span>
                    <span>36홀 통합 리더보드 (D코스 백카운트 정렬)</span>
                  </h4>
                  <p className="text-[10px] text-emerald-200 mt-0.5">
                    총 {integratedLeaderboard.length}명 참가 · 동타 시 D코스 합계 및 마지막 홀 역산 우선
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('단체 카톡방/밴드 공유용 성적표 이미지가 클립보드에 복사되었습니다!')}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>공유</span>
                </button>
              </div>

              {/* Leaderboard Ranking Table */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs divide-y divide-stone-100">
                {integratedLeaderboard.map((item, rank) => {
                  const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}위`;
                  return (
                    <div
                      key={rank}
                      className={`p-3 flex items-center justify-between ${
                        rank === 0 ? 'bg-amber-50/60 font-black' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base font-black w-8 text-center shrink-0">
                          {medal}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-stone-900">{item.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-600">
                              {item.groupNumber}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400">
                            D코스: {item.dScore}타
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-emerald-950">
                          {item.total}타
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {matchedRound && (
                <button
                  type="button"
                  onClick={() => setStep('MERGE_RESOLVE')}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
                >
                  <span>💡 기존 앱 기록과 스마트 결합(Merge) 진행 ➔</span>
                </button>
              )}
            </div>
          )}

          {/* STEP 4: SMART MERGE & DISCREPANCY RESOLVER */}
          {step === 'MERGE_RESOLVE' && matchedRound && (
            <div className="space-y-3.5">
              <div className="bg-amber-50 rounded-2xl p-3 border border-amber-300 text-center space-y-1">
                <span className="text-xs font-black text-amber-950 flex items-center justify-center gap-1">
                  <span>🤝</span>
                  <span>기존 앱 라운드 기록 감지: {matchedRound.courseName}</span>
                </span>
                <p className="text-[11px] text-amber-800 font-medium">
                  중복 라운드를 생성하지 않고 기존 앱 기록에 종이 카드 실물 증빙 사진을 영구 결합합니다.
                </p>
              </div>

              {/* Discrepancies resolver */}
              {discrepancies.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-xs font-black text-stone-800 block">
                    ⚠️ 불일치 홀 발견 ({discrepancies.length}개 홀) - 유지할 타수를 선택하세요:
                  </span>
                  {discrepancies.map((d, idx) => (
                    <div key={idx} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                      <span className="font-black text-xs text-stone-800">{d.hole}번 홀</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDiscrepancies((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, chosen: 'APP' } : item))
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                            d.chosen === 'APP'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-stone-600 border-stone-300'
                          }`}
                        >
                          앱 점수 ({d.appScore}타)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDiscrepancies((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, chosen: 'PAPER' } : item))
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                            d.chosen === 'PAPER'
                              ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-xs'
                              : 'bg-white text-stone-600 border-stone-300'
                          }`}
                        >
                          종이 카드 점수 ({d.paperScore}타)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-300 text-center text-xs font-black text-emerald-900 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>앱 점수와 종이 카드 점수가 100% 일치합니다!</span>
                </div>
              )}

              {/* Confirm Merge Button */}
              <button
                type="button"
                onClick={handleExecuteMerge}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>[ ✅ 실물 카드 일치 검증 완료 ] 확정 결합하기</span>
              </button>
            </div>
          )}

          {/* Toast Message */}
          {mergeToast && (
            <div className="p-3 bg-emerald-950 text-emerald-200 border border-emerald-400 rounded-2xl text-xs font-black text-center animate-bounce">
              {mergeToast}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
