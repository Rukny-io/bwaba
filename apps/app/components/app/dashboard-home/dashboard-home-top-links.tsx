'use client';

import Link from 'next/link';
import { ArrowLeft, Link2 } from 'lucide-react';
import { dashboardPagePanelClass } from '@/components/app/dashboard-page-frame';
import { formatNumber } from '@/lib/dashboard-format';
import { useTranslations } from '@/lib/i18n';
import type { AnalyticsOverview } from '@/lib/analytics/types';
import { cn } from '@/lib/utils';

interface DashboardHomeTopLinksProps {
  links: AnalyticsOverview['topLinks'];
  activeCount: number;
  totalCount: number;
}

export function DashboardHomeTopLinks({
  links,
  activeCount,
  totalCount,
}: DashboardHomeTopLinksProps) {
  const { t, locale } = useTranslations();

  return (
    <article className={cn(dashboardPagePanelClass, 'min-h-[280px] gap-4')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            {t('home.topLinks')}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {t('home.activeLinksCount', {
              active: formatNumber(activeCount, locale),
              total: formatNumber(totalCount, locale),
            })}
          </p>
        </div>
        <Link
          href="/app/links"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
        >
          {t('home.viewAll')}
          <ArrowLeft className="size-3.5 rtl:rotate-180" />
        </Link>
      </div>

      {links.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] px-4 py-10 text-center">
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <Link2 className="size-4" strokeWidth={1.75} aria-hidden />
          </div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            {t('home.noClicksYet')}
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {t('home.addLinksHint')}
          </p>
          <Link
            href="/app/links?add=1"
            className="mt-4 inline-flex h-9 items-center rounded-lg bg-[var(--primary)] px-4 text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-95"
          >
            {t('home.addLink')}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {links.map((link, index) => (
            <li key={link.id}>
              <Link
                href="/app/links"
                className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2.5 transition-colors hover:bg-[var(--surface-secondary)]"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-xs font-semibold text-[var(--foreground)]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    {link.title}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {t('home.clicks', {
                      n: formatNumber(link.clicks, locale),
                    })}
                  </p>
                </div>
                <ArrowLeft className="size-4 shrink-0 text-[var(--muted-foreground)] rtl:rotate-180" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
