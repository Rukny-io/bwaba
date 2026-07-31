'use client';

import { useState } from 'react';
import { BadgeCheck } from 'lucide-react';
import { useMediaUrl } from '../media-url-context';
import type { PublicProfile } from '../types';
import { cn } from '../utils';

interface ProfileHeaderProps {
  profile: PublicProfile;
  compact?: boolean;
}

export function ProfileHeader({ profile, compact }: ProfileHeaderProps) {
  const resolveMediaUrl = useMediaUrl();
  const avatarUrl = resolveMediaUrl(profile.avatar);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const displayName = profile.name?.trim() || profile.username;
  const showAvatar = Boolean(avatarUrl) && !avatarFailed;

  return (
    <header
      className={cn(
        'flex flex-col items-center gap-2.5 px-2 text-center',
        compact ? 'mt-5' : 'mt-7',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-full bg-[var(--surface-secondary)]',
          'shadow-[0_8px_24px_rgba(15,23,42,0.12)]',
          compact ? 'size-20' : 'size-[5.5rem] sm:size-28',
        )}
      >
        {showAvatar ? (
          <img
            src={avatarUrl!}
            alt=""
            className="size-full object-cover"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-[var(--profile-accent-soft)] text-2xl font-bold text-[var(--primary)]">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-center gap-1.5">
          <h1
            className={cn(
              'font-bold tracking-tight text-[var(--foreground)]',
              compact ? 'text-lg' : 'text-2xl sm:text-[1.65rem]',
            )}
          >
            {displayName}
          </h1>
          {profile.isRuknyVerified ? (
            <BadgeCheck
              className={cn('shrink-0 text-sky-500', compact ? 'size-5' : 'size-6')}
              aria-label="موثّق"
            />
          ) : null}
        </div>
        <p
          className="inline-flex items-center rounded-full bg-[var(--surface-secondary)] px-3 py-0.5 text-xs font-medium text-[var(--muted-foreground)]"
          dir="ltr"
        >
          @{profile.username}
        </p>
      </div>

      {profile.bio ? (
        <p
          className={cn(
            'max-w-sm leading-relaxed text-[var(--muted-foreground)]',
            compact ? 'text-xs' : 'text-sm sm:text-[0.95rem]',
          )}
        >
          {profile.bio}
        </p>
      ) : null}
    </header>
  );
}
