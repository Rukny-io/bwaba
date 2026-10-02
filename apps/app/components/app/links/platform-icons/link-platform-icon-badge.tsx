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

/**
 * Major social brands — fixed optical size (won't edge-bleed like custom thumbs).
 * YouTube SVG already has viewBox padding, so it can sit slightly larger.
 */
const MAJOR_PLATFORMS = new Set<LinkCatalogTypeId>([
  'youtube',
  'instagram',
  'tiktok',
  'whatsapp',
  'snapchat',
  'x',
  'linkedin',
  'telegram',
  'facebook',
  'email',
]);

const MARK_RATIO_MAJOR: Partial<Record<LinkCatalogTypeId, number>> = {
  youtube: 0.72,
  instagram: 0.8,
  tiktok: 0.8,
  whatsapp: 0.8,
  snapchat: 0.8,
  x: 0.78,
  linkedin: 0.8,
  telegram: 0.8,
  facebook: 0.8,
  email: 0.78,
};

const MARK_RATIO_MAJOR_DEFAULT = 0.8;
const MARK_RATIO_DEFAULT = 1.06;

export function LinkPlatformIconBadge({
  type,
  size = 'md',
  className,
}: LinkPlatformIconBadgeProps) {
  const styles = PLATFORM_ICON_STYLES[type];
  const asset = getPlatformIconAsset(type);
  const shell = SHELL[size];
  const shellPx = SHELL_PX[size];
  const circular = Boolean(className?.includes('rounded-full'));
  const isMajor = MAJOR_PLATFORMS.has(type);
  const optical = asset?.opticalScale ?? 1;
  const ratio = isMajor
    ? (MARK_RATIO_MAJOR[type] ?? MARK_RATIO_MAJOR_DEFAULT)
    : MARK_RATIO_DEFAULT;
  const iconSize = Math.max(16, Math.round(shellPx * ratio * optical));

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden',
        circular ? 'p-0' : 'p-1',
        shell,
        styles.bg,
        className,
      )}
    >
      <LinkPlatformIcon
        type={type}
        size={iconSize}
        className={styles.brand ? undefined : styles.fg}
        forceContain
      />
    </div>
  );
}
