import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { StorageService } from '../storage/storage.service';
import { MatchingService } from '../matching/matching.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@Injectable()
export class ListingsService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  constructor(
    private readonly storageService: StorageService,
    private readonly matchingService: MatchingService,
  ) {}

  async create(agent: any, dto: CreateListingDto) {

    const insertData: Record<string, unknown> = {
      agent_id: agent.id,
      category_codes: dto.category_codes,
      subcategory_codes: dto.subcategory_codes ?? [],
      tags: dto.tags ?? [],
      transaction_types: dto.transaction_types,
      address_full: dto.address_full ?? null,
      address_road: dto.address_road ?? null,
      address_jibun: dto.address_jibun ?? null,
      dong_name: dto.dong_name ?? null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      complex_name: dto.complex_name ?? null,
      building_num: dto.building_num ?? null,
      room_num: dto.room_num ?? null,
      price_sale: dto.price_sale ?? null,
      price_jeonse: dto.price_jeonse ?? null,
      deposit: dto.deposit ?? null,
      monthly_rent: dto.monthly_rent ?? null,
      maintenance_fee: dto.maintenance_fee ?? null,
      premium_price: dto.premium_price ?? null,
      contract_remaining_months: dto.contract_remaining_months ?? null,
      premium_floor: dto.premium_floor ?? null,
      premium_facility: dto.premium_facility ?? null,
      premium_business: dto.premium_business ?? null,
      area_supply: dto.area_supply ?? null,
      area_exclusive: dto.area_exclusive ?? null,
      area_land: dto.area_land ?? null,
      area_building: dto.area_building ?? null,
      area_contract: dto.area_contract ?? null,
      floor_current: dto.floor_current ?? null,
      floor_total: dto.floor_total ?? null,
      built_year: dto.built_year ?? null,
      direction: dto.direction ?? null,
      detail_info: dto.detail_info ?? {},
      agent_memo: dto.agent_memo ?? null,
      source_inquiry_id: dto.source_inquiry_id ?? null,
      images: [],
      status: 'active',
    };

    const { data, error } = await this.supabase
      .from('property_listings')
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      throw new BadRequestException(`매물 등록 실패: ${error?.message}`);
    }

    // 백그라운드로 역방향 매칭 실행 (새 매물 -> 기존 고객 접수)
    this.matchingService.runReverseMatching(agent.id, data.id).catch((err) => {
      console.error(`역방향 매칭 실패 (Agent: ${agent.id}, Listing: ${data.id}):`, err);
    });

    return data;
  }

  async list(agentId: string, query: any) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let qb = this.supabase
      .from('property_listings')
      .select('*', { count: 'exact' })
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (query.status) {
      qb = qb.eq('status', query.status);
    }
    if (query.category_code) {
      qb = qb.contains('category_codes', [query.category_code]);
    }
    if (query.transaction_type) {
      qb = qb.contains('transaction_types', [query.transaction_type]);
    }

    const { data, error, count } = await qb;
    if (error) throw new BadRequestException(error.message);

    return {
      items: data ?? [],
      total: count ?? 0,
      page,
      limit,
    };
  }

  async detail(agentId: string, id: string) {
    const { data, error } = await this.supabase
      .from('property_listings')
      .select('*')
      .eq('id', id)
      .eq('agent_id', agentId)
      .single();

    if (error || !data) {
      throw new NotFoundException('매물을 찾을 수 없습니다');
    }

    const images = await this.storageService.attachSignedUrls(data.images ?? []);

    return { ...data, images };
  }

  async update(agentId: string, id: string, dto: UpdateListingDto) {
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        if (key === 'owner_phone' && value === null) {
          updates[key] = '';
        } else {
          updates[key] = value;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('변경할 필드가 없습니다');
    }

    const { data, error } = await this.supabase
      .from('property_listings')
      .update(updates)
      .eq('id', id)
      .eq('agent_id', agentId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw new BadRequestException(`DB 수정 실패: ${error.message}`);
    }
    
    if (!data) {
      throw new NotFoundException('매물을 찾을 수 없습니다');
    }

    // 변경 시 자동으로 매칭 점수 재계산 (비차단)
    try {
      if (data.status === 'active') {
        await this.matchingService.runReverseMatching(agentId, id);
      }
    } catch (e) {
      console.error('역방향 매칭 실행 실패:', e);
      // 매칭 실패는 업데이트 자체를 실패시키지 않음
    }

    return data;
  }

  async remove(agentId: string, id: string) {
    const { data: listing } = await this.supabase
      .from('property_listings')
      .select('images')
      .eq('id', id)
      .eq('agent_id', agentId)
      .single();

    if (!listing) {
      throw new NotFoundException('매물을 찾을 수 없습니다');
    }

    if (listing.images?.length) {
      const paths = (listing.images as { path: string }[]).map(img => img.path);
      await this.supabase.storage.from('landnote-media').remove(paths);
    }

    const { error } = await this.supabase
      .from('property_listings')
      .delete()
      .eq('id', id)
      .eq('agent_id', agentId);

    if (error) throw new BadRequestException(error.message);

    return { deleted: true };
  }

  async getImages(agentId: string, id: string): Promise<{ path: string; is_representative: boolean }[]> {
    const { data, error } = await this.supabase
      .from('property_listings')
      .select('images')
      .eq('id', id)
      .eq('agent_id', agentId)
      .single();

    if (error || !data) {
      throw new NotFoundException('매물을 찾을 수 없습니다');
    }

    return data.images ?? [];
  }
}
