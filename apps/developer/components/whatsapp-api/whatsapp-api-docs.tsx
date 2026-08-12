'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { KeyRound, ExternalLink } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { CodeSnippetCard } from '@/components/forms/code-snippet-card';
import { WhatsappApiEndpointCard } from '@/components/whatsapp-api/whatsapp-api-endpoint-card';
import { WhatsappApiTryIt } from '@/components/whatsapp-api/whatsapp-api-try-it';
import {
  COMMON_ERRORS,
  MESSAGE_ENDPOINTS,
  TEMPLATE_ENDPOINTS,
  WEBHOOK_EVENTS,
  WHATSAPP_API_PUBLIC_BASE,
  WHATSAPP_API_SECTIONS,
  type WhatsappApiEndpointId,
  type WhatsappApiSectionId,
} from '@/lib/whatsapp-api-catalog';
import { WHATSAPP_API_COPY } from '@/lib/whatsapp-api-copy';
import {
  appApiKeysNew,
  appWhatsapp,
} from '@/lib/app-routes';
import { appWhatsappHref } from '@/lib/whatsapp-routes';
import { cn } from '@/lib/utils';

function readSectionFromHash(): WhatsappApiSectionId {
  if (typeof window === 'undefined') return 'overview';
  const raw = window.location.hash.replace(/^#/, '');
  const hit = WHATSAPP_API_SECTIONS.find((s) => s.id === raw);
  return hit?.id ?? 'overview';
}

export function WhatsappApiDocs() {
  const d = WHATSAPP_API_COPY;
  const { app } = useCurrentApp();
  const [section, setSection] = useState<WhatsappApiSectionId>('overview');
  const [tryEndpointId, setTryEndpointId] =
    useState<WhatsappApiEndpointId>('sendMessage');

  useEffect(() => {
    setSection(readSectionFromHash());
    const onHash = () => setSection(readSectionFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function go(id: WhatsappApiSectionId) {
    setSection(id);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${id}`);
    }
  }

  function openTry(endpointId: WhatsappApiEndpointId) {
    setTryEndpointId(endpointId);
    go('try');
  }

  const summaries: Record<
    | 'epSendMessage'
    | 'epGetMessage'
    | 'epListTemplates'
    | 'epGetTemplate'
    | 'epCreateTemplate'
    | 'epDeleteTemplate'
    | 'epSyncTemplates',
    string
  > = useMemo(
    () => ({
      epSendMessage: d.epSendMessage,
      epGetMessage: d.epGetMessage,
      epListTemplates: d.epListTemplates,
      epGetTemplate: d.epGetTemplate,
      epCreateTemplate: d.epCreateTemplate,
      epDeleteTemplate: d.epDeleteTemplate,
      epSyncTemplates: d.epSyncTemplates,
    }),
    [d],
  );

  const webhookVerify = `const crypto = require('crypto');

function verifySignature(rawBody, signatureHeader, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(expected),
  );
}`;

  const errorCopy: Record<string, string> = {
    errorUnauthorized: d.errorUnauthorized,
    errorForbidden: d.errorForbidden,
    errorNoWallet: d.errorNoWallet,
    errorNoWaba: d.errorNoWaba,
    errorTemplate: d.errorTemplate,
    errorPhone: d.errorPhone,
  };

  return (
    <div className="dashboard-section-stack text-start" dir="ltr" lang="en">
      <DashboardPageHeader
        eyebrow={
          <p
            dir="ltr"
            className="font-mono text-[11px] text-[var(--muted-foreground)]"
          >
            {WHATSAPP_API_PUBLIC_BASE}
          </p>
        }
        title={d.title}
        description={d.subtitle}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href={appApiKeysNew(app.appId)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--foreground)] px-3.5 text-[13px] font-medium text-[var(--background)]"
            >
              <KeyRound className="size-3.5" />
              {d.createKey}
            </Link>
            <Link
              href={appWhatsapp(app.appId)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--surface-secondary)] px-3.5 text-[13px] font-medium text-[var(--foreground)]"
            >
              WhatsApp Business
              <ExternalLink className="size-3.5 opacity-60" />
            </Link>
          </div>
        }
      >
        <nav
          className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={d.title}
        >
          {WHATSAPP_API_SECTIONS.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={cn(
                  'h-9 shrink-0 rounded-xl px-3.5 text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                )}
              >
                {d[item.labelKey]}
              </button>
            );
          })}
        </nav>
      </DashboardPageHeader>

      {section === 'overview' ? (
        <div className="space-y-4">
          <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
            <h2 className="text-base font-semibold">{d.quickstartTitle}</h2>
            <ol className="mt-4 space-y-3 text-[13.5px] text-[var(--muted-foreground)]">
              <li className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[12px] font-semibold text-[var(--foreground)]">
                  1
                </span>
                <Link
                  href={appWhatsapp(app.appId)}
                  className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                >
                  {d.quickstartStep1Link}
                </Link>
                <span>— {d.quickstartStep1}</span>
              </li>
              <li className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[12px] font-semibold text-[var(--foreground)]">
                  2
                </span>
                <Link
                  href={appApiKeysNew(app.appId)}
                  className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                >
                  {d.createKey}
                </Link>
                <span>— {d.quickstartStep2}</span>
              </li>
              <li className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[12px] font-semibold text-[var(--foreground)]">
                  3
                </span>
                <button
                  type="button"
                  onClick={() => openTry('sendMessage')}
                  className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                >
                  {d.navTry}
                </button>
                <span>— {d.quickstartStep3}</span>
              </li>
            </ol>
          </section>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                title: d.cardMessagesTitle,
                desc: d.cardMessagesDesc,
                action: () => go('messages'),
              },
              {
                title: d.navTemplates,
                desc: d.cardMessagesDesc,
                action: () => go('templates'),
              },
              {
                title: d.cardTryTitle,
                desc: d.cardTryDesc,
                action: () => go('try'),
              },
            ].map((card) => (
              <button
                key={card.title}
                type="button"
                onClick={card.action}
                className="rounded-2xl bg-[var(--surface)] p-4 text-start transition-colors hover:bg-[color-mix(in_srgb,var(--surface)_88%,var(--foreground)_4%)] sm:p-5"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {card.title}
                </p>
                <p className="mt-1 text-[12.5px] text-[var(--muted-foreground)]">
                  {card.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {section === 'messages' ? (
        <div className="space-y-4">
          {MESSAGE_ENDPOINTS.map((endpoint) => (
            <WhatsappApiEndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              summary={summaries[endpoint.summaryKey]}
              copyLabel={d.copy}
              requestBodyLabel={d.requestFields}
              responseLabel={d.exampleResponse}
              scopesLabel={d.scopesLabel}
              tryLabel={d.tryThis}
              onTry={() => openTry(endpoint.id)}
            />
          ))}
        </div>
      ) : null}

      {section === 'templates' ? (
        <div className="space-y-4">
          {TEMPLATE_ENDPOINTS.map((endpoint) => (
            <WhatsappApiEndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              summary={summaries[endpoint.summaryKey]}
              copyLabel={d.copy}
              requestBodyLabel={d.requestFields}
              responseLabel={d.exampleResponse}
              scopesLabel={d.scopesLabel}
              tryLabel={d.tryThis}
              onTry={() => openTry(endpoint.id)}
            />
          ))}
        </div>
      ) : null}

      {section === 'webhooks' ? (
        <div className="space-y-4">
          <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl">
            <h2 className="text-sm font-semibold">{d.webhooksTitle}</h2>
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
                    className="rounded-lg bg-[var(--surface-secondary)] px-2.5 py-1 font-mono text-[12px] text-[var(--foreground)]"
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
          <CodeSnippetCard
            title={d.webhookVerifyTitle}
            code={webhookVerify}
            copyLabel={d.copy}
            language="javascript"
          />
        </div>
      ) : null}

      {section === 'errors' ? (
        <section className="overflow-hidden rounded-2xl bg-[var(--surface)] sm:rounded-3xl">
          <div className="border-b border-[var(--border)]/40 px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold">{d.errorsTitle}</h2>
            <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
              {d.errorsDesc}
            </p>
          </div>
          <ul className="divide-y divide-[var(--border)]/30">
            {COMMON_ERRORS.map((item) => (
              <li
                key={item.code + item.key}
                className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-start sm:gap-4 sm:px-5"
              >
                <code
                  className="w-14 shrink-0 font-mono text-[13px] font-semibold text-[var(--foreground)]"
                  dir="ltr"
                >
                  {item.code}
                </code>
                <p className="text-[13px] text-[var(--muted-foreground)]">
                  {errorCopy[item.key]}
                </p>
              </li>
            ))}
          </ul>
          <p className="border-t border-[var(--border)]/40 px-4 py-3 text-[12.5px] text-[var(--muted-foreground)] sm:px-5">
            {d.mediaComingSoon}
          </p>
        </section>
      ) : null}

      {section === 'try' ? (
        <WhatsappApiTryIt
          key={tryEndpointId}
          initialEndpointId={tryEndpointId}
          summaries={summaries}
          labels={{
            title: d.tryTitle,
            description: d.tryDesc,
            apiKey: d.tryApiKey,
            apiKeyPlaceholder: d.tryApiKeyPlaceholder,
            apiKeyHint: d.tryApiKeyHint,
            endpoint: d.tryEndpoint,
            pathParam: d.tryPathParam,
            pathParamHint: d.tryPathParamHint,
            body: d.tryBody,
            recipient: d.tryRecipient,
            recipientPlaceholder: d.tryRecipientPlaceholder,
            recipientHint: d.tryRecipientHint,
            recipientRequired: d.tryRecipientRequired,
            send: d.trySend,
            sending: d.trySending,
            response: d.tryResponse,
            clearKey: d.tryClearKey,
            invalidJson: d.tryInvalidJson,
          }}
        />
      ) : null}
    </div>
  );
}
