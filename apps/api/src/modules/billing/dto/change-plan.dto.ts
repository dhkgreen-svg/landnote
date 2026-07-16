import { IsIn } from 'class-validator';
import { SUBSCRIPTION_PLAN } from '@landnote/shared';

const planValues = Object.values(SUBSCRIPTION_PLAN);

export class ChangePlanDto {
  @IsIn(planValues)
  plan: 'starter' | 'pro';
}
