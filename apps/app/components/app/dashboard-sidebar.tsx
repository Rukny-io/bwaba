'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, LogOut, Settings, User } from 'lucide-react';
import { Dropdown } from '@heroui/react';
import { DashboardCommandPalette } from '@/components/app/dashboard-command-palette';
import {
  APP_BASE,
  bottomNavItems,
  isNavItemActive,
  isStoreDockMode,
  mainTopNavTabs,
  middleNavItems,
  productsSubNavTabs,
  type NavItem,
} from '@/components/app/nav-config';
import { resolveAvatarUrl } from '@/lib/media-url';
import { logoutWithNotification } from '@/lib/auth-notify';
import { cn } from '@/lib/utils';

function Tooltip({ label }: { label: string }) {
  return (
    <span
      className="
        pointer-events-none absolute top-1/2 z-50 -translate-y-1/2
        whitespace-nowrap rounded-xl bg-[var(--foreground)] px-2.5 py-1.5 text-xs font-medium text-[var(--background)]
        opacity-0 transition-opacity duration-100 group-hover:opacity-100
        left-0 -translate-x-[calc(100%+10px)]
        after:absolute after:right-[-5px] after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-[var(--foreground)]
      "
    >
      {label}
    </span>
  );
}

function getNavClasses(isActive: boolean) {
  return cn(
    'group relative flex size-10 items-center justify-center transition-colors duration-75',
    isActive
      ? 'rounded-full bg-[var(--foreground)] text-[var(--background)]'
      : 'rounded-2xl text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const { href, icon: Icon, label, exact } = item;
  const isActive = isNavItemActive(pathname, href, exact);

  if (!Icon) {
    return null;
  }

  return (
    <Link
      href={href}
      className={getNavClasses(isActive)}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={19} strokeWidth={isActive ? 2 : 1.7} aria-hidden />
      <Tooltip label={label} />
    </Link>
  );
}

function SidebarAvatar({
  avatarUrl,
  userName,
}: {
  avatarUrl?: string | null;
  userName?: string | null;
}) {
  const displayName = userName?.trim() || 'م';
  const initials = displayName.charAt(0).toUpperCase();
  const src = resolveAvatarUrl(avatarUrl);

  if (src) {
    return (
      <img
        src={src}
        alt={userName ?? 'المستخدم'}
        className="block size-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className="flex size-full items-center justify-center bg-gradient-to-br from-[var(--accent)] to-[var(--foreground)] text-sm font-semibold text-[var(--background)]">
      {initials}
    </span>
  );
}

interface DashboardSidebarProps {
  avatarUrl?: string | null;
  userName?: string | null;
}

export function DashboardSidebar({ avatarUrl, userName }: DashboardSidebarProps) {
  const pathname = usePathname();
  const inProductsSection = isStoreDockMode(pathname);
  const primaryTabs = inProductsSection ? productsSubNavTabs : mainTopNavTabs;
  const primaryHrefs = new Set(primaryTabs.map((item) => item.href));
  const secondaryTabs = [...middleNavItems, ...bottomNavItems].filter(
    (item) => !primaryHrefs.has(item.href),
  );

  return (
    <aside className="fixed top-0 z-40 hidden h-full w-14 flex-col items-center py-5 sm:flex right-4">
      <Link
        href={APP_BASE}
        className="mb-5 flex size-10 items-center justify-center"
        aria-label="ركني"
      >
        <Image
          src="/rukny-logo.svg"
          alt="ركني"
          width={36}
          height={36}
          className="dark:brightness-0 dark:invert"
        />
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-[var(--surface)] px-2 py-3">
          <nav className="flex flex-col items-center gap-2" aria-label="التنقل الرئيسي">
            {inProductsSection ? (
              <Link
                href={APP_BASE}
                className={getNavClasses(false)}
                aria-label="رجوع"
              >
                <ChevronRight size={19} strokeWidth={1.7} aria-hidden />
                <Tooltip label="رجوع" />
              </Link>
            ) : null}
            {primaryTabs.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl bg-[var(--surface)] px-2 py-3">
        <nav className="flex flex-col items-center gap-2" aria-label="أدوات مساحة العمل">
          {secondaryTabs.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="flex size-10 items-center justify-center">
          <DashboardCommandPalette variant="sidebar" />
        </div>

        <div
          className="h-px w-6 bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]"
          aria-hidden
        />

        <Dropdown>
          <Dropdown.Trigger
            aria-label="الملف الشخصي"
            className={cn(
              'group relative size-10 shrink-0 overflow-hidden rounded-full outline-none',
              'transition-opacity hover:opacity-90',
            )}
          >
            <SidebarAvatar avatarUrl={avatarUrl} userName={userName} />
          </Dropdown.Trigger>
          <Dropdown.Popover placement="left bottom" offset={14} className="min-w-[13rem]">
            <Dropdown.Menu
              onAction={(key) => {
                if (key === 'logout') void logoutWithNotification();
              }}
            >
              <Dropdown.Item
                id="profile"
                textValue="الملف الشخصي"
                href={`${APP_BASE}/settings`}
                className="gap-2"
              >
                <User className="size-4 shrink-0" />
                الملف الشخصي
              </Dropdown.Item>
              <Dropdown.Item
                id="settings"
                textValue="الإعدادات"
                href={`${APP_BASE}/settings`}
                className="gap-2"
              >
                <Settings className="size-4 shrink-0" />
                الإعدادات
              </Dropdown.Item>
              <Dropdown.Item
                id="logout"
                textValue="تسجيل الخروج"
                variant="danger"
                className="gap-2"
              >
                <LogOut className="size-4 shrink-0" />
                تسجيل الخروج
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </aside>
  );
}
