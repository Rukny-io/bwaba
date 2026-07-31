import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InvitationStatus, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { WORKSPACE_MANAGE_ROLES } from './workspace-roles.config';
import {
  permissionsForRole,
  roleHasPermission,
  WorkspacePermission,
} from './workspace-permissions.config';

export type WorkspaceRoleOrOwner = WorkspaceRole | 'OWNER';

export interface WorkspaceAccessRecord {
  workspaceId: string;
  ownerId: string;
  role: WorkspaceRoleOrOwner;
  memberId: string | null;
  isOwner: boolean;
}

export interface AccessibleWorkspace {
  id: string;
  ownerId: string;
  role: WorkspaceRoleOrOwner;
  isOwner: boolean;
  owner: {
    email: string;
    profile: {
      name: string | null;
      username: string | null;
      avatar: string | null;
    } | null;
  };
}

@Injectable()
export class WorkspaceAccessService {
  constructor(private readonly prisma: PrismaService) {}

  isWorkspaceOwner(workspaceId: string, userId: string): boolean {
    return workspaceId === userId;
  }

  /**
   * يحسم الوصول لمساحة العمل: يعيد الدور الفعلي أو `null` إذا لم يكن عضواً.
   * لا يرمي أي خطأ (للاستخدام من الـ middleware).
   */
  async resolveAccess(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceAccessRecord | null> {
    if (this.isWorkspaceOwner(workspaceId, userId)) {
      const owner = await this.prisma.user.findUnique({
        where: { id: workspaceId },
        select: { id: true },
      });
      if (!owner) return null;
      return {
        workspaceId,
        ownerId: workspaceId,
        role: 'OWNER',
        memberId: null,
        isOwner: true,
      };
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      select: { id: true, role: true, status: true },
    });

    if (!membership || membership.status !== InvitationStatus.ACCEPTED) {
      return null;
    }

    return {
      workspaceId,
      ownerId: workspaceId,
      role: membership.role,
      memberId: membership.id,
      isOwner: false,
    };
  }

  /**
   * يعيد قائمة مساحات العمل التي يستطيع المستخدم الوصول إليها:
   * - مساحته الشخصية (دائماً كمالك)
   * - كل مساحات العمل التي هو عضو نشط فيها
   */
  async listAccessibleWorkspaces(userId: string): Promise<AccessibleWorkspace[]> {
    const [selfUser, memberships] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          profile: {
            select: { name: true, username: true, avatar: true },
          },
        },
      }),
      this.prisma.workspaceMember.findMany({
        where: { userId, status: InvitationStatus.ACCEPTED },
        select: {
          role: true,
          workspaceId: true,
          workspace: {
            select: {
              id: true,
              email: true,
              profile: {
                select: { name: true, username: true, avatar: true },
              },
            },
          },
        },
        orderBy: { acceptedAt: 'desc' },
      }),
    ]);

    const results: AccessibleWorkspace[] = [];

    if (selfUser) {
      results.push({
        id: selfUser.id,
        ownerId: selfUser.id,
        role: 'OWNER',
        isOwner: true,
        owner: { email: selfUser.email, profile: selfUser.profile },
      });
    }

    for (const membership of memberships) {
      if (!membership.workspace) continue;
      results.push({
        id: membership.workspace.id,
        ownerId: membership.workspace.id,
        role: membership.role,
        isOwner: false,
        owner: {
          email: membership.workspace.email,
          profile: membership.workspace.profile,
        },
      });
    }

    return results;
  }

  hasPermission(
    role: WorkspaceRoleOrOwner,
    permission: WorkspacePermission,
  ): boolean {
    if (role === 'OWNER') return true;
    return roleHasPermission(role, permission);
  }

  /**
   * يرمي `ForbiddenException` إذا كان الدور لا يملك الصلاحية.
   */
  assertPermission(
    role: WorkspaceRoleOrOwner,
    permission: WorkspacePermission,
    message = 'ليس لديك الصلاحية الكافية لهذه العملية',
  ): void {
    if (!this.hasPermission(role, permission)) {
      throw new ForbiddenException({
        message,
        code: 'WORKSPACE_PERMISSION_DENIED',
        permission,
      });
    }
  }

  async assertCanManageTeam(
    workspaceId: string,
    requesterId: string,
    message = 'ليس لديك صلاحية إدارة الفريق',
  ): Promise<void> {
    if (this.isWorkspaceOwner(workspaceId, requesterId)) {
      return;
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: requesterId },
      },
    });

    if (
      membership?.status === InvitationStatus.ACCEPTED &&
      WORKSPACE_MANAGE_ROLES.includes(membership.role)
    ) {
      return;
    }

    throw new ForbiddenException(message);
  }

  async getAcceptedRole(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceRoleOrOwner | null> {
    const access = await this.resolveAccess(workspaceId, userId);
    return access?.role ?? null;
  }

  /**
   * التحقق من أن مساحة العمل موجودة (المالك موجود ولم يُحذف).
   * يُستخدم في الـ middleware قبل حسم الدور.
   */
  async assertWorkspaceExists(workspaceId: string): Promise<void> {
    const owner = await this.prisma.user.findUnique({
      where: { id: workspaceId },
      select: { id: true },
    });
    if (!owner) {
      throw new NotFoundException('مساحة العمل غير موجودة');
    }
  }

  permissionsForRole(role: WorkspaceRoleOrOwner): ReadonlySet<WorkspacePermission> | 'ALL' {
    if (role === 'OWNER') return 'ALL';
    return permissionsForRole(role);
  }
}
