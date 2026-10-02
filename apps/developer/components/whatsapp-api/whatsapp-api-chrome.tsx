'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ExternalLink, KeyRound } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { WhatsappApiNav } from '@/components/whatsapp-api/whatsapp-api-nav';
import {
  waApiBtnPrimary,
  waApiBtnSecondary,
} from '@/components/whatsapp-api/whatsapp-api-shared';
import { WHATSAPP_API_COPY } from '@/lib/whatsapp-api-copy';
import { appApiKeysNew, appWhatsapp } from '@/lib/app-routes';
import { cn } from '@/lib/utils';

export function WhatsappApiChrome({ children }: { children: ReactNode }) {
  const d = WHATSAPP_API_COPY;
  const { app } = useCurrentApp();

  return (
    <div className="dashboard-section-stack text-start" dir="ltr" lang="en">
      <DashboardPageHeader
        className="mb-5 pt-2 sm:mb-6 sm:pt-3"
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
              WhatsApp Business
              <ExternalLink className="size-3.5 opacity-60" />
            </Link>
          </div>
        }
      >
        <WhatsappApiNav />
      </DashboardPageHeader>
      <div className="space-y-5 sm:space-y-6">{children}</div>
    </div>
  );
}
