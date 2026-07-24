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

    const { data: listings, error: lErr } = await this.supabase
      .from('property_listings')
      .select('*')
      .eq('agent_id', agentId)
      .eq('status', 'active')
      .overlaps('category_codes', inquiry.category_codes);

    if (lErr) throw new InternalServerErrorException('매물 조회 실패');

    // PostGIS 거리 일괄 계산 (좌표가 있는 경우 RPC 1회 호출)
    const distanceMap = new Map<string, number>();
    if (inquiry.latitude && inquiry.longitude && listings && listings.length > 0) {
      const ids = listings
        .filter((l: any) => l.latitude && l.longitude)
        .map((l: any) => l.id);

      if (ids.length > 0) {
        const { data: distances } = await this.supabase.rpc('get_listing_distances', {
          p_lat: inquiry.latitude,
          p_lng: inquiry.longitude,
          p_listing_ids: ids,
        });
        for (const d of distances ?? []) {
          distanceMap.set(d.listing_id, d.distance_meters);
        }
      }
    }

    const scored = (listings ?? [])
      .map(listing => {
        const breakdown = this.score(inquiry, listing, distanceMap);
        const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
        return { listing, score: total, breakdown };
      })
      .filter(m => m.score >= 0.25)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      await this.supabase.from('matches').upsert(
        scored.map(m => ({
          agent_id: agentId,
          inquiry_id: inquiryId,
          property_id: m.listing.id,
          score: Math.round(m.score * 1000) / 1000,
          score_breakdown: m.breakdown,
          is_shown: false,
          is_liked: false,
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

    const { data: inquiries, error: iErr } = await this.supabase
      .from('customer_inquiries')
      .select('*')
      .eq('agent_id', agentId)
      .eq('inquiry_type', 'looking_for')
      .neq('status', 'completed')
      .overlaps('category_codes', listing.category_codes);

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
      .filter(m => m.score >= 0.25)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      await this.supabase.from('matches').upsert(
        scored.map(m => ({
          agent_id: agentId,
          inquiry_id: m.inquiry.id,
          property_id: listing.id,
          score: Math.round(m.score * 1000) / 1000,
          score_breakdown: m.breakdown,
          is_shown: false,
          is_liked: false,
        })),
        { onConflict: 'inquiry_id,property_id' },
      );
    }

    return scored;
  }

  private score(inquiry: any, listing: any, distanceMap: Map<string, number>) {
    const cond = inquiry.detailed_conditions;
    const bd = { category: 0, price: 0, area: 0, location: 0 };

    // 1. 거래 유형 일치 확인 (필수)
    const txMatch = inquiry.transaction_types?.some((t: string) => listing.transaction_types?.includes(t));
    if (!txMatch) return bd; // 거래 유형이 다르면 0점 처리 (매칭 실패)

    // 2. 카테고리 세부 일치 확인 (tags 필드 사용)
    const subcatMatch = inquiry.tags?.some((c: string) => listing.tags?.includes(c));
    const catMatch = inquiry.category_codes?.some((c: string) => listing.category_codes?.includes(c));

    if (subcatMatch) {
      bd.category = MATCH_WEIGHTS.category; // 세부 종류 일치 시 60점 (만점)
    } else if (catMatch) {
      bd.category = MATCH_WEIGHTS.category * 0.25; // 대분류만 일치 시 15점
    } else {
      return bd; // 카테고리가 아예 다르면 탈락
    }

    // 3. 가격 (유동성 반영)
    bd.price = this.priceScore(cond, listing) * MATCH_WEIGHTS.price;

    // 4. 면적
    if (cond?.area_min && listing.area_exclusive) {
      if (listing.area_exclusive >= cond.area_min) {
        const withinMax = !cond.area_max || listing.area_exclusive <= cond.area_max;
        bd.area = withinMax ? MATCH_WEIGHTS.area : MATCH_WEIGHTS.area * 0.5;
      } else if (listing.area_exclusive >= cond.area_min * 0.8) {
        bd.area = MATCH_WEIGHTS.area * 0.5; // 20% 부족한 평형까지는 절반 점수 부여
      }
    }

    // 위치: PostGIS 거리 기반 → dong_name 폴백
    const distance = distanceMap.get(listing.id);
    if (distance !== undefined) {
      if (distance <= 1000)      bd.location = 0.15;  // 1km 이내
      else if (distance <= 3000) bd.location = 0.10;  // 3km 이내
      else if (distance <= 5000) bd.location = 0.05;  // 5km 이내
    } else if (cond?.preferred_dong && listing.dong_name) {
      const preferred: string[] = Array.isArray(cond.preferred_dong)
        ? cond.preferred_dong : [cond.preferred_dong];
      if (preferred.includes(listing.dong_name)) bd.location = MATCH_WEIGHTS.location;
    }

    return bd;
  }

  private priceScore(cond: any, listing: any): number {
    let score = 0;
    let checked = 0;

    const calcFlexibleScore = (actual: number, max: number) => {
      if (actual <= max) return 1.0;
      if (actual > max * 2) return 0.0;
      // 예산 초과 비율에 따라 1.0에서 0.0으로 선형 감소 (예: 1.5배 초과 시 0.5점)
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

    // 가격 조건이 없으면 매칭을 떨어뜨리지 않기 위해 기본 0.8 부여
    if (checked === 0) return 0.8;
    
    return score / checked;
  }

  /** 매칭이 존재하는 문의 목록 (미검토 우선 정렬) */
  async getInquiriesWithMatches(agentId: string) {
    const { data: matches } = await this.supabase
      .from('matches')
      .select('inquiry_id, is_shown')
      .eq('agent_id', agentId);

    const inquiryMap = new Map<string, { pending: number; total: number }>();
    for (const m of matches ?? []) {
      const entry = inquiryMap.get(m.inquiry_id) ?? { pending: 0, total: 0 };
      entry.total++;
      if (!m.is_shown) entry.pending++;
      inquiryMap.set(m.inquiry_id, entry);
    }

    const inquiryIds = [...inquiryMap.keys()];
    if (inquiryIds.length === 0) return [];

    const { data: inquiries } = await this.supabase
      .from('customer_inquiries')
      .select('id, customer_name, inquiry_type, category_codes, transaction_types, detailed_conditions, status, created_at')
      .eq('agent_id', agentId)
      .in('id', inquiryIds);

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
      is_shown: m.is_shown,
      is_liked: m.is_liked,
      created_at: m.created_at,
      property: listingMap.get(m.property_id) ?? null,
    }));
  }

  /** 매칭이 존재하는 매물 목록 (미검토 우선 정렬) */
  async getListingsWithMatches(agentId: string) {
    const { data: matches } = await this.supabase
      .from('matches')
      .select('property_id, is_shown')
      .eq('agent_id', agentId);

    const listingMap = new Map<string, { pending: number; total: number }>();
    for (const m of matches ?? []) {
      const entry = listingMap.get(m.property_id) ?? { pending: 0, total: 0 };
      entry.total++;
      if (!m.is_shown) entry.pending++;
      listingMap.set(m.property_id, entry);
    }

    const listingIds = [...listingMap.keys()];
    if (listingIds.length === 0) return [];

    const { data: listings } = await this.supabase
      .from('property_listings')
      .select('id, address_full, dong_name, category_codes, transaction_types, price_sale, deposit, monthly_rent, area_exclusive, floor_current, direction, status, created_at')
      .eq('agent_id', agentId)
      .in('id', listingIds);

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
      is_shown: m.is_shown,
      is_liked: m.is_liked,
      created_at: m.created_at,
      inquiry: inquiryMap.get(m.inquiry_id) ?? null,
    }));
  }

  /** 매칭 상태 업데이트 (is_shown / is_liked) */
  async updateMatch(agentId: string, matchId: string, body: { is_shown?: boolean; is_liked?: boolean }) {
    const updateData: Record<string, boolean> = {};
    if (body.is_shown !== undefined) updateData.is_shown = body.is_shown;
    if (body.is_liked !== undefined) updateData.is_liked = body.is_liked;

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
