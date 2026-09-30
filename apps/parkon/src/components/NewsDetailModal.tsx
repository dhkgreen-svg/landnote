'use client';

import React, { useState } from 'react';
import {
  X,
  Newspaper,
  Calendar,
  Globe,
  Sparkles,
  ExternalLink,
  Share2,
  ThumbsUp,
  Eye,
  MapPin,
} from 'lucide-react';
import { ParkGolfNewsItem } from '@/types/board';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { resolveNewsDisplay } from '@/lib/bilingualBoardHelper';

interface NewsDetailModalProps {
  news: ParkGolfNewsItem | null;
  onLike?: (id: string) => void;
  onClose: () => void;
}

export function NewsDetailModal({
  news,
  onLike,
  onClose,
}: NewsDetailModalProps) {
  const { isJapanese } = useTranslation();
  const [isTranslated, setIsTranslated] = useState(false);
  const [liked, setLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(0);

  React.useEffect(() => {
    if (!news) return;
    const isJpNews = news.country === 'JP';
    const isKrNews = !news.country || news.country === 'KR';
    const needsTranslation =
      (!isJapanese && isJpNews) ||
      (isJapanese && isKrNews);
    setIsTranslated(needsTranslation);
    setCurrentLikes(news.likeCount);
    setLiked(false);
  }, [news, isJapanese]);

  if (!news) return null;

  const resolved = resolveNewsDisplay(news, isJapanese);

  const title = isTranslated ? resolved.title : news.title;
  const summary = isTranslated ? resolved.summary : news.summary;
  const region = isTranslated ? resolved.region : news.region;
  const source = isTranslated ? resolved.source : news.source;
  const dateStr = isTranslated ? resolved.dateStr : news.dateStr;

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      setCurrentLikes(currentLikes + 1);
      if (onLike) onLike(news.id);
    }
  };

  const handleShare = async () => {
    const shareText = `📰 [${isJapanese ? 'パークゴルフ オールインワン ニュース' : '파크골프 올인원 뉴스'}]\n${title}\n- ${isJapanese ? '出処' : '출처'}: ${source}\n- ${isJapanese ? '日付' : '일자'}: ${dateStr}\n\n👉 ${isJapanese ? '記事を開く' : '기사 보기'}: ${news.linkUrl || window.location.href}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: news.linkUrl || window.location.href,
        });
      } catch {
        // cancel
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert(isJapanese ? 'ニュース案内がコピーされました！' : '뉴스 내용이 클립보드에 복사되었습니다!');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-500 max-h-[90vh] flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 font-black flex items-center justify-center text-xl shadow shrink-0">
              📰
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full">
                  {news.country === 'JP' ? '🇯🇵 日本パークゴルフニュース' : '🇰🇷 파크골프 실시간 뉴스'}
                </span>
                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {news.category === 'MAJOR'
                    ? isJapanese
                      ? '重要公式'
                      : '협회 주요 소식'
                    : news.category === 'USER_REPORT'
                    ? isJapanese
                      ? '会員速報'
                      : '회원 제보'
                    : isJapanese
                    ? '地域ニュース'
                    : '로컬 현장'}
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-white/90 truncate pt-0.5">
                {isJapanese ? '詳細記事・現場ニュース' : '뉴스 상세 전문'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-emerald-950/60 hover:bg-emerald-800 text-white transition ml-2"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Translation Banner / Switcher */}
        <div className="px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
            <Globe className="w-4 h-4 text-emerald-700" />
            <span>
              {news.country === 'JP'
                ? isJapanese
                  ? '🇯🇵 日本現地 パークゴルフ情報'
                  : '🇯🇵 일본 현지 파크골프 뉴스'
                : isJapanese
                ? '🇰🇷 韓国現地 パークゴルフ情報'
                : '🇰🇷 한국 전국 파크골프 뉴스'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsTranslated(!isTranslated)}
            className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs ${
              isTranslated
                ? 'bg-emerald-700 text-white ring-2 ring-emerald-300'
                : 'bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {isTranslated
                ? news.country === 'JP'
                  ? isJapanese
                    ? '🇯🇵 原文表示'
                    : '🇯🇵 일본어 원문보기'
                  : isJapanese
                  ? '🇰🇷 原文表示'
                  : '🇰🇷 한국어 원문보기'
                : news.country === 'JP'
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
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500 font-bold border-b border-stone-100 pb-2">
              <span className="flex items-center gap-1 text-emerald-800 font-black">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {region}
              </span>
              <span>{dateStr}</span>
            </div>

            <h2 className="text-base sm:text-lg font-black text-stone-950 leading-snug">
              {title}
            </h2>

            <div className="flex items-center gap-3 text-xs text-stone-500 font-bold pt-1">
              <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-700">
                {isJapanese ? '出処: ' : '출처: '}
                {source}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {news.viewCount}
              </span>
              <span className="flex items-center gap-1 text-rose-600">
                <ThumbsUp className="w-3.5 h-3.5" />
                {currentLikes}
              </span>
            </div>
          </div>

          {/* Full Summary Content */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
            <p className="text-sm font-bold text-stone-800 leading-relaxed whitespace-pre-line break-keep">
              {summary}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-stone-200 bg-white space-y-2 shrink-0">
          <div className="flex gap-2">
            {news.linkUrl ? (
              <a
                href={news.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[46px] bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer px-3 text-center"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>{isJapanese ? '元記事・公式サイトを開く ↗' : '원문 기사·공식 사이트 보기 ↗'}</span>
              </a>
            ) : null}

            <button
              type="button"
              onClick={handleLike}
              className={`min-h-[46px] px-4 font-black text-xs rounded-2xl transition active:scale-95 flex items-center justify-center gap-1.5 ${
                liked
                  ? 'bg-rose-50 text-rose-600 border border-rose-300'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{liked ? (isJapanese ? '推薦完了' : '추천함') : (isJapanese ? '推薦' : '추천')}</span>
            </button>

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
            <span>{isJapanese ? '閉じる (一覧に戻る)' : '닫기 (뉴스 목록으로)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
