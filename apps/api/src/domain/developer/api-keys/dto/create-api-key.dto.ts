import {
  IsString,
  IsOptional,
  IsArray,
  IsIn,
  MaxLength,
  MinLength,
  IsDateString,
} from 'class-validator';
import { IsIpv4AddressArray } from './is-ipv4.validator';

export class CreateApiKeyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsString()
  developerAppId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIn(
    [
      'whatsapp:send',
      'whatsapp:read',
      'templates:read',
      'templates:write',
      'contacts:read',
      'contacts:write',
      'webhooks:manage',
      'media:upload',
      'forms:read',
      'forms:write',
      'forms:webhooks',
    ],
    { each: true },
  )
  scopes?: string[];

  @IsOptional()
  @IsIn(['live', 'test'])
  environment?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsIpv4AddressArray()
  ipAllowlist?: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
