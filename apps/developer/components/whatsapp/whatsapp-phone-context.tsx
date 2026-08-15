'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { WhatsappPhoneSummary } from '@/lib/api/types';
import { usePhoneNumber } from '@/hooks/use-whatsapp';

interface WhatsappPhoneContextValue {
  appId: string;
  phoneId: string;
  phone: WhatsappPhoneSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  accountId: string | undefined;
}

const WhatsappPhoneContext = createContext<WhatsappPhoneContextValue | null>(null);

export function WhatsappPhoneProvider({
  appId,
  phoneId,
  children,
}: {
  appId: string;
  phoneId: string;
  children: ReactNode;
}) {
  const { data: phone, isLoading, isError } = usePhoneNumber(appId, phoneId);

  return (
    <WhatsappPhoneContext.Provider
      value={{
        appId,
        phoneId,
        phone,
        isLoading,
        isError,
        accountId: phone?.account?.id,
      }}
    >
      {children}
    </WhatsappPhoneContext.Provider>
  );
}

export function useWhatsappPhone(): WhatsappPhoneContextValue {
  const ctx = useContext(WhatsappPhoneContext);
  if (!ctx) {
    throw new Error('useWhatsappPhone must be used within WhatsappPhoneProvider');
  }
  return ctx;
}
