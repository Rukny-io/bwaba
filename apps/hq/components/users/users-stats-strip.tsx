import type { LucideIcon } from 'lucide-react';
import { BadgeCheck, UserCheck, UserPlus, Users } from 'lucide-react';
import type { UsersStats } from '@/lib/types/users';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { formatNumber, formatPercent } from '@/lib/dashboard-format';

export function UsersStatsStrip({ stats }: { stats: UsersStats | null }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[7.25rem] animate-pulse rounded-2xl bg-[var(--surface-secondary)] sm:min-h-[8.5rem] sm:rounded-3xl"
          />
        ))}
      </div>
    );
  }

  const activeRate =
    stats.total > 0 ? Math.round((stats.activeToday / stats.total) * 100) : 0;

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
      icon: Users,
      label: 'Total users',
      value: formatNumber(stats.total),
      trend: stats.today > 0 ? `+${stats.today}` : undefined,
      trendPositive: true,
      comparisonPrimary: `${formatNumber(stats.thisMonth)} new this month`,
      comparisonSecondary: `${formatPercent(stats.verificationRate)} verified email`,
    },
    {
      icon: UserCheck,
      label: 'Active today',
      value: formatNumber(stats.activeToday),
      trend: activeRate > 0 ? `${activeRate}%` : undefined,
      trendPositive: true,
      comparisonPrimary: 'Signed in today',
      comparisonSecondary: `of ${formatNumber(stats.total)} users`,
    },
    {
      icon: UserPlus,
      label: 'New users',
      value: formatNumber(stats.thisWeek),
      comparisonPrimary: `${formatNumber(stats.today)} today`,
      comparisonSecondary: `${formatNumber(stats.thisMonth)} this month`,
    },
    {
      icon: BadgeCheck,
      label: 'Verified email',
      value: formatNumber(stats.verified),
      trend: formatPercent(stats.verificationRate),
      trendPositive: true,
      comparisonPrimary: 'Email confirmed',
      comparisonSecondary: `${formatNumber(stats.profileCompleted)} profiles complete`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <DashboardMetricCard key={card.label} {...card} />
      ))}
    </div>
  );
}
