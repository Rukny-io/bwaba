import { cookies } from 'next/headers';
import { PlatformSettingsPanel } from '@/components/settings/platform-settings-panel';
import { LAST_APP_COOKIE } from '@/lib/app-routes';
import { isValidAppId } from '@/lib/api/types';

export default async function DeveloperPlatformSettingsPage() {
  const cookieStore = await cookies();
  const lastAppRaw = cookieStore.get(LAST_APP_COOKIE)?.value;
  const lastAppId =
    lastAppRaw && isValidAppId(lastAppRaw) ? lastAppRaw : null;

  return <PlatformSettingsPanel lastAppId={lastAppId} />;
}
