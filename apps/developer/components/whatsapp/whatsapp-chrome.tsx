'use client';

import type { ReactNode } from 'react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { WhatsappTabsNav } from '@/components/whatsapp/whatsapp-tabs-nav';

export function WhatsappChrome({ children }: { children: ReactNode }) {
  const w = useTranslations().whatsapp;

  return (
    <div className="dashboard-section-stack">
      <DashboardPageHeader
        className="mb-6 pt-2 sm:mb-8 sm:pt-3"
        title={w.title}
        description={w.subtitle}
      >
        <WhatsappTabsNav />
      </DashboardPageHeader>
      <div className="space-y-5 sm:space-y-6">{children}</div>
    </div>
  );
}
