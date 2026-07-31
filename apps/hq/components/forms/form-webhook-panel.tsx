'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Loader2, Webhook } from 'lucide-react';
import { Chip } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type { FormWebhookHealthResponse } from '@/lib/types/forms';
import { formatFormDateTime } from '@/lib/forms-format';
import { formatNumber } from '@/lib/dashboard-format';
import { detailPanelClassName } from '@/components/ui/pill-tab';

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5">
      <p className="text-[10px] font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-[var(--foreground)]" dir="ltr">
        {value}
      </p>
    </div>
  );
}

function statusChipColor(
  status: string,
): 'success' | 'danger' | 'warning' | 'default' {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'danger';
  return 'warning';
}

export function FormWebhookPanel({
  formId,
  webhookEnabled,
}: {
  formId: string;
  webhookEnabled: boolean;
}) {
  const [health, setHealth] = useState<FormWebhookHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hqApi.getFormWebhookHealth(formId);
      setHealth(data);
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load webhook health',
      );
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !health) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="size-7 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!health) return null;

  if (!webhookEnabled) {
    return (
      <section className={detailPanelClassName}>
        <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/50 px-4 py-3">
          <Webhook className="mt-0.5 size-4 shrink-0 text-[var(--muted-foreground)]" />
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">Webhooks disabled</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              This form does not have outbound webhooks enabled. Delivery history appears here
              once configured in the Forms app.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const stats = health.stats;
  const hasFailures = stats.failedCount > 0;

  return (
    <div className="space-y-4">
      <section className={detailPanelClassName}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">Webhook health</h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Last {health.periodDays} days · read-only delivery telemetry
            </p>
          </div>
          {hasFailures ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--danger)]/10 px-2.5 py-1 text-[11px] font-medium text-[var(--danger)]">
              <AlertTriangle className="size-3.5" />
              Failures detected
            </span>
          ) : stats.totalAttempts > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success)]/10 px-2.5 py-1 text-[11px] font-medium text-[var(--success)]">
              <CheckCircle2 className="size-3.5" />
              Healthy
            </span>
          ) : null}
        </div>

        <div className="mb-4 rounded-xl bg-[var(--surface-secondary)] px-3 py-2 text-xs" dir="ltr">
          <p className="text-[var(--muted-foreground)]">URL</p>
          <p className="mt-0.5 break-all font-mono text-[var(--foreground)]">
            {health.webhookUrl || '—'}
          </p>
          {health.webhookEvents.length > 0 ? (
            <p className="mt-2 text-[var(--muted-foreground)]">
              Events: {health.webhookEvents.join(', ')}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Attempts (7d)" value={formatNumber(stats.totalAttempts)} />
          <StatTile
            label="Success rate"
            value={stats.successRate != null ? `${stats.successRate}%` : '—'}
          />
          <StatTile
            label="Failure rate"
            value={stats.failureRate != null ? `${stats.failureRate}%` : '—'}
          />
          <StatTile
            label="Avg latency"
            value={stats.avgLatencyMs != null ? `${stats.avgLatencyMs} ms` : '—'}
          />
        </div>
      </section>

      <section className={detailPanelClassName}>
        <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          Recent deliveries
        </h3>
        {health.recentDeliveries.length === 0 ? (
          <p className="text-xs text-[var(--muted-foreground)]">No delivery attempts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                  <th className="pb-2 pe-3 font-medium">Time</th>
                  <th className="pb-2 pe-3 font-medium">Status</th>
                  <th className="pb-2 pe-3 font-medium">Code</th>
                  <th className="pb-2 pe-3 font-medium">Latency</th>
                  <th className="pb-2 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {health.recentDeliveries.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)]/50 last:border-0">
                    <td
                      className="whitespace-nowrap py-2.5 pe-3 text-[var(--muted-foreground)]"
                      dir="ltr"
                    >
                      {formatFormDateTime(row.createdAt)}
                    </td>
                    <td className="py-2.5 pe-3">
                      <Chip color={statusChipColor(row.status)} size="sm" variant="soft">
                        {row.status}
                      </Chip>
                    </td>
                    <td className="py-2.5 pe-3 tabular-nums" dir="ltr">
                      {row.responseCode ?? '—'}
                    </td>
                    <td className="py-2.5 pe-3 tabular-nums" dir="ltr">
                      {row.latencyMs != null ? `${row.latencyMs} ms` : '—'}
                    </td>
                    <td
                      className="max-w-[12rem] truncate py-2.5 text-[var(--muted-foreground)]"
                      title={row.errorMessage ?? undefined}
                    >
                      {row.errorMessage || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-[11px] text-[var(--muted-foreground)]">
        Need to change webhook settings?{' '}
        <Link href={`/app/forms/${formId}?tab=settings`} className="underline">
          Open form settings
        </Link>{' '}
        or use Open in Forms from the header.
      </p>
    </div>
  );
}
