import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SendRuknyOtpDto {
  @ApiProperty({ example: '+964771234567' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'to must be a valid E.164 phone number',
  })
  to: string;

  @ApiProperty({ example: '482913' })
  @IsString()
  @MinLength(4)
  @MaxLength(32)
  @Matches(/^\d+$/, { message: 'code must be numeric' })
  code: string;
}
