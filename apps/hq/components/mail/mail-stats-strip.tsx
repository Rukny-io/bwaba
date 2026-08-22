import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, HardDrive, Inbox, Mail } from 'lucide-react';
import type { MailStats } from '@/lib/types/mail';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { formatNumber, formatPercent } from '@/lib/dashboard-format';
import { formatMailStorage } from '@/lib/mail-format';

export function MailStatsStrip({ stats }: { stats: MailStats | null }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[7.25rem] animate-pulse rounded-2xl bg-[var(--surface-secondary)] sm:min-h-[8.5rem]"
          />
        ))}
      </div>
    );
  }

  const storageShare =
    stats.storage.quotaBytes > 0
      ? formatPercent(
          Math.round((stats.storage.usedBytes / stats.storage.quotaBytes) * 1000) / 10,
        )
      : undefined;

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
      icon: Mail,
      label: 'Apps',
      value: formatNumber(stats.apps.total),
      comparisonPrimary: `${formatNumber(stats.apps.active)} active`,
      comparisonSecondary: `${formatNumber(stats.apps.archived)} archived`,
    },
    {
      icon: Inbox,
      label: 'Mailboxes',
      value: formatNumber(stats.mailboxes.total),
      comparisonPrimary: `${formatNumber(stats.mailboxes.active)} active`,
      comparisonSecondary: `${formatNumber(stats.mailboxes.disabled)} disabled`,
    },
    {
      icon: Mail,
      label: 'Messages (7 days)',
      value: formatNumber(stats.messages.inbound7d + stats.messages.outbound7d),
      comparisonPrimary: `${formatNumber(stats.messages.inbound7d)} inbound`,
      comparisonSecondary: `${formatNumber(stats.messages.outbound7d)} outbound`,
    },
    {
      icon: AlertTriangle,
      label: 'Failed delivery',
      value: formatNumber(stats.messages.failed24h),
      trendPositive: stats.messages.failed24h === 0,
      comparisonPrimary: 'Last 24 hours',
      comparisonSecondary: `${formatNumber(stats.messages.failed7d)} in 7 days`,
    },
    {
      icon: HardDrive,
      label: 'Storage',
      value: formatMailStorage(stats.storage.usedBytes),
      trend: storageShare,
      trendPositive: true,
      comparisonPrimary: `Quota ${formatMailStorage(stats.storage.quotaBytes)}`,
      comparisonSecondary: `${formatNumber(stats.messages.inbound30d + stats.messages.outbound30d)} messages / 30 days`,
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
