'use client';

import { ChevronLeft, FileText, Link2, Phone } from 'lucide-react';
import { getPlatformIconAsset } from './platform-icon-assets';
import { cn } from './utils';

interface ProfilePlatformIconProps {
  platform: string;
  size?: 'sm' | 'md';
  /** @deprecated Use variant instead */
  framed?: boolean;
  variant?: 'framed' | 'soft' | 'plain';
  className?: string;
  /** Fraction of the shell filled by the mark (major platforms use a smaller fixed value) */
  markScale?: number;
}

const SIZE = { sm: 'size-8', md: 'size-10' } as const;
const IMG = { sm: 'size-4', md: 'size-[1.15rem]' } as const;

export function ProfilePlatformIcon({
  platform,
  size = 'md',
  framed,
  variant,
  className,
  markScale = 0.78,
}: ProfilePlatformIconProps) {
  const asset = getPlatformIconAsset(platform);
  const isForm = platform === 'form';
  const resolvedVariant = variant ?? (framed === false ? 'plain' : 'framed');
  const frameClass =
    resolvedVariant === 'framed'
      ? 'rounded-xl bg-[var(--surface-secondary)] ring-1 ring-[var(--border)]'
      : resolvedVariant === 'soft'
        ? 'rounded-xl bg-[var(--surface)]'
        : 'rounded-lg';

  if (asset) {
    const pct = `${Math.round(markScale * 100)}%`;
    return (
      <span
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden',
          frameClass,
          SIZE[size],
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.src}
          alt=""
          draggable={false}
          className="object-contain"
          style={{ width: pct, height: pct }}
        />
      </span>
    );
  }

  if (platform === 'phone') {
    return (
      <span
        className={cn(
          'flex shrink-0 items-center justify-center',
          resolvedVariant === 'framed'
            ? 'rounded-xl bg-[var(--profile-accent-soft)] ring-1 ring-[var(--border)]'
            : resolvedVariant === 'soft'
              ? 'rounded-xl bg-[var(--surface)]'
              : 'rounded-lg',
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
          'flex shrink-0 items-center justify-center',
          resolvedVariant === 'framed'
            ? 'rounded-xl bg-[var(--profile-accent-soft)] ring-1 ring-[var(--border)]'
            : resolvedVariant === 'soft'
              ? 'rounded-xl bg-[var(--surface)]'
              : 'rounded-lg',
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
        'flex shrink-0 items-center justify-center',
        frameClass,
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
      className={cn(
        'size-4 shrink-0 text-[var(--muted-foreground)]/70 rtl:rotate-0 ltr:rotate-180',
        className,
      )}
      aria-hidden
    />
  );
}
