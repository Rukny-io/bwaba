'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { WhatsappApiEndpoint } from '@/lib/whatsapp-api-catalog';
import { WhatsappApiCodePanel } from '@/components/whatsapp-api/whatsapp-api-code-panel';
import {
  waApiBtnSecondary,
  waApiPanelFlush,
} from '@/components/whatsapp-api/whatsapp-api-shared';

const methodClass: Record<string, string> = {
  GET: 'bg-[color-mix(in_srgb,var(--success)_14%,var(--background))] text-[var(--success)]',
  POST: 'bg-[color-mix(in_srgb,var(--primary)_14%,var(--background))] text-[var(--primary)]',
  DELETE: 'bg-[color-mix(in_srgb,var(--danger)_14%,var(--background))] text-[var(--danger)]',
};

interface WhatsappApiEndpointCardProps {
  endpoint: WhatsappApiEndpoint;
  summary: string;
  copyLabel: string;
  requestBodyLabel: string;
  responseLabel: string;
  scopesLabel: string;
  onTry?: () => void;
  tryHref?: string;
  tryLabel?: string;
  hideCode?: boolean;
  className?: string;
}

export function WhatsappApiEndpointCard({
  endpoint,
  summary,
  copyLabel,
  requestBodyLabel,
  responseLabel,
  scopesLabel,
  onTry,
  tryHref,
  tryLabel,
  hideCode = false,
  className,
}: WhatsappApiEndpointCardProps) {
  return (
    <article className={cn(waApiPanelFlush, className)}>
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
          {tryHref && tryLabel ? (
            <Link href={tryHref} className={cn(waApiBtnSecondary, 'h-8 px-3 text-[12.5px]')}>
              {tryLabel}
            </Link>
          ) : onTry && tryLabel ? (
            <button
              type="button"
              onClick={onTry}
              className={cn(waApiBtnSecondary, 'h-8 px-3 text-[12.5px]')}
            >
              {tryLabel}
            </button>
          ) : null}
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

      {!hideCode ? (
        <div
          className={cn(
            'grid gap-0',
            endpoint.exampleResponse ? 'lg:grid-cols-2' : 'grid-cols-1',
          )}
        >
          <div
            className={cn(
              'border-b border-[var(--border)]/40 p-4 sm:p-5',
              endpoint.exampleResponse && 'lg:border-b-0 lg:border-e',
            )}
          >
            <WhatsappApiCodePanel endpoint={endpoint} copyLabel={copyLabel} />
          </div>
          {endpoint.exampleResponse ? (
            <div className="p-4 sm:p-5">
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
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
