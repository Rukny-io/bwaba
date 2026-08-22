import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertMailAutoReplyDto {
  @ApiProperty({ description: 'Send vacation replies for this mailbox' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Reply subject line' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiPropertyOptional({ description: 'Plain-text reply body' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  bodyText?: string;

  @ApiPropertyOptional({
    description: 'ISO start (inclusive). Null clears the start date.',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value != null && value !== '')
  @IsDateString()
  startsAt?: string | null;

  @ApiPropertyOptional({
    description: 'ISO end (inclusive). Null clears the end date.',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value != null && value !== '')
  @IsDateString()
  endsAt?: string | null;
}
