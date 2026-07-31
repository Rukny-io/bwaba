import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEmail,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsHttpsUrl } from './is-https-url.validator';

export class UpdateAppDto {
  @ApiPropertyOptional({ description: 'اسم التطبيق' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'وصف التطبيق' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'معرّف محفظة الأعمال / Business portfolio ID' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  businessId?: string;

  @ApiPropertyOptional({ description: 'مفتاح أو رابط أيقونة التطبيق' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  icon?: string;

  @ApiPropertyOptional({ description: 'مفتاح أو رابط صورة الملف الشخصي' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  profileImage?: string;

  @ApiPropertyOptional({ description: 'رابط الموقع الإلكتروني' })
  @IsOptional()
  @IsHttpsUrl()
  @MaxLength(2048)
  websiteUrl?: string;

  @ApiPropertyOptional({ description: 'رابط شروط الاستخدام' })
  @IsOptional()
  @IsHttpsUrl()
  @MaxLength(2048)
  termsOfUseUrl?: string;

  @ApiPropertyOptional({ description: 'رابط سياسة الخصوصية' })
  @IsOptional()
  @IsHttpsUrl()
  @MaxLength(2048)
  privacyPolicyUrl?: string;

  @ApiPropertyOptional({ description: 'اسم مسؤول حماية البيانات' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  dpoName?: string;

  @ApiPropertyOptional({ description: 'بريد مسؤول حماية البيانات' })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  dpoEmail?: string;

  @ApiPropertyOptional({ description: 'هاتف مسؤول حماية البيانات' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  dpoPhone?: string;
}
