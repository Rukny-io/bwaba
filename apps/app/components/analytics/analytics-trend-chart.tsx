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
import type { AnalyticsTrendPoint } from '@/lib/analytics/types';
import { formatNumber, formatShortDate } from '@/lib/dashboard-format';
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
      primary: '#3b82f6',
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
}: {
  active?: boolean;
  payload?: { payload?: ChartRow }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

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
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <span className="size-2 rounded-full bg-[#3b82f6]" />
          نقرات الروابط
        </span>
        <span className="text-sm font-bold tabular-nums text-[#3b82f6]">
          {formatNumber(row.clicks)}
        </span>
      </div>
    </motion.div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3b82f6]/20 bg-[#3b82f6]/[0.06] px-2.5 py-1 text-[11px] leading-none">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="font-bold tabular-nums text-[#3b82f6]" dir="ltr" lang="en">
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
    const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0);

    let peakDay = data[0];
    let peakClicks = -1;
    for (const d of data) {
      if (d.clicks > peakClicks) {
        peakClicks = d.clicks;
        peakDay = d;
      }
    }

    const activeDays = data.filter((d) => d.clicks > 0).length;
    const avgClicks =
      activeDays > 0 ? Math.round((totalClicks / activeDays) * 10) / 10 : 0;

    return { totalClicks, peakDay, avgClicks };
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
        <StatChip label="إجمالي النقرات" value={formatNumber(stats.totalClicks)} />
        <StatChip label="متوسط يومي" value={formatNumber(stats.avgClicks)} />
        <StatChip
          label="أعلى يوم"
          value={stats.peakDay ? formatShortDate(stats.peakDay.date) : '—'}
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
              <linearGradient id={`${uid}-clicks`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={palette.primary} stopOpacity={0.35} />
                <stop offset="95%" stopColor={palette.primary} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke={palette.grid} strokeDasharray="4 6" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: palette.axis, fontSize: 11 }}
              interval={xTickStep - 1}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: palette.primary, fontSize: 10 }}
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
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="none"
              fill={`url(#${uid}-clicks)`}
            />
            <Line
              type="monotone"
              dataKey="clicks"
              stroke={palette.primary}
              strokeWidth={2.5}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-5 text-xs text-[var(--muted-foreground)]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-6 rounded-full bg-gradient-to-l from-[#3b82f6]/20 to-[#3b82f6]" />
          نقرات الروابط
        </span>
      </div>
    </div>
  );
}
