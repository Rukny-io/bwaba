'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export function CreateProductChrome({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      dir="rtl"
      className={cn(
        'product-create-brand fixed inset-0 z-[200] flex min-h-dvh flex-col bg-[var(--background)] font-sans text-[var(--foreground)]',
        className,
      )}
    >
      <div className="product-create-shell relative flex min-h-0 flex-1 flex-col">
        <main className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-4 pt-14 sm:pt-16">
          {children}
        </main>
      </div>
    </div>,
    document.body,
  );
}
