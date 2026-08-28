'use client';

import type { LinkCatalogTypeId } from '@/lib/links/link-type-catalog';
import { getPlatformIconAsset } from '@/lib/links/platform-icon-assets';
import { cn } from '@/lib/utils';
import { LinkPlatformIcon, PLATFORM_ICON_STYLES } from './link-platform-icon';

interface LinkPlatformIconBadgeProps {
  type: LinkCatalogTypeId;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SHELL: Record<NonNullable<LinkPlatformIconBadgeProps['size']>, string> = {
  sm: 'size-9 rounded-xl',
  md: 'size-11 rounded-2xl',
  lg: 'size-12 rounded-2xl',
};

const SHELL_PX: Record<NonNullable<LinkPlatformIconBadgeProps['size']>, number> = {
  sm: 36,
  md: 44,
  lg: 48,
};

const ICON_PX: Record<NonNullable<LinkPlatformIconBadgeProps['size']>, number> = {
  sm: 18,
  md: 22,
  lg: 24,
};

export function LinkPlatformIconBadge({
  type,
  size = 'md',
  className,
}: LinkPlatformIconBadgeProps) {
  const styles = PLATFORM_ICON_STYLES[type];
  const asset = getPlatformIconAsset(type);
  const shell = SHELL[size];
  const shellPx = SHELL_PX[size];
  const iconSize = asset?.fill ? shellPx : ICON_PX[size];

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
