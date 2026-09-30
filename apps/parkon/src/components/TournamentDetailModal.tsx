'use client';

import React, { useState } from 'react';
import {
  X,
  Trophy,
  MapPin,
  Calendar,
  Clock,
  Users,
  FileText,
  ExternalLink,
  Share2,
  Globe,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Car,
} from 'lucide-react';
import { TournamentNotice } from '@/types/board';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { resolveNoticeDisplay } from '@/lib/bilingualBoardHelper';

interface TournamentDetailModalProps {
  notice: TournamentNotice | null;
  distKm?: number | null;
  onClose: () => void;
}

export function TournamentDetailModal({
  notice,
  distKm,
  onClose,
}: TournamentDetailModalProps) {
  const { isJapanese } = useTranslation();
  const [isTranslated, setIsTranslated] = useState(false);

  // notice 변경 시 기본 번역 상태 초기화
  React.useEffect(() => {
    if (!notice) return;
    const isJpNotice = notice.country === 'JP';
    const isKrNotice = !notice.country || notice.country === 'KR';
    const needsTranslation =
      (!isJapanese && isJpNotice) ||
      (isJapanese && isKrNotice);
    setIsTranslated(needsTranslation);
  }, [notice, isJapanese]);

  if (!notice) return null;

  const resolved = resolveNoticeDisplay(notice, isJapanese);

  // 다국어 텍스트 해석
  const title = isTranslated ? resolved.title : notice.title;
  const host = isTranslated ? resolved.host : notice.host;
  const courseName = isTranslated ? resolved.courseName : notice.courseName;
  const qualification = isTranslated ? resolved.qualification : (notice.qualification || '');
  const region = isTranslated ? resolved.region : notice.region;
  const periodStr = isTranslated ? resolved.periodStr : notice.periodStr;
  const eventDateStr = isTranslated ? resolved.eventDateStr : notice.eventDateStr;
  const entryFee = isTranslated ? resolved.entryFee : (notice.entryFee || '');
  const targetCount = isTranslated ? resolved.targetCount : (notice.targetCount || '');

  const handleShare = async () => {
    const shareText = `📢 [${isJapanese ? 'パークゴルフ オールインワン 大会公示' : '파크골프 올인원 시합 공고'}]\n${title}\n- ${isJapanese ? '日程' : '일시'}: ${eventDateStr}\n- ${isJapanese ? '場所' : '장소'}: ${courseName}\n- ${isJapanese ? '受付' : '접수'}: ${periodStr}\n\n👉 ${isJapanese ? '公式公示' : '공식 공고'}: ${notice.linkUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: notice.linkUrl,
        });
      } catch {
        // user cancel
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert(isJapanese ? '大会案内がクリップボードにコピーされました！' : '대회 안내 내용이 클립보드에 복사되었습니다!');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-500 max-h-[92vh] flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-amber-400 text-purple-950 font-black flex items-center justify-center text-xl shadow shrink-0">
              🏆
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black bg-amber-400 text-purple-950 px-2 py-0.5 rounded-full">
                  {notice.country === 'JP' ? (isJapanese ? '🇯🇵 日本公式大会' : '🇯🇵 일본 공식대회') : (isJapanese ? '🇰🇷 韓国公式大会' : '🇰🇷 대한민국 공식대회')}
                </span>
                {notice.status === 'RECRUITING' ? (
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {isJapanese ? '受付中 ⏳' : '접수중 ⏳'}
                  </span>
                ) : notice.status === 'UPCOMING' ? (
                  <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {isJapanese ? '受付予定 📅' : '접수예정 📅'}
                  </span>
                ) : (
                  <span className="bg-stone-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {isJapanese ? '締切 🏁' : '마감 🏁'}
                  </span>
                )}
              </div>
              <h3 className="font-extrabold text-sm text-white/90 truncate pt-0.5">
                {isJapanese ? '公式競技・大会公示 案内' : '공식 시합·대회 요강 상세'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-purple-950/60 hover:bg-purple-800 text-white transition ml-2"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Translation Banner / Switcher */}
        <div className="px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-black text-purple-950">
            <Globe className="w-4 h-4 text-purple-700" />
            <span>
              {notice.country === 'JP'
                ? isJapanese
                  ? '🇯🇵 日本 NPGA 公認大会'
                  : '🇯🇵 일본 NPGA 공인 대회 소식'
                : isJapanese
                ? '🇰🇷 韓国 KPGA 公認大会'
                : '🇰🇷 한국 KPGA 공인 전국대회'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsTranslated(!isTranslated)}
            className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs ${
              isTranslated
                ? 'bg-purple-700 text-white ring-2 ring-purple-300'
                : 'bg-white text-purple-900 border border-purple-300 hover:bg-purple-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {isTranslated
                ? notice.country === 'JP'
                  ? isJapanese
                    ? '🇯🇵 原文表示'
                    : '🇯🇵 일본어 원문보기'
                  : isJapanese
                  ? '🇰🇷 原文表示'
                  : '🇰🇷 한국어 원문보기'
                : notice.country === 'JP'
                ? isJapanese
                  ? '🇯🇵 原文のまま'
                  : '🌐 한국어로 번역'
                : isJapanese
                ? '🌐 日本語に翻訳'
                : '🌐 번역 보기'}
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 bg-stone-50">
          {/* Main Title & Badges */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md">
                📍 {region}
              </span>
              {distKm !== null && distKm !== undefined && (
                <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Car className="w-3 h-3" />
                  {isJapanese ? `現在地から ${distKm}km` : `내 위치서 ${distKm}km`}
                </span>
              )}
              {notice.linkUrl.includes('kpga7330') || notice.linkUrl.includes('parkgolf.or.jp') ? (
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {isJapanese ? '✓ 協会公認 原本公示' : '✓ 협회 공인 원본'}
                </span>
              ) : (
                <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {isJapanese ? '✓ 自治体・主催者公認' : '✓ 지자체 공인 원본'}
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-black text-stone-950 leading-snug">
              {title}
            </h2>
          </div>

          {/* Detailed Spec Grid */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-2.5 text-xs">
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-2">
              <span className="text-stone-500 font-bold shrink-0">
                {isJapanese ? '主催・主管:' : '주최/주관:'}
              </span>
              <span className="font-extrabold text-stone-900 text-right">{host}</span>
            </div>

            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-2">
              <span className="text-stone-500 font-bold shrink-0">
                {isJapanese ? '開催コース:' : '개최 구장:'}
              </span>
              <span className="font-black text-purple-950 text-right">{courseName}</span>
            </div>

            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-2">
              <span className="text-stone-500 font-bold shrink-0">
                {isJapanese ? '受付期間:' : '접수 기간:'}
              </span>
              <span className="font-black text-emerald-700 text-right">{periodStr}</span>
            </div>

            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-2">
              <span className="text-stone-500 font-bold shrink-0">
                {isJapanese ? '大会日時:' : '대회 일시:'}
              </span>
              <span className="font-extrabold text-stone-900 text-right">{eventDateStr}</span>
            </div>

            <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-2">
              <span className="text-stone-500 font-bold shrink-0">
                {isJapanese ? '参加費 / 定員:' : '참가비 / 정원:'}
              </span>
              <span className="font-extrabold text-stone-800 text-right">
                {entryFee} · {targetCount}
              </span>
            </div>

            <div className="flex items-start justify-between gap-3 pt-0.5">
              <span className="text-stone-500 font-bold shrink-0">
                {isJapanese ? '参加資格:' : '참가 자격:'}
              </span>
              <span className="font-bold text-stone-700 text-right break-keep">
                {qualification}
              </span>
            </div>
          </div>

          {/* AI Verification Note */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 text-xs text-purple-900 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
              <span>
                {isJapanese
                  ? 'AIが公式協会・主催元から自動検証した正規公示です'
                  : 'AI가 공식 협회 및 주최처 원본을 자동 검증한 공인 공고입니다.'}
              </span>
            </span>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-3 border-t border-stone-200 bg-white space-y-2 shrink-0">
          <div className="flex gap-2">
            <a
              href={notice.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-h-[46px] bg-purple-700 hover:bg-purple-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer px-3 text-center"
            >
              <ExternalLink className="w-4 h-4 shrink-0" />
              <span>{isJapanese ? '公式 受付公示を開く ↗' : '공식 접수 공고 보기 ↗'}</span>
            </a>

            {notice.pdfUrl && (
              <a
                href={notice.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[46px] px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-2xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                title={notice.pdfFileName || '대회요강 PDF'}
              >
                <FileText className="w-4 h-4" />
                <span>{isJapanese ? '要項PDF' : '요강 PDF'}</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="min-h-[46px] px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-xs rounded-2xl border border-stone-300 transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>{isJapanese ? '共有' : '공유'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center gap-1 active:scale-95 transition"
          >
            <span>{isJapanese ? '閉じる (一覧に戻る)' : '닫기 (시합 목록으로)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
