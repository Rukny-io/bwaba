import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SettingsSectionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsSectionCard({
  icon: Icon,
  title,
  description,
  children,
}: SettingsSectionCardProps) {
  return (
    <section className="rounded-2xl bg-[var(--surface)] p-4 shadow-sm shadow-black/[0.02] sm:rounded-3xl sm:p-6">
      <div className="mb-4 flex items-start gap-3 sm:mb-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--foreground)] sm:size-10">
          <Icon className="size-[18px] sm:size-5" strokeWidth={1.6} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}
