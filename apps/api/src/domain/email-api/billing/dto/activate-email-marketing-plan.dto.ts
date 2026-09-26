import { IsEnum } from 'class-validator';
import { DeveloperEmailMarketingPlan } from '@prisma/client';

export class ActivateEmailMarketingPlanDto {
  @IsEnum(DeveloperEmailMarketingPlan)
  plan!: DeveloperEmailMarketingPlan;
}
