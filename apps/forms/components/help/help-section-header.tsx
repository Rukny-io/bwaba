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
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Icon className="size-[18px]" strokeWidth={1.8} />
          </div>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-[var(--foreground)] sm:text-lg">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
