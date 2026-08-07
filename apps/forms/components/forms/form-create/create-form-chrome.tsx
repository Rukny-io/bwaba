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
        'form-create-brand relative flex min-h-dvh flex-col bg-[var(--background)] font-sans text-[var(--foreground)]',
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="form-create-shell relative flex min-h-0 flex-1 flex-col">
          <main className="relative flex min-h-0 flex-1 flex-col pb-4 pt-14 sm:pt-16">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
