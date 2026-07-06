'use client';

import { useCurrentApp } from '@/components/providers/app-context';
import { WhatsappPhonesPanel } from '@/components/whatsapp/whatsapp-phones-panel';

export default function WhatsappPhonesPage() {
  const { app } = useCurrentApp();
  return <WhatsappPhonesPanel appId={app.appId} />;
}
