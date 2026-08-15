export const DEFAULT_BASE_URL = 'https://api.rukny.io/api/v1';

export interface RuknyWhatsAppConfig {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  /** Request timeout in milliseconds (default 30000) */
  timeoutMs?: number;
}

export interface TemplateParameter {
  type: 'text';
  text: string;
}

export interface TemplateComponent {
  type: 'body' | 'header' | 'button';
  sub_type?: 'url' | 'quick_reply';
  index?: string;
  parameters?: TemplateParameter[];
}

export interface SendTextInput {
  to: string;
  body: string;
  previewUrl?: boolean;
  phoneNumberId?: string;
}

export interface SendTemplateInput {
  to: string;
  name: string;
  language: string;
  variables?: string[];
  components?: TemplateComponent[];
  phoneNumberId?: string;
}

export interface SendOtpInput {
  to: string;
  code: string;
  template?: string;
  language?: string;
  phoneNumberId?: string;
  /** Set true when your AUTHENTICATION template includes a copy-code button */
  includeCopyCodeButton?: boolean;
}

export interface SendMessagePayload {
  to: string;
  type: string;
  phoneNumberId?: string;
  text?: { body: string; preview_url?: boolean };
  template?: {
    name: string;
    language: { code: string };
    components?: TemplateComponent[];
  };
  [key: string]: unknown;
}

export interface SendMessageResult {
  id: string;
  status: string;
  metaMessageId?: string;
}

export interface MessageStatusResult {
  id: string;
  status: string;
  direction?: string;
  to?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface TemplateSummary {
  name: string;
  language: string;
  category?: string;
  status?: string;
}

export interface VerifyWebhookInput {
  rawBody: string | Buffer;
  signatureHeader: string | null | undefined;
  secret: string;
  /** Unix seconds from X-Rukny-Timestamp — rejects stale events when set */
  timestampHeader?: string | null;
  /** Max age in seconds when timestampHeader is provided (default 300) */
  maxAgeSeconds?: number;
}

export class RuknyWhatsAppError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'RuknyWhatsAppError';
    this.status = status;
    this.body = body;
  }
}
