import {
  Package,
  PackageCheck,
  PackageX,
  EyeOff,
} from 'lucide-react';
import { getStoreInfo, getStoreAnalytics, getStoreProducts } from '@/lib/api/store';
import { StatsCard, StatsCardSkeleton } from '@/components/(app)/dashboard/stats-card';
import { OverviewStats } from '@/components/(app)/dashboard/overview-stats';
import { TopProducts, TopProductsSkeleton } from '@/components/(app)/store/top-products';
import { formatIQD } from '@/lib/currency';

export const metadata = {
  title: 'متجري | ركني',
};

function pctChangeNum(current = 0, previous = 0): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function trendDir(current = 0, previous = 0): 'up' | 'down' {
  return current >= previous ? 'up' : 'down';
}

export default async function StorePage() {
  const [storeInfo, analytics, productsRes] = await Promise.all([
    getStoreInfo(),
    getStoreAnalytics(),
    getStoreProducts({ limit: 50 }),
  ]);

  const s = analytics.summary;

  /* ── Stats Row ── */
  const statsRow = [
    {
      title: 'المنتجات النشطة',
      value: analytics.activeProducts.toLocaleString('en'),
      change: `${analytics.totalProducts} إجمالاً`,
      trend: 'up' as const,
      highlight: true,
      icon: PackageCheck,
      subtitle: `من أصل ${analytics.totalProducts.toLocaleString('en')}`,
    },
    {
      title: 'نفدت الكمية',
      value: analytics.outOfStock.toLocaleString('en'),
      change: analytics.outOfStock > 0 ? `${analytics.outOfStock} منتج` : '+0',
      trend: analytics.outOfStock > 0 ? ('down' as const) : ('up' as const),
      icon: PackageX,
      subtitle: 'تحتاج تجديد',
    },
    {
      title: 'المنتجات المخفية',
      value: analytics.hiddenProducts.toLocaleString('en'),
      change: analytics.hiddenProducts > 0 ? `${analytics.hiddenProducts}` : '+0',
      trend: 'down' as const,
      icon: EyeOff,
      subtitle: 'غير منشورة',
    },
    {
      title: 'متوسط الطلب',
      value: formatIQD(analytics.avgOrderValue),
      change: pctChangeNum(s.currentRevenue, s.previousRevenue) >= 0
        ? `+${pctChangeNum(s.currentRevenue, s.previousRevenue)}%`
        : `${pctChangeNum(s.currentRevenue, s.previousRevenue)}%`,
      trend: trendDir(s.currentRevenue, s.previousRevenue),
      icon: Package,
      subtitle: 'متوسط قيمة الطلب',
    },
  ];

  /* ── Overview Tabs ── */
  const weekData = analytics.currentWeek.map((d, i) => ({
    x: d.day ?? i + 1,
    value: d.revenue ?? 0,
  }));

  const visitorsData = analytics.currentWeek.map((d, i) => ({
    x: d.day ?? i + 1,
    value: d.visitors ?? 0,
  }));

  const ordersData = analytics.currentWeek.map((d, i) => ({
    x: d.day ?? i + 1,
    value: d.orders ?? 0,
  }));

  const overviewTabs = [
    {
      id: 'revenue',
      label: 'الإيرادات',
      value: formatIQD(s.currentRevenue || analytics.totalRevenue),
      change: pctChangeNum(s.currentRevenue, s.previousRevenue),
      changeType: 'percent' as const,
      suffix: 'إجمالي الإيرادات',
      highlightLabel: s.currentRevenue > s.previousRevenue ? 'أعلى مستوى' : undefined,
      data: weekData,
    },
    {
      id: 'orders',
      label: 'الطلبات',
      value: analytics.totalOrders,
      change: pctChangeNum(s.currentOrders, s.previousOrders),
      changeType: 'percent' as const,
      suffix: 'طلب',
      data: ordersData,
    },
    {
      id: 'visitors',
      label: 'الزوار',
      value: analytics.weeklyVisitors,
      change: pctChangeNum(s.currentVisitors, s.previousVisitors),
      changeType: 'percent' as const,
      suffix: 'زيارة هذا الأسبوع',
      data: visitorsData,
    },
    {
      id: 'conversion',
      label: 'التحويل',
      value: `${analytics.conversionRate}%`,
      change: 0,
      changeType: 'percent' as const,
      suffix: 'معدل التحويل',
      data: weekData.map((d) => ({ ...d, value: analytics.conversionRate })),
    },
  ];

  /* ── Products ── */
  const products = productsRes.products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    comparePrice: p.comparePrice,
    stock: p.stock,
    status: p.status,
    image: p.image,
    category: p.category,
    totalSales: p.totalSales ?? 0,
  }));

  const storeUrl = storeInfo
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://rukny.io'}/${storeInfo.slug}`
    : '';

  return (
    <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 mt-2 sm:mt-6">


      {/* ── بطاقات الإحصائيات السريعة ── */}
      <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
        {statsRow.map((s) => (
          <StatsCard key={s.title} {...s} />
        ))}
      </div>

      {/* ── تحليلات + أفضل المنتجات ── */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1fr_320px]">
        <OverviewStats tabs={overviewTabs} />
        <TopProducts
          products={analytics.topProducts}
        />
      </div>
    </div>
  );
} 
