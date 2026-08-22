import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { BillingCycle, MailPlan } from '@prisma/client';
import { Type } from 'class-transformer';

export class RequestMailSubscriptionDto {
  @IsEnum(MailPlan)
  plan: MailPlan;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  mailboxCount: number;
}

export class AdminActivateMailSubscriptionDto {
  @IsEnum(MailPlan)
  plan: MailPlan;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  mailboxCount: number;

  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @IsOptional()
  @IsUUID()
  ticketId?: string;
}
