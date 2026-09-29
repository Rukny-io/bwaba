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
  /** iframe / phone-frame embed — interactive store, compact layout */
  embedded?: boolean;
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
  embedded = false,
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
      embedded={embedded}
      constrained={preview || embedded}
      fillHeight={preview || embedded}
      resolveMediaUrl={resolveMediaUrl}
      onTrackClick={preview ? undefined : onTrackClick}
    />
  );
}
