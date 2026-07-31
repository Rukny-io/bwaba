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
  id?: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  coverImage: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
  themeKey?: string | null;
  isRuknyVerified?: boolean;
  /** Public contact email when hideEmail is false */
  email?: string | null;
  /** Public phone when hidePhone is false */
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

export type MediaUrlResolver = (path: string | null | undefined) => string | null;
