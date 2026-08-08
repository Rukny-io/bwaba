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
        'group dashboard-card dashboard-card-interactive flex items-center gap-3.5 rounded-[1.75rem] border-[var(--border)] p-4 sm:gap-4 sm:rounded-[2rem] sm:p-5',
        className,
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--primary)] ring-1 ring-[var(--border)]/50 transition-transform group-hover:scale-[1.03]">
        <Icon size={18} strokeWidth={1.85} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-[13px] font-semibold tracking-tight text-[var(--foreground)] sm:text-sm">
          {title}
        </h2>
        <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>
      <ArrowLeft
        size={16}
        className="shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:-translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
