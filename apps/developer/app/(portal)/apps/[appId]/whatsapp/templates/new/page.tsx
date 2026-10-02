'use client';

import { WhatsappTemplatesRedirect } from '@/components/whatsapp/whatsapp-templates-redirect';
import { useCurrentApp } from '@/components/providers/app-context';

export default function WhatsappCreateTemplateRoute() {
  const { app } = useCurrentApp();
  return <WhatsappTemplatesRedirect appId={app.appId} mode="new" />;
}
