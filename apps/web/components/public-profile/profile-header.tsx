'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BadgeCheck, Check, Link2 } from 'lucide-react';
import { resolveAvatarUrl } from '@/lib/media-url';
import type { PublicProfile } from './types';
import { cn } from './utils';

interface ProfileHeaderProps {
  profile: PublicProfile;
  compact?: boolean;
  withTopBar?: boolean;
  productCount?: number;
  linkCount?: number;
  formCount?: number;
}

export const PROFILE_STORE_SECTION_ID = 'profile-store';

function formatStatsLineEn(
  productCount: number,
  linkCount: number,
  formCount: number,
): string {
  const parts: string[] = [];
  if (productCount > 0) {
    parts.push(`${productCount} ${productCount === 1 ? 'product' : 'products'}`);
  }
  if (linkCount > 0) {
    parts.push(`${linkCount} ${linkCount === 1 ? 'link' : 'links'}`);
  }
  if (formCount > 0) {
    parts.push(`${formCount} ${formCount === 1 ? 'form' : 'forms'}`);
  }
  return parts.join(' · ');
}

export function ProfileHeader({
  profile,
  compact,
  withTopBar = false,
  productCount = 0,
  linkCount = 0,
  formCount = 0,
}: ProfileHeaderProps) {
  const t = useTranslations('publicProfile.header');
  const avatarUrl = resolveAvatarUrl(profile.avatar);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const displayName = profile.name?.trim() || profile.username;
  const showAvatar = Boolean(avatarUrl) && !avatarFailed;
  const bio = profile.bio?.trim();
  const hasStore = productCount > 0;

  const statsLine = useMemo(
    () => formatStatsLineEn(productCount, linkCount, formCount),
    [formCount, linkCount, productCount],
  );

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      // Clipboard unavailable.
    }
  }, []);

  const avatarSize = compact ? 'size-14' : 'size-16 sm:size-[4.25rem]';
  const actionSize = compact ? 'h-10 text-xs' : 'h-11 text-[13px]';
  const iconSize = compact ? 'size-3.5' : 'size-4';

  return (
    <header
      className={cn(
        'relative w-full',
        compact
          ? 'pt-4 pb-4'
          : withTopBar
            ? 'pt-3 pb-5 sm:pt-4 sm:pb-6'
            : 'pt-8 pb-5 sm:pt-10 sm:pb-6',
      )}
    >
      <div className={cn('flex w-full flex-col', compact ? 'gap-3' : 'gap-4')}>
        <div className="flex items-center gap-3.5 sm:gap-4" dir="ltr">
          <div
            className={cn(
              'relative shrink-0 overflow-hidden rounded-full bg-[var(--surface-secondary)]',
              avatarSize,
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
              <div
                className={cn(
                  'flex size-full items-center justify-center bg-[var(--profile-accent-soft)] font-bold text-[var(--primary)]',
                  compact ? 'text-lg' : 'text-xl',
                )}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-left">
            <div className="flex max-w-full items-center gap-1.5">
              <h1
                className={cn(
                  'truncate text-left font-bold leading-tight tracking-tight text-[var(--foreground)]',
                  compact ? 'text-base' : 'text-lg sm:text-xl',
                )}
                dir="auto"
              >
                {displayName}
              </h1>
              {profile.isRuknyVerified ? (
                <BadgeCheck
                  className={cn(
                    'shrink-0 fill-sky-500 text-white',
                    compact ? 'size-4' : 'size-[1.05rem]',
                  )}
                  aria-label={t('verifiedBy')}
                />
              ) : null}
            </div>

            <p
              className={cn(
                'mt-1 text-left font-medium text-[var(--muted-foreground)]',
                compact ? 'text-[11px]' : 'text-xs sm:text-[13px]',
              )}
            >
              @{profile.username}
            </p>

            {statsLine ? (
              <p
                className={cn(
                  'mt-1 text-left text-[var(--muted-foreground)]',
                  compact ? 'text-[10px]' : 'text-[11px]',
                )}
              >
                {statsLine}
              </p>
            ) : null}
          </div>
        </div>

        {bio ? (
          <p
            className={cn(
              'whitespace-pre-line text-start leading-relaxed text-[var(--foreground)]/85',
              compact ? 'text-xs' : 'text-sm',
            )}
            dir="auto"
          >
            {bio}
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          {hasStore ? (
            <a
              href={`#${PROFILE_STORE_SECTION_ID}`}
              className={cn(
                'inline-flex flex-1 items-center justify-center rounded-full font-semibold',
                'bg-[var(--foreground)] text-[var(--background)]',
                'transition-opacity hover:opacity-90 active:scale-[0.98]',
                actionSize,
              )}
            >
              {t('store')}
            </a>
          ) : null}
          <button
            type="button"
            onClick={handleCopyLink}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-full font-semibold',
              'bg-[var(--surface-secondary)] text-[var(--foreground)]',
              'transition-colors hover:bg-[var(--border)]/35 active:scale-[0.98]',
              copyState === 'copied' && 'text-emerald-600',
              actionSize,
            )}
          >
            {copyState === 'copied' ? (
              <Check className={iconSize} aria-hidden />
            ) : (
              <Link2 className={iconSize} aria-hidden />
            )}
            {copyState === 'copied' ? t('linkCopied') : t('copyLink')}
          </button>
        </div>
      </div>
    </header>
  );
}
