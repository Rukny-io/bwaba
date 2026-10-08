import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SettingsFormRow({
  label,
  hint,
  children,
  alignTop = false,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  alignTop?: boolean;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-1.5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-x-6 sm:gap-y-0',
        alignTop ? 'sm:items-start' : 'sm:items-center',
      )}
    >
      <div className={cn('min-w-0 text-start', alignTop && 'sm:pt-2.5')}>
        <span className="text-[13px] font-medium leading-snug text-[var(--foreground)]">
          {label}
        </span>
      </div>
      <div className="min-w-0">
        {children}
        {hint ? (
          <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
