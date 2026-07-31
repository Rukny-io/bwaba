import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpgradePlanDto {
  @IsString()
  @IsIn(['PRO'])
  plan: string;

  @IsOptional()
  @IsIn(['MONTHLY', 'YEARLY'])
  billingCycle?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
