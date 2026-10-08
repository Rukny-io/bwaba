'use client';

import type { LinkCatalogTypeId } from '@/lib/links/link-type-catalog';
import { getUrlHostLabel } from '@/lib/links/build-link-from-type';
import { cn } from '@/lib/utils';
import { LinkPlatformIconBadge } from './link-platform-icon-badge';

interface UrlPreviewBadgeProps {
  url: string;
  platformType: LinkCatalogTypeId;
  size?: 'sm' | 'md';
}

const SHELL = {
  sm: 'size-10',
  md: 'size-11',
} as const;

export function UrlPreviewBadge({ url, platformType, size = 'sm' }: UrlPreviewBadgeProps) {
  if (platformType !== 'url') {
    return <LinkPlatformIconBadge type={platformType} size={size} />;
  }

  const host = getUrlHostLabel(url);

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full bg-[var(--surface-secondary)] ring-1 ring-black/[0.06] dark:ring-white/[0.08]',
        SHELL[size],
      )}
    >
      <img
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`}
        alt=""
        className="absolute inset-0 size-full scale-[1.28] object-cover mix-blend-multiply dark:mix-blend-screen"
        draggable={false}
      />
    </div>
  );
}
