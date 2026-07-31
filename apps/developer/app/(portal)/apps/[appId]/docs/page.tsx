import { redirect } from 'next/navigation';
import { appWhatsappApi } from '@/lib/app-routes';

export default async function LegacyDocsRedirect({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  redirect(appWhatsappApi(appId));
}
