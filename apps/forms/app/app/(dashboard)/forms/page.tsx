import { FormsListView } from '@/components/forms/forms-list/forms-list-view';
import { getFormsDashboardMetrics } from '@/lib/forms-dashboard-data';

export default async function FormsListPage() {
  const metrics = await getFormsDashboardMetrics();

  return (
    <section className="dashboard-page dashboard-section-stack dashboard-brand">
      <FormsListView metrics={metrics} />
    </section>
  );
}
