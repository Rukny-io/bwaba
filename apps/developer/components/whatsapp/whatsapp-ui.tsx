'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { cn } from '@/lib/utils';

export function PhoneStatusBadge({ status }: { status: string }) {
  const w = useTranslations().whatsapp;
  const isActive = status === 'ACTIVE' || status === 'CONNECTED';
  const isPending = status === 'PENDING';

  return (
    <span
      className={cn(
        'shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
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
    <div className="rounded-2xl bg-[var(--surface-secondary)] px-3.5 py-3">
      <dt className="text-[11px] font-medium text-[var(--muted-foreground)]">
        {label}
      </dt>
      <dd
        className="mt-1 text-sm font-semibold text-[var(--foreground)]"
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
        'rounded-2xl p-4 sm:p-5',
        variant === 'highlight'
          ? 'bg-[color-mix(in_srgb,var(--warning)_8%,var(--surface-secondary))]'
          : 'bg-[var(--surface-secondary)]',
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

export function WhatsappEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section className="dashboard-panel flex flex-col items-center rounded-2xl px-5 py-10 text-center sm:rounded-3xl sm:py-12">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
        <Icon className="size-5" strokeWidth={1.6} aria-hidden />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}

export const whatsappBtnPrimary =
  'inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--foreground)] px-3.5 text-[13px] font-medium text-[var(--background)] transition-opacity hover:opacity-90 disabled:opacity-40';

export const whatsappBtnSecondary =
  'inline-flex h-9 items-center gap-1.5 rounded-xl bg-[var(--surface-secondary)] px-3.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_85%,var(--foreground)_6%)] disabled:opacity-40';

export const whatsappBtnDanger =
  'inline-flex h-9 items-center gap-1.5 rounded-xl bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface-secondary))] px-3.5 text-[13px] font-medium text-[var(--danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_16%,var(--surface-secondary))] disabled:opacity-40';

export const whatsappInputClass =
  'w-full rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none transition-shadow placeholder:text-[var(--muted-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--foreground)]/15';
