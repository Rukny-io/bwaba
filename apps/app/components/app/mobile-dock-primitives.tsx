'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Floating glass mobile dock shell — fade + safe area */
export function MobileDockShell({
  children,
  className,
  hiddenAbove = 'sm',
}: {
  children: React.ReactNode;
  className?: string;
  hiddenAbove?: 'sm' | 'lg';
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
        dir="ltr"
        className="pointer-events-auto relative mx-auto flex w-full max-w-[27rem] items-center justify-center gap-2 px-3"
      >
        {children}
      </div>
    </div>
  );
}

/** Frosted glass pill container */
export function MobileDockPill({
  children,
  className,
  'aria-label': ariaLabel,
  dir = 'rtl',
}: {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
  dir?: 'rtl' | 'ltr';
}) {
  return (
    <nav
      dir={dir}
      aria-label={ariaLabel}
      className={cn(
        'min-w-0 max-w-full rounded-full border border-[var(--border)] bg-[var(--surface)]/90 p-1.5 shadow-[var(--card-shadow)] backdrop-blur-2xl dark:border-[var(--border)] dark:bg-[var(--surface)]/95',
        className,
      )}
    >
      <div className="flex items-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </nav>
  );
}

export function MobileDockItem({
  icon: Icon,
  label,
  isActive,
  href,
  onClick,
  showLabel = true,
}: {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  href?: string;
  onClick?: () => void;
  showLabel?: boolean;
}) {
  const withLabel = isActive && showLabel;

  const inner = (
    <div
      className={cn(
        'relative flex h-11 min-w-11 items-center justify-center rounded-full transition-all duration-300 ease-out',
        withLabel
          ? 'gap-1.5 bg-[var(--foreground)] px-4 text-[var(--background)] shadow-md'
          : isActive
            ? 'bg-[var(--surface-secondary)] text-[var(--foreground)]'
            : 'px-2.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
      )}
    >
      <Icon
        size={withLabel || isActive ? 19 : 21}
        strokeWidth={isActive ? 2.2 : 1.7}
        className="shrink-0"
        aria-hidden
      />
      {withLabel ? (
        <span className="shrink-0 whitespace-nowrap text-[12.5px] font-semibold tracking-tight">
          {label}
        </span>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
        className="flex shrink-0"
        onClick={onClick}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      onClick={onClick}
      className="flex shrink-0 bg-transparent p-0"
    >
      {inner}
    </button>
  );
}
