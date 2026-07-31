import type { LucideIcon } from 'lucide-react';

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
    <div className="mb-5 flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)]">
        <Icon className="size-4" strokeWidth={1.6} />
      </span>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface WalletSummaryRowProps {
  label: string;
  value: string;
}

export function WalletSummaryRow({ label, value }: WalletSummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-secondary)] px-4 py-3">
      <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      <span
        className="text-sm font-semibold tabular-nums text-[var(--foreground)]"
        dir="ltr"
        lang="en"
      >
        {value}
      </span>
    </div>
  );
}
