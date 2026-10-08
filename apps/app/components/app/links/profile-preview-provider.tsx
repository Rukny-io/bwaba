'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import type { MyProfile } from '@/lib/profile/types';
import { fetchMyProfile } from '@/lib/profile/api';
import { PUBLIC_SITE_URL } from '@/lib/forms/config';
import { fetchMyLinks } from '@/lib/links/api';
import type { SocialLink } from '@/lib/links/types';

/** Local port for apps/web (public site) */
const PUBLIC_SITE_DEV_PORT = 3011;

export interface ProfilePreviewState {
  profile: MyProfile | null;
  links: SocialLink[];
}

const ProfilePreviewStateContext = createContext<ProfilePreviewState | null>(null);
const ProfilePreviewSetContext = createContext<
  ((state: ProfilePreviewState) => void) | null
>(null);
const ProfilePreviewRefreshContext = createContext<(() => void) | null>(null);
const ProfilePreviewRefreshNonceContext = createContext(0);

function isSamePreview(a: ProfilePreviewState, b: ProfilePreviewState): boolean {
  if (a.profile !== b.profile) {
    if (!a.profile || !b.profile) return false;
    if (
      a.profile.username !== b.profile.username ||
      a.profile.name !== b.profile.name ||
      a.profile.bio !== b.profile.bio ||
      a.profile.avatar !== b.profile.avatar ||
      a.profile.coverImage !== b.profile.coverImage ||
      a.profile.themeKey !== b.profile.themeKey
    ) {
      return false;
    }
  }

  if (a.links === b.links) return true;
  if (a.links.length !== b.links.length) return false;

  return a.links.every((link, index) => {
    const other = b.links[index];
    return (
      link.id === other.id &&
      link.displayOrder === other.displayOrder &&
      link.status === other.status &&
      link.title === other.title &&
      link.platform === other.platform &&
      link.url === other.url &&
      link.thumbnail === other.thumbnail &&
      link.isPinned === other.isPinned &&
      link.groupId === other.groupId &&
      link.isLocked === other.isLocked &&
      link.isPasswordProtected === other.isPasswordProtected &&
      link.notifyOnClick === other.notifyOnClick &&
      link.scheduledStartAt === other.scheduledStartAt &&
      link.scheduledEndAt === other.scheduledEndAt &&
      link.layout === other.layout
    );
  });
}

export function ProfilePreviewProvider({ children }: { children: ReactNode }) {
  const [state, setPreviewState] = useState<ProfilePreviewState>({
    profile: null,
    links: [],
  });
  const [refreshNonce, setRefreshNonce] = useState(0);

  const setPreview = useCallback((next: ProfilePreviewState) => {
    setPreviewState((prev) => (isSamePreview(prev, next) ? prev : next));
  }, []);

  /** Soft-refresh the iframe after saved edits (never call during drag). */
  const refreshPreview = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  /** Load profile + links once so preview works on every dashboard page */
  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetchMyProfile(), fetchMyLinks()])
      .then(([profile, links]) => {
        if (cancelled || !profile) return;
        setPreviewState((prev) => ({
          profile: prev.profile?.username ? prev.profile : profile,
          links: prev.links.length > 0 ? prev.links : links,
        }));
      })
      .catch(() => {
        /* preview remains empty until a page syncs */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ProfilePreviewSetContext.Provider value={setPreview}>
      <ProfilePreviewRefreshContext.Provider value={refreshPreview}>
        <ProfilePreviewRefreshNonceContext.Provider value={refreshNonce}>
          <ProfilePreviewStateContext.Provider value={state}>
            {children}
          </ProfilePreviewStateContext.Provider>
        </ProfilePreviewRefreshNonceContext.Provider>
      </ProfilePreviewRefreshContext.Provider>
    </ProfilePreviewSetContext.Provider>
  );
}

/**
 * Sync dashboard edits into preview state.
 * Uses set-only context so link list re-renders do not cascade from preview updates.
 */
export function useProfilePreviewSync(profile: MyProfile | null, links: SocialLink[]) {
  const setPreview = useContext(ProfilePreviewSetContext);

  useEffect(() => {
    if (!setPreview) return;
    setPreview({ profile, links });
  }, [setPreview, profile, links]);
}

/** Call after a saved mutation (e.g. reorder) to refresh the live iframe once. */
export function useProfilePreviewRefresh() {
  return useContext(ProfilePreviewRefreshContext);
}

/** Minimum preview column width — column grows with flex-1 like Linktree */
export const PREVIEW_COLUMN_MIN_WIDTH_PX = 400;
const PHONE_WIDTH_PX = 360;
const PHONE_RADIUS = '2.35rem';
const HEADER_HEIGHT_PX = 40;
const COLUMN_GAP_PX = 16;
const PREVIEW_ASIDE_CLASS =
  'relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-center px-5 pb-8 pt-4';

/**
 * Build public site origin matching how the dashboard is opened.
 * Local dashboard → apps/web on :3011 (same host).
 */
function resolvePublicOrigin(): string {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:${PUBLIC_SITE_DEV_PORT}`;
    }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.endsWith('.local')) {
      return `${protocol}//${hostname}:${PUBLIC_SITE_DEV_PORT}`;
    }
  }
  return PUBLIC_SITE_URL.replace(/\/$/, '');
}

function buildEmbedUrl(username: string, reloadKey: number): string {
  const base = resolvePublicOrigin();
  const bust = `${reloadKey}-${Date.now()}`;
  return `${base}/${encodeURIComponent(username)}?embed=1&_=${bust}`;
}

function buildPublicUrl(username: string): string {
  return `${resolvePublicOrigin()}/${encodeURIComponent(username)}`;
}

/** Live iframe of the real public profile (apps/web) — shown on all dashboard pages */
export function ProfilePreviewAside() {
  const state = useContext(ProfilePreviewStateContext);
  const refreshNonce = useContext(ProfilePreviewRefreshNonceContext);
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  const profile = state?.profile ?? null;

  const profileSignature = profile
    ? [
        profile.username,
        profile.name,
        profile.bio,
        profile.avatar,
        profile.coverImage,
        profile.themeKey,
      ].join('|')
    : '';

  /**
   * Iframe reloads on profile identity/fields, manual refresh, or post-save refresh.
   * Never remounts during drag — reorder calls refreshPreview only after API save.
   */
  useEffect(() => {
    if (!profile?.username) {
      setEmbedUrl(null);
      return;
    }
    setLoaded(false);
    setFailed(false);
    setEmbedUrl(buildEmbedUrl(profile.username, reloadKey));
  }, [profile?.username, profileSignature, reloadKey]);

  useEffect(() => {
    if (refreshNonce === 0) return;
    setLoaded(false);
    setFailed(false);
    setReloadKey((k) => k + 1);
  }, [refreshNonce]);

  useEffect(() => {
    if (!embedUrl || loaded) return;
    const t = window.setTimeout(() => {
      if (!loaded) setFailed(true);
    }, 8000);
    return () => window.clearTimeout(t);
  }, [embedUrl, loaded, reloadKey]);

  if (!profile?.username) {
    return (
      <aside className={PREVIEW_ASIDE_CLASS}>
        <div
          className="flex items-center justify-center bg-[var(--surface-secondary)]/60 ring-1 ring-[var(--border)]"
          style={{
            width: PHONE_WIDTH_PX,
            borderRadius: PHONE_RADIUS,
            height: 'min(640px, calc(100dvh - 7rem))',
          }}
        >
          <p className="px-6 text-center text-xs text-[var(--muted-foreground)]">
            جاري تحميل المعاينة…
          </p>
        </div>
      </aside>
    );
  }

  const publicUrl = buildPublicUrl(profile.username);
  const phoneHeight = 'min(640px, calc(100dvh - 7rem))';

  return (
    <aside className={PREVIEW_ASIDE_CLASS}>
      <div
        className="flex shrink-0 flex-col"
        style={{ width: PHONE_WIDTH_PX, gap: COLUMN_GAP_PX }}
      >
        <div
          className="flex w-full shrink-0 items-center justify-between"
          style={{ height: HEADER_HEIGHT_PX }}
        >
          <p className="text-sm font-semibold text-[var(--foreground)]">معاينة مباشرة</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLoaded(false);
                setFailed(false);
                setReloadKey((k) => k + 1);
              }}
              className="inline-flex size-7 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
              title="تحديث المعاينة"
            >
              <RefreshCw className="size-3.5" />
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
            >
              فتح
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>

        <div
          className="relative w-full shrink-0 overflow-hidden bg-white ring-1 ring-[var(--border)] dark:bg-[var(--surface)]"
          style={{ borderRadius: PHONE_RADIUS, height: phoneHeight }}
        >
          {!loaded && !failed ? (
            <div className="absolute inset-0 z-10 animate-pulse bg-[var(--surface-secondary)]" />
          ) : null}

          {failed ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[var(--surface)] px-4 text-center">
              <p className="text-sm font-medium text-[var(--foreground)]">تعذّر تحميل المعاينة</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                تأكد أن apps/web يعمل على المنفذ {PUBLIC_SITE_DEV_PORT}
              </p>
              <button
                type="button"
                onClick={() => {
                  setFailed(false);
                  setLoaded(false);
                  setReloadKey((k) => k + 1);
                }}
                className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : null}

          {embedUrl ? (
            <iframe
              key={embedUrl}
              title={`معاينة ${profile.username}`}
              src={embedUrl}
              className="size-full border-0 bg-white"
              style={{ borderRadius: PHONE_RADIUS }}
              onLoad={() => {
                setLoaded(true);
                setFailed(false);
              }}
              onError={() => setFailed(true)}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : null}
        </div>
      </div>
    </aside>
  );
}
