import { WorkspaceRole } from '@prisma/client';

export const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
  ADMIN: 'مدير',
  MANAGER: 'مشرف',
  DEVELOPER: 'مطوّر',
  SUPPORT: 'دعم',
  VIEWER: 'مشاهد',
};

export const WORKSPACE_MANAGE_ROLES: WorkspaceRole[] = ['ADMIN'];
