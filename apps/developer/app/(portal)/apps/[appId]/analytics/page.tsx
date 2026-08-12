import { requireAppForUser } from '@/lib/dal';
import { AppAnalyticsView } from '@/components/analytics/app-analytics-view';

export default async function AppAnalyticsPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const app = await requireAppForUser(appId);

  return (
    <AppAnalyticsView publicAppId={app.appId} appName={app.name} />
  );
}
