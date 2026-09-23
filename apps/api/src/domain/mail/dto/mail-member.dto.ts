import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

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

export class TransferMailAppOwnershipDto {
  @ApiProperty({ description: 'Accepted team member id to become the new owner' })
  @IsUUID()
  memberId: string;
}

export class AssignMailboxFromTeamDto {
  @ApiPropertyOptional({
    description: 'Mailbox id to assign; omit or null to unassign',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  mailboxId?: string | null;
}
