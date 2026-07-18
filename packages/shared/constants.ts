// ── 관리자 역할 ──────────────────────────────────────────────

export const ADMIN_ROLE = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
} as const;

export type AdminRole = typeof ADMIN_ROLE[keyof typeof ADMIN_ROLE];

export const ACCESS_LOG_RETENTION_DAYS = 90;

// ── 4-1. 구독 플랜 ──────────────────────────────────────────────

export const SUBSCRIPTION_PLAN = {
  MINIMAL: 'minimal',
  STANDARD: 'standard',
  PRO: 'pro',
} as const;

export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export const PLAN_PRICE: Record<string, number> = {
  minimal: 10000,
  standard: 15000,
  pro: 20000,
};

export const PLAN_LIMITS = {
  minimal: {
    max_categories: 2,
    max_listings_per_month: 0,
    max_qr_codes: 1,
    max_images_per_listing: 5,
    category_changes_per_month: 0,
  },
  standard: {
    max_categories: 3,
    max_listings_per_month: 0,
    max_qr_codes: 2,
    max_images_per_listing: 10,
    category_changes_per_month: 0,
  },
  pro: {
    max_categories: 4,
    max_listings_per_month: 0,
    max_qr_codes: 4,
    max_images_per_listing: 20,
    category_changes_per_month: 0,
  },
} as const;

export const TRIAL_DAYS = 7;
export const CANCELLED_DATA_RETENTION_DAYS = 30;

export function isUnlimited(limit: number): boolean {
  return limit === 0;
}

export function clampBillingDay(day: number): number {
  return Math.min(day, 28);
}

// ── 4-2. 카테고리 코드 ──────────────────────────────────────────

export const CATEGORY_CODE = {
  RESIDENTIAL: 'residential',
  COMMERCIAL:  'commercial',
  INDUSTRIAL:  'industrial',
  LAND:        'land',
} as const;

export type CategoryCode = typeof CATEGORY_CODE[keyof typeof CATEGORY_CODE];

export const CATEGORY_LABELS: Record<CategoryCode, string> = {
  residential: '주거용',
  commercial: '상업용',
  industrial: '산업용',
  land: '토지',
};

// ── 4-2-1. 하위 호환을 위한 세부 업종 (Subcategories) ──────────────────────────────

export const SUBCATEGORIES: Record<CategoryCode, Record<string, string[]>> = {
  residential: {
    apartment: ['아파트 (주상복합 포함)'],
    officetel: ['오피스텔 (보안과 편리한 주차를 선호하는 수요층 분리)'],
    villa:     ['빌라', '다세대'],
    oneroom:   ['원룸', '투룸'],
    house:     ['주택', '전원주택', '다가구'],
  },
  commercial: {
    store:             ['요식업', '병의원/약국', '학원/교육', '미용/뷰티', '소매/판매', '오락/스포츠', '기타업종'],
    office:            ['일반사무실', '소호오피스', '공유오피스', '프라임오피스'],
    officetel_biz:     ['업무용 오피스텔', '주거겸용 오피스텔'],
    lodging:           ['호텔', '모텔', '펜션', '게스트하우스'],
    building:          ['꼬마빌딩', '근생빌딩', '상가주택', '통빌딩'],
    other_commercial:  ['기타 상업용'],
  },
  industrial: {
    factory:   ['일반제조(기계/조립)', '식품공장(HACCP)', '화학/위험물', '반도체/클린룸', '도금/염색', '기타특수공장'],
    warehouse: ['일반창고(상온)', '냉동/냉장창고', '대형물류센터', '보세창고', '위험물/화학창고', '기타창고'],
    knowledge: ['지산-사무형(IT/업무)', '지산-제조형(드라이브인)', '지산-지원시설(상가)', '지산-기숙사', '기타지산시설'],
    workshop:  ['1종/2종 근생(제조)', '소형작업장/공방', '창고형 매장', '자동차정비/카센터', '기타작업장'],
    yard:      ['야적장(컨테이너/자재)', '고물상/자원수거', '폐기물처리장', '중고차매매단지', '기타특수부지'],
    other_industrial: ['주유소/가스충전소', '데이터센터', '태양광발전소', '기타'],
  },
  land: {
    land_building:   ['단독주택부지', '상가/근생부지', '상업용지', '숙박/펜션부지', '기타주거상업용'],
    land_industrial: ['공장부지', '창고/물류부지', '산업단지(산단)용지', '야적장용지', '기타산업용'],
    land_farm:       ['전(밭)', '답(논)', '과수원', '목장용지', '주말농장/텃밭', '기타농지'],
    land_forest:     ['준보전산지(개발가능)', '보전산지(개발제한)', '종중산(문중산)', '자연림/야산', '기타임야'],
    land_invest:     ['택지개발예정지', '재개발/재건축구역', '도로개통/신도시호재', '토지거래허가구역', '기타투자용지'],
    land_special:    ['주차장용지', '종교시설용지', '체육/휴양시설', '요양원/병원부지', '태양광부지', '기타특수용지'],
  },
};

export const SUBCATEGORY_LABELS: Record<string, string> = {
  apartment: '아파트',
  officetel: '오피스텔',
  villa: '빌라, 다세대',
  oneroom: '원룸, 투룸',
  house: '주택, 전원주택, 다가구',
  store: '점포/상가',
  office: '사무실/오피스',
  officetel_biz: '오피스텔(업무용)',
  lodging: '숙박시설(호텔/모텔 등)',
  building: '빌딩',
  other_commercial: '기타 상업용',
  factory: '공장',
  warehouse: '창고/물류센터',
  knowledge: '지식산업센터',
  workshop: '근생공장/작업장',
  yard: '야적장/특수부지',
  other_industrial: '기타 산업용/인프라',
  land_building: '주거/상업용지 (건축용)',
  land_industrial: '공업/산업용지',
  land_farm: '농지 (전·답·과수원)',
  land_forest: '임야 (산지)',
  land_invest: '투자/개발호재용지',
  land_special: '특수목적/기타용지',
};

// ── 4-3. 거래 유형 코드 ──────────────────────────────────────────

export const TRANSACTION_TYPE = {
  SALE:             'sale',
  JEONSE:           'jeonse',
  MONTHLY_RENT:     'monthly_rent',
  PREMIUM_TRANSFER: 'premium_transfer',
} as const;

export type TransactionType = typeof TRANSACTION_TYPE[keyof typeof TRANSACTION_TYPE];

export const PRICE_LABELS: Record<string, string> = {
  price_sale: '매매가 (만 원)',
  deposit: '보증금 (만 원)',
  monthly_rent: '월세 (만 원)',
  maintenance_fee: '관리비 (만 원)',
  premium_price: '권리금 (만 원)',
  contract_remaining_months: '잔여 계약기간 (개월)',
};

export const REQUIRED_PRICE_FIELDS: Record<TransactionType, string[]> = {
  sale:             ['price_sale'],
  jeonse:           ['price_jeonse', 'maintenance_fee'],
  monthly_rent:     ['deposit', 'monthly_rent', 'maintenance_fee'],
  premium_transfer: ['deposit', 'monthly_rent', 'maintenance_fee',
                     'premium_price', 'contract_remaining_months'],
};

// ── 4-4. 상태 코드 ──────────────────────────────────────────────

export const INQUIRY_STATUS = {
  NEW:         'new',
  CONTACTED:   'contacted',
  VIEWING:     'viewing',
  NEGOTIATING: 'negotiating',
  CONTRACTED:  'contracted',
  CLOSED:      'closed',
} as const;

export const LISTING_STATUS = {
  ACTIVE:     'active',
  PENDING:    'pending',
  CONTRACTED: 'contracted',
  CLOSED:     'closed',
} as const;

// ── 4-5. 용도지역 (Zoning) ──────────────────────────────────────────────

export const ZONING_OPTIONS = [
  '제1종전용주거지역',
  '제2종전용주거지역',
  '제1종일반주거지역',
  '제2종일반주거지역',
  '제3종일반주거지역',
  '준주거지역',
  '중심상업지역',
  '일반상업지역',
  '근린상업지역',
  '유통상업지역',
  '전용공업지역',
  '일반공업지역',
  '준공업지역',
  '보전녹지지역',
  '생산녹지지역',
  '자연녹지지역',
  '보전관리지역',
  '생산관리지역',
  '계획관리지역',
  '농림지역',
  '자연환경보전지역',
  '미지정',
  '기타',
];

// ── 4-6. 지목 (Land Category) ──────────────────────────────────────────────

export const JIMOK_OPTIONS = [
  '전',
  '답',
  '과수원',
  '목장용지',
  '임야',
  '광천지',
  '염전',
  '대',
  '공장용지',
  '학교용지',
  '주차장',
  '주유소용지',
  '창고용지',
  '도로',
  '철도용지',
  '제방',
  '하천',
  '구거',
  '유지',
  '양어장',
  '수도용지',
  '공원',
  '체육용지',
  '유원지',
  '종교용지',
  '사적지',
  '묘지',
  '잡종지',
];
