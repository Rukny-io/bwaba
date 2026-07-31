import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPhoneVerificationCodeDto {
  @ApiProperty({ example: 'field-id-1' })
  @IsUUID()
  fieldId: string;

  @ApiProperty({ example: '+9647701234567' })
  @IsString()
  phone: string;
}

export class VerifyPhoneCodeDto {
  @ApiProperty({ example: '+9647701234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;
}
