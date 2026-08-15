import type { ReactNode } from 'react';
import { requireProductInstalled } from '@/lib/dal';
import { WhatsappApiChrome } from '@/components/whatsapp-api/whatsapp-api-chrome';

export default async function WhatsappApiProductLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  await requireProductInstalled(appId, 'whatsappApi');
  return <WhatsappApiChrome>{children}</WhatsappApiChrome>;
}
