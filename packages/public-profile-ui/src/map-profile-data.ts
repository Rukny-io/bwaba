import type { PublicLinkGroup, PublicProfile, PublicSocialLink } from './types';

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
  isPinned?: boolean;
  isLocked?: boolean;
  isPasswordProtected?: boolean;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  groupId?: string | null;
}

export interface EditorLinkGroupInput {
  id: string;
  name: string;
  nameAr?: string | null;
  color?: string;
  icon?: string | null;
  order: number;
  isExpanded?: boolean;
}

function isWithinSchedule(link: EditorLinkInput, now = Date.now()): boolean {
  if (link.scheduledStartAt && new Date(link.scheduledStartAt).getTime() > now) {
    return false;
  }
  if (link.scheduledEndAt && new Date(link.scheduledEndAt).getTime() < now) {
    return false;
  }
  return true;
}

export function mapEditorLinksToPublicLinks(links: EditorLinkInput[]): PublicSocialLink[] {
  return links
    .filter((link) => link.status !== 'hidden' && isWithinSchedule(link))
    .sort((a, b) => {
      const pinDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
      if (pinDiff !== 0) return pinDiff;
      return a.displayOrder - b.displayOrder;
    })
    .map((link) => {
      const locked = Boolean(link.isLocked || link.isPasswordProtected);
      return {
        id: link.id,
        platform: link.platform,
        username: link.username ?? null,
        url: locked ? '' : link.url,
        title: link.title ?? null,
        displayOrder: link.displayOrder,
        layout: link.layout,
        thumbnail: link.thumbnail ?? null,
        isPinned: Boolean(link.isPinned),
        isLocked: locked,
        groupId: link.groupId ?? null,
      };
    });
}

export function mapEditorGroupsToPublicGroups(
  groups: EditorLinkGroupInput[] = [],
): PublicLinkGroup[] {
  return [...groups]
    .sort((a, b) => a.order - b.order)
    .map((group) => ({
      id: group.id,
      name: group.name,
      nameAr: group.nameAr ?? null,
      color: group.color || '#6366f1',
      icon: group.icon ?? null,
      order: group.order,
      isExpanded: group.isExpanded ?? true,
    }));
}

export function buildPublicProfileFromEditor(
  profile: EditorProfileInput,
  links: EditorLinkInput[],
  groups: EditorLinkGroupInput[] = [],
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
    linkGroups: mapEditorGroupsToPublicGroups(groups),
  };
}
