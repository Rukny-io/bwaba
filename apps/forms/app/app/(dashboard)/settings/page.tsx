import { SettingsView } from '@/components/settings/settings-view';
import { getDashboardUser } from '@/lib/dal';
import { getFormsDashboardMetrics } from '@/lib/forms-dashboard-data';

export default async function SettingsPage() {
  const [user, metrics] = await Promise.all([
    getDashboardUser(),
    getFormsDashboardMetrics(),
  ]);

  return (
    <section className="dashboard-page mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-5">
      <SettingsView
        metrics={metrics}
        user={{
          name: user.name,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
        }}
      />
    </section>
  );
}
