import { IsIn, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppImageUploadDataDto {
  @ApiProperty({ enum: ['icon', 'profile'] })
  @IsIn(['icon', 'profile'])
  type: 'icon' | 'profile';

  @ApiProperty({
    description: 'Base64 data URL (data:image/jpeg;base64,...)',
  })
  @IsString()
  @MinLength(32)
  image: string;
}
