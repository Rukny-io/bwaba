'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardGrid } from '@/components/dashboard/dashboard-ui';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { WhatsappLogsDataTable } from '@/components/whatsapp/whatsapp-logs-data-table';
import { WhatsappEmptyState } from '@/components/whatsapp/whatsapp-ui';
import { useMessageLogs } from '@/hooks/use-message-logs';

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function WhatsappPhoneErrorsPanel({ phoneId }: { phoneId: string }) {
  const w = useTranslations().whatsapp;
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMessageLogs({
    status: 'FAILED',
    page,
    phoneId,
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  const withCode = useMemo(
    () => logs.filter((l) => l.errorCode || l.errorMessage).length,
    [logs],
  );

  return (
    <div className="dashboard-section-stack">
      <p className="text-[13px] text-[var(--muted-foreground)]">{w.errorsPageDesc}</p>

      <DashboardGrid>
        <DashboardMetricCard
          icon={AlertTriangle}
          label={w.metricErrorsTotal}
          value={isLoading ? '…' : formatCount(pagination?.total ?? logs.length)}
          comparisonPrimary={w.metricErrorsTotalHint}
        />
        <DashboardMetricCard
          icon={AlertTriangle}
          label={w.metricErrorsWithCode}
          value={isLoading ? '…' : formatCount(withCode)}
          comparisonPrimary={w.metricErrorsWithCodeHint}
        />
      </DashboardGrid>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : !logs.length ? (
        <WhatsappEmptyState icon={AlertTriangle} title={w.noErrors} description={w.errorsEmptyDesc} />
      ) : (
        <WhatsappLogsDataTable
          data={logs}
          page={page}
          totalPages={pagination?.totalPages ?? 1}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
