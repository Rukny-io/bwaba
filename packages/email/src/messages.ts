import type { HttpClient } from './http';
import type {
  EmailStatusResult,
  SendEmailInput,
  SendEmailResult,
} from './types';

function asArray(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
}

export class MessagesResource {
  constructor(private readonly http: HttpClient) {}

  async send(
    input: SendEmailInput,
    options: { idempotencyKey: string },
  ): Promise<SendEmailResult> {
    if (!options?.idempotencyKey?.trim()) {
      throw new Error('send requires a non-empty idempotencyKey');
    }
    if (!input.bodyText?.trim() && !input.bodyHtml?.trim()) {
      throw new Error('send requires bodyText and/or bodyHtml');
    }

    const to = asArray(input.to);
    if (!to?.length) {
      throw new Error('send requires at least one recipient in to');
    }

    return this.http.request<SendEmailResult>(
      'POST',
      '/email/messages',
      {
        from: input.from,
        to,
        subject: input.subject,
        ...(input.fromName ? { fromName: input.fromName } : {}),
        ...(input.bodyText ? { bodyText: input.bodyText } : {}),
        ...(input.bodyHtml ? { bodyHtml: input.bodyHtml } : {}),
        ...(input.replyTo
          ? { replyTo: asArray(input.replyTo) }
          : {}),
      },
      { 'Idempotency-Key': options.idempotencyKey },
    );
  }

  async getStatus(messageId: string): Promise<EmailStatusResult> {
    if (!messageId?.trim()) {
      throw new Error('getStatus requires a message id');
    }
    return this.http.request<EmailStatusResult>(
      'GET',
      `/email/messages/${encodeURIComponent(messageId)}`,
    );
  }
}
