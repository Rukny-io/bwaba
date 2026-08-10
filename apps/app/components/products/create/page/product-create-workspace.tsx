'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ProductCreateWorkspaceProps {
  children: ReactNode;
  className?: string;
}

export function ProductCreateWorkspace({
  children,
  className,
}: ProductCreateWorkspaceProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 pb-20 pt-1 sm:px-4 sm:pb-16',
        className,
      )}
    >
      {children}
    </div>
  );
}
