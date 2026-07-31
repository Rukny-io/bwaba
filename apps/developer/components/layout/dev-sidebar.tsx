'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutGrid, LogOut } from 'lucide-react';
import {
  getPrimaryNavItems,
  getMiddleNavItems,
  getBottomNavItems,
  isNavItemActive,
  resolveNavItemLabel,
  type NavItem,
} from '@/components/layout/nav-config';
import { resolveMediaUrl } from '@/lib/media-url';
import { logoutWithNotification } from '@/lib/auth-notify';
import { appSettings } from '@/lib/app-routes';
import { SidebarProductsRail } from '@/components/layout/sidebar-products-rail';
import { useTranslations } from '@/components/providers/translations-provider';

function Tooltip({ label, isRtl }: { label: string; isRtl: boolean }) {
  return (
    <span
      className={`
      pointer-events-none absolute top-1/2 z-50 -translate-y-1/2
      whitespace-nowrap rounded-xl bg-[var(--foreground)] px-2.5 py-1.5 text-xs font-medium text-[var(--background)]
      opacity-0 transition-opacity duration-150 group-hover:opacity-100
      ${
        isRtl
          ? 'left-0 -translate-x-[calc(100%+10px)] after:absolute after:right-[-5px] after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-l-[var(--foreground)]'
          : 'right-0 translate-x-[calc(100%+10px)] after:absolute after:left-[-5px] after:top-1/2 after:-translate-y-1/2 after:border-4 after:border-transparent after:border-r-[var(--foreground)]'
      }
    `}
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

function NavLink({
  item,
  pathname,
  label,
  isRtl,
}: {
  item: NavItem;
  pathname: string;
  label: string;
  isRtl: boolean;
}) {
  const { href, icon: Icon, exact } = item;
  const isActive = isNavItemActive(pathname, href, exact);

  return (
    <Link href={href} className={getNavClasses(isActive)} aria-label={label}>
      <Icon size={19} strokeWidth={isActive ? 2 : 1.7} />
      <Tooltip label={label} isRtl={isRtl} />
    </Link>
  );
}

interface DevSidebarProps {
  appId?: string;
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
  const t = useTranslations();

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={userName ?? t.topbar.profile}
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

export function DevSidebar({ appId, avatarUrl, userName }: DevSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const isRtl = t.common.switchLang === 'English';

  const navLabels = {
    dashboard: t.sidebar.dashboard,
    keys: t.sidebar.keys,
    products: t.sidebar.products,
    docs: t.sidebar.docs,
    apps: t.sidebar.apps,
    appSettings: t.sidebar.appSettings,
    help: t.sidebar.help,
    logout: t.sidebar.logout,
    more: t.mobile.more,
  };

  const primaryNavItems = appId
    ? getPrimaryNavItems(appId)
    : [{ href: '/apps', icon: LayoutGrid, label: t.sidebar.apps, exact: true }];
  const middleNavItems = appId ? getMiddleNavItems(appId) : [];
  const bottomNavItems = appId ? getBottomNavItems(appId) : [];
  const settingsHref = appId ? appSettings(appId) : undefined;

  return (
    <aside
      className={`fixed top-0 z-40 hidden h-full w-14 flex-col items-center py-5 sm:flex ${
        isRtl ? 'right-4' : 'left-4'
      }`}
    >
      <div className="mb-5 flex size-10 items-center justify-center">
        <Image
          src="/rukny-logo.svg"
          alt="Rukny Developers"
          width={36}
          height={36}
          className="dark:brightness-0 dark:invert"
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-1.5 rounded-3xl bg-[var(--surface)] px-2 py-4">
          <nav className="flex flex-col items-center gap-1.5" aria-label={t.sidebar.apps}>
            {primaryNavItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                label={resolveNavItemLabel(item.label, navLabels)}
                isRtl={isRtl}
              />
            ))}

            {middleNavItems.length > 0 ? (
              <>
                <NavSpacer />
                {middleNavItems.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    label={resolveNavItemLabel(item.label, navLabels)}
                    isRtl={isRtl}
                  />
                ))}
              </>
            ) : null}

            {bottomNavItems.length > 0 ? (
              <>
                <NavSpacer />
                {bottomNavItems.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    label={resolveNavItemLabel(item.label, navLabels)}
                    isRtl={isRtl}
                  />
                ))}
              </>
            ) : null}
          </nav>
        </div>
      </div>

      {appId ? <SidebarProductsRail /> : null}

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => void logoutWithNotification()}
          className="group relative flex size-10 items-center justify-center rounded-2xl text-[var(--muted-foreground)] transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--background))] hover:text-[var(--danger)]"
          aria-label={t.sidebar.logout}
        >
          <LogOut size={19} strokeWidth={1.7} />
          <Tooltip label={t.sidebar.logout} isRtl={isRtl} />
        </button>

        {settingsHref ? (
          <Link
            href={settingsHref}
            className="group relative size-10 shrink-0 overflow-hidden rounded-full transition-opacity hover:opacity-90"
          >
            <SidebarAvatar avatarUrl={avatarUrl} userName={userName} />
          </Link>
        ) : (
          <div className="size-10 shrink-0 overflow-hidden rounded-full">
            <SidebarAvatar avatarUrl={avatarUrl} userName={userName} />
          </div>
        )}
      </div>
    </aside>
  );
}
