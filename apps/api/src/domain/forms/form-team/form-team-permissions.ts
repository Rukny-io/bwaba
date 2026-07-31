import { FormTeamRole } from '@prisma/client';

export const FORM_TEAM_PERMISSIONS = [
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
] as const;

export type FormTeamPermission = (typeof FORM_TEAM_PERMISSIONS)[number];

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

export function getDefaultPermissionsForRole(role: FormTeamRole): string[] {
  return [...ROLE_PERMISSIONS[role]];
}

export const FORM_TEAM_ROLE_LABELS: Record<FormTeamRole, string> = {
  ADMIN: 'مدير',
  EDITOR: 'محرر',
  ANALYST: 'محلل',
  VIEWER: 'مشاهد',
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

export function getPermissionDeniedMessage(
  permission: FormTeamPermission,
  role?: FormTeamRole | null,
): string {
  const base = PERMISSION_DENIED_MESSAGES[permission];
  if (!role) return base;
  return `${base} (دورك: ${FORM_TEAM_ROLE_LABELS[role]})`;
}
