'use client';

import { resolveProfileMediaUrl } from './resolve-media-url';
import type { MediaUrlResolver, PublicProfile, PublicProfileForm } from './types';
import { ProfilePageView } from './profile-page-view';

export type PublicProfileShellMode = 'live' | 'preview';

export interface PublicProfileShellProps {
  profile: PublicProfile;
  forms?: PublicProfileForm[];
  featuredForm?: PublicProfileForm | null;
  mode?: PublicProfileShellMode;
  resolveMediaUrl?: MediaUrlResolver;
  onTrackClick?: (linkId: string) => void;
}

/** Single entry point for public profile + dashboard preview — same layout, different mode. */
export function PublicProfileShell({
  profile,
  forms = [],
  featuredForm = null,
  mode = 'live',
  resolveMediaUrl = resolveProfileMediaUrl,
  onTrackClick,
}: PublicProfileShellProps) {
  const preview = mode === 'preview';

  return (
    <ProfilePageView
      profile={profile}
      forms={forms}
      featuredForm={featuredForm}
      preview={preview}
      constrained={preview}
      fillHeight={preview}
      resolveMediaUrl={resolveMediaUrl}
      onTrackClick={preview ? undefined : onTrackClick}
    />
  );
}
