import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpSectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  action?: ReactNode;
}

/** Kept for light inline headings; prefer SettingsSectionCard for page sections. */
export function HelpSectionHeader({
  title,
  description,
  icon: Icon,
  className,
  action,
}: HelpSectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--primary)] ring-1 ring-[var(--border)]/40">
            <Icon className="size-4" strokeWidth={1.85} />
          </div>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-[var(--foreground)] sm:text-[15px]">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted-foreground)] sm:text-[12px]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
