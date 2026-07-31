'use client';

import { useState } from 'react';
import { CircleCheck, Clock, Loader2, Plus, RefreshCw, ScrollText, XCircle } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardGrid } from '@/components/dashboard/dashboard-ui';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { CreateTemplateDialog } from '@/components/whatsapp/create-template-dialog';
import { useWhatsappAccounts, useWhatsappMutations, useWhatsappTemplates } from '@/hooks/use-whatsapp';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function TemplateStatusBadge({ status }: { status: string }) {
  const w = useTranslations().whatsapp;
  const normalized = status.toUpperCase();
  const isApproved = normalized === 'APPROVED';
  const isPending = normalized === 'PENDING';
  const isRejected = normalized === 'REJECTED';

  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        isApproved &&
          'bg-[color-mix(in_srgb,var(--success)_14%,var(--background))] text-[var(--success)]',
        isPending &&
          'bg-[color-mix(in_srgb,var(--warning)_14%,var(--background))] text-[var(--warning)]',
        isRejected &&
          'bg-[color-mix(in_srgb,var(--danger)_14%,var(--background))] text-[var(--danger)]',
        !isApproved &&
          !isPending &&
          !isRejected &&
          'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
      )}
    >
      {isApproved
        ? w.templateStatusApproved
        : isPending
          ? w.templateStatusPending
          : isRejected
            ? w.templateStatusRejected
            : status}
    </span>
  );
}

export function WhatsappTemplatesPanel({ appId }: { appId: string }) {
  const w = useTranslations().whatsapp;
  const { data: accounts } = useWhatsappAccounts(appId);
  const accountId = accounts?.find((a) => a.status === 'ACTIVE')?.id;
  const { data: templates, isLoading } = useWhatsappTemplates(appId, accountId);
  const { syncTemplatesMutation, createTemplateMutation } = useWhatsappMutations(appId);
  const [createOpen, setCreateOpen] = useState(false);

  const approvedCount =
    templates?.filter((t) => t.status.toUpperCase() === 'APPROVED').length ?? 0;
  const pendingCount =
    templates?.filter((t) => t.status.toUpperCase() === 'PENDING').length ?? 0;
  const rejectedCount =
    templates?.filter((t) => t.status.toUpperCase() === 'REJECTED').length ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted-foreground)]">{w.templatesPageDesc}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!accountId}
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 text-xs font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="size-3.5" />
            {w.createTemplate}
          </button>
          <button
            type="button"
            disabled={!accountId || syncTemplatesMutation.isPending}
            onClick={() =>
              syncTemplatesMutation.mutate(accountId, {
                onSuccess: () => appToast.success(w.syncTemplatesDone),
                onError: (e) => appToast.error(getApiErrorMessage(e)),
              })
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-xs font-medium transition-colors hover:bg-[var(--surface-secondary)] disabled:opacity-50"
          >
            <RefreshCw
              className={cn('size-3.5', syncTemplatesMutation.isPending && 'animate-spin')}
            />
            {w.syncTemplates}
          </button>
        </div>
      </div>

      {!accountId ? (
        <section className="dashboard-card rounded-2xl p-8 text-center sm:rounded-3xl">
          <p className="text-sm text-[var(--muted-foreground)]">{w.templatesNeedAccount}</p>
        </section>
      ) : (
        <>
          <DashboardGrid>
            <DashboardMetricCard
              icon={ScrollText}
              label={w.metricTemplatesTotal}
              value={isLoading ? '…' : formatCount(templates?.length ?? 0)}
              comparisonPrimary={w.metricTemplatesTotalHint}
            />
            <DashboardMetricCard
              icon={CircleCheck}
              label={w.metricTemplatesApproved}
              value={isLoading ? '…' : formatCount(approvedCount)}
              comparisonPrimary={w.metricTemplatesApprovedHint}
            />
            <DashboardMetricCard
              icon={Clock}
              label={w.metricTemplatesPending}
              value={isLoading ? '…' : formatCount(pendingCount)}
              comparisonPrimary={w.metricTemplatesPendingHint}
            />
            <DashboardMetricCard
              icon={XCircle}
              label={w.metricTemplatesRejected}
              value={isLoading ? '…' : formatCount(rejectedCount)}
              comparisonPrimary={w.metricTemplatesRejectedHint}
            />
          </DashboardGrid>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
            </div>
          ) : !templates?.length ? (
            <section className="dashboard-card rounded-2xl p-8 text-center sm:rounded-3xl sm:p-10">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
                <ScrollText className="size-6" strokeWidth={1.6} />
              </div>
              <h2 className="mt-4 text-base font-semibold text-[var(--foreground)]">
                {w.noTemplates}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
                {w.noTemplatesDesc}
              </p>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)]"
              >
                <Plus className="size-4" />
                {w.createTemplate}
              </button>
            </section>
          ) : (
            <div className="dashboard-card overflow-hidden rounded-2xl sm:rounded-3xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[36rem] text-start text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-xs text-[var(--muted-foreground)]">
                      <th className="px-4 py-3 font-medium sm:px-5">{w.templateName}</th>
                      <th className="px-4 py-3 font-medium">{w.templateLanguage}</th>
                      <th className="px-4 py-3 font-medium">{w.templateCategory}</th>
                      <th className="px-4 py-3 font-medium">{w.templateStatus}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template) => (
                      <tr
                        key={template.id}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        <td className="px-4 py-3.5 font-mono text-xs sm:px-5" dir="ltr">
                          {template.name}
                        </td>
                        <td className="px-4 py-3.5">{template.language}</td>
                        <td className="px-4 py-3.5">{template.category}</td>
                        <td className="px-4 py-3.5">
                          <TemplateStatusBadge status={template.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <CreateTemplateDialog
        open={createOpen}
        accountId={accountId}
        isPending={createTemplateMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(payload) =>
          createTemplateMutation.mutate(payload, {
            onSuccess: () => {
              appToast.success(w.createTemplateSuccess);
              setCreateOpen(false);
            },
            onError: (e) => appToast.error(getApiErrorMessage(e, w.createTemplateFailed)),
          })
        }
      />
    </div>
  );
}
