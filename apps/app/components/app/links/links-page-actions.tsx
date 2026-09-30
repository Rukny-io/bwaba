'use client';

import { Plus } from 'lucide-react';
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils';

interface LinksPageActionsProps {
  onAdd: () => void;
  className?: string;
}

const actionButtonBase =
  'h-10 shrink-0 gap-2 rounded-xl px-4 text-sm font-semibold';

export function LinksPageActions({ onAdd, className }: LinksPageActionsProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-2', className)}>
      <Button
        onPress={onAdd}
        className={cn(
          actionButtonBase,
          'shadow-[0_4px_14px_rgba(59,130,246,0.22)]',
          'bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95',
        )}
      >
        <Plus className="size-4" strokeWidth={2.5} aria-hidden />
        <span>رابط جديد</span>
      </Button>
    </div>
  );
}
