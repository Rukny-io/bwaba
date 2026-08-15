'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { APP_BASE, headerTopNavLinks, isNavItemActive } from '@/lib/business-routes';
import { BusinessCommandPalette } from '@/components/app/business-command-palette';
import {
  inboxChannelTabHref,
  inboxChannelTabs,
  parseInboxChannelTab,
} from '@/lib/inbox';
import {
  dashboardTopTabsChipClass,
  dashboardTopTabsGlassClass,
} from '@/components/app/nav-glass';
import { resolveAvatarUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';

interface BusinessHeaderTopBarProps {
  avatarUrl?: string | null;
  userName?: string | null;
}

function TopTabAvatar({
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
        alt={userName ?? 'المستخدم'}
        className="block h-full w-full object-cover"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="flex size-full items-center justify-center bg-[#1c1c1e] text-[10px] font-semibold text-white">
      {initials}
    </div>
  );
}

export function BusinessHeaderTopBar({
  avatarUrl,
  userName,
}: BusinessHeaderTopBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const profileActive = isNavItemActive(pathname, `${APP_BASE}/settings`);
  const isInbox =
    pathname === `${APP_BASE}/inbox` || pathname.startsWith(`${APP_BASE}/inbox/`);
  const activeInboxChannel = parseInboxChannelTab(searchParams.get('channel'));

  return (
    <header
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-20 justify-start bg-transparent px-3 pt-3 pb-2 sm:px-5 sm:pt-4',
        isInbox ? 'flex' : 'hidden sm:flex',
      )}
    >
      <nav
        aria-label="التنقل الرئيسي"
        className={cn(
          'pointer-events-auto inline-flex w-auto max-w-full items-center gap-0.5 p-1 sm:gap-1 sm:p-1.5',
          dashboardTopTabsGlassClass,
        )}
      >
        <Link
          href={`${APP_BASE}/settings`}
          aria-label="الإعدادات والحساب"
          aria-current={profileActive ? 'page' : undefined}
          className="flex shrink-0 items-center justify-center rounded-full p-0.5 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
        >
          <div className="size-7 overflow-hidden rounded-full ring-1 ring-black/8 dark:ring-white/12 sm:size-8">
            <TopTabAvatar avatarUrl={avatarUrl} userName={userName} />
          </div>
        </Link>

        <BusinessCommandPalette />

        <div
          className="mx-0.5 h-5 w-px shrink-0 bg-[var(--border)]/25"
          aria-hidden
        />

        {headerTopNavLinks.map(({ href, label, exact, matchPaths }) => {
          const active = isNavItemActive(pathname, href, exact, matchPaths);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={dashboardTopTabsChipClass}
            >
              {label}
            </Link>
          );
        })}

        <div
          className="mx-0.5 h-5 w-px shrink-0 bg-[var(--border)]/25"
          aria-hidden
        />

        {inboxChannelTabs.map(({ id, label }) => {
          const active = isInbox && activeInboxChannel === id;

          return (
            <Link
              key={id}
              href={inboxChannelTabHref(id)}
              aria-current={active ? 'page' : undefined}
              className={dashboardTopTabsChipClass}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
