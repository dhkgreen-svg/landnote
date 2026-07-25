import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

export const MATCH_WEIGHTS = {
  category: 0.60,
  price:    0.20,
  area:     0.10,
  location: 0.10,
} as const;

@Injectable()
export class MatchingService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  async runMatching(agentId: string, inquiryId: string) {
    const { data: inquiry, error: iErr } = await this.supabase
      .from('customer_inquiries')
      .select('*')
      .eq('id', inquiryId)
      .eq('agent_id', agentId)
      .single();
    if (iErr || !inquiry) throw new NotFoundException('문의를 찾을 수 없습니다');

    // 💡 유연한 1차 조회: DB SQL 오버랩 강제 차단 대신 에이전트의 전체 활성 매물 조회 후 스마트 스코어링
    let query = this.supabase
      .from('property_listings')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'active');

    const { data: listings, error: lErr } = await query;
    if (lErr) throw new InternalServerErrorException('매물 조회 실패');

    // PostGIS 거리 일괄 계산 (좌표가 있는 경우 RPC 1회 호출)
    const distanceMap = new Map<string, number>();
    if (inquiry.latitude && inquiry.longitude && listings && listings.length > 0) {
      const ids = listings
        .filter((l: any) => l.latitude && l.longitude)
        .map((l: any) => l.id);

      if (ids.length > 0) {
        try {
          const { data: distances } = await this.supabase.rpc('get_listing_distances', {
            p_lat: inquiry.latitude,
            p_lng: inquiry.longitude,
            p_listing_ids: ids,
          });
          for (const d of distances ?? []) {
            distanceMap.set(d.listing_id, d.distance_meters);
          }
        } catch (err) {
          console.warn('RPC get_listing_distances 호출 실패 (거리 계산 폴백 사용):', err);
        }
      }
    }

    const scored = (listings ?? [])
      .map(listing => {
        const breakdown = this.score(inquiry, listing, distanceMap);
        const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
        return { listing, score: total, breakdown };
      })
      .filter(m => m.score >= 0.15) // 💡 0.15점 이상이면 매칭 후보로 매칭함 (유연한 추천)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      await this.supabase.from('matches').upsert(
        scored.map(m => ({
          agent_id: agentId,
          inquiry_id: inquiryId,
          property_id: m.listing.id,
          score: Math.round(m.score * 1000) / 1000,
          score_breakdown: m.breakdown,
        })),
        { onConflict: 'inquiry_id,property_id' },
      );
    }

    return scored;
  }

  async runReverseMatching(agentId: string, listingId: string) {
    const { data: listing, error: lErr } = await this.supabase
      .from('property_listings')
      .select('*')
      .eq('id', listingId)
      .eq('agent_id', agentId)
      .single();
    if (lErr || !listing) throw new NotFoundException('매물을 찾을 수 없습니다');

    // 💡 역방향 유연 조회
    const { data: inquiries, error: iErr } = await this.supabase
      .from('customer_inquiries')
      .select('*')
      .eq('agent_id', agentId)
      .eq('inquiry_type', 'looking_for')
      .neq('status', 'closed');

    if (iErr) throw new InternalServerErrorException('문의 조회 실패');

    const distanceMap = new Map<string, number>();
    if (listing.latitude && listing.longitude && inquiries && inquiries.length > 0) {
      for (const inq of inquiries) {
        if (inq.latitude && inq.longitude) {
          distanceMap.set(inq.id, this.haversineDistance(
            listing.latitude, listing.longitude,
            inq.latitude, inq.longitude,
          ));
        }
      }
    }

    const scored = (inquiries ?? [])
      .map(inquiry => {
        const dMap = new Map<string, number>();
        if (distanceMap.has(inquiry.id)) {
          dMap.set(listing.id, distanceMap.get(inquiry.id)!);
        }
        const breakdown = this.score(inquiry, listing, dMap);
        const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
        return { inquiry, score: total, breakdown };
      })
      .filter(m => m.score >= 0.15)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      await this.supabase.from('matches').upsert(
        scored.map(m => ({
          agent_id: agentId,
          inquiry_id: m.inquiry.id,
          property_id: listing.id,
          score: Math.round(m.score * 1000) / 1000,
          score_breakdown: m.breakdown,
        })),
        { onConflict: 'inquiry_id,property_id' },
      );
    }

    return scored;
  }

  private score(inquiry: any, listing: any, distanceMap: Map<string, number>) {
    const ensureArray = (arr: any) => Array.isArray(arr) ? arr : (typeof arr === 'string' ? [arr] : []);

    const cond = inquiry.detailed_conditions ?? {};
    const bd = { category: 0, price: 0, area: 0, location: 0 };

    // 1. 거래 유형 일치 확인
    let txMultiplier = 1.0;
    const inqTx = ensureArray(inquiry.transaction_types).map((t: string) => t.toLowerCase());
    const listTx = ensureArray(listing.transaction_types).map((t: string) => t.toLowerCase());
    
    if (inqTx.length > 0 && listTx.length > 0) {
      const hasTxMatch = inqTx.some((t: string) => listTx.includes(t));
      if (!hasTxMatch) {
        txMultiplier = 0.6; // 거래유형 가중치 차감
      }
    }

    // 2. 카테고리 세부 및 대분류 일치 확인 (유연 매칭)
    const inqSub = ensureArray(inquiry.subcategory_codes).map((s: string) => s.toLowerCase());
    const listSub = ensureArray(listing.subcategory_codes).map((s: string) => s.toLowerCase());
    const inqTags = ensureArray(inquiry.tags).map((t: string) => t.toLowerCase());
    const listTags = ensureArray(listing.tags).map((t: string) => t.toLowerCase());

    const subcatMatch = inqSub.some((c: string) => listSub.includes(c)) ||
                        inqTags.some((t: string) => listTags.includes(t));

    const inqCat = ensureArray(inquiry.category_codes).map((c: string) => c.toLowerCase());
    const listCat = ensureArray(listing.category_codes).map((c: string) => c.toLowerCase());
    const catMatch = inqCat.some((c: string) => listCat.includes(c));

    if (subcatMatch) {
      bd.category = MATCH_WEIGHTS.category; // 0.60 만점
    } else if (catMatch) {
      bd.category = MATCH_WEIGHTS.category; // 0.60 만점 (카테고리만 일치해도 무조건 뜨도록 만점 부여!)
    } else if (inqCat.length === 0 || listCat.length === 0) {
      bd.category = MATCH_WEIGHTS.category * 0.50; // 카테고리 미지정 시 0.30점 기본 부여
    } else {
      bd.category = MATCH_WEIGHTS.category * 0.25; // 살짝 엇갈려도 0.15점 부여하여 가격/위치 매칭 지원!
    }

    // 3. 가격 (유동성 반영)
    bd.price = this.priceScore(cond, listing) * MATCH_WEIGHTS.price;

    // 4. 면적 (평수 오차 인정)
    if (cond?.area_min && listing.area_exclusive) {
      if (listing.area_exclusive >= cond.area_min) {
        const withinMax = !cond.area_max || listing.area_exclusive <= cond.area_max;
        bd.area = withinMax ? MATCH_WEIGHTS.area : MATCH_WEIGHTS.area * 0.7;
      } else if (listing.area_exclusive >= cond.area_min * 0.7) {
        bd.area = MATCH_WEIGHTS.area * 0.5; // 30% 오차 평형까지 절반 점수 부여
      } else {
        bd.area = MATCH_WEIGHTS.area * 0.2;
      }
    } else {
      bd.area = MATCH_WEIGHTS.area * 0.8; // 면적 조건 미지정 시 0.08 기본 부여
    }

    // 5. 위치: PostGIS 거리 기반 → dong_name 폴백
    const distance = distanceMap.get(listing.id);
    if (distance !== undefined) {
      if (distance <= 1000)      bd.location = MATCH_WEIGHTS.location * 1.5;  // 1km 이내 150% 우대
      else if (distance <= 3000) bd.location = MATCH_WEIGHTS.location * 1.0;  // 3km 이내 만점
      else if (distance <= 5000) bd.location = MATCH_WEIGHTS.location * 0.5;  // 5km 이내
      else                       bd.location = MATCH_WEIGHTS.location * 0.2;
    } else if (cond?.preferred_dong && listing.dong_name) {
      const preferred: string[] = Array.isArray(cond.preferred_dong)
        ? cond.preferred_dong : [cond.preferred_dong];
      const dongMatch = preferred.some((d: string) => listing.dong_name?.includes(d) || d.includes(listing.dong_name));
      if (dongMatch) bd.location = MATCH_WEIGHTS.location;
      else bd.location = MATCH_WEIGHTS.location * 0.3;
    } else {
      bd.location = MATCH_WEIGHTS.location * 0.5; // 위치 미지정 시 기본 점수
    }

    // 거래 유형 불일치 시 전체 점수 배율 조율
    bd.category *= txMultiplier;
    bd.price *= txMultiplier;

    return bd;
  }

  private priceScore(cond: any, listing: any): number {
    let score = 0;
    let checked = 0;

    const calcFlexibleScore = (actual: number, max: number) => {
      if (actual <= max) return 1.0;
      if (actual > max * 2) return 0.0;
      return 1.0 - ((actual - max) / max);
    };

    if (listing.price_sale && cond?.price_max) {
      score += calcFlexibleScore(listing.price_sale, cond.price_max);
      checked++;
    }
    if (listing.monthly_rent && cond?.monthly_rent_max) {
      score += calcFlexibleScore(listing.monthly_rent, cond.monthly_rent_max);
      checked++;
    }
    if (listing.deposit && cond?.deposit_max) {
      score += calcFlexibleScore(listing.deposit, cond.deposit_max);
      checked++;
    }

    if (checked === 0) return 0.8;
    return score / checked;
  }

  /** 매칭이 존재하는 문의 목록 (미검토 우선 정렬) */
  async getInquiriesWithMatches(agentId: string) {
    const { data: matches } = await this.supabase
      .from('matches')
      .select('inquiry_id, shown_count')
      .eq('agent_id', agentId);

    const inquiryMap = new Map<string, { pending: number; total: number }>();
    for (const m of matches ?? []) {
      const entry = inquiryMap.get(m.inquiry_id) ?? { pending: 0, total: 0 };
      entry.total++;
      if (m.shown_count === 0) entry.pending++;
      inquiryMap.set(m.inquiry_id, entry);
    }

    const { data: inquiries } = await this.supabase
      .from('customer_inquiries')
      .select('id, customer_name, inquiry_type, category_codes, transaction_types, detailed_conditions, status, created_at')
      .eq('agent_id', agentId)
      .eq('inquiry_type', 'looking_for')
      .neq('status', 'closed');

    return (inquiries ?? [])
      .map(inq => ({
        ...inq,
        match_count: inquiryMap.get(inq.id)?.total ?? 0,
        pending_count: inquiryMap.get(inq.id)?.pending ?? 0,
      }))
      .sort((a, b) =>
        b.pending_count - a.pending_count ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }

  /** 특정 문의의 매칭 결과 목록 (score DESC, 매물 정보 포함) */
  async getMatchesByInquiry(agentId: string, inquiryId: string) {
    const { data: matches } = await this.supabase
      .from('matches')
      .select('*')
      .eq('agent_id', agentId)
      .eq('inquiry_id', inquiryId)
      .order('score', { ascending: false });

    if (!matches || matches.length === 0) return [];

    const propertyIds = matches.map(m => m.property_id);
    const { data: listings } = await this.supabase
      .from('property_listings')
      .select('id, address_full, dong_name, category_codes, transaction_types, price_sale, deposit, monthly_rent, area_exclusive, floor_current, direction, status')
      .in('id', propertyIds);

    const listingMap = new Map((listings ?? []).map(l => [l.id, l]));

    return matches.map(m => ({
      id: m.id,
      inquiry_id: m.inquiry_id,
      property_id: m.property_id,
      score: m.score,
      score_breakdown: m.score_breakdown,
      is_shown: m.shown_count > 0,
      is_liked: m.is_liked,
      is_contracted: m.is_contracted || false,
      created_at: m.created_at,
      property: listingMap.get(m.property_id) ?? null,
      inquiry: null,
    }));
  }

  /** 매칭이 존재하는 매물 목록 (미검토 우선 정렬) */
  async getListingsWithMatches(agentId: string) {
    const { data: matches } = await this.supabase
      .from('matches')
      .select('property_id, shown_count')
      .eq('agent_id', agentId);

    const listingMap = new Map<string, { pending: number; total: number }>();
    for (const m of matches ?? []) {
      const entry = listingMap.get(m.property_id) ?? { pending: 0, total: 0 };
      entry.total++;
      if (m.shown_count === 0) entry.pending++;
      listingMap.set(m.property_id, entry);
    }

    const { data: listings } = await this.supabase
      .from('property_listings')
      .select('id, address_full, dong_name, category_codes, transaction_types, price_sale, deposit, monthly_rent, area_exclusive, floor_current, direction, status, created_at')
      .eq('agent_id', agentId)
      .eq('status', 'active');

    return (listings ?? [])
      .map(listing => ({
        ...listing,
        match_count: listingMap.get(listing.id)?.total ?? 0,
        pending_count: listingMap.get(listing.id)?.pending ?? 0,
      }))
      .sort((a, b) =>
        b.pending_count - a.pending_count ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }

  /** 특정 매물의 매칭 결과 목록 (score DESC, 고객 정보 포함) */
  async getMatchesByListing(agentId: string, listingId: string) {
    const { data: matches } = await this.supabase
      .from('matches')
      .select('*')
      .eq('agent_id', agentId)
      .eq('property_id', listingId)
      .order('score', { ascending: false });

    if (!matches || matches.length === 0) return [];

    const inquiryIds = matches.map(m => m.inquiry_id);
    const { data: inquiries } = await this.supabase
      .from('customer_inquiries')
      .select('id, customer_name, inquiry_type, category_codes, transaction_types, detailed_conditions, status, created_at')
      .in('id', inquiryIds);

    const inquiryMap = new Map((inquiries ?? []).map(i => [i.id, i]));

    return matches.map(m => ({
      id: m.id,
      inquiry_id: m.inquiry_id,
      property_id: m.property_id,
      score: m.score,
      score_breakdown: m.score_breakdown,
      is_shown: m.shown_count > 0,
      is_liked: m.is_liked,
      is_contracted: m.is_contracted || false,
      created_at: m.created_at,
      property: null,
      inquiry: inquiryMap.get(m.inquiry_id) ?? null,
    }));
  }

  /** 매칭 상태 업데이트 (is_shown / is_liked / is_contracted) */
  async updateMatch(agentId: string, matchId: string, body: { is_shown?: boolean; is_liked?: boolean; is_contracted?: boolean }) {
    const updateData: Record<string, any> = {};
    if (body.is_shown === true) updateData.shown_count = 1;
    if (body.is_shown === false) updateData.shown_count = 0;
    if (body.is_liked !== undefined) updateData.is_liked = body.is_liked;
    if (body.is_contracted !== undefined) updateData.is_contracted = body.is_contracted;

    const { data, error } = await this.supabase
      .from('matches')
      .update(updateData)
      .eq('id', matchId)
      .eq('agent_id', agentId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('매칭을 찾을 수 없습니다');
    return data;
  }

  /** Haversine 공식으로 두 좌표 간 거리(m) 계산 */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const toRad = (v: number) => v * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
