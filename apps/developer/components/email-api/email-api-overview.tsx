'use client';

import Link from 'next/link';
import { useCurrentApp } from '@/components/providers/app-context';
import { EmailApiSubscriptionCard } from './email-api-subscription-card';
import { EMAIL_API_COPY } from '@/lib/email-api-copy';
import { appApiKeysNew } from '@/lib/app-routes';
import { appEmailApiHref } from '@/lib/email-api-routes';
import { DOCUMENTATION_BASE } from '@/lib/documentation-nav';

export function EmailApiOverview() {
  const d = EMAIL_API_COPY;
  const { app } = useCurrentApp();
  const baseCards = [
    {
      href: appEmailApiHref(app.appId, 'messages'),
      title: d.overviewMessagesCard,
      desc: d.overviewMessagesDesc,
    },
    {
      href: appEmailApiHref(app.appId, 'domains'),
      title: d.overviewDomainsCard,
      desc: d.overviewDomainsDesc,
    },
    {
      href: appEmailApiHref(app.appId, 'sdks'),
      title: d.overviewSdksCard,
      desc: d.overviewSdksDesc,
    },
    {
      href: appEmailApiHref(app.appId, 'try'),
      title: d.overviewTryCard,
      desc: d.overviewTryDesc,
    },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold">{d.overviewTitle}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {d.overviewDesc}
        </p>
        <ol className="mt-4 list-decimal space-y-2 ps-5 text-[13px] text-[var(--muted-foreground)]">
          <li>{d.overviewStep1}</li>
          <li>
            <Link
              href={appApiKeysNew(app.appId)}
              className="font-medium underline underline-offset-2"
            >
              {d.overviewStep2}
            </Link>
          </li>
          <li>{d.overviewStep3}</li>
          <li>{d.overviewStep4}</li>
        </ol>
        <Link
          href={`${DOCUMENTATION_BASE}/email-api`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex text-[13px] font-medium underline underline-offset-2"
        >
          {d.overviewPublicDocs}
        </Link>
      </section>

      <EmailApiSubscriptionCard />

      <div className="grid gap-3 sm:grid-cols-2">
        {baseCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl bg-[var(--surface)] p-5 transition-colors hover:bg-[var(--surface-secondary)]"
          >
            <p className="text-sm font-semibold">{card.title}</p>
            <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
              {card.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
