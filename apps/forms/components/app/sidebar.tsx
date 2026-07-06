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
      pointer-events-none absolute left-0 top-1/2 -translate-x-[calc(100%+10px)] -translate-y-1/2
      whitespace-nowrap rounded-xl bg-[var(--foreground)] px-2.5 py-1.5 text-xs font-medium text-[var(--background)]
      opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100
      after:absolute after:right-[-5px] after:top-1/2 after:-translate-y-1/2
      after:border-4 after:border-transparent after:border-l-[var(--foreground)]
    "
    >
      {label}
    </span>
  );
}

function getNavClasses(isActive: boolean) {
  return `relative group flex size-10 items-center justify-center rounded-2xl transition-all duration-200 ${
    isActive
      ? 'bg-[var(--foreground)] text-[var(--background)]'
      : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]'
  }`;
}

function NavSeparator() {
  return <div className="my-0.5 h-px w-5 bg-[var(--border)]" />;
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const { href, icon: Icon, label, exact } = item;
  const isActive = isNavItemActive(pathname, href, exact);

  return (
    <Link href={href} className={getNavClasses(isActive)}>
      <Icon size={18} strokeWidth={1.7} />
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

  async function handleLogout() {
    await logoutWithNotification();
  }

  return (
    <aside className="fixed top-0 right-4 z-40 hidden h-full w-14 flex-col items-center py-5 sm:flex">
      <div className="mb-5 flex size-10 items-center justify-center">
        <Image
          src="/rukny-logo.svg"
          alt="Rukny"
          width={36}
          height={36}
          className="dark:brightness-0 dark:invert"
        />
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="dashboard-card flex flex-col items-center rounded-[28px] px-2 py-4">
          <nav className="flex flex-col items-center gap-1">
            {primaryNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}

            <NavSeparator />

            {middleNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}

            <NavSeparator />

            {bottomNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="group relative flex size-10 items-center justify-center rounded-2xl text-[var(--muted-foreground)] transition-all duration-200 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20"
        >
          <LogOut size={18} strokeWidth={1.7} />
          <Tooltip label="تسجيل الخروج" />
        </button>

        <Link
          href={`${APP_BASE}/settings`}
          className="group relative size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-[var(--border)] transition-all duration-200 hover:ring-[var(--accent)]"
        >
          <SidebarAvatar avatarUrl={avatarUrl} userName={userName} />
        </Link>
      </div>
    </aside>
  );
}
