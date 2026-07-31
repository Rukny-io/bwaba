import { SettingsView } from '@/components/settings/settings-view';
import { getDashboardUser } from '@/lib/dal';
import { getFormsDashboardMetrics } from '@/lib/forms-dashboard-data';

export default async function SettingsPage() {
  const [user, metrics] = await Promise.all([
    getDashboardUser(),
    getFormsDashboardMetrics(),
  ]);

  return (
    <section className="dashboard-page dashboard-section-stack">
      <SettingsView metrics={metrics} username={user.username} />
    </section>
  );
}
