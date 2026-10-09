'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Copy, Link2, Server } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useTranslations } from '@/components/providers/translations-provider';
import { waApiPanel } from '@/components/whatsapp-api/whatsapp-api-shared';
import { WHATSAPP_API_PUBLIC_BASE } from '@/lib/whatsapp-api-catalog';
import { appWhatsapp } from '@/lib/app-routes';
import { appWhatsappHref } from '@/lib/whatsapp-routes';
import { cn } from '@/lib/utils';

function CopyRow({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-[10px] border border-[rgba(0,0,0,0.06)] bg-[var(--surface)] px-3 py-2.5 dark:border-zinc-700">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-[var(--foreground)]">{label}</span>
        <button
          type="button"
          onClick={() => copy()}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
          aria-label="Copy"
        >
          {copied ? (
            <Check className="size-3.5 text-[var(--success)]" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
        </button>
      </div>
      <code
        className={cn(
          'break-all text-[12px] text-[var(--muted-foreground)]',
          mono && 'font-mono',
        )}
        dir="ltr"
      >
        {value}
      </code>
    </div>
  );
}

export function WhatsappApiOnboardingPanel() {
  const t = useTranslations();
  const d = t.whatsappApi;
  const isRtl = t.common.switchLang === 'English';
  const { app } = useCurrentApp();

  const envExample = `RUKNY_API_BASE_URL=${WHATSAPP_API_PUBLIC_BASE}
RUKNY_API_KEY=rk_live_your_secret_key
RUKNY_APP_ID=${app.appId}`;

  return (
    <div className="space-y-5">
      <section className={waApiPanel}>
        <h2 className="text-base font-semibold text-[var(--foreground)]">{d.pathsTitle}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {d.pathsIntro}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1rem] border border-[var(--border)]/60 bg-[var(--surface)] p-4">
            <div className="flex items-start gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)]">
                <Link2 className="size-4 text-[var(--foreground)]" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold text-[var(--foreground)]">
                  {d.pathBusinessTitle}
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--muted-foreground)]">
                  {d.pathBusinessDesc}
                </p>
                <ul className="mt-2 list-inside list-disc text-[12px] text-[var(--muted-foreground)]">
                  <li>{d.pathBusinessStepConnect}</li>
                  <li>
                    <Link
                      href={appWhatsappHref(app.appId, 'phones')}
                      className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                    >
                      {d.pathBusinessStepPhones}
                    </Link>
                  </li>
                  <li>{d.pathBusinessStepWebhooks}</li>
                </ul>
                <Link
                  href={appWhatsapp(app.appId)}
                  className="mt-3 inline-flex text-[12.5px] font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                >
                  {d.pathBusinessCta} {isRtl ? '←' : '→'}
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-[1rem] border border-[var(--border)] bg-[color-mix(in_srgb,var(--foreground)_4%,var(--surface))] p-4">
            <div className="flex items-start gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)]">
                <Server className="size-4 text-[var(--foreground)]" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold text-[var(--foreground)]">
                  {d.pathApiTitle}
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--muted-foreground)]">
                  {d.pathApiDesc}
                </p>
                <p className="mt-2 text-[12px] text-[var(--muted-foreground)]">
                  {d.pathApiHint}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={waApiPanel}>
        <h2 className="text-base font-semibold text-[var(--foreground)]">{d.envTitle}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {d.envIntro}
        </p>
        <div className="mt-4 space-y-2">
          <CopyRow label={d.envVarApiBase} value={WHATSAPP_API_PUBLIC_BASE} />
          <CopyRow label={d.envVarApiKey} value="rk_live_…" mono={false} />
          <CopyRow label={d.envVarAppId} value={app.appId} />
        </div>
        <pre
          className="mt-3 overflow-x-auto rounded-xl bg-[var(--surface-secondary)] p-3 font-mono text-[11.5px] leading-relaxed text-[var(--foreground)]"
          dir="ltr"
        >
          {envExample}
        </pre>
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
          {d.envNote}
        </p>
      </section>
    </div>
  );
}
