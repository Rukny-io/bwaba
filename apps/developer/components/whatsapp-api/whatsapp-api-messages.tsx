'use client';

import Link from 'next/link';
import { useCurrentApp } from '@/components/providers/app-context';
import { WhatsappApiEndpointCard } from '@/components/whatsapp-api/whatsapp-api-endpoint-card';
import { WhatsappApiCodePanel } from '@/components/whatsapp-api/whatsapp-api-code-panel';
import { useTranslations } from '@/components/providers/translations-provider';
import {
  whatsappApiSummariesFrom,
  waApiPanel,
} from '@/components/whatsapp-api/whatsapp-api-shared';
import { SEND_MESSAGE_RECIPES } from '@/lib/whatsapp-api-code-samples';
import {
  MESSAGE_ENDPOINTS,
  type WhatsappApiEndpointId,
} from '@/lib/whatsapp-api-catalog';
import { appWhatsappApiHref } from '@/lib/whatsapp-api-routes';

function appWhatsappTemplatesHref(appId: string): string {
  return `/apps/${appId}/whatsapp/templates`;
}

export function WhatsappApiMessages() {
  const d = useTranslations().whatsappApi;
  const summaries = whatsappApiSummariesFrom(d);
  const { app } = useCurrentApp();

  function tryHref(endpointId: WhatsappApiEndpointId) {
    return appWhatsappApiHref(app.appId, 'try', { endpoint: endpointId });
  }

  const sendMessage = MESSAGE_ENDPOINTS.find((ep) => ep.id === 'sendMessage');
  const otherEndpoints = MESSAGE_ENDPOINTS.filter((ep) => ep.id !== 'sendMessage');

  return (
    <>
      <section className={waApiPanel}>
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          {d.templatesGuideTitle}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {d.templatesGuideDesc}
        </p>
        <ol className="mt-4 list-decimal space-y-2 ps-5 text-[13px] text-[var(--muted-foreground)]">
          <li>{d.templatesGuideStep1}</li>
          <li>{d.templatesGuideStep2}</li>
          <li>{d.templatesGuideStep3}</li>
        </ol>
        <Link
          href={appWhatsappTemplatesHref(app.appId)}
          className="mt-4 inline-flex text-[13px] font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
        >
          {d.templatesGuideCta}
        </Link>
      </section>

      {sendMessage ? (
        <>
          <WhatsappApiEndpointCard
            endpoint={sendMessage}
            summary={summaries[sendMessage.summaryKey]}
            copyLabel={d.copy}
            requestBodyLabel={d.requestFields}
            responseLabel={d.exampleResponse}
            scopesLabel={d.scopesLabel}
            tryLabel={d.tryThis}
            tryHref={tryHref(sendMessage.id)}
            hideCode
          />
          <section className={waApiPanel}>
            <WhatsappApiCodePanel
              recipes={SEND_MESSAGE_RECIPES}
              copyLabel={d.copy}
            />
          </section>
        </>
      ) : null}

      {otherEndpoints.map((endpoint) => (
        <WhatsappApiEndpointCard
          key={endpoint.id}
          endpoint={endpoint}
          summary={summaries[endpoint.summaryKey]}
          copyLabel={d.copy}
          requestBodyLabel={d.requestFields}
          responseLabel={d.exampleResponse}
          scopesLabel={d.scopesLabel}
          tryLabel={d.tryThis}
          tryHref={tryHref(endpoint.id)}
        />
      ))}
    </>
  );
}
