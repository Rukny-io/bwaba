'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiKeysAlertProps {
  variant?: 'error' | 'warning';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function ApiKeysAlert({
  variant = 'error',
  message,
  actionLabel,
  onAction,
  className,
}: ApiKeysAlertProps) {
  const isError = variant === 'error';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        isError
          ? 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--background))] text-[var(--danger)]'
          : 'bg-[color-mix(in_srgb,var(--warning)_12%,var(--background))] text-[var(--warning)]',
        className,
      )}
      role="alert"
    >
      <div className="flex items-start gap-2 text-sm">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <p>{message}</p>
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90',
            isError
              ? 'bg-[color-mix(in_srgb,var(--danger)_15%,var(--background))]'
              : 'bg-[color-mix(in_srgb,var(--warning)_15%,var(--background))]',
          )}
        >
          <RefreshCw className="size-3.5" />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
