import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ArrayMaxSize,
  ArrayMinSize,
  ValidateIf,
} from 'class-validator';

const NO_HEADER_NEWLINES = /^[^\r\n]*$/;

/**
 * Transactional Email API MVP deliberately accepts one recipient and no
 * attachments/CC/BCC. This bounds provider cost and reduces abuse surface.
 */
export class SendEmailDto {
  @IsEmail()
  @MaxLength(254)
  from!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Matches(NO_HEADER_NEWLINES)
  fromName?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1)
  @IsEmail({}, { each: true })
  @MaxLength(254, { each: true })
  to!: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(NO_HEADER_NEWLINES)
  subject!: string;

  @ValidateIf((value) => !value.bodyHtml)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  bodyText?: string;

  @ValidateIf((value) => !value.bodyText)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100_000)
  bodyHtml?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1)
  @IsEmail({}, { each: true })
  @MaxLength(254, { each: true })
  replyTo?: string[];
}
