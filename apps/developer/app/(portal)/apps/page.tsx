import { fetchUserApps } from '@/lib/dal';
import { AppsListPage } from '@/components/apps/apps-list-page';
import { AppsFlowShell } from '@/components/apps/apps-flow-shell';

export default async function AppsPage() {
  const apps = await fetchUserApps();

  return (
    <AppsFlowShell size="lg">
      <AppsListPage apps={apps} />
    </AppsFlowShell>
  );
}
