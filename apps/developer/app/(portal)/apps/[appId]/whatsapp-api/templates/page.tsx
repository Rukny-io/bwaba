import { redirect } from 'next/navigation';

export default async function WhatsappApiTemplatesRedirectPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  redirect(`/apps/${appId}/whatsapp/templates`);
}
