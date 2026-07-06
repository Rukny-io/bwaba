'use client';

import { useCallback, useEffect, useState } from 'react';
import { Skeleton } from '@heroui/react';
import {
  getWebhookDeliveries,
  type WebhookDeliveryItem,
} from '@/lib/integrations-api';
import { formatFormDate } from '@/lib/forms-format';
import { cn } from '@/lib/utils';

interface WebhookDeliveriesPanelProps {
  formId: string;
}

function statusTone(status: string): string {
  if (status === 'success' || status === 'delivered') {
    return 'text-[var(--success)] bg-[var(--success)]/10';
  }
  if (status === 'queued' || status === 'pending') {
    return 'text-[var(--warning)] bg-[var(--warning)]/10';
  }
  return 'text-[var(--danger)] bg-[var(--danger)]/10';
}

export function WebhookDeliveriesPanel({ formId }: WebhookDeliveriesPanelProps) {
  const [items, setItems] = useState<WebhookDeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getWebhookDeliveries(formId, 10));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-[var(--foreground)]">
          سجل التسليم
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          آخر محاولات إرسال Webhook لهذا النموذج.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-xs text-[var(--muted-foreground)]">
          لا توجد محاولات تسليم بعد.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)]/70 bg-[var(--surface-secondary)]/30 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-xs text-[var(--muted-foreground)]">
                  {formatFormDate(item.createdAt)}
                </p>
                {item.errorMessage ? (
                  <p className="mt-0.5 truncate text-xs text-[var(--danger)]">
                    {item.errorMessage}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {item.responseCode != null ? (
                  <span
                    className="text-[11px] tabular-nums text-[var(--muted-foreground)]"
                    dir="ltr"
                  >
                    {item.responseCode}
                    {item.latencyMs != null ? ` · ${item.latencyMs}ms` : ''}
                  </span>
                ) : null}
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    statusTone(item.status),
                  )}
                >
                  {item.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
