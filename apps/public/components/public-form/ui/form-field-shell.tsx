'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function FormFieldShell({
  label,
  description,
  error,
  children,
  className,
}: {
  label?: ReactNode;
  description?: string | null;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {label ? (
        <div className="public-form-field__label block text-start">{label}</div>
      ) : null}
      {description?.trim() ? (
        <p className="text-xs leading-relaxed text-[color:var(--form-text-body)]">
          {description.trim()}
        </p>
      ) : null}
      {children}
      {error ? (
        <p className="public-form-field-error text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
