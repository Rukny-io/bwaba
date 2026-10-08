interface SettingsPlaceholderSectionProps {
  title: string;
  body: string;
}

export function SettingsPlaceholderSection({ title, body }: SettingsPlaceholderSectionProps) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/40 px-5 py-10 text-center">
      <p className="text-[13px] font-medium text-[var(--foreground)]">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-[var(--muted-foreground)]">
        {body}
      </p>
    </div>
  );
}
