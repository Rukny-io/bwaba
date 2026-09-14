'use client';

import { EmailApiCodePanel } from './email-api-code-panel';
import { EMAIL_API_COPY } from '@/lib/email-api-copy';
import { MESSAGE_ENDPOINTS } from '@/lib/email-api-catalog';
import { SEND_EMAIL_RECIPES } from '@/lib/email-api-code-samples';

export function EmailApiMessages() {
  const d = EMAIL_API_COPY;
  const status = MESSAGE_ENDPOINTS[1];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold">{d.messagesTitle}</h2>
        <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">
          {d.messagesDesc}
        </p>
        <div className="mt-4">
          <EmailApiCodePanel recipes={SEND_EMAIL_RECIPES} />
        </div>
      </section>

      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold">Read delivery status</h2>
        <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">
          {status.summary}
        </p>
        <div className="mt-4">
          <EmailApiCodePanel endpoint={status} />
        </div>
      </section>
    </div>
  );
}
