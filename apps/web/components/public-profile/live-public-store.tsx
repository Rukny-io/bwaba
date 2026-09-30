'use client';

import { resolveProfileMediaUrl } from '@/components/public-profile/resolve-media-url';
import { ProfileStorePageView } from '@/components/public-profile/profile-store-page-view';
import type {
  PublicProfile,
  PublicProfileCollection,
  PublicProfileProduct,
} from '@/lib/public-profile-api';

interface LivePublicStoreProps {
  profile: PublicProfile;
  products: PublicProfileProduct[];
  collections?: PublicProfileCollection[];
  initialProductId?: string | null;
}

export function LivePublicStore({
  profile,
  products,
  collections = [],
  initialProductId = null,
}: LivePublicStoreProps) {
  return (
    <ProfileStorePageView
      profile={profile}
      products={products}
      collections={collections}
      initialProductId={initialProductId}
      resolveMediaUrl={resolveProfileMediaUrl}
    />
  );
}
