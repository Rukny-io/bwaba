'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ExternalLink, KeyRound } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { WhatsappApiNav } from '@/components/whatsapp-api/whatsapp-api-nav';
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
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--foreground)] px-3.5 text-[13px] font-medium text-[var(--background)] transition-opacity hover:opacity-90 sm:flex-none"
            >
              <KeyRound className="size-3.5" />
              {d.createKey}
            </Link>
            <Link
              href={appWhatsapp(app.appId)}
              className={cn(
                'inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--border)]',
                'bg-[var(--surface)] px-3.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] sm:flex-none',
              )}
            >
              WhatsApp Business
              <ExternalLink className="size-3.5 opacity-60" />
            </Link>
          </div>
        }
      >
        <WhatsappApiNav />
      </DashboardPageHeader>
      {children}
    </div>
  );
}
