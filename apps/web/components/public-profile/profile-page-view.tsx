'use client';

import './profile-themes.css';
import './profile-product-dialog.css';
import { Link2, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { MediaUrlProvider } from './media-url-context';
import { getProfileThemeClass } from './profile-themes';
import type {
  MediaUrlResolver,
  PublicProfile,
  PublicProfileForm,
  PublicProfileProduct,
  PublicSocialLink,
} from './types';
import { resolveProfileMediaUrl } from '@/lib/media-url';
import { cn } from './utils';
import { ProfileFormsSection } from './profile-forms-section';
import { ProfileHeader } from './profile-header';
import { ProfileLanguageSwitcher } from './profile-language-switcher';
import { ProfileLinkButton } from './profile-link-button';
import { ProfileProductsSection } from './profile-products-section';
import { InstagramRichLink } from './instagram-rich-link';
import { SocialProfileCard } from './social-profile-card';

function isFormLink(platform: string): boolean {
  return platform === 'form';
}

function isProfileCard(link: PublicSocialLink): boolean {
  return link.layout === 'profile_card';
}

function isInstagramMediaGrid(link: PublicSocialLink): boolean {
  return link.platform === 'instagram' && link.layout === 'media_grid';
}

function isHomeShowcaseLink(link: PublicSocialLink): boolean {
  return isProfileCard(link) || isInstagramMediaGrid(link);
}

type LinkRow =
  | { type: 'cards'; links: PublicSocialLink[] }
  | { type: 'single'; link: PublicSocialLink };

function groupProfileCards(links: PublicSocialLink[]): LinkRow[] {
  const rows: LinkRow[] = [];
  let cardBuffer: PublicSocialLink[] = [];

  const flushCards = () => {
    if (cardBuffer.length === 0) return;
    rows.push({ type: 'cards', links: cardBuffer });
    cardBuffer = [];
  };

  for (const link of links) {
    if (isProfileCard(link)) {
      cardBuffer.push(link);
      continue;
    }
    flushCards();
    rows.push({ type: 'single', link });
  }
  flushCards();

  return rows;
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

function renderLinkItem(
  link: PublicSocialLink,
  opts: {
    preview?: boolean;
    onTrackClick?: (linkId: string) => void;
  },
): ReactNode {
  if (isInstagramMediaGrid(link)) {
    return (
      <InstagramRichLink
        key={link.id}
        linkId={link.id}
        layout="media_grid"
        preview={opts.preview}
      />
    );
  }

  if (isProfileCard(link)) {
    if (link.platform === 'instagram') {
      return (
        <InstagramRichLink
          key={link.id}
          linkId={link.id}
          layout="profile_card"
          preview={opts.preview}
        />
      );
    }
    return (
      <SocialProfileCard
        key={link.id}
        link={link}
        preview={opts.preview}
        onTrackClick={opts.onTrackClick}
      />
    );
  }

  return (
    <ProfileLinkButton
      key={link.id}
      link={link}
      preview={opts.preview}
      onTrackClick={opts.onTrackClick}
    />
  );
}

export interface ProfilePageViewProps {
  profile: PublicProfile;
  forms?: PublicProfileForm[];
  products?: PublicProfileProduct[];
  /** يفتح حوار تفاصيل المنتج عند ?product=id */
  initialProductId?: string | null;
  preview?: boolean;
  /** @deprecated Prefer `constrained` for phone preview */
  embedded?: boolean;
  constrained?: boolean;
  fillHeight?: boolean;
  resolveMediaUrl?: MediaUrlResolver;
  onTrackClick?: (linkId: string) => void;
}

export function ProfilePageView({
  profile,
  forms = [],
  products = [],
  initialProductId = null,
  preview = false,
  embedded = false,
  constrained = false,
  fillHeight = false,
  resolveMediaUrl = resolveProfileMediaUrl,
  onTrackClick,
}: ProfilePageViewProps) {
  const t = useTranslations('publicProfile');
  const themeClass = getProfileThemeClass(profile.themeKey);
  const usePublicLayout = !embedded || constrained;
  const links = [...profile.socialLinks].sort((a, b) => a.displayOrder - b.displayOrder);

  const showcaseLinks = links.filter(isHomeShowcaseLink);
  const listLinks = links.filter(
    (l) => !isHomeShowcaseLink(l) && !isFormLink(l.platform),
  );
  const showcaseCardRows = groupProfileCards(showcaseLinks.filter(isProfileCard));
  const showcaseMediaGrids = showcaseLinks.filter(isInstagramMediaGrid);

  const linkedFormSlugs = new Set(
    links
      .filter((l) => isFormLink(l.platform))
      .map(formSlugFromLink)
      .filter((slug): slug is string => Boolean(slug)),
  );
  const profileForms = forms.filter((form) => !linkedFormSlugs.has(form.slug));

  const hasContent =
    listLinks.length > 0 ||
    showcaseCardRows.length > 0 ||
    showcaseMediaGrids.length > 0 ||
    products.length > 0 ||
    profileForms.length > 0;

  const productsCompact = constrained || preview;
  const pageColumnClass = cn(
    'mx-auto w-full space-y-6',
    usePublicLayout ? 'max-w-lg px-4 sm:max-w-xl sm:px-5' : 'max-w-md px-3',
  );

  return (
    <MediaUrlProvider resolve={resolveMediaUrl}>
      <div
        className={cn(
          'profile-theme-scope text-[var(--foreground)]',
          themeClass,
          'bg-[var(--background)]',
          usePublicLayout && 'profile-page-public',
          embedded || constrained
            ? fillHeight
              ? 'min-h-full'
              : 'min-h-0'
            : 'min-h-screen',
        )}
      >
        <div className={cn('relative z-[1] pb-12 pt-1', pageColumnClass)}>
          {usePublicLayout && !preview && !constrained ? (
            <div className="absolute top-1 end-0 z-20 sm:top-2">
              <ProfileLanguageSwitcher variant="compact" />
            </div>
          ) : null}

          <ProfileHeader profile={profile} compact={embedded && !constrained} />

          {listLinks.length > 0 ? (
            <section className="space-y-2.5" aria-label={t('sections.links')}>
              {listLinks.map((link) => (
                <div key={link.id}>
                  {renderLinkItem(link, { preview, onTrackClick })}
                </div>
              ))}
            </section>
          ) : null}

          {showcaseCardRows.length > 0 ? (
            <section className="space-y-2" aria-label={t('sections.profileCards')}>
              {showcaseCardRows.map((row) =>
                row.type === 'cards' ? (
                  <div
                    key={`cards-${row.links.map((l) => l.id).join('-')}`}
                    className="grid grid-cols-2 gap-2.5 sm:gap-3"
                  >
                    {row.links.map((link) =>
                      renderLinkItem(link, { preview, onTrackClick }),
                    )}
                  </div>
                ) : (
                  <div key={row.link.id}>
                    {renderLinkItem(row.link, { preview, onTrackClick })}
                  </div>
                ),
              )}
            </section>
          ) : null}

          {showcaseMediaGrids.length > 0 ? (
            <section className="space-y-2" aria-label={t('sections.instagramPosts')}>
              {showcaseMediaGrids.map((link) =>
                renderLinkItem(link, { preview, onTrackClick }),
              )}
            </section>
          ) : null}

          {products.length > 0 ? (
            <ProfileProductsSection
              products={products}
              storeSlug={profile.username}
              storeName={profile.name}
              storeAvatar={profile.avatar}
              initialProductId={initialProductId}
              preview={preview}
              compact={productsCompact}
            />
          ) : null}

          {!hasContent ? (
            <div className="rounded-2xl bg-[var(--surface)]/60 px-6 py-12 text-center ring-1 ring-[var(--border)]">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-[var(--profile-accent-soft)] text-[var(--primary)]">
                <Link2 className="size-5" />
              </div>
              <p className="text-sm font-medium text-[var(--foreground)]">{t('empty.title')}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {t('empty.description')}
              </p>
            </div>
          ) : null}

          {profileForms.length > 0 ? (
            <ProfileFormsSection forms={profileForms} preview={preview} />
          ) : null}

          {usePublicLayout && !preview && !constrained ? (
            <footer className="pt-2 text-center">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-4 py-2 text-[11px] font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                {t('footer.createPage')}
              </a>
            </footer>
          ) : null}
        </div>
      </div>
    </MediaUrlProvider>
  );
}
