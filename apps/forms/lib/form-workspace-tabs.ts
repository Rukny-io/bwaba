import type { LucideIcon } from 'lucide-react';
import {
  BarChart2,
  Inbox,
  Pencil,
  Plug,
} from 'lucide-react';

export type FormWorkspaceTabSuffix =
  | ''
  | '/submissions'
  | '/analytics'
  | '/integrations';

export const FORM_WORKSPACE_TABS: {
  suffix: FormWorkspaceTabSuffix;
  label: string;
  icon: LucideIcon;
  showCount?: boolean;
}[] = [
  { suffix: '', label: 'تحرير', icon: Pencil },
  { suffix: '/submissions', label: 'الاستجابات', icon: Inbox, showCount: true },
  { suffix: '/analytics', label: 'التحليلات', icon: BarChart2 },
  { suffix: '/integrations', label: 'التكاملات', icon: Plug },
];

export function parseFormWorkspacePath(pathname: string): {
  formId: string;
  suffix: FormWorkspaceTabSuffix;
} | null {
  const path =
    pathname.endsWith('/') && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  const match = path.match(
    /^\/app\/forms\/([^/]+)(\/(?:submissions|analytics|integrations))?$/,
  );
  if (!match) return null;

  return {
    formId: match[1],
    suffix: (match[2] ?? '') as FormWorkspaceTabSuffix,
  };
}

export function isFormWorkspaceTabActive(
  suffix: FormWorkspaceTabSuffix,
  currentSuffix: FormWorkspaceTabSuffix,
): boolean {
  return suffix === currentSuffix;
}

export function formWorkspaceHref(
  formId: string,
  suffix: FormWorkspaceTabSuffix,
): string {
  return `/app/forms/${formId}${suffix}`;
}
