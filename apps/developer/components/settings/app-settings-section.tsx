import type { ReactNode } from 'react';
import { SettingsPanel } from '@/components/settings/settings-primitives';
import { cn } from '@/lib/utils';

export const settingsInputClassName =
  'h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 text-[13px] text-[var(--foreground)] shadow-none outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted-foreground)] focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_22%,transparent)]';

export const settingsTextareaClassName =
  'mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--foreground)] shadow-none outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted-foreground)] focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_22%,transparent)]';

export const settingsLabelClassName =
  'text-[13px] font-medium text-[var(--foreground)]';

export function AppSettingsSection({
  title,
  description,
  children,
  footer,
  flush = false,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Render children flush against the surface (row lists) */
  flush?: boolean;
  className?: string;
}) {
  return (
    <SettingsPanel title={title} description={description} className={className}>
      {flush ? (
        children
      ) : (
        <div className="space-y-4 p-4 sm:space-y-5 sm:p-5">{children}</div>
      )}
      {footer ? (
        <div
          className={cn(
            'flex flex-col gap-3 border-t border-[var(--border)]/70 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-end sm:px-5',
            flush && 'bg-[var(--surface-secondary)]/35',
          )}
        >
          {footer}
        </div>
      ) : null}
    </SettingsPanel>
  );
}

function mergeAppState<T extends object>(current: T, updated: Partial<T>): T {
  return { ...current, ...updated };
}

export { mergeAppState };
