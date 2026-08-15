'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, Phone, Play, Shield } from 'lucide-react';
import { useCurrentApp } from '@/components/providers/app-context';
import { useApiKeys } from '@/hooks/use-api-keys';
import { executeWhatsappApiTry } from '@/lib/api/whatsapp-api-try';
import {
  MESSAGE_ENDPOINTS,
  TEMPLATE_ENDPOINTS,
  type WhatsappApiEndpoint,
  type WhatsappApiEndpointId,
} from '@/lib/whatsapp-api-catalog';
import { appApiKeysNew } from '@/lib/app-routes';
import { cn } from '@/lib/utils';

const ALL_TRYABLE: WhatsappApiEndpoint[] = [
  ...MESSAGE_ENDPOINTS,
  ...TEMPLATE_ENDPOINTS,
].filter((ep) => ep.tryPath && ep.tryMethod);

const E164_RE = /^\+[1-9]\d{7,14}$/;

function bodyNeedsRecipient(endpoint: WhatsappApiEndpoint | undefined): boolean {
  return Boolean(
    endpoint?.tryNeedsBody &&
      endpoint.fields?.some((f) => f.name === 'to' && f.required),
  );
}

function readToFromBody(raw: string): string {
  try {
    const parsed = JSON.parse(raw || '{}') as { to?: unknown };
    return typeof parsed.to === 'string' ? parsed.to : '';
  } catch {
    return '';
  }
}

function writeToIntoBody(raw: string, to: string): string {
  try {
    const parsed = JSON.parse(raw || '{}') as Record<string, unknown>;
    parsed.to = to;
    return `${JSON.stringify(parsed, null, 2)}\n`;
  } catch {
    return raw;
  }
}

function isPlaceholderPhone(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  if (/x/i.test(v)) return true;
  return !E164_RE.test(v);
}

function resolveTryPath(
  tryPath: string,
  params: { id?: string; name?: string },
): string {
  return `/api/v1${tryPath
    .replace('{id}', encodeURIComponent(params.id || 'MSG_ID'))
    .replace('{name}', encodeURIComponent(params.name || 'hello_world'))}`;
}

interface WhatsappApiTryItProps {
  labels: {
    title: string;
    description: string;
    apiKey: string;
    apiKeyPlaceholder: string;
    apiKeyHint: string;
    apiKeyEmpty: string;
    apiKeyCreateLink: string;
    endpoint: string;
    pathParam: string;
    pathParamHint: string;
    body: string;
    recipient: string;
    recipientPlaceholder: string;
    recipientHint: string;
    recipientRequired: string;
    send: string;
    sending: string;
    response: string;
    invalidJson: string;
  };
  initialEndpointId?: WhatsappApiEndpointId;
  initialBody?: string;
  summaries: Record<
    | 'epSendMessage'
    | 'epGetMessage'
    | 'epListTemplates'
    | 'epGetTemplate'
    | 'epCreateTemplate'
    | 'epDeleteTemplate'
    | 'epSyncTemplates',
    string
  >;
}

export function WhatsappApiTryIt({
  labels,
  initialEndpointId = 'sendMessage',
  initialBody,
  summaries,
}: WhatsappApiTryItProps) {
  const { app } = useCurrentApp();
  const { data: apiKeys, isLoading: keysLoading } = useApiKeys(app.id);

  const testKeys = useMemo(
    () =>
      (apiKeys ?? []).filter(
        (key) => key.environment === 'test' && key.status === 'ACTIVE',
      ),
    [apiKeys],
  );

  const initialEndpoint =
    ALL_TRYABLE.find((e) => e.id === initialEndpointId) ?? ALL_TRYABLE[0];
  const [endpointId, setEndpointId] = useState<WhatsappApiEndpointId>(
    initialEndpoint?.id ?? 'sendMessage',
  );
  const [apiKeySlug, setApiKeySlug] = useState('');
  const [pathValue, setPathValue] = useState('');
  const [body, setBody] = useState(
    () => initialBody ?? initialEndpoint?.exampleBody ?? '{\n  \n}',
  );
  const [recipient, setRecipient] = useState(() =>
    readToFromBody(initialBody ?? initialEndpoint?.exampleBody ?? ''),
  );
  const [status, setStatus] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recipientTouched, setRecipientTouched] = useState(false);

  const endpoint = useMemo(
    () => ALL_TRYABLE.find((e) => e.id === endpointId) ?? ALL_TRYABLE[0],
    [endpointId],
  );

  const showRecipient = bodyNeedsRecipient(endpoint);
  const recipientInvalid = showRecipient && isPlaceholderPhone(recipient);

  function handleEndpointChange(id: WhatsappApiEndpointId) {
    setEndpointId(id);
    const next = ALL_TRYABLE.find((e) => e.id === id);
    const nextBody = next?.exampleBody ?? '';
    setBody(nextBody);
    setRecipient(readToFromBody(nextBody));
    setRecipientTouched(false);
    setStatus(null);
    setResponseText('');
    setError(null);
  }

  function handleRecipientChange(value: string) {
    setRecipient(value);
    setRecipientTouched(true);
    setBody((prev) => writeToIntoBody(prev, value.trim()));
  }

  function handleBodyChange(value: string) {
    setBody(value);
    if (showRecipient) {
      setRecipient(readToFromBody(value));
    }
  }

  async function handleSend() {
    if (!endpoint?.tryPath || !endpoint.tryMethod) return;

    if (!apiKeySlug) {
      setError(labels.apiKeyEmpty);
      return;
    }

    if (showRecipient && isPlaceholderPhone(recipient)) {
      setRecipientTouched(true);
      setError(labels.recipientRequired);
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);
    setResponseText('');

    let parsedBody: unknown = undefined;
    if (endpoint.tryNeedsBody) {
      try {
        const synced = showRecipient
          ? writeToIntoBody(body, recipient.trim())
          : body;
        parsedBody = JSON.parse(synced || '{}');
        if (showRecipient) setBody(synced);
      } catch {
        setError(labels.invalidJson);
        setLoading(false);
        return;
      }
    }

    const path = resolveTryPath(endpoint.tryPath, {
      id: pathValue || undefined,
      name: pathValue || undefined,
    });

    try {
      const result = await executeWhatsappApiTry({
        appId: app.appId,
        method: endpoint.tryMethod,
        path,
        body: parsedBody,
        apiKeySlug,
      });
      setStatus(result.status);
      setResponseText(JSON.stringify(result.body, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  const needsPath =
    endpoint?.tryPath?.includes('{id}') ||
    endpoint?.tryPath?.includes('{name}');

  return (
    <section className="overflow-hidden rounded-2xl bg-[var(--surface)] sm:rounded-3xl">
      <div className="border-b border-[var(--border)]/40 px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          {labels.title}
        </h2>
        <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
          {labels.description}
        </p>
      </div>

      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-[12.5px] font-medium text-[var(--muted-foreground)]">
              {labels.endpoint}
            </span>
            <select
              value={endpoint.id}
              onChange={(e) =>
                handleEndpointChange(e.target.value as WhatsappApiEndpointId)
              }
              className="h-10 w-full rounded-xl bg-[var(--surface-secondary)] px-3 text-[13px] text-[var(--foreground)] outline-none"
            >
              {ALL_TRYABLE.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.method} {ep.path} — {summaries[ep.summaryKey] ?? ep.id}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--muted-foreground)]">
              <Shield className="size-3.5" />
              {labels.apiKey}
            </span>
            {keysLoading ? (
              <div className="flex h-10 items-center gap-2 text-[13px] text-[var(--muted-foreground)]">
                <Loader2 className="size-4 animate-spin" />
                …
              </div>
            ) : testKeys.length > 0 ? (
              <select
                value={apiKeySlug}
                onChange={(e) => setApiKeySlug(e.target.value)}
                className="h-10 w-full rounded-xl bg-[var(--surface-secondary)] px-3 font-mono text-[13px] text-[var(--foreground)] outline-none"
                dir="ltr"
              >
                <option value="">{labels.apiKeyPlaceholder}</option>
                {testKeys.map((key) => (
                  <option key={key.slug} value={key.slug}>
                    {key.name} — rk_test_…{key.keySuffix}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-[13px] text-[var(--muted-foreground)]">
                {labels.apiKeyEmpty}{' '}
                <Link
                  href={appApiKeysNew(app.appId)}
                  className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                >
                  {labels.apiKeyCreateLink}
                </Link>
              </p>
            )}
            <span className="block text-[11.5px] text-[var(--muted-foreground)]">
              {labels.apiKeyHint}
            </span>
          </label>

          {needsPath ? (
            <label className="block space-y-1.5">
              <span className="text-[12.5px] font-medium text-[var(--muted-foreground)]">
                {labels.pathParam}
              </span>
              <input
                value={pathValue}
                onChange={(e) => setPathValue(e.target.value)}
                placeholder={
                  endpoint.tryPath?.includes('{id}') ? 'message id' : 'template name'
                }
                className="h-10 w-full rounded-xl bg-[var(--surface-secondary)] px-3 font-mono text-[13px] outline-none"
                dir="ltr"
              />
              <span className="block text-[11.5px] text-[var(--muted-foreground)]">
                {labels.pathParamHint}
              </span>
            </label>
          ) : null}

          {showRecipient ? (
            <label className="block space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--foreground)]">
                <Phone className="size-3.5 text-[var(--primary)]" />
                {labels.recipient}
                <span className="rounded-md bg-[color-mix(in_srgb,var(--warning)_16%,transparent)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--warning)]">
                  required
                </span>
              </span>
              <input
                type="tel"
                autoComplete="tel"
                spellCheck={false}
                value={recipient}
                onChange={(e) => handleRecipientChange(e.target.value)}
                onBlur={() => setRecipientTouched(true)}
                placeholder={labels.recipientPlaceholder}
                aria-invalid={recipientTouched && recipientInvalid}
                className={cn(
                  'h-11 w-full rounded-xl px-3 font-mono text-[14px] text-[var(--foreground)] outline-none transition-[box-shadow,background-color]',
                  recipientTouched && recipientInvalid
                    ? 'bg-[color-mix(in_srgb,var(--warning)_10%,var(--surface-secondary))] ring-2 ring-[color-mix(in_srgb,var(--warning)_45%,transparent)]'
                    : 'bg-[var(--surface-secondary)] ring-2 ring-transparent focus:ring-[color-mix(in_srgb,var(--primary)_28%,transparent)]',
                )}
                dir="ltr"
              />
              <span
                className={cn(
                  'block text-[12px] leading-relaxed',
                  recipientTouched && recipientInvalid
                    ? 'font-medium text-[var(--warning)]'
                    : 'text-[var(--muted-foreground)]',
                )}
              >
                {recipientTouched && recipientInvalid
                  ? labels.recipientRequired
                  : labels.recipientHint}
              </span>
            </label>
          ) : null}

          {endpoint.tryNeedsBody ? (
            <label className="block space-y-1.5">
              <span className="text-[12.5px] font-medium text-[var(--muted-foreground)]">
                {labels.body}
              </span>
              <textarea
                value={body}
                onChange={(e) => handleBodyChange(e.target.value)}
                rows={showRecipient ? 10 : 12}
                spellCheck={false}
                className="w-full resize-y rounded-xl bg-[var(--surface-secondary)] p-3 font-mono text-[12.5px] leading-relaxed text-[var(--foreground)] outline-none"
                dir="ltr"
              />
            </label>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || !apiKeySlug}
              onClick={() => void handleSend()}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--foreground)] px-4 text-[13px] font-medium text-[var(--background)] transition disabled:opacity-40',
              )}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              {loading ? labels.sending : labels.send}
            </button>
          </div>
        </div>

        <div className="flex min-h-[18rem] flex-col rounded-2xl bg-[var(--surface-secondary)] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[12.5px] font-medium text-[var(--muted-foreground)]">
              {labels.response}
            </p>
            {status != null ? (
              <span
                className={cn(
                  'rounded-lg px-2 py-0.5 font-mono text-[12px] font-semibold',
                  status >= 200 && status < 300
                    ? 'text-[var(--success)]'
                    : 'text-[var(--danger)]',
                )}
                dir="ltr"
              >
                {status}
              </span>
            ) : null}
          </div>
          {error ? (
            <p className="text-sm text-[var(--danger)]">{error}</p>
          ) : (
            <pre
              className="flex-1 overflow-auto text-[12px] leading-relaxed text-[var(--foreground)]"
              dir="ltr"
            >
              <code>{responseText || '—'}</code>
            </pre>
          )}
        </div>
      </div>
    </section>
  );
}
