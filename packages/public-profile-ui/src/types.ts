export interface PublicSocialLink {
  id: string;
  platform: string;
  username: string | null;
  url: string;
  title: string | null;
  displayOrder: number;
  layout?: string;
  thumbnail?: string | null;
}

export interface PublicProfile {
  id?: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  coverImage: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
  themeKey?: string | null;
  isRuknyVerified?: boolean;
  socialLinks: PublicSocialLink[];
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

export type MediaUrlResolver = (path: string | null | undefined) => string | null;
