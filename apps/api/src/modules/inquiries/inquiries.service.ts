import { Injectable, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { encryptPhone, decryptPhone } from '../../common/utils/crypto.util';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';

@Injectable()
export class InquiriesService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  constructor(
    private readonly storageService: StorageService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async sendOtp(phone: string) {
    const code = process.env.NODE_ENV === 'development' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    const { error } = await this.supabase
      .from('customer_otps')
      .insert({
        phone,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (error) throw new Error('인증번호 생성에 실패했습니다');
    
    // TODO: 실제 SMS 발송 로직 연동 (현재는 콘솔에 출력)
    console.log(`[OTP 전송] 수신번호: ${phone}, 인증번호: ${code}`);
    return { success: true };
  }

  async verifyOtp(phone: string, code: string) {
    const { data, error } = await this.supabase
      .from('customer_otps')
      .select('id, expires_at')
      .eq('phone', phone)
      .eq('code', code)
      .eq('verified', false)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      throw new NotFoundException('유효하지 않은 인증번호입니다');
    }

    if (new Date(data.expires_at) < new Date()) {
      throw new Error('인증번호가 만료되었습니다');
    }

    const { error: updateErr } = await this.supabase
      .from('customer_otps')
      .update({ verified: true })
      .eq('id', data.id);

    if (updateErr) throw new Error('인증 처리에 실패했습니다');
    return { success: true };
  }

  async createPublic(agentCode: string, dto: CreateInquiryDto) {
    // 1. agent_code로 중개사 조회
    const { data: agent, error: agentErr } = await this.supabase
      .from('agents')
      .select('id, email, agent_name')
      .eq('agent_code', agentCode)
      .single();

    if (agentErr || !agent) {
      throw new NotFoundException('중개사를 찾을 수 없습니다');
    }

    // OTP 검증 확인 및 사용 처리
    const { data: otpData, error: otpErr } = await this.supabase
      .from('customer_otps')
      .select('id, expires_at')
      .eq('phone', dto.customer_phone)
      .eq('code', dto.otpCode)
      .eq('verified', true)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpErr || !otpData) {
      throw new Error('휴대폰 본인 인증이 완료되지 않았거나 유효하지 않습니다');
    }
    
    // 접수 완료 시 OTP 사용 완료 처리
    await this.supabase
      .from('customer_otps')
      .update({ used: true })
      .eq('id', otpData.id);

    // 2. 전화번호 암호화
    const encryptedPhone = encryptPhone(dto.customer_phone);

    // 3. 가격 필드를 detailed_conditions에 병합
    const priceFields = [
      'price_sale', 'price_jeonse', 'deposit', 'monthly_rent',
      'maintenance_fee', 'premium_price', 'contract_remaining_months',
    ] as const;

    const mergedConditions: Record<string, unknown> = {
      ...(dto.detailed_conditions ?? {}),
    };

    for (const field of priceFields) {
      if (dto[field] !== undefined) {
        mergedConditions[field] = dto[field];
      }
    }

    // 4. customer_inquiries INSERT
    const { data: inquiry, error: insertErr } = await this.supabase
      .from('customer_inquiries')
      .insert({
        agent_id: agent.id,
        inquiry_type: dto.inquiry_type,
        customer_name: dto.customer_name,
        customer_phone: encryptedPhone,
        customer_email: dto.customer_email ?? null,
        category_codes: dto.category_codes,
        subcategory_codes: dto.subcategory_codes ?? [],
        tags: dto.tags ?? [],
        transaction_types: dto.transaction_types,
        detailed_conditions: mergedConditions,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        complex_name: dto.complex_name ?? null,
        building_num: dto.building_num ?? null,
        room_num: dto.room_num ?? null,
        area_max: dto.area_max ?? null,
        area_land: dto.area_land ?? null,
        area_building: dto.area_building ?? null,
        area_contract: dto.area_contract ?? null,
        status: 'new',
        images: [],
      })
      .select('id')
      .single();

    if (insertErr || !inquiry) {
      throw new Error(`접수 저장 실패: ${insertErr?.message}`);
    }

    // 5. 이메일 알림
    try {
      await this.emailService.sendNewInquiry(
        { email: agent.email, agent_name: agent.agent_name },
        inquiry.id,
      );
    } catch {
      // 이메일 실패는 접수 자체를 실패시키지 않음
    }

    // 6. 푸시 알림 (비차단)
    try {
      await this.notificationsService.sendPush(agent.id, {
        title: '새로운 문의가 접수되었습니다',
        body: `${dto.customer_name}님이 조건을 접수했습니다`,
        url: `/dashboard/inquiries/${inquiry.id}`,
      });
    } catch {
      // 푸시 실패는 접수 자체를 실패시키지 않음
    }

    // 7. 결과 반환
    return { inquiryId: inquiry.id };
  }

  async list(agentId: string, query: any) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let qb = this.supabase
      .from('customer_inquiries')
      .select('*', { count: 'exact' })
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (query.status) {
      qb = qb.eq('status', query.status);
    }
    if (query.inquiry_type) {
      qb = qb.eq('inquiry_type', query.inquiry_type);
    }
    if (query.category_code) {
      qb = qb.contains('category_codes', [query.category_code]);
    }

    const { data, error, count } = await qb;
    if (error) throw new Error(error.message);

    const items = (data ?? []).map(row => ({
      ...row,
      customer_phone: row.customer_phone ? decryptPhone(row.customer_phone) : null,
    }));

    return {
      items,
      total: count ?? 0,
      page,
      limit,
    };
  }

  async detail(agentId: string, id: string) {
    const { data, error } = await this.supabase
      .from('customer_inquiries')
      .select('*')
      .eq('id', id)
      .eq('agent_id', agentId)
      .single();

    if (error || !data) {
      throw new NotFoundException('접수를 찾을 수 없습니다');
    }

    const images = await this.storageService.attachSignedUrls(data.images ?? []);

    return {
      ...data,
      customer_phone: data.customer_phone ? decryptPhone(data.customer_phone) : null,
      images,
    };
  }

  async update(agentId: string, id: string, dto: UpdateInquiryDto) {
    const { data, error } = await this.supabase
      .from('customer_inquiries')
      .update(dto)
      .eq('id', id)
      .eq('agent_id', agentId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException('접수를 찾을 수 없습니다');
    }

    return data;
  }

  async remove(agentId: string, id: string) {
    // 이미지 파일 정리
    const { data: inquiry } = await this.supabase
      .from('customer_inquiries')
      .select('images')
      .eq('id', id)
      .eq('agent_id', agentId)
      .single();

    if (inquiry?.images?.length) {
      const paths = (inquiry.images as { path: string }[]).map(img => img.path);
      await this.supabase.storage.from('landnote-media').remove(paths);
    }

    const { error } = await this.supabase
      .from('customer_inquiries')
      .delete()
      .eq('id', id)
      .eq('agent_id', agentId);

    if (error) throw new Error(error.message);

    return { deleted: true };
  }
}
