'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import type { MyProfile } from '@/lib/profile/types';
import { fetchMyProfile } from '@/lib/profile/api';
import { getPublicProfileUrl } from '@/lib/profile/public-url';
import { PUBLIC_SITE_URL } from '@/lib/forms/config';
import type { SocialLink } from '@/lib/links/types';

export interface ProfilePreviewState {
  profile: MyProfile | null;
  links: SocialLink[];
}

interface ProfilePreviewContextValue {
  state: ProfilePreviewState;
  setPreview: (state: ProfilePreviewState) => void;
}

const ProfilePreviewContext = createContext<ProfilePreviewContextValue | null>(null);

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
      link.isPinned === other.isPinned &&
      link.layout === other.layout
    );
  });
}

export function ProfilePreviewProvider({ children }: { children: ReactNode }) {
  const [state, setPreviewState] = useState<ProfilePreviewState>({ profile: null, links: [] });

  const setPreview = useCallback((next: ProfilePreviewState) => {
    setPreviewState((prev) => (isSamePreview(prev, next) ? prev : next));
  }, []);

  /** Load profile once so preview works on every dashboard page */
  useEffect(() => {
    let cancelled = false;
    fetchMyProfile().then((profile) => {
      if (cancelled || !profile) return;
      setPreviewState((prev) => {
        if (prev.profile?.username) return prev;
        return { ...prev, profile };
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ state, setPreview }), [state, setPreview]);

  return (
    <ProfilePreviewContext.Provider value={value}>{children}</ProfilePreviewContext.Provider>
  );
}

export function useProfilePreviewSync(profile: MyProfile | null, links: SocialLink[]) {
  const setPreview = useContext(ProfilePreviewContext)?.setPreview;

  useEffect(() => {
    if (!setPreview) return;
    setPreview({ profile, links });
  }, [setPreview, profile, links]);
}

/** Fixed preview column — matches dashboard gutter rhythm */
export const PREVIEW_COLUMN_WIDTH_PX = 320;
const PHONE_WIDTH_PX = 300;
const PHONE_RADIUS = '2.25rem';
const HEADER_HEIGHT_PX = 36;
const COLUMN_GAP_PX = 12;

/**
 * Build public site origin matching how the dashboard is opened.
 * If you open http://192.168.x.x:3000, iframe must use same host:3006.
 */
function resolvePublicOrigin(): string {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:3006`;
    }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.endsWith('.local')) {
      return `${protocol}//${hostname}:3006`;
    }
  }
  return PUBLIC_SITE_URL.replace(/\/$/, '');
}

function buildEmbedUrl(username: string, reloadKey: number): string {
  const base = resolvePublicOrigin();
  return `${base}/${encodeURIComponent(username)}?embed=1&_=${reloadKey}`;
}

/** Live iframe of the real public profile — shown on all dashboard pages */
export function ProfilePreviewAside() {
  const ctx = useContext(ProfilePreviewContext);
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  const profile = ctx?.state.profile ?? null;
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
    if (!embedUrl || loaded) return;
    const t = window.setTimeout(() => {
      if (!loaded) setFailed(true);
    }, 8000);
    return () => window.clearTimeout(t);
  }, [embedUrl, loaded, reloadKey]);

  if (!profile?.username) {
    return (
      <aside className="flex h-full min-h-0 w-full items-center justify-center px-2 py-4">
        <div
          className="flex w-[300px] items-center justify-center rounded-[2.25rem] bg-[var(--surface-secondary)]/60 ring-1 ring-[var(--border)]"
          style={{ height: 'min(560px, calc(100dvh - 8rem))' }}
        >
          <p className="px-6 text-center text-xs text-[var(--muted-foreground)]">
            جاري تحميل المعاينة…
          </p>
        </div>
      </aside>
    );
  }

  const publicUrl = getPublicProfileUrl(profile.username);

  const phoneHeight = 'min(560px, calc(100dvh - 8rem))';

  return (
    <aside className="flex h-full min-h-0 w-full items-center justify-center px-2 py-4">
      <div
        className="flex w-[300px] shrink-0 flex-col"
        style={{ gap: COLUMN_GAP_PX }}
      >
        <div
          className="flex w-full shrink-0 items-center justify-between"
          style={{ height: HEADER_HEIGHT_PX }}
        >
          <p className="text-sm font-semibold text-[var(--foreground)]">معاينة مباشرة</p>
          <div className="flex items-center gap-2.5">
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
            {publicUrl ? (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
              >
                فتح
                <ExternalLink className="size-3" />
              </a>
            ) : null}
          </div>
        </div>

        <div
          className="relative w-full shrink-0 overflow-hidden bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)] ring-1 ring-black/5 dark:bg-[var(--surface)]"
          style={{ borderRadius: PHONE_RADIUS, height: phoneHeight }}
        >
        {!loaded && !failed ? (
          <div className="absolute inset-0 z-10 animate-pulse bg-[var(--surface-secondary)]" />
        ) : null}

        {failed ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[var(--surface)] px-4 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">تعذّر تحميل المعاينة</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              تأكد أن الموقع العام يعمل على المنفذ 3006
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
