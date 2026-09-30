'use client';

import './profile-themes.css';
import './profile-product-dialog.css';
import { type ReactNode } from 'react';
import { Link2 } from 'lucide-react';
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
import {
  getPublicStorePath,
  PROFILE_PRODUCTS_PREVIEW_LIMIT,
} from '@/lib/profile-routes';
import { cn } from './utils';
import { ProfileFormsSection } from './profile-forms-section';
import { ProfileHeader } from './profile-header';
import { ProfileTopBar } from './profile-top-bar';
import { ProfileLinkButton } from './profile-link-button';
import {
  groupProfileLinkRows,
  ProfileLinksSection,
} from './profile-links-section';
import { ProfileProductsSection } from './profile-products-section';
import { StoreCartProvider } from './store-cart-context';
import { StoreCartFloating } from './store-cart-sheet';
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
  const usePublicLayout = !preview;
  const links = [...profile.socialLinks].sort((a, b) => a.displayOrder - b.displayOrder);

  const profileLinks = links.filter((link) => !isFormLink(link.platform));
  const profileLinkRows = groupProfileLinkRows(profileLinks);

  const linkedFormSlugs = new Set(
    links
      .filter((l) => isFormLink(l.platform))
      .map(formSlugFromLink)
      .filter((slug): slug is string => Boolean(slug)),
  );
  const profileForms = forms.filter((form) => !linkedFormSlugs.has(form.slug));

  const hasContent =
    profileLinks.length > 0 || products.length > 0 || profileForms.length > 0;

  const productsCompact = preview;
  const pageColumnClass = cn(
    'mx-auto w-full space-y-6',
    preview ? 'max-w-md px-3' : 'max-w-lg px-4 sm:max-w-xl sm:px-5 max-sm:max-w-none',
  );

  const hasStore = products.length > 0;

  return (
    <MediaUrlProvider resolve={resolveMediaUrl}>
      <StoreCartProvider
        storeSlug={profile.username}
        storeName={profile.name}
        products={products}
        preview={preview}
      >
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
        <div
          className={cn(
            'relative z-[1] pt-1',
            pageColumnClass,
            hasStore && !preview ? 'pb-28' : 'pb-12',
          )}
        >
          <div className="space-y-0">
            {usePublicLayout && !preview && !constrained ? <ProfileTopBar /> : null}
            <ProfileHeader
              profile={profile}
              compact={preview}
              withTopBar={usePublicLayout && !preview && !constrained}
              productCount={products.length}
              linkCount={profileLinks.length}
              formCount={profileForms.length}
              storeHref={hasStore ? getPublicStorePath(profile.username) : undefined}
            />
          </div>

          {profileLinks.length > 0 ? (
            <ProfileLinksSection
              rows={profileLinkRows}
              linkCount={profileLinks.length}
              compact={productsCompact}
              renderLink={(link) => renderLinkItem(link, { preview, onTrackClick })}
            />
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
              limit={preview ? undefined : PROFILE_PRODUCTS_PREVIEW_LIMIT}
              viewAllHref={preview ? undefined : getPublicStorePath(profile.username)}
              assignSectionId
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
        {hasStore && !preview ? (
          <StoreCartFloating
            storeSlug={profile.username}
            products={products}
            themeKey={profile.themeKey}
          />
        ) : null}
      </div>
      </StoreCartProvider>
    </MediaUrlProvider>
  );
}
