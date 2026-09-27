import Link from 'next/link';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardQuickActionProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export function DashboardQuickAction({
  href,
  icon: Icon,
  title,
  description,
  className,
}: DashboardQuickActionProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 rounded-2xl bg-[var(--surface-secondary)] px-3.5 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--surface-secondary)_92%,var(--foreground)_3%)] sm:gap-4 sm:px-4 sm:py-3.5',
        className,
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--foreground)] sm:size-10">
        <Icon size={17} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-medium text-[var(--foreground)]">{title}</h2>
        <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>
      <ArrowLeft
        size={15}
        className="shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:-translate-x-0.5"
      />
    </Link>
  );
}
