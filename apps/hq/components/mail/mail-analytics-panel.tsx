'use client';

import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MailAnalyticsResponse } from '@/lib/types/mail';
import { formatNumber, formatShortDate } from '@/lib/dashboard-format';
import { formatMailDomainStatus, formatMailPlan } from '@/lib/mail-format';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
] as const;

type ChartRow = MailAnalyticsResponse['dailyTrend'][number] & { label: string };

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

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-[var(--foreground)]">{row.label}</p>
      <div className="space-y-1">
        <p className="flex items-center justify-between gap-4 tabular-nums">
          <span className="text-[var(--muted-foreground)]">Inbound</span>
          <span className="font-semibold">{formatNumber(row.inbound)}</span>
        </p>
        <p className="flex items-center justify-between gap-4 tabular-nums">
          <span className="text-[var(--muted-foreground)]">Outbound</span>
          <span className="font-semibold">{formatNumber(row.outbound)}</span>
        </p>
        <p className="flex items-center justify-between gap-4 tabular-nums">
          <span className="text-[var(--muted-foreground)]">Failed</span>
          <span className="font-semibold text-[var(--danger)]">{formatNumber(row.failed)}</span>
        </p>
      </div>
    </div>
  );
}

export function MailAnalyticsPanel({
  data,
  loading,
  days,
  onDaysChange,
  title = 'Traffic',
  description = 'Inbound, outbound, and failed delivery — message bodies are never shown.',
  showDistribution = true,
}: {
  data: MailAnalyticsResponse | null;
  loading?: boolean;
  days: number;
  onDaysChange: (days: number) => void;
  title?: string;
  description?: string;
  showDistribution?: boolean;
}) {
  const chartData = useMemo<ChartRow[]>(
    () =>
      (data?.dailyTrend ?? []).map((row) => ({
        ...row,
        label: formatShortDate(row.date),
      })),
    [data],
  );

  const totals = useMemo(() => {
    return (data?.dailyTrend ?? []).reduce(
      (acc, row) => ({
        inbound: acc.inbound + row.inbound,
        outbound: acc.outbound + row.outbound,
        failed: acc.failed + row.failed,
      }),
      { inbound: 0, outbound: 0, failed: 0 },
    );
  }, [data]);

  const mailboxes = data?.mailboxes ?? [];
  const showMailboxBreakdown = mailboxes.length > 0;
  const showPlans = showDistribution && (data?.plans.length ?? 0) > 0;
  const showDomains = showDistribution && (data?.domains.length ?? 0) > 0;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
          <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-[var(--surface-secondary)] p-0.5">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.days}
              type="button"
              onClick={() => onDaysChange(option.days)}
              className={cn(
                'rounded-full px-3 py-1 text-[11px] font-medium',
                days === option.days
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {data && !loading ? (
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-[var(--surface-secondary)] px-3 py-2">
            <p className="text-[11px] text-[var(--muted-foreground)]">Inbound</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums">{formatNumber(totals.inbound)}</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface-secondary)] px-3 py-2">
            <p className="text-[11px] text-[var(--muted-foreground)]">Outbound</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums">{formatNumber(totals.outbound)}</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface-secondary)] px-3 py-2">
            <p className="text-[11px] text-[var(--muted-foreground)]">Failed</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-[var(--danger)]">
              {formatNumber(totals.failed)}
            </p>
          </div>
        </div>
      ) : null}

      <div className="h-56 w-full">
        {loading || !data ? (
          <div className="h-full animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip content={<TrendTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="inbound"
                name="Inbound"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="outbound"
                name="Outbound"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="failed"
                name="Failed"
                stroke="var(--danger)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {data && (showPlans || showDomains) ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {showPlans ? (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Plans
              </p>
              <ul className="space-y-1 text-xs">
                {data.plans.map((row) => (
                  <li key={row.plan} className="flex justify-between gap-3">
                    <span>{formatMailPlan(row.plan)}</span>
                    <span className="tabular-nums text-[var(--muted-foreground)]">
                      {formatNumber(row.count)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {showDomains ? (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Domain verification
              </p>
              <ul className="space-y-1 text-xs">
                {data.domains.map((row) => (
                  <li key={row.status} className="flex justify-between gap-3">
                    <span>{formatMailDomainStatus(row.status)}</span>
                    <span className="tabular-nums text-[var(--muted-foreground)]">
                      {formatNumber(row.count)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {data && showMailboxBreakdown ? (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Mailboxes
          </p>
          <ul className="divide-y divide-[var(--border)]/60 text-xs">
            {mailboxes.map((row) => (
              <li
                key={row.address}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <span className="min-w-0 truncate font-medium" dir="ltr">
                  {row.address}
                </span>
                <span className="tabular-nums text-[var(--muted-foreground)]" dir="ltr">
                  {formatNumber(row.inbound)} in · {formatNumber(row.outbound)} out ·{' '}
                  <span className={row.failed > 0 ? 'text-[var(--danger)]' : undefined}>
                    {formatNumber(row.failed)} failed
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
