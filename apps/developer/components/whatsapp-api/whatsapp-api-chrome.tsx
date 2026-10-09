'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, KeyRound } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { WhatsappApiMobileDock } from '@/components/whatsapp-api/whatsapp-api-mobile-dock';
import { WhatsappApiSectionNav } from '@/components/whatsapp-api/whatsapp-api-section-nav';
import { useTranslations } from '@/components/providers/translations-provider';
import { appApiKeysNew, appWhatsapp } from '@/lib/app-routes';
import { cn } from '@/lib/utils';

const btnPrimary =
  'inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-full bg-[var(--foreground)] px-4 text-[13px] font-medium text-[var(--background)] transition-opacity hover:opacity-90';

const btnSecondary =
  'inline-flex h-9 min-h-9 items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]';

export function WhatsappApiChrome({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const d = t.whatsappApi;
  const { app } = useCurrentApp();

  return (
    <div className="dashboard-section-stack pb-28 text-start">
      <header className="dashboard-panel mb-5 overflow-hidden sm:mb-6">
        <div className="border-b border-[var(--separator)] p-4 sm:p-5">
          <p
            className="text-[11px] font-semibold tracking-wide text-[var(--muted-foreground)]"
            lang="en"
            dir="ltr"
          >
            {d.heroBadge}
          </p>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
            {d.title}
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
            {d.subtitle}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Link href={appApiKeysNew(app.appId)} className={cn(btnPrimary, 'w-full sm:w-auto')}>
              <KeyRound className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{d.createKey}</span>
            </Link>
            <Link
              href={appWhatsapp(app.appId)}
              className={cn(btnSecondary, 'w-full sm:w-auto')}
            >
              <span className="truncate">{t.whatsapp.title}</span>
              <ArrowUpRight className="size-3.5 shrink-0 opacity-55 rtl:-scale-x-100" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="hidden px-3 py-2.5 sm:block sm:px-4">
          <WhatsappApiSectionNav />
        </div>
      </header>
      <div className="space-y-5 sm:space-y-6">{children}</div>
      <WhatsappApiMobileDock />
    </div>
  );
}
