'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import {
  APP_BASE,
  primaryNavItems,
  middleNavItems,
  bottomNavItems,
  isNavItemActive,
  type NavItem,
} from '@/components/app/nav-config';
import { resolveMediaUrl } from '@/lib/media-url';
import { logoutWithNotification } from '@/lib/auth-notify';

function Tooltip({ label }: { label: string }) {
  return (
    <span
      className="
        pointer-events-none absolute top-1/2 z-50 -translate-y-1/2
        whitespace-nowrap rounded-lg bg-[var(--foreground)] px-2.5 py-1.5 text-xs font-medium text-[var(--background)]
        opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100
        left-0 -translate-x-[calc(100%+10px)]
        after:absolute after:right-[-5px] after:top-1/2 after:-translate-y-1/2
        after:border-4 after:border-transparent after:border-l-[var(--foreground)]
      "
    >
      {label}
    </span>
  );
}

function getNavClasses(isActive: boolean) {
  return `relative group flex size-10 items-center justify-center transition-all duration-200 ${
    isActive
      ? 'rounded-lg bg-[var(--foreground)] text-[var(--background)]'
      : 'rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]'
  }`;
}

function NavSpacer() {
  return <div className="h-3 shrink-0" aria-hidden />;
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const { href, icon: Icon, label, exact } = item;
  const isActive = isNavItemActive(pathname, href, exact);

  return (
    <Link
      href={href}
      className={getNavClasses(isActive)}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={19} strokeWidth={isActive ? 2 : 1.7} />
      <Tooltip label={label} />
    </Link>
  );
}

interface SidebarProps {
  avatarUrl?: string | null;
  userName?: string | null;
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
  const src = resolveMediaUrl(avatarUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={userName ?? 'المستخدم'}
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

export function Sidebar({ avatarUrl, userName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="fixed top-0 start-4 z-40 hidden h-full w-14 flex-col items-center py-5 sm:flex"
      aria-label="التنقل الرئيسي"
    >
      <Link
        href={APP_BASE}
        className="mb-5 flex size-10 items-center justify-center"
        aria-label="الرئيسية"
      >
        <Image
          src="/rukny-logo.svg"
          alt="Rukny"
          width={36}
          height={36}
          className="dark:brightness-0 dark:invert"
        />
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-[var(--surface)] px-2 py-4">
          <nav className="flex flex-col items-center gap-1.5" aria-label="القائمة الرئيسية">
            {primaryNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}

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
        <button
          type="button"
          onClick={() => void logoutWithNotification()}
          className="group relative flex size-10 items-center justify-center rounded-2xl text-[var(--muted-foreground)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--background))] hover:text-[var(--danger)]"
          aria-label="تسجيل الخروج"
        >
          <LogOut size={19} strokeWidth={1.7} />
          <Tooltip label="تسجيل الخروج" />
        </button>

        <Link
          href={`${APP_BASE}/settings`}
          className="group relative size-10 shrink-0 overflow-hidden rounded-full transition-opacity hover:opacity-90"
          aria-label="الإعدادات والحساب"
        >
          <SidebarAvatar avatarUrl={avatarUrl} userName={userName} />
        </Link>
      </div>
    </aside>
  );
}
