'use client';

import Link from 'next/link';
import { useCurrentApp } from '@/components/providers/app-context';
import { EMAIL_API_COPY } from '@/lib/email-api-copy';
import { EMAIL_SCOPES } from '@/lib/email-api-catalog';
import { appApiKeysNew } from '@/lib/app-routes';
import { appEmailApiHref } from '@/lib/email-api-routes';

export function EmailApiAuth() {
  const d = EMAIL_API_COPY;
  const { app } = useCurrentApp();

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold">{d.authTitle}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {d.authDesc}
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--surface-secondary)] p-3 text-[12px] leading-relaxed text-[var(--foreground)]">
          <code>{`X-API-Key: rk_live_…
Idempotency-Key: unique_key_for_this_send`}</code>
        </pre>
        <Link
          href={appApiKeysNew(app.appId)}
          className="mt-4 inline-flex text-[13px] font-medium underline underline-offset-2"
        >
          {d.createKey}
        </Link>
      </section>

      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold">{d.authScopesTitle}</h2>
        <ul className="mt-3 space-y-2 text-[13px] text-[var(--muted-foreground)]" dir="ltr">
          {EMAIL_SCOPES.map((item) => (
            <li key={item.scope}>
              <code className="text-[var(--foreground)]">{item.scope}</code>
              {' — '}
              {item.description}
            </li>
          ))}
        </ul>
        <Link
          href={appEmailApiHref(app.appId, 'errors')}
          className="mt-4 inline-flex text-[13px] font-medium underline underline-offset-2"
        >
          Error reference
        </Link>
      </section>

      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold">{d.authSecurityTitle}</h2>
        <ul className="mt-3 list-disc space-y-2 ps-5 text-[13px] text-[var(--muted-foreground)]">
          <li>{d.authSecurity1}</li>
          <li>{d.authSecurity2}</li>
          <li>{d.authSecurity3}</li>
          <li>{d.authSecurity4}</li>
        </ul>
      </section>
    </div>
  );
}
