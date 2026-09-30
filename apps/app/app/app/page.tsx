import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { dashboardPageSectionClass } from '@/components/app/dashboard-page-frame';
import { DashboardHomeOverview } from '@/components/app/dashboard-home/dashboard-home-overview';
import { DashboardHomeQuickActions } from '@/components/app/dashboard-home/dashboard-home-quick-actions';
import { DashboardHomeStorePanel } from '@/components/app/dashboard-home/dashboard-home-store-panel';
import { DashboardHomeTopLinks } from '@/components/app/dashboard-home/dashboard-home-top-links';
import { getDashboardHomeData } from '@/lib/dashboard/fetch-dashboard-data';
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
  const activeLinks = links.filter((link) => link.status === 'active').length;

  return (
    <section className={dashboardPageSectionClass}>
      <DashboardPageHeader
        title={`مرحباً، ${greeting}`}
        description="ملخص الروابط، الزيارات، والمتجر خلال آخر 30 يوماً."
      />

      <DashboardHomeOverview
        totalClicks={analytics.summary.totalClicks}
        clicksChange={analytics.summary.changes.clicks}
        totalLinkViews={analytics.summary.totalLinkViews}
        totalOrders={orderStats.totalOrders}
        pendingOrders={orderStats.pendingOrders}
        totalRevenue={orderStats.totalRevenue}
        activeProducts={productStats.activeProducts}
        totalProducts={productStats.totalProducts}
        lowStock={productStats.lowStock}
      />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
        <DashboardHomeTopLinks
          links={analytics.topLinks.slice(0, 3)}
          activeCount={activeLinks}
          totalCount={links.length}
        />
        <DashboardHomeStorePanel commerce={commerce} />
      </div>

      <DashboardHomeQuickActions />
    </section>
  );
}
