import type { LucideIcon } from 'lucide-react';
import {
  Package,
  ShoppingCart,
  Store,
  StoreIcon,
  TrendingUp,
  UserX,
} from 'lucide-react';
import type { StoresStats } from '@/lib/types/stores';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { formatNumber, formatPercent } from '@/lib/dashboard-format';

function activeShare(stats: StoresStats): string | undefined {
  if (stats.total <= 0) return undefined;
  return formatPercent(Math.round((stats.active / stats.total) * 100));
}

export function StoresStatsStrip({ stats }: { stats: StoresStats | null }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
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
      icon: Store,
      label: 'Total stores',
      value: formatNumber(stats.total),
      comparisonPrimary: `${formatNumber(stats.active)} active`,
      comparisonSecondary: `${formatNumber(stats.inactive)} inactive`,
    },
    {
      icon: StoreIcon,
      label: 'Active',
      value: formatNumber(stats.active),
      trend: activeShare(stats),
      trendPositive: true,
      comparisonPrimary: 'Live on the platform',
      comparisonSecondary: `of ${formatNumber(stats.total)} total`,
    },
    {
      icon: UserX,
      label: 'Inactive',
      value: formatNumber(stats.inactive),
      comparisonPrimary: 'Hidden or suspended',
      comparisonSecondary:
        stats.inactive === 1 ? '1 store' : `${formatNumber(stats.inactive)} stores`,
    },
    {
      icon: TrendingUp,
      label: 'New this week',
      value: formatNumber(stats.newThisWeek),
      comparisonPrimary: `${formatNumber(stats.newThisMonth)} this month`,
      comparisonSecondary: 'Recently registered',
    },
    {
      icon: Package,
      label: 'Products',
      value: formatNumber(stats.totalProducts),
      comparisonPrimary: 'Across all stores',
      comparisonSecondary:
        stats.total > 0
          ? `${(stats.totalProducts / stats.total).toFixed(1)} avg per store`
          : undefined,
    },
    {
      icon: ShoppingCart,
      label: 'Orders',
      value: formatNumber(stats.totalOrders),
      comparisonPrimary: 'All time',
      comparisonSecondary:
        stats.total > 0
          ? `${(stats.totalOrders / stats.total).toFixed(1)} avg per store`
          : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
      {cards.map((card) => (
        <DashboardMetricCard key={card.label} {...card} />
      ))}
    </div>
  );
}
