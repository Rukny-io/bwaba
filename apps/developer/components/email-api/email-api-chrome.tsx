'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { appApiKeysNew, appEmailApi } from '@/lib/app-routes';
import { EmailApiNav } from './email-api-nav';

export function EmailApiChrome({ children }: { children: ReactNode }) {
  const { app } = useCurrentApp();

  return (
    <div className="dashboard-section-stack text-start" dir="ltr" lang="en">
      <DashboardPageHeader
        className="mb-5 pt-2 sm:mb-6 sm:pt-3"
        title="Email API"
        description="Transactional email with verified senders, scoped API keys, and delivery safety controls."
        actions={
          <Link
            href={appApiKeysNew(app.appId)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[var(--foreground)] px-3.5 text-[13px] font-medium text-[var(--background)] transition-opacity hover:opacity-90"
          >
            <KeyRound className="size-3.5" />
            Create API key
          </Link>
        }
      >
        <EmailApiNav appId={app.appId} baseHref={appEmailApi(app.appId)} />
      </DashboardPageHeader>
      {children}
    </div>
  );
}
