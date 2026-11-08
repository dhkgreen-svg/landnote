'use client';

import React, { useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  ExternalLink,
  Star,
  Check,
  Send,
  MessageSquare,
  Sparkles,
  Share2,
} from 'lucide-react';
import {
  RestaurantRecommendation,
  RestaurantStorage,
  getKakaoMapUrl,
} from '@/lib/restaurantStorage';
import { ParkOnStorage } from '@/lib/storage';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface RestaurantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: RestaurantRecommendation | null;
  onReviewAdded?: (updated: RestaurantRecommendation) => void;
}

export function RestaurantDetailModal({
  isOpen,
  onClose,
  restaurant,
  onReviewAdded,
}: RestaurantDetailModalProps) {
  const { isJapanese } = useTranslation();
  const [currentRest, setCurrentRest] = useState<RestaurantRecommendation | null>(restaurant);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // restaurant prop 변경 시 동기화
  React.useEffect(() => {
    setCurrentRest(restaurant);
    setShowReviewForm(false);
    setNewComment('');
    setShowSuccessToast(false);
  }, [restaurant]);

  if (!isOpen || !currentRest) return null;

  const handleOpenKakaoMap = () => {
    const targetUrl = getKakaoMapUrl(currentRest);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleAddReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      alert(isJapanese ? '評価・感想を入力してください。' : '평가 한 줄 평을 입력해 주세요.');
      return;
    }

    setIsSubmittingReview(true);

    const savedUser = ParkOnStorage.getUserDisplayName();
    const memberCode =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('parkon_member_code_v1') || localStorage.getItem('parkon_member_code') || 'PKYA-7788'
        : 'PKYA-7788';
    const cleanName = savedUser && savedUser !== '파크골퍼' && savedUser !== '플레이어' ? savedUser : (isJapanese ? '愛好者' : '동호인');
    const author = `${memberCode} ${cleanName}`.trim();

    const result = RestaurantStorage.addReview(currentRest.id, {
      author,
      memberCode,
      rating: newRating,
      comment: newComment.trim(),
    });

    if (result.success && result.updatedRestaurant) {
      setCurrentRest(result.updatedRestaurant);
      if (onReviewAdded) onReviewAdded(result.updatedRestaurant);
      setShowSuccessToast(true);
      setNewComment('');
      setShowReviewForm(false);
      setTimeout(() => setShowSuccessToast(false), 2000);
    }

    setIsSubmittingReview(false);
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-emerald-600 overflow-hidden my-4 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-4.5 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-xl shrink-0">
              {currentRest.category === '카페/다과' ? '☕' : '🍲'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentRest.isAuctionWinner && (
                  <span className="bg-amber-400 text-stone-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
                    {isJapanese ? '👑 コース公式推薦1位' : '👑 구장 공식 추천 1위'}
                  </span>
                )}
                <span className="text-[10px] bg-white/20 text-emerald-100 font-bold px-1.5 py-0.5 rounded">
                  {currentRest.category === '카페/다과' ? (isJapanese ? 'カフェ/お茶' : '카페/다과') : (isJapanese ? '食堂/グルメ' : '식당/맛집')}
                </span>
                <span className="text-[10px] text-emerald-200 truncate">
                  {currentRest.courseName}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                {currentRest.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-restaurant-detail"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-black transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 본문 스크롤 영역 (이원화 스플릿 뷰) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* ========================================================================= */}
          {/* 1부: 카카오맵 공식 연동부 (다이렉트 아웃링크 및 매장 정보) */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 border-2 border-amber-400/80 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black bg-stone-950 text-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                <span>🗺️</span>
                <span>{isJapanese ? '公式地図連動' : '카카오맵(다음 지도) 공식 연동'}</span>
              </span>
              <span className="text-[10px] text-stone-500 font-bold">
                {isJapanese ? 'マップ連動完了' : '1초 매핑 완료'}
              </span>
            </div>

            {/* 대형 카카오맵 바로가기 버튼 */}
            <button
              type="button"
              onClick={handleOpenKakaoMap}
              className="w-full bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99] cursor-pointer border border-[#E6CF00]"
            >
              <span className="text-base">🗺️</span>
              <span>{isJapanese ? '地図で店舗・メニュー・ロードビューを見る ▶' : '카카오맵으로 매장·메뉴·로드뷰 보기 ▶'}</span>
              <ExternalLink className="w-4 h-4 ml-0.5" />
            </button>

            {/* 도로명 주소 & 전화 연결 */}
            <div className="space-y-1.5 pt-1 text-stone-700">
              <p className="flex items-start gap-1.5 font-bold">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{currentRest.roadAddress}</span>
              </p>
              {currentRest.phone && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-stone-500 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>{currentRest.phone}</span>
                  </span>
                  <a
                    href={`tel:${currentRest.phone}`}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-1.5 px-3 rounded-lg shadow-2xs transition active:scale-95"
                  >
                    {isJapanese ? '電話をかける 📞' : '전화 걸기 📞'}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2부: 우리 플랫폼 고유 동호인 자산 (별점 평균, 골퍼 태그, 리뷰 목록) */}
          {/* ========================================================================= */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3.5 shadow-2xs">
            {/* 별점 총평 카드 */}
            <div className="flex items-center justify-between bg-stone-50 p-3.5 rounded-xl border border-stone-200">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-stone-500">
                  {isJapanese ? 'パークゴルフ愛好者総合評価' : '파크골프 동호인 종합 평점'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-amber-500">
                    ★ {(currentRest.rating || 5).toFixed(1)}
                  </span>
                  <span className="text-xs text-stone-500 font-bold">
                    ({isJapanese
                      ? `${currentRest.ratingsCount || currentRest.reviews?.length || 1}人参加`
                      : `${currentRest.ratingsCount || currentRest.reviews?.length || 1}명 참여`})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewForm((prev) => !prev)}
                className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-2 px-3 rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {showReviewForm
                    ? (isJapanese ? '評価を閉じる' : '평가 닫기')
                    : (isJapanese ? '評価・レビューする' : '나도 평가하기')}
                </span>
              </button>
            </div>

            {/* 골퍼 전용 편의 태그들 */}
            {currentRest.tags && currentRest.tags.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-stone-500">
                  {isJapanese ? 'ゴルファー向け便利特徴' : '골퍼 맞춤 편의 시설'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentRest.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 성공 토스트 */}
            {showSuccessToast && (
              <div className="bg-emerald-100 border border-emerald-400 text-emerald-900 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-700" />
                <span>
                  {isJapanese
                    ? '評価が登録され平均星評価に反映されました！'
                    : '평가가 성공적으로 등록되어 평균 별점에 반영되었습니다!'}
                </span>
              </div>
            )}

            {/* 인라인 나도 평가하기 / 별점 주기 폼 */}
            {showReviewForm && (
              <form
                onSubmit={handleAddReviewSubmit}
                className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-3.5 space-y-2.5 animate-scaleUp"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-900 text-xs">
                    {isJapanese ? '✍️ 私の評価と一言レビュー' : '✍️ 나의 동호인 별점 및 한 줄 평'}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="text-xl p-0.5 transition active:scale-125 cursor-pointer text-amber-400"
                      >
                        {newRating >= star ? '★' : '☆'}
                      </button>
                    ))}
                    <span className="ml-1 text-xs font-black text-amber-900">
                      {newRating}.0{isJapanese ? '点' : '점'}
                    </span>
                  </div>
                </div>

                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={
                    isJapanese
                      ? 'ラウンド後の感想を愛好者仲間へ残してください (例: 駐車場が広く料理も最高です)'
                      : '라운드 후 식사 후기를 동호인들에게 남겨주세요 (예: 주차 편하고 반찬 리필 최고입니다)'
                  }
                  rows={2}
                  className="w-full bg-white border border-stone-300 rounded-xl p-2.5 text-xs font-medium text-stone-900 outline-none focus:border-amber-500"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="bg-stone-200 text-stone-700 font-bold text-xs py-1.5 px-3 rounded-lg cursor-pointer"
                  >
                    {isJapanese ? 'キャンセル' : '취소'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-1.5 px-3 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>
                      {isSubmittingReview
                        ? (isJapanese ? '保存中...' : '저장 중...')
                        : (isJapanese ? '評価登録' : '별점 등록')}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* 골퍼 리뷰 목록 */}
            <div className="space-y-2 pt-1 border-t border-stone-100">
              <div className="flex items-center justify-between text-[11px] font-black text-stone-600">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    {isJapanese
                      ? `愛好者リアルレビュー (${currentRest.reviews?.length || 1}件)`
                      : `동호인 생생 리뷰 (${currentRest.reviews?.length || 1}개)`}
                  </span>
                </span>
                <span className="text-stone-400">{isJapanese ? '最新順' : '최신순'}</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(currentRest.reviews && currentRest.reviews.length > 0
                  ? currentRest.reviews
                  : [
                      {
                        id: 'default-rev',
                        author: currentRest.recommendedBy || (isJapanese ? '愛好者' : '동호인'),
                        rating: currentRest.rating || 5,
                        comment: currentRest.reviewComment || (isJapanese ? 'ラウンド後に美味しく食べるのに最高です。' : '운동 끝나고 든든하게 먹기 최고입니다.'),
                        createdAt: currentRest.createdAt?.split('T')[0] || '2026-10-01',
                      },
                    ]
                ).map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-stone-50 border border-stone-200/80 rounded-xl p-2.5 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-stone-900">
                          {rev.author}
                        </span>
                        <span className="text-amber-500 font-black text-xs">
                          ★ {rev.rating}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400">{rev.createdAt}</span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed font-medium">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 고정 닫기 버튼 */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs">
          <span className="text-stone-500 font-medium">
            {isJapanese ? '愛好者公認行きつけグルメシステム' : '동호인 검증 찐 단골 맛집 시스템'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-900 text-white font-black text-xs px-4 py-2 rounded-xl cursor-pointer"
          >
            {isJapanese ? '閉じる' : '닫기'}
          </button>
        </div>
      </div>
    </div>
  );
}
