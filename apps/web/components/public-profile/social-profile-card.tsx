'use client';

import { ExternalLink } from 'lucide-react';
import { ProfilePlatformIcon } from './profile-platform-icon';
import type { PublicSocialLink } from './types';
import { cn } from './utils';

const PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  x: 'X',
  twitter: 'X',
  youtube: 'YouTube',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  snapchat: 'Snapchat',
  telegram: 'Telegram',
};

const PLATFORM_BACKDROP: Record<string, string> = {
  instagram: '#161823',
  tiktok: '#161823',
  x: '#000000',
  twitter: '#000000',
  youtube: '#ff0000',
  facebook: '#1877f2',
  linkedin: '#0a66c2',
  snapchat: '#fffc00',
  telegram: '#2aabee',
};

interface SocialProfileCardProps {
  link: PublicSocialLink;
  preview?: boolean;
  onTrackClick?: (linkId: string) => void;
}

export function SocialProfileCard({
  link,
  preview,
  onTrackClick,
}: SocialProfileCardProps) {
  const platform = link.platform.toLowerCase();
  const brand = PLATFORM_LABEL[platform] ?? link.platform;
  const backdrop = PLATFORM_BACKDROP[platform] ?? '#161823';
  const handle = link.username?.replace(/^@/, '') || null;
  const displayName = link.title?.trim() || (handle ? `@${handle}` : brand);
  const isLightBrand = platform === 'snapchat';

  function handleClick() {
    if (!preview && onTrackClick) onTrackClick(link.id);
  }

  const body = (
    <>
      <div
        className="relative h-20 overflow-hidden"
        style={{ backgroundColor: backdrop }}
      >
        {link.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={link.thumbnail}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-35"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p
            className={cn(
              'text-center text-[12px] font-bold tracking-wide',
              isLightBrand ? 'text-black/80' : 'text-white/90',
            )}
          >
            {brand}
          </p>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col px-3 pb-3">
        <div className="-mt-6 flex items-center justify-between gap-2">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)] ring-[3px] ring-[var(--surface)]">
            {link.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={link.thumbnail} alt="" className="size-full object-cover" />
            ) : (
              <ProfilePlatformIcon platform={link.platform} size="sm" />
            )}
          </div>

          <span className="inline-flex h-7 shrink-0 items-center rounded-full bg-[#1d9bf0] px-3 text-[11px] font-bold text-white">
            Follow
          </span>
        </div>

        <div className="mt-2.5 min-w-0 space-y-0.5">
          <h3 className="truncate text-[13px] font-bold leading-tight text-[var(--foreground)]">
            {displayName}
          </h3>
          {handle ? (
            <p
              className="truncate text-[11px] leading-tight text-[var(--muted-foreground)]"
              dir="ltr"
            >
              @{handle}
            </p>
          ) : null}
        </div>

        <div className="mt-auto pt-3">
          <span className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-full bg-[var(--foreground)] text-[11px] font-bold text-[var(--background)]">
            Open on {brand}
            <ExternalLink className="size-3" />
          </span>
        </div>
      </div>
    </>
  );

  const className = cn(
    'flex h-full flex-col overflow-hidden rounded-4xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_8px_24px_rgba(15,23,42,0.06)]',
    preview && 'pointer-events-none',
  );

  if (preview) {
    return (
      <article className={className} dir="ltr">
        {body}
      </article>
    );
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
      dir="ltr"
    >
      {body}
    </a>
  );
}
