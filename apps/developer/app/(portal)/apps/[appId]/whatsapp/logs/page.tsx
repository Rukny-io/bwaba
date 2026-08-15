import { redirect } from 'next/navigation';
import { appWhatsappHref } from '@/lib/whatsapp-routes';

export default async function WhatsappLogsRedirect({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  redirect(appWhatsappHref(appId, 'phones'));
}
