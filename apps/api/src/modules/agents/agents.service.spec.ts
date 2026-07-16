import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AgentsService } from './agents.service';

// crypto.util 모킹
jest.mock('../../common/utils/crypto.util', () => ({
  encryptPhone: jest.fn((v: string) => 'enc_' + v),
  decryptPhone: jest.fn((v: string) => v.replace('enc_', '')),
}));

// Supabase 모킹
const mockSelect = jest.fn().mockReturnThis();
const mockSingle = jest.fn();
const mockUpdate = jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ select: mockSelect }) });

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      update: mockUpdate,
      select: mockSelect,
    }),
  }),
}));

describe('AgentsService', () => {
  let service: AgentsService;

  beforeEach(() => {
    service = new AgentsService();
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    const trialAgent = { id: 'agent-1', subscription_status: 'trial' };
    const activeAgent = { id: 'agent-2', subscription_status: 'active' };

    it('should accept safe profile fields', async () => {
      mockSingle.mockResolvedValue({ data: { agent_name: '테스트' }, error: null });
      // mockUpdate chain returns proper object
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      });

      const dto = { agent_name: '테스트', office_name: '사무소' };
      await expect(service.updateProfile(trialAgent, dto)).resolves.toBeDefined();
    });

    it('should allow subscription_plan for trial agents', async () => {
      mockSingle.mockResolvedValue({ data: { subscription_plan: 'pro' }, error: null });
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      });

      const dto = { subscription_plan: 'pro' as const };
      await expect(service.updateProfile(trialAgent, dto)).resolves.toBeDefined();
    });

    it('should reject subscription_plan for active agents', async () => {
      const dto = { subscription_plan: 'starter' as const };
      await expect(service.updateProfile(activeAgent, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw when no fields to update', async () => {
      const dto = {};
      await expect(service.updateProfile(trialAgent, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('changeCategories', () => {
    const starterAgent = {
      id: 'agent-1',
      subscription_plan: 'starter',
      category_changed_at: null,
    };

    it('should reject empty categories array', async () => {
      await expect(service.changeCategories(starterAgent, [])).rejects.toThrow(BadRequestException);
    });

    it('should reject exceeding max_categories for starter', async () => {
      // Starter max is 2
      await expect(
        service.changeCategories(starterAgent, ['residential', 'commercial', 'industrial']),
      ).rejects.toThrow(BadRequestException);
    });

    it('should enforce monthly change limit for starter', async () => {
      const agentChangedThisMonth = {
        ...starterAgent,
        category_changed_at: new Date().toISOString(),
      };

      await expect(
        service.changeCategories(agentChangedThisMonth, ['residential']),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should accept valid categories', async () => {
      mockSingle.mockResolvedValue({ data: { selected_categories: ['residential'] }, error: null });
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      });

      await expect(
        service.changeCategories(starterAgent, ['residential', 'commercial']),
      ).resolves.toBeDefined();
    });
  });

  describe('getQrCodes', () => {
    it('should always return 5 QRs (1 generic + 4 categories) regardless of selected categories', async () => {
      const agent = {
        subscription_plan: 'starter',
        agent_code: 'ABC123',
        selected_categories: [],
      };

      const result = await service.getQrCodes(agent);
      expect(result).toHaveLength(5);
      expect(result[0].label).toBe('전체');
      expect(result[0].category).toBeNull();
      expect(result[0].url).not.toContain('?cat=');
      
      expect(result[1].url).toContain('?cat=residential');
      expect(result[1].category).toBe('residential');
      expect(result[2].url).toContain('?cat=commercial');
      expect(result[2].category).toBe('commercial');
    });

    it('should return 5 QRs for pro plan as well', async () => {
      const agent = {
        subscription_plan: 'pro',
        agent_code: 'ABC123',
        selected_categories: ['residential', 'commercial'],
      };

      const result = await service.getQrCodes(agent);
      expect(result).toHaveLength(5);
      expect(result[0].label).toBe('전체');
    });
  });

  // ── getPublicProfile ────────────────────────────────────

  describe('getPublicProfile', () => {
    it('phone을 복호화하여 반환', async () => {
      const mockChain: any = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                agent_name: '홍길동',
                office_name: '테스트사무소',
                phone: 'enc_01012345678',
                selected_categories: ['residential'],
                subscription_plan: 'starter',
              },
              error: null,
            }),
          }),
        }),
      };

      (service as any).supabase = { from: jest.fn().mockReturnValue(mockChain) };

      const result = await service.getPublicProfile('ABC123');
      expect(result.phone).toBe('01012345678');
    });

    it('존재하지 않는 중개사 → NotFoundException', async () => {
      const mockChain: any = {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
          }),
        }),
      };

      (service as any).supabase = { from: jest.fn().mockReturnValue(mockChain) };

      await expect(service.getPublicProfile('INVALID')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateProfile phone 암호화 ──────────────────────────

  describe('updateProfile phone encryption', () => {
    it('phone 변경 시 암호화 후 저장', async () => {
      const trialAgent = { id: 'agent-1', subscription_status: 'trial' };
      const localMockUpdate = jest.fn();

      localMockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'agent-1', phone: 'enc_01099998888' },
              error: null,
            }),
          }),
        }),
      });

      (service as any).supabase = {
        from: jest.fn().mockReturnValue({ update: localMockUpdate }),
      };

      await service.updateProfile(trialAgent, { phone: '01099998888' });

      expect(localMockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ phone: 'enc_01099998888' }),
      );
    });

    it('phone이 아닌 필드는 암호화 없이 저장', async () => {
      const trialAgent = { id: 'agent-1', subscription_status: 'trial' };
      const localMockUpdate = jest.fn();

      localMockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'agent-1', agent_name: '새이름' },
              error: null,
            }),
          }),
        }),
      });

      (service as any).supabase = {
        from: jest.fn().mockReturnValue({ update: localMockUpdate }),
      };

      await service.updateProfile(trialAgent, { agent_name: '새이름' });

      expect(localMockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ agent_name: '새이름' }),
      );
      // agent_name에는 'enc_' 접두어가 없어야 함
      expect(localMockUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({ agent_name: expect.stringContaining('enc_') }),
      );
    });
  });
});
