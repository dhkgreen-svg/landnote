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
    it('카테고리 매치 시 0.30', () => {
      const inquiry = { category_codes: ['residential'], detailed_conditions: {} };
      const listing = { category_codes: ['residential', 'commercial'] };
      const result = score(inquiry, listing);
      expect(result.category).toBe(MATCH_WEIGHTS.category); // 0.30
    });

    it('카테고리 불일치 시 0', () => {
      const inquiry = { category_codes: ['residential'], detailed_conditions: {} };
      const listing = { category_codes: ['commercial'] };
      const result = score(inquiry, listing);
      expect(result.category).toBe(0);
    });
  });

  // ── 가격 스코어링 ─────────────────────────────────────────

  describe('가격 스코어링 (priceScore)', () => {
    it('매매가 ≤90% max → 1.0', () => {
      const result = priceScore({ price_max: 50000 }, { price_sale: 40000 });
      expect(result).toBe(1.0);
    });

    it('매매가 > max → 0', () => {
      const result = priceScore({ price_max: 50000 }, { price_sale: 60000 });
      expect(result).toBe(0);
    });

    it('매매가 = max (100%) → 감소된 점수 (0 < score < 1)', () => {
      const result = priceScore({ price_max: 50000 }, { price_sale: 50000 });
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });

    it('월세 범위 내 → 1.0', () => {
      const result = priceScore({ monthly_rent_max: 100 }, { monthly_rent: 80 });
      expect(result).toBe(1.0);
    });

    it('월세 범위 초과 → 0', () => {
      const result = priceScore({ monthly_rent_max: 100 }, { monthly_rent: 150 });
      expect(result).toBe(0);
    });

    it('보증금 범위 내 → 1.0', () => {
      const result = priceScore({ deposit_max: 5000 }, { deposit: 3000 });
      expect(result).toBe(1.0);
    });

    it('가격 조건 없음 → 0.3 (기본값)', () => {
      const result = priceScore({}, { price_sale: 50000 });
      expect(result).toBe(0.3);
    });
  });

  // ── 면적 스코어링 ─────────────────────────────────────────

  describe('면적 스코어링', () => {
    it('면적 범위 내 (min ≤ area ≤ max) → MATCH_WEIGHTS.area', () => {
      const inquiry = {
        category_codes: ['residential'],
        detailed_conditions: { area_min: 50, area_max: 100 },
      };
      const listing = {
        category_codes: ['residential'],
        area_exclusive: 70,
      };
      const result = score(inquiry, listing);
      expect(result.area).toBe(MATCH_WEIGHTS.area); // 0.20
    });

    it('면적 min 충족 + max 초과 → MATCH_WEIGHTS.area * 0.5', () => {
      const inquiry = {
        category_codes: ['residential'],
        detailed_conditions: { area_min: 50, area_max: 80 },
      };
      const listing = {
        category_codes: ['residential'],
        area_exclusive: 90,
      };
      const result = score(inquiry, listing);
      expect(result.area).toBe(MATCH_WEIGHTS.area * 0.5); // 0.10
    });

    it('면적 min 미달 → 0', () => {
      const inquiry = {
        category_codes: ['residential'],
        detailed_conditions: { area_min: 50 },
      };
      const listing = {
        category_codes: ['residential'],
        area_exclusive: 30,
      };
      const result = score(inquiry, listing);
      expect(result.area).toBe(0);
    });
  });

  // ── 위치 스코어링 ─────────────────────────────────────────

  describe('위치 스코어링', () => {
    it('dong_name 매치 → MATCH_WEIGHTS.location (0.15)', () => {
      const inquiry = {
        category_codes: ['residential'],
        detailed_conditions: { preferred_dong: '역삼동' },
      };
      const listing = {
        category_codes: ['residential'],
        dong_name: '역삼동',
      };
      const result = score(inquiry, listing);
      expect(result.location).toBe(MATCH_WEIGHTS.location); // 0.15
    });

    it('dong_name 불일치 → 0', () => {
      const inquiry = {
        category_codes: ['residential'],
        detailed_conditions: { preferred_dong: '역삼동' },
      };
      const listing = {
        category_codes: ['residential'],
        dong_name: '서초동',
      };
      const result = score(inquiry, listing);
      expect(result.location).toBe(0);
    });

    it('PostGIS 거리 1km 이내 → 0.15', () => {
      const inquiry = {
        category_codes: ['residential'],
        detailed_conditions: {},
      };
      const listing = { id: 'l1', category_codes: ['residential'] };
      const distanceMap = new Map([['l1', 800]]);
      const result = score(inquiry, listing, distanceMap);
      expect(result.location).toBe(0.15);
    });

    it('PostGIS 거리 3km 이내 → 0.10', () => {
      const inquiry = {
        category_codes: ['residential'],
        detailed_conditions: {},
      };
      const listing = { id: 'l1', category_codes: ['residential'] };
      const distanceMap = new Map([['l1', 2500]]);
      const result = score(inquiry, listing, distanceMap);
      expect(result.location).toBe(0.10);
    });
  });

  // ── 종합 ──────────────────────────────────────────────────

  describe('종합 스코어링', () => {
    it('모든 조건 매치 → 총점 > 0.6', () => {
      const inquiry = {
        category_codes: ['residential'],
        detailed_conditions: {
          price_max: 50000,
          area_min: 50, area_max: 100,
          preferred_dong: '역삼동',
        },
      };
      const listing = {
        category_codes: ['residential'],
        price_sale: 40000,
        area_exclusive: 70,
        dong_name: '역삼동',
      };
      const result = score(inquiry, listing);
      const total = (Object.values(result) as number[]).reduce((a, b) => a + b, 0);
      expect(total).toBeGreaterThanOrEqual(0.6);
    });

    it('카테고리만 매치 → 총점 < 0.6 (필터링됨)', () => {
      const inquiry = {
        category_codes: ['residential'],
        detailed_conditions: { price_max: 50000 },
      };
      const listing = {
        category_codes: ['residential'],
        price_sale: 60000, // 초과
      };
      const result = score(inquiry, listing);
      const total = (Object.values(result) as number[]).reduce((a, b) => a + b, 0);
      expect(total).toBeLessThan(0.6);
    });
  });
});
