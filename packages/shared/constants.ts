// ── 관리자 역할 ──────────────────────────────────────────────

export const ADMIN_ROLE = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
} as const;

export type AdminRole = typeof ADMIN_ROLE[keyof typeof ADMIN_ROLE];

export const ACCESS_LOG_RETENTION_DAYS = 90;

// ── 4-1. 구독 플랜 ──────────────────────────────────────────────

export const SUBSCRIPTION_PLAN = {
  STARTER: 'starter',
  PRO: 'pro',
} as const;

export const SUBSCRIPTION_STATUS = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export const PLAN_PRICE: Record<string, number> = {
  starter: 10000,
  pro: 15000,
};

export const PLAN_LIMITS = {
  starter: {
    max_categories: 2,
    max_listings_per_month: 0,
    max_qr_codes: 1,
    max_images_per_listing: 5,
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

// ── 4-3. 거래 유형 코드 ──────────────────────────────────────────

export const TRANSACTION_TYPE = {
  SALE:             'sale',
  JEONSE:           'jeonse',
  MONTHLY_RENT:     'monthly_rent',
  PREMIUM_TRANSFER: 'premium_transfer',
} as const;

export type TransactionType = typeof TRANSACTION_TYPE[keyof typeof TRANSACTION_TYPE];

export const PRICE_LABELS: Record<string, string> = {
  price_sale: '매매가 (만원)',
  price_jeonse: '전세금 (만원)',
  deposit: '월세 보증금 (만원)',
  monthly_rent: '월세 (만원)',
  maintenance_fee: '관리비 (만원)',
  premium_price: '권리금 (만원)',
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
