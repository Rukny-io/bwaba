'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { formatNumber } from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

function ToolbarButton({
  children,
  onClick,
  disabled,
  variant = 'default',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'shrink-0 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-40',
        variant === 'danger'
          ? 'text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]'
          : 'text-[var(--foreground)] hover:bg-[var(--surface-secondary)]',
      )}
    >
      {children}
    </button>
  );
}

interface OrdersSelectionBarProps {
  count: number;
  busy?: boolean;
  onClear: () => void;
  onMarkPaid: () => void;
  onMarkUnpaid: () => void;
  onAccept: () => void;
  onReject: () => void;
  onExportCsv: () => void;
  onDelete: () => void;
}

export function OrdersSelectionBar({
  count,
  busy,
  onClear,
  onMarkPaid,
  onMarkUnpaid,
  onAccept,
  onReject,
  onExportCsv,
  onDelete,
}: OrdersSelectionBarProps) {
  if (count <= 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      dir="rtl"
    >
      <div
        role="toolbar"
        aria-label={`تم تحديد ${formatNumber(count)}`}
        className="pointer-events-auto flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-1 rounded-[10px] border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--surface)] p-1 shadow-[0_3px_6px_rgba(0,0,0,0.06)]"
      >
        <span className="shrink-0 px-2 text-[12px] font-medium text-[var(--muted-foreground)]">
          تم تحديد {formatNumber(count)}
        </span>

        <span className="mx-0.5 h-5 w-px shrink-0 bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]" />

        <ToolbarButton onClick={onMarkPaid} disabled={busy}>
          تعيين مدفوع
        </ToolbarButton>
        <ToolbarButton onClick={onMarkUnpaid} disabled={busy}>
          تعيين غير مدفوع
        </ToolbarButton>
        <ToolbarButton onClick={onAccept} disabled={busy}>
          قبول
        </ToolbarButton>
        <ToolbarButton onClick={onReject} disabled={busy}>
          رفض
        </ToolbarButton>
        <ToolbarButton onClick={onExportCsv} disabled={busy}>
          تصدير CSV
        </ToolbarButton>
        <ToolbarButton onClick={onDelete} disabled={busy} variant="danger">
          حذف
        </ToolbarButton>

        <span className="mx-0.5 h-5 w-px shrink-0 bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]" />

        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          aria-label="إلغاء التحديد"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)] disabled:opacity-40"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
