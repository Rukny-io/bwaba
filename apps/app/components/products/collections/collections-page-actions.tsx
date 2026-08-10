'use client';

import { Download, Plus } from 'lucide-react';
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils';

interface CollectionsPageActionsProps {
  addLabel: string;
  onAdd: () => void;
  onExport: () => void;
  exportDisabled?: boolean;
  exportLabel?: string;
  className?: string;
}

const actionButtonBase =
  'h-10 shrink-0 gap-2 rounded-xl px-4 text-[13px] font-semibold sm:text-[14px]';

export function CollectionsPageActions({
  addLabel,
  onAdd,
  onExport,
  exportDisabled = false,
  exportLabel = 'تصدير',
  className,
}: CollectionsPageActionsProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-2', className)}>
      <Button
        isDisabled={exportDisabled}
        onPress={onExport}
        className={cn(
          actionButtonBase,
          'border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]',
          'hover:bg-[var(--surface-secondary)] disabled:opacity-45',
        )}
      >
        <Download className="size-4" strokeWidth={2} aria-hidden />
        <span>{exportLabel}</span>
      </Button>

      <Button
        onPress={onAdd}
        className={cn(
          actionButtonBase,
          'font-bold shadow-[0_4px_14px_rgba(59,130,246,0.22)]',
          'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95',
        )}
      >
        <Plus className="size-4" strokeWidth={2.5} aria-hidden />
        <span>{addLabel}</span>
      </Button>
    </div>
  );
}
