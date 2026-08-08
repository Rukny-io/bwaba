import { AnalyticsOverviewView } from '@/components/analytics/analytics-overview-view';

export default function AnalyticsOverviewPage() {
  return (
    <section className="dashboard-page flex flex-col gap-6 sm:gap-8">
      <AnalyticsOverviewView />
    </section>
  );
}
