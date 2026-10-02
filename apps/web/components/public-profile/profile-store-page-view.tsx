'use client';

import './profile-themes.css';
import './profile-product-dialog.css';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getPublicProfilePath } from '@/lib/profile-routes';
import { resolveProfileMediaUrl } from '@/lib/media-url';
import type {
  MediaUrlResolver,
  PublicProfile,
  PublicProfileCollection,
  PublicProfileProduct,
} from './types';
import { cn } from './utils';
import { MediaUrlProvider } from './media-url-context';
import { getProfileThemeClass } from './profile-themes';
import { ProfileHeader } from './profile-header';
import { ProfileProductsSection } from './profile-products-section';
import { StoreCartProvider } from './store-cart-context';
import { StoreCartFloating } from './store-cart-sheet';

export interface ProfileStorePageViewProps {
  profile: PublicProfile;
  products: PublicProfileProduct[];
  collections?: PublicProfileCollection[];
  initialProductId?: string | null;
  resolveMediaUrl?: MediaUrlResolver;
}

export function ProfileStorePageView({
  profile,
  products,
  collections = [],
  initialProductId = null,
  resolveMediaUrl = resolveProfileMediaUrl,
}: ProfileStorePageViewProps) {
  const t = useTranslations('publicProfile');
  const themeClass = getProfileThemeClass(profile.themeKey);
  const profilePath = getPublicProfilePath(profile.username);
  const displayName = profile.name?.trim() || profile.username;

  return (
    <MediaUrlProvider resolve={resolveMediaUrl}>
      <StoreCartProvider
        storeSlug={profile.username}
        storeName={profile.name}
        products={products}
      >
        <div
          className={cn(
            'profile-theme-scope text-[var(--foreground)]',
            themeClass,
            'bg-[var(--background)] profile-page-public min-h-screen',
          )}
        >
          <div className="relative z-[1] mx-auto w-full max-w-lg space-y-6 px-4 pt-1 pb-28 sm:max-w-xl sm:px-5 max-sm:max-w-none">
            <div className="space-y-0">
              <Link
                href={profilePath}
                className={cn(
                  'inline-flex items-center gap-1 px-1 pt-2 text-[12px] font-semibold sm:text-[13px]',
                  'text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]',
                )}
              >
                <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />
                <span className="truncate">{t('store.backToProfile', { name: displayName })}</span>
              </Link>
              <ProfileHeader
                profile={profile}
                productCount={products.length}
                storeHref={profilePath}
                showStoreButton={false}
              />
            </div>

            <ProfileProductsSection
              products={products}
              collections={collections}
              storeSlug={profile.username}
              storeName={profile.name}
              storeAvatar={profile.avatar}
              initialProductId={initialProductId}
              showCategoryFilter
              resolveMediaUrl={resolveMediaUrl}
            />

            <footer className="pt-2 text-center">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-secondary)] px-4 py-2 text-[11px] font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                {t('footer.createPage')}
              </a>
            </footer>
          </div>

          <StoreCartFloating
            storeSlug={profile.username}
            products={products}
            themeKey={profile.themeKey}
          />
        </div>
      </StoreCartProvider>
    </MediaUrlProvider>
  );
}
