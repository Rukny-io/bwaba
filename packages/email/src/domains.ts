import type { HttpClient } from './http';
import type {
  AuthorizeSenderInput,
  EmailDomainRecord,
  EmailSenderRecord,
} from './types';

export class DomainsResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<EmailDomainRecord[]> {
    const result = await this.http.request<
      EmailDomainRecord[] | { domains?: EmailDomainRecord[] }
    >('GET', '/email/domains');
    return Array.isArray(result) ? result : (result.domains ?? []);
  }

  async create(domain: string): Promise<EmailDomainRecord> {
    if (!domain?.trim()) {
      throw new Error('create requires a non-empty domain');
    }
    return this.http.request<EmailDomainRecord>('POST', '/email/domains', {
      domain: domain.trim().toLowerCase(),
    });
  }

  async get(domain: string): Promise<EmailDomainRecord> {
    if (!domain?.trim()) {
      throw new Error('get requires a non-empty domain');
    }
    return this.http.request<EmailDomainRecord>(
      'GET',
      `/email/domains/${encodeURIComponent(domain.trim().toLowerCase())}`,
    );
  }

  async authorizeSender(
    input: AuthorizeSenderInput,
  ): Promise<EmailSenderRecord> {
    if (!input.email?.trim()) {
      throw new Error('authorizeSender requires a non-empty email');
    }
    return this.http.request<EmailSenderRecord>('POST', '/email/senders', {
      email: input.email.trim().toLowerCase(),
    });
  }
}
