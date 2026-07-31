'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Link2, Loader2 } from 'lucide-react';
import { API_PUBLIC_BASE } from '@/lib/config';
import { cn } from './utils';

export interface InstagramEmbedProfile {
  username: string;
  name: string | null;
  profilePicUrl: string | null;
  biography: string | null;
  website: string | null;
  followersCount: number | null;
  followsCount: number | null;
  mediaCount: number | null;
  profileUrl: string;
}

export interface InstagramEmbedMedia {
  id: string;
  mediaType: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string | null;
  caption: string | null;
}

export interface InstagramEmbedPayload {
  linkId: string;
  layout: 'profile_card' | 'media_grid';
  profile: InstagramEmbedProfile;
  media: InstagramEmbedMedia[];
  coverUrl: string | null;
}

function formatCount(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

function websiteHost(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(
      /^www\./,
      '',
    );
  } catch {
    return url;
  }
}

async function fetchEmbed(linkId: string): Promise<InstagramEmbedPayload> {
  const res = await fetch(
    `${API_PUBLIC_BASE}/integrations/instagram/embed/${encodeURIComponent(linkId)}`,
  );
  if (!res.ok) {
    throw new Error('failed');
  }
  return res.json();
}

function InstagramBrandBackdrop({ coverUrl }: { coverUrl: string | null }) {
  return (
    <div className="relative h-20 overflow-hidden bg-[#161823]">
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt=""
          className="absolute inset-0 size-full object-cover opacity-35"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-center text-[12px] font-bold tracking-wide text-white/90">
          Instagram
        </p>
      </div>
    </div>
  );
}

function FollowButton({
  href,
  preview,
  className,
}: {
  href: string;
  preview?: boolean;
  className?: string;
}) {
  const classes = cn(
    'inline-flex h-7 items-center justify-center rounded-full bg-[#1d9bf0] px-3 text-[11px] font-bold text-white',
    'transition-opacity hover:opacity-90',
    className,
  );

  if (preview) {
    return <span className={classes}>Follow</span>;
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
      Follow
    </a>
  );
}

function InstagramCardShell({
  embed,
  showGrid,
  preview,
}: {
  embed: InstagramEmbedPayload;
  showGrid: boolean;
  preview?: boolean;
}) {
  const { profile, media, coverUrl } = embed;
  const displayName = profile.name?.trim() || profile.username;
  const followHref = profile.profileUrl;

  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
      dir="ltr"
    >
      <InstagramBrandBackdrop coverUrl={coverUrl} />

      <div className="relative flex flex-1 flex-col px-3 pb-3">
        <div className="-mt-6 flex items-center justify-between gap-2">
          <div className="size-12 shrink-0 overflow-hidden rounded-full bg-[var(--surface-secondary)] ring-[3px] ring-[var(--surface)]">
            {profile.profilePicUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profilePicUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-[#161823] text-sm font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <FollowButton href={followHref} preview={preview} className="shrink-0" />
        </div>

        <div className="mt-2.5 min-w-0 space-y-0.5">
          <h3 className="truncate text-[13px] font-bold leading-tight text-[var(--foreground)]">
            {displayName}
          </h3>
          <p className="truncate text-[11px] leading-tight text-[var(--muted-foreground)]">
            @{profile.username}
          </p>
        </div>

        {profile.biography && !showGrid ? (
          <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-[var(--foreground)]/80">
            {profile.biography}
          </p>
        ) : null}

        <div className="mt-2.5 grid grid-cols-3 gap-1 text-center text-[10px] leading-tight text-[var(--muted-foreground)]">
          <div className="min-w-0">
            <p className="truncate font-bold text-[var(--foreground)]">
              {formatCount(profile.followsCount)}
            </p>
            <p className="truncate">Following</p>
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-[var(--foreground)]">
              {formatCount(profile.followersCount)}
            </p>
            <p className="truncate">Followers</p>
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-[var(--foreground)]">
              {formatCount(profile.mediaCount)}
            </p>
            <p className="truncate">Posts</p>
          </div>
        </div>

        {profile.website && !showGrid ? (
          preview ? (
            <p className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-[11px] font-medium text-[#1d9bf0]">
              <Link2 className="size-3 shrink-0" />
              <span className="truncate">{websiteHost(profile.website)}</span>
            </p>
          ) : (
            <a
              href={
                profile.website.startsWith('http')
                  ? profile.website
                  : `https://${profile.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-[11px] font-medium text-[#1d9bf0] hover:underline"
            >
              <Link2 className="size-3 shrink-0" />
              <span className="truncate">{websiteHost(profile.website)}</span>
            </a>
          )
        ) : null}

        {showGrid ? (
          <div className="mt-2.5 grid grid-cols-3 gap-0.5 overflow-hidden rounded-xl ring-1 ring-[var(--border)]">
            {Array.from({ length: 9 }).map((_, i) => {
              const item = media[i];
              const src = item?.thumbnailUrl || item?.mediaUrl;
              const content = (
                <div className="relative aspect-square bg-[var(--surface-secondary)]">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-[var(--surface-secondary)]" />
                  )}
                  {item?.mediaType === 'VIDEO' || item?.mediaType === 'REELS' ? (
                    <span className="absolute end-1 top-1 rounded bg-black/55 px-1 text-[9px] font-bold text-white">
                      ▶
                    </span>
                  ) : null}
                </div>
              );

              if (item?.permalink && !preview) {
                return (
                  <a
                    key={item.id}
                    href={item.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {content}
                  </a>
                );
              }

              return <div key={item?.id ?? `empty-${i}`}>{content}</div>;
            })}
          </div>
        ) : null}

        <div className="mt-auto pt-3">
          {preview ? (
            <span className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-full bg-[var(--foreground)] text-[11px] font-bold text-[var(--background)]">
              Open on Instagram
              <ExternalLink className="size-3" />
            </span>
          ) : (
            <a
              href={followHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-full bg-[var(--foreground)] text-[11px] font-bold text-[var(--background)] transition-opacity hover:opacity-90"
            >
              Open on Instagram
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

interface InstagramRichLinkProps {
  linkId: string;
  layout: 'profile_card' | 'media_grid';
  preview?: boolean;
}

export function InstagramRichLink({ linkId, layout, preview }: InstagramRichLinkProps) {
  const [embed, setEmbed] = useState<InstagramEmbedPayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    fetchEmbed(linkId)
      .then((data) => {
        if (!cancelled) setEmbed(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [linkId]);

  if (error) {
    return (
      <div
        className={cn(
          'rounded-[1.35rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center text-sm text-[var(--muted-foreground)]',
        )}
      >
        تعذر تحميل بطاقة إنستغرام
      </div>
    );
  }

  if (!embed) {
    return (
      <div className="flex items-center justify-center rounded-[1.35rem] border border-[var(--border)] bg-[var(--surface)] py-16">
        <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  return (
    <InstagramCardShell
      embed={embed}
      showGrid={layout === 'media_grid'}
      preview={preview}
    />
  );
}
