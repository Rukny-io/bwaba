import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const LOCAL_PART_PATTERN =
  /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/i;

export class CreateMailAliasDto {
  @ApiProperty({ description: 'Local part before @', example: 'sales' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(LOCAL_PART_PATTERN, {
    message:
      'Local part must be alphanumeric and may include . _ - (not at ends).',
  })
  localPart: string;

  @ApiProperty({ description: 'Destination mailbox UUID' })
  @IsUUID()
  mailboxId: string;
}

export class UpdateMailAliasDto {
  @ApiPropertyOptional({ description: 'Deliver mail sent to this alias' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Destination mailbox UUID' })
  @IsOptional()
  @IsUUID()
  mailboxId?: string;
}
