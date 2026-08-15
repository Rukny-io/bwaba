'use client';

import Link from 'next/link';
import { useCurrentApp } from '@/components/providers/app-context';
import { WhatsappApiEndpointCard } from '@/components/whatsapp-api/whatsapp-api-endpoint-card';
import { WhatsappApiCodePanel } from '@/components/whatsapp-api/whatsapp-api-code-panel';
import { getWhatsappApiSummaries } from '@/components/whatsapp-api/whatsapp-api-shared';
import { WHATSAPP_API_COPY } from '@/lib/whatsapp-api-copy';
import { SEND_MESSAGE_RECIPES } from '@/lib/whatsapp-api-code-samples';
import {
  MESSAGE_ENDPOINTS,
  type WhatsappApiEndpointId,
} from '@/lib/whatsapp-api-catalog';
import { appWhatsappApiHref } from '@/lib/whatsapp-api-routes';

export function WhatsappApiMessages() {
  const d = WHATSAPP_API_COPY;
  const summaries = getWhatsappApiSummaries();
  const { app } = useCurrentApp();

  function tryHref(endpointId: WhatsappApiEndpointId) {
    return appWhatsappApiHref(app.appId, 'try', { endpoint: endpointId });
  }

  const sendMessage = MESSAGE_ENDPOINTS.find((ep) => ep.id === 'sendMessage');
  const otherEndpoints = MESSAGE_ENDPOINTS.filter((ep) => ep.id !== 'sendMessage');

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-[var(--surface)] p-5 sm:rounded-3xl sm:p-6">
        <h2 className="text-base font-semibold">{d.templatesGuideTitle}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {d.templatesGuideDesc}
        </p>
        <ol className="mt-4 list-decimal space-y-2 ps-5 text-[13px] text-[var(--muted-foreground)]">
          <li>{d.templatesGuideStep1}</li>
          <li>{d.templatesGuideStep2}</li>
          <li>{d.templatesGuideStep3}</li>
        </ol>
        <Link
          href={appWhatsappApiHref(app.appId, 'templates')}
          className="mt-4 inline-flex text-[13px] font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
        >
          {d.navTemplates}
        </Link>
      </section>

      {sendMessage ? (
        <article className="overflow-hidden rounded-2xl bg-[var(--surface)] sm:rounded-3xl">
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
          <div className="border-t border-[var(--border)]/40 p-4 sm:p-5">
            <WhatsappApiCodePanel
              recipes={SEND_MESSAGE_RECIPES}
              copyLabel={d.copy}
            />
          </div>
        </article>
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
    </div>
  );
}
