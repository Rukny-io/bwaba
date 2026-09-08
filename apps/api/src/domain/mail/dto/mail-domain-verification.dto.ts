import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class MailDomainDecisionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason: string;
}

export class UploadMailBimiLogoDto {
  /** Base64 or data-URL encoded logo bytes. */
  @IsString()
  @MinLength(8)
  @MaxLength(4_000_000)
  contentBase64: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;
}
