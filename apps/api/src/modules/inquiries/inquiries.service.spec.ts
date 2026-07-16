import { NotFoundException } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';

// ── crypto.util 모킹 ───────────────────────────────────────────
jest.mock('../../common/utils/crypto.util', () => ({
  encryptPhone: jest.fn((v: string) => 'enc_' + v),
  decryptPhone: jest.fn((v: string) => v.replace('enc_', '')),
}));

// ── Supabase 모킹 ──────────────────────────────────────────────
const mockSingle = jest.fn();
const mockInsert = jest.fn();
const mockDelete = jest.fn();
const mockUpdate = jest.fn();
const mockSelect = jest.fn();
const mockStorageRemove = jest.fn().mockResolvedValue({});

// 쿼리 빌더 체이닝을 위한 유틸
function chainable(overrides: Record<string, any> = {}) {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: mockSingle,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    ...overrides,
  };
  // select with count 지원
  chain.select.mockReturnValue(chain);
  return chain;
}

const mockFrom = jest.fn().mockImplementation(() => chainable());

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
    storage: { from: () => ({ remove: mockStorageRemove }) },
  }),
}));

// ── DI 의존성 모킹 ─────────────────────────────────────────────
const mockStorageService = {
  attachSignedUrls: jest.fn((images: any[]) =>
    images.map(img => ({ ...img, signed_url: 'https://signed/' + img.path })),
  ),
};

const mockEmailService = {
  sendNewInquiry: jest.fn(),
};

const mockNotificationsService = {
  sendPush: jest.fn(),
};

describe('InquiriesService', () => {
  let service: InquiriesService;

  beforeEach(() => {
    service = new InquiriesService(
      mockStorageService as any,
      mockEmailService as any,
      mockNotificationsService as any,
    );
    jest.clearAllMocks();
    mockUpdate.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }), // fallback
      }),
    });
  });

  // ── createPublic ──────────────────────────────────────────

  describe('createPublic', () => {
    const baseDto: any = {
      inquiry_type: 'looking_for',
      customer_name: '홍길동',
      customer_phone: '010-1234-5678',
      category_codes: ['residential'],
      transaction_types: ['sale'],
      detailed_conditions: {},
    };

    it('존재하지 않는 agentCode → NotFoundException', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

      await expect(service.createPublic('INVALID', baseDto)).rejects.toThrow(NotFoundException);
    });

    it('정상 생성 → encryptPhone + inquiryId 반환', async () => {
      // agent 조회 성공
      mockSingle
        .mockResolvedValueOnce({ data: { id: 'agent-1', email: 'a@b.com', agent_name: '김중개' }, error: null })
        // otp 검증 성공
        .mockResolvedValueOnce({ data: { id: 'otp-1', expires_at: new Date(Date.now() + 10000).toISOString() }, error: null })
        // inquiry insert 성공
        .mockResolvedValueOnce({ data: { id: 'inquiry-1' }, error: null });

      // insert chain 설정
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: mockSingle,
        }),
      });

      const result = await service.createPublic('A1234', baseDto);

      expect(result).toEqual({ inquiryId: 'inquiry-1' });
      // encryptPhone이 호출되었는지 확인
      const { encryptPhone } = require('../../common/utils/crypto.util');
      expect(encryptPhone).toHaveBeenCalledWith('010-1234-5678');
    });

    it('가격 필드가 detailed_conditions에 병합', async () => {
      const dto = {
        ...baseDto,
        inquiry_type: 'listing',
        price_sale: 50000,
        deposit: 1000,
        detailed_conditions: { memo: '급매' },
      };

      mockSingle
        .mockResolvedValueOnce({ data: { id: 'agent-1', email: 'a@b.com', agent_name: '김중개' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'otp-1', expires_at: new Date(Date.now() + 10000).toISOString() }, error: null })
        .mockResolvedValueOnce({ data: { id: 'inquiry-2' }, error: null });

      mockInsert.mockImplementation((data: any) => {
        // 병합된 조건 검증
        expect(data.detailed_conditions).toEqual(
          expect.objectContaining({ memo: '급매', price_sale: 50000, deposit: 1000 }),
        );
        return {
          select: jest.fn().mockReturnValue({ single: mockSingle }),
        };
      });

      await service.createPublic('A1234', dto);
    });

    it('이메일 발송 실패해도 접수 성공', async () => {
      mockSingle
        .mockResolvedValueOnce({ data: { id: 'agent-1', email: 'a@b.com', agent_name: '김중개' }, error: null })
        .mockResolvedValueOnce({ data: { id: 'otp-1', expires_at: new Date(Date.now() + 10000).toISOString() }, error: null })
        .mockResolvedValueOnce({ data: { id: 'inquiry-3' }, error: null });

      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({ single: mockSingle }),
      });

      mockEmailService.sendNewInquiry.mockRejectedValue(new Error('SMTP 오류'));

      const result = await service.createPublic('A1234', baseDto);
      expect(result.inquiryId).toBe('inquiry-3');
    });
  });

  // ── detail ────────────────────────────────────────────────

  describe('detail', () => {
    it('전화번호 복호화 + signed URL 첨부', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'inq-1',
          customer_phone: 'enc_010-1111-2222',
          images: [{ path: 'img/test.jpg', uploaded_at: '2026-01-01' }],
        },
        error: null,
      });

      const result = await service.detail('agent-1', 'inq-1');

      expect(result.customer_phone).toBe('010-1111-2222');
      expect(mockStorageService.attachSignedUrls).toHaveBeenCalled();
      expect(result.images[0].signed_url).toContain('https://signed/');
    });

    it('존재하지 않는 문의 → NotFoundException', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

      await expect(service.detail('agent-1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ────────────────────────────────────────────────

  describe('update', () => {
    it('유효한 필드로 업데이트 (status, priority, agent_memo)', async () => {
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'inq-1', status: 'contacted' },
                error: null,
              }),
            }),
          }),
        }),
      });

      // DTO + ValidationPipe가 controller 단에서 비허용 필드를 제거하므로,
      // 서비스는 유효한 필드만 전달받는다고 가정
      const dto = { status: 'contacted', priority: 3, agent_memo: '메모' };
      const result = await service.update('agent-1', 'inq-1', dto);

      expect(result.status).toBe('contacted');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'contacted', priority: 3, agent_memo: '메모' }),
      );
    });
  });

  // ── remove ────────────────────────────────────────────────

  describe('remove', () => {
    it('이미지 있으면 Storage 정리 후 삭제', async () => {
      // 이미지 조회
      mockSingle.mockResolvedValueOnce({
        data: { images: [{ path: 'agents/a1/inquiries/i1/test.jpg' }] },
        error: null,
      });

      // 삭제 성공
      mockDelete.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await service.remove('agent-1', 'inq-1');

      expect(mockStorageRemove).toHaveBeenCalledWith(['agents/a1/inquiries/i1/test.jpg']);
    });
  });
});
