import type { ReactNode } from 'react';
import { requireProductInstalled } from '@/lib/dal';
import { WhatsappChrome } from '@/components/whatsapp/whatsapp-chrome';

export default async function WhatsappProductLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;
  await requireProductInstalled(appId, 'whatsapp');
  return <WhatsappChrome>{children}</WhatsappChrome>;
}
