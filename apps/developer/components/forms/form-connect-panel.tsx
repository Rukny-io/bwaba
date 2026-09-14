'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { CodeSnippetCard } from '@/components/forms/code-snippet-card';
import { useLinkedFormDetail } from '@/hooks/use-app-forms';
import { appForms, appSettings } from '@/lib/app-routes';
import {
  buildEmbedListenerSnippet,
  buildIframeEmbedCode,
  getFormsDashboardUrl,
  getPublicFormUrl,
} from '@/lib/forms-urls';

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
        <Loader2 className="size-5 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (isError || !form) {
    return (
      <div className="rounded-2xl bg-[var(--surface)] px-6 py-12 text-center sm:rounded-3xl">
        <p className="text-sm text-[var(--muted-foreground)]">{f.connectNotFound}</p>
        <Link
          href={appForms(appId)}
          className="mt-4 inline-flex text-[13px] font-medium text-[var(--foreground)] underline underline-offset-2"
        >
          {f.backToForms}
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard-section-stack">
      <div>
        <Link
          href={appForms(appId)}
          className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          <BackArrow className="size-3.5" />
          {f.backToForms}
        </Link>
        <DashboardPageHeader
          className="mb-0 sm:mb-0"
          title={f.connectTitle}
          description={
            <p className="leading-relaxed text-[var(--muted-foreground)]">
              {form.title}
            </p>
          }
        />
      </div>

      {!form.embed.embedEnabled ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-[var(--surface-secondary)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
            {form.embed.requiresWebsiteOrOrigins
              ? f.embedBlockedSetup
              : f.embedBlockedPublish}
          </p>
          {form.embed.requiresWebsiteOrOrigins ? (
            <Link
              href={`${appSettings(appId)}/domains`}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] px-3.5 text-[12px] font-medium text-[var(--background)]"
            >
              {f.manageDomain}
            </Link>
          ) : null}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl bg-[var(--surface)] sm:rounded-3xl">
        <div className="px-4 py-3.5 sm:px-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {f.livePreview}
          </h2>
        </div>
        {form.embed.embedEnabled ? (
          <div className="mx-4 mb-4 overflow-hidden rounded-xl bg-[var(--surface-secondary)] sm:mx-5 sm:mb-5">
            <iframe
              title={form.title}
              src={getPublicFormUrl(form.slug, true)}
              className="block h-[min(640px,70vh)] w-full border-0 bg-[var(--background)]"
              loading="lazy"
              allow="clipboard-write"
            />
          </div>
        ) : (
          <p className="px-4 pb-4 text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:px-5 sm:pb-5">
            {f.previewUnavailable}
          </p>
        )}
      </section>

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
        <section className="space-y-2 rounded-2xl bg-[var(--surface)] px-4 py-4 sm:rounded-3xl sm:px-5">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {f.webhook}
          </h2>
          <p className="text-[12px] text-[var(--muted-foreground)]">
            {f.webhookActive}
          </p>
          <code
            dir="ltr"
            className="block truncate rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5 font-mono text-[12px] text-[var(--foreground)]"
          >
            {form.webhookUrl}
          </code>
        </section>
      ) : (
        <section className="rounded-2xl bg-[var(--surface)] px-4 py-4 sm:rounded-3xl sm:px-5">
          <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
            {f.webhookHint}
          </p>
          <a
            href={getFormsDashboardUrl(`/app/forms/${form.id}/integrations`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--foreground)] underline underline-offset-2"
          >
            {f.configureWebhook}
            <ExternalLink className="size-3.5 opacity-60" />
          </a>
        </section>
      )}
    </div>
  );
}
