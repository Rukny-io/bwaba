import { AnalyticsOverviewView } from '@/components/analytics/analytics-overview-view';

export default function AnalyticsOverviewPage() {
  return (
    <section className="dashboard-page flex flex-col gap-5 sm:gap-6 dashboard-brand">
      <AnalyticsOverviewView />
    </section>
  );
}
