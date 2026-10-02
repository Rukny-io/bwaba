'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { usePhoneNumbers } from '@/hooks/use-whatsapp';
import { appWhatsappHref } from '@/lib/whatsapp-routes';
import {
  appWhatsappPhoneCreateTemplateHref,
  appWhatsappPhoneHref,
} from '@/lib/whatsapp-phone-routes';

/**
 * Legacy top-level /whatsapp/templates(+ /new) → phone workspace.
 * Prefers an active/connected phone, otherwise the first linked number.
 */
export function WhatsappTemplatesRedirect({
  appId,
  mode = 'list',
}: {
  appId: string;
  mode?: 'list' | 'new';
}) {
  const router = useRouter();
  const { data: phones, isLoading, isError } = usePhoneNumbers(appId);

  useEffect(() => {
    if (isLoading) return;

    if (isError || !phones?.length) {
      router.replace(appWhatsappHref(appId, 'phones'));
      return;
    }

    const preferred =
      phones.find((p) => p.status === 'ACTIVE' || p.status === 'CONNECTED') ??
      phones[0];

    const target =
      mode === 'new'
        ? appWhatsappPhoneCreateTemplateHref(appId, preferred.phoneId)
        : appWhatsappPhoneHref(appId, preferred.phoneId, 'templates');

    router.replace(target);
  }, [appId, isError, isLoading, mode, phones, router]);

  return (
    <div className="flex justify-center py-16">
      <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
    </div>
  );
}
