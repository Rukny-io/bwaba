import {
  IsString,
  IsUrl,
  IsInt,
  IsOptional,
  Min,
  MaxLength,
  IsIn,
  IsBoolean,
  IsDateString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSocialLinkDto {
  @ApiProperty({
    example: 'Twitter',
    description: 'Social media platform name',
  })
  @IsString()
  @MaxLength(50)
  platform: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'Username on the platform',
  })
  @IsString()
  @MaxLength(100)
  username: string;

  @ApiProperty({
    example: 'https://twitter.com/johndoe',
    description: 'Full URL to the social profile',
  })
  @IsUrl({}, { message: 'Please provide a valid URL' })
  url: string;

  @ApiPropertyOptional({
    example: 'My Personal Account',
    description: 'Custom title for the link (optional)',
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Display order (lower number = higher priority)',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({
    example: null,
    description: 'Group ID to assign this link to',
  })
  @IsString()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({
    example: 'active',
    description: 'Link visibility status',
    enum: ['active', 'hidden'],
  })
  @IsString()
  @IsIn(['active', 'hidden'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 'classic',
    description: 'Link display layout',
    enum: ['classic', 'featured', 'profile_card', 'media_grid'],
  })
  @IsString()
  @IsIn(['classic', 'featured', 'profile_card', 'media_grid'])
  @IsOptional()
  layout?: string;

  @ApiPropertyOptional({
    example: null,
    description: 'Thumbnail URL for featured layout',
  })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiPropertyOptional({
    example: null,
    description: 'Instagram connection id for profile_card / media_grid',
  })
  @IsString()
  @IsOptional()
  connectionId?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the link is pinned to the top',
  })
  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @ApiPropertyOptional({
    description: 'When the link becomes visible on the public profile (ISO date)',
  })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  @IsOptional()
  scheduledStartAt?: string | null;

  @ApiPropertyOptional({
    description: 'When the link stops being visible on the public profile (ISO date)',
  })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsDateString()
  @IsOptional()
  scheduledEndAt?: string | null;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the link requires a password before opening',
  })
  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Notify the owner when someone clicks this link',
  })
  @IsBoolean()
  @IsOptional()
  notifyOnClick?: boolean;
}

export class UnlockSocialLinkDto {
  @ApiProperty({
    example: 'secret-pass',
    description: 'Password required to unlock the link',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
