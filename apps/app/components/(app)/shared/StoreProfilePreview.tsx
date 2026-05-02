'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  MapPin,
  Calendar,
  Link2,
  RefreshCw,
  ExternalLink,
  Smartphone,
  Loader2,
} from 'lucide-react';
import { getMyProfile, type UserProfile, type SocialLink } from '@/lib/api/profile';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  twitter: '#1DA1F2',
  x: '#000000',
  youtube: '#FF0000',
  linkedin: '#0077B5',
  github: '#333333',
  tiktok: '#010101',
  snapchat: '#FFFC00',
  facebook: '#1877F2',
  whatsapp: '#25D366',
  telegram: '#2CA5E0',
};

function PlatformDot({ platform }: { platform: string }) {
  const color = PLATFORM_COLORS[platform.toLowerCase()] ?? '#888';
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  LinkItem                                                           */
/* ------------------------------------------------------------------ */

function LinkItem({ link }: { link: SocialLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors text-start"
    >
      <PlatformDot platform={link.platform} />
      <span className="flex-1 text-[11px] font-medium text-neutral-700 truncate">
        {link.title || link.platform}
      </span>
      <Link2 className="size-3 text-neutral-400 flex-shrink-0" />
    </a>
  );
}

/* ------------------------------------------------------------------ */
/*  StoreProfilePreview                                                */
/* ------------------------------------------------------------------ */

export function StoreProfilePreview() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getMyProfile();
      setProfile(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 bg-white">
        <Loader2 className="size-6 animate-spin text-neutral-300" />
        <p className="text-[10px] text-neutral-400">جاري التحميل...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 bg-white px-6">
        <Smartphone className="size-7 text-neutral-300" />
        <p className="text-[10px] text-neutral-400 text-center leading-relaxed">
          {error ? 'تعذّر تحميل الملف الشخصي' : 'لا يوجد ملف شخصي بعد'}
        </p>
        {error && (
          <button
            onClick={fetchProfile}
            className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <RefreshCw className="size-3" />
            إعادة المحاولة
          </button>
        )}
      </div>
    );
  }

  const displayName = profile.name || profile.user?.name || profile.username;
  const visibleLinks = profile.socialLinks
    ?.filter((l) => l.status !== 'hidden')
    ?.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)) ?? [];
  const pinnedLinks = visibleLinks.filter((l) => l.isPinned);
  const otherLinks = visibleLinks.filter((l) => !l.isPinned);
  const sortedLinks = [...pinnedLinks, ...otherLinks];

  return (
    <div className="h-full overflow-y-auto bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Cover */}
      {profile.coverImage ? (
        <div className="relative h-20 w-full overflow-hidden">
          <Image src={profile.coverImage} alt="غلاف" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      ) : (
        <div className="h-16 w-full bg-gradient-to-br from-neutral-100 to-neutral-200" />
      )}

      {/* Avatar + Info */}
      <div className={`px-4 pb-4 ${profile.coverImage ? '-mt-8' : '-mt-7'}`}>
        <div className="flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-full ring-2 ring-white overflow-hidden bg-neutral-200 flex-shrink-0">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={displayName ?? ''}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 text-white text-sm font-bold">
                {displayName ? getInitials(displayName) : 'R'}
              </div>
            )}
          </div>

          <h1 className="mt-2 text-sm font-bold text-neutral-900">{displayName}</h1>
          <p className="text-[10px] text-neutral-500">@{profile.username}</p>

          {profile.bio && (
            <p className="mt-1.5 text-[10px] text-neutral-600 line-clamp-2 px-2 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mt-1.5 text-[9px] text-neutral-400">
            {profile.location && (
              <span className="flex items-center gap-0.5">
                <MapPin className="size-2.5" />
                {profile.location}
              </span>
            )}
            <span className="flex items-center gap-0.5">
              <Calendar className="size-2.5" />
              {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mt-3 py-2 border-y border-neutral-100">
          <div className="text-center">
            <p className="text-sm font-bold text-neutral-900">{formatNumber(profile._count?.followers ?? 0)}</p>
            <p className="text-[8px] text-neutral-500">متابع</p>
          </div>
          <div className="h-5 w-px bg-neutral-200" />
          <div className="text-center">
            <p className="text-sm font-bold text-neutral-900">{formatNumber(profile._count?.following ?? 0)}</p>
            <p className="text-[8px] text-neutral-500">يتابع</p>
          </div>
        </div>

        {/* Links */}
        {sortedLinks.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {sortedLinks.map((link) => (
              <LinkItem key={link.id} link={link} />
            ))}
          </div>
        )}

        {sortedLinks.length === 0 && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <Link2 className="size-6 text-neutral-200" />
            <p className="text-[10px] text-neutral-400">لم تُضف روابط بعد</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 text-center">
          <p className="text-[8px] text-neutral-300">
            مدعوم من <span className="font-semibold text-neutral-400">Rukny</span>
          </p>
        </div>
      </div>
    </div>
  );
}
