import { getDashboardUser } from '@/lib/dal';
import { AccountSettingsPanel } from '@/components/settings/account-settings-panel';

export default async function DeveloperAccountSettingsPage() {
  const user = await getDashboardUser();
  return <AccountSettingsPanel user={user} />;
}
