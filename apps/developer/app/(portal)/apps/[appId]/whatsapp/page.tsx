'use client';

import { useCurrentApp } from '@/components/providers/app-context';
import { WhatsappOverviewPanel } from '@/components/whatsapp/whatsapp-overview-panel';

export default function WhatsappPage() {
  const { app } = useCurrentApp();
  return <WhatsappOverviewPanel appId={app.appId} />;
}
