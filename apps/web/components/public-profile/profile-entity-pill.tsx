'use client';

import { useState } from 'react';
import { Layers } from 'lucide-react';
import { cn } from './utils';

interface ProfileEntityPillProps {
  label: string;
  imageUrl?: string | null;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  role?: string;
  'aria-selected'?: boolean;
}

export function ProfileEntityPill({
  label,
  imageUrl = null,
  selected = false,
  onClick,
  className,
  role,
  'aria-selected': ariaSelected,
}: ProfileEntityPillProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !imageFailed;
  const initial = label.trim().charAt(0).toUpperCase() || '?';

  const content = (
    <>
      <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface)]">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl!}
            alt=""
            className="size-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="inline-flex items-center justify-center text-[var(--foreground)]">
            {imageUrl === undefined ? (
              <Layers className="size-3.5 text-[var(--muted-foreground)]" strokeWidth={1.75} aria-hidden />
            ) : (
              <span className="text-[10px] font-semibold">{initial}</span>
            )}
          </span>
        )}
      </span>
      <span
        dir="auto"
        className={cn(
          'truncate text-[13px] font-semibold',
          selected ? 'text-[var(--background)]' : 'text-[var(--foreground)]',
        )}
      >
        {label}
      </span>
    </>
  );

  const pillClass = cn(
    'inline-flex h-9 w-fit max-w-full shrink-0 items-center gap-2 rounded-full py-0.5 ps-1.5 pe-3.5 transition-colors sm:h-10 sm:ps-2 sm:pe-4',
    selected
      ? 'bg-[var(--foreground)]'
      : 'bg-[var(--surface-secondary)] ring-1 ring-[var(--border)] hover:ring-[color-mix(in_srgb,var(--border)_55%,var(--foreground)_25%)]',
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={pillClass}
        role={role}
        aria-selected={ariaSelected}
      >
        {content}
      </button>
    );
  }

  return <span className={pillClass}>{content}</span>;
}
