import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  Link2,
  BarChart2,
  Settings,
  HelpCircle,
  Package,
  ShoppingBag,
  Layers,
  Percent,
} from 'lucide-react';
import type { DashboardLocale } from '@/lib/settings/dashboard-locale';

export const APP_BASE = '/app';
export const PRODUCTS_SECTION_BASE = `${APP_BASE}/products`;
export const ORDERS_HREF = `${APP_BASE}/orders`;

export type NavItem = {
  href: string;
  icon?: LucideIcon;
  label: string;
  labelEn: string;
  exact?: boolean;
};

export function getNavLabel(
  item: Pick<NavItem, 'label' | 'labelEn'>,
  locale: DashboardLocale,
): string {
  return locale === 'en' ? item.labelEn : item.label;
}

/** Top navigation tabs — primary sections on desktop */
export const mainTopNavTabs: NavItem[] = [
  { href: APP_BASE, icon: LayoutGrid, label: 'الرئيسية', labelEn: 'Home', exact: true },
  { href: `${APP_BASE}/links`, icon: Link2, label: 'روابطي', labelEn: 'My links' },
  { href: PRODUCTS_SECTION_BASE, icon: Package, label: 'المنتجات', labelEn: 'Products' },
  { href: `${APP_BASE}/analytics`, icon: BarChart2, label: 'التحليلات', labelEn: 'Analytics' },
];

/** Sub-navigation when inside the products / store section */
export const productsSubNavTabs: NavItem[] = [
  {
    href: PRODUCTS_SECTION_BASE,
    icon: Package,
    label: 'المنتجات',
    labelEn: 'Products',
    exact: true,
  },
  {
    href: `${PRODUCTS_SECTION_BASE}/collections`,
    icon: Layers,
    label: 'التصنيفات',
    labelEn: 'Collections',
  },
  {
    href: `${PRODUCTS_SECTION_BASE}/discounts`,
    icon: Percent,
    label: 'الخصومات',
    labelEn: 'Discounts',
  },
  { href: ORDERS_HREF, icon: ShoppingBag, label: 'الطلبات', labelEn: 'Orders' },
];

/** Main mobile dock (single pill) */
export const primaryDockItems: NavItem[] = [
  { href: APP_BASE, icon: LayoutGrid, label: 'الرئيسية', labelEn: 'Home', exact: true },
  { href: `${APP_BASE}/links`, icon: Link2, label: 'روابطي', labelEn: 'My links' },
  { href: PRODUCTS_SECTION_BASE, icon: Package, label: 'المنتجات', labelEn: 'Products' },
  {
    href: `${PRODUCTS_SECTION_BASE}/collections`,
    icon: Layers,
    label: 'التصنيفات',
    labelEn: 'Collections',
  },
  { href: `${APP_BASE}/settings`, icon: Settings, label: 'الإعدادات', labelEn: 'Settings' },
];

/** Mobile dock after opening المنتجات */
export const productsDockItems: NavItem[] = [
  {
    href: PRODUCTS_SECTION_BASE,
    icon: Package,
    label: 'المنتجات',
    labelEn: 'Products',
    exact: true,
  },
  {
    href: `${PRODUCTS_SECTION_BASE}/collections`,
    icon: Layers,
    label: 'التصنيفات',
    labelEn: 'Collections',
  },
  { href: ORDERS_HREF, icon: ShoppingBag, label: 'الطلبات', labelEn: 'Orders' },
  {
    href: `${PRODUCTS_SECTION_BASE}/discounts`,
    icon: Percent,
    label: 'الخصومات',
    labelEn: 'Discounts',
  },
];

/** @deprecated Prefer primaryDockItems */
export const primaryNavItems: NavItem[] = primaryDockItems;

export const middleNavItems: NavItem[] = [
  { href: ORDERS_HREF, icon: ShoppingBag, label: 'الطلبات', labelEn: 'Orders' },
  { href: `${APP_BASE}/analytics`, icon: BarChart2, label: 'التحليلات', labelEn: 'Analytics' },
];

export const bottomNavItems: NavItem[] = [
  { href: `${APP_BASE}/settings`, icon: Settings, label: 'الإعدادات', labelEn: 'Settings' },
  { href: `${APP_BASE}/help`, icon: HelpCircle, label: 'المساعدة', labelEn: 'Help' },
];

export type CommandPaletteItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  exact?: boolean;
};

export type CommandPaletteSection = {
  id: string;
  label: string;
  labelEn: string;
  items: CommandPaletteItem[];
};

/** Grouped destinations for the dashboard command palette */
export const commandPaletteSections: CommandPaletteSection[] = [
  {
    id: 'general',
    label: 'عام',
    labelEn: 'General',
    items: [
      {
        href: APP_BASE,
        icon: LayoutGrid,
        label: 'لوحة التحكم',
        labelEn: 'Dashboard',
        description: 'ملخص نشاطك وإحصائيات اليوم',
        descriptionEn: 'Your activity summary and today’s stats',
        exact: true,
      },
      {
        href: `${APP_BASE}/settings`,
        icon: Settings,
        label: 'الإعدادات',
        labelEn: 'Settings',
        description: 'الحساب والتفضيلات',
        descriptionEn: 'Account and preferences',
      },
      {
        href: `${APP_BASE}/help`,
        icon: HelpCircle,
        label: 'المساعدة',
        labelEn: 'Help',
        description: 'الأسئلة الشائعة والدعم',
        descriptionEn: 'FAQs and support',
      },
    ],
  },
  {
    id: 'workspace',
    label: 'مساحة العمل',
    labelEn: 'Workspace',
    items: [
      {
        href: `${APP_BASE}/links`,
        icon: Link2,
        label: 'روابطي',
        labelEn: 'My links',
        description: 'إدارة روابط صفحتك الشخصية',
        descriptionEn: 'Manage your public page links',
      },
      {
        href: PRODUCTS_SECTION_BASE,
        icon: Package,
        label: 'المنتجات',
        labelEn: 'Products',
        description: 'إدارة منتجات المتجر والمخزون',
        descriptionEn: 'Manage store products and inventory',
      },
      {
        href: `${PRODUCTS_SECTION_BASE}/collections`,
        icon: Layers,
        label: 'التصنيفات',
        labelEn: 'Collections',
        description: 'تصنيف المنتجات في مجموعات',
        descriptionEn: 'Group products into collections',
      },
      {
        href: `${PRODUCTS_SECTION_BASE}/discounts`,
        icon: Percent,
        label: 'الخصومات',
        labelEn: 'Discounts',
        description: 'أكواد الخصم والعروض',
        descriptionEn: 'Discount codes and offers',
      },
      {
        href: ORDERS_HREF,
        icon: ShoppingBag,
        label: 'الطلبات',
        labelEn: 'Orders',
        description: 'متابعة الطلبات والمبيعات',
        descriptionEn: 'Track orders and sales',
      },
      {
        href: `${APP_BASE}/analytics`,
        icon: BarChart2,
        label: 'التحليلات',
        labelEn: 'Analytics',
        description: 'مشاهدات، نقرات، ومبيعات المتجر',
        descriptionEn: 'Views, clicks, and store sales',
      },
    ],
  },
];

export const PAGE_LABELS: Record<string, { ar: string; en: string }> = {
  app: { ar: 'لوحة التحكم', en: 'Dashboard' },
  links: { ar: 'روابطي', en: 'My links' },
  products: { ar: 'المنتجات', en: 'Products' },
  collections: { ar: 'التصنيفات', en: 'Collections' },
  discounts: { ar: 'الخصومات', en: 'Discounts' },
  orders: { ar: 'الطلبات', en: 'Orders' },
  analytics: { ar: 'التحليلات', en: 'Analytics' },
  settings: { ar: 'الإعدادات', en: 'Settings' },
  help: { ar: 'المساعدة', en: 'Help' },
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

export function isProductsSection(pathname: string): boolean {
  const path =
    pathname.endsWith('/') && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  return (
    path === PRODUCTS_SECTION_BASE ||
    path.startsWith(`${PRODUCTS_SECTION_BASE}/`)
  );
}

/** Mobile dock "store mode" — products area + related commerce pages */
export function isStoreDockMode(pathname: string): boolean {
  const path =
    pathname.endsWith('/') && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  if (isProductsSection(path)) return true;
  if (path === ORDERS_HREF || path.startsWith(`${ORDERS_HREF}/`)) return true;
  return false;
}

export function resolvePageLabel(
  pathname: string,
  locale: DashboardLocale = 'ar',
): string {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];

  if (last && PAGE_LABELS[last]) {
    return locale === 'en' ? PAGE_LABELS[last].en : PAGE_LABELS[last].ar;
  }

  if (segments.length >= 2 && segments[0] === 'app' && segments[1] === 'links') {
    return locale === 'en' ? 'Link details' : 'تفاصيل الرابط';
  }

  return locale === 'en' ? PAGE_LABELS.app.en : PAGE_LABELS.app.ar;
}
