import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { BillingCycle, MailPlan } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpsertMailSubscriptionDto {
  @IsEnum(MailPlan)
  plan: MailPlan;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  mailboxCount?: number;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;
}

export class AdminSetMailPlanDto {
  @IsEnum(MailPlan)
  plan: MailPlan;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  mailboxCount?: number;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;
}
