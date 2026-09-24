import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';

export class SmtpValidateDeveloperKeyDto {
  @IsString()
  @IsNotEmpty()
  apiKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  clientIp?: string;
}

export class SmtpSendDeveloperDto {
  @IsString()
  @IsNotEmpty()
  apiKey!: string;

  @IsEmail()
  from!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fromName?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1)
  @IsEmail({}, { each: true })
  to!: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100_000)
  bodyText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100_000)
  bodyHtml?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1)
  @IsEmail({}, { each: true })
  replyTo?: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  idempotencyKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  clientIp?: string;
}

export class SmtpValidateMailboxDto {
  @IsEmail()
  address!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  appPassword!: string;
}

export class SmtpSendMailboxDto {
  @IsEmail()
  address!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  appPassword!: string;

  @IsEmail()
  from!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fromName?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  to!: string[];

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100_000)
  bodyText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100_000)
  bodyHtml?: string;
}
