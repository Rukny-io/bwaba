'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export const mobileDockSideButtonClass =
  'flex size-[3.25rem] shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--field-background)] text-[var(--muted-foreground)] outline-none transition-colors hover:text-[var(--foreground)]';

/** Bottom shell — aligned with apps/mail `MailMobileDock` */
export function MobileDockShell({
  children,
  className,
  hiddenAbove = 'sm',
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  hiddenAbove?: 'sm' | 'lg';
  /** Room for back + pill + more (product consoles) */
  wide?: boolean;
}) {
  const hideClass = hiddenAbove === 'lg' ? 'lg:hidden' : 'sm:hidden';

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-50',
        hideClass,
        className,
      )}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{
          background:
            'linear-gradient(to top, color-mix(in srgb, var(--background) 88%, transparent) 20%, transparent 100%)',
        }}
      />
      <div
        className={cn(
          'pointer-events-auto relative mx-auto flex w-full items-center gap-2 px-3',
          wide
            ? 'max-w-[min(100%,36rem)]'
            : 'max-w-[27rem] justify-center',
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Scrollable pill — `bg-[var(--field-background)]` like mail */
export function MobileDockPill({
  children,
  className,
  'aria-label': ariaLabel,
  distribute = false,
}: {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
  /** Even spacing for icon-only product tabs */
  distribute?: boolean;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'flex min-w-0 max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-[var(--border)] bg-[var(--field-background)] p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        distribute && 'justify-between sm:justify-evenly',
        className,
      )}
    >
      {children}
    </nav>
  );
}

export function MobileDockNavLink({
  icon: Icon,
  label,
  isActive,
  href,
  onClick,
  compact = false,
}: {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  href: string;
  onClick?: () => void;
  /** Icon-only tabs (fixed 44px) — for product docks with back/more buttons */
  compact?: boolean;
}) {
  const iconSize = compact ? 19 : isActive ? 18 : 20;
  const iconStroke = isActive ? 2.2 : 1.7;

  return (
    <Link
      href={href}
      prefetch
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className="flex shrink-0"
      onClick={onClick}
    >
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full transition-all duration-300 ease-out',
          compact
            ? cn(
                'size-11 shrink-0',
                isActive
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )
            : cn(
                'h-11 min-w-11',
                isActive
                  ? 'gap-1.5 bg-[var(--foreground)] px-3.5 text-[var(--background)]'
                  : 'px-2.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              ),
        )}
      >
        <Icon
          size={iconSize}
          strokeWidth={iconStroke}
          className="shrink-0"
          aria-hidden
        />
        {!compact && isActive ? (
          <span className="max-w-[5.5rem] truncate text-[12px] font-semibold tracking-tight">
            {label}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
