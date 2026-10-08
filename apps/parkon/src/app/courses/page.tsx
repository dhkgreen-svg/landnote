'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Plus,
  Star,
  Search,
  Check,
  X,
  Award,
  Sparkles,
  Edit3,
  ChevronRight,
  ChevronDown,
  Trash2,
  Phone,
  ExternalLink,
  MessageSquare,
  Gift,
  Coffee,
  Tv,
  Compass,
  Users,
  Building,
  Crown,
  Minus,
} from 'lucide-react';
import { Course, formatCourseHolesText } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';
import { DEFAULT_COURSES, generateStandardHoles } from '@/lib/defaultCourses';
import { ContributeModal } from '@/components/ContributeModal';
import { CourseDetailModal } from '@/components/CourseDetailModal';
import { StoreRegisterModal } from '@/components/StoreRegisterModal';
import { TourRegisterModal } from '@/components/TourRegisterModal';
import { ClubRegisterModal } from '@/components/ClubRegisterModal';
import { ClubJoinModal } from '@/components/ClubJoinModal';
import { CourseReviewFormModal } from '@/components/CourseReviewFormModal';
import { RestaurantSubmitModal } from '@/components/RestaurantSubmitModal';
import { RestaurantDetailModal } from '@/components/RestaurantDetailModal';
import { RestaurantStorage, RestaurantRecommendation, getKakaoMapUrl } from '@/lib/restaurantStorage';
import { TourStorage, TourPackage, TourType } from '@/lib/tourStorage';
import { ClubStorage } from '@/lib/clubStorage';
import { ParkGolfClub, ClubRecruitStatus } from '@/types/club';
import {
  AuctionStorage,
  AffiliatedStore,
  RESTAURANT_SUB_CATEGORIES,
  AUCTION_RULES,
} from '@/lib/auctionStorage';
import { CourseReviewStorage, CourseReview } from '@/lib/courseReviewStorage';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import {
  getCourseDualName,
  stripParkGolfSuffix,
  CourseDualBadge,
  getLocalizedCourseDescription,
  getLocalizedCourseAddress,
  getLocalizedCourseFee,
  getLocalizedCourseOpenHours,
  getLocalizedCourseClosedDay,
  getLocalizedCourseParking,
  translateKoreanFieldToJapanese,
} from '@/lib/courseLocalization';

// --- Types for 3 Auxiliary Services ---
export interface ParkGolfRestaurant {
  id: string;
  name: string;
  region: string;
  category: string;
  signatureMenu: string;
  priceInfo: string;
  distanceText: string;
  groupSeating: string;
  phone: string;
  tags: string[];
  isPaid?: boolean;
  bannerTitle?: string;
  description?: string;
}

export interface ParkGolfPracticeRange {
  id: string;
  name: string;
  region: string;
  regions?: string[];
  type: string;
  types?: string[];
  feature: string;
  targets: string;
  lesson: string;
  priceText: string;
  phone: string;
  distanceText: string;
}

export interface ParkGolfShop {
  id: string;
  name: string;
  region: string;
  type: '파크골프 전문 매장' | '클럽/피팅/그립 교체' | '용품/의류/모자' | '중고/위탁 판매';
  feature: string;
  products: string;
  brands: string;
  phone: string;
  distanceText: string;
  isAd?: boolean;
}

export interface ParkGolfMarketItem {
  id: string;
  title: string;
  category: '클럽(채)' | '파우치/가방' | '볼/공' | '기타용품';
  price: number;
  status: '판매중' | '예약중' | '거래완료';
  condition: '미개봉 신품' | '특A급' | 'A급' | '생활기스 있음';
  specs: string;
  location: string;
  sellerName: string;
  sellerPhone: string;
  createdAt: string;
  description: string;
}

// --- 전국 주요 시·군·구 파크골프 활동 지역 목록 ---
const ALL_PRACTICE_REGIONS: string[] = [
  '경북 구미시',
  '경북 김천시',
  '대구 전체',
  '대구 달서구',
  '대구 수성구',
  '대구 북구',
  '대구 동구',
  '대구 달성군',
  '대구 중구/서구/남구',
  '대구 군위군',
  '경북 포항시',
  '경북 경주시',
  '경북 안동시',
  '경북 칠곡군',
  '경북 영천시',
  '경북 상주시',
  '경북 문경시',
  '경북 청송군',
  '경북 의성군',
  '경북 영주시',
  '경북 예천군',
  '경북 성주군',
  '경북 고령군',
  '경북 울진군',
  '경남 창원시',
  '경남 김해시',
  '경남 밀양시',
  '경남 진주시',
  '경남 양산시',
  '경남 거제시',
  '경남 통영시',
  '경남 사천시',
  '경남 함안군',
  '경남 창녕군',
  '경남 거창군',
  '경남 합천군',
  '부산 전체',
  '부산 사상구',
  '부산 강서구',
  '부산 북구',
  '부산 해운대구',
  '부산 금정구',
  '부산 기장군',
  '울산 전체',
  '울산 남구/중구',
  '울산 북구/동구',
  '울산 울주군',
  '서울 전체',
  '서울 송파구',
  '서울 강남구',
  '서울 서초구',
  '서울 마포구',
  '서울 영등포구',
  '서울 강동구',
  '서울 노원구',
  '경기 수원시',
  '경기 용인시',
  '경기 성남시',
  '경기 고양시',
  '경기 화성시',
  '경기 부천시',
  '경기 남양주시',
  '경기 안산시',
  '경기 평택시',
  '경기 파주시',
  '경기 김포시',
  '경기 하남시',
  '경기 양평군',
  '경기 가평군',
  '인천 전체',
  '인천 연수구',
  '인천 남동구',
  '인천 서구',
  '강원 춘천시',
  '강원 원주시',
  '강원 강릉시',
  '강원 화천군',
  '강원 횡성군',
  '강원 홍천군',
  '강원 철원군',
  '충북 충주시',
  '충북 청주시',
  '충북 제천시',
  '충북 음성군',
  '충북 진천군',
  '충남 천안시',
  '충남 아산시',
  '충남 공주시',
  '충남 서산시',
  '충남 당진시',
  '대전 전체',
  '세종시',
  '전북 전주시',
  '전북 익산시',
  '전북 군산시',
  '전북 정읍시',
  '전남 순천시',
  '전남 여수시',
  '전남 목포시',
  '전남 나주시',
  '전남 담양군',
  '광주 전체',
  '제주 제주시',
  '제주 서귀포시',
  '전국 출장/온라인 가능',
];

// --- Clean Empty Seed Data (내가 입력하지 않은 가상 정보 완전 제거) ---
const DEFAULT_RESTAURANTS: ParkGolfRestaurant[] = [];
const DEFAULT_PRACTICE_RANGES: ParkGolfPracticeRange[] = [];
const DEFAULT_SHOPS: ParkGolfShop[] = [];
const DEFAULT_MARKET_ITEMS: ParkGolfMarketItem[] = [];

// --- 주변 식당 분류 카테고리 (일식, 중식, 양식, 한식 등) ---
const RESTAURANT_CATEGORIES = [
  { id: 'ALL', label: '전체 식당', icon: '🍽️', desc: '등록된 모든 식당' },
  { id: '한식 (국밥·찌개·정식)', label: '한식 (국밥·찌개·정식)', icon: '🍲', desc: '국밥, 찌개, 쌈밥, 백반' },
  { id: '일식', label: '일식 (초밥·회·돈까스)', icon: '🍣', desc: '초밥, 생선회, 돈까스, 우동' },
  { id: '중식', label: '중식 (짜장·짬뽕·탕수육)', icon: '🥟', desc: '짜장면, 짬뽕, 중화요리' },
  { id: '양식', label: '양식 (스테이크·파스타)', icon: '🍝', desc: '경양식 돈까스, 파스타, 피자' },
  { id: '고기·구이', label: '고기·구이 (한우·삼겹살)', icon: '🥩', desc: '한우, 삼겹살, 돼지갈비, 불고기' },
  { id: '백숙·오리', label: '토종 백숙·오리', icon: '🍗', desc: '닭백숙, 오리백숙, 닭볶음탕' },
  { id: '막국수·면', label: '시원한 막국수·냉면', icon: '🍜', desc: '막국수, 냉면, 칼국수' },
  { id: '분식·기타', label: '분식·간식·카페', icon: '☕', desc: '김밥, 라면, 커피, 베이커리' },
];

// --- 유료 스폰서 제휴 식당 (실제 등록 데이터만 노출, 가상 목업 제거) ---
const DEFAULT_PAID_RESTAURANTS: ParkGolfRestaurant[] = [];


export default function CoursesPage() {
  const router = useRouter();
  const { t, isJapanese, isEnglish } = useTranslation();

  const getLocalizedCourseName = (c?: Course | null) => {
    if (!c) return '';
    const dual = getCourseDualName(c, isJapanese);
    return dual.primary;
  };

  const getLocalizedCourseRegion = (c?: Course | null) => {
    if (!c) return '';
    if (isJapanese) {
      if (c.regionJa) return c.regionJa;
      if (c.region) return translateKoreanFieldToJapanese(c.region);
      return '';
    }
    return c.regionKo || c.region;
  };

  const [courses, setCourses] = useState<Course[]>(() => ParkOnStorage.getAllCourses());
  const [homeCourseId, setHomeCourseId] = useState<string>('');
  const [favoriteHomeCourseIds, setFavoriteHomeCourseIds] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState<'ALL' | 'KR' | 'JP'>('ALL');

  useEffect(() => {
    if (isJapanese) {
      setCountryFilter('JP');
    }
  }, [isJapanese]);
  
  // Search input and applied search term
  const [inputQuery, setInputQuery] = useState<string>('');
  const [appliedQuery, setAppliedQuery] = useState<string>('');
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  // 8 Service Mode State: RESTAURANT | SCREEN | TOUR | CLUB | RANGE_LESSON | SHOP | MARKET | REVIEW
  type MainServiceTab =
    | 'RESTAURANT'
    | 'SCREEN'
    | 'TOUR'
    | 'CLUB'
    | 'RANGE_LESSON'
    | 'SHOP'
    | 'MARKET'
    | 'REVIEW';

  const [activeServiceTab, setActiveServiceTab] = useState<MainServiceTab | null>(null);

  const handleToggleServiceTab = (tab: MainServiceTab) => {
    setActiveServiceTab((prev) => (prev === tab ? null : tab));
  };

  // Affiliated Stores & Auction State
  const [affiliatedStores, setAffiliatedStores] = useState<AffiliatedStore[]>(() => AuctionStorage.getAllStores());
  const [selectedStoreCourseId, setSelectedStoreCourseId] = useState<string>('course-gumi-dongrak');
  const [showCourseSelectModal, setShowCourseSelectModal] = useState<boolean>(false);
  const [courseSelectSearchTerm, setCourseSelectSearchTerm] = useState<string>('');
  const [courseSelectRegionFilter, setCourseSelectRegionFilter] = useState<string>('ALL');
  const [storeSubCategoryFilter, setStoreSubCategoryFilter] = useState<string>('전체');
  const [storeSortMode, setStoreSortMode] = useState<'RECOMMENDED' | 'DISTANCE' | 'LATEST'>('RECOMMENDED');
  const [showStoreRegisterModal, setShowStoreRegisterModal] = useState<boolean>(false);
  const [storeMainTab, setStoreMainTab] = useState<'RESTAURANT' | 'CAFE'>('RESTAURANT');
  const [showRestaurantSubmitModal, setShowRestaurantSubmitModal] = useState<boolean>(false);
  const [showAllRestaurants, setShowAllRestaurants] = useState<boolean>(false);
  const [selectedDetailRestaurant, setSelectedDetailRestaurant] = useState<RestaurantRecommendation | null>(null);
  const [userRecommendedStores, setUserRecommendedStores] = useState<RestaurantRecommendation[]>(() =>
    RestaurantStorage.getAllRestaurants()
  );

  useEffect(() => {
    const handleRestaurantsUpdated = () => {
      setUserRecommendedStores(RestaurantStorage.getAllRestaurants());
    };
    window.addEventListener('parkon_restaurants_updated', handleRestaurantsUpdated);
    return () => window.removeEventListener('parkon_restaurants_updated', handleRestaurantsUpdated);
  }, []);

  // 등록된 매장의 상단 옥션 신청/수정 모달 상태 (무료 입점 후 필요 시 언제든 옥션 참여)
  const [auctionTargetStore, setAuctionTargetStore] = useState<AffiliatedStore | null>(null);
  const [auctionBidAmount, setAuctionBidAmount] = useState<number>(3000);
  const [showAuctionUpgradeModal, setShowAuctionUpgradeModal] = useState<boolean>(false);

  const handleOpenAuctionUpgrade = (store: AffiliatedStore) => {
    setAuctionTargetStore(store);
    const minBid = isJapanese ? AUCTION_RULES.JPY.MIN_BID : AUCTION_RULES.KRW.MIN_BID;
    setAuctionBidAmount(store.bidAmount >= minBid ? store.bidAmount : minBid);
    setShowAuctionUpgradeModal(true);
  };

  const handleConfirmAuctionUpgrade = (bid: number) => {
    if (!auctionTargetStore) return;
    AuctionStorage.updateStore(auctionTargetStore.id, {
      bidAmount: bid,
    });
    setAffiliatedStores(AuctionStorage.getAllStores());
    setShowAuctionUpgradeModal(false);
    setAuctionTargetStore(null);
  };

  // 투어 & 여행사 패키지 상태
  const [tours, setTours] = useState<TourPackage[]>(() => TourStorage.getAllTours());
  const [tourTypeFilter, setTourTypeFilter] = useState<TourType>('ALL');
  const [showTourRegisterModal, setShowTourRegisterModal] = useState<boolean>(false);

  useEffect(() => {
    const handleToursUpdated = () => {
      setTours(TourStorage.getAllTours());
    };
    window.addEventListener('parkon_tours_updated', handleToursUpdated);
    return () => window.removeEventListener('parkon_tours_updated', handleToursUpdated);
  }, []);

  // 클럽 & 동호회 (회원 모집 센터) 상태
  const [clubs, setClubs] = useState<ParkGolfClub[]>(() => ClubStorage.getAllClubs());
  const [showClubRegisterModal, setShowClubRegisterModal] = useState<boolean>(false);
  const [joiningClub, setJoiningClub] = useState<ParkGolfClub | null>(null);
  const [clubSearchQuery, setClubSearchQuery] = useState<string>('');
  const [onlyRecruitingFilter, setOnlyRecruitingFilter] = useState<boolean>(false);

  useEffect(() => {
    const handleClubsUpdated = () => {
      setClubs(ClubStorage.getAllClubs());
    };
    window.addEventListener('parkon_clubs_updated', handleClubsUpdated);
    return () => window.removeEventListener('parkon_clubs_updated', handleClubsUpdated);
  }, []);

  // 동반 라운드 진행 중인 구장 또는 홈구장 또는 기본 동락파크골프장 자동 연동
  useEffect(() => {
    try {
      const activeRoundRaw = localStorage.getItem('parkon_active_round') || localStorage.getItem('currentRound');
      if (activeRoundRaw) {
        const parsed = JSON.parse(activeRoundRaw);
        if (parsed && (parsed.courseId || parsed.courseName)) {
          const found = courses.find((c) => c.id === parsed.courseId || c.name === parsed.courseName);
          if (found) {
            setSelectedStoreCourseId(found.id);
            return;
          }
        }
      }
      const homeCourseId = localStorage.getItem('parkon_home_course_id');
      if (homeCourseId && courses.some((c) => c.id === homeCourseId)) {
        setSelectedStoreCourseId(homeCourseId);
        return;
      }
      const dongrak = courses.find((c) => c.id === 'course-gumi-dongrak' || c.name.includes('동락'));
      if (dongrak) {
        setSelectedStoreCourseId(dongrak.id);
      }
    } catch {}
  }, [courses]);

  // 구장 선택 팝업용 실시간 필터링 목록 (검색어 입력 또는 지역 선택 시에만 결과 노출)
  const isCourseSelectActive = Boolean(courseSelectSearchTerm.trim() || courseSelectRegionFilter !== 'ALL');

  const modalFilteredCourses = useMemo(() => {
    // 검색어나 지역 필터가 없으면 임의의 구장을 미리 나열하지 않음
    if (!courseSelectSearchTerm.trim() && courseSelectRegionFilter === 'ALL') {
      return [];
    }

    let list = courses;
    if (courseSelectRegionFilter !== 'ALL') {
      if (courseSelectRegionFilter === '서울·경기' || courseSelectRegionFilter === '경기' || courseSelectRegionFilter === '서울') {
        list = list.filter((c) => c.region?.includes('서울') || c.region?.includes('경기') || c.region?.includes('인천'));
      } else if (courseSelectRegionFilter === '부산·울산' || courseSelectRegionFilter === '부산' || courseSelectRegionFilter === '울산') {
        list = list.filter((c) => c.region?.includes('부산') || c.region?.includes('울산'));
      } else if (courseSelectRegionFilter === '충청') {
        list = list.filter((c) => c.region?.includes('충북') || c.region?.includes('충남') || c.region?.includes('대전') || c.region?.includes('세종'));
      } else if (courseSelectRegionFilter === '전라') {
        list = list.filter((c) => c.region?.includes('전북') || c.region?.includes('전남') || c.region?.includes('광주'));
      } else {
        list = list.filter((c) => c.region?.includes(courseSelectRegionFilter));
      }
    }
    if (courseSelectSearchTerm.trim()) {
      const q = courseSelectSearchTerm.trim().toLowerCase();
      const noSpaceQ = q.replace(/\s+/g, '');
      list = list.filter((c) => {
        const name = c.name.toLowerCase();
        const reg = (c.region || '').toLowerCase();
        const addr = (c.address || '').toLowerCase();
        return (
          name.includes(q) ||
          reg.includes(q) ||
          addr.includes(q) ||
          name.replace(/\s+/g, '').includes(noSpaceQ)
        );
      });
    }
    return list.slice(0, 60);
  }, [courses, courseSelectSearchTerm, courseSelectRegionFilter]);

  // Reviews State
  const [courseReviews, setCourseReviews] = useState<CourseReview[]>(() => CourseReviewStorage.getAllReviews());
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewCourseFilter, setReviewCourseFilter] = useState<string>('ALL');

  // Range & Lesson Sub Tab (코치 우선 정책: COACH 기본 활성화)
  const [rangeLessonSubTab, setRangeLessonSubTab] = useState<'RANGE' | 'COACH'>('COACH');

  useEffect(() => {
    const handleStoresUpdated = () => {
      setAffiliatedStores(AuctionStorage.getAllStores());
    };
    const handleReviewsUpdated = () => {
      setCourseReviews(CourseReviewStorage.getAllReviews());
    };
    window.addEventListener('parkon_stores_updated', handleStoresUpdated);
    window.addEventListener('parkon_reviews_updated', handleReviewsUpdated);
    return () => {
      window.removeEventListener('parkon_stores_updated', handleStoresUpdated);
      window.removeEventListener('parkon_reviews_updated', handleReviewsUpdated);
    };
  }, []);

  // Choice modal (버튼 2개 선택 팝업: 레슨 코치 등록 vs 연습장 등록)
  const [showRegisterChoiceModal, setShowRegisterChoiceModal] = useState<boolean>(false);

  // Restaurant State (User-entered only, zero dummy data)
  const [restaurants, setRestaurants] = useState<ParkGolfRestaurant[]>([]);
  const [restaurantCategory, setRestaurantCategory] = useState<string>('');
  const [restaurantSearchText, setRestaurantSearchText] = useState<string>('');
  const [showRestaurantModal, setShowRestaurantModal] = useState<boolean>(false);
  const [showFindRestaurantModal, setShowFindRestaurantModal] = useState<boolean>(false);
  const [selectedPaidRestaurant, setSelectedPaidRestaurant] = useState<ParkGolfRestaurant | null>(null);
  const [newRestName, setNewRestName] = useState<string>('');
  const [newRestCategory, setNewRestCategory] = useState<string>('한식 (국밥·찌개·정식)');
  const [newRestRegion, setNewRestRegion] = useState<string>('경북 구미시');
  const [newRestMenu, setNewRestMenu] = useState<string>('');
  const [newRestPhone, setNewRestPhone] = useState<string>('');
  const [newRestPrice, setNewRestPrice] = useState<string>('10,000원~');
  const [newRestSeating, setNewRestSeating] = useState<string>('단체석 완비 / 대형 주차 가능');
  const [newRestIsPaid, setNewRestIsPaid] = useState<boolean>(false);
  const [newRestBannerTitle, setNewRestBannerTitle] = useState<string>('단체 예약 환영 / 무료 픽업');

  // Shared Data Storage for Coaches & Practice Ranges (User-entered only)
  const [practiceRanges, setPracticeRanges] = useState<ParkGolfPracticeRange[]>([]);

  // ==================== 1. COACH STATE (골프 레슨 코치 전용) ====================
  const [coachTypeFilter, setCoachTypeFilter] = useState<string>('ALL');
  const [showCoachModal, setShowCoachModal] = useState<boolean>(false);
  const [newCoachName, setNewCoachName] = useState<string>('');
  const [newCoachTypes, setNewCoachTypes] = useState<string[]>([
    '개인 레슨',
    '그룹·아카데미',
    '필드 라운드 레슨',
  ]);

  const toggleCoachType = (catId: string) => {
    setNewCoachTypes((prev) => {
      if (prev.includes(catId)) {
        if (prev.length === 1) {
          alert('최소 1개 이상의 레슨 분야를 선택해야 합니다.');
          return prev;
        }
        return prev.filter((t) => t !== catId);
      }
      return [...prev, catId];
    });
  };

  const [newCoachRegions, setNewCoachRegions] = useState<string[]>(['경북 구미시']);
  const [coachRegionSearchQuery, setCoachRegionSearchQuery] = useState<string>('');

  const toggleCoachRegion = (reg: string) => {
    setNewCoachRegions((prev) => {
      if (prev.includes(reg)) {
        if (prev.length === 1) {
          alert('최소 1곳 이상의 활동 지역을 선택해야 합니다.');
          return prev;
        }
        return prev.filter((r) => r !== reg);
      }
      return [...prev, reg];
    });
  };

  const removeCoachRegion = (reg: string) => {
    if (newCoachRegions.length === 1) {
      alert('최소 1곳 이상의 활동 지역을 선택해야 합니다.');
      return;
    }
    setNewCoachRegions((prev) => prev.filter((r) => r !== reg));
  };

  const addCustomCoachRegion = (custom: string) => {
    const trimmed = custom.trim();
    if (!trimmed) return;
    if (!newCoachRegions.includes(trimmed)) {
      setNewCoachRegions((prev) => [...prev, trimmed]);
    }
    setCoachRegionSearchQuery('');
  };

  const searchedCoachRegions = coachRegionSearchQuery.trim()
    ? ALL_PRACTICE_REGIONS.filter((r) =>
        r.toLowerCase().includes(coachRegionSearchQuery.trim().toLowerCase())
      )
    : ALL_PRACTICE_REGIONS.slice(0, 24);

  const [newCoachProfile, setNewCoachProfile] = useState<string>('');
  const [newCoachPrice, setNewCoachPrice] = useState<string>('1회 30,000원~');
  const [newCoachPhone, setNewCoachPhone] = useState<string>('');

  // ==================== 2. RANGE STATE (실내/스크린 연습장 전용) ====================
  const [rangeTypeFilter, setRangeTypeFilter] = useState<string>('ALL');
  const [showRangeModal, setShowRangeModal] = useState<boolean>(false);
  const [newRangeName, setNewRangeName] = useState<string>('');
  const [newRangeType, setNewRangeType] = useState<string>('실내 스크린');
  const [newRangeAddress, setNewRangeAddress] = useState<string>('경북 구미시');

  const [newRangeFeature, setNewRangeFeature] = useState<string>('');
  const [newRangePrice, setNewRangePrice] = useState<string>('1시간 10,000원~');
  const [newRangePhone, setNewRangePhone] = useState<string>('');

  // Golf Shop State (User-entered only, zero dummy data)
  const [shops, setShops] = useState<ParkGolfShop[]>(DEFAULT_SHOPS);
  const [shopTypeFilter, setShopTypeFilter] = useState<string>('ALL');
  const [showShopModal, setShowShopModal] = useState<boolean>(false);
  const [newShopName, setNewShopName] = useState<string>('');
  const [newShopType, setNewShopType] = useState<ParkGolfShop['type']>('파크골프 전문 매장');
  const [newShopRegion, setNewShopRegion] = useState<string>('경북 구미시');
  const [newShopFeature, setNewShopFeature] = useState<string>('정품 파크골프채·용품 전문 / 즉시 그립 교체');
  const [newShopProducts, setNewShopProducts] = useState<string>('클럽, 가방, 볼, 모자, 장갑 완비');
  const [newShopBrands, setNewShopBrands] = useState<string>('혼마, 피닉스, 볼빅, 아식스 공식 취급');
  const [newShopPhone, setNewShopPhone] = useState<string>('');

  // Secondhand Market State
  const [marketItems, setMarketItems] = useState<ParkGolfMarketItem[]>(DEFAULT_MARKET_ITEMS);
  const [marketCategory, setMarketCategory] = useState<string>('ALL');
  const [showMarketModal, setShowMarketModal] = useState<boolean>(false);
  const [contactModalItem, setContactModalItem] = useState<ParkGolfMarketItem | null>(null);

  // New Market Item Form State
  const [newMarketTitle, setNewMarketTitle] = useState<string>('');
  const [newMarketCategory, setNewMarketCategory] = useState<ParkGolfMarketItem['category']>('클럽(채)');
  const [newMarketPrice, setNewMarketPrice] = useState<number>(100000);
  const [newMarketCondition, setNewMarketCondition] = useState<ParkGolfMarketItem['condition']>('특A급');
  const [newMarketSpecs, setNewMarketSpecs] = useState<string>('');
  const [newMarketLocation, setNewMarketLocation] = useState<string>('경북 구미시 (직거래)');
  const [newMarketSeller, setNewMarketSeller] = useState<string>('');
  const [newMarketPhone, setNewMarketPhone] = useState<string>('');
  const [newMarketDesc, setNewMarketDesc] = useState<string>('');

  // Modal State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);

  // 3-Sec Quick Create Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newRegion, setNewRegion] = useState<string>('경북 구미시');
  const [newHoles, setNewHoles] = useState<number>(18);
  const [newContributor, setNewContributor] = useState<string>('');

  useEffect(() => {
    refreshCourses();
    try {
      ['parkon_user_restaurants_v1', 'parkon_user_practice_ranges_v1', 'parkon_user_shops_v1', 'parkon_market_items_v1'].forEach((k) => {
        try { localStorage.removeItem(k); } catch {}
      });
      const savedRest = localStorage.getItem('parkon_user_restaurants_v2');
      if (savedRest) setRestaurants(JSON.parse(savedRest));
      const savedPrac = localStorage.getItem('parkon_user_practice_ranges_v2');
      if (savedPrac) setPracticeRanges(JSON.parse(savedPrac));
      const savedShops = localStorage.getItem('parkon_user_shops_v2');
      if (savedShops) setShops(JSON.parse(savedShops));
      const savedMkt = localStorage.getItem('parkon_market_items_v2');
      if (savedMkt) setMarketItems(JSON.parse(savedMkt));
    } catch (err) {
      console.error(err);
    }
    refreshCourses();
    window.addEventListener('parkon_favorite_courses_updated', refreshCourses);
    window.addEventListener('parkon_country_changed', refreshCourses);
    return () => {
      window.removeEventListener('parkon_favorite_courses_updated', refreshCourses);
      window.removeEventListener('parkon_country_changed', refreshCourses);
    };
  }, []);

  // Close active category popup modal on ESC key
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeServiceTab) {
        setActiveServiceTab(null);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeServiceTab]);

  const refreshCourses = () => {
    setCourses(ParkOnStorage.getAllCourses());
    setHomeCourseId(ParkOnStorage.getHomeCourseId());
    setFavoriteHomeCourseIds(ParkOnStorage.getFavoriteHomeCourseIds());
    const c = ParkOnStorage.getServiceCountry();
    if (c === 'JP') {
      setCountryFilter('JP');
    }
  };

  const handleToggleFavoriteHomeCourse = (courseId: string) => {
    const validId = ParkOnStorage.normalizeCourseId(courseId);
    const list = ParkOnStorage.getFavoriteHomeCourseIds();
    if (list.includes(validId)) {
      if (list.length > 1) {
        const updated = ParkOnStorage.removeFavoriteHomeCourse(validId);
        setFavoriteHomeCourseIds(updated);
        setHomeCourseId(ParkOnStorage.getHomeCourseId());
      } else {
        alert('최소 1개의 홈구장은 유지되어야 합니다.');
      }
    } else {
      const updated = ParkOnStorage.addFavoriteHomeCourse(validId);
      setFavoriteHomeCourseIds(updated);
    }
  };

  const handleSelectCourseAndGoHome = (courseId: string) => {
    const validId = ParkOnStorage.normalizeCourseId(courseId);
    ParkOnStorage.setHomeCourseId(validId);
    ParkOnStorage.addFavoriteHomeCourse(validId);
    setHomeCourseId(validId);
    router.push('/');
  };

  // Perform search on magnifying glass click or Enter key
  const handleExecuteSearch = (term?: string) => {
    const q = term !== undefined ? term : inputQuery;
    setAppliedQuery(q.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecuteSearch();
    }
  };

  const handleClearSearch = () => {
    setInputQuery('');
    setAppliedQuery('');
    if (isJapanese) {
      setCountryFilter('JP');
    } else {
      setCountryFilter('ALL');
    }
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const coursesCount = Math.max(1, Math.round(newHoles / 9));
    const newCourse: Course = {
      id: `custom-course-${Date.now()}`,
      name: newName.trim(),
      region: newRegion.trim() || '전국',
      totalCourses: coursesCount,
      totalHoles: newHoles,
      holesMetadata: generateStandardHoles(newHoles),
      isVerified: false,
      contributorName: newContributor.trim() || '파크골프 올인원 골퍼',
      contributedAt: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    ParkOnStorage.addCustomCourse(newCourse);
    refreshCourses();
    handleSelectCourseAndGoHome(newCourse.id);

    // Reset
    setNewName('');
    setNewContributor('');
    setShowAddForm(false);
  };

  // Handle New Secondhand Market Item Submission
  const handleAddMarketItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMarketTitle.trim() || !newMarketSeller.trim()) {
      alert('매물 제목과 판매자 닉네임을 입력해 주세요.');
      return;
    }

    const newItem: ParkGolfMarketItem = {
      id: `mkt-${Date.now()}`,
      title: newMarketTitle.trim(),
      category: newMarketCategory,
      price: Number(newMarketPrice) || 0,
      status: '판매중',
      condition: newMarketCondition,
      specs: newMarketSpecs.trim() || '상세 제원 문의',
      location: newMarketLocation.trim() || '직거래 / 택배',
      sellerName: newMarketSeller.trim(),
      sellerPhone: newMarketPhone.trim() || '010-0000-0000',
      createdAt: new Date().toISOString().split('T')[0],
      description: newMarketDesc.trim() || '상태 좋습니다. 편하게 문의주세요.',
    };

    const updated = [newItem, ...marketItems];
    setMarketItems(updated);
    try {
      localStorage.setItem('parkon_market_items_v2', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    // Reset Form
    setNewMarketTitle('');
    setNewMarketSpecs('');
    setNewMarketDesc('');
    setShowMarketModal(false);
    alert('무료 직거래 매물이 성공적으로 등록되었습니다!');
  };

  // Handle New Restaurant Registration
  const handleAddRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestName.trim()) {
      alert('식당 이름을 입력해 주세요.');
      return;
    }

    const newRest: ParkGolfRestaurant = {
      id: `rest-${Date.now()}`,
      name: newRestName.trim(),
      region: newRestRegion.trim() || '구미시 인근',
      category: newRestCategory,
      signatureMenu: newRestMenu.trim() || '대표 메뉴',
      priceInfo: newRestPrice.trim() || '가격 문의',
      distanceText: '인근 구장 5분',
      groupSeating: newRestSeating.trim() || '좌석 및 주차 완비',
      phone: newRestPhone.trim() || '054-000-0000',
      tags: newRestIsPaid ? ['스폰서맛집', '단체환영', '골퍼추천'] : ['골퍼추천', '실명등록'],
      isPaid: newRestIsPaid,
      bannerTitle: newRestIsPaid
        ? (newRestBannerTitle.trim() || `👑 [스폰서 추천] ${newRestName.trim()} · 단체 예약 환영 ↗`)
        : undefined,
      description: newRestIsPaid
        ? `${newRestName.trim()} - 단체 룸 및 주차 완비, 파크골프 모임 환영 (${newRestSeating})`
        : undefined,
    };

    const updated = [newRest, ...restaurants];
    setRestaurants(updated);
    try {
      localStorage.setItem('parkon_user_restaurants_v2', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setNewRestName('');
    setNewRestMenu('');
    setNewRestPhone('');
    setNewRestIsPaid(false);
    setNewRestBannerTitle('단체 예약 환영 / 무료 픽업');
    setShowRestaurantModal(false);
    alert('식당이 등록되었습니다!');
  };

  const handleDeleteRestaurant = (id: string, name: string) => {
    if (!confirm(`'${name}' 식당을 삭제하시겠습니까?`)) return;
    const updated = restaurants.filter((r) => r.id !== id);
    setRestaurants(updated);
    try {
      localStorage.setItem('parkon_user_restaurants_v2', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle New Coach Registration (골프 레슨 코치 전용 등록)
  const handleAddCoach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoachName.trim()) {
      alert('코치 성함(프로명)을 입력해 주세요.');
      return;
    }
    if (newCoachTypes.length === 0) {
      alert('최소 1개 이상의 레슨 분야를 선택해 주세요.');
      return;
    }
    if (newCoachRegions.length === 0) {
      alert('활동 지역을 최소 1곳 이상 선택해 주세요.');
      return;
    }

    const newCoach: ParkGolfPracticeRange = {
      id: `coach-${Date.now()}`,
      name: newCoachName.trim(),
      region: newCoachRegions.join(' · '),
      regions: newCoachRegions,
      type: newCoachTypes.join(', '),
      types: newCoachTypes,
      feature: newCoachProfile.trim() || '공인 파크골프 전문 코치',
      targets: '',
      lesson: '',
      priceText: newCoachPrice.trim() || '협의 후 결정 (문의)',
      phone: newCoachPhone.trim() || '010-0000-0000',
      distanceText: '인근',
    };

    const updated = [newCoach, ...practiceRanges];
    setPracticeRanges(updated);
    try {
      localStorage.setItem('parkon_user_practice_ranges_v2', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setNewCoachName('');
    setNewCoachPhone('');
    setNewCoachProfile('');
    setNewCoachPrice('1회 30,000원~');
    setNewCoachTypes(['개인 레슨', '그룹·아카데미', '필드 라운드 레슨']);
    setNewCoachRegions(['경북 구미시']);
    setCoachRegionSearchQuery('');
    setShowCoachModal(false);
    alert('골프 레슨 코치 정보가 성공적으로 등록되었습니다!');
  };

  const handleDeleteCoach = (id: string, name: string) => {
    if (!confirm(`'${name}' 코치 정보를 삭제하시겠습니까?`)) return;
    const updated = practiceRanges.filter((p) => p.id !== id);
    setPracticeRanges(updated);
    try {
      localStorage.setItem('parkon_user_practice_ranges_v2', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle New Practice Range Registration (스크린 골프 연습장 전용 등록)
  const handleAddPracticeRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRangeName.trim()) {
      alert('연습장 상호명을 입력해 주세요.');
      return;
    }
    if (!newRangeAddress.trim()) {
      alert('연습장 위치(주소)를 입력해 주세요.');
      return;
    }

    const newRange: ParkGolfPracticeRange = {
      id: `range-${Date.now()}`,
      name: newRangeName.trim(),
      region: newRangeAddress.trim(),
      regions: [newRangeAddress.trim()],
      type: newRangeType,
      types: [newRangeType],
      feature: newRangeFeature.trim() || '실내 스크린 파크골프 시설 완비',
      targets: '',
      lesson: '',
      priceText: newRangePrice.trim() || '이용료 문의',
      phone: newRangePhone.trim() || '010-0000-0000',
      distanceText: '인근',
    };

    const updated = [newRange, ...practiceRanges];
    setPracticeRanges(updated);
    try {
      localStorage.setItem('parkon_user_practice_ranges_v2', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setNewRangeName('');
    setNewRangePhone('');
    setNewRangeFeature('');
    setNewRangePrice('1시간 10,000원~');
    setNewRangeType('실내 스크린');
    setNewRangeAddress('경북 구미시');
    setShowRangeModal(false);
    alert('스크린 골프 연습장 정보가 성공적으로 등록되었습니다!');
  };

  const handleDeleteRange = (id: string, name: string) => {
    if (!confirm(`'${name}' 연습장 정보를 삭제하시겠습니까?`)) return;
    const updated = practiceRanges.filter((p) => p.id !== id);
    setPracticeRanges(updated);
    try {
      localStorage.setItem('parkon_user_practice_ranges_v2', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle New Golf Shop Registration
  const handleAddShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) {
      alert('골프 매장 이름을 입력해 주세요.');
      return;
    }

    const newShop: ParkGolfShop = {
      id: `shop-${Date.now()}`,
      name: newShopName.trim(),
      region: newShopRegion.trim() || '구미시 인근',
      type: newShopType,
      feature: newShopFeature.trim() || '파크골프 전문 매장',
      products: newShopProducts.trim() || '클럽, 가방, 볼 완비',
      brands: newShopBrands.trim() || '공식 인증 정품 취급',
      phone: newShopPhone.trim() || '054-000-0000',
      distanceText: '인근 구장 10분',
    };

    const updated = [newShop, ...shops];
    setShops(updated);
    try {
      localStorage.setItem('parkon_user_shops_v2', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setNewShopName('');
    setNewShopPhone('');
    setShowShopModal(false);
    alert('골프 매장이 등록되었습니다!');
  };

  const handleDeleteShop = (id: string, name: string) => {
    if (!confirm(`'${name}' 매장 정보를 삭제하시겠습니까?`)) return;
    const updated = shops.filter((s) => s.id !== id);
    setShops(updated);
    try {
      localStorage.setItem('parkon_user_shops_v2', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMarketItem = (id: string, title: string) => {
    if (!confirm(`'${title}' 매물을 삭제하시겠습니까?`)) return;
    const updated = marketItems.filter((m) => m.id !== id);
    setMarketItems(updated);
    try {
      localStorage.setItem('parkon_market_items_v2', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Courses based on search query or country filter
  const activeSearchTerm = appliedQuery.trim().toLowerCase();
  const isTextSearchActive =
    activeSearchTerm.length > 0 &&
    activeSearchTerm !== '전체' &&
    activeSearchTerm !== '전국' &&
    activeSearchTerm !== '全国';
  const isSearchActive = activeSearchTerm.length > 0 || countryFilter !== 'ALL';

  const filteredCourses = courses.filter((c) => {
        // Country filter check
        if (countryFilter === 'KR' && c.country === 'JP') return false;
        if (countryFilter === 'JP' && c.country !== 'JP') return false;

        // If asking for all
        if (!activeSearchTerm || activeSearchTerm === '전체' || activeSearchTerm === '전국' || activeSearchTerm === '全国') {
          return true;
        }

        // Special country keywords
        if (activeSearchTerm === '일본' || activeSearchTerm === '日本' || activeSearchTerm === 'japan') {
          if (c.country === 'JP') return true;
        }
        if (activeSearchTerm === '한국' || activeSearchTerm === '韓国' || activeSearchTerm === 'korea') {
          if (c.country !== 'JP') return true;
        }

        // Special Japanese 7 Major Regions Matching
        if (c.country === 'JP') {
          if (activeSearchTerm === '北海道' || activeSearchTerm === 'hokkaido') {
            if (c.region === 'Hokkaido' || c.regionJa?.includes('北海道') || c.region?.includes('北海道')) return true;
          }
          if (activeSearchTerm === '東北' || activeSearchTerm === 'tohoku') {
            if (c.region === 'Tohoku' || c.regionJa === '東北' || c.regionKo === '도호쿠' || /青森|岩手|宮城|秋田|山形|福島/.test(c.regionJa || c.region || c.addressJa || '')) return true;
          }
          if (activeSearchTerm === '関東' || activeSearchTerm === 'kanto') {
            if (c.region === 'Kanto' || c.regionJa === '関東' || c.regionKo === '간토' || /東京|神奈川|埼玉|千葉|茨城|栃木|群馬|山梨/.test(c.regionJa || c.region || c.addressJa || '')) return true;
          }
          if (activeSearchTerm === '中部' || activeSearchTerm === 'chubu') {
            if (c.region === 'Chubu' || c.regionJa === '中部' || c.regionKo === '주부' || /新潟|富山|石川|福井|長野|岐阜|静岡|愛知|三重/.test(c.regionJa || c.region || c.addressJa || '')) return true;
          }
          if (activeSearchTerm === '近畿' || activeSearchTerm === 'kinki' || activeSearchTerm === '関西' || activeSearchTerm === 'kansai') {
            if (c.region === 'Kinki' || c.regionJa === '近畿' || c.regionJa === '関西' || c.regionKo === '긴키' || /大阪|京都|兵庫|奈良|滋賀|和歌山/.test(c.regionJa || c.region || c.addressJa || '')) return true;
          }
          if (activeSearchTerm === '中国・四国' || activeSearchTerm === '中国' || activeSearchTerm === '四国') {
            if (c.region === 'Chugoku-Shikoku' || c.regionJa === '中国・四国' || c.regionKo === '주고쿠·시코쿠' || /鳥取|島根|岡山|広島|山口|徳島|香川|愛媛|高知/.test(c.regionJa || c.region || c.addressJa || '')) return true;
          }
          if (activeSearchTerm === '九州・沖縄' || activeSearchTerm === '九州' || activeSearchTerm === '沖縄') {
            if (c.region === 'Kyushu-Okinawa' || c.regionJa === '九州・沖縄' || c.regionKo === '규슈·오키나와' || /福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄/.test(c.regionJa || c.region || c.addressJa || '')) return true;
          }
        }

        const matchName = c.name.toLowerCase().includes(activeSearchTerm);
        const matchRegion = c.region.toLowerCase().includes(activeSearchTerm);
        const matchJaName = c.nameJa?.toLowerCase().includes(activeSearchTerm) || false;
        const matchJaRegion = c.regionJa?.toLowerCase().includes(activeSearchTerm) || false;
        const matchKoName = c.nameKo?.toLowerCase().includes(activeSearchTerm) || false;
        const matchKoRegion = c.regionKo?.toLowerCase().includes(activeSearchTerm) || false;
        const matchAddress = c.address?.toLowerCase().includes(activeSearchTerm) || false;
        const matchKoAddress = c.addressKo?.toLowerCase().includes(activeSearchTerm) || false;
        const matchDesc = c.description?.toLowerCase().includes(activeSearchTerm) || false;
        const matchKoDesc = c.descriptionKo?.toLowerCase().includes(activeSearchTerm) || false;

        // Space-tolerant matching: e.g. "경북청송" matches "경북 청송", "도쿄시노자키" matches "도쿄 시노자키"
        const noSpaceQuery = activeSearchTerm.replace(/\s+/g, '');
        const noSpaceName = c.name.toLowerCase().replace(/\s+/g, '');
        const noSpaceRegion = c.region.toLowerCase().replace(/\s+/g, '');
        const noSpaceJaName = (c.nameJa || '').toLowerCase().replace(/\s+/g, '');
        const noSpaceKoName = (c.nameKo || '').toLowerCase().replace(/\s+/g, '');
        const noSpaceKoRegion = (c.regionKo || '').toLowerCase().replace(/\s+/g, '');
        const matchNoSpace =
          noSpaceName.includes(noSpaceQuery) ||
          noSpaceRegion.includes(noSpaceQuery) ||
          noSpaceJaName.includes(noSpaceQuery) ||
          noSpaceKoName.includes(noSpaceQuery) ||
          noSpaceKoRegion.includes(noSpaceQuery);

        return (
          matchName ||
          matchRegion ||
          matchJaName ||
          matchJaRegion ||
          matchKoName ||
          matchKoRegion ||
          matchAddress ||
          matchKoAddress ||
          matchDesc ||
          matchKoDesc ||
          matchNoSpace
        );
      });

  // Filtered Restaurants (User entered only, NO dummy info)
  const isRestaurantFilterActive = Boolean(restaurantCategory || restaurantSearchText.trim());

  const filteredRestaurants = isRestaurantFilterActive
    ? restaurants.filter((r) => {
        if (restaurantCategory && restaurantCategory !== 'ALL' && r.category !== restaurantCategory) return false;
        if (restaurantSearchText.trim()) {
          const q = restaurantSearchText.trim().toLowerCase();
          const match =
            r.name.toLowerCase().includes(q) ||
            r.signatureMenu.toLowerCase().includes(q) ||
            r.region.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q) ||
            r.tags.some((t) => t.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
    : [];

  const allPaidRestaurants: ParkGolfRestaurant[] = [
    ...DEFAULT_PAID_RESTAURANTS,
    ...restaurants.filter((r) => r.isPaid),
  ];

  // Filtered Coaches (골프 레슨 코치 전용 필터링)
  const filteredCoaches = practiceRanges.filter((p) => {
    const pTypes: string[] =
      p.types && p.types.length > 0
        ? p.types
        : p.type
        ? p.type.split(',').map((s) => s.trim())
        : [];
    const isCoach = pTypes.some((t) => t.includes('레슨') || t.includes('코치'));
    if (!isCoach) return false;

    if (coachTypeFilter !== 'ALL') {
      const matchType = pTypes.some((t) => {
        if (coachTypeFilter === '개인 레슨' || coachTypeFilter === '1:1 레슨 / 코치') {
          return t.includes('1:1') || t.includes('개인');
        }
        if (coachTypeFilter === '그룹·아카데미' || coachTypeFilter === '아카데미 / 레슨') {
          return t.includes('아카데미') || t.includes('그룹');
        }
        if (coachTypeFilter === '필드 라운드 레슨' || coachTypeFilter === '라운딩 레슨 / 코치') {
          return t.includes('라운딩') || t.includes('필드') || t.includes('라운드');
        }
        return t === coachTypeFilter || t.includes(coachTypeFilter);
      });
      if (!matchType) return false;
    }

    if (activeSearchTerm) {
      const pRegions: string[] =
        p.regions && p.regions.length > 0
          ? p.regions
          : p.region
          ? p.region.split('·').map((s) => s.trim())
          : [];
      const matchRegion = pRegions.some(
        (r) =>
          r.toLowerCase().includes(activeSearchTerm) ||
          activeSearchTerm.includes(r.toLowerCase().replace(/\s+/g, ''))
      );
      const matchName = p.name.toLowerCase().includes(activeSearchTerm);
      const matchFeature = p.feature.toLowerCase().includes(activeSearchTerm);
      if (!matchRegion && !matchName && !matchFeature) return false;
    }

    return true;
  });

  // Filtered Practice Ranges (실내/스크린 연습장 전용 필터링)
  const filteredRanges = practiceRanges.filter((p) => {
    const pTypes: string[] =
      p.types && p.types.length > 0
        ? p.types
        : p.type
        ? p.type.split(',').map((s) => s.trim())
        : [];
    const isCoach = pTypes.some((t) => t.includes('레슨') || t.includes('코치'));
    if (isCoach) return false;

    if (rangeTypeFilter !== 'ALL') {
      if (!pTypes.includes(rangeTypeFilter)) return false;
    }

    if (activeSearchTerm) {
      const pRegions: string[] =
        p.regions && p.regions.length > 0
          ? p.regions
          : p.region
          ? p.region.split('·').map((s) => s.trim())
          : [];
      const matchRegion = pRegions.some(
        (r) =>
          r.toLowerCase().includes(activeSearchTerm) ||
          activeSearchTerm.includes(r.toLowerCase().replace(/\s+/g, ''))
      );
      const matchName = p.name.toLowerCase().includes(activeSearchTerm);
      const matchFeature = p.feature.toLowerCase().includes(activeSearchTerm);
      if (!matchRegion && !matchName && !matchFeature) return false;
    }

    return true;
  });

  // Filtered Golf Shops (User entered only, NO dummy info)
  const filteredShops = shops.filter((s) => {
    if (shopTypeFilter !== 'ALL' && s.type !== shopTypeFilter) return false;
    return true;
  });

  // Filtered Market Items (User entered only, NO dummy info)
  const filteredMarketItems = marketItems.filter((m) => {
    if (marketCategory !== 'ALL' && m.category !== marketCategory) return false;
    return true;
  });

  return (
    <div className="px-3 sm:px-4 py-4 space-y-4 max-w-md mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            className="p-2 -ml-2 text-stone-700 hover:text-stone-950 cursor-pointer"
            title={isJapanese ? "戻る" : "이전으로"}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-black text-stone-900 leading-tight">
              {isJapanese ? '全国パークゴルフ場 検索' : '전국 파크골프장 검색'}
            </h2>
            <p className="text-xs text-stone-700 font-semibold">
              {isJapanese ? '全国公認コース検索＆登録' : '전국 시·군 공인 구장 검색 및 등록'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-3 py-2 rounded-xl flex items-center gap-1 shadow active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isJapanese ? '新規登録' : '신규 등록'}</span>
          </button>
          {/* 대표님 요청: 상단 우측 닫기 (X) 버튼 누르면 항상 직전 화면으로 복귀 */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
            title={isJapanese ? "閉じる (前画面へ)" : "닫기 (이전 화면으로)"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 🔍 SEARCH BAR (도시명 / 구장명 직접 검색 & 돋보기 클릭 시에만 나열) */}
      <div className="space-y-2">
        <div className="relative flex items-center bg-white border-2 border-emerald-600 rounded-2xl shadow-md overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/30 w-full">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => {
              setInputQuery(e.target.value);
              if (!e.target.value.trim()) {
                setAppliedQuery('');
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={isJapanese ? "都市名またはコース名で検索 (例: 幕別、忠類、札幌)" : "도시명 또는 구장명 검색 (예: 밀양, 청송, 지산)"}
            className="min-w-0 flex-1 pl-3.5 sm:pl-4 pr-1.5 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-stone-900 outline-none placeholder:text-stone-400 bg-transparent"
          />

          {/* Clear Button */}
          {inputQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="p-1.5 sm:p-2 text-stone-400 hover:text-stone-700 cursor-pointer shrink-0"
              title={isJapanese ? "検索クリア" : "검색어 지우기"}
            >
              <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* 돋보기 검색 실행 버튼 */}
          <button
            type="button"
            onClick={() => handleExecuteSearch()}
            className="self-stretch px-3.5 sm:px-5 py-3 sm:py-3.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white flex items-center justify-center transition shrink-0 cursor-pointer gap-1 font-black whitespace-nowrap"
            title={isJapanese ? "検索" : "검색하기"}
          >
            <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-black">{isJapanese ? '検索' : '검색'}</span>
          </button>
        </div>

        {/* 🇰🇷 🇯🇵 국가별 필터 탭 & ⛳ 전국 17개 시·도 탐색 바 (검색어 직접 입력 시에만 숨김) */}
        {!isTextSearchActive && (
          <>
            {/* 🇰🇷 🇯🇵 국가별 필터 탭 (전체 / 대한민국 / 일본 본토) */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100/90 rounded-2xl border border-stone-200 text-xs font-black">
              <button
                type="button"
                onClick={() => {
                  setCountryFilter('ALL');
                  setInputQuery('');
                  setAppliedQuery('');
                }}
                className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  countryFilter === 'ALL'
                    ? 'bg-emerald-700 text-white shadow'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <span>🌐</span>
                <span>{isEnglish ? 'All' : isJapanese ? '全体' : '전체'}</span>
                <span className="text-[10px] opacity-80">({courses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCountryFilter('KR');
                  setInputQuery('');
                  setAppliedQuery('');
                }}
                className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  (countryFilter as string) === 'KR'
                    ? 'bg-emerald-700 text-white shadow'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <span>🇰🇷</span>
                <span>{isEnglish ? 'Korea' : isJapanese ? '韓国' : '대한민국'}</span>
                <span className="text-[10px] opacity-80">({courses.filter((c) => c.country !== 'JP').length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCountryFilter('JP');
                  setInputQuery('');
                  setAppliedQuery('');
                }}
                className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  (countryFilter as string) === 'JP'
                    ? 'bg-emerald-700 text-white shadow'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <span>🇯🇵</span>
                <span>{isEnglish ? 'Japan' : isJapanese ? '日本公認' : '일본 공인'}</span>
                <span className="text-[10px] opacity-80">({courses.filter((c) => c.country === 'JP').length})</span>
              </button>
            </div>

            {/* ⛳ 전국 17개 시·도 / 일본 지역 원터치 빠른 탐색 바 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => {
                  setInputQuery('');
                  setAppliedQuery('');
                }}
                className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition cursor-pointer ${
                  !appliedQuery || appliedQuery === '전체' || appliedQuery === '全国'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                }`}
              >
                {isJapanese
                  ? countryFilter === 'JP'
                    ? `全国すべて (${courses.filter((c) => c.country === 'JP').length})`
                    : `全体 (${courses.length})`
                  : countryFilter === 'KR'
                  ? `전국 전체 (${courses.filter((c) => c.country !== 'JP').length})`
                  : `전체 (${courses.length})`
                }
              </button>
              {((isJapanese || countryFilter === 'JP')
                ? [
                    { name: '北海道', count: courses.filter((c) => c.country === 'JP' && (c.region === 'Hokkaido' || c.regionJa?.includes('北海道') || c.region?.includes('北海道'))).length },
                    { name: '東北', count: courses.filter((c) => c.country === 'JP' && (c.region === 'Tohoku' || c.regionJa === '東北' || c.regionKo === '도호쿠' || /青森|岩手|宮城|秋田|山形|福島/.test(c.regionJa || c.region || c.addressJa || ''))).length },
                    { name: '関東', count: courses.filter((c) => c.country === 'JP' && (c.region === 'Kanto' || c.regionJa === '関東' || c.regionKo === '간토' || /東京|神奈川|埼玉|千葉|茨城|栃木|群馬|山梨/.test(c.regionJa || c.region || c.addressJa || ''))).length },
                    { name: '中部', count: courses.filter((c) => c.country === 'JP' && (c.region === 'Chubu' || c.regionJa === '中部' || c.regionKo === '주부' || /新潟|富山|石川|福井|長野|岐阜|静岡|愛知|三重/.test(c.regionJa || c.region || c.addressJa || ''))).length },
                    { name: '近畿', count: courses.filter((c) => c.country === 'JP' && (c.region === 'Kinki' || c.regionJa === '近畿' || c.regionJa === '関西' || c.regionKo === '긴키' || /大阪|京都|兵庫|奈良|滋賀|和歌山/.test(c.regionJa || c.region || c.addressJa || ''))).length },
                    { name: '中国・四国', count: courses.filter((c) => c.country === 'JP' && (c.region === 'Chugoku-Shikoku' || c.regionJa === '中国・四国' || c.regionKo === '주고쿠·시코쿠' || /鳥取|島根|岡山|広島|山口|徳島|香川|愛媛|高知/.test(c.regionJa || c.region || c.addressJa || ''))).length },
                    { name: '九州・沖縄', count: courses.filter((c) => c.country === 'JP' && (c.region === 'Kyushu-Okinawa' || c.regionJa === '九州・沖縄' || c.regionKo === '규슈·오키나와' || /福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄/.test(c.regionJa || c.region || c.addressJa || ''))).length },
                  ]
                : [
                    { name: '서울', count: 28 },
                    { name: '경기', count: 58 },
                    { name: '인천', count: 8 },
                    { name: '부산', count: 18 },
                    { name: '대구', count: 39 },
                    { name: '광주', count: 9 },
                    { name: '대전', count: 5 },
                    { name: '울산', count: 7 },
                    { name: '세종', count: 9 },
                    { name: '강원', count: 46 },
                    { name: '충북', count: 26 },
                    { name: '충남', count: 35 },
                    { name: '전북', count: 33 },
                    { name: '전남', count: 43 },
                    { name: '경북', count: 71 },
                    { name: '경남', count: 89 },
                    { name: '제주', count: 11 },
                  ]
              ).map((reg) => (
                <button
                  key={reg.name}
                  type="button"
                  onClick={() => {
                    setInputQuery(reg.name);
                    setAppliedQuery(reg.name);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                    appliedQuery === reg.name
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  {reg.name} ({reg.count})
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 3-Second Quick Course Creator Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateCourse}
          className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-4 space-y-3 shadow-lg animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-black text-emerald-950 text-base flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>미등록 신규 구장 3초 자동 생성</span>
            </h3>
            <span className="text-[11px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
              표준 Par 자동 세팅
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              구장 이름 *
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="예: 구미 낙동 파크골프장"
              className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                지역 (시/군/구)
              </label>
              <input
                type="text"
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
                placeholder="예: 경북 구미시"
                className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                코스 및 홀 수 선택
              </label>
              <select
                value={newHoles}
                onChange={(e) => setNewHoles(Number(e.target.value))}
                className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2.5 text-sm font-bold text-stone-900 outline-none focus:border-emerald-600"
              >
                <option value={9}>총 1코스 9홀</option>
                <option value={18}>총 2코스 18홀 (표준 일반)</option>
                <option value={27}>총 3코스 27홀</option>
                <option value={36}>총 4코스 36홀 (표준 대형)</option>
                <option value={45}>총 5코스 45홀 (밀양 아리랑형)</option>
                <option value={54}>총 6코스 54홀</option>
                <option value={63}>총 7코스 63홀 (구미 지산형)</option>
                <option value={72}>총 8코스 72홀 (창원 대산형)</option>
                <option value={108}>총 12코스 108홀 (의성 초대형)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              등록자 명예 닉네임 (선택)
            </label>
            <input
              type="text"
              value={newContributor}
              onChange={(e) => setNewContributor(e.target.value)}
              placeholder="예: 구미선산총무 (구장 상단에 명예 표시)"
              className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-sm font-bold text-stone-900 outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-sm shadow active:scale-95 transition"
            >
              생성 및 즉시 홈구장 지정 ⛳
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 bg-stone-200 text-stone-700 font-bold rounded-xl text-xs"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 8 Main Action Category Tiles (2x4 Grid) - 상시 노출 */}
      {/* 어르신 시인성 고려 큼직한 아이콘과 직관적 텍스트, 운영자용 단어(유료/옥션 등) 완전 배제 */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
        {/* Row 1, Col 1: 인근 식당 & 카페 */}
        <button
          type="button"
          onClick={() => setActiveServiceTab('RESTAURANT')}
          className="py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl border-2 border-stone-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 text-stone-800 flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer active:scale-95 shadow-xs"
        >
          <span className="text-2xl sm:text-3xl">🍽️</span>
          <span className="text-[11px] sm:text-xs font-black whitespace-nowrap tracking-tight">
            {isJapanese ? '周辺グルメ・カフェ' : '인근 식당 & 카페'}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold whitespace-nowrap tracking-tighter truncate max-w-full text-stone-500">
            {isJapanese ? 'おすすめ名店' : '동호인 찐 맛집'}
          </span>
        </button>

        {/* Row 1, Col 2: 스크린골프 */}
        <button
          type="button"
          onClick={() => setActiveServiceTab('SCREEN')}
          className="py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl border-2 border-stone-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 text-stone-800 flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer active:scale-95 shadow-xs"
        >
          <span className="text-2xl sm:text-3xl">🖥️</span>
          <span className="text-[11px] sm:text-xs font-black whitespace-nowrap tracking-tight">
            {isJapanese ? 'スクリーン' : '스크린골프'}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold whitespace-nowrap tracking-tighter truncate max-w-full text-stone-500">
            {isJapanese ? '全国店舗・予約' : '전국 매장·예약'}
          </span>
        </button>

        {/* Row 1, Col 3: 투어 & 여행사 */}
        <button
          type="button"
          onClick={() => setActiveServiceTab('TOUR')}
          className="py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl border-2 border-stone-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 text-stone-800 flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer active:scale-95 shadow-xs"
        >
          <span className="text-2xl sm:text-3xl">🚌</span>
          <span className="text-[11px] sm:text-xs font-black whitespace-nowrap tracking-tight">
            {isJapanese ? 'ツアー・旅行' : '투어 & 여행사'}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold whitespace-nowrap tracking-tighter truncate max-w-full text-stone-500">
            {isJapanese ? '国内外ツアー' : '파크골프 국내·외투어'}
          </span>
        </button>

        {/* Row 1, Col 4: 클럽 & 모임 */}
        <button
          type="button"
          onClick={() => setActiveServiceTab('CLUB')}
          className="py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl border-2 border-stone-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 text-stone-800 flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer active:scale-95 shadow-xs"
        >
          <span className="text-2xl sm:text-3xl">👥</span>
          <span className="text-[11px] sm:text-xs font-black whitespace-nowrap tracking-tight">
            {isJapanese ? 'クラブ・同好会' : '클럽 & 모임'}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold whitespace-nowrap tracking-tighter truncate max-w-full text-stone-500">
            {isJapanese ? '全国サークル探し' : '전국 동호회·모임찾기'}
          </span>
        </button>

        {/* Row 2, Col 1: 연습장 & 레슨 */}
        <button
          type="button"
          onClick={() => setActiveServiceTab('RANGE_LESSON')}
          className="py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl border-2 border-stone-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 text-stone-800 flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer active:scale-95 shadow-xs"
        >
          <span className="text-2xl sm:text-3xl">👨‍🏫</span>
          <span className="text-[11px] sm:text-xs font-black whitespace-nowrap tracking-tight">
            {isJapanese ? '練習場＆レッスン' : '연습장 & 레슨'}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold whitespace-nowrap tracking-tighter truncate max-w-full text-stone-500">
            {isJapanese ? '打席・プロコーチ' : '타석·프로 코치'}
          </span>
        </button>

        {/* Row 2, Col 2: 골프 매장 */}
        <button
          type="button"
          onClick={() => setActiveServiceTab('SHOP')}
          className="py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl border-2 border-stone-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 text-stone-800 flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer active:scale-95 shadow-xs"
        >
          <span className="text-2xl sm:text-3xl">🛍️</span>
          <span className="text-[11px] sm:text-xs font-black whitespace-nowrap tracking-tight">
            {isJapanese ? 'ショップ・工房' : '골프 매장'}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold whitespace-nowrap tracking-tighter truncate max-w-full text-stone-500">
            {isJapanese ? 'フィッティング用品' : '피팅·용품점'}
          </span>
        </button>

        {/* Row 2, Col 3: 무료 장터 (구 중고 장터) */}
        <button
          type="button"
          onClick={() => setActiveServiceTab('MARKET')}
          className="py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl border-2 border-stone-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 text-stone-800 flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer active:scale-95 shadow-xs"
        >
          <span className="text-2xl sm:text-3xl">🤝</span>
          <span className="text-[11px] sm:text-xs font-black whitespace-nowrap tracking-tight">
            {isJapanese ? '無料フリマ' : '무료 장터'}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold whitespace-nowrap tracking-tighter truncate max-w-full text-stone-500">
            {isJapanese ? '個人・店舗無料直取引' : '개인·상점 무료 등록'}
          </span>
        </button>

        {/* Row 2, Col 4: 구장 탐방후기 */}
        <button
          type="button"
          onClick={() => setActiveServiceTab('REVIEW')}
          className="py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl border-2 border-stone-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 text-stone-800 flex flex-col items-center justify-center gap-1 text-center transition cursor-pointer active:scale-95 shadow-xs"
        >
          <span className="text-2xl sm:text-3xl">⭐</span>
          <span className="text-[11px] sm:text-xs font-black whitespace-nowrap tracking-tight">
            {isJapanese ? 'コース探訪記' : '구장 탐방후기'}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold whitespace-nowrap tracking-tighter truncate max-w-full text-stone-500">
            {isJapanese ? 'レビュー・評価★' : '생생 리뷰·별점★'}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* GOLF COURSE LIST (전국 구장 검색 & 공인 구장 목록 상시 노출) */}
      {/* ========================================================================= */}
      <div className="space-y-3 animate-fadeIn">
        {/* Search Result Status & Clear Button */}
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-950 font-black">
            <Search className="w-4 h-4 text-emerald-700" />
            <span>
              {isTextSearchActive && appliedQuery ? (
                <>
                  &apos;{appliedQuery}&apos; {isJapanese ? '検索結果:' : '검색 결과:'}{' '}
                  <strong className="text-emerald-800 text-sm">{filteredCourses.length}</strong>
                  {isJapanese ? '件' : '개 구장'}
                </>
              ) : countryFilter === 'JP' ? (
                <>
                  🇯🇵 {isJapanese ? '日本全国公認コース一覧:' : '일본 전국 공인 구장 목록:'}{' '}
                  <strong className="text-emerald-800 text-sm">{filteredCourses.length}</strong>
                  {isJapanese ? '件' : '개 구장'}
                </>
              ) : countryFilter === 'KR' ? (
                <>
                  🇰🇷 {isJapanese ? '韓国公認コース一覧:' : '대한민국 공인 구장 목록:'}{' '}
                  <strong className="text-emerald-800 text-sm">{filteredCourses.length}</strong>
                  {isJapanese ? '件' : '개 구장'}
                </>
              ) : (
                <>
                  🌐 {isJapanese ? '全コース一覧:' : '전체 등록 구장:'}{' '}
                  <strong className="text-emerald-800 text-sm">{filteredCourses.length}</strong>
                  {isJapanese ? '件' : '개 구장'}
                </>
              )}
            </span>
          </div>
          {isTextSearchActive && appliedQuery ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="bg-white hover:bg-stone-100 text-stone-700 font-extrabold px-3 py-1.5 rounded-xl border border-stone-300 text-[11px] shadow-2xs transition active:scale-95 cursor-pointer"
            >
              {isJapanese ? '✕ 検索クリア' : '✕ 검색 초기화'}
            </button>
          ) : null}
        </div>

          {/* Courses List */}
          <div className="space-y-3">
            {filteredCourses.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 space-y-3 shadow-xs">
                <div className="text-4xl">⛳</div>
                <h3 className="text-base font-black text-stone-800">
                  &quot;{appliedQuery}&quot; {isJapanese ? '関連のコースが見つかりませんでした。' : '관련 구장을 찾지 못했습니다.'}
                </h3>
                <p className="text-xs text-stone-700 leading-relaxed max-w-xs mx-auto">
                  {isJapanese
                    ? 'まだ登録されていないコースの場合は[新規登録]ボタンを押して標準コースを即座に作成できます。'
                    : '아직 등록되지 않은 구장이라면 [신규 등록] 버튼을 눌러 3초 만에 표준 코스로 즉시 생성할 수 있습니다.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNewName(appliedQuery);
                    setShowAddForm(true);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow cursor-pointer"
                >
                  + &quot;{appliedQuery}&quot; {isJapanese ? 'コース自動作成' : '구장 3초 자동 생성하기'}
                </button>
              </div>
            ) : (
              filteredCourses.map((c) => {
                const isHome = homeCourseId === c.id;
                const isFavorite = favoriteHomeCourseIds.includes(c.id);
                const dual = getCourseDualName(c, isJapanese);
                const displayRegion = getLocalizedCourseRegion(c);
                const isExpanded = expandedCourseId === c.id;

                return (
                  <div
                    key={c.id}
                    className={`rounded-2xl border transition overflow-hidden shadow-2xs ${
                      isHome
                        ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500/20'
                        : isFavorite
                        ? 'bg-amber-50/50 border-amber-400 ring-1 ring-amber-400/20'
                        : isExpanded
                        ? 'bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                        : 'bg-white border-stone-200 hover:border-emerald-400'
                    }`}
                  >
                    {/* 2줄 카드 헤더 행 (구장명 및 지역명 잘림 완전 방지) */}
                    <div
                      onClick={() => setExpandedCourseId(isExpanded ? null : c.id)}
                      className="p-3 sm:p-3.5 flex items-start justify-between gap-2.5 cursor-pointer select-none active:bg-stone-50 transition"
                    >
                      {/* 좌측: 구장명 및 배지 (1행) + 지역명 & 서브발음 (2행) */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="font-black text-sm sm:text-base text-stone-900 leading-tight">
                            {dual.primary}
                          </span>
                          {dual.showSecondary && dual.secondary && (
                            <span className="text-xs text-stone-500 font-bold">
                              {dual.secondary}
                            </span>
                          )}
                          {c.isVerified && (
                            <span className="text-[9px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.2 rounded shrink-0">
                              {isJapanese ? '公認' : '공인'}
                            </span>
                          )}
                          {isHome ? (
                            <span className="text-[9px] bg-emerald-700 text-white font-black px-1.5 py-0.2 rounded shrink-0">
                              {isJapanese ? '選択中' : '선택중'}
                            </span>
                          ) : isFavorite ? (
                            <span className="text-[9px] bg-amber-400 text-amber-950 font-black px-1.5 py-0.2 rounded shrink-0">
                              ★{isJapanese ? 'マイ' : '홈'}
                            </span>
                          ) : null}
                        </div>

                        {/* 지역명 서브 라인 (구장명 공간을 전혀 뺏지 않음) */}
                        <div className="flex items-center gap-1 text-xs text-stone-600 font-bold">
                          <span className="text-stone-400 text-[10px]">📍</span>
                          <span className="truncate">{displayRegion}</span>
                        </div>
                      </div>

                      {/* 우측: 코스 / 홀수 배지 & 펼침 아이콘 */}
                      <div className="flex items-center justify-end gap-1.5 shrink-0 pt-0.5">
                        <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 shadow-2xs whitespace-nowrap">
                          {isJapanese
                            ? `全${c.totalCourses || Math.max(1, Math.round(c.totalHoles / 9))}コース ${c.totalHoles}H`
                            : formatCourseHolesText(c)}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-emerald-700' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* 펼쳐졌을 때의 상세 내용 */}
                    {isExpanded && (
                      <div className="p-3.5 pt-1 border-t border-stone-100 space-y-3 animate-fadeIn bg-stone-50/40">
                        {/* 설명 (한국어/일본어 완벽 대응) */}
                        {getLocalizedCourseDescription(c, isJapanese) && (
                          <p className="text-xs text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200 leading-snug break-keep font-medium">
                            {getLocalizedCourseDescription(c, isJapanese)}
                          </p>
                        )}

                        {/* 상세 시설 정보: 주소, 전화, 요금, 운영시간, 주차 (한국어/일본어 완벽 대응) */}
                        {(c.address || c.phone || c.openHours || c.fee || c.closedDay || c.parking) && (
                          <div className="text-xs space-y-1.5 bg-white p-3 rounded-2xl border border-stone-200">
                            {getLocalizedCourseAddress(c, isJapanese) && (
                              <div className="flex items-start gap-1.5 text-stone-800">
                                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                                <span className="font-bold text-stone-900">
                                  {getLocalizedCourseAddress(c, isJapanese)}
                                  {!isJapanese && c.country === 'JP' && c.addressJa && c.addressJa !== getLocalizedCourseAddress(c, isJapanese) && (
                                    <span className="text-[10px] text-stone-400 font-normal ml-1.5">
                                      ({c.addressJa})
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-600 font-semibold text-[11px]">
                              {c.phone && (
                                <a
                                  href={`tel:${c.phone}`}
                                  className="flex items-center gap-1 text-emerald-800 hover:underline font-extrabold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200"
                                >
                                  <Phone className="w-3 h-3 text-emerald-700" />
                                  <span>{c.phone}</span>
                                </a>
                              )}
                              {getLocalizedCourseFee(c, isJapanese) && (
                                <span className="bg-stone-50 px-2 py-0.5 rounded-lg border border-stone-200">
                                  💰 {getLocalizedCourseFee(c, isJapanese)}
                                </span>
                              )}
                              {getLocalizedCourseOpenHours(c, isJapanese) && (
                                <span className="bg-stone-50 px-2 py-0.5 rounded-lg border border-stone-200">
                                  ⏰ {getLocalizedCourseOpenHours(c, isJapanese)}
                                </span>
                              )}
                              {getLocalizedCourseClosedDay(c, isJapanese) && (
                                <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded-lg border border-rose-200 font-bold">
                                  ⛔ {getLocalizedCourseClosedDay(c, isJapanese)}
                                </span>
                              )}
                            </div>
                            {getLocalizedCourseParking(c, isJapanese) && (
                              <div className="text-[11px] text-stone-600 flex items-center gap-1 font-medium">
                                <span>🅿️ {isJapanese ? '駐車場:' : '주차:'}</span>
                                <span>{getLocalizedCourseParking(c, isJapanese)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 📋 홀별 제원표 버튼 */}
                        <button
                          type="button"
                          onClick={() => setDetailCourse(c)}
                          className="w-full bg-stone-100 hover:bg-stone-200 text-stone-900 font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-between border border-stone-300 shadow-2xs transition active:scale-[0.99] cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="text-sm">📋</span>
                            <span>
                              {isJapanese
                                ? 'コース別 1〜9ホール詳細諸元表'
                                : '코스별 1~9홀 상세 제원표'}
                            </span>
                          </span>
                          <span className="text-[11px] text-emerald-800 font-extrabold bg-white px-2 py-0.5 rounded border border-stone-200">
                            {isJapanese ? '確認/修正 ❯' : '확인/정정 ❯'}
                          </span>
                        </button>

                        {/* 🍽️ 이 구장 주변 제휴 식당 & 쿠폰 혜택 버튼 */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStoreCourseId(c.id);
                            setActiveServiceTab('RESTAURANT');
                            setInputQuery('');
                            setAppliedQuery('');
                          }}
                          className="w-full bg-amber-50 hover:bg-amber-100 text-amber-950 font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-between border border-amber-300 shadow-2xs transition active:scale-[0.99] cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="text-sm">🍽️</span>
                            <span>{isJapanese ? 'このコース周辺の提携グルメ・特典' : '이 구장 주변 제휴 식당 & 쿠폰 혜택'}</span>
                          </span>
                          <span className="text-[11px] text-amber-900 font-extrabold bg-amber-200/80 px-2 py-0.5 rounded">
                            {isJapanese ? '店舗一覧 ❯' : '매장 확인 ❯'}
                          </span>
                        </button>

                        {/* Action Buttons: 구장 선택 & 홈구장 지정 (동일한 50:50 크기) */}
                        <div className="pt-0.5 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleSelectCourseAndGoHome(c.id)}
                              className="w-full bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-black text-xs sm:text-sm py-3 px-2 rounded-xl shadow-xs text-center transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap"
                            >
                              <span>{isJapanese ? '⛳ このコースを選択' : '⛳ 이 구장 선택'}</span>
                              <ChevronRight className="w-4 h-4 shrink-0" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleFavoriteHomeCourse(c.id)}
                              className={`w-full py-3 px-2 rounded-xl border text-xs sm:text-sm font-black flex items-center justify-center gap-1 transition cursor-pointer shadow-xs active:scale-95 whitespace-nowrap ${
                                isHome
                                  ? 'bg-emerald-100 text-emerald-950 border-emerald-400 ring-2 ring-emerald-500/20'
                                  : isFavorite
                                  ? 'bg-amber-100 text-amber-950 border-amber-400'
                                  : 'bg-white text-stone-800 border-stone-300 hover:bg-amber-50 hover:border-amber-300'
                              }`}
                              title={isJapanese ? "マイコースに設定/解除" : "내 지정 홈 구장으로 설정/해제"}
                            >
                              <Star className={`w-3.5 h-3.5 shrink-0 ${isHome || isFavorite ? 'fill-current text-yellow-500' : 'text-stone-400'}`} />
                              <span className="truncate">
                                {isJapanese ? 'ホームコース登録' : '홈구장으로 등록'}
                              </span>
                            </button>
                          </div>

                          {c.id.startsWith('custom-course-') && (
                            <div className="flex justify-end pt-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const confirmMsg = isJapanese ? `'${c.name}' コースを削除しますか？` : `'${c.name}' 구장을 삭제하시겠습니까?`;
                                  if (confirm(confirmMsg)) {
                                    ParkOnStorage.deleteCustomCourse(c.id);
                                    refreshCourses();
                                  }
                                }}
                                className="text-xs text-rose-500 hover:text-rose-700 py-1 px-2.5 rounded-lg hover:bg-rose-50 transition border border-rose-200 cursor-pointer flex items-center gap-1"
                                title={isJapanese ? "コース削除" : "구장 삭제"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{isJapanese ? 'コース削除' : '구장 삭제'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>


      {/* ========================================================================= */}
      {/* 8대 카테고리 전용 팝업 모달창 (새로운 팝업창으로 표출 & 닫기 시 즉시 원래 구장 검색 화면 복귀) */}
      {/* ========================================================================= */}
      {activeServiceTab && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={() => setActiveServiceTab(null)}
        >
          <div
            className="bg-white w-full max-w-xl max-h-[92vh] rounded-3xl shadow-2xl border-2 border-emerald-600 flex flex-col overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 팝업 상단 헤더 */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-4.5 flex items-center justify-between shadow-xs shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-2xl border border-white/20 shrink-0">
                  {activeServiceTab === 'RESTAURANT' && '🍽️'}
                  {activeServiceTab === 'SCREEN' && '🖥️'}
                  {activeServiceTab === 'TOUR' && '🚌'}
                  {activeServiceTab === 'CLUB' && '👥'}
                  {activeServiceTab === 'RANGE_LESSON' && '👨‍🏫'}
                  {activeServiceTab === 'SHOP' && '🛍️'}
                  {activeServiceTab === 'MARKET' && '🤝'}
                  {activeServiceTab === 'REVIEW' && '⭐'}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                    {activeServiceTab === 'RESTAURANT' && (isJapanese ? 'コース周辺グルメ・カフェ' : '구장 인근 식당 & 카페')}
                    {activeServiceTab === 'SCREEN' && (isJapanese ? '全国スクリーンパークゴルフ場' : '전국 스크린 파크골프장 매장 및 예약')}
                    {activeServiceTab === 'TOUR' && (isJapanese ? 'パークゴルフ国内外ツアー旅行社' : '파크골프 국내 & 해외 투어 여행사')}
                    {activeServiceTab === 'CLUB' && (isJapanese ? '全国パークゴルフ同好会・サークル' : '전국 클럽 & 동호회 모임 찾기')}
                    {activeServiceTab === 'RANGE_LESSON' && (isJapanese ? '専門コーチのレッスン及び屋内外練習場案内' : '전문 코치 레슨 및 실내·외 연습장 안내')}
                    {activeServiceTab === 'SHOP' && (isJapanese ? 'パークゴルフフィッティング・用品店' : '파크골프 피팅 & 골프 매장')}
                    {activeServiceTab === 'MARKET' && (isJapanese ? 'パークゴルフ無料直取引フリーマーケット' : '파크골프 무료 직거래 장터')}
                    {activeServiceTab === 'REVIEW' && (isJapanese ? 'リアルコース探訪記・評価' : '생생 구장 탐방후기 & 별점')}
                  </h2>
                  {activeServiceTab !== 'RESTAURANT' && (
                    <p className="text-[11px] sm:text-xs text-emerald-100 font-medium truncate">
                      {activeServiceTab === 'SCREEN' && '궂은 날씨에도 실내에서 즐기는 전국 스크린 매장'}
                      {activeServiceTab === 'TOUR' && '국내·외 명문 파크골프장 투어 여행 및 원정 라운드'}
                      {activeServiceTab === 'CLUB' && '내 주변 동호회 가입, 정기 월례회 및 실시간 번개 모임'}
                      {activeServiceTab === 'RANGE_LESSON' && (isJapanese ? '専門コーチのレッスン及び屋内外練習場案内' : '전문 코치 레슨 및 실내·외 연습장 안내')}
                      {activeServiceTab === 'SHOP' && '정품 클럽, 용품점 및 즉시 그립 교체 전문점'}
                      {activeServiceTab === 'MARKET' && (isJapanese ? '手数料0円！個人愛好者・店舗どなたでも自由に出品＆直取引' : '수수료 0원! 개인·상점 누구나 자유롭게 무료 등록 & 직거래')}
                      {activeServiceTab === 'REVIEW' && '실제 방문 골퍼들의 잔디 상태 및 솔직 한줄평'}
                    </p>
                  )}
                </div>
              </div>

              {/* 상단 닫기 X 버튼 */}
              <button
                type="button"
                id="btn-close-service-modal"
                onClick={() => setActiveServiceTab(null)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-lg font-black transition cursor-pointer active:scale-95 shrink-0 ml-2"
                title="닫기"
              >
                ✕
              </button>
            </div>

            {/* 팝업 본문 (스크롤 가능 영역) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* ========================================================================= */}
          {/* PANEL 1: 구장 인근 식당 & 카페 (2개 카테고리 탭 + 유저 단골 식당 추천 탭) */}
          {/* ========================================================================= */}
          {activeServiceTab === 'RESTAURANT' && (() => {
            const currentSelectedCourse = courses.find((c) => c.id === selectedStoreCourseId);
            const currentCourseName = currentSelectedCourse?.name || (selectedStoreCourseId === 'ALL' ? '전국 전체 구장' : '구미 동락 파크골프장');

            const isCafeCategory = (cat?: string) => {
              if (!cat) return false;
              return cat === '카페/다과' || cat === '카페·간식' || cat === '분식·기타' || cat.includes('카페') || cat.includes('다과') || cat.includes('다원');
            };

            // 선택된 구장에 매칭되는 식당/카페 목록
            const categoryStores = userRecommendedStores.filter((s) => {
              const isCafe = isCafeCategory(s.category);
              const matchCategory = storeMainTab === 'CAFE' ? isCafe : !isCafe;

              if (selectedStoreCourseId === 'ALL') return matchCategory;

              const cName = (s.courseName || '').toLowerCase();
              const targetCourseShortName = (currentCourseName || '').toLowerCase().replace('파크골프장', '').trim();

              const matchCourse =
                s.courseId === selectedStoreCourseId ||
                (selectedStoreCourseId.includes('dongrak') && (s.courseId === '1' || cName.includes('동락'))) ||
                (selectedStoreCourseId.includes('suseong') && (s.courseId === '3' || cName.includes('수성'))) ||
                (targetCourseShortName && cName.includes(targetCourseShortName));

              return matchCategory && matchCourse;
            });

            // 대표님 지침: 참여수(60%) + 별점(40%) 가중치 6:4 종합 랭킹 및 옥션 1위 정렬
            const scoredStores = RestaurantStorage.sortRestaurants(
              categoryStores.length > 0
                ? categoryStores
                : userRecommendedStores.filter((s) => (storeMainTab === 'CAFE' ? isCafeCategory(s.category) : !isCafeCategory(s.category)))
            );

            // 초기 서너 개(4개) 노출 및 전체보기 토글
            const visibleStores = showAllRestaurants ? scoredStores : scoredStores.slice(0, 4);

            return (
              <div className="bg-white rounded-3xl p-3.5 sm:p-4.5 border-2 border-emerald-500/50 shadow-md space-y-3.5 animate-fadeIn">
                {/* 1. 상권 구장 선택 바 */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 font-bold text-stone-700">
                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="shrink-0 text-stone-500">{isJapanese ? '周辺コース:' : '현재 상권 구장:'}</span>
                    <span className="font-black text-emerald-950 truncate">
                      {currentCourseName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCourseSelectSearchTerm('');
                      setShowCourseSelectModal(true);
                    }}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{isJapanese ? 'コース選択' : '해당 구장 선택하기'}</span>
                  </button>
                </div>

                {/* 2. 대분류 2개 탭: [ 🍲 식당 ] vs [ ☕ 카페·간식 ] */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStoreMainTab('RESTAURANT')}
                    className={`py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98 shadow-xs border-2 ${
                      storeMainTab === 'RESTAURANT'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-base">🍲</span>
                    <span>{isJapanese ? 'グルメ' : '식당'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoreMainTab('CAFE')}
                    className={`py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98 shadow-xs border-2 ${
                      storeMainTab === 'CAFE'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-base">☕</span>
                    <span>{isJapanese ? 'カフェ・軽食' : '카페·간식'}</span>
                  </button>
                </div>

                {/* 3. 대표님 지침: 6:4 가중치 랭킹 헤더 안내 띠 */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] font-black text-emerald-950">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-amber-500">🏆</span>
                    <span className="truncate">{isJapanese ? '愛好者参加数(60%)＋評価(40%)加重ランキング順' : '동호인 참여수(60%) + 별점(40%) 가중치 랭킹 순'}</span>
                  </div>
                  <span className="text-emerald-800 font-bold shrink-0">
                    {isJapanese ? `計 ${scoredStores.length}件` : `총 ${scoredStores.length}곳`}
                  </span>
                </div>

                {/* 4. 대표님 지침: 한 화면에 쏙 들어오는 한 줄 테이블 (서너 개 기본 노출 ➔ 클릭 시 전체보기) */}
                {scoredStores.length === 0 ? (
                  <div className="text-center py-6 px-4 bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-xs text-stone-600 space-y-1.5">
                    <p className="font-bold">
                      {isJapanese
                        ? `&apos;${currentCourseName}&apos; 周辺に登録されたおすすめの${storeMainTab === 'RESTAURANT' ? 'グルメ' : 'カフェ'}がまだありません。`
                        : `&apos;${currentCourseName}&apos; 인근에 등록된 추천 ${storeMainTab === 'RESTAURANT' ? '식당' : '카페'}이 아직 없습니다.`}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {isJapanese
                        ? '下部の「行きつけのお店を推薦する」から最初のおすすめを登録してみましょう！'
                        : '하단 [✍️ 나의 단골 식당 추천하기]를 눌러 첫 번째 단골집을 등록해 보세요!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {visibleStores.map((store) => (
                      <div
                        key={store.id}
                        onClick={() => setSelectedDetailRestaurant(store)}
                        className={`bg-white hover:bg-emerald-50/70 border rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 transition cursor-pointer active:scale-[0.99] shadow-2xs ${
                          store.rank === 1
                            ? 'border-amber-400 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 ring-1 ring-amber-300'
                            : 'border-stone-200 hover:border-emerald-400'
                        }`}
                      >
                        {/* 좌측: 순위 뱃지 + 상호명 + 별점 & 참여자 수 + 태그 */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-[11px] sm:text-xs shrink-0 shadow-2xs ${
                              store.rank === 1
                                ? 'bg-amber-400 text-stone-950 font-black'
                                : store.rank === 2
                                ? 'bg-stone-200 text-stone-800'
                                : store.rank === 3
                                ? 'bg-amber-700/85 text-white'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {store.rank === 1
                              ? (isJapanese ? '🥇1位' : '🥇1위')
                              : store.rank === 2
                              ? (isJapanese ? '🥈2位' : '🥈2위')
                              : store.rank === 3
                              ? (isJapanese ? '🥉3位' : '🥉3위')
                              : `${store.rank}${isJapanese ? '位' : '위'}`}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-sm text-stone-900 truncate">
                                {store.name}
                              </span>
                              {store.isAuctionWinner && (
                                <span className="bg-amber-400 text-stone-950 font-black text-[9px] px-1.5 py-0.2 rounded shrink-0">
                                  {isJapanese ? '👑公認1位' : '👑구장1위'}
                                </span>
                              )}
                              <span className="bg-emerald-100/70 text-emerald-900 font-bold text-[10px] px-1.5 py-0.2 rounded shrink-0">
                                {store.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-stone-600 mt-0.5">
                              <span className="text-amber-500 font-black">★ {(store.rating || 5).toFixed(1)}</span>
                              <span className="font-bold text-stone-500">
                                ({store.ratingsCount || store.reviews?.length || 1}{isJapanese ? '名参加' : '명 참여'})
                              </span>
                              <span className="text-stone-300">·</span>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1 rounded shrink-0">
                                {isJapanese ? 'スコア' : '점수'} {store.compositeScore}{isJapanese ? '点' : '점'}
                              </span>
                              {store.tags?.[0] && (
                                <>
                                  <span className="text-stone-300 hidden xs:inline">·</span>
                                  <span className="text-stone-500 truncate hidden xs:inline">{store.tags[0]}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 우측: 카카오맵 바로가기 버튼 (100% 공식 검색 연동) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={getKakaoMapUrl(store)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black text-[11px] px-2.5 py-1.5 rounded-xl flex items-center gap-1 border border-[#E6CF00] shadow-2xs transition active:scale-95 shrink-0"
                            title={isJapanese ? 'マップで詳細および道案内を見る' : '카카오맵에서 매장 및 길찾기 보기'}
                          >
                            <span className="text-xs">🗺️</span>
                            <span className="font-black">{isJapanese ? '地図' : '카카오맵'}</span>
                          </a>
                        </div>
                      </div>
                    ))}

                    {/* 대표님 지침: 4개 초과 시 전체보기 / 접기 토글 */}
                    {scoredStores.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowAllRestaurants(!showAllRestaurants)}
                        className="w-full py-2.5 px-3 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 rounded-xl text-stone-800 font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-stone-200 mt-1"
                      >
                        {showAllRestaurants ? (
                          <>
                            <span>{isJapanese ? '▲ 閉じる (TOP 4のみ表示)' : '▲ 접기 (TOP 4만 간략히 보기)'}</span>
                          </>
                        ) : (
                          <>
                            <span>
                              {isJapanese
                                ? `▼ おすすめをすべて見る (計 ${scoredStores.length}件の順位を展開)`
                                : `▼ 추천 맛집 전체보기 (총 ${scoredStores.length}곳 전체 순위 펼치기)`}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* PANEL: 스크린골프 (전국 매장 & 예약) */}
          {/* ========================================================================= */}
          {activeServiceTab === 'SCREEN' && (
            <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-emerald-500/50 shadow-md space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center text-xl">
                    🖥️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-900">
                      전국 파크골프 스크린골프장 매장 & 예약
                    </h3>
                    <p className="text-[11px] text-stone-600 font-semibold">
                      비나 눈 오는 날에도 사계절 쾌적하게 즐기는 실내 스크린
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStoreRegisterModal(true)}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>스크린 매장 등록</span>
                </button>
              </div>

              {practiceRanges.filter((p) => (p.type && (p.type.includes('스크린') || p.type.includes('실내'))) || (p.name && p.name.includes('스크린'))).length === 0 ? (
                <div className="text-center py-8 px-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <span className="text-3xl block">🖥️</span>
                  <div className="space-y-1">
                    <h4 className="font-black text-stone-900 text-sm">
                      {isJapanese ? '登録されたスクリーンパークゴルフ場がありません。1号として登録してみましょう！' : '등록된 스크린골프 매장이 없습니다. 1호로 등록해 보세요!'}
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
                      {isJapanese ? 'よく行く屋内スクリーン店舗を直接登録してみましょう。' : '자주 가시는 실내 스크린골프 매장을 직접 1호로 등록해 보세요.'}
                    </p>
                  </div>
                  <div className="pt-2 max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={() => setShowRangeModal(true)}
                      className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isJapanese ? '+ スクリーン店舗を登録する' : '+ 스크린 매장 직접 등록하기'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {practiceRanges
                    .filter((p) => (p.type && (p.type.includes('스크린') || p.type.includes('실내'))) || (p.name && p.name.includes('스크린')))
                    .map((s) => (
                      <div key={s.id} className="border border-stone-200 bg-stone-50 rounded-2xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-sm text-stone-900">{s.name}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">{s.type || '스크린'}</span>
                        </div>
                        <p className="text-xs text-stone-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                          <span>{s.region}</span>
                        </p>
                        {s.feature && (
                          <div className="text-[11px] text-stone-700 font-semibold bg-white p-2 rounded-xl border border-stone-200">
                            {s.feature}
                          </div>
                        )}
                        <a
                          href={`tel:${s.phone}`}
                          className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition"
                        >
                          <Phone className="w-3 h-3" />
                          <span>스크린 예약 전화 ({s.phone})</span>
                        </a>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PANEL: 투어 & 여행사 (파크골프 국내·외투어) */}
          {/* ========================================================================= */}
          {activeServiceTab === 'TOUR' && (() => {
            const sortedTours = TourStorage.sortTours(tours, tourTypeFilter);
            return (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-emerald-500/50 shadow-md space-y-3.5 animate-fadeIn">
                {/* 상단 헤더 & 무료 등록 버튼 */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center text-xl">
                      🚌
                    </div>
                    <div>
                      <h3 className="text-base font-black text-stone-900 flex items-center gap-1.5 flex-wrap">
                        <span>파크골프 명품 국내 & 해외 투어 패키지</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                          {tours.length}개 상품
                        </span>
                      </h3>
                      <p className="text-[11px] text-stone-600 font-semibold">
                        전국 유명 구장 순례 및 일본 홋카이도 도카치 명품 원정
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="header-tour-register-btn"
                    onClick={() => setShowTourRegisterModal(true)}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-3 py-2 rounded-xl flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>투어 무료 등록</span>
                  </button>
                </div>

                {/* 투어 구분 서브 필터 탭 */}
                <div className="flex items-center gap-1.5 p-1 bg-stone-100/90 rounded-2xl border border-stone-200 text-xs font-black">
                  {[
                    { id: 'ALL' as TourType, label: '전체 투어', icon: '🌐' },
                    { id: 'DOMESTIC' as TourType, label: '국내 명품 투어', icon: '🇰🇷' },
                    { id: 'OVERSEAS' as TourType, label: '일본·해외 원정', icon: '🇯🇵' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTourTypeFilter(tab.id)}
                      className={`flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 text-xs select-none ${
                        tourTypeFilter === tab.id
                          ? 'bg-emerald-700 text-white shadow-xs font-black'
                          : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* 투어 목록 표출 또는 0개 빈 상태 카드 */}
                {tours.length === 0 ? (
                  /* 0개 빈 상태: 파키 마스코트 & 투어 패키지 무료 등록 CTA */
                  <div className="border-2 border-dashed border-emerald-400 bg-gradient-to-b from-emerald-50/50 via-white to-amber-50/30 rounded-3xl p-6 sm:p-7 text-center space-y-4 my-2">
                    <div className="relative inline-block">
                      <img
                        src="/parky.jpg"
                        alt="마스코트 파키 PARKY"
                        className="w-20 h-20 rounded-full border-4 border-emerald-500 shadow-md mx-auto object-cover"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-950 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                        1호 모집
                      </span>
                    </div>

                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <h4 className="font-black text-stone-900 text-base">
                        {isJapanese ? '登録されたツアー商品がありません。1号として登録してみましょう！' : '등록된 투어 여행 상품이 없습니다. 1호로 등록해 보세요!'}
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed font-medium">
                        {isJapanese ? '国内外のパークゴルフツアー商品を無料で登録してツアー客を募集しましょう！' : '여행사 대표님이시거나 투어 기획자이신가요? 지금 바로 1호 명품 투어로 무료 등록해 보세요!'}
                      </p>
                    </div>

                    <div className="pt-1 max-w-sm mx-auto">
                      <button
                        type="button"
                        onClick={() => setShowTourRegisterModal(true)}
                        className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs sm:text-sm py-3.5 px-4 rounded-2xl shadow-lg border-2 border-amber-500 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                      >
                        <Sparkles className="w-4 h-4 text-stone-950 shrink-0" />
                        <span>{isJapanese ? 'ツアー商品を無料登録する (100%無料)' : '투어 패키지 무료 등록하기 (100% 무료)'}</span>
                      </button>
                    </div>
                  </div>
                ) : sortedTours.all.length === 0 ? (
                  /* 필터 결과 0개 상태 */
                  <div className="py-8 px-4 text-center space-y-2 bg-stone-50 rounded-2xl border border-stone-200 my-2">
                    <p className="text-xs font-bold text-stone-600">
                      선택하신 구분({tourTypeFilter === 'DOMESTIC' ? '🇰🇷 국내 명품 투어' : '🇯🇵 일본·해외 원정'})에 등록된 상품이 없습니다.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTourTypeFilter('ALL')}
                      className="text-xs font-black text-emerald-800 underline hover:text-emerald-900 cursor-pointer"
                    >
                      전체 투어 보기 ({tours.length}개 상품)
                    </button>
                  </div>
                ) : (
                  /* 2단계 계층 정렬 투어 목록 */
                  <div className="space-y-3 pt-1">
                    {/* 1계층: 상단 추천 옥션 투어 */}
                    {sortedTours.tier1.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-black text-amber-950 px-1">
                          <span className="flex items-center gap-1.5">
                            <span className="text-sm">👑</span>
                            <span>파키 추천 명품 투어 패키지 ({sortedTours.tier1.length}개)</span>
                          </span>
                          <span className="text-[10px] text-amber-800 font-bold">
                            상단 우선 노출
                          </span>
                        </div>

                        {sortedTours.tier1.map((tour) => (
                          <div
                            key={tour.id}
                            className="border-2 border-amber-400 bg-gradient-to-b from-amber-50/60 via-white to-amber-50/30 rounded-2xl p-3.5 sm:p-4 shadow-md ring-1 ring-amber-400/40 space-y-2.5 transition hover:shadow-lg"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-amber-400 text-stone-950 font-black text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                                  <span>👑</span>
                                  <span>파키 추천</span>
                                </span>
                                <span className="bg-emerald-100 text-emerald-900 font-black text-[10px] px-1.5 py-0.5 rounded">
                                  {tour.tourType === 'DOMESTIC' ? '🇰🇷 국내 투어' : '🇯🇵 해외 투어'}
                                </span>
                                <span className="text-xs font-black text-stone-700">
                                  {tour.agencyName}
                                </span>
                              </div>
                              <span className="text-sm font-black text-emerald-900">
                                {tour.price}
                              </span>
                            </div>

                            <div className="flex items-start gap-3">
                              {tour.imageUrl && (
                                <img
                                  src={tour.imageUrl}
                                  alt={tour.title}
                                  className="w-20 h-20 rounded-xl object-cover shrink-0 border border-stone-200 shadow-2xs"
                                />
                              )}
                              <div className="min-w-0 flex-1 space-y-1">
                                <h4 className="font-black text-base text-stone-900 tracking-tight leading-tight">
                                  {tour.title}
                                </h4>
                                <p className="text-xs font-bold text-stone-600 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                  <span>{tour.destination} ({tour.duration})</span>
                                </p>
                              </div>
                            </div>

                            {/* 사은품 및 포함 혜택 강조 */}
                            {tour.giftsAndBenefits && (
                              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-xs">
                                <div className="flex items-center gap-1.5 min-w-0 text-xs font-black">
                                  <Gift className="w-4 h-4 text-amber-300 shrink-0" />
                                  <span className="truncate">
                                    [참가자 특전] {tour.giftsAndBenefits}
                                  </span>
                                </div>
                                <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-full shrink-0">
                                  사은품 포함
                                </span>
                              </div>
                            )}

                            {/* 예약 전화 버튼 */}
                            <div className="pt-0.5">
                              <a
                                href={`tel:${tour.phone}`}
                                className="w-full bg-stone-950 hover:bg-stone-800 text-amber-300 font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition active:scale-98"
                              >
                                <Phone className="w-3.5 h-3.5" />
                                <span>투어 예약 / 사은품 문의 ({tour.phone}) 📞</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 2계층: 무료 일반 등록 투어 */}
                    {sortedTours.tier2.length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        <div className="flex items-center justify-between text-xs font-black text-stone-700 px-1 border-t border-stone-200/80 pt-3">
                          <span className="flex items-center gap-1.5">
                            <span>🚌</span>
                            <span>등록된 일반 투어 상품 ({sortedTours.tier2.length}개)</span>
                          </span>
                        </div>

                        {sortedTours.tier2.map((tour) => (
                          <div
                            key={tour.id}
                            className="border border-stone-200 bg-white rounded-2xl p-3 sm:p-3.5 hover:border-emerald-400 shadow-2xs space-y-2 transition"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-stone-100 text-stone-800 font-black text-[10px] px-1.5 py-0.5 rounded">
                                  {tour.tourType === 'DOMESTIC' ? '🇰🇷 국내 투어' : '🇯🇵 해외 투어'}
                                </span>
                                <span className="text-xs font-black text-stone-700">
                                  {tour.agencyName}
                                </span>
                              </div>
                              <span className="text-xs font-black text-emerald-900">
                                {tour.price}
                              </span>
                            </div>

                            <div className="flex items-start gap-2.5">
                              {tour.imageUrl && (
                                <img
                                  src={tour.imageUrl}
                                  alt={tour.title}
                                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200"
                                />
                              )}
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <h4 className="font-black text-sm text-stone-900 truncate">
                                  {tour.title}
                                </h4>
                                <p className="text-xs font-bold text-stone-600 truncate">
                                  {tour.destination} ({tour.duration})
                                </p>
                              </div>
                            </div>

                            {/* 사은품 배지 */}
                            {tour.giftsAndBenefits && (
                              <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs font-bold">
                                <span className="truncate">🎁 [사은품] {tour.giftsAndBenefits}</span>
                                <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-black shrink-0">
                                  특전
                                </span>
                              </div>
                            )}

                            {/* 전화 버튼 */}
                            <a
                              href={`tel:${tour.phone}`}
                              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>투어 문의 ({tour.phone})</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 하단 고정 배너: 여행사/투어 무료 등록 */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTourRegisterModal(true)}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm flex items-center justify-between shadow-lg transition active:scale-[0.99] cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">🚌</span>
                      <div className="text-left">
                        <div className="text-sm font-black">여행사 / 투어 패키지 무료 등록 신청 ▶</div>
                        <div className="text-[11px] text-emerald-100 font-medium">
                          전국 파크골프 투어리스트 및 단체 원정팀 유치 (국내/해외)
                        </div>
                      </div>
                    </div>
                    <span className="text-xs bg-amber-400 text-stone-950 px-3 py-1.5 rounded-xl font-black shrink-0 shadow-xs">
                      100% 무료
                    </span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* PANEL: 클럽 & 모임 (전국 동호회·모임찾기 - 무료 커뮤니티) */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* PANEL: 클럽 & 모임 (전국 동호회·회원 모집 센터 - 무료 등록 및 가입 신청) */}
          {/* ========================================================================= */}
          {activeServiceTab === 'CLUB' && (() => {
            const currentSelectedCourse = courses.find((c) => c.id === selectedStoreCourseId);
            const currentCourseName = currentSelectedCourse?.name || '구미 동락 파크골프장';
            const cleanCourseName = stripParkGolfSuffix(currentCourseName);

            // 1. 검색어 및 단원 모집중 필터링 로직
            const filteredClubs = clubs.filter((club) => {
              // (1) 단원 모집중만 보기 토글 필터
              if (onlyRecruitingFilter) {
                if (club.recruitStatus !== 'RECRUITING' && club.recruitStatus !== 'ALWAYS') {
                  return false;
                }
              }

              // (2) 지명(시·군·구) 또는 클럽명 직접 검색어 필터
              if (clubSearchQuery.trim()) {
                const q = clubSearchQuery.trim().toLowerCase();
                const matchName = club.name.toLowerCase().includes(q);
                const matchCourse = club.homeCourseName.toLowerCase().includes(q);
                const matchRegion = club.region.toLowerCase().includes(q);
                const matchManager = (club.managerName || '').toLowerCase().includes(q);
                const matchNotes = (club.recruitNotes || '').toLowerCase().includes(q);
                if (!matchName && !matchCourse && !matchRegion && !matchManager && !matchNotes) {
                  return false;
                }
              }

              return true;
            });

            // 2. 단원 모집 중인 클럽 vs 일반 활동/정원 마감 클럽 분리
            const recruitingClubs = filteredClubs.filter(
              (c) => c.recruitStatus === 'RECRUITING' || c.recruitStatus === 'ALWAYS'
            );
            const closedOrGeneralClubs = filteredClubs.filter(
              (c) => c.recruitStatus !== 'RECRUITING' && c.recruitStatus !== 'ALWAYS'
            );

            // 클럽 카드 렌더링 헬퍼
            const renderClubCard = (club: ParkGolfClub, isRecruitingHighlight: boolean) => {
              const isRecruiting = club.recruitStatus === 'RECRUITING';
              const isAlways = club.recruitStatus === 'ALWAYS';

              return (
                <div
                  key={club.id}
                  className={`rounded-2xl p-4 transition space-y-3 ${
                    isRecruitingHighlight
                      ? 'border-2 border-emerald-500 bg-emerald-50/20 hover:border-emerald-600 shadow-xs'
                      : 'border border-stone-200 bg-white hover:border-stone-400 shadow-2xs'
                  }`}
                >
                  {/* 클럽명 & 뱃지 */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {club.isParkOnClub && (
                        <span className="bg-amber-400 text-stone-950 font-black text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
                          <span>👑</span>
                          <span>공식 클럽</span>
                        </span>
                      )}
                      <span className="text-sm sm:text-base font-black text-stone-900">
                        {club.name}
                      </span>
                      <span className="bg-stone-100 text-stone-700 font-bold text-[10px] px-1.5 py-0.5 rounded">
                        {club.region}
                      </span>
                    </div>

                    {/* 모집 상태 뱃지 */}
                    <div>
                      {isRecruiting ? (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-full shadow-2xs">
                          🟢 단원 모집중 {club.recruitQuota ? `(${club.recruitQuota}명 선착순)` : ''}
                        </span>
                      ) : isAlways ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full shadow-2xs">
                          🌟 상시 모집
                        </span>
                      ) : (
                        <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          🔒 정원 마감
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 홈구장 & 임원진 & 회원 정보 */}
                  <div className="flex items-center gap-3 text-xs text-stone-600 font-bold flex-wrap bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <span className="flex items-center gap-1 text-emerald-800 font-black">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{club.homeCourseName}</span>
                    </span>
                    <span>•</span>
                    <span>회장: {club.presidentName || '회장'}</span>
                    <span>•</span>
                    <span>총무: {club.managerName}</span>
                    <span>•</span>
                    <span className="text-stone-900 font-black">단원: {club.memberCount}명</span>
                    {club.annualDuesAmount !== undefined && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-900 font-black">
                          연회비: {club.annualDuesAmount > 0 ? `${club.annualDuesAmount.toLocaleString()}원` : '무료'}
                        </span>
                      </>
                    )}
                  </div>

                  {/* 소개글 */}
                  {club.description && (
                    <p className="text-xs text-stone-600 font-medium leading-relaxed">
                      {club.description}
                    </p>
                  )}

                  {/* 총무 모집 공고 요강 및 특전 박스 */}
                  {club.recruitNotes && (
                    <div
                      className={`rounded-xl p-2.5 space-y-1 ${
                        isRecruitingHighlight
                          ? 'bg-emerald-100/70 border border-emerald-300'
                          : 'bg-stone-100/80 border border-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-emerald-950 font-black text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>[총무 모집 공고 & 단원 특전]</span>
                      </div>
                      <p className="text-xs text-stone-800 font-semibold whitespace-pre-line leading-relaxed">
                        {club.recruitNotes}
                      </p>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setJoiningClub(club)}
                      className={`w-full font-black text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition ${
                        isRecruitingHighlight
                          ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                          : 'bg-stone-800 hover:bg-stone-700 text-white'
                      }`}
                    >
                      <span>✍️</span>
                      <span>{isRecruitingHighlight ? '클럽 가입 신청서 접수하기' : '가입 문의 / 결원 신청'}</span>
                    </button>

                    {club.contactPhone ? (
                      <a
                        href={`tel:${club.contactPhone}`}
                        className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>총무 전화 문의 ({club.contactPhone}) 📞</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setJoiningClub(club)}
                        className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition"
                      >
                        <span>상세 정보 보기 ❯</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            };

            return (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-emerald-500/50 shadow-md space-y-4 animate-fadeIn">
                {/* 상단 헤더 & 클럽 무료 등록 버튼 */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-3 gap-2 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl">
                      👥
                    </div>
                    <div>
                      <h3 className="text-base font-black text-stone-900 flex items-center gap-1.5 flex-wrap">
                        <span>파크골프 클럽 & 동호회 (회원 모집 센터)</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                          총 {filteredClubs.length}개 클럽
                        </span>
                      </h3>
                      <p className="text-[11px] text-stone-600 font-semibold">
                        총무님은 우리 클럽 무료 등록 & 회원 모집, 동호인은 가입 신청서 접수!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="header-club-register-btn"
                      onClick={() => setShowClubRegisterModal(true)}
                      className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>클럽 무료 등록</span>
                    </button>
                  </div>
                </div>

                {/* 지명/클럽명 검색창 & 단원 모집중만 보기 토글 (지명 칩 완전 제거) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      id="club-region-search-input"
                      value={clubSearchQuery}
                      onChange={(e) => setClubSearchQuery(e.target.value)}
                      placeholder="지명(시·군·구) 또는 클럽명을 검색하세요..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-8 py-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 shadow-2xs transition"
                    />
                    <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {clubSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setClubSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 font-black text-xs cursor-pointer p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* 단원 모집중만 보기 토글 버튼 */}
                  <button
                    type="button"
                    id="club-recruiting-only-toggle-btn"
                    onClick={() => setOnlyRecruitingFilter((prev) => !prev)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95 border ${
                      onlyRecruitingFilter
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                    }`}
                  >
                    <span>🟢</span>
                    <span>단원 모집중만 보기</span>
                    {onlyRecruitingFilter && (
                      <span className="w-2 h-2 rounded-full bg-white ml-0.5"></span>
                    )}
                  </button>
                </div>

                {/* 클럽 목록 또는 0개 빈 상태 (Empty View) */}
                {filteredClubs.length === 0 ? (
                  <div className="border-2 border-dashed border-stone-300 bg-gradient-to-b from-stone-50 to-emerald-50/20 rounded-3xl p-6 sm:p-8 text-center space-y-4 my-2">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-3xl mx-auto shadow-sm">
                      👥
                    </div>

                    <div className="space-y-1.5 max-w-sm mx-auto">
                      <h4 className="font-black text-stone-900 text-base sm:text-lg">
                        {clubSearchQuery.trim()
                          ? `'${clubSearchQuery.trim()}' 검색 결과가 없습니다.`
                          : '아직 등록된 클럽이 없습니다.'}
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed font-medium">
                        {clubSearchQuery.trim()
                          ? '해당 지명이나 클럽명으로 등록된 클럽이 없습니다.\n우리 클럽을 1호로 등록하고 신규 회원을 모집해 보세요!'
                          : '우리 클럽을 1호로 등록하고 신규 회원을 모집해 보세요!'}
                      </p>
                    </div>

                    <div className="pt-1 max-w-sm mx-auto space-y-2">
                      <button
                        type="button"
                        id="empty-club-register-btn"
                        onClick={() => setShowClubRegisterModal(true)}
                        className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-2xl shadow-md border border-emerald-800 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                      >
                        <Plus className="w-4 h-4 text-emerald-200 shrink-0" />
                        <span>+ 우리 클럽 무료 등록하기</span>
                      </button>

                      {(clubSearchQuery || onlyRecruitingFilter) && (
                        <button
                          type="button"
                          onClick={() => {
                            setClubSearchQuery('');
                            setOnlyRecruitingFilter(false);
                          }}
                          className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer"
                        >
                          전체 클럽 보기 🌐
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    {/* 1. 신규 단원 모집 중인 클럽 섹션 */}
                    {recruitingClubs.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                              <span>🟢 신규 단원 모집 중인 클럽</span>
                              <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-black">
                                {recruitingClubs.length}곳
                              </span>
                            </h4>
                          </div>
                          <span className="text-[11px] text-emerald-700 font-bold hidden sm:inline">
                            즉시 가입 신청서 온라인 접수 가능 ✍️
                          </span>
                        </div>

                        <div className="space-y-3">
                          {recruitingClubs.map((club) => renderClubCard(club, true))}
                        </div>
                      </div>
                    )}

                    {/* 2. 일반 활동 & 정원 마감 클럽 섹션 (단원 모집중 필터가 꺼져 있을 때 표출) */}
                    {!onlyRecruitingFilter && closedOrGeneralClubs.length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-stone-400"></span>
                            <h4 className="text-sm font-black text-stone-800 flex items-center gap-1.5">
                              <span>👥 일반 활동 & 정원 마감 클럽</span>
                              <span className="bg-stone-200 text-stone-700 text-[11px] px-2 py-0.5 rounded-full font-black">
                                {closedOrGeneralClubs.length}곳
                              </span>
                            </h4>
                          </div>
                          <span className="text-[11px] text-stone-500 font-medium hidden sm:inline">
                            정기 라운드 진행 중 (총무 유선 문의)
                          </span>
                        </div>

                        <div className="space-y-3">
                          {closedOrGeneralClubs.map((club) => renderClubCard(club, false))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 하단 고정 클럽 등록 유치 배너 */}
                <div className="pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowClubRegisterModal(true)}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-800 hover:from-emerald-700 hover:to-teal-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md flex items-center justify-between gap-2 cursor-pointer transition active:scale-98 border border-emerald-500/30"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">👥</span>
                      <div className="text-left">
                        <span className="block font-black leading-tight">
                          클럽 총무님! 우리 클럽 무료 등록하고 신규 동호인 모집하기 ▶
                        </span>
                        <span className="text-[10px] text-emerald-200 font-medium">
                          전국 파크골프 동호인 대상 상시 노출 및 가입 신청서 온라인 즉시 접수
                        </span>
                      </div>
                    </div>
                    <span className="text-xs bg-amber-400 text-stone-950 px-3 py-1.5 rounded-xl font-black shrink-0 shadow-xs">
                      100% 무료
                    </span>
                  </button>
                </div>
              </div>
            );
          })()}
{/* PANEL 2A: 골프 레슨 코치 검색하기 (완전 분리: 코치 전용) */}
          {/* ========================================================================= */}
          {activeServiceTab === 'RANGE_LESSON' && (
            <div className="space-y-3 animate-fadeIn">
              {/* 레슨 & 코치 vs 연습장 서브 토글 (코치 우선 정책) */}
              <div className="flex items-center gap-2 p-1 bg-stone-100 rounded-2xl border border-stone-200 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setRangeLessonSubTab('COACH')}
                  className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    rangeLessonSubTab === 'COACH'
                      ? 'bg-emerald-700 text-white shadow'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  <span>👨‍🏫</span>
                  <span>{isJapanese ? 'レッスン・コーチ' : '레슨 & 코치'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRangeLessonSubTab('RANGE')}
                  className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    rangeLessonSubTab === 'RANGE'
                      ? 'bg-emerald-700 text-white shadow'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  <span>⛳</span>
                  <span>{isJapanese ? '屋内外練習場' : '실내·실외 연습장'}</span>
                </button>
              </div>

              {rangeLessonSubTab === 'COACH' && (
            <div className="bg-white rounded-3xl p-4 border-2 border-emerald-500/50 shadow-md space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">
                    👨‍🏫
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-900">
                      인근 골프 레슨 코치 찾기
                    </h3>
                    <p className="text-[11px] text-stone-600 font-semibold">
                      개인 레슨 · 그룹·아카데미 · 필드 라운드 레슨 코치
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {filteredCoaches.length}명 안내
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCoachModal(true)}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>레슨 코치 등록</span>
                  </button>
                </div>
              </div>

              {/* Coach Filter Tabs (시니어 눈높이에 맞춘 간결한 4대 필터) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                {[
                  { id: 'ALL', label: '전체' },
                  { id: '개인 레슨', label: '개인 레슨' },
                  { id: '그룹·아카데미', label: '그룹·아카데미' },
                  { id: '필드 라운드 레슨', label: '필드 라운드 레슨' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCoachTypeFilter(tab.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition cursor-pointer ${
                      coachTypeFilter === tab.id
                        ? 'bg-emerald-700 text-white font-black shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Coach Cards List OR Empty State */}
              {filteredCoaches.length === 0 ? (
                <div className="text-center py-8 px-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <span className="text-3xl block">👨‍🏫</span>
                  <div className="space-y-1">
                    <h4 className="font-black text-stone-900 text-sm">
                      {isJapanese ? '登録されたレッスンコーチがいません。1号として登録してみましょう！' : '등록된 레슨 코치가 없습니다. 1호로 등록해 보세요!'}
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {isJapanese ? '活動中のレッスンコーチを直接登録して会員を募集してみましょう。' : '활동 중이신 레슨 코치님을 직접 등록하고 회원을 모집해 보세요.'}
                    </p>
                  </div>
                  <div className="pt-2 max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={() => setShowCoachModal(true)}
                      className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isJapanese ? '+ レッスンコーチを登録する' : '+ 레슨 코치 등록하기'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  {filteredCoaches.map((coach) => (
                    <div
                      key={coach.id}
                      className="p-3.5 rounded-2xl bg-stone-50 hover:bg-emerald-50/40 border border-stone-200 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-sm text-stone-900">
                              {coach.name}
                            </span>
                            {(coach.types && coach.types.length > 0
                              ? coach.types
                              : coach.type
                              ? coach.type.split(',').map((s) => s.trim())
                              : []
                            ).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-600 text-white"
                              >
                                {t.includes('1:1') || t.includes('개인')
                                  ? '개인 레슨'
                                  : t.includes('아카데미') || t.includes('그룹')
                                  ? '그룹·아카데미'
                                  : t.includes('라운딩') || t.includes('라운드') || t.includes('필드')
                                  ? '필드 라운드 레슨'
                                  : t}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-stone-600 font-semibold mt-0.5 flex items-center gap-1 flex-wrap">
                            <MapPin className="w-3 h-3 text-emerald-800 shrink-0" />
                            {(coach.regions && coach.regions.length > 0
                              ? coach.regions
                              : [coach.region]
                            ).map((r, idx, arr) => (
                              <span key={r} className="inline-flex items-center">
                                <span className="text-stone-800 font-bold">{r}</span>
                                {idx < arr.length - 1 && (
                                  <span className="text-stone-300 mx-1">·</span>
                                )}
                              </span>
                            ))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-stone-200 shrink-0">
                            {coach.priceText}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoach(coach.id, coach.name)}
                            className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {coach.feature && (
                        <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 text-xs">
                          <div className="font-bold text-stone-800 flex items-start gap-1.5">
                            <span className="text-emerald-800 font-black shrink-0">
                              프로필:
                            </span>
                            <span className="leading-relaxed whitespace-pre-line text-stone-700">{coach.feature}</span>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="pt-0.5">
                        <a
                          href={`tel:${coach.phone}`}
                          className="w-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1 shadow-2xs transition active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{isJapanese ? `電話相談 (${coach.phone})` : `전화 상담 (${coach.phone})`}</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PANEL 2B: 실내 / 스크린 골프 연습장 검색하기 (완전 분리: 연습장 전용) */}
          {/* ========================================================================= */}
          {rangeLessonSubTab === 'RANGE' && (
            <div className="bg-white rounded-3xl p-4 border-2 border-emerald-500/50 shadow-md space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">
                    ⛳
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-900">
                      인근 실내 / 스크린 연습장 찾기
                    </h3>
                    <p className="text-[11px] text-stone-600 font-semibold">
                      실내 스크린 골프 · 타석 연습장 · 센서 구질 분석
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {filteredRanges.length}곳 안내
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRangeModal(true)}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>연습장 등록</span>
                  </button>
                </div>
              </div>



              {/* Range Filter Tabs */}
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'ALL', label: '⛳ 전체 연습장' },
                  { id: '실내 스크린', label: '🖥️ 실내 스크린' },
                  { id: '타석 연습장', label: '🎯 타석 연습장' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRangeTypeFilter(tab.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition cursor-pointer ${
                      rangeTypeFilter === tab.id
                        ? 'bg-emerald-700 text-white font-black shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Range Cards List OR Empty State */}
              {filteredRanges.length === 0 ? (
                <div className="text-center py-8 px-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <span className="text-3xl block">⛳</span>
                  <div className="space-y-1">
                    <h4 className="font-black text-stone-900 text-sm">
                      {isJapanese ? '登録された練習場がありません。1号として登録してみましょう！' : '등록된 실내·외 연습장이 없습니다. 1호로 등록해 보세요!'}
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {isJapanese ? 'よく行く屋内・屋外練習場を直接登録してみましょう。' : '자주 가시는 실내·실외 연습장을 직접 1호로 등록해 보세요.'}
                    </p>
                  </div>
                  <div className="pt-2 max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={() => setShowRangeModal(true)}
                      className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isJapanese ? '+ 練習場を登録する' : '+ 연습장 등록하기'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  {filteredRanges.map((range) => (
                    <div
                      key={range.id}
                      className="p-3.5 rounded-2xl bg-stone-50 hover:bg-emerald-50/40 border border-stone-200 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-sm text-stone-900">
                              {range.name}
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-700 text-white">
                              {range.type || '실내 스크린'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 font-semibold mt-0.5 flex items-center gap-1 flex-wrap">
                            <MapPin className="w-3 h-3 text-emerald-800 shrink-0" />
                            {(range.regions && range.regions.length > 0
                              ? range.regions
                              : [range.region]
                            ).map((r, idx, arr) => (
                              <span key={r} className="inline-flex items-center">
                                <span className="text-stone-800 font-bold">{r}</span>
                                {idx < arr.length - 1 && (
                                  <span className="text-stone-300 mx-1">·</span>
                                )}
                              </span>
                            ))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-stone-200 shrink-0">
                            {range.priceText}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteRange(range.id, range.name)}
                            className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {range.feature && (
                        <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 text-xs">
                          <div className="font-bold text-stone-800 flex items-start gap-1.5">
                            <span className="text-emerald-800 font-black shrink-0">
                              시설안내:
                            </span>
                            <span className="leading-relaxed whitespace-pre-line text-stone-700">{range.feature}</span>
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="pt-0.5">
                        <a
                          href={`tel:${range.phone}`}
                          className="w-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1 shadow-2xs transition active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{isJapanese ? `電話問合せ (${range.phone})` : `전화 문의 (${range.phone})`}</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PANEL 3: 주변 골프 매장 검색하기 (활성화 영역) */}
          {/* ========================================================================= */}
          {activeServiceTab === 'SHOP' && (
            <div className="bg-white rounded-3xl p-4 border-2 border-emerald-500/50 shadow-md space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-lg">
                    🛍️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-900">
                      인근 파크골프 전문 매장 & 피팅샵
                    </h3>
                    <p className="text-[11px] text-stone-600 font-semibold">
                      정품 클럽 · 파우치/가방 · 볼 · 모자 · 즉시 그립 교체
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {filteredShops.length}곳 안내
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowShopModal(true)}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>매장 등록</span>
                  </button>
                </div>
              </div>



              {/* Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
                {[
                  { id: 'ALL', label: '전체 보기' },
                  { id: '파크골프 전문 매장', label: '파크골프 전문점' },
                  { id: '클럽/피팅/그립 교체', label: '클럽 피팅·그립 교체' },
                  { id: '용품/의류/모자', label: '용품·의류·모자' },
                  { id: '중고/위탁 판매', label: '중고·위탁 판매' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setShopTypeFilter(tab.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                      shopTypeFilter === tab.id
                        ? 'bg-emerald-700 text-white font-black'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Shop Cards List OR Empty State */}
              {filteredShops.length === 0 ? (
                <div className="text-center py-7 px-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <span className="text-3xl block">🛍️</span>
                  <div className="space-y-1">
                    <h4 className="font-black text-stone-900 text-sm">
                      {isJapanese ? '登録されたゴルフショップがありません。1号として登録してみましょう！' : '등록된 골프 매장이 없습니다. 1호로 등록해 보세요!'}
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {isJapanese ? 'よく行くパークゴルフ用品店・工房を直接1号として登録してみましょう。' : '자주 가시는 파크골프 용품점·피팅샵을 직접 1호로 등록해 보세요.'}
                    </p>
                  </div>
                  <div className="pt-2 max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={() => setShowShopModal(true)}
                      className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isJapanese ? '+ ゴルフショップを登録する' : '+ 골프 매장 직접 등록하기'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  {filteredShops.map((shop) => (
                    <div
                      key={shop.id}
                      className="p-3.5 rounded-2xl bg-stone-50 hover:bg-emerald-50/40 border border-stone-200 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-sm text-stone-900">
                              {shop.name}
                            </span>
                            <span className="text-[10px] font-black bg-emerald-700 text-white px-1.5 py-0.5 rounded">
                              {shop.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 font-semibold mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-800 shrink-0" />
                            <span>{shop.region}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteShop(shop.id, shop.name)}
                          className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-stone-200/80 space-y-1 text-xs text-stone-700">
                        <div className="flex items-start gap-1">
                          <span className="text-emerald-700 font-bold shrink-0">취급:</span>
                          <span>{shop.products}</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-emerald-700 font-bold shrink-0">브랜드:</span>
                          <span>{shop.brands}</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <span className="text-emerald-700 font-bold shrink-0">특징:</span>
                          <span>{shop.feature}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-0.5">
                        <a
                          href={`tel:${shop.phone}`}
                          className="w-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1 shadow-2xs transition active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{isJapanese ? `電話問合せ (${shop.phone})` : `전화 문의 (${shop.phone})`}</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PANEL 4: 중고 매매 교환 (활성화 영역) */}
          {/* ========================================================================= */}
          {activeServiceTab === 'MARKET' && (
            <div className="bg-white rounded-3xl p-4 border-2 border-emerald-500/50 shadow-md space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-lg">
                    🤝
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-900">
                      {isJapanese ? 'パークゴルフ無料直取引フリマ' : '파크골프 무료 직거래 장터'}
                    </h3>
                    <p className="text-[11px] text-stone-600 font-semibold">
                      {isJapanese ? '手数料0円！個人愛好者・店舗どなたでも自由に出品＆直取引' : '수수료 0원! 개인 골퍼 및 일반 상점 누구나 자유로운 무료 등록 & 직거래'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMarketModal(true)}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isJapanese ? '無料出品' : '무료 매물 등록'}</span>
                </button>
              </div>

              {/* Legal Disclaimer & Caution Banner (대표님 지침: 직거래 안전 주의 및 사기 피해 예방 수칙) */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 text-xs text-amber-950 space-y-2 shadow-xs">
                <div className="font-black flex items-center justify-between text-amber-900 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span>⚠️</span>
                    <span>{isJapanese ? '[必読] 安全な直接取引および詐欺防止ルール' : '[필독] 안전 직거래 및 사기 피해 예방 수칙'}</span>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    {isJapanese ? '100%現地直接取引推奨' : '100% 현장 대면 직거래 권장'}
                  </span>
                </div>
                <div className="text-[11px] leading-relaxed text-stone-700 space-y-1 font-medium">
                  <p className="flex items-start gap-1">
                    <span className="text-amber-600 font-bold shrink-0">①</span>
                    <span>
                      <strong>{isJapanese ? 'PARKY APPは純粋な無料情報仲介プラットフォーム' : '파키 앱(PARKY APP)은 순수 무료 정보 중개 플랫폼'}</strong>
                      {isJapanese ? 'であり、取引当事者ではなく一切の取引事故に対する法的責任を負いません。' : '으로, 거래 당사자가 아니며 일체의 거래 사고에 대해 법적 책임을 지지 않습니다.'}
                    </span>
                  </p>
                  <p className="flex items-start gap-1">
                    <span className="text-rose-600 font-bold shrink-0">②</span>
                    <span className="text-rose-900 font-bold bg-rose-100/80 px-1 rounded">
                      {isJapanese ? '宅配取引や事前振込は詐欺リスクが非常に高いため絶対にお避けください！' : '택배 거래나 선입금은 사기 위험이 매우 높으니 절대 피하세요!'}
                    </span>
                  </p>
                  <p className="flex items-start gap-1">
                    <span className="text-emerald-700 font-bold shrink-0">③</span>
                    <span>
                      <strong>{isJapanese ? '必ずパークゴルフ場やクラブハウス等の対面現場で品物の状態を直接確認してから' : '반드시 파크골프장 필드나 클럽하우스 등 대면 현장에서 물품 상태를 직접 꼼꼼히 확인한 후'}</strong>
                      {isJapanese ? ' 代金をお支払いください。' : ' 대금을 지급하시기 바랍니다.'}
                    </span>
                  </p>
                  <p className="flex items-start gap-1">
                    <span className="text-blue-700 font-bold shrink-0">④</span>
                    <span>
                      {isJapanese ? '個人愛好者だけでなく ' : '개인 동호인뿐만 아니라 '}
                      <strong>{isJapanese ? '一般ゴルフショップ・用品店様もどなたでも無料で出品' : '일반 골프숍/용품점 사장님도 누구나 무료로 매물을 등록'}</strong>
                      {isJapanese ? 'してPRできます。' : '하여 홍보하실 수 있습니다.'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
                {[
                  { id: 'ALL', label: isJapanese ? 'すべての出品' : '전체 매물' },
                  { id: '클럽(채)', label: isJapanese ? 'クラブ' : '파크골프채(클럽)' },
                  { id: '파우치/가방', label: isJapanese ? 'ポーチ・バッグ' : '파우치·가방' },
                  { id: '볼/공', label: isJapanese ? 'ボールセット' : '볼·공 세트' },
                  { id: '기타용품', label: isJapanese ? 'その他用品' : '기타 용품' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMarketCategory(tab.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                      marketCategory === tab.id
                        ? 'bg-emerald-700 text-white font-black'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Market Items List OR Empty State */}
              {filteredMarketItems.length === 0 ? (
                <div className="text-center py-7 px-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <span className="text-3xl block">🤝</span>
                  <div className="space-y-1">
                    <h4 className="font-black text-stone-900 text-sm">
                      {isJapanese ? '登録された出品がありません' : '등록된 무료 매물이 없습니다'}
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {isJapanese
                        ? '使わないクラブやポーチ、用品、または店舗商品を会員に無料で出品してみましょう！'
                        : '쓰지 않는 파크골프채나 파우치, 용품, 또는 매장 상품을 회원들에게 첫 매물로 무료 등록해 보세요!'}
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowMarketModal(true)}
                      className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isJapanese ? '最初の出品を無料登録する' : '첫 매물 무료 등록하기'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  {filteredMarketItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-stone-50 hover:bg-emerald-50/40 border border-stone-200 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded">
                              {item.category}
                            </span>
                            <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                              {item.condition}
                            </span>
                            <span className="font-black text-sm text-stone-900">
                              {item.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 font-semibold mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-800 shrink-0" />
                            <span>{item.location}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right shrink-0">
                            <span className="text-base font-black text-emerald-800 block">
                              {item.price.toLocaleString()}원
                            </span>
                            <span className="text-[10px] font-bold text-stone-500">
                              {item.status}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteMarketItem(item.id, item.title)}
                            className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-stone-700 bg-white p-2 rounded-xl border border-stone-200/80 leading-relaxed font-medium">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-stone-600 px-1 font-semibold">
                        <span>
                          판매자: <strong className="text-stone-900">{item.sellerName}</strong> 님
                        </span>
                        <span>등록일: {item.createdAt}</span>
                      </div>

                      {/* Contact Button */}
                      <button
                        type="button"
                        onClick={() => setContactModalItem(item)}
                        className="w-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.98] cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>판매자 연락처 보기 / 구매 문의</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PANEL 8: 구장 탐방후기 (5점 별점 + 사진 + 한줄평 간이 폼 무료 커뮤니티) */}
          {/* ========================================================================= */}
          {activeServiceTab === 'REVIEW' && (() => {
            const filteredReviews = CourseReviewStorage.getReviewsForCourse(reviewCourseFilter);
            return (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-emerald-500/50 shadow-md space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center text-xl">
                      ⭐
                    </div>
                    <div>
                      <h3 className="text-base font-black text-stone-900">
                        생생 구장 탐방후기 & 별점
                      </h3>
                      <p className="text-[11px] text-stone-600 font-semibold">
                        실제 방문 골퍼들의 잔디 상태 및 솔직 한줄평 (무료 커뮤니티)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(true)}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-3 py-2 rounded-xl flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>후기 쓰기</span>
                  </button>
                </div>

                {/* 구장 필터 드롭다운 */}
                <div className="flex items-center justify-between gap-2 text-xs bg-stone-50 p-2.5 rounded-2xl border border-stone-200">
                  <span className="font-bold text-stone-600 shrink-0">구장별 모아보기:</span>
                  <select
                    value={reviewCourseFilter}
                    onChange={(e) => setReviewCourseFilter(e.target.value)}
                    className="bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs font-black text-stone-800 outline-none focus:border-emerald-600"
                  >
                    <option value="ALL">전체 구장 후기 ({courseReviews.length})</option>
                    {courses.slice(0, 30).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 후기 목록 피드 */}
                <div className="space-y-3">
                  {filteredReviews.length === 0 ? (
                    <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-2">
                      <span className="text-3xl block">⭐</span>
                      <p className="text-xs font-bold text-stone-700">등록된 구장 탐방후기가 없습니다.</p>
                      <p className="text-[11px] text-stone-500">첫 번째 생생 후기를 작성해 보세요!</p>
                      <button
                        type="button"
                        onClick={() => setShowReviewModal(true)}
                        className="bg-emerald-700 text-white font-black text-xs px-3 py-2 rounded-xl"
                      >
                        + 첫 탐방후기 작성하기
                      </button>
                    </div>
                  ) : (
                    filteredReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="border border-stone-200 bg-stone-50/60 rounded-2xl p-3.5 space-y-2 hover:border-emerald-400 transition"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-emerald-100 text-emerald-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                              ⛳ {rev.courseName}
                            </span>
                            <div className="flex items-center text-amber-400 text-xs">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                          </div>
                          <span className="text-[10px] text-stone-500 font-medium">{rev.createdAt}</span>
                        </div>

                        {rev.imageUrl && (
                          <img
                            src={rev.imageUrl}
                            alt="현장 사진"
                            className="w-full h-36 object-cover rounded-xl border border-stone-200"
                          />
                        )}

                        <p className="text-xs text-stone-800 font-bold leading-relaxed bg-white p-2.5 rounded-xl border border-stone-200/80">
                          &quot;{rev.comment}&quot;
                        </p>

                        <div className="text-[11px] text-stone-500 font-semibold px-1 text-right">
                          작성자: <strong className="text-stone-800">{rev.authorName}</strong> 님
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })()}
            </div>

            {/* 대표님 지침: 맛집 탭일 경우 최하단 항상 고정 [ ✍️ 나의 단골 식당 추천하기 ] 바 (어떤 기종이든 스크롤 없이 1초 노출) */}
            {activeServiceTab === 'RESTAURANT' && (
              <div className="p-3 bg-gradient-to-r from-amber-500/15 via-amber-400/25 to-amber-500/15 border-t-2 border-amber-300 shrink-0">
                <button
                  type="button"
                  id="btn-fixed-restaurant-submit"
                  onClick={() => setShowRestaurantSubmitModal(true)}
                  className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-sm sm:text-base py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-98 transition cursor-pointer border border-amber-400"
                >
                  <span className="text-xl">✍️</span>
                  <span>{isJapanese ? '行きつけのお店を推薦する' : '나의 단골 식당 추천하기'}</span>
                  <span className="bg-stone-950 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
                    {isJapanese ? '簡単登録' : '1초 자동 등록'}
                  </span>
                </button>
              </div>
            )}

            {/* 팝업 하단 고정 닫기 바 */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-stone-500 font-semibold">
                {isJapanese ? '閉じると前のコース検索画面に戻ります。' : '닫으시면 이전 전국 구장 검색 화면으로 바로 복귀합니다.'}
              </span>
              <button
                type="button"
                onClick={() => setActiveServiceTab(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-black text-xs rounded-xl cursor-pointer transition active:scale-95 flex items-center gap-1 shadow-xs"
              >
                <span>{isJapanese ? '✕ 閉じる' : '✕ 창 닫기'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Secondhand Market Registration Modal */}
      {/* ========================================================================= */}
      {showMarketModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤝</span>
                <h3 className="text-base font-black text-stone-900">
                  {isJapanese ? '無料出品を登録する' : '내 무료 매물 등록하기'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMarketModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMarketItem} className="space-y-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  품목 구분 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newMarketCategory}
                  onChange={(e) =>
                    setNewMarketCategory(e.target.value as ParkGolfMarketItem['category'])
                  }
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                >
                  <option value="클럽(채)">파크골프채 (클럽)</option>
                  <option value="파우치/가방">파우치 / 가방</option>
                  <option value="볼/공">볼 / 공 세트</option>
                  <option value="기타용품">기타 용품 (마커, 장갑 등)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  매물 제목 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newMarketTitle}
                  onChange={(e) => setNewMarketTitle(e.target.value)}
                  placeholder="예: 혼마 4스타 파크골프채 팝니다"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    판매 희망가 (원) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newMarketPrice}
                    onChange={(e) => setNewMarketPrice(Number(e.target.value))}
                    placeholder="예: 350000"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    제품 상태
                  </label>
                  <select
                    value={newMarketCondition}
                    onChange={(e) =>
                      setNewMarketCondition(e.target.value as ParkGolfMarketItem['condition'])
                    }
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                  >
                    <option value="미개봉 신품">미개봉 신품</option>
                    <option value="특A급">특A급 (상태 최상)</option>
                    <option value="A급">A급 (생활기스 약간)</option>
                    <option value="생활기스 있음">생활기스 있음</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  거래 희망 장소/지역
                </label>
                <input
                  type="text"
                  value={newMarketLocation}
                  onChange={(e) => setNewMarketLocation(e.target.value)}
                  placeholder="예: 경북 구미 동락구장 직거래 또는 택배"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    판매자 닉네임 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMarketSeller}
                    onChange={(e) => setNewMarketSeller(e.target.value)}
                    placeholder="예: 구미골퍼"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    연락처 전화번호
                  </label>
                  <input
                    type="text"
                    value={newMarketPhone}
                    onChange={(e) => setNewMarketPhone(e.target.value)}
                    placeholder="예: 010-1234-5678"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  상세 설명
                </label>
                <textarea
                  rows={3}
                  value={newMarketDesc}
                  onChange={(e) => setNewMarketDesc(e.target.value)}
                  placeholder="구입 시기, 사용 빈도, 구성품 등 상세 내용을 적어주세요."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-black py-3 rounded-xl text-sm shadow cursor-pointer transition active:scale-95"
                >
                  매물 등록 완료 🤝
                </button>
                <button
                  type="button"
                  onClick={() => setShowMarketModal(false)}
                  className="px-4 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Seller Contact Modal */}
      {/* ========================================================================= */}
      {contactModalItem && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">📞</span>
                <h3 className="text-base font-black text-stone-900">
                  판매자 연락처 안내
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setContactModalItem(null)}
                className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-2">
              <div className="font-black text-sm text-stone-900">
                {contactModalItem.title}
              </div>
              <div className="text-emerald-800 font-black text-base">
                {contactModalItem.price.toLocaleString()}원
              </div>
              <div className="text-xs text-stone-600 border-t border-stone-200 pt-2 space-y-1">
                <div>판매자: <strong>{contactModalItem.sellerName}</strong> 님</div>
                <div>거래 장소: <strong>{contactModalItem.location}</strong></div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center space-y-1">
              <div className="text-xs text-stone-600 font-bold">판매자 안심 연락처</div>
              <div className="text-lg font-black text-emerald-950 tracking-wider">
                {contactModalItem.sellerPhone}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={`tel:${contactModalItem.sellerPhone}`}
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black py-3 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
              >
                <Phone className="w-4 h-4" />
                <span>전화 걸기</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(contactModalItem.sellerPhone);
                  alert('전화번호가 클립보드에 복사되었습니다.');
                }}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                전화번호 복사하기
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* MODAL: [식당 찾기] 음식 분류 선택 팝업 (일식, 중식, 양식, 한식 등) */}
      {/* ========================================================================= */}
      {showFindRestaurantModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 animate-scaleUp max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔍</span>
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    식당 찾기 (음식 분류 선택)
                  </h3>
                  <p className="text-[11px] text-stone-500 font-semibold">
                    분류를 선택하시면 등록된 식당으로 바로 이동합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFindRestaurantModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
              {RESTAURANT_CATEGORIES.map((cat) => {
                const count =
                  cat.id === 'ALL'
                    ? restaurants.length
                    : restaurants.filter((r) => r.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setRestaurantCategory(cat.id);
                      setShowFindRestaurantModal(false);
                    }}
                    className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2.5 transition cursor-pointer active:scale-[0.98] ${
                      restaurantCategory === cat.id
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-xs'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{cat.icon}</span>
                      <div className="min-w-0">
                        <div className="font-black text-xs text-stone-900">
                          {cat.label}
                        </div>
                        <div className="text-[10px] text-stone-500 font-medium truncate">
                          {cat.desc}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {count > 0 ? (
                        <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                          {count}곳 등록
                        </span>
                      ) : (
                        <span className="bg-stone-200 text-stone-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          등록 식당 없음
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-stone-100 shrink-0 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRestaurantCategory('ALL');
                  setShowFindRestaurantModal(false);
                }}
                className="flex-1 bg-stone-900 hover:bg-stone-800 text-white font-black py-2.5 rounded-xl text-xs cursor-pointer shadow-xs transition"
              >
                전체 식당 보기 ({restaurants.length}곳)
              </button>
              <button
                type="button"
                onClick={() => setShowFindRestaurantModal(false)}
                className="px-4 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* MODAL 1: 등록 선택 팝업 (버튼 2개: 레슨 코치 등록 vs 연습장 등록) */}
      {/* ========================================================================= */}
      {showRegisterChoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div>
                <h3 className="text-base font-black text-stone-900">
                  등록 유형을 선택해 주세요
                </h3>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  등록하시려는 항목의 버튼을 눌러주세요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterChoiceModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-black text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 pt-1">
              {/* Button 1: 골프 레슨 코치 등록 */}
              <button
                type="button"
                onClick={() => {
                  setShowRegisterChoiceModal(false);
                  setShowCoachModal(true);
                }}
                className="w-full p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/60 hover:bg-emerald-100/70 text-left transition active:scale-98 cursor-pointer shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">👨‍🏫</span>
                  <div>
                    <h4 className="text-sm font-black text-emerald-950">
                      골프 레슨 코치 등록하기
                    </h4>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">
                      1:1 개인레슨 · 아카데미 · 필드 동반 코치 프로필 등록
                    </p>
                  </div>
                </div>
                <span className="text-emerald-700 font-black text-lg">❯</span>
              </button>

              {/* Button 2: 스크린 골프 연습장 등록 */}
              <button
                type="button"
                onClick={() => {
                  setShowRegisterChoiceModal(false);
                  setShowRangeModal(true);
                }}
                className="w-full p-4 rounded-2xl border-2 border-teal-600 bg-teal-50/60 hover:bg-teal-100/70 text-left transition active:scale-98 cursor-pointer shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⛳</span>
                  <div>
                    <h4 className="text-sm font-black text-teal-950">
                      스크린 골프 연습장 등록하기
                    </h4>
                    <p className="text-xs text-teal-800 font-medium mt-0.5">
                      실내 스크린 골프장 · 타석 시설 및 이용 요금 등록
                    </p>
                  </div>
                </div>
                <span className="text-teal-700 font-black text-lg">❯</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: 골프 레슨 코치 전용 등록 모달 (연습장 관련 내용 0% 완전 배제) */}
      {/* ========================================================================= */}
      {showCoachModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">👨‍🏫</span>
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    골프 레슨 코치 등록하기
                  </h3>
                  <p className="text-[11px] text-stone-500 font-semibold">
                    1:1 맞춤 레슨 · 아카데미 · 라운딩 코칭 등록
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCoachModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCoach} className="space-y-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  코치 성함 (프로명) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCoachName}
                  onChange={(e) => setNewCoachName(e.target.value)}
                  placeholder="예: 이동훈 수석프로 (또는 김프로)"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              {/* Coach Categories */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black text-stone-800">
                    지도 / 레슨 분야 <span className="text-emerald-700 font-bold text-[11px]">(중복 선택 가능)</span>
                  </label>
                  <span className="text-[11px] text-stone-600">
                    선택: <strong className="text-emerald-700 font-black">{newCoachTypes.length}개</strong>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: '개인 레슨', label: '👨‍🏫 개인 레슨' },
                    { id: '그룹·아카데미', label: '🏌️ 그룹·아카데미' },
                    { id: '필드 라운드 레슨', label: '🚩 필드 라운드' },
                  ].map((cat) => {
                    const isChecked = newCoachTypes.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCoachType(cat.id)}
                        className={`py-2 px-1 rounded-xl border text-[11px] font-bold flex items-center justify-between transition cursor-pointer active:scale-95 ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-600 shadow-xs'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <span className="truncate">{cat.label}</span>
                        <span
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-black shrink-0 ml-0.5 ${
                            isChecked
                              ? 'bg-emerald-700 text-white'
                              : 'border border-stone-300 bg-white text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  💡 개인 레슨, 그룹·아카데미, 필드 라운드 동반 코치 등 지도하시는 분야를 모두 선택해 주세요.
                </p>
              </div>

              {/* Location Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-stone-800">
                    활동 지역 <span className="text-emerald-700 font-bold text-[11px]">(시·군 검색 후 다수 체크)</span>
                  </label>
                  <span className="text-[11px] text-stone-600">
                    선택: <strong className="text-emerald-700 font-black">{newCoachRegions.length}곳</strong>
                  </span>
                </div>

                {/* Selected Region Chips */}
                {newCoachRegions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2 p-1.5 bg-stone-50 rounded-xl border border-stone-200 max-h-20 overflow-y-auto">
                    {newCoachRegions.map((reg) => (
                      <span
                        key={reg}
                        className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold px-2 py-0.5 rounded-lg shadow-2xs"
                      >
                        <span>📍 {reg}</span>
                        <button
                          type="button"
                          onClick={() => removeCoachRegion(reg)}
                          className="hover:text-rose-600 font-black ml-0.5 cursor-pointer"
                          title="삭제"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* City Search Bar inside modal */}
                <div className="relative mb-1.5">
                  <input
                    type="text"
                    value={coachRegionSearchQuery}
                    onChange={(e) => setCoachRegionSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (coachRegionSearchQuery.trim()) {
                          addCustomCoachRegion(coachRegionSearchQuery.trim());
                        }
                      }
                    }}
                    placeholder="활동 시·군 검색 (예: 구미, 김천, 대구, 창원...)"
                    className="w-full bg-white border border-emerald-500 rounded-xl pl-8 pr-16 py-2 text-xs font-bold text-stone-900 outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                  />
                  <Search className="w-3.5 h-3.5 text-emerald-700 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  {coachRegionSearchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => addCustomCoachRegion(coachRegionSearchQuery.trim())}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-black px-2 py-1 rounded-lg cursor-pointer active:scale-95"
                    >
                      + 추가
                    </button>
                  )}
                </div>

                {/* Region Checkbox Grid */}
                <div className="border border-stone-200 rounded-xl p-1.5 bg-stone-50 max-h-36 overflow-y-auto space-y-1">
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    {searchedCoachRegions.length > 0 ? (
                      searchedCoachRegions.map((reg) => {
                        const isChecked = newCoachRegions.includes(reg);
                        return (
                          <button
                            key={reg}
                            type="button"
                            onClick={() => toggleCoachRegion(reg)}
                            className={`py-1 px-2 rounded-lg border text-left flex items-center justify-between transition cursor-pointer active:scale-95 ${
                              isChecked
                                ? 'bg-emerald-700 text-white border-emerald-800 font-black shadow-2xs'
                                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100 font-semibold'
                            }`}
                          >
                            <span className="truncate">{reg}</span>
                            <span
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-black shrink-0 ml-1 ${
                                isChecked
                                  ? 'bg-white text-emerald-800'
                                  : 'border border-stone-300 bg-stone-50 text-transparent'
                              }`}
                            >
                              ✓
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-center py-2 text-stone-500 text-[11px]">
                        '{coachRegionSearchQuery}' 검색 결과가 없습니다.{' '}
                        <button
                          type="button"
                          onClick={() => addCustomCoachRegion(coachRegionSearchQuery.trim())}
                          className="text-emerald-700 font-black underline ml-1 cursor-pointer"
                        >
                          '{coachRegionSearchQuery}' 직접 등록
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Coach Profile with quick addition chips */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-stone-800">
                    코치 프로필 (소개글)
                  </label>
                  <span className="text-[10px] text-stone-500 font-bold">
                    아래 항목을 터치하여 바로 추가하세요
                  </span>
                </div>

                {/* Profile / Lesson Fee template chips */}
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {[
                    { label: '+ 자격증', text: '자격: 대한파크골프협회 1급 지도자 / ' },
                    { label: '+ 경력', text: '경력: 구력 8년 및 전국대회 입상 다수 / ' },
                    { label: '+ 레슨비(1회)', text: '레슨비: 1회 30,000원 (원포인트 50,000원) / ' },
                    { label: '+ 레슨비(월)', text: '레슨비: 월 150,000원 (주 2회 레슨) / ' },
                    { label: '+ 지도특징', text: '특징: 슬라이스 교정 & 비거리 20m 증가 집중 지도 / ' },
                    { label: '+ 상담환영', text: '문의: 초보자 입문 환영 및 레슨비 협의 가능 / ' },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setNewCoachProfile((prev) => (prev ? `${prev}\n${chip.text}` : chip.text));
                      }}
                      className="text-[10px] bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 px-2 py-0.5 rounded-lg cursor-pointer transition font-bold active:scale-95 shadow-2xs"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={newCoachProfile}
                  onChange={(e) => setNewCoachProfile(e.target.value)}
                  placeholder={'코치님의 자격증, 경력, 지도 스타일, 레슨비 등 본인 소개를 자유롭게 적어주세요.\n(위 항목 버튼을 누르면 문구가 간편하게 추가됩니다)'}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 resize-none leading-relaxed"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-black text-stone-800 mb-1">
                  전화번호 (상담 연락처)
                </label>
                <input
                  type="text"
                  value={newCoachPhone}
                  onChange={(e) => setNewCoachPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-black py-3 rounded-xl text-sm shadow cursor-pointer transition active:scale-95"
                >
                  골프 레슨 코치 등록 완료 🏌️
                </button>
                <button
                  type="button"
                  onClick={() => setShowCoachModal(false)}
                  className="px-4 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: 스크린 골프 연습장 전용 등록 모달 (레슨 코치 관련 내용 0% 완전 배제) */}
      {/* ========================================================================= */}
      {showRangeModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">⛳</span>
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    스크린 골프 연습장 등록하기
                  </h3>
                  <p className="text-[11px] text-stone-500 font-semibold">
                    실내 스크린 골프장 · 타석 연습장 시설 안내 등록
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRangeModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPracticeRange} className="space-y-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  연습장 상호명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRangeName}
                  onChange={(e) => setNewRangeName(e.target.value)}
                  placeholder="예: 구미 파크골프 스크린 연습장"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              {/* Range Type Selection */}
              <div>
                <label className="block text-xs font-black text-stone-800 mb-1">
                  연습장 구분
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['실내 스크린', '타석 연습장'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewRangeType(t)}
                      className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-95 ${
                        newRangeType === t
                          ? 'bg-emerald-700 text-white border-emerald-800 font-black shadow-xs'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location (Address) Selector with Google Search */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-stone-800">
                    연습장 위치 (주소) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const q = newRangeName.trim()
                        ? `${newRangeName.trim()} 주소`
                        : '파크골프 스크린 연습장 주소';
                      window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
                      setTimeout(() => {
                        const searched = prompt('구글에서 검색된 연습장의 세부 주소를 복사하여 붙여넣으세요:', newRangeAddress);
                        if (searched && searched.trim()) {
                          setNewRangeAddress(searched.trim());
                        }
                      }, 500);
                    }}
                    className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-2xs"
                  >
                    <span>🔍 구글 주소 검색하기</span>
                    <ExternalLink className="w-3 h-3 text-emerald-700" />
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newRangeAddress}
                    onChange={(e) => setNewRangeAddress(e.target.value)}
                    placeholder="구글 검색 결과 주소를 입력하세요 (예: 경북 구미시 야은로 297)"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 shadow-2xs"
                  />
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Facility info with quick addition chips */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-stone-800">
                    연습장 시설 및 장비 안내
                  </label>
                  <span className="text-[10px] text-stone-500 font-bold">
                    아래 항목을 터치하여 바로 추가하세요
                  </span>
                </div>

                {/* Facility template chips (타석수, 스크린장비, 주차, 요금 등) */}
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {[
                    { label: '+ 타석 수', text: '타석수: 8타석 완비 / ' },
                    { label: '+ 스크린 센서', text: '장비: 최신 초고속 카메라 센서 구질 분석 / ' },
                    { label: '+ 주차 완비', text: '주차: 전용 무료 주차 30대 완비 / ' },
                    { label: '+ 이용 요금', text: '이용요금: 1시간 10,000원 (월 회원 10만원) / ' },
                    { label: '+ 좌타 구비', text: '시설: 좌타석 완비 및 락커룸 제공 / ' },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setNewRangeFeature((prev) => (prev ? `${prev}\n${chip.text}` : chip.text));
                      }}
                      className="text-[10px] bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 px-2 py-0.5 rounded-lg cursor-pointer transition font-bold active:scale-95 shadow-2xs"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={newRangeFeature}
                  onChange={(e) => setNewRangeFeature(e.target.value)}
                  placeholder={'타석 수, 센서 장비, 주차, 이용 요금 등 안내사항을 자유롭게 적어주세요.\n(위 항목 버튼을 누르면 문구가 간편하게 추가됩니다)'}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 resize-none leading-relaxed"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-black text-stone-800 mb-1">
                  전화번호 (문의 연락처)
                </label>
                <input
                  type="text"
                  value={newRangePhone}
                  onChange={(e) => setNewRangePhone(e.target.value)}
                  placeholder="예: 054-123-4567 또는 010-1234-5678"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-black py-3 rounded-xl text-sm shadow cursor-pointer transition active:scale-95"
                >
                  스크린 연습장 등록 완료 ⛳
                </button>
                <button
                  type="button"
                  onClick={() => setShowRangeModal(false)}
                  className="px-4 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Golf Shop Registration Modal */}
      {/* ========================================================================= */}
      {showShopModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛍️</span>
                <h3 className="text-base font-black text-stone-900">
                  골프 매장 / 피팅샵 등록하기
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShopModal(false)}
                className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddShop} className="space-y-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  매장 이름 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder="예: 구미 파크골프 전문 피팅샵"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    매장 업종 구분
                  </label>
                  <select
                    value={newShopType}
                    onChange={(e) =>
                      setNewShopType(e.target.value as ParkGolfShop['type'])
                    }
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                  >
                    <option value="파크골프 전문 매장">파크골프 전문점</option>
                    <option value="클럽/피팅/그립 교체">클럽 피팅·그립 교체</option>
                    <option value="용품/의류/모자">용품·의류·모자</option>
                    <option value="중고/위탁 판매">중고·위탁 판매</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    지역 (위치)
                  </label>
                  <input
                    type="text"
                    value={newShopRegion}
                    onChange={(e) => setNewShopRegion(e.target.value)}
                    placeholder="예: 경북 구미시"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  주요 취급 품목
                </label>
                <input
                  type="text"
                  value={newShopProducts}
                  onChange={(e) => setNewShopProducts(e.target.value)}
                  placeholder="예: 클럽, 가방, 볼, 모자, 장갑 완비"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  취급 브랜드
                </label>
                <input
                  type="text"
                  value={newShopBrands}
                  onChange={(e) => setNewShopBrands(e.target.value)}
                  placeholder="예: 혼마, 피닉스, 볼빅, 미즈노 정품 취급"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  특장점 / 전문 서비스
                </label>
                <input
                  type="text"
                  value={newShopFeature}
                  onChange={(e) => setNewShopFeature(e.target.value)}
                  placeholder="예: 5분 즉시 그립 교체, 초보자 맞춤 클럽 추천"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  전화번호
                </label>
                <input
                  type="text"
                  value={newShopPhone}
                  onChange={(e) => setNewShopPhone(e.target.value)}
                  placeholder="예: 054-471-5588"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-black py-3 rounded-xl text-sm shadow cursor-pointer transition active:scale-95"
                >
                  매장 등록 완료 🛍️
                </button>
                <button
                  type="button"
                  onClick={() => setShowShopModal(false)}
                  className="px-4 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: 상권 대상 구장 검색 및 선택 팝업 (메인 구장 검색 UI 규격 통일) */}
      {/* ========================================================================= */}
      {showCourseSelectModal && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-emerald-600 overflow-hidden my-4 max-h-[90vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
                  ⛳
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {isJapanese ? 'パークゴルフ場 検索＆選択' : '파크골프장 검색 & 상권 선택'}
                  </h3>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    {isJapanese
                      ? 'コース名または地域を検索して選択してください。'
                      : '찾으시는 구장명을 검색하여 선택하시면 해당 구장 상권으로 즉시 전환됩니다.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCourseSelectModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title={isJapanese ? '閉じる' : '닫기'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 본문 */}
            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              {/* 🔍 메인 구장 검색창과 100% 동일한 검색창 규격 */}
              <div className="relative flex items-center bg-white border-2 border-emerald-600 rounded-2xl shadow-md overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/30 w-full">
                <input
                  type="text"
                  value={courseSelectSearchTerm}
                  onChange={(e) => setCourseSelectSearchTerm(e.target.value)}
                  placeholder={
                    isJapanese
                      ? '都市名またはコース名で検索 (例: 幕別、札幌)'
                      : '도시명 또는 구장명 검색 (예: 동락, 밀양, 지산, 대구)'
                  }
                  className="min-w-0 flex-1 pl-3.5 pr-2 py-3 text-sm font-bold text-stone-900 outline-none placeholder:text-stone-400 bg-transparent"
                  autoFocus
                />
                {courseSelectSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setCourseSelectSearchTerm('')}
                    className="p-2 text-stone-400 hover:text-stone-700 cursor-pointer shrink-0"
                    title="지우기"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                )}
                <div className="px-4 py-3 bg-emerald-700 text-white flex items-center justify-center gap-1 font-black shrink-0 select-none">
                  <Search className="w-4 h-4" />
                  <span className="text-xs">{isJapanese ? '検索' : '검색'}</span>
                </div>
              </div>

              {/* 지역 원터치 빠른 필터 바 */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {[
                  { id: 'ALL', label: '전체' },
                  { id: '경북', label: '경북' },
                  { id: '대구', label: '대구' },
                  { id: '경남', label: '경남' },
                  { id: '서울', label: '서울' },
                  { id: '경기', label: '경기' },
                  { id: '부산', label: '부산' },
                  { id: '울산', label: '울산' },
                  { id: '강원', label: '강원' },
                  { id: '충청', label: '충청' },
                  { id: '전라', label: '전라' },
                  { id: '제주', label: '제주' },
                ].map((reg) => (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => setCourseSelectRegionFilter(reg.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-xs transition cursor-pointer select-none ${
                      courseSelectRegionFilter === reg.id
                        ? 'bg-emerald-700 text-white font-black shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {reg.label}
                  </button>
                ))}
              </div>

              {/* 검색 상태에 따른 본문 표출 */}
              {!isCourseSelectActive ? (
                /* 검색 전 초기 대기 상태: 임의 구장 나열 금지 & 검색 가이드 및 인기 구장 칩 */
                <div className="py-8 px-4 text-center space-y-4 bg-stone-50/70 border border-stone-200/80 rounded-3xl my-2">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-xs border border-emerald-200">
                    ⛳
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-sm text-stone-900">
                      찾으시는 구장명 또는 지역을 검색해 보세요
                    </h4>
                    <p className="text-xs text-stone-500 font-medium">
                      상단 검색창에 구장명을 입력하거나 아래 추천 검색어를 터치하세요.
                    </p>
                  </div>

                  {/* 인기·추천 구장 빠른 선택 태그 */}
                  <div className="pt-2">
                    <div className="text-[11px] font-black text-stone-600 mb-2 flex items-center justify-center gap-1">
                      <span>💡</span>
                      <span>인기 구장 빠른 검색:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center max-w-sm mx-auto">
                      {['동락', '지산', '밀양', '수성', '강변', '삼락', '양평', '춘천', '화천', '낙동강'].map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => setCourseSelectSearchTerm(kw)}
                          className="text-xs bg-white border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500 text-emerald-950 font-bold px-3 py-1.5 rounded-xl shadow-2xs transition cursor-pointer active:scale-95"
                        >
                          #{kw}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* 검색 실행 후: 실시간 검색 결과 리스트 */
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1 text-[11px] text-stone-500 font-bold border-b border-stone-100 pb-1">
                    <span>
                      검색 결과 ({modalFilteredCourses.length}개 구장)
                    </span>
                    <span>원하시는 구장을 선택하세요</span>
                  </div>

                  <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                    {modalFilteredCourses.length === 0 ? (
                      <div className="text-center py-10 text-stone-500 space-y-1.5 bg-stone-50 rounded-2xl p-4">
                        <span className="text-3xl block">🔍</span>
                        <p className="text-xs font-bold text-stone-800">
                          {courseSelectSearchTerm
                            ? `'${courseSelectSearchTerm}' 구장 검색 결과가 없습니다.`
                            : '선택하신 지역에 등록된 구장이 없습니다.'}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          다른 검색어나 지역을 선택해 보세요.
                        </p>
                      </div>
                    ) : (
                      modalFilteredCourses.map((c) => {
                        const isSelected = selectedStoreCourseId === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedStoreCourseId(c.id);
                              setShowCourseSelectModal(false);
                            }}
                            className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-emerald-50 border-2 border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                                : 'bg-white hover:bg-emerald-50/50 hover:border-emerald-400 border-stone-200 shadow-2xs'
                            }`}
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-sm text-stone-900">
                                  {c.name}
                                </span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded">
                                  {c.region || '전국'}
                                </span>
                                {c.totalHoles && (
                                  <span className="text-[10px] bg-stone-100 text-stone-700 font-bold px-1.5 py-0.5 rounded">
                                    {c.totalHoles}홀
                                  </span>
                                )}
                              </div>
                              {c.address && (
                                <p className="text-[11px] text-stone-500 truncate font-medium flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                                  <span>{c.address}</span>
                                </p>
                              )}
                            </div>

                            <div className="shrink-0">
                              {isSelected ? (
                                <span className="text-xs bg-emerald-700 text-white font-black px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>선택됨</span>
                                </span>
                              ) : (
                                <span className="text-xs bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-500 text-emerald-800 font-black px-3 py-1.5 rounded-xl transition flex items-center gap-0.5">
                                  <span>선택</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 모달 하단 닫기 바 */}
            <div className="p-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-stone-500 font-medium">
                구장을 선택하면 해당 구장 상권으로 즉시 전환됩니다.
              </span>
              <button
                type="button"
                onClick={() => setShowCourseSelectModal(false)}
                className="bg-stone-800 hover:bg-stone-900 text-white font-black text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                ✕ 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Store Register Modal (Owner Self-Auction & Free Registration) */}
      <StoreRegisterModal
        isOpen={showStoreRegisterModal}
        onClose={() => setShowStoreRegisterModal(false)}
        courses={courses}
        initialCourseId={selectedStoreCourseId}
        onSuccess={(newStore) => {
          setAffiliatedStores(AuctionStorage.getAllStores());
        }}
        isJapanese={isJapanese}
      />

      {/* Restaurant Recommendation UGC Submit Modal */}
      <RestaurantSubmitModal
        isOpen={showRestaurantSubmitModal}
        onClose={() => setShowRestaurantSubmitModal(false)}
        defaultCourseName={courses.find((c) => c.id === selectedStoreCourseId)?.name || '구미 동락 파크골프장'}
        defaultCourseId={selectedStoreCourseId}
        onSuccess={() => {
          setUserRecommendedStores(RestaurantStorage.getAllRestaurants());
        }}
      />

      {/* Restaurant Detail Modal (Kakao Map Split-View & Reviews) */}
      <RestaurantDetailModal
        isOpen={Boolean(selectedDetailRestaurant)}
        onClose={() => setSelectedDetailRestaurant(null)}
        restaurant={selectedDetailRestaurant}
        onReviewAdded={(updated) => {
          setUserRecommendedStores(RestaurantStorage.getAllRestaurants());
          setSelectedDetailRestaurant(updated);
        }}
      />

      {/* Tour Register Modal (Free Tour Registration & Auction) */}
      <TourRegisterModal
        isOpen={showTourRegisterModal}
        onClose={() => setShowTourRegisterModal(false)}
        onSuccess={(newTour) => {
          setTours(TourStorage.getAllTours());
        }}
        isJapanese={isJapanese}
      />

      {/* Club Register Modal (Free Club Registration & Member Recruitment) */}
      <ClubRegisterModal
        isOpen={showClubRegisterModal}
        onClose={() => setShowClubRegisterModal(false)}
        courses={courses}
        initialCourseId={selectedStoreCourseId}
        onSuccess={(newClub) => {
          setClubs(ClubStorage.getAllClubs());
        }}
        isJapanese={isJapanese}
      />

      {/* Club Join Application Modal */}
      <ClubJoinModal
        isOpen={!!joiningClub}
        onClose={() => setJoiningClub(null)}
        club={joiningClub}
        onSuccess={(updatedClub) => {
          setClubs(ClubStorage.getAllClubs());
        }}
        isJapanese={isJapanese}
      />

      {/* [옥션 업그레이드 모달] 무료 입점 후 언제든 필요 시 상단 옥션 참여/변경 */}
      {showAuctionUpgradeModal && auctionTargetStore && (
        <div className="fixed inset-0 z-[65] bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-amber-400 flex flex-col max-h-[90vh]">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👑</span>
                <div>
                  <h3 className="font-black text-base leading-tight">
                    &apos;{auctionTargetStore.name}&apos; 상단 옥션 신청
                  </h3>
                  <p className="text-[11px] font-bold text-amber-950/80">
                    최상단 &apos;파키 추천 매장&apos; 우선 노출 (고액순 선점)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAuctionUpgradeModal(false);
                  setAuctionTargetStore(null);
                }}
                className="p-1 rounded-full bg-stone-950/10 hover:bg-stone-950/20 text-stone-950 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 본문 */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs font-bold text-stone-800">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-amber-950">현재 등록 상태:</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    auctionTargetStore.bidAmount > 0
                      ? 'bg-amber-400 text-stone-950'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {auctionTargetStore.bidAmount > 0
                      ? `👑 상단 옥션 중 (월 ${auctionTargetStore.bidAmount.toLocaleString()}${isJapanese ? '円' : '원'})`
                      : '🍽️ 일반 무료 등록 매장'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
                  초기 무료 입점으로 시작한 후, 필요하실 때 언제든지 상단 옥션에 참여하여 구장 최상단에 고정 노출시킬 수 있습니다.
                </p>
              </div>

              {/* 입찰가 설정 */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-stone-900">
                    구장당 월 입찰 희망가 (최저 {isJapanese ? '300円' : '3,000원'}부터)
                  </span>
                  <span className="text-[10px] text-stone-500 font-bold">
                    호가단위: +{isJapanese ? '100円' : '1,000원'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const minBid = isJapanese ? AUCTION_RULES.JPY.MIN_BID : AUCTION_RULES.KRW.MIN_BID;
                      const step = isJapanese ? AUCTION_RULES.JPY.BID_STEP : AUCTION_RULES.KRW.BID_STEP;
                      setAuctionBidAmount((prev) => Math.max(minBid, prev - step));
                    }}
                    className="w-10 h-10 rounded-xl bg-white border border-stone-300 text-stone-950 font-black text-base flex items-center justify-center hover:bg-stone-100 cursor-pointer shadow-2xs"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-1 bg-white border-2 border-amber-400 rounded-xl py-2 px-3 text-center">
                    <span className="text-base font-black text-amber-950">
                      월 {auctionBidAmount.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-amber-900 ml-1">
                      {isJapanese ? '円' : '원'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const step = isJapanese ? AUCTION_RULES.JPY.BID_STEP : AUCTION_RULES.KRW.BID_STEP;
                      setAuctionBidAmount((prev) => prev + step);
                    }}
                    className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 font-black text-base flex items-center justify-center hover:bg-amber-400 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-1.5 justify-center">
                  {[3000, 5000, 10000, 20000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAuctionBidAmount(isJapanese ? Math.round(preset / 10) : preset)}
                      className="text-[10px] bg-white border border-amber-300 px-2 py-1 rounded-lg font-black text-amber-950 hover:bg-amber-200 transition cursor-pointer"
                    >
                      월 {(isJapanese ? Math.round(preset / 10) : preset).toLocaleString()}{isJapanese ? '円' : '원'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 합산 계산 */}
              <div className="bg-stone-900 text-white p-3.5 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-xs text-stone-300 font-medium">
                  <span>선택된 노출 구장:</span>
                  <span>{auctionTargetStore.targetCourseIds?.length || 1}개 구장</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-stone-700">
                  <span className="text-xs font-black text-amber-400">최종 월 옥션 예상액:</span>
                  <span className="text-base font-black text-amber-400">
                    월 {((auctionTargetStore.targetCourseIds?.length || 1) * auctionBidAmount).toLocaleString()}{isJapanese ? '円' : '원'}
                  </span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleConfirmAuctionUpgrade(auctionBidAmount)}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-sm rounded-2xl shadow-lg border border-amber-500 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition"
                >
                  <span>👑</span>
                  <span>
                    월 {((auctionTargetStore.targetCourseIds?.length || 1) * auctionBidAmount).toLocaleString()}{isJapanese ? '円' : '원'} 상단 옥션 적용하기
                  </span>
                </button>

                {auctionTargetStore.bidAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => handleConfirmAuctionUpgrade(0)}
                    className="w-full py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition"
                  >
                    <span>🍽️</span>
                    <span>일반 무료 등록 매장으로 전환 (0원)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Review Form Modal (5-Star + Photo + 1-Line Review) */}
      <CourseReviewFormModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        courses={courses}
        initialCourseId={selectedStoreCourseId}
        onSuccess={(newRev) => {
          setCourseReviews(CourseReviewStorage.getAllReviews());
        }}
      />

      {/* Course Detail Modal (Specs, Holes, Photos, Hall of Fame) */}
      {detailCourse && (
        <CourseDetailModal
          course={detailCourse}
          onClose={() => setDetailCourse(null)}
          onSaved={(updated) => {
            setDetailCourse(updated);
            refreshCourses();
          }}
        />
      )}

      {/* Contribute Modal */}
      {editingCourse && (
        <ContributeModal
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onSaved={() => {
            refreshCourses();
          }}
        />
      )}
    </div>
  );
}
