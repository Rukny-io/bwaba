'use client';

import type { LinkCatalogTypeId } from '@/lib/links/link-type-catalog';
import { getPlatformIconAsset } from '@/lib/links/platform-icon-assets';
import { cn } from '@/lib/utils';

interface LinkPlatformIconProps {
  type: LinkCatalogTypeId;
  className?: string;
  size?: number;
  /** Prefer object-contain even when the asset is marked fill */
  forceContain?: boolean;
}

const BRAND_RING = 'ring-1 ring-black/[0.06] dark:ring-white/[0.08]';

function PlatformPublicIcon({
  src,
  size,
  className,
  crop,
  fill,
}: {
  src: string;
  size?: number;
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
      width={size}
      height={size}
      className={cn(
        'shrink-0 object-contain',
        !size && 'h-full w-full max-h-full max-w-full',
        fill && 'object-cover',
        className,
      )}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden
      draggable={false}
    />
  );
}

function InlinePlatformIcon({
  type,
  className,
  size,
}: LinkPlatformIconProps) {
  const props = {
    ...(size ? { width: size, height: size } : {}),
    className: cn('shrink-0', !size && 'h-full w-full', className),
    'aria-hidden': true as const,
  };

  switch (type) {
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.9c0-.9.3-1.6 1.7-1.6h1.7V4.1c-.3 0-1.4-.1-2.7-.1-2.7 0-4.5 1.6-4.5 4.6v2.6H7.2v3.2h2.8V22h3.5z" />
        </svg>
      );
    case 'email':
      return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
          <rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="currentColor" opacity="0.14" />
          <rect x="3" y="5.5" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="m4.5 7.5 7.5 5.2L19.5 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'phone':
      return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
          <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" fill="currentColor" opacity="0.14" />
          <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="18" r="1" fill="currentColor" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.95-1.3A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm5.29 14.71c-.22.62-1.28 1.19-1.77 1.27-.45.07-.98.1-1.58-.1-.36-.12-.83-.28-1.43-.55-2.52-1.09-4.16-3.64-4.28-3.81-.12-.17-1.02-1.36-1.02-2.6 0-1.24.65-1.85.88-2.1.22-.25.49-.31.65-.31.16 0 .33 0 .47.01.15.01.35-.06.55.42.2.48.68 1.67.74 1.79.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.12-.24.25-.1.49.14.24.62 1.02 1.33 1.65.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.55-.12.23.08 1.45.68 1.7.8.25.12.42.18.48.28.06.1.06.58-.16 1.2z"
          />
        </svg>
      );
    case 'form':
      return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
          <rect x="4" y="3.5" width="16" height="17" rx="2.5" fill="currentColor" opacity="0.12" />
          <rect x="4" y="3.5" width="16" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="8" cy="9" r="1.1" fill="currentColor" />
          <path d="M11 9h6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="8" cy="13" r="1.1" fill="currentColor" />
          <path d="M11 13h6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="8" cy="17" r="1.1" fill="currentColor" />
          <path d="M11 17h4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'header':
      return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
          <path d="M5 7.5h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M5 12h9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.72" />
          <path d="M5 16.5h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.48" />
        </svg>
      );
    case 'kick':
      return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
          <path
            d="M7.5 6.5h3.1l2.2 4.1 2.2-4.1H18l-3.6 6.2L18.2 18h-3.1l-2.3-4-2.3 4H7.5l3.6-5.3L7.5 6.5Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'discord':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M18.9 6.5A15.4 15.4 0 0 0 15.4 5c-.2.3-.4.7-.6 1.1a14.5 14.5 0 0 0-4.6 0C10 5.7 9.8 5.3 9.6 5a15.6 15.6 0 0 0-3.5 1.5C4.1 9.9 3.4 13.2 3.7 16.4c1.5 1.1 3 1.8 4.4 2.2.4-.5.7-1 .9-1.6-.5-.2-1-.5-1.4-.8.1-.1.3-.2.4-.3 2.7 1.2 5.6 1.2 8.3 0 .1.1.3.2.4.3-.5.3-1 .6-1.5.8.2.6.5 1.1.9 1.6 1.5-.4 3-.9 4.4-2.2.4-3.7-.6-7-2.5-9.9ZM9.8 14.2c-.8 0-1.4-.8-1.4-1.7s.6-1.7 1.4-1.7 1.5.8 1.4 1.7c0 .9-.6 1.7-1.4 1.7Zm4.4 0c-.8 0-1.4-.8-1.4-1.7s.6-1.7 1.4-1.7 1.4.8 1.4 1.7-.6 1.7-1.4 1.7Z" />
        </svg>
      );
    case 'spotify':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.6 14.4c-.2.3-.5.4-.8.2-2.2-1.3-4.9-1.6-8.1-.9-.3.1-.6-.1-.7-.4s.1-.6.4-.7c3.5-.8 6.6-.4 9.1 1.1.3.2.4.5.1.7zm1.2-2.7c-.2.4-.6.5-1 .3-2.5-1.5-5.7-1.9-9.4-1-.4.1-.8-.2-.9-.6-.1-.4.2-.8.6-.9 4.1-.9 7.7-.4 10.6 1.3.4.2.5.7.3 1zm1.3-2.8c-.3.4-.8.5-1.2.2-2.9-1.8-7.3-2.3-10.7-1.3-.5.1-1-.2-1.1-.7-.1-.5.2-1 .7-1.1 3.9-1.1 8.7-.5 12 1.5.4.3.5.8.2 1.2z" />
        </svg>
      );
    case 'github':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12 2.2c-5.2 0-9.4 4.2-9.4 9.4 0 4.1 2.7 7.6 6.4 8.8.5.1.7-.2.7-.5v-1.8c-2.6.6-3.2-1.2-3.2-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.4-1 .7-1.3-2.1-.2-4.2-1-4.2-4.6 0-1 .4-1.9 1-2.5-.1-.2-.4-1 .1-2.1 0 0 .8-.3 2.7 1 .8-.2 1.6-.3 2.5-.3s1.7.1 2.5.3c1.9-1.3 2.7-1 2.7-1 .5 1.1.2 1.9.1 2.1.6.7 1 1.5 1 2.5 0 3.6-2.2 4.4-4.3 4.6.3.3.6.8.6 1.6v2.4c0 .3.2.6.7.5 3.7-1.2 6.4-4.7 6.4-8.8 0-5.2-4.2-9.4-9.4-9.4Z" />
        </svg>
      );
    case 'reddit':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M12 3.2c1.3 0 2.4.4 3.4 1.1.6-.9 1.6-1.4 2.7-1.4 1.9 0 3.4 1.5 3.4 3.4 0 .5-.1 1-.3 1.4 2 1.1 3.4 3.2 3.4 5.7 0 3.6-3.2 6.5-7.1 6.5h-4.2C4.4 18.9 1.2 16 1.2 12.4c0-2.5 1.4-4.6 3.4-5.7-.2-.4-.3-.9-.3-1.4 0-1.9 1.5-3.4 3.4-3.4 1.1 0 2.1.5 2.7 1.4 1-.7 2.1-1.1 3.4-1.1Zm-3.5 6.1c-.8 0-1.4.6-1.4 1.4s.6 1.4 1.4 1.4 1.4-.6 1.4-1.4-.6-1.4-1.4-1.4Zm7 0c-.8 0-1.4.6-1.4 1.4s.6 1.4 1.4 1.4 1.4-.6 1.4-1.4-.6-1.4-1.4-1.4ZM8.4 14.8c.9.9 2.1 1.4 3.6 1.4s2.7-.5 3.6-1.4c.2-.2.2-.5 0-.7-.2-.2-.5-.2-.7 0-.7.7-1.7 1-2.9 1s-2.2-.3-2.9-1c-.2-.2-.5-.2-.7 0-.2.2-.2.5 0 .7Z" />
        </svg>
      );
    case 'soundcloud':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M4.5 13.8c-.4 0-.7.3-.7.7v2.1c0 .4.3.7.7.7.4 0 .7-.3.7-.7v-2.1c0-.4-.3-.7-.7-.7Zm1.8-.9c-.5 0-.9.4-.9.9v3.9c0 .5.4.9.9.9.5 0 .9-.4.9-.9V13.8c0-.5-.4-.9-.9-.9Zm1.9-1.4c-.6 0-1 .4-1 1v5.3c0 .6.4 1 1 1s1-.4 1-1v-5.3c0-.6-.4-1-1-1Zm2 0c-.6 0-1 .4-1 1v5.3c0 .6.4 1 1 1s1-.4 1-1v-5.3c0-.6-.4-1-1-1Zm2.1-.8c-.7 0-1.2.5-1.2 1.2v6.1c0 .7.5 1.2 1.2 1.2.7 0 1.2-.5 1.2-1.2v-6.1c0-.7-.5-1.2-1.2-1.2Zm2.2-.6c-.8 0-1.4.6-1.4 1.4v7.3c0 .8.6 1.4 1.4 1.4.8 0 1.4-.6 1.4-1.4v-7.3c0-.8-.6-1.4-1.4-1.4Zm2.3-.5c-.8 0-1.5.7-1.5 1.5v8.3c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-8.3c0-.8-.7-1.5-1.5-1.5Zm2.4 1.1c-.9 0-1.6.7-1.6 1.6v5.6c0 .9.7 1.6 1.6 1.6.9 0 1.6-.7 1.6-1.6v-5.6c0-.9-.7-1.6-1.6-1.6Z" />
        </svg>
      );
    case 'vimeo':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M4.5 8.8c.2 2.1 1.6 5 4.7 8.7 2.2 2.6 4 3.9 5.4 3.9 1.5 0 3.5-2.2 6.1-6.7 1.6-2.8 2.4-4.9 2.4-6.3 0-1.1-.8-1.7-2.3-1.7-1.6 0-2.8.7-3.7 2.1.3-1.1.4-1.9.4-2.4 0-.7-.5-1.1-1.4-1.1-.8 0-1.6.4-2.5 1.2-1.1 1-2.4 2.8-3.8 5.4-.9 1.6-1.5 2.8-1.8 3.6-.6 1.4-1.2 2.1-1.8 2.1-.5 0-1.2-.8-2.1-2.4C6.1 12.7 5.2 10.8 4.5 8.8Z" />
        </svg>
      );
    case 'text':
      return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
          <path
            d="M7.5 6.5h9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M8.5 6.5v11M15.5 6.5v11"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6.5 17.5h11"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6.5 9.5h11M6.5 12.5h8.5M6.5 15.5h10"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      );
    case 'url':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" {...props}>
          <rect x="4.5" y="4.5" width="15" height="15" rx="4" fill="currentColor" opacity="0.12" />
          <path
            d="M9.2 14.8a3.4 3.4 0 0 0 4.8 0l2.1-2.1a3.4 3.4 0 0 0-4.8-4.8l-.8.8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M14.8 9.2a3.4 3.4 0 0 0-4.8 0L7.9 11.3a3.4 3.4 0 0 0 4.8 4.8l.8-.8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

export function LinkPlatformIcon({
  type,
  className,
  size,
  forceContain = false,
}: LinkPlatformIconProps) {
  const asset = getPlatformIconAsset(type);
  const resolvedSize = size ?? (className?.includes('h-full') ? undefined : 20);

  if (asset) {
    return (
      <PlatformPublicIcon
        src={asset.src}
        size={resolvedSize}
        crop={asset.crop}
        fill={asset.fill && !forceContain}
        className={className}
      />
    );
  }

  return <InlinePlatformIcon type={type} className={className} size={resolvedSize} />;
}

type PlatformStyle = { bg: string; fg: string; brand?: boolean; ring?: string };

/** ألوان خلفية/أيقونة لكل منصة */
export const PLATFORM_ICON_STYLES: Record<LinkCatalogTypeId, PlatformStyle> = {
  url: {
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    fg: 'text-violet-600 dark:text-violet-400',
    ring: 'ring-1 ring-violet-500/10',
  },
  instagram: { bg: 'bg-[var(--surface-secondary)]', fg: '', brand: true, ring: BRAND_RING },
  tiktok: { bg: 'bg-black', fg: '', brand: true, ring: 'ring-1 ring-black/10' },
  youtube: { bg: 'bg-[var(--surface-secondary)]', fg: '', brand: true, ring: BRAND_RING },
  x: { bg: 'bg-[var(--surface-secondary)]', fg: '', brand: true, ring: BRAND_RING },
  linkedin: { bg: 'bg-[var(--surface-secondary)]', fg: '', brand: true, ring: BRAND_RING },
  facebook: {
    bg: 'bg-[#1877F2]',
    fg: 'text-white',
    ring: 'ring-1 ring-[#1877F2]/20',
  },
  whatsapp: {
    bg: 'bg-[#25D366]',
    fg: '',
    brand: true,
    ring: 'ring-1 ring-[#25D366]/20',
  },
  telegram: { bg: 'bg-[var(--surface-secondary)]', fg: '', brand: true, ring: BRAND_RING },
  snapchat: {
    bg: 'bg-[#FFFC00]',
    fg: '',
    brand: true,
    ring: 'ring-1 ring-[#FFFC00]/40',
  },
  email: { bg: 'bg-[var(--surface-secondary)]', fg: '', brand: true, ring: BRAND_RING },
  phone: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    fg: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-1 ring-emerald-500/10',
  },
  form: {
    bg: 'bg-sky-500/10 dark:bg-sky-500/15',
    fg: 'text-sky-600 dark:text-sky-400',
    ring: 'ring-1 ring-sky-500/10',
  },
  header: {
    bg: 'bg-neutral-500/10 dark:bg-neutral-400/10',
    fg: 'text-neutral-700 dark:text-neutral-300',
    ring: 'ring-1 ring-neutral-500/10',
  },
  text: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    fg: 'text-amber-700 dark:text-amber-400',
    ring: 'ring-1 ring-amber-500/10',
  },
  kick: {
    bg: 'bg-black',
    fg: '',
    brand: true,
    ring: 'ring-1 ring-[#53FC18]/20',
  },
  discord: {
    bg: 'bg-[#5865F2]',
    fg: 'text-white',
    ring: 'ring-1 ring-[#5865F2]/20',
  },
  spotify: {
    bg: 'bg-[#1DB954]',
    fg: 'text-white',
    ring: 'ring-1 ring-[#1DB954]/20',
  },
  github: {
    bg: 'bg-[#24292F] dark:bg-[#24292F]',
    fg: 'text-white',
    ring: 'ring-1 ring-black/10',
  },
  reddit: {
    bg: 'bg-[#FF4500]',
    fg: '',
    brand: true,
    ring: 'ring-1 ring-[#FF4500]/20',
  },
  soundcloud: {
    bg: 'bg-[#FF5500]',
    fg: 'text-white',
    ring: 'ring-1 ring-[#FF5500]/20',
  },
  vimeo: {
    bg: 'bg-[#1AB7EA]',
    fg: 'text-white',
    ring: 'ring-1 ring-[#1AB7EA]/20',
  },
  notion: { bg: 'bg-[var(--surface-secondary)]', fg: '', brand: true, ring: BRAND_RING },
  shopify: { bg: 'bg-[var(--surface-secondary)]', fg: '', brand: true, ring: BRAND_RING },
};
