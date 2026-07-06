import { FormsHub } from '@/components/forms/forms-hub';
import { requireAppForUser } from '@/lib/dal';

export default async function FormsPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  const app = await requireAppForUser(appId);

  return <FormsHub appId={app.appId} />;
}
