import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MailMessageFolder } from '@prisma/client';

export class SendMailMessageDto {
  @ApiProperty({ description: 'Mailbox UUID to send from' })
  @IsUUID()
  mailboxId: string;

  @ApiProperty({
    description: 'Recipients (To)',
    type: [String],
    example: ['customer@example.com'],
  })
  @IsArray()
  @ArrayMaxSize(50)
  @IsEmail({}, { each: true })
  to: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsEmail({}, { each: true })
  cc?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsEmail({}, { each: true })
  bcc?: string[];

  @ApiProperty({ example: 'Hello from Rukny Mail' })
  @IsString()
  @MinLength(1)
  @MaxLength(998)
  subject: string;

  @ApiPropertyOptional({ description: 'Plain-text body' })
  @ValidateIf((o: SendMailMessageDto) => !o.bodyHtml || !!o.bodyText)
  @IsOptional()
  @IsString()
  @MaxLength(500_000)
  bodyText?: string;

  @ApiPropertyOptional({ description: 'HTML body' })
  @IsOptional()
  @IsString()
  @MaxLength(500_000)
  bodyHtml?: string;

  @ApiPropertyOptional({
    description: 'Existing message id to reply in the same thread',
  })
  @IsOptional()
  @IsUUID()
  replyToMessageId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Uploaded attachment ids' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID(undefined, { each: true })
  attachmentIds?: string[];

  @ApiPropertyOptional({
    description: 'Promote an existing draft instead of creating a new row',
  })
  @IsOptional()
  @IsUUID()
  draftId?: string;

  @ApiPropertyOptional({
    description: 'Schedule send for a future time (ISO 8601). Creates a scheduled draft.',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class SaveMailDraftDto {
  @ApiProperty()
  @IsUUID()
  mailboxId: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsEmail({}, { each: true })
  to?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsEmail({}, { each: true })
  cc?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsEmail({}, { each: true })
  bcc?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(998)
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500_000)
  bodyText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500_000)
  bodyHtml?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  replyToMessageId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID(undefined, { each: true })
  attachmentIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string | null;
}

export class UpdateMailMessageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isStarred?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ enum: MailMessageFolder })
  @IsOptional()
  @IsEnum(MailMessageFolder)
  folder?: MailMessageFolder;
}
