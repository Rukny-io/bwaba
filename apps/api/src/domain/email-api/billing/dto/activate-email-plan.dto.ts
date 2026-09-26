import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { DeveloperEmailPlan } from '@prisma/client';

export class ActivateEmailPlanDto {
  @IsEnum(DeveloperEmailPlan)
  plan!: DeveloperEmailPlan;

  @IsOptional()
  @IsDateString()
  periodEndsAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  enterpriseMonthlyQuota?: number;
}

/** @deprecated Use ActivateEmailPlanDto */
export class ActivateEmailStarterDto {
  @IsOptional()
  @IsDateString()
  periodEndsAt?: string;
}
