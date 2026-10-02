'use client';

import { useState } from 'react';
import { ChevronDown, Folder, Link2 } from 'lucide-react';
import { MediaUrlProvider } from '../media-url-context';
import { getProfileThemeClass } from '../profile-themes';
import type {
  MediaUrlResolver,
  PublicLinkGroup,
  PublicProfile,
  PublicProfileForm,
  PublicSocialLink,
} from '../types';
import { cn } from '../utils';
import { ProfileFormsSection } from './profile-forms-section';
import { ProfileHeader } from './profile-header';
import { ProfileLinkButton } from './profile-link-button';

function isFormLink(platform: string): boolean {
  return platform === 'form';
}

function formSlugFromLink(link: { username: string | null; url: string }): string | null {
  if (link.username) return link.username;
  try {
    const url = new URL(link.url);
    const match = url.pathname.match(/\/f\/([a-z0-9]{6})$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function sortLinks(a: PublicSocialLink, b: PublicSocialLink) {
  const pinDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
  if (pinDiff !== 0) return pinDiff;
  return a.displayOrder - b.displayOrder;
}

function CollapsibleGroup({
  group,
  links,
  preview,
  onTrackClick,
}: {
  group: PublicLinkGroup;
  links: PublicSocialLink[];
  preview?: boolean;
  onTrackClick?: (linkId: string) => void;
}) {
  const [open, setOpen] = useState(group.isExpanded);
  const label = group.nameAr || group.name;
  const color = group.color || 'var(--foreground)';

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'profile-card flex w-full items-center gap-3 rounded-2xl bg-[var(--surface)] px-4 py-3.5',
          'ring-1 ring-[var(--border)]',
          'text-sm font-semibold text-[var(--foreground)]',
          !preview && 'profile-card-interactive',
        )}
        aria-expanded={open}
      >
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] ring-1 ring-[var(--border)]"
          aria-hidden
        >
          <Folder className="size-4" style={{ color }} strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1 text-start">
          <span className="block truncate">{label}</span>
          <span className="mt-0.5 block text-xs font-medium text-[var(--muted-foreground)]">
            {links.length} رابط
          </span>
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-[var(--muted-foreground)]/55 transition-transform',
            open && 'rotate-180 text-[var(--muted-foreground)]',
          )}
          aria-hidden
        />
      </button>
      {open
        ? links.map((link) => (
            <ProfileLinkButton
              key={link.id}
              link={link}
              preview={preview}
              onTrackClick={onTrackClick}
            />
          ))
        : null}
    </div>
  );
}

export interface ProfilePageViewProps {
  profile: PublicProfile;
  forms?: PublicProfileForm[];
  preview?: boolean;
  /** @deprecated Prefer `constrained` for phone preview — keeps public layout inside a frame */
  embedded?: boolean;
  /** Phone-frame preview: same visual layout as the public page, without footer */
  constrained?: boolean;
  fillHeight?: boolean;
  resolveMediaUrl?: MediaUrlResolver;
  onTrackClick?: (linkId: string) => void;
}

export function ProfilePageView({
  profile,
  forms = [],
  preview = false,
  embedded = false,
  constrained = false,
  fillHeight = false,
  resolveMediaUrl = (path) => path ?? null,
  onTrackClick,
}: ProfilePageViewProps) {
  const themeClass = getProfileThemeClass(profile.themeKey);
  const usePublicLayout = !embedded || constrained;
  const links = [...profile.socialLinks].sort(sortLinks);
  const groups = [...(profile.linkGroups ?? [])].sort((a, b) => a.order - b.order);
  const knownGroupIds = new Set(groups.map((group) => group.id));
  const ungrouped = links.filter(
    (link) => !link.groupId || !knownGroupIds.has(link.groupId),
  );

  const linkedFormSlugs = new Set(
    links
      .filter((l) => isFormLink(l.platform))
      .map(formSlugFromLink)
      .filter((s): s is string => Boolean(s)),
  );

  const extraForms = forms.filter((f) => !linkedFormSlugs.has(f.slug));
  const isEmpty = links.length === 0 && extraForms.length === 0;
  const showFormsHeading = links.length > 0 && extraForms.length > 0;

  return (
    <MediaUrlProvider resolve={resolveMediaUrl}>
      <div
        className={cn(
          'profile-theme-scope text-[var(--foreground)]',
          themeClass,
          usePublicLayout && !constrained && 'profile-page-public bg-[var(--background)]',
          (constrained || !usePublicLayout) && 'bg-[var(--background)]',
          embedded || constrained
            ? fillHeight
              ? 'min-h-full'
              : 'min-h-0'
            : 'min-h-screen',
        )}
      >
        <div
          className={cn(
            'relative mx-auto w-full',
            usePublicLayout ? 'max-w-lg px-5 pb-10' : 'max-w-md px-3 py-4',
            constrained && 'px-4 pb-6 pt-5',
          )}
        >
          <div className={cn(usePublicLayout ? 'space-y-6' : 'space-y-5')}>
            <ProfileHeader profile={profile} compact={embedded && !constrained} />

            {links.length > 0 ? (
              <section className="space-y-2.5" aria-label="الروابط">
                {ungrouped.map((link) => (
                  <ProfileLinkButton
                    key={link.id}
                    link={link}
                    preview={preview}
                    onTrackClick={onTrackClick}
                  />
                ))}
                {groups.map((group) => {
                  const groupLinks = links.filter((link) => link.groupId === group.id);
                  if (groupLinks.length === 0) return null;
                  return (
                    <CollapsibleGroup
                      key={group.id}
                      group={group}
                      links={groupLinks}
                      preview={preview}
                      onTrackClick={onTrackClick}
                    />
                  );
                })}
              </section>
            ) : null}

            <ProfileFormsSection
              forms={extraForms}
              preview={preview}
              showHeading={showFormsHeading}
            />

            {isEmpty ? (
              <div
                className={cn(
                  'px-6 py-12 text-center',
                  embedded && preview && !constrained
                    ? 'bg-transparent'
                    : 'rounded-2xl bg-[var(--surface)]/60 ring-1 ring-[var(--border)]',
                )}
              >
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-[var(--profile-accent-soft)] text-[var(--primary)]">
                  <Link2 className="size-5" />
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">لا توجد روابط بعد</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  ستظهر روابطك ونماذجك هنا
                </p>
              </div>
            ) : null}
          </div>

          {usePublicLayout && !preview && !constrained ? (
            <footer className="mt-14 text-center">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                أنشئ صفحتك على ركني
              </a>
            </footer>
          ) : null}
        </div>
      </div>
    </MediaUrlProvider>
  );
}
