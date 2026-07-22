import { MatchingService, MATCH_WEIGHTS } from './matching.service';

// ── Supabase 모킹 ──────────────────────────────────────────────
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    }),
    rpc: jest.fn().mockResolvedValue({ data: [] }),
  }),
}));

describe('MatchingService', () => {
  let service: MatchingService;

  beforeEach(() => {
    service = new MatchingService();
  });

  // private 메서드에 직접 접근
  const score = (inquiry: any, listing: any, distanceMap = new Map<string, number>()) =>
    (service as any).score(inquiry, listing, distanceMap);

  const priceScore = (cond: any, listing: any) =>
    (service as any).priceScore(cond, listing);

  // ── 카테고리 스코어링 ─────────────────────────────────────

  describe('카테고리 스코어링', () => {
    it('거래 유형 불일치 시 카테고리 점수 포함 전체 0점', () => {
      const inquiry = {
        transaction_types: ['sale'],
        category_codes: ['residential'],
        detailed_conditions: {},
      };
      const listing = {
        transaction_types: ['monthly_rent'],
        category_codes: ['residential'],
      };
      const result = score(inquiry, listing);
      expect(result.category).toBe(0);
    });

    it('세부 카테고리 일치 시 40점 (전액)', () => {
      const inquiry = {
        transaction_types: ['monthly_rent'],
        category_codes: ['residential'],
        subcategory_codes: ['one_room'],
        detailed_conditions: {},
      };
      const listing = {
        transaction_types: ['monthly_rent'],
        category_codes: ['residential'],
        subcategory_codes: ['one_room'],
      };
      const result = score(inquiry, listing);
      expect(result.category).toBe(MATCH_WEIGHTS.category); // 0.40
    });

    it('대분류만 일치 시 절반 점수', () => {
      const inquiry = {
        transaction_types: ['monthly_rent'],
        category_codes: ['residential'],
        subcategory_codes: ['one_room'],
        detailed_conditions: {},
      };
      const listing = {
        transaction_types: ['monthly_rent'],
        category_codes: ['residential'],
        subcategory_codes: ['apartment'],
      };
      const result = score(inquiry, listing);
      expect(result.category).toBe(MATCH_WEIGHTS.category * 0.5); // 0.20
    });
  });

  // ── 가격 스코어링 ─────────────────────────────────────────

  describe('가격 스코어링 (priceScore)', () => {
    it('매매가 <= max → 1.0', () => {
      const result = priceScore({ price_max: 50000 }, { price_sale: 40000 });
      expect(result).toBe(1.0);
    });

    it('매매가 > max * 2 → 0', () => {
      const result = priceScore({ price_max: 50000 }, { price_sale: 110000 });
      expect(result).toBe(0.0);
    });

    it('매매가 약간 초과 시 감소된 점수 (0 < score < 1)', () => {
      const result = priceScore({ price_max: 50000 }, { price_sale: 60000 }); // 1.2배
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });

    it('가격 조건 없음 → 0.8 (기본값)', () => {
      const result = priceScore({}, { price_sale: 50000 });
      expect(result).toBe(0.8);
    });
  });

  // ── 면적 스코어링 ─────────────────────────────────────────

  describe('면적 스코어링', () => {
    it('면적 범위 내 (min ≤ area ≤ max) → MATCH_WEIGHTS.area', () => {
      const inquiry = {
        transaction_types: ['monthly_rent'],
        category_codes: ['residential'],
        detailed_conditions: { area_min: 50, area_max: 100 },
      };
      const listing = {
        transaction_types: ['monthly_rent'],
        category_codes: ['residential'],
        area_exclusive: 70,
      };
      const result = score(inquiry, listing);
      expect(result.area).toBe(MATCH_WEIGHTS.area);
    });

    it('면적 20% 부족까지는 절반 점수 부여', () => {
      const inquiry = {
        transaction_types: ['monthly_rent'],
        category_codes: ['residential'],
        detailed_conditions: { area_min: 100, area_max: 200 },
      };
      const listing = {
        transaction_types: ['monthly_rent'],
        category_codes: ['residential'],
        area_exclusive: 90, // 100의 90%이므로 0.8배(80) 이상
      };
      const result = score(inquiry, listing);
      expect(result.area).toBe(MATCH_WEIGHTS.area * 0.5);
    });

    it('면적 min의 80% 미만 → 0점', () => {
      const inquiry = {
        transaction_types: ['monthly_rent'],
        category_codes: ['residential'],
        detailed_conditions: { area_min: 100, area_max: 200 },
      };
      const listing = {
        transaction_types: ['monthly_rent'],
        category_codes: ['residential'],
        area_exclusive: 70, // 80% 미만
      };
      const result = score(inquiry, listing);
      expect(result.area).toBe(0);
    });
  });

  // ── 종합 스코어링 ─────────────────────────────────────────

  describe('종합 스코어링', () => {
    it('모든 조건 매치 → 총점 > 0.6', () => {
      const inquiry = {
        transaction_types: ['monthly_rent'],
        category_codes: ['residential'],
        subcategory_codes: ['one_room'],
        detailed_conditions: { price_max: 50000, area_min: 50, preferred_dong: '역삼동' },
      };
      const listing = {
        id: 'l1',
        transaction_types: ['monthly_rent'],
        category_codes: ['residential'],
        subcategory_codes: ['one_room'],
        price_sale: 40000,
        area_exclusive: 60,
        dong_name: '역삼동',
      };
      const result = score(inquiry, listing);
      const total = (Object.values(result) as number[]).reduce((a, b) => a + b, 0);
      expect(total).toBeGreaterThanOrEqual(0.6);
    });
  });
});
