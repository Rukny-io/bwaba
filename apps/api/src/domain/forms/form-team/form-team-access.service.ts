import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import {
  type FormTeamPermission,
  getDefaultPermissionsForRole,
  getPermissionDeniedMessage,
} from './form-team-permissions';
import { FormTeamRole, InvitationStatus } from '@prisma/client';
import { WorkspaceAccessService } from '../../workspace/workspace-access.service';
import { WorkspacePermission } from '../../workspace/workspace-permissions.config';

type FormOwnerRef = { id: string; userId: string };

// جسر بين صلاحيات فرق النماذج القديمة وصلاحيات مساحة العمل الموحّدة.
const FORM_PERMISSION_TO_WORKSPACE: Record<FormTeamPermission, WorkspacePermission> = {
  view_forms: 'forms:read',
  create_form: 'forms:write',
  edit_form: 'forms:write',
  delete_form: 'forms:write',
  publish_form: 'forms:write',
  view_submissions: 'forms:submissions:read',
  export_submissions: 'forms:export:read',
  view_analytics: 'forms:analytics:read',
  manage_integrations: 'forms:write',
  manage_webhooks: 'forms:write',
  // إدارة الفريق تبقى مقصورة على مالك مساحة العمل (لا mapping).
  manage_team: 'workspace:members:write',
};

@Injectable()
export class FormTeamAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  private async hasWorkspaceAccess(
    workspaceOwnerId: string,
    userId: string,
    permission: FormTeamPermission,
  ): Promise<boolean> {
    if (workspaceOwnerId === userId) return true;
    const access = await this.workspaceAccess.resolveAccess(
      workspaceOwnerId,
      userId,
    );
    if (!access) return false;
    if (access.isOwner) return true;
    const wsPermission = FORM_PERMISSION_TO_WORKSPACE[permission];
    if (!wsPermission) return false;
    return this.workspaceAccess.hasPermission(access.role, wsPermission);
  }

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
    if (member) {
      const permissions = this.resolvePermissions(member.role, member.permissions);
      if (permissions.includes(permission)) return true;
    }

    // بديل: التحقق عبر عضوية مساحة العمل الموحّدة (WorkspaceMember).
    return this.hasWorkspaceAccess(form.userId, userId, permission);
  }

  async hasAnyFormTeamAccess(
    form: FormOwnerRef,
    userId: string,
  ): Promise<boolean> {
    if (form.userId === userId) return true;
    const member = await this.getAcceptedMembership(form.userId, userId);
    if (member?.status === InvitationStatus.ACCEPTED) return true;
    // بديل: أي عضوية مقبولة في مساحة العمل الموحّدة تعطي وصولاً للقراءة.
    const access = await this.workspaceAccess.resolveAccess(form.userId, userId);
    return Boolean(access);
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
    if (permissions.includes(permission)) return;

    // fallback إلى صلاحيات مساحة العمل الموحّدة
    if (await this.hasWorkspaceAccess(workspaceId, userId, permission)) return;

    throw new ForbiddenException({
      message:
        message ?? getPermissionDeniedMessage(permission, member?.role),
      code: 'INSUFFICIENT_PERMISSION',
      permission,
      role: member?.role ?? null,
    });
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
