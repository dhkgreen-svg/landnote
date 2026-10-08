'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Plus,
  ThumbsUp,
  MapPin,
  ExternalLink,
  Phone,
  Crown,
  Trophy,
  Flame,
  Sparkles,
  Filter,
} from 'lucide-react';
import {
  RestaurantStorage,
  RestaurantRecommendation,
  RESTAURANT_CATEGORIES,
} from '@/lib/restaurantStorage';
import { RestaurantSubmitModal } from '@/components/RestaurantSubmitModal';
import { RestaurantOwnerContactModal } from '@/components/RestaurantOwnerContactModal';
import { BottomNav } from '@/components/BottomNav';

const REGIONS = [
  '전국 전체',
  '대구/경북',
  '서울/경기/인천',
  '부산/경남/울산',
  '강원',
  '충청/대전/세종',
  '전라/광주/제주',
];

export default function NationalRestaurantsPage() {
  const [allRestaurants, setAllRestaurants] = useState<RestaurantRecommendation[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('전국 전체');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showOwnerModal, setShowOwnerModal] = useState<boolean>(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const reloadData = () => {
    const list = RestaurantStorage.getAllRestaurants();
    setAllRestaurants(list);

    const initialLikes: Record<string, boolean> = {};
    list.forEach((r) => {
      initialLikes[r.id] = RestaurantStorage.isLikedByUser(r.id);
    });
    setLikedMap(initialLikes);
  };

  useEffect(() => {
    reloadData();
  }, []);

  const handleLike = (restaurantId: string) => {
    const res = RestaurantStorage.toggleLike(restaurantId);
    if (res.success) {
      setLikedMap((prev) => ({ ...prev, [restaurantId]: res.isLiked }));
      setAllRestaurants((prev) =>
        prev.map((r) => (r.id === restaurantId ? { ...r, likesCount: res.newCount } : r))
      );
    }
  };

  // Top 10 Weekly Most Recommended
  const top10List = [...allRestaurants]
    .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
    .slice(0, 10);

  // Filtered List
  const filtered = allRestaurants.filter((r) => {
    // Region matching
    let matchRegion = true;
    if (selectedRegion === '대구/경북') {
      matchRegion = r.region.includes('대구') || r.region.includes('경북') || r.region.includes('구미');
    } else if (selectedRegion === '서울/경기/인천') {
      matchRegion = r.region.includes('서울') || r.region.includes('경기') || r.region.includes('인천');
    } else if (selectedRegion === '부산/경남/울산') {
      matchRegion = r.region.includes('부산') || r.region.includes('경남') || r.region.includes('울산') || r.region.includes('밀양');
    } else if (selectedRegion === '강원') {
      matchRegion = r.region.includes('강원') || r.region.includes('화천');
    } else if (selectedRegion === '충청/대전/세종') {
      matchRegion = r.region.includes('충북') || r.region.includes('충남') || r.region.includes('대전') || r.region.includes('세종');
    } else if (selectedRegion === '전라/광주/제주') {
      matchRegion = r.region.includes('전북') || r.region.includes('전남') || r.region.includes('광주') || r.region.includes('제주');
    }

    // Category matching
    const matchCategory = selectedCategory === '전체' || r.category === selectedCategory;

    // Search query
    const matchQuery =
      !searchQuery.trim() ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.signatureMenu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.region.toLowerCase().includes(searchQuery.toLowerCase());

    return matchRegion && matchCategory && matchQuery;
  });

  return (
    <div className="min-h-screen bg-stone-100 pb-28 text-stone-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="p-1.5 rounded-xl text-stone-600 hover:text-stone-950 hover:bg-stone-100 transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="text-xl">🍲</span>
              <h1 className="font-black text-base text-stone-950">
                전국 400개 구장 동호인 찐 맛집
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>추천하기</span>
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="구장명(예: 동락, 수성) 또는 식당, 메뉴 검색"
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-sm font-bold text-stone-900 placeholder:text-stone-400 shadow-2xs focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-hidden"
          />
        </div>

        {/* 🏆 이번 주 전국 맛집 TOP 10 랭킹 가로 스크롤 섹션 */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-400 rounded-3xl p-3.5 shadow-md space-y-2.5 text-stone-950">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Flame className="w-5 h-5 text-rose-600 fill-current animate-pulse" />
              <span className="font-black text-sm tracking-tight">
                이번 주 골퍼 추천 전국 맛집 TOP 10
              </span>
            </div>
            <span className="text-[11px] font-black bg-stone-950 text-amber-300 px-2 py-0.5 rounded-full">
              실시간 랭킹
            </span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {top10List.map((rest, rankIdx) => (
              <div
                key={rest.id}
                className="w-56 shrink-0 bg-white rounded-2xl p-3 shadow-sm border border-amber-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-6 h-6 rounded-lg bg-stone-950 text-amber-300 font-black text-xs flex items-center justify-center">
                      {rankIdx + 1}
                    </span>
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      👍 {rest.likesCount}명 추천
                    </span>
                  </div>
                  <h4 className="font-black text-sm text-stone-950 truncate">{rest.name}</h4>
                  <p className="text-[11px] font-bold text-stone-600 truncate mt-0.5">
                    ⛳ {rest.courseName}
                  </p>
                  <p className="text-[11px] font-black text-amber-700 truncate mt-1">
                    ⭐ {rest.signatureMenu}
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <span className="text-stone-500 font-medium truncate max-w-[120px]">
                    {rest.region}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLike(rest.id)}
                    className="text-emerald-700 font-black flex items-center gap-0.5 cursor-pointer"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>추천</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Region Filter Buttons */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {REGIONS.map((reg) => {
            const isSel = selectedRegion === reg;
            return (
              <button
                key={reg}
                type="button"
                onClick={() => setSelectedRegion(reg)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition border cursor-pointer ${
                  isSel
                    ? 'bg-emerald-800 text-amber-300 border-emerald-900 shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200'
                }`}
              >
                {reg}
              </button>
            );
          })}
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {RESTAURANT_CATEGORIES.map((cat) => {
            const isSel = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black shrink-0 transition border cursor-pointer ${
                  isSel
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-600 hover:bg-stone-50 border-stone-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Feed List Header */}
        <div className="flex items-center justify-between px-1 text-xs font-bold text-stone-600">
          <span>{selectedRegion} 맛집 피드 ({filtered.length}개)</span>
          <span className="text-[11px] text-emerald-800">동호인 엄지척 순 정렬</span>
        </div>

        {/* Cards Feed */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-dashed border-stone-300 text-center space-y-3">
            <div className="text-4xl">🍲</div>
            <h4 className="font-black text-stone-900 text-base">
              해당 지역에 등록된 맛집이 없습니다
            </h4>
            <p className="text-xs text-stone-500 font-semibold leading-relaxed">
              자주 가시는 단골 식당을 전국 동호인들에게 가장 먼저 소개해 주세요!
            </p>
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              + 내가 아는 단골집 1초 추천하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((rest) => {
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
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {rest.isAuctionSponsored && (
                        <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                          <Crown className="w-3 h-3 fill-current" />
                          <span>{rest.sponsorBadge || '👑 파워링크 1등'}</span>
                        </span>
                      )}
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2 py-0.5 rounded-md border border-emerald-200">
                        {rest.category}
                      </span>
                      <span className="text-[11px] font-black text-emerald-900 bg-stone-100 px-2 py-0.5 rounded-md">
                        ⛳ {rest.courseName}
                      </span>
                    </div>

                    <span className="text-[10px] text-stone-400 font-semibold">
                      {rest.createdAt?.split('T')[0] || ''}
                    </span>
                  </div>

                  {/* Name & Menu */}
                  <div className="space-y-1 mb-2.5">
                    <h4 className="text-base sm:text-lg font-black text-stone-950 tracking-tight flex items-center justify-between">
                      <span>{rest.name}</span>
                    </h4>
                    <div className="text-xs sm:text-sm font-black text-emerald-700 flex items-center gap-1.5">
                      <span>⭐ 대표:</span>
                      <span className="text-stone-900">{rest.signatureMenu}</span>
                    </div>
                  </div>

                  {/* Tags */}
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

                  {/* Review Quote */}
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

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
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

                    {rest.phone && (
                      <a
                        href={`tel:${rest.phone}`}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 flex items-center justify-center transition active:scale-95 shrink-0"
                        title="전화 걸기"
                      >
                        <Phone className="w-4 h-4 text-emerald-700" />
                      </a>
                    )}

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

        {/* Owner Auction Inquiries Banner */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowOwnerModal(true)}
            className="w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-black text-white font-bold text-xs flex items-center justify-between transition cursor-pointer shadow-md"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">📢</span>
              <div className="text-left">
                <span className="font-black text-amber-300 block">식당 사장님이신가요?</span>
                <span className="text-[11px] text-stone-300">구장 1등 상단 고정 파워링크 등록 문의</span>
              </div>
            </div>
            <span className="bg-amber-400 text-stone-950 font-black text-xs px-2.5 py-1 rounded-xl">
              안내 보기 ▶
            </span>
          </button>
        </div>
      </main>

      {/* Submit Modal */}
      <RestaurantSubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={() => reloadData()}
      />

      {/* Owner Contact Modal */}
      <RestaurantOwnerContactModal
        isOpen={showOwnerModal}
        onClose={() => setShowOwnerModal(false)}
      />

      <BottomNav />
    </div>
  );
}
