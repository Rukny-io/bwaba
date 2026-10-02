'use client';

import Link from 'next/link';
import { useCurrentApp } from '@/components/providers/app-context';
import { WhatsappApiWebhookCodePanel } from '@/components/whatsapp-api/whatsapp-api-code-panel';
import { waApiPanel } from '@/components/whatsapp-api/whatsapp-api-shared';
import { WHATSAPP_API_COPY } from '@/lib/whatsapp-api-copy';
import { WEBHOOK_EVENTS } from '@/lib/whatsapp-api-catalog';
import { appWhatsappHref } from '@/lib/whatsapp-routes';

export function WhatsappApiWebhooks() {
  const d = WHATSAPP_API_COPY;
  const { app } = useCurrentApp();

  return (
    <>
      <section className={waApiPanel}>
        <h2 className="text-base font-semibold text-[var(--foreground)]">{d.inboundTitle}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {d.inboundDesc}
        </p>
        <ol className="mt-4 list-decimal space-y-2 ps-5 text-[13px] text-[var(--muted-foreground)]">
          <li>{d.inboundStep1}</li>
          <li>{d.inboundStep2}</li>
          <li>{d.inboundStep3}</li>
        </ol>
      </section>

      <section className={waApiPanel}>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">{d.webhooksTitle}</h2>
        <p className="mt-2 text-[13px] text-[var(--muted-foreground)]">
          {d.webhooksDesc}
        </p>
        <p className="mt-3 text-[13px] text-[var(--muted-foreground)]">
          {d.webhookSignature}
        </p>
        <div className="mt-4">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {d.webhookEvents}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2" dir="ltr">
            {WEBHOOK_EVENTS.map((event) => (
              <li
                key={event}
                className="rounded-xl bg-[var(--surface-secondary)] px-2.5 py-1 font-mono text-[12px] text-[var(--foreground)]"
              >
                {event}
              </li>
            ))}
          </ul>
        </div>
        <Link
          href={appWhatsappHref(app.appId, 'webhooks')}
          className="mt-5 inline-flex text-[13px] font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
        >
          {d.manageWebhooks}
        </Link>
      </section>

      <section className={waApiPanel}>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">{d.webhookVerifyTitle}</h2>
        <div className="mt-4">
          <WhatsappApiWebhookCodePanel copyLabel={d.copy} />
        </div>
      </section>
    </>
  );
}
