'use client';

import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';
import { useState } from 'react';

export function normalizeCountryCode(code: string | undefined | null): string | null {
  const normalized = (code || '').trim().toUpperCase();
  if (normalized.length !== 2 || normalized === 'XX') return null;
  if (!/^[A-Z]{2}$/.test(normalized)) return null;
  return normalized;
}

export function getCountryFlagUrl(
  code: string,
  size: 'sm' | 'md' = 'sm',
): string {
  const normalized = normalizeCountryCode(code);
  if (!normalized) return '';
  const width = size === 'sm' ? 40 : 80;
  return `https://flagcdn.com/w${width}/${normalized.toLowerCase()}.png`;
}

export function CountryFlag({
  code,
  size = 'sm',
  className,
  title,
}: {
  code: string;
  size?: 'sm' | 'md';
  className?: string;
  title?: string;
}) {
  const normalized = normalizeCountryCode(code);
  const [failed, setFailed] = useState(false);

  if (!normalized || failed) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-sm bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
          size === 'sm' ? 'size-5' : 'size-6',
          className,
        )}
        title={title ?? code}
        aria-hidden
      >
        <Globe className={size === 'sm' ? 'size-3' : 'size-3.5'} />
      </span>
    );
  }

  return (
    <img
      src={getCountryFlagUrl(normalized, size)}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      width={size === 'sm' ? 20 : 24}
      height={size === 'sm' ? 15 : 18}
      className={cn(
        'shrink-0 rounded-sm object-cover shadow-sm ring-1 ring-black/5',
        size === 'sm' ? 'h-[15px] w-5' : 'h-[18px] w-6',
        className,
      )}
      title={title ?? normalized}
      onError={() => setFailed(true)}
    />
  );
}
