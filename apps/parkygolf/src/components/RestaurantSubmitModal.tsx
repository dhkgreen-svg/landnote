'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  MapPin,
  Star,
  Check,
  Sparkles,
  Phone,
  ExternalLink,
  Award,
  RefreshCw,
  Tag,
} from 'lucide-react';
import {
  RestaurantStorage,
  RestaurantRecommendation,
  SENIOR_CONVENIENCE_TAGS,
  getKakaoMapUrl,
} from '@/lib/restaurantStorage';
import { ParkOnStorage } from '@/lib/storage';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  phone: string;
  road_address_name: string;
  address_name: string;
  place_url: string;
  distance?: string;
}

interface RestaurantSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCourseName?: string;
  defaultCourseId?: string;
  onSuccess?: (newRestaurant: RestaurantRecommendation) => void;
}

export function RestaurantSubmitModal({
  isOpen,
  onClose,
  defaultCourseName = '구미 동락 파크골프장',
  defaultCourseId = '1',
  onSuccess,
}: RestaurantSubmitModalProps) {
  const { isJapanese } = useTranslation();
  const [courseName, setCourseName] = useState(defaultCourseName);
  const [courseId, setCourseId] = useState(defaultCourseId);

  // 카카오맵 장소 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KakaoPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(null);

  // 동호인 평가 상태
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['🅿️ 주차편함', '⚡ 초스피드']);
  const [reviewComment, setReviewComment] = useState('운동 끝나고 국밥 든든하게 먹기 딱 좋습니다.');
  const [recommendedBy, setRecommendedBy] = useState('');
  const [memberCode, setMemberCode] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // 모달 오픈 시 초기화
  useEffect(() => {
    if (isOpen) {
      if (defaultCourseName) setCourseName(defaultCourseName);
      if (defaultCourseId) setCourseId(defaultCourseId);

      // 사용자 닉네임 또는 회원 고유번호 자동 기입
      const savedUser = ParkOnStorage.getUserDisplayName();
      const mCode =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('parkon_member_code_v1') || localStorage.getItem('parkon_member_code') || 'PKYA-7788'
          : 'PKYA-7788';
      setMemberCode(mCode);

      const cleanName = savedUser && savedUser !== '파크골퍼' && savedUser !== '플레이어' ? savedUser : '김대표';
      setRecommendedBy(`${mCode} ${cleanName}`.trim());

      // 기본 구장 주변 식당 자동 로드
      const initialKeyword = defaultCourseName.replace('파크골프장', '').trim() || '동락';
      setSearchQuery(initialKeyword);
      executeSearch(initialKeyword);
    } else {
      setSelectedPlace(null);
      setShowSuccessToast(false);
    }
  }, [isOpen, defaultCourseName, defaultCourseId]);

  const executeSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/kakao/search?query=${encodeURIComponent(query)}&courseName=${encodeURIComponent(
          courseName
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.places)) {
          setSearchResults(data.places);
        }
      }
    } catch (e) {
      console.error('Failed to search kakao places:', e);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  const handleSelectPlace = (place: KakaoPlace) => {
    setSelectedPlace(place);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlace) {
      alert(isJapanese ? '地図の検索結果から店舗を選択してください。' : '카카오맵 검색 결과에서 식당을 먼저 선택해 주세요.');
      return;
    }

    if (!reviewComment.trim()) {
      alert(isJapanese ? '愛好者仲間のための一言レビューを入力してください。' : '동호인을 위한 한 줄 평을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 카테고리 매핑
      let category = '한식/국밥';
      const cat = selectedPlace.category_name || '';
      if (cat.includes('카페') || cat.includes('커피') || cat.includes('제과') || cat.includes('찻집')) {
        category = '카페/다과';
      } else if (cat.includes('백숙') || cat.includes('삼계탕') || cat.includes('오리')) {
        category = '오리/닭백숙';
      } else if (cat.includes('고기') || cat.includes('갈비') || cat.includes('삼겹살')) {
        category = '고기구이';
      } else if (cat.includes('국수') || cat.includes('냉면') || cat.includes('면') || cat.includes('분식')) {
        category = '면/분식';
      }

      const newRestaurant = RestaurantStorage.addRestaurant({
        courseId,
        courseName,
        name: selectedPlace.place_name,
        kakaoPlaceUrl: getKakaoMapUrl({ name: selectedPlace.place_name, kakaoPlaceUrl: selectedPlace.place_url }),
        kakaoPlaceId: selectedPlace.id,
        roadAddress: selectedPlace.road_address_name || selectedPlace.address_name,
        phone: selectedPlace.phone || '',
        category,
        signatureMenu: selectedPlace.place_name,
        tags: selectedTags,
        rating,
        reviewComment: reviewComment.trim(),
        recommendedBy: recommendedBy.trim() || (isJapanese ? '愛好者' : '동호인'),
        memberCode,
      });

      setShowSuccessToast(true);

      setTimeout(() => {
        setIsSubmitting(false);
        if (onSuccess) onSuccess(newRestaurant);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error submitting restaurant:', err);
      setIsSubmitting(false);
      alert(isJapanese ? '登録中にエラーが発生しました。もう一度お試しください。' : '등록 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-emerald-600 overflow-hidden my-4 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-4 sm:p-4.5 flex items-center justify-between text-stone-950 shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-stone-950 text-amber-300 flex items-center justify-center text-xl shrink-0 shadow-2xs">
              🗺️
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black bg-stone-950 text-amber-300 px-2 py-0.5 rounded-full">
                  {isJapanese ? '公式地図連動' : '카카오맵(다음 지도) 연동'}
                </span>
                <span className="text-[10px] font-bold text-stone-900">
                  {isJapanese ? '1秒URL自動登録' : '1초 URL 자동 등록'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight truncate">
                {isJapanese ? 'おすすめ行きつけ店を推薦する' : '우리 조 찐 단골 맛집 추천하기'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-restaurant-submit"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-950/15 hover:bg-stone-950/25 flex items-center justify-center text-stone-950 font-black transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 성공 토스트 */}
        {showSuccessToast ? (
          <div className="p-8 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl shadow-md border-2 border-emerald-400">
              🎉
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-stone-900">
                {isJapanese ? '行きつけ店の登録が完了しました！' : '단골 맛집 등록이 완료되었습니다!'}
              </h4>
              <p className="text-xs text-stone-600 font-medium">
                {isJapanese
                  ? '公式地図URLと愛好者評価が正常に連携されました。'
                  : '카카오맵 공식 URL과 동호인 별점이 성공적으로 연결되었습니다.'}
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs font-bold text-amber-900 flex items-center justify-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>{isJapanese ? '[🍽️ フィールドの美食家勲章] +1 獲得！' : '[🍽️ 필드의 미식가 훈장] +1 획득!'}</span>
            </div>
          </div>
        ) : (
          /* 본문 폼 스크롤 영역 */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            {/* 연계 구장 표시 */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex items-center justify-between text-xs font-bold text-stone-700">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-stone-500 shrink-0">{isJapanese ? '連携コース:' : '연계 구장:'}</span>
                <span className="font-black text-emerald-950 truncate">{courseName}</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black shrink-0">
                {isJapanese ? '自動指定' : '자동 지정'}
              </span>
            </div>

            {/* 1단계: 카카오맵 장소 검색창 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-black text-stone-900 flex items-center gap-1.5 text-xs">
                  <span>{isJapanese ? '1. 店舗検索 (地図連動)' : '1. 카카오맵 식당 검색'}</span>
                  <span className="text-amber-700 font-bold">{isJapanese ? '(タップで1秒自動連携)' : '(터치 시 1초 자동 바인딩)'}</span>
                </label>
                {selectedPlace && (
                  <button
                    type="button"
                    onClick={() => setSelectedPlace(null)}
                    className="text-[11px] text-emerald-700 font-black hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isJapanese ? '再検索' : '다시 검색하기'}</span>
                  </button>
                )}
              </div>

              {!selectedPlace ? (
                <div className="space-y-2.5">
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            executeSearch(searchQuery);
                          }
                        }}
                        placeholder={
                          isJapanese
                            ? '店名またはメニューで検索 (例: 焼肉、カフェ)'
                            : '식당 상호명 또는 메뉴 검색 (예: 동락 소고기국밥)'
                        }
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-8 pr-3 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-amber-500 transition shadow-2xs"
                      />
                      <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <button
                      type="button"
                      onClick={() => executeSearch(searchQuery)}
                      disabled={isSearching}
                      className="bg-stone-950 hover:bg-stone-800 text-amber-300 font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                    >
                      {isSearching ? (isJapanese ? '検索中...' : '검색 중...') : (isJapanese ? '検索' : '검색')}
                    </button>
                  </div>

                  {/* 검색 결과 목록 */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {searchResults.length === 0 ? (
                      <div className="text-center py-6 text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
                        {isSearching ? (
                          <span>{isJapanese ? '店舗を検索中です...' : '카카오맵에서 장소를 찾는 중입니다...'}</span>
                        ) : (
                          <span>{isJapanese ? '検索結果がありません。' : '검색된 식당이 없습니다. 상호명을 정확히 입력해 보세요.'}</span>
                        )}
                      </div>
                    ) : (
                      searchResults.map((place) => (
                        <div
                          key={place.id}
                          onClick={() => handleSelectPlace(place)}
                          className="bg-white hover:bg-amber-50/70 border border-stone-200 hover:border-amber-400 p-2.5 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition active:scale-[0.99] shadow-2xs"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-xs text-stone-900 truncate">
                                {place.place_name}
                              </span>
                              <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-medium">
                                {place.category_name.split('>').pop()?.trim() || (isJapanese ? '飲食店' : '음식점')}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                              <span>{place.road_address_name || place.address_name}</span>
                            </p>
                          </div>
                          <span className="text-[11px] bg-amber-400 text-stone-950 font-black px-2.5 py-1.5 rounded-lg shrink-0 shadow-2xs">
                            {isJapanese ? '選択 ➔' : '선택 ➔'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* 선택 완료된 식당 카드 */
                <div className="bg-gradient-to-r from-amber-50 to-emerald-50 border-2 border-amber-400 rounded-2xl p-3.5 space-y-2 shadow-sm animate-scaleUp">
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-amber-400 text-stone-950 font-black text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{isJapanese ? 'マップ連動完了' : '카카오맵 매핑 완료'}</span>
                    </span>
                    <a
                      href={selectedPlace.place_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-700 font-black hover:underline flex items-center gap-1"
                    >
                      <span>{isJapanese ? '地図プレビュー' : '카카오맵 미리보기'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-stone-900">
                      {selectedPlace.place_name}
                    </h4>
                    <p className="text-[11px] text-stone-600">
                      {selectedPlace.road_address_name || selectedPlace.address_name}
                    </p>
                    {selectedPlace.phone && (
                      <p className="text-[11px] text-emerald-800 font-bold flex items-center gap-1 pt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{selectedPlace.phone}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-[10px] text-stone-500 bg-white/80 p-1.5 rounded-lg border border-stone-200 font-mono truncate">
                    {isJapanese ? '公式URL: ' : '공식 URL: '}{selectedPlace.place_url}
                  </div>
                </div>
              )}
            </div>

            {/* 2단계: 동호인 전용 별점 평가 */}
            <div className="space-y-1.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
              <label className="font-black text-stone-900 block text-xs">
                {isJapanese ? '2. 愛好者星評価 (5点満点)' : '2. 동호인 별점 평가 (5점 만점)'}
              </label>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition active:scale-125 cursor-pointer text-2xl"
                      >
                        <span className={active ? 'text-amber-400 drop-shadow-xs' : 'text-stone-300'}>
                          ★
                        </span>
                      </button>
                    );
                  })}
                </div>
                <span className="text-sm font-black text-amber-900 bg-amber-100 px-3 py-1 rounded-xl">
                  {isJapanese ? `${rating}.0点満点` : `${rating}.0점 만점`}
                </span>
              </div>
            </div>

            {/* 3단계: 골퍼 전용 편의 태그 (다중 선택) */}
            <div className="space-y-1.5">
              <label className="font-black text-stone-900 block text-xs">
                {isJapanese ? '3. ゴルファー向け便利特徴 (複数選択可)' : '3. 골퍼 전용 체크 태그 (터치 선택)'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SENIOR_CONVENIENCE_TAGS.map((tag) => {
                  const isChecked = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                        isChecked
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4단계: 동호인 한 줄 평 */}
            <div className="space-y-1.5">
              <label className="font-black text-stone-900 block text-xs">
                {isJapanese ? '4. 愛好者正直一言レビュー' : '4. 골퍼 솔직 한 줄 평'}
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={2}
                placeholder={
                  isJapanese
                    ? 'ラウンド後の感想を愛好者仲間へ残してください。'
                    : '운동 끝나고 국밥 든든하게 먹기 딱 좋습니다.'
                }
                className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs font-medium text-stone-900 outline-none focus:border-emerald-600 leading-relaxed shadow-2xs"
              />
            </div>

            {/* 추천인 정보 자동 반영 */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-stone-500 bg-stone-100 p-2.5 rounded-xl font-medium">
              <span>{isJapanese ? '推薦者:' : '추천인:'} <strong className="text-stone-900">{recommendedBy}</strong></span>
              <span>{isJapanese ? '登録勲章自動付与' : '등록 훈장 자동 적립'}</span>
            </div>

            {/* 등록 완료 버튼 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !selectedPlace}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.99] cursor-pointer ${
                  selectedPlace
                    ? 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 hover:from-emerald-600 hover:to-teal-600 text-white'
                    : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  {isSubmitting
                    ? (isJapanese ? '登録処理中...' : '등록 처리 중...')
                    : (isJapanese ? '✍️ 行きつけ店の登録完了 (1秒保存)' : '✍️ 단골 맛집 등록 완료 (1초 저장)')}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
