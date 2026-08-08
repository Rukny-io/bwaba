'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  APP_BASE,
  mainTopNavTabs,
  productsSubNavTabs,
  isNavItemActive,
  isProductsSection,
} from '@/components/app/nav-config';
import { ChevronRight } from 'lucide-react';
import {
  dashboardTopTabsChipClass,
  dashboardTopTabsGlassClass,
} from '@/components/app/nav-glass';
import { DashboardCommandPalette } from '@/components/app/dashboard-command-palette';
import { resolveAvatarUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';

interface DashboardTopTabsProps {
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

export function DashboardTopTabs({
  avatarUrl,
  userName,
}: DashboardTopTabsProps) {
  const pathname = usePathname();
  const profileActive = isNavItemActive(pathname, `${APP_BASE}/settings`);
  const inProductsSection = isProductsSection(pathname);
  const tabs = inProductsSection ? productsSubNavTabs : mainTopNavTabs;

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden justify-start bg-transparent px-3 pt-3 pb-2 sm:flex sm:px-5 sm:pt-4">
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

        <DashboardCommandPalette />

        <div
          className="mx-0.5 h-5 w-px shrink-0 bg-[var(--border)]/25"
          aria-hidden
        />

        {inProductsSection ? (
          <>
            <Link
              href={APP_BASE}
              aria-label="رجوع"
              className={cn(
                dashboardTopTabsChipClass,
                'gap-1 px-2.5 sm:px-3',
              )}
            >
              <ChevronRight className="size-3.5 shrink-0" aria-hidden />
              <span>رجوع</span>
            </Link>
            <div
              className="mx-0.5 h-5 w-px shrink-0 bg-[var(--border)]/25"
              aria-hidden
            />
          </>
        ) : null}

        {tabs.map(({ href, label, exact }) => {
          const active = isNavItemActive(pathname, href, exact);

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
      </nav>
    </header>
  );
}
