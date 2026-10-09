'use client';

import Link from 'next/link';
import { AlertTriangle, Code2, KeyRound, MessageSquare } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { DashboardQuickAction } from '@/components/dashboard/dashboard-quick-action';
import { waApiPanel } from '@/components/whatsapp-api/whatsapp-api-shared';
import { useTranslations } from '@/components/providers/translations-provider';
import {
  appApiKeysNew,
  appWallet,
  appWhatsapp,
} from '@/lib/app-routes';
import { appWhatsappApiHref } from '@/lib/whatsapp-api-routes';
import { appWhatsappHref } from '@/lib/whatsapp-routes';
import { WhatsappApiOnboardingPanel } from '@/components/whatsapp-api/whatsapp-api-onboarding-panel';
import { WhatsappApiSetupPanel } from '@/components/whatsapp-api/whatsapp-api-setup-panel';

export function WhatsappApiOverview() {
  const t = useTranslations();
  const d = t.whatsappApi;
  const isRtl = t.common.switchLang === 'English';
  const { app } = useCurrentApp();

  const cards = [
    {
      title: d.cardAuthTitle,
      desc: d.cardAuthDesc,
      href: appWhatsappApiHref(app.appId, 'auth'),
      icon: KeyRound,
    },
    {
      title: d.cardMessagesTitle,
      desc: d.cardMessagesDesc,
      href: appWhatsappApiHref(app.appId, 'messages'),
      icon: MessageSquare,
    },
    {
      title: d.cardSdksTitle,
      desc: d.cardSdksDesc,
      href: appWhatsappApiHref(app.appId, 'sdks'),
      icon: Code2,
    },
    {
      title: d.cardErrorsTitle,
      desc: d.cardErrorsDesc,
      href: appWhatsappApiHref(app.appId, 'errors'),
      icon: AlertTriangle,
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
            href={appWhatsappApiHref(app.appId, 'messages')}
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
    <>
      <WhatsappApiSetupPanel />
      <WhatsappApiOnboardingPanel />

      <section className={waApiPanel}>
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          {d.quickstartTitle}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {d.quickstartIntro}
        </p>
        <ol className="mt-4 space-y-3">
          {steps.map((step) => (
            <li
              key={step.n}
              className="flex items-start gap-3 text-[13.5px] text-[var(--muted-foreground)]"
            >
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[12px] font-semibold text-[var(--foreground)]">
                {step.n + 1}
              </span>
              <div className="min-w-0 flex-wrap leading-relaxed">{step.content}</div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {d.integrationsTitle}
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <DashboardQuickAction
              key={card.href}
              href={card.href}
              title={card.title}
              description={card.desc}
              icon={card.icon}
              isRtl={isRtl}
              className="rounded-[1.25rem] sm:rounded-[1.25rem]"
            />
          ))}
        </div>
      </section>
    </>
  );
}
