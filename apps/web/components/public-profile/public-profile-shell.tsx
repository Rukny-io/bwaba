'use client';

import { resolveProfileMediaUrl } from './resolve-media-url';
import type {
  MediaUrlResolver,
  PublicProfile,
  PublicProfileForm,
  PublicProfileProduct,
} from './types';
import { ProfilePageView } from './profile-page-view';

export type PublicProfileShellMode = 'live' | 'preview';

export interface PublicProfileShellProps {
  profile: PublicProfile;
  forms?: PublicProfileForm[];
  products?: PublicProfileProduct[];
  initialProductId?: string | null;
  mode?: PublicProfileShellMode;
  resolveMediaUrl?: MediaUrlResolver;
  onTrackClick?: (linkId: string) => void;
}

/** Single entry point for public profile + dashboard preview — same layout, different mode. */
export function PublicProfileShell({
  profile,
  forms = [],
  products = [],
  initialProductId = null,
  mode = 'live',
  resolveMediaUrl = resolveProfileMediaUrl,
  onTrackClick,
}: PublicProfileShellProps) {
  const preview = mode === 'preview';

  return (
    <ProfilePageView
      profile={profile}
      forms={forms}
      products={products}
      initialProductId={initialProductId}
      preview={preview}
      constrained={preview}
      fillHeight={preview}
      resolveMediaUrl={resolveMediaUrl}
      onTrackClick={preview ? undefined : onTrackClick}
    />
  );
}
