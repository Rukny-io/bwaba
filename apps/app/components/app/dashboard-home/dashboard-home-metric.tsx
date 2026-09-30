'use client';

import {
  AlertTriangle,
  Eye,
  Link2,
  MousePointerClick,
  Package,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { formatNumber } from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

export type DashboardHomeMetricIcon =
  | 'mouse-pointer-click'
  | 'eye'
  | 'link'
  | 'package'
  | 'shopping-bag'
  | 'alert-triangle';

const METRIC_ICONS: Record<DashboardHomeMetricIcon, LucideIcon> = {
  'mouse-pointer-click': MousePointerClick,
  eye: Eye,
  link: Link2,
  package: Package,
  'shopping-bag': ShoppingBag,
  'alert-triangle': AlertTriangle,
};

interface DashboardHomeMetricProps {
  icon: DashboardHomeMetricIcon;
  label: string;
  value: string;
  numericValue?: number;
  hint?: string;
  trend?: string;
  trendPositive?: boolean;
  animationDelay?: number;
  className?: string;
}

export function DashboardHomeMetric({
  icon,
  label,
  value,
  numericValue,
  hint,
  trend,
  trendPositive = true,
  animationDelay = 0,
  className,
}: DashboardHomeMetricProps) {
  const Icon = METRIC_ICONS[icon];

  const valueNode =
    numericValue != null ? (
      <AnimatedNumber
        value={numericValue}
        format={(n) => formatNumber(n)}
        delay={animationDelay}
      />
    ) : (
      <span className="tabular-nums">{value}</span>
    );

  return (
    <article
      className={cn(
        'flex min-h-[8.5rem] flex-col rounded-xl bg-[var(--surface-secondary)] p-4 sm:min-h-[9rem]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--foreground)]">
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
        </div>
        {trend ? (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
              trendPositive
                ? 'bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]'
                : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
            )}
            dir="ltr"
            lang="en"
          >
            {trend}
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-xs font-medium text-[var(--muted-foreground)] sm:text-sm">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold leading-none tracking-tight text-[var(--foreground)] sm:text-[1.75rem]">
        {valueNode}
      </p>
      {hint ? (
        <p className="mt-auto pt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
          {hint}
        </p>
      ) : null}
    </article>
  );
}
