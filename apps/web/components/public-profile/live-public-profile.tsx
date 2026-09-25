'use client';

import { PublicProfileShell } from '@/components/public-profile/public-profile-shell';
import { resolveProfileMediaUrl } from '@/components/public-profile/resolve-media-url';
import {
  trackSocialLinkClick,
  type PublicProfile,
  type PublicProfileForm,
} from '@/lib/public-profile-api';

interface LivePublicProfileProps {
  profile: PublicProfile;
  forms: PublicProfileForm[];
  featuredForm?: PublicProfileForm | null;
  /** Dashboard iframe embed — same layout, no footer / tracking noise */
  embed?: boolean;
}

export function LivePublicProfile({
  profile,
  forms,
  featuredForm = null,
  embed = false,
}: LivePublicProfileProps) {
  return (
    <PublicProfileShell
      profile={profile}
      forms={forms}
      featuredForm={featuredForm}
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
