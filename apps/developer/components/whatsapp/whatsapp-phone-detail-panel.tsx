'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PhoneCard } from '@/components/whatsapp/whatsapp-phones-panel';
import { useWhatsappMutations } from '@/hooks/use-whatsapp';
import { useWhatsappPhone } from '@/components/whatsapp/whatsapp-phone-context';

export function WhatsappPhoneDetailPanel() {
  const { phone, appId } = useWhatsappPhone();
  const { registerMutation, profileMutation, testMessageMutation } =
    useWhatsappMutations(appId);

  const [registerId, setRegisterId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [testId, setTestId] = useState<string | null>(null);
  const [testTo, setTestTo] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [about, setAbout] = useState('');
  const [email, setEmail] = useState('');

  if (!phone) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  return (
    <PhoneCard
      phone={phone}
      registerId={registerId}
      pin={pin}
      setRegisterId={setRegisterId}
      setPin={setPin}
      testId={testId}
      testTo={testTo}
      setTestId={setTestId}
      setTestTo={setTestTo}
      profileId={profileId}
      about={about}
      email={email}
      setProfileId={setProfileId}
      setAbout={setAbout}
      setEmail={setEmail}
      registerMutation={registerMutation}
      testMessageMutation={testMessageMutation}
      profileMutation={profileMutation}
    />
  );
}
