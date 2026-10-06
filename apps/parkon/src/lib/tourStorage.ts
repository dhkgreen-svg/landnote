/**
 * ParkGolf All-in-One: Tour Package & Travel Agency Storage Engine
 * 국내/해외 파크골프 투어 패키지 및 여행사 등록/관리 엔진
 */

export type TourType = 'ALL' | 'DOMESTIC' | 'OVERSEAS';

export interface TourPackage {
  id: string;
  agencyName: string;           // 여행사명 / 주최사 (예: 파크투어, 하나골프, 명품원정대)
  title: string;                // 투어 상품명 (예: [일본 홋카이도] 3박 4일 도카치 명품 원정)
  tourType: 'DOMESTIC' | 'OVERSEAS'; // 국내 투어 vs 해외 투어
  destination: string;          // 목적지 / 방문 구장 (예: 일본 홋카이도 도카치, 강원 화천·춘천)
  duration: string;             // 일정 및 기간 (예: 3박 4일, 1박 2일, 매주 화/금 출발)
  price: string;                // 상품 가격 (예: 1인 450,000원 / 1,290,000원)
  giftsAndBenefits: string;     // 참가자 사은품 및 포함 혜택 (예: 파크골프 볼 2구 증정, 전일정 온천 호텔)
  phone: string;                // 예약 및 상담 문의처
  departureInfo?: string;       // 출발지 및 교통편 (예: 서울/부산 왕복 리무진 버스, 인천공항 직항)
  imageUrl?: string;            // 대표 이미지 URL
  description?: string;         // 상세 소개
  bidAmount: number;            // 0: 무료 기본 등록, >= 3000: 상단 옥션 우선 노출
  createdAt: string;            // 등록일시 (ISO)
}

const STORAGE_KEY = 'parkon_tour_packages_v1';

// 100% 실사용자/여행사 직접 등록 상품만 유지 (가짜 시드 데이터 일체 배제)
const INITIAL_SEED_TOURS: TourPackage[] = [];

export const TourStorage = {
  /**
   * 모든 투어 상품 목록 불러오기
   */
  getAllTours(): TourPackage[] {
    if (typeof window === 'undefined') return INITIAL_SEED_TOURS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_TOURS));
        return INITIAL_SEED_TOURS;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // 더미 식별자 필터링
        const clean = parsed.filter((t: TourPackage) => t && t.id && !t.id.startsWith('dummy-'));
        if (clean.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
        }
        return clean;
      }
      return INITIAL_SEED_TOURS;
    } catch (e) {
      console.error('Failed to load tour packages:', e);
      return INITIAL_SEED_TOURS;
    }
  },

  /**
   * 신규 투어 상품 직접 등록
   */
  addTour(tourData: Omit<TourPackage, 'id' | 'createdAt'>): TourPackage {
    const all = this.getAllTours();
    const newTour: TourPackage = {
      ...tourData,
      id: `tour-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTour, ...all];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('parkon_tours_updated', { detail: newTour }));
      } catch (e) {
        console.error('Failed to save tour package:', e);
      }
    }
    return newTour;
  },

  /**
   * 투어 상품 업데이트 (상단 옥션 입찰 참여 및 정보 수정)
   */
  updateTour(tourId: string, updates: Partial<TourPackage>): TourPackage | null {
    const all = this.getAllTours();
    const index = all.findIndex((t) => t.id === tourId);
    if (index === -1) return null;
    const updatedTour = { ...all[index], ...updates };
    all[index] = updatedTour;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        window.dispatchEvent(new CustomEvent('parkon_tours_updated', { detail: updatedTour }));
      } catch (e) {
        console.error('Failed to update tour package:', e);
      }
    }
    return updatedTour;
  },

  /**
   * 투어 상품 삭제
   */
  deleteTour(tourId: string): void {
    const all = this.getAllTours();
    const updated = all.filter((t) => t.id !== tourId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('parkon_tours_updated'));
      } catch (e) {
        console.error('Failed to delete tour package:', e);
      }
    }
  },

  /**
   * 투어 상품 정렬 (1계층: 유료 옥션 우선, 2계층: 무료 일반 등록)
   */
  sortTours(
    tours: TourPackage[],
    typeFilter: TourType = 'ALL'
  ): { tier1: TourPackage[]; tier2: TourPackage[]; all: TourPackage[] } {
    let filtered = tours;
    if (typeFilter !== 'ALL') {
      filtered = tours.filter((t) => t.tourType === typeFilter);
    }

    const tier1 = filtered
      .filter((t) => t.bidAmount >= 3000)
      .sort((a, b) => b.bidAmount - a.bidAmount || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const tier2 = filtered
      .filter((t) => t.bidAmount < 3000)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      tier1,
      tier2,
      all: [...tier1, ...tier2],
    };
  },
};
