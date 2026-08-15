import { HttpClient } from './http';
import { MessagesResource } from './messages';
import { TemplatesResource } from './templates';
import type { RuknyWhatsAppConfig } from './types';

function isBrowserRuntime(): boolean {
  return typeof (globalThis as { window?: unknown }).window !== 'undefined';
}

export class RuknyWhatsApp {
  readonly messages: MessagesResource;
  readonly templates: TemplatesResource;

  constructor(config: RuknyWhatsAppConfig) {
    if (!config.apiKey?.trim()) {
      throw new Error('RuknyWhatsApp requires a non-empty apiKey');
    }

    if (isBrowserRuntime()) {
      throw new Error(
        'RuknyWhatsApp must run server-side. Never expose your API key in a browser.',
      );
    }

    const http = new HttpClient(config);
    this.messages = new MessagesResource(http);
    this.templates = new TemplatesResource(http);
  }
}

export { RuknyWhatsAppError, DEFAULT_BASE_URL } from './types';
export type {
  RuknyWhatsAppConfig,
  SendTextInput,
  SendTemplateInput,
  SendOtpInput,
  SendMessagePayload,
  SendMessageResult,
  MessageStatusResult,
  TemplateSummary,
  TemplateComponent,
  VerifyWebhookInput,
} from './types';
export { verifyWebhookSignature, assertWebhookDeliveryNotReplayed } from './webhooks';
export { buildBodyComponents, buildOtpComponents } from './template-components';
