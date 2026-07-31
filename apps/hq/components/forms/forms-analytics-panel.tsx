'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle, Eye, Inbox, TrendingUp } from 'lucide-react';
import type { FormsAnalyticsRankItem, FormsAnalyticsResponse } from '@/lib/types/forms';
import {
  formatCompactNumber,
  formatNumber,
  formatPercent,
  formatShortDate,
} from '@/lib/dashboard-format';
import { hqApi } from '@/lib/hq-api';
import { cn } from '@/lib/utils';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';

const PERIOD_OPTIONS = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
] as const;

const BAR_COLORS = [
  'var(--primary)',
  '#6366f1',
  '#818cf8',
  '#a5b4fc',
  '#c7d2fe',
  '#ddd6fe',
  '#ede9fe',
  '#f5f3ff',
];

type ChartRow = FormsAnalyticsResponse['dailyTrend'][number] & { label: string };

type RankChartRow = FormsAnalyticsRankItem & { shortTitle: string };

function truncateTitle(title: string, max = 20): string {
  if (title.length <= max) return title;
  return `${title.slice(0, max)}…`;
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: ChartRow; dataKey?: string; color?: string; value?: number }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const rate =
    row.views > 0 ? Math.round((row.submissions / row.views) * 1000) / 10 : null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-[var(--foreground)]">{row.label}</p>
      <div className="space-y-1">
        <p className="flex items-center justify-between gap-4 tabular-nums">
          <span className="text-[var(--muted-foreground)]">Views</span>
          <span className="font-semibold text-[var(--foreground)]">
            {formatNumber(row.views)}
          </span>
        </p>
        <p className="flex items-center justify-between gap-4 tabular-nums">
          <span className="text-[var(--muted-foreground)]">Submissions</span>
          <span className="font-semibold text-[#6366f1]">
            {formatNumber(row.submissions)}
          </span>
        </p>
        {rate != null ? (
          <p className="border-t border-[var(--border)] pt-1 text-[var(--muted-foreground)]">
            Completion: {formatPercent(rate)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function RankTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: { payload?: RankChartRow }[];
  metric: 'views' | 'submissions';
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 max-w-[14rem] font-medium text-[var(--foreground)]">
        {row.title}
      </p>
      <p className="tabular-nums text-[var(--foreground)]">
        {formatNumber(metric === 'views' ? row.views : row.submissions)}{' '}
        {metric === 'views' ? 'views' : 'responses'}
      </p>
      {row.completionRate != null ? (
        <p className="tabular-nums text-[var(--muted-foreground)]">
          {formatPercent(row.completionRate)} completion
        </p>
      ) : null}
    </div>
  );
}

function RankBarChart({
  title,
  items,
  metric,
}: {
  title: string;
  metric: 'views' | 'submissions';
  items: FormsAnalyticsRankItem[];
}) {
  const dataKey = metric;
  const chartData = useMemo<RankChartRow[]>(
    () =>
      items.map((item) => ({
        ...item,
        shortTitle: truncateTitle(item.title),
      })),
    [items],
  );

  if (chartData.length === 0) {
    return (
      <div>
        <p className="mb-2 text-[11px] font-medium text-[var(--muted-foreground)]">
          {title}
        </p>
        <p className="text-sm italic text-[var(--muted-foreground)]">
          No activity in this period.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-[11px] font-medium text-[var(--muted-foreground)]">
        {title}
      </p>
      <div className="h-[220px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
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
              tickFormatter={(v) => formatCompactNumber(Number(v))}
            />
            <YAxis
              type="category"
              dataKey="shortTitle"
              width={76}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<RankTooltip metric={metric} />}
              cursor={{ fill: 'var(--surface-secondary)' }}
            />
            <Bar dataKey={dataKey} radius={[0, 6, 6, 0]} barSize={16}>
              {chartData.map((item, index) => (
                <Cell
                  key={item.formId}
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1">
        {chartData.slice(0, 3).map((item) => (
          <li key={item.formId}>
            <Link
              href={`/app/forms/${item.formId}`}
              className="flex items-center justify-between gap-2 rounded-lg px-1 py-0.5 text-[11px] transition-colors hover:bg-[var(--surface-secondary)]"
            >
              <span className="truncate text-[var(--foreground)]">{item.title}</span>
              <span className="shrink-0 tabular-nums text-[var(--muted-foreground)]">
                {formatNumber(metric === 'views' ? item.views : item.submissions)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompletionFunnel({
  views,
  submissions,
  rate,
}: {
  views: number;
  submissions: number;
  rate: number | null;
}) {
  const submissionPct = views > 0 ? Math.min(100, (submissions / views) * 100) : 0;

  return (
    <div className="flex h-full flex-col justify-center rounded-2xl bg-[var(--surface-secondary)] p-4">
      <p className="mb-3 text-[11px] font-medium text-[var(--muted-foreground)]">
        Conversion funnel
      </p>
      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-[var(--muted-foreground)]">Views</span>
            <span className="font-semibold tabular-nums text-[var(--foreground)]">
              {formatNumber(views)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface)]">
            <div
              className="h-full rounded-full bg-[var(--primary)]"
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="text-[var(--muted-foreground)]">Submissions</span>
            <span className="font-semibold tabular-nums text-[#6366f1]">
              {formatNumber(submissions)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface)]">
            <div
              className="h-full rounded-full bg-[#6366f1] transition-all duration-500"
              style={{ width: `${Math.max(submissionPct, submissions > 0 ? 2 : 0)}%` }}
            />
          </div>
        </div>
      </div>
      {rate != null ? (
        <p className="mt-4 text-center text-2xl font-bold tabular-nums text-[var(--foreground)]">
          {formatPercent(rate)}
          <span className="mt-0.5 block text-[10px] font-normal text-[var(--muted-foreground)]">
            platform completion
          </span>
        </p>
      ) : null}
    </div>
  );
}

export function FormsAnalyticsPanel({
  data: initialData,
  loading,
}: {
  data: FormsAnalyticsResponse | null;
  loading?: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [periodDays, setPeriodDays] = useState(initialData?.periodDays ?? 7);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (initialData && initialData.periodDays === periodDays) {
      setData(initialData);
    }
  }, [initialData, periodDays]);

  const loadPeriod = useCallback((days: number) => {
    setPeriodDays(days);
    startTransition(async () => {
      try {
        const next = await hqApi.getFormsAnalytics({
          days,
          staleDays: days <= 7 ? 14 : 30,
          limit: 8,
        });
        setData(next);
      } catch {
        /* keep previous data */
      }
    });
  }, []);

  const chartData = useMemo<ChartRow[]>(
    () =>
      (data?.dailyTrend ?? []).map((point) => ({
        ...point,
        label: formatShortDate(point.date),
      })),
    [data?.dailyTrend],
  );

  const xTickStep =
    chartData.length <= 7 ? 1 : chartData.length <= 14 ? 2 : chartData.length <= 31 ? 4 : 7;

  if (loading && !data) {
    return (
      <section className="rounded-2xl bg-[var(--surface-secondary)]/40 p-3 sm:dashboard-card sm:bg-[var(--surface)] sm:p-6 sm:rounded-3xl">
        <div className="mb-4 h-5 w-40 animate-pulse rounded-lg bg-[var(--surface-secondary)]" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[7rem] animate-pulse rounded-2xl bg-[var(--surface-secondary)]"
            />
          ))}
        </div>
        <div className="mt-4 h-56 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
      </section>
    );
  }

  if (!data) return null;

  const isRefreshing = loading || isPending;

  return (
    <section className="rounded-2xl bg-[var(--surface-secondary)]/40 p-3 sm:dashboard-card sm:bg-[var(--surface)] sm:p-6 sm:rounded-3xl">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            Platform analytics
          </h2>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            {formatNumber(data.platform.views)} views ·{' '}
            {formatNumber(data.platform.submissions)} submissions · aggregate only
          </p>
        </div>
        <div className="flex rounded-xl bg-[var(--surface-secondary)] p-1">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.days}
              type="button"
              disabled={isRefreshing}
              onClick={() => loadPeriod(option.days)}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs',
                periodDays === option.days
                  ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>


      <div className={cn('grid gap-6 lg:grid-cols-5', isRefreshing && 'opacity-60')}>
        <div className="lg:col-span-3">
          <p className="mb-2 text-[11px] font-medium text-[var(--muted-foreground)]">
            Daily trend
          </p>
          {chartData.length === 0 ? (
            <p className="text-sm italic text-[var(--muted-foreground)]">
              No activity in this period
            </p>
          ) : (
            <div className="h-[240px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="hqFormsViewsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
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
                    yAxisId="views"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCompactNumber(Number(v))}
                    width={40}
                  />
                  <YAxis
                    yAxisId="submissions"
                    orientation="right"
                    tick={{ fill: '#6366f1', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatCompactNumber(Number(v))}
                    width={40}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={28}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-[11px] text-[var(--muted-foreground)]">
                        {value}
                      </span>
                    )}
                  />
                  <Area
                    yAxisId="views"
                    type="monotone"
                    dataKey="views"
                    name="Views"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#hqFormsViewsFill)"
                    dot={false}
                    activeDot={{ r: 4, fill: 'var(--primary)' }}
                  />
                  <Line
                    yAxisId="submissions"
                    type="monotone"
                    dataKey="submissions"
                    name="Submissions"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 2, fill: '#6366f1', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#6366f1' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <CompletionFunnel
            views={data.platform.views}
            submissions={data.platform.submissions}
            rate={data.platform.completionRate}
          />
        </div>
      </div>

      <div
        className={cn(
          'mt-6 grid gap-6 border-t border-[var(--border)] pt-6 lg:grid-cols-2',
          isRefreshing && 'opacity-60',
        )}
      >
        <RankBarChart title="Top by views" items={data.topByViews} metric="views" />
        <RankBarChart
          title="Top by submissions"
          items={data.topBySubmissions}
          metric="submissions"
        />
      </div>

      {data.stalePublishedNoSubmissions.length > 0 ? (
        <div
          className={cn(
            'mt-6 border-t border-[var(--border)] pt-6',
            isRefreshing && 'opacity-60',
          )}
        >
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-500" strokeWidth={1.75} />
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Published with no responses
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Live forms with zero submissions for at least {data.staleDays} days ·{' '}
                {data.stalePublishedNoSubmissions.length} found
              </p>
            </div>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.stalePublishedNoSubmissions.map((form) => (
              <li key={form.id}>
                <Link
                  href={`/app/forms/${form.id}`}
                  className="flex items-center justify-between gap-2 rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5 transition-colors hover:bg-[var(--surface-tertiary)]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">
                      {form.title}
                    </p>
                    <p className="text-[11px] text-[var(--muted-foreground)]" dir="ltr">
                      /{form.slug} · {formatNumber(form.viewCount)} views
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-amber-600">
                    {form.daysPublished}d
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
