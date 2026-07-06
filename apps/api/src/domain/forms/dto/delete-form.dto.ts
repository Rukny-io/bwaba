import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DeleteFormDto {
  @ApiProperty({
    description: 'Must exactly match the form title (case-sensitive, trimmed)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  confirmTitle: string;

  @ApiProperty({ required: false, description: 'Optional reason for audit trail' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class RestoreFormDto {
  @ApiProperty({
    description: 'Must exactly match the form title to confirm restoration',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  confirmTitle: string;
}
