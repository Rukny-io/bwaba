import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CreateSocialLinkDto } from './create-social-link.dto';

export class UpdateSocialLinkDto extends PartialType(CreateSocialLinkDto) {
  @ApiPropertyOptional({
    description: 'Set or change the link password (write-only)',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(128)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    description: 'Clear the link password and unlock',
  })
  @IsBoolean()
  @IsOptional()
  clearPassword?: boolean;
}
