import { redirect } from 'next/navigation';

export default async function AppComplianceRedirectPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  redirect(`/apps/${appId}/settings`);
}
