'use client';

import type { ReactNode } from 'react';
import { useTranslations } from '@/components/providers/translations-provider';
import { cn } from '@/lib/utils';

export function PhoneStatusBadge({ status }: { status: string }) {
  const w = useTranslations().whatsapp;
  const isActive = status === 'ACTIVE' || status === 'CONNECTED';
  const isPending = status === 'PENDING';

  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        isActive &&
          'bg-[color-mix(in_srgb,var(--success)_14%,var(--background))] text-[var(--success)]',
        isPending &&
          'bg-[color-mix(in_srgb,var(--warning)_14%,var(--background))] text-[var(--warning)]',
        !isActive &&
          !isPending &&
          'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
      )}
    >
      {isActive ? w.connected : isPending ? w.pending : status}
    </span>
  );
}

export function PhoneStatBox({
  label,
  value,
  dir,
}: {
  label: string;
  value: ReactNode;
  dir?: 'ltr' | 'rtl';
}) {
  return (
    <div className="rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </dt>
      <dd
        className="mt-0.5 text-sm font-semibold text-[var(--foreground)]"
        dir={dir}
      >
        {value}
      </dd>
    </div>
  );
}

export function PhoneActionSection({
  title,
  description,
  children,
  variant = 'default',
}: {
  title: string;
  description?: string;
  children: ReactNode;
  variant?: 'default' | 'highlight';
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 sm:p-5',
        variant === 'highlight'
          ? 'border-[color-mix(in_srgb,var(--warning)_25%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_5%,var(--background))]'
          : 'border-[var(--border)] bg-[var(--background)]',
      )}
    >
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-[var(--foreground)]">{title}</h4>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
