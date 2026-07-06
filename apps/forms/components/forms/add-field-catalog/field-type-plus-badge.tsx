'use client';

import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FieldTypePlusBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-full',
        'bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300',
        className,
      )}
    >
      <Crown className="size-2.5" aria-hidden />
      Plus
    </span>
  );
}
