'use client';

import { useState } from 'react';
import { CircleCheck, Clock, Loader2, Plus, RefreshCw, ScrollText, XCircle } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardGrid } from '@/components/dashboard/dashboard-ui';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { CreateTemplateDialog } from '@/components/whatsapp/create-template-dialog';
import { WhatsappTemplatesDataTable } from '@/components/whatsapp/whatsapp-templates-data-table';
import {
  WhatsappEmptyState,
  whatsappBtnPrimary,
  whatsappBtnSecondary,
} from '@/components/whatsapp/whatsapp-ui';
import { useWhatsappAccounts, useWhatsappMutations, useWhatsappTemplates } from '@/hooks/use-whatsapp';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
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
    <div className="dashboard-section-stack">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted-foreground)]">{w.templatesPageDesc}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!accountId}
            onClick={() => setCreateOpen(true)}
            className={whatsappBtnPrimary}
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
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className={whatsappBtnPrimary}
                >
                  <Plus className="size-3.5" />
                  {w.createTemplate}
                </button>
              }
            />
          ) : (
            <WhatsappTemplatesDataTable data={templates} />
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
