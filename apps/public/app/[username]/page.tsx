import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { LivePublicProfile } from '@/components/public-profile/live-public-profile';
import { PUBLIC_SITE_URL } from '@/lib/config';
import { isValidProfileUsername } from '@/lib/profile-routes';
import {
  fetchPublicProfile,
  fetchPublicProfileForms,
  getCanonicalProfileUrl,
  isProfilePubliclyVisible,
  resolveProfileMediaUrl,
} from '@/lib/public-profile-api';

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ embed?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  if (!isValidProfileUsername(username)) {
    return { title: 'الملف غير موجود' };
  }

  const profile = await fetchPublicProfile(username);
  if (!profile || !isProfilePubliclyVisible(profile)) {
    return { title: 'الملف غير موجود' };
  }

  const title = profile.name?.trim() || profile.username;
  const description = profile.bio?.trim() || `صفحة ${profile.username} على ركني`;
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
  const { embed } = await searchParams;

  if (!isValidProfileUsername(username)) {
    notFound();
  }

  const [profile, formsData] = await Promise.all([
    fetchPublicProfile(username),
    fetchPublicProfileForms(username),
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
      featuredForm={formsData.featured}
      embed={embed === '1'}
    />
  );
}
