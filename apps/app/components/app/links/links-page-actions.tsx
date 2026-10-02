'use client';

import { FolderPlus, Plus } from 'lucide-react';
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils';

interface LinksPageActionsProps {
  onAdd: () => void;
  onAddGroup?: () => void;
  className?: string;
}

const actionButtonBase =
  'h-10 shrink-0 gap-2 rounded-xl px-4 text-sm font-semibold';

export function LinksPageActions({
  onAdd,
  onAddGroup,
  className,
}: LinksPageActionsProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-2', className)}>
      {onAddGroup ? (
        <Button
          onPress={onAddGroup}
          variant="secondary"
          className={cn(actionButtonBase, 'border border-[var(--border)]')}
        >
          <FolderPlus className="size-4" strokeWidth={2} aria-hidden />
          <span>مجموعة جديدة</span>
        </Button>
      ) : null}
      <Button
        onPress={onAdd}
        className={cn(
          actionButtonBase,
          'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95',
        )}
      >
        <Plus className="size-4" strokeWidth={2.5} aria-hidden />
        <span>رابط جديد</span>
      </Button>
    </div>
  );
}
