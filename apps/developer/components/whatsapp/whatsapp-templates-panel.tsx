'use client';

import Link from 'next/link';
import { CircleCheck, Clock, Loader2, Plus, RefreshCw, ScrollText, XCircle } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardGrid } from '@/components/dashboard/dashboard-ui';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { WhatsappTemplatesDataTable } from '@/components/whatsapp/whatsapp-templates-data-table';
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

  const approvedCount =
    templates?.filter((t) => t.status.toUpperCase() === 'APPROVED').length ?? 0;
  const pendingCount =
    templates?.filter((t) => t.status.toUpperCase() === 'PENDING').length ?? 0;
  const rejectedCount =
    templates?.filter((t) => t.status.toUpperCase() === 'REJECTED').length ?? 0;

  return (
    <div className="dashboard-section-stack">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted-foreground)]">
          {w.templatesPhoneScopeHint}
        </p>
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
      </div>

      {!accountId ? (
        <WhatsappEmptyState icon={ScrollText} title={w.templatesNeedAccount} />
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
            <WhatsappTemplatesDataTable
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
      )}
    </div>
  );
}
