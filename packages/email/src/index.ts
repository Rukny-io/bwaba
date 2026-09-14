import { DomainsResource } from './domains';
import { HttpClient } from './http';
import { MessagesResource } from './messages';
import type { RuknyEmailConfig } from './types';

function isBrowserRuntime(): boolean {
  return typeof (globalThis as { window?: unknown }).window !== 'undefined';
}

export class RuknyEmail {
  readonly messages: MessagesResource;
  readonly domains: DomainsResource;

  constructor(config: RuknyEmailConfig) {
    if (!config.apiKey?.trim()) {
      throw new Error('RuknyEmail requires a non-empty apiKey');
    }

    if (isBrowserRuntime()) {
      throw new Error(
        'RuknyEmail must run server-side. Never expose your API key in a browser.',
      );
    }

    const http = new HttpClient(config);
    this.messages = new MessagesResource(http);
    this.domains = new DomainsResource(http);
  }
}

export { RuknyEmailError, DEFAULT_BASE_URL } from './types';
export type {
  RuknyEmailConfig,
  SendEmailInput,
  SendEmailResult,
  EmailStatusResult,
  EmailDomainRecord,
  AuthorizeSenderInput,
  EmailSenderRecord,
} from './types';
