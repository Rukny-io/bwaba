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
  Layers,
  Percent,
} from 'lucide-react';

export const APP_BASE = '/app';
export const PRODUCTS_SECTION_BASE = `${APP_BASE}/products`;

export type NavItem = {
  href: string;
  icon?: LucideIcon;
  label: string;
  exact?: boolean;
};

/** Top navigation tabs — primary sections on desktop */
export const mainTopNavTabs: NavItem[] = [
  { href: APP_BASE, icon: LayoutGrid, label: 'الرئيسية', exact: true },
  { href: `${APP_BASE}/links`, icon: Link2, label: 'روابطي' },
  { href: PRODUCTS_SECTION_BASE, icon: Package, label: 'المنتجات' },
  { href: `${APP_BASE}/analytics`, icon: BarChart2, label: 'التحليلات' },
];

/** Sub-navigation when inside the products section */
export const productsSubNavTabs: NavItem[] = [
  { href: PRODUCTS_SECTION_BASE, icon: Package, label: 'المنتجات', exact: true },
  {
    href: `${PRODUCTS_SECTION_BASE}/collections`,
    icon: Layers,
    label: 'المجموعات',
  },
  {
    href: `${PRODUCTS_SECTION_BASE}/discounts`,
    icon: Percent,
    label: 'الخصومات',
  },
];

/** Flat items for mobile dock */
export const primaryNavItems: NavItem[] = [
  { href: APP_BASE, icon: LayoutGrid, label: 'لوحة التحكم', exact: true },
  { href: `${APP_BASE}/links`, icon: Link2, label: 'روابطي' },
  { href: PRODUCTS_SECTION_BASE, icon: Package, label: 'المنتجات' },
];

export const middleNavItems: NavItem[] = [
  { href: `${APP_BASE}/orders`, icon: ShoppingBag, label: 'الطلبات' },
  { href: `${APP_BASE}/analytics`, icon: BarChart2, label: 'تحليلات' },
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
        description: 'الحساب والمظهر والتفضيلات',
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
        href: `${APP_BASE}/links`,
        icon: Link2,
        label: 'روابطي',
        description: 'إدارة روابط صفحتك الشخصية',
      },
      {
        href: PRODUCTS_SECTION_BASE,
        icon: Package,
        label: 'المنتجات',
        description: 'إدارة منتجات المتجر والمخزون',
      },
      {
        href: `${PRODUCTS_SECTION_BASE}/collections`,
        icon: Layers,
        label: 'المجموعات',
        description: 'تجميع المنتجات في مجموعات',
      },
      {
        href: `${PRODUCTS_SECTION_BASE}/discounts`,
        icon: Percent,
        label: 'الخصومات',
        description: 'أكواد الخصم والعروض',
      },
      {
        href: `${APP_BASE}/orders`,
        icon: ShoppingBag,
        label: 'الطلبات',
        description: 'متابعة الطلبات والمبيعات',
      },
      {
        href: `${APP_BASE}/analytics`,
        icon: BarChart2,
        label: 'التحليلات',
        description: 'مشاهدات، نقرات، ومبيعات المتجر',
      },
      {
        href: `${APP_BASE}/settings/appearance`,
        icon: Palette,
        label: 'المظهر',
        description: 'تخصيص مظهر صفحتك العامة',
      },
    ],
  },
];

export const PAGE_LABELS: Record<string, string> = {
  app: 'لوحة التحكم',
  links: 'روابطي',
  products: 'المنتجات',
  collections: 'المجموعات',
  discounts: 'الخصومات',
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

export function resolvePageLabel(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];

  if (last && PAGE_LABELS[last]) {
    return PAGE_LABELS[last];
  }

  if (segments.length >= 2 && segments[0] === 'app' && segments[1] === 'links') {
    return 'تفاصيل الرابط';
  }

  return PAGE_LABELS.app;
}
