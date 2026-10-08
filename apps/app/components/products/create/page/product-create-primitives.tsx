import type { LucideIcon } from 'lucide-react';
import { Chip, Surface, cn } from '@heroui/react';

export function ProductCreatePill({
  icon: Icon,
  label,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  className?: string;
}) {
  return (
    <Chip
      size="sm"
      variant="soft"
      className={cn('h-auto max-w-full gap-2 rounded-full py-1 pe-3 ps-1', className)}
    >
      {Icon ? (
        <Surface
          variant="default"
          className="flex size-7 shrink-0 items-center justify-center rounded-full sm:size-8"
        >
          <Icon size={16} strokeWidth={1.85} aria-hidden />
        </Surface>
      ) : null}
      <span className="truncate text-[12px] font-semibold tracking-tight sm:text-[13px]">
        {label}
      </span>
    </Chip>
  );
}

export function ProductCreateTypeTile({
  label,
  hint,
  examples,
  icon: Icon,
  onClick,
}: {
  label: string;
  hint: string;
  examples?: string[];
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 text-start transition-colors',
        'hover:bg-[var(--surface-secondary)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'sm:p-4',
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)] transition-colors group-hover:text-[var(--foreground)]">
        <Icon size={18} strokeWidth={1.85} className="sm:size-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold leading-tight text-[var(--foreground)] sm:text-sm">
          {label}
        </p>
        <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-[var(--muted-foreground)] sm:text-[11px]">
          {hint}
        </p>
        {examples?.length ? (
          <p className="mt-2 line-clamp-2 text-[10px] leading-snug text-[var(--muted-foreground)]">
            {examples.join(' · ')}
          </p>
        ) : null}
      </div>
    </button>
  );
}
