'use client';

import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { dashboardPageSectionClass } from '@/components/app/dashboard-page-frame';
import { DashboardHomeOverview } from '@/components/app/dashboard-home/dashboard-home-overview';
import { DashboardHomeQuickActions } from '@/components/app/dashboard-home/dashboard-home-quick-actions';
import { DashboardHomeStorePanel } from '@/components/app/dashboard-home/dashboard-home-store-panel';
import { DashboardHomeTopLinks } from '@/components/app/dashboard-home/dashboard-home-top-links';
import { useTranslations } from '@/lib/i18n';
import type { DashboardHomeData } from '@/lib/dashboard/types';

export function DashboardHomeClient({
  greetingName,
  data,
}: {
  greetingName: string;
  data: DashboardHomeData;
}) {
  const { t } = useTranslations();
  const { analytics, commerce, links } = data;
  const { orderStats, productStats } = commerce;
  const activeLinks = links.filter((link) => link.status === 'active').length;

  return (
    <section className={dashboardPageSectionClass}>
      <DashboardPageHeader
        title={t('home.greeting', { name: greetingName })}
        description={t('home.description')}
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
