'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle } from 'lucide-react';
import type {
  SupportTicketSummary,
  SupportTicketsStats,
} from '@/lib/types/support-tickets';
import { formatNumber } from '@/lib/dashboard-format';
import {
  formatTicketPriority,
  formatTicketStatus,
  ticketPriorityChipColor,
  ticketStatusChipColor,
} from '@/lib/support-tickets-format';
import { Chip } from '@heroui/react';

const STATUS_COLORS = [
  'var(--primary)',
  '#6366f1',
  '#818cf8',
  '#a5b4fc',
  '#c7d2fe',
];

interface SupportTicketsAnalyticsPanelProps {
  stats: SupportTicketsStats | null;
  tickets: SupportTicketSummary[];
  loading?: boolean;
}

export function SupportTicketsAnalyticsPanel({
  stats,
  tickets,
  loading,
}: SupportTicketsAnalyticsPanelProps) {
  const chartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Open', value: stats.open },
      { name: 'In progress', value: stats.inProgress },
      { name: 'Waiting', value: stats.waitingOnUser },
      { name: 'Urgent', value: stats.urgent },
      { name: 'Unassigned', value: stats.unassigned },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const attentionTickets = useMemo(
    () =>
      tickets
        .filter(
          (ticket) =>
            ticket.priority === 'URGENT' ||
            !ticket.assignedTo ||
            ticket.status === 'OPEN' ||
            ticket.status === 'WAITING_ON_USER',
        )
        .slice(0, 8),
    [tickets],
  );

  if (loading && !stats) {
    return (
      <section className="rounded-2xl bg-[var(--surface-secondary)]/40 p-3 sm:dashboard-card sm:bg-[var(--surface)] sm:p-6 sm:rounded-3xl">
        <div className="mb-4 h-5 w-48 animate-pulse rounded-lg bg-[var(--surface-secondary)]" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-56 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
          <div className="h-56 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
        </div>
      </section>
    );
  }

  if (!stats) return null;

  return (
    <section className="rounded-2xl bg-[var(--surface-secondary)]/40 p-3 sm:dashboard-card sm:bg-[var(--surface)] sm:p-6 sm:rounded-3xl">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          Support overview
        </h2>
        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
          {formatNumber(stats.totalActive)} active tickets · queue health at a glance
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-medium text-[var(--muted-foreground)]">
            Queue breakdown
          </p>
          {chartData.length === 0 ? (
            <p className="text-sm italic text-[var(--muted-foreground)]">
              No active tickets in the queue.
            </p>
          ) : (
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
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={88}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--surface-secondary)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const row = payload[0].payload as { name: string; value: number };
                      return (
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs shadow-lg">
                          <p className="font-medium text-[var(--foreground)]">{row.name}</p>
                          <p className="tabular-nums text-[var(--muted-foreground)]">
                            {formatNumber(row.value)} tickets
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                    {chartData.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="flex h-full flex-col rounded-2xl bg-[var(--surface)]/80 p-3 sm:bg-[var(--surface-secondary)] sm:p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-500" strokeWidth={1.75} />
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">
                Needs attention
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Urgent, unassigned, or awaiting action
              </p>
            </div>
          </div>
          {attentionTickets.length === 0 ? (
            <p className="text-sm italic text-[var(--muted-foreground)]">
              No tickets need immediate attention.
            </p>
          ) : (
            <ul className="space-y-2">
              {attentionTickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={`/app/support-tickets/${ticket.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl bg-[var(--surface)] px-3 py-2.5 transition-colors hover:bg-[var(--surface-tertiary)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {ticket.subject}
                      </p>
                      <p className="font-mono text-[11px] text-[var(--muted-foreground)]" dir="ltr">
                        {ticket.number}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Chip
                        color={ticketStatusChipColor(ticket.status)}
                        size="sm"
                        variant="soft"
                      >
                        {formatTicketStatus(ticket.status)}
                      </Chip>
                      {ticket.priority === 'URGENT' ? (
                        <Chip
                          color={ticketPriorityChipColor(ticket.priority)}
                          size="sm"
                          variant="soft"
                        >
                          {formatTicketPriority(ticket.priority)}
                        </Chip>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
