'use client';

import { WhatsappApiTryIt } from '@/components/whatsapp-api/whatsapp-api-try-it';
import { getWhatsappApiSummaries } from '@/components/whatsapp-api/whatsapp-api-shared';
import { WHATSAPP_API_COPY } from '@/lib/whatsapp-api-copy';
import { SEND_MESSAGE_RECIPES } from '@/lib/whatsapp-api-code-samples';
import type { WhatsappApiEndpointId } from '@/lib/whatsapp-api-catalog';

const TRY_ENDPOINTS = new Set<WhatsappApiEndpointId>([
  'sendMessage',
  'getMessage',
  'listTemplates',
  'getTemplate',
  'createTemplate',
  'deleteTemplate',
  'syncTemplates',
]);

function parseEndpointId(value: string | undefined): WhatsappApiEndpointId {
  if (value && TRY_ENDPOINTS.has(value as WhatsappApiEndpointId)) {
    return value as WhatsappApiEndpointId;
  }
  return 'sendMessage';
}

export function WhatsappApiTrySection({
  endpoint,
  recipe,
}: {
  endpoint?: string;
  recipe?: string;
}) {
  const d = WHATSAPP_API_COPY;
  const summaries = getWhatsappApiSummaries();
  const endpointId = parseEndpointId(endpoint);
  const recipeBody = SEND_MESSAGE_RECIPES.find((item) => item.id === recipe)?.body;

  return (
    <WhatsappApiTryIt
      key={`${endpointId}-${recipe ?? 'default'}`}
      initialEndpointId={endpointId}
      initialBody={recipeBody}
      summaries={summaries}
      labels={{
        title: d.tryTitle,
        description: d.tryDesc,
        apiKey: d.tryApiKey,
        apiKeyPlaceholder: d.tryApiKeyPlaceholder,
        apiKeyHint: d.tryApiKeyHint,
        apiKeyEmpty: d.tryApiKeyEmpty,
        apiKeyCreateLink: d.tryApiKeyCreateLink,
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
        invalidJson: d.tryInvalidJson,
      }}
    />
  );
}
