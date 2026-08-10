'use client';

import { Box, Download, Wrench, type LucideIcon } from 'lucide-react';
import type { ProductKind } from '@/lib/products/types';
import { cn } from '@/lib/utils';

const KIND_STYLES: Record<
  ProductKind,
  { Icon: LucideIcon; bg: string; fg: string }
> = {
  PHYSICAL: {
    Icon: Box,
    bg: 'bg-sky-500/12',
    fg: 'text-sky-600 dark:text-sky-400',
  },
  DIGITAL: {
    Icon: Download,
    bg: 'bg-violet-500/12',
    fg: 'text-violet-600 dark:text-violet-400',
  },
  SERVICE: {
    Icon: Wrench,
    bg: 'bg-amber-500/12',
    fg: 'text-amber-600 dark:text-amber-400',
  },
};

interface ProductKindIconBadgeProps {
  kind: ProductKind;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProductKindIconBadge({
  kind,
  size = 'md',
  className,
}: ProductKindIconBadgeProps) {
  const { Icon, bg, fg } = KIND_STYLES[kind];
  const shell = size === 'sm' ? 'size-9 rounded-xl' : 'size-11 rounded-2xl';
  const iconSize = size === 'sm' ? 18 : 22;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center',
        shell,
        bg,
        className,
      )}
    >
      <Icon className={cn(fg)} size={iconSize} strokeWidth={1.85} aria-hidden />
    </div>
  );
}
