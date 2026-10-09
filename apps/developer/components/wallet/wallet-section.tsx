import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface WalletSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function WalletSectionHeader({
  icon: Icon,
  title,
  description,
}: WalletSectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--primary)]">
        <Icon className="size-[1.125rem]" strokeWidth={1.6} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <h2 className="text-[15px] font-semibold leading-snug text-[var(--foreground)] sm:text-base">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface WalletSummaryRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

const summaryDivideClass =
  'border-[color-mix(in_srgb,var(--border)_55%,transparent)]';

export function WalletSummaryGrid({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border ${summaryDivideClass} bg-[var(--background)]`}
    >
      <div
        className={`grid grid-cols-2 divide-x divide-y ${summaryDivideClass}`}
      >
        {children}
      </div>
    </div>
  );
}

export function WalletSummaryRow({
  icon: Icon,
  label,
  value,
}: WalletSummaryRowProps) {
  return (
    <div className="flex min-h-[4.25rem] items-start gap-2.5 px-3 py-3 sm:min-h-[4.5rem] sm:gap-3 sm:px-4">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)] sm:size-9"
        aria-hidden
      >
        <Icon className="size-4" strokeWidth={1.6} />
      </span>
      <div className="min-w-0 flex flex-1 flex-col justify-center gap-1 pt-0.5">
        <span className="text-[12px] leading-snug text-[var(--muted-foreground)] sm:text-[13px]">
          {label}
        </span>
        <span
          className="text-sm font-semibold tabular-nums text-[var(--foreground)] sm:text-[15px]"
          dir="ltr"
          lang="en"
        >
          {value}
        </span>
      </div>
    </div>
  );
}
