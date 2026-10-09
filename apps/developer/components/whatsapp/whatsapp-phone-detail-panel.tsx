'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PhoneCard } from '@/components/whatsapp/whatsapp-phones-panel';
import { useWhatsappMutations } from '@/hooks/use-whatsapp';
import { useWhatsappPhone } from '@/components/whatsapp/whatsapp-phone-context';

export function WhatsappPhoneDetailPanel() {
  const { phone, appId } = useWhatsappPhone();
  const { registerMutation } = useWhatsappMutations(appId);

  const [registerId, setRegisterId] = useState<string | null>(null);
  const [pin, setPin] = useState('');

  if (!phone) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  return (
    <PhoneCard
      appId={appId}
      phone={phone}
      registerId={registerId}
      pin={pin}
      setRegisterId={setRegisterId}
      setPin={setPin}
      registerMutation={registerMutation}
    />
  );
}
