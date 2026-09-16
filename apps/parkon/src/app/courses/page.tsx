'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Plus,
  Star,
  Search,
  X,
  Award,
  Sparkles,
  Edit3,
  ChevronRight,
  Trash2,
  Phone,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { Course, formatCourseHolesText } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';
import { DEFAULT_COURSES, generateStandardHoles } from '@/lib/defaultCourses';
import { ContributeModal } from '@/components/ContributeModal';
import { CourseDetailModal } from '@/components/CourseDetailModal';

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
  const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [homeCourseId, setHomeCourseId] = useState<string>('');
  const [favoriteHomeCourseIds, setFavoriteHomeCourseIds] = useState<string[]>([]);
  
  // Search input and applied search term
  const [inputQuery, setInputQuery] = useState<string>('');
  const [appliedQuery, setAppliedQuery] = useState<string>('');

  // 5 Service Mode State: RESTAURANT | COACH | RANGE | SHOP | MARKET (null by default so nothing is opened until clicked)
  const [activeServiceTab, setActiveServiceTab] = useState<'RESTAURANT' | 'COACH' | 'RANGE' | 'SHOP' | 'MARKET' | null>(null);

  const handleToggleServiceTab = (tab: 'RESTAURANT' | 'COACH' | 'RANGE' | 'SHOP' | 'MARKET') => {
    setActiveServiceTab((prev) => (prev === tab ? null : tab));
  };

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
    '1:1 레슨 / 코치',
    '아카데미 / 레슨',
    '라운딩 레슨 / 코치',
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
      const savedRest = localStorage.getItem('parkon_user_restaurants_v1');
      if (savedRest) setRestaurants(JSON.parse(savedRest));
      const savedPrac = localStorage.getItem('parkon_user_practice_ranges_v1');
      if (savedPrac) setPracticeRanges(JSON.parse(savedPrac));
      const savedShops = localStorage.getItem('parkon_user_shops_v1');
      if (savedShops) setShops(JSON.parse(savedShops));
      const savedMkt = localStorage.getItem('parkon_market_items_v1');
      if (savedMkt) setMarketItems(JSON.parse(savedMkt));
    } catch (err) {
      console.error(err);
    }
    refreshCourses();
    window.addEventListener('parkon_favorite_courses_updated', refreshCourses);
    return () => {
      window.removeEventListener('parkon_favorite_courses_updated', refreshCourses);
    };
  }, []);

  const refreshCourses = () => {
    setCourses(ParkOnStorage.getAllCourses());
    setHomeCourseId(ParkOnStorage.getHomeCourseId());
    setFavoriteHomeCourseIds(ParkOnStorage.getFavoriteHomeCourseIds());
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
      contributorName: newContributor.trim() || '파크온 골퍼',
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
      localStorage.setItem('parkon_market_items_v1', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    // Reset Form
    setNewMarketTitle('');
    setNewMarketSpecs('');
    setNewMarketDesc('');
    setShowMarketModal(false);
    alert('중고 매물이 성공적으로 등록되었습니다!');
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
      localStorage.setItem('parkon_user_restaurants_v1', JSON.stringify(updated));
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
      localStorage.setItem('parkon_user_restaurants_v1', JSON.stringify(updated));
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
      localStorage.setItem('parkon_user_practice_ranges_v1', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setNewCoachName('');
    setNewCoachPhone('');
    setNewCoachProfile('');
    setNewCoachPrice('1회 30,000원~');
    setNewCoachTypes(['1:1 레슨 / 코치', '아카데미 / 레슨', '라운딩 레슨 / 코치']);
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
      localStorage.setItem('parkon_user_practice_ranges_v1', JSON.stringify(updated));
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
      localStorage.setItem('parkon_user_practice_ranges_v1', JSON.stringify(updated));
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
      localStorage.setItem('parkon_user_practice_ranges_v1', JSON.stringify(updated));
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
      localStorage.setItem('parkon_user_shops_v1', JSON.stringify(updated));
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
      localStorage.setItem('parkon_user_shops_v1', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMarketItem = (id: string, title: string) => {
    if (!confirm(`'${title}' 매물을 삭제하시겠습니까?`)) return;
    const updated = marketItems.filter((m) => m.id !== id);
    setMarketItems(updated);
    try {
      localStorage.setItem('parkon_market_items_v1', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Courses based on search query (ONLY when query is executed!)
  const activeSearchTerm = appliedQuery.trim().toLowerCase();
  const isSearchActive = activeSearchTerm.length > 0;

  const filteredCourses = isSearchActive
    ? courses.filter((c) => {
        if (activeSearchTerm === '전체' || activeSearchTerm === '전국') return true;
        const matchName = c.name.toLowerCase().includes(activeSearchTerm);
        const matchRegion = c.region.toLowerCase().includes(activeSearchTerm);
        const matchAddress = c.address?.toLowerCase().includes(activeSearchTerm) || false;
        const matchDesc = c.description?.toLowerCase().includes(activeSearchTerm) || false;

        // Space-tolerant matching: e.g. "경북청송" matches "경북 청송", "구미양호" matches "구미 양호"
        const noSpaceQuery = activeSearchTerm.replace(/\s+/g, '');
        const noSpaceName = c.name.toLowerCase().replace(/\s+/g, '');
        const noSpaceRegion = c.region.toLowerCase().replace(/\s+/g, '');
        const matchNoSpace = noSpaceName.includes(noSpaceQuery) || noSpaceRegion.includes(noSpaceQuery);

        return matchName || matchRegion || matchAddress || matchDesc || matchNoSpace;
      })
    : [];

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
      if (!pTypes.includes(coachTypeFilter)) return false;
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
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="p-2 -ml-2 text-stone-700 hover:text-stone-950">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h2 className="text-xl font-black text-stone-900 leading-tight">
              전국 파크골프장 검색
            </h2>
            <p className="text-xs text-stone-700 font-semibold">
              전국 시·군 공인 구장 검색 및 등록
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-3 py-2 rounded-xl flex items-center gap-1 shadow active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>신규 등록</span>
        </button>
      </div>

      {/* 🔍 SEARCH BAR (도시명 / 구장명 직접 검색 & 돋보기 클릭 시에만 나열) */}
      <div className="space-y-2">
        <div className="relative flex items-center bg-white border-2 border-emerald-600 rounded-2xl shadow-md overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/30">
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
            placeholder="도시명 또는 구장명 검색 (예: 밀양, 청송, 지산)"
            className="flex-1 pl-4 pr-2 py-3.5 text-base font-bold text-stone-900 outline-none placeholder:text-stone-400"
          />

          {/* Clear Button */}
          {inputQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="p-2 text-stone-400 hover:text-stone-700 cursor-pointer"
              title="검색어 지우기"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* 돋보기 검색 실행 버튼 */}
          <button
            type="button"
            onClick={() => handleExecuteSearch()}
            className="h-full px-5 py-3.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white flex items-center justify-center transition shrink-0 cursor-pointer gap-1 font-black"
            title="검색하기"
          >
            <Search className="w-5 h-5" />
            <span className="text-xs">검색</span>
          </button>
        </div>

        {/* ⛳ 전국 17개 시·도 원터치 빠른 탐색 바 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => {
              setInputQuery('전체');
              setAppliedQuery('전체');
            }}
            className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition cursor-pointer ${
              appliedQuery === '전체'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            전국 전체 ({courses.length})
          </button>
          {[
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
          ].map((reg) => (
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
      {/* MODE A: GOLF COURSE SEARCH RESULTS (돋보기/검색 실행 시에만 표시) */}
      {/* ========================================================================= */}
      {isSearchActive ? (
        <div className="space-y-3 animate-fadeIn">
          {/* Search Result Status & Close Button */}
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-950 font-black">
              <Search className="w-4 h-4 text-emerald-700" />
              <span>
                &apos;{appliedQuery}&apos; 검색 결과: <strong className="text-emerald-800 text-sm">{filteredCourses.length}</strong>개 구장
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearSearch}
              className="bg-white hover:bg-stone-100 text-stone-700 font-extrabold px-3 py-1.5 rounded-xl border border-stone-300 text-[11px] shadow-2xs transition active:scale-95 cursor-pointer"
            >
              ✕ 검색 닫기 (주변 식당·연습장·중고)
            </button>
          </div>

          {/* Courses List */}
          <div className="space-y-3">
            {filteredCourses.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 space-y-3 shadow-xs">
                <div className="text-4xl">⛳</div>
                <h3 className="text-base font-black text-stone-800">
                  &quot;{appliedQuery}&quot; 관련 구장을 찾지 못했습니다.
                </h3>
                <p className="text-xs text-stone-700 leading-relaxed max-w-xs mx-auto">
                  아직 등록되지 않은 구장이라면 [신규 등록] 버튼을 눌러 3초 만에 표준 코스로 즉시 생성할 수 있습니다.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNewName(appliedQuery);
                    setShowAddForm(true);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow cursor-pointer"
                >
                  + &quot;{appliedQuery}&quot; 구장 3초 자동 생성하기
                </button>
              </div>
            ) : (
              filteredCourses.map((c) => {
                const isHome = homeCourseId === c.id;
                const isFavorite = favoriteHomeCourseIds.includes(c.id);

                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-3xl border-2 transition shadow-sm space-y-3 ${
                      isHome
                        ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                        : isFavorite
                        ? 'bg-amber-50/50 border-amber-400/80 ring-2 ring-amber-400/20'
                        : 'bg-white border-stone-200 hover:border-emerald-300'
                    }`}
                  >
                    {/* Top: Name & Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleSelectCourseAndGoHome(c.id)}
                            className="text-left font-black text-lg text-stone-900 leading-tight hover:text-emerald-700 transition active:scale-[0.98] cursor-pointer"
                            title="터치 시 이 구장을 선택하고 첫 화면으로 이동합니다"
                          >
                            {c.name}
                          </button>
                          {c.isVerified && (
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-black px-1.5 py-0.5 rounded">
                              공인 검증
                            </span>
                          )}
                          {isHome ? (
                            <span className="text-[10px] bg-emerald-700 text-white font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              ★ 현재 선택됨
                            </span>
                          ) : isFavorite ? (
                            <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              ★ 내 홈구장
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-stone-700 mt-1 font-semibold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                          <span>
                            {c.region} · {formatCourseHolesText(c)}
                          </span>
                        </p>
                      </div>

                      {/* Hole Badge */}
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black bg-stone-100 text-stone-800 px-2.5 py-1 rounded-xl border border-stone-200">
                          {formatCourseHolesText(c)}
                        </span>
                      </div>
                    </div>

                    {/* Description if any */}
                    {c.description && (
                      <p className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200 leading-snug break-keep font-medium">
                        {c.description}
                      </p>
                    )}

                    {/* Facility Details: Address, Phone, Fee, Hours, Parking */}
                    {(c.address || c.phone || c.openHours || c.fee || c.closedDay || c.parking) && (
                      <div className="text-xs space-y-1.5 bg-stone-50/90 p-3 rounded-2xl border border-stone-200">
                        {c.address && (
                          <div className="flex items-start gap-1.5 text-stone-800">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                            <span className="font-bold text-stone-900">{c.address}</span>
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
                          {c.fee && <span className="bg-white px-2 py-0.5 rounded-lg border border-stone-200">💰 {c.fee}</span>}
                          {c.openHours && <span className="bg-white px-2 py-0.5 rounded-lg border border-stone-200">⏰ {c.openHours}</span>}
                          {c.closedDay && <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded-lg border border-rose-200 font-bold">⛔ {c.closedDay}</span>}
                        </div>
                        {c.parking && (
                          <div className="text-[11px] text-stone-600 flex items-center gap-1 font-medium">
                            <span>🅿️ 주차:</span>
                            <span>{c.parking}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 👑 HONOR BADGE (명예 표시) */}
                    {c.contributorName ? (
                      <div className="bg-amber-50/80 border border-amber-300 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-amber-950 font-black">
                          <span className="text-sm">👑</span>
                          <span>
                            <span className="text-emerald-800 underline decoration-emerald-600">
                              {c.contributorName}
                            </span>{' '}
                            님이 등록·기여한 구장 정보
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDetailCourse(c)}
                          className="text-[11px] text-amber-900 hover:text-emerald-800 font-bold underline shrink-0 ml-2 cursor-pointer"
                        >
                          상세·보완
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs px-1 text-stone-700">
                        <span className="text-[11px]">로컬룰 및 최신 정보가 비어있나요?</span>
                        <button
                          type="button"
                          onClick={() => setDetailCourse(c)}
                          className="text-[11px] text-emerald-800 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>제원 확인·명예 등록</span>
                        </button>
                      </div>
                    )}

                    {/* 📋 홀별 제원표 & 명예의 전당 바로가기 버튼 */}
                    <button
                      type="button"
                      onClick={() => setDetailCourse(c)}
                      className="w-full bg-stone-100 hover:bg-stone-200 text-stone-900 font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-between border border-stone-300 shadow-sm transition active:scale-[0.99] cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm">📋</span>
                        <span>코스별 1~9홀 상세 제원표 · 타수/거리 실측 · 명예의 전당</span>
                      </span>
                      <span className="text-[11px] text-emerald-800 font-extrabold bg-white px-2 py-0.5 rounded border border-stone-200">
                        확인/정정 ❯
                      </span>
                    </button>

                    {/* Action Buttons: Select Course & Set as Home */}
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectCourseAndGoHome(c.id)}
                        className="flex-1 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-black text-sm py-3 px-3 rounded-xl shadow text-center transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <span>⛳ 이 구장 선택 (잔디 확인 & 0초 시작)</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleFavoriteHomeCourse(c.id)}
                        className={`px-3 py-3 rounded-xl border text-xs font-black flex items-center gap-1 transition cursor-pointer ${
                          isHome
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-400 ring-2 ring-emerald-500/20'
                            : isFavorite
                            ? 'bg-amber-100 text-amber-950 border-amber-400'
                            : 'bg-white text-stone-800 border-stone-300 hover:bg-stone-50'
                        }`}
                        title="내 지정 홈 구장으로 설정/해제"
                      >
                        <Star className={`w-3.5 h-3.5 ${isHome || isFavorite ? 'fill-current text-yellow-500' : ''}`} />
                        <span>{isHome ? '현재 선택됨' : isFavorite ? '내 구장' : '홈 지정'}</span>
                      </button>

                      {c.id.startsWith('custom-course-') && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`'${c.name}' 구장을 삭제하시겠습니까?`)) {
                              ParkOnStorage.deleteCustomCourse(c.id);
                              refreshCourses();
                            }
                          }}
                          className="p-2.5 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition border border-transparent hover:border-rose-200 cursor-pointer"
                          title="구장 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE B: 3 AUXILIARY SERVICE BUTTONS & ACTIVATED PANELS (기본 화면) */
        /* ========================================================================= */
        <div className="space-y-4 animate-fadeIn">
          {/* Guidance Banner */}
          <div className="bg-stone-100/90 border border-stone-300/80 rounded-2xl p-3 text-xs text-stone-700 flex items-start gap-2">
            <span className="text-base shrink-0">💡</span>
            <div className="leading-relaxed">
              <strong className="text-stone-900 font-bold">골프장 찾기 안내:</strong> 상단 검색창에{' '}
              <span className="text-emerald-800 font-extrabold">&apos;구미&apos;</span>,{' '}
              <span className="text-emerald-800 font-extrabold">&apos;밀양&apos;</span>,{' '}
              <span className="text-emerald-800 font-extrabold">&apos;청송&apos;</span> 등 도시명을 넣고{' '}
              <strong className="text-emerald-900 font-black">[검색]</strong>을 누르시면 해당 구장이 바로 나열됩니다.
            </div>
          </div>

          {/* 5 Main Action Buttons Grid (주변 맛집 / 레슨 코치 / 연습장 / 골프 매장 / 중고 매매 교환) */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2">
            {/* Button 1: 주변 맛집 */}
            <button
              type="button"
              onClick={() => handleToggleServiceTab('RESTAURANT')}
              className={`py-2 px-1 sm:p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 sm:gap-1.5 text-center transition cursor-pointer active:scale-95 shadow-xs ${
                activeServiceTab === 'RESTAURANT'
                  ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-500/40 shadow-md'
                  : 'bg-white text-stone-800 border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/50'
              }`}
            >
              <span className="text-xl sm:text-2xl">🍽️</span>
              <span className="text-[11px] sm:text-xs font-black whitespace-nowrap tracking-tight">
                주변 맛집
              </span>
              {activeServiceTab === 'RESTAURANT' && (
                <span className="text-[9px] sm:text-[10px] bg-amber-400 text-stone-950 px-1 sm:px-1.5 py-0.2 rounded font-extrabold whitespace-nowrap">
                  선택됨 ✓
                </span>
              )}
            </button>

            {/* Button 2: 레슨 코치 */}
            <button
              type="button"
              onClick={() => handleToggleServiceTab('COACH')}
              className={`py-2 px-1 sm:p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 sm:gap-1.5 text-center transition cursor-pointer active:scale-95 shadow-xs ${
                activeServiceTab === 'COACH'
                  ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-500/40 shadow-md'
                  : 'bg-white text-stone-800 border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/50'
              }`}
            >
              <span className="text-xl sm:text-2xl">👨‍🏫</span>
              <span className="text-[11px] sm:text-xs font-black whitespace-nowrap tracking-tight">
                레슨 코치
              </span>
              {activeServiceTab === 'COACH' && (
                <span className="text-[9px] sm:text-[10px] bg-amber-400 text-stone-950 px-1 sm:px-1.5 py-0.2 rounded font-extrabold whitespace-nowrap">
                  선택됨 ✓
                </span>
              )}
            </button>

            {/* Button 3: 연습장 */}
            <button
              type="button"
              onClick={() => handleToggleServiceTab('RANGE')}
              className={`py-2 px-1 sm:p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 sm:gap-1.5 text-center transition cursor-pointer active:scale-95 shadow-xs ${
                activeServiceTab === 'RANGE'
                  ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-500/40 shadow-md'
                  : 'bg-white text-stone-800 border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/50'
              }`}
            >
              <span className="text-xl sm:text-2xl">⛳</span>
              <span className="text-[11px] sm:text-xs font-black whitespace-nowrap tracking-tight">
                연습장
              </span>
              {activeServiceTab === 'RANGE' && (
                <span className="text-[9px] sm:text-[10px] bg-amber-400 text-stone-950 px-1 sm:px-1.5 py-0.2 rounded font-extrabold whitespace-nowrap">
                  선택됨 ✓
                </span>
              )}
            </button>

            {/* Button 4: 골프 매장 */}
            <button
              type="button"
              onClick={() => handleToggleServiceTab('SHOP')}
              className={`py-2 px-1 sm:p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 sm:gap-1.5 text-center transition cursor-pointer active:scale-95 shadow-xs ${
                activeServiceTab === 'SHOP'
                  ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-500/40 shadow-md'
                  : 'bg-white text-stone-800 border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/50'
              }`}
            >
              <span className="text-xl sm:text-2xl">🛍️</span>
              <span className="text-[11px] sm:text-xs font-black whitespace-nowrap tracking-tight">
                골프 매장
              </span>
              {activeServiceTab === 'SHOP' && (
                <span className="text-[9px] sm:text-[10px] bg-amber-400 text-stone-950 px-1 sm:px-1.5 py-0.2 rounded font-extrabold whitespace-nowrap">
                  선택됨 ✓
                </span>
              )}
            </button>

            {/* Button 5: 중고 매매 교환 */}
            <button
              type="button"
              onClick={() => handleToggleServiceTab('MARKET')}
              className={`py-2 px-1 sm:p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 sm:gap-1.5 text-center transition cursor-pointer active:scale-95 shadow-xs ${
                activeServiceTab === 'MARKET'
                  ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-500/40 shadow-md'
                  : 'bg-white text-stone-800 border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/50'
              }`}
            >
              <span className="text-xl sm:text-2xl">🤝</span>
              <span className="text-[9.5px] sm:text-xs font-black whitespace-nowrap tracking-tighter">
                중고 매매 교환
              </span>
              {activeServiceTab === 'MARKET' && (
                <span className="text-[9px] sm:text-[10px] bg-amber-400 text-stone-950 px-1 sm:px-1.5 py-0.2 rounded font-extrabold whitespace-nowrap">
                  선택됨 ✓
                </span>
              )}
            </button>
          </div>

          {/* ========================================================================= */}
          {/* PANEL 1: 주변 식당 검색하기 (활성화 영역) */}
          {/* ========================================================================= */}
          {activeServiceTab === 'RESTAURANT' && (
            <div className="bg-white rounded-3xl p-4 border-2 border-emerald-500/50 shadow-md space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-lg">
                    🍽️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-stone-900">
                      파크골프장 주변 맛집 & 식당
                    </h3>
                    <p className="text-[11px] text-stone-600 font-semibold">
                      라운드 전·후 동반자 조별 식사 및 단체 예약 명소
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {filteredRestaurants.length}곳 등록
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRestaurantModal(true)}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>식당 등록</span>
                  </button>
                </div>
              </div>

              {/* ========================================================= */}
              {/* 👑 유료 스폰서 배너 (식당명 또는 메뉴 검색 크기의 직사각형 배너) */}
              {/* ========================================================= */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-black text-amber-900 px-0.5">
                  <span className="flex items-center gap-1">
                    <span>👑</span>
                    <span>스폰서 추천 맛집 (유료 제휴 · 단체 예약 환영)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRestIsPaid(true);
                      setShowRestaurantModal(true);
                    }}
                    className="text-[10px] text-amber-700 hover:text-amber-950 font-black underline cursor-pointer"
                  >
                    + 스폰서 입찰 등록
                  </button>
                </div>

                {/* 배너 목록: 검색창 크기의 직사각형 배너 (클릭 시 상세 보기 팝업) */}
                <div className="space-y-1.5">
                  {allPaidRestaurants.map((sponsor) => (
                    <button
                      key={sponsor.id}
                      type="button"
                      onClick={() => setSelectedPaidRestaurant(sponsor)}
                      className="w-full text-left bg-linear-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-stone-950 p-2.5 rounded-2xl border border-amber-400/80 shadow-xs flex items-center justify-between gap-2 cursor-pointer transition active:scale-[0.99] group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="bg-stone-950 text-amber-300 font-black text-[10px] px-1.5 py-0.5 rounded shrink-0 shadow-xs">
                          스폰서
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-black truncate flex items-center gap-1.5">
                            <span className="text-stone-950">{sponsor.name}</span>
                            <span className="text-stone-800 font-bold text-[11px] truncate">· {sponsor.signatureMenu}</span>
                          </div>
                          <p className="text-[10px] text-amber-950 font-bold truncate">
                            {sponsor.bannerTitle || `${sponsor.groupSeating} · 단체 예약 환영 ↗`}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 bg-stone-950 text-amber-300 text-[10px] font-black px-2.5 py-1.5 rounded-xl group-hover:bg-stone-800 transition shadow-xs">
                        <span>자세히 보기</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ========================================================= */}
              {/* [식당 찾기] 버튼 & 일반 식당 검색 영역 */}
              {/* ========================================================= */}
              <div className="space-y-2 pt-1 border-t border-stone-200/80">
                <div className="flex items-center gap-2">
                  {/* [식당 찾기] 버튼 (일식, 중식, 양식 등 분류 팝업 오픈) */}
                  <button
                    type="button"
                    onClick={() => setShowFindRestaurantModal(true)}
                    className="shrink-0 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition"
                  >
                    <Search className="w-3.5 h-3.5 text-amber-400" />
                    <span>식당 찾기</span>
                    {restaurantCategory && (
                      <span className="bg-amber-400 text-stone-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                        선택중
                      </span>
                    )}
                  </button>

                  {/* 식당명 또는 메뉴 검색 인풋창 */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={restaurantSearchText}
                      onChange={(e) => setRestaurantSearchText(e.target.value)}
                      placeholder="식당명 또는 메뉴 검색 (예: 국밥, 백숙, 수육)"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600 placeholder:text-stone-400"
                    />
                    {restaurantSearchText && (
                      <button
                        type="button"
                        onClick={() => setRestaurantSearchText('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-black p-0.5 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* 현재 선택된 음식 분류 필터 뱃지 */}
                {restaurantCategory && (
                  <div className="flex items-center justify-between bg-stone-100 px-3 py-1.5 rounded-xl text-xs">
                    <span className="font-bold text-stone-700">
                      선택 분류: <span className="font-black text-emerald-800">[{restaurantCategory === 'ALL' ? '전체 식당' : restaurantCategory}]</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setRestaurantCategory('')}
                      className="text-[11px] text-stone-500 hover:text-rose-600 font-bold underline cursor-pointer"
                    >
                      분류 해제
                    </button>
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* 무료/일반 식당 결과 리스트 OR 안내 문구 */}
              {/* ========================================================= */}
              {!isRestaurantFilterActive ? (
                <div className="p-4 bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-center space-y-2">
                  <span className="text-2xl block">🔍</span>
                  <p className="text-xs font-bold text-stone-700">
                    인근 일반 식당을 찾으시려면 상단의 <span className="text-emerald-800 font-black">[식당 찾기]</span> 버튼을 누르시거나 식당명·메뉴를 검색해 주세요.
                  </p>
                  <p className="text-[11px] text-stone-500">
                    (상단 스폰서 배너를 터치하시면 단체 환영 제휴 식당의 상세 정보를 바로 확인하실 수 있습니다.)
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowFindRestaurantModal(true)}
                    className="inline-flex items-center gap-1.5 bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-stone-800 cursor-pointer shadow-xs transition"
                  >
                    <Search className="w-3.5 h-3.5 text-amber-400" />
                    <span>음식 분류별 식당 찾기 (일식·중식·양식·한식)</span>
                  </button>
                </div>
              ) : filteredRestaurants.length === 0 ? (
                <div className="text-center py-7 px-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <span className="text-3xl block">🍽️</span>
                  <div className="space-y-1">
                    <h4 className="font-black text-stone-900 text-sm">
                      {restaurantCategory && restaurantCategory !== 'ALL'
                        ? `선택하신 [${restaurantCategory}] 분류에 등록된 식당이 없습니다`
                        : '등록된 식당이 없습니다'}
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      대표님께서 직접 단골 식당을 첫 번째로 등록하시거나,<br />
                      네이버 지도에서 실시간으로 인근 맛집을 찾아보실 수 있습니다.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={() => {
                        if (restaurantCategory && restaurantCategory !== 'ALL') {
                          setNewRestCategory(restaurantCategory);
                        }
                        setShowRestaurantModal(true);
                      }}
                      className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{restaurantCategory && restaurantCategory !== 'ALL' ? `${restaurantCategory} ` : ''}식당 직접 등록하기</span>
                    </button>
                    <a
                      href={`https://map.naver.com/v5/search/${encodeURIComponent(restaurantCategory && restaurantCategory !== 'ALL' ? `파크골프장 인근 ${restaurantCategory}` : '파크골프장 주변 맛집')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-white hover:bg-stone-100 text-stone-800 font-extrabold text-xs py-2.5 px-3 rounded-xl border border-stone-300 flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                      <span>네이버 지도 실시간 검색 ↗</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  {filteredRestaurants.map((rest) => (
                    <div
                      key={rest.id}
                      className="p-3.5 rounded-2xl bg-stone-50 hover:bg-emerald-50/40 border border-stone-200 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-sm text-stone-900">
                              {rest.name}
                            </span>
                            <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                              {rest.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 font-semibold mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-800 shrink-0" />
                            <span>{rest.region} · {rest.distanceText}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-stone-200 shrink-0">
                            {rest.priceInfo}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteRestaurant(rest.id, rest.name)}
                            className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-stone-200/80 text-xs space-y-1">
                        <div className="font-bold text-stone-800 flex items-center gap-1.5">
                          <span className="text-emerald-800 font-black">대표메뉴:</span>
                          <span>{rest.signatureMenu}</span>
                        </div>
                        <div className="text-[11px] text-stone-600 font-medium flex items-center gap-1.5">
                          <span className="text-stone-500 font-bold">좌석/주차:</span>
                          <span>{rest.groupSeating}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {rest.tags && rest.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap text-[10px]">
                          {rest.tags.map((t) => (
                            <span
                              key={t}
                              className="bg-stone-200/70 text-stone-700 font-bold px-1.5 py-0.5 rounded"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <a
                          href={`tel:${rest.phone}`}
                          className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1 shadow-2xs transition active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>전화 예약 ({rest.phone})</span>
                        </a>
                        <a
                          href={`https://map.naver.com/v5/search/${encodeURIComponent(rest.name)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white hover:bg-stone-100 text-stone-800 text-xs font-black py-2 px-3 rounded-xl border border-stone-300 flex items-center justify-center gap-1 shadow-2xs transition active:scale-95"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                          <span>네이버 길찾기</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* External map search button */}
              <div className="pt-1">
                <a
                  href="https://map.naver.com/v5/search/파크골프장+주변+맛집"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-extrabold py-2.5 rounded-xl flex items-center justify-center gap-1.5 border border-stone-200 transition"
                >
                  <Search className="w-3.5 h-3.5 text-stone-600" />
                  <span>네이버 지도에서 파크골프장 인근 식당 더보기 ↗</span>
                </a>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PANEL 2A: 골프 레슨 코치 검색하기 (완전 분리: 코치 전용) */}
          {/* ========================================================================= */}
          {activeServiceTab === 'COACH' && (
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
                      1:1 맞춤 레슨 · 아카데미 레슨 · 라운딩 레슨 코치
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

              {/* PowerLink Ad Banner */}
              <div className="p-3 bg-linear-to-r from-amber-50 to-amber-100/70 border border-amber-300 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👑</span>
                  <div>
                    <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <span>[파워링크 스폰서 광고]</span>
                      <span className="text-[10px] bg-amber-500 text-stone-950 font-extrabold px-1.5 py-0.2 rounded">검색 1위 노출</span>
                    </div>
                    <p className="text-[11px] text-amber-900 font-medium">
                      코치 프로님! 신규 레슨 회원 모집을 최상단에 선점하세요. (입찰/등록 문의)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCoachModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black px-2.5 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-xs"
                >
                  코치 등록
                </button>
              </div>

              {/* Coach Filter Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                {[
                  { id: 'ALL', label: '👨‍🏫 전체 코치' },
                  { id: '1:1 레슨 / 코치', label: '🎯 1:1 레슨 코치' },
                  { id: '아카데미 / 레슨', label: '🏌️ 아카데미 레슨' },
                  { id: '라운딩 레슨 / 코치', label: '🚩 라운딩 레슨 코치' },
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
                <div className="text-center py-7 px-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <span className="text-3xl block">👨‍🏫</span>
                  <div className="space-y-1">
                    <h4 className="font-black text-stone-900 text-sm">
                      등록된 골프 레슨 코치가 없습니다
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      활동 중이신 레슨 프로/코치님을 직접 등록하시거나, 네이버 지도에서 실시간으로 찾아보실 수 있습니다.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 justify-center max-w-sm mx-auto">
                    <button
                      type="button"
                      onClick={() => setShowCoachModal(true)}
                      className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ 골프 레슨 코치 직접 등록하기</span>
                    </button>
                    <a
                      href={`https://map.naver.com/v5/search/${encodeURIComponent((appliedQuery ? appliedQuery + ' ' : '') + '파크골프 레슨 코치')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-white hover:bg-stone-100 text-stone-800 font-black text-xs py-2.5 px-2 rounded-xl border border-stone-300 flex items-center justify-center gap-1 shadow-xs transition text-center"
                    >
                      <ExternalLink className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span>네이버 지도에서 레슨 코치 검색 ↗</span>
                    </a>
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
                                {t === '1:1 레슨 / 코치'
                                  ? '1:1 레슨 코치'
                                  : t === '아카데미 / 레슨'
                                  ? '아카데미 레슨'
                                  : t === '라운딩 레슨 / 코치'
                                  ? '라운딩 레슨 코치'
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
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <a
                          href={`tel:${coach.phone}`}
                          className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1 shadow-2xs transition active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>전화 상담 ({coach.phone})</span>
                        </a>
                        <a
                          href={`https://map.naver.com/v5/search/${encodeURIComponent(coach.name)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white hover:bg-stone-100 text-stone-800 text-xs font-black py-2 px-3 rounded-xl border border-stone-300 flex items-center justify-center gap-1 shadow-2xs transition active:scale-95"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                          <span>위치 및 지도보기</span>
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
          {activeServiceTab === 'RANGE' && (
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

              {/* PowerLink Ad Banner */}
              <div className="p-3 bg-linear-to-r from-amber-50 to-amber-100/70 border border-amber-300 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👑</span>
                  <div>
                    <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <span>[파워링크 스폰서 광고]</span>
                      <span className="text-[10px] bg-amber-500 text-stone-950 font-extrabold px-1.5 py-0.2 rounded">검색 1위 노출</span>
                    </div>
                    <p className="text-[11px] text-amber-900 font-medium">
                      연습장 대표님! 인근 연습 수요를 최상단에 선점하세요. (입찰/등록 문의)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRangeModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black px-2.5 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-xs"
                >
                  연습장 등록
                </button>
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
                <div className="text-center py-7 px-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                  <span className="text-3xl block">⛳</span>
                  <div className="space-y-1">
                    <h4 className="font-black text-stone-900 text-sm">
                      등록된 스크린 골프 연습장이 없습니다
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      자주 가시는 실내 스크린 연습장을 직접 등록하시거나, 네이버 지도에서 실시간으로 찾아보실 수 있습니다.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 justify-center max-w-sm mx-auto">
                    <button
                      type="button"
                      onClick={() => setShowRangeModal(true)}
                      className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ 스크린 연습장 직접 등록하기</span>
                    </button>
                    <a
                      href={`https://map.naver.com/v5/search/${encodeURIComponent((appliedQuery ? appliedQuery + ' ' : '') + '파크골프 연습장')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-white hover:bg-stone-100 text-stone-800 font-black text-xs py-2.5 px-2 rounded-xl border border-stone-300 flex items-center justify-center gap-1 shadow-xs transition text-center"
                    >
                      <ExternalLink className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span>네이버 지도에서 연습장 검색 ↗</span>
                    </a>
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
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <a
                          href={`tel:${range.phone}`}
                          className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1 shadow-2xs transition active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>전화 문의 ({range.phone})</span>
                        </a>
                        <a
                          href={`https://map.naver.com/v5/search/${encodeURIComponent(range.name)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white hover:bg-stone-100 text-stone-800 text-xs font-black py-2 px-3 rounded-xl border border-stone-300 flex items-center justify-center gap-1 shadow-2xs transition active:scale-95"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                          <span>위치 및 지도보기</span>
                        </a>
                      </div>
                    </div>
                  ))}
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

              {/* PowerLink Ad Banner */}
              <div className="p-3 bg-linear-to-r from-amber-50 to-amber-100/70 border border-amber-300 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👑</span>
                  <div>
                    <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <span>[파워링크 스폰서 광고]</span>
                      <span className="text-[10px] bg-amber-500 text-stone-950 font-extrabold px-1.5 py-0.2 rounded">검색 1위 노출</span>
                    </div>
                    <p className="text-[11px] text-amber-900 font-medium">
                      골프용품·피팅샵 사장님! 파크온 상단 1위 파워링크로 지역 단골을 모으세요. (입찰/등록 문의)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShopModal(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black px-2.5 py-1.5 rounded-xl shrink-0 cursor-pointer shadow-xs"
                >
                  매장 입찰 등록
                </button>
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
                      등록된 주변 골프 매장이 없습니다
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      자주 가시는 파크골프 용품점·피팅샵을 직접 등록하시거나,<br />
                      네이버 지도에서 실시간으로 인근 용품 매장을 찾아보실 수 있습니다.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={() => setShowShopModal(true)}
                      className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ 골프 매장 직접 등록하기</span>
                    </button>
                    <a
                      href="https://map.naver.com/v5/search/파크골프+용품점"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-white hover:bg-stone-100 text-stone-800 font-extrabold text-xs py-2.5 px-3 rounded-xl border border-stone-300 flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                      <span>네이버 지도 실시간 검색 ↗</span>
                    </a>
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
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <a
                          href={`tel:${shop.phone}`}
                          className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1 shadow-2xs transition active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>전화 문의 ({shop.phone})</span>
                        </a>
                        <a
                          href={`https://map.naver.com/v5/search/${encodeURIComponent(shop.name)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white hover:bg-stone-100 text-stone-800 text-xs font-black py-2 px-3 rounded-xl border border-stone-300 flex items-center justify-center gap-1 shadow-2xs transition active:scale-95"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                          <span>위치 및 지도보기</span>
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
                      파크골프 중고 매매 및 교환 장터
                    </h3>
                    <p className="text-[11px] text-stone-600 font-semibold">
                      수수료 0원! 파크골프채·용품 회원간 직거래 매매 및 맞교환
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMarketModal(true)}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>내 매물 등록</span>
                </button>
              </div>

              {/* Legal Disclaimer & Caution Banner */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-900 space-y-1">
                <div className="font-black flex items-center gap-1 text-rose-800">
                  <span className="text-sm">⚠️</span>
                  <span>[법적 면책 공시] 회원 간 100% 현장 직거래 안내</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-800 break-keep">
                  파크온은 통신판매중개 정보 제공자로서 거래 당사자가 아닙니다. 물품의 상태, 결제, 사기 피해 등 일체의 거래 사고에 대해 법적 책임을 지지 않습니다. <strong>선입금이나 택배 거래를 절대 피하시고, 운동장 현장에서 물건을 직접 확인 후 거래하세요!</strong>
                </p>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
                {[
                  { id: 'ALL', label: '전체 매물' },
                  { id: '클럽(채)', label: '파크골프채(클럽)' },
                  { id: '파우치/가방', label: '파우치·가방' },
                  { id: '볼/공', label: '볼·공 세트' },
                  { id: '기타용품', label: '기타 용품' },
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
                      등록된 중고 매물이 없습니다
                    </h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      쓰지 않는 파크골프채나 파우치, 용품을 회원들에게 첫 매물로 등록해 보세요!
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowMarketModal(true)}
                      className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>첫 중고 매물 등록하기</span>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Secondhand Market Registration Modal */}
      {/* ========================================================================= */}
      {showMarketModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤝</span>
                <h3 className="text-base font-black text-stone-900">
                  내 중고 매물 등록하기
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
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
      {/* MODAL: Restaurant Registration Modal */}
      {/* ========================================================================= */}
      {showRestaurantModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍽️</span>
                <h3 className="text-base font-black text-stone-900">
                  {newRestIsPaid ? '👑 유료 스폰서 맛집 입찰/등록' : '주변 식당 등록하기'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRestaurantModal(false);
                  setNewRestIsPaid(false);
                }}
                className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRestaurant} className="space-y-3 overflow-y-auto pr-1 flex-1">
              {/* 유료 스폰서 배너 등록 체크박스 */}
              <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-2xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRestIsPaid}
                    onChange={(e) => setNewRestIsPaid(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 accent-amber-600 cursor-pointer"
                  />
                  <span className="text-xs font-black text-amber-950">
                    👑 상단 직사각형 배너로 단체 손님 유치 (유료 스폰서)
                  </span>
                </label>
                {newRestIsPaid && (
                  <div className="space-y-1 pt-1">
                    <label className="block text-[11px] font-bold text-amber-900">
                      배너 홍보 문구 (직사각형 배너에 노출)
                    </label>
                    <input
                      type="text"
                      value={newRestBannerTitle}
                      onChange={(e) => setNewRestBannerTitle(e.target.value)}
                      placeholder="예: 파크골프 50석 단체 연회 완비 & 구장 무료 픽업 ↗"
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-amber-600"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  식당 이름 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRestName}
                  onChange={(e) => setNewRestName(e.target.value)}
                  placeholder="예: 구미 나루터 식당"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    음식 분류
                  </label>
                  <select
                    value={newRestCategory}
                    onChange={(e) => setNewRestCategory(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                  >
                    <option value="한식 (국밥·찌개·정식)">한식 (국밥·찌개·정식)</option>
                    <option value="일식">일식 (초밥·회·돈까스)</option>
                    <option value="중식">중식 (짜장·짬뽕·탕수육)</option>
                    <option value="양식">양식 (스테이크·파스타)</option>
                    <option value="고기·구이">고기·구이 (한우·삼겹살)</option>
                    <option value="백숙·오리">토종 백숙·오리</option>
                    <option value="막국수·면">시원한 막국수·냉면</option>
                    <option value="분식·기타">분식·간식·기타</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    지역 (위치)
                  </label>
                  <input
                    type="text"
                    value={newRestRegion}
                    onChange={(e) => setNewRestRegion(e.target.value)}
                    placeholder="예: 경북 구미시"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  대표 메뉴
                </label>
                <input
                  type="text"
                  value={newRestMenu}
                  onChange={(e) => setNewRestMenu(e.target.value)}
                  placeholder="예: 소고기 국밥, 석쇠 불고기"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    전화번호
                  </label>
                  <input
                    type="text"
                    value={newRestPhone}
                    onChange={(e) => setNewRestPhone(e.target.value)}
                    placeholder="예: 054-482-1234"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    가격대
                  </label>
                  <input
                    type="text"
                    value={newRestPrice}
                    onChange={(e) => setNewRestPrice(e.target.value)}
                    placeholder="예: 10,000원~"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  좌석 및 주차 정보
                </label>
                <input
                  type="text"
                  value={newRestSeating}
                  onChange={(e) => setNewRestSeating(e.target.value)}
                  placeholder="예: 단체석 완비 / 대형 주차장 완비"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-black py-3 rounded-xl text-sm shadow cursor-pointer transition active:scale-95"
                >
                  식당 등록 완료 🍽️
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRestaurantModal(false);
                    setNewRestIsPaid(false);
                  }}
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
      {/* MODAL: [식당 찾기] 음식 분류 선택 팝업 (일식, 중식, 양식, 한식 등) */}
      {/* ========================================================================= */}
      {showFindRestaurantModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
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
      {/* MODAL: 유료 스폰서 제휴 식당 상세 정보 팝업 (배너 클릭 시 노출) */}
      {/* ========================================================================= */}
      {selectedPaidRestaurant && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3.5 animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">👑</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded">
                      스폰서 제휴 식당
                    </span>
                    <span className="text-[11px] font-bold text-stone-500">
                      {selectedPaidRestaurant.category}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-stone-900">
                    {selectedPaidRestaurant.name}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPaidRestaurant(null)}
                className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 text-xs pr-1 flex-1">
              {selectedPaidRestaurant.bannerTitle && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 font-bold text-xs">
                  {selectedPaidRestaurant.bannerTitle}
                </div>
              )}

              <div className="space-y-2 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-stone-500 w-16 shrink-0">위치</span>
                  <span className="font-bold text-stone-900 flex-1">
                    {selectedPaidRestaurant.region} ({selectedPaidRestaurant.distanceText})
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-stone-500 w-16 shrink-0">대표 메뉴</span>
                  <span className="font-black text-emerald-800 flex-1">
                    {selectedPaidRestaurant.signatureMenu}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-stone-500 w-16 shrink-0">가격대</span>
                  <span className="font-bold text-stone-800 flex-1">
                    {selectedPaidRestaurant.priceInfo}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-stone-500 w-16 shrink-0">좌석 및 특전</span>
                  <span className="font-bold text-stone-800 flex-1">
                    {selectedPaidRestaurant.groupSeating}
                  </span>
                </div>
              </div>

              {selectedPaidRestaurant.description && (
                <div className="p-3 bg-stone-100/80 rounded-2xl text-[11px] text-stone-700 leading-relaxed font-medium">
                  {selectedPaidRestaurant.description}
                </div>
              )}

              {selectedPaidRestaurant.tags && selectedPaidRestaurant.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {selectedPaidRestaurant.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] bg-stone-200 text-stone-700 font-bold px-2 py-0.5 rounded-md"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-stone-100 shrink-0 space-y-2">
              <a
                href={`tel:${selectedPaidRestaurant.phone}`}
                className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95 transition"
              >
                <Phone className="w-4 h-4" />
                <span>단체 예약 & 전화 문의 ({selectedPaidRestaurant.phone})</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedPaidRestaurant.phone);
                  alert(`전화번호(${selectedPaidRestaurant.phone})가 클립보드에 복사되었습니다!`);
                }}
                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2 rounded-xl text-xs cursor-pointer"
              >
                전화번호 복사하기
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
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
                    { id: '1:1 레슨 / 코치', label: '👨‍🏫 1:1 레슨' },
                    { id: '아카데미 / 레슨', label: '🏌️ 아카데미' },
                    { id: '라운딩 레슨 / 코치', label: '🚩 라운딩코치' },
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
                  💡 1:1 개인레슨, 아카데미, 필드 동반 코치 등 지도하시는 분야를 모두 선택해 주세요.
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
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
