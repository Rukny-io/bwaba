import type { PublicProfile, PublicSocialLink } from './types';

export interface EditorProfileInput {
  username: string;
  name?: string | null;
  bio?: string | null;
  avatar?: string | null;
  coverImage?: string | null;
  themeKey?: string | null;
  isRuknyVerified?: boolean;
}

export interface EditorLinkInput {
  id: string;
  platform: string;
  username?: string | null;
  url: string;
  title?: string | null;
  displayOrder: number;
  status?: string;
  layout?: string;
  thumbnail?: string | null;
}

export function mapEditorLinksToPublicLinks(links: EditorLinkInput[]): PublicSocialLink[] {
  return links
    .filter((link) => link.status !== 'hidden')
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((link) => ({
      id: link.id,
      platform: link.platform,
      username: link.username ?? null,
      url: link.url,
      title: link.title ?? null,
      displayOrder: link.displayOrder,
      layout: link.layout,
      thumbnail: link.thumbnail ?? null,
    }));
}

export function buildPublicProfileFromEditor(
  profile: EditorProfileInput,
  links: EditorLinkInput[],
): PublicProfile {
  return {
    username: profile.username,
    name: profile.name ?? null,
    bio: profile.bio ?? null,
    avatar: profile.avatar ?? null,
    coverImage: profile.coverImage ?? null,
    themeKey: profile.themeKey ?? 'classic',
    isRuknyVerified: profile.isRuknyVerified,
    socialLinks: mapEditorLinksToPublicLinks(links),
  };
}
