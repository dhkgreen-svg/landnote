import { Test, TestingModule } from '@nestjs/testing';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { StorageService } from '../storage/storage.service';
import { UpdateListingDto } from './dto/update-listing.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe('ListingsController — PATCH DTO 검증', () => {
  const mockService = {
    list: jest.fn(),
    detail: jest.fn(),
    create: jest.fn(),
    update: jest.fn().mockResolvedValue({ id: '1', status: 'active' }),
    remove: jest.fn(),
    getImages: jest.fn().mockResolvedValue([]),
  };

  const mockStorageService = {
    uploadListingImage: jest.fn(),
    deleteListingImage: jest.fn(),
  };

  let controller: ListingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListingsController],
      providers: [
        { provide: ListingsService, useValue: mockService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    controller = module.get<ListingsController>(ListingsController);
    jest.clearAllMocks();
  });

  it('유효한 status로 update 호출 시 서비스가 호출된다', async () => {
    const dto = plainToInstance(UpdateListingDto, { status: 'pending' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);

    await controller.update({ id: 'agent-1' }, 'listing-1', dto);
    expect(mockService.update).toHaveBeenCalledWith('agent-1', 'listing-1', dto);
  });

  it('잘못된 status 값은 DTO 검증에서 거부된다', async () => {
    const dto = plainToInstance(UpdateListingDto, { status: 'invalid' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('status');
  });

  it('잘못된 direction 값은 거부된다', async () => {
    const dto = plainToInstance(UpdateListingDto, { direction: 'invalid_dir' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('direction');
  });

  it('유효한 direction 값은 통과', async () => {
    const dto = plainToInstance(UpdateListingDto, { direction: '남향' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('잘못된 category_codes 값은 거부된다', async () => {
    const dto = plainToInstance(UpdateListingDto, { category_codes: ['fake_cat'] });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('유효한 category_codes는 통과', async () => {
    const dto = plainToInstance(UpdateListingDto, { category_codes: ['residential', 'commercial'] });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('빈 body도 검증 통과 (모든 필드 optional)', async () => {
    const dto = plainToInstance(UpdateListingDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('숫자 필드에 문자열 입력 시 transform 후 검증', async () => {
    const dto = plainToInstance(UpdateListingDto, { area_supply: 'abc' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('허용되지 않은 필드는 whitelist에 의해 거부된다', async () => {
    const dto = plainToInstance(UpdateListingDto, {
      status: 'active',
      hacked_field: 'value',
    });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.length).toBeGreaterThan(0);
  });
});
