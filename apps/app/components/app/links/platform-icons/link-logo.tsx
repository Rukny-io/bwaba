'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LinkCatalogTypeId } from '@/lib/links/link-type-catalog';
import {
  getClearbitLogoUrl,
  getDomainBrandColor,
  getDomainFromUrl,
  getDomainInitial,
} from '@/lib/links/domain-brand';
import { resolveCatalogTypeFromUrl } from '@/lib/links/resolve-platform';
import { resolveMediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';
import { LinkPlatformIconBadge } from './link-platform-icon-badge';

const SHELL = {
  sm: 'size-10',
  md: 'size-11',
} as const;

interface LinkLogoProps {
  url: string;
  platformType: LinkCatalogTypeId;
  thumbnailSrc?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

function isUserUploadedThumbnail(src: string): boolean {
  const resolved = resolveMediaUrl(src) ?? src;
  return !/^https?:\/\//i.test(resolved);
}

function LogoShell({
  size,
  className,
  children,
}: {
  size: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)]',
        SHELL[size],
        className,
      )}
    >
      {children}
    </div>
  );
}

function DomainInitialLogo({
  domain,
  size,
  className,
}: {
  domain: string;
  size: 'sm' | 'md';
  className?: string;
}) {
  const initial = getDomainInitial(domain);
  const color = getDomainBrandColor(domain);

  return (
    <LogoShell size={size} className={className}>
      <div
        className="flex size-[74%] items-center justify-center rounded-[22%] text-white"
        style={{ backgroundColor: color }}
      >
        <span className={cn('font-bold leading-none', size === 'sm' ? 'text-[13px]' : 'text-[15px]')}>
          {initial}
        </span>
      </div>
    </LogoShell>
  );
}

function RemoteLogoImage({
  src,
  size,
  className,
  onError,
}: {
  src: string;
  size: 'sm' | 'md';
  className?: string;
  onError?: () => void;
}) {
  return (
    <LogoShell size={size} className={className}>
      <img
        src={src}
        alt=""
        className="size-[68%] object-contain"
        draggable={false}
        onError={onError}
      />
    </LogoShell>
  );
}

function SmartDomainLogo({
  url,
  size,
  className,
}: {
  url: string;
  size: 'sm' | 'md';
  className?: string;
}) {
  const domain = useMemo(() => getDomainFromUrl(url), [url]);
  const clearbitSrc = useMemo(() => (domain ? getClearbitLogoUrl(domain) : ''), [domain]);
  const [useInitial, setUseInitial] = useState(false);

  useEffect(() => {
    setUseInitial(false);
  }, [domain]);

  if (!domain || useInitial) {
    return <DomainInitialLogo domain={domain || url} size={size} className={className} />;
  }

  return (
    <RemoteLogoImage
      src={clearbitSrc}
      size={size}
      className={className}
      onError={() => setUseInitial(true)}
    />
  );
}

function UploadedLogo({
  src,
  url,
  size,
  className,
}: {
  src: string;
  url: string;
  size: 'sm' | 'md';
  className?: string;
}) {
  const resolved = resolveMediaUrl(src) ?? src;
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <SmartDomainLogo url={url} size={size} className={className} />;
  }

  return (
    <RemoteLogoImage
      src={resolved}
      size={size}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export function LinkLogo({
  url,
  platformType,
  thumbnailSrc,
  size = 'md',
  className,
}: LinkLogoProps) {
  const resolvedType =
    platformType === 'url' ? resolveCatalogTypeFromUrl(url) : platformType;

  if (resolvedType !== 'url') {
    return <LinkPlatformIconBadge type={resolvedType} size={size} className={className} />;
  }

  if (thumbnailSrc && isUserUploadedThumbnail(thumbnailSrc)) {
    return <UploadedLogo src={thumbnailSrc} url={url} size={size} className={className} />;
  }

  return <SmartDomainLogo url={url} size={size} className={className} />;
}
