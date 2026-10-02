import { notFound } from 'next/navigation';
import type { Metadata, Viewport } from 'next';
import { LivePublicStore } from '@/components/public-profile/live-public-store';
import { PUBLIC_SITE_URL } from '@/lib/config';
import { getLocale } from '@/lib/i18n-server';
import { getMessages } from '@/lib/i18n';
import { getProfileThemeBackground } from '@/lib/profile-themes';
import { isValidProfileUsername } from '@/lib/profile-routes';
import {
  fetchPublicProfile,
  fetchPublicProfileCollections,
  fetchPublicProfileProducts,
  getCanonicalStoreUrl,
  isProfilePubliclyVisible,
  resolveProfileMediaUrl,
} from '@/lib/public-profile-api';

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ product?: string }>;
};

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { username } = await params;
  const themeColor = !isValidProfileUsername(username)
    ? '#ffffff'
    : getProfileThemeBackground((await fetchPublicProfile(username))?.themeKey);

  return {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const locale = await getLocale();
  const messages = getMessages(locale);
  const profileCopy = messages.publicProfile;

  if (!isValidProfileUsername(username)) {
    return { title: profileCopy.meta.notFoundTitle };
  }

  const profile = await fetchPublicProfile(username);
  if (!profile || !isProfilePubliclyVisible(profile)) {
    return { title: profileCopy.meta.notFoundTitle };
  }

  const displayName = profile.name?.trim() || profile.username;
  const title = profileCopy.store.pageTitle.replace('{name}', displayName);
  const description =
    profile.bio?.trim() ||
    profileCopy.store.descriptionFallback.replace('{username}', profile.username);
  const canonical = getCanonicalStoreUrl(profile.username);
  const avatar = resolveProfileMediaUrl(profile.avatar);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      siteName: 'ركني',
      ...(avatar ? { images: [{ url: avatar, alt: title }] } : {}),
    },
    twitter: {
      card: avatar ? 'summary' : 'summary',
      title,
      description,
      ...(avatar ? { images: [avatar] } : {}),
    },
    metadataBase: new URL(PUBLIC_SITE_URL),
  };
}

export default async function PublicStorePage({ params, searchParams }: Props) {
  const { username } = await params;
  const { product: initialProductId } = await searchParams;

  if (!isValidProfileUsername(username)) {
    notFound();
  }

  const [profile, productsData, collections] = await Promise.all([
    fetchPublicProfile(username),
    fetchPublicProfileProducts(username),
    fetchPublicProfileCollections(username),
  ]);

  if (
    !profile ||
    !isProfilePubliclyVisible(profile) ||
    profile.username.toLowerCase() !== username.toLowerCase() ||
    productsData.products.length === 0
  ) {
    notFound();
  }

  return (
    <LivePublicStore
      profile={profile}
      products={productsData.products}
      collections={collections}
      initialProductId={initialProductId ?? null}
    />
  );
}
