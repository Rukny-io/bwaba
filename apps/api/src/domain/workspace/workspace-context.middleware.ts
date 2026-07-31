import { WorkspaceRoleOrOwner } from './workspace-access.service';

/**
 * سياق مساحة العمل الفعلي لكل طلب مصادَق عليه.
 * يُلحق بواسطة `WorkspaceGuard` (في نفس الوحدة) عند تنفيذ الطلب.
 */
export interface WorkspaceContext {
  /** معرّف مساحة العمل (= معرّف المالك). */
  id: string;
  ownerId: string;
  /** الدور الفعلي للمستخدم داخل مساحة العمل. */
  role: WorkspaceRoleOrOwner;
  /** هل هو المالك؟ */
  isOwner: boolean;
  /** معرف صف WorkspaceMember إذا كان عضواً (وليس المالك). */
  memberId: string | null;
  /** المستخدم الفعلي الذي قام بالطلب (قد يختلف عن المالك). */
  actorId: string;
  /** هل تم تحديد المساحة صراحة عبر header/cookie؟ */
  explicit: boolean;
}

declare module 'express-serve-static-core' {
  interface Request {
    workspace?: WorkspaceContext;
  }
}

export const WORKSPACE_HEADER = 'x-workspace-id';
export const WORKSPACE_COOKIE = 'active_workspace_id';

export function readRequestedWorkspaceId(req: {
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
}): string | null {
  const headerRaw = req.headers[WORKSPACE_HEADER];
  const headerValue = Array.isArray(headerRaw) ? headerRaw[0] : headerRaw;
  const fromHeader = sanitizeId(headerValue);
  if (fromHeader) return fromHeader;
  return sanitizeId(req.cookies?.[WORKSPACE_COOKIE]);
}

function sanitizeId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 128) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}
