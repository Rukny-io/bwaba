'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Download,
  ExternalLink,
  Link2,
  Loader2,
  Plus,
  Unlink,
} from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import {
  useAvailableForms,
  useFormsAppSummary,
  useFormsMutations,
  useLinkedForms,
} from '@/hooks/use-app-forms';
import { useSidebarProductsOptional } from '@/hooks/use-sidebar-products';
import { appFormConnect, appSettings } from '@/lib/app-routes';
import { DOCUMENTATION_BASE } from '@/lib/documentation-nav';
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

  const emptyMessage = isError
    ? f.linkFormsLoadError
    : blockedElsewhere.length > 0 && linkable.length === 0
      ? f.noFormsLinkedElsewhere
      : f.noFormsToLink;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-[var(--surface)] sm:rounded-3xl"
        role="dialog"
        aria-modal
        aria-labelledby="link-form-title"
      >
        <div className="px-5 py-4">
          <h2
            id="link-form-title"
            className="text-sm font-semibold text-[var(--foreground)]"
          >
            {f.linkFormTitle}
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
            {f.linkFormDesc}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
            {f.linkFormNote}
          </p>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-2 pb-2">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : linkable.length === 0 ? (
            <div className="space-y-4 px-3 py-6 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">{emptyMessage}</p>
              {!isError && blockedElsewhere.length === 0 ? (
                <a
                  href={getFormsCreateUrl(appId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--foreground)] px-4 text-[13px] font-medium text-[var(--background)]"
                >
                  <Plus className="size-3.5" />
                  {f.createForm}
                </a>
              ) : null}
              {blockedElsewhere.length > 0 ? (
                <ul className="space-y-1.5 text-start">
                  {blockedElsewhere.map((form) => (
                    <li
                      key={form.id}
                      className="rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5 opacity-70"
                    >
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {form.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                        {f.formLinkedElsewhere}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-0.5">
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
                          appToast.error(
                            getApiErrorMessage(error, f.linkFailed),
                          );
                        },
                      });
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-start transition-colors hover:bg-[var(--surface-secondary)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {form.title}
                      </p>
                      <p
                        className="mt-0.5 font-mono text-[11px] text-[var(--muted-foreground)]"
                        dir="ltr"
                      >
                        {form.slug}
                      </p>
                    </div>
                    <Plus className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[13px] font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DomainSetupStrip({ appId }: { appId: string }) {
  const f = useTranslations().forms;
  const { data: summary, isLoading } = useFormsAppSummary(appId);
  const domain = summary?.websiteOrigin ?? null;

  if (isLoading) return null;

  if (domain) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl bg-[var(--surface-secondary)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-[var(--muted-foreground)]">
            {f.embedAllowedDomain}
          </p>
          <code
            dir="ltr"
            className="mt-0.5 block truncate font-mono text-[13px] text-[var(--foreground)]"
          >
            {domain}
          </code>
        </div>
        <p className="shrink-0 text-[12px] text-[var(--muted-foreground)]">
          {f.embedDomainReady}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[var(--surface-secondary)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
        {f.embedDomainMissing}
      </p>
      <Link
        href={`${appSettings(appId)}/domains`}
        className="inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] px-3.5 text-[12px] font-medium text-[var(--background)] transition-opacity hover:opacity-90"
      >
        {f.manageDomain}
      </Link>
    </div>
  );
}

function SummaryLine({
  linked,
  published,
  submissions,
  views,
  loading,
}: {
  linked: number;
  published: number;
  submissions: number;
  views: number;
  loading: boolean;
}) {
  const f = useTranslations().forms;
  if (loading) return null;

  return (
    <p className="text-[12px] text-[var(--muted-foreground)]">
      {formatCount(linked)} {f.metricLinked.toLowerCase()}
      {' · '}
      {formatCount(published)} {f.metricPublished.toLowerCase()}
      {' · '}
      {formatCount(submissions)} {f.submissions}
      {' · '}
      {formatCount(views)} {f.views}
    </p>
  );
}

export function FormsHub({ appId }: { appId: string }) {
  const t = useTranslations();
  const f = t.forms;
  const p = t.products;
  const statusLabels = (f.status ?? {}) as Record<string, string>;
  const [linkOpen, setLinkOpen] = useState(false);
  const products = useSidebarProductsOptional();
  const formsInstalled = products?.isInstalled('forms') ?? false;
  const productsReady = products?.hydrated ?? true;

  const { data: summary, isLoading: summaryLoading } = useFormsAppSummary(
    appId,
    { enabled: productsReady && formsInstalled },
  );
  const { data: linked, isLoading: linkedLoading } = useLinkedForms(appId, {
    enabled: productsReady && formsInstalled,
  });
  const { unlinkMutation } = useFormsMutations(appId);

  if (products && productsReady && !formsInstalled) {
    const formsName = p.items?.forms?.name ?? f.title;
    return (
      <div className="dashboard-section-stack">
        <DashboardPageHeader
          title={p.installRequiredTitle}
          description={p.installRequiredDesc.replace('{name}', formsName)}
        />
        <div className="rounded-2xl bg-[var(--surface)] px-6 py-10 text-center sm:rounded-3xl">
          <p className="mx-auto max-w-md text-[13px] leading-relaxed text-[var(--muted-foreground)]">
            {p.items?.forms?.desc ?? f.subtitle}
          </p>
          <button
            type="button"
            disabled={products.isInstalling}
            onClick={() => {
              void products.install('forms').then(
                () => appToast.success(p.installSuccess),
                (error) => appToast.fromError(error, p.installFailed),
              );
            }}
            className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--foreground)] px-4 text-[13px] font-medium text-[var(--background)] disabled:opacity-60"
          >
            {products.isInstalling ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            {p.install} {formsName}
          </button>
        </div>
      </div>
    );
  }

  const hasLinked = Boolean(linked?.length);

  return (
    <div className="dashboard-section-stack">
      <DashboardPageHeader
        className="mb-5 pt-2 sm:mb-6 sm:pt-3"
        title={f.title}
        description={<p className="max-w-2xl leading-relaxed">{f.subtitle}</p>}
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => setLinkOpen(true)}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--foreground)] px-3.5 text-[13px] font-medium text-[var(--background)] transition-opacity hover:opacity-90 sm:flex-none"
            >
              <Link2 className="size-3.5" />
              {f.linkForm}
            </button>
            <a
              href={getFormsCreateUrl(appId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] sm:flex-none"
            >
              <Plus className="size-3.5" />
              {f.createForm}
            </a>
            <a
              href={getFormsDashboardUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-3.5 text-[13px] font-medium text-[var(--foreground)] transition-opacity hover:opacity-90 sm:flex-none"
            >
              {f.openDashboard}
              <ExternalLink className="size-3.5 opacity-60" />
            </a>
            <Link
              href={`${DOCUMENTATION_BASE}/forms`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)] sm:flex-none"
            >
              <BookOpen className="size-3.5 opacity-70" />
              {f.documentation}
            </Link>
          </div>
        }
      />

      <DomainSetupStrip appId={appId} />

      {hasLinked || summaryLoading ? (
        <SummaryLine
          linked={summary?.linkedCount ?? 0}
          published={summary?.publishedCount ?? 0}
          submissions={summary?.totalSubmissions ?? 0}
          views={summary?.totalViews ?? 0}
          loading={summaryLoading}
        />
      ) : null}

      <section className="space-y-3">
        {hasLinked ? (
          <h2 className="text-[13px] font-semibold text-[var(--foreground)]">
            {f.linkedForms}
          </h2>
        ) : null}

        {linkedLoading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="size-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : !hasLinked ? (
          <div className="rounded-2xl bg-[var(--surface)] px-6 py-12 text-center sm:rounded-3xl">
            <p className="mx-auto max-w-sm text-[14px] leading-relaxed text-[var(--muted-foreground)]">
              {f.emptyLinked}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setLinkOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--foreground)] px-4 text-[13px] font-medium text-[var(--background)]"
              >
                <Link2 className="size-3.5" />
                {f.linkForm}
              </button>
              <a
                href={getFormsCreateUrl(appId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-4 text-[13px] font-medium text-[var(--foreground)]"
              >
                <Plus className="size-3.5" />
                {f.createForm}
              </a>
            </div>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-2xl bg-[var(--surface)] sm:rounded-3xl">
            {linked!.map((form, index) => (
              <li
                key={form.id}
                className={cn(
                  'flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5',
                  index > 0 &&
                    'border-t border-[color-mix(in_srgb,var(--border)_70%,transparent)]',
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-[14px] font-semibold text-[var(--foreground)]">
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
                  <p
                    className="mt-1 font-mono text-[11px] text-[var(--muted-foreground)]"
                    dir="ltr"
                  >
                    {form.slug}
                  </p>
                  <p className="mt-1 text-[12px] text-[var(--muted-foreground)]">
                    {formatCount(form.submissionCount)} {f.submissions}
                    {' · '}
                    {formatCount(form.viewCount)} {f.views}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Link
                    href={appFormConnect(appId, form.id)}
                    className="inline-flex h-8 items-center rounded-full bg-[var(--foreground)] px-3.5 text-[12px] font-medium text-[var(--background)] transition-opacity hover:opacity-90"
                  >
                    {f.connectEmbed}
                  </Link>
                  <button
                    type="button"
                    disabled={unlinkMutation.isPending}
                    onClick={() => unlinkMutation.mutate(form.id)}
                    className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-[12px] font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--danger)]"
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

      <LinkFormDialog
        appId={appId}
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
      />
    </div>
  );
}
