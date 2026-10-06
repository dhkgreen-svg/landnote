/**
 * ParkGolf All-in-One: Affiliated Store & Self-Auction Engine
 * 전국 구장별 상권 입점, 옥션(경매) 엔진 및 2단계 계층 정렬 로직
 */

export type StoreCategory =
  | 'RESTAURANT'    // 식당 & 카페
  | 'SCREEN'        // 스크린골프
  | 'TOUR'          // 투어 & 여행사
  | 'RANGE_LESSON'  // 연습장 & 레슨
  | 'SHOP';         // 골프 매장

export type RestaurantSubCategory =
  | '한식·탕'
  | '고기·구이'
  | '국수·면류'
  | '카페·간식'
  | '단체·회식';

export const RESTAURANT_SUB_CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: '전체', label: '전체', icon: '🍽️' },
  { id: '한식·탕', label: '한식·탕', icon: '🍲' },
  { id: '고기·구이', label: '고기·구이', icon: '🥩' },
  { id: '국수·면류', label: '국수·면류', icon: '🍜' },
  { id: '카페·간식', label: '카페·간식', icon: '☕' },
  { id: '단체·회식', label: '단체·회식', icon: '🍻' },
];

export interface AffiliatedStore {
  id: string;
  name: string;
  phone: string;
  address: string;
  category: StoreCategory;
  subCategory: RestaurantSubCategory | string;
  couponBenefit: string;       // 점주 제공 쿠폰 (예: "테이블당 음료수 1캔 무료", "메인메뉴 10% 할인")
  signatureMenu?: string;     // 대표 메뉴
  imageUrl?: string;          // 대표 이미지
  targetCourseIds: string[];  // 점주가 체크한 구장 ID 목록 (다중 체크박스)
  targetCourseNames?: string[]; // 구장 명칭 캐시
  bidAmount: number;          // 월 입찰가 (KRW: 0 or >=3000, JPY: 0 or >=300)
  currency: 'KRW' | 'JPY';
  createdAt: string;          // ISO String
  description?: string;
  distanceMinutesText?: string; // 생활권 이동 시간 (예: "차량 8분 생활권")
  distanceKm?: number;        // 거리순 정렬용 (인위적 필터가 아닌 상대 정렬용)
}

// 옥션 과금 규칙 상수
export const AUCTION_RULES = {
  KRW: {
    MIN_BID: 3000,      // 최저 시작 입찰가 월 3,000원
    BID_STEP: 1000,     // 입찰 호가 단위 +1,000원
    DEFAULT_BID: 3000,
  },
  JPY: {
    MIN_BID: 300,       // 최저 시작 입찰가 월 300엔
    BID_STEP: 100,      // 입찰 호가 단위 +100엔
    DEFAULT_BID: 300,
  },
};

const STORAGE_KEY = 'parkon_affiliated_stores_v4';

// 100% 실사용자/점주 직접 등록 매장만 유지 (가짜 시드 데이터 일체 배제)
const INITIAL_SEED_STORES: AffiliatedStore[] = [];

export const AuctionStorage = {
  /**
   * 로컬 스토리지에서 모든 제휴 매장 목록 불러오기
   * (가짜/더미 데이터 100% 필터링 및 이전 캐시 자동 소거)
   */
  getAllStores(): AffiliatedStore[] {
    if (typeof window === 'undefined') return INITIAL_SEED_STORES;
    try {
      // 이전 버전 가짜 시드 데이터 캐시 영구 소거
      ['parkon_affiliated_stores_v1', 'parkon_affiliated_stores_v2', 'parkon_affiliated_stores_v3', 'parkon_user_restaurants_v1'].forEach((k) => {
        try { localStorage.removeItem(k); } catch {}
      });

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_STORES));
        return INITIAL_SEED_STORES;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // 더미/가짜 매장 식별자 100% 원천 차단 필터
        const clean = parsed.filter((s: AffiliatedStore) =>
          s &&
          s.id &&
          !s.id.startsWith('store-dongrak-') &&
          !s.id.startsWith('store-free-') &&
          !s.id.startsWith('store-miryang-') &&
          !s.id.startsWith('store-jisan-') &&
          !s.id.startsWith('store-daegu-')
        );
        if (clean.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
        }
        return clean;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_STORES));
      return INITIAL_SEED_STORES;
    } catch (e) {
      console.error('Failed to load stores:', e);
      return INITIAL_SEED_STORES;
    }
  },

  /**
   * 특정 구장에 매칭된 제휴 매장 목록 반환
   * courseId가 없거나 'ALL'인 경우 전체 반환
   */
  getStoresForCourse(courseId?: string | null): AffiliatedStore[] {
    const all = this.getAllStores();
    if (!courseId || courseId === 'ALL') return all;

    return all.filter((s) => {
      if (!s.targetCourseIds || s.targetCourseIds.length === 0) return true;
      return s.targetCourseIds.some((id) =>
        id === courseId ||
        courseId.toLowerCase().includes(id.toLowerCase()) ||
        id.toLowerCase().includes(courseId.toLowerCase())
      );
    });
  },

  /**
   * 신규 매장 점주 셀프 등록
   */
  addStore(storeData: Omit<AffiliatedStore, 'id' | 'createdAt'>): AffiliatedStore {
    const all = this.getAllStores();
    const newStore: AffiliatedStore = {
      ...storeData,
      id: `store-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newStore, ...all];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('parkon_stores_updated', { detail: newStore }));
      } catch (e) {
        console.error('Failed to save store:', e);
      }
    }
    return newStore;
  },

  /**
   * 매장 삭제
   */
  deleteStore(storeId: string): void {
    const all = this.getAllStores();
    const updated = all.filter((s) => s.id !== storeId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('parkon_stores_updated'));
      } catch (e) {
        console.error('Failed to delete store:', e);
      }
    }
  },

  /**
   * 매장 정보 업데이트 (상단 옥션 입찰 참여, 수정, 무료 전환 등)
   */
  updateStore(storeId: string, updates: Partial<AffiliatedStore>): AffiliatedStore | null {
    const all = this.getAllStores();
    const index = all.findIndex((s) => s.id === storeId);
    if (index === -1) return null;
    const updatedStore = { ...all[index], ...updates };
    all[index] = updatedStore;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        window.dispatchEvent(new CustomEvent('parkon_stores_updated', { detail: updatedStore }));
      } catch (e) {
        console.error('Failed to update store:', e);
      }
    }
    return updatedStore;
  },

  /**
   * 독립 과금 계산: 선택 구장 수 × 입찰가 (무료인 경우 0원)
   */
  calculateTotal(selectedCourseCount: number, bidAmount: number): number {
    if (bidAmount <= 0) return 0;
    return selectedCourseCount * bidAmount;
  },

  /**
   * [핵심] 2단계 계층 정렬(Sorting) 엔진
   * 
   * 1계층: 유료 옥션 그룹 (bid_amount >= 3000, JP: >= 300)
   * 2계층: 무료 기본 등록 그룹 (bid_amount == 0)
   * 
   * 정렬 모드:
   * - 'RECOMMENDED' (추천순, 기본값):
   *     1계층: bid_amount DESC, created_at ASC (고액 우선, 동점 시 선착순)
   *     2계층: 완전 무작위 RANDOM() 셔플 (페이지 진입/새로고침 시마다 롤링)
   * - 'DISTANCE' (거리순):
   *     유료 매장 내 거리순 정렬 후 무료 매장 내 거리순 정렬
   * - 'LATEST' (최신순):
   *     유료 매장 내 최신순 정렬 후 무료 매장 내 최신순 정렬
   */
  sortStores(
    stores: AffiliatedStore[],
    sortMode: 'RECOMMENDED' | 'DISTANCE' | 'LATEST' = 'RECOMMENDED',
    subCategoryFilter: string = '전체',
    isJapanese: boolean = false
  ): { tier1: AffiliatedStore[]; tier2: AffiliatedStore[]; all: AffiliatedStore[] } {
    const minAuctionBid = isJapanese ? AUCTION_RULES.JPY.MIN_BID : AUCTION_RULES.KRW.MIN_BID;

    // 1. 카테고리 필터링
    let filtered = stores;
    if (subCategoryFilter && subCategoryFilter !== '전체') {
      filtered = stores.filter((s) => s.subCategory === subCategoryFilter);
    }

    // 2. 1계층(유료 옥션)과 2계층(무료 기본) 분리
    const tier1Raw = filtered.filter((s) => s.bidAmount >= minAuctionBid);
    const tier2Raw = filtered.filter((s) => s.bidAmount < minAuctionBid);

    let tier1: AffiliatedStore[] = [...tier1Raw];
    let tier2: AffiliatedStore[] = [...tier2Raw];

    if (sortMode === 'RECOMMENDED') {
      // 1계층: 고액 매장 우선, 동점 시 선착순 (created_at ASC)
      tier1.sort((a, b) => {
        if (b.bidAmount !== a.bidAmount) {
          return b.bidAmount - a.bidAmount;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      // 2계층: 완전 무작위 RANDOM() 셔플 (롤링 정렬)
      for (let i = tier2.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tier2[i], tier2[j]] = [tier2[j], tier2[i]];
      }
    } else if (sortMode === 'DISTANCE') {
      // 거리순: 유료 매장 내 거리순 후 무료 매장 내 거리순
      const sortByDistance = (a: AffiliatedStore, b: AffiliatedStore) => {
        const distA = a.distanceKm ?? 999;
        const distB = b.distanceKm ?? 999;
        return distA - distB;
      };
      tier1.sort(sortByDistance);
      tier2.sort(sortByDistance);
    } else if (sortMode === 'LATEST') {
      // 최신순: 신규 등록순
      const sortByLatest = (a: AffiliatedStore, b: AffiliatedStore) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      };
      tier1.sort(sortByLatest);
      tier2.sort(sortByLatest);
    }

    return {
      tier1,
      tier2,
      all: [...tier1, ...tier2],
    };
  },
};
