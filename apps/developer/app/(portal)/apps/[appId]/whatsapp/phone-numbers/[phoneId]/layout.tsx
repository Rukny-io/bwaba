'use client';

import { use } from 'react';
import { WhatsappPhoneChrome } from '@/components/whatsapp/whatsapp-phone-chrome';
import { WhatsappPhoneProvider } from '@/components/whatsapp/whatsapp-phone-context';

export default function WhatsappPhoneLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ appId: string; phoneId: string }>;
}) {
  const { appId, phoneId } = use(params);

  return (
    <WhatsappPhoneProvider appId={appId} phoneId={phoneId}>
      <WhatsappPhoneChrome>{children}</WhatsappPhoneChrome>
    </WhatsappPhoneProvider>
  );
}
