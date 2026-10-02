'use client';

import { useState } from 'react';
import { ArrowUpRight, Lock, X } from 'lucide-react';
import { useMediaUrl } from './media-url-context';
import { getPlatformIconAsset } from './platform-icon-assets';
import { ProfilePlatformIcon } from './profile-platform-icon';
import type { PublicSocialLink } from './types';
import { cn } from './utils';
import { unlockSocialLink } from '@/lib/public-profile-api';

function isHeaderOrText(platform: string): boolean {
  return platform === 'header' || platform === 'text';
}

function isFormLink(link: PublicSocialLink): boolean {
  return link.platform === 'form';
}

function formSlugFromLink(link: PublicSocialLink): string | null {
  if (link.username) return link.username;
  try {
    const url = new URL(link.url);
    const match = url.pathname.match(/\/f\/([a-z0-9]{6})$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function linkHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return null;
  }
}

/** Prefer stored platform; otherwise infer from URL so icons still show for generic `url` links. */
function platformForIcon(link: PublicSocialLink): string {
  const raw = link.platform?.toLowerCase().trim() || 'url';
  if (raw && raw !== 'url' && raw !== 'link' && raw !== 'website' && raw !== 'web') {
    return raw === 'twitter' ? 'x' : raw;
  }
  const host = (linkHostname(link.url) || '').toLowerCase();
  if (!host) return 'url';
  if (host.includes('youtube') || host === 'youtu.be') return 'youtube';
  if (host.includes('instagram')) return 'instagram';
  if (host.includes('tiktok')) return 'tiktok';
  if (host === 'x.com' || host.includes('twitter')) return 'x';
  if (host.includes('linkedin')) return 'linkedin';
  if (host.includes('facebook') || host === 'fb.com') return 'facebook';
  if (host.includes('whatsapp') || host === 'wa.me') return 'whatsapp';
  if (host.includes('telegram') || host === 't.me') return 'telegram';
  if (host.includes('snapchat')) return 'snapchat';
  return 'url';
}

const LOGO_SHELL =
  'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)] ring-1 ring-[var(--border)] sm:size-10';

const MAJOR_ICON_PLATFORMS = new Set([
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

function LinkLeadingVisual({ link }: { link: PublicSocialLink }) {
  const resolveMedia = useMediaUrl();
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const thumbnailSrc = resolveMedia(link.thumbnail);
  const showThumbnail = Boolean(thumbnailSrc) && !thumbnailFailed;
  const iconPlatform = platformForIcon(link);
  const hasBrandIcon = Boolean(getPlatformIconAsset(iconPlatform));
  const isMajor = MAJOR_ICON_PLATFORMS.has(iconPlatform);

  /**
   * Prefer brand icons when we know the platform — custom thumbs often fail
   * or fill the circle (empty gray blobs). Use custom thumb only for generic URLs.
   */
  if (showThumbnail && !hasBrandIcon) {
    return (
      <span className={LOGO_SHELL}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailSrc!}
          alt=""
          onError={() => setThumbnailFailed(true)}
          className="size-full scale-[1.08] object-cover"
        />
      </span>
    );
  }

  return (
    <ProfilePlatformIcon
      platform={iconPlatform}
      size="md"
      variant="plain"
      className={LOGO_SHELL}
      markScale={isMajor ? (iconPlatform === 'youtube' ? 0.72 : 0.8) : 1.06}
    />
  );
}

const linkRowClass = (preview?: boolean) =>
  cn(
    'group/link profile-link-row',
    'flex w-full items-center gap-3 rounded-3xl border border-[var(--border)] px-3 py-3 sm:px-3.5 sm:py-3.5',
    'text-[var(--foreground)]',
    !preview &&
      'transition-[transform,border-color] duration-200 ease-out hover:border-[var(--muted-foreground)]/35 active:scale-[0.99]',
    preview && 'pointer-events-none',
  );

const linkCardClass = (preview?: boolean) =>
  cn(
    'flex w-full items-center gap-3 rounded-3xl border border-[var(--border)] px-3 py-3 sm:px-3.5 sm:py-3.5',
    'text-sm font-semibold text-[var(--foreground)]',
    !preview &&
      'transition-[transform,border-color] duration-200 ease-out hover:border-[var(--muted-foreground)]/35 active:scale-[0.99]',
    preview && 'pointer-events-none',
  );

interface ProfileLinkButtonProps {
  link: PublicSocialLink;
  preview?: boolean;
  onTrackClick?: (linkId: string) => void;
}

export function ProfileLinkButton({ link, preview, onTrackClick }: ProfileLinkButtonProps) {
  const [lockOpen, setLockOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const label = link.title || link.username || link.platform;
  const isForm = isFormLink(link);
  const formSlug = isForm ? formSlugFromLink(link) : null;
  const locked = Boolean(link.isLocked);
  const href = locked ? '#' : isForm && formSlug ? `/f/${formSlug}` : link.url;

  function handleTrack() {
    if (!preview && !isHeaderOrText(link.platform) && onTrackClick) {
      onTrackClick(link.id);
    }
  }

  async function handleUnlock(event: React.FormEvent) {
    event.preventDefault();
    setUnlocking(true);
    setUnlockError(null);
    try {
      const { url } = await unlockSocialLink(link.id, password);
      handleTrack();
      setLockOpen(false);
      setPassword('');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setUnlockError(error instanceof Error ? error.message : 'كلمة المرور غير صحيحة');
    } finally {
      setUnlocking(false);
    }
  }

  if (isHeaderOrText(link.platform)) {
    if (link.platform === 'header') {
      return (
        <div className="px-1 pt-4 pb-1">
          <p className="text-center text-[11px] font-bold tracking-wide text-[var(--muted-foreground)]">
            {label}
          </p>
        </div>
      );
    }
    return (
      <div className="px-3 py-2">
        <p className="text-center text-[13px] leading-relaxed text-[var(--muted-foreground)]">{label}</p>
      </div>
    );
  }

  const external = !locked && !isForm && href.startsWith('http');
  const className = linkRowClass(preview);
  const hostname = external ? linkHostname(href) : null;
  const showHostname =
    hostname &&
    hostname.toLowerCase() !== label.trim().toLowerCase() &&
    !label.trim().toLowerCase().includes(hostname.toLowerCase());

  const content = (
    <>
      <LinkLeadingVisual link={link} />
      <span className="min-w-0 flex-1 text-start">
        <span className="flex items-center gap-1.5 truncate text-[13px] font-semibold leading-snug tracking-tight">
          {label}
          {locked ? <Lock className="size-3 shrink-0 text-[var(--muted-foreground)]" aria-hidden /> : null}
          {link.isPinned ? (
            <span className="rounded bg-[var(--surface-secondary)] px-1 text-[10px] font-medium text-[var(--muted-foreground)]">
              مثبت
            </span>
          ) : null}
        </span>
        {showHostname ? (
          <span className="mt-0.5 block truncate text-[11px] font-medium text-[var(--muted-foreground)]">
            {hostname}
          </span>
        ) : locked ? (
          <span className="mt-0.5 block truncate text-[11px] font-medium text-[var(--muted-foreground)]">
            محمي بكلمة مرور
          </span>
        ) : null}
      </span>
      <ArrowUpRight
        className={cn(
          'size-4 shrink-0 text-[var(--muted-foreground)]/55',
          'transition-[transform,opacity] duration-200',
          'group-hover/link:-translate-y-px group-hover/link:translate-x-px group-hover/link:opacity-90',
          'rtl:-scale-x-100',
        )}
        aria-hidden
      />
    </>
  );

  if (preview) {
    return <div className={className}>{content}</div>;
  }

  if (locked) {
    return (
      <>
        <button
          type="button"
          className={className}
          onClick={() => {
            setUnlockError(null);
            setLockOpen(true);
          }}
        >
          {content}
        </button>
        {lockOpen ? (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
            <form
              onSubmit={(event) => void handleUnlock(event)}
              className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">رابط محمي</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    أدخل كلمة المرور لفتح «{label}»
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-1 text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)]"
                  onClick={() => setLockOpen(false)}
                  aria-label="إغلاق"
                >
                  <X className="size-4" />
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
                placeholder="كلمة المرور"
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--foreground)]"
              />
              {unlockError ? (
                <p className="mt-2 text-xs text-[var(--danger)]">{unlockError}</p>
              ) : null}
              <button
                type="submit"
                disabled={unlocking || !password.trim()}
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50"
              >
                {unlocking ? 'جارٍ التحقق…' : 'فتح الرابط'}
              </button>
            </form>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onClick={handleTrack}
      className={className}
    >
      {content}
    </a>
  );
}

export { linkCardClass };
