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
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { DashboardQuickAction } from '@/components/app/dashboard-quick-action';
import { DashboardSection } from '@/components/app/dashboard-section';
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
  const { analytics, commerce, links } = data;
  const { orderStats, productStats } = commerce;
  const clicksChange = analytics.summary.changes.clicks;
  const clicksTrend = formatTrendBadge(clicksChange);
  const topLinks = analytics.topLinks.slice(0, 3);

  return (
    <section
      className="dashboard-page mx-auto flex w-full min-w-0 max-w-[890px] flex-col gap-4 sm:gap-6"
    >
      <header className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          مرحباً، {greeting}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">
          ملخص الروابط، الزيارات، والمتجر خلال آخر 30 يوماً.
        </p>
      </header>

      <DashboardSection title="نظرة عامة" description="أهم المؤشرات لهذا الشهر">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
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
      </DashboardSection>

      <DashboardSection
        title="الروابط"
        description="أداء روابط صفحتك الشخصية"
        action={
          <Link
            href="/app/links"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--foreground)] underline-offset-2 hover:underline sm:text-sm"
          >
            عرض الكل
            <ArrowLeft className="size-3.5" />
          </Link>
        }
      >
        {topLinks.length === 0 ? (
          <p className="rounded-xl bg-[var(--surface-secondary)] px-3.5 py-3 text-sm text-[var(--muted-foreground)]">
            لا توجد نقرات بعد.{' '}
            <Link href="/app/links" className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline">
              أضف روابطك
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {topLinks.map((link, i) => (
              <li key={link.id}>
                <Link
                  href="/app/links"
                  className="flex items-center gap-3 rounded-2xl bg-[var(--surface-secondary)] px-3.5 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_85%,var(--foreground)_4%)]"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-xs font-semibold text-[var(--foreground)]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">
                      {link.title}
                    </p>
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
        <p className="text-xs text-[var(--muted-foreground)]">
          {formatNumber(links.filter((l) => l.status === 'active').length)} رابط نشط من{' '}
          {formatNumber(links.length)}
        </p>
      </DashboardSection>

      <DashboardSection
        title="المتجر"
        description="المبيعات، الطلبات والمخزون"
        action={
          <Link
            href="/app/analytics"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--foreground)] underline-offset-2 hover:underline sm:text-sm"
          >
            التحليلات الكاملة
            <ArrowLeft className="size-3.5" />
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-[var(--surface-secondary)] p-4 sm:p-5">
            <h3 className="mb-3 text-sm font-medium text-[var(--foreground)]">
              مبيعات الأسبوع
            </h3>
            <AnalyticsSalesChart days={commerce.weeklySales} height={180} />
          </div>

          <div className="rounded-2xl bg-[var(--surface-secondary)] p-4 sm:p-5">
            <h3 className="mb-3 text-sm font-medium text-[var(--foreground)]">
              ملخص المتجر
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-3 py-2.5">
                <span className="text-[var(--muted-foreground)]">طلبات معلّقة</span>
                <span className="font-semibold tabular-nums text-[var(--foreground)]" dir="ltr">
                  {formatNumber(orderStats.pendingOrders)}
                </span>
              </li>
              <li className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-3 py-2.5">
                <span className="text-[var(--muted-foreground)]">مخزون منخفض</span>
                <span className="font-semibold tabular-nums text-[var(--foreground)]" dir="ltr">
                  {formatNumber(productStats.lowStock)}
                </span>
              </li>
              <li className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-3 py-2.5">
                <span className="text-[var(--muted-foreground)]">إجمالي الإيرادات</span>
                <span className="font-semibold tabular-nums" dir="ltr">
                  {formatCurrency(orderStats.totalRevenue)}
                </span>
              </li>
            </ul>
            {commerce.lowStockProducts.length > 0 ? (
              <div className="mt-3 rounded-xl bg-[color-mix(in_srgb,var(--warning)_12%,var(--surface-secondary))] px-3 py-2 text-xs text-[var(--foreground)]">
                {commerce.lowStockProducts[0].name} — متبقي{' '}
                {formatNumber(commerce.lowStockProducts[0].quantity)} قطعة
              </div>
            ) : null}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection title="إجراءات سريعة" description="انتقل مباشرة للمهام الشائعة">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
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
      </DashboardSection>
    </section>
  );
}
