'use client';

import { ChevronLeft, FileText, Link2, Phone } from 'lucide-react';
import { getPlatformIconAsset } from './platform-icon-assets';
import { cn } from './utils';

interface ProfilePlatformIconProps {
  platform: string;
  size?: 'sm' | 'md';
  className?: string;
}

const SIZE = { sm: 'size-8', md: 'size-10' } as const;
const IMG = { sm: 'size-4', md: 'size-[1.15rem]' } as const;

export function ProfilePlatformIcon({ platform, size = 'md', className }: ProfilePlatformIconProps) {
  const asset = getPlatformIconAsset(platform);
  const isForm = platform === 'form';

  if (asset) {
    return (
      <span
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-secondary)] ring-1 ring-[var(--border)]',
          SIZE[size],
          className,
        )}
      >
        <img
          src={asset.src}
          alt=""
          draggable={false}
          className={cn(
            asset.fill ? 'size-full object-cover' : IMG[size],
            !asset.fill && 'object-contain',
          )}
        />
      </span>
    );
  }

  if (platform === 'phone') {
    return (
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl bg-[var(--profile-accent-soft)] ring-1 ring-[var(--border)]',
          SIZE[size],
          className,
        )}
      >
        <Phone className={cn(IMG[size], 'text-[var(--primary)]')} />
      </span>
    );
  }

  if (isForm) {
    return (
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl bg-[var(--profile-accent-soft)] ring-1 ring-[var(--border)]',
          SIZE[size],
          className,
        )}
      >
        <FileText className={cn(IMG[size], 'text-[var(--primary)]')} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] ring-1 ring-[var(--border)]',
        SIZE[size],
        className,
      )}
    >
      <Link2 className={cn(IMG[size], 'text-[var(--muted-foreground)]')} />
    </span>
  );
}

export function ProfileLinkChevron({ className }: { className?: string }) {
  return (
    <ChevronLeft
      className={cn('size-4 shrink-0 text-[var(--muted-foreground)]/70', className)}
      aria-hidden
    />
  );
}
