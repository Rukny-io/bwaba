'use client';

import { useId, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AppAnalyticsDailyPoint } from '@/lib/api/analytics';
import { cn } from '@/lib/utils';

export type AnalyticsMetricKey =
  | 'messages'
  | 'apiRequests'
  | 'formViews'
  | 'formSubmissions'
  | 'walletSpent';

type MetricDef = {
  key: AnalyticsMetricKey;
  label: string;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return formatNumber(Math.round(value));
}

function shortDate(iso: string, locale: string): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(d);
}

function readMetric(
  row: AppAnalyticsDailyPoint,
  metric: AnalyticsMetricKey,
): number {
  const raw = row[metric];
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

interface AnalyticsTrendChartProps {
  data: AppAnalyticsDailyPoint[];
  labels: {
    title: string;
    description: string;
    seriesMessages: string;
    seriesApi: string;
    seriesFormViews: string;
    seriesFormSubmissions: string;
    seriesWallet: string;
    total: string;
    dailyAvg: string;
    peak: string;
    activeDays: string;
    empty: string;
  };
  locale?: string;
  className?: string;
}

export function AnalyticsTrendChart({
  data,
  labels,
  locale = 'en',
  className,
}: AnalyticsTrendChartProps) {
  const uid = useId().replace(/:/g, '');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [metric, setMetric] = useState<AnalyticsMetricKey>('messages');

  const metrics: MetricDef[] = [
    { key: 'messages', label: labels.seriesMessages },
    { key: 'apiRequests', label: labels.seriesApi },
    { key: 'formViews', label: labels.seriesFormViews },
    { key: 'formSubmissions', label: labels.seriesFormSubmissions },
    { key: 'walletSpent', label: labels.seriesWallet },
  ];

  const activeLabel =
    metrics.find((item) => item.key === metric)?.label ?? labels.seriesMessages;

  const palette = useMemo(
    () => ({
      stroke: isDark ? '#e4e4e7' : '#18181b',
      grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)',
      axis: isDark ? '#71717a' : '#94a3b8',
      tooltipBg: isDark ? 'rgba(24,24,27,0.96)' : 'rgba(255,255,255,0.97)',
      tooltipBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
    }),
    [isDark],
  );

  const rows = useMemo(
    () =>
      data.map((row) => ({
        date: row.date,
        label: shortDate(row.date, locale),
        value: readMetric(row, metric),
      })),
    [data, metric, locale],
  );

  const stats = useMemo(() => {
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    const activeDays = rows.filter((row) => row.value > 0).length;
    const avg =
      rows.length > 0 ? Math.round((total / rows.length) * 10) / 10 : 0;

    let peak = rows[0];
    for (const row of rows) {
      if ((peak?.value ?? -1) < row.value) peak = row;
    }

    return {
      total,
      avg,
      activeDays,
      peakValue: peak?.value ?? 0,
      peakDate: peak?.date ?? null,
    };
  }, [rows]);

  const hasDates = rows.length > 0;
  const hasSignal = stats.total > 0;
  const xTickStep =
    rows.length <= 7 ? 1 : rows.length <= 14 ? 2 : rows.length <= 31 ? 4 : 7;

  return (
    <section
      className={cn(
        'dashboard-panel overflow-hidden rounded-[1.75rem] p-0 sm:p-0',
        className,
      )}
    >
      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="min-w-0 lg:max-w-md">
            <h2 className="text-base font-semibold tracking-tight text-[var(--foreground)] sm:text-lg">
              {labels.title}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
              {labels.description}
            </p>
          </div>

          <div
            className="flex w-full gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:w-auto sm:flex-wrap sm:justify-end sm:overflow-visible [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label={labels.title}
          >
            {metrics.map((item) => {
              const active = item.key === metric;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls="analytics-trend-panel"
                  onClick={() => setMetric(item.key)}
                  className={cn(
                    'inline-flex h-8 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-xl px-3 text-[12.5px] font-medium leading-none transition-colors sm:h-9 sm:px-3.5 sm:text-[13px]',
                    active
                      ? 'bg-[var(--foreground)] text-[var(--background)]'
                      : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)]/80 hover:text-[var(--foreground)]',
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[12px] font-medium text-[var(--muted-foreground)]">
              {labels.total}
              <span className="text-[var(--foreground)]/70"> · {activeLabel}</span>
            </p>
            <p
              key={`total-${metric}`}
              className="mt-1 text-[2.1rem] font-semibold leading-none tracking-tight tabular-nums text-[var(--foreground)] sm:text-[2.5rem]"
              dir="ltr"
              lang="en"
            >
              {formatNumber(stats.total)}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12.5px]">
            <Stat label={labels.dailyAvg} value={formatNumber(stats.avg)} />
            <Stat
              label={labels.peak}
              value={
                stats.peakDate
                  ? `${formatNumber(stats.peakValue)} · ${shortDate(stats.peakDate, locale)}`
                  : formatNumber(stats.peakValue)
              }
            />
            <Stat
              label={labels.activeDays}
              value={formatNumber(stats.activeDays)}
            />
          </div>
        </div>
      </div>

      <div
        id="analytics-trend-panel"
        role="tabpanel"
        className="relative border-t border-[var(--border)]/30 px-2 pb-3 pt-2 sm:px-4 sm:pb-4"
      >
        {!hasDates ? (
          <div className="flex h-[220px] items-center justify-center px-4 sm:h-[260px]">
            <p className="text-sm text-[var(--muted-foreground)]">{labels.empty}</p>
          </div>
        ) : (
          <div className="relative h-[220px] w-full sm:h-[260px]">
            {!hasSignal ? (
              <p className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center text-[12.5px] text-[var(--muted-foreground)]">
                {labels.empty}
              </p>
            ) : null}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                key={metric}
                data={rows}
                margin={{ top: 20, right: 12, left: 0, bottom: 4 }}
              >
                <defs>
                  <linearGradient
                    id={`analytics-focus-fill-${uid}-${metric}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={palette.stroke}
                      stopOpacity={isDark ? 0.28 : 0.18}
                    />
                    <stop
                      offset="100%"
                      stopColor={palette.stroke}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke={palette.grid}
                  vertical={false}
                  strokeDasharray="0"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: palette.axis, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={xTickStep - 1}
                  minTickGap={20}
                  dy={6}
                />
                <YAxis
                  tick={{ fill: palette.axis, fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tickFormatter={formatAxisValue}
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => Math.max(Number(dataMax) || 0, 1)]}
                />
                <Tooltip
                  cursor={{
                    stroke: palette.axis,
                    strokeWidth: 1,
                    strokeDasharray: '4 4',
                  }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0]?.payload as
                      | { date: string; value: number }
                      | undefined;
                    if (!row) return null;
                    return (
                      <div
                        className="rounded-2xl px-3.5 py-2.5 shadow-lg backdrop-blur-md"
                        style={{
                          background: palette.tooltipBg,
                          border: `1px solid ${palette.tooltipBorder}`,
                        }}
                      >
                        <p className="text-[11px] font-medium text-[var(--muted-foreground)]">
                          {activeLabel} · {shortDate(row.date, locale)}
                        </p>
                        <p
                          className="mt-1 text-lg font-semibold tabular-nums text-[var(--foreground)]"
                          dir="ltr"
                          lang="en"
                        >
                          {formatNumber(row.value)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name={activeLabel}
                  stroke={palette.stroke}
                  strokeWidth={2}
                  fill={`url(#analytics-focus-fill-${uid}-${metric})`}
                  dot={false}
                  activeDot={{
                    r: 4,
                    strokeWidth: 2,
                    stroke: isDark ? '#09090b' : '#ffffff',
                    fill: palette.stroke,
                  }}
                  isAnimationActive
                  animationDuration={360}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[5.5rem]">
      <p className="text-[var(--muted-foreground)]">{label}</p>
      <p
        className="mt-0.5 font-medium tabular-nums text-[var(--foreground)]"
        dir="ltr"
        lang="en"
      >
        {value}
      </p>
    </div>
  );
}
