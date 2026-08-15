export type SidebarIconId =
  | 'inbox'
  | 'settings'
  | 'ai'
  | 'workflows'
  | 'instagram'
  | 'messenger';

export const APP_BASE = '/app';

/** Glass top bar — section tabs for the dashboard shell */
export const headerTopNavLinks: ReadonlyArray<{
  href: string;
  label: string;
  exact?: boolean;
  matchPaths?: readonly string[];
}> = [
  { href: APP_BASE, label: 'لوحة التحكم', exact: true },
];

/** @deprecated Use headerTopNavLinks — kept for any legacy imports */
export const mainTopNavTabs = headerTopNavLinks;

export function isNavItemActive(
  pathname: string,
  href: string,
  exact?: boolean,
  matchPaths?: readonly string[],
): boolean {
  const path =
    pathname.endsWith('/') && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  if (matchPaths?.length) {
    return matchPaths.some(
      (candidate) => path === candidate || path.startsWith(`${candidate}/`),
    );
  }

  if (exact) {
    return path === href;
  }

  if (href === APP_BASE) {
    return path === APP_BASE;
  }

  return path === href || path.startsWith(`${href}/`);
}
