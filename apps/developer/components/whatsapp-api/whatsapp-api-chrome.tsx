'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ExternalLink, KeyRound } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { WhatsappApiIslandNav } from '@/components/whatsapp-api/whatsapp-api-island-nav';
import {
  waApiBtnPrimary,
  waApiBtnSecondary,
} from '@/components/whatsapp-api/whatsapp-api-shared';
import { useTranslations } from '@/components/providers/translations-provider';
import { appApiKeysNew, appWhatsapp } from '@/lib/app-routes';
import { cn } from '@/lib/utils';

export function WhatsappApiChrome({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const d = t.whatsappApi;
  const { app } = useCurrentApp();

  return (
    <div className="dashboard-section-stack pb-28 text-start">
      <DashboardPageHeader
        className="mb-5 pt-2 sm:mb-6 sm:pt-0"
        title={d.title}
        description={<p className="max-w-2xl leading-relaxed">{d.subtitle}</p>}
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <Link
              href={appApiKeysNew(app.appId)}
              className={cn(waApiBtnPrimary, 'flex-1 sm:flex-none')}
            >
              <KeyRound className="size-3.5" />
              {d.createKey}
            </Link>
            <Link
              href={appWhatsapp(app.appId)}
              className={cn(waApiBtnSecondary, 'flex-1 sm:flex-none')}
            >
              {t.whatsapp.title}
              <ExternalLink className="size-3.5 opacity-60" />
            </Link>
          </div>
        }
      />
      <div className="space-y-5 sm:space-y-6">{children}</div>
      <WhatsappApiIslandNav />
    </div>
  );
}
