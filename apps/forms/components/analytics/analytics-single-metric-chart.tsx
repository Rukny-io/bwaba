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
import type { AnalyticsTrendPoint } from '@/lib/forms-api';
import { formatNumber } from '@/lib/dashboard-format';
import { formatShortDate } from '@/lib/forms-format';
import { cn } from '@/lib/utils';

type MetricKey = 'views' | 'submissions';

interface AnalyticsSingleMetricChartProps {
  data: AnalyticsTrendPoint[];
  metric: MetricKey;
  label: string;
  className?: string;
  height?: number;
}

type ChartRow = { date: string; value: number; label: string };

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return formatNumber(Math.round(value));
}

function MetricTooltip({
  active,
  payload,
  label,
  metricLabel,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
  metricLabel: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-[var(--analytics-tooltip-border,var(--border))] bg-[var(--analytics-tooltip-bg,var(--surface))] px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 text-[var(--muted-foreground)]">{label}</p>
      <p className="font-semibold tabular-nums text-[var(--foreground)]">
        {metricLabel}: {formatNumber(payload[0]?.value ?? 0)}
      </p>
    </div>
  );
}

export function AnalyticsSingleMetricChart({
  data,
  metric,
  label,
  className,
  height = 200,
}: AnalyticsSingleMetricChartProps) {
  const uid = useId().replace(/:/g, '');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const stroke = metric === 'views' ? (isDark ? '#94a3b8' : '#64748b') : '#b5d43b';

  const chartData = useMemo<ChartRow[]>(
    () =>
      data.map((row) => ({
        date: row.date,
        value: row[metric],
        label: formatShortDate(row.date),
      })),
    [data, metric],
  );

  const total = useMemo(
    () => chartData.reduce((sum, row) => sum + row.value, 0),
    [chartData],
  );

  if (chartData.length === 0) {
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
    <div className={cn('w-full', className)}>
      <p className="mb-3 text-xs text-[var(--muted-foreground)]">
        {label} ·{' '}
        <span dir="ltr" lang="en" className="font-semibold tabular-nums text-[var(--foreground)]">
          {formatNumber(total)}
        </span>{' '}
        في الفترة
      </p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-2xl bg-gradient-to-b from-[var(--surface-secondary)]/40 to-transparent px-1 pt-2"
        style={{ height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
                <stop offset="95%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}
              strokeDasharray="4 6"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: isDark ? '#888' : '#64748b', fontSize: 11 }}
              interval={xTickStep - 1}
              dy={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: stroke, fontSize: 10 }}
              tickFormatter={formatAxisValue}
              width={36}
            />
            <Tooltip content={<MetricTooltip metricLabel={label} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill={`url(#${uid}-fill)`}
              isAnimationActive
              animationDuration={800}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                fill: 'var(--surface)',
                stroke,
                strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={900}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
