import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { InquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe('InquiriesController — PATCH DTO 검증', () => {
  const mockService = {
    list: jest.fn(),
    detail: jest.fn(),
    update: jest.fn().mockResolvedValue({ id: '1', status: 'contacted' }),
    remove: jest.fn(),
  };

  let controller: InquiriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InquiriesController],
      providers: [
        { provide: InquiriesService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<InquiriesController>(InquiriesController);
    jest.clearAllMocks();
  });

  it('유효한 status로 update 호출 시 서비스가 호출된다', async () => {
    const dto = plainToInstance(UpdateInquiryDto, { status: 'contacted' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);

    await controller.update({ id: 'agent-1' }, 'inq-1', dto);
    expect(mockService.update).toHaveBeenCalledWith('agent-1', 'inq-1', dto);
  });

  it('잘못된 status 값은 DTO 검증에서 거부된다', async () => {
    const dto = plainToInstance(UpdateInquiryDto, { status: 'invalid_status' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('status');
  });

  it('priority 범위 초과 시 DTO 검증에서 거부된다', async () => {
    const dto = plainToInstance(UpdateInquiryDto, { priority: 10 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('priority');
  });

  it('priority 음수 시 DTO 검증에서 거부된다', async () => {
    const dto = plainToInstance(UpdateInquiryDto, { priority: -1 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('priority');
  });

  it('유효한 priority(0~5)는 검증 통과', async () => {
    for (const val of [0, 1, 3, 5]) {
      const dto = plainToInstance(UpdateInquiryDto, { priority: val });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('빈 body도 검증 통과 (모든 필드 optional)', async () => {
    const dto = plainToInstance(UpdateInquiryDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('허용되지 않은 필드는 whitelist에 의해 제거된다', async () => {
    const dto = plainToInstance(UpdateInquiryDto, {
      status: 'new',
      unknown_field: 'hacked',
    });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.length).toBeGreaterThan(0);
  });
});
