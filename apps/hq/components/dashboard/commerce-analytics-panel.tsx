'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  CommerceAnalytics,
  CommerceRange,
  CommerceTrendPoint,
  TopStoreItem,
} from '@/lib/types/admin';
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatShortDate,
} from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

const RANGE_OPTIONS: { value: CommerceRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

const BAR_COLORS = [
  'var(--primary)',
  '#6366f1',
  '#818cf8',
  '#a5b4fc',
  '#c7d2fe',
];

type ChartRow = CommerceTrendPoint & { label: string };

function RevenueTooltip({
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 text-[var(--muted-foreground)]">{row.label}</p>
      <p className="font-semibold tabular-nums text-[var(--foreground)]">
        Revenue: {formatCurrency(row.revenue)}
      </p>
      <p className="tabular-nums text-[var(--muted-foreground)]">
        Orders: {formatNumber(row.orders)}
      </p>
    </div>
  );
}

function StoreTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: TopStoreItem }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-[var(--foreground)]">{row.name}</p>
      <p className="tabular-nums text-[var(--foreground)]">
        {formatCurrency(row.revenue)}
      </p>
      <p className="tabular-nums text-[var(--muted-foreground)]">
        {formatNumber(row.orders)} orders
      </p>
    </div>
  );
}

function truncateName(name: string, max = 18): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max)}…`;
}

export function CommerceAnalyticsPanel({
  initialData,
}: {
  initialData: CommerceAnalytics | null;
}) {
  const [data, setData] = useState(initialData);
  const [range, setRange] = useState<CommerceRange>(initialData?.range ?? '30d');
  const [isPending, startTransition] = useTransition();

  const loadRange = useCallback((nextRange: CommerceRange) => {
    setRange(nextRange);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/v1/admin/analytics/commerce?range=${nextRange}&limit=5`,
          { credentials: 'include', cache: 'no-store' },
        );
        if (!res.ok) return;
        const json = (await res.json()) as CommerceAnalytics;
        setData(json);
      } catch {
        /* keep previous data */
      }
    });
  }, []);

  const chartData = useMemo<ChartRow[]>(
    () =>
      (data?.revenueTrend ?? []).map((row) => ({
        ...row,
        label: formatShortDate(row.date),
      })),
    [data],
  );

  const topStores = data?.topStores ?? [];
  const totals = data?.totals ?? { orders: 0, revenue: 0 };

  const xTickStep =
    chartData.length <= 7 ? 1 : chartData.length <= 14 ? 2 : chartData.length <= 31 ? 4 : 7;

  if (!data) {
    return (
      <section className="dashboard-card rounded-2xl p-4 sm:p-6">
        <h2 className="mb-2 text-base font-semibold text-[var(--foreground)]">
          Commerce analytics
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Could not load analytics data.
        </p>
      </section>
    );
  }

  return (
    <section className="dashboard-card rounded-2xl p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            Commerce analytics
          </h2>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            {formatCurrency(totals.revenue)} revenue · {formatNumber(totals.orders)}{' '}
            orders
          </p>
        </div>
        <div className="flex rounded-xl bg-[var(--surface-secondary)] p-1">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={isPending}
              onClick={() => loadRange(option.value)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs',
                range === option.value
                  ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className={cn('lg:col-span-3', isPending && 'opacity-60')}>
          <p className="mb-2 text-[11px] font-medium text-[var(--muted-foreground)]">
            Daily revenue
          </p>
          {chartData.length === 0 ? (
            <p className="text-sm italic text-[var(--muted-foreground)]">
              No data for this period
            </p>
          ) : (
            <div className="h-[220px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="hqRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="var(--border)"
                    strokeOpacity={0.5}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval={xTickStep - 1}
                  />
                  <YAxis
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCompactCurrency(Number(v))}
                    width={44}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#hqRevenueFill)"
                    dot={false}
                    activeDot={{ r: 4, fill: 'var(--primary)' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={cn('lg:col-span-2', isPending && 'opacity-60')}>
          <p className="mb-2 text-[11px] font-medium text-[var(--muted-foreground)]">
            Top stores
          </p>
          {topStores.length === 0 ? (
            <p className="text-sm italic text-[var(--muted-foreground)]">
              No sales in this period
            </p>
          ) : (
            <div className="h-[220px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topStores}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 4, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="var(--border)"
                    strokeOpacity={0.4}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCompactCurrency(Number(v))}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={72}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => truncateName(String(v))}
                  />
                  <Tooltip content={<StoreTooltip />} cursor={{ fill: 'var(--surface-secondary)' }} />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={18}>
                    {topStores.map((store, index) => (
                      <Cell
                        key={store.id}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
