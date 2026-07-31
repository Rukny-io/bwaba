'use client';

import type { ReactNode } from 'react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { WhatsappTabsNav } from '@/components/whatsapp/whatsapp-tabs-nav';

export function WhatsappChrome({ children }: { children: ReactNode }) {
  const { app } = useCurrentApp();
  const w = useTranslations().whatsapp;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-4">
        <div>
          <p
            dir="ltr"
            className="mb-1 font-mono text-[11px] text-[var(--muted-foreground)]"
          >
            {app.appId}
          </p>
          <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
            {w.title}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--muted-foreground)] sm:text-sm">
            {w.subtitle}
          </p>
        </div>
        <WhatsappTabsNav />
      </header>
      <div className="space-y-5 sm:space-y-6">{children}</div>
    </div>
  );
}
