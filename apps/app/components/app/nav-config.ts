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
  Receipt,
} from 'lucide-react';

export const APP_BASE = '/app';
export const PRODUCTS_SECTION_BASE = `${APP_BASE}/products`;
export const ORDERS_HREF = `${APP_BASE}/orders`;
export const INVOICES_HREF = `${APP_BASE}/invoices`;

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

/** Sub-navigation when inside the products / store section */
export const productsSubNavTabs: NavItem[] = [
  { href: PRODUCTS_SECTION_BASE, icon: Package, label: 'المنتجات', exact: true },
  {
    href: `${PRODUCTS_SECTION_BASE}/collections`,
    icon: Layers,
    label: 'التصنيفات',
  },
  {
    href: `${PRODUCTS_SECTION_BASE}/discounts`,
    icon: Percent,
    label: 'الخصومات',
  },
  { href: ORDERS_HREF, icon: ShoppingBag, label: 'الطلبات' },
  { href: INVOICES_HREF, icon: Receipt, label: 'الفواتير' },
];

/** Main mobile dock (single pill) */
export const primaryDockItems: NavItem[] = [
  { href: APP_BASE, icon: LayoutGrid, label: 'الرئيسية', exact: true },
  { href: `${APP_BASE}/links`, icon: Link2, label: 'روابطي' },
  { href: PRODUCTS_SECTION_BASE, icon: Package, label: 'المنتجات' },
  {
    href: `${PRODUCTS_SECTION_BASE}/collections`,
    icon: Layers,
    label: 'التصنيفات',
  },
  { href: `${APP_BASE}/settings`, icon: Settings, label: 'الإعدادات' },
];

/** Mobile dock after opening المنتجات */
export const productsDockItems: NavItem[] = [
  { href: PRODUCTS_SECTION_BASE, icon: Package, label: 'المنتجات', exact: true },
  {
    href: `${PRODUCTS_SECTION_BASE}/collections`,
    icon: Layers,
    label: 'التصنيفات',
  },
  { href: ORDERS_HREF, icon: ShoppingBag, label: 'الطلبات' },
  {
    href: `${PRODUCTS_SECTION_BASE}/discounts`,
    icon: Percent,
    label: 'الخصومات',
  },
  { href: INVOICES_HREF, icon: Receipt, label: 'الفواتير' },
];

/** @deprecated Prefer primaryDockItems */
export const primaryNavItems: NavItem[] = primaryDockItems;

export const middleNavItems: NavItem[] = [
  { href: ORDERS_HREF, icon: ShoppingBag, label: 'الطلبات' },
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
        label: 'التصنيفات',
        description: 'تصنيف المنتجات في مجموعات',
      },
      {
        href: `${PRODUCTS_SECTION_BASE}/discounts`,
        icon: Percent,
        label: 'الخصومات',
        description: 'أكواد الخصم والعروض',
      },
      {
        href: ORDERS_HREF,
        icon: ShoppingBag,
        label: 'الطلبات',
        description: 'متابعة الطلبات والمبيعات',
      },
      {
        href: INVOICES_HREF,
        icon: Receipt,
        label: 'الفواتير',
        description: 'فواتير المبيعات والمدفوعات',
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
  collections: 'التصنيفات',
  discounts: 'الخصومات',
  orders: 'الطلبات',
  invoices: 'الفواتير',
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

/** Mobile dock "store mode" — products area + related commerce pages */
export function isStoreDockMode(pathname: string): boolean {
  const path =
    pathname.endsWith('/') && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  if (isProductsSection(path)) return true;
  if (path === ORDERS_HREF || path.startsWith(`${ORDERS_HREF}/`)) return true;
  if (path === INVOICES_HREF || path.startsWith(`${INVOICES_HREF}/`)) return true;
  return false;
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
