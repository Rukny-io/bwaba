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
  'h-9 shrink-0 gap-1.5 rounded-lg px-3.5 text-sm font-medium';

export function CollectionsPageActions({
  addLabel,
  onAdd,
  onExport,
  exportDisabled = false,
  exportLabel = 'تصدير',
  className,
}: CollectionsPageActionsProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Button
        isDisabled={exportDisabled}
        onPress={onExport}
        className={cn(
          actionButtonBase,
          'bg-[var(--surface-secondary)] text-[var(--foreground)]',
          'hover:bg-[color-mix(in_srgb,var(--surface-secondary)_80%,var(--foreground)_8%)] disabled:opacity-45',
        )}
      >
        <Download className="size-3.5" strokeWidth={2} aria-hidden />
        <span>{exportLabel}</span>
      </Button>

      <Button
        onPress={onAdd}
        className={cn(
          actionButtonBase,
          'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90',
        )}
      >
        <Plus className="size-3.5" strokeWidth={2.25} aria-hidden />
        <span>{addLabel}</span>
      </Button>
    </div>
  );
}
