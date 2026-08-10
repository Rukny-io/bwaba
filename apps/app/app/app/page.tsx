import Link from 'next/link';
import {
  ArrowLeft,
  BarChart2,
  Link2,
  Package,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import { AnalyticsSalesChart } from '@/components/analytics/analytics-sales-chart';
import { DashboardInsightsPanel } from '@/components/app/dashboard-insights-panel';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { DashboardQuickAction } from '@/components/app/dashboard-quick-action';
import { DashboardSectionHeader } from '@/components/app/dashboard-section-header';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import { getDashboardHomeData } from '@/lib/dashboard/fetch-dashboard-data';
import {
  formatCurrency,
  formatNumber,
  formatTrendBadge,
} from '@/lib/dashboard-format';
import { getDashboardUser } from '@/lib/dal';

export default async function DashboardHomePage() {
  const [user, data] = await Promise.all([
    getDashboardUser(),
    getDashboardHomeData(30),
  ]);

  const greeting =
    data.profile?.name ?? user.name ?? user.email?.split('@')[0] ?? 'بك';
  const { analytics, commerce, links, insights } = data;
  const { orderStats, productStats } = commerce;
  const clicksChange = analytics.summary.changes.clicks;
  const clicksTrend = formatTrendBadge(clicksChange);
  const topLinks = analytics.topLinks.slice(0, 3);

  return (
    <section className="dashboard-page dashboard-section-stack">


      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 xl:grid-cols-4">
        <DashboardMetricCard
          icon="mouse-pointer-click"
          label="نقرات الروابط"
          value={formatNumber(analytics.summary.totalClicks)}
          numericValue={analytics.summary.totalClicks}
          animationDelay={0}
          trend={clicksTrend}
          trendNumericValue={
            clicksChange != null && clicksChange !== 0 ? clicksChange : undefined
          }
          trendPositive={(clicksChange ?? 0) >= 0}
          comparisonPrimary="آخر 30 يوم"
          comparisonSecondary="مقابل الفترة السابقة"
        />
        <DashboardMetricCard
          icon="eye"
          label="زيارات الصفحة"
          value={formatNumber(analytics.summary.totalLinkViews)}
          numericValue={analytics.summary.totalLinkViews}
          animationDelay={80}
          comparisonPrimary="إجمالي المشاهدات"
          comparisonSecondary="على جميع الروابط"
        />
        <DashboardMetricCard
          icon="shopping-bag"
          label="الطلبات"
          value={formatNumber(orderStats.totalOrders)}
          numericValue={orderStats.totalOrders}
          animationDelay={160}
          comparisonPrimary={`${formatNumber(orderStats.pendingOrders)} معلّقة`}
          comparisonSecondary={formatCurrency(orderStats.totalRevenue)}
        />
        <DashboardMetricCard
          icon="package"
          label="المنتجات النشطة"
          value={formatNumber(productStats.activeProducts)}
          numericValue={productStats.activeProducts}
          animationDelay={240}
          comparisonPrimary={`${formatNumber(productStats.totalProducts)} إجمالي`}
          comparisonSecondary={
            productStats.lowStock > 0
              ? `${formatNumber(productStats.lowStock)} مخزون منخفض`
              : 'في المتجر'
          }
        />
      </div>

      <DashboardInsightsPanel insights={insights} />

      <section className="flex flex-col gap-3 sm:gap-4">
        <DashboardSectionHeader
          title="الروابط"
          description="أداء روابط صفحتك الشخصية"
          href="/app/links"
        />
        <DashboardSurface as="article">
          {topLinks.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              لا توجد نقرات بعد.{' '}
              <Link href="/app/links" className="font-medium text-[var(--primary)] hover:underline">
                أضف روابطك
              </Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {topLinks.map((link, i) => (
                <li key={link.id}>
                  <Link
                    href="/app/links"
                    className="flex items-center gap-3 rounded-2xl bg-[var(--surface-secondary)] px-3.5 py-2.5 transition-colors hover:bg-[var(--surface-secondary)]/80"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{link.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatNumber(link.clicks)} نقرة
                      </p>
                    </div>
                    <ArrowLeft className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            {formatNumber(links.filter((l) => l.status === 'active').length)} رابط نشط من{' '}
            {formatNumber(links.length)}
          </p>
        </DashboardSurface>
      </section>

      <section className="flex flex-col gap-3 sm:gap-4">
        <DashboardSectionHeader
          title="المتجر"
          description="المبيعات، الطلبات والمخزون"
          href="/app/analytics"
          linkLabel="التحليلات الكاملة"
        />
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          <DashboardSurface as="article">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              مبيعات الأسبوع
            </h3>
            <AnalyticsSalesChart days={commerce.weeklySales} height={180} />
          </DashboardSurface>

          <DashboardSurface as="article">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              ملخص المتجر
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between rounded-2xl bg-[var(--surface-secondary)] px-3 py-2.5">
                <span className="text-[var(--muted-foreground)]">طلبات معلّقة</span>
                <span className="font-semibold tabular-nums text-[var(--warning)]" dir="ltr">
                  {formatNumber(orderStats.pendingOrders)}
                </span>
              </li>
              <li className="flex justify-between rounded-2xl bg-[var(--surface-secondary)] px-3 py-2.5">
                <span className="text-[var(--muted-foreground)]">مخزون منخفض</span>
                <span className="font-semibold tabular-nums text-[var(--warning)]" dir="ltr">
                  {formatNumber(productStats.lowStock)}
                </span>
              </li>
              <li className="flex justify-between rounded-2xl bg-[var(--surface-secondary)] px-3 py-2.5">
                <span className="text-[var(--muted-foreground)]">إجمالي الإيرادات</span>
                <span className="font-semibold tabular-nums" dir="ltr">
                  {formatCurrency(orderStats.totalRevenue)}
                </span>
              </li>
            </ul>
            {commerce.lowStockProducts.length > 0 ? (
              <div className="mt-3 rounded-2xl border border-[var(--warning)]/25 bg-[var(--warning)]/5 px-3 py-2 text-xs text-[var(--warning)]">
                {commerce.lowStockProducts[0].name} — متبقي{' '}
                {formatNumber(commerce.lowStockProducts[0].quantity)} قطعة
              </div>
            ) : null}
          </DashboardSurface>
        </div>
      </section>

      <section className="flex flex-col gap-3 sm:gap-4">
        <DashboardSectionHeader title="إجراءات سريعة" description="انتقل مباشرة للمهام الشائعة" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <DashboardQuickAction
            href="/app/links"
            icon={Link2}
            title="روابطي"
            description="عرض وإدارة جميع روابط صفحتك الشخصية."
          />
          <DashboardQuickAction
            href="/app/analytics"
            icon={BarChart2}
            title="التحليلات"
            description="تحليل ذكي للروابط والمتجر والمخزون."
          />
          <DashboardQuickAction
            href="/app/products"
            icon={Package}
            title="المنتجات"
            description="إدارة كتالوج متجرك ومخزونك."
          />
          <DashboardQuickAction
            href="/app/orders"
            icon={ShoppingBag}
            title="الطلبات"
            description="متابعة ومعالجة طلبات العملاء."
            className="sm:col-span-2 lg:col-span-1"
          />
          <DashboardQuickAction
            href="/app/links?add=1"
            icon={Plus}
            title="رابط جديد"
            description="أضف رابطاً لصفحتك في ثوانٍ."
            className="sm:col-span-2 lg:col-span-1"
          />
        </div>
      </section>
    </section>
  );
}
