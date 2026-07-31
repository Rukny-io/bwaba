import { getDashboardUser, requireAppForUser } from '@/lib/dal';
import { AppDashboard } from '@/components/dashboard/app-dashboard';
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
    <div className="space-y-6 sm:space-y-8">
      <header>
        <p
          dir="ltr"
          className="mb-1 font-mono text-[11px] text-[var(--muted-foreground)]"
        >
          {app.appId}
        </p>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          {app.name}
        </h1>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
          {t.welcome.replace('{name}', greeting)}
        </p>
      </header>

      <AppDashboard
        publicAppId={app.appId}
        internalAppId={app.id}
      />
    </div>
  );
}
