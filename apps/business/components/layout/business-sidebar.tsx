'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut, Settings, User } from 'lucide-react';
import { Dropdown } from '@heroui/react';
import {
  getChannelNavItems,
  getPrimaryNavItems,
  isNavItemActive,
  type NavItem,
} from '@/components/layout/nav-config';
import { SidebarIcon } from '@/components/layout/sidebar-icon';
import { resolveAvatarUrl } from '@/lib/media-url';
import { logoutWithNotification } from '@/lib/auth-notify';
import { cn } from '@/lib/utils';

function Tooltip({ label }: { label: string }) {
  return (
    <span
      className="
      pointer-events-none absolute top-1/2 z-50 -translate-y-1/2
      whitespace-nowrap rounded-xl bg-[var(--foreground)] px-2.5 py-1.5 text-xs font-medium text-[var(--background)]
      opacity-0 transition-opacity duration-150 group-hover:opacity-100
      left-0 -translate-x-[calc(100%+10px)] after:absolute after:right-[-5px] after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-[var(--foreground)]
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

function NavLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const { href, iconId, label, exact } = item;
  const isActive = isNavItemActive(pathname, href, exact);

  return (
    <Link href={href} className={getNavClasses(isActive)} aria-label={label}>
      <SidebarIcon iconId={iconId} isActive={isActive} />
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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={userName ?? 'الملف الشخصي'}
        className="block h-full w-full object-cover"
        referrerPolicy="no-referrer"
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

interface BusinessSidebarProps {
  avatarUrl?: string | null;
  userName?: string | null;
}

export function BusinessSidebar({ avatarUrl, userName }: BusinessSidebarProps) {
  const pathname = usePathname();
  const primaryNavItems = getPrimaryNavItems();
  const channelNavItems = getChannelNavItems();

  return (
    <aside className="fixed top-0 z-40 hidden h-full w-14 flex-col items-center py-5 sm:flex right-4">
      <div className="mb-5 flex size-10 items-center justify-center">
        <Image
          src="/rukny-logo.svg"
          alt="Rukny Business"
          width={36}
          height={36}
          className="dark:brightness-0 dark:invert"
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-1.5 rounded-3xl bg-[var(--surface)] px-2 py-3">
          <nav className="flex flex-col items-center gap-1.5" aria-label="التنقل الرئيسي">
            {primaryNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </div>
      </div>

      <div className="mb-3 flex flex-col items-center gap-1.5 rounded-3xl bg-[var(--surface)] px-2 py-3">
        <nav className="flex flex-col items-center gap-1.5" aria-label="القنوات">
          {channelNavItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
      </div>

      <div className="flex flex-col items-center gap-2">
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
                href="/app/settings"
                className="gap-2"
              >
                <User className="size-4 shrink-0" />
                الملف الشخصي
              </Dropdown.Item>
              <Dropdown.Item
                id="settings"
                textValue="الإعدادات"
                href="/app/settings"
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
