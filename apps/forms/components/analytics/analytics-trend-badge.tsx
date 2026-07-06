'use client';

import { formatTrendBadge } from '@/lib/dashboard-format';

export function AnalyticsTrendBadge({ value }: { value?: number }) {
  const label = formatTrendBadge(value);
  if (!label) return null;

  const positive = (value ?? 0) >= 0;

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums ${
        positive
          ? 'bg-[var(--brand-soft-lime)] text-[var(--foreground)]'
          : 'bg-[var(--danger)]/15 text-[var(--danger)]'
      }`}
    >
      {label}
    </span>
  );
}
