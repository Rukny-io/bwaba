'use client';

import type { LinkCatalogTypeId } from '@/lib/links/link-type-catalog';
import { getPlatformIconAsset } from '@/lib/links/platform-icon-assets';
import { cn } from '@/lib/utils';
import { LinkPlatformIcon, PLATFORM_ICON_STYLES } from './link-platform-icon';

interface LinkPlatformIconBadgeProps {
  type: LinkCatalogTypeId;
  size?: 'sm' | 'md';
  className?: string;
}

export function LinkPlatformIconBadge({
  type,
  size = 'md',
  className,
}: LinkPlatformIconBadgeProps) {
  const styles = PLATFORM_ICON_STYLES[type];
  const asset = getPlatformIconAsset(type);
  const shell = size === 'sm' ? 'size-9 rounded-xl' : 'size-11 rounded-2xl';
  const shellPx = size === 'sm' ? 36 : 44;
  const iconSize = asset?.fill ? shellPx : size === 'sm' ? 18 : 22;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center',
        asset?.fill ? 'overflow-hidden p-0' : 'p-2',
        shell,
        styles.bg,
        className,
      )}
    >
      <LinkPlatformIcon
        type={type}
        size={iconSize}
        className={styles.brand ? undefined : styles.fg}
      />
    </div>
  );
}
