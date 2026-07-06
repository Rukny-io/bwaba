'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { CodeSnippetCard } from '@/components/forms/code-snippet-card';
import { useLinkedFormDetail } from '@/hooks/use-app-forms';
import { appForms } from '@/lib/app-routes';
import {
  buildEmbedListenerSnippet,
  buildIframeEmbedCode,
  getFormsDashboardUrl,
  getPublicFormUrl,
} from '@/lib/forms-urls';
import { cn } from '@/lib/utils';

const connectSectionClassName =
  'rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-none sm:rounded-3xl';

export function FormConnectPanel({
  appId,
  formId,
}: {
  appId: string;
  formId: string;
}) {
  const t = useTranslations();
  const f = t.forms;
  const isRtl = t.common.switchLang === 'English';
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const { data: form, isLoading, isError } = useLinkedFormDetail(appId, formId);

  const publicUrl = form ? getPublicFormUrl(form.slug, false) : '';
  const iframeCode = form ? buildIframeEmbedCode(form.slug) : '';
  const listenerCode = buildEmbedListenerSnippet();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div
        className={cn(connectSectionClassName, 'p-8 text-center')}
      >
        <p className="text-sm text-[var(--muted-foreground)]">{f.connectNotFound}</p>
        <Link
          href={appForms(appId)}
          className="mt-4 inline-flex text-sm font-medium text-[var(--primary)]"
        >
          {f.backToForms}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <Link
          href={appForms(appId)}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <BackArrow className="size-3.5" />
          {f.backToForms}
        </Link>
        <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
          {f.connectTitle}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{form.title}</p>
      </div>

      {!form.embed.embedEnabled ? (
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--warning)_30%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_8%,var(--background))] px-4 py-3 text-sm text-[var(--foreground)]">
          {form.embed.requiresWebsiteOrOrigins ? f.embedBlockedSetup : f.embedBlockedPublish}
        </div>
      ) : null}

      <CodeSnippetCard
        title={f.publicLink}
        code={publicUrl}
        copyLabel={f.copyLink}
        language="url"
      />

      <CodeSnippetCard
        title={f.embedCode}
        code={iframeCode}
        copyLabel={f.copyEmbed}
        language="html"
      />

      <CodeSnippetCard
        title={f.listenerCode}
        description={f.listenerDesc}
        code={listenerCode}
        copyLabel={f.copyCode}
        language="javascript"
      />



      {form.webhookEnabled && form.webhookUrl ? (
        <section className={cn(connectSectionClassName, 'space-y-2 p-5')}>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">{f.webhook}</h2>
          <p className="text-xs text-[var(--muted-foreground)]">{f.webhookActive}</p>
          <code dir="ltr" className="block truncate text-[11px] text-[var(--foreground)]">
            {form.webhookUrl}
          </code>
        </section>
      ) : (
        <section className={cn(connectSectionClassName, 'p-5')}>
          <p className="text-xs text-[var(--muted-foreground)]">{f.webhookHint}</p>
          <a
            href={getFormsDashboardUrl(`/app/forms/${form.id}/integrations`)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)]',
            )}
          >
            {f.configureWebhook}
            <ExternalLink className="size-3.5" />
          </a>
        </section>
      )}
    </div>
  );
}
