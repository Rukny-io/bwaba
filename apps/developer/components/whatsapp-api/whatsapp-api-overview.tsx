'use client';

import Link from 'next/link';
import { useCurrentApp } from '@/components/providers/app-context';
import { WHATSAPP_API_COPY } from '@/lib/whatsapp-api-copy';
import {
  appApiKeysNew,
  appWallet,
  appWhatsapp,
} from '@/lib/app-routes';
import { appWhatsappApiHref } from '@/lib/whatsapp-api-routes';
import { appWhatsappHref } from '@/lib/whatsapp-routes';

export function WhatsappApiOverview() {
  const d = WHATSAPP_API_COPY;
  const { app } = useCurrentApp();

  const cards = [
    {
      title: d.cardAuthTitle,
      desc: d.cardAuthDesc,
      href: appWhatsappApiHref(app.appId, 'auth'),
    },
    {
      title: d.cardMessagesTitle,
      desc: d.cardMessagesDesc,
      href: appWhatsappApiHref(app.appId, 'messages'),
    },
    {
      title: d.cardWebhooksTitle,
      desc: d.cardWebhooksDesc,
      href: appWhatsappApiHref(app.appId, 'webhooks'),
    },
    {
      title: d.cardTryTitle,
      desc: d.cardTryDesc,
      href: appWhatsappApiHref(app.appId, 'try'),
    },
    {
      title: d.cardSdksTitle,
      desc: d.cardSdksDesc,
      href: appWhatsappApiHref(app.appId, 'sdks'),
    },
    {
      title: d.cardErrorsTitle,
      desc: d.cardErrorsDesc,
      href: appWhatsappApiHref(app.appId, 'errors'),
    },
  ] as const;

  const steps = [
  {
    n: 0,
    content: (
      <>
        <span>{d.quickstartStep0}</span>{' '}
        <code className="rounded-md bg-[var(--surface-secondary)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--foreground)]">
          {app.appId}
        </code>
      </>
    ),
  },
  {
    n: 1,
    content: (
      <>
        <Link
          href={appWhatsapp(app.appId)}
          className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
        >
          {d.quickstartStep1Link}
        </Link>
        <span> — {d.quickstartStep1}</span>
      </>
    ),
  },
  {
    n: 2,
    content: (
      <>
        <Link
          href={appApiKeysNew(app.appId)}
          className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
        >
          {d.quickstartStep2Link}
        </Link>
        <span> — {d.quickstartStep2}</span>
      </>
    ),
  },
  {
    n: 3,
    content: (
      <>
        <Link
          href={appWallet(app.appId)}
          className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
        >
          {d.quickstartStep3Link}
        </Link>
        <span> — {d.quickstartStep3}</span>
      </>
    ),
  },
  {
    n: 4,
    content: (
      <>
        <Link
          href={appWhatsappApiHref(app.appId, 'try', { endpoint: 'sendMessage' })}
          className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
        >
          {d.quickstartStep4Link}
        </Link>
        <span> — {d.quickstartStep4}</span>
      </>
    ),
  },
  {
    n: 5,
    content: (
      <>
        <Link
          href={appWhatsappHref(app.appId, 'webhooks')}
          className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
        >
          {d.quickstartStep5Link}
        </Link>
        <span> — {d.quickstartStep5}</span>
      </>
    ),
  },
] as const;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold">{d.quickstartTitle}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {d.quickstartIntro}
        </p>
        <ol className="mt-4 space-y-3 text-[13.5px] text-[var(--muted-foreground)]">
          {steps.map((step) => (
            <li key={step.n} className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[12px] font-semibold text-[var(--foreground)]">
                {step.n + 1}
              </span>
              {step.content}
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {d.integrationsTitle}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl bg-[var(--surface)] p-4 text-start transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_88%,var(--foreground)_4%)] sm:p-5"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {card.title}
              </p>
              <p className="mt-1 text-[12.5px] text-[var(--muted-foreground)]">
                {card.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
