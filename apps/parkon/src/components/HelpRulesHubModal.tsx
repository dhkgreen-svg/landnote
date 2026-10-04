'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, BookOpen, HelpCircle, Sparkles, ChevronRight, CheckCircle, ShieldCheck, Play, ArrowRight, Smartphone, Scale } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { QuickGuideModal } from './QuickGuideModal';
import { RulesWebtoonModal } from './RulesWebtoonModal';

interface HelpRulesHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpRulesHubModal({ isOpen, onClose }: HelpRulesHubModalProps) {
  const router = useRouter();
  const { isJapanese, isEnglish } = useTranslation();
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  const [showRulesWebtoon, setShowRulesWebtoon] = useState(false);

  if (!isOpen) return null;

  const handleOpenTutorial = () => {
    setShowQuickGuide(true);
  };

  const handleOpenRulebook = () => {
    onClose();
    router.push('/rules?tab=rulebook');
  };

  const handleOpenWebtoon = () => {
    setShowRulesWebtoon(true);
  };

  const handleOpenSolomonQA = () => {
    onClose();
    router.push('/rules?tab=qa');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-stone-900 text-stone-100 rounded-3xl shadow-2xl border-2 border-emerald-500/60 overflow-hidden flex flex-col max-h-[92vh]">
          {/* 모달 상단 헤더 */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-4 flex items-center justify-between shrink-0 border-b border-emerald-600/50">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center text-lg font-black shadow-md shrink-0">
                ❓
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                    {isJapanese ? 'ガイド ＆ ルールセンター' : '가이드 & 룰 센터'}
                  </h3>
                  <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                    {isJapanese ? '3大メニュー' : '3단 메뉴'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 font-medium">
                  {isJapanese
                    ? '1秒ガイド · 日韓公式競技規則 · 判定Q&A'
                    : '초간단 설명서 · 한·일 공식 협회 규정집 · 실전 룰 Q&A'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 3단 메뉴 카드 목록 */}
          <div className="p-3.5 sm:p-4 space-y-3 overflow-y-auto">
            {/* =========================================================
                1단 (맨 위): 💡 초간단 설명서 (튜토리얼 - Tutorial)
               ========================================================= */}
            <div className="bg-gradient-to-br from-amber-500/20 via-stone-800 to-stone-850 border-2 border-amber-400/80 rounded-2xl p-3.5 shadow-md hover:border-amber-400 transition flex flex-col justify-between gap-2.5 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center text-base font-black shrink-0 shadow-xs">
                    💡
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm sm:text-base font-black text-amber-300">
                        {isJapanese ? '1. 初心者 超簡単ガイド' : '1. 초간단 설명서 (튜토리얼)'}
                      </span>
                      <span className="text-[9.5px] font-black bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded-full">
                        {isJapanese ? '必読' : '필독 튜토리얼'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300 font-medium mt-0.5 leading-snug">
                      {isJapanese
                        ? '紙カード不要！スマホで1秒スコア入力＆リアルタイム共有'
                        : '종이 카드 없이 스마트폰으로 1초 타수 입력 & 동반자 실시간 연동'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between gap-2 border-t border-stone-700/60">
                <span className="text-[10px] text-stone-400 font-bold">
                  {isJapanese ? '4段階 基本使用法' : '홈구장 · 실시간 스코어 · AI 가이드 4단계'}
                </span>
                <button
                  type="button"
                  onClick={handleOpenTutorial}
                  className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <span>{isJapanese ? 'ガイドを開く' : '설명서 열기'}</span>
                  <span>▶</span>
                </button>
              </div>
            </div>

            {/* =========================================================
                2단 (중간): 📜 공식 규정 & 만화 룰북 (Official Rulebook & Comics)
               ========================================================= */}
            <div className="bg-gradient-to-br from-emerald-900/30 via-stone-800 to-stone-850 border-2 border-emerald-500/80 rounded-2xl p-3.5 shadow-md hover:border-emerald-400 transition flex flex-col justify-between gap-2.5 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-base font-black shrink-0 shadow-xs">
                    📜
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm sm:text-base font-black text-emerald-300">
                        {isJapanese ? '2. 公式競技規則 ＆ 漫画解説' : '2. 공식 룰북 & 만화 규정집'}
                      </span>
                      <span className="text-[9.5px] font-black bg-emerald-500 text-white px-1.5 py-0.2 rounded-full">
                        {isJapanese ? '公認規程 原文' : '한·일 공인 규정 원문'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300 font-medium mt-0.5 leading-snug">
                      {isJapanese
                        ? '(사)大韓パークゴルフ協会 ＆ (公社)日本協会 公式条文 原文＋6コマ漫画'
                        : '🇰🇷 KPGA 대한파크골프협회 & 🇯🇵 NPGA 일본 공식 규칙 원문 + 6컷 만화 해설'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-700/60">
                <button
                  type="button"
                  onClick={handleOpenRulebook}
                  className="bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-black text-xs py-1.5 px-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1 transition cursor-pointer border border-emerald-500/60 truncate"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{isJapanese ? '公式条文 原文' : '공식 규정 조문'}</span>
                  <span>▶</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenWebtoon}
                  className="bg-emerald-950 hover:bg-emerald-900 active:scale-95 text-amber-300 font-black text-xs py-1.5 px-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1 transition cursor-pointer border border-amber-400/60 truncate"
                >
                  <span>🎨</span>
                  <span className="truncate">{isJapanese ? '6コマ漫画' : '6컷 만화 룰북'}</span>
                  <span>▶</span>
                </button>
              </div>
            </div>

            {/* =========================================================
                3단 (아래): 💬 룰 Q&A & AI 룰 솔로몬 (Q&A & AI Verdict)
               ========================================================= */}
            <div className="bg-gradient-to-br from-purple-900/30 via-stone-800 to-stone-850 border-2 border-purple-500/80 rounded-2xl p-3.5 shadow-md hover:border-purple-400 transition flex flex-col justify-between gap-2.5 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center text-base font-black shrink-0 shadow-xs">
                    ⚖️
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm sm:text-base font-black text-purple-300">
                        {isJapanese ? '3. 紛争判定 Q&A ＆ AIソロモン' : '3. 실전 룰 Q&A & AI 룰 솔로몬'}
                      </span>
                      <span className="text-[9.5px] font-black bg-purple-600 text-white px-1.5 py-0.2 rounded-full">
                        {isJapanese ? '1秒判定' : '1초 즉석 판정'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300 font-medium mt-0.5 leading-snug">
                      {isJapanese
                        ? 'OB・ペナルティ・マナーなど現場紛争即時解決 · 音声/写真判定'
                        : 'OB 선 판정 · 동반자 실랑이 1초 해결 · 음성 질문 & 사진 판정기'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between gap-2 border-t border-stone-700/60">
                <span className="text-[10px] text-stone-400 font-bold">
                  {isJapanese ? '50大 事例別 Q&A' : '상황별 50대 Q&A · 음성 판정'}
                </span>
                <button
                  type="button"
                  onClick={handleOpenSolomonQA}
                  className="bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <span>{isJapanese ? 'Q&A 判定を開く' : '룰 Q&A 열기'}</span>
                  <span>▶</span>
                </button>
              </div>
            </div>
          </div>

          {/* 모달 하단 닫기 */}
          <div className="p-3 bg-stone-950 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 active:scale-98 text-stone-300 hover:text-white rounded-xl text-xs font-black transition cursor-pointer"
            >
              {isJapanese ? '閉じる' : '✕ 닫기'}
            </button>
          </div>
        </div>
      </div>

      {/* 1단 클릭 시 열리는 초간단 설명서 서브 모달 */}
      <QuickGuideModal
        isOpen={showQuickGuide}
        onClose={() => setShowQuickGuide(false)}
      />

      {/* 2단 클릭 시 열리는 6컷 만화 룰북 서브 모달 */}
      <RulesWebtoonModal
        isOpen={showRulesWebtoon}
        onClose={() => setShowRulesWebtoon(false)}
      />
    </>
  );
}
