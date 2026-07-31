'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function CreateFormChrome({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      dir="rtl"
      className={cn(
        'relative flex min-h-dvh flex-col bg-[var(--background)] font-sans text-[var(--foreground)]',
        className,
      )}
    >
      <main className="relative flex flex-1 flex-col pb-4 pt-14 sm:pt-16">
        {children}
      </main>
    </div>
  );
}
