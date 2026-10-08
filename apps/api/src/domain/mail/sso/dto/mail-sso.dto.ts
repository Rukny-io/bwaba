import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { MailAppMemberRoleDto } from '../../dto/mail-member.dto';

const LOCAL_PART_PATTERN = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/i;
const EMAIL_DOMAIN_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export const MAIL_SSO_BULK_MAX_ROWS = 100;

export class UpdateMailSsoSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  quickLinkEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoAcceptOnLink?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  skipMailboxPasswordForAssigned?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 168 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  linkTtlHours?: number;

  @ApiPropertyOptional({ type: [String], example: ['acme.com'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @Matches(EMAIL_DOMAIN_PATTERN, {
    each: true,
    message: 'Each allowed domain must look like example.com',
  })
  allowedEmailDomains?: string[];
}

export class ProvisionMailSsoDto {
  @ApiProperty({ example: 'teammate@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: MailAppMemberRoleDto, example: 'MEMBER' })
  @IsEnum(MailAppMemberRoleDto)
  role: MailAppMemberRoleDto;

  @ApiPropertyOptional({ description: 'Existing mailbox to assign' })
  @IsOptional()
  @IsUUID()
  mailboxId?: string;

  @ApiPropertyOptional({
    description: 'Create a new mailbox with this local part (before @)',
    example: 'sara',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(LOCAL_PART_PATTERN, {
    message:
      'Local part must be alphanumeric and may include . _ - (not at ends).',
  })
  newLocalPart?: string;

  @ApiPropertyOptional({ description: 'Display name for a new mailbox' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string;
}

export class ProvisionMailSsoBulkDto {
  @ApiProperty({ type: [ProvisionMailSsoDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAIL_SSO_BULK_MAX_ROWS)
  @ValidateNested({ each: true })
  @Type(() => ProvisionMailSsoDto)
  rows: ProvisionMailSsoDto[];
}

export class ResendMailSsoLinkDto {
  @ApiPropertyOptional({
    description: 'Email the new link (default). false = only return it to copy.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  deliver?: boolean;
}

export enum MailIdentityProviderPresetDto {
  GOOGLE_WORKSPACE = 'GOOGLE_WORKSPACE',
  MICROSOFT_ENTRA = 'MICROSOFT_ENTRA',
  CUSTOM = 'CUSTOM',
}

export class UpsertMailIdentityProviderDto {
  @ApiProperty({ enum: MailIdentityProviderPresetDto })
  @IsEnum(MailIdentityProviderPresetDto)
  preset: MailIdentityProviderPresetDto;

  @ApiProperty({ example: 'https://accounts.google.com' })
  @IsString()
  @MaxLength(300)
  @Matches(/^https?:\/\/[^\s]+$/i, { message: 'Issuer must be an https URL.' })
  issuer: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  clientId: string;

  @ApiPropertyOptional({ description: 'Required when creating; omit to keep the stored secret.' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  clientSecret?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  jitProvisioning?: boolean;

  @ApiPropertyOptional({ enum: MailAppMemberRoleDto })
  @IsOptional()
  @IsEnum(MailAppMemberRoleDto)
  defaultRole?: MailAppMemberRoleDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enforceSso?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoMapMailboxByLocalPart?: boolean;
}

export class ConsumeMailSsoLinkDto {
  @ApiPropertyOptional({
    description: 'Confirm joining when the workspace disables auto-accept',
  })
  @IsOptional()
  @IsBoolean()
  confirm?: boolean;
}
