'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import { cn } from '@/lib/utils';

interface DashboardErrorStateProps {
  title?: string;
  description?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  children?: ReactNode;
  className?: string;
  variant?: 'page' | 'inline';
}

export function DashboardErrorState({
  title = 'تعذّر تحميل هذا القسم',
  description = 'قد تكون المشكلة مؤقتة. أعد المحاولة أو انتقل لقسم آخر.',
  message,
  onRetry,
  retryLabel = 'إعادة المحاولة',
  children,
  className,
  variant = 'page',
}: DashboardErrorStateProps) {
  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]',
          className,
        )}
        role="alert"
      >
        {message ?? description}
        {onRetry ? (
          <button type="button" className="ms-2 underline" onClick={onRetry}>
            {retryLabel}
          </button>
        ) : null}
        {children}
      </div>
    );
  }

  return (
    <DashboardSurface
      as="div"
      padding="md"
      className={cn(
        'flex min-h-[40vh] flex-col items-center justify-center bg-[var(--surface-secondary)]/30 py-10 text-center sm:py-14',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--danger)]/10 text-[var(--danger)]">
        <AlertCircle className="size-6" strokeWidth={1.8} aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-[var(--muted-foreground)]">
        {message ?? description}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--primary-foreground)]"
          >
            {retryLabel}
          </button>
        ) : null}
        {children ?? (
          <Link
            href="/app"
            className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)]"
          >
            لوحة التحكم
          </Link>
        )}
      </div>
    </DashboardSurface>
  );
}
