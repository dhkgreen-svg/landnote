import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ListingsService } from './listings.service';

// ── Supabase 모킹 ──────────────────────────────────────────────
const mockSingle = jest.fn();
const mockInsert = jest.fn();
const mockDelete = jest.fn();
const mockUpdate = jest.fn();
const mockSelect = jest.fn();
const mockStorageRemove = jest.fn().mockResolvedValue({});

function chainable() {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: mockSingle,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  };
  chain.select.mockReturnValue(chain);
  return chain;
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: jest.fn().mockImplementation(() => chainable()),
    storage: { from: () => ({ remove: mockStorageRemove }) },
  }),
}));

// ── StorageService 모킹 ────────────────────────────────────────
const mockStorageService = {
  attachSignedUrls: jest.fn((images: any[]) =>
    images.map(img => ({ ...img, signed_url: 'https://signed/' + img.path })),
  ),
};

const mockMatchingService = {
  runReverseMatching: jest.fn().mockResolvedValue([]),
};

describe('ListingsService', () => {
  let service: ListingsService;

  beforeEach(() => {
    service = new ListingsService(
      mockStorageService as any,
      mockMatchingService as any,
    );
    jest.clearAllMocks();
  });

  // ── create ────────────────────────────────────────────────

  describe('create', () => {
    it('매물 등록 성공 및 역방향 매칭 백그라운드 호출', async () => {
      mockInsert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'listing-1' },
            error: null,
          }),
        }),
      });

      const dto: any = { category_codes: ['residential'], transaction_types: ['sale'] };
      const agent = { id: 'agent-1' };
      
      const result = await service.create(agent, dto);
      expect(result.id).toBe('listing-1');
      expect(mockMatchingService.runReverseMatching).toHaveBeenCalledWith('agent-1', 'listing-1');
    });
  });

  // ── detail ────────────────────────────────────────────────

  describe('detail', () => {
    it('signed URL 첨부', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'l1',
          images: [{ path: 'img/a.jpg', is_representative: true, uploaded_at: '2026-01-01' }],
        },
        error: null,
      });

      const result = await service.detail('agent-1', 'l1');

      expect(mockStorageService.attachSignedUrls).toHaveBeenCalled();
      expect(result.images[0].signed_url).toContain('https://signed/');
    });

    it('존재하지 않는 매물 → NotFoundException', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

      await expect(service.detail('agent-1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ────────────────────────────────────────────────

  describe('update', () => {
    it('유효한 필드로 업데이트', async () => {
      mockUpdate.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'l1', status: 'contracted' },
                error: null,
              }),
            }),
          }),
        }),
      });

      // DTO + ValidationPipe가 controller 단에서 비허용 필드를 제거하므로,
      // 서비스는 유효한 필드만 전달받는다고 가정
      const dto = { status: 'contracted', agent_memo: '계약완료' };
      const result = await service.update('agent-1', 'l1', dto);

      expect(result.status).toBe('contracted');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'contracted', agent_memo: '계약완료' }),
      );
    });

    it('변경할 필드 없으면 BadRequestException', async () => {
      await expect(service.update('agent-1', 'l1', {})).rejects.toThrow(BadRequestException);
    });
  });

  // ── remove ────────────────────────────────────────────────

  describe('remove', () => {
    it('이미지 있으면 Storage 정리 후 삭제', async () => {
      // 이미지 조회
      mockSingle.mockResolvedValueOnce({
        data: { images: [{ path: 'agents/a1/listings/l1/photo.jpg' }] },
        error: null,
      });

      // 삭제 성공
      mockDelete.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await service.remove('agent-1', 'l1');

      expect(mockStorageRemove).toHaveBeenCalledWith(['agents/a1/listings/l1/photo.jpg']);
    });

    it('존재하지 않는 매물 → NotFoundException', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      await expect(service.remove('agent-1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
