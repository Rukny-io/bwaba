import { Card, Skeleton } from '@heroui/react';
import {
  Banknote,
  CheckCircle2,
  Clock3,
  PackageCheck,
  ShoppingBag,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { formatCurrency, formatNumber } from '@/lib/dashboard-format';
import type { OrderStats } from '@/lib/orders/types';

interface OrdersStatsStripProps {
  stats: OrderStats;
  loading?: boolean;
}

interface OrderMetricCard {
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string;
  comparisonPrimary: string;
  comparisonSecondary?: string;
}

function buildMetrics(stats: OrderStats): OrderMetricCard[] {
  return [
    {
      icon: ShoppingBag,
      iconClassName: 'text-[var(--foreground)]',
      label: 'إجمالي الطلبات',
      value: formatNumber(stats.totalOrders),
      comparisonPrimary: 'جميع الطلبات الواردة',
    },
    {
      icon: Clock3,
      iconClassName: 'text-[var(--warning)]',
      label: 'معلّقة',
      value: formatNumber(stats.pendingOrders),
      comparisonPrimary: 'بانتظار المعالجة',
    },
    {
      icon: PackageCheck,
      iconClassName: 'text-[#2563eb]',
      label: 'قيد التجهيز',
      value: formatNumber(stats.processingOrders),
      comparisonPrimary: 'قيد التجهيز والشحن',
    },
    {
      icon: CheckCircle2,
      iconClassName: 'text-[var(--success)]',
      label: 'مكتملة',
      value: formatNumber(stats.completedOrders),
      comparisonPrimary: 'تم التسليم بنجاح',
    },
    {
      icon: XCircle,
      iconClassName: 'text-[var(--danger)]',
      label: 'ملغية',
      value: formatNumber(stats.cancelledOrders),
      comparisonPrimary: 'طلبات ملغاة',
    },
    {
      icon: Banknote,
      iconClassName: 'text-[#059669]',
      label: 'إجمالي الإيرادات',
      value: formatCurrency(stats.totalRevenue),
      comparisonPrimary: `${formatNumber(stats.completedOrders)} طلب مكتمل`,
      comparisonSecondary: 'إجمالي المبيعات',
    },
  ];
}

export function OrdersStatsStrip({ stats, loading }: OrdersStatsStripProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="min-h-[7.25rem] gap-3 p-3 shadow-none sm:min-h-[8.5rem] sm:p-5">
            <Skeleton className="size-8 rounded-lg sm:size-10" />
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </Card>
        ))}
      </div>
    );
  }

  const metrics = buildMetrics(stats);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
      {metrics.map((metric) => (
        <DashboardMetricCard key={metric.label} {...metric} className="shadow-none" />
      ))}
    </div>
  );
}
