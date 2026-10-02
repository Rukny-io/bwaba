'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, Folder } from 'lucide-react';
import type { PublicLinkGroup } from './types';
import { cn } from './utils';

interface ProfileLinkGroupProps {
  group: PublicLinkGroup;
  linkCount: number;
  compact?: boolean;
  children: ReactNode;
}

/** Match ProfileLinkButton logo shell so folders sit in the same visual rhythm. */
const LOGO_SHELL =
  'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)] ring-1 ring-[var(--border)] sm:size-10';

export function ProfileLinkGroup({
  group,
  linkCount,
  compact = false,
  children,
}: ProfileLinkGroupProps) {
  const [open, setOpen] = useState(group.isExpanded);
  const label = group.nameAr || group.name;
  const color = group.color || 'var(--foreground)';

  useEffect(() => {
    setOpen(group.isExpanded);
  }, [group.id, group.isExpanded]);

  return (
    <div className={cn('flex flex-col', compact ? 'gap-2' : 'gap-2')}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'group/folder profile-link-row',
          'flex w-full items-center gap-3 rounded-3xl border border-[var(--border)] px-3 py-3 sm:px-3.5 sm:py-3.5',
          'text-[var(--foreground)]',
          'transition-[transform,border-color] duration-200 ease-out hover:border-[var(--muted-foreground)]/35 active:scale-[0.99]',
        )}
        aria-expanded={open}
      >
        <span className={LOGO_SHELL} aria-hidden>
          <Folder
            className="size-4 sm:size-[1.05rem]"
            strokeWidth={1.75}
            style={{ color }}
          />
        </span>
        <span className="min-w-0 flex-1 text-start">
          <span className="block truncate text-[13px] font-semibold leading-snug tracking-tight">
            {label}
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-medium text-[var(--muted-foreground)]">
            {linkCount} رابط
          </span>
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-[var(--muted-foreground)]/55 transition-transform duration-200',
            open && 'rotate-180 text-[var(--muted-foreground)]/90',
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="flex flex-col gap-2" role="region" aria-label={label}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
