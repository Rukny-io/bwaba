import type { LucideIcon } from 'lucide-react';
import {
  LayoutGrid,
  Users,
  Store,
  Package,
  ShoppingCart,
  FileText,
  ImageIcon,
  LifeBuoy,
  Mail,
  FolderTree,
  BadgeCheck,
  UserX,
  UserCog,
  Crown,
  CircleDot,
} from 'lucide-react';

export const APP_BASE = '/app';

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  /** Shorter label for the mobile dock pill (Arabic). */
  mobileLabel?: string;
  exact?: boolean;
};

export const homeNavItem: NavItem = {
  href: APP_BASE,
  icon: LayoutGrid,
  label: 'Home',
  exact: true,
};

export const middleNavItems: NavItem[] = [
  { href: `${APP_BASE}/users`, icon: Users, label: 'Users' },
  { href: `${APP_BASE}/stores`, icon: Store, label: 'Stores' },
  { href: `${APP_BASE}/products`, icon: Package, label: 'Products' },
  { href: `${APP_BASE}/orders`, icon: ShoppingCart, label: 'Orders' },
];

export const bottomNavItems: NavItem[] = [
  { href: `${APP_BASE}/forms`, icon: FileText, label: 'Forms' },
  { href: `${APP_BASE}/support-tickets`, icon: LifeBuoy, label: 'Support' },
  { href: `${APP_BASE}/mail`, icon: Mail, label: 'Mail', mobileLabel: 'البريد' },
  { href: `${APP_BASE}/wallpapers`, icon: ImageIcon, label: 'Wallpapers' },
];

export const primaryNavItems: NavItem[] = [
  homeNavItem,
  ...middleNavItems,
  ...bottomNavItems,
];

/** Primary shortcuts in the bottom mobile dock. */
export const mobileDockItems: NavItem[] = [
  { ...primaryNavItems[0]!, mobileLabel: 'لوحة التحكم' },
  { ...primaryNavItems[1]!, mobileLabel: 'المستخدمين' },
  { ...primaryNavItems[6]!, mobileLabel: 'الدعم' },
  { ...primaryNavItems[5]!, mobileLabel: 'النماذج' },
];

/** Secondary destinations opened from the mobile “More” drawer. */
export const mobileDrawerItems: NavItem[] = [
  { ...primaryNavItems[2]!, mobileLabel: 'المتاجر' },
  { ...primaryNavItems[3]!, mobileLabel: 'المنتجات' },
  { ...primaryNavItems[4]!, mobileLabel: 'الطلبات' },
  { ...primaryNavItems[7]!, mobileLabel: 'البريد' },
  { ...primaryNavItems[8]!, mobileLabel: 'الخلفيات' },
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

export type HeaderMenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export type HeaderMenu = {
  id: string;
  label: string;
  items: HeaderMenuItem[];
};

export const headerHomeLink = {
  href: APP_BASE,
  label: 'Dashboard',
} as const;

export const headerMenus: HeaderMenu[] = [
  {
    id: 'users',
    label: 'Users',
    items: [
      { href: `${APP_BASE}/users`, icon: Users, label: 'All users', exact: true },
      {
        href: `${APP_BASE}/users?emailVerified=false`,
        icon: CircleDot,
        label: 'Unverified',
        exact: true,
      },
      {
        href: `${APP_BASE}/users?isRuknyVerified=true`,
        icon: BadgeCheck,
        label: 'Rukny verified',
        exact: true,
      },
      {
        href: `${APP_BASE}/users?isDeactivated=true`,
        icon: UserX,
        label: 'Deactivated accounts',
        exact: true,
      },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    items: [
      { href: `${APP_BASE}/support-tickets`, icon: LifeBuoy, label: 'Tickets' },
      {
        href: `${APP_BASE}/support-tickets?status=OPEN`,
        icon: CircleDot,
        label: 'Open tickets',
        exact: true,
      },
      { href: `${APP_BASE}/forms`, icon: FileText, label: 'Forms' },
      { href: `${APP_BASE}/wallpapers`, icon: ImageIcon, label: 'Wallpapers' },
    ],
  },
  {
    id: 'mail',
    label: 'Mail',
    items: [
      { href: `${APP_BASE}/mail`, icon: Mail, label: 'All apps' },
      {
        href: `${APP_BASE}/mail?tab=domains`,
        icon: CircleDot,
        label: 'Unverified domains',
        exact: true,
      },
      {
        href: `${APP_BASE}/mail?tab=delivery`,
        icon: CircleDot,
        label: 'Failed delivery',
        exact: true,
      },
      {
        href: `${APP_BASE}/mail?tab=alerts`,
        icon: CircleDot,
        label: 'Quota alerts',
        exact: true,
      },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    items: [
      { href: `${APP_BASE}/orders`, icon: ShoppingCart, label: 'Orders' },
      { href: `${APP_BASE}/stores`, icon: Store, label: 'Stores' },
      {
        href: `${APP_BASE}/stores/categories`,
        icon: FolderTree,
        label: 'Categories',
        exact: true,
      },
      { href: `${APP_BASE}/products`, icon: Package, label: 'Products' },
    ],
  },
  {
    id: 'team',
    label: 'Team',
    items: [
      {
        href: `${APP_BASE}/users?role=ADMIN`,
        icon: UserCog,
        label: 'Admins',
        exact: true,
      },
      {
        href: `${APP_BASE}/users?role=PREMIUM`,
        icon: Crown,
        label: 'Premium members',
        exact: true,
      },
    ],
  },
];
