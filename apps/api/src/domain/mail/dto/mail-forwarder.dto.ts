import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMailForwarderDto {
  @ApiProperty({ description: 'Source mailbox UUID' })
  @IsUUID()
  mailboxId: string;

  @ApiProperty({
    description: 'External destination address',
    example: 'person@example.com',
  })
  @IsEmail()
  @MaxLength(320)
  toAddress: string;

  @ApiPropertyOptional({
    description: 'Keep a copy in the mailbox after forwarding',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  keepCopy?: boolean;
}

export class UpdateMailForwarderDto {
  @ApiPropertyOptional({ description: 'Source mailbox UUID' })
  @IsOptional()
  @IsUUID()
  mailboxId?: string;

  @ApiPropertyOptional({ description: 'External destination address' })
  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  toAddress?: string;

  @ApiPropertyOptional({ description: 'Keep a copy in the mailbox' })
  @IsOptional()
  @IsBoolean()
  keepCopy?: boolean;

  @ApiPropertyOptional({ description: 'Send inbound mail to the destination' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
