'use client';

import type { LinkCatalogTypeId } from '@/lib/links/link-type-catalog';
import { getPlatformIconAsset } from '@/lib/links/platform-icon-assets';
import { cn } from '@/lib/utils';

interface LinkPlatformIconProps {
  type: LinkCatalogTypeId;
  className?: string;
  size?: number;
}

function PlatformPublicIcon({
  src,
  size,
  className,
  crop,
  fill,
}: {
  src: string;
  size: number;
  className?: string;
  crop?: { scale: number; align?: 'left' | 'center' };
  fill?: boolean;
}) {
  if (crop) {
    return (
      <div
        className={cn('relative shrink-0 overflow-hidden', className)}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <img
          src={src}
          alt=""
          className={cn(
            'absolute top-1/2 h-[88%] w-auto max-w-none -translate-y-1/2',
            crop.align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0',
          )}
          style={{ width: `${crop.scale * 100}%` }}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      width={fill ? undefined : size}
      height={fill ? undefined : size}
      className={cn(
        'shrink-0',
        fill ? 'size-full object-cover' : 'object-contain',
        className,
      )}
      style={fill ? { width: size, height: size } : undefined}
      aria-hidden
      draggable={false}
    />
  );
}

function InlinePlatformIcon({
  type,
  className,
  size = 20,
}: LinkPlatformIconProps) {
  const props = {
    width: size,
    height: size,
    className: cn('shrink-0', className),
    'aria-hidden': true as const,
  };

  switch (type) {
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.5h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.23 2.68.23v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.5h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
        </svg>
      );
    case 'email':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    case 'phone':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.19a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case 'form':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h5" />
        </svg>
      );
    case 'header':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
          <path d="M4 6h16M4 12h10M4 18h14" />
        </svg>
      );
    case 'text':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
          <path d="M4 7V5h16v2M9 5v14M15 5v14M5 19h14" />
        </svg>
      );
    case 'url':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
  }
}

export function LinkPlatformIcon({ type, className, size = 20 }: LinkPlatformIconProps) {
  const asset = getPlatformIconAsset(type);

  if (asset) {
    return (
      <PlatformPublicIcon
        src={asset.src}
        size={size}
        crop={asset.crop}
        fill={asset.fill}
        className={className}
      />
    );
  }

  return <InlinePlatformIcon type={type} className={className} size={size} />;
}

/** ألوان خلفية/أيقونة لكل منصة */
export const PLATFORM_ICON_STYLES: Record<
  LinkCatalogTypeId,
  { bg: string; fg: string; brand?: boolean }
> = {
  url: { bg: 'bg-violet-100 dark:bg-violet-950/50', fg: 'text-violet-600' },
  instagram: { bg: 'bg-white dark:bg-white/95', fg: '', brand: true },
  tiktok: { bg: 'bg-black', fg: '', brand: true },
  youtube: { bg: 'bg-white dark:bg-white/95', fg: '', brand: true },
  x: { bg: 'bg-white dark:bg-white/95', fg: '', brand: true },
  linkedin: { bg: 'bg-white dark:bg-white/95', fg: '', brand: true },
  facebook: { bg: 'bg-blue-100 dark:bg-blue-950/50', fg: 'text-blue-600' },
  whatsapp: { bg: 'bg-emerald-500', fg: '', brand: true },
  telegram: { bg: 'bg-white dark:bg-white/95', fg: '', brand: true },
  snapchat: { bg: 'bg-yellow-400 dark:bg-yellow-500', fg: '', brand: true },
  email: { bg: 'bg-white dark:bg-white/95', fg: '', brand: true },
  phone: { bg: 'bg-green-100 dark:bg-green-950/50', fg: 'text-green-600' },
  form: { bg: 'bg-white dark:bg-white/95', fg: '', brand: true },
  header: { bg: 'bg-neutral-100 dark:bg-neutral-800', fg: 'text-foreground' },
  text: { bg: 'bg-neutral-100 dark:bg-neutral-800', fg: 'text-foreground' },
};
