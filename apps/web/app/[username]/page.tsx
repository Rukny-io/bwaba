import { notFound } from 'next/navigation';
import type { Metadata, Viewport } from 'next';
import { LivePublicProfile } from '@/components/public-profile/live-public-profile';
import { PUBLIC_SITE_URL } from '@/lib/config';
import { getLocale } from '@/lib/i18n-server';
import { getMessages } from '@/lib/i18n';
import { getProfileThemeBackground } from '@/lib/profile-themes';
import { isValidProfileUsername } from '@/lib/profile-routes';
import {
  fetchPublicProfile,
  fetchPublicProfileForms,
  fetchPublicProfileProducts,
  getCanonicalProfileUrl,
  isProfilePubliclyVisible,
  resolveProfileMediaUrl,
} from '@/lib/public-profile-api';

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ embed?: string; product?: string }>;
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

  const title = profile.name?.trim() || profile.username;
  const description =
    profile.bio?.trim() ||
    profileCopy.meta.descriptionFallback.replace('{username}', profile.username);
  const canonical = getCanonicalProfileUrl(profile.username);
  const avatar = resolveProfileMediaUrl(profile.avatar);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'profile',
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

export default async function PublicProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const { embed, product: initialProductId } = await searchParams;
  const isEmbed = embed === '1';

  if (!isValidProfileUsername(username)) {
    notFound();
  }

  const fresh = isEmbed;
  const [profile, formsData, productsData] = await Promise.all([
    fetchPublicProfile(username, { fresh }),
    fetchPublicProfileForms(username, { fresh }),
    fetchPublicProfileProducts(username, 48, { fresh }),
  ]);

  if (
    !profile ||
    !isProfilePubliclyVisible(profile) ||
    profile.username.toLowerCase() !== username.toLowerCase()
  ) {
    notFound();
  }

  return (
    <LivePublicProfile
      profile={profile}
      forms={formsData.forms}
      products={productsData.products}
      initialProductId={initialProductId ?? null}
      embed={isEmbed}
    />
  );
}
