import { WorkspaceRole } from '@prisma/client';

/**
 * صلاحيات دقيقة يُتحقق منها على مستوى الـ endpoint.
 * الصيغة: `<domain>:<resource>:<action>` بحيث `read` أقل من `write`.
 *
 * الصلاحيات مصممة لتكون قابلة للتوسع تدريجياً على باقي التطبيقات
 * (المتجر، النماذج، الفعاليات) في مراحل لاحقة.
 */
export type WorkspacePermission =
  // Developer domain
  | 'developer:apps:read'
  | 'developer:apps:write'
  | 'developer:api-keys:read'
  | 'developer:api-keys:write'
  | 'developer:webhooks:read'
  | 'developer:webhooks:write'
  | 'developer:contacts:read'
  | 'developer:contacts:write'
  | 'developer:forms:read'
  | 'developer:forms:write'
  | 'developer:products:read'
  | 'developer:products:write'
  | 'developer:usage:read'
  | 'developer:wallet:read'
  | 'developer:wallet:write'
  | 'developer:subscription:read'
  | 'developer:subscription:write'
  // Forms domain (Rukny Forms builder)
  | 'forms:read'
  | 'forms:write'
  | 'forms:submissions:read'
  | 'forms:submissions:write'
  | 'forms:analytics:read'
  | 'forms:export:read'
  // Store domain
  | 'store:products:read'
  | 'store:products:write'
  | 'store:orders:read'
  | 'store:orders:write'
  | 'store:coupons:read'
  | 'store:coupons:write'
  | 'store:settings:read'
  | 'store:settings:write'
  | 'store:analytics:read'
  // Workspace administration
  | 'workspace:members:read'
  | 'workspace:members:write';

export type WorkspacePermissionSet = ReadonlySet<WorkspacePermission>;

const ALL_DEV_READ: WorkspacePermission[] = [
  'developer:apps:read',
  'developer:api-keys:read',
  'developer:webhooks:read',
  'developer:contacts:read',
  'developer:forms:read',
  'developer:products:read',
  'developer:usage:read',
  'developer:subscription:read',
];

const ALL_DEV_WRITE: WorkspacePermission[] = [
  'developer:apps:write',
  'developer:api-keys:write',
  'developer:webhooks:write',
  'developer:contacts:write',
  'developer:forms:write',
  'developer:products:write',
];

const ADMIN_ONLY: WorkspacePermission[] = [
  'workspace:members:read',
  'workspace:members:write',
  'developer:wallet:read',
  'developer:wallet:write',
  'developer:subscription:write',
];

const ALL_FORMS_READ: WorkspacePermission[] = [
  'forms:read',
  'forms:submissions:read',
  'forms:analytics:read',
  'forms:export:read',
];

const ALL_FORMS_WRITE: WorkspacePermission[] = [
  'forms:write',
  'forms:submissions:write',
];

const ALL_STORE_READ: WorkspacePermission[] = [
  'store:products:read',
  'store:orders:read',
  'store:coupons:read',
  'store:settings:read',
  'store:analytics:read',
];

const ALL_STORE_WRITE: WorkspacePermission[] = [
  'store:products:write',
  'store:orders:write',
  'store:coupons:write',
  'store:settings:write',
];

const ROLE_PERMISSION_MATRIX: Record<WorkspaceRole, WorkspacePermission[]> = {
  ADMIN: [
    ...ALL_DEV_READ,
    ...ALL_DEV_WRITE,
    ...ADMIN_ONLY,
    ...ALL_STORE_READ,
    ...ALL_STORE_WRITE,
    ...ALL_FORMS_READ,
    ...ALL_FORMS_WRITE,
  ],
  MANAGER: [
    ...ALL_DEV_READ,
    'workspace:members:read',
    ...ALL_STORE_READ,
    ...ALL_STORE_WRITE,
    ...ALL_FORMS_READ,
    ...ALL_FORMS_WRITE,
  ],
  DEVELOPER: [
    ...ALL_DEV_READ,
    ...ALL_DEV_WRITE,
    'developer:wallet:read',
    ...ALL_FORMS_READ,
    ...ALL_FORMS_WRITE,
  ],
  SUPPORT: [
    'developer:contacts:read',
    'developer:apps:read',
    'developer:usage:read',
    'store:orders:read',
    'store:orders:write',
    'store:products:read',
    'store:coupons:read',
    'forms:read',
    'forms:submissions:read',
  ],
  VIEWER: [
    ...ALL_DEV_READ,
    ...ALL_STORE_READ,
    ...ALL_FORMS_READ,
  ],
};

const ROLE_PERMISSION_SETS: Record<WorkspaceRole, WorkspacePermissionSet> = {
  ADMIN: new Set(ROLE_PERMISSION_MATRIX.ADMIN),
  MANAGER: new Set(ROLE_PERMISSION_MATRIX.MANAGER),
  DEVELOPER: new Set(ROLE_PERMISSION_MATRIX.DEVELOPER),
  SUPPORT: new Set(ROLE_PERMISSION_MATRIX.SUPPORT),
  VIEWER: new Set(ROLE_PERMISSION_MATRIX.VIEWER),
};

/** أدوار الفريق (بدون المالك). */
export function permissionsForRole(role: WorkspaceRole): WorkspacePermissionSet {
  return ROLE_PERMISSION_SETS[role];
}

/** المالك لديه كل الصلاحيات دائماً. */
export function ownerHasAllPermissions(): true {
  return true;
}

export function roleHasPermission(
  role: WorkspaceRole,
  permission: WorkspacePermission,
): boolean {
  return ROLE_PERMISSION_SETS[role].has(permission);
}
