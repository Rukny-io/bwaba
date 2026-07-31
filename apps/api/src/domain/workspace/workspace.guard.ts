import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { WorkspaceAccessService } from './workspace-access.service';
import {
  readRequestedWorkspaceId,
  WorkspaceContext,
} from './workspace-context.middleware';
import { WorkspacePermission } from './workspace-permissions.config';
import { WORKSPACE_PERMISSIONS_KEY } from './workspace-permission-key';

/**
 * حراسة تعمل بعد `GlobalJwtAuthGuard`. تفعل شيئين:
 *
 * 1. **حسم مساحة العمل**: تقرأ `X-Workspace-Id` من الترويسة/الكوكي وتلحق `req.workspace`.
 *    إن لم تُحدَّد صراحة، تستخدم مساحة المستخدم الشخصية (workspaceId = userId).
 * 2. **التحقق من الصلاحيات** (اختياري): إذا وُضع `@RequiresWorkspacePermission()`
 *    على الـ endpoint، تتحقق أن الدور يملك واحدة على الأقل من الصلاحيات المطلوبة.
 *
 * يجب استخدامها بعد `JwtAuthGuard` أو بعد `GlobalJwtAuthGuard` تلقائياً.
 */
@Injectable()
export class WorkspaceGuard implements CanActivate {
  private readonly logger = new Logger(WorkspaceGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly access: WorkspaceAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { workspace?: WorkspaceContext }>();
    const user = req.user as { id: string } | undefined;

    if (!user?.id) {
      throw new UnauthorizedException('يجب تسجيل الدخول');
    }

    if (!req.workspace) {
      const requested = readRequestedWorkspaceId({
        headers: req.headers as Record<string, string | string[] | undefined>,
        cookies: (req as unknown as { cookies?: Record<string, string> }).cookies,
      });
      const workspaceId = requested ?? user.id;

      const access = await this.access.resolveAccess(workspaceId, user.id);
      if (!access) {
        if (requested && requested !== user.id) {
          throw new ForbiddenException({
            message: 'ليس لديك وصول إلى مساحة العمل المحددة',
            code: 'WORKSPACE_ACCESS_DENIED',
          });
        }
        throw new UnauthorizedException('حساب المستخدم غير موجود');
      }

      req.workspace = {
        id: access.workspaceId,
        ownerId: access.ownerId,
        role: access.role,
        isOwner: access.isOwner,
        memberId: access.memberId,
        actorId: user.id,
        explicit: Boolean(requested),
      };
    }

    const requiredPermissions = this.reflector.getAllAndOverride<
      WorkspacePermission[] | undefined
    >(WORKSPACE_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const workspace = req.workspace;
    const hasAny = requiredPermissions.some((perm) =>
      this.access.hasPermission(workspace.role, perm),
    );

    if (!hasAny) {
      throw new ForbiddenException({
        message: 'ليس لديك الصلاحية الكافية لهذه العملية',
        code: 'WORKSPACE_PERMISSION_DENIED',
        required: requiredPermissions,
        role: workspace.role,
      });
    }

    return true;
  }
}
