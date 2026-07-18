import {
  IsString, IsOptional, IsArray, IsIn, IsNumber, Min,
  MaxLength, ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CATEGORY_CODE, TRANSACTION_TYPE, LISTING_STATUS } from '@landnote/shared';

const categoryValues = Object.values(CATEGORY_CODE);
const transactionValues = Object.values(TRANSACTION_TYPE);
const statusValues = Object.values(LISTING_STATUS);

export class UpdateListingDto {
  @IsOptional()
  @IsArray()
  @IsIn(categoryValues, { each: true })
  category_codes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategory_codes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsIn(transactionValues, { each: true })
  transaction_types?: string[];

  @IsOptional() @IsString() address_full?: string;
  @IsOptional() @IsString() address_road?: string;
  @IsOptional() @IsString() address_jibun?: string;
  @IsOptional() @IsString() @MaxLength(50) dong_name?: string;
  @IsOptional() @IsNumber() @Type(() => Number) latitude?: number;
  @IsOptional() @IsNumber() @Type(() => Number) longitude?: number;

  @IsOptional()
  @ValidateIf(o => o.transaction_types?.includes('sale'))
  @IsNumber() @Min(1) @Type(() => Number)
  price_sale?: number;

  @IsOptional()
  @ValidateIf(o => o.transaction_types?.includes('jeonse'))
  @IsNumber() @Min(1) @Type(() => Number)
  price_jeonse?: number;

  @IsOptional()
  @ValidateIf(o => ['monthly_rent','premium_transfer'].some(t => o.transaction_types?.includes(t)))
  @IsNumber() @Min(0) @Type(() => Number)
  deposit?: number;

  @IsOptional()
  @ValidateIf(o => ['monthly_rent','premium_transfer'].some(t => o.transaction_types?.includes(t)))
  @IsNumber() @Min(1) @Type(() => Number)
  monthly_rent?: number;

  @IsOptional()
  @ValidateIf(o => ['jeonse','monthly_rent','premium_transfer'].some(t => o.transaction_types?.includes(t)))
  @IsNumber() @Min(0) @Type(() => Number)
  maintenance_fee?: number;

  @IsOptional()
  @ValidateIf(o => o.transaction_types?.includes('premium_transfer'))
  @IsNumber() @Min(0) @Type(() => Number)
  premium_price?: number;

  @IsOptional()
  @ValidateIf(o => o.transaction_types?.includes('premium_transfer'))
  @IsNumber() @Min(1) @Type(() => Number)
  contract_remaining_months?: number;

  @IsOptional() @IsNumber() @Type(() => Number) premium_floor?: number;
  @IsOptional() @IsNumber() @Type(() => Number) premium_facility?: number;
  @IsOptional() @IsNumber() @Type(() => Number) premium_business?: number;
  @IsOptional() @IsNumber() @Type(() => Number) area_supply?: number;
  @IsOptional() @IsNumber() @Type(() => Number) area_exclusive?: number;
  @IsOptional() @IsNumber() @Type(() => Number) area_land?: number;
  @IsOptional() @IsNumber() @Type(() => Number) area_building?: number;
  @IsOptional() @IsNumber() @Type(() => Number) area_contract?: number;
  @IsOptional() @IsNumber() @Type(() => Number) floor_current?: number;
  @IsOptional() @IsNumber() @Type(() => Number) floor_total?: number;
  @IsOptional() @IsNumber() @Type(() => Number) built_year?: number;
  @IsOptional() @IsIn(['남향','남동향','남서향','동향','서향','북향','북동향','북서향']) direction?: string;
  @IsOptional() detail_info?: Record<string, unknown>;
  @IsOptional() @IsIn(statusValues) status?: string;
  @IsOptional() @IsString() agent_memo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  owner_phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  contract_party_phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  complex_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  building_num?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  room_num?: string;
}
