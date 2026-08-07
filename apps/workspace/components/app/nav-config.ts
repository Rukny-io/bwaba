import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  Globe,
  Mail,
  Inbox,
  Settings,
  HelpCircle,
  PenLine,
} from 'lucide-react';

export const APP_BASE = '/app';

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
};

export type NavChild = {
  href: string;
  label: string;
  exact?: boolean;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  children: NavChild[];
  defaultOpen?: boolean;
};

export type SidebarNavEntry =
  | ({ type: 'link' } & NavItem)
  | ({ type: 'group' } & NavGroup);

export const sidebarNavEntries: SidebarNavEntry[] = [
  {
    type: 'link',
    href: APP_BASE,
    icon: LayoutGrid,
    label: 'لوحة التحكم',
    exact: true,
  },
  {
    type: 'link',
    href: `${APP_BASE}/mail`,
    icon: Inbox,
    label: 'البريد',
  },
  {
    type: 'link',
    href: `${APP_BASE}/domains`,
    icon: Globe,
    label: 'الدومينات',
  },
  {
    type: 'link',
    href: `${APP_BASE}/mailboxes`,
    icon: Mail,
    label: 'صناديق البريد',
  },
];

export const sidebarFooterItem: NavItem = {
  href: `${APP_BASE}/settings`,
  icon: Settings,
  label: 'الإعدادات',
};

export const primaryNavItems: NavItem[] = [
  { href: APP_BASE, icon: LayoutGrid, label: 'لوحة التحكم', exact: true },
  { href: `${APP_BASE}/mail`, icon: Inbox, label: 'البريد' },
  { href: `${APP_BASE}/domains`, icon: Globe, label: 'الدومينات' },
];

export const middleNavItems: NavItem[] = [
  { href: `${APP_BASE}/mailboxes`, icon: Mail, label: 'صناديق البريد' },
];

export const bottomNavItems: NavItem[] = [
  { href: `${APP_BASE}/settings`, icon: Settings, label: 'الإعدادات' },
  { href: `${APP_BASE}/help`, icon: HelpCircle, label: 'المساعدة' },
];

export const PAGE_LABELS: Record<string, string> = {
  app: 'لوحة التحكم',
  mail: 'البريد',
  compose: 'رسالة جديدة',
  domains: 'الدومينات',
  mailboxes: 'صناديق البريد',
  settings: 'الإعدادات',
  help: 'المساعدة',
};

export function isNavItemActive(
  pathname: string,
  href: string,
  exact?: boolean,
): boolean {
  const path =
    pathname.endsWith('/') && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  if (exact) {
    return path === href;
  }

  if (href === `${APP_BASE}/mail`) {
    return path === href || path.startsWith(`${href}/`);
  }

  if (href === APP_BASE) {
    return path === APP_BASE;
  }

  return path === href || path.startsWith(`${href}/`);
}

export function isNavGroupActive(pathname: string, group: NavGroup): boolean {
  return group.children.some((child) =>
    isNavItemActive(pathname, child.href, child.exact),
  );
}

export function resolvePageLabel(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.includes('compose')) return PAGE_LABELS.compose;

  const last = segments[segments.length - 1];
  if (last && PAGE_LABELS[last]) {
    return PAGE_LABELS[last];
  }

  if (segments.includes('mail') && segments.length > 2) {
    return 'محادثة';
  }

  return PAGE_LABELS.app;
}

export const composeNavItem: NavItem = {
  href: `${APP_BASE}/mail/compose`,
  icon: PenLine,
  label: 'رسالة جديدة',
};
