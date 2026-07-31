/**
 * Workspace helpers for the Forms Next.js app.
 * Aligned with apps/app and apps/developer for a unified UX.
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

const ID_RE = /^[A-Za-z0-9_-]+$/;

function isValidId(value: string | null | undefined): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 128 && ID_RE.test(trimmed);
}

export function isValidWorkspaceId(value: unknown): value is string {
  return typeof value === 'string' && isValidId(value);
}

export function readActiveWorkspaceIdFromBrowser(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )active_workspace_id=([^;]*)/);
  if (!match) return null;
  const raw = decodeURIComponent(match[1] ?? '');
  return isValidId(raw) ? raw : null;
}

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
