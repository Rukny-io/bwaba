'use client';

import type { ReactNode } from 'react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { WhatsappTabsNav } from '@/components/whatsapp/whatsapp-tabs-nav';

export function WhatsappChrome({ children }: { children: ReactNode }) {
  const { app } = useCurrentApp();
  const w = useTranslations().whatsapp;

  return (
    <div className="dashboard-section-stack">
      <DashboardPageHeader
        eyebrow={
          <p dir="ltr" className="font-mono text-[11px] text-[var(--muted-foreground)]">
            {app.appId}
          </p>
        }
        title={w.title}
        description={w.subtitle}
      >
        <WhatsappTabsNav />
      </DashboardPageHeader>
      <div className="space-y-5 sm:space-y-6">{children}</div>
    </div>
  );
}
