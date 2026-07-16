"use strict";
// ── 관리자 역할 ──────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.LISTING_STATUS = exports.INQUIRY_STATUS = exports.REQUIRED_PRICE_FIELDS = exports.TRANSACTION_TYPE = exports.SUBCATEGORY_LABELS = exports.SUBCATEGORIES = exports.CATEGORY_LABELS = exports.CATEGORY_CODE = exports.CANCELLED_DATA_RETENTION_DAYS = exports.TRIAL_DAYS = exports.PLAN_LIMITS = exports.PLAN_PRICE = exports.SUBSCRIPTION_STATUS = exports.SUBSCRIPTION_PLAN = exports.ACCESS_LOG_RETENTION_DAYS = exports.ADMIN_ROLE = void 0;
exports.isUnlimited = isUnlimited;
exports.clampBillingDay = clampBillingDay;
exports.ADMIN_ROLE = {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
};
exports.ACCESS_LOG_RETENTION_DAYS = 90;
// ── 4-1. 구독 플랜 ──────────────────────────────────────────────
exports.SUBSCRIPTION_PLAN = {
    STARTER: 'starter',
    PRO: 'pro',
};
exports.SUBSCRIPTION_STATUS = {
    TRIAL: 'trial',
    ACTIVE: 'active',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
};
exports.PLAN_PRICE = {
    starter: 10000,
    pro: 15000,
};
exports.PLAN_LIMITS = {
    starter: {
        max_categories: 2,
        max_listings_per_month: 0,
        max_qr_codes: 1,
        max_images_per_listing: 5,
        category_changes_per_month: 1,
    },
    pro: {
        max_categories: 4,
        max_listings_per_month: 0,
        max_qr_codes: 4,
        max_images_per_listing: 20,
        category_changes_per_month: 0,
    },
};
exports.TRIAL_DAYS = 7;
exports.CANCELLED_DATA_RETENTION_DAYS = 30;
function isUnlimited(limit) {
    return limit === 0;
}
function clampBillingDay(day) {
    return Math.min(day, 28);
}
// ── 4-2. 카테고리 코드 ──────────────────────────────────────────
exports.CATEGORY_CODE = {
    RESIDENTIAL: 'residential',
    COMMERCIAL: 'commercial',
    INDUSTRIAL: 'industrial',
    LAND: 'land',
};
exports.CATEGORY_LABELS = {
    residential: '주거용',
    commercial: '상업용',
    industrial: '산업용',
    land: '토지',
};
exports.SUBCATEGORIES = {
    residential: {
        apartment: ['일반아파트', '주상복합', '재건축', '분양권'],
        villa: ['다세대', '연립', '다가구', '도시형생활주택'],
        house: ['도심단독', '전원주택', '한옥', '타운하우스'],
        small: ['원룸', '투룸', '주거용오피스텔', '고시원'],
    },
    commercial: {
        store: ['1층점포', '고층점포', '지하점포', '복합층점포'],
        business_transfer: ['음식점', '서비스업', '소매업', '학원', '전문업종'],
        office: ['프라임오피스', '일반오피스', '소호오피스', '공유오피스'],
        building: ['꼬마빌딩', '근생빌딩', '상가주택', '통빌딩'],
    },
    industrial: {
        factory: ['일반제조', '식품공장', '첨단공장', '화학공장'],
        warehouse: ['일반창고', '냉동창고', '물류센터', '배송센터', '보세창고'],
        knowledge: ['제조사무겸용', 'R&D중심', 'IT특화', '분양형'],
        workshop: ['소형작업장', '자동차관련', '야적장', '특수시설'],
    },
    land: {
        buildable: ['대지', '상업용지', '공업용지', '주거용지'],
        farm: ['전', '답', '과수원', '임야', '재개발예정', '재건축예정'],
        special: ['펜션/모텔', '요양원', '종교시설', '에너지시설', '주차장'],
    },
};
exports.SUBCATEGORY_LABELS = {
    apartment: '아파트',
    villa: '빌라',
    house: '주택',
    small: '소형주거',
    store: '점포/상가',
    business_transfer: '권리양도',
    office: '오피스',
    building: '빌딩',
    factory: '공장',
    warehouse: '창고/물류',
    knowledge: '지식산업센터',
    workshop: '작업장',
    buildable: '건축가능지',
    farm: '농지/임야',
    special: '특수용지',
};
// ── 4-3. 거래 유형 코드 ──────────────────────────────────────────
exports.TRANSACTION_TYPE = {
    SALE: 'sale',
    JEONSE: 'jeonse',
    MONTHLY_RENT: 'monthly_rent',
    PREMIUM_TRANSFER: 'premium_transfer',
};
exports.REQUIRED_PRICE_FIELDS = {
    sale: ['price_sale'],
    jeonse: ['deposit', 'maintenance_fee'],
    monthly_rent: ['deposit', 'monthly_rent', 'maintenance_fee'],
    premium_transfer: ['deposit', 'monthly_rent', 'maintenance_fee',
        'premium_price', 'contract_remaining_months'],
};
// ── 4-4. 상태 코드 ──────────────────────────────────────────────
exports.INQUIRY_STATUS = {
    NEW: 'new',
    CONTACTED: 'contacted',
    VIEWING: 'viewing',
    NEGOTIATING: 'negotiating',
    CONTRACTED: 'contracted',
    CLOSED: 'closed',
};
exports.LISTING_STATUS = {
    ACTIVE: 'active',
    PENDING: 'pending',
    CONTRACTED: 'contracted',
    CLOSED: 'closed',
};
//# sourceMappingURL=constants.js.map