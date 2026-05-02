import {
  Eye,
  ShoppingCart,
  Package,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import {
  getStoreStats,
  getWeeklySales,
  getRecentOrders,
  getChartData,
} from '@/lib/api/dashboard';
import { StatsCard, StatsCardSkeleton } from '@/components/(app)/dashboard/stats-card';
import { OverviewStats } from '@/components/(app)/dashboard/overview-stats';
import { ActivityBarChart } from '@/components/(app)/dashboard/activity-bar-chart';
import { RecentOrders } from '@/components/(app)/dashboard/recent-orders';
import { WelcomeBanner } from '@/components/(app)/dashboard/welcome-banner';

export const metadata = {
  title: 'لوحة التحكم | ركني',
};

/* ── Currency ── */
function formatIQD(amount: number): string {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)} IQD`;
}

/* ── Helpers ── */
function pctChange(current = 0, previous = 0): string {
  if (previous === 0) return current > 0 ? '+100%' : '+0%';
  const pct = Math.round(((current - previous) / previous) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

function pctChangeNum(current = 0, previous = 0): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function trendDir(current = 0, previous = 0): 'up' | 'down' {
  return current >= previous ? 'up' : 'down';
}

export default async function AppPage() {
  const [stats, weeklySales, recentOrders, chart] = await Promise.all([
    getStoreStats(),
    getWeeklySales(),
    getRecentOrders(6),
    getChartData(),
  ]);

  /* ── Stats Row 1 ── */
  const statsRow1 = [
    {
      title: 'المنتجات النشطة',
      value: stats.activeProducts.toLocaleString('en'),
      change: `${stats.activeProducts}`,
      trend: 'up' as const,
      highlight: true,
      icon: Package,
      subtitle: `من أصل ${stats.totalProducts.toLocaleString('en')}`,
    },
    {
      title: 'عدد الطلبات',
      value: stats.totalOrders.toLocaleString('en'),
      change: pctChange(chart.summary.currentOrders, chart.summary.previousOrders),
      trend: trendDir(chart.summary.currentOrders, chart.summary.previousOrders),
      icon: ShoppingCart,
      subtitle: 'مقارنةً بالأسبوع السابق',
    },
    {
      title: 'إجمالي الإيرادات',
      value: formatIQD(stats.totalRevenue),
      change: pctChange(chart.summary.currentTotal, chart.summary.previousTotal),
      trend: trendDir(chart.summary.currentTotal, chart.summary.previousTotal),
      icon: DollarSign,
      subtitle: 'إجمالي المبيعات',
    },
    {
      title: 'نفدت الكمية',
      value: stats.outOfStock.toLocaleString('en'),
      change: stats.outOfStock > 0 ? `${stats.outOfStock}` : '+0',
      trend: stats.outOfStock > 0 ? ('down' as const) : ('up' as const),
      icon: CheckCircle2,
      subtitle: 'منتج ينتظر التجديد',
    },
  ];

  /* ── Overview Stats Tabs ── */
  const weeklyData = (chart.current.length ? chart.current : weeklySales.days).map((d, i) => ({
    x: (d as any).day ?? i + 1,
    value: ('sales' in d ? (d as any).sales : (d as any).revenue) ?? 0,
  }));

  const overviewTabs = [
    {
      id: 'revenue',
      label: 'الإيرادات',
      value: formatIQD(chart.summary.currentTotal || stats.totalRevenue),
      change: pctChangeNum(chart.summary.currentTotal, chart.summary.previousTotal),
      changeType: 'percent' as const,
      suffix: 'إجمالي المبيعات',
      highlightLabel: chart.summary.currentTotal > chart.summary.previousTotal ? 'أعلى مستوى' : undefined,
      data: weeklyData,
    },
    {
      id: 'orders',
      label: 'الطلبات',
      value: stats.totalOrders,
      change: pctChangeNum(chart.summary.currentOrders, chart.summary.previousOrders),
      changeType: 'percent' as const,
      suffix: 'طلب',
      data: weeklyData.map((d) => ({ ...d, value: Math.round(d.value / Math.max(chart.summary.currentTotal / Math.max(chart.summary.currentOrders, 1), 1)) })),
    },
    {
      id: 'products',
      label: 'المنتجات',
      value: stats.activeProducts,
      change: stats.activeProducts,
      changeType: 'number' as const,
      suffix: 'منتج نشط',
      data: weeklyData.map((d) => ({ ...d, value: stats.activeProducts })),
    },
    {
      id: 'outofstock',
      label: 'نفدت',
      value: stats.outOfStock,
      change: 0,
      changeType: 'number' as const,
      suffix: 'منتج',
      data: weeklyData.map((d) => ({ ...d, value: stats.outOfStock })),
    },
  ];

  /* ── Chart bar data ── */
  const chartBarData = (chart.current.length ? chart.current : weeklySales.days).map((d) => ({
    day: d.day,
    value: 'sales' in d ? (d as any).sales : (d as any).revenue ?? 0,
    isHighlighted: ('sales' in d ? (d as any).sales : (d as any).revenue ?? 0) > 0,
  }));

  /* ── Orders mapping ── */
  const mappedOrders = recentOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber || o.id.slice(0, 8),
    customerName: o.shippingAddress?.name || 'عميل',
    total: Number(o.total) || 0,
    status: o.status,
    createdAt: o.createdAt,
    items: o.items?.map((i) => ({ productName: i.productName ?? '' })) ?? [],
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 mt-2 sm:mt-6">

      {/* ── بانر الترحيب ── */}
      <WelcomeBanner
        hasProducts={stats.totalProducts > 0}
        hasOrders={stats.totalOrders > 0}
      />

      {/* ── الصف الأول: بطاقات الإحصائيات ── */}
      <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
        {statsRow1.map((s) => (
          <StatsCard key={s.title} {...s} />
        ))}
      </div>

      {/* ── نظرة عامة + نشاط الأسبوع ── */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <OverviewStats
          tabs={overviewTabs}
        />
        <ActivityBarChart
          title="مبيعات الأسبوع"
          totalValue={formatIQD(chart.summary.currentTotal || stats.totalRevenue)}
          data={chartBarData}
          badge={{
            value: pctChange(chart.summary.currentTotal, chart.summary.previousTotal),
            trend: trendDir(chart.summary.currentTotal, chart.summary.previousTotal),
          }}
        />
      </div>

      {/* ── آخر الطلبات ── */}
      <RecentOrders orders={mappedOrders} formatCurrency={formatIQD} />
    </div>
  );
}


