import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PLAN_LIMITS, CATEGORY_LABELS } from '@landnote/shared';
import type { CategoryCode } from '@landnote/shared';
import { encryptPhone, decryptPhone } from '../../common/utils/crypto.util';

@Injectable()
export class AgentsService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  async updateProfile(agent: any, dto: import('./dto/update-agent-profile.dto').UpdateAgentProfileDto) {
    // subscription_plan 변경은 trial 상태 에이전트만 허용 (온보딩 플랜 선택)
    // 활성 에이전트의 플랜 변경은 /billing/plan 엔드포인트 경유 필수
    if (dto.subscription_plan !== undefined) {
      if (agent.subscription_status !== 'trial') {
        throw new ForbiddenException('플랜 변경은 결제 메뉴에서 진행해주세요');
      }
    }

    // DTO + allowlist 이중 방어: 안전한 필드만 업데이트
    const safeFields = ['agent_name', 'phone', 'office_name', 'profile_image_url', 'subscription_plan', 'license_number'] as const;
    const updates: Record<string, unknown> = {};
    for (const field of safeFields) {
      if (dto[field] !== undefined) {
        updates[field] = field === 'phone' ? encryptPhone(dto[field] as string) : dto[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('변경할 필드가 없습니다');
    }

    const { data, error } = await this.supabase
      .from('agents')
      .update(updates)
      .eq('id', agent.id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async changeCategories(agent: any, newCategories: string[]) {
    if (!newCategories || newCategories.length < 1) {
      throw new BadRequestException('최소 1개 분야를 선택해야 합니다');
    }

    const limits = PLAN_LIMITS[agent.subscription_plan as 'starter' | 'pro'];

    if (newCategories.length > limits.max_categories) {
      throw new BadRequestException(`최대 ${limits.max_categories}개까지만 선택 가능합니다`);
    }

    if (limits.category_changes_per_month > 0 && agent.category_changed_at) {
      const lastChanged = new Date(agent.category_changed_at);
      const now = new Date();
      const sameMonth =
        lastChanged.getFullYear() === now.getFullYear() &&
        lastChanged.getMonth() === now.getMonth();
      if (sameMonth) {
        throw new ForbiddenException('스타터 플랜은 카테고리를 월 1회만 변경할 수 있습니다');
      }
    }

    const { data, error } = await this.supabase.from('agents').update({
      selected_categories: newCategories,
      category_changed_at: new Date().toISOString(),
    }).eq('id', agent.id).select().single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getQrCodes(agent: any) {
    const baseUrl = process.env.APP_URL ?? 'http://localhost:3000';

    const qrCodes: { url: string; label: string; category: CategoryCode | null }[] = [
      {
        url: `${baseUrl}/form/${agent.agent_code}`,
        label: '전체',
        category: null,
      }
    ];

    const allCategories: CategoryCode[] = ['residential', 'commercial', 'industrial', 'land'];
    
    allCategories.forEach(cat => {
      qrCodes.push({
        url: `${baseUrl}/form/${agent.agent_code}?cat=${cat}`,
        label: CATEGORY_LABELS[cat] ?? cat,
        category: cat,
      });
    });

    return qrCodes;
  }

  async getPublicProfile(agentCode: string) {
    const { data: agent, error } = await this.supabase
      .from('agents')
      .select('agent_name, office_name, phone, selected_categories, subscription_plan')
      .eq('agent_code', agentCode)
      .single();

    if (error || !agent) {
      throw new NotFoundException('중개사를 찾을 수 없습니다');
    }

    // phone 복호화 (공개 API이므로 JwtAuthGuard 미경유)
    if (agent.phone) {
      try { agent.phone = decryptPhone(agent.phone); } catch { /* 이미 평문인 경우 무시 */ }
    }

    return agent;
  }
}
