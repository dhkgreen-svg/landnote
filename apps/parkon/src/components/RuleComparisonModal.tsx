'use client';

import React from 'react';
import { X, AlertTriangle, ShieldCheck, Flag } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { KOREA_JAPAN_RULE_COMPARISONS } from '@/lib/rulebookDataJa';

interface RuleComparisonModalProps {
  onClose: () => void;
}

export function RuleComparisonModal({ onClose }: RuleComparisonModalProps) {
  const { isJapanese } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-lg w-full max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border-2 border-amber-400"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-stone-900 to-emerald-950 text-white p-4 shrink-0 flex items-center justify-between border-b border-amber-400/40">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 font-black flex items-center justify-center text-base shadow-sm">
              ⚡
            </span>
            <div>
              <h3 className="font-black text-sm sm:text-base text-amber-300">
                {isJapanese ? '日韓パークゴルフ公認ルール 4大重要比較' : '한·일 파크골프 공인 룰 4대 핵심 비교'}
              </h3>
              <p className="text-[11px] text-stone-300 font-medium">
                {isJapanese
                  ? '日本遠征・韓国遠征時に必ず知っておくべき公式規則の差異'
                  : '일본 원정 및 공식 시합 시 반드시 알아야 할 협회별 규정 차이'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 bg-stone-50/50">
          {/* Top Info Banner */}
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-950 font-bold leading-relaxed break-keep">
              {isJapanese
                ? 'パークゴルフは日本（NPGA）で発祥し、韓国（KPGA）でも広く普及していますが、ティーの高さ規格や用具の公認マーク、OB処置の慣行において実質的な差異が存在します。遠征前に下記4項目をご確認ください。'
                : '파크골프는 일본(NPGA) 종주국 규정과 한국(KPGA) 규정 사이에 티 높이(23mm 이하 엄격 계측), 용구 NPGA 공인 각인, OB 플레이스 절차 등 실질적 차이가 있습니다. 원정 라운드 전 꼭 숙지하세요!'}
            </p>
          </div>

          {/* 4 Comparison Cards */}
          <div className="space-y-3">
            {KOREA_JAPAN_RULE_COMPARISONS.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white border-2 border-stone-200 rounded-2xl p-3.5 shadow-xs space-y-2.5 hover:border-emerald-500 transition"
              >
                {/* Topic Header */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-lg bg-emerald-800 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="font-extrabold text-xs sm:text-sm text-stone-900">
                      {isJapanese ? item.topicJa : item.topicKo}
                    </h4>
                  </div>
                  <span className="text-[10px] bg-rose-50 text-rose-800 font-extrabold px-2 py-0.5 rounded-full border border-rose-200">
                    {isJapanese ? item.cautionBadgeJa : item.cautionBadgeKo}
                  </span>
                </div>

                {/* 2-Column Comparison: Korea vs Japan */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Korea KPGA */}
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 space-y-1">
                    <div className="flex items-center gap-1 font-black text-stone-800 text-[11px]">
                      <span>🇰🇷</span>
                      <span>{isJapanese ? '韓国 (KPGA)' : '대한민국 (KPGA)'}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 font-medium leading-snug break-keep">
                      {item.koreaKpga}
                    </p>
                  </div>

                  {/* Japan NPGA */}
                  <div className="bg-emerald-50/60 border border-emerald-300 rounded-xl p-2.5 space-y-1">
                    <div className="flex items-center gap-1 font-black text-emerald-900 text-[11px]">
                      <span>🇯🇵</span>
                      <span>{isJapanese ? '日本 (NPGA公式)' : '일본 (NPGA 공식)'}</span>
                    </div>
                    <p className="text-[11px] text-emerald-950 font-bold leading-snug break-keep">
                      {item.japanNpga}
                    </p>
                  </div>
                </div>

                {/* Practical Takeaway / Summary */}
                <div className="bg-amber-100/50 rounded-xl p-2 text-[11px] text-amber-950 font-bold flex items-start gap-1.5 border border-amber-200">
                  <span className="shrink-0 text-amber-700">💡</span>
                  <span className="break-keep">
                    {isJapanese ? item.differenceSummaryJa : item.differenceSummaryKo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 font-medium">
            {isJapanese ? '出典: NPGA公式競技規則 ＆ KPGA公認規定集' : '출처: 일본 NPGA 공식 경기규칙 & 대한파크골프협회 공인 규정'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            {isJapanese ? '確認完了 (閉じる)' : '확인 완료 (닫기)'}
          </button>
        </div>
      </div>
    </div>
  );
}
