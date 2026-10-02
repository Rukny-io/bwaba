'use client';

import { WhatsappTemplatesPanel } from '@/components/whatsapp/whatsapp-templates-panel';
import { useWhatsappPhone } from '@/components/whatsapp/whatsapp-phone-context';

export default function WhatsappPhoneTemplatesPage() {
  const { appId, phoneId, accountId } = useWhatsappPhone();
  return (
    <WhatsappTemplatesPanel
      appId={appId}
      phoneId={phoneId}
      accountId={accountId}
    />
  );
}
