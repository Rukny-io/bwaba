import { IsString, IsOptional, MaxLength, Length, Matches } from 'class-validator';

export class RegisterPhoneDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  pin: string; // 6-digit two-step verification PIN (set by you)

  @IsOptional()
  @IsString()
  phoneNumberId?: string;
}

export class UpdatePhoneProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  about?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  websites?: string[];

  @IsOptional()
  @IsString()
  profilePictureUrl?: string;
}
