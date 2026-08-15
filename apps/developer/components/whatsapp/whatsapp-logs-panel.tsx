'use client';

import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Loader2, MessageSquare } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { DashboardGrid } from '@/components/dashboard/dashboard-ui';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import { WhatsappLogsDataTable } from '@/components/whatsapp/whatsapp-logs-data-table';
import { WhatsappEmptyState } from '@/components/whatsapp/whatsapp-ui';
import { useMessageLogs } from '@/hooks/use-message-logs';
import { cn } from '@/lib/utils';

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function WhatsappLogsPanel({ phoneId }: { phoneId?: string }) {
  const t = useTranslations();
  const w = t.whatsapp;
  const [direction, setDirection] = useState<string>('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMessageLogs({
    direction: direction || undefined,
    page,
    phoneId,
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  const pageStats = useMemo(() => {
    const outbound = logs.filter((l) => l.direction === 'OUTBOUND').length;
    const inbound = logs.filter((l) => l.direction === 'INBOUND').length;
    const failed = logs.filter((l) => l.status === 'FAILED').length;
    return { outbound, inbound, failed };
  }, [logs]);

  return (
    <div className="dashboard-section-stack">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-[var(--muted-foreground)]">{w.logsPageDesc}</p>
        <div className="flex flex-wrap gap-1">
          {(['', 'OUTBOUND', 'INBOUND'] as const).map((d) => (
            <button
              key={d || 'all'}
              type="button"
              onClick={() => {
                setDirection(d);
                setPage(1);
              }}
              className={cn(
                'h-9 rounded-xl px-3.5 text-[13px] font-medium transition-colors',
                direction === d
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
            >
              {d === '' ? w.logsFilterAll : d === 'OUTBOUND' ? w.outbound : w.inbound}
            </button>
          ))}
        </div>
      </div>

      <DashboardGrid>
        <DashboardMetricCard
          icon={MessageSquare}
          label={w.metricLogsTotal}
          value={isLoading ? '…' : formatCount(pagination?.total ?? logs.length)}
          comparisonPrimary={w.metricLogsTotalHint}
        />
        <DashboardMetricCard
          icon={ArrowUpRight}
          label={w.outbound}
          value={isLoading ? '…' : formatCount(pageStats.outbound)}
          comparisonPrimary={w.metricLogsPageHint}
        />
        <DashboardMetricCard
          icon={ArrowDownLeft}
          label={w.inbound}
          value={isLoading ? '…' : formatCount(pageStats.inbound)}
          comparisonPrimary={w.metricLogsPageHint}
        />
      </DashboardGrid>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : !logs.length ? (
        <WhatsappEmptyState icon={MessageSquare} title={w.noLogs} description={w.logsEmptyDesc} />
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
