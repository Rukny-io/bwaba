/**
 * إدارة مساحة العمل النشطة (Workspace switcher).
 *
 * الفكرة:
 * - المستخدم قد يكون مالكاً لمساحته الشخصية، و/أو عضواً في مساحات عمل أخرى.
 * - نخزّن معرّف مساحة العمل النشطة في cookie اسمه `active_workspace_id`.
 * - كل استدعاءات الـ API الصادرة من هذا التطبيق تُضيف ترويسة `X-Workspace-Id`
 *   إن كانت هناك مساحة مختارة.
 */

export const ACTIVE_WORKSPACE_COOKIE = 'active_workspace_id';
export const ACTIVE_WORKSPACE_HEADER = 'X-Workspace-Id';

export type WorkspaceRoleOrOwner =
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'DEVELOPER'
  | 'SUPPORT'
  | 'VIEWER';

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

const COOKIE_NAME_RE = /^[A-Za-z0-9_-]+$/;

function isValidId(value: string | null | undefined): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 128 && COOKIE_NAME_RE.test(trimmed);
}

/** يقرأ الكوكي من المتصفح. آمن للاستدعاء أثناء SSR (يعيد null). */
export function readActiveWorkspaceIdFromBrowser(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    /(?:^|; )active_workspace_id=([^;]*)/,
  );
  if (!match) return null;
  const raw = decodeURIComponent(match[1] ?? '');
  return isValidId(raw) ? raw : null;
}

/** يحدّث/يزيل الكوكي على المتصفح. */
export function writeActiveWorkspaceIdInBrowser(id: string | null): void {
  if (typeof document === 'undefined') return;
  const isSecure =
    typeof window !== 'undefined' && window.location.protocol === 'https:';

  if (!id) {
    document.cookie = [
      `${ACTIVE_WORKSPACE_COOKIE}=`,
      'Path=/',
      'Max-Age=0',
      'SameSite=Lax',
      isSecure ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ');
    return;
  }

  if (!isValidId(id)) return;

  document.cookie = [
    `${ACTIVE_WORKSPACE_COOKIE}=${encodeURIComponent(id)}`,
    'Path=/',
    `Max-Age=${30 * 24 * 60 * 60}`,
    'SameSite=Lax',
    isSecure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export function isValidWorkspaceId(value: unknown): value is string {
  return typeof value === 'string' && isValidId(value);
}
