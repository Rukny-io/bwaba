'use client';

import { Plus } from 'lucide-react';
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils';

interface DiscountsPageActionsProps {
  addLabel: string;
  onAdd: () => void;
  className?: string;
}

export function DiscountsPageActions({
  addLabel,
  onAdd,
  className,
}: DiscountsPageActionsProps) {
  return (
    <div className={cn('flex items-center', className)}>
      <Button
        onPress={onAdd}
        className="h-9 shrink-0 gap-1.5 rounded-lg bg-[var(--primary)] px-3.5 text-sm font-medium text-[var(--primary-foreground)] !shadow-none hover:opacity-90"
      >
        <Plus className="size-3.5" strokeWidth={2.25} aria-hidden />
        <span>{addLabel}</span>
      </Button>
    </div>
  );
}
