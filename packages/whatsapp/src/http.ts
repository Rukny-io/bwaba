import { RuknyWhatsAppError, type RuknyWhatsAppConfig } from './types';

type HttpMethod = 'GET' | 'POST' | 'DELETE';

const DEFAULT_TIMEOUT_MS = 30_000;

export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(config: RuknyWhatsAppConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl ?? 'https://api.rukny.io/api/v1').replace(
      /\/$/,
      '',
    );
    this.fetchImpl = config.fetch ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async request<T>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const response = await this.fetchImpl(url, {
      method,
      headers: {
        'X-API-Key': this.apiKey,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const text = await response.text();
    let parsed: unknown = text;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!response.ok) {
      const message =
        typeof parsed === 'object' &&
        parsed !== null &&
        'message' in parsed &&
        typeof (parsed as { message: unknown }).message === 'string'
          ? (parsed as { message: string }).message
          : `Request failed with status ${response.status}`;
      throw new RuknyWhatsAppError(message, response.status, parsed);
    }

    return parsed as T;
  }
}
