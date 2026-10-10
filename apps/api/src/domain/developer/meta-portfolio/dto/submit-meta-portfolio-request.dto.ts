import {
  IsEmail,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitMetaPortfolioRequestDto {
  @ApiProperty({ description: 'Public app id of the target developer app' })
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  appId: string;

  @ApiProperty({ example: 'Rukny Store' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  businessName: string;

  @ApiProperty({ example: 'example.com' })
  @IsString()
  @MinLength(3)
  @MaxLength(253)
  @Matches(/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/, {
    message: 'domain must be a valid hostname without protocol',
  })
  domain: string;

  @ApiProperty({ example: 'info@example.com' })
  @IsEmail()
  @MaxLength(254)
  businessEmail: string;

  @ApiProperty({ example: 'https://example.com' })
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(500)
  websiteUrl: string;

  @ApiProperty({ description: 'Short description of the business' })
  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  businessDescription: string;
}
