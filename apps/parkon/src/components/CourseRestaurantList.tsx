'use client';

import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Plus,
  ThumbsUp,
  Phone,
  MapPin,
  ExternalLink,
  Crown,
  Sparkles,
  Search,
  MessageSquare,
  Award,
  Filter,
} from 'lucide-react';
import {
  RestaurantStorage,
  RestaurantRecommendation,
  RESTAURANT_CATEGORIES,
} from '@/lib/restaurantStorage';
import { RestaurantSubmitModal } from '@/components/RestaurantSubmitModal';
import { RestaurantOwnerContactModal } from '@/components/RestaurantOwnerContactModal';

interface CourseRestaurantListProps {
  courseId: string;
  courseName: string;
  onOpenSubmitModal?: () => void;
}

export function CourseRestaurantList({ courseId, courseName }: CourseRestaurantListProps) {
  const [restaurants, setRestaurants] = useState<RestaurantRecommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [sortBy, setSortBy] = useState<'LIKES' | 'LATEST'>('LIKES');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showOwnerModal, setShowOwnerModal] = useState<boolean>(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const reloadData = () => {
    const list = RestaurantStorage.getRestaurantsByCourse(courseName || courseId);
    setRestaurants(list);

    const initialLikes: Record<string, boolean> = {};
    list.forEach((r) => {
      initialLikes[r.id] = RestaurantStorage.isLikedByUser(r.id);
    });
    setLikedMap(initialLikes);
  };

  useEffect(() => {
    reloadData();
  }, [courseId, courseName]);

  const handleLike = (restaurantId: string) => {
    const res = RestaurantStorage.toggleLike(restaurantId);
    if (res.success) {
      setLikedMap((prev) => ({ ...prev, [restaurantId]: res.isLiked }));
      setRestaurants((prev) =>
        prev.map((r) => (r.id === restaurantId ? { ...r, likesCount: res.newCount } : r))
      );
    }
  };

  // Filter & Sort
  const filtered = restaurants.filter((r) => {
    const matchCat = selectedCategory === '전체' || r.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.signatureMenu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    // 1순위: 옥션 스폰서 상단 고정 (isAuctionSponsored)
    if (a.isAuctionSponsored && !b.isAuctionSponsored) return -1;
    if (!a.isAuctionSponsored && b.isAuctionSponsored) return 1;

    // 2순위: 정렬 기준 (추천순 vs 최신순)
    if (sortBy === 'LIKES') {
      return (b.likesCount || 0) - (a.likesCount || 0);
    }
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return (
    <div className="space-y-3.5">
      {/* 1. 최상단 대형 액션 버튼: [ + 내가 아는 이 구장 찐 단골집 추천하기 ] */}
      <button
        type="button"
        onClick={() => setShowSubmitModal(true)}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-md border border-emerald-400 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
      >
        <span className="text-xl">🍲</span>
        <span>+ 내가 아는 이 구장 찐 단골집 추천하기</span>
      </button>

      {/* 2. 카테고리 필터 칩 & 정렬 토글 */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {RESTAURANT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition border cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-800 text-amber-300 border-emerald-900 shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-50 border-stone-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-1 font-bold text-stone-600">
            <span>총 {sorted.length}곳의 동호인 검증 맛집</span>
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setSortBy('LIKES')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition cursor-pointer ${
                sortBy === 'LIKES'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              👍 추천순
            </button>
            <button
              type="button"
              onClick={() => setSortBy('LATEST')}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-black transition cursor-pointer ${
                sortBy === 'LATEST'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🕒 최신순
            </button>
          </div>
        </div>
      </div>

      {/* 3. 맛집 카드 리스트 */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-dashed border-stone-300 text-center space-y-3">
          <div className="text-4xl">🍲</div>
          <div className="space-y-1">
            <h4 className="font-black text-stone-900 text-base">
              아직 등록된 단골 식당이 없습니다
            </h4>
            <p className="text-xs text-stone-500 font-semibold leading-relaxed">
              대표님과 회원님이 자주 가시는 이 구장 찐 단골집을<br />
              전국 1호로 가장 먼저 추천해 보세요!
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
          >
            첫 단골집 1초 추천하기 ▶
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((rest) => {
            const isLiked = likedMap[rest.id] || false;

            return (
              <div
                key={rest.id}
                className={`rounded-2xl p-4 border transition shadow-sm relative overflow-hidden ${
                  rest.isAuctionSponsored
                    ? 'bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/40 border-amber-300 ring-2 ring-amber-400/40'
                    : 'bg-white hover:border-emerald-300 border-stone-200'
                }`}
              >
                {/* 상단 옥션 스폰서 뱃지 또는 카테고리 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {rest.isAuctionSponsored && (
                      <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                        <Crown className="w-3 h-3 fill-current" />
                        <span>{rest.sponsorBadge || '👑 구장 추천 1등'}</span>
                      </span>
                    )}
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2 py-0.5 rounded-md border border-emerald-200">
                      {rest.category}
                    </span>
                    <span className="text-[11px] text-stone-500 font-bold truncate max-w-[160px]">
                      📍 {rest.region}
                    </span>
                  </div>

                  <span className="text-[10px] text-stone-400 font-semibold">
                    {rest.createdAt?.split('T')[0] || ''}
                  </span>
                </div>

                {/* 상호명 & 대표 메뉴 */}
                <div className="space-y-1 mb-2.5">
                  <h4 className="text-base sm:text-lg font-black text-stone-950 tracking-tight flex items-center justify-between">
                    <span>{rest.name}</span>
                  </h4>
                  <div className="text-xs sm:text-sm font-black text-emerald-700 flex items-center gap-1.5">
                    <span>⭐ 대표:</span>
                    <span className="text-stone-900">{rest.signatureMenu}</span>
                  </div>
                </div>

                {/* 골퍼 편의 태그 칩들 */}
                {rest.tags && rest.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {rest.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 border border-stone-200/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 추천인의 한마디 말풍선 */}
                {rest.reviewComment && (
                  <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200 text-xs text-stone-700 font-medium mb-3 relative">
                    <p className="leading-snug italic text-[11.5px]">
                      &ldquo;{rest.reviewComment}&rdquo;
                    </p>
                    <div className="text-right mt-1 text-[10.5px] font-black text-stone-500">
                      — 추천: <strong className="text-emerald-800">{rest.recommendedBy}</strong>
                    </div>
                  </div>
                )}

                {/* 하단 액션 버튼들: [ 👍 저도 여기 단골이에요 (+N) ] | [ 전화 ] | [ 지도 ] */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                  {/* 동호인 엄지척 추천 버튼 */}
                  <button
                    type="button"
                    onClick={() => handleLike(rest.id)}
                    className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 border active:scale-95 cursor-pointer shadow-2xs ${
                      isLiked
                        ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-amber-300/40 ring-1 ring-amber-400'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-stone-950' : 'text-emerald-700'}`} />
                    <span>저도 여기 단골이에요</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-black ${
                      isLiked ? 'bg-stone-950 text-amber-300' : 'bg-emerald-600 text-white'
                    }`}>
                      +{rest.likesCount}
                    </span>
                  </button>

                  {/* 전화 걸기 버튼 */}
                  {rest.phone && (
                    <a
                      href={`tel:${rest.phone}`}
                      className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center justify-center transition active:scale-95 shrink-0"
                      title="전화 걸기"
                    >
                      <Phone className="w-4 h-4 text-emerald-700" />
                    </a>
                  )}

                  {/* 네이버 지도 검색 연동 */}
                  <a
                    href={`https://m.map.naver.com/search2/search.naver?query=${encodeURIComponent(
                      `${rest.region || ''} ${rest.name}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center justify-center transition active:scale-95 shrink-0"
                    title="네이버 지도 보기"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. 하단 가벼운 옥션 문의 배너: [ 식당 사장님이신가요? 상단 고정 옥션 등록 문의 ▶ ] */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowOwnerModal(true)}
          className="w-full py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-600 font-bold text-xs flex items-center justify-between transition cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <span>📢</span>
            <span className="font-black text-stone-800">식당 사장님이신가요?</span>
            <span className="text-[11px] text-stone-500">구장 1등 상단 고정 등록 안내</span>
          </div>
          <span className="text-emerald-700 font-black text-xs">문의하기 ▶</span>
        </button>
      </div>

      {/* 모달 연동 */}
      <RestaurantSubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        defaultCourseName={courseName}
        defaultCourseId={courseId}
        onSuccess={() => reloadData()}
      />

      <RestaurantOwnerContactModal
        isOpen={showOwnerModal}
        onClose={() => setShowOwnerModal(false)}
        courseName={courseName}
      />
    </div>
  );
}
