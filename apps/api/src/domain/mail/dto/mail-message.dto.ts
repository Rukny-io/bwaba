import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
