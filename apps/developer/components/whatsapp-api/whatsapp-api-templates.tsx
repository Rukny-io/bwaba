'use client';

import { useCurrentApp } from '@/components/providers/app-context';
import { WhatsappApiEndpointCard } from '@/components/whatsapp-api/whatsapp-api-endpoint-card';
import { getWhatsappApiSummaries } from '@/components/whatsapp-api/whatsapp-api-shared';
import { WHATSAPP_API_COPY } from '@/lib/whatsapp-api-copy';
import {
  TEMPLATE_ENDPOINTS,
  type WhatsappApiEndpointId,
} from '@/lib/whatsapp-api-catalog';
import { appWhatsappApiHref } from '@/lib/whatsapp-api-routes';

export function WhatsappApiTemplates() {
  const d = WHATSAPP_API_COPY;
  const summaries = getWhatsappApiSummaries();
  const { app } = useCurrentApp();

  function tryHref(endpointId: WhatsappApiEndpointId) {
    return appWhatsappApiHref(app.appId, 'try', { endpoint: endpointId });
  }

  return (
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
          tryHref={tryHref(endpoint.id)}
        />
      ))}
    </div>
  );
}
