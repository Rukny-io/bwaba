'use client';

import { useId, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { AnalyticsTrendPoint } from '@/lib/forms-api';
import { formatNumber } from '@/lib/dashboard-format';
import { formatShortDate } from '@/lib/forms-format';
import { cn } from '@/lib/utils';

interface AnalyticsTrendChartProps {
  data: AnalyticsTrendPoint[];
  className?: string;
  height?: number;
}

type ChartRow = AnalyticsTrendPoint & { label: string };

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return formatNumber(Math.round(value));
}

function useChartPalette() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return useMemo(
    () => ({
      primary: '#b5d43b',
      primaryGlow: isDark ? 'rgba(59,130,246,0.45)' : 'rgba(59,130,246,0.35)',
      primaryFillTop: isDark ? 'rgba(59,130,246,0.32)' : 'rgba(59,130,246,0.22)',
      primaryFillBottom: isDark ? 'rgba(59,130,246,0.02)' : 'rgba(59,130,246,0.01)',
      views: isDark ? '#94a3b8' : '#64748b',
      viewsFillTop: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(100,116,139,0.14)',
      viewsFillBottom: 'rgba(148,163,184,0)',
      grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
      axis: isDark ? '#888888' : '#64748b',
      tooltipBg: isDark ? 'rgba(10,10,10,0.92)' : 'rgba(255,255,255,0.94)',
      tooltipBorder: isDark ? '#333333' : '#e2e8f0',
    }),
    [isDark],
  );
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;

  const row = payload[0]?.payload as ChartRow | undefined;
  if (!row) return null;

  const conversion =
    row.views > 0 ? Math.round((row.submissions / row.views) * 1000) / 10 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
      className="min-w-[11rem] rounded-2xl border px-3.5 py-3 shadow-xl shadow-black/10 backdrop-blur-md"
      style={{
        background: 'var(--analytics-tooltip-bg)',
        borderColor: 'var(--analytics-tooltip-border)',
      }}
    >
      <p className="mb-2.5 text-xs font-semibold text-[var(--foreground)]">
        {formatShortDate(row.date)}
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <span className="size-2 rounded-full bg-[#b5d43b]" />
            استجابات
          </span>
          <span className="text-sm font-bold tabular-nums text-[#b5d43b]">
            {formatNumber(row.submissions)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <span className="size-2 rounded-full bg-[var(--muted-foreground)]/60" />
            مشاهدات
          </span>
          <span className="text-sm font-semibold tabular-nums text-[var(--foreground)]">
            {formatNumber(row.views)}
          </span>
        </div>
        {row.views > 0 ? (
          <div className="mt-1 rounded-xl bg-[var(--surface-secondary)] px-2.5 py-1.5 text-center text-[11px] text-[var(--muted-foreground)]">
            معدل التحويل{' '}
            <span className="font-bold tabular-nums text-[var(--foreground)]">
              {conversion}%
            </span>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'primary';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] leading-none',
        accent === 'primary'
          ? 'border-[#b5d43b]/20 bg-[#b5d43b]/[0.06]'
          : 'border-[var(--border)] bg-[var(--surface-secondary)]/50',
      )}
    >
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span
        className={cn(
          'font-bold tabular-nums',
          accent === 'primary' ? 'text-[#b5d43b]' : 'text-[var(--foreground)]',
        )}
        dir="ltr"
        lang="en"
      >
        {value}
      </span>
    </span>
  );
}

export function AnalyticsTrendChart({
  data,
  className,
  height = 300,
}: AnalyticsTrendChartProps) {
  const uid = useId().replace(/:/g, '');
  const palette = useChartPalette();

  const chartData = useMemo<ChartRow[]>(
    () =>
      data.map((point) => ({
        ...point,
        label: formatShortDate(point.date),
      })),
    [data],
  );

  const stats = useMemo(() => {
    const totals = data.reduce(
      (acc, d) => ({
        views: acc.views + d.views,
        submissions: acc.submissions + d.submissions,
      }),
      { views: 0, submissions: 0 },
    );

    let peakDay = data[0];
    let peakScore = -1;
    for (const d of data) {
      const score = d.submissions * 2 + d.views;
      if (score > peakScore) {
        peakScore = score;
        peakDay = d;
      }
    }

    const activeDays = data.filter(
      (d) => d.views > 0 || d.submissions > 0,
    ).length;
    const avgSub =
      activeDays > 0
        ? Math.round((totals.submissions / activeDays) * 10) / 10
        : 0;

    return { totals, peakDay, avgSub };
  }, [data]);

  if (data.length === 0) {
    return (
      <p className="text-sm italic text-[var(--muted-foreground)]">
        لا توجد بيانات في هذه الفترة
      </p>
    );
  }

  const xTickStep =
    chartData.length <= 7
      ? 1
      : chartData.length <= 14
        ? 2
        : chartData.length <= 31
          ? 5
          : 7;

  return (
    <div
      className={cn('w-full', className)}
      style={
        {
          '--analytics-tooltip-bg': palette.tooltipBg,
          '--analytics-tooltip-border': palette.tooltipBorder,
        } as React.CSSProperties
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <StatChip
          label="استجابات"
          value={formatNumber(stats.totals.submissions)}
          accent="primary"
        />
        <StatChip
          label="مشاهدات"
          value={formatNumber(stats.totals.views)}
        />
        <StatChip
          label="متوسط"
          value={formatNumber(stats.avgSub)}
        />
        <StatChip
          label="أعلى يوم"
          value={
            stats.peakDay
              ? formatShortDate(stats.peakDay.date)
              : '—'
          }
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        className="analytics-trend-chart relative rounded-2xl bg-gradient-to-b from-[var(--surface-secondary)]/40 to-transparent px-1 pt-2"
        style={{ height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id={`${uid}-submissions`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={palette.primary}
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor={palette.primary}
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id={`${uid}-views`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.views} stopOpacity={0.2} />
                <stop offset="95%" stopColor={palette.views} stopOpacity={0} />
              </linearGradient>
              <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              stroke={palette.grid}
              strokeDasharray="4 6"
              vertical={false}
            />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: palette.axis, fontSize: 11 }}
              interval={xTickStep - 1}
              dy={8}
            />

            <YAxis
              yAxisId="submissions"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tick={{ fill: palette.primary, fontSize: 10 }}
              tickFormatter={formatAxisValue}
              width={36}
            />

            <YAxis
              yAxisId="views"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fill: palette.views, fontSize: 10 }}
              tickFormatter={formatAxisValue}
              width={36}
            />

            <Tooltip
              content={<TrendTooltip />}
              cursor={{
                stroke: palette.primary,
                strokeWidth: 1,
                strokeDasharray: '4 4',
                strokeOpacity: 0.35,
              }}
              animationDuration={200}
            />

            <Area
              yAxisId="views"
              type="monotone"
              dataKey="views"
              stroke="none"
              fill={`url(#${uid}-views)`}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />

            <Area
              yAxisId="submissions"
              type="monotone"
              dataKey="submissions"
              stroke="none"
              fill={`url(#${uid}-submissions)`}
              isAnimationActive
              animationDuration={1100}
              animationEasing="ease-out"
            />

            <Line
              yAxisId="views"
              type="monotone"
              dataKey="views"
              stroke={palette.views}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                fill: 'var(--surface)',
                stroke: palette.views,
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={1000}
              animationEasing="ease-out"
            />

            <Line
              yAxisId="submissions"
              type="monotone"
              dataKey="submissions"
              stroke={palette.primary}
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 6,
                fill: 'var(--surface)',
                stroke: palette.primary,
                strokeWidth: 2.5,
                filter: `url(#${uid}-glow)`,
              }}
              isAnimationActive
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-5 text-xs text-[var(--muted-foreground)]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-gradient-to-l from-[#b5d43b]/20 to-[#b5d43b]" />
          استجابات
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-gradient-to-l from-[var(--muted-foreground)]/15 to-[var(--muted-foreground)]/50" />
          مشاهدات
        </span>
      </div>
    </div>
  );
}
