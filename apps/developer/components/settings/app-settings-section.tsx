export const settingsInputClassName =
  'h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 text-[13px] text-[var(--foreground)] shadow-none outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted-foreground)] focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_22%,transparent)]';

export const settingsTextareaClassName =
  'mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 font-mono text-[13px] leading-relaxed text-[var(--foreground)] shadow-none outline-none transition-[border-color,box-shadow] placeholder:text-[var(--muted-foreground)] focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--primary)_22%,transparent)]';

export function AppSettingsSection({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-none sm:p-6">
      <div>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
      {footer ? (
        <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-end">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

function mergeAppState<T extends object>(current: T, updated: Partial<T>): T {
  return { ...current, ...updated };
}

export { mergeAppState };
