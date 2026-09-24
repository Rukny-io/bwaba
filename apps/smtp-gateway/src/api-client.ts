import type { ParsedMail } from './parse-mime';

export type DeveloperAuthResult = {
  ok: true;
  apiKeyId: string;
  userId: string;
  developerAppId: string | null;
  environment: string;
};

export type MailboxAuthResult = {
  ok: true;
  mailboxId: string;
  mailAppId: string;
  userId: string;
  appId: string;
  address: string;
  allowedFrom: string[];
};

type ApiClientOptions = {
  baseUrl: string;
  internalSecret: string;
};

export class InternalApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  async validateDeveloperKey(apiKey: string, clientIp?: string) {
    return this.post<DeveloperAuthResult>('/internal/smtp/validate-developer-key', {
      apiKey,
      clientIp,
    });
  }

  async sendDeveloper(input: {
    apiKey: string;
    parsed: ParsedMail;
    idempotencyKey: string;
    clientIp?: string;
  }) {
    const recipient = input.parsed.to[0];
    if (!recipient) {
      throw new Error('At least one recipient is required.');
    }
    if (input.parsed.to.length > 1) {
      throw new Error('Only one recipient is supported for Developer SMTP.');
    }

    return this.post<{ id: string; status: string; createdAt: string }>(
      '/internal/smtp/send-developer',
      {
        apiKey: input.apiKey,
        from: input.parsed.from.email,
        fromName: input.parsed.from.name,
        to: [recipient],
        subject: input.parsed.subject,
        bodyText: input.parsed.text,
        bodyHtml: input.parsed.html,
        replyTo: input.parsed.replyTo,
        idempotencyKey: input.idempotencyKey,
        clientIp: input.clientIp,
      },
    );
  }

  async validateMailbox(address: string, appPassword: string) {
    return this.post<MailboxAuthResult>('/internal/smtp/validate-mailbox', {
      address,
      appPassword,
    });
  }

  async sendMailbox(input: {
    address: string;
    appPassword: string;
    parsed: ParsedMail;
  }) {
    if (!input.parsed.from.email) {
      throw new Error('From address is required.');
    }
    return this.post<{ ok: true; messageId: string; sesMessageId: string }>(
      '/internal/smtp/send-mailbox',
      {
        address: input.address,
        appPassword: input.appPassword,
        from: input.parsed.from.email,
        fromName: input.parsed.from.name,
        to: input.parsed.to,
        cc: input.parsed.cc,
        bcc: input.parsed.bcc,
        subject: input.parsed.subject,
        bodyText: input.parsed.text,
        bodyHtml: input.parsed.html,
      },
    );
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-api-secret': this.options.internalSecret,
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => ({}))) as T & {
      message?: string | string[];
      error?: string;
    };

    if (!response.ok) {
      const raw = data.message ?? data.error;
      const message = Array.isArray(raw)
        ? raw[0]
        : raw || `Internal API error (${response.status})`;
      throw new Error(String(message));
    }

    return data;
  }
}
