'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Code2 } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { WhatsappMobileDock } from '@/components/whatsapp/whatsapp-mobile-dock';
import { WhatsappSectionNav } from '@/components/whatsapp/whatsapp-section-nav';
import { useTranslations } from '@/components/providers/translations-provider';
import { appWhatsappApi } from '@/lib/app-routes';
import { cn } from '@/lib/utils';

const btnSecondary =
  'inline-flex h-9 min-h-9 w-full items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] sm:w-auto';

export function WhatsappChrome({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const w = t.whatsapp;
  const { app } = useCurrentApp();

  return (
    <div className="dashboard-section-stack pb-28 text-start">
      <header className="dashboard-panel mb-5 overflow-hidden sm:mb-6">
        <div className="border-b border-[var(--separator)] p-4 sm:p-5">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)] sm:text-2xl">
            {w.title}
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
            {w.subtitle}
          </p>
          <div className="mt-4 sm:flex sm:items-center">
            <Link
              href={appWhatsappApi(app.appId)}
              className={cn(btnSecondary)}
            >
              <Code2 className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{t.whatsappApi.title}</span>
              <ArrowUpRight
                className="size-3.5 shrink-0 opacity-55 rtl:-scale-x-100"
                aria-hidden
              />
            </Link>
          </div>
        </div>
        <div className="hidden px-3 py-2.5 sm:block sm:px-4">
          <WhatsappSectionNav />
        </div>
      </header>
      <div className="space-y-5 sm:space-y-6">{children}</div>
      <WhatsappMobileDock />
    </div>
  );
}
