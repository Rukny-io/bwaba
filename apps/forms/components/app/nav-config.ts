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

export const APP_BASE = '/app';

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  /** Match only exact path (e.g. dashboard home) */
  exact?: boolean;
};

/** Top navigation tabs — full-width primary sections */
export const mainTopNavTabs: NavItem[] = [
  { href: `${APP_BASE}/forms`, icon: FileText, label: 'النماذج' },
  { href: `${APP_BASE}/analytics`, icon: BarChart2, label: 'التحليلات' },
  { href: `${APP_BASE}/team`, icon: Users, label: 'الفريق' },
];

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

export type CommandPaletteItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
  exact?: boolean;
};

export type CommandPaletteSection = {
  id: string;
  label: string;
  items: CommandPaletteItem[];
};

/** Grouped destinations for the dashboard command palette */
export const commandPaletteSections: CommandPaletteSection[] = [
  {
    id: 'general',
    label: 'عام',
    items: [
      {
        href: APP_BASE,
        icon: LayoutGrid,
        label: 'لوحة التحكم',
        description: 'ملخص نشاطك وإحصائيات اليوم',
        exact: true,
      },
      {
        href: `${APP_BASE}/settings`,
        icon: Settings,
        label: 'الإعدادات',
        description: 'الحساب والمظهر والإشعارات',
      },
      {
        href: `${APP_BASE}/help`,
        icon: HelpCircle,
        label: 'المساعدة',
        description: 'الأسئلة الشائعة والدعم',
      },
    ],
  },
  {
    id: 'workspace',
    label: 'مساحة العمل',
    items: [
      {
        href: `${APP_BASE}/forms`,
        icon: FileText,
        label: 'النماذج',
        description: 'إنشاء نماذج وإدارة الاستجابات',
      },
      {
        href: `${APP_BASE}/analytics`,
        icon: BarChart2,
        label: 'التحليلات',
        description: 'متابعة الأداء ومؤشرات النماذج',
      },
      {
        href: `${APP_BASE}/templates`,
        icon: LayoutTemplate,
        label: 'القوالب',
        description: 'قوالب جاهزة للبدء السريع',
      },
      {
        href: `${APP_BASE}/team`,
        icon: Users,
        label: 'الفريق',
        description: 'إدارة الأعضاء والصلاحيات',
      },
    ],
  },
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
