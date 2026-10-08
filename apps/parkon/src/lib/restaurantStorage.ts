/**
 * ParkGolf All-in-One: Restaurant Recommendation & National Food Feed Storage
 * 구장별 동호인 검증 '우리 조 찐 단골 맛집' 데이터 스키마 및 스토리지
 * 카카오맵(다음 지도) 검색 연동 및 파크골프 동호인 별점·리뷰 시스템
 */

export interface RestaurantReviewItem {
  id: string;
  author: string;
  memberCode?: string;
  rating: number; // 1~5
  comment: string;
  createdAt: string;
}

export interface RestaurantRecommendation {
  id: string;
  courseId: string;
  courseName: string;
  region: string;
  name: string; // 식당 상호명
  kakaoPlaceUrl: string; // 카카오맵 공식 장소 URL (https://place.map.kakao.com/...)
  kakaoPlaceId?: string;
  roadAddress: string; // 도로명 주소
  phone?: string;
  category: '한식/국밥' | '오리/닭백숙' | '고기구이' | '면/분식' | '카페/다과' | '기타' | string;
  signatureMenu: string;
  priceText?: string;
  tags: string[]; // [🅿️ 주차편함], [👥 단체석], [⚡ 초스피드], [🍶 반주/막걸리], [🍚 밥/반찬리필]
  rating: number; // 5점 만점 평균 별점 (예: 4.8)
  ratingsCount: number; // 별점 참여자 수 (예: 15)
  recommendedBy: string; // 최초 추천인 닉네임 (예: PKY-7788 김대표)
  memberCode?: string;
  reviewComment: string; // 대표 한 줄 평
  reviews: RestaurantReviewItem[]; // 동호인 리뷰 목록
  likesCount: number; // 엄지척 추천수

  // 향후 옥션(Auction) 과금 모델 필드
  isAuctionWinner?: boolean; // 옥션 낙찰 여부 (1위 고정용 플래그)
  auctionBidAmount?: number; // 입찰가
  sponsoredUntil?: string; // 스폰서 만료일
  isAuctionSponsored?: boolean;
  bidRank?: number;
  sponsorBadge?: string;

  createdAt: string;
  likedUserIds?: string[];
}

export interface ScoredRestaurantRecommendation extends RestaurantRecommendation {
  compositeScore: number; // 6:4 가중치 종합 랭킹 점수 (0~100)
  rank: number; // 순위 (1, 2, 3...)
}

/**
 * 카카오맵 공식 검색/상세 URL 생성 헬퍼
 * - 어떤 환경에서도 404 오류 없이 카카오맵으로 직결되어 검색 결과 및 매장 정보가 100% 표출됩니다.
 */
export function getKakaoMapUrl(store: {
  name: string;
  roadAddress?: string;
  region?: string;
  kakaoPlaceUrl?: string;
}): string {
  if (store.kakaoPlaceUrl && store.kakaoPlaceUrl.includes('map.kakao.com/link/search')) {
    return store.kakaoPlaceUrl;
  }
  const cleanName = store.name.trim();
  return `https://map.kakao.com/link/search/${encodeURIComponent(cleanName)}`;
}

/**
 * 대표님 지침: 동호인 참여수(60%) 및 별점(40%) 가중치 6:4 종합 랭킹 점수 산출
 */
export function calculateRestaurantScore(
  store: RestaurantRecommendation,
  maxParticipants: number
): number {
  const participants = store.ratingsCount || store.reviews?.length || 1;
  const rating = store.rating || 5.0;

  // 참여수 점수 (0~100): 최대 참여수 대비 백분율 (최소 20점 기본 보장)
  const safeMax = Math.max(maxParticipants, 1);
  const participantScore = Math.min(100, Math.max(20, (participants / safeMax) * 100));

  // 별점 점수 (0~100): 5점 만점 기준
  const ratingScore = Math.min(100, Math.max(0, (rating / 5.0) * 100));

  // 6:4 가중치 계산 (참여수 60% + 별점 40%)
  const totalScore = (participantScore * 0.6) + (ratingScore * 0.4);
  return Math.round(totalScore * 10) / 10;
}

export const SENIOR_CONVENIENCE_TAGS = [
  '🅿️ 주차편함',
  '👥 단체석',
  '⚡ 초스피드',
  '🍶 반주/막걸리',
  '🍚 밥/반찬리필',
];

export const RESTAURANT_CATEGORIES = [
  { id: '전체', label: '전체' },
  { id: '한식/국밥', label: '한식/국밥', icon: '🍲' },
  { id: '오리/닭백숙', label: '오리/닭백숙', icon: '🍗' },
  { id: '고기구이', label: '고기구이', icon: '🥩' },
  { id: '면/분식', label: '면/분식', icon: '🍜' },
  { id: '카페/다과', label: '카페/다과', icon: '☕' },
];

export const INITIAL_MOCK_RESTAURANTS: RestaurantRecommendation[] = [
  {
    id: 'rest-dongrak-1',
    courseId: '1',
    courseName: '구미 동락 파크골프장',
    region: '경북 구미시',
    name: '동락 가마솥 소고기국밥',
    kakaoPlaceUrl: 'https://place.map.kakao.com/18429184',
    kakaoPlaceId: '18429184',
    roadAddress: '경북 구미시 인동남길 42 (진평동)',
    category: '한식/국밥',
    signatureMenu: '한우 소고기국밥 & 육전',
    priceText: '9,000원 ~ 18,000원',
    tags: ['🅿️ 주차편함', '⚡ 초스피드', '🍚 밥/반찬리필'],
    rating: 4.9,
    ratingsCount: 28,
    recommendedBy: 'PKY-7788 김대표',
    memberCode: 'PKY-7788',
    reviewComment: '운동 끝나고 뜨끈한 국밥에 잘 익은 깍두기 얹어 먹으면 18홀 피로가 싹 풀립니다! 주차장도 광활해서 단체 버스도 넉넉합니다.',
    reviews: [
      {
        id: 'rev-dr-1',
        author: 'PKY-7788 김대표',
        rating: 5,
        comment: '운동 끝나고 뜨끈한 국밥에 잘 익은 깍두기 얹어 먹으면 18홀 피로가 싹 풀립니다! 주차장 광활합니다.',
        createdAt: '2026-09-15',
      },
      {
        id: 'rev-dr-2',
        author: '구미 이글조',
        rating: 5,
        comment: '국물이 진하고 고기가 정말 푸짐합니다. 음식 나오는 속도가 3분 컷이라 기다림 없이 바로 먹었습니다.',
        createdAt: '2026-09-22',
      },
      {
        id: 'rev-dr-3',
        author: '칠곡 파크사랑',
        rating: 4.8,
        comment: '깍두기와 김치가 예술입니다. 공깃밥도 넉넉하게 주셔서 운동 후 배 채우기 최고예요.',
        createdAt: '2026-10-02',
      },
    ],
    likesCount: 142,
    isAuctionWinner: true,
    auctionBidAmount: 50000,
    sponsoredUntil: '2026-12-31',
    isAuctionSponsored: true,
    bidRank: 1,
    sponsorBadge: '👑 구장 공식 추천 1위',
    phone: '054-471-2299',
    createdAt: '2026-09-15T11:30:00Z',
  },
  {
    id: 'rest-dongrak-2',
    courseId: '1',
    courseName: '구미 동락 파크골프장',
    region: '경북 구미시',
    name: '금오산 능이 토종오리백숙',
    kakaoPlaceUrl: 'https://place.map.kakao.com/21356897',
    kakaoPlaceId: '21356897',
    roadAddress: '경북 구미시 남통동 245-1',
    category: '오리/닭백숙',
    signatureMenu: '능이버섯 오리백숙 (찰밥 포함)',
    priceText: '65,000원 (3~4인)',
    tags: ['👥 단체석', '🅿️ 주차편함', '🍶 반주/막걸리'],
    rating: 4.8,
    ratingsCount: 19,
    recommendedBy: '구미 동락사랑회 총무',
    memberCode: 'PKY-5522',
    reviewComment: '월례회나 4개 조 단체 회식할 때 무조건 여기로 갑니다. 찰밥 국물에 말아 먹으면 보약이 따로 없습니다.',
    reviews: [
      {
        id: 'rev-dr2-1',
        author: '구미 동락사랑회 총무',
        rating: 5,
        comment: '월례회나 4개 조 단체 회식할 때 무조건 여기로 갑니다. 찰밥 말아먹는 맛이 환상적입니다.',
        createdAt: '2026-09-20',
      },
    ],
    likesCount: 98,
    phone: '054-463-7788',
    createdAt: '2026-09-20T14:15:00Z',
  },
  {
    id: 'rest-suseong-1',
    courseId: '3',
    courseName: '대구 수성 파크골프장',
    region: '대구 수성구',
    name: '수성못 숯불돼지갈비 & 곤드레솥밥',
    kakaoPlaceUrl: 'https://place.map.kakao.com/15234981',
    kakaoPlaceId: '15234981',
    roadAddress: '대구 수성구 두산동 680',
    category: '고기구이',
    signatureMenu: '수제 양념돼지갈비 & 곤드레정식',
    priceText: '14,000원 ~ 18,000원',
    tags: ['🅿️ 주차편함', '👥 단체석', '🍶 반주/막걸리'],
    rating: 4.9,
    ratingsCount: 22,
    recommendedBy: '대구 홀인원 회장',
    reviewComment: '달지 않고 담백한 숯불갈비에 불로막걸리 한잔 곁들이면 최고입니다. 조원 16명 단체방 완비되어 있어 편합니다.',
    reviews: [
      {
        id: 'rev-ss-1',
        author: '대구 홀인원 회장',
        rating: 5,
        comment: '담백한 숯불갈비에 불로막걸리 한잔 곁들이면 최고입니다. 단체룸 아주 쾌적합니다.',
        createdAt: '2026-09-18',
      },
    ],
    likesCount: 115,
    isAuctionWinner: true,
    auctionBidAmount: 40000,
    sponsoredUntil: '2026-12-31',
    isAuctionSponsored: true,
    bidRank: 1,
    sponsorBadge: '👑 구장 공식 추천 1위',
    phone: '053-768-3355',
    createdAt: '2026-09-18T12:00:00Z',
  },
  {
    id: 'rest-hwacheon-1',
    courseId: 'hwacheon-sancheoneo',
    courseName: '화천 산천어 파크골프장',
    region: '강원 화천군',
    name: '북한강 민물매운탕 & 메밀막국수',
    kakaoPlaceUrl: 'https://place.map.kakao.com/9812451',
    kakaoPlaceId: '9812451',
    roadAddress: '강원 화천군 화천읍 하리 12',
    category: '면/분식',
    signatureMenu: '순메밀 동치미막국수 & 쏘가리매운탕',
    priceText: '9,000원 ~ 50,000원',
    tags: ['⚡ 초스피드', '🅿️ 주차편함', '🍶 반주/막걸리'],
    rating: 4.7,
    ratingsCount: 16,
    recommendedBy: '화천원정대장',
    reviewComment: '화천 구장 다녀올 때마다 들르는 참새 방앗간. 면발이 구수하고 시원한 동치미 육수가 라운딩 갈증을 한방에 날려줍니다.',
    reviews: [
      {
        id: 'rev-hc-1',
        author: '화천원정대장',
        rating: 4.8,
        comment: '면발이 구수하고 시원한 동치미 육수가 최고입니다.',
        createdAt: '2026-09-22',
      },
    ],
    likesCount: 88,
    phone: '033-442-1200',
    createdAt: '2026-09-22T13:40:00Z',
  },
  {
    id: 'rest-yeouido-1',
    courseId: 'seoul-yeouido',
    courseName: '서울 여의도 파크골프장',
    region: '서울 영등포구',
    name: '여의나루 남도 꼬막정식 & 짱뚱어탕',
    kakaoPlaceUrl: 'https://place.map.kakao.com/7123984',
    kakaoPlaceId: '7123984',
    roadAddress: '서울 영등포구 여의동로 213',
    category: '한식/국밥',
    signatureMenu: '벌교 꼬막 비빔밥 정식',
    priceText: '14,000원',
    tags: ['🍚 밥/반찬리필', '👥 단체석', '🅿️ 주차편함'],
    rating: 4.8,
    ratingsCount: 14,
    recommendedBy: '한강 파키클럽',
    reviewComment: '밑반찬 8가지 전부 손맛이 제대로입니다. 꼬막무침 양념이 기가 막히고 밥도 리필돼서 든든합니다.',
    reviews: [
      {
        id: 'rev-yd-1',
        author: '한강 파키클럽',
        rating: 4.8,
        comment: '꼬막무침 양념이 기가 막히고 밥도 든든합니다.',
        createdAt: '2026-09-25',
      },
    ],
    likesCount: 76,
    phone: '02-780-5544',
    createdAt: '2026-09-25T15:20:00Z',
  },
  {
    id: 'rest-miryang-1',
    courseId: 'miryang-sammun',
    courseName: '밀양 삼문 파크골프장',
    region: '경남 밀양시',
    name: '밀양 영남루 원조 소머리곰탕',
    kakaoPlaceUrl: 'https://place.map.kakao.com/11293847',
    kakaoPlaceId: '11293847',
    roadAddress: '경남 밀양시 삼문동 432-8',
    category: '한식/국밥',
    signatureMenu: '가마솥 한우 소머리곰탕 & 수육',
    priceText: '11,000원 ~ 35,000원',
    tags: ['⚡ 초스피드', '🍚 밥/반찬리필', '🅿️ 주차편함'],
    rating: 4.7,
    ratingsCount: 12,
    recommendedBy: '밀양 백돌이 탈출',
    reviewComment: '국물이 뽀얗고 고기가 엄청 푸짐하게 들어있습니다. 사장님이 골퍼들 오면 겉절이 김치를 아낌없이 더 주십니다.',
    reviews: [
      {
        id: 'rev-my-1',
        author: '밀양 백돌이 탈출',
        rating: 4.7,
        comment: '국물이 뽀얗고 고기가 엄청 푸짐합니다.',
        createdAt: '2026-09-28',
      },
    ],
    likesCount: 64,
    phone: '055-354-9988',
    createdAt: '2026-09-28T10:10:00Z',
  },
  {
    id: 'rest-dongrak-cafe-1',
    courseId: '1',
    courseName: '구미 동락 파크골프장',
    region: '경북 구미시',
    name: '낙동강변 베이커리 쉼터 & 수제 단팥죽',
    kakaoPlaceUrl: 'https://place.map.kakao.com/26491823',
    kakaoPlaceId: '26491823',
    roadAddress: '경북 구미시 인동가산로 115 (진평동)',
    category: '카페/다과',
    signatureMenu: '가마솥 단팥죽 & 시원한 팥빙수',
    priceText: '5,000원 ~ 12,000원',
    tags: ['🅿️ 주차편함', '👥 단체석', '⚡ 초스피드'],
    rating: 4.9,
    ratingsCount: 20,
    recommendedBy: '동락 힐링조 조장',
    memberCode: 'PKY-7788',
    reviewComment: '라운딩 끝나고 시원한 팥빙수나 따뜻한 단팥죽 한 그릇 나누기에 최고입니다. 강변 뷰가 탁 트여서 대화 나누기 아주 좋습니다.',
    reviews: [
      {
        id: 'rev-drc-1',
        author: '동락 힐링조 조장',
        rating: 5,
        comment: '강변 뷰가 탁 트여서 대화 나누기 아주 좋습니다. 팥빙수 강추!',
        createdAt: '2026-09-29',
      },
    ],
    likesCount: 104,
    phone: '054-472-8822',
    createdAt: '2026-09-29T16:00:00Z',
  },
  {
    id: 'rest-suseong-cafe-1',
    courseId: '3',
    courseName: '대구 수성 파크골프장',
    region: '대구 수성구',
    name: '수성못 전통 다원 & 진한 수제 쌍화차',
    kakaoPlaceUrl: 'https://place.map.kakao.com/17849102',
    kakaoPlaceId: '17849102',
    roadAddress: '대구 수성구 용학로 106-7 (두산동)',
    category: '카페/다과',
    signatureMenu: '노른자 띄운 수제 쌍화차 & 가래떡 구이',
    priceText: '6,000원 ~ 10,000원',
    tags: ['🅿️ 주차편함', '👥 단체석'],
    rating: 4.8,
    ratingsCount: 15,
    recommendedBy: '수성 시니어클럽',
    memberCode: 'PKY-3311',
    reviewComment: '어르신들 모시고 운동 끝나고 쌍화차 한잔 마시면 기운이 펄펄 납니다. 가래떡 조청에 찍어먹는 맛이 일품입니다.',
    reviews: [
      {
        id: 'rev-ssc-1',
        author: '수성 시니어클럽',
        rating: 4.8,
        comment: '쌍화차에 노른자 동동 띄워 먹으니 피로가 확 풀립니다.',
        createdAt: '2026-10-01',
      },
    ],
    likesCount: 89,
    phone: '053-762-1199',
    createdAt: '2026-10-01T11:00:00Z',
  },
];

const STORAGE_KEY = 'parkon_user_restaurants_v4';
const LIKED_STORAGE_KEY = 'parkon_liked_restaurants_v2';
const GOURMET_BADGES_KEY = 'parkon_gourmet_badge_count_v2';

export const RestaurantStorage = {
  /**
   * 모든 추천 맛집 조회 (로컬 스토리지 + 시드 데이터 병합)
   */
  getAllRestaurants(): RestaurantRecommendation[] {
    if (typeof window === 'undefined') return INITIAL_MOCK_RESTAURANTS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_RESTAURANTS));
        return INITIAL_MOCK_RESTAURANTS;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_RESTAURANTS));
        return INITIAL_MOCK_RESTAURANTS;
      }

      // v4 호환성 마이그레이션: getKakaoMapUrl()을 통한 카카오맵 100% 작동 URL 보장
      const migrated = parsed.map((item) => {
        const seed = INITIAL_MOCK_RESTAURANTS.find((m) => m.id === item.id);
        return {
          ...item,
          kakaoPlaceUrl: getKakaoMapUrl(item),
          roadAddress: item.roadAddress || item.address || seed?.roadAddress || '구장 인근 맛집',
          signatureMenu: item.signatureMenu || seed?.signatureMenu || '대표 메뉴',
          rating: typeof item.rating === 'number' ? item.rating : (seed?.rating || 4.8),
          ratingsCount: typeof item.ratingsCount === 'number' ? item.ratingsCount : (seed?.ratingsCount || 10),
          reviews: Array.isArray(item.reviews) && item.reviews.length > 0 ? item.reviews : (seed?.reviews || [
            {
              id: `rev-${item.id}-0`,
              author: item.recommendedBy || '동호인',
              rating: typeof item.rating === 'number' ? item.rating : 5,
              comment: item.reviewComment || '운동 끝나고 식사하기 참 좋습니다.',
              createdAt: '2026-10-01',
            },
          ]),
          isAuctionWinner: item.isAuctionWinner ?? seed?.isAuctionWinner ?? false,
          auctionBidAmount: item.auctionBidAmount ?? seed?.auctionBidAmount ?? 0,
          sponsorBadge: item.isAuctionWinner ? '👑 구장 공식 추천 1위' : item.sponsorBadge,
        };
      });

      return migrated;
    } catch {
      return INITIAL_MOCK_RESTAURANTS;
    }
  },

  /**
   * 특정 구장(courseId 또는 courseName)과 연계된 맛집 목록 조회
   * 1순위: 옥션 낙찰 매장(isAuctionWinner === true) 최상단 고정 (입찰가/순위 순)
   * 2순위: 동호인 평점 및 추천수 순
   */
  getRestaurantsByCourse(courseIdOrName?: string | null, courseNameHint?: string): RestaurantRecommendation[] {
    const all = this.getAllRestaurants();
    if (!courseIdOrName || courseIdOrName === 'ALL') return this.sortRestaurants(all);
    const query = courseIdOrName.trim().toLowerCase();
    const hint = courseNameHint ? courseNameHint.trim().toLowerCase() : '';

    const matched = all.filter((r) => {
      if (r.courseId && r.courseId.toLowerCase() === query) return true;
      if ((query === 'course-gumi-dongrak' || query.includes('dongrak')) && (r.courseId === '1' || r.courseName?.includes('동락'))) return true;
      if (query.includes('suseong') && (r.courseId === '3' || r.courseName?.includes('수성'))) return true;

      const rName = (r.courseName || '').toLowerCase();
      if (rName && (rName.includes(query) || query.includes(rName.replace('파크골프장', '').trim()))) return true;
      if (hint && (rName.includes(hint) || hint.includes(rName.replace('파크골프장', '').trim()))) return true;

      return false;
    });

    const targetList = matched.length > 0 ? matched : all;
    return this.sortRestaurants(targetList);
  },

  /**
   * 대표님 지침: 참여수(60%) + 별점(40%) 가중치 6:4 종합 랭킹 및 옥션 1위 정렬
   */
  sortRestaurants(list: RestaurantRecommendation[]): ScoredRestaurantRecommendation[] {
    if (list.length === 0) return [];

    const maxParticipants = Math.max(
      ...list.map((s) => s.ratingsCount || s.reviews?.length || 1),
      1
    );

    const scored: ScoredRestaurantRecommendation[] = list.map((s) => ({
      ...s,
      kakaoPlaceUrl: getKakaoMapUrl(s),
      compositeScore: calculateRestaurantScore(s, maxParticipants),
      rank: 0,
    }));

    scored.sort((a, b) => {
      // 1순위: 옥션 낙찰 매장 최상단 고정
      if (a.isAuctionWinner && !b.isAuctionWinner) return -1;
      if (!a.isAuctionWinner && b.isAuctionWinner) return 1;
      if (a.isAuctionWinner && b.isAuctionWinner) {
        return (b.auctionBidAmount || 0) - (a.auctionBidAmount || 0);
      }

      // 2순위: 대표님 지침 가중치 6:4 종합 점수 (compositeScore) 내림차순
      if (b.compositeScore !== a.compositeScore) {
        return b.compositeScore - a.compositeScore;
      }

      // 3순위: 참여자 수 내림차순
      const aCount = a.ratingsCount || a.reviews?.length || 1;
      const bCount = b.ratingsCount || b.reviews?.length || 1;
      if (bCount !== aCount) return bCount - aCount;

      // 4순위: 평균 별점 높은 순
      return (b.rating || 0) - (a.rating || 0);
    });

    return scored.map((s, idx) => ({
      ...s,
      rank: idx + 1,
    }));
  },

  /**
   * 이번 주 가장 많은 골퍼가 추천한 전국 맛집 TOP 10
   */
  getTop10Restaurants(): RestaurantRecommendation[] {
    const all = this.getAllRestaurants();
    return this.sortRestaurants(all).slice(0, 10);
  },

  /**
   * 카카오맵 URL 연동 신규 맛집 추천 등록
   */
  addRestaurant(item: {
    courseId: string;
    courseName: string;
    region?: string;
    name: string;
    kakaoPlaceUrl: string;
    kakaoPlaceId?: string;
    roadAddress: string;
    phone?: string;
    category?: string;
    signatureMenu?: string;
    tags: string[];
    rating: number; // 1~5
    reviewComment: string;
    recommendedBy: string;
    memberCode?: string;
  }): RestaurantRecommendation {
    const all = this.getAllRestaurants();
    const newId = `rest-user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newReview: RestaurantReviewItem = {
      id: `rev-${newId}-1`,
      author: item.recommendedBy || '동호인',
      memberCode: item.memberCode,
      rating: item.rating || 5,
      comment: item.reviewComment || '운동 끝나고 식사하기 참 좋습니다.',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const newRestaurant: RestaurantRecommendation = {
      id: newId,
      courseId: item.courseId || '1',
      courseName: item.courseName || '파크골프장',
      region: item.region || item.roadAddress.split(' ').slice(0, 2).join(' ') || '구장 인근',
      name: item.name.trim(),
      kakaoPlaceUrl: item.kakaoPlaceUrl.trim(),
      kakaoPlaceId: item.kakaoPlaceId,
      roadAddress: item.roadAddress.trim(),
      phone: item.phone || '',
      category: item.category || '한식/국밥',
      signatureMenu: item.signatureMenu || '대표 메뉴',
      tags: item.tags && item.tags.length > 0 ? item.tags : ['🅿️ 주차편함'],
      rating: item.rating || 5,
      ratingsCount: 1,
      recommendedBy: item.recommendedBy || '동호인',
      memberCode: item.memberCode,
      reviewComment: item.reviewComment || '운동 끝나고 든든하게 먹기 딱 좋습니다.',
      reviews: [newReview],
      likesCount: 1,
      isAuctionWinner: false,
      auctionBidAmount: 0,
      createdAt: new Date().toISOString(),
      likedUserIds: [item.recommendedBy || 'self'],
    };

    const updated = [newRestaurant, ...all];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        // 연대기 [🍽️ 필드의 미식가 훈장] 적립
        this.addGourmetBadge(item.recommendedBy);
        // 추천 목록에 자동 좋아요 처리
        this.saveUserLiked(newId, true);
        window.dispatchEvent(new CustomEvent('parkon_restaurants_updated'));
      } catch (e) {
        console.error('Error saving restaurant:', e);
      }
    }
    return newRestaurant;
  },

  /**
   * 동호인 별점 및 한 줄 평 추가 등록
   */
  addReview(
    restaurantId: string,
    review: { author: string; memberCode?: string; rating: number; comment: string }
  ): { success: boolean; updatedRestaurant?: RestaurantRecommendation } {
    const all = this.getAllRestaurants();
    const target = all.find((r) => r.id === restaurantId);
    if (!target) return { success: false };

    const newReviewItem: RestaurantReviewItem = {
      id: `rev-${restaurantId}-${Date.now()}`,
      author: review.author || '동호인',
      memberCode: review.memberCode,
      rating: review.rating,
      comment: review.comment,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const currentReviews = target.reviews || [];
    const currentCount = target.ratingsCount || currentReviews.length || 1;
    const currentAvg = target.rating || 5;

    // 새로운 평점 가중 평균 계산 (소수점 1자리)
    const newCount = currentCount + 1;
    const newAvg = Math.round(((currentAvg * currentCount + review.rating) / newCount) * 10) / 10;

    target.reviews = [newReviewItem, ...currentReviews];
    target.rating = newAvg;
    target.ratingsCount = newCount;
    target.likesCount = (target.likesCount || 1) + 1; // 리뷰 작성 시 추천수도 1 증가

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        window.dispatchEvent(new CustomEvent('parkon_restaurants_updated'));
      } catch (e) {
        console.error('Error adding review:', e);
      }
    }

    return { success: true, updatedRestaurant: target };
  },

  /**
   * 동호인 추천 엄지척(좋아요) 토글
   */
  toggleLike(restaurantId: string, userId?: string): { success: boolean; newCount: number; isLiked: boolean } {
    const all = this.getAllRestaurants();
    const target = all.find((r) => r.id === restaurantId);
    if (!target) return { success: false, newCount: 0, isLiked: false };

    const isCurrentlyLiked = this.isLikedByUser(restaurantId, userId);
    const newIsLiked = !isCurrentlyLiked;
    const diff = newIsLiked ? 1 : -1;
    target.likesCount = Math.max(1, (target.likesCount || 1) + diff);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        this.saveUserLiked(restaurantId, newIsLiked);
        window.dispatchEvent(new CustomEvent('parkon_restaurants_updated'));
      } catch (e) {
        console.error('Error updating likes:', e);
      }
    }

    return { success: true, newCount: target.likesCount, isLiked: newIsLiked };
  },

  isLikedByUser(restaurantId: string, userId?: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem(LIKED_STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.includes(restaurantId);
    } catch {
      return false;
    }
  },

  saveUserLiked(restaurantId: string, isLiked: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(LIKED_STORAGE_KEY);
      let list: string[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];

      if (isLiked) {
        if (!list.includes(restaurantId)) list.push(restaurantId);
      } else {
        list = list.filter((id) => id !== restaurantId);
      }
      localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(list));
    } catch {}
  },

  /**
   * 연대기 [🍽️ 필드의 미식가 훈장] 개수 조회
   */
  getGourmetBadgeCount(userId?: string): number {
    if (typeof window === 'undefined') return 0;
    try {
      return parseInt(localStorage.getItem(GOURMET_BADGES_KEY) || '0', 10);
    } catch {
      return 0;
    }
  },

  addGourmetBadge(userName?: string): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getGourmetBadgeCount();
      localStorage.setItem(GOURMET_BADGES_KEY, (current + 1).toString());
    } catch {}
  },
};
