import { getBackendUrl, PUBLIC_SITE_URL } from '@/lib/config';

export interface PublicSocialLink {
  id: string;
  platform: string;
  username: string | null;
  url: string;
  title: string | null;
  displayOrder: number;
  layout?: string;
  thumbnail?: string | null;
  connectionId?: string | null;
  totalClicks?: number;
}

export interface PublicProfile {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  coverImage: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
  themeKey?: string | null;
  isRuknyVerified?: boolean;
  verifiedDisplayName?: string | null;
  email?: string | null;
  phone?: string | null;
  hideEmail?: boolean;
  hidePhone?: boolean;
  user?: {
    email?: string | null;
    phone?: string | null;
    phoneNumber?: string | null;
  } | null;
  socialLinks: PublicSocialLink[];
  _count?: {
    followers?: number;
    following?: number;
  };
}

export interface PublicProfileForm {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  type: string;
  coverImage: string | null;
  _count?: { submissions: number };
}

export interface PublicProfileFormsResponse {
  forms: PublicProfileForm[];
  featured: PublicProfileForm | null;
}

function apiRoot(): string {
  const base = getBackendUrl().replace(/\/$/, '');
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
}

export function getCanonicalProfileUrl(username: string): string {
  return `${PUBLIC_SITE_URL}/${encodeURIComponent(username)}`;
}

export function resolveProfileMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('/api/')) return path;
  if (path.startsWith('/uploads/')) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const parsed = new URL(path);
      const host = parsed.hostname;
      const isS3 =
        host.includes('.s3.') ||
        host.includes('.s3-') ||
        host.startsWith('s3.') ||
        host.startsWith('s3-');
      if (!isS3) return path;
      let key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
      if (!key || key.includes('..')) return null;
      if (host.startsWith('s3.') || host.startsWith('s3-')) {
        const slash = key.indexOf('/');
        if (slash !== -1) key = key.slice(slash + 1);
      }
      return `/api/media/${key}`;
    } catch {
      return null;
    }
  }
  return `/api/media/${path.replace(/^\/+/, '')}`;
}

export async function fetchPublicProfile(username: string): Promise<PublicProfile | null> {
  try {
    const res = await fetch(`${apiRoot()}/profiles/${encodeURIComponent(username)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicProfile;
  } catch {
    return null;
  }
}

export async function fetchPublicProfileForms(
  username: string,
): Promise<PublicProfileFormsResponse> {
  try {
    const res = await fetch(
      `${apiRoot()}/forms/public/user/${encodeURIComponent(username)}?limit=24`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return { forms: [], featured: null };
    return (await res.json()) as PublicProfileFormsResponse;
  } catch {
    return { forms: [], featured: null };
  }
}

export async function trackSocialLinkClick(linkId: string): Promise<void> {
  try {
    await fetch(`${apiRoot()}/social-links/${encodeURIComponent(linkId)}/track-click`, {
      method: 'POST',
      keepalive: true,
    });
  } catch {
    /* non-blocking */
  }
}

export function isProfilePubliclyVisible(profile: PublicProfile): boolean {
  return profile.visibility !== 'PRIVATE';
}
