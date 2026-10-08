import { AnalyticsOverviewView } from '@/components/analytics/analytics-overview-view';

export default function AnalyticsPage() {
  return (
    <div className="dashboard-page flex w-full min-w-0 flex-col pt-5 sm:pt-6">
      <AnalyticsOverviewView />
    </div>
  );
}
