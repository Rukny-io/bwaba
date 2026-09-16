import { IsString, IsOptional, Matches, Length } from 'class-validator';

export class ConnectWabaDto {
  @IsString()
  code: string; // الكود من Meta Embedded Signup callback

  @IsString()
  appId: string;

  @IsOptional()
  @IsString()
  wabaId?: string; // من WA_EMBEDDED_SIGNUP session event

  @IsOptional()
  @IsString()
  phoneNumberId?: string; // من WA_EMBEDDED_SIGNUP session event

  /** Optional 6-digit two-step PIN. If omitted, the server generates one and returns it once. */
  @IsOptional()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  pin?: string;
}
