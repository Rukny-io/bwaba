/** Public WhatsApp REST catalog shown in the developer portal docs. */

export const WHATSAPP_API_PUBLIC_BASE =
  (typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')) ||
  'https://api.rukny.io/api/v1';

/** Same-origin path used by Try it (rewritten to the API backend). */
export const WHATSAPP_API_TRY_BASE = '/api/v1';

export type WhatsappApiSectionId =
  | 'overview'
  | 'auth'
  | 'messages'
  | 'templates'
  | 'webhooks'
  | 'errors'
  | 'try'
  | 'sdks';

export type HttpMethod = 'GET' | 'POST' | 'DELETE';

export type WhatsappApiEndpointId =
  | 'sendMessage'
  | 'getMessage'
  | 'listTemplates'
  | 'getTemplate'
  | 'createTemplate'
  | 'deleteTemplate'
  | 'syncTemplates';

export interface WhatsappApiField {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

export type WhatsappApiSummaryKey =
  | 'epSendMessage'
  | 'epGetMessage'
  | 'epListTemplates'
  | 'epGetTemplate'
  | 'epCreateTemplate'
  | 'epDeleteTemplate'
  | 'epSyncTemplates';

export interface WhatsappApiEndpoint {
  id: WhatsappApiEndpointId;
  method: HttpMethod;
  path: string;
  scopes: string[];
  summaryKey: WhatsappApiSummaryKey;
  fields?: WhatsappApiField[];
  exampleBody?: string;
  exampleResponse?: string;
  tryPath?: string;
  tryMethod?: HttpMethod;
  tryNeedsBody?: boolean;
}

export const WHATSAPP_API_SECTIONS: {
  id: WhatsappApiSectionId;
  slug: string;
  labelKey:
    | 'navOverview'
    | 'navAuth'
    | 'navMessages'
    | 'navTemplates'
    | 'navWebhooks'
    | 'navErrors'
    | 'navTry'
    | 'navSdks';
}[] = [
  { id: 'overview', slug: '', labelKey: 'navOverview' },
  { id: 'auth', slug: 'auth', labelKey: 'navAuth' },
  { id: 'messages', slug: 'messages', labelKey: 'navMessages' },
  { id: 'templates', slug: 'templates', labelKey: 'navTemplates' },
  { id: 'webhooks', slug: 'webhooks', labelKey: 'navWebhooks' },
  { id: 'errors', slug: 'errors', labelKey: 'navErrors' },
  { id: 'try', slug: 'try', labelKey: 'navTry' },
  { id: 'sdks', slug: 'sdks', labelKey: 'navSdks' },
];

/** Primary docs tabs — Auth and Errors stay reachable from Overview. */
export const WHATSAPP_API_NAV_SECTIONS = WHATSAPP_API_SECTIONS.filter((section) =>
  (
    ['overview', 'messages', 'templates', 'webhooks', 'try', 'sdks'] as const
  ).includes(
    section.id as
      | 'overview'
      | 'messages'
      | 'templates'
      | 'webhooks'
      | 'try'
      | 'sdks',
  ),
);

export const MESSAGE_ENDPOINTS: WhatsappApiEndpoint[] = [
  {
    id: 'sendMessage',
    method: 'POST',
    path: '/whatsapp/messages',
    scopes: ['whatsapp:send'],
    summaryKey: 'epSendMessage',
    tryPath: '/whatsapp/messages',
    tryMethod: 'POST',
    tryNeedsBody: true,
    fields: [
      {
        name: 'to',
        type: 'string',
        required: true,
        description: 'Recipient phone in E.164 (e.g. +9647xxxxxxxxx)',
      },
      {
        name: 'type',
        type: 'string',
        required: true,
        description:
          'text | template | image | video | audio | document | sticker | location | contacts | interactive',
      },
      {
        name: 'phoneNumberId',
        type: 'string',
        description: 'Optional sender phone id; defaults to the first active number',
      },
      {
        name: 'text',
        type: 'object',
        description: '{ body: string, preview_url?: boolean } when type=text',
      },
      {
        name: 'template',
        type: 'object',
        description:
          '{ name, language: { code }, components? } when type=template',
      },
      {
        name: 'image | video | document | …',
        type: 'object',
        description: 'Media payloads use link or id (+ caption/filename where supported)',
      },
    ],
    exampleBody: `{
  "to": "",
  "type": "text",
  "text": { "body": "Hello from Rukny!" }
}`,
    exampleResponse: `{
  "id": "msg_…",
  "status": "ACCEPTED",
  "metaMessageId": "wamid.…"
}`,
  },
  {
    id: 'getMessage',
    method: 'GET',
    path: '/whatsapp/messages/:id',
    scopes: ['whatsapp:read'],
    summaryKey: 'epGetMessage',
    tryPath: '/whatsapp/messages/{id}',
    tryMethod: 'GET',
    tryNeedsBody: false,
    fields: [
      {
        name: 'id',
        type: 'path',
        required: true,
        description: 'Message log id returned from send',
      },
    ],
    exampleResponse: `{
  "id": "msg_…",
  "status": "DELIVERED",
  "direction": "OUTBOUND",
  "to": "+9647xxxxxxxxx",
  "sentAt": "2026-08-11T12:00:00.000Z",
  "deliveredAt": "2026-08-11T12:00:02.000Z"
}`,
  },
];

export const TEMPLATE_ENDPOINTS: WhatsappApiEndpoint[] = [
  {
    id: 'listTemplates',
    method: 'GET',
    path: '/whatsapp/templates',
    scopes: ['templates:read'],
    summaryKey: 'epListTemplates',
    tryPath: '/whatsapp/templates',
    tryMethod: 'GET',
    tryNeedsBody: false,
    exampleResponse: `[
  {
    "name": "hello_world",
    "language": "en_US",
    "category": "UTILITY",
    "status": "APPROVED"
  }
]`,
  },
  {
    id: 'getTemplate',
    method: 'GET',
    path: '/whatsapp/templates/:name',
    scopes: ['templates:read'],
    summaryKey: 'epGetTemplate',
    tryPath: '/whatsapp/templates/{name}',
    tryMethod: 'GET',
    tryNeedsBody: false,
    fields: [
      {
        name: 'name',
        type: 'path',
        required: true,
        description: 'Template name',
      },
    ],
  },
  {
    id: 'createTemplate',
    method: 'POST',
    path: '/whatsapp/templates',
    scopes: ['templates:write'],
    summaryKey: 'epCreateTemplate',
    tryPath: '/whatsapp/templates',
    tryMethod: 'POST',
    tryNeedsBody: true,
    fields: [
      { name: 'name', type: 'string', required: true, description: 'Template name' },
      {
        name: 'language',
        type: 'string',
        required: true,
        description: 'ar | en | en_US | ar_SA | ar_IQ',
      },
      {
        name: 'category',
        type: 'string',
        required: true,
        description: 'AUTHENTICATION | MARKETING | UTILITY',
      },
      {
        name: 'components',
        type: 'array',
        required: true,
        description: 'Header, Body, Footer, Buttons (Meta shape)',
      },
      {
        name: 'accountId',
        type: 'uuid',
        description: 'Optional WABA account id',
      },
    ],
    exampleBody: `{
  "name": "order_update",
  "language": "ar",
  "category": "UTILITY",
  "components": [
    {
      "type": "BODY",
      "text": "طلبك رقم {{1}} قيد التجهيز"
    }
  ]
}`,
  },
  {
    id: 'deleteTemplate',
    method: 'DELETE',
    path: '/whatsapp/templates/:name',
    scopes: ['templates:write'],
    summaryKey: 'epDeleteTemplate',
    tryPath: '/whatsapp/templates/{name}',
    tryMethod: 'DELETE',
    tryNeedsBody: false,
  },
  {
    id: 'syncTemplates',
    method: 'POST',
    path: '/whatsapp/templates/sync',
    scopes: ['templates:read'],
    summaryKey: 'epSyncTemplates',
    tryPath: '/whatsapp/templates/sync',
    tryMethod: 'POST',
    tryNeedsBody: false,
  },
];

export const WEBHOOK_EVENTS = [
  'message.sent',
  'message.delivered',
  'message.read',
  'message.failed',
  'message.received',
  'template.approved',
  'template.rejected',
  'template.status_updated',
  'account.status_updated',
  'phone.quality_updated',
] as const;

export const COMMON_ERRORS = [
  { code: '401', key: 'errorUnauthorized' },
  { code: '403', key: 'errorForbidden' },
  { code: '402', key: 'errorNoWallet' },
  { code: '404', key: 'errorNoWaba' },
  { code: '422', key: 'errorTemplate' },
  { code: '400', key: 'errorPhone' },
] as const;

export function buildCurlExample(
  endpoint: WhatsappApiEndpoint,
  apiKeyPlaceholder = 'rk_live_YOUR_KEY',
): string {
  const url = `${WHATSAPP_API_PUBLIC_BASE}${endpoint.path
    .replace(':id', 'MSG_ID')
    .replace(':name', 'hello_world')}`;

  if (!endpoint.exampleBody) {
    return [
      `curl -X ${endpoint.method} '${url}' \\`,
      `  -H "X-API-Key: ${apiKeyPlaceholder}"`,
    ].join('\n');
  }

  const compactBody = JSON.stringify(JSON.parse(endpoint.exampleBody));
  return [
    `curl -X ${endpoint.method} '${url}' \\`,
    `  -H "X-API-Key: ${apiKeyPlaceholder}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${compactBody}'`,
  ].join('\n');
}

export function resolveTryUrl(
  tryPath: string,
  params: { id?: string; name?: string },
): string {
  return `${WHATSAPP_API_TRY_BASE}${tryPath
    .replace('{id}', encodeURIComponent(params.id || 'MSG_ID'))
    .replace('{name}', encodeURIComponent(params.name || 'hello_world'))}`;
}
