'use client';

import Link from 'next/link';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import en from '@/dictionaries/en.json';
import { useCurrentApp } from '@/components/providers/app-context';
import { CodeSnippetCard } from '@/components/forms/code-snippet-card';
import { WHATSAPP_API_COPY } from '@/lib/whatsapp-api-copy';
import { WHATSAPP_API_PUBLIC_BASE } from '@/lib/whatsapp-api-catalog';
import { appApiKeysNew, appWallet } from '@/lib/app-routes';
import { appWhatsappApiHref } from '@/lib/whatsapp-api-routes';

const WHATSAPP_SCOPES = [
  'whatsapp:send',
  'whatsapp:read',
  'templates:read',
  'templates:write',
  'contacts:read',
  'contacts:write',
  'webhooks:manage',
  'media:upload',
] as const;

const FORMS_SCOPES = [
  'forms:read',
  'forms:write',
  'forms:webhooks',
] as const;

const scopeLabels = en.apiKeys.scopeLabels as Record<string, string>;

const authExample = `curl -X POST '${WHATSAPP_API_PUBLIC_BASE}/whatsapp/messages' \\
  -H "X-API-Key: rk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"to":"+9647XXXXXXXXX","type":"text","text":{"body":"Hello"}}'`;

export function WhatsappApiAuth() {
  const d = WHATSAPP_API_COPY;
  const { app } = useCurrentApp();
  const [copied, setCopied] = useState(false);

  async function copyBaseUrl() {
    await navigator.clipboard.writeText(WHATSAPP_API_PUBLIC_BASE);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function ScopeGroup({
    title,
    scopes,
  }: {
    title: string;
    scopes: readonly string[];
  }) {
    return (
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {title}
        </p>
        <ul className="mt-2 divide-y divide-[var(--border)]/30 overflow-hidden rounded-xl border border-[var(--border)]/40">
          {scopes.map((scope) => (
            <li
              key={scope}
              className="flex flex-col gap-0.5 bg-[var(--background)] px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <code className="font-mono text-[12.5px] text-[var(--foreground)]">
                {scope}
              </code>
              <span className="text-[12.5px] text-[var(--muted-foreground)]">
                {scopeLabels[scope] ?? scope}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold">{d.authTitle}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {d.authDesc}
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {d.authSecurityNote}
        </p>
      </section>

      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h3 className="text-sm font-semibold">{d.baseUrlTitle}</h3>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
          {d.baseUrlDesc}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code
            className="flex-1 rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5 font-mono text-[13px] text-[var(--foreground)]"
            dir="ltr"
          >
            {WHATSAPP_API_PUBLIC_BASE}
          </code>
          <button
            type="button"
            onClick={() => void copyBaseUrl()}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[var(--surface-secondary)] px-3 text-[12.5px] font-medium text-[var(--foreground)]"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {d.copy}
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h3 className="text-sm font-semibold">{d.authHeaderTitle}</h3>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
          {d.authHeaderDesc}
        </p>
        <code
          className="mt-3 block rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5 font-mono text-[13px] text-[var(--foreground)]"
          dir="ltr"
        >
          {d.authHeaderName}: rk_live_…
        </code>
        <p className="mt-4 text-[13px] text-[var(--muted-foreground)]">
          {d.authWalletHint}{' '}
          <Link
            href={appWallet(app.appId)}
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {d.walletLink}
          </Link>
        </p>
        <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">
          <Link
            href={appApiKeysNew(app.appId)}
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {d.createKey}
          </Link>
        </p>
        <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">
          <Link
            href={appWhatsappApiHref(app.appId, 'sdks')}
            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          >
            {d.cardSdksTitle}
          </Link>
          {' — '}
          <code className="font-mono text-[12px]">npm install @rukny/whatsapp</code>
        </p>
      </section>

      <CodeSnippetCard
        title={d.authExampleTitle}
        code={authExample}
        copyLabel={d.copy}
        language="javascript"
      />

      <section className="space-y-4 rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h3 className="text-sm font-semibold">{d.securityTitle}</h3>
        <ul className="list-disc space-y-2 ps-5 text-[13px] text-[var(--muted-foreground)]">
          <li>{d.securityBullet1}</li>
          <li>{d.securityBullet2}</li>
          <li>{d.securityBullet3}</li>
          <li>{d.securityBullet4}</li>
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h3 className="text-sm font-semibold">{d.scopesTitle}</h3>
        <ScopeGroup title={d.scopeDescWhatsapp} scopes={WHATSAPP_SCOPES} />
        <ScopeGroup title={d.scopeDescForms} scopes={FORMS_SCOPES} />
      </section>
    </div>
  );
}
