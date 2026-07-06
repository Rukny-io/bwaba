import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import {
  type FormTeamPermission,
  getDefaultPermissionsForRole,
  getPermissionDeniedMessage,
} from './form-team-permissions';
import { FormTeamRole, InvitationStatus } from '@prisma/client';

type FormOwnerRef = { id: string; userId: string };

@Injectable()
export class FormTeamAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async listAcceptedWorkspaceOwnerIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.formTeamMember.findMany({
      where: {
        userId,
        status: InvitationStatus.ACCEPTED,
      },
      select: { workspaceId: true },
    });
    return memberships.map((m) => m.workspaceId);
  }

  async listAccessibleOwnerIds(userId: string): Promise<string[]> {
    const workspaceIds = await this.listAcceptedWorkspaceOwnerIds(userId);
    return [userId, ...workspaceIds];
  }

  async getAcceptedMembership(workspaceId: string, userId: string) {
    return this.prisma.formTeamMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
  }

  async hasPermissionOnForm(
    form: FormOwnerRef,
    userId: string,
    permission: FormTeamPermission,
  ): Promise<boolean> {
    if (form.userId === userId) return true;

    const member = await this.getAcceptedMembership(form.userId, userId);
    if (!member) return false;

    const permissions = this.resolvePermissions(member.role, member.permissions);
    return permissions.includes(permission);
  }

  async hasAnyFormTeamAccess(
    form: FormOwnerRef,
    userId: string,
  ): Promise<boolean> {
    if (form.userId === userId) return true;
    const member = await this.getAcceptedMembership(form.userId, userId);
    return member?.status === InvitationStatus.ACCEPTED;
  }

  async assertFormReadAccess(
    form: FormOwnerRef,
    userId: string,
    message = 'Not authorized to access this form',
  ): Promise<void> {
    const allowed = await this.hasAnyFormTeamAccess(form, userId);
    if (!allowed) {
      throw new ForbiddenException({
        message,
        code: 'INSUFFICIENT_PERMISSION',
      });
    }
  }

  async assertFormPermission(
    form: FormOwnerRef,
    userId: string,
    permission: FormTeamPermission,
    message?: string,
  ): Promise<void> {
    const allowed = await this.hasPermissionOnForm(form, userId, permission);
    if (!allowed) {
      const member =
        form.userId !== userId
          ? await this.getAcceptedMembership(form.userId, userId)
          : null;

      throw new ForbiddenException({
        message:
          message ?? getPermissionDeniedMessage(permission, member?.role),
        code: 'INSUFFICIENT_PERMISSION',
        permission,
        role: member?.role ?? null,
      });
    }
  }

  async assertWorkspacePermission(
    workspaceId: string,
    userId: string,
    permission: FormTeamPermission,
    message?: string,
  ): Promise<void> {
    if (workspaceId === userId) return;

    const member = await this.getAcceptedMembership(workspaceId, userId);
    const permissions = member
      ? this.resolvePermissions(member.role, member.permissions)
      : [];
    if (!permissions.includes(permission)) {
      throw new ForbiddenException({
        message:
          message ?? getPermissionDeniedMessage(permission, member?.role),
        code: 'INSUFFICIENT_PERMISSION',
        permission,
        role: member?.role ?? null,
      });
    }
  }

  async canManageTeam(workspaceId: string, userId: string): Promise<boolean> {
    if (workspaceId === userId) return true;
    const member = await this.getAcceptedMembership(workspaceId, userId);
    if (!member) return false;
    return this.resolvePermissions(member.role, member.permissions).includes(
      'manage_team',
    );
  }

  resolvePermissions(
    role: FormTeamRole,
    custom?: string[],
  ): string[] {
    return custom?.length ? custom : getDefaultPermissionsForRole(role);
  }
}
