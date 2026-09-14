/** Public Email REST catalog for portal docs and /documentation.
 *  Only endpoints that developers should call with an API key.
 *  Domain/sender setup is portal UI (JWT) — do not document as public REST.
 */

export const EMAIL_API_PUBLIC_BASE =
  (typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')) ||
  'https://api.rukny.io/api/v1';

export type EmailApiSectionId =
  | 'overview'
  | 'auth'
  | 'messages'
  | 'domains'
  | 'errors'
  | 'try'
  | 'sdks';

export type HttpMethod = 'GET' | 'POST' | 'DELETE';

export type EmailApiEndpointId = 'sendMessage' | 'getMessage';

export interface EmailApiField {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

export interface EmailApiEndpoint {
  id: EmailApiEndpointId;
  method: HttpMethod;
  path: string;
  scopes: string[];
  summary: string;
  fields?: EmailApiField[];
  exampleBody?: string;
  exampleResponse?: string;
}

export const EMAIL_API_SECTIONS: {
  id: EmailApiSectionId;
  slug: string;
  label: string;
}[] = [
  { id: 'overview', slug: '', label: 'Overview' },
  { id: 'auth', slug: 'auth', label: 'Authentication' },
  { id: 'messages', slug: 'messages', label: 'Messages' },
  { id: 'domains', slug: 'domains', label: 'Domains' },
  { id: 'errors', slug: 'errors', label: 'Errors' },
  { id: 'try', slug: 'try', label: 'Try it' },
  { id: 'sdks', slug: 'sdks', label: 'SDKs' },
];

/** Primary portal tabs — Auth & Errors reachable from Overview. */
export const EMAIL_API_NAV_SECTIONS = EMAIL_API_SECTIONS.filter((section) =>
  (['overview', 'messages', 'domains', 'try', 'sdks'] as const).includes(
    section.id as 'overview' | 'messages' | 'domains' | 'try' | 'sdks',
  ),
);

export const EMAIL_SCOPES = [
  {
    scope: 'email:send',
    description: 'Send transactional email',
  },
  {
    scope: 'email:read',
    description: 'Read delivery status',
  },
] as const;

export const MESSAGE_ENDPOINTS: EmailApiEndpoint[] = [
  {
    id: 'sendMessage',
    method: 'POST',
    path: '/email/messages',
    scopes: ['email:send'],
    summary: 'Send one transactional email from an authorized sender.',
    exampleBody: `{
  "from": "noreply@example.com",
  "fromName": "Your App",
  "to": ["user@example.com"],
  "subject": "Welcome",
  "bodyText": "Hello!",
  "bodyHtml": "<p>Hello!</p>"
}`,
    exampleResponse: `{
  "id": "em_01hxyz",
  "status": "queued",
  "createdAt": "2026-09-11T12:00:00.000Z"
}`,
    fields: [
      {
        name: 'from',
        type: 'string',
        required: true,
        description: 'Authorized sender address on a verified domain',
      },
      {
        name: 'fromName',
        type: 'string',
        description: 'Optional display name (max 120 chars)',
      },
      {
        name: 'to',
        type: 'string[]',
        required: true,
        description: 'Exactly one recipient in the MVP',
      },
      {
        name: 'subject',
        type: 'string',
        required: true,
        description: 'Subject line (no newlines)',
      },
      {
        name: 'bodyText',
        type: 'string',
        description: 'Plain-text body (required if bodyHtml is omitted)',
      },
      {
        name: 'bodyHtml',
        type: 'string',
        description: 'HTML body (required if bodyText is omitted)',
      },
      {
        name: 'replyTo',
        type: 'string[]',
        description: 'Optional reply-to (max one address)',
      },
    ],
  },
  {
    id: 'getMessage',
    method: 'GET',
    path: '/email/messages/{id}',
    scopes: ['email:read'],
    summary:
      'Read operational delivery status. Bodies and recipient addresses are never returned.',
    exampleResponse: `{
  "id": "em_01hxyz",
  "status": "delivered",
  "createdAt": "2026-09-11T12:00:00.000Z"
}`,
  },
];

export const EMAIL_ERROR_CATALOG = [
  {
    status: 400,
    code: 'Bad Request',
    description:
      'Invalid payload, missing Idempotency-Key, or malformed addresses.',
  },
  {
    status: 401,
    code: 'Unauthorized',
    description: 'Missing or invalid API key.',
  },
  {
    status: 403,
    code: 'Forbidden',
    description:
      'Insufficient scope, product not installed, sender not authorized, recipient suppressed, or quota exceeded.',
  },
  {
    status: 404,
    code: 'Not Found',
    description: 'Message was not found for this key.',
  },
  {
    status: 429,
    code: 'Too Many Requests',
    description: 'Rate limit exceeded. Retry with backoff.',
  },
  {
    status: 503,
    code: 'Service Unavailable',
    description: 'Upstream provider temporarily unavailable.',
  },
] as const;
