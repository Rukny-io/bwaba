import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function FormCreatePill({
  icon: Icon,
  label,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex max-w-full items-center gap-2 self-start rounded-full bg-[var(--surface-secondary)] py-1 pe-3 ps-1',
        className,
      )}
    >
      {Icon ? (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--primary)] ring-1 ring-[var(--border)]/50 sm:size-8">
          <Icon size={15} strokeWidth={1.9} className="sm:hidden" aria-hidden />
          <Icon
            size={16}
            strokeWidth={1.85}
            className="hidden sm:block"
            aria-hidden
          />
        </span>
      ) : null}
      <span className="truncate text-[12px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[13px]">
        {label}
      </span>
    </div>
  );
}

export function FormCreateActionStrip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/50 p-3 sm:space-y-4 sm:p-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FormCreateSectionBadge({
  index,
  total,
  className,
}: {
  index: number;
  total: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'absolute -top-3 start-4 z-[1] rounded-full bg-[var(--brand-blue-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--secondary-foreground)] ring-1 ring-[color-mix(in_srgb,var(--primary)_28%,transparent)]',
        className,
      )}
    >
      القسم {index + 1} من {total}
    </div>
  );
}

export function FormCreatePanel({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:rounded-[1.25rem] sm:p-5',
        className,
      )}
    >
      <div className="mb-3">
        <FormCreatePill icon={Icon} label={title} />
      </div>
      {children}
    </section>
  );
}

export function FormCreateDocumentCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('form-create-document p-4 sm:p-6', className)}>
      {children}
    </div>
  );
}

export function FormCreateGradientPill({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      onClick={onClick}
      className={cn(
        'group shrink-0 rounded-full p-[1.5px] transition-colors duration-200',
        isActive
          ? 'bg-gradient-to-l from-[var(--brand-blue-soft)] via-[var(--primary)] to-[var(--brand-blue)]'
          : 'bg-[var(--border)] hover:bg-[color-mix(in_srgb,var(--border)_70%,var(--primary)_30%)]',
      )}
    >
      <span
        className={cn(
          'flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1.5 text-[12px] font-semibold transition-colors sm:gap-2 sm:px-3.5 sm:py-2 sm:text-[13px]',
          isActive
            ? 'text-[var(--foreground)]'
            : 'text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]',
        )}
      >
        <Icon
          size={15}
          strokeWidth={isActive ? 2.2 : 1.8}
          className="shrink-0 opacity-80 sm:size-4"
          aria-hidden
        />
        <span className="whitespace-nowrap">{label}</span>
      </span>
    </button>
  );
}

export function FormCreateTypeTile({
  label,
  hint,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  hint: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      aria-label={`${label} — ${hint}`}
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-start gap-2.5 rounded-xl border p-3 text-start transition-all duration-200 sm:gap-3 sm:p-3.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]',
        isActive
          ? 'border-[color-mix(in_srgb,var(--primary)_50%,var(--border))] bg-[color-mix(in_srgb,var(--brand-blue-soft)_72%,var(--surface))] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--primary)_18%,transparent)]'
          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[color-mix(in_srgb,var(--border)_45%,var(--primary)_55%)] hover:bg-[color-mix(in_srgb,var(--surface-secondary)_55%,var(--surface))]',
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors sm:size-10',
          isActive
            ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
            : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] group-hover:text-[var(--foreground)]',
        )}
      >
        <Icon
          size={18}
          strokeWidth={isActive ? 2.2 : 1.85}
          className="sm:size-5"
          aria-hidden
        />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5 pe-1">
        <span
          className={cn(
            'text-[13px] font-semibold leading-tight tracking-tight sm:text-sm',
            isActive
              ? 'text-[var(--foreground)]'
              : 'text-[var(--foreground)]/90 group-hover:text-[var(--foreground)]',
          )}
        >
          {label}
        </span>
        <span className="line-clamp-2 text-[10px] leading-snug text-[var(--muted-foreground)] sm:text-[11px]">
          {hint}
        </span>
      </span>

      <span
        aria-hidden
        className={cn(
          'absolute end-2.5 top-2.5 size-1.5 rounded-full transition-all duration-200',
          isActive
            ? 'scale-100 bg-[var(--primary)] opacity-100'
            : 'scale-0 opacity-0',
        )}
      />
    </button>
  );
}

export function FormCreateQuickActionCard({
  label,
  hint,
  icon: Icon,
  onClick,
  variant = 'default',
}: {
  label: string;
  hint?: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'primary';
}) {
  const isPrimary = variant === 'primary';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl p-3.5 text-start transition-all duration-200 sm:gap-3.5 sm:p-4',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]',
        isPrimary
          ? 'bg-[color-mix(in_srgb,var(--brand-blue-soft)_68%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--brand-blue-soft)_82%,var(--surface))]'
          : 'bg-[var(--surface-secondary)]/70 hover:bg-[var(--surface-secondary)]',
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors',
          isPrimary
            ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
            : 'bg-[var(--surface)] text-[var(--muted-foreground)]',
        )}
      >
        <Icon size={20} strokeWidth={1.9} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] font-semibold leading-tight text-[var(--foreground)] sm:text-sm">
          {label}
        </span>
        {hint ? (
          <span className="text-[10px] leading-snug text-[var(--muted-foreground)] sm:text-[11px]">
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function FormCreateFieldChip({
  label,
  icon: Icon,
  onClick,
  className,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl bg-[var(--surface)] p-3 text-start transition-colors duration-200',
        'hover:bg-[color-mix(in_srgb,var(--surface-secondary)_70%,var(--surface))]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]',
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-secondary)] text-[var(--primary)]">
        <Icon size={16} strokeWidth={1.9} aria-hidden />
      </span>
      <span className="min-w-0 truncate text-[13px] font-medium text-[var(--foreground)]">
        {label}
      </span>
    </button>
  );
}
