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
  /** Optional label before comparisonPrimary (e.g. إيرادات before currency). */
  comparisonPrimaryLabel?: string;
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
  comparisonPrimaryLabel,
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
        animateFromZeroOnMount={false}
      />
    ) : tabular ? (
      <span>{value}</span>
    ) : (
      value
    );

  const showTrend = Boolean(trend);

  const trendNode = showTrend
    ? trendNumericValue != null && trendNumericValue !== 0
      ? (
          <AnimatedNumber
            value={trendNumericValue}
            format={(n) => formatNumericValue('trend-percent', n)}
            delay={animationDelay + 120}
            duration={700}
            animateFromZeroOnMount={false}
          />
        )
      : trend
    : null;

  const footerLines = [chip, comparisonPrimary, comparisonSecondary].filter(Boolean);

  return (
    <article
      className={cn(
        'flex min-h-[8.25rem] flex-col rounded-xl p-4',
        'bg-[color-mix(in_srgb,var(--surface-secondary)_88%,var(--surface)_12%)]',
        'ring-1 ring-[color-mix(in_srgb,var(--border)_70%,transparent)]',
        'transition-[box-shadow,ring-color] duration-150',
        'hover:ring-[color-mix(in_srgb,var(--border)_55%,var(--foreground)_20%)]',
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            'bg-[var(--surface)] text-[var(--foreground)]',
            'ring-1 ring-[color-mix(in_srgb,var(--border)_75%,transparent)]',
          )}
        >
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
        </div>
        <p className="min-w-0 text-xs font-medium leading-snug text-[var(--muted-foreground)]">
          {label}
        </p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p
          className={cn(
            'min-w-0 font-bold leading-none tracking-tight text-[var(--foreground)]',
            tabular ? 'text-[1.75rem] tabular-nums' : 'text-lg leading-snug',
          )}
          dir={tabular ? 'ltr' : undefined}
          lang={tabular ? 'en' : undefined}
        >
          {valueNode}
        </p>

        {trendNode ? (
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
              trendPositive
                ? 'bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]'
                : 'bg-[var(--surface)] text-[var(--muted-foreground)]',
            )}
            dir="ltr"
            lang="en"
          >
            {trendNode}
          </span>
        ) : null}
      </div>

      {footerLines.length > 0 ? (
        <div className="mt-auto flex flex-col gap-1 pt-3">
          {chip ? (
            <p className={cn('text-xs font-medium leading-snug', chipToneClass[chipTone])}>
              {chip}
            </p>
          ) : null}
          {!chip && comparisonPrimary ? (
            <p
              className="text-xs leading-snug text-[var(--muted-foreground)]"
              dir={comparisonPrimaryLabel ? 'ltr' : undefined}
              lang={comparisonPrimaryLabel ? 'en' : undefined}
            >
              {comparisonPrimaryLabel ? (
                <>
                  <span className="font-medium text-[var(--foreground)]">
                    {comparisonPrimaryLabel}
                  </span>
                  <span className="mx-1 text-[var(--border)]">·</span>
                  <span className="tabular-nums">{comparisonPrimary}</span>
                </>
              ) : (
                comparisonPrimary
              )}
            </p>
          ) : null}
          {!chip && comparisonSecondary ? (
            <p className="text-xs leading-snug text-[var(--muted-foreground)]">
              {comparisonSecondary}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
