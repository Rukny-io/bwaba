'use client';

import type { ReactNode } from 'react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { WhatsappIslandNav } from '@/components/whatsapp/whatsapp-island-nav';

export function WhatsappChrome({ children }: { children: ReactNode }) {
  const w = useTranslations().whatsapp;

  return (
    <div className="dashboard-section-stack pb-28">
      <DashboardPageHeader
        className="mb-6 pt-2 sm:mb-8 sm:pt-0"
        title={w.title}
        description={w.subtitle}
      />
      <div className="space-y-5 sm:space-y-6">{children}</div>
      <WhatsappIslandNav />
    </div>
  );
}
