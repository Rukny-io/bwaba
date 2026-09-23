import {
  ArrayMinSize,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MailFilterAction,
  MailFilterMatchField,
  MailFilterRuleType,
} from '@prisma/client';

export class CreateMailFilterRuleDto {
  @ApiPropertyOptional({
    description: 'Mailbox UUID; omit for all mailboxes in workspace',
  })
  @IsOptional()
  @IsUUID()
  mailboxId?: string;

  @ApiProperty({ enum: MailFilterRuleType })
  @IsEnum(MailFilterRuleType)
  ruleType: MailFilterRuleType;

  @ApiProperty({ enum: MailFilterMatchField })
  @IsEnum(MailFilterMatchField)
  matchField: MailFilterMatchField;

  @ApiProperty({ description: 'Sender email, domain, or subject substring' })
  @IsString()
  @MinLength(1)
  @MaxLength(320)
  pattern: string;

  @ApiProperty({ enum: MailFilterAction })
  @IsEnum(MailFilterAction)
  action: MailFilterAction;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  priority?: number;
}

export class UpdateMailFilterRuleDto {
  @ApiPropertyOptional({ description: 'Mailbox UUID; null clears mailbox scope' })
  @IsOptional()
  @IsUUID()
  mailboxId?: string | null;

  @ApiPropertyOptional({ enum: MailFilterMatchField })
  @IsOptional()
  @IsEnum(MailFilterMatchField)
  matchField?: MailFilterMatchField;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(320)
  pattern?: string;

  @ApiPropertyOptional({ enum: MailFilterAction })
  @IsOptional()
  @IsEnum(MailFilterAction)
  action?: MailFilterAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateMailSecuritySettingsDto {
  @ApiPropertyOptional({
    description: 'Hold suspicious inbound mail in quarantine for review',
  })
  @IsOptional()
  @IsBoolean()
  quarantineSuspicious?: boolean;

  @ApiPropertyOptional({
    description: 'Notify workspace owner when mail is quarantined',
  })
  @IsOptional()
  @IsBoolean()
  notifyOnQuarantine?: boolean;

  @ApiPropertyOptional({
    description: 'Days before quarantined mail is auto-deleted (0 = never)',
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  quarantineRetentionDays?: number;

  @ApiPropertyOptional({
    description:
      'Quarantine senders with missing DMARC when SPF or DKIM also fails (off by default)',
  })
  @IsOptional()
  @IsBoolean()
  quarantineNewSendersWithoutDmarc?: boolean;
}

export class BulkQuarantineActionDto {
  @ApiProperty({ type: [String], description: 'Message UUIDs' })
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  messageIds: string[];

  @ApiProperty({ enum: ['release', 'spam', 'delete'] })
  @IsIn(['release', 'spam', 'delete'])
  action: 'release' | 'spam' | 'delete';
}
