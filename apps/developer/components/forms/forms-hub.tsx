'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Inbox, Link2, Loader2, Plus, Unlink, CircleCheck } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { DashboardGrid } from '@/components/dashboard/dashboard-ui';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import {
  useAvailableForms,
  useFormsAppSummary,
  useFormsMutations,
  useLinkedForms,
} from '@/hooks/use-app-forms';
import { appFormConnect, appForms, appSettings } from '@/lib/app-routes';
import { getFormsCreateUrl, getFormsDashboardUrl } from '@/lib/forms-urls';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function StatusPill({ status, label }: { status: string; label: string }) {
  const isPublished = status === 'PUBLISHED';
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
        isPublished
          ? 'bg-[color-mix(in_srgb,var(--success)_14%,var(--background))] text-[var(--success)]'
          : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
      )}
    >
      {label}
    </span>
  );
}

function LinkFormDialog({
  appId,
  open,
  onClose,
}: {
  appId: string;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations();
  const f = t.forms;
  const { data: available, isLoading, isError } = useAvailableForms(appId, open);
  const { linkMutation } = useFormsMutations(appId);

  if (!open) return null;

  const forms = available ?? [];
  const linkable = forms.filter((form) => !form.isLinked && !form.linkedElsewhere);
  const blockedElsewhere = forms.filter((form) => form.linkedElsewhere);

  const emptyMessage =
    isError
      ? f.linkFormsLoadError
      : blockedElsewhere.length > 0 && linkable.length === 0
        ? f.noFormsLinkedElsewhere
        : f.noFormsToLink;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="dashboard-card max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl sm:rounded-3xl"
        role="dialog"
        aria-modal
        aria-labelledby="link-form-title"
      >
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 id="link-form-title" className="text-sm font-semibold text-[var(--foreground)]">
            {f.linkFormTitle}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
            {f.linkFormDesc}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted-foreground)]/80">
            {f.linkFormNote}
          </p>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : linkable.length === 0 ? (
            <div className="space-y-4 px-2 py-6 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">{emptyMessage}</p>
              {!isError && blockedElsewhere.length === 0 ? (
                <a
                  href={getFormsCreateUrl(appId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 text-xs font-semibold text-[var(--primary-foreground)]"
                >
                  <Plus className="size-3.5" />
                  {f.createForm}
                </a>
              ) : null}
              {blockedElsewhere.length > 0 ? (
                <ul className="space-y-2 text-start">
                  {blockedElsewhere.map((form) => (
                    <li
                      key={form.id}
                      className="rounded-2xl bg-[var(--surface-secondary)] px-3 py-2.5 opacity-70"
                    >
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {form.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                        {f.formLinkedElsewhere}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-2">
              {linkable.map((form) => (
                <li key={form.id}>
                  <button
                    type="button"
                    disabled={linkMutation.isPending}
                    onClick={() => {
                      linkMutation.mutate(form.id, {
                        onSuccess: () => {
                          appToast.success(f.linkSuccess);
                          onClose();
                        },
                        onError: (error) => {
                          appToast.error(getApiErrorMessage(error, f.linkFailed));
                        },
                      });
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-start transition-colors hover:bg-[var(--surface-secondary)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {form.title}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-[var(--muted-foreground)]">
                        {form.slug}
                      </p>
                    </div>
                    <Plus className="size-4 shrink-0 text-[var(--primary)]" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)]"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmbedSecurityCard({ appId }: { appId: string }) {
  const f = useTranslations().forms;
  const { data: summary } = useFormsAppSummary(appId);
  const domain = summary?.websiteOrigin ?? null;

  return (
    <section className="space-y-4 rounded-2xl bg-[var(--surface)] p-5 shadow-none sm:rounded-3xl">
      <div>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">{f.embedSecurityTitle}</h2>
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
          {f.embedSecurityDesc}
        </p>
      </div>

      {domain ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--foreground)]">{f.embedAllowedDomain}</p>
          <code
            dir="ltr"
            className="block rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5 font-mono text-[12px] text-[var(--foreground)]"
          >
            {domain}
          </code>
          <p className="text-xs text-[var(--muted-foreground)]">{f.embedDomainReady}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[color-mix(in_srgb,var(--warning)_35%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_8%,var(--background))] px-4 py-3">
          <p className="text-xs leading-relaxed text-[var(--foreground)]">{f.embedDomainMissing}</p>
          <Link
            href={`${appSettings(appId)}/domains`}
            className="mt-3 inline-flex h-8 items-center rounded-full bg-[var(--primary)] px-4 text-xs font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          >
            {f.manageDomain}
          </Link>
        </div>
      )}
    </section>
  );
}

export function FormsHub({ appId }: { appId: string }) {
  const t = useTranslations();
  const f = t.forms;
  const statusLabels = (f.status ?? {}) as Record<string, string>;
  const [linkOpen, setLinkOpen] = useState(false);

  const { data: summary, isLoading: summaryLoading } = useFormsAppSummary(appId);
  const { data: linked, isLoading: linkedLoading } = useLinkedForms(appId);
  const { unlinkMutation } = useFormsMutations(appId);

  const placeholder = '…';

  return (
    <div className="dashboard-section-stack">
      <DashboardPageHeader
        eyebrow={
          <p className="font-mono text-[11px] text-[var(--muted-foreground)]">{appId}</p>
        }
        title={f.title}
        description={f.subtitle}
        actions={
          <div className="flex flex-wrap gap-2">
            <a
              href={getFormsCreateUrl(appId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 text-xs font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
            >
              <Plus className="size-3.5" />
              {f.createForm}
            </a>
            <a
              href={getFormsDashboardUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-full bg-[var(--surface-secondary)] px-4 text-xs font-semibold text-[var(--foreground)] transition-opacity hover:opacity-90"
            >
              {f.openDashboard}
            </a>
          </div>
        }
      />

      <DashboardGrid>
        <DashboardMetricCard
          icon={Link2}
          label={f.metricLinked}
          value={summaryLoading ? placeholder : formatCount(summary?.linkedCount ?? 0)}
          comparisonPrimary={f.metricLinkedHint}
        />
        <DashboardMetricCard
          icon={CircleCheck}
          label={f.metricPublished}
          value={summaryLoading ? placeholder : formatCount(summary?.publishedCount ?? 0)}
          comparisonPrimary={f.metricPublishedHint}
        />
        <DashboardMetricCard
          icon={Inbox}
          label={f.metricSubmissions}
          value={summaryLoading ? placeholder : formatCount(summary?.totalSubmissions ?? 0)}
          comparisonPrimary={f.metricTotalHint}
        />
        <DashboardMetricCard
          icon={Eye}
          label={f.metricViews}
          value={summaryLoading ? placeholder : formatCount(summary?.totalViews ?? 0)}
          comparisonPrimary={f.metricTotalHint}
        />
      </DashboardGrid>

      <EmbedSecurityCard appId={appId} />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">{f.linkedForms}</h2>
          <button
            type="button"
            onClick={() => setLinkOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--foreground)] transition-opacity hover:opacity-90"
          >
            <Plus className="size-3.5" />
            {f.linkForm}
          </button>
        </div>

        {linkedLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : !linked?.length ? (
          <div className="dashboard-card rounded-2xl p-8 text-center sm:rounded-3xl">
            <p className="text-sm text-[var(--muted-foreground)]">{f.emptyLinked}</p>
            <button
              type="button"
              onClick={() => setLinkOpen(true)}
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 text-xs font-semibold text-[var(--primary-foreground)]"
            >
              <Plus className="size-3.5" />
              {f.linkForm}
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {linked.map((form) => (
              <li
                key={form.id}
                className="dashboard-card flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-[var(--foreground)]">
                      {form.title}
                    </h3>
                    <StatusPill
                      status={form.status}
                      label={statusLabels[form.status] ?? form.status}
                    />
                    {form.embedReady ? (
                      <span className="rounded-full bg-[color-mix(in_srgb,var(--success)_12%,var(--background))] px-2 py-0.5 text-[10px] font-semibold text-[var(--success)]">
                        {f.embedReady}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-[var(--muted-foreground)]">
                    {form.slug}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {formatCount(form.submissionCount)} {f.submissions} ·{' '}
                    {formatCount(form.viewCount)} {f.views}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={appFormConnect(appId, form.id)}
                    className="inline-flex h-8 items-center rounded-full bg-[var(--primary)] px-3 text-xs font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
                  >
                    {f.connectEmbed}
                  </Link>
                  <button
                    type="button"
                    disabled={unlinkMutation.isPending}
                    onClick={() => unlinkMutation.mutate(form.id)}
                    className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--danger)]"
                  >
                    <Unlink className="size-3.5" />
                    {f.unlink}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <LinkFormDialog appId={appId} open={linkOpen} onClose={() => setLinkOpen(false)} />
    </div>
  );
}
