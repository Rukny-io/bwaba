'use client';

import { Link2 } from 'lucide-react';
import { MediaUrlProvider } from '../media-url-context';
import { getProfileThemeClass } from '../profile-themes';
import type { MediaUrlResolver, PublicProfile, PublicProfileForm } from '../types';
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
  const links = [...profile.socialLinks].sort((a, b) => a.displayOrder - b.displayOrder);

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
          usePublicLayout && 'profile-page-public bg-[var(--background)]',
          !usePublicLayout && 'bg-[var(--background)]',
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
          )}
        >
          <div className={cn(usePublicLayout ? 'space-y-6' : 'space-y-5')}>
            <ProfileHeader profile={profile} compact={embedded && !constrained} />

            {links.length > 0 ? (
              <section className="space-y-2.5" aria-label="الروابط">
                {links.map((link) => (
                  <ProfileLinkButton
                    key={link.id}
                    link={link}
                    preview={preview}
                    onTrackClick={onTrackClick}
                  />
                ))}
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

          usePublicLayout && !preview && !constrained ? (
            <footer className="mt-14 text-center">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-4 py-2 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                أنشئ صفحتك على ركني
              </a>
            </footer>
          ) : null
        </div>
      </div>
    </MediaUrlProvider>
  );
}
