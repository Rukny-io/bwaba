'use client';

import Link from 'next/link';
import { EmailApiCodePanel } from './email-api-code-panel';
import { EMAIL_API_COPY } from '@/lib/email-api-copy';
import {
  SEND_EMAIL_RECIPES,
  SDK_INSTALL,
  SDK_QUICKSTART,
} from '@/lib/email-api-code-samples';
import { DOCUMENTATION_BASE } from '@/lib/documentation-nav';

export function EmailApiSdks() {
  const d = EMAIL_API_COPY;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold">{d.sdksTitle}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {d.sdksDesc}
        </p>
        <div className="mt-4 rounded-2xl bg-[var(--surface-secondary)] p-4" dir="ltr">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            npm
          </p>
          <code className="mt-2 block font-mono text-[13px] text-[var(--foreground)]">
            {SDK_INSTALL}
          </code>
        </div>
      </section>

      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h3 className="text-sm font-semibold">{d.sdksQuickstartTitle}</h3>
        <pre
          className="mt-4 overflow-x-auto rounded-2xl bg-[var(--surface-secondary)] p-4 text-[12px] leading-relaxed text-[var(--foreground)]"
          dir="ltr"
        >
          <code>{SDK_QUICKSTART}</code>
        </pre>
      </section>

      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h3 className="text-sm font-semibold">{d.sdksMethodsTitle}</h3>
        <ul className="mt-3 space-y-2 text-[13px] text-[var(--muted-foreground)]" dir="ltr">
          <li>
            <code className="text-[var(--foreground)]">messages.send()</code>
          </li>
          <li>
            <code className="text-[var(--foreground)]">messages.getStatus()</code>
          </li>
        </ul>
        <p className="mt-3 text-[13px] text-[var(--muted-foreground)]">
          Verify domains and authorize senders in the portal Domains UI before
          sending.
        </p>
      </section>

      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h3 className="text-sm font-semibold">Examples</h3>
        <div className="mt-4">
          <EmailApiCodePanel recipes={SEND_EMAIL_RECIPES} />
        </div>
        <Link
          href={`${DOCUMENTATION_BASE}/email-api/sdk`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex text-[13px] font-medium underline underline-offset-2"
        >
          {d.sdksDocsHint}
        </Link>
      </section>
    </div>
  );
}
