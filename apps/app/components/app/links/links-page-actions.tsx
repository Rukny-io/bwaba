'use client';

import { FolderPlus, Plus } from 'lucide-react';
import { Button } from '@heroui/react';
import { linksActionButtonClass } from '@/components/app/links/links-interaction';
import { cn } from '@/lib/utils';

interface LinksPageActionsProps {
  onAdd: () => void;
  onAddGroup?: () => void;
  className?: string;
}

const actionButtonBase =
  'h-10 w-full gap-2 rounded-xl px-3 text-sm font-semibold sm:w-auto sm:px-4';

export function LinksPageActions({
  onAdd,
  onAddGroup,
  className,
}: LinksPageActionsProps) {
  return (
    <div
      className={cn(
        'grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end',
        !onAddGroup && 'grid-cols-1',
        className,
      )}
    >
      {onAddGroup ? (
        <Button
          onPress={onAddGroup}
          variant="secondary"
          className={cn(actionButtonBase, linksActionButtonClass, 'border border-[var(--border)]')}
        >
          <FolderPlus className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          <span className="truncate">مجموعة جديدة</span>
        </Button>
      ) : null}
      <Button
        onPress={onAdd}
        className={cn(
          actionButtonBase,
          linksActionButtonClass,
          'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95',
        )}
      >
        <Plus className="size-4 shrink-0" strokeWidth={2.5} aria-hidden />
        <span className="truncate">رابط جديد</span>
      </Button>
    </div>
  );
}
