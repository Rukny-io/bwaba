import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  MapPin,
  Calendar,
  Users,
  Link2,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Github,
  Globe,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';

const API_SERVER_URL =
  process.env.API_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_EXTERNAL_URL ||
  'http://localhost:3001';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  title?: string | null;
  status?: string;
  isPinned?: boolean;
  displayOrder: number;
  thumbnail?: string | null;
}

interface PublicProfile {
  id: string;
  username: string;
  name?: string | null;
  bio?: string | null;
  avatar?: string | null;
  coverImage?: string | null;
  location?: string | null;
  visibility: string;
  createdAt: string;
  socialLinks: SocialLink[];
  _count?: { followers: number; following: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  github: Github,
  website: Globe,
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle,
  tiktok: Link2,
  custom: Link2,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  x: '#000000',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  github: '#181717',
  whatsapp: '#25D366',
  tiktok: '#000000',
  website: '#6366F1',
  email: '#0EA5E9',
  phone: '#10B981',
  custom: '#8B5CF6',
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  twitter: 'Twitter',
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  github: 'GitHub',
  website: 'موقع الويب',
  email: 'البريد الإلكتروني',
  phone: 'الهاتف',
  whatsapp: 'واتساب',
  tiktok: 'TikTok',
  custom: 'رابط',
};

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

function getLinkHref(platform: string, url: string) {
  if (platform === 'email' && !url.startsWith('mailto:')) return `mailto:${url}`;
  if (platform === 'phone' && !url.startsWith('tel:')) return `tel:${url}`;
  if (platform === 'whatsapp' && !url.startsWith('http')) return `https://wa.me/${url.replace(/\D/g, '')}`;
  return url;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchProfile(username: string): Promise<PublicProfile | null> {
  try {
    const res = await fetch(
      `${API_SERVER_URL}/api/v1/profiles/${encodeURIComponent(username)}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await fetchProfile(username);

  if (!profile || profile.visibility === 'PRIVATE') notFound();

  const activeLinks = profile.socialLinks
    .filter((l) => l.status !== 'INACTIVE')
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.displayOrder - b.displayOrder;
    });

  const displayName = profile.name || `@${profile.username}`;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950" dir="rtl">
      {/* Cover */}
      <div className="relative h-48 md:h-64 w-full bg-gradient-to-br from-neutral-800 to-neutral-900 overflow-hidden">
        {profile.coverImage && (
          <Image
            src={profile.coverImage}
            alt="غلاف الملف الشخصي"
            fill
            className="object-cover"
            priority
          />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Main Card */}
      <div className="max-w-xl mx-auto px-4 pb-12">
        {/* Avatar + Header */}
        <div className="relative -mt-16 mb-6 flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-full ring-4 ring-white dark:ring-neutral-900 overflow-hidden bg-neutral-200 dark:bg-neutral-800 shadow-lg flex-shrink-0">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={displayName}
                width={112}
                height={112}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-neutral-500">
                {getInitials(displayName)}
              </div>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white leading-tight">
            {displayName}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">@{profile.username}</p>

          {profile.bio && (
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-sm whitespace-pre-line">
              {profile.bio}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {profile.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              انضم {formatDate(profile.createdAt)}
            </span>
          </div>

          {/* Stats */}
          {profile._count && (
            <div className="mt-4 flex gap-6">
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-neutral-900 dark:text-white">
                  {formatCount(profile._count.followers)}
                </span>
                <span className="text-xs text-neutral-500 flex items-center gap-1">
                  <Users className="size-3" />
                  متابع
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-neutral-900 dark:text-white">
                  {formatCount(profile._count.following)}
                </span>
                <span className="text-xs text-neutral-500">يتابع</span>
              </div>
            </div>
          )}
        </div>

        {/* Social Links */}
        {activeLinks.length > 0 && (
          <div className="flex flex-col gap-3">
            {activeLinks.map((link) => {
              const Icon = PLATFORM_ICONS[link.platform] ?? Link2;
              const color = PLATFORM_COLORS[link.platform] ?? '#8B5CF6';
              const label =
                link.title ||
                PLATFORM_LABELS[link.platform] ||
                link.platform;
              const href = getLinkHref(link.platform, link.url);

              return (
                <a
                  key={link.id}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Icon bubble */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: color + '18', color }}
                  >
                    <Icon className="size-5" />
                  </div>

                  {/* Thumbnail if available */}
                  {link.thumbnail && (
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-100">
                      <Image
                        src={link.thumbnail}
                        alt={label}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}

                  <span className="flex-1 font-medium text-sm text-neutral-800 dark:text-neutral-100 truncate">
                    {label}
                  </span>

                  <ExternalLink className="size-4 text-neutral-300 group-hover:text-neutral-500 transition-colors flex-shrink-0" />
                </a>
              );
            })}
          </div>
        )}

        {activeLinks.length === 0 && (
          <div className="text-center py-12 text-neutral-400 dark:text-neutral-600">
            <Link2 className="size-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">لا توجد روابط بعد</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            مدعوم من
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Rukny</span>
          </a>
        </div>
      </div>
    </div>
  );
}
