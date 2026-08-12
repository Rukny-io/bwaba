import { requireAppForUser } from '@/lib/dal';
import { ApiKeysList } from '@/components/api-keys/api-keys-list';

export default async function ApiKeysPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  await requireAppForUser(appId);

  return <ApiKeysList />;
}
