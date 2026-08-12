'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { WhatsappApiEndpoint } from '@/lib/whatsapp-api-catalog';
import { buildCurlExample } from '@/lib/whatsapp-api-catalog';

const methodClass: Record<string, string> = {
  GET: 'bg-[color-mix(in_srgb,#0f766e_18%,transparent)] text-[#0f766e]',
  POST: 'bg-[color-mix(in_srgb,#2563eb_16%,transparent)] text-[#2563eb]',
  DELETE: 'bg-[color-mix(in_srgb,#b91c1c_14%,transparent)] text-[#b91c1c]',
};

interface WhatsappApiEndpointCardProps {
  endpoint: WhatsappApiEndpoint;
  summary: string;
  copyLabel: string;
  requestBodyLabel: string;
  responseLabel: string;
  scopesLabel: string;
  onTry?: () => void;
  tryLabel?: string;
}

export function WhatsappApiEndpointCard({
  endpoint,
  summary,
  copyLabel,
  requestBodyLabel,
  responseLabel,
  scopesLabel,
  onTry,
  tryLabel,
}: WhatsappApiEndpointCardProps) {
  const curl = buildCurlExample(endpoint);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(curl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <article className="overflow-hidden rounded-2xl bg-[var(--surface)] sm:rounded-3xl">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)]/40 px-4 py-4 sm:px-5">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex rounded-lg px-2 py-1 text-[11px] font-bold tracking-wide',
                methodClass[endpoint.method],
              )}
              dir="ltr"
            >
              {endpoint.method}
            </span>
            <code
              className="font-mono text-[13px] font-semibold text-[var(--foreground)]"
              dir="ltr"
            >
              /api/v1{endpoint.path}
            </code>
          </div>
          <p className="text-[13px] text-[var(--muted-foreground)]">{summary}</p>
          <p className="text-[12px] text-[var(--muted-foreground)]">
            {scopesLabel}:{' '}
            <span className="font-mono text-[var(--foreground)]" dir="ltr">
              {endpoint.scopes.join(', ')}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onTry && tryLabel ? (
            <button
              type="button"
              onClick={onTry}
              className="rounded-xl bg-[var(--surface-secondary)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_85%,var(--foreground)_6%)]"
            >
              {tryLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--surface-secondary)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copyLabel}
          </button>
        </div>
      </div>

      {endpoint.fields?.length ? (
        <div className="border-b border-[var(--border)]/40 px-4 py-4 sm:px-5">
          <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            {requestBodyLabel}
          </h3>
          <ul className="mt-3 space-y-2.5">
            {endpoint.fields.map((field) => (
              <li
                key={field.name}
                className="grid gap-1 text-[13px] sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-3"
              >
                <div className="min-w-0" dir="ltr">
                  <code className="font-mono text-[12.5px] font-semibold text-[var(--foreground)]">
                    {field.name}
                  </code>
                  {field.required ? (
                    <span className="ms-1.5 text-[11px] text-[var(--danger)]">*</span>
                  ) : null}
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    {field.type}
                  </p>
                </div>
                <p className="text-[var(--muted-foreground)]">{field.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-0 lg:grid-cols-2">
        <pre
          className="overflow-x-auto border-b border-[var(--border)]/40 p-4 text-[12px] leading-relaxed text-[var(--foreground)] lg:border-b-0 lg:border-e"
          dir="ltr"
        >
          <code>{curl}</code>
        </pre>
        {endpoint.exampleResponse ? (
          <div className="p-4">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              {responseLabel}
            </p>
            <pre
              className="overflow-x-auto text-[12px] leading-relaxed text-[var(--muted-foreground)]"
              dir="ltr"
            >
              <code>{endpoint.exampleResponse}</code>
            </pre>
          </div>
        ) : (
          <div className="hidden p-4 lg:block" />
        )}
      </div>
    </article>
  );
}
