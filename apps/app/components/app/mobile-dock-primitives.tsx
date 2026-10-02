'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Floating mobile dock shell — fade + safe area (mail-style) */
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
      <div className="pointer-events-auto relative mx-auto flex w-full max-w-[27rem] items-center justify-center gap-2 px-3">
        {children}
      </div>
    </div>
  );
}

/** Compact pill container — matches mail dock chrome */
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
        'flex min-w-0 max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-[var(--border)] bg-[var(--field-background)] p-1.5',
        '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {children}
    </nav>
  );
}

/** Circular action button beside the pill (e.g. More / Plus) */
export function MobileDockFab({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        'flex size-[3.25rem] shrink-0 items-center justify-center rounded-full border border-[var(--border)] outline-none transition-colors',
        isActive
          ? 'bg-[var(--foreground)] text-[var(--background)]'
          : 'bg-[var(--field-background)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
      )}
    >
      <Icon size={isActive ? 19 : 20} strokeWidth={isActive ? 2.2 : 2.1} aria-hidden />
    </button>
  );
}

export function MobileDockItem({
  icon: Icon,
  label,
  isActive,
  href,
  onClick,
  showLabel = true,
  forceLabel = false,
}: {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  href?: string;
  onClick?: () => void;
  showLabel?: boolean;
  /** Always show label (e.g. Back) even when not active */
  forceLabel?: boolean;
}) {
  const withLabel = (isActive && showLabel) || forceLabel;

  const inner = (
    <div
      className={cn(
        'relative flex h-11 min-w-11 items-center justify-center rounded-full transition-all duration-300 ease-out',
        isActive && showLabel
          ? 'gap-1.5 bg-[var(--foreground)] px-3.5 text-[var(--background)]'
          : forceLabel
            ? 'gap-1.5 px-3 text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            : 'px-2.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
      )}
    >
      <Icon
        size={withLabel ? 18 : 20}
        strokeWidth={isActive ? 2.2 : 1.7}
        className="shrink-0"
        aria-hidden
      />
      {withLabel ? (
        <span className="max-w-[5.5rem] truncate text-[12px] font-semibold tracking-tight">
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
