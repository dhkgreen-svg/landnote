import { IsOptional, IsIn, IsNumber, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { INQUIRY_STATUS } from '@landnote/shared';

const statusValues = Object.values(INQUIRY_STATUS);

export class UpdateInquiryDto {
  @IsOptional()
  @IsIn(statusValues)
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(0) @Max(5)
  @Type(() => Number)
  priority?: number;

  @IsOptional()
  @IsString()
  agent_memo?: string;
}
