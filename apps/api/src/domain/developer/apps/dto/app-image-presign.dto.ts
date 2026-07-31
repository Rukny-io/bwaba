import { IsIn, IsArray, ValidateNested, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class PresignFileDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsNumber()
  @Min(1)
  size: number;
}

export class AppImagePresignDto {
  @ApiProperty({ enum: ['icon', 'profile'] })
  @IsIn(['icon', 'profile'])
  type: 'icon' | 'profile';

  @ApiProperty({ type: [PresignFileDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PresignFileDto)
  files: PresignFileDto[];
}
