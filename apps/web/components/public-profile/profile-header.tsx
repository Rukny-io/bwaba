'use client';

import { useState } from 'react';
import { BadgeCheck, Mail, Phone } from 'lucide-react';
import { useMediaUrl } from './media-url-context';
import type { PublicProfile, PublicSocialLink } from './types';
import { cn } from './utils';

interface ProfileHeaderProps {
  profile: PublicProfile;
  compact?: boolean;
}

function contactFromSocialLinks(links: PublicSocialLink[]): {
  email: string | null;
  phone: string | null;
} {
  let email: string | null = null;
  let phone: string | null = null;

  for (const link of links) {
    const platform = link.platform?.toLowerCase();
    if (!email && platform === 'email') {
      const raw = (link.username || link.url || '').trim();
      email = raw.replace(/^mailto:/i, '') || null;
    }
    if (!phone && (platform === 'phone' || platform === 'tel')) {
      const raw = (link.username || link.url || '').trim();
      phone = raw.replace(/^tel:/i, '').trim() || null;
    }
  }

  return { email, phone };
}

function resolvePublicContact(profile: PublicProfile): {
  email: string | null;
  phone: string | null;
} {
  const fromLinks = contactFromSocialLinks(profile.socialLinks ?? []);

  const emailHidden = profile.hideEmail === true;
  const phoneHidden = profile.hidePhone === true;

  const emailRaw =
    profile.email?.trim() ||
    profile.user?.email?.trim() ||
    fromLinks.email ||
    null;

  const phoneRaw =
    profile.phone?.trim() ||
    profile.user?.phoneNumber?.trim() ||
    profile.user?.phone?.trim() ||
    fromLinks.phone ||
    null;

  return {
    email: emailHidden ? null : emailRaw,
    phone: phoneHidden ? null : phoneRaw,
  };
}

export function ProfileHeader({ profile, compact }: ProfileHeaderProps) {
  const resolveMediaUrl = useMediaUrl();
  const avatarUrl = resolveMediaUrl(profile.avatar);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const displayName = profile.name?.trim() || profile.username;
  const showAvatar = Boolean(avatarUrl) && !avatarFailed;
  const bio = profile.bio?.trim();
  const { phone, email } = resolvePublicContact(profile);
  const hasContact = Boolean(phone || email);

  return (
    <header className={cn('relative flex flex-col items-center text-center', compact ? 'mt-5' : 'mt-7')}>
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-full bg-[var(--surface-secondary)]',
          'shadow-[0_2px_12px_rgba(15,23,42,0.08)]',
          compact ? 'size-[4.5rem]' : 'size-[5.25rem] sm:size-24',
        )}
      >
        {showAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
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

      <div className={cn('mt-3 flex max-w-full items-center justify-center gap-1 px-2')}>
        <h1
          className={cn(
            'truncate font-bold tracking-tight text-[var(--foreground)]',
            compact ? 'text-base' : 'text-lg sm:text-xl',
          )}
        >
          {displayName}
        </h1>
        {profile.isRuknyVerified ? (
          <BadgeCheck
            className={cn(
              'shrink-0 fill-sky-500 text-white',
              compact ? 'size-4' : 'size-5',
            )}
            aria-label="موثّق"
          />
        ) : null}
      </div>

      <p
        className={cn(
          'mt-1 font-medium text-[var(--muted-foreground)]',
          compact ? 'text-xs' : 'text-[13px]',
        )}
        dir="ltr"
      >
        @{profile.username}
      </p>

      {bio ? (
        <p
          className={cn(
            'mt-2.5 max-w-[20rem] px-3 leading-relaxed text-[var(--foreground)]/85',
            compact ? 'text-xs' : 'text-[13px] sm:text-sm',
          )}
          dir="auto"
        >
          {bio}
        </p>
      ) : null}

      {hasContact ? (
        <div
          className={cn(
            'mt-3 flex flex-col items-center gap-1.5 text-[12px] font-medium',
            compact && 'mt-2.5 gap-1 text-[11px]',
          )}
        >
          {email ? (
            <a
              href={`mailto:${email}`}
              className="inline-flex max-w-full items-center justify-center gap-1.5 px-2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              dir="ltr"
            >
              <Mail className="size-3.5 shrink-0" aria-hidden />
              <span className="break-all">{email}</span>
            </a>
          ) : null}
          {phone ? (
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center justify-center gap-1.5 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              dir="ltr"
            >
              <Phone className="size-3.5 shrink-0" aria-hidden />
              <span>{phone}</span>
            </a>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
