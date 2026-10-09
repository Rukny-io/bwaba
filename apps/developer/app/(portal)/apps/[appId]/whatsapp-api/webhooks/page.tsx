import { redirect } from 'next/navigation';

export default async function WhatsappApiWebhooksRedirectPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  redirect(`/apps/${appId}/whatsapp/webhooks`);
}
