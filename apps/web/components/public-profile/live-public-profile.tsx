'use client';

import { PublicProfileShell } from '@/components/public-profile/public-profile-shell';
import { resolveProfileMediaUrl } from '@/components/public-profile/resolve-media-url';
import {
  trackSocialLinkClick,
  type PublicProfile,
  type PublicProfileForm,
  type PublicProfileProduct,
} from '@/lib/public-profile-api';

interface LivePublicProfileProps {
  profile: PublicProfile;
  forms: PublicProfileForm[];
  products: PublicProfileProduct[];
  initialProductId?: string | null;
  /** Dashboard iframe embed — same layout, no footer / tracking noise */
  embed?: boolean;
}

export function LivePublicProfile({
  profile,
  forms,
  products,
  initialProductId = null,
  embed = false,
}: LivePublicProfileProps) {
  return (
    <PublicProfileShell
      profile={profile}
      forms={forms}
      products={products}
      initialProductId={initialProductId}
      mode={embed ? 'preview' : 'live'}
      resolveMediaUrl={resolveProfileMediaUrl}
      onTrackClick={
        embed
          ? undefined
          : (linkId) => {
              void trackSocialLinkClick(linkId);
            }
      }
    />
  );
}
