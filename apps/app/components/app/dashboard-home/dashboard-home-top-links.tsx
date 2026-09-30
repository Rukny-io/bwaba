import Link from 'next/link';
import { ArrowLeft, Link2 } from 'lucide-react';
import { dashboardPagePanelClass } from '@/components/app/dashboard-page-frame';
import { formatNumber } from '@/lib/dashboard-format';
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
  return (
    <article className={cn(dashboardPagePanelClass, 'min-h-[280px] gap-4')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            أفضل الروابط
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {formatNumber(activeCount)} رابط نشط من {formatNumber(totalCount)}
          </p>
        </div>
        <Link
          href="/app/links"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
        >
          عرض الكل
          <ArrowLeft className="size-3.5" />
        </Link>
      </div>

      {links.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] px-4 py-10 text-center">
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
            <Link2 className="size-4" strokeWidth={1.75} aria-hidden />
          </div>
          <p className="text-sm font-medium text-[var(--foreground)]">لا توجد نقرات بعد</p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            أضف روابطك وابدأ بجمع النقرات.
          </p>
          <Link
            href="/app/links?add=1"
            className="mt-4 inline-flex h-9 items-center rounded-lg bg-[var(--primary)] px-4 text-xs font-semibold text-[var(--primary-foreground)] hover:opacity-95"
          >
            إضافة رابط
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
                    <span className="tabular-nums">{formatNumber(link.clicks)}</span> نقرة
                  </p>
                </div>
                <ArrowLeft className="size-4 shrink-0 text-[var(--muted-foreground)]" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
