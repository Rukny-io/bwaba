'use client';

import { useCurrentApp } from '@/components/providers/app-context';
import { WhatsappTemplatesPanel } from '@/components/whatsapp/whatsapp-templates-panel';

export default function WhatsappTemplatesPage() {
  const { app } = useCurrentApp();
  return <WhatsappTemplatesPanel appId={app.appId} />;
}
