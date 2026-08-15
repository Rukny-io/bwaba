import type { HttpClient } from './http';
import type { TemplateSummary } from './types';

export class TemplatesResource {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<TemplateSummary[]> {
    return this.http.request<TemplateSummary[]>('GET', '/whatsapp/templates');
  }

  async get(name: string): Promise<TemplateSummary> {
    return this.http.request<TemplateSummary>(
      'GET',
      `/whatsapp/templates/${encodeURIComponent(name)}`,
    );
  }

  async sync(accountId?: string): Promise<unknown> {
    return this.http.request('POST', '/whatsapp/templates/sync', {
      ...(accountId ? { accountId } : {}),
    });
  }
}
