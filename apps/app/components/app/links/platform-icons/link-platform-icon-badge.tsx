'use client';

import type { LinkCatalogTypeId } from '@/lib/links/link-type-catalog';
import { getPlatformIconAsset } from '@/lib/links/platform-icon-assets';
import { cn } from '@/lib/utils';
import { LinkPlatformIcon, PLATFORM_ICON_STYLES } from './link-platform-icon';

function getBadgeInset(type: LinkCatalogTypeId): string {
  const opticalScale = getPlatformIconAsset(type)?.opticalScale;
  if (!opticalScale) return '20%';
  const inset = Math.min(34, Math.round(20 + (1 - opticalScale) * 36));
  return `${inset}%`;
}

interface LinkPlatformIconBadgeProps {
  type: LinkCatalogTypeId;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SHELL: Record<NonNullable<LinkPlatformIconBadgeProps['size']>, string> = {
  sm: 'size-10 rounded-full',
  md: 'size-11 rounded-full',
  lg: 'size-12 rounded-full',
};

export function LinkPlatformIconBadge({
  type,
  size = 'md',
  className,
}: LinkPlatformIconBadgeProps) {
  const styles = PLATFORM_ICON_STYLES[type];
  const shell = SHELL[size];

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden',
        shell,
        styles.bg,
        styles.ring,
        className,
      )}
    >
      <div
        className="absolute flex items-center justify-center"
        style={{ inset: getBadgeInset(type) }}
      >
        <LinkPlatformIcon
          type={type}
          className={cn('h-full w-full', styles.brand ? undefined : styles.fg)}
          forceContain
        />
      </div>
    </div>
  );
}
