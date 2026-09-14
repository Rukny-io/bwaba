export const DEFAULT_BASE_URL = 'https://api.rukny.io/api/v1';

export interface RuknyEmailConfig {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  /** Request timeout in milliseconds (default 30000) */
  timeoutMs?: number;
}

export interface SendEmailInput {
  from: string;
  to: string | string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  fromName?: string;
  replyTo?: string | string[];
}

export interface SendEmailResult {
  id: string;
  status: string;
  createdAt?: string;
}

export interface EmailStatusResult {
  id: string;
  status: string;
  createdAt?: string;
}

export interface EmailDomainRecord {
  domain: string;
  status?: string;
  [key: string]: unknown;
}

export interface AuthorizeSenderInput {
  email: string;
}

export interface EmailSenderRecord {
  email: string;
  status?: string;
  [key: string]: unknown;
}

export class RuknyEmailError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'RuknyEmailError';
    this.status = status;
    this.body = body;
  }
}
