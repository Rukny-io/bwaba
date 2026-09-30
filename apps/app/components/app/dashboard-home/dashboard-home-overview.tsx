import {
  Eye,
  MousePointerClick,
  Package,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import { dashboardPagePanelClass } from '@/components/app/dashboard-page-frame';
import {
  formatCurrency,
  formatNumber,
  formatTrendBadge,
} from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

interface DashboardHomeOverviewProps {
  totalClicks: number;
  clicksChange: number;
  totalLinkViews: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  activeProducts: number;
  totalProducts: number;
  lowStock: number;
}

interface OverviewMetric {
  key: string;
  label: string;
  icon: LucideIcon;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  meta: string[];
}

function OverviewMetricCell({
  label,
  icon: Icon,
  value,
  trend,
  trendPositive = true,
  meta,
}: Omit<OverviewMetric, 'key'>) {
  return (
    <div className="flex min-h-[7.75rem] flex-col bg-[var(--surface)] p-5 sm:min-h-[8rem] sm:px-6 sm:py-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium leading-snug text-[var(--muted-foreground)]">
          {label}
        </p>
        <Icon
          className="size-[1.125rem] shrink-0 text-[color-mix(in_srgb,var(--muted-foreground)_55%,transparent)]"
          strokeWidth={1.75}
          aria-hidden
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p
          className="text-[1.875rem] font-semibold leading-none tracking-tight text-[var(--foreground)] tabular-nums"
          dir="ltr"
          lang="en"
        >
          {value}
        </p>
        {trend ? (
          <span
            className={cn(
              'rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-none tabular-nums',
              trendPositive
                ? 'bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]'
                : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
            )}
            dir="ltr"
            lang="en"
          >
            {trend}
          </span>
        ) : null}
      </div>

      {meta.length > 0 ? (
        <div className="mt-auto space-y-1 pt-3">
          {meta.map((line) => (
            <p
              key={line}
              className="text-[12px] leading-relaxed text-[var(--muted-foreground)]"
              dir={line.includes('د.ع') ? 'ltr' : undefined}
              lang={line.includes('د.ع') ? 'en' : undefined}
            >
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DashboardHomeOverview({
  totalClicks,
  clicksChange,
  totalLinkViews,
  totalOrders,
  pendingOrders,
  totalRevenue,
  activeProducts,
  totalProducts,
  lowStock,
}: DashboardHomeOverviewProps) {
  const clicksTrend = formatTrendBadge(clicksChange);

  const metrics: OverviewMetric[] = [
    {
      key: 'clicks',
      label: 'نقرات الروابط',
      icon: MousePointerClick,
      value: formatNumber(totalClicks),
      trend: clicksTrend,
      trendPositive: clicksChange >= 0,
      meta: ['مقابل الفترة السابقة'],
    },
    {
      key: 'views',
      label: 'زيارات الصفحة',
      icon: Eye,
      value: formatNumber(totalLinkViews),
      meta: ['على جميع الروابط'],
    },
    {
      key: 'orders',
      label: 'الطلبات',
      icon: ShoppingBag,
      value: formatNumber(totalOrders),
      meta: [
        `إيرادات · ${formatCurrency(totalRevenue)}`,
        pendingOrders > 0
          ? `${formatNumber(pendingOrders)} معلّقة`
          : 'لا طلبات معلّقة',
      ],
    },
    {
      key: 'products',
      label: 'المنتجات النشطة',
      icon: Package,
      value: formatNumber(activeProducts),
      meta: [
        lowStock > 0
          ? `${formatNumber(lowStock)} مخزون منخفض`
          : `${formatNumber(totalProducts)} إجمالي في المتجر`,
      ],
    },
  ];

  return (
    <div className={cn(dashboardPagePanelClass, 'gap-5')}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-[var(--foreground)]">نظرة عامة</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          أهم المؤشرات لهذا الشهر
        </p>
      </div>

      <div className="overflow-hidden rounded-xl ring-1 ring-[var(--border)]">
        <div className="grid grid-cols-1 gap-px bg-[var(--border)] sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <OverviewMetricCell key={metric.key} {...metric} />
          ))}
        </div>
      </div>
    </div>
  );
}
