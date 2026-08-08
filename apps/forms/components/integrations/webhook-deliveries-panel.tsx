'use client';

import { useCallback, useEffect, useState } from 'react';
import { Skeleton } from '@heroui/react';
import {
  getWebhookDeliveries,
  type WebhookDeliveryItem,
} from '@/lib/integrations-api';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { formatFormDate } from '@/lib/forms-format';
import { formDetailCardSurfaceClass } from '@/lib/form-detail-styles';
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
    <SettingsSectionCard
      plain
      title="سجل التسليم"
      description="آخر محاولات إرسال Webhook لهذا النموذج"
    >
      {loading ? (
        <div className="flex flex-col gap-[12px]">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-[25px]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p
          className={cn(
            formDetailCardSurfaceClass,
            'text-center text-[12px] text-[var(--muted-foreground)]',
          )}
        >
          لا توجد محاولات تسليم بعد.
        </p>
      ) : (
        <ul className="flex flex-col gap-[12px]">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                formDetailCardSurfaceClass,
                'flex flex-wrap items-center justify-between gap-2',
              )}
            >
              <div className="min-w-0">
                <p className="text-[12px] text-[var(--muted-foreground)]">
                  {formatFormDate(item.createdAt)}
                </p>
                {item.errorMessage ? (
                  <p className="mt-0.5 truncate text-[12px] text-[var(--danger)]">
                    {item.errorMessage}
                  </p>
                ) : null}
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                  statusTone(item.status),
                )}
              >
                {item.status}
                {item.responseCode != null ? ` · ${item.responseCode}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SettingsSectionCard>
  );
}
