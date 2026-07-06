import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  Users,
  Store,
  Package,
  ShoppingCart,
  FileText,
  ImageIcon,
} from 'lucide-react';

export const APP_BASE = '/app';

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
};

export const primaryNavItems: NavItem[] = [
  { href: APP_BASE, icon: LayoutGrid, label: 'Home', exact: true },
  { href: `${APP_BASE}/users`, icon: Users, label: 'Users' },
  { href: `${APP_BASE}/stores`, icon: Store, label: 'Stores' },
  { href: `${APP_BASE}/products`, icon: Package, label: 'Products' },
  { href: `${APP_BASE}/orders`, icon: ShoppingCart, label: 'Orders' },
  { href: `${APP_BASE}/forms`, icon: FileText, label: 'Forms' },
  { href: `${APP_BASE}/wallpapers`, icon: ImageIcon, label: 'Wallpapers' },
];

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
  const path =
    pathname.endsWith('/') && pathname.length > 1
      ? pathname.slice(0, -1)
      : pathname;

  if (/^\/app\/users\/[^/]+$/.test(path)) {
    return 'User details';
  }

  if (/^\/app\/forms\/[^/]+$/.test(path)) {
    return 'Form details';
  }

  const item = primaryNavItems.find((nav) =>
    isNavItemActive(pathname, nav.href, nav.exact),
  );
  if (item) return item.label;

  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  const labels: Record<string, string> = {
    users: 'Users',
    stores: 'Stores',
    products: 'Products',
    orders: 'Orders',
    forms: 'Forms',
    wallpapers: 'Wallpapers',
    categories: 'Categories',
  };
  return labels[last] ?? 'Dashboard';
}
