import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { SUBSCRIPTION_PLAN } from '@landnote/shared';

const planValues = Object.values(SUBSCRIPTION_PLAN);

export class UpdateAgentProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  agent_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  office_name?: string;

  @IsOptional()
  @IsString()
  profile_image_url?: string;

  // trial 상태 에이전트의 온보딩 플랜 선택용. 서비스 레이어에서 trial 전용 검증.
  @IsOptional()
  @IsIn(planValues)
  subscription_plan?: 'starter' | 'pro';
}
