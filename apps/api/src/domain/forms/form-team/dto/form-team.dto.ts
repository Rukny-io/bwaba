import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsEnum, IsOptional } from 'class-validator';

/** Mirrors Prisma FormTeamRole — defined locally so validation works before prisma generate. */
export enum FormTeamRoleDto {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  ANALYST = 'ANALYST',
  VIEWER = 'VIEWER',
}

export class InviteFormTeamMemberDto {
  @ApiProperty({ example: 'member@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: FormTeamRoleDto, example: 'EDITOR' })
  @IsEnum(FormTeamRoleDto)
  role: FormTeamRoleDto;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  permissions?: string[];
}

export class UpdateFormTeamMemberDto {
  @ApiPropertyOptional({ enum: FormTeamRoleDto })
  @IsEnum(FormTeamRoleDto)
  @IsOptional()
  role?: FormTeamRoleDto;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  permissions?: string[];
}
