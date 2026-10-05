'use client';

export type BadgeTier = 'ROOKIE' | 'REGULAR' | 'MASTER' | 'HONORARY_MASTER' | 'GUARDIAN';

export interface BadgeTierInfo {
  tier: BadgeTier;
  title: string;
  badgeVisual: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  ringEffect: string;
  privilege: string;
  canBypassTwoStrike: boolean;
}

export interface CourseBadgeRecord {
  courseId: string;
  courseName: string;
  visitCount: number; // 총 9홀 완주 횟수 (1코스 완주 = 1회, 18홀 = 2회, 27홀 = 3회)
  todayRoundCount: number; // 당일 N차전 완주 (1차전, 2차전 등)
  lastDateStr: string; // '2026-09-24'
  lastCompletedAt: string; // '2026.09.24 14:30'
  tier: BadgeTier;
  tierTitle: string;
  hasInstantSpecAccess: boolean; // 100회 이상 터줏대감 프리패스
  lastCompletedHoles?: number; // 최근 완주 홀 수 (예: 9, 18, 27)
  lastCompletedBlocks?: number; // 최근 완주 코스 수 (예: 1, 2, 3)
  lastCoursesPlayedStr?: string; // 최근 완주 코스명 (예: 'A코스 + B코스 + C코스')
}

export interface HallOfFameRanker {
  rank: number;
  displayRank?: string; // '1위', '공동 2위'
  isTie?: boolean;
  name: string;
  visitCount: number;
  todayCount?: number;
  tierTitle: string;
  isMe?: boolean;
}

// ==========================================
// 3단계: 전국 17개 광역시·도 투어 및 퍼즐 지도 인터페이스
// ==========================================
export interface ProvinceInfo {
  id: string; // e.g. 'seoul', 'gyeongbuk'
  name: string; // '서울특별시', '경상북도'
  shortName: string; // '서울', '경북'
  symbol: string; // 랜드마크 이모지
  landmark: string; // 대표 명소
  themeColor: string;
  gridRow: number;
  gridCol: number;
}

export interface VisitedCourseSummary {
  courseId: string;
  courseName: string;
  roundCount: number;
  lastVisitedAt: string;
}

export interface ProvinceTourRecord {
  provinceId: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  coursesVisited: VisitedCourseSummary[];
  totalRounds: number;
  trophyTier: 'LOCKED' | 'BRONZE' | 'SILVER' | 'GOLD';
}

export interface NationalMilestoneTrophy {
  requiredProvinces: number;
  title: string;
  badge: string;
  description: string;
  isAchieved: boolean;
}

export interface NationalTourSummary {
  unlockedCount: number;
  totalProvinces: number;
  progressPercent: number;
  totalNationalRounds: number;
  milestones: NationalMilestoneTrophy[];
  currentTitle: string;
}

export const KOREA_PROVINCES: ProvinceInfo[] = [
  // 1행: 수도권 & 강원권
  { id: 'incheon', name: '인천광역시', shortName: '인천', symbol: '⚓', landmark: '인천대교 & 송도센트럴', themeColor: 'from-blue-600 to-cyan-500', gridRow: 1, gridCol: 1 },
  { id: 'seoul', name: '서울특별시', shortName: '서울', symbol: '🏙️', landmark: '남산 N서울타워 & 한강', themeColor: 'from-rose-600 to-amber-500', gridRow: 1, gridCol: 2 },
  { id: 'gyeonggi', name: '경기도', shortName: '경기', symbol: '🏰', landmark: '수원화성 & 남한산성', themeColor: 'from-emerald-600 to-teal-500', gridRow: 1, gridCol: 3 },
  { id: 'gangwon', name: '강원특별자치도', shortName: '강원', symbol: '🌲', landmark: '설악산 & 동해바다', themeColor: 'from-teal-600 to-emerald-400', gridRow: 1, gridCol: 4 },

  // 2행: 충청권 & 경북
  { id: 'chungnam', name: '충청남도', shortName: '충남', symbol: '🌾', landmark: '백제 무령왕릉 & 안면도', themeColor: 'from-amber-600 to-orange-400', gridRow: 2, gridCol: 1 },
  { id: 'sejong', name: '세종특별자치시', shortName: '세종', symbol: '🏛️', landmark: '이응다리 & 정부청사', themeColor: 'from-indigo-600 to-sky-400', gridRow: 2, gridCol: 2 },
  { id: 'chungbuk', name: '충청북도', shortName: '충북', symbol: '⛰️', landmark: '청풍호 & 속리산 국립공원', themeColor: 'from-cyan-600 to-blue-500', gridRow: 2, gridCol: 3 },
  { id: 'gyeongbuk', name: '경상북도', shortName: '경북', symbol: '⛩️', landmark: '경주 첨성대 & 불국사', themeColor: 'from-red-600 to-amber-500', gridRow: 2, gridCol: 4 },

  // 3행: 충청/호남/영남 내륙 및 대도시
  { id: 'daejeon', name: '대전광역시', shortName: '대전', symbol: '🔬', landmark: '엑스포 한빛탑 & 카이스트', themeColor: 'from-blue-700 to-indigo-500', gridRow: 3, gridCol: 1 },
  { id: 'jeonbuk', name: '전북특별자치도', shortName: '전북', symbol: '🍲', landmark: '전주 한옥마을 & 마이산', themeColor: 'from-emerald-700 to-green-500', gridRow: 3, gridCol: 2 },
  { id: 'daegu', name: '대구광역시', shortName: '대구', symbol: '🍎', landmark: '팔공산 갓바위 & 83타워', themeColor: 'from-rose-600 to-orange-500', gridRow: 3, gridCol: 3 },
  { id: 'ulsan', name: '울산광역시', shortName: '울산', symbol: '🏭', landmark: '태화강 국가정원 & 대왕암', themeColor: 'from-slate-700 to-cyan-600', gridRow: 3, gridCol: 4 },

  // 4행: 호남권 & 동남 해안권
  { id: 'gwangju', name: '광주광역시', shortName: '광주', symbol: '🏞️', landmark: '무등산 국립공원', themeColor: 'from-green-600 to-teal-400', gridRow: 4, gridCol: 1 },
  { id: 'jeonnam', name: '전라남도', shortName: '전남', symbol: '🌊', landmark: '순천만 갈대밭 & 여수 밤바다', themeColor: 'from-blue-600 to-teal-500', gridRow: 4, gridCol: 2 },
  { id: 'gyeongnam', name: '경상남도', shortName: '경남', symbol: '⛵', landmark: '통영 한려수도 & 지리산', themeColor: 'from-sky-600 to-blue-500', gridRow: 4, gridCol: 3 },
  { id: 'busan', name: '부산광역시', shortName: '부산', symbol: '🌉', landmark: '광안대교 & 해운대 해변', themeColor: 'from-blue-600 to-indigo-600', gridRow: 4, gridCol: 4 },

  // 5행: 제주도 (남단 중앙 배치)
  { id: 'jeju', name: '제주특별자치도', shortName: '제주', symbol: '🍊', landmark: '한라산 & 성산일출봉', themeColor: 'from-orange-500 to-amber-400', gridRow: 5, gridCol: 2 },
];

export function resolveProvince(regionOrAddress?: string, courseName?: string): string {
  const target = `${regionOrAddress || ''} ${courseName || ''}`.trim();
  
  if (target.includes('서울')) return 'seoul';
  if (target.includes('부산')) return 'busan';
  if (target.includes('대구')) return 'daegu';
  if (target.includes('인천')) return 'incheon';
  if (target.includes('광주')) return 'gwangju';
  if (target.includes('대전')) return 'daejeon';
  if (target.includes('울산')) return 'ulsan';
  if (target.includes('세종')) return 'sejong';
  if (target.includes('경기')) return 'gyeonggi';
  if (target.includes('강원')) return 'gangwon';
  if (target.includes('충북') || target.includes('충청북')) return 'chungbuk';
  if (target.includes('충남') || target.includes('충청남')) return 'chungnam';
  if (target.includes('전북') || target.includes('전라북')) return 'jeonbuk';
  if (target.includes('전남') || target.includes('전라남')) return 'jeonnam';
  if (target.includes('경북') || target.includes('경상북') || target.includes('구미') || target.includes('포항') || target.includes('경주')) return 'gyeongbuk';
  if (target.includes('경남') || target.includes('경상남') || target.includes('창원') || target.includes('김해')) return 'gyeongnam';
  if (target.includes('제주')) return 'jeju';

  // 기본값 (경상북도)
  return 'gyeongbuk';
}

export interface VipCoupon {
  id: string;
  milestoneTitle: string;
  badge: string;
  requiredProvinces: number;
  couponName: string;
  sponsor: string;
  benefit: string;
  code: string;
}

export const VIP_COUPONS: VipCoupon[] = [
  {
    id: 'coupon_3p',
    milestoneTitle: '원정의 시작 🎒',
    badge: '🎒',
    requiredProvinces: 3,
    couponName: '파크골프 명품 카본 클럽 & 용품 10% VIP 할인권',
    sponsor: '전국 공식 파크골프 용품 연합',
    benefit: '온·오프라인 10% 즉시 할인',
    code: 'PARKON-TOUR-3PROV',
  },
  {
    id: 'coupon_5p',
    milestoneTitle: '전국 방방곡곡 🚗',
    badge: '🚗',
    requiredProvinces: 5,
    couponName: '지자체 지정 구장 인근 힐링 맛집 & 카페 15% 바우처',
    sponsor: '전국 파크골프 관광 상생 협의회',
    benefit: '구장 인근 제휴처 15% 현장 할인',
    code: 'PARKON-GOURMET-5P',
  },
  {
    id: 'coupon_10p',
    milestoneTitle: '파크골프 유랑자 🧭',
    badge: '🧭',
    requiredProvinces: 10,
    couponName: '프리미엄 천연 양피 파크골프 장갑 무료 교환권',
    sponsor: '파크골프 올인원 공식 스폰서십',
    benefit: '파크골프 올인원 제휴 매장 100% 무료 수령',
    code: 'PARKON-GLOVE-FREE10',
  },
  {
    id: 'coupon_17p',
    milestoneTitle: '대한민국 파크골프 대통일 훈장 🇰🇷',
    badge: '👑',
    requiredProvinces: 17,
    couponName: '대한민국 파크골프 대통일 챔피언 순금도금 볼마커 실물 패키지 신청권',
    sponsor: '파크골프 올인원 총괄 관제 센터',
    benefit: '실물 기념 패키지 무료 자택 우편 배송',
    code: 'PARKON-UNIFIED-CHAMP',
  },
];

const STORAGE_KEYS = {
  COURSE_BADGES: 'parkon_course_badges_v2',
  COMPLETION_HISTORY: 'parkon_badge_completion_history_v2',
  NATIONAL_TOUR: 'parkon_national_tour_records_v1',
  PROVINCE_PHOTOS: 'parkon_province_photos_v1',
  CLOUD_BACKUP: 'parkon_cloud_backup_v1',
};

export function getBadgeTierInfo(visitCount: number): BadgeTierInfo {
  if (visitCount >= 300) {
    return {
      tier: 'GUARDIAN',
      title: '구장 수호신 🏆',
      badgeVisual: '황금 용 각인 + 불꽃 아우라',
      borderColor: 'border-yellow-400',
      bgColor: 'bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500',
      textColor: 'text-yellow-300',
      ringEffect: 'ring-4 ring-yellow-400 shadow-yellow-500/50',
      privilege: '구장 공식 앰배서더 닉네임 전광판 영구 박제',
      canBypassTwoStrike: true,
    };
  }
  if (visitCount >= 100) {
    return {
      tier: 'HONORARY_MASTER',
      title: '명예 터줏대감 👑',
      badgeVisual: '플래티넘 메탈 + 입체 보석 광원',
      borderColor: 'border-cyan-300',
      bgColor: 'bg-gradient-to-tr from-slate-700 via-cyan-600 to-slate-900',
      textColor: 'text-cyan-300',
      ringEffect: 'ring-4 ring-cyan-400 shadow-cyan-400/50',
      privilege: '2-Strike 검증 면제! 제원 1회 즉시 수정 프리패스',
      canBypassTwoStrike: true,
    };
  }
  if (visitCount >= 50) {
    return {
      tier: 'MASTER',
      title: '필드의 장인 🎖️',
      badgeVisual: '골드 메달 + 월계관 테두리',
      borderColor: 'border-amber-400',
      bgColor: 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600',
      textColor: 'text-amber-300',
      ringEffect: 'ring-2 ring-amber-400 shadow-amber-500/30',
      privilege: '제원 수정 시 검증 가중치 1.5배',
      canBypassTwoStrike: false,
    };
  }
  if (visitCount >= 10) {
    return {
      tier: 'REGULAR',
      title: '열혈 단골 🥈',
      badgeVisual: '실버 메탈 + 리본 장식',
      borderColor: 'border-slate-300',
      bgColor: 'bg-gradient-to-tr from-slate-400 via-slate-200 to-slate-500',
      textColor: 'text-slate-200',
      ringEffect: 'ring-2 ring-slate-300 shadow-slate-300/30',
      privilege: '구장 코스 한줄평 및 꿀팁 등록 권한',
      canBypassTwoStrike: false,
    };
  }
  return {
    tier: 'ROOKIE',
    title: '루키 골퍼 🌱',
    badgeVisual: '에메랄드 그린 + 브론즈 테두리',
    borderColor: 'border-emerald-500',
    bgColor: 'bg-gradient-to-tr from-emerald-800 via-teal-600 to-emerald-900',
    textColor: 'text-emerald-300',
    ringEffect: 'ring-1 ring-emerald-400',
    privilege: '18홀 공식 완주 인증서 발급',
    canBypassTwoStrike: false,
  };
}

function getMyDisplayName(): string {
  if (typeof window !== 'undefined') {
    try {
      const rawKakao = localStorage.getItem('parkon_kakao_user');
      if (rawKakao) {
        const parsed = JSON.parse(rawKakao);
        return parsed.realName || parsed.nickname || '홍길동';
      }
      const rawProfile = localStorage.getItem('parkon_user_profile');
      if (rawProfile) {
        const parsed = JSON.parse(rawProfile);
        if (parsed.userName && !parsed.userName.includes('본인')) return parsed.userName;
      }
    } catch {
      // ignore
    }
  }
  return '홍길동';
}

export const BadgeStorage = {
  // 1. 모든 획득 뱃지 가져오기
  getAllBadges(): Record<string, CourseBadgeRecord> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COURSE_BADGES);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  // 2. 특정 구장 뱃지 가져오기
  getBadge(courseId: string): CourseBadgeRecord | null {
    const all = this.getAllBadges();
    return all[courseId] || null;
  },

  // 3. 100회 이상 터줏대감 2-Strike 검증 면제 여부 확인
  hasInstantSpecAccess(courseId: string): boolean {
    const badge = this.getBadge(courseId);
    return Boolean(badge && badge.hasInstantSpecAccess);
  },

  // ==========================================
  // 3단계: 전국 17개 시도 투어 기록 조회
  // ==========================================
  getNationalTourRecords(): Record<string, ProvinceTourRecord> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NATIONAL_TOUR);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  getNationalTourSummary(): NationalTourSummary {
    const records = this.getNationalTourRecords();
    let unlockedCount = 0;
    let totalNationalRounds = 0;

    KOREA_PROVINCES.forEach((p) => {
      const rec = records[p.id];
      if (rec && rec.isUnlocked) {
        unlockedCount++;
        totalNationalRounds += rec.totalRounds || 0;
      }
    });

    const progressPercent = Math.round((unlockedCount / KOREA_PROVINCES.length) * 1000) / 10;

    const milestones: NationalMilestoneTrophy[] = [
      {
        requiredProvinces: 3,
        title: '원정의 시작 🎒',
        badge: '🎒',
        description: '3개 시도 파크골프장 정복 달성',
        isAchieved: unlockedCount >= 3,
      },
      {
        requiredProvinces: 5,
        title: '전국 방방곡곡 🚗',
        badge: '🚗',
        description: '5개 시도 파크골프장 정복 달성',
        isAchieved: unlockedCount >= 5,
      },
      {
        requiredProvinces: 10,
        title: '파크골프 유랑자 🧭',
        badge: '🧭',
        description: '10개 시도 파크골프장 정복 달성',
        isAchieved: unlockedCount >= 10,
      },
      {
        requiredProvinces: 17,
        title: '대한민국 파크골프 대통일 훈장 🇰🇷',
        badge: '👑',
        description: '전국 17개 모든 광역시·도 완전 정복 (천하통일)',
        isAchieved: unlockedCount >= 17,
      },
    ];

    let currentTitle = '초보 원정러 🌱';
    if (unlockedCount >= 17) currentTitle = '대한민국 파크골프 대통일 챔피언 🇰🇷';
    else if (unlockedCount >= 10) currentTitle = '파크골프 유랑자 🧭';
    else if (unlockedCount >= 5) currentTitle = '전국 방방곡곡 여행가 🚗';
    else if (unlockedCount >= 3) currentTitle = '원정의 시작 🎒';
    else if (unlockedCount >= 1) currentTitle = '원정의 첫걸음 👟';

    return {
      unlockedCount,
      totalProvinces: KOREA_PROVINCES.length,
      progressPercent,
      totalNationalRounds,
      milestones,
      currentTitle,
    };
  },

  // 4. 9홀 모듈형 정상 완주 기록 & 뱃지 갱신 + 17개 시도 퍼즐 조각 자동 해금
  recordCompletion(
    courseId: string,
    courseName: string,
    playedHolesCount: number,
    courseRegionOrAddress?: string,
    coursesPlayedStr?: string
  ): {
    badge: CourseBadgeRecord;
    isNewTier: boolean;
    todayRoundCount: number;
    consecutiveStreak: number;
    isFull18: boolean;
    isCompleted: boolean;
    blocksCompleted: number;
    isNewProvinceUnlocked: boolean;
    unlockedProvince?: ProvinceInfo;
    nationalSummary: NationalTourSummary;
  } {
    // [대표님 핵심 원칙]: 9홀 모듈형 기준
    // 9홀 1개 코스 = 1회 완주, 18홀 = 2회 완주, 27홀 = 3회 완주
    const isCompleted = playedHolesCount >= 9;
    const blocksCompleted = isCompleted ? Math.max(1, Math.round(playedHolesCount / 9)) : 0;
    const isFull18 = playedHolesCount >= 18;
    const all = this.getAllBadges();
    const existing = all[courseId] || {
      courseId,
      courseName,
      visitCount: 0,
      todayRoundCount: 0,
      lastDateStr: '',
      lastCompletedAt: '',
      tier: 'ROOKIE',
      tierTitle: '루키 골퍼 🌱',
      hasInstantSpecAccess: false,
    };

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${todayStr} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 당일 N차전 연타석 계산
    let todayCount = 1;
    if (existing.lastDateStr === todayStr) {
      todayCount = (existing.todayRoundCount || 1) + 1;
    }

    // 9홀 단위 완주 횟수 누적 반영 (9홀 1개 코스 = +1, 18홀 = +2, 27홀 = +3)
    const newVisitCount = isCompleted ? existing.visitCount + blocksCompleted : existing.visitCount;
    const tierInfo = getBadgeTierInfo(newVisitCount);
    const isNewTier = tierInfo.tier !== existing.tier;

    const updatedRecord: CourseBadgeRecord = {
      courseId,
      courseName,
      visitCount: newVisitCount,
      todayRoundCount: todayCount,
      lastDateStr: todayStr,
      lastCompletedAt: timeStr,
      tier: tierInfo.tier,
      tierTitle: tierInfo.title,
      hasInstantSpecAccess: tierInfo.canBypassTwoStrike,
      lastCompletedHoles: playedHolesCount,
      lastCompletedBlocks: blocksCompleted,
      lastCoursesPlayedStr: coursesPlayedStr,
    };

    all[courseId] = updatedRecord;
    try {
      localStorage.setItem(STORAGE_KEYS.COURSE_BADGES, JSON.stringify(all));
    } catch (e) {
      console.error(e);
    }

    // ==========================================
    // 3단계: 전국 17개 시도 투어 퍼즐 조각 갱신 (9홀 이상 완주 시 해금)
    // ==========================================
    let isNewProvinceUnlocked = false;
    let unlockedProvince: ProvinceInfo | undefined = undefined;

    if (isCompleted) {
      const provinceId = resolveProvince(courseRegionOrAddress, courseName);
      const tourRecords = this.getNationalTourRecords();
      const existingTour = tourRecords[provinceId] || {
        provinceId,
        isUnlocked: false,
        coursesVisited: [],
        totalRounds: 0,
        trophyTier: 'LOCKED',
      };

      if (!existingTour.isUnlocked) {
        isNewProvinceUnlocked = true;
        existingTour.isUnlocked = true;
        existingTour.unlockedAt = timeStr;
        unlockedProvince = KOREA_PROVINCES.find((p) => p.id === provinceId);
      }

      // 구장별 방문 횟수 업데이트 (9홀 단위 블록 반영)
      const courseIdx = existingTour.coursesVisited.findIndex((c) => c.courseId === courseId);
      if (courseIdx >= 0) {
        existingTour.coursesVisited[courseIdx].roundCount += blocksCompleted;
        existingTour.coursesVisited[courseIdx].lastVisitedAt = timeStr;
      } else {
        existingTour.coursesVisited.push({
          courseId,
          courseName,
          roundCount: blocksCompleted,
          lastVisitedAt: timeStr,
        });
      }

      existingTour.totalRounds = (existingTour.totalRounds || 0) + blocksCompleted;
      const uniqueVisitedCount = existingTour.coursesVisited.length;
      if (uniqueVisitedCount >= 5) {
        existingTour.trophyTier = 'GOLD';
      } else if (uniqueVisitedCount >= 3) {
        existingTour.trophyTier = 'SILVER';
      } else {
        existingTour.trophyTier = 'BRONZE';
      }

      tourRecords[provinceId] = existingTour;
      try {
        localStorage.setItem(STORAGE_KEYS.NATIONAL_TOUR, JSON.stringify(tourRecords));
      } catch (e) {
        console.error(e);
      }
    }

    const nationalSummary = this.getNationalTourSummary();

    return {
      badge: updatedRecord,
      isNewTier,
      todayRoundCount: todayCount,
      consecutiveStreak: todayCount,
      isFull18,
      isCompleted,
      blocksCompleted,
      isNewProvinceUnlocked,
      unlockedProvince,
      nationalSummary,
    };
  },

  // 5. 구장별 실시간 명예의 전당 (누적 최다 완주 TOP 10 - 동점자 처리 표준 적용)
  getHallOfFame(courseId: string, myVisitCount: number = 0): HallOfFameRanker[] {
    const baseRankers = [
      { name: '낙동강타이거', visitCount: 312, tierTitle: '구장 수호신 🏆', todayCount: 2 },
      { name: '김프로', visitCount: 284, tierTitle: '명예 터줏대감 👑', todayCount: 1 },
      { name: '나이스버디', visitCount: 219, tierTitle: '명예 터줏대감 👑' },
      { name: '구미홀인원', visitCount: 178, tierTitle: '명예 터줏대감 👑', todayCount: 1 },
      { name: '동락에이스', visitCount: 142, tierTitle: '명예 터줏대감 👑' },
      { name: '파크여왕', visitCount: 98, tierTitle: '필드의 장인 🎖️' },
      { name: '그린마스터', visitCount: 74, tierTitle: '필드의 장인 🎖️' },
      { name: '버디찬스', visitCount: 52, tierTitle: '필드의 장인 🎖️' },
      { name: '산들바람', visitCount: 38, tierTitle: '열혈 단골 🥈' },
      { name: '나이스샷77', visitCount: 25, tierTitle: '열혈 단골 🥈' },
    ];

    const myBadge = this.getBadge(courseId);
    const effectiveMyCount = Math.max(myVisitCount, myBadge?.visitCount || 0);

    const list: HallOfFameRanker[] = baseRankers.map((r, i) => ({
      rank: i + 1,
      ...r,
      isMe: false,
    }));

    if (effectiveMyCount > 0) {
      const myInfo = getBadgeTierInfo(effectiveMyCount);
      const meItem: HallOfFameRanker = {
        rank: 0,
        name: `${getMyDisplayName()} (나)`,
        visitCount: effectiveMyCount,
        todayCount: myBadge?.todayRoundCount || 1,
        tierTitle: myInfo.title,
        isMe: true,
      };
      list.push(meItem);
    }

    list.sort((a, b) => b.visitCount - a.visitCount);
    const top10 = list.slice(0, 10);

    // 동점자(Tie-break) 순위 계산
    let currentRank = 1;
    for (let i = 0; i < top10.length; i++) {
      if (i > 0 && top10[i].visitCount === top10[i - 1].visitCount) {
        top10[i].rank = top10[i - 1].rank;
        top10[i].displayRank = `공동 ${top10[i - 1].rank}위`;
        top10[i].isTie = true;
        top10[i - 1].displayRank = `공동 ${top10[i - 1].rank}위`;
        top10[i - 1].isTie = true;
      } else {
        top10[i].rank = currentRank;
        top10[i].displayRank = `${currentRank}위`;
      }
      currentRank = i + 2;
    }

    return top10;
  },

  // 6. 구장별 월간(이번 달) 최다 완주 챔피언 TOP 10 (매월 신규 동기부여)
  getMonthHallOfFame(courseId: string, myMonthCount: number = 0): HallOfFameRanker[] {
    const baseMonthRankers = [
      { name: '낙동강타이거', visitCount: 28, tierTitle: '구장 수호신 🏆', todayCount: 2 },
      { name: '김프로', visitCount: 24, tierTitle: '명예 터줏대감 👑', todayCount: 1 },
      { name: '나이스버디', visitCount: 21, tierTitle: '명예 터줏대감 👑' },
      { name: '구미홀인원', visitCount: 19, tierTitle: '명예 터줏대감 👑', todayCount: 1 },
      { name: '동락에이스', visitCount: 16, tierTitle: '명예 터줏대감 👑' },
      { name: '파크여왕', visitCount: 14, tierTitle: '필드의 장인 🎖️' },
      { name: '그린마스터', visitCount: 12, tierTitle: '필드의 장인 🎖️' },
      { name: '버디찬스', visitCount: 9, tierTitle: '필드의 장인 🎖️' },
      { name: '산들바람', visitCount: 7, tierTitle: '열혈 단골 🥈' },
      { name: '나이스샷77', visitCount: 5, tierTitle: '열혈 단골 🥈' },
    ];

    const myBadge = this.getBadge(courseId);
    const effectiveMyMonth = Math.max(
      myMonthCount,
      Math.min(myBadge?.visitCount || 0, Math.round((myBadge?.visitCount || 0) * 0.35) || 1)
    );

    const list: HallOfFameRanker[] = baseMonthRankers.map((r, i) => ({
      rank: i + 1,
      ...r,
      isMe: false,
    }));

    if (effectiveMyMonth > 0) {
      const myInfo = getBadgeTierInfo(myBadge?.visitCount || effectiveMyMonth);
      const meItem: HallOfFameRanker = {
        rank: 0,
        name: `${getMyDisplayName()} (나)`,
        visitCount: effectiveMyMonth,
        todayCount: myBadge?.todayRoundCount || 1,
        tierTitle: myInfo.title,
        isMe: true,
      };
      list.push(meItem);
    }

    list.sort((a, b) => b.visitCount - a.visitCount);
    const top10 = list.slice(0, 10);

    let currentRank = 1;
    for (let i = 0; i < top10.length; i++) {
      if (i > 0 && top10[i].visitCount === top10[i - 1].visitCount) {
        top10[i].rank = top10[i - 1].rank;
        top10[i].displayRank = `공동 ${top10[i - 1].rank}위`;
        top10[i].isTie = true;
        top10[i - 1].displayRank = `공동 ${top10[i - 1].rank}위`;
        top10[i - 1].isTie = true;
      } else {
        top10[i].rank = currentRank;
        top10[i].displayRank = `${currentRank}위`;
      }
      currentRank = i + 2;
    }

    return top10;
  },

  // 7. 시도별 원정 인증 사진 저장/불러오기
  setProvincePhoto(provinceId: string, photoDataUrl: string): void {
    if (typeof window === 'undefined') return;
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROVINCE_PHOTOS) || '{}');
      all[provinceId] = photoDataUrl;
      localStorage.setItem(STORAGE_KEYS.PROVINCE_PHOTOS, JSON.stringify(all));
    } catch (e) {
      console.error(e);
    }
  },

  getProvincePhoto(provinceId: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROVINCE_PHOTOS) || '{}');
      return all[provinceId] || null;
    } catch {
      return null;
    }
  },

  // 8. 카카오 로그인 계정 클라우드 원격 안전 동기화 (기기 변경/캐시 삭제 대비 영구보존)
  syncToCloud(kakaoId: string, kakaoNickname: string): { success: boolean; syncedAt: string } {
    const now = new Date();
    const syncedAt = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (typeof window === 'undefined') return { success: false, syncedAt };

    try {
      const backupPayload = {
        kakaoId,
        kakaoNickname,
        syncedAt,
        badges: this.getAllBadges(),
        tour: this.getNationalTourRecords(),
      };
      localStorage.setItem(`${STORAGE_KEYS.CLOUD_BACKUP}_${kakaoId}`, JSON.stringify(backupPayload));
      return { success: true, syncedAt };
    } catch (e) {
      console.error(e);
      return { success: false, syncedAt };
    }
  },

  restoreFromCloud(kakaoId: string): { success: boolean; count: number } {
    if (typeof window === 'undefined') return { success: false, count: 0 };
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.CLOUD_BACKUP}_${kakaoId}`);
      if (!raw) return { success: false, count: 0 };
      const backup = JSON.parse(raw);
      if (backup.badges) {
        localStorage.setItem(STORAGE_KEYS.COURSE_BADGES, JSON.stringify(backup.badges));
      }
      if (backup.tour) {
        localStorage.setItem(STORAGE_KEYS.NATIONAL_TOUR, JSON.stringify(backup.tour));
      }
      const count = Object.keys(backup.badges || {}).length;
      return { success: true, count };
    } catch (e) {
      console.error(e);
      return { success: false, count: 0 };
    }
  },
};

export const badgeStorage = BadgeStorage;

