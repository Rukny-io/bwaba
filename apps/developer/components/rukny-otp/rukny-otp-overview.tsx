'use client';

import Link from 'next/link';
import { BookOpen, CheckCircle2, ExternalLink, KeyRound, Wallet } from 'lucide-react';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { useTranslations } from '@/components/providers/translations-provider';
import { appApiKeysNew, appWallet } from '@/lib/app-routes';
import { DOCUMENTATION_BASE } from '@/lib/documentation-nav';
import { RUKNY_API_REFERENCE_URL } from '@/lib/rukny-otp-catalog';
import { cn } from '@/lib/utils';

const panelClass =
  'rounded-2xl bg-[var(--surface)] overflow-hidden p-4 sm:p-5';

const docLinkClass =
  'flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface-secondary)] px-4 py-3 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_85%,var(--foreground)_6%)]';

export function RuknyOtpOverview({ appId }: { appId: string }) {
  const translations = useTranslations() as {
    ruknyOtp: Record<string, string>;
  };
  const d = translations.ruknyOtp;

  const docsBase = `${DOCUMENTATION_BASE}/rukny-otp`;

  return (
    <div className="dashboard-section-stack pb-28 sm:pb-8">
      <DashboardPageHeader
        className="mb-5 pt-2 sm:mb-6 sm:pt-3"
        title={d.title}
        description={<p className="max-w-2xl leading-relaxed">{d.subtitle}</p>}
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <Link
              href={appApiKeysNew(appId)}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[var(--foreground)] px-3.5 text-[13px] font-medium text-[var(--background)] transition-opacity hover:opacity-90 sm:flex-none"
            >
              <KeyRound className="size-3.5" aria-hidden />
              {d.createKey}
            </Link>
            <Link
              href={appWallet(appId)}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[var(--surface-secondary)] px-3.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_85%,var(--foreground)_6%)] sm:flex-none"
            >
              <Wallet className="size-3.5" aria-hidden />
              {d.openWallet}
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
        <section
          className={cn(
            panelClass,
            'flex flex-wrap items-center justify-between gap-4',
          )}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]"
              aria-hidden
            >
              <CheckCircle2 size={20} className="text-[var(--foreground)]" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {d.readyTitle}
              </p>
              <p className="mt-0.5 text-[13px] text-[var(--muted-foreground)]">
                {d.readyDesc}
              </p>
            </div>
          </div>
          <span className="rounded-2xl bg-[var(--surface-secondary)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
            {d.readyBadge}
          </span>
        </section>

        <section className={cn(panelClass, 'flex flex-col justify-center text-start')}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {d.priceLabel}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {d.priceAmount}
          </p>
          <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
            {d.priceHint}
          </p>
        </section>
      </div>

      <section className={panelClass}>
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 size-5 shrink-0 text-[var(--muted-foreground)]" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              {d.docsTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[var(--muted-foreground)]">
              {d.docsBlurb}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href={RUKNY_API_REFERENCE_URL}
                target="_blank"
                rel="noreferrer"
                className={docLinkClass}
              >
                <span>{d.docsScalar}</span>
                <ExternalLink className="size-4 shrink-0 opacity-50" aria-hidden />
              </a>
              <Link href={`${docsBase}/reference`} className={docLinkClass}>
                <span>{d.docsReference}</span>
                <ExternalLink className="size-4 shrink-0 opacity-50" aria-hidden />
              </Link>
              <Link href={`${docsBase}/integration`} className={docLinkClass}>
                <span>{d.docsIntegration}</span>
                <ExternalLink className="size-4 shrink-0 opacity-50" aria-hidden />
              </Link>
              <Link href={`${docsBase}/rest`} className={docLinkClass}>
                <span>{d.docsRest}</span>
                <ExternalLink className="size-4 shrink-0 opacity-50" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
