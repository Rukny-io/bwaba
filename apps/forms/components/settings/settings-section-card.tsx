import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SettingsSectionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  hideHeader?: boolean;
}

export function SettingsSectionCard({
  icon: Icon,
  title,
  description,
  children,
  className,
  hideHeader = false,
}: SettingsSectionCardProps) {
  return (
    <section className={cn('rounded-3xl p-3.5 sm:p-4', className)}>
      {!hideHeader ? (
        <div className="mb-3.5 flex items-center gap-2.5 sm:mb-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--primary)] ring-1 ring-[var(--border)]/40">
            <Icon className="size-4" strokeWidth={1.8} />
          </div>
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
      ) : null}
      {children}
    </section>
  );
}
