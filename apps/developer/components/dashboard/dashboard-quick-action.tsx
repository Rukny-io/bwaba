import Link from 'next/link';
import { ArrowLeft, ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardQuickActionProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  isRtl?: boolean;
}

export function DashboardQuickAction({
  href,
  icon: Icon,
  title,
  description,
  className,
  isRtl = true,
}: DashboardQuickActionProps) {
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <Link
      href={href}
      className={cn(
        'group dashboard-card dashboard-card-interactive flex items-center gap-3.5 rounded-[1.75rem] p-4 sm:gap-4 sm:rounded-[2rem] sm:p-5',
        className,
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--primary)] transition-transform group-hover:scale-[1.03]">
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
      <Arrow
        size={16}
        className={cn(
          'shrink-0 text-[var(--muted-foreground)] transition-transform',
          isRtl ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5',
        )}
        aria-hidden
      />
    </Link>
  );
}
