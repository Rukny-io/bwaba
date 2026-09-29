'use client';

import { ArrowUpRight } from 'lucide-react';
import { ProfilePlatformIcon } from './profile-platform-icon';
import type { PublicSocialLink } from './types';
import { cn } from './utils';

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

const linkRowClass = (preview?: boolean) =>
  cn(
    'group/link profile-link-row',
    'flex w-full items-center gap-3 rounded-3xl px-3 py-3 sm:px-3.5 sm:py-3.5',
    'bg-[var(--surface-secondary)]/60',
    'text-[var(--foreground)]',
    !preview &&
      'transition-[background-color,transform] duration-200 ease-out hover:bg-[var(--surface-secondary)] active:scale-[0.99]',
    preview && 'pointer-events-none',
  );

const linkCardClass = (preview?: boolean) =>
  cn(
    'profile-card flex w-full items-center gap-3 rounded-xl bg-[var(--surface)] px-3.5 py-3',
    'ring-1 ring-[var(--border)]',
    'text-[13px] font-semibold text-[var(--foreground)]',
    !preview && 'profile-card-interactive active:scale-[0.99]',
    preview && 'pointer-events-none',
  );

interface ProfileLinkButtonProps {
  link: PublicSocialLink;
  preview?: boolean;
  onTrackClick?: (linkId: string) => void;
}

export function ProfileLinkButton({ link, preview, onTrackClick }: ProfileLinkButtonProps) {
  const label = link.title || link.username || link.platform;
  const isForm = isFormLink(link);
  const formSlug = isForm ? formSlugFromLink(link) : null;
  const href = isForm && formSlug ? `/f/${formSlug}` : link.url;

  function handleClick() {
    if (!preview && !isHeaderOrText(link.platform) && onTrackClick) {
      onTrackClick(link.id);
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

  const external = !isForm && href.startsWith('http');
  const className = linkRowClass(preview);
  const hostname = external ? linkHostname(href) : null;
  const showHostname =
    hostname &&
    hostname.toLowerCase() !== label.trim().toLowerCase() &&
    !label.trim().toLowerCase().includes(hostname.toLowerCase());

  const content = (
    <>
      <ProfilePlatformIcon platform={link.platform} size="sm" variant="soft" />
      <span className="min-w-0 flex-1 text-start">
        <span className="block truncate text-[13px] font-semibold leading-snug tracking-tight">
          {label}
        </span>
        {showHostname ? (
          <span className="mt-0.5 block truncate text-[11px] font-medium text-[var(--muted-foreground)]">
            {hostname}
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

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onClick={handleClick}
      className={className}
    >
      {content}
    </a>
  );
}

export { linkCardClass };
