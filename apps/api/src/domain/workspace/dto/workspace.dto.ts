import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { WorkspaceRole } from '@prisma/client';

export class InviteWorkspaceMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}

export class UpdateWorkspaceMemberDto {
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}
