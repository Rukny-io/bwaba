'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useMessageLogs } from '@/hooks/use-message-logs';
import { cn } from '@/lib/utils';

const cardClass =
  'rounded-2xl border border-[var(--border)] bg-[var(--surface)] sm:rounded-3xl';

export function WhatsappLogsPanel() {
  const w = useTranslations().whatsapp;
  const [direction, setDirection] = useState<string>('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMessageLogs({
    direction: direction || undefined,
    page,
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['', 'OUTBOUND', 'INBOUND'] as const).map((d) => (
          <button
            key={d || 'all'}
            type="button"
            onClick={() => {
              setDirection(d);
              setPage(1);
            }}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              direction === d
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'bg-[var(--surface-secondary)] text-[var(--foreground)]',
            )}
          >
            {d === '' ? 'All' : d === 'OUTBOUND' ? w.outbound : w.inbound}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
        </div>
      ) : !logs.length ? (
        <section className={cn(cardClass, 'p-8 text-center text-sm text-[var(--muted-foreground)]')}>
          {w.noLogs}
        </section>
      ) : (
        <>
          <div className={cn(cardClass, 'overflow-x-auto')}>
            <table className="w-full min-w-[36rem] text-start text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                  <th className="px-4 py-3 font-medium">{w.logDate}</th>
                  <th className="px-4 py-3 font-medium">{w.logDirection}</th>
                  <th className="px-4 py-3 font-medium">{w.logType}</th>
                  <th className="px-4 py-3 font-medium">{w.logRecipient}</th>
                  <th className="px-4 py-3 font-medium">{w.logStatus}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">{log.direction}</td>
                    <td className="px-4 py-3 text-xs">{log.messageType}</td>
                    <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                      {log.recipientNumber || log.senderNumber || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[var(--surface-secondary)] px-2 py-0.5 text-[10px] font-semibold">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-xs disabled:opacity-40"
              >
                ←
              </button>
              <span className="px-2 py-1 text-xs text-[var(--muted-foreground)]">
                {page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-xs disabled:opacity-40"
              >
                →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
