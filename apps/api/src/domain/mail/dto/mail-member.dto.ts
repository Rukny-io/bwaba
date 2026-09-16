import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export enum MailAppMemberRoleDto {
  ADMIN = 'ADMIN',
  BILLING = 'BILLING',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export class InviteMailAppMemberDto {
  @ApiProperty({ example: 'teammate@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: MailAppMemberRoleDto, example: 'MEMBER' })
  @IsEnum(MailAppMemberRoleDto)
  role: MailAppMemberRoleDto;
}

export class UpdateMailAppMemberDto {
  @ApiPropertyOptional({ enum: MailAppMemberRoleDto })
  @IsEnum(MailAppMemberRoleDto)
  @IsOptional()
  role?: MailAppMemberRoleDto;
}
