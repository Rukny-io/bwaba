'use client';

import { EmailApiDomainManager } from './email-api-domain-manager';
import { EMAIL_API_COPY } from '@/lib/email-api-copy';

export function EmailApiDomains() {
  const d = EMAIL_API_COPY;

  return (
    <div className="space-y-4">
      <EmailApiDomainManager />
      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold">{d.domainsDeliverabilityTitle}</h2>
        <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">
          {d.domainsDeliverabilityDesc}
        </p>
      </section>
    </div>
  );
}
