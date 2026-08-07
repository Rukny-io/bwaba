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
  /** Tailwind breakpoint class prefix for hiding (sm | lg) */
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
        'min-w-0 max-w-full rounded-full border border-white/50 bg-white/55 p-1.5 shadow-[0_6px_24px_rgba(15,23,42,0.1)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_6px_24px_rgba(0,0,0,0.4)]',
        className,
      )}
    >
      {/* Inner scroller: padding must stay on the outer shell — overflow eats flex padding */}
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
}: {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <div
      className={cn(
        'relative flex h-11 min-w-11 items-center justify-center rounded-full transition-all duration-300 ease-out',
        isActive
          ? 'gap-1.5 bg-white px-4 text-[var(--foreground)] shadow-[0_2px_10px_rgba(15,23,42,0.08)] dark:bg-white dark:text-slate-900'
          : 'px-2.5 text-[var(--foreground)]/70 hover:text-[var(--foreground)]',
      )}
    >
      <Icon
        size={isActive ? 19 : 21}
        strokeWidth={isActive ? 2.2 : 1.7}
        className="shrink-0"
        aria-hidden
      />
      {isActive ? (
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

/** Circular primary action — matches pill height */
export function MobileDockFab({
  href,
  label,
  icon: Icon,
  onClick,
}: {
  href?: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}) {
  const className =
    'flex size-[3.25rem] shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] shadow-[0_6px_22px_rgba(15,23,42,0.24)] transition-transform duration-200 active:scale-95 dark:shadow-[0_6px_22px_rgba(0,0,0,0.45)]';

  const content = <Icon size={21} strokeWidth={2.25} aria-hidden />;

  if (href) {
    return (
      <Link href={href} aria-label={label} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" aria-label={label} onClick={onClick} className={className}>
      {content}
    </button>
  );
}
