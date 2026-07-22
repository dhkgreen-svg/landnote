import {
  IsString, IsOptional, IsArray, IsIn, IsEmail, IsNumber, Min,
  ArrayMinSize, MaxLength, ValidateIf, IsNotEmpty, Length
} from 'class-validator';
import { Type } from 'class-transformer';
import { CATEGORY_CODE, TRANSACTION_TYPE } from '@landnote/shared';

const categoryValues = Object.values(CATEGORY_CODE);
const transactionValues = Object.values(TRANSACTION_TYPE);

export class CreateInquiryDto {
  @IsIn(['looking_for', 'listing'])
  inquiry_type: 'looking_for' | 'listing';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  customer_name?: string;

  @IsString()
  customer_phone: string;

  @IsOptional()
  @IsString()
  @Length(6, 6)
  otpCode?: string;

  @IsOptional()
  @IsEmail()
  customer_email?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(categoryValues, { each: true })
  category_codes: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategory_codes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(transactionValues, { each: true })
  transaction_types: string[];

  @IsOptional()
  detailed_conditions?: Record<string, unknown>;

  @IsOptional()
  @IsNumber() @Min(0) @Type(() => Number)
  area_max?: number;

  @IsOptional()
  @IsNumber() @Min(0) @Type(() => Number)
  area_land?: number;

  @IsOptional()
  @IsNumber() @Min(0) @Type(() => Number)
  area_contract?: number;

  @IsOptional()
  @IsNumber() @Min(0) @Type(() => Number)
  area_building?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  // ── listing 타입 가격 필드 (조건부 검증) ──

  @ValidateIf(o => (o.inquiry_type === 'listing' && o.transaction_types?.includes('sale')) || (o.inquiry_type === 'looking_for' && o.price_sale !== undefined))
  @IsNumber() @Min(1) @Type(() => Number)
  price_sale?: number;

  @ValidateIf(o => (o.inquiry_type === 'listing' && o.transaction_types?.includes('jeonse')) || (o.inquiry_type === 'looking_for' && o.price_jeonse !== undefined))
  @IsNumber() @Min(1) @Type(() => Number)
  price_jeonse?: number;

  @ValidateIf(o => (o.inquiry_type === 'listing' && ['monthly_rent', 'premium_transfer'].some(t => o.transaction_types?.includes(t))) || (o.inquiry_type === 'looking_for' && o.deposit !== undefined))
  @IsNumber() @Min(0) @Type(() => Number)
  deposit?: number;

  @ValidateIf(o => (o.inquiry_type === 'listing' && ['monthly_rent', 'premium_transfer'].some(t => o.transaction_types?.includes(t))) || (o.inquiry_type === 'looking_for' && o.monthly_rent !== undefined))
  @IsNumber() @Min(1) @Type(() => Number)
  monthly_rent?: number;

  @ValidateIf(o => (o.inquiry_type === 'listing' && ['jeonse', 'monthly_rent', 'premium_transfer'].some(t => o.transaction_types?.includes(t))) || (o.inquiry_type === 'looking_for' && o.maintenance_fee !== undefined))
  @IsNumber() @Min(0) @Type(() => Number)
  maintenance_fee?: number;

  @ValidateIf(o => (o.inquiry_type === 'listing' && o.transaction_types?.includes('premium_transfer')) || (o.inquiry_type === 'looking_for' && o.premium_price !== undefined))
  @IsNumber() @Min(0) @Type(() => Number)
  premium_price?: number;

  @ValidateIf(o => (o.inquiry_type === 'listing' && o.transaction_types?.includes('premium_transfer')) || (o.inquiry_type === 'looking_for' && o.contract_remaining_months !== undefined))
  @IsNumber() @Min(1) @Type(() => Number)
  contract_remaining_months?: number;

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
