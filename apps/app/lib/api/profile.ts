/**
 * Profile API Functions
 */

import { apiFetch } from './client';

// ─── Types ─────────────────────────────────────────────────────

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  title?: string | null;
  status?: string;
  isPinned?: boolean;
  displayOrder: number;
}

export interface UserProfile {
  id: string;
  username: string;
  name?: string | null;
  bio?: string | null;
  avatar?: string | null;
  coverImage?: string | null;
  location?: string | null;
  visibility: string;
  createdAt: string;
  user: { id: string; name?: string | null };
  socialLinks: SocialLink[];
  _count?: { followers: number; following: number };
}

// ─── Client-side ──────────────────────────────────────────────

export async function getMyProfile(): Promise<UserProfile> {
  return apiFetch('/profiles/me');
}

// ─── Public (no auth needed) ───────────────────────────────────

export async function getPublicProfile(username: string): Promise<UserProfile> {
  return apiFetch(`/profiles/${encodeURIComponent(username)}`);
}
