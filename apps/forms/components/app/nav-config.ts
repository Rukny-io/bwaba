import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  FileText,
  LayoutTemplate,
  BarChart2,
  Settings,
  HelpCircle,
  Users,
} from 'lucide-react';
import { FORMS_CREATE_ENTRY_PATH } from '@/lib/forms-paths';

export const APP_BASE = '/app';

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  /** Match only exact path (e.g. dashboard home) */
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

/** Desktop sidebar: leaf links + collapsible groups (like reference UI) */
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
    href: `${APP_BASE}/analytics`,
    icon: BarChart2,
    label: 'تحليلات',
  },
  {
    type: 'group',
    id: 'forms',
    label: 'النماذج',
    icon: FileText,
    defaultOpen: true,
    children: [
      { href: `${APP_BASE}/forms`, label: 'كل النماذج' },
      { href: FORMS_CREATE_ENTRY_PATH, label: 'إنشاء نموذج' },
    ],
  },
  {
    type: 'link',
    href: `${APP_BASE}/templates`,
    icon: LayoutTemplate,
    label: 'قوالب',
  },
  {
    type: 'link',
    href: `${APP_BASE}/team`,
    icon: Users,
    label: 'الفريق',
  },
];

export const sidebarFooterItem: NavItem = {
  href: `${APP_BASE}/settings`,
  icon: Settings,
  label: 'الإعدادات',
};

/** Flat items for mobile dock / simpler nav surfaces */
export const primaryNavItems: NavItem[] = [
  { href: APP_BASE, icon: LayoutGrid, label: 'لوحة التحكم', exact: true },
  { href: `${APP_BASE}/forms`, icon: FileText, label: 'نماذجي' },
  { href: `${APP_BASE}/templates`, icon: LayoutTemplate, label: 'قوالب' },
];

export const middleNavItems: NavItem[] = [
  { href: `${APP_BASE}/analytics`, icon: BarChart2, label: 'تحليلات' },
  { href: `${APP_BASE}/team`, icon: Users, label: 'الفريق' },
];

export const bottomNavItems: NavItem[] = [
  { href: `${APP_BASE}/settings`, icon: Settings, label: 'الإعدادات' },
  { href: `${APP_BASE}/help`, icon: HelpCircle, label: 'المساعدة' },
];

export const PAGE_LABELS: Record<string, string> = {
  app: 'لوحة التحكم',
  forms: 'نماذجي',
  new: 'إنشاء نموذج',
  templates: 'قوالب',
  integrations: 'التكاملات',
  analytics: 'تحليلات',
  team: 'الفريق',
  settings: 'الإعدادات',
  help: 'المساعدة',
  notifications: 'الإشعارات',
  submissions: 'الاستجابات',
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

  if (segments.includes('creating')) return 'إعداد النموذج';
  if (segments.includes('forms') && segments.includes('n') && segments.includes('new')) {
    return PAGE_LABELS.new;
  }

  if (segments.includes('submissions')) return PAGE_LABELS.submissions;
  if (segments.includes('analytics') && segments.includes('forms')) {
    return PAGE_LABELS.analytics;
  }

  const last = segments[segments.length - 1];
  if (last && PAGE_LABELS[last]) {
    return PAGE_LABELS[last];
  }

  if (segments.length >= 2 && segments[0] === 'app' && segments[1] === 'forms') {
    return 'تفاصيل النموذج';
  }

  return PAGE_LABELS.app;
}
