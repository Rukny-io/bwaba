'use client';

import Link from 'next/link';
import type { AppInsight } from '@/lib/analytics/insights';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const severityStyles: Record<AppInsight['severity'], string> = {
  info: 'bg-[var(--surface-secondary)]',
  warning:
    'bg-[color-mix(in_srgb,var(--warning)_12%,var(--surface-secondary))]',
  success:
    'bg-[color-mix(in_srgb,var(--success)_12%,var(--surface-secondary))]',
  danger: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface-secondary))]',
};

export function DashboardInsightsPanel({ insights }: { insights: AppInsight[] }) {
  const { t } = useTranslations();
  if (insights.length === 0) return null;

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-xl bg-[var(--surface)] p-4 sm:p-5">
      <h2 className="text-[13px] font-semibold tracking-tight text-[var(--foreground)]">
        {t('analytics.insightsTitle')}
      </h2>
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight) => {
          const content = (
            <>
              <p className="text-sm font-medium text-[var(--foreground)]">{insight.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
                {insight.description}
              </p>
            </>
          );

          const surfaceClass = cn(
            'block rounded-2xl px-3.5 py-3 transition-colors',
            severityStyles[insight.severity],
          );

          return (
            <li key={insight.id}>
              {insight.href ? (
                <Link href={insight.href} className={cn(surfaceClass, 'hover:opacity-95')}>
                  {content}
                </Link>
              ) : (
                <div className={surfaceClass}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
