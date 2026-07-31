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
        'group dashboard-card dashboard-card-interactive flex items-center gap-4 rounded-2xl p-4 sm:rounded-3xl sm:p-5',
        className,
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)]">
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
          {description}
        </p>
      </div>
      <ArrowLeft
        size={16}
        className="shrink-0 text-[var(--muted-foreground)] transition-transform group-hover:-translate-x-0.5"
      />
    </Link>
  );
}
