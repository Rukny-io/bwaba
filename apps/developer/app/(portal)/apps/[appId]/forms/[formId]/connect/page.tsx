import { FormConnectPanel } from '@/components/forms/form-connect-panel';
import { requireAppForUser } from '@/lib/dal';

export default async function FormConnectPage({
  params,
}: {
  params: Promise<{ appId: string; formId: string }>;
}) {
  const { appId, formId } = await params;
  const app = await requireAppForUser(appId);

  return <FormConnectPanel appId={app.appId} formId={formId} />;
}
