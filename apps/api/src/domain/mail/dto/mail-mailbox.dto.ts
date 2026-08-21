import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const LOCAL_PART_PATTERN =
  /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/i;

export class CreateMailMailboxDto {
  @ApiProperty({
    description: 'Local part before @',
    example: 'info',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(LOCAL_PART_PATTERN, {
    message:
      'Local part must be alphanumeric and may include . _ - (not at ends).',
  })
  localPart: string;

  @ApiProperty({
    description: 'Mailbox password (min 8 characters)',
    example: 'StrongPass1!',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({
    description: 'Enable mailbox 2FA (TOTP setup completes later)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  enable2fa?: boolean;

  @ApiPropertyOptional({ description: 'Display name', example: 'Info' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;
}

export class UpdateMailMailboxDto {
  @ApiPropertyOptional({ description: 'Display name' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string | null;

  @ApiPropertyOptional({
    description: 'ACTIVE or DISABLED',
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(ACTIVE|DISABLED)$/)
  status?: 'ACTIVE' | 'DISABLED';
}

export class ChangeMailMailboxPasswordDto {
  @ApiProperty({ description: 'New mailbox password', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export class SetMailMailbox2faDto {
  @ApiProperty({ description: 'Enable or disable mailbox TOTP 2FA' })
  @IsBoolean()
  enabled: boolean;
}
