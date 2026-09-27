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
import { formatCurrency, formatNumber } from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

export type DashboardMetricChipTone =
  | 'success'
  | 'warning'
  | 'neutral'
  | 'danger';

export type DashboardMetricIconName =
  | 'mouse-pointer-click'
  | 'eye'
  | 'link'
  | 'package'
  | 'shopping-bag'
  | 'alert-triangle';

export type DashboardNumericFormat = 'number' | 'currency' | 'trend-percent';

const METRIC_ICONS: Record<DashboardMetricIconName, LucideIcon> = {
  'mouse-pointer-click': MousePointerClick,
  eye: Eye,
  link: Link2,
  package: Package,
  'shopping-bag': ShoppingBag,
  'alert-triangle': AlertTriangle,
};

function formatNumericValue(format: DashboardNumericFormat, value: number): string {
  if (format === 'currency') return formatCurrency(value);
  if (format === 'trend-percent') {
    return `${value >= 0 ? '+' : ''}${Math.round(value * 10) / 10}%`;
  }
  return formatNumber(value);
}

export interface DashboardMetricCardProps {
  icon: DashboardMetricIconName;
  label: string;
  value: string | number;
  comparisonPrimary: string;
  comparisonSecondary: string;
  trend?: string;
  trendPositive?: boolean;
  chip?: string;
  chipTone?: DashboardMetricChipTone;
  tabular?: boolean;
  numericValue?: number;
  numericFormat?: DashboardNumericFormat;
  animationDelay?: number;
  trendNumericValue?: number;
}

const chipToneClass: Record<DashboardMetricChipTone, string> = {
  success: 'text-[var(--success)]',
  warning: 'text-[var(--warning)]',
  danger: 'text-[var(--danger)]',
  neutral: 'text-[var(--muted-foreground)]',
};

export function DashboardMetricCard({
  icon,
  label,
  value,
  comparisonPrimary,
  comparisonSecondary,
  trend,
  trendPositive = true,
  chip,
  chipTone = 'neutral',
  tabular = true,
  numericValue,
  numericFormat = 'number',
  animationDelay = 0,
  trendNumericValue,
}: DashboardMetricCardProps) {
  const Icon = METRIC_ICONS[icon];

  const valueNode =
    numericValue != null ? (
      <AnimatedNumber
        value={numericValue}
        format={(n) => formatNumericValue(numericFormat, n)}
        delay={animationDelay}
      />
    ) : tabular ? (
      <span dir="ltr" lang="en">
        {value}
      </span>
    ) : (
      value
    );

  const trendNode =
    trendNumericValue != null ? (
      <AnimatedNumber
        value={trendNumericValue}
        format={(n) => formatNumericValue('trend-percent', n)}
        delay={animationDelay + 120}
        duration={700}
      />
    ) : (
      trend
    );

  const hasFooter = Boolean(chip || trend || trendNumericValue != null || comparisonSecondary || comparisonPrimary);

  return (
    <article className="dashboard-metric-tile flex min-h-[6.75rem] flex-col p-3.5 sm:min-h-[7.25rem] sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-medium leading-snug text-[var(--muted-foreground)] sm:text-[13px]">
          {label}
        </p>
        <Icon
          className="size-4 shrink-0 text-[var(--muted-foreground)]"
          strokeWidth={1.75}
          aria-hidden
        />
      </div>

      <p
        className={cn(
          'mt-2.5 min-w-0 font-semibold leading-none tracking-tight text-[var(--foreground)]',
          tabular
            ? 'text-[1.5rem] sm:text-[1.65rem]'
            : 'text-[1.15rem] leading-snug sm:text-[1.25rem]',
        )}
      >
        {valueNode}
      </p>

      {hasFooter ? (
        <p className="mt-auto pt-3 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
          {chip ? (
            <span className={cn('font-medium', chipToneClass[chipTone])}>{chip}</span>
          ) : null}
          {!chip && trendNode ? (
            <>
              <span
                className={cn(
                  'font-medium tabular-nums text-[var(--foreground)]',
                  !trendPositive && 'text-[var(--muted-foreground)]',
                )}
                dir="ltr"
                lang="en"
              >
                {trendNode}
              </span>
              {comparisonSecondary ? (
                <span className="text-[var(--muted-foreground)]">
                  {' '}
                  · {comparisonSecondary}
                </span>
              ) : comparisonPrimary ? (
                <span className="text-[var(--muted-foreground)]">
                  {' '}
                  · {comparisonPrimary}
                </span>
              ) : null}
            </>
          ) : !chip && comparisonSecondary ? (
            comparisonSecondary
          ) : !chip && comparisonPrimary ? (
            comparisonPrimary
          ) : null}
        </p>
      ) : null}
    </article>
  );
}
