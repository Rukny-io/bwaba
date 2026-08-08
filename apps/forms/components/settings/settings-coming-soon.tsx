import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import type { IntegrationLogoAsset } from '@/lib/integration-logos';
import { cn } from '@/lib/utils';

export function SettingsComingSoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-secondary)]/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]',
        className,
      )}
    >
      Coming Soon
    </span>
  );
}

export type SettingsComingSoonItem = {
  title: string;
  description: string;
  icon?: LucideIcon;
  logo?: IntegrationLogoAsset;
};

export function SettingsComingSoonTile({
  title,
  description,
  icon: Icon,
  logo,
}: SettingsComingSoonItem) {
  return (
    <article className="dashboard-metric-tile flex h-full flex-col rounded-2xl p-4 sm:p-[1.125rem]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)]/60 bg-[var(--surface)] p-1.5">
          {logo ? (
            <Image
              src={logo.src}
              alt={logo.alt}
              width={28}
              height={28}
              className="max-h-full max-w-full object-contain"
            />
          ) : Icon ? (
            <Icon
              className="size-[18px] text-[var(--muted-foreground)]"
              strokeWidth={1.75}
              aria-hidden
            />
          ) : null}
        </div>
        <SettingsComingSoonBadge />
      </div>

      <h3 className="mt-3 text-[14px] font-semibold leading-snug text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-[var(--muted-foreground)] sm:text-[13px]">
        {description}
      </p>
    </article>
  );
}

export function SettingsComingSoonGrid({ items }: { items: SettingsComingSoonItem[] }) {
  return (
    <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <SettingsComingSoonTile key={item.title} {...item} />
      ))}
    </div>
  );
}
