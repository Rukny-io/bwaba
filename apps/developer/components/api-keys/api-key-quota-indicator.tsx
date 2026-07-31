'use client';

import {
  isQuotaAtLimit,
  isUnlimitedLimit,
  resolveQuotaUsagePercent,
} from '@/lib/developer-plan-limits';
import { cn } from '@/lib/utils';

export interface ApiKeyQuotaLabels {
  activeCount: string;
  ofLimit: string;
  remaining: string;
  openBadge: string;
  openHint: string;
}

interface ApiKeyQuotaIndicatorProps {
  used: number;
  limit: number;
  labels: ApiKeyQuotaLabels;
  className?: string;
}

export function ApiKeyQuotaIndicator({
  used,
  limit,
  labels,
  className,
}: ApiKeyQuotaIndicatorProps) {
  const unlimited = isUnlimitedLimit(limit);
  const isAtLimit = isQuotaAtLimit(used, limit);
  const usagePercent = resolveQuotaUsagePercent(used, limit);
  const remaining = Math.max(limit - used, 0);

  if (unlimited) {
    return (
      <div className={cn('mt-3', className)}>
        <div className="flex flex-wrap items-center gap-2">
          <p
            className="text-sm font-semibold text-[var(--foreground)]"
            dir="ltr"
            lang="en"
          >
            {labels.activeCount.replace('{used}', String(used))}
          </p>
          <span className="rounded-full border border-[color-mix(in_srgb,var(--primary)_25%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
            {labels.openBadge}
          </span>
        </div>
        <div
          className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]"
          aria-hidden
        >
          <div className="h-full w-full rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--primary)]/60 to-[var(--primary)]/15" />
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)]">
          {labels.openHint}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('mt-3', className)}>
      <div className="flex items-center gap-3">
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isAtLimit
                ? 'bg-[var(--danger)]'
                : usagePercent > 70
                  ? 'bg-[var(--warning)]'
                  : 'bg-[var(--primary)]',
            )}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <span
          className="shrink-0 text-xs font-medium tabular-nums text-[var(--foreground)]"
          dir="ltr"
          lang="en"
        >
          {labels.ofLimit
            .replace('{used}', String(used))
            .replace('{limit}', String(limit))}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)]">
        {labels.remaining.replace('{remaining}', String(remaining))}
      </p>
    </div>
  );
}
