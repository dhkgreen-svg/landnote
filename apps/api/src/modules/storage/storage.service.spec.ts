import { BadRequestException } from '@nestjs/common';
import { StorageService } from './storage.service';

// Supabase 모킹
const mockSingle = jest.fn();
const mockRemove = jest.fn().mockResolvedValue({});
const mockUpload = jest.fn();
let dbUpdateError: any = null;

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      }),
      update: () => ({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: dbUpdateError }),
        }),
      }),
    }),
    storage: {
      from: () => ({
        upload: mockUpload,
        remove: mockRemove,
      }),
    },
  }),
}));

describe('StorageService', () => {
  let service: StorageService;

  const validFile = {
    mimetype: 'image/jpeg',
    size: 1024,
    originalname: 'test.jpg',
    buffer: Buffer.from('test'),
  } as Express.Multer.File;

  beforeEach(() => {
    service = new StorageService();
    jest.clearAllMocks();
    mockUpload.mockResolvedValue({ error: null });
    dbUpdateError = null;
  });

  describe('uploadInquiryImage', () => {
    it('should throw if inquiry does not exist', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });

      await expect(
        service.uploadInquiryImage('agent-1', 'invalid-inquiry', validFile),
      ).rejects.toThrow(BadRequestException);

      // 스토리지에 업로드하지 않아야 함
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('should reject non-allowed file types', async () => {
      const badFile = { ...validFile, mimetype: 'application/pdf' } as Express.Multer.File;

      await expect(
        service.uploadInquiryImage('agent-1', 'inquiry-1', badFile),
      ).rejects.toThrow('허용되지 않는 파일 형식입니다');
    });

    it('should reject oversized files', async () => {
      const bigFile = { ...validFile, size: 11 * 1024 * 1024 } as Express.Multer.File;

      await expect(
        service.uploadInquiryImage('agent-1', 'inquiry-1', bigFile),
      ).rejects.toThrow('파일 크기는 10MB를 초과할 수 없습니다');
    });
  });
});
