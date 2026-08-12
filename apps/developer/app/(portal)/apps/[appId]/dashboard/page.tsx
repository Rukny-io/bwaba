import { getDashboardUser, requireAppForUser } from '@/lib/dal';
import {
  AppDashboard,
  AppDashboardCreateKeyAction,
} from '@/components/dashboard/app-dashboard';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { getDictionary } from '@/lib/dictionary';

export default async function AppDashboardPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const user = await getDashboardUser();
  const app = await requireAppForUser(appId);
  const dictionary = await getDictionary();
  const t = dictionary.dashboard;
  const greeting = user.name ?? user.username ?? user.email ?? 'Developer';

  return (
    <section className="dashboard-page flex flex-col gap-5 sm:gap-6">
      <DashboardPageHeader
        className="mb-0"
        title={t.title}
        description={t.welcome
          .replace('{name}', greeting)
          .replace('{app}', app.name)}
        actions={<AppDashboardCreateKeyAction publicAppId={app.appId} />}
      />

      <AppDashboard publicAppId={app.appId} internalAppId={app.id} />
    </section>
  );
}
