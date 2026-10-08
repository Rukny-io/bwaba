'use client';

import type { ReactNode } from 'react';
import { useDashboardLocale } from '@/components/app/locale-provider';
import { ProfilePreviewColumn } from '@/components/app/profile-preview-column';
import { SettingsNavColumn } from '@/components/app/settings-nav-column';
import { cn } from '@/lib/utils';

interface DashboardChromeProps {
  sidebar: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
}

/**
 * Chrome geometry mirrors apps/developer:
 * - ar (rtl): rail on the right + content margin-right
 * - en (ltr): rail on the left + content margin-left
 *
 * Must be client-side so locale switches update margins/dir without a stale SSR shell.
 */
export function DashboardChrome({ sidebar, banner, children }: DashboardChromeProps) {
  const { locale, direction } = useDashboardLocale();
  const isEn = locale === 'en';

  return (
    <div
      className={cn(
        'dashboard-chrome flex h-dvh flex-col bg-[var(--background)]',
        isEn ? 'dir-ltr' : 'dir-rtl',
      )}
      dir={direction}
    >
      {banner}
      {sidebar}
      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 gap-4 pt-4',
          isEn ? 'sm:ml-[82px] sm:pr-5' : 'sm:mr-[82px] sm:pl-5',
        )}
      >
        {/* Near sidebar → settings; away from sidebar → preview */}
        <SettingsNavColumn />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
        <ProfilePreviewColumn />
      </div>
    </div>
  );
}
