import { IsEnum } from 'class-validator';
import { DeveloperEmailPlan } from '@prisma/client';

export class RequestEmailPlanDto {
  @IsEnum(DeveloperEmailPlan)
  plan!: DeveloperEmailPlan;
}
