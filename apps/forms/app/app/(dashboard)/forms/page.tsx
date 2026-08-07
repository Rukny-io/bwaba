import { FormsListView } from '@/components/forms/forms-list/forms-list-view';
import { getFormsDashboardMetrics } from '@/lib/forms-dashboard-data';

export default async function FormsListPage() {
  const metrics = await getFormsDashboardMetrics();

  return (
    <section className="dashboard-page flex min-w-0 max-w-full flex-col gap-3.5 sm:gap-6 dashboard-brand">
      <FormsListView metrics={metrics} />
    </section>
  );
}
