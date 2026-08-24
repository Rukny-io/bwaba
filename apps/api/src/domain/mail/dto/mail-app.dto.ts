import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MailDomainStatus } from '@prisma/client';

export class CreateMailAppDto {
  @ApiProperty({ description: 'اسم تطبيق البريد', example: 'Acme Mail' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @ApiProperty({
    description: 'بريد التواصل الرسمي',
    example: 'mail@company.com',
  })
  @IsEmail()
  contactEmail: string;

  @ApiPropertyOptional({
    description: 'فئة المساحة (اختياري — الافتراضي BUSINESS)',
    enum: ['BUSINESS', 'CONSUMER'],
  })
  @IsOptional()
  @IsEnum(['BUSINESS', 'CONSUMER'] as const)
  appType?: 'BUSINESS' | 'CONSUMER';

  @ApiProperty({ description: 'رمز التحقق من OTP' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otpCode: string;

  @ApiPropertyOptional({ description: 'وصف اختياري' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;
}

export class UpdateMailAppDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(253)
  primaryDomain?: string | null;

  @IsOptional()
  @IsEnum(MailDomainStatus)
  domainStatus?: MailDomainStatus;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601()
  domainCheckedAt?: string | null;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}

export class SendMailAppOtpDto {
  @ApiProperty({
    description: 'رقم الهاتف مع رمز الدولة',
    example: '9647701234567',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  @Matches(/^\d+$/, { message: 'Phone number must contain only digits' })
  phoneNumber: string;
}

export class VerifyMailAppOtpDto {
  @ApiProperty({ description: 'رقم الهاتف', example: '9647701234567' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ description: 'رمز التحقق المكوّن من 6 أرقام' })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}
