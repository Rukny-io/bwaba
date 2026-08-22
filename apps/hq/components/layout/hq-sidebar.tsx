'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut, Moon, Sun } from 'lucide-react';
import { Dropdown } from '@heroui/react';
import {
  homeNavItem,
  middleNavItems,
  bottomNavItems,
  isNavItemActive,
  type NavItem,
} from '@/components/layout/nav-config';
import { resolveMediaUrl } from '@/lib/media-url';
import { logoutWithNotification } from '@/lib/auth-notify';
import { applyHqTheme, readHqTheme, type HqTheme } from '@/lib/hq-theme';
import { cn } from '@/lib/utils';

function Tooltip({ label }: { label: string }) {
  return (
    <span
      className="
      pointer-events-none absolute top-1/2 z-50 -translate-y-1/2
      whitespace-nowrap rounded-xl bg-[var(--foreground)] px-2.5 py-1.5 text-xs font-medium text-[var(--background)]
      opacity-0 transition-opacity duration-150 group-hover:opacity-100
      left-full ml-2.5 after:absolute after:left-[-5px] after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-r-[var(--foreground)]
    "
    >
      {label}
    </span>
  );
}

function getNavClasses(isActive: boolean) {
  return `relative group flex size-10 items-center justify-center transition-all duration-200 ${
    isActive
      ? 'rounded-full bg-[var(--foreground)] text-[var(--background)]'
      : 'rounded-2xl text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]'
  }`;
}

function NavSpacer() {
  return <div className="h-3 shrink-0" aria-hidden />;
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const { href, icon: Icon, label, exact } = item;
  const isActive = isNavItemActive(pathname, href, exact);

  return (
    <Link href={href} className={getNavClasses(isActive)} aria-label={label}>
      <Icon size={19} strokeWidth={isActive ? 2 : 1.7} />
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
  const displayName = userName?.trim() || 'A';
  const initials = displayName.charAt(0).toUpperCase();
  const src = resolveMediaUrl(avatarUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={userName ?? 'Admin'}
        className="block h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="flex size-full items-center justify-center bg-gradient-to-br from-[var(--accent)] to-[var(--foreground)] text-sm font-semibold text-[var(--background)]">
      {initials}
    </div>
  );
}

interface HqSidebarProps {
  avatarUrl?: string | null;
  userName?: string | null;
}

export function HqSidebar({ avatarUrl, userName }: HqSidebarProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<HqTheme>('light');

  useEffect(() => {
    setTheme(readHqTheme());
  }, []);

  function handleThemeToggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyHqTheme(next);
    setTheme(next);
  }

  return (
    <aside className="fixed top-0 left-4 z-40 hidden h-full w-14 flex-col items-center py-5 sm:flex">
      <div className="mb-5 flex size-10 items-center justify-center">
        <Image
          src="/rukny-logo.svg"
          alt="Rukny HQ"
          width={36}
          height={36}
          className="dark:brightness-0 dark:invert"
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-1.5 rounded-3xl bg-[var(--surface)] px-2 py-3">
          <nav className="flex flex-col items-center gap-1.5" aria-label="Primary">
            <NavLink item={homeNavItem} pathname={pathname} />
            <NavSpacer />
            {middleNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
            <NavSpacer />
            {bottomNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Dropdown>
          <Dropdown.Trigger
            aria-label="Profile"
            className={cn(
              'group relative size-10 shrink-0 overflow-hidden rounded-full border-0 bg-transparent p-0 outline-none',
              'transition-opacity hover:opacity-90',
            )}
          >
            <SidebarAvatar avatarUrl={avatarUrl} userName={userName} />
          </Dropdown.Trigger>
          <Dropdown.Popover
            placement="right bottom"
            offset={14}
            className="min-w-[13rem]"
          >
            <Dropdown.Menu
              onAction={(key) => {
                if (key === 'theme') handleThemeToggle();
                if (key === 'logout') void logoutWithNotification();
              }}
            >
              <Dropdown.Item
                id="theme"
                textValue={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                className="gap-2"
              >
                {theme === 'dark' ? (
                  <Sun className="size-4 shrink-0" />
                ) : (
                  <Moon className="size-4 shrink-0" />
                )}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </Dropdown.Item>
              <Dropdown.Item
                id="logout"
                textValue="Sign out"
                variant="danger"
                className="gap-2"
              >
                <LogOut className="size-4 shrink-0" />
                Sign out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </aside>
  );
}
