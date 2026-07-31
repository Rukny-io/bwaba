import Link from 'next/link';
import type { AppInsight } from '@/lib/analytics/insights';
import { cn } from '@/lib/utils';

const severityStyles: Record<AppInsight['severity'], string> = {
  info: 'border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--primary)]',
  warning: 'border-[var(--warning)]/25 bg-[var(--warning)]/8 text-[var(--warning)]',
  success: 'border-[var(--success)]/25 bg-[var(--success)]/8 text-[var(--success)]',
  danger: 'border-[var(--danger)]/25 bg-[var(--danger)]/8 text-[var(--danger)]',
};

export function DashboardInsightsPanel({ insights }: { insights: AppInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="dashboard-card rounded-4xl p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)] sm:text-base">
        رؤى ذكية
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight) => {
          const content = (
            <>
              <p className="text-sm font-semibold text-[var(--foreground)]">{insight.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
                {insight.description}
              </p>
            </>
          );

          return (
            <li key={insight.id}>
              {insight.href ? (
                <Link
                  href={insight.href}
                  className={cn(
                    'block rounded-4xl border px-3.5 py-3 transition-opacity hover:opacity-90',
                    severityStyles[insight.severity],
                  )}
                >
                  {content}
                </Link>
              ) : (
                <div
                  className={cn(
                    'rounded-4xl border px-3.5 py-3',
                    severityStyles[insight.severity],
                  )}
                >
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
