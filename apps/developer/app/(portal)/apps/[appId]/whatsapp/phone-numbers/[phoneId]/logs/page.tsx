'use client';

import { WhatsappLogsPanel } from '@/components/whatsapp/whatsapp-logs-panel';
import { useWhatsappPhone } from '@/components/whatsapp/whatsapp-phone-context';

export default function WhatsappPhoneLogsPage() {
  const { phoneId } = useWhatsappPhone();
  return <WhatsappLogsPanel phoneId={phoneId} />;
}
