'use client';

import { ChevronDown } from 'lucide-react';
import { Input } from '@heroui/react';
import { orderPillButtonClass } from '@/components/orders/order-pill-button';
import { useTranslations } from '@/lib/i18n';
import type { OrderPaymentFilter } from '@/lib/orders/types';
import { cn } from '@/lib/utils';

export type OrdersAdvancedFilters = {
  paymentFilter: OrderPaymentFilter;
  startDate: string;
  endDate: string;
};

interface OrdersAdvancedSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: OrdersAdvancedFilters;
  onChange: (next: OrdersAdvancedFilters) => void;
  onReset: () => void;
}

export function OrdersAdvancedSearch({
  open,
  onOpenChange,
  filters,
  onChange,
  onReset,
}: OrdersAdvancedSearchProps) {
  const { t } = useTranslations();
  const paymentFilters: { id: OrderPaymentFilter; label: string }[] = [
    { id: 'all', label: t('orders.paymentAll') },
    { id: 'PAID', label: t('orders.paymentPaid') },
    { id: 'UNPAID', label: t('orders.paymentUnpaid') },
  ];

  const activeCount = [
    filters.paymentFilter !== 'all',
    Boolean(filters.startDate),
    Boolean(filters.endDate),
  ].filter(Boolean).length;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        aria-expanded={open}
      >
        {t('orders.advancedSearch')}
        {activeCount > 0 ? (
          <span className="rounded-full bg-[var(--foreground)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--background)]">
            {activeCount}
          </span>
        ) : null}
        <ChevronDown
          className={cn('size-3.5 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="flex min-w-0 flex-col gap-3 rounded-lg bg-[var(--surface-secondary)]/70 p-3 sm:p-4">
          <div className="flex flex-wrap gap-2">
            {paymentFilters.map((filter) => {
              const selected = filters.paymentFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() =>
                    onChange({ ...filters, paymentFilter: filter.id })
                  }
                  className={cn(
                    orderPillButtonClass,
                    selected &&
                      'bg-[var(--foreground)] text-[var(--background)] hover:opacity-100',
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-[12px] font-medium text-[var(--muted-foreground)]">
                {t('orders.dateFrom')}
              </span>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(event) =>
                  onChange({ ...filters, startDate: event.target.value })
                }
                className="rounded-lg shadow-none"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="text-[12px] font-medium text-[var(--muted-foreground)]">
                {t('orders.dateTo')}
              </span>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(event) =>
                  onChange({ ...filters, endDate: event.target.value })
                }
                className="rounded-lg shadow-none"
              />
            </label>
          </div>

          {activeCount > 0 ? (
            <button
              type="button"
              onClick={onReset}
              className="w-fit text-[12px] font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
            >
              {t('orders.clearAdvanced')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
