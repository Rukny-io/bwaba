import { Metadata } from 'next';

const API_SERVER_URL =
  process.env.API_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_EXTERNAL_URL ||
  'http://localhost:3001';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  let name = `@${username}`;
  let description = `تصفح الملف الشخصي لـ @${username} على Rukny`;
  let imageUrl: string | undefined;

  try {
    const res = await fetch(
      `${API_SERVER_URL}/api/v1/profiles/${encodeURIComponent(username)}`,
      { next: { revalidate: 300 } },
    );
    if (res.ok) {
      const profile = await res.json();
      if (profile.name) name = profile.name;
      if (profile.bio) description = profile.bio;
      if (profile.avatar) imageUrl = profile.avatar;
    }
  } catch {
    // fallback to defaults
  }

  const title = `${name} | Rukny`;
  const url = `https://rukny.io/${username}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Rukny',
      type: 'profile',
      ...(imageUrl ? { images: [{ url: imageUrl, width: 400, height: 400, alt: name }] } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
