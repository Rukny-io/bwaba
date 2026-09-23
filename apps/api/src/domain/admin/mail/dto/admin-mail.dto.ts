import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { MailAppStatus, MailAppType } from '@prisma/client';

export class AdminUpdateMailboxStatusDto {
  @IsIn(['ACTIVE', 'DISABLED'])
  status: 'ACTIVE' | 'DISABLED';
}

export class AdminUpdateMailAppDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(280)
  description?: string | null;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsEnum(MailAppType)
  appType?: MailAppType;

  @IsOptional()
  @IsEnum(MailAppStatus)
  status?: MailAppStatus;

  @IsOptional()
  @IsBoolean()
  bodyEncryptionEnabled?: boolean;
}
