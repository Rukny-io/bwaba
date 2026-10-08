'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import { SettingsNavAside } from '@/components/settings/settings-nav-aside';
import { SETTINGS_NAV_WIDTH_PX } from '@/lib/settings/sections';

function SettingsNavAsideFallback() {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col gap-2 px-4 pt-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-xl bg-[var(--surface-secondary)]"
        />
      ))}
    </aside>
  );
}

export function SettingsNavColumn() {
  const pathname = usePathname();

  if (!pathname?.startsWith('/app/settings')) {
    return null;
  }

  return (
    <div
      className="hidden h-full min-h-0 shrink-0 overflow-hidden xl:flex"
      style={{ width: SETTINGS_NAV_WIDTH_PX }}
    >
      <Suspense fallback={<SettingsNavAsideFallback />}>
        <SettingsNavAside />
      </Suspense>
    </div>
  );
}
