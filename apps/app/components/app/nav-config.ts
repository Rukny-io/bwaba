import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  Link2,
  BarChart2,
  Settings,
  HelpCircle,
  Palette,
  Package,
  ShoppingBag,
} from 'lucide-react';

export const APP_BASE = '/app';

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
};

export const primaryNavItems: NavItem[] = [
  { href: APP_BASE, icon: LayoutGrid, label: 'لوحة التحكم', exact: true },
  { href: `${APP_BASE}/links`, icon: Link2, label: 'روابطي' },
  { href: `${APP_BASE}/products`, icon: Package, label: 'المنتجات' },
  { href: `${APP_BASE}/orders`, icon: ShoppingBag, label: 'الطلبات' },
  { href: `${APP_BASE}/analytics`, icon: BarChart2, label: 'تحليلات' },
];

export const middleNavItems: NavItem[] = [
  {
    href: `${APP_BASE}/settings/appearance`,
    icon: Palette,
    label: 'المظهر',
  },
];

export const bottomNavItems: NavItem[] = [
  { href: `${APP_BASE}/settings`, icon: Settings, label: 'الإعدادات' },
  { href: `${APP_BASE}/help`, icon: HelpCircle, label: 'المساعدة' },
];

export const PAGE_LABELS: Record<string, string> = {
  app: 'لوحة التحكم',
  links: 'روابطي',
  products: 'المنتجات',
  orders: 'الطلبات',
  analytics: 'تحليلات',
  settings: 'الإعدادات',
  appearance: 'المظهر',
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

  if (href === APP_BASE) {
    return path === APP_BASE;
  }

  return path === href || path.startsWith(`${href}/`);
}

export function resolvePageLabel(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];

  if (last && PAGE_LABELS[last]) {
    return PAGE_LABELS[last];
  }

  return PAGE_LABELS.app;
}
