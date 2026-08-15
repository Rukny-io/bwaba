'use client';

import { WhatsappPhoneErrorsPanel } from '@/components/whatsapp/whatsapp-phone-errors-panel';
import { useWhatsappPhone } from '@/components/whatsapp/whatsapp-phone-context';

export default function WhatsappPhoneErrorsPage() {
  const { phoneId } = useWhatsappPhone();
  return <WhatsappPhoneErrorsPanel phoneId={phoneId} />;
}
