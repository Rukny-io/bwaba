import { getDashboardUser } from '@/lib/dal';
import { FirstAppSetup } from '@/components/apps/first-app-setup';

export default async function AppCreationPage() {
  const user = await getDashboardUser();

  return <FirstAppSetup defaultEmail={user.email ?? ''} />;
}
