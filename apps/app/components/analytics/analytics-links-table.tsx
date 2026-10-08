'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/cnippet-table';
import {
  analyticsCellClass,
  analyticsHeadClass,
  analyticsTableChrome,
} from '@/components/analytics/analytics-table-config';
import type { SocialLink } from '@/lib/links/types';
import { formatNumber } from '@/lib/dashboard-format';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface AnalyticsLinksTableProps {
  links: SocialLink[];
  isLoading?: boolean;
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index} className={cn(analyticsTableChrome.bodyRow, 'pointer-events-none')}>
          {Array.from({ length: 5 }).map((__, col) => (
            <TableCell key={col} className={analyticsCellClass('start')}>
              <div className="h-3.5 animate-pulse rounded-md bg-[var(--surface-secondary)]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function AnalyticsLinksTable({ links, isLoading }: AnalyticsLinksTableProps) {
  const { t } = useTranslations();

  return (
    <div className={analyticsTableChrome.shell}>
      <div className={analyticsTableChrome.scroll}>
        <Table
          variant="default"
          className={cn(
            analyticsTableChrome.table,
            'min-w-[40rem]',
            '[&_[data-slot=table-container]]:overflow-visible',
            '[&_[data-slot=table-cell]]:p-0 [&_[data-slot=table-head]]:p-0',
            '[&_[data-slot=table-body]:before]:hidden',
          )}
        >
          <TableHeader>
            <TableRow
              className={cn(
                analyticsTableChrome.headRow,
                'hover:bg-transparent dark:hover:bg-transparent',
              )}
            >
              <TableHead className={analyticsHeadClass('start', 'min-w-[10rem]')}>
                {t('analytics.link')}
              </TableHead>
              <TableHead className={analyticsHeadClass('center', 'w-[5.5rem]')}>
                {t('analytics.status')}
              </TableHead>
              <TableHead className={analyticsHeadClass('center', 'w-[6.5rem]')}>
                {t('analytics.platform')}
              </TableHead>
              <TableHead className={analyticsHeadClass('center', 'w-[5.5rem]')}>
                {t('analytics.views')}
              </TableHead>
              <TableHead className={analyticsHeadClass('center', 'w-[5.5rem]')}>
                {t('analytics.clicks')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : links.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={5}
                  className="h-28 bg-transparent text-center text-sm text-[var(--muted-foreground)]"
                >
                  {t('analytics.noLinksYet')}
                </TableCell>
              </TableRow>
            ) : (
              links.map((link) => (
                <TableRow key={link.id} className={analyticsTableChrome.bodyRow}>
                  <TableCell className={analyticsCellClass('start', 'min-w-0 max-w-0')}>
                    <Link
                      href="/app/links"
                      className="block truncate text-[13px] font-medium text-[var(--foreground)] hover:text-[var(--primary)]"
                    >
                      {link.title ?? link.platform}
                    </Link>
                  </TableCell>
                  <TableCell className={analyticsCellClass('center', 'w-[5.5rem]')}>
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
                        link.status === 'active'
                          ? 'bg-[color-mix(in_oklab,var(--success)_14%,transparent)] text-[var(--success)]'
                          : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
                      )}
                    >
                      {link.status === 'active'
                        ? t('analytics.active')
                        : t('analytics.hidden')}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      analyticsCellClass('center', 'w-[6.5rem]'),
                      'text-[12px] text-[var(--muted-foreground)]',
                    )}
                  >
                    {link.platform}
                  </TableCell>
                  <TableCell
                    className={cn(
                      analyticsCellClass('center', 'w-[5.5rem]'),
                      analyticsTableChrome.numeric,
                    )}
                    dir="ltr"
                  >
                    {formatNumber(link.views)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      analyticsCellClass('center', 'w-[5.5rem]'),
                      analyticsTableChrome.numeric,
                      'font-semibold',
                    )}
                    dir="ltr"
                  >
                    {formatNumber(link.totalClicks)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
