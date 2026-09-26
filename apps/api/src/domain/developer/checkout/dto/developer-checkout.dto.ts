import { DeveloperEmailPlan } from '@prisma/client';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum DeveloperCheckoutKind {
  WALLET_TOPUP = 'WALLET_TOPUP',
  PRO_UPGRADE = 'PRO_UPGRADE',
  /** Email API transactional plan — amount/title from catalog via planId */
  EMAIL_API_PLAN = 'EMAIL_API_PLAN',
}

export class CreateDeveloperCheckoutSessionDto {
  @IsEnum(DeveloperCheckoutKind)
  kind: DeveloperCheckoutKind;

  /** Required for WALLET_TOPUP (IQD). Ignored for PRO. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1_000)
  @Max(5_000_000)
  amount?: number;

  @IsOptional()
  @IsIn(['MONTHLY', 'YEARLY'])
  billingCycle?: 'MONTHLY' | 'YEARLY';

  @IsOptional()
  @IsString()
  appId?: string;

  /** Required when kind is EMAIL_API_PLAN */
  @IsOptional()
  @IsEnum(DeveloperEmailPlan)
  planId?: DeveloperEmailPlan;
}
