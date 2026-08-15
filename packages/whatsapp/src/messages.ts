import type { HttpClient } from './http';
import { buildBodyComponents, buildOtpComponents } from './template-components';
import type {
  MessageStatusResult,
  SendMessagePayload,
  SendMessageResult,
  SendOtpInput,
  SendTemplateInput,
  SendTextInput,
} from './types';

const E164_RE = /^\+[1-9]\d{7,14}$/;

function assertE164(phone: string, field = 'to'): void {
  if (!E164_RE.test(phone)) {
    throw new Error(
      `${field} must be a valid E.164 phone number (e.g. +9647xxxxxxxxx)`,
    );
  }
}

export class MessagesResource {
  constructor(private readonly http: HttpClient) {}

  async send(
    payload: SendMessagePayload,
    options?: { idempotencyKey?: string },
  ): Promise<SendMessageResult> {
    return this.http.request<SendMessageResult>(
      'POST',
      '/whatsapp/messages',
      payload,
      options?.idempotencyKey
        ? { 'Idempotency-Key': options.idempotencyKey }
        : undefined,
    );
  }

  async sendText(
    input: SendTextInput,
    options?: { idempotencyKey?: string },
  ): Promise<SendMessageResult> {
    assertE164(input.to);
    return this.send(
      {
        to: input.to,
        type: 'text',
        phoneNumberId: input.phoneNumberId,
        text: {
          body: input.body,
          ...(input.previewUrl ? { preview_url: true } : {}),
        },
      },
      options,
    );
  }

  async sendTemplate(
    input: SendTemplateInput,
    options?: { idempotencyKey?: string },
  ): Promise<SendMessageResult> {
    assertE164(input.to);
    const components =
      input.components ??
      (input.variables ? buildBodyComponents(input.variables) : undefined);

    return this.send(
      {
        to: input.to,
        type: 'template',
        phoneNumberId: input.phoneNumberId,
        template: {
          name: input.name,
          language: { code: input.language },
          ...(components?.length ? { components } : {}),
        },
      },
      options,
    );
  }

  async sendOtp(
    input: SendOtpInput,
    options?: { idempotencyKey?: string },
  ): Promise<SendMessageResult> {
    assertE164(input.to);
    if (!input.code?.trim()) {
      throw new Error('sendOtp requires a non-empty code');
    }

    const env =
      typeof process !== 'undefined'
        ? (process.env as Record<string, string | undefined>)
        : {};
    const templateName = input.template ?? env.RUKNY_OTP_TEMPLATE ?? 'otp_verify';
    const language = input.language ?? env.RUKNY_OTP_LANGUAGE ?? 'ar';

    return this.sendTemplate(
      {
        to: input.to,
        name: templateName,
        language,
        phoneNumberId: input.phoneNumberId,
        components: buildOtpComponents(input.code, input.includeCopyCodeButton),
      },
      options,
    );
  }

  async getStatus(messageId: string): Promise<MessageStatusResult> {
    return this.http.request<MessageStatusResult>(
      'GET',
      `/whatsapp/messages/${encodeURIComponent(messageId)}`,
    );
  }
}
