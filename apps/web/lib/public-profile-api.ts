import { getBackendUrl, PUBLIC_SITE_URL } from '@/lib/config';
import type {
  PublicProfileCollection,
  PublicProfileProduct,
  PublicProfileProductAttribute,
  PublicProfileProductVariant,
} from '@/components/public-profile/types';

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
  isPinned?: boolean;
  isLocked?: boolean;
  groupId?: string | null;
}

export interface PublicLinkGroup {
  id: string;
  name: string;
  nameAr: string | null;
  color: string;
  icon: string | null;
  order: number;
  isExpanded: boolean;
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
  linkGroups?: PublicLinkGroup[];
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

export type {
  PublicProfileProduct,
  PublicProfileProductAttribute,
  PublicProfileProductVariant,
  PublicProfileCollection,
};

export interface PublicProfileProductsResponse {
  products: PublicProfileProduct[];
  total: number;
  storeId: string | null;
}

function apiRoot(): string {
  const base = getBackendUrl().replace(/\/$/, '');
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
}

export function getCanonicalProfileUrl(username: string): string {
  return `${PUBLIC_SITE_URL}/${encodeURIComponent(username)}`;
}

export function getCanonicalStoreUrl(username: string): string {
  return `${PUBLIC_SITE_URL}/${encodeURIComponent(username)}/store`;
}

export { resolveProfileMediaUrl } from '@/lib/media-url';

type PublicFetchOptions = {
  /** Bypass Next.js Data Cache (dashboard live preview / embed). */
  fresh?: boolean;
};

function fetchCacheInit(fresh?: boolean): RequestInit {
  return fresh ? { cache: 'no-store' } : { next: { revalidate: 60 } };
}

export async function fetchPublicProfile(
  username: string,
  options: PublicFetchOptions = {},
): Promise<PublicProfile | null> {
  try {
    const res = await fetch(`${apiRoot()}/profiles/${encodeURIComponent(username)}`, {
      ...fetchCacheInit(options.fresh),
    });
    if (!res.ok) return null;
    return (await res.json()) as PublicProfile;
  } catch {
    return null;
  }
}

export async function fetchPublicProfileCollections(
  username: string,
  options: PublicFetchOptions = {},
): Promise<PublicProfileCollection[]> {
  try {
    const res = await fetch(
      `${apiRoot()}/stores/${encodeURIComponent(username)}/collections`,
      fetchCacheInit(options.fresh),
    );
    if (!res.ok) return [];
    return (await res.json()) as PublicProfileCollection[];
  } catch {
    return [];
  }
}

export async function fetchPublicProfileProducts(
  username: string,
  limit = 48,
  options: PublicFetchOptions = {},
): Promise<PublicProfileProductsResponse> {
  try {
    const res = await fetch(
      `${apiRoot()}/stores/${encodeURIComponent(username)}/products?limit=${limit}`,
      fetchCacheInit(options.fresh),
    );
    if (!res.ok) return { products: [], total: 0, storeId: null };
    return (await res.json()) as PublicProfileProductsResponse;
  } catch {
    return { products: [], total: 0, storeId: null };
  }
}

export async function fetchPublicProfileForms(
  username: string,
  options: PublicFetchOptions = {},
): Promise<PublicProfileFormsResponse> {
  try {
    const res = await fetch(
      `${apiRoot()}/forms/public/user/${encodeURIComponent(username)}?limit=24`,
      fetchCacheInit(options.fresh),
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

export async function unlockSocialLink(
  linkId: string,
  password: string,
): Promise<{ url: string }> {
  const res = await fetch(
    `${apiRoot()}/social-links/${encodeURIComponent(linkId)}/unlock`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    },
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message;
    throw new Error(message || 'كلمة المرور غير صحيحة');
  }
  return (await res.json()) as { url: string };
}

export function isProfilePubliclyVisible(profile: PublicProfile): boolean {
  return profile.visibility !== 'PRIVATE';
}
