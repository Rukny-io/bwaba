import { DashboardHomeClient } from '@/components/app/dashboard-home/dashboard-home-client';
import { getDashboardHomeData } from '@/lib/dashboard/fetch-dashboard-data';
import { getDashboardUser } from '@/lib/dal';
import { getDictionary } from '@/lib/i18n/server';

export default async function DashboardHomePage() {
  const [{ t }, user, data] = await Promise.all([
    getDictionary(),
    getDashboardUser(),
    getDashboardHomeData(30),
  ]);

  const greetingName =
    data.profile?.name ??
    user.name ??
    user.email?.split('@')[0] ??
    t('home.greetingFallback');

  return <DashboardHomeClient greetingName={greetingName} data={data} />;
}
