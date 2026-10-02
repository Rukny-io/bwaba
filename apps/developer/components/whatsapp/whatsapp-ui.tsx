'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { cn } from '@/lib/utils';

/** Shared radius scale for WhatsApp surfaces */
export const waRadius = {
  panel: 'rounded-[1.25rem]',
  section: 'rounded-xl',
  control: 'rounded-xl',
  badge: 'rounded-full',
  icon: 'rounded-xl',
} as const;

export function PhoneStatusBadge({ status }: { status: string }) {
  const w = useTranslations().whatsapp;
  const isActive = status === 'ACTIVE' || status === 'CONNECTED';
  const isPending = status === 'PENDING';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
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
    <div className="rounded-xl bg-[var(--surface-secondary)] px-3.5 py-3">
      <dt className="text-[11px] font-medium text-[var(--muted-foreground)]">
        {label}
      </dt>
      <dd
        className="mt-1 truncate text-sm font-semibold text-[var(--foreground)]"
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
        'rounded-xl p-4',
        variant === 'highlight'
          ? 'bg-[color-mix(in_srgb,var(--warning)_8%,var(--surface-secondary))]'
          : 'bg-[var(--surface-secondary)]',
      )}
    >
      <div className="mb-3.5">
        <h4 className="text-[13px] font-semibold text-[var(--foreground)]">{title}</h4>
        {description ? (
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--muted-foreground)]">
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
    <section className="dashboard-panel px-4 py-5 sm:px-5 sm:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--muted-foreground)]">
              <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
            </span>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
          </div>
          {description ? (
            <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-[var(--muted-foreground)]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0 sm:ms-auto">{action}</div> : null}
      </div>
    </section>
  );
}

export const whatsappBtnPrimary =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--foreground)] px-3.5 text-[13px] font-medium text-[var(--background)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40';

export const whatsappBtnSecondary =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[var(--surface-secondary)] px-3.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_85%,var(--foreground)_6%)] disabled:cursor-not-allowed disabled:opacity-40';

export const whatsappBtnDanger =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface-secondary))] px-3.5 text-[13px] font-medium text-[var(--danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_16%,var(--surface-secondary))] disabled:cursor-not-allowed disabled:opacity-40';

export const whatsappInputClass =
  'w-full rounded-xl bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none ring-1 ring-[var(--border)]/70 transition-[box-shadow,ring-color] placeholder:text-[var(--muted-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--foreground)]/20';
