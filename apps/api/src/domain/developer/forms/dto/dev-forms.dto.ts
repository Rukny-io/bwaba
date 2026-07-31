import { IsString, MaxLength, IsArray, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsFormId } from './is-form-id.validator';

export class LinkFormToAppDto {
  @ApiProperty({ description: 'Public 16-digit application ID' })
  @IsString()
  @MaxLength(16)
  appId!: string;

  @ApiProperty({ description: 'Form ID (frm_* or legacy UUID)' })
  @IsFormId()
  formId!: string;
}

export class UpdateEmbedOriginsDto {
  @ApiProperty({ description: 'Public 16-digit application ID' })
  @IsString()
  @MaxLength(16)
  appId!: string;

  @ApiProperty({
    description: 'HTTPS origins allowed to embed forms in iframe',
    example: ['https://shop.example.com'],
  })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  allowedOrigins!: string[];
}

export class LinkFormDeveloperEmbedDto {
  @ApiProperty({ description: 'Public 16-digit application ID to link' })
  @IsString()
  @MaxLength(16)
  appId!: string;

  @ApiProperty({
    description:
      'Signed one-time challenge from GET .../developer-embed/link-targets (expires in 5 minutes)',
  })
  @IsString()
  @MaxLength(2048)
  linkChallenge!: string;
}
