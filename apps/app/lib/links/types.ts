export type LinkStatus = 'active' | 'hidden';
export type LinkLayout = 'classic' | 'featured' | 'profile_card' | 'media_grid';

export interface SocialLink {
  id: string;
  profileId: string;
  platform: string;
  username: string | null;
  url: string;
  shortUrl: string | null;
  displayOrder: number;
  title: string | null;
  status: LinkStatus;
  views: number;
  groupId: string | null;
  isPinned: boolean;
  isPopular: boolean;
  totalClicks: number;
  layout: LinkLayout;
  thumbnail: string | null;
  connectionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSocialLinkInput {
  platform: string;
  username: string;
  url: string;
  title?: string;
  displayOrder?: number;
  groupId?: string;
  status?: LinkStatus;
  layout?: LinkLayout;
  connectionId?: string;
  isPinned?: boolean;
}

export type UpdateSocialLinkInput = Partial<CreateSocialLinkInput> & {
  thumbnail?: string | null;
};

export interface LinkGroup {
  id: string;
  profileId: string;
  name: string;
  nameAr: string | null;
  color: string;
  icon: string | null;
  order: number;
  isExpanded: boolean;
  linksCount?: number;
}

export interface LinkShortUrlStats {
  id: string;
  originalUrl: string;
  shortUrl: string;
  shortCode: string;
  clicks: number;
  expiresAt: string | null;
  isExpired: boolean;
  createdAt: string;
}

export interface LinkStatsResponse extends SocialLink {
  stats: LinkShortUrlStats | null;
}
