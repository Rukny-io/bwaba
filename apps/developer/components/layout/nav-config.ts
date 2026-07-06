import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  KeyRound,
  Settings,
  Package,
} from 'lucide-react';
import { extractAppIdFromPath, appSettings, appProducts } from '@/lib/app-routes';

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
};

export function getPrimaryNavItems(appId: string): NavItem[] {
  const base = `/apps/${appId}`;
  return [
    {
      href: appSettings(appId),
      icon: Settings,
      label: 'إعدادات التطبيق',
      exact: true,
    },
    { href: `${base}/dashboard`, icon: LayoutGrid, label: 'الرئيسية', exact: true },
    { href: `${base}/api-keys`, icon: KeyRound, label: 'مفاتيح API' },
  ];
}

export function getMiddleNavItems(_appId: string): NavItem[] {
  return [];
}

export function getBottomNavItems(_appId: string): NavItem[] {
  return [];
}

export function getAllNavItems(appId: string): NavItem[] {
  return [
    ...getPrimaryNavItems(appId),
    ...getMiddleNavItems(appId),
    ...getBottomNavItems(appId),
  ];
}

/** Items shown in the floating mobile dock (4 slots + More). */
export function getMobileDockItems(appId: string): NavItem[] {
  return getPrimaryNavItems(appId);
}

/** كتالوج المنتجات — يُفتح من زر + في الشريط السفلي */
export function getProductsCatalogNavItem(appId: string): NavItem {
  return { href: appProducts(appId), icon: Package, label: 'المنتجات' };
}

/** Items shown in the mobile More drawer. */
export function getMobileDrawerItems(appId: string): NavItem[] {
  return [getProductsCatalogNavItem(appId)];
}

export type SidebarLabelMap = {
  dashboard: string;
  keys: string;
  products: string;
  docs: string;
  apps: string;
  appSettings: string;
  help: string;
  logout: string;
  more: string;
};

export function resolveNavItemLabel(label: string, labels: SidebarLabelMap): string {
  const map: Record<string, string> = {
    الرئيسية: labels.dashboard,
    'مفاتيح API': labels.keys,
    المنتجات: labels.products,
    التوثيق: labels.docs,
    التطبيقات: labels.apps,
    'إعدادات التطبيق': labels.appSettings,
    المساعدة: labels.help,
  };
  return map[label] ?? label;
}

/** @deprecated Use getPrimaryNavItems(appId) */
export const primaryNavItems: NavItem[] = getPrimaryNavItems('0');

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

  return path === href || path.startsWith(`${href}/`);
}

export function resolvePageLabel(pathname: string): string {
  const appId = extractAppIdFromPath(pathname);
  const path =
    pathname.endsWith('/') && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  if (appId) {
    const settingsHref = appSettings(appId);
    if (isNavItemActive(pathname, settingsHref, true)) {
      return 'إعدادات التطبيق';
    }

    const item = getAllNavItems(appId).find((nav) =>
      isNavItemActive(pathname, nav.href, nav.exact),
    );
    if (item) return item.label;
  }

  if (path === '/apps' || path === '/apps/creation') {
    return path === '/apps/creation' ? 'إنشاء تطبيق' : 'تطبيقاتي';
  }

  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  const labels: Record<string, string> = {
    dashboard: 'الرئيسية',
    'api-keys': 'مفاتيح API',
    products: 'المنتجات',
    forms: 'النماذج',
    whatsapp: 'WhatsApp Business',
    'whatsapp-api': 'WhatsApp API',
    docs: 'WhatsApp API',
    settings: 'إعدادات التطبيق',
    apps: 'تطبيقاتي',
    creation: 'إنشاء تطبيق',
  };
  return labels[last] ?? 'لوحة المطوّرين';
}
