'use client';

import { CreateTemplatePage } from '@/components/whatsapp/create-template-page';
import { useWhatsappPhone } from '@/components/whatsapp/whatsapp-phone-context';
import { appWhatsappPhoneHref } from '@/lib/whatsapp-phone-routes';

export default function WhatsappPhoneCreateTemplateRoute() {
  const { appId, phoneId, accountId } = useWhatsappPhone();
  return (
    <CreateTemplatePage
      appId={appId}
      accountId={accountId}
      backHref={appWhatsappPhoneHref(appId, phoneId, 'templates')}
    />
  );
}
