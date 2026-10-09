'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CircleCheck, Clock, Loader2, Plus, RefreshCw, ScrollText, XCircle } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardGrid } from '@/components/dashboard/dashboard-ui';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { WhatsappTemplateLibraryPanel } from '@/components/whatsapp/whatsapp-template-library-panel';
import { WhatsappTemplatesCards } from '@/components/whatsapp/whatsapp-templates-cards';
import {
  WhatsappEmptyState,
  whatsappBtnPrimary,
  whatsappBtnSecondary,
} from '@/components/whatsapp/whatsapp-ui';
import { useWhatsappAccounts, useWhatsappMutations, useWhatsappTemplates } from '@/hooks/use-whatsapp';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { appWhatsappPhoneCreateTemplateHref } from '@/lib/whatsapp-phone-routes';
import { cn } from '@/lib/utils';

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function WhatsappTemplatesPanel({
  appId,
  phoneId,
  accountId: accountIdProp,
}: {
  appId: string;
  /** Public phone id — templates are managed inside this phone workspace. */
  phoneId: string;
  accountId?: string;
}) {
  const w = useTranslations().whatsapp;
  const { data: accounts } = useWhatsappAccounts(appId);
  const accountId =
    accountIdProp ?? accounts?.find((a) => a.status === 'ACTIVE')?.id;
  const { data: templates, isLoading } = useWhatsappTemplates(appId, accountId);
  const { syncTemplatesMutation, deleteTemplateMutation } = useWhatsappMutations(appId);

  const createHref = appWhatsappPhoneCreateTemplateHref(appId, phoneId);
  const [tab, setTab] = useState<'mine' | 'library'>('mine');

  const approvedCount =
    templates?.filter((t) => t.status.toUpperCase() === 'APPROVED').length ?? 0;
  const pendingCount =
    templates?.filter((t) => t.status.toUpperCase() === 'PENDING').length ?? 0;
  const rejectedCount =
    templates?.filter((t) => t.status.toUpperCase() === 'REJECTED').length ?? 0;

  return (
    <div className="dashboard-section-stack">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex gap-1 rounded-xl bg-[var(--surface-secondary)] p-1"
          role="tablist"
          aria-label={w.templatesTabsAria}
        >
          {(
            [
              { id: 'mine' as const, label: w.templatesTabMine },
              { id: 'library' as const, label: w.templatesTabLibrary },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors',
                tab === item.id
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {tab === 'mine' ? (
          <div className="flex flex-wrap gap-2">
            {accountId ? (
              <Link href={createHref} className={whatsappBtnPrimary}>
                <Plus className="size-3.5" />
                {w.createTemplate}
              </Link>
            ) : (
              <button type="button" disabled className={whatsappBtnPrimary}>
                <Plus className="size-3.5" />
                {w.createTemplate}
              </button>
            )}
            <button
              type="button"
              disabled={!accountId || syncTemplatesMutation.isPending}
              onClick={() =>
                syncTemplatesMutation.mutate(accountId, {
                  onSuccess: () => appToast.success(w.syncTemplatesDone),
                  onError: (e) => appToast.error(getApiErrorMessage(e)),
                })
              }
              className={whatsappBtnSecondary}
            >
              <RefreshCw
                className={cn('size-3.5', syncTemplatesMutation.isPending && 'animate-spin')}
              />
              {w.syncTemplates}
            </button>
          </div>
        ) : null}
      </div>

      {tab === 'library' ? (
        <WhatsappTemplateLibraryPanel
          appId={appId}
          accountId={accountId}
          onAdded={() => setTab('mine')}
        />
      ) : null}

      {tab === 'mine' && !accountId ? (
        <WhatsappEmptyState icon={ScrollText} title={w.templatesNeedAccount} />
      ) : tab === 'mine' ? (
        <>
          <p className="text-sm text-[var(--muted-foreground)]">
            {w.templatesPhoneScopeHint}
          </p>
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
            <WhatsappEmptyState
              icon={ScrollText}
              title={w.noTemplates}
              description={w.noTemplatesDesc}
              action={
                <Link href={createHref} className={whatsappBtnPrimary}>
                  <Plus className="size-3.5" />
                  {w.createTemplate}
                </Link>
              }
            />
          ) : (
            <WhatsappTemplatesCards
              data={templates}
              deletingName={
                deleteTemplateMutation.isPending
                  ? (deleteTemplateMutation.variables ?? null)
                  : null
              }
              onDelete={(name) =>
                deleteTemplateMutation.mutate(name, {
                  onSuccess: () => appToast.success(w.deleteTemplateDone),
                  onError: (e) =>
                    appToast.error(getApiErrorMessage(e, w.deleteTemplateFailed)),
                })
              }
            />
          )}
        </>
      ) : null}
    </div>
  );
}
