import type { FormTeamRole } from '@/lib/form-team-api';
import {
  FORM_TEAM_ROLE_DESCRIPTIONS,
  FORM_TEAM_ROLE_LABELS,
} from '@/lib/form-team-api';
import type { FormDetail } from '@/lib/forms-api';

export type FormTeamPermission =
  | 'view_forms'
  | 'create_form'
  | 'edit_form'
  | 'delete_form'
  | 'publish_form'
  | 'view_submissions'
  | 'export_submissions'
  | 'view_analytics'
  | 'manage_integrations'
  | 'manage_webhooks'
  | 'manage_team';

export type FormAccessRole = FormTeamRole | 'OWNER';

const ROLE_PERMISSIONS: Record<FormTeamRole, FormTeamPermission[]> = {
  ADMIN: [
    'view_forms',
    'create_form',
    'edit_form',
    'delete_form',
    'publish_form',
    'view_submissions',
    'export_submissions',
    'view_analytics',
    'manage_integrations',
    'manage_webhooks',
    'manage_team',
  ],
  EDITOR: [
    'view_forms',
    'create_form',
    'edit_form',
    'publish_form',
    'view_submissions',
    'export_submissions',
    'view_analytics',
    'manage_integrations',
  ],
  ANALYST: [
    'view_forms',
    'view_submissions',
    'export_submissions',
    'view_analytics',
  ],
  VIEWER: ['view_submissions'],
};

const PERMISSION_DENIED_MESSAGES: Record<FormTeamPermission, string> = {
  view_forms: 'لا تملك صلاحية عرض هذا النموذج.',
  create_form: 'دورك الحالي لا يسمح بإنشاء نماذج في هذه المساحة.',
  edit_form: 'دورك الحالي لا يسمح بتعديل النموذج. يتطلب ذلك دور محرر أو أعلى.',
  delete_form: 'دورك الحالي لا يسمح بحذف النماذج.',
  publish_form: 'دورك الحالي لا يسمح بنشر أو إغلاق النموذج.',
  view_submissions:
    'دورك الحالي لا يسمح بعرض الاستجابات. يتطلب ذلك دور مشاهد أو أعلى.',
  export_submissions:
    'دورك الحالي لا يسمح بتصدير الاستجابات. يتطلب ذلك دور محلل أو أعلى.',
  view_analytics:
    'دورك الحالي لا يسمح بعرض التحليلات. يتطلب ذلك دور محلل أو أعلى.',
  manage_integrations:
    'دورك الحالي لا يسمح بإدارة التكاملات. يتطلب ذلك دور محرر أو أعلى.',
  manage_webhooks: 'دورك الحالي لا يسمح بإدارة الويب هوك.',
  manage_team: 'دورك الحالي لا يسمح بإدارة الفريق.',
};

const WORKSPACE_TAB_PERMISSIONS: Record<string, FormTeamPermission> = {
  '': 'edit_form',
  '/submissions': 'view_submissions',
  '/analytics': 'view_analytics',
  '/integrations': 'manage_integrations',
};

export function resolveFormAccessRole(form: FormDetail): FormAccessRole {
  if (!form.isShared) return 'OWNER';
  const role = form.sharedWorkspace?.role;
  if (
    role === 'ADMIN' ||
    role === 'EDITOR' ||
    role === 'ANALYST' ||
    role === 'VIEWER'
  ) {
    return role;
  }
  return 'VIEWER';
}

export function hasFormTeamPermission(
  role: FormAccessRole,
  permission: FormTeamPermission,
): boolean {
  if (role === 'OWNER') return true;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAccessFormWorkspaceTab(
  role: FormAccessRole,
  suffix: string,
): boolean {
  const permission = WORKSPACE_TAB_PERMISSIONS[suffix];
  if (!permission) return true;
  return hasFormTeamPermission(role, permission);
}

export function getPermissionDeniedCopy(
  permission: FormTeamPermission,
  role?: FormAccessRole | null,
): { title: string; description: string } {
  const roleLabel =
    role && role !== 'OWNER' ? FORM_TEAM_ROLE_LABELS[role] : null;
  const roleHint =
    role && role !== 'OWNER' ? FORM_TEAM_ROLE_DESCRIPTIONS[role] : null;

  return {
    title: 'صلاحية غير كافية',
    description: [
      PERMISSION_DENIED_MESSAGES[permission],
      roleLabel ? `دورك الحالي: ${roleLabel}.` : null,
      roleHint,
    ]
      .filter(Boolean)
      .join(' '),
  };
}

export function getWorkspaceTabPermission(
  suffix: string,
): FormTeamPermission | null {
  return WORKSPACE_TAB_PERMISSIONS[suffix] ?? null;
}

export function getDefaultFormWorkspacePath(
  formId: string,
  role: FormAccessRole,
): string {
  const base = `/app/forms/${formId}`;
  const tabOrder = ['', '/submissions', '/analytics', '/integrations'] as const;
  for (const suffix of tabOrder) {
    if (canAccessFormWorkspaceTab(role, suffix)) {
      return `${base}${suffix}`;
    }
  }
  return base;
}
