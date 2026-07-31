import type { LucideIcon } from 'lucide-react';
import { FileCheck, FilePenLine, FileText, Inbox, Trash2 } from 'lucide-react';
import type { FormsStats } from '@/lib/types/forms';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { formatNumber, formatPercent } from '@/lib/dashboard-format';

function publishedShare(stats: FormsStats): string | undefined {
  if (stats.total <= 0) return undefined;
  return formatPercent(Math.round((stats.published / stats.total) * 100));
}

function avgSubmissions(stats: FormsStats): string {
  if (stats.total <= 0) return 'No forms yet';
  const avg = stats.totalSubmissions / stats.total;
  return `${avg.toFixed(1)} avg per form`;
}

export function FormsStatsStrip({ stats }: { stats: FormsStats | null }) {
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
      icon: FileText,
      label: 'Total forms',
      value: formatNumber(stats.total),
      comparisonPrimary: `${formatNumber(stats.published)} published`,
      comparisonSecondary: `${formatNumber(stats.draft)} drafts`,
    },
    {
      icon: FileCheck,
      label: 'Published',
      value: formatNumber(stats.published),
      trend: publishedShare(stats),
      trendPositive: true,
      comparisonPrimary: 'Live on the platform',
      comparisonSecondary: `of ${formatNumber(stats.total)} total`,
    },
    {
      icon: FilePenLine,
      label: 'Drafts',
      value: formatNumber(stats.draft),
      comparisonPrimary: 'Awaiting publish',
      comparisonSecondary:
        stats.draft === 1 ? '1 unpublished form' : `${formatNumber(stats.draft)} in progress`,
    },
    {
      icon: Inbox,
      label: 'Submissions',
      value: formatNumber(stats.totalSubmissions),
      comparisonPrimary: 'All time',
      comparisonSecondary: avgSubmissions(stats),
    },
    {
      icon: Trash2,
      label: 'In trash',
      value: formatNumber(stats.deleted),
      comparisonPrimary: 'Soft-deleted',
      comparisonSecondary: '30-day retention',
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
