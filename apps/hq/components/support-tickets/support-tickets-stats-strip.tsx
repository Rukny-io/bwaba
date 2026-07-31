import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  Clock3,
  Inbox,
  LifeBuoy,
  UserRound,
} from 'lucide-react';
import type { SupportTicketsStats } from '@/lib/types/support-tickets';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { formatNumber, formatPercent } from '@/lib/dashboard-format';

function activeShare(stats: SupportTicketsStats): string | undefined {
  const total = stats.open + stats.inProgress + stats.waitingOnUser;
  if (total <= 0) return undefined;
  return formatPercent(Math.round((stats.totalActive / total) * 100));
}

export function SupportTicketsStatsStrip({
  stats,
}: {
  stats: SupportTicketsStats | null;
}) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[7.25rem] animate-pulse rounded-2xl bg-[var(--surface-secondary)] sm:min-h-[8.5rem] sm:rounded-3xl"
          />
        ))}
      </div>
    );
  }

  const cards: {
    icon: LucideIcon;
    label: string;
    value: string;
    trend?: string;
    trendPositive?: boolean;
    comparisonPrimary: string;
    comparisonSecondary?: string;
  }[] = [
    {
      icon: LifeBuoy,
      label: 'Active tickets',
      value: formatNumber(stats.totalActive),
      trend: activeShare(stats),
      trendPositive: stats.totalActive > 0,
      comparisonPrimary: `${formatNumber(stats.open)} open`,
      comparisonSecondary: `${formatNumber(stats.inProgress)} in progress`,
    },
    {
      icon: Inbox,
      label: 'Open',
      value: formatNumber(stats.open),
      comparisonPrimary: 'Awaiting first response',
      comparisonSecondary:
        stats.unassigned > 0
          ? `${formatNumber(stats.unassigned)} unassigned`
          : 'All assigned',
    },
    {
      icon: Clock3,
      label: 'In progress',
      value: formatNumber(stats.inProgress),
      comparisonPrimary: 'Being handled by staff',
      comparisonSecondary: `${formatNumber(stats.waitingOnUser)} waiting on user`,
    },
    {
      icon: UserRound,
      label: 'Waiting on user',
      value: formatNumber(stats.waitingOnUser),
      comparisonPrimary: 'Pending customer reply',
      comparisonSecondary: 'Follow up if needed',
    },
    {
      icon: AlertCircle,
      label: 'Urgent',
      value: formatNumber(stats.urgent),
      trendPositive: false,
      trend: stats.urgent > 0 ? 'Priority' : undefined,
      comparisonPrimary: `${formatNumber(stats.unassigned)} unassigned`,
      comparisonSecondary: 'Needs assignment',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
      {cards.map((card) => (
        <DashboardMetricCard key={card.label} {...card} />
      ))}
    </div>
  );
}
